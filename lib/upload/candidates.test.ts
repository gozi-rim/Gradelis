import { describe, expect, it } from "vitest";
import { editDistance, similarity, suggestCandidates } from "./candidates";
import { normalizeMatric } from "./normalize";

describe("editDistance", () => {
  it.each([
    ["kitten", "sitting", 3],
    ["", "abc", 3],
    ["abc", "", 3],
    ["abc", "abc", 0],
    ["U20213020002", "U20213020003", 1],
  ])("%s -> %s is %i", (a, b, expected) => {
    expect(editDistance(a, b)).toBe(expected);
  });

  it("works the same in both directions", () => {
    expect(editDistance("CSC401", "CSC410")).toBe(editDistance("CSC410", "CSC401"));
  });
});

describe("similarity", () => {
  it("is 1 for identical strings", () => {
    expect(similarity("CSC401", "CSC401")).toBe(1);
  });

  it("is 1 when both are empty", () => {
    expect(similarity("", "")).toBe(1);
  });

  it("is 0 when nothing is shared", () => {
    expect(similarity("AAA", "BBB")).toBe(0);
  });
});

describe("suggestCandidates", () => {
  const students = [
    { id: "a", matricNumber: "U2021/3020002" },
    { id: "b", matricNumber: "U2021/3020003" },
    { id: "c", matricNumber: "U2019/4010111" },
  ];
  const byMatric = (s: (typeof students)[number]) => normalizeMatric(s.matricNumber);

  it("ranks the closest matric number first", () => {
    const [top] = suggestCandidates("U20213020003", students, byMatric);
    expect(top.item.id).toBe("b");
    expect(top.score).toBe(1);
  });

  it("puts a one-character typo at the top", () => {
    const [top] = suggestCandidates("U20213020O02", students, byMatric);
    expect(top.item.id).toBe("a");
  });

  it("drops anything below minScore", () => {
    expect(suggestCandidates("ZZZZZZZZZZZZ", students, byMatric)).toEqual([]);
  });

  it("respects the limit", () => {
    expect(suggestCandidates("U20213020002", students, byMatric, { limit: 1 })).toHaveLength(1);
  });

  it("is deterministic when scores tie", () => {
    const tied = [
      { id: "z", matricNumber: "U2021/3020009" },
      { id: "y", matricNumber: "U2021/3020008" },
      { id: "x", matricNumber: "U2021/3020007" },
    ];
    const once = suggestCandidates("U20213020000", tied, byMatric);
    const twice = suggestCandidates("U20213020000", [...tied].reverse(), byMatric);
    expect(once.map((c) => c.item.id)).toEqual(twice.map((c) => c.item.id));
  });

  it("returns nothing for an empty pool", () => {
    expect(suggestCandidates("CSC401", [], (c: string) => c)).toEqual([]);
  });

  it("does not touch the pool", () => {
    const pool = [...students];
    const before = structuredClone(pool);
    suggestCandidates("U20213020002", pool, byMatric);
    expect(pool).toEqual(before);
  });
});
