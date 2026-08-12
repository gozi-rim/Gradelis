import * as XLSX from "xlsx";
import type { PreviewRow } from "@/features/upload-result/store/upload-wizard-store";

const HEADER_ALIASES: Record<keyof PreviewRow, string[]> = {
  matricNo: [
    "matricno",
    "matric no",
    "matric number",
    "matriculation number",
    "reg no",
    "registration number",
  ],

  score: ["score", "total", "total score", "total score 100"],

  grade: ["grade"],

  ca: ["ca", "c.a", "ca score", "ca score 30", "continuous assessment"],

  exam: ["exam", "exam score", "exam score 70"],
};

function normalizeHeader(header: string): string {
  return (
    header
      .trim()
      .toLowerCase()
      // Remove things like "(30)", "(70)", "(100)"
      .replace(/\([^)]*\)/g, "")
      // Normalize punctuation
      .replace(/[.:_-]/g, " ")
      // Collapse multiple spaces
      .replace(/\s+/g, " ")
      .trim()
  );
}

function buildHeaderMap(
  sheetHeaders: string[],
): Partial<Record<keyof PreviewRow, string>> {
  const map: Partial<Record<keyof PreviewRow, string>> = {};

  for (const header of sheetHeaders) {
    const normalized = normalizeHeader(header);

    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
      keyof PreviewRow,
      string[],
    ][]) {
      if (map[field]) continue;

      const normalizedAliases = aliases.map(normalizeHeader);

      if (normalizedAliases.includes(normalized)) {
        map[field] = header;
      }
    }
  }

  return map;
}

function computeGrade(score: number): string {
  if (score >= 70) return "A";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 45) return "D";
  if (score >= 40) return "E";

  return "F";
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return 0;
  }

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
}

function findHeaderRow(sheet: XLSX.WorkSheet): number {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");

  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
        c: col,
      });

      const cell = sheet[cellAddress];

      if (!cell) continue;

      const value = String(cell.v ?? "").trim();

      if (normalizeHeader(value) === "matric number") {
        return row;
      }
    }
  }

  return -1;
}

export class ExcelParseError extends Error {}

export async function parseExcelFile(file: File): Promise<PreviewRow[]> {
  const buffer = await file.arrayBuffer();

  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(buffer, {
      type: "array",
    });
  } catch {
    throw new ExcelParseError(
      "Could not read this file. Make sure it's a valid Excel file.",
    );
  }

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new ExcelParseError("The workbook has no sheets.");
  }

  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new ExcelParseError("Could not read the first worksheet.");
  }

  /*
   * Find the actual table header instead of assuming
   * that row 1 contains the headers.
   */
  const headerRow = findHeaderRow(sheet);

  if (headerRow === -1) {
    throw new ExcelParseError(
      "Couldn't find the result table. Make sure the sheet contains a 'Matric Number' column.",
    );
  }

  /*
   * Convert the sheet to JSON starting from the actual
   * header row.
   *
   * headerRow is zero-based, which is exactly what
   * SheetJS expects for the `range` option.
   */
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    range: headerRow,
    defval: "",
    raw: true,
  });

  if (rows.length === 0) {
    throw new ExcelParseError("This sheet has no student result rows.");
  }

  const sheetHeaders = Object.keys(rows[0]);

  const headerMap = buildHeaderMap(sheetHeaders);

  if (!headerMap.matricNo) {
    throw new ExcelParseError(
      "Couldn't find a matriculation number column. Check the sheet's headers.",
    );
  }

  return rows
    .map((row): PreviewRow | null => {
      const matricNo = String(row[headerMap.matricNo!] ?? "").trim();

      // Ignore completely empty rows
      if (!matricNo) {
        return null;
      }

      /*
       * CA and Exam are actual numeric cells in your template,
       * so we calculate the total ourselves instead of relying
       * on the Excel formula in "Total Score (100)".
       */
      const ca = headerMap.ca ? parseNumber(row[headerMap.ca]) : 0;

      const exam = headerMap.exam ? parseNumber(row[headerMap.exam]) : 0;

      let score: number;

      if (headerMap.score) {
        const scoreValue = row[headerMap.score];

        /*
         * If the total cell contains an actual numeric value,
         * use it. If it contains an Excel formula/string,
         * calculate from CA + Exam.
         */
        const parsedScore = parseNumber(scoreValue);

        if (
          typeof scoreValue === "number" ||
          (typeof scoreValue === "string" &&
            scoreValue.trim() !== "" &&
            !scoreValue.trim().startsWith("="))
        ) {
          score = parsedScore;
        } else {
          score = ca + exam;
        }
      } else {
        score = ca + exam;
      }

      /*
       * Your Excel template has a Grade formula.
       * SheetJS may return the formula itself rather than
       * evaluating it, so only use the supplied grade if it
       * is actually a simple letter.
       */
      let grade = "";

      if (headerMap.grade) {
        const suppliedGrade = String(row[headerMap.grade] ?? "")
          .trim()
          .toUpperCase();

        if (/^[A-F]$/.test(suppliedGrade)) {
          grade = suppliedGrade;
        }
      }

      if (!grade) {
        grade = computeGrade(score);
      }

      return {
        matricNo,
        score: String(score),
        grade,
        ca: String(ca),
        exam: String(exam),
      };
    })
    .filter((row): row is PreviewRow => row !== null);
}
