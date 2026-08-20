# Gradelis — Implementation Plan

Covers PRD **§9 Review Queue (HOD)** and **§11 Graduation Evaluation**, plus the
ingestion pipeline both depend on and which does not exist yet.

Everything follows the existing server-action convention established in
[`lib/actions/login.ts`](../lib/actions/login.ts): `"use server"`, zod-parse the
input, return a typed result object, never throw at the caller.

**House rule on comments.** Keep them short and in plain words. One line where
possible — say what the code does, or the one thing that would trip somebody up.
No spec-clause references (`R5 —`, `D3 —`) inside code; the reasoning lives in
this document, which is why this document exists.

---

## 0. What actually has to be built

The PRD describes the *back half* of a pipeline whose *front half* is missing.
Today the adviser wizard parses Excel in the browser, validates in the browser,
and then calls `markSubmitted()` — a Zustand flag.
[`confirm-submit/page.tsx:66`](../app/adviser/upload-result/confirm-submit/page.tsx)
still carries `TODO: Replace this with your server action/API call`. No
`UploadBatch`, `UploadFile` or `UploadRow` row is ever written, so there is
nothing for a review queue to review.

| # | Capability | PRD | Exists? |
|---|---|---|---|
| 1 | Persist an upload as `UploadBatch` → `UploadFile` → `UploadRow` | precondition | ❌ |
| 2 | Match course code → `Course`, matric → `Student` | precondition | ❌ |
| 3 | Auto-commit clean rows to `StudentResult` | §9 R5 | ❌ |
| 4 | Flag ambiguous rows/files | §9 R1 | ❌ |
| 5 | HOD queue listing flagged items grouped by batch | §9 R1–R2 | ❌ |
| 6 | Match candidate suggestions | §9 R2 | ❌ |
| 7 | Resolve / reject a file, cascading to rows | §9 R3, R6 | ❌ |
| 8 | Resolve / reject a row | §9 R4–R6 | ❌ |
| 9 | Resolution audit trail | §9 R7 | ❌ (no schema fields) |
| 10 | Credit-weighted CGPA | §11 R3 | ❌ |
| 11 | Four-rule eligibility engine | §11 R4–R5 | ❌ |
| 12 | `GraduationRun` + `EligibilityRunItem` writes | §11 R1, R6–R7 | ❌ (models exist, unused) |
| 13 | Eligible / pending views | §11 R8 | ❌ |
| 14 | Server-side role enforcement | both | ⚠️ `requireRole` exists, zero call sites |

---

## Decisions taken (say so now, not in code review)

**D1 — The server re-parses the file; it does not trust client-parsed rows.**
The wizard's browser-side parse stays, but only as a *preview* affordance. The
action receives the raw `File` and runs `parseExcelFile` again server-side.
`parseExcelFile` is already isomorphic (`File.arrayBuffer()` + `XLSX.read`), so
this needs no rewrite. Scores are permanent academic record; a client-supplied
number is an unsigned assertion.

**D2 — Score is authoritative; grade is recomputed.** The sheet's Grade column
is stored raw for audit but never used for CGPA. `gradePoint` is derived from
score via one shared scale — A/B/C/D/E/F at 70/60/50/45/40, points 5 down to 0.
**Confirmed as UNIPORT's official scale on 2026-08-20.**

**D3 — A grade/score disagreement is a flag, not a warning.** This needs a new
`UploadRowStatus.GRADE_MISMATCH`. It is *not* in the PRD's list, but the PRD's
own success criterion — nothing uncertain enters the record without a human
decision — implies it. A sheet where the grade column contradicts the score
column is internally inconsistent source data.

**D4 — `GraduationRun.academicSession` holds the cohort's *entry* session**, and
is matched against `Student.entrySession`. The PRD says "trigger for one
`academicSession` (graduating cohort)"; a cohort is identified by entry year.
⚠️ Confirm with the department before shipping — it is the one genuine ambiguity
in §11.

**D5 — Resit policy: latest attempt supersedes.** The highest `attemptNumber`
per `courseId` is the effective result. Earlier attempts do not drag CGPA down.

**D6 — Each run snapshots the policy it used** (`GraduationRun.policy: Json`).
§11 R9 requires a completed run to stay exactly as it was. If the minimum CGPA
constant changes next year, a run from this year must still be interpretable.

**D7 — Mutations call `refresh()` from `next/cache`, not `revalidatePath`.**
Queue and report pages are uncached dynamic RSC reads (they hit Prisma with no
`use cache`). `refresh()` re-renders the current route from a Server Action,
which is the Next 16 read-your-own-writes path. `revalidatePath` is used only
when a mutation must invalidate a *different* route.

---

## Batch sequence

Each batch is independently shippable and leaves the app in a working state.

```
Batch 0  Foundations ─────────┬─→ Batch 5  Graduation engine (pure)
  schema · grading · guards   │     └─→ Batch 6  Graduation run + views
         │                    │
         ▼                    │
Batch 1  Ingestion ───→ Batch 2  Auto-commit ───→ Batch 3  Queue read
                                                        └─→ Batch 4  Queue resolve
```

Batches 5–6 have no dependency on 1–4 and can run in parallel by a second
developer — the only shared file is `lib/grading.ts` from Batch 0.

| Batch | Deliverable | Blocks |
|---|---|---|
| 0 | Schema migration, grading scale, action contract, role guards | everything |
| 1 | Upload persists as batch/file/rows with matching + flags | 2, 3 |
| 2 | Clean rows auto-commit to `StudentResult` | 4 |
| 3 | HOD queue read model + candidate suggestions | 4 |
| 4 | Resolve / reject actions | — |
| 5 | Pure eligibility engine + unit tests | 6 |
| 6 | `GraduationRun` action + eligible/pending views | — |

---

# Batch 0 — Foundations

**Goal.** Everything later batches assume: schema fields for audit and
rejection, one grading scale, one action-result shape, and role guards that are
actually called.

**Why first.** Three of these are cross-cutting. Introducing them later means
touching every file written in batches 1–6.

## 0.1 Schema migration

`prisma/schema.prisma` — additions only, no destructive changes.

```prisma
enum UploadFileStatus {
  VALID
  UNMATCHED_COURSE
  PROCESSING
  FAILED
  COMPLETED
  REJECTED          // NEW — §9 R6: rejected ≠ deleted
}

enum UploadRowStatus {
  VALID
  UNMATCHED_STUDENT
  DUPLICATE
  INVALID_SCORE
  GRADE_MISMATCH    // NEW — see D3
  IMPORTED
  REJECTED          // NEW — §9 R6
}
```

```prisma
model UploadFile {
  // ... existing fields unchanged ...

  resolvedById   String?
  resolvedBy     User?     @relation("UploadFileResolvedBy", fields: [resolvedById], references: [id])
  resolvedAt     DateTime?
  resolutionNote String?
}

model UploadRow {
  // ... existing fields unchanged ...

  gradeRaw       String?   // NEW — §9 R2 needs the raw submitted value

  resolvedById   String?
  resolvedBy     User?     @relation("UploadRowResolvedBy", fields: [resolvedById], references: [id])
  resolvedAt     DateTime?
  resolutionNote String?
}

model User {
  // ... existing relations unchanged ...

  uploadFilesResolved UploadFile[] @relation("UploadFileResolvedBy")
  uploadRowsResolved  UploadRow[]  @relation("UploadRowResolvedBy")
}

model GraduationRun {
  // ... existing fields unchanged ...

  policy Json?    // NEW — D6: snapshot of thresholds this run used
  status GraduationStatus @default(PENDING)
}

enum GraduationStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED            // NEW — a crashed run must not sit at RUNNING forever
}
```

```bash
npx prisma migrate dev --name review_queue_and_graduation_audit
```

## 0.2 `lib/grading.ts` — one grading scale

Right now the score→grade mapping lives inline in
[`validation-progress/page.tsx`](../app/adviser/upload-result/validation-progress/page.tsx)
and nowhere else. CGPA needs grade *points*, which do not exist at all. Both must
come from one place or they will drift.

Note: **no `server-only`** here. The wizard preview uses it client-side too.

