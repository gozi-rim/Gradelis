import { UploadRowStatus } from "@/generated/prisma";
import { gradeForScore, isValidScore } from "@/lib/grading";
import { normalizeMatric } from "./normalize";

export type RawRow = { matricNo: string; totalScore: string; grade: string };

export type ClassifiedRow = {
  matricNumberRaw: string;
  gradeRaw: string | null;
  score: number | null;
  matchedStudentId: string | null;
  status: UploadRowStatus;
  errorMessage: string | null;
};

export type ClassifyInput = {
  rows: RawRow[];
  /** clean matric → student id */
  studentsByMatric: Map<string, string>;
  /** students that already have a result for this course */
  studentsWithExistingResult: Set<string>;
  /** false means we still don't know the course */
  courseKnown: boolean;
};

export function classifyRows({
  rows,
  studentsByMatric,
  studentsWithExistingResult,
  courseKnown,
}: ClassifyInput): ClassifiedRow[] {
  const seenInFile = new Set<string>();

  return rows.map((row) => {
    const matricNumberRaw = row.matricNo.trim();
    const key = normalizeMatric(matricNumberRaw);
    const gradeRaw = row.grade.trim() ? row.grade.trim().toUpperCase() : null;
    const matchedStudentId = studentsByMatric.get(key) ?? null;

    const rawScore = row.totalScore.trim();
    const parsed = rawScore === "" ? null : Number(rawScore);

    const base = { matricNumberRaw, gradeRaw, matchedStudentId };

    // 1. Empty score means no result. It does not mean zero.
    if (rawScore === "") {
      return {
        ...base,
        score: null,
        status: UploadRowStatus.INVALID_SCORE,
        errorMessage: "No score recorded for this student.",
      };
    }

    if (!isValidScore(parsed)) {
      return {
        ...base,
        score: null,
        status: UploadRowStatus.INVALID_SCORE,
        errorMessage: `Score "${rawScore}" is not a number between 0 and 100.`,
      };
    }

    const score = parsed;

    // 2. The matric number must belong to a real student.
    if (!matchedStudentId) {
      return {
        ...base,
        score,
        status: UploadRowStatus.UNMATCHED_STUDENT,
        errorMessage: `No student on record with matric number "${matricNumberRaw}".`,
      };
    }

    // 3. Same student showing up twice in one file.
    if (seenInFile.has(key)) {
      return {
        ...base,
        score,
        status: UploadRowStatus.DUPLICATE,
        errorMessage: `"${matricNumberRaw}" appears more than once in this file.`,
      };
    }
    seenInFile.add(key);

    // 4. Student already has a result here. Only checkable once we know the course.
    if (courseKnown && studentsWithExistingResult.has(matchedStudentId)) {
      return {
        ...base,
        score,
        status: UploadRowStatus.DUPLICATE,
        errorMessage: "A result already exists for this student on this course and session.",
      };
    }

    // 5. Grade column must agree with score column.
    const expected = gradeForScore(score);
    if (gradeRaw && gradeRaw !== expected) {
      return {
        ...base,
        score,
        status: UploadRowStatus.GRADE_MISMATCH,
        errorMessage: `Sheet grade "${gradeRaw}" contradicts score ${score}, which is a ${expected}.`,
      };
    }

    return { ...base, score, status: UploadRowStatus.VALID, errorMessage: null };
  });
}
