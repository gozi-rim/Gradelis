import "server-only";
import { UploadFileStatus, UploadRowStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { type ActionResult, fail, ok } from "@/lib/actions/result";
import { isValidScore } from "@/lib/grading";
import { classifyRows } from "./classify";
import { commitRow } from "./commit";
import { commitValidRows, syncBatchStatus } from "./commit-batch";
import { normalizeCourseCode, normalizeMatric, normalizeSession } from "./normalize";

const SETTLED_ROWS: UploadRowStatus[] = [
  UploadRowStatus.IMPORTED,
  UploadRowStatus.REJECTED,
];

/** Fix a file's course code, re-check its rows, then save whatever is now clean. */
export async function applyFileResolution(
  actorId: string,
  input: { fileId: string; courseCode: string; note?: string },
): Promise<ActionResult<{ imported: number }>> {
  const file = await prisma.uploadFile.findUnique({
    where: { id: input.fileId },
    include: { rows: true },
  });
  if (!file) return fail("That upload file no longer exists.");
  if (file.status === UploadFileStatus.REJECTED) return fail("That file was already rejected.");

  const key = normalizeCourseCode(input.courseCode);
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, code: true },
  });
  const course = courses.find((c) => normalizeCourseCode(c.code) === key);
  if (!course) return fail(`No active course matches "${input.courseCode}".`);

  const academicSession = normalizeSession(file.academicSessionRaw);
  if (!academicSession) return fail("This file's academic session could not be read.");

  // We know the course now, so we can finally check for duplicates.
  const students = await prisma.student.findMany({ select: { id: true, matricNumber: true } });
  const studentsByMatric = new Map(students.map((s) => [normalizeMatric(s.matricNumber), s.id]));

  const existing = await prisma.studentResult.findMany({
    where: { courseId: course.id, academicSession },
    select: { studentId: true },
  });

  const reclassifiable = file.rows.filter((r) => !SETTLED_ROWS.includes(r.status));

  const reclassified = classifyRows({
    // Re-check from what the sheet actually said, so a row keeps its real reason.
    rows: reclassifiable.map((r) => ({
      matricNo: r.matricNumberRaw,
      caScore: r.caScoreRaw ?? "",
      examScore: r.examScoreRaw ?? "",
      totalScore:
        r.caScoreRaw || r.examScoreRaw ? "" : r.score === null ? "" : String(r.score),
      grade: r.gradeRaw ?? "",
    })),
    studentsByMatric,
    studentsWithExistingResult: new Set(existing.map((e) => e.studentId)),
    courseKnown: true,
  });

  const imported = await prisma.$transaction(
    async (tx) => {
      await tx.uploadFile.update({
        where: { id: input.fileId },
        data: {
          matchedCourseId: course.id,
          status: UploadFileStatus.VALID,
          errorMessage: null,
          resolvedById: actorId, // who fixed it
          resolvedAt: new Date(),
          resolutionNote: input.note ?? `Course code corrected to ${course.code}.`,
        },
      });

      for (const [index, row] of reclassifiable.entries()) {
        const next = reclassified[index];
        await tx.uploadRow.update({
          where: { id: row.id },
          data: {
            matchedStudentId: next.matchedStudentId,
            status: next.status,
            errorMessage: next.errorMessage,
          },
        });
      }

      const count = await commitValidRows(tx, input.fileId);
      await syncBatchStatus(tx, file.uploadBatchId);
      return count;
    },
    { timeout: 30_000, maxWait: 10_000 },
  );

  return ok({ imported });
}

