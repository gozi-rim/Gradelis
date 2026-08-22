import "server-only";
import { Prisma, ResultStatus, UploadRowStatus } from "@/generated/prisma";
import { gradeForScore, gradePointForScore } from "@/lib/grading";

export type CommitRowArgs = {
  uploadRowId: string;
  studentId: string;
  courseId: string;
  academicSession: string;
  score: number;
};

/**
 * The only entry point into StudentResult. Auto and HOD approval both pass here.
 * Keep it inside a transaction.
 */
export async function commitRow(tx: Prisma.TransactionClient, args: CommitRowArgs) {
  // A resit is a new attempt, not a replacement.
  const priorAttempts = await tx.studentResult.count({
    where: { studentId: args.studentId, courseId: args.courseId },
  });

  const result = await tx.studentResult.create({
    data: {
      studentId: args.studentId,
      courseId: args.courseId,
      academicSession: args.academicSession,
      score: args.score,
      grade: gradeForScore(args.score), // we work it out, we don't trust the sheet
      gradePoint: gradePointForScore(args.score),
      attemptNumber: priorAttempts + 1,
      status: ResultStatus.POSTED,
    },
  });

  await tx.uploadRow.update({
    where: { id: args.uploadRowId },
    data: {
      studentResultId: result.id,
      matchedStudentId: args.studentId,
      status: UploadRowStatus.IMPORTED,
      errorMessage: null,
    },
  });

  return result;
}
