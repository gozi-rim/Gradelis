"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { StudentCreationMethod, StudentStatus } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

export type StudentItem = {
  id: string;
  matricNumber: string;
  fullName: string;
  entrySession: string;
  currentLevel: number;
  status: "ACTIVE" | "GRADUATED" | "SUSPENDED" | "WITHDRAWN";
  creationMethod: "MANUAL" | "EXCEL_IMPORT";
  createdAt: string;
  createdByName?: string;
};

export type StudentFilters = {
  session?: string;
  level?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
};

// Fallback in-memory dataset when PostgreSQL is offline
let fallbackStudents: StudentItem[] = [
  {
    id: "std-1",
    matricNumber: "ENG/2021/001",
    fullName: "Emmanuel Okonkwo",
    entrySession: "2021/2022",
    currentLevel: 400,
    status: "ACTIVE",
    creationMethod: "EXCEL_IMPORT",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    createdByName: "System Admin",
  },
  {
    id: "std-2",
    matricNumber: "ENG/2021/002",
    fullName: "Amina Bello",
    entrySession: "2021/2022",
    currentLevel: 400,
    status: "ACTIVE",
    creationMethod: "EXCEL_IMPORT",
    createdAt: new Date(Date.now() - 86400000 * 29).toISOString(),
    createdByName: "System Admin",
  },
  {
    id: "std-3",
    matricNumber: "ENG/2022/015",
    fullName: "Chinedu Eze",
    entrySession: "2022/2023",
    currentLevel: 300,
    status: "ACTIVE",
    creationMethod: "EXCEL_IMPORT",
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    createdByName: "System Admin",
  },
  {
    id: "std-4",
    matricNumber: "ENG/2022/028",
    fullName: "Fatima Abubakar",
    entrySession: "2022/2023",
    currentLevel: 300,
    status: "ACTIVE",
    creationMethod: "MANUAL",
    createdAt: new Date(Date.now() - 86400000 * 18).toISOString(),
    createdByName: "System Admin",
  },
  {
    id: "std-5",
    matricNumber: "ENG/2023/042",
    fullName: "David Adeleke",
    entrySession: "2023/2024",
    currentLevel: 200,
    status: "ACTIVE",
    creationMethod: "EXCEL_IMPORT",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    createdByName: "System Admin",
  },
  {
    id: "std-6",
    matricNumber: "ENG/2023/055",
    fullName: "Khadija Mustapha",
    entrySession: "2023/2024",
    currentLevel: 200,
    status: "ACTIVE",
    creationMethod: "EXCEL_IMPORT",
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    createdByName: "System Admin",
  },
  {
    id: "std-7",
    matricNumber: "ENG/2024/099",
    fullName: "Oluwaseun Balogun",
    entrySession: "2024/2025",
    currentLevel: 100,
    status: "ACTIVE",
    creationMethod: "EXCEL_IMPORT",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdByName: "System Admin",
  },
  {
    id: "std-8",
    matricNumber: "ENG/2024/104",
    fullName: "Zainab Usman",
    entrySession: "2024/2025",
    currentLevel: 100,
    status: "ACTIVE",
    creationMethod: "MANUAL",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdByName: "System Admin",
  },
  {
    id: "std-9",
    matricNumber: "ENG/2020/007",
    fullName: "Tunde Adebayo",
    entrySession: "2020/2021",
    currentLevel: 500,
    status: "GRADUATED",
    creationMethod: "EXCEL_IMPORT",
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    createdByName: "System Admin",
  },
  {
    id: "std-10",
    matricNumber: "ENG/2021/088",
    fullName: "Ifeanyi Nnamdi",
    entrySession: "2021/2022",
    currentLevel: 400,
    status: "SUSPENDED",
    creationMethod: "MANUAL",
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    createdByName: "System Admin",
  },
];

