# Gradelis Architecture & Developer Integration Guide

> **For the Engineering Team:**
> This document explains the exact structure of the codebase, how data flows through the application, how backend logic and database operations are wired up, and how you can easily adapt or refactor any part of this to match your preferred architectural patterns.

---

## 1. High-Level Architectural Overview

The application follows a **modular, 3-tier Next.js App Router architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                    1. Presentation Layer                    │
│   • app/admin/* (Route entrypoints / page shells)           │
│   • features/administrator/screens/* (Interactive UI state) │
│   • features/administrator/components/* (Modals & Forms)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Calls via useTransition
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      2. Business Layer                      │
│   • lib/actions/admin-*.ts (Next.js "use server" actions)   │
│   • lib/excel/* (Spreadsheet generation & parser utilities) │
│   • auth.ts (NextAuth credential provider & session checks) │
└──────────────────────────────┬──────────────────────────────┘
                               │ Invokes Prisma Client
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    3. Data & Storage Layer                  │
│   • prisma/schema.prisma (PostgreSQL Database Schema)       │
│   • lib/prisma.ts (Prisma Singleton Client instance)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & Responsibilities

| Directory / File | Type | Purpose |
| :--- | :--- | :--- |
| [`app/admin/`](file:///c:/Users/Gozirim/Downloads/gradelis/app/admin) | Pages / Routes | Lightweight Next.js route entry points (e.g. `/admin/students`, `/admin/courses`, `/admin/staff`, `/admin/upload-windows`, `/admin/logs`). |
| [`features/administrator/screens/`](file:///c:/Users/Gozirim/Downloads/gradelis/features/administrator/screens) | Client Components | Screen containers managing filters, search inputs, pagination, selection state, and modal open/close states. |
| [`features/administrator/components/`](file:///c:/Users/Gozirim/Downloads/gradelis/features/administrator/components) | UI Modals | Isolated dialogs for Manual CRUD forms, Excel Bulk Importers, Staff Credentials generators, and Log Detail viewers. |
| [`lib/actions/`](file:///c:/Users/Gozirim/Downloads/gradelis/lib/actions) | Server Actions (`"use server"`) | **All backend business logic and database queries live here.** Zero SQL is embedded in the frontend UI. |
| [`lib/excel/`](file:///c:/Users/Gozirim/Downloads/gradelis/lib/excel) | Utilities | Pure helper functions using `xlsx` to parse uploaded `.xlsx`/`.csv` files and generate downloadable starter templates. |
| [`prisma/schema.prisma`](file:///c:/Users/Gozirim/Downloads/gradelis/prisma/schema.prisma) | Database Schema | Prisma models (unchanged). |

---

## 3. How the Backend Logic Works

All backend operations are encapsulated inside standalone TypeScript files in [`lib/actions/`](file:///c:/Users/Gozirim/Downloads/gradelis/lib/actions).

### Backend Modules Breakdown

#### A. Students Registry (`lib/actions/admin-students.ts`)
- **Functions:**
  - `getAdminStudents(filters)`: Retrieves paginated students with level, session, and status filters.
  - `createAdminStudent(data)`: Validates and persists a new student with matric number conflict checks.
  - `updateAdminStudent(id, data)`: Modifies existing student record.
  - `deleteAdminStudent(id)`: Soft-deletes or removes student record.
  - `importStudentsFromExcel(rows)`: Batch parses imported rows, validates required headers, and creates multiple records in a single transaction with audit logging.
- **Prisma Model:** `prisma.student`, `prisma.user`, `prisma.auditLog`

#### B. Courses & Curriculum (`lib/actions/admin-courses.ts`)
- **Functions:**
  - `getAdminCourses(filters)`: Queries courses filtered by department, level, and semester.
  - `createAdminCourse(data)`: Creates course code, title, units, level, and semester.
  - `updateAdminCourse(id, data)`: Updates course details and allocates lecturers.
  - `deleteAdminCourse(id)`: Deletes course.
  - `importCoursesFromExcel(rows)`: Bulk validation and ingestion for curriculum spreadsheets.
- **Prisma Model:** `prisma.course`, `prisma.courseAllocation`

#### C. Staff & Lecturer Management (`lib/actions/admin-staff.ts`)
- **Functions:**
  - `getAdminStaff(filters)`: Lists lecturers, HODs, and advisers.
  - `createAdminStaff(data)`: Creates staff user account, hashes initial password using `bcryptjs`.
  - `assignStaffRole(staffId, role, departmentId)`: Promotes or assigns HOD / Exam Officer roles.
  - `generateStaffCredentials(staffId)`: Generates a secure temporary password and returns login credentials.
  - `importStaffFromExcel(rows)`: Bulk onboarding for departmental faculty.
- **Prisma Model:** `prisma.user`, `prisma.staffProfile`

#### D. Score Submission Windows (`lib/actions/admin-windows.ts`)
- **Functions:**
  - `getAdminUploadWindows()`: Returns active, upcoming, and closed upload windows.
  - `createUploadWindow(data)`: Opens a submission window for specific sessions/semesters with start and end dates.
  - `extendUploadWindow(id, newEndDate, reason)`: Extends deadline with mandatory reason tracking.
  - `toggleUploadWindowStatus(id, isActive)`: Manually open or close window.
- **Prisma Model:** `prisma.uploadWindow` / `prisma.submissionWindow`

#### E. System Audit Trail (`lib/actions/admin-logs.ts`)
- **Functions:**
  - `getAdminLogs(filters)`: Filterable audit log queries by date range, action type, user, and severity level.
  - `createAuditLog(entry)`: Helper called whenever any mutation (create/update/delete/import) occurs.
  - `exportLogsToExcel()`: Exports filtered system logs to an Excel spreadsheet.
- **Prisma Model:** `prisma.auditLog`

---

## 4. Understanding the Fallback Safety Layer

In each server action file, you will notice a structure like this:

```typescript
try {
  // 1. Primary path: Queries live PostgreSQL database via Prisma
  const results = await prisma.student.findMany({ ... });
  return { success: true, data: results };
} catch (error) {
  // 2. Safety fallback: If PostgreSQL is unreachable or during local dev without seeded DB
  console.warn("Database offline, returning fallback dataset for UI development");
  return { success: true, data: fallbackStudents };
}
```

### Why this was done:
- It allows frontend developers and reviewers to test the entire interface, modals, workflows, and transitions **without waiting for database provisioning or migration scripts**.
- **When your database is online:** The `try` block executes normally and communicates with PostgreSQL.
- **If you want strict failure mode:** You can simply remove the `catch` fallback and let the error bubble or return `{ success: false, error: error.message }`.

---

## 5. How to Refactor to Your Custom Architecture

Because the presentation layer and backend layer are completely decoupled, you can refactor the backend into **any pattern** you prefer in under 15 minutes:

### Option A: Service / Repository Pattern
If you prefer a class-based service architecture (e.g. `StudentService`, `CourseRepository`):
1. Create `services/student.service.ts`.
2. Move the Prisma queries from `lib/actions/admin-students.ts` into your `StudentService` class methods.
3. Keep the server actions as thin controller entry points:
   ```typescript
   // lib/actions/admin-students.ts
   "use server";
   import { studentService } from "@/services/student.service";

   export async function getAdminStudents(filters) {
     return await studentService.findStudents(filters);
   }
   ```

### Option B: REST API Route Handlers (`app/api/*`)
If your frontend team prefers standard `fetch()` calls to REST endpoints instead of Server Actions:
1. Create `app/api/admin/students/route.ts`.
2. Call the existing functions directly:
   ```typescript
   // app/api/admin/students/route.ts
   import { NextResponse } from "next/server";
   import { getAdminStudents } from "@/lib/actions/admin-students";

   export async function GET(req: Request) {
     const data = await getAdminStudents();
     return NextResponse.json(data);
   }
   ```

---

## 6. How to Wire Up the AI / Eligibility Engine

When integrating the AI or Graduation Eligibility components (e.g., from `wisdom/grad-eligibility-engine`):

1. **Input Data Source:** Use `lib/actions/admin-students.ts` to fetch student academic records and course allocations.
2. **Processing Layer:** Pass the student transcript and curriculum data into your eligibility rules engine or AI evaluator.
3. **Storage:** Store the computed eligibility status (`ELIGIBLE`, `PROBATION`, `SPILLOVER`, `OUTSTANDING_COURSES`) back into the database.
4. **Audit Log:** Trigger `createAuditLog({ action: "ELIGIBILITY_COMPUTATION", ... })` to log every evaluation run automatically.

---

## 7. Authentication Summary ([`auth.ts`](file:///c:/Users/Gozirim/Downloads/gradelis/auth.ts))

- **Live Mode:** Uses NextAuth with `CredentialsProvider`. It queries `prisma.user.findUnique({ where: { email } })` and verifies password hashes with `bcryptjs`.
- **Demo Fallback Mode:** If the database connection fails, it allows login using `admin@gradelis.com`, `hod@gradelis.com`, or `lecturer@gradelis.com` (password: `password123`).
- **To Disable Demo Mode:** Simply remove the `fallbackDemoUsers` array in `auth.ts`.

---

## 8. Summary & Next Steps

1. **Run Migrations:** Ensure your PostgreSQL connection string in `.env` (`DATABASE_URL`) is valid and run `npx prisma db push` or `npx prisma migrate dev`.
2. **Test Backend Queries:** All server actions are fully typed and directly importable.
3. **Customize UI / Business Rules:** You can adjust the validation rules in `lib/actions/*.ts` without having to touch UI rendering.
