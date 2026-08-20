import * as XLSX from "xlsx";

let failures = 0;

const norm = (v: unknown) =>
  JSON.stringify(v, (_k, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val).sort(([a], [b]) => a.localeCompare(b)))
      : val,
  );

export function check(label: string, actual: unknown, expected: unknown) {
  const pass = norm(actual) === norm(expected);
  if (!pass) failures += 1;
  console.log(
    `${pass ? "ok  " : "FAIL"}  ${label} -> ${norm(actual)}${pass ? "" : ` (expected ${norm(expected)})`}`,
  );
}

export function report(): never {
  console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

/** Build a File shaped like the real UNIPORT result template. */
export function sheetFile(
  courseCode: string,
  session: string,
  rows: (string | number)[][],
  semester = "First Semester",
): File {
  const aoa: (string | number)[][] = [
    ["DEPARTMENT OF COMPUTER SCIENCE"],
    [],
    ["Course Code", courseCode, "", "Session", session],
    ["", "", "", "Semester", semester],
    ["", "", "", "Credit Unit", 3],
    [],
    ["S/N", "Matric Number", "Total Score (100)", "Grade"],
    ...rows,
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Results");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new File([buf], `${courseCode}.xlsx`, { type: "application/vnd.ms-excel" });
}
