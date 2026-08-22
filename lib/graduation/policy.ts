export type GraduationPolicy = {
  minCgpa: number;
  minCreditUnits: number;
};

/** Saved onto every run, so an old run still makes sense after we change these. */
export const GRADUATION_POLICY: GraduationPolicy = {
  minCgpa: 1.0,
  minCreditUnits: 120,
};
