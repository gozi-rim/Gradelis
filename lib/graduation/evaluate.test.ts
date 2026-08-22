import { describe, expect, it } from "vitest";
import {
  computeCgpa,
  effectiveResults,
  evaluateCohort,
  evaluateStudent,
  round2,
  type CompulsoryCourse,
  type ResultInput,
  type StudentInput,
} from "./evaluate";

const policy = { minCgpa: 1.0, minCreditUnits: 12 };

const result = (over: Partial<ResultInput> = {}): ResultInput => ({
  courseId: "c1",
  courseCode: "CSC101",
  creditUnits: 3,
  attemptNumber: 1,
  score: 75,
  gradePoint: 5,
  ...over,
});

const student = (over: Partial<StudentInput> = {}): StudentInput => ({
  id: "s1",
  matricNumber: "U2021/3020001",
  fullName: "Ada Okonkwo",
  results: [],
  ...over,
});

/** Four 3-unit passes = 12 units, clears every rule. */
const fullLoad = (): ResultInput[] =>
  ["c1", "c2", "c3", "c4"].map((id, i) =>
    result({ courseId: id, courseCode: `CSC10${i + 1}` }),
  );

describe("round2", () => {
  it.each([
    [4.425, 4.43],
    [1.005, 1.01],
    [3, 3],
    [0, 0],
  ])("%f -> %f", (input, expected) => {
    expect(round2(input)).toBe(expected);
  });
});

describe("computeCgpa", () => {
  it("weights by credit units, not by course count", () => {
    // 5×6 + 1×1 = 31 over 7 units = 4.43. A plain average would say 3.00.
    expect(
      computeCgpa([
        result({ courseId: "a", creditUnits: 6, gradePoint: 5 }),
        result({ courseId: "b", creditUnits: 1, gradePoint: 1 }),
      ]),
    ).toBe(4.43);
  });

  it("returns 0 for a student with no results rather than NaN", () => {
    expect(computeCgpa([])).toBe(0);
  });

  it("skips results with no grade point instead of counting them as zero", () => {
    expect(
      computeCgpa([
        result({ courseId: "a", gradePoint: 4 }),
        result({ courseId: "b", gradePoint: null }),
      ]),
    ).toBe(4);
  });

  it("does not depend on the order results arrive in", () => {
    const rows = [
      result({ courseId: "a", creditUnits: 6, gradePoint: 5 }),
      result({ courseId: "b", creditUnits: 1, gradePoint: 1 }),
      result({ courseId: "c", creditUnits: 3, gradePoint: 3 }),
    ];
    expect(computeCgpa(rows)).toBe(computeCgpa([...rows].reverse()));
  });
});

describe("effectiveResults", () => {
  it("keeps only the highest attempt per course", () => {
    const kept = effectiveResults([
      result({ attemptNumber: 1, score: 30, gradePoint: 0 }),
      result({ attemptNumber: 2, score: 65, gradePoint: 4 }),
    ]);
    expect(kept).toHaveLength(1);
    expect(kept[0].score).toBe(65);
  });

  it("does not let a failed first attempt drag CGPA down", () => {
    expect(
      computeCgpa(
        effectiveResults([
          result({ attemptNumber: 1, gradePoint: 0 }),
          result({ attemptNumber: 2, gradePoint: 4 }),
        ]),
      ),
    ).toBe(4);
  });

  it("picks the highest attempt even when attempts arrive out of order", () => {
    const kept = effectiveResults([
      result({ attemptNumber: 3, score: 70 }),
      result({ attemptNumber: 1, score: 30 }),
      result({ attemptNumber: 2, score: 50 }),
    ]);
    expect(kept[0].attemptNumber).toBe(3);
  });

  it("keeps different courses apart", () => {
    expect(
      effectiveResults([
        result({ courseId: "a", courseCode: "CSC101" }),
        result({ courseId: "b", courseCode: "CSC102" }),
      ]),
    ).toHaveLength(2);
  });

  it("sorts by course code so output order never shifts", () => {
    const kept = effectiveResults([
      result({ courseId: "c", courseCode: "ZOO101" }),
      result({ courseId: "a", courseCode: "AAA101" }),
      result({ courseId: "b", courseCode: "MMM101" }),
    ]);
    expect(kept.map((r) => r.courseCode)).toEqual(["AAA101", "MMM101", "ZOO101"]);
  });

  it("does not touch the input", () => {
    const rows = [result({ attemptNumber: 1 }), result({ attemptNumber: 2 })];
    const before = structuredClone(rows);
    effectiveResults(rows);
    expect(rows).toEqual(before);
  });
});

