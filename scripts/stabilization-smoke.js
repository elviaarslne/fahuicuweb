require("dotenv/config");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL || ""),
});

const results = [];

function assert(condition, label, detail = "") {
  results.push({ ok: Boolean(condition), label, detail });
  if (!condition) throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
}

function cookieFrom(response) {
  const raw = response.headers.get("set-cookie") || "";
  return raw.split(";")[0];
}

async function jsonFetch(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { response, data };
}

async function login(email, password) {
  const { response, data } = await jsonFetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert(response.ok, `login ${email}`, data?.error);
  return cookieFrom(response);
}

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: "@stabilization.test" } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);
  const events = await prisma.event.findMany({
    where: { title: { startsWith: "[SMOKE]" } },
    select: { id: true },
  });
  const eventIds = events.map((event) => event.id);

  if (eventIds.length) {
    await prisma.feedback.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.eventAttendance.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.eventParticipant.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
  }

  if (userIds.length) {
    await prisma.feedback.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.eventAttendance.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.eventParticipant.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userSystemRole.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

async function createActiveUser({ id, email, fullName, homeBranchId, roles = ["MEMBER"] }) {
  const user = await prisma.user.create({
    data: {
      id,
      homeBranch: { connect: { id: homeBranchId } },
      fullName,
      email,
      passwordHash: await bcrypt.hash("Password123", 10),
      status: "ACTIVE",
      systemRoles: { create: roles.map((role) => ({ role })) },
    },
  });
  return user;
}

async function createEvent({ id, title, hostingBranchId, status = "REGISTRATION_OPEN" }) {
  return prisma.event.create({
    data: {
      id,
      hostingBranchId,
      title,
      category: "Training",
      purpose: "Smoke test purpose",
      expectedOutcome: "Smoke test expected outcome",
      startAt: new Date("2026-06-01T02:00:00.000Z"),
      endAt: new Date("2026-06-01T04:00:00.000Z"),
      status,
      qrToken: `smoke_${id}`,
    },
  });
}

function feedbackPayload(eventId, marker) {
  return {
    eventId,
    materialPurposeRating: 4,
    deliveryClarityRating: 4,
    timeEffectivenessRating: 4,
    flowClarityRating: 4,
    perspectiveChangeRating: 5,
    joinAgainRating: 5,
    understandingRating: 4,
    registrationEaseRating: 4,
    coordinationClarityRating: 4,
    locationComfortRating: 4,
    insightText: `Insight ${marker}`,
    learnedText: `Learned ${marker}`,
    improvementText: `Improve ${marker}`,
  };
}

async function main() {
  await cleanup();

  const adminCookie = await login("admin@fahuicu.org", "FaHuiCu");

  const qiuDaoBlob = new Blob(["smoke qiu dao proof"], { type: "image/png" });
  const form = new FormData();
  form.set("homeBranchId", "sunter");
  form.set("fullName", "Smoke Pending Member");
  form.set("chineseName", "");
  form.set("email", "pending.member@stabilization.test");
  form.set("phone", "");
  form.set("password", "Password123");
  form.set("confirmPassword", "Password123");
  form.set("qiuDaoCard", qiuDaoBlob, "qiu-dao.png");

  const registerResponse = await fetch(`${baseUrl}/api/register`, { method: "POST", body: form });
  const registerData = await registerResponse.json();
  assert(registerResponse.ok && registerData.user.status === "PENDING", "new member register -> pending approval");

  const approve = await jsonFetch("/api/admin/users", {
    method: "PATCH",
    headers: { Cookie: adminCookie },
    body: JSON.stringify({
      userId: registerData.user.id,
      status: "ACTIVE",
      homeBranchId: "sunter",
      currentClassId: "kelas_1",
      memberCategory: "BAN_SHI_JEN_YUAN",
    }),
  });
  assert(approve.response.ok && approve.data.user.status === "ACTIVE", "admin approval + assign branch/class");

  const pendingCookie = await login("pending.member@stabilization.test", "Password123");
  const userDashboard = await jsonFetch("/user", { headers: { Cookie: pendingCookie } });
  assert(userDashboard.response.ok, "approved member can open user dashboard");

  await createActiveUser({
    id: "smoke_grogol_member",
    email: "grogol.member@stabilization.test",
    fullName: "Smoke Grogol Member",
    homeBranchId: "grogol",
  });
  await createActiveUser({
    id: "smoke_trainer",
    email: "trainer@stabilization.test",
    fullName: "Smoke Trainer",
    homeBranchId: "sunter",
    roles: ["MEMBER", "TRAINER"],
  });

  const sunterEvent = await createEvent({ id: "smoke_sunter_event", title: "[SMOKE] Same Branch Event", hostingBranchId: "sunter" });
  const crossEvent = await createEvent({ id: "smoke_cross_event", title: "[SMOKE] Cross Branch Event", hostingBranchId: "sunter" });
  const feedbackEvent = await createEvent({ id: "smoke_feedback_event", title: "[SMOKE] Feedback Event", hostingBranchId: "sunter", status: "FEEDBACK_COLLECTION" });
  const otherFeedbackEvent = await createEvent({ id: "smoke_other_feedback_event", title: "[SMOKE] Other Feedback Event", hostingBranchId: "grogol", status: "FEEDBACK_COLLECTION" });

  const sameReg = await jsonFetch(`/api/events/${sunterEvent.id}/register`, {
    method: "POST",
    headers: { Cookie: pendingCookie },
  });
  assert(sameReg.response.ok && sameReg.data.registrationStatus === "APPROVED", "same-branch registration auto APPROVED");

  const sameCheckIn = await jsonFetch("/api/attendance/check-in", {
    method: "POST",
    headers: { Cookie: pendingCookie },
    body: JSON.stringify({ qrToken: sunterEvent.qrToken }),
  });
  assert(sameCheckIn.response.ok && sameCheckIn.data.attendance.status === "PRESENT", "same-branch QR check-in allowed");

  const duplicateCheckIn = await jsonFetch("/api/attendance/check-in", {
    method: "POST",
    headers: { Cookie: pendingCookie },
    body: JSON.stringify({ qrToken: sunterEvent.qrToken }),
  });
  assert(duplicateCheckIn.response.ok && duplicateCheckIn.data.alreadyCheckedIn === true, "QR duplicate check-in prevented");

  await prisma.eventParticipant.create({
    data: {
      eventId: feedbackEvent.id,
      userId: registerData.user.id,
      role: "ATTENDEE",
      registrationStatus: "APPROVED",
      approvedByUserId: registerData.user.id,
      approvedAt: new Date(),
    },
  });

  const feedback1 = await jsonFetch("/api/feedback", {
    method: "POST",
    headers: { Cookie: pendingCookie },
    body: JSON.stringify(feedbackPayload(feedbackEvent.id, "v1")),
  });
  assert(feedback1.response.ok && feedback1.data.feedback.insightText === "Insight v1", "submit feedback");

  const feedback2 = await jsonFetch("/api/feedback", {
    method: "POST",
    headers: { Cookie: pendingCookie },
    body: JSON.stringify(feedbackPayload(feedbackEvent.id, "v2")),
  });
  assert(feedback2.response.ok && feedback2.data.feedback.insightText === "Insight v2", "edit own feedback via upsert");

  const grogolCookie = await login("grogol.member@stabilization.test", "Password123");
  const crossReg = await jsonFetch(`/api/events/${crossEvent.id}/register`, {
    method: "POST",
    headers: { Cookie: grogolCookie },
  });
  assert(crossReg.response.ok && crossReg.data.registrationStatus === "PENDING_APPROVAL", "cross-branch registration PENDING_APPROVAL");

  const crossCheckInDenied = await jsonFetch("/api/attendance/check-in", {
    method: "POST",
    headers: { Cookie: grogolCookie },
    body: JSON.stringify({ qrToken: crossEvent.qrToken }),
  });
  assert(crossCheckInDenied.response.status === 403, "cross-branch QR denied before approval");

  const approval = await jsonFetch(`/api/event-participants/${crossReg.data.participant.id}/approval`, {
    method: "PATCH",
    headers: { Cookie: adminCookie },
    body: JSON.stringify({ registrationStatus: "APPROVED" }),
  });
  assert(approval.response.ok && approval.data.participant.registrationStatus === "APPROVED", "Pengawas/Admin/Ketua approval endpoint approves");

  const crossCheckInAllowed = await jsonFetch("/api/attendance/check-in", {
    method: "POST",
    headers: { Cookie: grogolCookie },
    body: JSON.stringify({ qrToken: crossEvent.qrToken }),
  });
  assert(crossCheckInAllowed.response.ok && crossCheckInAllowed.data.attendance.status === "PRESENT", "cross-branch QR allowed after approval");

  await prisma.eventParticipant.create({
    data: {
      eventId: feedbackEvent.id,
      userId: "smoke_trainer",
      role: "TRAINER",
      registrationStatus: "APPROVED",
      approvedByUserId: "admin_fahuicu",
      approvedAt: new Date(),
    },
  });
  await prisma.feedback.create({
    data: {
      eventId: otherFeedbackEvent.id,
      userId: "smoke_grogol_member",
      purposeAchievedRating: 5,
      topicMatchRating: 5,
      speakerClarityRating: 5,
      dharmaUsefulnessRating: 5,
      learnedText: "Other event learning",
      improvementText: "Other event improvement",
    },
  });

  const trainerCookie = await login("trainer@stabilization.test", "Password123");
  const trainerFeedback = await jsonFetch("/api/feedback", { headers: { Cookie: trainerCookie } });
  const trainerEventIds = (trainerFeedback.data.events || []).map((event) => event.id);
  assert(trainerFeedback.response.ok, "trainer feedback endpoint accessible");
  assert(trainerEventIds.includes(feedbackEvent.id), "trainer sees assigned TRAINER event feedback");
  assert(!trainerEventIds.includes(otherFeedbackEvent.id), "trainer cannot see unassigned event feedback");

  const dashboard = await jsonFetch("/dashboard", { headers: { Cookie: adminCookie } });
  assert(dashboard.response.ok, "dashboard route renders");
}

main()
  .then(async () => {
    for (const result of results) {
      console.log(`${result.ok ? "PASS" : "FAIL"} - ${result.label}${result.detail ? ` (${result.detail})` : ""}`);
    }
    await cleanup();
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    for (const result of results) {
      console.log(`${result.ok ? "PASS" : "FAIL"} - ${result.label}${result.detail ? ` (${result.detail})` : ""}`);
    }
    console.error(`ERROR - ${error.message}`);
    await cleanup().catch(() => {});
    await prisma.$disconnect();
    process.exit(1);
  });
