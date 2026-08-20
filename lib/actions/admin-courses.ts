"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export type CourseItem = {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
  level: number;
  semester: "FIRST" | "SECOND";
  courseType: "COMPULSORY" | "ELECTIVE";
  isActive: boolean;
  createdAt: string;
};

export type CourseFilters = {
  level?: string;
  semester?: string;
  courseType?: string;
  search?: string;
};

export type LevelSemesterGroupSummary = {
  key: string; // e.g. "100-FIRST"
  level: number;
  levelName: string;
  semester: "FIRST" | "SECOND";
  semesterName: string;
  totalCourses: number;
  compulsoryCount: number;
  electiveCount: number;
  totalCreditUnits: number;
};

// Fallback in-memory dataset when PostgreSQL is offline
let fallbackCourses: CourseItem[] = [
  // 100 Level
  {
    id: "crs-101",
    code: "MTH 101",
    title: "General Mathematics I (Calculus & Algebra)",
    creditUnits: 3,
    level: 100,
    semester: "FIRST",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-102",
    code: "PHY 101",
    title: "General Physics I (Mechanics & Thermal)",
    creditUnits: 3,
    level: 100,
    semester: "FIRST",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-103",
    code: "CHM 101",
    title: "General Chemistry I",
    creditUnits: 3,
    level: 100,
    semester: "FIRST",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-104",
    code: "GST 111",
    title: "Communication in English",
    creditUnits: 2,
    level: 100,
    semester: "FIRST",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-105",
    code: "MTH 102",
    title: "General Mathematics II (Vectors & Geometry)",
    creditUnits: 3,
    level: 100,
    semester: "SECOND",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-106",
    code: "PHY 102",
    title: "General Physics II (Electricity & Magnetism)",
    creditUnits: 3,
    level: 100,
    semester: "SECOND",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-107",
    code: "CSC 102",
    title: "Introduction to Computer Science",
    creditUnits: 3,
    level: 100,
    semester: "SECOND",
    courseType: "ELECTIVE",
    isActive: true,
    createdAt: new Date().toISOString(),
  },

  // 200 Level
  {
    id: "crs-201",
    code: "CPE 201",
    title: "Computer Engineering Principles",
    creditUnits: 3,
    level: 200,
    semester: "FIRST",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-202",
    code: "EEE 201",
    title: "Applied Electricity & Electronics",
    creditUnits: 3,
    level: 200,
    semester: "FIRST",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-203",
    code: "MTH 201",
    title: "Mathematical Methods I",
    creditUnits: 3,
    level: 200,
    semester: "FIRST",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-204",
    code: "CPE 202",
    title: "Digital Logic Design",
    creditUnits: 3,
    level: 200,
    semester: "SECOND",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-205",
    code: "CPE 204",
    title: "Object-Oriented Programming (C++/Java)",
    creditUnits: 3,
    level: 200,
    semester: "SECOND",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },

  // 300 Level
  {
    id: "crs-301",
    code: "CPE 301",
    title: "Microprocessor Systems & Assembly Language",
    creditUnits: 3,
    level: 300,
    semester: "FIRST",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-302",
    code: "CPE 303",
    title: "Signals & Systems Analysis",
    creditUnits: 3,
    level: 300,
    semester: "FIRST",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-303",
    code: "CPE 305",
    title: "Data Structures & Algorithms",
    creditUnits: 3,
    level: 300,
    semester: "FIRST",
    courseType: "ELECTIVE",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-304",
    code: "CPE 302",
    title: "Control Systems Engineering",
    creditUnits: 3,
    level: 300,
    semester: "SECOND",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-305",
    code: "CPE 304",
    title: "Computer Architecture & Organization",
    creditUnits: 3,
    level: 300,
    semester: "SECOND",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },

  // 400 Level
  {
    id: "crs-401",
    code: "CPE 401",
    title: "Embedded Systems Design",
    creditUnits: 3,
    level: 400,
    semester: "FIRST",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-402",
    code: "CPE 403",
    title: "Computer Networks & Data Communication",
    creditUnits: 3,
    level: 400,
    semester: "FIRST",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-403",
    code: "CPE 405",
    title: "Artificial Intelligence & Robotics",
    creditUnits: 3,
    level: 400,
    semester: "FIRST",
    courseType: "ELECTIVE",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-404",
    code: "SIWES 400",
    title: "Industrial Work Experience Scheme (SIWES)",
    creditUnits: 6,
    level: 400,
    semester: "SECOND",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },

  // 500 Level
  {
    id: "crs-501",
    code: "CPE 501",
    title: "Advanced Computer System Architecture",
    creditUnits: 3,
    level: 500,
    semester: "FIRST",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-502",
    code: "CPE 503",
    title: "Network Security & Cryptography",
    creditUnits: 3,
    level: 500,
    semester: "FIRST",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "crs-503",
    code: "CPE 599",
    title: "Final Year Engineering Project",
    creditUnits: 6,
    level: 500,
    semester: "SECOND",
    courseType: "COMPULSORY",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const PRESET_GROUPS: { level: number; semester: "FIRST" | "SECOND" }[] = [
  { level: 100, semester: "FIRST" },
  { level: 100, semester: "SECOND" },
  { level: 200, semester: "FIRST" },
  { level: 200, semester: "SECOND" },
  { level: 300, semester: "FIRST" },
  { level: 300, semester: "SECOND" },
  { level: 400, semester: "FIRST" },
  { level: 400, semester: "SECOND" },
  { level: 500, semester: "FIRST" },
  { level: 500, semester: "SECOND" },
];

export async function getCoursesOverview(): Promise<{
  success: boolean;
  groups: LevelSemesterGroupSummary[];
  totalCourses: number;
  totalCreditUnits: number;
}> {
  try {
    const dbCourses = await prisma.course.findMany({
      orderBy: [{ level: "asc" }, { semester: "asc" }, { code: "asc" }],
    });

    const groups: LevelSemesterGroupSummary[] = PRESET_GROUPS.map((g) => {
      const match = dbCourses.filter(
        (c) => c.level === g.level && c.semester === g.semester
      );
      const totalCreditUnits = match.reduce((sum, c) => sum + c.creditUnits, 0);
      const compulsoryCount = match.filter((c) => c.courseType === "COMPULSORY").length;
      const electiveCount = match.filter((c) => c.courseType === "ELECTIVE").length;

      return {
        key: `${g.level}-${g.semester}`,
        level: g.level,
        levelName: `${g.level} Level`,
        semester: g.semester,
        semesterName: g.semester === "FIRST" ? "First Semester" : "Second Semester",
        totalCourses: match.length,
        compulsoryCount,
        electiveCount,
        totalCreditUnits,
      };
    });

    const totalCourses = dbCourses.length;
    const totalCreditUnits = dbCourses.reduce((sum, c) => sum + c.creditUnits, 0);

    return { success: true, groups, totalCourses, totalCreditUnits };
  } catch {
    const groups: LevelSemesterGroupSummary[] = PRESET_GROUPS.map((g) => {
      const match = fallbackCourses.filter(
        (c) => c.level === g.level && c.semester === g.semester
      );
      const totalCreditUnits = match.reduce((sum, c) => sum + c.creditUnits, 0);
      const compulsoryCount = match.filter((c) => c.courseType === "COMPULSORY").length;
      const electiveCount = match.filter((c) => c.courseType === "ELECTIVE").length;

      return {
        key: `${g.level}-${g.semester}`,
        level: g.level,
        levelName: `${g.level} Level`,
        semester: g.semester,
        semesterName: g.semester === "FIRST" ? "First Semester" : "Second Semester",
        totalCourses: match.length,
        compulsoryCount,
        electiveCount,
        totalCreditUnits,
      };
    });

    const totalCourses = fallbackCourses.length;
    const totalCreditUnits = fallbackCourses.reduce((sum, c) => sum + c.creditUnits, 0);

    return { success: true, groups, totalCourses, totalCreditUnits };
  }
}

export async function getCourses(filters: CourseFilters = {}): Promise<{
  success: boolean;
  courses: CourseItem[];
  total: number;
}> {
  try {
    const where: Record<string, unknown> = {};

    if (filters.level && filters.level !== "ALL") {
      where.level = parseInt(filters.level, 10);
    }
    if (filters.semester && filters.semester !== "ALL") {
      where.semester = filters.semester;
    }
    if (filters.courseType && filters.courseType !== "ALL") {
      where.courseType = filters.courseType;
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
      ];
    }

    const [dbCourses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy: [{ level: "asc" }, { semester: "asc" }, { code: "asc" }],
      }),
      prisma.course.count({ where }),
    ]);

    return {
      success: true,
      courses: dbCourses.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        creditUnits: c.creditUnits,
        level: c.level,
        semester: c.semester as "FIRST" | "SECOND",
        courseType: c.courseType as "COMPULSORY" | "ELECTIVE",
        isActive: c.isActive,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
    };
  } catch {
    let filtered = [...fallbackCourses];

    if (filters.level && filters.level !== "ALL") {
      filtered = filtered.filter((c) => c.level === parseInt(filters.level as string, 10));
    }
    if (filters.semester && filters.semester !== "ALL") {
      filtered = filtered.filter((c) => c.semester === filters.semester);
    }
    if (filters.courseType && filters.courseType !== "ALL") {
      filtered = filtered.filter((c) => c.courseType === filters.courseType);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      courses: filtered,
      total: filtered.length,
    };
  }
}

