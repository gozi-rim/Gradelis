import "server-only";
import { UploadFileStatus, UploadRowStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { suggestCandidates } from "@/lib/upload/candidates";
import { normalizeCourseCode, normalizeMatric } from "@/lib/upload/normalize";

/** Anything still waiting for a decision. */
export const OPEN_ROW_STATUSES = [
  UploadRowStatus.UNMATCHED_STUDENT,
  UploadRowStatus.DUPLICATE,
  UploadRowStatus.INVALID_SCORE,
  UploadRowStatus.GRADE_MISMATCH,
];

export const OPEN_FILE_STATUSES = [
  UploadFileStatus.UNMATCHED_COURSE,
  UploadFileStatus.FAILED,
];

export async function getReviewQueue() {
  const batches = await prisma.uploadBatch.findMany({
    where: {
      files: {
        some: {
          OR: [
            { status: { in: OPEN_FILE_STATUSES } },
            { rows: { some: { status: { in: OPEN_ROW_STATUSES } } } },
          ],
        },
      },
    },
    orderBy: { uploadedAt: "desc" },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      files: {
        orderBy: { createdAt: "asc" },
        include: {
          matchedCourse: { select: { id: true, code: true, title: true } },
          rows: {
            where: { status: { in: OPEN_ROW_STATUSES } },
            orderBy: { matricNumberRaw: "asc" },
          },
          _count: { select: { rows: true } },
        },
      },
    },
  });

  // Two queries for the whole page, not two per item.
  const [courses, students] = await Promise.all([
    prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, code: true, title: true },
    }),
    prisma.student.findMany({
      select: { id: true, matricNumber: true, fullName: true, currentLevel: true },
    }),
  ]);

  return batches.map((batch) => ({
    id: batch.id,
    uploadedAt: batch.uploadedAt,
    uploadedBy: batch.uploadedBy,
    files: batch.files.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      status: file.status,
      errorMessage: file.errorMessage,
      totalRows: file._count.rows,
      matchedCourse: file.matchedCourse,

      raw: {
        courseCode: file.courseCodeRaw,
        session: file.academicSessionRaw,
        semester: file.semesterRaw,
      },

      // Suggest courses that look close.
      courseCandidates:
        file.status === UploadFileStatus.UNMATCHED_COURSE
          ? suggestCandidates(
              normalizeCourseCode(file.courseCodeRaw),
              courses,
              (c) => normalizeCourseCode(c.code),
            )
          : [],

      rows: file.rows.map((row) => ({
        id: row.id,
        matricNumberRaw: row.matricNumberRaw,
        gradeRaw: row.gradeRaw,
        score: row.score,
        status: row.status,
        errorMessage: row.errorMessage,
        matchedStudentId: row.matchedStudentId,

        // Suggest students that look close.
        studentCandidates:
          row.status === UploadRowStatus.UNMATCHED_STUDENT
            ? suggestCandidates(
                normalizeMatric(row.matricNumberRaw),
                students,
                (s) => normalizeMatric(s.matricNumber),
              )
            : [],
      })),
    })),
  }));
}

export type ReviewQueue = Awaited<ReturnType<typeof getReviewQueue>>;
export type ReviewBatch = ReviewQueue[number];
export type ReviewFile = ReviewBatch["files"][number];
export type ReviewRow = ReviewFile["rows"][number];
