require("dotenv/config");
const path = require("path");
const ExcelJS = require("exceljs");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

// Mirrors src/lib/schedule-options.ts. Kept as a plain copy here since this
// is a CommonJS script run directly with `node`, not through the TS build.
// This table is the confirmed, human-reviewed sheet -> program/class/time
// mapping. Do not infer these values dynamically from spreadsheet text.
const SHEET_CONFIG = {
  "Kelas 1 K.Ming": { program: "KUANG_MING", classLabel: "Kelas 1 (Ming De Pan)", startTime: "09:00", endTime: "12:00" },
  "Kelas 1 K.Chien": { program: "KUANG_CHIEN", classLabel: "Kelas 1 (Ming De Pan)", startTime: "09:00", endTime: "12:00" },
  "Kelas 2": { program: "KUANG_MING", classLabel: "Kelas 2 (Phei Te Pan)", startTime: "13:30", endTime: "17:00" },
  "Kelas 3": { program: "KUANG_CHIEN", classLabel: "Kelas 3 (Jiang Yuan Pan)", startTime: "19:00", endTime: "21:00" },
  "Kelas 4": { program: "KUANG_CHIEN", classLabel: "Kelas 4 (Jin De Pan)", startTime: "19:00", endTime: "21:00" },
  "Kelas 5": { program: "KUANG_CHIEN", classLabel: "Kelas 5 (Zhun Tan Zhu Pan)", startTime: "13:30", endTime: "17:00" },
  "Kelas 6": { program: "ONLINE", classLabel: "Kelas 6 (Hong Li Pan)", startTime: "19:00", endTime: "21:00" },
  "Chang Te Pan": { program: "KUANG_MING", classLabel: "Chang Te Pan", startTime: "10:00", endTime: "12:00" },
  "Sie Sen K Ming": { program: "XUE_SHENG_KUANG_MING", classLabel: "Xue Sheng", startTime: null, endTime: null },
  "Sie Sen K Chien": { program: "XUE_SHENG_KUANG_CHIEN", classLabel: "Xue Sheng", startTime: null, endTime: null },
};
const ALLOWED_SHEETS = Object.keys(SHEET_CONFIG);
const EXCLUDED_SHEETS = ["Sabtu", "Minggu", "Chu It Cap Go K.Chien", "PIVOT Penceramah", "SYARAT KELAS"];

// Mirrors src/lib/jakarta-time.ts. See import-wejangan.js for the same note.
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
function jakartaMidnightUtc(jsDate) {
  // The workbook's date cells carry no real time-of-day; treat the value as
  // a plain calendar date and anchor it to Jakarta midnight, not the raw
  // UTC instant Excel/exceljs happens to report.
  const year = jsDate.getUTCFullYear();
  const month = jsDate.getUTCMonth();
  const day = jsDate.getUTCDate();
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - JAKARTA_OFFSET_MS);
}

const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|::1)$/i;
function isLocalDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return LOCAL_HOST_RE.test(parsed.hostname);
  } catch {
    return false;
  }
}
function maskedHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "(tidak dapat diparse)";
  }
}

function flattenRichText(value) {
  if (value && typeof value === "object" && Array.isArray(value.richText)) {
    return value.richText.map((run) => run.text).join("");
  }
  return value;
}

function resolveCellValue(cell) {
  let value = cell.value;
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && "result" in value) {
    value = value.result;
  }
  value = flattenRichText(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  return value;
}

const MONTH_ABBREVIATIONS = {
  jan: 0, feb: 1, peb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5, jul: 6,
  agu: 7, aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11,
};

// A handful of source rows have their date typed as free text (e.g.
// "MINGGU 22-Mar-26") instead of a real spreadsheet date. This parses an
// explicit day/month/year already written in the cell -- it never invents
// a date; it only structures one that is already stated.
function tryParseTextualDate(text) {
  const match = /(\d{1,2})[\s,.\-]*([A-Za-z]{3,})[\s,.\-]*'?(\d{2,4})/.exec(text);
  if (!match) return null;
  const day = Number(match[1]);
  const monthKey = match[2].slice(0, 3).toLowerCase();
  const month = MONTH_ABBREVIATIONS[monthKey];
  if (month === undefined) return null;
  let year = Number(match[3]);
  if (year < 100) year += 2000;
  const candidate = new Date(Date.UTC(year, month, day));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month || candidate.getUTCDate() !== day) return null;
  return candidate;
}

function isHoliday(topic) {
  return typeof topic === "string" && topic.toLowerCase().includes("libur");
}

function normalizeTitleForDuplicateCheck(title) {
  return (title || "").trim().toLowerCase().replace(/\s+/g, " ");
}