describe("evaluateStudent — the four rules", () => {
  it("passes a student who clears everything", () => {
    const out = evaluateStudent(student({ results: fullLoad() }), [], policy);
    expect(out.eligible).toBe(true);
    expect(out.remarks).toEqual([]);
    expect(out.cgpa).toBe(5);
  });

  it("reports every failed rule, not just the first", () => {
    const out = evaluateStudent(
      student({ results: [result({ score: 20, gradePoint: 0 })] }),
      [{ id: "c9", code: "CSC999" }],
      policy,
    );
    expect(out.eligible).toBe(false);
    expect(out.remarks.map((r) => r.rule)).toEqual([
      "ALL_COMPULSORY_PASSED",
      "MIN_CGPA",
      "MIN_CREDIT_UNITS",
      "NO_OUTSTANDING_FAILURES",
    ]);
  });

  it("names the failed courses in the remark", () => {
    const out = evaluateStudent(
      student({
        results: [
          ...fullLoad(),
          result({ courseId: "x", courseCode: "MTH201", score: 20, gradePoint: 0 }),
        ],
      }),
      [],
      policy,
    );
    const remark = out.remarks.find((r) => r.rule === "NO_OUTSTANDING_FAILURES")!;
    expect(remark.message).toContain("MTH201");
  });

  it("names the missing compulsory course", () => {
    const out = evaluateStudent(
      student({ results: fullLoad() }),
      [{ id: "c9", code: "CSC999" }],
      policy,
    );
    expect(out.remarks.map((r) => r.rule)).toEqual(["ALL_COMPULSORY_PASSED"]);
    expect(out.remarks[0].message).toContain("CSC999");
  });

  it("says how many units short the student is", () => {
    const out = evaluateStudent(
      student({ results: [result(), result({ courseId: "c2", courseCode: "CSC102" })] }),
      [],
      policy,
    );
    const remark = out.remarks.find((r) => r.rule === "MIN_CREDIT_UNITS")!;
    expect(remark.message).toContain("6 short");
  });

  it("counts only passed courses toward credit units", () => {
    const out = evaluateStudent(
      student({
        results: [
          ...fullLoad(),
          result({ courseId: "x", courseCode: "MTH201", score: 39, gradePoint: 0 }),
        ],
      }),
      [],
      policy,
    );
    expect(out.remarks.some((r) => r.rule === "MIN_CREDIT_UNITS")).toBe(false);
  });

  it("treats a compulsory course that was failed as not passed", () => {
    const out = evaluateStudent(
      student({ results: [...fullLoad(), result({ courseId: "c9", courseCode: "CSC999", score: 20, gradePoint: 0 })] }),
      [{ id: "c9", code: "CSC999" }],
      policy,
    );
    expect(out.remarks.some((r) => r.rule === "ALL_COMPULSORY_PASSED")).toBe(true);
  });

  it("counts a resit pass as satisfying a compulsory course", () => {
    const out = evaluateStudent(
      student({
        results: [
          ...fullLoad(),
          result({ courseId: "c9", courseCode: "CSC999", attemptNumber: 1, score: 20, gradePoint: 0 }),
          result({ courseId: "c9", courseCode: "CSC999", attemptNumber: 2, score: 55, gradePoint: 3 }),
        ],
      }),
      [{ id: "c9", code: "CSC999" }],
      policy,
    );
    expect(out.eligible).toBe(true);
  });

  it("gives a student with no results at all a specific reason", () => {
    const out = evaluateStudent(student(), [], policy);
    expect(out.eligible).toBe(false);
    expect(out.remarks.length).toBeGreaterThan(0);
    expect(out.remarks.every((r) => r.message.length > 10)).toBe(true);
  });
});

