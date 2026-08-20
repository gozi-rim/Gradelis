import { prisma } from "@/lib/prisma";
import { ingestResultFile } from "@/lib/upload/ingest";
import { getReviewQueue } from "@/lib/queries/review-queue";
import {
  applyFileRejection,
  applyFileResolution,
  applyRowRejection,
  applyRowResolution,
} from "@/lib/upload/resolve";
import { check, report, sheetFile } from "./_harness";

async function reset() {
  await prisma.uploadRow.deleteMany({});
  await prisma.uploadFile.deleteMany({});
  await prisma.uploadBatch.deleteMany({});
  await prisma.studentResult.deleteMany({});
}

async function main() {
  const lecturer = await prisma.user.findUniqueOrThrow({ where: { email: "lecturer@gradelis.com" } });
  const hod = await prisma.user.findUniqueOrThrow({ where: { email: "hod@gradelis.com" } });
  await reset();

  console.log("\n--- queue only shows what is still open ---");
  await ingestResultFile(lecturer.id, sheetFile("CSC401", "2025/2026", [
    [1, "U2021/3020001", 75, "A"],   // clean -> imported
    [2, "U2021/3020002", 65, "B"],   // clean -> imported
    [3, "U2021/30200003", 55, "C"],  // extra digit -> UNMATCHED_STUDENT, nearest is ...0003
    [4, "U2021/3020003", 45, "A"],   // GRADE_MISMATCH
  ]));

  let queue = await getReviewQueue();
  check("one batch waiting", queue.length, 1);
  check("one file", queue[0].files.length, 1);
  check("two open rows", queue[0].files[0].rows.length, 2);
  check("imported rows are hidden", queue[0].files[0].rows.every((r) => r.status !== "IMPORTED"), true);
  check("totalRows still counts everything", queue[0].files[0].totalRows, 4);
  check("two results already committed", await prisma.studentResult.count(), 2);

  const typo = queue[0].files[0].rows.find((r) => r.status === "UNMATCHED_STUDENT")!;
  check("typo row got suggestions", typo.studentCandidates.length > 0, true);
  check("nearest student ranked first", typo.studentCandidates[0].item.matricNumber, "U2021/3020003");
  check("suggestions are sorted best-first", typo.studentCandidates.map((c) => c.score), [...typo.studentCandidates.map((c) => c.score)].sort((a, b) => b - a));
  check("ranking is stable across calls", (await getReviewQueue())[0].files[0].rows.find((r) => r.status === "UNMATCHED_STUDENT")!.studentCandidates.map((c) => c.item.id), typo.studentCandidates.map((c) => c.item.id));

  console.log("\n--- approve a row with a corrected student ---");
  // The typo'd row actually belongs to 3020004.
  const target = await prisma.student.findUniqueOrThrow({ where: { matricNumber: "U2021/3020004" } });
  const approved = await applyRowResolution(hod.id, { rowId: typo.id, studentId: target.id });
  check("approved", approved.ok, true);
  const approvedRow = await prisma.uploadRow.findUniqueOrThrow({ where: { id: typo.id } });
  check("row now IMPORTED", approvedRow.status, "IMPORTED");
  check("row linked to a result", approvedRow.studentResultId !== null, true);
  check("audit: who", approvedRow.resolvedById, hod.id);
  check("audit: when", approvedRow.resolvedAt !== null, true);
  check("audit: note", approvedRow.resolutionNote, "Approved by HOD after review.");
  check("three results now", await prisma.studentResult.count(), 3);

  const viaApproval = await prisma.studentResult.findFirstOrThrow({ where: { studentId: target.id } });
  check("approved row went through the same commit path", [viaApproval.status, viaApproval.grade, viaApproval.gradePoint], ["POSTED", "C", 3]);

  console.log("\n--- reject the remaining row ---");
  queue = await getReviewQueue();
  const mismatch = queue[0].files[0].rows.find((r) => r.status === "GRADE_MISMATCH")!;
  const rejected = await applyRowRejection(hod.id, { rowId: mismatch.id, note: "Adviser to re-check the script." });
  check("rejected", rejected.ok, true);
  const rejectedRow = await prisma.uploadRow.findUniqueOrThrow({ where: { id: mismatch.id } });
  check("row REJECTED, not deleted", rejectedRow.status, "REJECTED");
  check("reason kept", rejectedRow.resolutionNote, "Adviser to re-check the script.");
  check("no result written for it", rejectedRow.studentResultId, null);

  console.log("\n--- settling the last item completes the file and batch ---");
  const file = await prisma.uploadFile.findFirstOrThrow({ where: { fileName: "CSC401.xlsx" } });
  check("file COMPLETED", file.status, "COMPLETED");
  check("batch COMPLETED", (await prisma.uploadBatch.findUniqueOrThrow({ where: { id: file.uploadBatchId } })).status, "COMPLETED");
  check("queue is now empty", (await getReviewQueue()).length, 0);

  console.log("\n--- double-settle is refused ---");
  check("re-approve refused", (await applyRowResolution(hod.id, { rowId: typo.id })).ok, false);
  check("re-reject refused", (await applyRowRejection(hod.id, { rowId: mismatch.id, note: "again" })).ok, false);

  console.log("\n--- fix a bad course code, rows import behind it ---");
  await reset();
  await ingestResultFile(lecturer.id, sheetFile("CSC4O1", "2025/2026", [
    [1, "U2021/3020001", 75, "A"],
    [2, "U2021/3020002", 65, "B"],
  ]));
  queue = await getReviewQueue();
  const badFile = queue[0].files[0];
  check("file flagged UNMATCHED_COURSE", badFile.status, "UNMATCHED_COURSE");
  check("course suggestions offered", badFile.courseCandidates.length > 0, true);
  check("top course suggestion is CSC401", badFile.courseCandidates[0].item.code, "CSC401");
  check("rows cannot be approved yet", (await applyRowResolution(hod.id, { rowId: badFile.rows[0]?.id ?? "none" })).ok, false);
  check("nothing imported yet", await prisma.studentResult.count(), 0);

  const fixed = await applyFileResolution(hod.id, { fileId: badFile.id, courseCode: "CSC401" });
  check("resolved", fixed.ok, true);
  if (fixed.ok) check("both rows imported behind the fix", fixed.data.imported, 2);
  const fixedFile = await prisma.uploadFile.findUniqueOrThrow({ where: { id: badFile.id } });
  check("file now COMPLETED", fixedFile.status, "COMPLETED");
  check("file linked to the right course", fixedFile.matchedCourseId !== null, true);
  check("audit: who fixed it", fixedFile.resolvedById, hod.id);
  check("audit: note", fixedFile.resolutionNote, "Course code corrected to CSC401.");
  check("two results", await prisma.studentResult.count(), 2);

  console.log("\n--- rejecting a file cascades, but spares what already imported ---");
  await reset();
  await ingestResultFile(lecturer.id, sheetFile("CSC403", "2025/2026", [
    [1, "U2021/3020001", 75, "A"],   // imports immediately
    [2, "U2021/302000X", 55, "C"],   // stays open
    [3, "U2021/302000Y", 60, "B"],   // stays open
  ]));
  const f2 = await prisma.uploadFile.findFirstOrThrow({ where: { fileName: "CSC403.xlsx" } });
  check("one imported before rejection", await prisma.studentResult.count(), 1);

  const killed = await applyFileRejection(hod.id, { fileId: f2.id, note: "Wrong sheet uploaded." });
  check("rejected", killed.ok, true);
  if (killed.ok) check("two open rows cascaded", killed.data.rowsRejected, 2);

  const after = await prisma.uploadFile.findUniqueOrThrow({ where: { id: f2.id }, include: { rows: true } });
  check("file REJECTED", after.status, "REJECTED");
  check("reason kept", after.resolutionNote, "Wrong sheet uploaded.");
  const tally: Record<string, number> = {};
  for (const r of after.rows) tally[r.status] = (tally[r.status] ?? 0) + 1;
  check("imported row untouched by the rejection", tally, { IMPORTED: 1, REJECTED: 2 });
  check("its StudentResult still stands", await prisma.studentResult.count(), 1);
  check("rows of a rejected file cannot be approved", (await applyRowResolution(hod.id, { rowId: after.rows.find((r) => r.status === "REJECTED")!.id })).ok, false);
  check("batch COMPLETED once nothing is open", (await prisma.uploadBatch.findUniqueOrThrow({ where: { id: after.uploadBatchId } })).status, "COMPLETED");
  check("queue empty again", (await getReviewQueue()).length, 0);

  console.log("\n--- the §9 invariant ---");
  const rows = await prisma.uploadRow.findMany({ where: { studentResultId: { not: null } } });
  check("every committed row is IMPORTED", rows.every((r) => r.status === "IMPORTED"), true);
  const resultIds = new Set((await prisma.studentResult.findMany({ select: { id: true } })).map((r) => r.id));
  const linked = new Set(rows.map((r) => r.studentResultId!));
  check("no StudentResult exists without an IMPORTED row behind it", [...resultIds].every((id) => linked.has(id)), true);

  await reset();
  await prisma.$disconnect();
  report();
}
main();