async function parseWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const candidates = [];
  const skipped = []; // blank topic / holiday
  const invalid = []; // structurally broken rows (date with no usable content path)
  const sheetsProcessed = [];
  const sheetsMissing = [];

  for (const sheetName of ALLOWED_SHEETS) {
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      sheetsMissing.push(sheetName);
      continue;
    }
    sheetsProcessed.push(sheetName);
    const config = SHEET_CONFIG[sheetName];

    // Build the non-blank row list (columns B.. onward), matching the
    // structure confirmed by manual workbook inspection: data starts at
    // row 5, and every real entry occupies two physical rows (a Chinese
    // date/topic row immediately followed by an Indonesian translation
    // row with no date of its own).
    const nonBlankRows = [];
    for (let r = 5; r <= worksheet.rowCount; r += 1) {
      const row = worksheet.getRow(r);
      let dateVal = resolveCellValue(row.getCell(2));
      if (typeof dateVal === "string") {
        const parsed = tryParseTextualDate(dateVal);
        if (parsed) dateVal = parsed;
      }
      const topicVal = resolveCellValue(row.getCell(3));
      const instructorZh = resolveCellValue(row.getCell(4));
      const instructorId = resolveCellValue(row.getCell(5));
      if (dateVal !== null || topicVal !== null || instructorZh !== null || instructorId !== null) {
        nonBlankRows.push({ r, dateVal, topicVal, instructorZh, instructorId });
      }
    }

    let i = 0;
    while (i < nonBlankRows.length) {
      const current = nonBlankRows[i];
      if (!(current.dateVal instanceof Date)) {
        // An orphan row with no date and no preceding dated row to attach
        // to. Should not normally occur given the confirmed structure;
        // record it as invalid rather than silently dropping it.
        invalid.push({ sourceSheet: sheetName, sourceRow: current.r, reason: "Baris tanpa tanggal dan tanpa baris tanggal sebelumnya." });
        i += 1;
        continue;
      }

      const next = nonBlankRows[i + 1];
      let titleId = null;
      let consumed = 1;
      if (next && !(next.dateVal instanceof Date)) {
        titleId = next.topicVal;
        consumed = 2;
      }

      const titleZh = current.topicVal;
      const instructorName = current.instructorId || current.instructorZh || null;
      const sourceRow = current.r;
      const date = jakartaMidnightUtc(current.dateVal);

      if (!titleZh || isHoliday(titleZh)) {
        skipped.push({
          sourceSheet: sheetName,
          sourceRow,
          date,
          titleZh,
          reason: !titleZh ? "Topik kosong" : "Ditandai libur",
        });
      } else {
        candidates.push({
          sourceSheet: sheetName,
          sourceRow,
          date,
          titleZh,
          titleId,
          instructorName,
          program: config.program,
          classLabel: config.classLabel,
          startTime: config.startTime,
          endTime: config.endTime,
        });
      }

      i += consumed;
    }
  }

  // Duplicate detection: same sheet + same date + same normalized title,
  // at different source rows. Flag every member of the group; never drop.
  const groups = new Map();
  for (const candidate of candidates) {
    const key = [candidate.sourceSheet, candidate.date.toISOString().slice(0, 10), normalizeTitleForDuplicateCheck(candidate.titleZh)].join("::");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(candidate);
  }
  for (const group of groups.values()) {
    if (group.length > 1) {
      for (const candidate of group) candidate.duplicateStatus = "POSSIBLE_DUPLICATE";
    } else {
      group[0].duplicateStatus = "NORMAL";
    }
  }

  return { candidates, skipped, invalid, sheetsProcessed, sheetsMissing };
}

