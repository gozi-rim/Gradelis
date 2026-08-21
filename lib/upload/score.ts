export const CA_MAX = 30;
export const EXAM_MAX = 70;

export type RawScores = {
  ca: string;
  exam: string;
  total: string;
};

export type ScoreResolution =
  | { ok: true; score: number; ca: number | null; exam: number | null; derived: boolean }
  | { ok: false; reason: string };

function toNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : Number.NaN;
}

/**
 * Work out the one score we keep.
 *
 * The sheet gives CA and Exam. When they're there we add them up ourselves and
 * ignore whatever is typed in the Total column, the same way we work out the
 * grade instead of trusting it. Older sheets that only carry a Total still work.
 */
export function resolveScore({ ca, exam, total }: RawScores): ScoreResolution {
  const caValue = toNumber(ca);
  const examValue = toNumber(exam);
  const totalValue = toNumber(total);

  const hasComponents = caValue !== null || examValue !== null;

  if (!hasComponents) {
    if (totalValue === null) {
      return { ok: false, reason: "No score recorded for this student." };
    }
    if (Number.isNaN(totalValue)) {
      return { ok: false, reason: `Total score "${total.trim()}" is not a number.` };
    }
    if (totalValue < 0 || totalValue > 100) {
      return { ok: false, reason: `Total score ${totalValue} is outside 0-100.` };
    }
    return { ok: true, score: totalValue, ca: null, exam: null, derived: false };
  }

  if (caValue === null) {
    return { ok: false, reason: "Exam score is filled in but CA score is blank." };
  }
  if (examValue === null) {
    return { ok: false, reason: "CA score is filled in but exam score is blank." };
  }
  if (Number.isNaN(caValue)) {
    return { ok: false, reason: `CA score "${ca.trim()}" is not a number.` };
  }
  if (Number.isNaN(examValue)) {
    return { ok: false, reason: `Exam score "${exam.trim()}" is not a number.` };
  }
  if (caValue < 0 || caValue > CA_MAX) {
    return { ok: false, reason: `CA score ${caValue} is outside 0-${CA_MAX}.` };
  }
  if (examValue < 0 || examValue > EXAM_MAX) {
    return { ok: false, reason: `Exam score ${examValue} is outside 0-${EXAM_MAX}.` };
  }

  const computed = caValue + examValue;

  // A typed Total that disagrees is somebody's arithmetic slip. Flag it.
  if (totalValue !== null && !Number.isNaN(totalValue) && Math.abs(totalValue - computed) > 0.001) {
    return {
      ok: false,
      reason: `Total ${totalValue} does not match CA ${caValue} + Exam ${examValue} = ${computed}.`,
    };
  }

  return { ok: true, score: computed, ca: caValue, exam: examValue, derived: true };
}
