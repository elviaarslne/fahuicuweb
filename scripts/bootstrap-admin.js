require("dotenv/config");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];
const MIN_PASSWORD_LENGTH = 8;
const TRIVIAL_PASSWORDS = new Set(["admin", "password", "12345678", "admin123", "password123", "changeme"]);

const envSchema = z.object({
  ADMIN_EMAIL: z.email("ADMIN_EMAIL bukan email yang valid."),
  ADMIN_PASSWORD: z.string().min(MIN_PASSWORD_LENGTH, `ADMIN_PASSWORD minimal ${MIN_PASSWORD_LENGTH} karakter.`),
  ADMIN_NAME: z.string().trim().min(2, "ADMIN_NAME wajib diisi, minimal 2 karakter."),
  ADMIN_ROLE: z.enum(ALLOWED_ROLES).default("SUPER_ADMIN"),
  ADMIN_BRANCH_ID: z.string().trim().min(1).default("pusat"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diset di environment."),
});

function fail(message) {
  console.error(`\n[bootstrap-admin] GAGAL: ${message}\n`);
  process.exitCode = 1;
}

async function main() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join(".") || "(env)"}: ${issue.message}`).join("\n");
    fail(`Environment variable tidak lengkap atau tidak valid.\n${issues}`);
    return;
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_ROLE, ADMIN_BRANCH_ID, DATABASE_URL } = parsed.data;

  if (TRIVIAL_PASSWORDS.has(ADMIN_PASSWORD.toLowerCase())) {
    fail("ADMIN_PASSWORD terlalu mudah ditebak. Gunakan password yang kuat dan unik, bukan nilai umum seperti admin atau password.");
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(DATABASE_URL) });

  try {
    const branch = await prisma.branch.findUnique({ where: { id: ADMIN_BRANCH_ID }, select: { id: true, name: true } });
    if (!branch) {
      fail(`Cabang dengan id "${ADMIN_BRANCH_ID}" tidak ditemukan. Set ADMIN_BRANCH_ID ke id cabang yang valid, contoh: pusat.`);
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      include: { systemRoles: true },
    });

    if (existing) {
      console.log("\n[bootstrap-admin] User dengan email ini sudah ada. Tidak ada data yang diubah.");
      console.log(`  id     : ${existing.id}`);
      console.log(`  email  : ${existing.email}`);
      console.log(`  status : ${existing.status}`);
      console.log(`  roles  : ${existing.systemRoles.map((role) => role.role).join(", ") || "(belum ada role)"}`);
      console.log("\nJika role admin belum ada pada user ini, tambahkan secara manual. Script ini sengaja tidak menimpa password atau data user yang sudah ada.\n");
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const created = await prisma.user.create({
      data: {
        fullName: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash,
        homeBranch: { connect: { id: branch.id } },
        status: "ACTIVE",
        systemRoles: { create: { role: ADMIN_ROLE } },
      },
      include: { systemRoles: true },
    });

    console.log("\n[bootstrap-admin] Admin baru berhasil dibuat.");
    console.log(`  id       : ${created.id}`);
    console.log(`  email    : ${created.email}`);
    console.log(`  fullName : ${created.fullName}`);
    console.log(`  branch   : ${branch.name} (${branch.id})`);
    console.log(`  status   : ${created.status}`);
    console.log(`  roles    : ${created.systemRoles.map((role) => role.role).join(", ")}`);
    console.log("\nPassword tidak ditampilkan atau dicatat di log ini. Simpan sendiri di tempat yang aman.\n");
  } catch (error) {
    fail(error instanceof Error ? error.message : "Terjadi kesalahan tak terduga saat menghubungkan ke database.");
  } finally {
    await prisma.$disconnect();
  }
}

main();