```ts
// lib/grading.ts

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

export function gradeForScore(score: number): GradeLetter {
  return (GRADE_SCALE.find((g) => score >= g.min) ?? GRADE_SCALE.at(-1)!).grade;
}

export function gradePointForScore(score: number): number {
  return (GRADE_SCALE.find((g) => score >= g.min) ?? GRADE_SCALE.at(-1)!).point;
}

export function isPass(score: number): boolean {
  return score >= PASS_MARK;
}

export function isValidScore(score: unknown): score is number {
  return typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 100;
}
```

Then delete `calculateExpectedGrade` from the validation-progress page and import
`gradeForScore` instead.

## 0.3 `lib/actions/result.ts` — the action contract

`login.ts` uses `FormState` because it drives `useActionState`. Most actions here
are invoked from a click handler with `useTransition`, not a form, and need to
return data (a batch id, a run id). One discriminated union covers both.

```ts
// lib/actions/result.ts

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; message: string; errors?: Record<string, string[]> };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(
  message: string,
  errors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, message, errors };
}
```

## 0.4 `lib/auth-guard.ts` — guards that return instead of throwing

The current version throws `new Error("Forbidden")`. In production a thrown
error inside a Server Action reaches the client as an opaque digest, so the user
sees "an error occurred" instead of "you are not permitted to do this". It also
has zero call sites today, so changing it is free.

```ts
// lib/auth-guard.ts
import "server-only";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";

export type Actor = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export async function currentActor(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role as UserRole,
  };
}

export type GuardResult =
  | { ok: true; actor: Actor }
  | { ok: false; message: string };

export async function requireRole(...allowed: UserRole[]): Promise<GuardResult> {
  const actor = await currentActor();

  if (!actor) {
    return { ok: false, message: "You are not signed in." };
  }

  if (!allowed.includes(actor.role)) {
    return { ok: false, message: "You are not permitted to perform this action." };
  }

  return { ok: true, actor };
}
```

Also tighten `types/next-auth.d.ts` so `session.user.role` is `UserRole` rather
than `string`, and the cast above becomes unnecessary:

```ts
import type { UserRole } from "@/generated/prisma";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: UserRole } & DefaultSession["user"];
  }
  interface User {
    role: UserRole;
  }
}
```

> **Why a guard at all when `proxy.ts` already redirects?** Proxy protects
> *navigation*. A Server Action is an RPC endpoint reachable by POST regardless
> of which page the caller is on. Without an in-action check, a signed-in
> LECTURER can invoke `resolveUploadRow` directly.

## How to test Batch 0

```bash
npx prisma migrate dev --name review_queue_and_graduation_audit
npx prisma generate
npx tsc --noEmit          # expect clean
npm run build             # expect clean
```

Confirm the migration is additive — no `DROP` statements:

```bash
grep -iE "drop (table|column)" prisma/migrations/*/migration.sql
```

Grading scale, once Batch 5's test harness is in place:

```ts
expect(gradeForScore(70)).toBe("A");
expect(gradeForScore(69.9)).toBe("B");
expect(gradeForScore(40)).toBe("E");
expect(gradeForScore(39.9)).toBe("F");
expect(gradePointForScore(0)).toBe(0);
```

Boundary values are the whole point — 70, 60, 50, 45, 40 and the value just
below each.

---

# Batch 1 — Ingestion

**Goal.** The wizard's Submit button writes a real `UploadBatch` → `UploadFile`
→ `UploadRow[]`, with course and student matching applied and every row carrying
a status.

**Why.** This is the missing front half. §9 has nothing to display until rows
exist in the database with flags on them.

## 1.1 `lib/upload/normalize.ts` — matching keys

Matric numbers arrive as `u2018-3020002`, `U2018/3020002`, `U2018 3020002`.
Course codes as `CSC401`, `CSC 401`, `csc-401`. Matching has to be
punctuation- and case-insensitive on both sides.

```ts
// lib/upload/normalize.ts
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
```

> Because normalization strips punctuation, the DB side must be normalized too —
> you cannot `WHERE matricNumber = ?`. The action below fetches the student set
> once and builds an in-memory `Map`. At department scale (hundreds to low
> thousands) that is one indexed query and a cheap map. If the student table
> grows past ~50k, add a persisted `matricNormalized` column with a unique index
> and match on that instead.

## 1.2 `lib/upload/classify.ts` — the flagging rules, as a pure function

Every decision about *why* a row is flagged lives here, with no Prisma import
and no I/O. That is deliberate: it makes the highest-risk logic in the system
unit-testable with plain objects, and it is the same function Batch 4 re-runs
after the HOD corrects a course code.

```ts
// lib/upload/classify.ts
import { UploadRowStatus } from "@/generated/prisma";
import { gradeForScore, isValidScore } from "@/lib/grading";
import { normalizeMatric } from "./normalize";

export type RawRow = { matricNo: string; totalScore: string; grade: string };

export type ClassifiedRow = {
  matricNumberRaw: string;
  gradeRaw: string | null;
  score: number | null;
  matchedStudentId: string | null;
  status: UploadRowStatus;
  errorMessage: string | null;
};

export type ClassifyInput = {
  rows: RawRow[];
  /** clean matric → student id */
  studentsByMatric: Map<string, string>;
  /** students that already have a result for this course */
  studentsWithExistingResult: Set<string>;
  /** false means we still don't know the course */
  courseKnown: boolean;
};

export function classifyRows({
  rows,
  studentsByMatric,
  studentsWithExistingResult,
  courseKnown,
}: ClassifyInput): ClassifiedRow[] {
  const seenInFile = new Set<string>();

  return rows.map((row) => {
    const matricNumberRaw = row.matricNo.trim();
    const key = normalizeMatric(matricNumberRaw);
    const gradeRaw = row.grade.trim() ? row.grade.trim().toUpperCase() : null;
    const matchedStudentId = studentsByMatric.get(key) ?? null;

    const rawScore = row.totalScore.trim();
    const parsed = rawScore === "" ? null : Number(rawScore);

    const base = { matricNumberRaw, gradeRaw, matchedStudentId };

    // 1. Empty score means no result. It does not mean zero.
    if (rawScore === "") {
      return {
        ...base,
        score: null,
        status: UploadRowStatus.INVALID_SCORE,
        errorMessage: "No score recorded for this student.",
      };
    }

    if (!isValidScore(parsed)) {
      return {
        ...base,
        score: null,
        status: UploadRowStatus.INVALID_SCORE,
        errorMessage: `Score "${rawScore}" is not a number between 0 and 100.`,
      };
    }

    const score = parsed;

    // 2. The matric number must belong to a real student.
    if (!matchedStudentId) {
      return {
        ...base,
        score,
        status: UploadRowStatus.UNMATCHED_STUDENT,
        errorMessage: `No student on record with matric number "${matricNumberRaw}".`,
      };
    }

    // 3. Same student showing up twice in one file.
    if (seenInFile.has(key)) {
      return {
        ...base,
        score,
        status: UploadRowStatus.DUPLICATE,
        errorMessage: `"${matricNumberRaw}" appears more than once in this file.`,
      };
    }
    seenInFile.add(key);

    // 4. Student already has a result here. Only checkable once we know the course.
    if (courseKnown && studentsWithExistingResult.has(matchedStudentId)) {
      return {
        ...base,
        score,
        status: UploadRowStatus.DUPLICATE,
        errorMessage: "A result already exists for this student on this course and session.",
      };
    }

    // 5. Grade column must agree with score column.
    const expected = gradeForScore(score);
    if (gradeRaw && gradeRaw !== expected) {
      return {
        ...base,
        score,
        status: UploadRowStatus.GRADE_MISMATCH,
        errorMessage: `Sheet grade "${gradeRaw}" contradicts score ${score}, which is a ${expected}.`,
      };
    }

    return { ...base, score, status: UploadRowStatus.VALID, errorMessage: null };
  });
}
```

## 1.3 `lib/actions/upload-results.ts` — the ingestion action

