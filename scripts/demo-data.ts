import { prisma } from "@/lib/prisma";
import { ingestResultFile } from "@/lib/upload/ingest";
import { performGraduationRun } from "@/lib/graduation/run";
import { sheetFile } from "./_harness";

/** Fill the app with something worth looking at. */
async function main() {
  const lecturer = await prisma.user.findUniqueOrThrow({ where: { email: "lecturer@gradelis.com" } });
  const hod = await prisma.user.findUniqueOrThrow({ where: { email: "hod@gradelis.com" } });

  await prisma.eligibilityRunItem.deleteMany({});
  await prisma.graduationRun.deleteMany({});
  await prisma.uploadRow.deleteMany({});
  await prisma.uploadFile.deleteMany({});
  await prisma.uploadBatch.deleteMany({});
  await prisma.studentResult.deleteMany({});

  // Clean sheet: imports itself, never reaches the queue.
  await ingestResultFile(lecturer.id, sheetFile("CSC403", "2025/2026", [
    [1, "U2021/3020001", 72, "A"],
    [2, "U2021/3020002", 61, "B"],
    [3, "U2021/3020003", 55, "C"],
    [4, "U2021/3020004", 48, "D"],
  ]));

  // Messy sheet: two rows import, four land in the queue.
  await ingestResultFile(lecturer.id, sheetFile("CSC401", "2025/2026", [
    [1, "U2021/3020001", 75, "A"],
    [2, "U2021/3020002", 66, "B"],
    [3, "U2021/30200003", 58, "C"],  // extra digit -> unknown student
    [4, "U2021/3020004", 45, "A"],   // 45 is a D, not an A
    [5, "U2021/3020005", "", ""],    // no score recorded
    [6, "U2021/3020001", 80, "A"],   // same student twice
  ]));

  // Whole file unmatched: the course code is mistyped.
  await ingestResultFile(lecturer.id, sheetFile("CSC4O5", "2025/2026", [
    [1, "U2021/3020001", 68, "B"],
    [2, "U2021/3020002", 52, "C"],
  ], "Second Semester"));

  // One completed graduation run to look at.
  const run = await performGraduationRun(hod.id, "2021/2022");

  const queue = await prisma.uploadRow.count({
    where: { status: { in: ["UNMATCHED_STUDENT", "DUPLICATE", "INVALID_SCORE", "GRADE_MISMATCH"] } },
  });

  console.log(`demo data ready:
  ${await prisma.studentResult.count()} results committed
  ${queue} rows waiting in the HOD queue
  1 file flagged UNMATCHED_COURSE
  graduation run: ${run.ok ? `${run.data.eligible} eligible, ${run.data.pending} pending` : run.message}`);

  await prisma.$disconnect();
}
main();
