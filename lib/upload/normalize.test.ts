import { describe, expect, it } from "vitest";
import { Semester } from "@/generated/prisma";
import {
  normalizeCourseCode,
  normalizeMatric,
  normalizeSemester,
  normalizeSession,
} from "./normalize";

describe("normalizeMatric", () => {
  it("gives the same key no matter the punctuation", () => {
    const forms = ["U2018/3020002", "u2018-3020002", "U2018 3020002", " u2018_3020002 "];
    const keys = new Set(forms.map(normalizeMatric));
    expect(keys.size).toBe(1);
    expect([...keys][0]).toBe("U20183020002");
  });
});

describe("normalizeCourseCode", () => {
  it("gives the same key no matter the spacing", () => {
    const keys = new Set(["CSC401", "CSC 401", "csc-401", " csc.401 "].map(normalizeCourseCode));
    expect(keys.size).toBe(1);
    expect([...keys][0]).toBe("CSC401");
  });
});

describe("normalizeSession", () => {
  it.each([
    ["2025/2026", "2025/2026"],
    ["2025-2026", "2025/2026"],
    ["2025 – 2026", "2025/2026"],
    ["2025 — 2026", "2025/2026"],
    ["Session: 2025 / 2026", "2025/2026"],
  ])("reads %s", (raw, expected) => {
    expect(normalizeSession(raw)).toBe(expected);
  });

  it("returns null when there is no session to read", () => {
    expect(normalizeSession("")).toBeNull();
    expect(normalizeSession("first semester")).toBeNull();
    expect(normalizeSession("2025")).toBeNull();
  });
});

describe("normalizeSemester", () => {
  it.each([
    ["1", Semester.FIRST],
    ["1st", Semester.FIRST],
    ["First", Semester.FIRST],
    ["FIRST SEMESTER", Semester.FIRST],
    ["Harmattan", Semester.FIRST],
    ["2", Semester.SECOND],
    ["2nd", Semester.SECOND],
    ["Second Semester", Semester.SECOND],
    ["Rain", Semester.SECOND],
  ])("reads %s", (raw, expected) => {
    expect(normalizeSemester(raw)).toBe(expected);
  });

  it("returns null on anything it cannot read", () => {
    expect(normalizeSemester("")).toBeNull();
    expect(normalizeSemester("third")).toBeNull();
  });
});
