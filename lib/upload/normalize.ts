import { Semester } from "@/generated/prisma";

/** Drop every space and sign. Keep only letters and numbers. */
export function normalizeMatric(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function normalizeCourseCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Any style of session becomes "2025/2026". */
export function normalizeSession(raw: string): string | null {
  const match = raw.trim().match(/(\d{4})\s*[/\-–—]\s*(\d{4})/);
  if (!match) return null;
  return `${match[1]}/${match[2]}`;
}

export function normalizeSemester(raw: string): Semester | null {
  const value = raw.trim().toUpperCase();
  if (/^(1|1ST|FIRST|HARMATTAN)/.test(value)) return Semester.FIRST;
  if (/^(2|2ND|SECOND|RAIN)/.test(value)) return Semester.SECOND;
  return null;
}
