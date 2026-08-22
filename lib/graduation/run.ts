import "server-only";
import {
  CourseType,
  GraduationStatus,
  Prisma,
  StudentStatus,
} from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { type ActionResult, fail, ok } from "@/lib/actions/result";
import { evaluateCohort } from "./evaluate";
import { GRADUATION_POLICY } from "./policy";

export type RunSummary = { runId: string; eligible: number; pending: number };

/** Evaluate one cohort and store the outcome. Always a brand new run. */
export async function performGraduationRun(
  actorId: string,
  entrySession: string,
): Promise<ActionResult<RunSummary>> {
  // Always a fresh run. We never touch an old one.
  const run = await prisma.graduationRun.create({
    data: {
      academicSession: entrySession,
      triggeredById: actorId,
      status: GraduationStatus.RUNNING,
      startedAt: new Date(),
      policy: GRADUATION_POLICY as unknown as Prisma.InputJsonValue, // freeze the rules we used
    },
  });

  try {
    // Two queries for the whole set, not two per student.
    const [students, compulsory] = await Promise.all([
      prisma.student.findMany({
        where: { entrySession, status: StudentStatus.ACTIVE },
        select: {
          id: true,
          matricNumber: true,
          fullName: true,
          results: {
            // Only the current version of each result.
            where: { previousVersion: { is: null } },
            select: {
              courseId: true,
              score: true,
              gradePoint: true,
              attemptNumber: true,
              course: { select: { code: true, creditUnits: true } },
            },
          },
        },
      }),
      prisma.course.findMany({
        where: { courseType: CourseType.COMPULSORY, isActive: true },
        select: { id: true, code: true },
      }),
    ]);

    if (students.length === 0) {
      await prisma.graduationRun.update({
        where: { id: run.id },
        data: { status: GraduationStatus.FAILED, completedAt: new Date() },
      });
      return fail(`No active students found with entry session ${entrySession}.`);
    }

    const evaluations = evaluateCohort(
      students.map((student) => ({
        id: student.id,
        matricNumber: student.matricNumber,
        fullName: student.fullName,
        results: student.results.map((result) => ({
          courseId: result.courseId,
          courseCode: result.course.code,
          creditUnits: result.course.creditUnits,
          attemptNumber: result.attemptNumber,
          score: result.score,
          gradePoint: result.gradePoint,
        })),
      })),
      compulsory,
      GRADUATION_POLICY,
    );

    // The items and the "done" flag save together, or neither saves.
    await prisma.$transaction(
      async (tx) => {
        await tx.eligibilityRunItem.createMany({
          data: evaluations.map((evaluation) => ({
            graduationRunId: run.id,
            studentId: evaluation.studentId,
            cgpa: evaluation.cgpa,
            eligible: evaluation.eligible,
            remarks: evaluation.remarks as unknown as Prisma.InputJsonValue,
          })),
        });

        await tx.graduationRun.update({
          where: { id: run.id },
          data: { status: GraduationStatus.COMPLETED, completedAt: new Date() },
        });
      },
      { timeout: 30_000, maxWait: 10_000 },
    );

    return ok({
      runId: run.id,
      eligible: evaluations.filter((e) => e.eligible).length,
      pending: evaluations.filter((e) => !e.eligible).length,
    });
  } catch (error) {
    console.error("Graduation run failed:", error);

    // Don't leave a dead run stuck at RUNNING.
    await prisma.graduationRun.update({
      where: { id: run.id },
      data: { status: GraduationStatus.FAILED, completedAt: new Date() },
    });

    return fail("The graduation run could not be completed. Nothing was recorded.");
  }
}
