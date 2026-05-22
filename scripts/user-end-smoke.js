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

async function login(email, password) {
  const { response, data } = await jsonFetch("/api/login", { method: "POST", body: JSON.stringify({ email, password }) });
  assert(response.ok, `login ${email}`, data?.error);
  return cookieFrom(response);
}

async function cleanup() {
  const users = await prisma.user.findMany({ where: { email: { endsWith: "@v15.test" } }, select: { id: true } });
  const userIds = users.map((user) => user.id);
  const events = await prisma.event.findMany({ where: { title: { startsWith: "[V15]" } }, select: { id: true } });
  const eventIds = events.map((event) => event.id);
  const sessions = await prisma.eventSession.findMany({ where: { eventId: { in: eventIds } }, select: { id: true } });
  const sessionIds = sessions.map((session) => session.id);

  if (sessionIds.length) await prisma.topicFeedback.deleteMany({ where: { eventSessionId: { in: sessionIds } } });
  if (eventIds.length) {
    await prisma.eventReflection.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.eventSession.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.feedback.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.eventAttendance.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.eventParticipant.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
  }
  if (userIds.length) {
    await prisma.creditLedger.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.rewardTransaction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.wejanganReflection.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.eventReflection.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.topicFeedback.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.eventAttendance.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.eventParticipant.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userSystemRole.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
  await prisma.dailyWejangan.deleteMany({ where: { id: "v15_wejangan" } });
  await prisma.reward.deleteMany({ where: { id: { in: ["v15_reward_cheap", "v15_reward_expensive"] } } });
}

async function createUser(id, email, creditBalance = 0) {
  return prisma.user.create({
    data: {
      id,
      fullName: id,
      email,
      passwordHash: await bcrypt.hash("Password123", 10),
      homeBranchId: "sunter",
      status: "ACTIVE",
      creditBalance,
      systemRoles: { create: [{ role: "MEMBER" }] },
    },
  });
}

async function main() {
  await cleanup();
  const adminCookie = await login("admin@fahuicu.org", "FaHuiCu");
  const member = await createUser("v15_member", "member@v15.test", 0);
  const memberCookie = await login("member@v15.test", "Password123");

  const unauthReward = await jsonFetch("/api/admin/rewards");
  assert(unauthReward.response.status === 401, "unauthenticated admin API returns 401");

  const memberAdmin = await jsonFetch("/api/admin/rewards", { headers: { Cookie: memberCookie } });
  assert(memberAdmin.response.status === 403, "regular member cannot access admin reward API");

  const workspaceHack = await jsonFetch("/api/settings/workspace", {
    method: "POST",
    headers: { Cookie: memberCookie },
    body: JSON.stringify({ workspace: "ADMIN" }),
  });
  assert(workspaceHack.response.status === 403, "workspace switch cannot grant admin");

  await prisma.dailyWejangan.create({
    data: {
      id: "v15_wejangan",
      title: "V15 Wejangan",
      source: "Smoke",
      uploadDate: new Date(),
      content: "Credit audit",
      reflectionQuestion: "Apa refleksi?",
      creditReward: 10,
      createdByAdminId: "admin_fahuicu",
    },
  });

  const reflect1 = await jsonFetch("/api/wejangan/v15_wejangan/reflection", {
    method: "POST",
    headers: { Cookie: memberCookie },
    body: JSON.stringify({ answer: "Refleksi pertama" }),
  });
  assert(reflect1.response.ok && reflect1.data.creditAwarded === 10, "wejangan reflection gives exactly 10 credit");

  const reflect2 = await jsonFetch("/api/wejangan/v15_wejangan/reflection", {
    method: "POST",
    headers: { Cookie: memberCookie },
    body: JSON.stringify({ answer: "Refleksi edit" }),
  });
  assert(reflect2.response.ok && reflect2.data.creditAwarded === 0, "wejangan reflection does not double reward");

  let account = await prisma.user.findUniqueOrThrow({ where: { id: member.id } });
  const earnedLedgers = await prisma.creditLedger.findMany({ where: { userId: member.id, source: "WEJANGAN_REFLECTION" } });
  assert(account.creditBalance === 10 && earnedLedgers.length === 1, "wejangan ledger recorded once");

  await prisma.reward.createMany({
    data: [
      { id: "v15_reward_cheap", name: "V15 Cheap", creditPrice: 5, isActive: true },
      { id: "v15_reward_expensive", name: "V15 Expensive", creditPrice: 999, isActive: true },
    ],
  });

  const redeem1 = await jsonFetch("/api/store/v15_reward_cheap/redeem", { method: "POST", headers: { Cookie: memberCookie } });
  assert(redeem1.response.ok && redeem1.data.transaction.creditCost === 5, "store redeem deducts credit once");

  account = await prisma.user.findUniqueOrThrow({ where: { id: member.id } });
  const spentLedgers = await prisma.creditLedger.findMany({ where: { userId: member.id, source: "STORE_REDEEM" } });
  assert(account.creditBalance === 5 && spentLedgers.length === 1, "store redeem ledger recorded once");

  const redeemDenied = await jsonFetch("/api/store/v15_reward_expensive/redeem", { method: "POST", headers: { Cookie: memberCookie } });
  assert(redeemDenied.response.status === 400, "user cannot redeem if credit insufficient");

  const event = await prisma.event.create({
    data: {
      id: "v15_event",
      hostingBranchId: "sunter",
      title: "[V15] Topic Feedback Event",
      category: "Training",
      purpose: "Topic QA",
      expectedOutcome: "Feedback linked",
      startAt: new Date(),
      status: "FEEDBACK_COLLECTION",
      qrToken: "v15_event_qr",
    },
  });
  const session = await prisma.eventSession.create({ data: { id: "v15_session", eventId: event.id, title: "V15 Topic", orderNumber: 1 } });
  await prisma.eventParticipant.create({ data: { eventId: event.id, userId: member.id, role: "ATTENDEE", registrationStatus: "APPROVED", approvedByUserId: member.id, approvedAt: new Date() } });

  const topic1 = await jsonFetch(`/api/event-sessions/${session.id}/feedback`, {
    method: "POST",
    headers: { Cookie: memberCookie },
    body: JSON.stringify({ speakerClarityRating: 4, materialUsefulnessRating: 4, topicRelevanceRating: 4, learnedText: "v1", benefitText: "b1", improvementText: "i1" }),
  });
  const topic2 = await jsonFetch(`/api/event-sessions/${session.id}/feedback`, {
    method: "POST",
    headers: { Cookie: memberCookie },
    body: JSON.stringify({ speakerClarityRating: 5, materialUsefulnessRating: 5, topicRelevanceRating: 5, learnedText: "v2", benefitText: "b2", improvementText: "i2" }),
  });
  assert(topic1.response.ok && topic2.response.ok && topic2.data.feedback.learnedText === "v2", "topic feedback editable and linked to user");

  const eventReflection1 = await jsonFetch("/api/event-reflections", {
    method: "POST",
    headers: { Cookie: memberCookie },
    body: JSON.stringify({ eventId: event.id, overallImpression: "ok", mainLearning: "learn", suggestion: "s1" }),
  });
  const eventReflection2 = await jsonFetch("/api/event-reflections", {
    method: "POST",
    headers: { Cookie: memberCookie },
    body: JSON.stringify({ eventId: event.id, overallImpression: "great", mainLearning: "learn2", suggestion: "s2" }),
  });
  assert(eventReflection1.response.ok && eventReflection2.response.ok && eventReflection2.data.reflection.mainLearning === "learn2", "event reflection editable and linked to user");

  const memberCreateReward = await jsonFetch("/api/admin/rewards", {
    method: "POST",
    headers: { Cookie: memberCookie },
    body: JSON.stringify({ name: "Nope", creditPrice: 1 }),
  });
  assert(memberCreateReward.response.status === 403, "member cannot create reward");

  const adminCreateModule = await jsonFetch("/api/admin/learning-modules", {
    method: "POST",
    headers: { Cookie: adminCookie },
    body: JSON.stringify({ title: "V15 Admin Module", description: "ok", orderNumber: 99 }),
  });
  assert(adminCreateModule.response.ok, "admin can create learning module");

  const memberCreateSession = await jsonFetch(`/api/events/${event.id}/sessions`, {
    method: "POST",
    headers: { Cookie: memberCookie },
    body: JSON.stringify({ title: "Forbidden session", orderNumber: 2 }),
  });
  assert(memberCreateSession.response.status === 403, "member cannot create event session");
}

main()
  .then(async () => {
    for (const result of results) console.log(`${result.ok ? "PASS" : "FAIL"} - ${result.label}${result.detail ? ` (${result.detail})` : ""}`);
    await cleanup();
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    for (const result of results) console.log(`${result.ok ? "PASS" : "FAIL"} - ${result.label}${result.detail ? ` (${result.detail})` : ""}`);
    console.error(`ERROR - ${error.message}`);
    await cleanup().catch(() => {});
    await prisma.$disconnect();
    process.exit(1);
  });
