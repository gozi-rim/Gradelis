import { UploadRowStatus } from "@/generated/prisma";
import { gradeForScore } from "@/lib/grading";
import { normalizeMatric } from "./normalize";
import { resolveScore } from "./score";

export type RawRow = {
  matricNo: string;
  caScore?: string;
  examScore?: string;
  totalScore: string;
  grade: string;
};

export type ClassifiedRow = {
  matricNumberRaw: string;
  caScoreRaw: string | null;
  examScoreRaw: string | null;
  gradeRaw: string | null;
  score: number | null;
  caScore: number | null;
  examScore: number | null;
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
    const caScoreRaw = row.caScore?.trim() || null;
    const examScoreRaw = row.examScore?.trim() || null;
    const matchedStudentId = studentsByMatric.get(key) ?? null;

    const base = { matricNumberRaw, caScoreRaw, examScoreRaw, gradeRaw, matchedStudentId };

    // 1. Work out the score. CA + Exam wins when the sheet has them.
    const resolved = resolveScore({
      ca: row.caScore ?? "",
      exam: row.examScore ?? "",
      total: row.totalScore,
    });

    if (!resolved.ok) {
      return {
        ...base,
        score: null,
        caScore: null,
        examScore: null,
        status: UploadRowStatus.INVALID_SCORE,
        errorMessage: resolved.reason,
      };
    }

    const { score } = resolved;
    const parts = { caScore: resolved.ca, examScore: resolved.exam };

    // 2. The matric number must belong to a real student.
    if (!matchedStudentId) {
      return {
        ...base,
        score,
        ...parts,
        status: UploadRowStatus.UNMATCHED_STUDENT,
        errorMessage: `No student on record with matric number "${matricNumberRaw}".`,
      };
    }

    // 3. Same student showing up twice in one file.
    if (seenInFile.has(key)) {
      return {
        ...base,
        score,
        ...parts,
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
        ...parts,
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
        ...parts,
        status: UploadRowStatus.GRADE_MISMATCH,
        errorMessage: `Sheet grade "${gradeRaw}" contradicts score ${score}, which is a ${expected}.`,
      };
    }

    return { ...base, score, ...parts, status: UploadRowStatus.VALID, errorMessage: null };
  });
}
