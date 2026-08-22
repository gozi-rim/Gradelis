import { UserRole, UploadFileStatus, UploadRowStatus } from "@/generated/prisma";
import { prisma } from "../prisma";

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: "current academic session" has no single source of truth in the schema
// yet (ResultSubmissionWindow doesn't carry a session label, and there's no
// CurrentSession/AcademicSession config model). This is left unresolved per
// Victor's call — revisit once that model exists.
//
// Downstream consequence: adviser assignments are keyed by `entrySession`
// (e.g. "2022/2023"), and "Year N" is really just (currentSessionYear -
// entrySessionYear) + 1, capped at PROGRAM_LENGTH_YEARS. Without a current-
// session config, that arithmetic has no anchor point, so:
//   - level-derived adviser names show as "Session config pending"
//   - "uploaded" per level is computed across ALL sessions, not scoped to
//     "current", since there's no "current" to scope to yet.
//
// Once a current-session source exists, replace `getCurrentSessionStartYear`
// below with a real read and the rest of this file needs no other changes.
// ─────────────────────────────────────────────────────────────────────────────
const PROGRAM_LENGTH_YEARS = 5;

function getCurrentSessionStartYear(): number | null {
  // TODO: wire this up once a CurrentSession/AcademicSession config model
  // (or an admin-set field) exists. Returning null disables level-derived
  // adviser/cohort arithmetic safely rather than guessing.
  return null;
}

