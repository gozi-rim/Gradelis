import * as XLSX from "xlsx";

export type ParsedStudentRow = {
  rowNumber: number;
  matricNumber: string;
  fullName: string;
  currentLevel: number;
  entrySession: string;
  status: "VALID" | "DUPLICATE_MATRIC" | "INVALID_DATA";
  errorMessage?: string;
};

export function downloadStudentTemplate() {
  const sampleData = [
    {
      "Matric Number": "ENG/2021/001",
      "First Name": "Emmanuel",
      "Middle Name": "Chukwuemeka",
      "Last Name": "Okonkwo",
      "Current Level": 400,
      "Entry Session": "2021/2022",
    },
    {
      "Matric Number": "ENG/2021/002",
      "First Name": "Amina",
      "Middle Name": "",
      "Last Name": "Bello",
      "Current Level": 400,
      "Entry Session": "2021/2022",
    },
    {
      "Matric Number": "ENG/2022/015",
      "First Name": "Chinedu",
      "Middle Name": "",
      "Last Name": "Eze",
      "Current Level": 300,
      "Entry Session": "2022/2023",
    },
    {
      "Matric Number": "ENG/2023/042",
      "First Name": "Fatima",
      "Middle Name": "",
      "Last Name": "Abubakar",
      "Current Level": 200,
      "Entry Session": "2023/2024",
    },
    {
      "Matric Number": "ENG/2024/099",
      "First Name": "David",
      "Middle Name": "",
      "Last Name": "Adeleke",
      "Current Level": 100,
      "Entry Session": "2024/2025",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths: Matric, First, Middle, Last, Level, Session
  worksheet["!cols"] = [
    { wch: 20 }, // Matric Number
    { wch: 18 }, // First Name
    { wch: 18 }, // Middle Name
    { wch: 18 }, // Last Name
    { wch: 15 }, // Current Level
    { wch: 18 }, // Entry Session
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students_Template");

  XLSX.writeFile(workbook, "gradelis_students_template.xlsx");
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[.:_\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Finds a column key whose normalized header matches one of the given
 * exact phrases. Exact matching (not `.includes`) is used here on purpose:
 * "first name", "last name", and "full name" all contain the substring
 * "name", so a loose `.includes("name")` match can't tell them apart.
 * This is what caused first/middle/last name columns to collapse into
 * whichever one happened to be found first.
 */
function findExactHeaderMatch(
  keys: string[],
  candidates: string[]
): string | undefined {
  return keys.find((k) => candidates.includes(normalizeHeader(k)));
}

export function parseStudentSpreadsheet(
  fileBuffer: ArrayBuffer,
  defaultSession: string
): {
  rows: ParsedStudentRow[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
} {
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("No worksheets found in this workbook.");
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error("Worksheet could not be read.");
  }

  const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (rawJson.length === 0) {
    throw new Error("The selected spreadsheet contains no data rows.");
  }

  const headerKeys = Object.keys(rawJson[0]);

  const matricKey = headerKeys.find((k) => {
    const norm = normalizeHeader(k);
    return (
      norm.includes("matric") ||
      norm.includes("reg no") ||
      norm.includes("registration")
    );
  });

  // ---------------------------------------------------------------------
  // Name columns. Two supported layouts:
  //  (A) split columns: "First Name" / "Middle Name" / "Last Name" (or
  //      "Surname"). This is checked FIRST because a loose substring
  //      match for "name" would otherwise grab "First Name" and silently
  //      drop Middle/Last.
  //  (B) a single combined "Full Name" / "Student Name" column, used as
  //      a fallback when no split columns are present.
  // ---------------------------------------------------------------------
  const firstNameKey = findExactHeaderMatch(headerKeys, [
    "first name",
    "firstname",
    "given name",
  ]);
  const middleNameKey = findExactHeaderMatch(headerKeys, [
    "middle name",
    "middlename",
    "other name",
    "other names",
  ]);
  const lastNameKey = findExactHeaderMatch(headerKeys, [
    "last name",
    "lastname",
    "surname",
    "family name",
  ]);

  const hasSplitNameColumns = Boolean(firstNameKey || lastNameKey);

  // Only used as a fallback when split columns aren't present.
  const fullNameKey = hasSplitNameColumns
    ? undefined
    : headerKeys.find((k) => {
        const norm = normalizeHeader(k);
        return (
          norm === "full name" ||
          norm === "student name" ||
          norm === "name" ||
          norm.includes("full name") ||
          norm.includes("student name")
        );
      });

  const levelKey = headerKeys.find((k) => {
    const norm = normalizeHeader(k);
    return (
      norm.includes("level") ||
      norm.includes("current level") ||
      norm.includes("year")
    );
  });

  const sessionKey = headerKeys.find((k) => {
    const norm = normalizeHeader(k);
    return (
      norm.includes("session") ||
      norm.includes("entry session") ||
      norm.includes("academic session")
    );
  });

  if (!matricKey) {
    throw new Error(
      "Missing required 'Matric Number' column. Please check your spreadsheet headers."
    );
  }

  if (!hasSplitNameColumns && !fullNameKey) {
    throw new Error(
      "Missing required name column(s). Provide either 'Full Name', or separate 'First Name' / 'Last Name' columns."
    );
  }

  const seenMatric = new Set<string>();
  const parsedRows: ParsedStudentRow[] = [];

  rawJson.forEach((row, index) => {
    const matricNumber = String(row[matricKey] ?? "").trim();

    let fullName: string;
    if (hasSplitNameColumns) {
      const first = firstNameKey ? String(row[firstNameKey] ?? "").trim() : "";
      const middle = middleNameKey ? String(row[middleNameKey] ?? "").trim() : "";
      const last = lastNameKey ? String(row[lastNameKey] ?? "").trim() : "";
      fullName = [first, middle, last].filter(Boolean).join(" ");
    } else {
      fullName = fullNameKey ? String(row[fullNameKey] ?? "").trim() : "";
    }

    if (!matricNumber && !fullName) {
      // Empty row, skip
      return;
    }

    const rawLevel = levelKey ? String(row[levelKey] ?? "").trim() : "";
    let currentLevel = 100;
    if (rawLevel) {
      const match = rawLevel.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num >= 1 && num <= 5) {
          currentLevel = num * 100;
        } else if (num >= 100 && num <= 500) {
          currentLevel = num;
        }
      }
    }

    const rawSession = sessionKey ? String(row[sessionKey] ?? "").trim() : "";
    const entrySession = rawSession || defaultSession || "2024/2025";

    let status: ParsedStudentRow["status"] = "VALID";
    let errorMessage: string | undefined = undefined;

    if (!matricNumber) {
      status = "INVALID_DATA";
      errorMessage = "Matric Number is empty.";
    } else if (!fullName) {
      status = "INVALID_DATA";
      errorMessage = hasSplitNameColumns
        ? "First Name and Last Name are both empty."
        : "Student Name is empty.";
    } else if (seenMatric.has(matricNumber.toLowerCase())) {
      status = "DUPLICATE_MATRIC";
      errorMessage = `Duplicate matric number '${matricNumber}' in this sheet.`;
    } else {
      seenMatric.add(matricNumber.toLowerCase());
    }

    parsedRows.push({
      rowNumber: index + 2,
      matricNumber,
      fullName,
      currentLevel,
      entrySession,
      status,
      errorMessage,
    });
  });

  const validCount = parsedRows.filter((r) => r.status === "VALID").length;
  const invalidCount = parsedRows.length - validCount;

  return {
    rows: parsedRows,
    totalRows: parsedRows.length,
    validCount,
    invalidCount,
  };
}
