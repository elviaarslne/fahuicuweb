require("dotenv/config");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL || "") });
const results = [];

function assert(condition, label, detail = "") {
  results.push({ ok: Boolean(condition), label, detail });
  if (!condition) throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
}

function cookieFrom(response) {
  return (response.headers.get("set-cookie") || "").split(";")[0];
}

async function jsonFetch(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { response, data };
}

async function login(email, password = "Password123") {
  const { response, data } = await jsonFetch("/api/login", { method: "POST", body: JSON.stringify({ email, password }) });
  assert(response.ok, `login ${email}`, data?.error || data?.raw);
  return cookieFrom(response);
}

async function loginAttempt(email, password = "Password123") {
  return jsonFetch("/api/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

async function cleanup() {
  const users = await prisma.user.findMany({ where: { email: { endsWith: "@activity.test" } }, select: { id: true } });
  const userIds = users.map((user) => user.id);
  const posts = await prisma.activityPost.findMany({ where: { OR: [{ caption: { contains: "[ACTIVITY_SMOKE]" } }, { userId: { in: userIds } }] }, select: { id: true } });
  const postIds = posts.map((post) => post.id);
  if (postIds.length) {
    await prisma.activityReaction.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.activityPostView.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.activityLike.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.activityComment.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.activityMedia.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.activityPost.deleteMany({ where: { id: { in: postIds } } });
  }
  if (userIds.length) {
    await prisma.activityReaction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.activityPostView.deleteMany({ where: { viewerId: { in: userIds } } });
    await prisma.activityLike.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.activityComment.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userSystemRole.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

async function createUser(id, email, homeBranchId, status = "ACTIVE", roles = ["MEMBER"]) {
  return prisma.user.create({
    data: {
      id,
      fullName: id,
      email,
      passwordHash: await bcrypt.hash("Password123", 10),
      homeBranchId,
      status,
      systemRoles: { create: roles.map((role) => ({ role })) },
    },
  });
}

async function main() {
  await cleanup();
  await createUser("activity_member_one", "one@activity.test", "sunter");
  await createUser("activity_member_two", "two@activity.test", "grogol");
  await createUser("activity_pending", "pending@activity.test", "sunter", "PENDING");

  const adminCookie = await login("admin@fahuicu.org", "FaHuiCu");
  const oneCookie = await login("one@activity.test");
  const twoCookie = await login("two@activity.test");
  const pendingLogin = await loginAttempt("pending@activity.test");
  assert(!pendingLogin.response.ok, "pending user cannot enter authenticated Activity flow");

  const usernameOne = await jsonFetch("/api/settings/activity-profile", {
    method: "PATCH",
    headers: { Cookie: oneCookie },
    body: JSON.stringify({ username: "Smoke.User", bio: "Internal documentation profile" }),
  });
  assert(usernameOne.response.ok && usernameOne.data.user.username === "smoke.user", "username normalized and saved", JSON.stringify(usernameOne.data));

  const usernameTaken = await jsonFetch("/api/settings/activity-profile", {
    method: "PATCH",
    headers: { Cookie: twoCookie },
    body: JSON.stringify({ username: "smoke.user" }),
  });
  assert(usernameTaken.response.status === 409, "username uniqueness enforced");

  const created = await jsonFetch("/api/activity/posts", {
    method: "POST",
    headers: { Cookie: oneCookie },
    body: JSON.stringify({
      caption: "[ACTIVITY_SMOKE] carousel documentation",
      type: "DOCUMENTATION",
      media: [
        { mediaUrl: "https://example.com/photo-one.jpg", mediaType: "IMAGE", orderNumber: 0 },
        { mediaUrl: "https://example.com/video-one.mp4", mediaType: "VIDEO", orderNumber: 1 },
      ],
    }),
  });
  assert(created.response.ok && created.data.post.media.length === 2, "active user can create post with multiple media");
  const postId = created.data.post.id;

  const feedAcrossBranch = await jsonFetch("/api/activity/posts", { headers: { Cookie: twoCookie } });
  assert(feedAcrossBranch.response.ok && feedAcrossBranch.data.posts.some((post) => post.id === postId), "active user can view cross-branch feed");

  const momentCreated = await jsonFetch("/api/activity/posts", {
    method: "POST",
    headers: { Cookie: oneCookie },
    body: JSON.stringify({
      caption: null,
      type: "OTHER",
      media: [{ mediaUrl: "https://example.com/moment-one.jpg", mediaType: "IMAGE", orderNumber: 0 }],
    }),
  });
  assert(momentCreated.response.ok && momentCreated.data.post.media.length === 1, "active user can upload Moment without caption", JSON.stringify(momentCreated.data));
  const momentId = momentCreated.data.post.id;

  const unseenMomentFeed = await jsonFetch("/api/activity/posts", { headers: { Cookie: twoCookie } });
  const unseenMoment = unseenMomentFeed.data.posts.find((post) => post.id === momentId);
  assert(unseenMomentFeed.response.ok && unseenMoment && unseenMoment.media.length === 1 && unseenMoment.seenByMe === false, "unseen Moment image is visible before first view");

  const viewMoment = await jsonFetch(`/api/activity/posts/${momentId}/view`, { method: "POST", headers: { Cookie: twoCookie } });
  assert(viewMoment.response.ok && viewMoment.data.viewed === true, "viewing a Moment records view-once state", JSON.stringify(viewMoment.data));

  const seenMomentFeed = await jsonFetch("/api/activity/posts", { headers: { Cookie: twoCookie } });
  const seenMoment = seenMomentFeed.data.posts.find((post) => post.id === momentId);
  assert(seenMomentFeed.response.ok && seenMoment && seenMoment.seenByMe === true && seenMoment.media.length === 0, "same viewer cannot see Moment image twice");

  const ownerMomentFeed = await jsonFetch("/api/activity/posts", { headers: { Cookie: oneCookie } });
  const ownerMoment = ownerMomentFeed.data.posts.find((post) => post.id === momentId);
  assert(ownerMomentFeed.response.ok && ownerMoment && ownerMoment.isOwnMoment === true && ownerMoment.media.length === 1, "owner can still view own Moment in My Moments");

  const reactionOne = await jsonFetch(`/api/activity/posts/${momentId}/reaction`, {
    method: "POST",
    headers: { Cookie: twoCookie },
    body: JSON.stringify({ emoji: "🙏" }),
  });
  assert(reactionOne.response.ok && reactionOne.data.myReaction === "🙏", "user can react to Moment with emoji", JSON.stringify(reactionOne.data));

  const reactionTwo = await jsonFetch(`/api/activity/posts/${momentId}/reaction`, {
    method: "POST",
    headers: { Cookie: twoCookie },
    body: JSON.stringify({ emoji: "✨" }),
  });
  assert(reactionTwo.response.ok && reactionTwo.data.myReaction === "✨", "user can update Moment emoji reaction", JSON.stringify(reactionTwo.data));

  const like1 = await jsonFetch(`/api/activity/posts/${postId}/like`, { method: "POST", headers: { Cookie: twoCookie } });
  const like2 = await jsonFetch(`/api/activity/posts/${postId}/like`, { method: "POST", headers: { Cookie: twoCookie } });
  assert(like1.response.ok && like1.data.liked === true && like1.data.likeCount === 1, "like creates one like", JSON.stringify(like1.data));
  assert(like2.response.ok && like2.data.liked === false && like2.data.likeCount === 0, "second like toggles unlike", JSON.stringify(like2.data));

  const comment = await jsonFetch(`/api/activity/posts/${postId}/comments`, {
    method: "POST",
    headers: { Cookie: twoCookie },
    body: JSON.stringify({ content: "Bagus untuk dokumentasi internal." }),
  });
  assert(comment.response.ok && comment.data.comment.content.includes("Bagus"), "active user can comment");

  const hide = await jsonFetch(`/api/admin/activity/${postId}`, {
    method: "PATCH",
    headers: { Cookie: adminCookie },
    body: JSON.stringify({ isHiddenByAdmin: true }),
  });
  assert(hide.response.ok && hide.data.post.isHiddenByAdmin === true, "admin can hide post");

  const hiddenFeed = await jsonFetch("/api/activity/posts", { headers: { Cookie: twoCookie } });
  assert(hiddenFeed.response.ok && !hiddenFeed.data.posts.some((post) => post.id === postId), "hidden post not visible to regular user");

  await cleanup();
  console.log("Activity smoke passed:");
  for (const result of results) console.log(`- ${result.label}`);
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