function entrySessionStartYear(entrySession: string): number | null {
  const match = entrySession.match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

function computeCurrentLevel(
  entrySession: string,
  currentSessionStartYear: number,
): number | null {
  const startYear = entrySessionStartYear(entrySession);
  if (startYear === null) return null;
  const level = currentSessionStartYear - startYear + 1;
  if (level < 1 || level > PROGRAM_LENGTH_YEARS) return null; // not active / graduated
  return level;
}

// Upload statuses that mean "still needs someone to look at it"
const PENDING_FILE_STATUSES: UploadFileStatus[] = [
  "PROCESSING",
  "UNMATCHED_COURSE",
  "FAILED",
];
const PENDING_ROW_STATUSES: UploadRowStatus[] = [
  "PROCESSING",
  "UNMATCHED_STUDENT",
  "DUPLICATE",
  "INVALID_SCORE",
  "GRADE_MISMATCH",
  "REJECTED",
];

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;

export async function getAdminDashboardData() {
  const [
    users,
    activeHodAssignment,
    activeAdviserAssignments,
    students,
    levels,
    pendingUploadFilesTotal,
    pendingUploadRowsTotal,
    submissionWindow,
    dbHealthCheck,
  ] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, role: true, isActive: true },
    }),

    prisma.hodAssignment.findFirst({
      where: { endDate: null },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { startDate: "desc" },
    }),

    prisma.adviserAssignment.findMany({
      where: { status: "ACTIVE" },
      include: { lecturer: { select: { id: true, name: true } } },
      orderBy: { entrySession: "desc" },
    }),

    prisma.student.findMany({
      select: { id: true, currentLevel: true, status: true },
    }),

    // distinct course levels present, so we don't hardcode "1-5"
    prisma.course.findMany({
      select: { level: true },
      distinct: ["level"],
      orderBy: { level: "asc" },
    }),

    prisma.uploadFile.count({
      where: { status: { in: PENDING_FILE_STATUSES } },
    }),

    prisma.uploadRow.count({
      where: { status: { in: PENDING_ROW_STATUSES } },
    }),

    prisma.resultSubmissionWindow.findUnique({
      where: { scope: "GLOBAL" },
    }),

    prisma.$queryRaw`SELECT 1`.then(
      () => true,
      () => false,
    ),
  ]);

  // ── User overview ──────────────────────────────────────────────────────
  const admins = users.filter((u) => u.role === UserRole.SYSTEM_ADMIN);
  const hods = users.filter((u) => u.role === UserRole.HOD);
  const lecturers = users.filter((u) => u.role === UserRole.LECTURER);
  const activeAccounts = users.filter((u) => u.isActive);
  const disabledAccounts = users.filter((u) => !u.isActive);

  // ── Per-level breakdown ─────────────────────────────────────────────────
  const currentSessionStartYear = getCurrentSessionStartYear();

  // Map each active adviser assignment to a derived level, if we can.
  const adviserByLevel = new Map<number, string>();
  if (currentSessionStartYear !== null) {
    for (const assignment of activeAdviserAssignments) {
      const derivedLevel = computeCurrentLevel(
        assignment.entrySession,
        currentSessionStartYear,
      );
      // Last-write-wins is fine here since results are ordered by
      // entrySession desc and we only expect one active adviser per cohort.
      if (derivedLevel !== null && !adviserByLevel.has(derivedLevel)) {
        adviserByLevel.set(derivedLevel, assignment.lecturer.name);
      }
    }
  }

  // Fetch every course (with its level) once, then bucket in memory,
  // instead of one round trip per level.
  const allCourses = await prisma.course.findMany({
    select: { id: true, level: true },
  });
  const courseIdsByLevel = new Map<number, string[]>();
  for (const course of allCourses) {
    const list = courseIdsByLevel.get(course.level) ?? [];
    list.push(course.id);
    courseIdsByLevel.set(course.level, list);
  }

  // NOTE: not scoped to "current session" — see file header. Once a
  // current-session source exists, add an academicSession filter here
  // (StudentResult carries that field; UploadFile does not directly,
  // so this would need to join through StudentResult once available).
  const [completedUploadFiles, pendingUploadFilesByCourse] = await Promise.all([
    prisma.uploadFile.findMany({
      where: { status: "COMPLETED", matchedCourseId: { not: null } },
      select: { matchedCourseId: true },
      distinct: ["matchedCourseId"],
    }),
    prisma.uploadFile.groupBy({
      by: ["matchedCourseId"],
      where: {
        status: { in: PENDING_FILE_STATUSES },
        matchedCourseId: { not: null },
      },
      _count: { _all: true },
    }),
  ]);
  const completedCourseIds = new Set(
    completedUploadFiles.map((f) => f.matchedCourseId),
  );
  const pendingCountByCourseId = new Map(
    pendingUploadFilesByCourse.map((g) => [g.matchedCourseId, g._count._all]),
  );

  const levelRows = levels.map(({ level }) => {
    const studentsAtLevel = students.filter((s) => s.currentLevel === level).length;
    const courseIds = courseIdsByLevel.get(level) ?? [];

    const uploaded = courseIds.filter((id) => completedCourseIds.has(id)).length;
    const pending = courseIds.reduce(
      (sum, id) => sum + (pendingCountByCourseId.get(id) ?? 0),
      0,
    );

    return {
      level,
      adviserName: adviserByLevel.get(level) ?? "Session config pending",
      students: studentsAtLevel,
      uploaded,
      pending,
    };
  });

  // ── Submission overview (upload-row level, matches "review queue" scope) ──
  const [approvedCount, pendingCount, rejectedCount, correctionsCount] =
    await Promise.all([
      prisma.uploadRow.count({ where: { status: "IMPORTED" } }),
      prisma.uploadRow.count({ where: { status: { in: PENDING_ROW_STATUSES } } }),
      prisma.uploadRow.count({ where: { status: "REJECTED" } }),
      prisma.correctionRequest.count({ where: { status: "PENDING" } }),
    ]);
  const submissionTotal =
    approvedCount + pendingCount + rejectedCount + correctionsCount;

  // ── Recent activity (best-effort: latest change log entry) ────────────────
  const latestChange = await prisma.resultChangeLog.findFirst({
    orderBy: { changedAt: "desc" },
    include: { changedBy: { select: { name: true } } },
  });

  return {
    stats: {
      totalUsers: users.length,
      admins: admins.length,
      hods: hods.length,
      lecturers: lecturers.length,
      totalStudents: students.length,
      pendingSubmissions: pendingUploadFilesTotal + pendingUploadRowsTotal,
    },
    hod: activeHodAssignment
      ? { name: activeHodAssignment.user.name }
      : null,
    levelRows,
    userOverview: {
      admins: admins.length,
      hods: hods.length,
      advisers: lecturers.length,
      activeAccounts: activeAccounts.length,
      disabledAccounts: disabledAccounts.length,
      total: users.length,
    },
    submissionOverview: {
      approved: approvedCount,
      pending: pendingCount,
      rejected: rejectedCount,
      corrections: correctionsCount,
      total: submissionTotal,
    },
    academicSession: {
      // TODO: no CurrentSession/AcademicSession config model yet — see
      // file header. This will read from that model once it exists.
      current: null as string | null,
      semester: null as string | null,
      windowOpen: submissionWindow
        ? submissionWindow.opensAt <= new Date() &&
          new Date() <= submissionWindow.closesAt
        : false,
    },
    systemHealth: {
      dbConnected: dbHealthCheck,
      serverOnline: true,
      // TODO: no backing model for storage usage / backups yet.
      storageUsagePercent: null as number | null,
      lastBackupLabel: "Not tracked yet",
      recentActivity: latestChange
        ? `${latestChange.changedBy.name} updated a result score`
        : "No recent activity",
    },
  };
}