function printReport({ candidates, skipped, invalid, sheetsProcessed, sheetsMissing }) {
  console.log("\n[import-2026-schedule] Sheet coverage");
  console.log(`  Diproses (${sheetsProcessed.length}/${ALLOWED_SHEETS.length}): ${sheetsProcessed.join(", ")}`);
  if (sheetsMissing.length) console.log(`  TIDAK DITEMUKAN di workbook: ${sheetsMissing.join(", ")}`);
  console.log(`  Dikecualikan secara eksplisit (tidak pernah diproses): ${EXCLUDED_SHEETS.join(", ")}`);

  const duplicateCount = candidates.filter((c) => c.duplicateStatus === "POSSIBLE_DUPLICATE").length;
  const missingInstructor = candidates.filter((c) => !c.instructorName).length;
  const missingTime = candidates.filter((c) => !c.startTime).length;

  console.log("\n[import-2026-schedule] Ringkasan baris");
  console.log(`  Kandidat valid untuk diimpor : ${candidates.length}`);
  console.log(`  Dilewati (blank/libur)       : ${skipped.length}`);
  console.log(`  Tidak valid (struktur rusak) : ${invalid.length}`);
  console.log(`  Ditandai POSSIBLE_DUPLICATE  : ${duplicateCount}`);
  console.log(`  Tanpa nama pengajar          : ${missingInstructor}`);
  console.log(`  Tanpa jam (startTime null)   : ${missingTime}`);

  if (invalid.length) {
    console.log("\n  Baris tidak valid:");
    for (const item of invalid) console.log(`    - ${item.sourceSheet} baris ${item.sourceRow}: ${item.reason}`);
  }

  const dupGroups = new Map();
  for (const c of candidates) {
    if (c.duplicateStatus !== "POSSIBLE_DUPLICATE") continue;
    const key = `${c.sourceSheet}::${c.date.toISOString().slice(0, 10)}::${normalizeTitleForDuplicateCheck(c.titleZh)}`;
    if (!dupGroups.has(key)) dupGroups.set(key, []);
    dupGroups.get(key).push(c.sourceRow);
  }
  if (dupGroups.size) {
    console.log("\n  Grup duplikat kandidat (sheet :: tanggal :: judul -> baris):");
    for (const [key, rows] of dupGroups) console.log(`    - ${key} -> baris ${rows.join(", ")}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((arg) => !arg.startsWith("--"));
  const commit = args.includes("--commit");
  const forceNonLocal = args.includes("--force-non-local");

  if (!filePath) {
    console.error("\nPemakaian: node scripts/import-2026-schedule.js <path/ke/workbook.xlsx> [--commit] [--force-non-local]\n");
    console.error("Tanpa --commit, script hanya menampilkan preview (tidak ada perubahan database).\n");
    process.exitCode = 1;
    return;
  }

  const resolvedPath = path.resolve(process.cwd(), filePath);
  console.log(`\n[import-2026-schedule] Membaca workbook: ${resolvedPath}`);
  console.log(`[import-2026-schedule] Mode: ${commit ? "COMMIT (akan menulis ke database)" : "PREVIEW ONLY (tidak ada tulisan ke database)"}`);

  let parsed;
  try {
    parsed = await parseWorkbook(resolvedPath);
  } catch (error) {
    console.error(`\nGAGAL membaca/parsing workbook: ${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
    return;
  }

  printReport(parsed);

  if (!process.env.DATABASE_URL) {
    console.error("\nDATABASE_URL wajib diset di environment. Preview di atas hanya dari hasil parsing workbook.\n");
    process.exitCode = commit ? 1 : 0;
    return;
  }

  const host = maskedHost(process.env.DATABASE_URL);
  console.log(`\n[import-2026-schedule] DATABASE_URL host: ${host}`);

  if (commit && !isLocalDatabaseUrl(process.env.DATABASE_URL) && !forceNonLocal) {
    console.error(
      "\n[import-2026-schedule] GAGAL: --commit diminta tapi DATABASE_URL tidak terlihat seperti database lokal.\n" +
      "Ini kemungkinan besar adalah database PRODUKSI. Import produksi harus dilakukan secara sengaja,\n" +
      "setelah meninjau preview di atas, bukan lewat flag yang sama dengan import lokal.\n" +
      "Jika kamu benar-benar yakin, jalankan ulang dengan --force-non-local.\n",
    );
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL) });
  let created = 0;
  let updated = 0;
  let dbErrors = 0;

  try {
    for (const candidate of parsed.candidates) {
      try {
        const existing = await prisma.scheduleEntry.findUnique({
          where: { sourceSheet_sourceRow: { sourceSheet: candidate.sourceSheet, sourceRow: candidate.sourceRow } },
          select: { id: true },
        });

        const data = {
          date: candidate.date,
          titleZh: candidate.titleZh,
          titleId: candidate.titleId,
          instructorName: candidate.instructorName,
          program: candidate.program,
          classLabel: candidate.classLabel,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          duplicateStatus: candidate.duplicateStatus,
        };

        if (!commit) {
          if (existing) updated += 1;
          else created += 1;
          console.log(`  ${existing ? "WOULD UPDATE" : "WOULD CREATE"}  ${candidate.sourceSheet} baris ${candidate.sourceRow}  ${candidate.titleZh}`);
          continue;
        }

        await prisma.scheduleEntry.upsert({
          where: { sourceSheet_sourceRow: { sourceSheet: candidate.sourceSheet, sourceRow: candidate.sourceRow } },
          create: { sourceSheet: candidate.sourceSheet, sourceRow: candidate.sourceRow, ...data },
          update: data,
        });
        if (existing) updated += 1;
        else created += 1;
      } catch (error) {
        dbErrors += 1;
        console.log(`  ERROR  ${candidate.sourceSheet} baris ${candidate.sourceRow}: ${error instanceof Error ? error.message : "gagal menyimpan"}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n[import-2026-schedule] Selesai. created=${created} updated=${updated} dbErrors=${dbErrors}\n`);
  if (dbErrors > 0) process.exitCode = 1;
}

main();
