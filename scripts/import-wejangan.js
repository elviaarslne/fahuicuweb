require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const REQUIRED_COLUMNS = ["date", "title", "teacher", "content", "reflection_prompt", "reward_credit"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Mirrors src/lib/jakarta-time.ts. Kept as a plain copy here since this is a
// CommonJS script run directly with `node`, not through the TS build.
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
function jakartaDayBoundsUtc(dateOnly) {
  const [y, m, d] = dateOnly.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - JAKARTA_OFFSET_MS);
  const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - JAKARTA_OFFSET_MS);
  return { start, end };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { rows.push(row); row = []; };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else { inQuotes = false; }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') { inQuotes = true; continue; }
    if (char === ",") { pushField(); continue; }
    if (char === "\r") continue;
    if (char === "\n") { pushField(); pushRow(); continue; }
    field += char;
  }
  if (field.length > 0 || row.length > 0) { pushField(); pushRow(); }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

function toRecords(rows) {
  if (rows.length === 0) throw new Error("CSV kosong.");
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((col) => !header.includes(col));
  if (missing.length) {
    throw new Error(`Header CSV tidak lengkap. Kolom hilang: ${missing.join(", ")}. Header wajib: ${REQUIRED_COLUMNS.join(", ")}`);
  }
  return rows.slice(1)
    .filter((r) => r.some((cell) => cell.trim() !== ""))
    .map((r, index) => {
      const record = {};
      header.forEach((col, colIndex) => { record[col] = (r[colIndex] ?? "").trim(); });
      record.__row = index + 2; // +1 for header, +1 for 1-based line numbers
      return record;
    });
}

function validateRecord(record) {
  const errors = [];
  if (!DATE_RE.test(record.date) || Number.isNaN(new Date(`${record.date}T00:00:00Z`).getTime())) {
    errors.push(`date tidak valid ("${record.date}"), harus format YYYY-MM-DD`);
  }
  if (!record.title) errors.push("title wajib diisi");
  if (!record.content) errors.push("content wajib diisi");
  const creditRaw = record.reward_credit;
  const credit = Number(creditRaw);
  if (creditRaw === "" || Number.isNaN(credit) || !Number.isInteger(credit) || credit < 0) {
    errors.push(`reward_credit tidak valid ("${creditRaw}"), harus angka bulat >= 0`);
  }
  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((arg) => !arg.startsWith("--"));
  const dryRun = args.includes("--dry-run");
  const allowUpdate = args.includes("--update");

  if (!filePath) {
    console.error("\nPemakaian: node scripts/import-wejangan.js <path/ke/wejangan.csv> [--dry-run] [--update]\n");
    process.exitCode = 1;
    return;
  }

  const resolvedPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`\nFile tidak ditemukan: ${resolvedPath}\n`);
    process.exitCode = 1;
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error("\nDATABASE_URL wajib diset di environment.\n");
    process.exitCode = 1;
    return;
  }

  const text = fs.readFileSync(resolvedPath, "utf8");
  let records;
  try {
    records = toRecords(parseCsv(text));
  } catch (error) {
    console.error(`\nGAGAL: ${error.message}\n`);
    process.exitCode = 1;
    return;
  }

  const valid = [];
  const invalid = [];
  for (const record of records) {
    const errors = validateRecord(record);
    if (errors.length) {
      invalid.push({ row: record.__row, date: record.date, errors });
    } else {
      valid.push(record);
    }
  }

  console.log(`\n[import-wejangan] ${dryRun ? "DRY RUN, tidak ada perubahan disimpan" : allowUpdate ? "Mode: create + update" : "Mode: create only (baris dengan tanggal yang sudah ada akan di-skip)"}`);
  console.log(`[import-wejangan] Baris terbaca: ${records.length}, valid: ${valid.length}, invalid: ${invalid.length}\n`);

  if (invalid.length) {
    console.log("Baris tidak valid:");
    for (const item of invalid) {
      console.log(`  - baris ${item.row} (date=${item.date || "-"}): ${item.errors.join("; ")}`);
    }
    console.log("");
  }

  if (valid.length === 0) {
    console.log("Tidak ada baris valid untuk diproses.\n");
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL) });
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let dbErrors = 0;

  try {
    for (const record of valid) {
      const { start, end } = jakartaDayBoundsUtc(record.date);
      try {
        const existing = await prisma.dailyWejangan.findFirst({
          where: { uploadDate: { gte: start, lte: end } },
          select: { id: true, title: true },
        });

        const data = {
          title: record.title,
          source: record.teacher || null,
          uploadDate: start,
          content: record.content,
          reflectionQuestion: record.reflection_prompt || null,
          creditReward: Number(record.reward_credit),
        };

        if (existing && !allowUpdate) {
          skipped += 1;
          console.log(`  SKIP  ${record.date}  sudah ada ("${existing.title}"), pakai --update untuk menimpa`);
          continue;
        }

        if (dryRun) {
          if (existing) {
            updated += 1;
            console.log(`  WOULD UPDATE  ${record.date}  "${record.title}"`);
          } else {
            created += 1;
            console.log(`  WOULD CREATE  ${record.date}  "${record.title}"`);
          }
          continue;
        }

        if (existing) {
          await prisma.dailyWejangan.update({ where: { id: existing.id }, data });
          updated += 1;
          console.log(`  UPDATE  ${record.date}  "${record.title}"`);
        } else {
          await prisma.dailyWejangan.create({ data });
          created += 1;
          console.log(`  CREATE  ${record.date}  "${record.title}"`);
        }
      } catch (error) {
        dbErrors += 1;
        console.log(`  ERROR  baris ${record.__row} (date=${record.date}): ${error instanceof Error ? error.message : "gagal menyimpan"}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n[import-wejangan] Selesai. created=${created} updated=${updated} skipped=${skipped} invalid=${invalid.length} dbErrors=${dbErrors}\n`);
  if (invalid.length > 0 || dbErrors > 0) process.exitCode = 1;
}

main();