/** Reject a file. Every row still waiting goes down with it. */
export async function applyFileRejection(
  actorId: string,
  input: { fileId: string; note: string },
): Promise<ActionResult<{ rowsRejected: number }>> {
  const file = await prisma.uploadFile.findUnique({ where: { id: input.fileId } });
  if (!file) return fail("That upload file no longer exists.");
  if (file.status === UploadFileStatus.REJECTED) return fail("That file was already rejected.");

  const rowsRejected = await prisma.$transaction(async (tx) => {
    // Rows already saved stay saved. Pulling one back is a CorrectionRequest.
    const { count } = await tx.uploadRow.updateMany({
      where: { uploadFileId: input.fileId, status: { notIn: SETTLED_ROWS } },
      data: {
        status: UploadRowStatus.REJECTED,
        resolvedById: actorId,
        resolvedAt: new Date(),
        resolutionNote: input.note,
        errorMessage: "Rejected as part of a rejected file.",
      },
    });

    await tx.uploadFile.update({
      where: { id: input.fileId },
      data: {
        status: UploadFileStatus.REJECTED, // marked, not deleted
        resolvedById: actorId,
        resolvedAt: new Date(),
        resolutionNote: input.note,
      },
    });

    await syncBatchStatus(tx, file.uploadBatchId);
    return count;
  });

  return ok({ rowsRejected });
}

/** Correct a row's student or score, then send it through the normal commit path. */
export async function applyRowResolution(
  actorId: string,
  input: { rowId: string; studentId?: string; score?: number; note?: string },
): Promise<ActionResult<{ studentResultId: string }>> {
  const row = await prisma.uploadRow.findUnique({
    where: { id: input.rowId },
    include: { uploadFile: true },
  });
  if (!row) return fail("That row no longer exists.");
  if (row.status === UploadRowStatus.IMPORTED) return fail("That row was already imported.");
  if (row.status === UploadRowStatus.REJECTED) return fail("That row was already rejected.");

  const file = row.uploadFile;
  const courseId = file.matchedCourseId;
  if (!courseId) {
    return fail("Resolve this file's course code before approving individual rows.");
  }
  if (file.status === UploadFileStatus.REJECTED) {
    return fail("This file was rejected; its rows cannot be approved.");
  }

  const finalStudentId = input.studentId ?? row.matchedStudentId;
  if (!finalStudentId) return fail("Choose the student this row belongs to.");

  const finalScore = input.score ?? row.score;
  if (!isValidScore(finalScore)) return fail("Enter a score between 0 and 100.");

  const academicSession = normalizeSession(file.academicSessionRaw);
  if (!academicSession) return fail("This file's academic session could not be read.");

  const student = await prisma.student.findUnique({ where: { id: finalStudentId } });
  if (!student) return fail("That student no longer exists.");

  const clash = await prisma.studentResult.findFirst({
    where: { studentId: finalStudentId, courseId, academicSession },
    select: { id: true },
  });
  if (clash) return fail("That student already has a result for this course and session.");

  const result = await prisma.$transaction(async (tx) => {
    // Same entry point as the automatic one.
    const created = await commitRow(tx, {
      uploadRowId: input.rowId,
      studentId: finalStudentId,
      courseId,
      academicSession,
      score: finalScore,
    });

    await tx.uploadRow.update({
      where: { id: input.rowId },
      data: {
        resolvedById: actorId, // who approved it
        resolvedAt: new Date(),
        resolutionNote: input.note ?? "Approved by HOD after review.",
      },
    });

    await syncBatchStatus(tx, file.uploadBatchId);
    return created;
  });

  return ok({ studentResultId: result.id });
}

/** Reject one row. It stays on record with a reason. */
export async function applyRowRejection(
  actorId: string,
  input: { rowId: string; note: string },
): Promise<ActionResult<void>> {
  const row = await prisma.uploadRow.findUnique({
    where: { id: input.rowId },
    include: { uploadFile: true },
  });
  if (!row) return fail("That row no longer exists.");
  if (row.status === UploadRowStatus.IMPORTED) return fail("That row was already imported.");
  if (row.status === UploadRowStatus.REJECTED) return fail("That row was already rejected.");

  await prisma.$transaction(async (tx) => {
    await tx.uploadRow.update({
      where: { id: input.rowId },
      data: {
        status: UploadRowStatus.REJECTED,
        resolvedById: actorId,
        resolvedAt: new Date(),
        resolutionNote: input.note,
      },
    });

    await commitValidRows(tx, row.uploadFileId); // this might finish the file
    await syncBatchStatus(tx, row.uploadFile.uploadBatchId);
  });

  return ok(undefined);
}
