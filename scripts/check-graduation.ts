import { prisma } from "@/lib/prisma";
import { ingestResultFile } from "@/lib/upload/ingest";
import { performGraduationRun } from "@/lib/graduation/run";
import { getGraduationRun, listGraduationRuns } from "@/lib/queries/graduation";
import { check, report, sheetFile } from "./_harness";

async function reset() {
  await prisma.eligibilityRunItem.deleteMany({});
  await prisma.graduationRun.deleteMany({});
  await prisma.uploadRow.deleteMany({});
  await prisma.uploadFile.deleteMany({});
  await prisma.uploadBatch.deleteMany({});
  await prisma.studentResult.deleteMany({});
}

async function main() {
  const lecturer = await prisma.user.findUniqueOrThrow({ where: { email: "lecturer@gradelis.com" } });
  const hod = await prisma.user.findUniqueOrThrow({ where: { email: "hod@gradelis.com" } });
  await reset();

  // Give the cohort real results via the actual upload pipeline.
  // CSC401(3u), CSC403(3u), CSC301(3u) are COMPULSORY. CSC407(2u) is ELECTIVE.
  await ingestResultFile(lecturer.id, sheetFile("CSC401", "2025/2026", [
    [1, "U2021/3020001", 75, "A"],
    [2, "U2021/3020002", 65, "B"],
    [3, "U2021/3020003", 30, "F"],   // fails a compulsory course
    [4, "U2021/3020004", 55, "C"],
  ]));
  await ingestResultFile(lecturer.id, sheetFile("CSC403", "2025/2026", [
    [1, "U2021/3020001", 70, "A"],
    [2, "U2021/3020002", 60, "B"],
    [3, "U2021/3020003", 50, "C"],
    [4, "U2021/3020004", 45, "D"],
  ]));
  await ingestResultFile(lecturer.id, sheetFile("CSC301", "2024/2025", [
    [1, "U2021/3020001", 80, "A"],
    [2, "U2021/3020002", 55, "C"],
    [3, "U2021/3020003", 65, "B"],
    // 3020004 has no CSC301 result at all -> missing compulsory
  ]));
  check("results committed", await prisma.studentResult.count(), 11);

  console.log("\n--- a run over a real cohort ---");
  const first = await performGraduationRun(hod.id, "2021/2022");
  check("run succeeded", first.ok, true);
  if (!first.ok) { console.log(first.message); process.exit(1); }

  const runId = first.data.runId;
  const run = (await getGraduationRun(runId))!;
  check("status COMPLETED", run.status, "COMPLETED");
  check("completedAt set", run.completedAt !== null, true);
  check("policy snapshotted onto the run", run.policy, { minCgpa: 1, minCreditUnits: 120 });
  check("one item per active student", run.items.length, 8);
  check("eligible + pending covers everyone", run.eligible.length + run.pending.length, 8);

  console.log("\n--- every pending student has a real reason (R5) ---");
  check("no pending row is unexplained", run.pending.every((i) => i.remarks.length > 0), true);
  check("no remark is a stub", run.pending.every((i) => i.remarks.every((r) => r.message.trim().length > 10)), true);

  const failedCompulsory = run.pending.find((i) => i.student.matricNumber === "U2021/3020003")!;
  check("the CSC401 failure is named", failedCompulsory.remarks.some((r) => r.message.includes("CSC401")), true);
  const missingCourse = run.pending.find((i) => i.student.matricNumber === "U2021/3020004")!;
  check("the missing compulsory course is named", missingCourse.remarks.some((r) => r.rule === "ALL_COMPULSORY_PASSED" && r.message.includes("CSC301")), true);

  const noResults = run.pending.find((i) => i.student.matricNumber === "U2021/3020007")!;
  check("a student with no results still gets reasons", noResults.remarks.length > 0, true);
  check("their CGPA is 0, not NaN", noResults.cgpa, 0);

  console.log("\n--- CGPA is credit-weighted ---");
  const top = run.items.find((i) => i.student.matricNumber === "U2021/3020001")!;
  // 5*3 + 5*3 + 5*3 = 45 over 9 units = 5.00
  check("straight-A student is 5.00", top.cgpa, 5);
  const mixed = run.items.find((i) => i.student.matricNumber === "U2021/3020002")!;
  // B(4)*3 + B(4)*3 + C(3)*3 = 33 over 9 = 3.67
  check("mixed student is 3.67", mixed.cgpa, 3.67);

  console.log("\n--- determinism: run it again over untouched data ---");
  const second = await performGraduationRun(hod.id, "2021/2022");
  check("second run succeeded", second.ok, true);
  if (!second.ok) process.exit(1);
  check("a NEW run id (R9)", second.data.runId !== runId, true);

  const runB = (await getGraduationRun(second.data.runId))!;
  const triple = (r: typeof run) =>
    r.items.map((i) => [i.student.matricNumber, i.cgpa, i.eligible]);
  check("identical (student, cgpa, eligible) triples", triple(runB), triple(run));
  check("identical remarks", runB.pending.map((i) => i.remarks), run.pending.map((i) => i.remarks));

  console.log("\n--- immutability: new data must not rewrite an old run (R9) ---");
  const beforeCgpa = missingCourse.cgpa;
  const beforeEligible = missingCourse.eligible;

  // 3020004 finally passes the compulsory course they were missing.
  await ingestResultFile(lecturer.id, sheetFile("CSC301", "2025/2026", [[1, "U2021/3020004", 70, "A"]]));
  check("the new result landed", await prisma.studentResult.count(), 12);

  const rereadFirst = (await getGraduationRun(runId))!;
  const sameStudent = rereadFirst.items.find((i) => i.student.matricNumber === "U2021/3020004")!;
  check("old run's CGPA unchanged", sameStudent.cgpa, beforeCgpa);
  check("old run's verdict unchanged", sameStudent.eligible, beforeEligible);
  check("old run still says the course is missing", sameStudent.remarks.some((r) => r.message.includes("CSC301")), true);

  const third = await performGraduationRun(hod.id, "2021/2022");
  if (!third.ok) process.exit(1);
  const runC = (await getGraduationRun(third.data.runId))!;
  const nowStudent = runC.items.find((i) => i.student.matricNumber === "U2021/3020004")!;
  check("the NEW run sees the new result", nowStudent.cgpa > beforeCgpa, true);
  check("CSC301 is no longer named as missing", nowStudent.remarks.some((r) => r.message.includes("CSC301")), false);
  check("but CSC405, still unsat, is", nowStudent.remarks.some((r) => r.message.includes("CSC405")), true);

  console.log("\n--- resit: latest attempt supersedes ---");
  await ingestResultFile(lecturer.id, sheetFile("CSC401", "2026/2027", [[1, "U2021/3020003", 70, "A"]]));
  const fourth = await performGraduationRun(hod.id, "2021/2022");
  if (!fourth.ok) process.exit(1);
  const runD = (await getGraduationRun(fourth.data.runId))!;
  const resat = runD.items.find((i) => i.student.matricNumber === "U2021/3020003")!;
  check("the failed first attempt no longer counts", resat.remarks.some((r) => r.rule === "NO_OUTSTANDING_FAILURES"), false);
  check("CGPA reflects the resit, not the fail", resat.cgpa > failedCompulsory.cgpa, true);

  console.log("\n--- empty cohort fails cleanly ---");
  const empty = await performGraduationRun(hod.id, "1999/2000");
  check("refused", empty.ok, false);
  const failedRun = (await prisma.graduationRun.findFirstOrThrow({
    where: { academicSession: "1999/2000" },
  }));
  check("run marked FAILED, not left RUNNING", failedRun.status, "FAILED");
  check("completedAt set on the failed run", failedRun.completedAt !== null, true);
  check("no items written for it", await prisma.eligibilityRunItem.count({ where: { graduationRunId: failedRun.id } }), 0);

  console.log("\n--- run history ---");
  const runs = await listGraduationRuns();
  check("five runs recorded", runs.length, 5);
  check("newest first", runs[0].createdAt >= runs[runs.length - 1].createdAt, true);
  check("no run was ever overwritten", new Set(runs.map((r) => r.id)).size, 5);

  console.log("\n--- SQL check: no unexplained pending item ---");
  const orphans = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM "EligibilityRunItem"
     WHERE eligible = false AND (remarks IS NULL OR jsonb_array_length(remarks) = 0)`,
  );
  check("zero rows", Number(orphans[0].count), 0);

  await reset();
  await prisma.$disconnect();
  report();
}
main();