```ts
// lib/actions/upload-results.ts
"use server";

import { z } from "zod";
import { Prisma, UploadBatchStatus, UploadFileStatus, UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { ExcelParseError, parseExcelFile } from "@/lib/parse-excel";
import { classifyRows } from "@/lib/upload/classify";
import {
  normalizeCourseCode,
  normalizeMatric,
  normalizeSemester,
  normalizeSession,
} from "@/lib/upload/normalize";

export type UploadSubmitState = {
  message?: string;
  errors?: Record<string, string[]>;
  batchId?: string;
  imported?: number;
  flagged?: number;
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const fileSchema = z
  .instanceof(File, { message: "Please choose an Excel file." })
  .refine(
    (file) => /\.(xlsx|xls)$/i.test(file.name),
    "Only .xlsx and .xls files are allowed.",
  )
  .refine((file) => file.size <= MAX_FILE_SIZE_BYTES, "File must be 10 MB or smaller.");

export async function submitResultUpload(
  _prev: UploadSubmitState,
  formData: FormData,
): Promise<UploadSubmitState> {
  const guard = await requireRole(UserRole.LECTURER);
  if (!guard.ok) return { message: guard.message };

  const parsedFile = fileSchema.safeParse(formData.get("file"));
  if (!parsedFile.success) {
    return { message: z.flattenError(parsedFile.error).formErrors[0] ?? "Invalid file." };
  }
  const file = parsedFile.data;

  // Read the file again here. The browser one was just for show.
  let parsed;
  try {
    parsed = await parseExcelFile(file);
  } catch (error) {
    return {
      message:
        error instanceof ExcelParseError
          ? error.message
          : "Could not read this file.",
    };
  }

  const { metadata, rows } = parsed;

  const academicSession = normalizeSession(metadata.session);
  const semester = normalizeSemester(metadata.semester);

  if (!academicSession) {
    return { message: `Could not read the academic session from cell E3 (found "${metadata.session}").` };
  }
  if (!semester) {
    return { message: `Could not read the semester from cell E4 (found "${metadata.semester}").` };
  }

  // ---- Find the course and the students ----

  const courseKey = normalizeCourseCode(metadata.courseCode);
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, code: true },
  });
  const matchedCourse =
    courses.find((c) => normalizeCourseCode(c.code) === courseKey) ?? null;

  const students = await prisma.student.findMany({
    select: { id: true, matricNumber: true },
  });
  const studentsByMatric = new Map(
    students.map((s) => [normalizeMatric(s.matricNumber), s.id]),
  );

  const studentsWithExistingResult = new Set<string>();
  if (matchedCourse) {
    const existing = await prisma.studentResult.findMany({
      where: { courseId: matchedCourse.id, academicSession },
      select: { studentId: true },
    });
    for (const r of existing) studentsWithExistingResult.add(r.studentId);
  }

  const classified = classifyRows({
    rows,
    studentsByMatric,
    studentsWithExistingResult,
    courseKnown: matchedCourse !== null,
  });

  // ---- Save it. All or nothing. ----

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.uploadBatch.create({
      data: {
        uploadedById: guard.actor.id,
        status: UploadBatchStatus.PROCESSING,
        files: {
          create: {
            fileName: file.name,
            courseCodeRaw: metadata.courseCode,
            academicSessionRaw: metadata.session,
            semesterRaw: metadata.semester,
            matchedCourseId: matchedCourse?.id ?? null,
            status: matchedCourse ? UploadFileStatus.VALID : UploadFileStatus.UNMATCHED_COURSE,
            errorMessage: matchedCourse
              ? null
              : `No active course matches the code "${metadata.courseCode}".`,
            rows: {
              create: classified.map((row) => ({
                matricNumberRaw: row.matricNumberRaw,
                gradeRaw: row.gradeRaw,
                score: row.score,
                matchedStudentId: row.matchedStudentId,
                status: row.status,
                errorMessage: row.errorMessage,
              })),
            },
          },
        },
      },
      include: { files: { include: { rows: true } } },
    });

    return created;
  });

  const flagged = classified.filter((r) => r.status !== "VALID").length;

  return {
    message: "success",
    batchId: batch.id,
    imported: 0, // Batch 2 fills this in
    flagged: flagged + (matchedCourse ? 0 : 1),
  };
}
```

## 1.4 Wire the wizard to it

`app/adviser/upload-result/confirm-submit/page.tsx` currently calls
`markSubmitted()` and nothing else. The real `File` must survive to this step —
today only `{ name, size }` is kept in Zustand, and a `File` cannot be persisted
to `localStorage`. Two options:

- **Keep the `File` in a non-persisted store slice** (add `rawFile: File | null`
  to `WizardState`, leave it out of `partialize`). Simple; a page reload loses
  the file and sends the adviser back to step 1.
- **Upload on step 1**, submit on step 5 by `batchId`. More robust, more work.

Take the first now; it matches the wizard's existing behaviour.

```tsx
const rawFile = useUploadWizardStore((s) => s.rawFile);
const [state, formAction, pending] = useActionState(submitResultUpload, {});

const handleSubmit = () => {
  if (!rawFile) return;
  const data = new FormData();
  data.set("file", rawFile);
  startTransition(() => formAction(data));
};
```

## How to test Batch 1

**Unit — `classifyRows`, no database.** This is the batch's real test surface.

```ts
const studentsByMatric = new Map([["U20183020002", "student-1"]]);

it("flags a blank score as missing, not zero", () => {
  const [row] = classifyRows({
    rows: [{ matricNo: "U2018/3020002", totalScore: "", grade: "" }],
    studentsByMatric,
    studentsWithExistingResult: new Set(),
    courseKnown: true,
  });
  expect(row.status).toBe("INVALID_SCORE");
  expect(row.score).toBeNull();
});

it("matches across punctuation differences", () => {
  const [row] = classifyRows({
    rows: [{ matricNo: "u2018-3020002", totalScore: "65", grade: "B" }],
    studentsByMatric,
    studentsWithExistingResult: new Set(),
    courseKnown: true,
  });
  expect(row.status).toBe("VALID");
  expect(row.matchedStudentId).toBe("student-1");
});

it("keeps a score of 0 as a valid recorded result", () => { /* status VALID, score 0 */ });
it("flags the second occurrence of a matric number as DUPLICATE", () => { /* … */ });
it("defers the DB duplicate check when courseKnown is false", () => { /* … */ });
it("flags a grade that contradicts the score", () => { /* GRADE_MISMATCH */ });
```

**Integration — against the dev database.**

```bash
docker compose up -d
npx prisma migrate deploy && npx prisma db seed
npm run dev
```

Sign in as `lecturer@gradelis.com` / `password123`, upload a sheet, then:

```bash
npx prisma studio     # inspect UploadBatch → UploadFile → UploadRow
```

Assert by hand: one `UploadBatch`; one `UploadFile` whose `matchedCourseId` is
set (or status `UNMATCHED_COURSE`); row count equal to the sheet's student rows;
every row carrying a status and, where flagged, a human-readable `errorMessage`.

**Deliberately break it.** Upload a sheet with a bogus course code in B3 → file
status `UNMATCHED_COURSE` and rows still persisted. Upload the same sheet twice
→ second batch's rows all `DUPLICATE`.

---

# Batch 2 — Auto-commit

**Goal.** Rows that pass every check become `StudentResult` records
automatically; flagged rows are left alone for the HOD.

**Why.** §9's scope says a resolved row must "produce a `StudentResult` through
the same path as an auto-committed row". That only holds if there *is* one path.
This batch writes it once, and Batch 4 calls the same function.

## 2.1 `lib/upload/commit.ts` — the single commit path

```ts
// lib/upload/commit.ts
import "server-only";
import { Prisma, ResultStatus, UploadRowStatus } from "@/generated/prisma";
import { gradeForScore, gradePointForScore } from "@/lib/grading";

export type CommitRowArgs = {
  uploadRowId: string;
  studentId: string;
  courseId: string;
  academicSession: string;
  score: number;
};

/**
 * The only entry point into StudentResult. Auto and HOD approval both pass here.
 * Keep it inside a transaction.
 */
export async function commitRow(
  tx: Prisma.TransactionClient,
  args: CommitRowArgs,
) {
  // A resit is a new attempt, not a replacement.
  const priorAttempts = await tx.studentResult.count({
    where: { studentId: args.studentId, courseId: args.courseId },
  });

  const result = await tx.studentResult.create({
    data: {
      studentId: args.studentId,
      courseId: args.courseId,
      academicSession: args.academicSession,
      score: args.score,
      grade: gradeForScore(args.score),        // we work it out, we don't trust the sheet
      gradePoint: gradePointForScore(args.score),
      attemptNumber: priorAttempts + 1,
      status: ResultStatus.POSTED,
    },
  });

  await tx.uploadRow.update({
    where: { id: args.uploadRowId },
    data: {
      studentResultId: result.id,
      matchedStudentId: args.studentId,
      status: UploadRowStatus.IMPORTED,
      errorMessage: null,
    },
  });

  return result;
}
```