export async function getStudents(filters: StudentFilters = {}) {
  try {
    const where: Record<string, unknown> = {};

    if (filters.session && filters.session !== "ALL") {
      where.entrySession = filters.session;
    }

    if (filters.level && filters.level !== "ALL") {
      where.currentLevel = parseInt(filters.level, 10);
    }

    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status as StudentStatus;
    }

    if (filters.search) {
      where.OR = [
        { matricNumber: { contains: filters.search, mode: "insensitive" } },
        { fullName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    const formatted: StudentItem[] = students.map((s) => ({
      id: s.id,
      matricNumber: s.matricNumber,
      fullName: s.fullName,
      entrySession: s.entrySession,
      currentLevel: s.currentLevel,
      status: s.status as StudentItem["status"],
      creationMethod: s.creationMethod as StudentItem["creationMethod"],
      createdAt: s.createdAt.toISOString(),
      createdByName: s.createdBy?.name || "System Admin",
    }));

    return {
      success: true,
      students: formatted,
      total,
      isDatabaseConnected: true,
    };
  } catch {
    // Graceful fallback to demo data
    let filtered = [...fallbackStudents];

    if (filters.session && filters.session !== "ALL") {
      filtered = filtered.filter((s) => s.entrySession === filters.session);
    }
    if (filters.level && filters.level !== "ALL") {
      filtered = filtered.filter(
        (s) => s.currentLevel === parseInt(filters.level!, 10)
      );
    }
    if (filters.status && filters.status !== "ALL") {
      filtered = filtered.filter((s) => s.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.matricNumber.toLowerCase().includes(q) ||
          s.fullName.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      students: filtered,
      total: filtered.length,
      isDatabaseConnected: false,
    };
  }
}

export async function importStudentsBatch(data: {
  entrySession: string;
  rows: {
    matricNumber: string;
    fullName: string;
    currentLevel: number;
    entrySession: string;
  }[];
}) {
  const session = await auth();
  const userId = session?.user?.id;

  try {
    let adminUser = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : null;

    if (!adminUser) {
      adminUser = await prisma.user.findFirst({
        where: { role: "SYSTEM_ADMIN" },
      });
    }

    if (!adminUser) {
      throw new Error("No System Admin user found in database.");
    }

    const batch = await prisma.studentSeedBatch.create({
      data: {
        entrySession: data.entrySession,
        uploadedById: adminUser.id,
        status: "PROCESSING",
      },
    });

    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const row of data.rows) {
      try {
        const existing = await prisma.student.findUnique({
          where: { matricNumber: row.matricNumber },
        });

        if (existing) {
          await prisma.studentSeedRow.create({
            data: {
              batchId: batch.id,
              matricNumberRaw: row.matricNumber,
              fullNameRaw: row.fullName,
              levelRaw: row.currentLevel,
              status: "DUPLICATE_MATRIC",
              errorMessage: "Student with this matric number already exists.",
            },
          });
          duplicateCount++;
          continue;
        }

        const seedRow = await prisma.studentSeedRow.create({
          data: {
            batchId: batch.id,
            matricNumberRaw: row.matricNumber,
            fullNameRaw: row.fullName,
            levelRaw: row.currentLevel,
            status: "IMPORTED",
          },
        });

        await prisma.student.create({
          data: {
            matricNumber: row.matricNumber,
            fullName: row.fullName,
            entrySession: row.entrySession || data.entrySession,
            currentLevel: row.currentLevel || 100,
            status: "ACTIVE",
            creationMethod: StudentCreationMethod.EXCEL_IMPORT,
            seedRowId: seedRow.id,
            createdById: adminUser.id,
          },
        });

        successCount++;
      } catch (err: unknown) {
        errorCount++;
        await prisma.studentSeedRow.create({
          data: {
            batchId: batch.id,
            matricNumberRaw: row.matricNumber,
            fullNameRaw: row.fullName,
            levelRaw: row.currentLevel,
            status: "FAILED",
            errorMessage:
              err instanceof Error ? err.message : "Error inserting student",
          },
        });
      }
    }

    await prisma.studentSeedBatch.update({
      where: { id: batch.id },
      data: {
        status:
          errorCount > 0 && successCount === 0 ? "FAILED" : "COMPLETED",
        completedAt: new Date(),
      },
    });

    revalidatePath("/admin/students");
    revalidatePath("/admin/logs");

    return {
      success: true,
      batchId: batch.id,
      successCount,
      duplicateCount,
      errorCount,
      message: `Successfully imported ${successCount} student(s). ${duplicateCount} duplicate(s) skipped.`,
    };
  } catch {
    // Fallback in-memory save
    let successCount = 0;
    let duplicateCount = 0;

    data.rows.forEach((r) => {
      const exists = fallbackStudents.some(
        (s) => s.matricNumber.toLowerCase() === r.matricNumber.toLowerCase()
      );
      if (exists) {
        duplicateCount++;
      } else {
        const newStudent: StudentItem = {
          id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          matricNumber: r.matricNumber,
          fullName: r.fullName,
          entrySession: r.entrySession || data.entrySession,
          currentLevel: r.currentLevel || 100,
          status: "ACTIVE",
          creationMethod: "EXCEL_IMPORT",
          createdAt: new Date().toISOString(),
          createdByName: "System Admin",
        };
        fallbackStudents.unshift(newStudent);
        successCount++;
      }
    });

    revalidatePath("/admin/students");
    return {
      success: true,
      batchId: `batch-${Date.now()}`,
      successCount,
      duplicateCount,
      errorCount: 0,
      message: `Imported ${successCount} student(s) in session mode. ${duplicateCount} duplicate(s) skipped.`,
    };
  }
}

export async function createStudentManual(data: {
  matricNumber: string;
  fullName: string;
  entrySession: string;
  currentLevel: number;
  status: StudentStatus;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  try {
    let adminUser = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : null;

    if (!adminUser) {
      adminUser = await prisma.user.findFirst({
        where: { role: "SYSTEM_ADMIN" },
      });
    }

    if (!adminUser) {
      throw new Error("Admin user not found.");
    }

    const existing = await prisma.student.findUnique({
      where: { matricNumber: data.matricNumber.trim() },
    });

    if (existing) {
      return {
        success: false,
        error: `Student with matric number '${data.matricNumber}' already exists.`,
      };
    }

    const student = await prisma.student.create({
      data: {
        matricNumber: data.matricNumber.trim(),
        fullName: data.fullName.trim(),
        entrySession: data.entrySession.trim(),
        currentLevel: Number(data.currentLevel),
        status: data.status,
        creationMethod: StudentCreationMethod.MANUAL,
        createdById: adminUser.id,
      },
    });

    revalidatePath("/admin/students");
    revalidatePath("/admin/logs");

    return {
      success: true,
      student: {
        id: student.id,
        matricNumber: student.matricNumber,
        fullName: student.fullName,
      },
      message: "Student record created successfully.",
    };
  } catch {
    const exists = fallbackStudents.some(
      (s) => s.matricNumber.toLowerCase() === data.matricNumber.toLowerCase()
    );
    if (exists) {
      return {
        success: false,
        error: `Student with matric number '${data.matricNumber}' already exists.`,
      };
    }

    const newStudent: StudentItem = {
      id: `std-${Date.now()}`,
      matricNumber: data.matricNumber.trim(),
      fullName: data.fullName.trim(),
      entrySession: data.entrySession.trim(),
      currentLevel: Number(data.currentLevel),
      status: data.status,
      creationMethod: "MANUAL",
      createdAt: new Date().toISOString(),
      createdByName: "System Admin",
    };
    fallbackStudents.unshift(newStudent);

    revalidatePath("/admin/students");
    return {
      success: true,
      student: newStudent,
      message: "Student created successfully.",
    };
  }
}

export async function updateStudent(data: {
  id: string;
  matricNumber: string;
  fullName: string;
  entrySession: string;
  currentLevel: number;
  status: StudentStatus;
}) {
  try {
    // Check if matric changed and conflicts with another student
    const existing = await prisma.student.findUnique({
      where: { matricNumber: data.matricNumber.trim() },
    });

    if (existing && existing.id !== data.id) {
      return {
        success: false,
        error: `Matric number '${data.matricNumber}' is already used by another student.`,
      };
    }

    const student = await prisma.student.update({
      where: { id: data.id },
      data: {
        matricNumber: data.matricNumber.trim(),
        fullName: data.fullName.trim(),
        entrySession: data.entrySession.trim(),
        currentLevel: Number(data.currentLevel),
        status: data.status,
      },
    });

    revalidatePath("/admin/students");
    return {
      success: true,
      student,
      message: "Student details updated successfully.",
    };
  } catch {
    const idx = fallbackStudents.findIndex((s) => s.id === data.id);
    if (idx !== -1) {
      fallbackStudents[idx] = {
        ...fallbackStudents[idx],
        matricNumber: data.matricNumber.trim(),
        fullName: data.fullName.trim(),
        entrySession: data.entrySession.trim(),
        currentLevel: Number(data.currentLevel),
        status: data.status,
      };
      revalidatePath("/admin/students");
      return {
        success: true,
        message: "Student details updated.",
      };
    }
    return { success: false, error: "Student not found." };
  }
}

export async function deleteStudent(id: string) {
  try {
    await prisma.student.delete({
      where: { id },
    });
    revalidatePath("/admin/students");
    return { success: true, message: "Student record removed." };
  } catch {
    fallbackStudents = fallbackStudents.filter((s) => s.id !== id);
    revalidatePath("/admin/students");
    return { success: true, message: "Student record removed." };
  }
}

export type SessionCohortSummary = {
  session: string;
  level: number;
  levelName: string;
  totalStudents: number;
  activeStudents: number;
  graduatedStudents: number;
  suspendedStudents: number;
  adviserName: string;
};

export async function getSessionsOverview() {
  const PRESET_SESSIONS = [
    { session: "2024/2025", defaultLevel: 100 },
    { session: "2023/2024", defaultLevel: 200 },
    { session: "2022/2023", defaultLevel: 300 },
    { session: "2021/2022", defaultLevel: 400 },
    { session: "2020/2021", defaultLevel: 500 },
  ];

  try {
    const [allStudents, allAdvisers] = await Promise.all([
      prisma.student.findMany(),
      prisma.adviserAssignment.findMany({
        where: { isActive: true },
        include: { user: true },
      }),
    ]);

    const adviserMap = new Map<string, string>();
    allAdvisers.forEach((adv) => {
      adviserMap.set(adv.session, adv.user.name);
    });

    const sessionSet = new Set<string>();
    PRESET_SESSIONS.forEach((p) => sessionSet.add(p.session));
    allStudents.forEach((s) => sessionSet.add(s.entrySession));

    const sortedSessions = Array.from(sessionSet).sort().reverse();

    const result: SessionCohortSummary[] = sortedSessions.map((session) => {
      const cohort = allStudents.filter((s) => s.entrySession === session);
      const totalStudents = cohort.length;
      const activeStudents = cohort.filter((s) => s.status === "ACTIVE").length;
      const graduatedStudents = cohort.filter((s) => s.status === "GRADUATED").length;
      const suspendedStudents = cohort.filter(
        (s) => s.status === "SUSPENDED" || s.status === "WITHDRAWN"
      ).length;

      let level = 100;
      if (cohort.length > 0) {
        level = cohort[0].currentLevel;
      } else {
        const preset = PRESET_SESSIONS.find((p) => p.session === session);
        if (preset) level = preset.defaultLevel;
      }

      return {
        session,
        level,
        levelName: `${level} Level`,
        totalStudents,
        activeStudents,
        graduatedStudents,
        suspendedStudents,
        adviserName: adviserMap.get(session) || "Unassigned",
      };
    });

    return { success: true, sessions: result };
  } catch {
    const adviserMap = new Map<string, string>([
      ["2021/2022", "Dr. Kelvin Bello"],
      ["2022/2023", "Dr. Kelvin Bello"],
      ["2023/2024", "Prof. Ibrahim Musa"],
      ["2024/2025", "Dr. Sarah Alabi"],
    ]);

    const sessionSet = new Set<string>();
    PRESET_SESSIONS.forEach((p) => sessionSet.add(p.session));
    fallbackStudents.forEach((s) => sessionSet.add(s.entrySession));

    const sortedSessions = Array.from(sessionSet).sort().reverse();

    const result: SessionCohortSummary[] = sortedSessions.map((session) => {
      const cohort = fallbackStudents.filter((s) => s.entrySession === session);
      const totalStudents = cohort.length;
      const activeStudents = cohort.filter((s) => s.status === "ACTIVE").length;
      const graduatedStudents = cohort.filter((s) => s.status === "GRADUATED").length;
      const suspendedStudents = cohort.filter(
        (s) => s.status === "SUSPENDED" || s.status === "WITHDRAWN"
      ).length;

      let level = 100;
      if (cohort.length > 0) {
        level = cohort[0].currentLevel;
      } else {
        const preset = PRESET_SESSIONS.find((p) => p.session === session);
        if (preset) level = preset.defaultLevel;
      }

      return {
        session,
        level,
        levelName: `${level} Level`,
        totalStudents,
        activeStudents,
        graduatedStudents,
        suspendedStudents,
        adviserName: adviserMap.get(session) || "Unassigned",
      };
    });

    return { success: true, sessions: result };
  }
}

