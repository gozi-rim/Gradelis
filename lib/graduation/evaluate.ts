import { PASS_MARK } from "@/lib/grading";
import type { GraduationPolicy } from "./policy";

export type RuleId =
  | "ALL_COMPULSORY_PASSED"
  | "MIN_CGPA"
  | "MIN_CREDIT_UNITS"
  | "NO_OUTSTANDING_FAILURES";

export type ResultInput = {
  courseId: string;
  courseCode: string;
  creditUnits: number;
  attemptNumber: number;
  score: number | null;
  gradePoint: number | null;
};

export type StudentInput = {
  id: string;
  matricNumber: string;
  fullName: string;
  results: ResultInput[];
};

export type CompulsoryCourse = { id: string; code: string };

/** Every rule a student fails gets its own reason. */
export type Remark = { rule: RuleId; message: string };

export type Evaluation = {
  studentId: string;
  matricNumber: string;
  fullName: string;
  cgpa: number;
  eligible: boolean;
  remarks: Remark[];
};

/** Round to 2 places the same way every time. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Latest attempt wins. Sorted so the order never changes. */
export function effectiveResults(results: ResultInput[]): ResultInput[] {
  const best = new Map<string, ResultInput>();

  for (const result of results) {
    const current = best.get(result.courseId);
    if (!current || result.attemptNumber > current.attemptNumber) {
      best.set(result.courseId, result);
    }
  }

  return [...best.values()].sort((a, b) => a.courseCode.localeCompare(b.courseCode));
}

/** Big courses affect the CGPA harder than small ones. */
export function computeCgpa(results: ResultInput[]): number {
  let weightedPoints = 0;
  let units = 0;

  for (const result of results) {
    if (result.gradePoint === null) continue;
    weightedPoints += result.gradePoint * result.creditUnits;
    units += result.creditUnits;
  }

  return units === 0 ? 0 : round2(weightedPoints / units);
}

function passed(result: ResultInput): boolean {
  return result.score !== null && result.score >= PASS_MARK;
}

/** Check all four rules. Fail three, get three reasons. Pass all four to graduate. */
export function evaluateStudent(
  student: StudentInput,
  compulsory: CompulsoryCourse[],
  policy: GraduationPolicy,
): Evaluation {
  const effective = effectiveResults(student.results);
  const cgpa = computeCgpa(effective);
  const remarks: Remark[] = [];

  // Rule 1: CGPA must reach the mark.
  if (cgpa < policy.minCgpa) {
    remarks.push({
      rule: "MIN_CGPA",
      message: `CGPA ${cgpa.toFixed(2)} is below the required minimum of ${policy.minCgpa.toFixed(2)}.`,
    });
  }

  // Rule 2: no course still carrying a fail.
  const failures = effective.filter((result) => !passed(result));
  if (failures.length > 0) {
    remarks.push({
      rule: "NO_OUTSTANDING_FAILURES",
      message: `Outstanding failed course(s): ${failures.map((f) => f.courseCode).join(", ")}.`,
    });
  }

  // Rule 3: all compulsory courses passed.
  const passedCourseIds = new Set(effective.filter(passed).map((r) => r.courseId));
  const missing = compulsory.filter((course) => !passedCourseIds.has(course.id));
  if (missing.length > 0) {
    remarks.push({
      rule: "ALL_COMPULSORY_PASSED",
      message: `No passing result for compulsory course(s): ${missing.map((c) => c.code).join(", ")}.`,
    });
  }

  // Rule 4: enough credit units. Only passes count.
  const earnedUnits = effective
    .filter(passed)
    .reduce((sum, result) => sum + result.creditUnits, 0);

  if (earnedUnits < policy.minCreditUnits) {
    remarks.push({
      rule: "MIN_CREDIT_UNITS",
      message: `${earnedUnits} credit units earned; ${policy.minCreditUnits} required (${policy.minCreditUnits - earnedUnits} short).`,
    });
  }

  remarks.sort((a, b) => a.rule.localeCompare(b.rule));

  return {
    studentId: student.id,
    matricNumber: student.matricNumber,
    fullName: student.fullName,
    cgpa,
    eligible: remarks.length === 0,
    remarks,
  };
}

/** Sorted by matric number, so two runs give the exact same list. */
export function evaluateCohort(
  students: StudentInput[],
  compulsory: CompulsoryCourse[],
  policy: GraduationPolicy,
): Evaluation[] {
  const sortedCompulsory = [...compulsory].sort((a, b) => a.code.localeCompare(b.code));

  return [...students]
    .sort((a, b) => a.matricNumber.localeCompare(b.matricNumber))
    .map((student) => evaluateStudent(student, sortedCompulsory, policy));
}
