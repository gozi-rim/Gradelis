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
      "Full Name": "Emmanuel Okonkwo",
      "Current Level": 400,
      "Entry Session": "2021/2022",
    },
    {
      "Matric Number": "ENG/2021/002",
      "Full Name": "Amina Bello",
      "Current Level": 400,
      "Entry Session": "2021/2022",
    },
    {
      "Matric Number": "ENG/2022/015",
      "Full Name": "Chinedu Eze",
      "Current Level": 300,
      "Entry Session": "2022/2023",
    },
    {
      "Matric Number": "ENG/2023/042",
      "Full Name": "Fatima Abubakar",
      "Current Level": 200,
      "Entry Session": "2023/2024",
    },
    {
      "Matric Number": "ENG/2024/099",
      "Full Name": "David Adeleke",
      "Current Level": 100,
      "Entry Session": "2024/2025",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 20 }, // Matric Number
    { wch: 30 }, // Full Name
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

  const matricKey = Object.keys(rawJson[0]).find((k) => {
    const norm = normalizeHeader(k);
    return (
      norm.includes("matric") ||
      norm.includes("reg no") ||
      norm.includes("registration")
    );
  });

  const nameKey = Object.keys(rawJson[0]).find((k) => {
    const norm = normalizeHeader(k);
    return (
      norm.includes("name") ||
      norm.includes("student name") ||
      norm.includes("full name")
    );
  });

  const levelKey = Object.keys(rawJson[0]).find((k) => {
    const norm = normalizeHeader(k);
    return (
      norm.includes("level") ||
      norm.includes("current level") ||
      norm.includes("year")
    );
  });

  const sessionKey = Object.keys(rawJson[0]).find((k) => {
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

  if (!nameKey) {
    throw new Error(
      "Missing required 'Full Name' column. Please check your spreadsheet headers."
    );
  }

  const seenMatric = new Set<string>();
  const parsedRows: ParsedStudentRow[] = [];

  rawJson.forEach((row, index) => {
    const matricNumber = String(row[matricKey] ?? "").trim();
    const fullName = String(row[nameKey] ?? "").trim();

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
      errorMessage = "Student Name is empty.";
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
