import * as XLSX from "xlsx";

export type ParsedCourseRow = {
  rowNumber: number;
  code: string;
  title: string;
  creditUnits: number;
  level: number;
  semester: "FIRST" | "SECOND";
  courseType: "COMPULSORY" | "ELECTIVE";
  status: "VALID" | "INVALID";
  errors: string[];
};

export type CourseParseResult = {
  rows: ParsedCourseRow[];
  totalCount: number;
  validCount: number;
  invalidCount: number;
};

export function parseCourseSpreadsheet(
  buffer: ArrayBuffer,
  defaultLevel: number = 100,
  defaultSemester: "FIRST" | "SECOND" = "FIRST"
): CourseParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  if (!rawData || rawData.length === 0) {
    throw new Error("The uploaded spreadsheet is empty.");
  }

  // Find header row
  let headerIndex = -1;
  let codeCol = -1;
  let titleCol = -1;
  let unitCol = -1;
  let levelCol = -1;
  let semesterCol = -1;
  let typeCol = -1;

  for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    const row = rawData[i] as string[];
    if (!Array.isArray(row)) continue;

    const rowStrings = row.map((cell) => String(cell || "").trim().toLowerCase());

    const cIdx = rowStrings.findIndex(
      (c) => c.includes("code") || c.includes("course code") || c.includes("course_code")
    );
    const tIdx = rowStrings.findIndex(
      (c) => c.includes("title") || c.includes("course title") || c.includes("name")
    );

    if (cIdx !== -1 && tIdx !== -1) {
      headerIndex = i;
      codeCol = cIdx;
      titleCol = tIdx;

      unitCol = rowStrings.findIndex(
        (c) =>
          c.includes("unit") ||
          c.includes("credit") ||
          c.includes("cu") ||
          c.includes("units")
      );
      levelCol = rowStrings.findIndex(
        (c) => c.includes("level") || c.includes("year")
      );
      semesterCol = rowStrings.findIndex(
        (c) => c.includes("semester") || c.includes("sem") || c.includes("term")
      );
      typeCol = rowStrings.findIndex(
        (c) => c.includes("type") || c.includes("status") || c.includes("compulsory")
      );
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error(
      "Could not detect course columns. Please ensure headers contain 'Course Code' and 'Course Title'."
    );
  }

  const rows: ParsedCourseRow[] = [];
  const seenCodes = new Set<string>();

  for (let i = headerIndex + 1; i < rawData.length; i++) {
    const row = rawData[i] as unknown[];
    if (!row || row.length === 0) continue;

    const rawCode = String(row[codeCol] || "").trim();
    const rawTitle = String(row[titleCol] || "").trim();
    const rawUnits = unitCol !== -1 ? String(row[unitCol] || "").trim() : "3";
    const rawLevel = levelCol !== -1 ? String(row[levelCol] || "").trim() : String(defaultLevel);
    const rawSemester = semesterCol !== -1 ? String(row[semesterCol] || "").trim() : defaultSemester;
    const rawType = typeCol !== -1 ? String(row[typeCol] || "").trim() : "COMPULSORY";

    if (!rawCode && !rawTitle) continue;

    const errors: string[] = [];

    if (!rawCode) errors.push("Course code is required");
    if (!rawTitle) errors.push("Course title is required");

    const codeNormalized = rawCode.toUpperCase().replace(/\s+/g, " ");
    if (seenCodes.has(codeNormalized)) {
      errors.push(`Duplicate course code '${codeNormalized}' in spreadsheet`);
    } else if (codeNormalized) {
      seenCodes.add(codeNormalized);
    }

    let creditUnits = parseInt(rawUnits.replace(/[^0-9]/g, ""), 10);
    if (isNaN(creditUnits) || creditUnits < 1 || creditUnits > 6) {
      creditUnits = 3;
    }

    let parsedLevel = parseInt(rawLevel.replace(/[^0-9]/g, ""), 10);
    if (![100, 200, 300, 400, 500].includes(parsedLevel)) {
      parsedLevel = defaultLevel;
    }

    let semester: "FIRST" | "SECOND" = defaultSemester;
    const semLower = rawSemester.toLowerCase();
    if (semLower.includes("2") || semLower.includes("second") || semLower.includes("2nd")) {
      semester = "SECOND";
    } else {
      semester = "FIRST";
    }

    let courseType: "COMPULSORY" | "ELECTIVE" = "COMPULSORY";
    const typeLower = rawType.toLowerCase();
    if (typeLower.includes("elec") || typeLower.includes("optional")) {
      courseType = "ELECTIVE";
    }

    const status: "VALID" | "INVALID" = errors.length === 0 ? "VALID" : "INVALID";

    rows.push({
      rowNumber: i + 1,
      code: codeNormalized,
      title: rawTitle,
      creditUnits,
      level: parsedLevel,
      semester,
      courseType,
      status,
      errors,
    });
  }

  const validCount = rows.filter((r) => r.status === "VALID").length;
  const invalidCount = rows.length - validCount;

  return {
    rows,
    totalCount: rows.length,
    validCount,
    invalidCount,
  };
}
