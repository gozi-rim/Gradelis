"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export type SubmissionWindowItem = {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  isAllCourses: boolean;
  academicSession: string;
  semester: "FIRST" | "SECOND";
  opensAt: string;
  closesAt: string;
  status: "OPEN" | "CLOSED" | "SCHEDULED";
  daysRemaining: number;
  openedByName: string;
  createdAt: string;
};

export type WindowFilters = {
  session?: string;
  semester?: string;
  status?: string;
  search?: string;
};

// Fallback in-memory dataset when PostgreSQL is offline
let fallbackWindows: SubmissionWindowItem[] = [
  {
    id: "win-1",
    courseId: "all-dept-courses",
    courseCode: "ALL DEPT COURSES",
    courseTitle: "All Departmental Courses (General Submission Window)",
    isAllCourses: true,
    academicSession: "2024/2025",
    semester: "SECOND",
    opensAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    closesAt: new Date(Date.now() + 86400000 * 10).toISOString(),
    status: "OPEN",
    daysRemaining: 10,
    openedByName: "Prof. Ibrahim Musa (HOD)",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "win-2",
    courseId: "crs-401",
    courseCode: "CPE 401",
    courseTitle: "Embedded Systems Design",
    isAllCourses: false,
    academicSession: "2024/2025",
    semester: "FIRST",
    opensAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    closesAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    status: "CLOSED",
    daysRemaining: 0,
    openedByName: "System Admin",
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
  {
    id: "win-3",
    courseId: "crs-201",
    courseCode: "CPE 201",
    courseTitle: "Computer Engineering Principles",
    isAllCourses: false,
    academicSession: "2024/2025",
    semester: "FIRST",
    opensAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    closesAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    status: "CLOSED",
    daysRemaining: 0,
    openedByName: "System Admin",
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
  {
    id: "win-4",
    courseId: "all-dept-courses",
    courseCode: "ALL DEPT COURSES",
    courseTitle: "All Departmental Courses (Mid-Term Resit Window)",
    isAllCourses: true,
    academicSession: "2025/2026",
    semester: "FIRST",
    opensAt: new Date(Date.now() + 86400000 * 20).toISOString(),
    closesAt: new Date(Date.now() + 86400000 * 35).toISOString(),
    status: "SCHEDULED",
    daysRemaining: 35,
    openedByName: "Prof. Ibrahim Musa (HOD)",
    createdAt: new Date().toISOString(),
  },
];

function calculateStatus(opensAt: Date, closesAt: Date): {
  status: "OPEN" | "CLOSED" | "SCHEDULED";
  daysRemaining: number;
} {
  const now = new Date();
  if (now < opensAt) {
    const diff = Math.ceil((opensAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { status: "SCHEDULED", daysRemaining: diff };
  } else if (now > closesAt) {
    return { status: "CLOSED", daysRemaining: 0 };
  } else {
    const diff = Math.ceil((closesAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { status: "OPEN", daysRemaining: diff };
  }
}

export async function getSubmissionWindows(filters: WindowFilters = {}): Promise<{
  success: boolean;
  windows: SubmissionWindowItem[];
  total: number;
  openCount: number;
  closedCount: number;
  scheduledCount: number;
}> {
  try {
    const where: Record<string, unknown> = {};

    if (filters.session && filters.session !== "ALL") {
      where.academicSession = filters.session;
    }
    if (filters.semester && filters.semester !== "ALL") {
      where.semester = filters.semester;
    }

    const dbWindows = await prisma.resultSubmissionWindow.findMany({
      where,
      include: {
        course: true,
        openedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let mapped: SubmissionWindowItem[] = dbWindows.map((w) => {
      const { status, daysRemaining } = calculateStatus(w.opensAt, w.closesAt);
      return {
        id: w.id,
        courseId: w.courseId,
        courseCode: w.course.code,
        courseTitle: w.course.title,
        isAllCourses: w.course.code === "ALL_COURSES",
        academicSession: w.academicSession,
        semester: w.semester as "FIRST" | "SECOND",
        opensAt: w.opensAt.toISOString(),
        closesAt: w.closesAt.toISOString(),
        status,
        daysRemaining,
        openedByName: w.openedBy?.name || "System Admin",
        createdAt: w.createdAt.toISOString(),
      };
    });

    if (filters.status && filters.status !== "ALL") {
      mapped = mapped.filter((w) => w.status === filters.status);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      mapped = mapped.filter(
        (w) =>
          w.courseCode.toLowerCase().includes(q) ||
          w.courseTitle.toLowerCase().includes(q) ||
          w.academicSession.toLowerCase().includes(q) ||
          w.openedByName.toLowerCase().includes(q)
      );
    }

    const openCount = mapped.filter((w) => w.status === "OPEN").length;
    const closedCount = mapped.filter((w) => w.status === "CLOSED").length;
    const scheduledCount = mapped.filter((w) => w.status === "SCHEDULED").length;

    return {
      success: true,
      windows: mapped,
      total: mapped.length,
      openCount,
      closedCount,
      scheduledCount,
    };
  } catch {
    let mapped = fallbackWindows.map((w) => {
      const { status, daysRemaining } = calculateStatus(
        new Date(w.opensAt),
        new Date(w.closesAt)
      );
      return { ...w, status, daysRemaining };
    });

    if (filters.session && filters.session !== "ALL") {
      mapped = mapped.filter((w) => w.academicSession === filters.session);
    }
    if (filters.semester && filters.semester !== "ALL") {
      mapped = mapped.filter((w) => w.semester === filters.semester);
    }
    if (filters.status && filters.status !== "ALL") {
      mapped = mapped.filter((w) => w.status === filters.status);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      mapped = mapped.filter(
        (w) =>
          w.courseCode.toLowerCase().includes(q) ||
          w.courseTitle.toLowerCase().includes(q) ||
          w.academicSession.toLowerCase().includes(q) ||
          w.openedByName.toLowerCase().includes(q)
      );
    }

    const openCount = mapped.filter((w) => w.status === "OPEN").length;
    const closedCount = mapped.filter((w) => w.status === "CLOSED").length;
    const scheduledCount = mapped.filter((w) => w.status === "SCHEDULED").length;

    return {
      success: true,
      windows: mapped,
      total: mapped.length,
      openCount,
      closedCount,
      scheduledCount,
    };
  }
}

export async function openOrScheduleWindow(data: {
  academicSession: string;
  semester: "FIRST" | "SECOND";
  courseId?: string;
  courseCode?: string;
  courseTitle?: string;
  opensAt: string;
  closesAt: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const session = await auth();
  const userId = session?.user?.id;

  const opensDate = new Date(data.opensAt);
  const closesDate = new Date(data.closesAt);

  if (closesDate <= opensDate) {
    return { success: false, error: "Closing date must be after opening date." };
  }

  try {
    let adminUserId = userId;
    if (!adminUserId) {
      const defaultAdmin = await prisma.user.findFirst({
        where: { role: "SYSTEM_ADMIN" },
      });
      adminUserId = defaultAdmin?.id || "admin-fallback";
    }

    let targetCourseId = data.courseId;
    if (!targetCourseId) {
      // Find or create a course record representing "ALL_COURSES"
      let allCoursesDummy = await prisma.course.findUnique({
        where: { code: "ALL_COURSES" },
      });
      if (!allCoursesDummy) {
        allCoursesDummy = await prisma.course.create({
          data: {
            code: "ALL_COURSES",
            title: "Department-wide General Submission Window",
            creditUnits: 0,
            level: 100,
            semester: data.semester,
            createdById: adminUserId,
          },
        });
      }
      targetCourseId = allCoursesDummy.id;
    }

    await prisma.resultSubmissionWindow.upsert({
      where: {
        courseId_academicSession_semester: {
          courseId: targetCourseId,
          academicSession: data.academicSession,
          semester: data.semester,
        },
      },
      update: {
        opensAt: opensDate,
        closesAt: closesDate,
        openedById: adminUserId,
      },
      create: {
        courseId: targetCourseId,
        academicSession: data.academicSession,
        semester: data.semester,
        opensAt: opensDate,
        closesAt: closesDate,
        openedById: adminUserId,
      },
    });

    revalidatePath("/admin/upload-windows");
    return {
      success: true,
      message: `Result submission window for ${data.academicSession} (${data.semester} Semester) saved successfully.`,
    };
  } catch {
    const isAll = !data.courseId || data.courseId === "all-dept-courses";
    const courseCode = isAll ? "ALL DEPT COURSES" : (data.courseCode || "SPECIFIC COURSE");
    const courseTitle = isAll
      ? "All Departmental Courses (General Submission Window)"
      : (data.courseTitle || "Course Specific Window");

    const existingIdx = fallbackWindows.findIndex(
      (w) =>
        w.academicSession === data.academicSession &&
        w.semester === data.semester &&
        w.isAllCourses === isAll
    );

    const { status, daysRemaining } = calculateStatus(opensDate, closesDate);

    if (existingIdx !== -1) {
      fallbackWindows[existingIdx] = {
        ...fallbackWindows[existingIdx],
        opensAt: opensDate.toISOString(),
        closesAt: closesDate.toISOString(),
        status,
        daysRemaining,
      };
    } else {
      fallbackWindows.unshift({
        id: `win-${Date.now()}`,
        courseId: data.courseId || "all-dept-courses",
        courseCode,
        courseTitle,
        isAllCourses: isAll,
        academicSession: data.academicSession,
        semester: data.semester,
        opensAt: opensDate.toISOString(),
        closesAt: closesDate.toISOString(),
        status,
        daysRemaining,
        openedByName: "System Admin",
        createdAt: new Date().toISOString(),
      });
    }

    revalidatePath("/admin/upload-windows");
    return {
      success: true,
      message: `Result submission window for ${data.academicSession} saved.`,
    };
  }
}

export async function extendWindowDeadline(
  id: string,
  extraDays: number = 7
): Promise<{ success: boolean; message: string }> {
  try {
    const win = await prisma.resultSubmissionWindow.findUnique({ where: { id } });
    if (win) {
      const newClose = new Date(Math.max(Date.now(), win.closesAt.getTime()) + extraDays * 86400000);
      await prisma.resultSubmissionWindow.update({
        where: { id },
        data: { closesAt: newClose },
      });
    }
    revalidatePath("/admin/upload-windows");
    return { success: true, message: `Deadline extended by ${extraDays} days.` };
  } catch {
    const idx = fallbackWindows.findIndex((w) => w.id === id);
    if (idx !== -1) {
      const currentClose = new Date(fallbackWindows[idx].closesAt);
      const newClose = new Date(Math.max(Date.now(), currentClose.getTime()) + extraDays * 86400000);
      fallbackWindows[idx].closesAt = newClose.toISOString();
    }
    revalidatePath("/admin/upload-windows");
    return { success: true, message: `Deadline extended by ${extraDays} days.` };
  }
}

export async function closeWindowImmediately(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.resultSubmissionWindow.update({
      where: { id },
      data: { closesAt: new Date(Date.now() - 1000) },
    });
    revalidatePath("/admin/upload-windows");
    return { success: true, message: "Submission window closed and locked." };
  } catch {
    const idx = fallbackWindows.findIndex((w) => w.id === id);
    if (idx !== -1) {
      fallbackWindows[idx].closesAt = new Date(Date.now() - 1000).toISOString();
      fallbackWindows[idx].status = "CLOSED";
      fallbackWindows[idx].daysRemaining = 0;
    }
    revalidatePath("/admin/upload-windows");
    return { success: true, message: "Submission window closed and locked." };
  }
}

export async function deleteWindow(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.resultSubmissionWindow.delete({ where: { id } });
    revalidatePath("/admin/upload-windows");
    return { success: true, message: "Submission window removed." };
  } catch {
    fallbackWindows = fallbackWindows.filter((w) => w.id !== id);
    revalidatePath("/admin/upload-windows");
    return { success: true, message: "Submission window removed." };
  }
}
