import { describe, expect, it } from "vitest";
import { classifyRows, type RawRow } from "./classify";

const studentsByMatric = new Map([
  ["U20183020002", "student-1"],
  ["U20183020003", "student-2"],
]);

function run(rows: RawRow[], opts?: { courseKnown?: boolean; existing?: string[] }) {
  return classifyRows({
    rows,
    studentsByMatric,
    studentsWithExistingResult: new Set(opts?.existing ?? []),
    courseKnown: opts?.courseKnown ?? true,
  });
}

describe("score handling", () => {
  it("flags a blank score as missing, not zero", () => {
    const [row] = run([{ matricNo: "U2018/3020002", totalScore: "", grade: "" }]);
    expect(row.status).toBe("INVALID_SCORE");
    expect(row.score).toBeNull();
  });

  it("keeps a score of 0 as a valid recorded result", () => {
    const [row] = run([{ matricNo: "U2018/3020002", totalScore: "0", grade: "F" }]);
    expect(row.status).toBe("VALID");
    expect(row.score).toBe(0);
  });

  it.each(["abc", "-1", "101", "65%"])("flags %s as an invalid score", (score) => {
    const [row] = run([{ matricNo: "U2018/3020002", totalScore: score, grade: "" }]);
    expect(row.status).toBe("INVALID_SCORE");
    expect(row.score).toBeNull();
  });

  it("accepts both ends of the range", () => {
    const rows = run([
      { matricNo: "U2018/3020002", totalScore: "100", grade: "A" },
      { matricNo: "U2018/3020003", totalScore: "0", grade: "F" },
    ]);
    expect(rows.map((r) => r.status)).toEqual(["VALID", "VALID"]);
  });
});

describe("student matching", () => {
  it("matches across punctuation differences", () => {
    const [row] = run([{ matricNo: "u2018-3020002", totalScore: "65", grade: "B" }]);
    expect(row.status).toBe("VALID");
    expect(row.matchedStudentId).toBe("student-1");
  });

  it("flags a matric number nobody holds", () => {
    const [row] = run([{ matricNo: "U2099/9999999", totalScore: "65", grade: "B" }]);
    expect(row.status).toBe("UNMATCHED_STUDENT");
    expect(row.matchedStudentId).toBeNull();
    expect(row.errorMessage).toContain("U2099/9999999");
  });

  it("keeps the raw matric number exactly as it was typed", () => {
    const [row] = run([{ matricNo: "  u2018-3020002  ", totalScore: "65", grade: "B" }]);
    expect(row.matricNumberRaw).toBe("u2018-3020002");
  });
});

describe("duplicates", () => {
  it("keeps the first occurrence and flags the second", () => {
    const rows = run([
      { matricNo: "U2018/3020002", totalScore: "65", grade: "B" },
      { matricNo: "u2018-3020002", totalScore: "70", grade: "A" },
    ]);
    expect(rows.map((r) => r.status)).toEqual(["VALID", "DUPLICATE"]);
  });

  it("flags a student who already has a result on this course", () => {
    const [row] = run([{ matricNo: "U2018/3020002", totalScore: "65", grade: "B" }], {
      existing: ["student-1"],
    });
    expect(row.status).toBe("DUPLICATE");
  });

  it("defers the database duplicate check when the course is unknown", () => {
    const [row] = run([{ matricNo: "U2018/3020002", totalScore: "65", grade: "B" }], {
      courseKnown: false,
      existing: ["student-1"],
    });
    expect(row.status).toBe("VALID");
  });
});

describe("grade column", () => {
  it("flags a grade that contradicts the score", () => {
    const [row] = run([{ matricNo: "U2018/3020002", totalScore: "45", grade: "A" }]);
    expect(row.status).toBe("GRADE_MISMATCH");
    expect(row.errorMessage).toContain("D");
  });

  it("accepts a blank grade, because the score is what counts", () => {
    const [row] = run([{ matricNo: "U2018/3020002", totalScore: "45", grade: "" }]);
    expect(row.status).toBe("VALID");
    expect(row.gradeRaw).toBeNull();
  });

  it("ignores casing and padding in the grade", () => {
    const [row] = run([{ matricNo: "U2018/3020002", totalScore: "75", grade: " a " }]);
    expect(row.status).toBe("VALID");
    expect(row.gradeRaw).toBe("A");
  });
});

