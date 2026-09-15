require("dotenv/config");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

// Local-only guard: refuse to run against anything that doesn't look like a
// local development database, unless explicitly overridden.
const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|::1)$/i;
const DATABASE_URL = process.env.DATABASE_URL || "";
const forceNonLocal = process.argv.includes("--force-non-local");

function isLocalDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return LOCAL_HOST_RE.test(parsed.hostname);
  } catch {
    return false;
  }
}

// Dev-only convention password for disposable local test accounts. These
// accounts hold no real data and this script only ever runs against a
// confirmed-local database (see guard above), so this is not a real secret.
// Override with TEST_USER_PASSWORD if you want a different local value.
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "FahuicuTest#Local2026";

const DUMMY_USERS = [
  { email: "dummy.member@fahuicu.test", fullName: "TEST Member 01", role: "MEMBER", branchId: "pusat" },
  { email: "dummy.member2@fahuicu.test", fullName: "TEST Member 02", role: "MEMBER", branchId: "grogol" },
  { email: "dummy.leader@fahuicu.test", fullName: "TEST Leader", role: "KETUA", branchId: "pusat" },
  { email: "dummy.trainer@fahuicu.test", fullName: "TEST Trainer", role: "TRAINER", branchId: "pusat" },
  { email: "dummy.admin@fahuicu.test", fullName: "TEST Admin", role: "ADMIN", branchId: "pusat" },
];

async function main() {
  if (!DATABASE_URL) {
    console.error("\nDATABASE_URL wajib diset di environment.\n");
    process.exitCode = 1;
    return;
  }

  if (!isLocalDatabaseUrl(DATABASE_URL) && !forceNonLocal) {
    console.error(
      "\n[seed-test-users] GAGAL: DATABASE_URL tidak terlihat seperti database lokal " +
      "(host bukan localhost/127.0.0.1). Script ini sengaja menolak berjalan untuk " +
      "mencegah dummy user masuk ke database produksi.\n" +
      "Jika kamu benar-benar yakin dan paham risikonya, jalankan ulang dengan --force-non-local.\n",
    );
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(DATABASE_URL) });
  const passwordHash = await bcrypt.hash(TEST_USER_PASSWORD, 10);
  const summary = [];

  try {
    for (const spec of DUMMY_USERS) {
      const branch = await prisma.branch.findUnique({ where: { id: spec.branchId }, select: { id: true } });
      if (!branch) {
        summary.push({ email: spec.email, status: "ERROR", detail: `branch "${spec.branchId}" tidak ditemukan` });
        continue;
      }

      const existing = await prisma.user.findUnique({
        where: { email: spec.email },
        include: { systemRoles: true },
      });

      if (existing) {
        const hasRole = existing.systemRoles.some((r) => r.role === spec.role);
        if (!hasRole) {
          await prisma.userSystemRole.create({ data: { userId: existing.id, role: spec.role } });
        }
        summary.push({ email: spec.email, status: "ALREADY EXISTS", detail: hasRole ? "role sudah sesuai" : "role ditambahkan" });
        continue;
      }

      const created = await prisma.user.create({
        data: {
          fullName: spec.fullName,
          email: spec.email,
          passwordHash,
          homeBranch: { connect: { id: spec.branchId } },
          status: "ACTIVE",
          systemRoles: { create: { role: spec.role } },
        },
      });
      summary.push({ email: spec.email, status: "CREATED", detail: created.id });
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n[seed-test-users] Ringkasan:\n");
  for (const row of summary) {
    console.log(`  ${row.status.padEnd(14)} ${row.email.padEnd(32)} ${row.detail}`);
  }
  console.log("\nPassword tidak ditampilkan di log ini. Lihat TEST_USER_PASSWORD di scripts/seed-test-users.js atau environment.\n");
}

main();
