import { UploadBatchStatus, UploadFileStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { ExcelParseError, parseExcelFile } from "@/lib/parse-excel";
import { classifyRows } from "./classify";
import { commitValidRows, syncBatchStatus } from "./commit-batch";
import {
  normalizeCourseCode,
  normalizeMatric,
  normalizeSemester,
  normalizeSession,
} from "./normalize";

export type IngestResult =
  | {
      ok: true;
      batchId: string;
      total: number;
      imported: number;
      flagged: number;
      courseMatched: boolean;
    }
  | { ok: false; message: string };

/**
 * Parse one result sheet, match it, and save the batch.
 * The action wrapping this only handles the sign-in check.
 */
export async function ingestResultFile(actorId: string, file: File): Promise<IngestResult> {
  let parsed;
  try {
    parsed = await parseExcelFile(file);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof ExcelParseError ? error.message : "Could not read this file.",
    };
  }

  const { metadata, rows } = parsed;

  const academicSession = normalizeSession(metadata.session);
  if (!academicSession) {
    return {
      ok: false,
      message: `Could not read the academic session from cell E3 (found "${metadata.session}").`,
    };
  }

  const semester = normalizeSemester(metadata.semester);
  if (!semester) {
    return {
      ok: false,
      message: `Could not read the semester from cell E4 (found "${metadata.semester}").`,
    };
  }

  // ---- Find the course and the students ----

  const courseKey = normalizeCourseCode(metadata.courseCode);
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, code: true },
  });
  const matchedCourse = courses.find((c) => normalizeCourseCode(c.code) === courseKey) ?? null;

  const students = await prisma.student.findMany({
    select: { id: true, matricNumber: true },
  });
  const studentsByMatric = new Map(students.map((s) => [normalizeMatric(s.matricNumber), s.id]));

  const studentsWithExistingResult = new Set<string>();
  if (matchedCourse) {
    const existing = await prisma.studentResult.findMany({
      where: { courseId: matchedCourse.id, academicSession },
      select: { studentId: true },
    });
    for (const r of existing) studentsWithExistingResult.add(r.studentId);
  }

  const classified = classifyRows({
    rows,
    studentsByMatric,
    studentsWithExistingResult,
    courseKnown: matchedCourse !== null,
  });

  // ---- Save it. All or nothing. ----

  const { batch, imported } = await prisma.$transaction(
    async (tx) => {
      const created = await tx.uploadBatch.create({
      data: {
        uploadedById: actorId,
        status: UploadBatchStatus.PROCESSING,
        files: {
          create: {
            fileName: file.name,
            courseCodeRaw: metadata.courseCode,
            academicSessionRaw: metadata.session,
            semesterRaw: metadata.semester,
            matchedCourseId: matchedCourse?.id ?? null,
            status: matchedCourse ? UploadFileStatus.VALID : UploadFileStatus.UNMATCHED_COURSE,
            errorMessage: matchedCourse
              ? null
              : `No active course matches the code "${metadata.courseCode}".`,
            rows: {
              create: classified.map((row) => ({
                matricNumberRaw: row.matricNumberRaw,
                caScoreRaw: row.caScoreRaw,
                examScoreRaw: row.examScoreRaw,
                gradeRaw: row.gradeRaw,
                score: row.score,
                matchedStudentId: row.matchedStudentId,
                status: row.status,
                errorMessage: row.errorMessage,
              })),
            },
          },
        },
        },
        include: { files: { select: { id: true } } },
      });

      // Clean rows go straight in. Flagged ones wait for the HOD.
      const importedCount = await commitValidRows(tx, created.files[0].id);
      await syncBatchStatus(tx, created.id);

      return { batch: created, imported: importedCount };
    },
    // Two statements per row, so give a big sheet room to finish.
    { timeout: 30_000, maxWait: 10_000 },
  );

  const flaggedRows = classified.filter((r) => r.status !== "VALID").length;

  return {
    ok: true,
    batchId: batch.id,
    total: classified.length,
    imported,
    flagged: flaggedRows + (matchedCourse ? 0 : 1),
    courseMatched: matchedCourse !== null,
  };
}