## 2.2 `lib/upload/commit-batch.ts` — commit every clean row in a file

```ts
// lib/upload/commit-batch.ts
import "server-only";
import {
  Prisma,
  UploadBatchStatus,
  UploadFileStatus,
  UploadRowStatus,
} from "@/generated/prisma";
import { commitRow } from "./commit";
import { normalizeSession } from "./normalize";

/** Save every clean row. Returns how many went in. */
export async function commitValidRows(
  tx: Prisma.TransactionClient,
  uploadFileId: string,
): Promise<number> {
  const file = await tx.uploadFile.findUnique({
    where: { id: uploadFileId },
    include: { rows: { where: { status: UploadRowStatus.VALID } } },
  });

  if (!file || !file.matchedCourseId) return 0;

  const academicSession = normalizeSession(file.academicSessionRaw);
  if (!academicSession) return 0;

  let imported = 0;

  for (const row of file.rows) {
    if (!row.matchedStudentId || row.score === null) continue;

    await commitRow(tx, {
      uploadRowId: row.id,
      studentId: row.matchedStudentId,
      courseId: file.matchedCourseId,
      academicSession,
      score: row.score,
    });

    imported += 1;
  }

  // Only mark it done when nothing is still waiting.
  const outstanding = await tx.uploadRow.count({
    where: {
      uploadFileId,
      status: { notIn: [UploadRowStatus.IMPORTED, UploadRowStatus.REJECTED] },
    },
  });

  if (outstanding === 0 && file.status !== UploadFileStatus.REJECTED) {
    await tx.uploadFile.update({
      where: { id: uploadFileId },
      data: { status: UploadFileStatus.COMPLETED },
    });
  }

  return imported;
}

/** Batch status just follows its files. */
export async function syncBatchStatus(
  tx: Prisma.TransactionClient,
  uploadBatchId: string,
): Promise<void> {
  const outstanding = await tx.uploadFile.count({
    where: {
      uploadBatchId,
      status: { notIn: [UploadFileStatus.COMPLETED, UploadFileStatus.REJECTED] },
    },
  });

  await tx.uploadBatch.update({
    where: { id: uploadBatchId },
    data: {
      status: outstanding === 0 ? UploadBatchStatus.COMPLETED : UploadBatchStatus.PROCESSING,
    },
  });
}
```

## 2.3 Hook it into ingestion

At the end of `submitResultUpload`'s transaction, before returning:

```ts
const fileId = created.files[0].id;
const imported = await commitValidRows(tx, fileId);
await syncBatchStatus(tx, created.id);
return { batch: created, imported };
```

The adviser now gets a real number back: *"142 results imported, 6 items sent to
the HOD for review."*

> **Transaction timeout.** `commitRow` issues two statements per row, so a
> 400-row sheet is ~800 round trips inside one transaction. Prisma's default
> interactive-transaction timeout is 5s. Raise it explicitly:
> `prisma.$transaction(fn, { timeout: 30_000, maxWait: 10_000 })`. If sheets get
> much larger than that, move commit to a background job keyed on `UploadBatch`
> — the model already has a `PROCESSING` status for exactly this.

## How to test Batch 2

**Unit.** `commitRow` takes a `Prisma.TransactionClient`, so it can be called
with a stub — assert that `create` receives a derived grade and grade point, and
that `attemptNumber` is `priorAttempts + 1`.

**Integration.** Upload a clean sheet, then:

```bash
npx prisma studio
```

- every `UploadRow` is `IMPORTED` with a non-null `studentResultId`
- a matching `StudentResult` exists per row, `status = POSTED`
- `grade` and `gradePoint` agree with `GRADE_SCALE` — *not* with the sheet's
  grade column, if the two differ
- `UploadFile.status = COMPLETED`, `UploadBatch.status = COMPLETED`

**The resit case.** Upload the same course for a *different* session for a
student who already has a result. Expect a second `StudentResult` with
`attemptNumber = 2`, and the first row untouched. This is the assertion most
likely to catch a mistake — the unique constraint will throw loudly if
`attemptNumber` is computed wrong.

**The partial case.** Upload a sheet with 3 good rows and 2 unknown matric
numbers. Expect 3 `StudentResult` rows, 2 rows left at `UNMATCHED_STUDENT`,
`UploadFile.status` still `VALID` (not `COMPLETED`), `UploadBatch.status` still
`PROCESSING`. **Nothing should be `COMPLETED` while an item awaits a decision** —
that is §9's core invariant expressed as a status check.

---

# Batch 3 — Review queue (read side)

**Goal.** The HOD sees every flagged file and row, grouped by batch, with enough
context to decide without opening the spreadsheet.

**Why separate from Batch 4?** R2 — "enough context to resolve it without
leaving the screen" — is the requirement most likely to be under-built. Candidate
suggestion is real work and deserves its own slice.

## 3.1 `lib/upload/candidates.ts` — closest matches (pure)

R2 asks for "closest matching candidates (e.g. similarly-named
students/courses)". A typo'd matric number is one or two characters off, so
Levenshtein distance over the normalized key is the right tool and is about
twenty lines.

```ts
// lib/upload/candidates.ts

/** How many letters you'd change to turn a into b. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }

  return prev[b.length];
}

/** 1 = identical, 0 = nothing in common. */
export function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  return longest === 0 ? 1 : 1 - editDistance(a, b) / longest;
}

export type Candidate<T> = { item: T; score: number };

/** Closest matches first. Ties sort by name so the list never shuffles. */
export function suggestCandidates<T>(
  raw: string,
  pool: T[],
  key: (item: T) => string,
  { limit = 5, minScore = 0.5 }: { limit?: number; minScore?: number } = {},
): Candidate<T>[] {
  return pool
    .map((item) => ({ item, score: similarity(raw, key(item)) }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score || key(a.item).localeCompare(key(b.item)))
    .slice(0, limit);
}
```

## 3.2 `lib/queries/review-queue.ts` — the read model

A query module, not a server action: this is called from an RSC page, so it is a
plain `async` function guarded by `server-only`.

```ts
// lib/queries/review-queue.ts
import "server-only";
import { UploadFileStatus, UploadRowStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { suggestCandidates } from "@/lib/upload/candidates";
import { normalizeCourseCode, normalizeMatric } from "@/lib/upload/normalize";

/** Anything still waiting for a decision. */
const OPEN_ROW_STATUSES = [
  UploadRowStatus.UNMATCHED_STUDENT,
  UploadRowStatus.DUPLICATE,
  UploadRowStatus.INVALID_SCORE,
  UploadRowStatus.GRADE_MISMATCH,
];

const OPEN_FILE_STATUSES = [
  UploadFileStatus.UNMATCHED_COURSE,
  UploadFileStatus.FAILED,
];

export async function getReviewQueue() {
  const batches = await prisma.uploadBatch.findMany({
    where: {
      files: {
        some: {
          OR: [
            { status: { in: OPEN_FILE_STATUSES } },
            { rows: { some: { status: { in: OPEN_ROW_STATUSES } } } },
          ],
        },
      },
    },
    orderBy: { uploadedAt: "desc" },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      files: {
        include: {
          matchedCourse: { select: { id: true, code: true, title: true } },
          rows: {
            where: { status: { in: OPEN_ROW_STATUSES } },
            orderBy: { matricNumberRaw: "asc" },
          },
          _count: { select: { rows: true } },
        },
      },
    },
  });

  // Two queries for the whole page, not two per item.
  const [courses, students] = await Promise.all([
    prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, code: true, title: true },
    }),
    prisma.student.findMany({
      select: { id: true, matricNumber: true, fullName: true, currentLevel: true },
    }),
  ]);

  return batches.map((batch) => ({
    id: batch.id,
    uploadedAt: batch.uploadedAt,
    uploadedBy: batch.uploadedBy,
    files: batch.files.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      status: file.status,
      errorMessage: file.errorMessage,
      totalRows: file._count.rows,
      matchedCourse: file.matchedCourse,

      raw: {
        courseCode: file.courseCodeRaw,
        session: file.academicSessionRaw,
        semester: file.semesterRaw,
      },

      // Suggest courses that look close.
      courseCandidates:
        file.status === UploadFileStatus.UNMATCHED_COURSE
          ? suggestCandidates(
              normalizeCourseCode(file.courseCodeRaw),
              courses,
              (c) => normalizeCourseCode(c.code),
            )
          : [],

      rows: file.rows.map((row) => ({
        id: row.id,
        matricNumberRaw: row.matricNumberRaw,
        gradeRaw: row.gradeRaw,
        score: row.score,
        status: row.status,
        errorMessage: row.errorMessage,
        matchedStudentId: row.matchedStudentId,

        // Suggest students that look close.
        studentCandidates:
          row.status === UploadRowStatus.UNMATCHED_STUDENT
            ? suggestCandidates(
                normalizeMatric(row.matricNumberRaw),
                students,
                (s) => normalizeMatric(s.matricNumber),
              )
            : [],
      })),
    })),
  }));
}

export type ReviewQueue = Awaited<ReturnType<typeof getReviewQueue>>;
export type ReviewBatch = ReviewQueue[number];
```