export async function importCoursesBatch(data: {
  rows: {
    code: string;
    title: string;
    creditUnits: number;
    level: number;
    semester: "FIRST" | "SECOND";
    courseType: "COMPULSORY" | "ELECTIVE";
  }[];
}): Promise<{
  success: boolean;
  message: string;
  importedCount: number;
}> {
  const session = await auth();
  const userId = session?.user?.id;

  try {
    let adminUserId = userId;
    if (!adminUserId) {
      const defaultAdmin = await prisma.user.findFirst({
        where: { role: "SYSTEM_ADMIN" },
      });
      adminUserId = defaultAdmin?.id || "fallback-admin-id";
    }

    let importedCount = 0;

    for (const row of data.rows) {
      await prisma.course.upsert({
        where: { code: row.code },
        update: {
          title: row.title,
          creditUnits: row.creditUnits,
          level: row.level,
          semester: row.semester,
          courseType: row.courseType,
          updatedById: adminUserId,
        },
        create: {
          code: row.code,
          title: row.title,
          creditUnits: row.creditUnits,
          level: row.level,
          semester: row.semester,
          courseType: row.courseType,
          createdById: adminUserId,
        },
      });
      importedCount++;
    }

    revalidatePath("/admin/courses");
    return {
      success: true,
      message: `Successfully seeded ${importedCount} courses.`,
      importedCount,
    };
  } catch {
    let importedCount = 0;
    for (const row of data.rows) {
      const idx = fallbackCourses.findIndex(
        (c) => c.code.toUpperCase() === row.code.toUpperCase()
      );
      if (idx !== -1) {
        fallbackCourses[idx] = {
          ...fallbackCourses[idx],
          title: row.title,
          creditUnits: row.creditUnits,
          level: row.level,
          semester: row.semester,
          courseType: row.courseType,
        };
      } else {
        fallbackCourses.unshift({
          id: `crs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          code: row.code,
          title: row.title,
          creditUnits: row.creditUnits,
          level: row.level,
          semester: row.semester,
          courseType: row.courseType,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
      }
      importedCount++;
    }

    revalidatePath("/admin/courses");
    return {
      success: true,
      message: `Successfully seeded ${importedCount} courses.`,
      importedCount,
    };
  }
}

export async function createCourseManual(data: {
  code: string;
  title: string;
  creditUnits: number;
  level: number;
  semester: "FIRST" | "SECOND";
  courseType: "COMPULSORY" | "ELECTIVE";
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const session = await auth();
  const userId = session?.user?.id;

  try {
    let adminUserId = userId;
    if (!adminUserId) {
      const defaultAdmin = await prisma.user.findFirst({
        where: { role: "SYSTEM_ADMIN" },
      });
      adminUserId = defaultAdmin?.id || "admin-fallback";
    }

    const existing = await prisma.course.findUnique({
      where: { code: data.code.trim().toUpperCase() },
    });

    if (existing) {
      return { success: false, error: `Course code '${data.code}' already exists.` };
    }

    await prisma.course.create({
      data: {
        code: data.code.trim().toUpperCase(),
        title: data.title.trim(),
        creditUnits: Number(data.creditUnits),
        level: Number(data.level),
        semester: data.semester,
        courseType: data.courseType,
        createdById: adminUserId,
      },
    });

    revalidatePath("/admin/courses");
    return { success: true, message: `Course ${data.code} registered successfully.` };
  } catch {
    const code = data.code.trim().toUpperCase();
    if (fallbackCourses.some((c) => c.code.toUpperCase() === code)) {
      return { success: false, error: `Course code '${code}' already exists.` };
    }

    fallbackCourses.unshift({
      id: `crs-${Date.now()}`,
      code,
      title: data.title.trim(),
      creditUnits: Number(data.creditUnits),
      level: Number(data.level),
      semester: data.semester,
      courseType: data.courseType,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    revalidatePath("/admin/courses");
    return { success: true, message: `Course ${code} registered successfully.` };
  }
}

export async function updateCourse(data: {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
  level: number;
  semester: "FIRST" | "SECOND";
  courseType: "COMPULSORY" | "ELECTIVE";
  isActive: boolean;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const session = await auth();
  const userId = session?.user?.id;

  try {
    const code = data.code.trim().toUpperCase();
    const existing = await prisma.course.findFirst({
      where: {
        code,
        NOT: { id: data.id },
      },
    });

    if (existing) {
      return { success: false, error: `Course code '${code}' is in use by another course.` };
    }

    await prisma.course.update({
      where: { id: data.id },
      data: {
        code,
        title: data.title.trim(),
        creditUnits: Number(data.creditUnits),
        level: Number(data.level),
        semester: data.semester,
        courseType: data.courseType,
        isActive: data.isActive,
        updatedById: userId,
      },
    });

    revalidatePath("/admin/courses");
    return { success: true, message: "Course updated successfully." };
  } catch {
    const idx = fallbackCourses.findIndex((c) => c.id === data.id);
    if (idx !== -1) {
      fallbackCourses[idx] = {
        ...fallbackCourses[idx],
        code: data.code.trim().toUpperCase(),
        title: data.title.trim(),
        creditUnits: Number(data.creditUnits),
        level: Number(data.level),
        semester: data.semester,
        courseType: data.courseType,
        isActive: data.isActive,
      };
      revalidatePath("/admin/courses");
      return { success: true, message: "Course updated successfully." };
    }
    return { success: false, error: "Course not found." };
  }
}

export async function deleteCourse(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await prisma.course.delete({
      where: { id },
    });
    revalidatePath("/admin/courses");
    return { success: true, message: "Course deleted successfully." };
  } catch {
    fallbackCourses = fallbackCourses.filter((c) => c.id !== id);
    revalidatePath("/admin/courses");
    return { success: true, message: "Course deleted." };
  }
}
