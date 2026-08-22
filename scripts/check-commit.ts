import { prisma } from "@/lib/prisma";
import { ingestResultFile } from "@/lib/upload/ingest";
import { check, componentSheetFile, report, sheetFile } from "./_harness";

async function reset() {
  await prisma.uploadRow.deleteMany({});
  await prisma.uploadFile.deleteMany({});
  await prisma.uploadBatch.deleteMany({});
  await prisma.studentResult.deleteMany({});
}

async function main() {
  const lecturer = await prisma.user.findUniqueOrThrow({ where: { email: "lecturer@gradelis.com" } });
  await reset();

  console.log("\n--- a fully clean sheet commits itself ---");
  const clean = await ingestResultFile(lecturer.id, sheetFile("CSC401", "2025/2026", [
    [1, "U2021/3020001", 75, "A"],
    [2, "U2021/3020002", 65, "B"],
    [3, "U2021/3020003", 42, "E"],
  ]));
  check("ok", clean.ok, true);
  if (!clean.ok) { console.log(clean.message); process.exit(1); }
  check("imported count returned", clean.imported, 3);
  check("nothing flagged", clean.flagged, 0);

  const batch = await prisma.uploadBatch.findUniqueOrThrow({
    where: { id: clean.batchId },
    include: { files: { include: { rows: true } } },
  });
  check("batch COMPLETED", batch.status, "COMPLETED");
  check("file COMPLETED", batch.files[0].status, "COMPLETED");
  check("every row IMPORTED", batch.files[0].rows.every((r) => r.status === "IMPORTED"), true);
  check("every row linked to a result", batch.files[0].rows.every((r) => r.studentResultId !== null), true);
  check("flagged rows cleared their error", batch.files[0].rows.every((r) => r.errorMessage === null), true);

  const results = await prisma.studentResult.findMany();
  check("three StudentResult rows", results.length, 3);
  check("all POSTED", results.every((r) => r.status === "POSTED"), true);
  check("all attempt 1", results.every((r) => r.attemptNumber === 1), true);
  check("75 -> A / 5", [results.find((r) => r.score === 75)!.grade, results.find((r) => r.score === 75)!.gradePoint], ["A", 5]);
  check("42 -> E / 1", [results.find((r) => r.score === 42)!.grade, results.find((r) => r.score === 42)!.gradePoint], ["E", 1]);

  console.log("\n--- the sheet's grade column does not win ---");
  await reset();
  const lying = await ingestResultFile(lecturer.id, sheetFile("CSC401", "2025/2026", [[1, "U2021/3020001", 45, "A"]]));
  if (lying.ok) {
    check("nothing imported", lying.imported, 0);
    const f = await prisma.uploadFile.findFirstOrThrow({ where: { uploadBatchId: lying.batchId }, include: { rows: true } });
    check("row left GRADE_MISMATCH", f.rows[0].status, "GRADE_MISMATCH");
    check("file NOT completed", f.status === "COMPLETED", false);
    check("no StudentResult written", await prisma.studentResult.count(), 0);
  }

  console.log("\n--- partial sheet: nothing completes while an item waits ---");
  await reset();
  const partial = await ingestResultFile(lecturer.id, sheetFile("CSC401", "2025/2026", [
    [1, "U2021/3020001", 75, "A"],
    [2, "U2021/3020002", 65, "B"],
    [3, "U2021/3020003", 55, "C"],
    [4, "U2099/1111111", 60, "B"],
    [5, "U2099/2222222", 50, "C"],
  ]));
  if (partial.ok) {
    check("3 imported", partial.imported, 3);
    check("2 flagged", partial.flagged, 2);
    const f = await prisma.uploadFile.findFirstOrThrow({ where: { uploadBatchId: partial.batchId }, include: { rows: true } });
    const tally: Record<string, number> = {};
    for (const r of f.rows) tally[r.status] = (tally[r.status] ?? 0) + 1;
    check("row tally", tally, { IMPORTED: 3, UNMATCHED_STUDENT: 2 });
    check("file still VALID, not COMPLETED", f.status, "VALID");
    check("batch still PROCESSING", (await prisma.uploadBatch.findUniqueOrThrow({ where: { id: partial.batchId } })).status, "PROCESSING");
    check("only 3 StudentResults", await prisma.studentResult.count(), 3);
  }

  console.log("\n--- resit: same course, later session ---");
  await reset();
  await ingestResultFile(lecturer.id, sheetFile("CSC401", "2024/2025", [[1, "U2021/3020001", 35, "F"]]));
  await ingestResultFile(lecturer.id, sheetFile("CSC401", "2025/2026", [[1, "U2021/3020001", 65, "B"]]));
  const attempts = await prisma.studentResult.findMany({
    where: { course: { code: "CSC401" } }, orderBy: { attemptNumber: "asc" },
  });
  check("two attempts exist", attempts.length, 2);
  check("attempt numbers", attempts.map((a) => a.attemptNumber), [1, 2]);
  check("first attempt untouched", [attempts[0].score, attempts[0].academicSession], [35, "2024/2025"]);
  check("second attempt is the resit", [attempts[1].score, attempts[1].academicSession], [65, "2025/2026"]);

  console.log("\n--- same course, same session, twice ---");
  const dupe = await ingestResultFile(lecturer.id, sheetFile("CSC401", "2025/2026", [[1, "U2021/3020001", 70, "A"]]));
  if (dupe.ok) {
    check("nothing imported the second time", dupe.imported, 0);
    const f = await prisma.uploadFile.findFirstOrThrow({ where: { uploadBatchId: dupe.batchId }, include: { rows: true } });
    check("row flagged DUPLICATE", f.rows[0].status, "DUPLICATE");
    check("still only two results", await prisma.studentResult.count(), 2);
  }

  console.log("\n--- the real template shape: CA + Exam, no Total column filled ---");
  await reset();
  const components = await ingestResultFile(lecturer.id, componentSheetFile("CSC401", "2025/2026", [
    [1, "U2021/3020001", 25, 55],   // 80 -> A
    [2, "U2021/3020002", 18, 20],   // 38 -> F, a real fail not a missing score
    [3, "U2021/3020003", 45, 40],   // CA above 30
    [4, "U2021/3020004", 20],       // exam blank
  ]));
  check("ok", components.ok, true);
  if (components.ok) {
    check("two clean rows imported", components.imported, 2);
    const f = await prisma.uploadFile.findFirstOrThrow({ where: { uploadBatchId: components.batchId }, include: { rows: true } });
    const by = new Map(f.rows.map((r) => [r.matricNumberRaw, r]));

    check("25 + 55 stored as 80", by.get("U2021/3020001")!.score, 80);
    check("18 + 20 stored as 38", by.get("U2021/3020002")!.score, 38);
    check("raw components kept for audit", [by.get("U2021/3020001")!.caScoreRaw, by.get("U2021/3020001")!.examScoreRaw], ["25", "55"]);

    const derived = await prisma.studentResult.findFirstOrThrow({ where: { score: 80 } });
    check("grade derived from the computed total", [derived.grade, derived.gradePoint], ["A", 5]);
    const failing = await prisma.studentResult.findFirstOrThrow({ where: { score: 38 } });
    check("a genuine fail is imported, not flagged", [failing.grade, failing.gradePoint], ["F", 0]);

    check("CA above 30 flagged", by.get("U2021/3020003")!.status, "INVALID_SCORE");
    check("and says which component", by.get("U2021/3020003")!.errorMessage?.includes("0-30"), true);
    check("half-filled row flagged", by.get("U2021/3020004")!.status, "INVALID_SCORE");
    check("and says which half", by.get("U2021/3020004")!.errorMessage?.includes("exam score is blank"), true);
  }

  await reset();
  await prisma.$disconnect();
  report();
}
main();