## 3.3 The page

`app/hod/pending-reviews/page.tsx` is currently a static mockup. Replace its body
with a real read; keep the existing markup and swap the hardcoded arrays:

```tsx
import { getReviewQueue } from "@/lib/queries/review-queue";
import { requireRole } from "@/lib/auth-guard";
import { UserRole } from "@/generated/prisma";
import { redirect } from "next/navigation";

export default async function PendingReviewsPage() {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) redirect("/auth/login");

  const queue = await getReviewQueue();
  // … render batches → files → rows
}
```

## How to test Batch 3

**Unit — `editDistance` / `suggestCandidates`.** Pure, no fixtures needed.

```ts
expect(editDistance("kitten", "sitting")).toBe(3);
expect(similarity("CSC401", "CSC401")).toBe(1);

it("ranks the closest matric number first", () => {
  const pool = [
    { id: "a", matricNumber: "U2018/3020002" },
    { id: "b", matricNumber: "U2018/3020003" },
    { id: "c", matricNumber: "U2019/4010111" },
  ];
  const [top] = suggestCandidates("U20183020003", pool, (s) => normalizeMatric(s.matricNumber));
  expect(top.item.id).toBe("b");
});

it("is deterministic when scores tie", () => { /* same input → same order, twice */ });
```

**Integration.** Upload a sheet seeded with three deliberate defects: one bad
course code, one typo'd matric, one duplicate. Sign in as `hod@gradelis.com` and
open `/hod/pending-reviews`. Check:

- exactly one batch appears, with three flagged items
- the bad course code shows a shortlist containing the course you meant
- the typo'd matric shows the right student as its top suggestion
- **clean rows do NOT appear** — the queue is for open items only. Verify by
  confirming the file's `IMPORTED` rows are absent from the page.

---

# Batch 4 — Review queue (resolve side)

**Goal.** The HOD can settle every flagged item: correct and approve, or reject.

**Why last in this track.** It writes to the permanent record, so it should land
on top of a read view that has already been eyeballed.

## 4.1 `lib/actions/review-queue.ts`

These are called from click handlers, not forms, so they take typed objects and
return `ActionResult` rather than the `useActionState` pair.

```ts
// lib/actions/review-queue.ts
"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import {
  UploadFileStatus,
  UploadRowStatus,
  UserRole,
} from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { type ActionResult, fail, ok } from "@/lib/actions/result";
import { classifyRows } from "@/lib/upload/classify";
import { commitRow } from "@/lib/upload/commit";
import { commitValidRows, syncBatchStatus } from "@/lib/upload/commit-batch";
import {
  normalizeCourseCode,
  normalizeMatric,
  normalizeSession,
} from "@/lib/upload/normalize";
import { isValidScore } from "@/lib/grading";

// --- File level: fix the course code, or throw the file away ---

const resolveFileSchema = z.object({
  fileId: z.string().min(1),
  courseCode: z.string().min(1, "Enter a course code."),
  note: z.string().max(500).optional(),
});

export async function resolveUploadFile(
  input: z.infer<typeof resolveFileSchema>,
): Promise<ActionResult<{ imported: number }>> {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) return fail(guard.message);

  const parsed = resolveFileSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.", z.flattenError(parsed.error).fieldErrors);

  const { fileId, courseCode, note } = parsed.data;

  const file = await prisma.uploadFile.findUnique({
    where: { id: fileId },
    include: { rows: true },
  });
  if (!file) return fail("That upload file no longer exists.");
  if (file.status === UploadFileStatus.REJECTED) return fail("That file was already rejected.");

  const key = normalizeCourseCode(courseCode);
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, code: true },
  });
  const course = courses.find((c) => normalizeCourseCode(c.code) === key);
  if (!course) return fail(`No active course matches "${courseCode}".`);

  const academicSession = normalizeSession(file.academicSessionRaw);
  if (!academicSession) return fail("This file's academic session could not be read.");

  // We know the course now, so we can finally check for duplicates.
  const students = await prisma.student.findMany({ select: { id: true, matricNumber: true } });
  const studentsByMatric = new Map(students.map((s) => [normalizeMatric(s.matricNumber), s.id]));

  const existing = await prisma.studentResult.findMany({
    where: { courseId: course.id, academicSession },
    select: { studentId: true },
  });

  const settled = new Set<UploadRowStatus>([UploadRowStatus.IMPORTED, UploadRowStatus.REJECTED]);
  const reclassifiable = file.rows.filter((r) => !settled.has(r.status));

  const reclassified = classifyRows({
    rows: reclassifiable.map((r) => ({
      matricNo: r.matricNumberRaw,
      totalScore: r.score === null ? "" : String(r.score),
      grade: r.gradeRaw ?? "",
    })),
    studentsByMatric,
    studentsWithExistingResult: new Set(existing.map((e) => e.studentId)),
    courseKnown: true,
  });

  const imported = await prisma.$transaction(
    async (tx) => {
      await tx.uploadFile.update({
        where: { id: fileId },
        data: {
          matchedCourseId: course.id,
          status: UploadFileStatus.VALID,
          errorMessage: null,
          resolvedById: guard.actor.id,   // who fixed it
          resolvedAt: new Date(),
          resolutionNote: note ?? `Course code corrected to ${course.code}.`,
        },
      });

      for (const [index, row] of reclassifiable.entries()) {
        const next = reclassified[index];
        await tx.uploadRow.update({
          where: { id: row.id },
          data: {
            matchedStudentId: next.matchedStudentId,
            status: next.status,
            errorMessage: next.errorMessage,
          },
        });
      }

      const count = await commitValidRows(tx, fileId);
      await syncBatchStatus(tx, file.uploadBatchId);
      return count;
    },
    { timeout: 30_000, maxWait: 10_000 },
  );

  refresh();
  return ok({ imported });
}

// --- Reject a file. Every row still waiting goes down with it ---

const rejectSchema = z.object({
  fileId: z.string().min(1),
  note: z.string().min(1, "Give a reason for rejecting this file.").max(500),
});

export async function rejectUploadFile(
  input: z.infer<typeof rejectSchema>,
): Promise<ActionResult<{ rowsRejected: number }>> {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) return fail(guard.message);

  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.", z.flattenError(parsed.error).fieldErrors);

  const { fileId, note } = parsed.data;

  const file = await prisma.uploadFile.findUnique({ where: { id: fileId } });
  if (!file) return fail("That upload file no longer exists.");

  const rowsRejected = await prisma.$transaction(async (tx) => {
    // Rows already saved stay saved. Pulling one back is a CorrectionRequest.
    const { count } = await tx.uploadRow.updateMany({
      where: {
        uploadFileId: fileId,
        status: { notIn: [UploadRowStatus.IMPORTED, UploadRowStatus.REJECTED] },
      },
      data: {
        status: UploadRowStatus.REJECTED,
        resolvedById: guard.actor.id,
        resolvedAt: new Date(),
        resolutionNote: note,
        errorMessage: "Rejected as part of a rejected file.",
      },
    });

    await tx.uploadFile.update({
      where: { id: fileId },
      data: {
        status: UploadFileStatus.REJECTED,   // marked, not deleted
        resolvedById: guard.actor.id,
        resolvedAt: new Date(),
        resolutionNote: note,
      },
    });

    await syncBatchStatus(tx, file.uploadBatchId);
    return count;
  });

  refresh();
  return ok({ rowsRejected });
}

// --- Row level: fix the student or the score, then save ---

const resolveRowSchema = z.object({
  rowId: z.string().min(1),
  studentId: z.string().min(1).optional(),
  score: z.number().min(0).max(100).optional(),
  note: z.string().max(500).optional(),
});

export async function resolveUploadRow(
  input: z.infer<typeof resolveRowSchema>,
): Promise<ActionResult<{ studentResultId: string }>> {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) return fail(guard.message);

  const parsed = resolveRowSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.", z.flattenError(parsed.error).fieldErrors);

  const { rowId, studentId, score, note } = parsed.data;

  const row = await prisma.uploadRow.findUnique({
    where: { id: rowId },
    include: { uploadFile: true },
  });
  if (!row) return fail("That row no longer exists.");
  if (row.status === UploadRowStatus.IMPORTED) return fail("That row was already imported.");
  if (row.status === UploadRowStatus.REJECTED) return fail("That row was already rejected.");

  const file = row.uploadFile;
  if (!file.matchedCourseId) {
    return fail("Resolve this file's course code before approving individual rows.");
  }
  if (file.status === UploadFileStatus.REJECTED) {
    return fail("This file was rejected; its rows cannot be approved.");
  }

  const finalStudentId = studentId ?? row.matchedStudentId;
  if (!finalStudentId) return fail("Choose the student this row belongs to.");

  const finalScore = score ?? row.score;
  if (!isValidScore(finalScore)) return fail("Enter a score between 0 and 100.");

  const academicSession = normalizeSession(file.academicSessionRaw);
  if (!academicSession) return fail("This file's academic session could not be read.");

  const student = await prisma.student.findUnique({ where: { id: finalStudentId } });
  if (!student) return fail("That student no longer exists.");

  const result = await prisma.$transaction(async (tx) => {
    // Same entry point as the automatic one.
    const created = await commitRow(tx, {
      uploadRowId: rowId,
      studentId: finalStudentId,
      courseId: file.matchedCourseId!,
      academicSession,
      score: finalScore,
    });

    await tx.uploadRow.update({
      where: { id: rowId },
      data: {
        resolvedById: guard.actor.id,   // who approved it
        resolvedAt: new Date(),
        resolutionNote: note ?? "Approved by HOD after review.",
      },
    });

    await syncBatchStatus(tx, file.uploadBatchId);
    return created;
  });

  refresh();
  return ok({ studentResultId: result.id });
}

const rejectRowSchema = z.object({
  rowId: z.string().min(1),
  note: z.string().min(1, "Give a reason for rejecting this row.").max(500),
});

export async function rejectUploadRow(
  input: z.infer<typeof rejectRowSchema>,
): Promise<ActionResult<void>> {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) return fail(guard.message);

  const parsed = rejectRowSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.", z.flattenError(parsed.error).fieldErrors);

  const row = await prisma.uploadRow.findUnique({
    where: { id: parsed.data.rowId },
    include: { uploadFile: true },
  });
  if (!row) return fail("That row no longer exists.");
  if (row.status === UploadRowStatus.IMPORTED) return fail("That row was already imported.");

  await prisma.$transaction(async (tx) => {
    await tx.uploadRow.update({
      where: { id: parsed.data.rowId },
      data: {
        status: UploadRowStatus.REJECTED,
        resolvedById: guard.actor.id,
        resolvedAt: new Date(),
        resolutionNote: parsed.data.note,
      },
    });

    await commitValidRows(tx, row.uploadFileId);   // this might finish the file
    await syncBatchStatus(tx, row.uploadFile.uploadBatchId);
  });

  refresh();
  return ok(undefined);
}
```

