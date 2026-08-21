/** 5-point scale. Highest first, so the first match wins. */
export const GRADE_SCALE = [
  { grade: "A", min: 70, point: 5 },
  { grade: "B", min: 60, point: 4 },
  { grade: "C", min: 50, point: 3 },
  { grade: "D", min: 45, point: 2 },
  { grade: "E", min: 40, point: 1 },
  { grade: "F", min: 0, point: 0 },
] as const;

export type GradeLetter = (typeof GRADE_SCALE)[number]["grade"];

/** Anything from here up is a pass. */
export const PASS_MARK = 40;

function bandFor(score: number) {
  return GRADE_SCALE.find((band) => score >= band.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
}

export function gradeForScore(score: number): GradeLetter {
  return bandFor(score).grade;
}

export function gradePointForScore(score: number): number {
  return bandFor(score).point;
}

export function isPass(score: number): boolean {
  return score >= PASS_MARK;
}

export function isValidScore(score: unknown): score is number {
  return typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 100;
}
