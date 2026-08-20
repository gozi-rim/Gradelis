import * as XLSX from "xlsx";

export type ParsedStaffRow = {
  rowNumber: number;
  name: string;
  email: string;
  role: "LECTURER" | "HOD" | "SYSTEM_ADMIN";
  status: "VALID" | "DUPLICATE_EMAIL" | "INVALID_DATA";
  errorMessage?: string;
  generatedPassword?: string;
};

export type StaffCredentialItem = {
  name: string;
  email: string;
  role: string;
  temporaryPassword: string;
  status: string;
};

/**
 * Generates an 8-character secure alphanumeric temporary password
 * e.g. "K9m#Q2vL" or "Tx84Bw9Z"
 */
export function generateTemporaryPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%*";

  let password = "";
  // Ensure at least one of each category
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  const allChars = upper + lower + digits + special;
  while (password.length < 8) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle password characters
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

export function downloadStaffTemplate() {
  const sampleData = [
    {
      "Full Name": "Dr. Kelvin Bello",
      Email: "kelvin.bello@university.edu.ng",
      Role: "LECTURER",
    },
    {
      "Full Name": "Dr. Grace Ibrahim",
      Email: "grace.ibrahim@university.edu.ng",
      Role: "LECTURER",
    },
    {
      "Full Name": "Dr. Emeka Nwosu",
      Email: "emeka.nwosu@university.edu.ng",
      Role: "LECTURER",
    },
    {
      "Full Name": "Prof. Ibrahim Musa",
      Email: "ibrahim.musa@university.edu.ng",
      Role: "HOD",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  worksheet["!cols"] = [
    { wch: 30 }, // Full Name
    { wch: 35 }, // Email
    { wch: 18 }, // Role
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Staff_Template");

  XLSX.writeFile(workbook, "gradelis_staff_template.xlsx");
}

export function exportStaffCredentialsToExcel(credentials: StaffCredentialItem[]) {
  const exportData = credentials.map((item, idx) => ({
    "S/N": idx + 1,
    "Full Name": item.name,
    "Email Address": item.email,
    Role: item.role,
    "Temporary Password": item.temporaryPassword,
    "Account Status": item.status,
    "Created Date": new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 35 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Staff_Credentials");

  XLSX.writeFile(
    workbook,
    `gradelis_staff_credentials_${new Date().toISOString().split("T")[0]}.xlsx`
  );
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

export function parseStaffSpreadsheet(fileBuffer: ArrayBuffer): {
  rows: ParsedStaffRow[];
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

  const nameKey = Object.keys(rawJson[0]).find((k) => {
    const norm = normalizeHeader(k);
    return (
      norm.includes("name") ||
      norm.includes("full name") ||
      norm.includes("staff name") ||
      norm.includes("lecturer")
    );
  });

  const emailKey = Object.keys(rawJson[0]).find((k) => {
    const norm = normalizeHeader(k);
    return norm.includes("email") || norm.includes("mail");
  });

  const roleKey = Object.keys(rawJson[0]).find((k) => {
    const norm = normalizeHeader(k);
    return (
      norm.includes("role") ||
      norm.includes("designation") ||
      norm.includes("position")
    );
  });

  if (!nameKey) {
    throw new Error(
      "Missing required 'Full Name' column. Please check your spreadsheet headers."
    );
  }

  if (!emailKey) {
    throw new Error(
      "Missing required 'Email' column. Please check your spreadsheet headers."
    );
  }

  const seenEmail = new Set<string>();
  const parsedRows: ParsedStaffRow[] = [];

  rawJson.forEach((row, index) => {
    const name = String(row[nameKey] ?? "").trim();
    const email = String(row[emailKey] ?? "").trim();

    if (!name && !email) {
      return;
    }

    const rawRole = roleKey ? String(row[roleKey] ?? "").trim().toUpperCase() : "";
    let role: "LECTURER" | "HOD" | "SYSTEM_ADMIN" = "LECTURER";
    if (rawRole.includes("ADMIN")) {
      role = "SYSTEM_ADMIN";
    } else if (rawRole.includes("HOD") || rawRole.includes("HEAD")) {
      role = "HOD";
    } else {
      role = "LECTURER";
    }

    let status: ParsedStaffRow["status"] = "VALID";
    let errorMessage: string | undefined = undefined;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name) {
      status = "INVALID_DATA";
      errorMessage = "Staff Name is empty.";
    } else if (!email) {
      status = "INVALID_DATA";
      errorMessage = "Email address is empty.";
    } else if (!emailRegex.test(email)) {
      status = "INVALID_DATA";
      errorMessage = `Invalid email format: '${email}'`;
    } else if (seenEmail.has(email.toLowerCase())) {
      status = "DUPLICATE_EMAIL";
      errorMessage = `Duplicate email '${email}' in this file.`;
    } else {
      seenEmail.add(email.toLowerCase());
    }

    parsedRows.push({
      rowNumber: index + 2,
      name,
      email,
      role,
      status,
      errorMessage,
      generatedPassword: status === "VALID" ? generateTemporaryPassword() : undefined,
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