## 4.2 Client wiring

```tsx
"use client";
import { useState, useTransition } from "react";
import { resolveUploadRow } from "@/lib/actions/review-queue";

export function ResolveRowButton({ rowId, studentId }: { rowId: string; studentId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await resolveUploadRow({ rowId, studentId });
            setError(result.ok ? null : result.message);
          })
        }
      >
        {pending ? "Approving…" : "Approve"}
      </button>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </>
  );
}
```

`refresh()` inside the action re-renders the queue page, so the resolved item
disappears without a manual router call.

## How to test Batch 4

**The invariant test, first.** §9's success criterion is a negative: *no
`StudentResult` may exist that wasn't auto-validated or explicitly approved.*
Assert it directly against the dev database after exercising the flow:

```sql
-- Every StudentResult traceable to an upload must come from an IMPORTED row.
SELECT r.id
FROM "StudentResult" r
JOIN "UploadRow" ur ON ur."studentResultId" = r.id
WHERE ur.status <> 'IMPORTED';
-- expect zero rows

-- Every row the HOD settled carries an audit trail (R7).
SELECT id, status FROM "UploadRow"
WHERE status IN ('IMPORTED','REJECTED')
  AND "resolvedById" IS NULL AND "studentResultId" IS NULL;
-- expect zero rows
```

**Per requirement:**

| Req | Test |
|---|---|
| R3 | File at `UNMATCHED_COURSE` → resolve with the right code → file `VALID`/`COMPLETED`, previously-blocked rows reclassified and clean ones imported |
| R3 | Resolve with a code that does not exist → `ok: false`, nothing written |
| R3 | Reject a file with 5 unsettled rows → file `REJECTED`, all 5 rows `REJECTED`, batch `COMPLETED` |
| R4 | Row at `UNMATCHED_STUDENT` → approve with a chosen `studentId` → `StudentResult` created, row `IMPORTED` |
| R4 | Row at `INVALID_SCORE` → approve with a corrected score → result carries the corrected score, grade recomputed |
| R5 | The created result's `grade`/`gradePoint` match `GRADE_SCALE`, and `attemptNumber` is correct |
| R6 | A rejected row still exists with `status = REJECTED` — `SELECT count(*)` before and after are equal |
| R7 | Every settled row has `resolvedById`, `resolvedAt`, `resolutionNote` |

**Authorization — do not skip.** Sign in as `lecturer@gradelis.com` and call the
action directly from the browser console on any adviser page. It must return
`{ ok: false, message: "You are not permitted to perform this action." }`. The
proxy will not stop this; only the in-action guard will.

**Double-submit.** Click Approve twice quickly. The second call must return
`"That row was already imported."`, not create a second `StudentResult`. If it
does create one, the status guard is being read outside the transaction — move
the check inside.

---

# Batch 5 — Graduation engine (pure)

**Goal.** CGPA and the four eligibility rules, as functions that take plain
objects and return plain objects. No Prisma, no clock, no randomness.

**Why pure, and why first.** §11's success criteria are *determinism* and
*specific reasons per student*. Both are properties of a function, not of a
database. Isolating the engine means the hardest logic in the product is testable
in milliseconds with hand-written fixtures — and it makes R9 (a completed run is
never recalculated) easy to honour, because the engine has no way to write
anything.

This batch depends only on `lib/grading.ts` from Batch 0. It can be built in
parallel with Batches 1–4.

## 5.1 `lib/graduation/policy.ts`

```ts
// lib/graduation/policy.ts

export type GraduationPolicy = {
  minCgpa: number;
  minCreditUnits: number;
};

/** Saved onto every run, so an old run still makes sense after we change these. */
export const GRADUATION_POLICY: GraduationPolicy = {
  minCgpa: 1.0,
  minCreditUnits: 120,
};
```

> **Confirmed 2026-08-20.** UNIPORT's minimum for graduation is a CGPA of
> **1.00 on a 5-point scale**. A CGPA of 1.00–1.49 earns a Pass degree; below
> 1.00 is probation or withdrawal, not graduation. So `minCgpa: 1.0` is the gate,
> and anyone under it correctly lands in the pending list.
>
> Note what this does *not* do: it does not classify the degree. A student at
> 1.20 and a student at 4.80 both come back `eligible: true` with no class
> attached. That is deliberate — §11 puts classification out of scope. If the
> department later wants First Class / Second Upper / Pass on the report, it is
> a pure addition to `evaluate.ts` plus a field on `EligibilityRunItem`.
>
> `minCreditUnits: 120` is still a placeholder. It is programme-specific, so
> confirm it against the department's curriculum before the first real run.