describe("the UNIPORT CGPA gate", () => {
  const atCgpa = (gradePoint: number) =>
    evaluateStudent(
      student({
        results: ["c1", "c2", "c3", "c4"].map((id, i) =>
          result({ courseId: id, courseCode: `CSC10${i + 1}`, score: 45, gradePoint }),
        ),
      }),
      [],
      policy,
    );

  it("1.00 exactly is eligible", () => {
    const out = atCgpa(1);
    expect(out.cgpa).toBe(1);
    expect(out.remarks.some((r) => r.rule === "MIN_CGPA")).toBe(false);
  });

  it("a Pass-degree CGPA of 1.00-1.49 is still eligible", () => {
    expect(atCgpa(1).eligible).toBe(true);
  });

  it("below 1.00 fails the CGPA rule", () => {
    const out = evaluateStudent(
      student({
        results: [
          result({ courseId: "c1", courseCode: "CSC101", score: 45, gradePoint: 2 }),
          result({ courseId: "c2", courseCode: "CSC102", score: 40, gradePoint: 1 }),
          result({ courseId: "c3", courseCode: "CSC103", creditUnits: 9, score: 40, gradePoint: 0 }),
          result({ courseId: "c4", courseCode: "CSC104", score: 40, gradePoint: 1 }),
        ],
      }),
      [],
      policy,
    );
    expect(out.cgpa).toBeLessThan(1);
    expect(out.remarks.some((r) => r.rule === "MIN_CGPA")).toBe(true);
  });
});

describe("evaluateCohort — determinism (§11's headline criterion)", () => {
  const cohort: StudentInput[] = [
    student({ id: "s3", matricNumber: "U2021/3020003", results: fullLoad() }),
    student({ id: "s1", matricNumber: "U2021/3020001", results: [result({ score: 20, gradePoint: 0 })] }),
    student({ id: "s2", matricNumber: "U2021/3020002", results: fullLoad() }),
  ];
  const compulsory: CompulsoryCourse[] = [
    { id: "c2", code: "CSC102" },
    { id: "c1", code: "CSC101" },
  ];

  it("same data in, same answer out", () => {
    expect(evaluateCohort(cohort, compulsory, policy)).toEqual(
      evaluateCohort(cohort, compulsory, policy),
    );
  });

  it("shuffling the input does not change the output", () => {
    expect(evaluateCohort([...cohort].reverse(), compulsory, policy)).toEqual(
      evaluateCohort(cohort, compulsory, policy),
    );
  });

  it("shuffling the compulsory list does not change the output", () => {
    expect(evaluateCohort(cohort, [...compulsory].reverse(), policy)).toEqual(
      evaluateCohort(cohort, compulsory, policy),
    );
  });

  it("always returns sorted by matric number", () => {
    expect(evaluateCohort(cohort, compulsory, policy).map((e) => e.matricNumber)).toEqual([
      "U2021/3020001",
      "U2021/3020002",
      "U2021/3020003",
    ]);
  });

  it("does not touch its inputs", () => {
    const s = structuredClone(cohort);
    const c = structuredClone(compulsory);
    evaluateCohort(cohort, compulsory, policy);
    expect(cohort).toEqual(s);
    expect(compulsory).toEqual(c);
  });

  it("every pending student carries at least one readable reason", () => {
    const pending = evaluateCohort(cohort, compulsory, policy).filter((e) => !e.eligible);
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every((e) => e.remarks.length > 0)).toBe(true);
    expect(pending.every((e) => e.remarks.every((r) => r.message.trim().length > 10))).toBe(true);
  });

  it("returns one evaluation per student", () => {
    expect(evaluateCohort(cohort, compulsory, policy)).toHaveLength(cohort.length);
  });

  it("handles an empty cohort", () => {
    expect(evaluateCohort([], compulsory, policy)).toEqual([]);
  });
});
