import { describe, expect, it } from "vitest";
import { resolveScore } from "./score";

const raw = (over: Partial<{ ca: string; exam: string; total: string }> = {}) => ({
  ca: "",
  exam: "",
  total: "",
  ...over,
});

describe("CA + Exam is the source of truth", () => {
  it("adds the components up", () => {
    const out = resolveScore(raw({ ca: "25", exam: "55" }));
    expect(out).toEqual({ ok: true, score: 80, ca: 25, exam: 55, derived: true });
  });

  it("handles the failing row from the real template", () => {
    const out = resolveScore(raw({ ca: "18", exam: "20" }));
    expect(out.ok && out.score).toBe(38);
  });

  it("ignores a typed Total that agrees", () => {
    const out = resolveScore(raw({ ca: "25", exam: "55", total: "80" }));
    expect(out.ok && out.derived).toBe(true);
  });

  it("flags a typed Total that disagrees", () => {
    const out = resolveScore(raw({ ca: "25", exam: "55", total: "90" }));
    expect(out.ok).toBe(false);
    expect(!out.ok && out.reason).toContain("does not match");
  });

  it("accepts both zeros", () => {
    expect(resolveScore(raw({ ca: "0", exam: "0" }))).toMatchObject({ ok: true, score: 0 });
  });

  it("accepts full marks", () => {
    expect(resolveScore(raw({ ca: "30", exam: "70" }))).toMatchObject({ ok: true, score: 100 });
  });

  it("allows half marks", () => {
    expect(resolveScore(raw({ ca: "22.5", exam: "40.5" }))).toMatchObject({ ok: true, score: 63 });
  });
});

describe("range checks come from the column headers", () => {
  it("rejects a CA above 30", () => {
    const out = resolveScore(raw({ ca: "45", exam: "40" }));
    expect(out.ok).toBe(false);
    expect(!out.ok && out.reason).toContain("0-30");
  });

  it("rejects an exam above 70", () => {
    const out = resolveScore(raw({ ca: "20", exam: "75" }));
    expect(out.ok).toBe(false);
    expect(!out.ok && out.reason).toContain("0-70");
  });

  it.each([
    ["-1", "40"],
    ["20", "-5"],
  ])("rejects negatives (ca %s, exam %s)", (ca, exam) => {
    expect(resolveScore(raw({ ca, exam })).ok).toBe(false);
  });

  it("rejects non-numeric components", () => {
    expect(resolveScore(raw({ ca: "abs", exam: "40" })).ok).toBe(false);
    expect(resolveScore(raw({ ca: "20", exam: "n/a" })).ok).toBe(false);
  });
});

describe("half-filled rows", () => {
  it("flags CA present with exam blank", () => {
    const out = resolveScore(raw({ ca: "25" }));
    expect(out.ok).toBe(false);
    expect(!out.ok && out.reason).toContain("exam score is blank");
  });

  it("flags exam present with CA blank", () => {
    const out = resolveScore(raw({ exam: "55" }));
    expect(out.ok).toBe(false);
    expect(!out.ok && out.reason).toContain("CA score is blank");
  });
});

describe("older sheets that only carry a Total", () => {
  it("uses the Total when there are no components", () => {
    expect(resolveScore(raw({ total: "65" }))).toEqual({
      ok: true, score: 65, ca: null, exam: null, derived: false,
    });
  });

  it("keeps 0 as a real recorded score", () => {
    expect(resolveScore(raw({ total: "0" }))).toMatchObject({ ok: true, score: 0 });
  });

  it("rejects a Total outside 0-100", () => {
    expect(resolveScore(raw({ total: "150" })).ok).toBe(false);
  });

  it("reports a completely empty row as missing", () => {
    const out = resolveScore(raw());
    expect(out.ok).toBe(false);
    expect(!out.ok && out.reason).toContain("No score recorded");
  });
});

describe("purity", () => {
  it("gives the same answer every time", () => {
    const input = raw({ ca: "25", exam: "55" });
    expect(resolveScore(input)).toEqual(resolveScore(input));
  });

  it("does not touch its input", () => {
    const input = raw({ ca: "25", exam: "55" });
    const before = structuredClone(input);
    resolveScore(input);
    expect(input).toEqual(before);
  });
});