## 5.2 `lib/graduation/evaluate.ts`

```ts
// lib/graduation/evaluate.ts
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
```

## How to test Batch 5

This is where the test effort should concentrate. Everything is a pure function
over plain objects, so fixtures are three lines each and the suite runs instantly.

```ts
// lib/graduation/evaluate.test.ts
import { describe, expect, it } from "vitest";
import { computeCgpa, effectiveResults, evaluateCohort, evaluateStudent } from "./evaluate";

const policy = { minCgpa: 1.0, minCreditUnits: 12 };

const result = (over: Partial<ResultInput> = {}): ResultInput => ({
  courseId: "c1", courseCode: "CSC101", creditUnits: 3,
  attemptNumber: 1, score: 75, gradePoint: 5, ...over,
});

describe("computeCgpa", () => {
  it("weights by credit units, not by course count", () => {
    // 5×6 + 1×1 = 31 over 7 units = 4.43. A plain average would say 3.00.
    expect(computeCgpa([
      result({ courseId: "a", creditUnits: 6, gradePoint: 5 }),
      result({ courseId: "b", creditUnits: 1, gradePoint: 1 }),
    ])).toBe(4.43);
  });

  it("returns 0 for a student with no results rather than NaN", () => {
    expect(computeCgpa([])).toBe(0);
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
    expect(computeCgpa(effectiveResults([
      result({ attemptNumber: 1, gradePoint: 0 }),
      result({ attemptNumber: 2, gradePoint: 4 }),
    ]))).toBe(4);
  });
});

describe("evaluateStudent", () => {
  it("reports every failed rule, not just the first", () => {
    const evaluation = evaluateStudent(
      { id: "s1", matricNumber: "U2018/001", fullName: "A", results: [
        result({ score: 20, gradePoint: 0 }),
      ]},
      [{ id: "c9", code: "CSC499" }],
      policy,
    );
    expect(evaluation.eligible).toBe(false);
    expect(evaluation.remarks.map((r) => r.rule).sort()).toEqual([
      "ALL_COMPULSORY_PASSED", "MIN_CGPA", "MIN_CREDIT_UNITS", "NO_OUTSTANDING_FAILURES",
    ]);
  });

  // The PRD says this must never happen.
  it("never produces an ineligible student with no reason", () => {
    const evaluation = evaluateStudent(
      { id: "s1", matricNumber: "U2018/001", fullName: "A", results: [] },
      [], policy,
    );
    if (!evaluation.eligible) expect(evaluation.remarks.length).toBeGreaterThan(0);
  });

  it("marks a student eligible only when all four rules pass", () => {
    const evaluation = evaluateStudent(
      { id: "s1", matricNumber: "U2018/001", fullName: "A", results: [
        result({ courseId: "c1", courseCode: "CSC101", creditUnits: 6 }),
        result({ courseId: "c2", courseCode: "CSC102", creditUnits: 6 }),
      ]},
      [{ id: "c1", code: "CSC101" }],
      policy,
    );
    expect(evaluation).toMatchObject({ eligible: true, remarks: [] });
    expect(evaluation.cgpa).toBe(5);
  });

  it("treats a score of exactly PASS_MARK as a pass", () => { /* score: 40 → no failure remark */ });
});

describe("evaluateCohort", () => {
  // Same data in, same answer out. Every time.
  it("is deterministic regardless of input order", () => {
    const students = [/* three students */];
    const a = evaluateCohort(students, compulsory, policy);
    const b = evaluateCohort([...students].reverse(), compulsory, policy);
    expect(a).toEqual(b);
  });
});
```

**Boundary cases worth their own tests:** CGPA exactly at `minCgpa`; credit units
exactly at `minCreditUnits`; a student whose only result has `gradePoint: null`
(should not divide by zero); a compulsory course the student attempted and
failed (must appear under `NO_OUTSTANDING_FAILURES` *and*
`ALL_COMPULSORY_PASSED` — two distinct rules, two remarks).

---

# Batch 6 — Graduation run and views

**Goal.** The HOD picks a cohort, triggers a run, and gets two lists that never
change afterwards.

## 6.1 `lib/actions/graduation.ts`

```ts
// lib/actions/graduation.ts
"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import {
  CourseType,
  GraduationStatus,
  Prisma,
  StudentStatus,
  UserRole,
} from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { type ActionResult, fail, ok } from "@/lib/actions/result";
import { evaluateCohort } from "@/lib/graduation/evaluate";
import { GRADUATION_POLICY } from "@/lib/graduation/policy";

const startRunSchema = z.object({
  // This is the year they entered, not the year they finish.
  entrySession: z.string().regex(/^\d{4}\/\d{4}$/, "Use the format 2021/2022."),
});

export async function startGraduationRun(
  input: z.infer<typeof startRunSchema>,
): Promise<ActionResult<{ runId: string; eligible: number; pending: number }>> {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) return fail(guard.message);

  const parsed = startRunSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.", z.flattenError(parsed.error).fieldErrors);

  const { entrySession } = parsed.data;

  // Always a fresh run. We never touch an old one.
  const run = await prisma.graduationRun.create({
    data: {
      academicSession: entrySession,
      triggeredById: guard.actor.id,
      status: GraduationStatus.RUNNING,
      startedAt: new Date(),
      policy: GRADUATION_POLICY as unknown as Prisma.InputJsonValue,  // freeze the rules we used
    },
  });

  try {
    // Two queries for the whole set, not two per student.
    const [students, compulsory] = await Promise.all([
      prisma.student.findMany({
        where: { entrySession, status: StudentStatus.ACTIVE },
        select: {
          id: true,
          matricNumber: true,
          fullName: true,
          results: {
            // Only the current version of each result.
            where: { previousVersion: { is: null } },
            select: {
              courseId: true,
              score: true,
              gradePoint: true,
              attemptNumber: true,
              course: { select: { code: true, creditUnits: true } },
            },
          },
        },
      }),
      prisma.course.findMany({
        where: { courseType: CourseType.COMPULSORY, isActive: true },
        select: { id: true, code: true },
      }),
    ]);

    if (students.length === 0) {
      await prisma.graduationRun.update({
        where: { id: run.id },
        data: { status: GraduationStatus.FAILED, completedAt: new Date() },
      });
      return fail(`No active students found with entry session ${entrySession}.`);
    }

    const evaluations = evaluateCohort(
      students.map((student) => ({
        id: student.id,
        matricNumber: student.matricNumber,
        fullName: student.fullName,
        results: student.results.map((result) => ({
          courseId: result.courseId,
          courseCode: result.course.code,
          creditUnits: result.course.creditUnits,
          attemptNumber: result.attemptNumber,
          score: result.score,
          gradePoint: result.gradePoint,
        })),
      })),
      compulsory,
      GRADUATION_POLICY,
    );

    // The items and the "done" flag save together, or neither saves.
    await prisma.$transaction(
      async (tx) => {
        await tx.eligibilityRunItem.createMany({
          data: evaluations.map((evaluation) => ({
            graduationRunId: run.id,
            studentId: evaluation.studentId,
            cgpa: evaluation.cgpa,
            eligible: evaluation.eligible,
            remarks: evaluation.remarks as unknown as Prisma.InputJsonValue,
          })),
        });

        await tx.graduationRun.update({
          where: { id: run.id },
          data: { status: GraduationStatus.COMPLETED, completedAt: new Date() },
        });
      },
      { timeout: 30_000, maxWait: 10_000 },
    );

    refresh();

    return ok({
      runId: run.id,
      eligible: evaluations.filter((e) => e.eligible).length,
      pending: evaluations.filter((e) => !e.eligible).length,
    });
  } catch (error) {
    console.error("Graduation run failed:", error);

    // Don't leave a dead run stuck at RUNNING.
    await prisma.graduationRun.update({
      where: { id: run.id },
      data: { status: GraduationStatus.FAILED, completedAt: new Date() },
    });

    return fail("The graduation run could not be completed. Nothing was recorded.");
  }
}
```

> **On `previousVersion: { is: null }`.** `StudentResult` carries a self-relation
> (`currentVersionOfId` / `previousVersion`). A row is superseded when another
> row points at it, so the current version is the one nothing points at. Combined
> with `effectiveResults` picking the highest `attemptNumber`, corrections and
> resits are both handled, by two different mechanisms — corrections version a
> row in place, resits add a new attempt.

