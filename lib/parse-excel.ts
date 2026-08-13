import * as XLSX from "xlsx";
import type {
  PreviewRow,
  UploadMetadata,
} from "@/features/upload-result/store/upload-wizard-store";

const HEADER_ALIASES: Record<
  keyof PreviewRow,
  string[]
> = {
  matricNo: [
    "matricno",
    "matric no",
    "matric number",
    "matriculation number",
    "reg no",
    "registration number",
  ],

  totalScore: [
    "score",
    "total",
    "total score",
    "total score 100",
  ],

  grade: ["grade"],
};

function normalizeHeader(
  header: string,
): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[.:\_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildHeaderMap(
  sheetHeaders: string[],
): Partial<
  Record<keyof PreviewRow, string>
> {
  const map: Partial<
    Record<keyof PreviewRow, string>
  > = {};

  for (const header of sheetHeaders) {
    const normalized =
      normalizeHeader(header);

    for (const [
      field,
      aliases,
    ] of Object.entries(
      HEADER_ALIASES,
    ) as [
      keyof PreviewRow,
      string[],
    ][]) {
      if (map[field]) continue;

      const normalizedAliases =
        aliases.map(normalizeHeader);

      if (
        normalizedAliases.includes(
          normalized,
        )
      ) {
        map[field] = header;
      }
    }
  }

  return map;
}

function findHeaderRow(
  sheet: XLSX.WorkSheet,
): number {
  const range =
    XLSX.utils.decode_range(
      sheet["!ref"] ?? "A1:A1",
    );

  for (
    let row = range.s.r;
    row <= range.e.r;
    row++
  ) {
    for (
      let col = range.s.c;
      col <= range.e.c;
      col++
    ) {
      const cellAddress =
        XLSX.utils.encode_cell({
          r: row,
          c: col,
        });

      const cell =
        sheet[cellAddress];

      if (!cell) continue;

      const value = String(
        cell.v ?? "",
      ).trim();

      const normalized =
        normalizeHeader(value);

      if (
        normalized ===
          "matric number" ||
        normalized ===
          "matric no"
      ) {
        return row;
      }
    }
  }

  return -1;
}

function getCellValue(
  sheet: XLSX.WorkSheet,
  address: string,
): string {
  const cell = sheet[address];

  if (!cell) {
    return "";
  }

  if (
    cell.v === null ||
    cell.v === undefined
  ) {
    return "";
  }

  return String(cell.v).trim();
}

export class ExcelParseError extends Error {}

export type ParsedExcelFile = {
  metadata: UploadMetadata;
  rows: PreviewRow[];
};

export async function parseExcelFile(
  file: File,
): Promise<ParsedExcelFile> {
  const buffer =
    await file.arrayBuffer();

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

  const sheetName =
    workbook.SheetNames[0];

  if (!sheetName) {
    throw new ExcelParseError(
      "The workbook has no sheets.",
    );
  }

  const sheet =
    workbook.Sheets[sheetName];

  if (!sheet) {
    throw new ExcelParseError(
      "Could not read the first worksheet.",
    );
  }

  /*
   * --------------------------------------------------
   * READ SHARED COURSE METADATA
   * --------------------------------------------------
   *
   * B3 = Course Code
   * E3 = Academic Session
   * E4 = Semester
   * E5 = Credit Unit
   *
   * These values belong to the entire upload,
   * not to individual student rows.
   */

  const courseCode = getCellValue(
    sheet,
    "B3",
  );

  const session = getCellValue(
    sheet,
    "E3",
  );

  const semester = getCellValue(
    sheet,
    "E4",
  );

  const creditUnit = getCellValue(
    sheet,
    "E5",
  );

  const metadata: UploadMetadata = {
    courseCode,
    session,
    semester,
    creditUnit,
  };

  /*
   * --------------------------------------------------
   * FIND THE STUDENT RESULT TABLE
   * --------------------------------------------------
   */

  const headerRow =
    findHeaderRow(sheet);

  if (headerRow === -1) {
    throw new ExcelParseError(
      "Couldn't find the result table. Make sure the sheet contains a 'Matric Number' column.",
    );
  }

  /*
   * Convert the worksheet into JSON starting
   * from the actual result-table header row.
   */

  const rows =
    XLSX.utils.sheet_to_json<
      Record<string, unknown>
    >(sheet, {
      range: headerRow,
      defval: "",
      raw: true,
    });

  if (rows.length === 0) {
    throw new ExcelParseError(
      "This sheet has no student result rows.",
    );
  }

  const sheetHeaders =
    Object.keys(rows[0]);

  const headerMap =
    buildHeaderMap(sheetHeaders);

  /*
   * Matric number is required because it is
   * what we use to identify students during
   * database validation.
   */

  if (!headerMap.matricNo) {
    throw new ExcelParseError(
      "Couldn't find a matriculation number column. Check the sheet's headers.",
    );
  }

  /*
   * Total score and grade are also expected
   * columns in the result template.
   */

  if (!headerMap.totalScore) {
    throw new ExcelParseError(
      "Couldn't find a Total Score column. Check the sheet's headers.",
    );
  }

  if (!headerMap.grade) {
    throw new ExcelParseError(
      "Couldn't find a Grade column. Check the sheet's headers.",
    );
  }

  /*
   * --------------------------------------------------
   * PARSE STUDENT RESULTS
   * --------------------------------------------------
   */

  const parsedRows = rows
    .map(
      (
        row,
      ): PreviewRow | null => {
        const matricNo =
          String(
            row[
              headerMap.matricNo!
            ] ?? "",
          ).trim();

        /*
         * Completely empty rows are ignored.
         *
         * However, if a row has a matric number
         * but its score is blank, we KEEP the row.
         *
         * The validation stage will later flag
         * the missing score.
         */

        if (!matricNo) {
          return null;
        }

        /*
         * IMPORTANT:
         *
         * We do NOT convert an empty score to 0.
         *
         * Blank = missing result.
         */

        const rawScore =
          row[
            headerMap.totalScore!
          ];

        const totalScore =
          rawScore === null ||
          rawScore === undefined ||
          String(rawScore).trim() === ""
            ? ""
            : String(rawScore).trim();

        /*
         * Grade is also kept blank if it is
         * missing from the Excel sheet.
         */

        const rawGrade =
          row[
            headerMap.grade!
          ];

        const grade =
          rawGrade === null ||
          rawGrade === undefined
            ? ""
            : String(rawGrade)
                .trim()
                .toUpperCase();

        return {
          matricNo,
          totalScore,
          grade,
        };
      },
    )
    .filter(
      (
        row,
      ): row is PreviewRow =>
        row !== null,
    );

  if (parsedRows.length === 0) {
    throw new ExcelParseError(
      "No student result records were found.",
    );
  }

  return {
    metadata,
    rows: parsedRows,
  };
}