describe("purity", () => {
  it("returns one row out for every row in, in the same order", () => {
    const rows: RawRow[] = [
      { matricNo: "U2018/3020002", totalScore: "65", grade: "B" },
      { matricNo: "BAD", totalScore: "65", grade: "B" },
      { matricNo: "U2018/3020003", totalScore: "", grade: "" },
    ];
    const out = run(rows);
    expect(out).toHaveLength(3);
    expect(out.map((r) => r.matricNumberRaw)).toEqual(["U2018/3020002", "BAD", "U2018/3020003"]);
  });

  it("gives the same answer every time it is called", () => {
    const rows: RawRow[] = [
      { matricNo: "U2018/3020002", totalScore: "65", grade: "B" },
      { matricNo: "u2018-3020002", totalScore: "70", grade: "A" },
      { matricNo: "U2099/1", totalScore: "50", grade: "C" },
    ];
    expect(run(rows)).toEqual(run(rows));
  });

  it("does not touch the input", () => {
    const rows: RawRow[] = [{ matricNo: "U2018/3020002", totalScore: "65", grade: "B" }];
    const before = structuredClone(rows);
    run(rows);
    expect(rows).toEqual(before);
  });
});

describe("CA + Exam sheets (the real UNIPORT template)", () => {
  it("adds the components instead of reading the Total column", () => {
    const [row] = run([
      { matricNo: "U2018/3020002", caScore: "25", examScore: "55", totalScore: "", grade: "" },
    ]);
    expect(row.status).toBe("VALID");
    expect(row.score).toBe(80);
    expect([row.caScore, row.examScore]).toEqual([25, 55]);
  });

  it("keeps the components on a flagged row too", () => {
    const [row] = run([
      { matricNo: "U2099/9999999", caScore: "25", examScore: "55", totalScore: "", grade: "" },
    ]);
    expect(row.status).toBe("UNMATCHED_STUDENT");
    expect(row.score).toBe(80);
  });

  it("checks the derived total against the grade column", () => {
    const [row] = run([
      { matricNo: "U2018/3020002", caScore: "18", examScore: "20", totalScore: "", grade: "A" },
    ]);
    expect(row.status).toBe("GRADE_MISMATCH");
    expect(row.errorMessage).toContain("is a F");
  });

  it("flags an out-of-range CA", () => {
    const [row] = run([
      { matricNo: "U2018/3020002", caScore: "45", examScore: "40", totalScore: "", grade: "" },
    ]);
    expect(row.status).toBe("INVALID_SCORE");
    expect(row.errorMessage).toContain("0-30");
  });

  it("flags a typed Total that contradicts the components", () => {
    const [row] = run([
      { matricNo: "U2018/3020002", caScore: "25", examScore: "55", totalScore: "90", grade: "" },
    ]);
    expect(row.status).toBe("INVALID_SCORE");
    expect(row.errorMessage).toContain("does not match");
  });
});

describe("a blank grade column is normal, not an error", () => {
  it("accepts the real template, which never fills Grade", () => {
    const [row] = run([
      { matricNo: "U2018/3020002", caScore: "25", examScore: "55", totalScore: "", grade: "" },
    ]);
    expect(row.status).toBe("VALID");
    expect(row.gradeRaw).toBeNull();
  });

  it("still catches a sheet grade that contradicts the score", () => {
    const [row] = run([
      { matricNo: "U2018/3020002", caScore: "25", examScore: "55", totalScore: "", grade: "C" },
    ]);
    expect(row.status).toBe("GRADE_MISMATCH");
  });

  it("accepts a sheet grade that agrees", () => {
    const [row] = run([
      { matricNo: "U2018/3020002", caScore: "25", examScore: "55", totalScore: "", grade: "a" },
    ]);
    expect(row.status).toBe("VALID");
  });
});