## 6.2 `lib/queries/graduation.ts` — reading a completed run

```ts
// lib/queries/graduation.ts
import "server-only";
import { prisma } from "@/lib/prisma";
import type { Remark } from "@/lib/graduation/evaluate";

/** Two lists from what we saved. We never do the maths again. */
export async function getGraduationRun(runId: string) {
  const run = await prisma.graduationRun.findUnique({
    where: { id: runId },
    include: {
      triggeredBy: { select: { id: true, name: true } },
      items: {
        orderBy: { student: { matricNumber: "asc" } },
        include: {
          student: {
            select: { id: true, matricNumber: true, fullName: true, currentLevel: true },
          },
        },
      },
    },
  });

  if (!run) return null;

  const items = run.items.map((item) => ({
    ...item,
    remarks: (item.remarks ?? []) as unknown as Remark[],
  }));

  return {
    ...run,
    eligible: items.filter((item) => item.eligible),
    pending: items.filter((item) => !item.eligible),
  };
}

export async function listGraduationRuns() {
  return prisma.graduationRun.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      triggeredBy: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });
}
```

## 6.3 Routes

Two new routes under the existing HOD reports section:

- `app/hod/reports/graduation/page.tsx` — session picker + Run button + run history
- `app/hod/reports/graduation/[runId]/page.tsx` — eligible / pending tabs

The detail page reads only from `EligibilityRunItem`. It must never call
`evaluateCohort` — that is what makes R9 true in practice rather than just in
intent.

```tsx
// app/hod/reports/graduation/[runId]/page.tsx
import { notFound, redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma";
import { requireRole } from "@/lib/auth-guard";
import { getGraduationRun } from "@/lib/queries/graduation";

export default async function GraduationRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) redirect("/auth/login");

  const { runId } = await params;
  const run = await getGraduationRun(runId);
  if (!run) notFound();

  // … render run.eligible and run.pending, each pending row listing its remarks
}
```

> **Next 16:** `params` is a `Promise` and must be awaited. The existing dynamic
> routes under `student-records/[studentId]` follow the same convention.

## How to test Batch 6

**Determinism, against the database.** Trigger two runs back to back over
untouched data:

```sql
SELECT r.id, i."studentId", i.cgpa, i.eligible
FROM "GraduationRun" r
JOIN "EligibilityRunItem" i ON i."graduationRunId" = r.id
WHERE r."academicSession" = '2021/2022'
ORDER BY r."createdAt", i."studentId";
```

Both runs must produce identical `(studentId, cgpa, eligible)` triples. Different
`GraduationRun.id`, identical contents.

**Immutability (R9).** This is the test that proves the feature:

1. Run graduation for a cohort. Note one student's `cgpa` and `eligible`.
2. Add a new passing `StudentResult` for that student.
3. Re-read the **first** run — the student's stored `cgpa` and `eligible` must be
   **unchanged**.
4. Trigger a second run — the new run reflects the new result.

If step 3 changes, something is recomputing on read instead of reading the
snapshot.

**Reasons (R5).** Every row in the pending list must render at least one remark:

```sql
SELECT id FROM "EligibilityRunItem"
WHERE eligible = false
  AND (remarks IS NULL OR jsonb_array_length(remarks::jsonb) = 0);
-- expect zero rows
```

**Query count (R2).** Set `new PrismaClient({ log: ["query"] })` temporarily and
count the `SELECT`s for a 300-student cohort. Expect a small constant — roughly
five — not one per student. A number that scales with cohort size means the
`include` collapsed into an N+1.

**Failure path.** Stop Postgres mid-run (`docker compose stop postgres`). The run
must end at `FAILED` with `completedAt` set, and no partial `EligibilityRunItem`
rows may survive — the transaction guarantees this.

**Authorization.** Same as Batch 4: call `startGraduationRun` as a LECTURER and
confirm it is refused.

---

# Appendix A — Test setup

The repo has no test runner today. Batches 1, 3 and 5 are built around pure
functions precisely so that adding one is cheap and pays off immediately.

```bash
npm i -D vitest @vitejs/plugin-react vite-tsconfig-paths
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],   // makes the "@/..." alias resolve
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
```

```jsonc
// package.json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Test files sit next to their subjects: `lib/graduation/evaluate.test.ts`,
`lib/upload/classify.test.ts`, `lib/upload/candidates.test.ts`,
`lib/grading.test.ts`.

**What gets unit tests vs. what gets checked by hand.** Pure modules — grading,
classification, candidates, the eligibility engine — carry the suite. Server
actions are thin orchestration over Prisma; testing them properly needs a
throwaway database, which is more machinery than this project currently warrants.
Verify those with the SQL assertions listed per batch, which are also the ones
worth keeping as a manual pre-release checklist.

Note that Vitest's `include` deliberately excludes `generated/**`. The Prisma
client is 11MB of emitted code and must never be swept into a test run — or a
lint run, which is the subject of the next appendix.

---

# Appendix B — Fix before starting

Small pre-existing issues that will bite during this work.

1. **`.gitignore` misses the generated Prisma client.** It lists
   `/lib/generated/prisma`; the generator writes to `/generated/prisma`. 11MB and
   21 files are tracked, and they produce all 523 errors when ESLint runs at the
   repo root. Fix the path, then `git rm -r --cached generated`.

2. **Duplicated auth callbacks.** [`auth.config.ts`](../auth.config.ts) sets only
   `token.role`; [`auth.ts`](../auth.ts) sets `role` *and* `id`, and overwrites
   the config's version entirely. `proxy.ts` uses the config one, so edge checks
   never see `id`. Have `auth.ts` spread and extend rather than replace.

3. **Dead route.** [`wizard-navigation.tsx:52`](../features/upload-result/components/wizard-navigation.tsx)
   pushes to `/adviser/dashboard`, which does not exist — the adviser 404s on the
   last step of the very wizard Batch 1 rewires. Should be `/adviser`.

4. **Five stale files** from the route reorg: four zero-byte screens in
   `features/upload-result/screens/` plus an orphaned 163-line
   `upload-file-screen.tsx`. None are imported.

5. **`@neondatabase/serverless` is a dependency but never imported.** Either wire
   it up (it pairs with `@prisma/adapter-neon`, not the `adapter-pg` currently in
   `lib/prisma.ts`) or drop it. Same for the direct `postgres` dependency.

6. **No `.env.example`,** although `docker-compose.yml` instructs `cp .env.example .env`.
   It needs `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`.

7. **Three dead admin sidebar links** — `/admin/academic-sessions`,
   `/admin/system-logs`, `/admin/settings`. Also `/admin/assign-adviser` exists
   but has no nav entry, and the admin Dashboard entry is `href: "/admin/"` with
   `exact: true`, so it never highlights.

---

# Appendix C — Open questions

Answer these before the batch they block, not after.

| # | Question | Blocks | Default if unanswered |
|---|---|---|---|
| Q1 | Is a graduating cohort keyed on `Student.entrySession`? (D4) | 6 | Yes — `GraduationRun.academicSession` stores the entry session |
| Q2 | ~~Minimum CGPA for graduation?~~ | 5, 6 | ✅ **Answered:** 1.00 on a 5-point scale (UNIPORT) |
| Q3 | Does a resit supersede the earlier attempt for CGPA, or do both count? (D5) | 5 | Latest attempt supersedes |
| Q4 | Should compulsory-course checking be scoped by level, or is every active compulsory course required of everyone? | 5, 6 | Every active compulsory course |
| Q5 | Does rejecting a file retract results from rows that already imported cleanly? | 4 | No — retraction is a `CorrectionRequest`, a separate workflow |
| Q6 | ~~Is `GRADE_SCALE` the official scale?~~ | 0 | ✅ **Answered:** yes, official |
| Q7 | Can an adviser re-upload a corrected file for a rejected batch, or must the HOD resolve in place? | 4 | Re-upload is allowed; it creates a new batch |
| Q8 | Minimum credit units required to graduate this programme? | 5, 6 | 120 — **still a placeholder** |

Q2 and Q6 are answered. **Q8 is now the only one that would invalidate real
output if wrong** — a wrong credit-unit floor silently moves students between the
eligible and pending lists. Everything else can be changed later at the cost of a
migration or a re-run.
