"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Prisma,
  StudentCreationMethod,
  StudentStatus,
} from "@/generated/prisma";
import { revalidatePath } from "next/cache";

/* ============================================================
   TYPES
   ============================================================ */

export type StudentItem = {
  id: string;
  matricNumber: string;
  fullName: string;
  entrySession: string;
  currentLevel: number;
  status: StudentStatus;
  creationMethod: StudentCreationMethod;
  createdAt: string;
  createdByName: string;
};

export type StudentFilters = {
  session?: string;
  level?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
};

type CreateStudentInput = {
  matricNumber: string;
  fullName: string;
  entrySession: string;
  currentLevel: number;
  status?: StudentStatus;
};

type UpdateStudentInput = {
  id: string;
  matricNumber: string;
  fullName: string;
  entrySession: string;
  currentLevel: number;
  status: StudentStatus;
};

type ImportStudentRow = {
  matricNumber: string;
  fullName: string;
  currentLevel: number;
  entrySession?: string;
};

/* ============================================================
   AUTHORIZATION
   ============================================================ */

async function requireSystemAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new Error("User account not found");
  }

  if (!user.isActive) {
    throw new Error("User account is inactive");
  }

  if (user.role !== "SYSTEM_ADMIN") {
    throw new Error("Forbidden: System Admin access required");
  }

  return user;
}

/* ============================================================
   VALIDATION
   ============================================================ */

function validateStudentData(data: {
  matricNumber: string;
  fullName: string;
  entrySession: string;
  currentLevel: number;
}) {
  const matricNumber = data.matricNumber.trim();
  const fullName = data.fullName.trim();
  const entrySession = data.entrySession.trim();
  const currentLevel = Number(data.currentLevel);

  if (!matricNumber) {
    throw new Error("Matric number is required");
  }

  if (!fullName) {
    throw new Error("Student name is required");
  }

  if (!entrySession) {
    throw new Error("Entry session is required");
  }

  if (![100, 200, 300, 400, 500].includes(currentLevel)) {
    throw new Error("Invalid student level");
  }

  return {
    matricNumber,
    fullName,
    entrySession,
    currentLevel,
  };
}

/* ============================================================
   GET STUDENTS
   ============================================================ */

export async function getStudents(
  filters: StudentFilters = {}
): Promise<{
  success: boolean;
  students: StudentItem[];
  total: number;
  page: number;
  limit: number;
}> {
  await requireSystemAdmin();

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: Prisma.StudentWhereInput = {};

  if (filters.session && filters.session !== "ALL") {
    where.entrySession = filters.session;
  }

  if (filters.level && filters.level !== "ALL") {
    const level = Number(filters.level);

    if (![100, 200, 300, 400, 500].includes(level)) {
      throw new Error("Invalid level filter");
    }

    where.currentLevel = level;
  }

  if (filters.status && filters.status !== "ALL") {
    if (!Object.values(StudentStatus).includes(filters.status as StudentStatus)) {
      throw new Error("Invalid status filter");
    }

    where.status = filters.status as StudentStatus;
  }

  const search = filters.search?.trim();

  if (search) {
    where.OR = [
      {
        matricNumber: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        fullName: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  const [students, total] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.student.count({
      where,
    }),
  ]);

  return {
    success: true,

    students: students.map((student) => ({
      id: student.id,
      matricNumber: student.matricNumber,
      fullName: student.fullName,
      entrySession: student.entrySession,
      currentLevel: student.currentLevel,
      status: student.status,
      creationMethod: student.creationMethod,
      createdAt: student.createdAt.toISOString(),
      createdByName: student.createdBy.name,
    })),

    total,
    page,
    limit,
  };
}

/* ============================================================
   GET SINGLE STUDENT
   ============================================================ */

   export async function bulkDeleteStudents(
     ids: string[]
   ): Promise<{ success: boolean; deletedCount?: number; message?: string }> {
     await requireSystemAdmin();

     if (!Array.isArray(ids) || ids.length === 0) {
       return { success: false, message: "No students selected." };
     }

     // Defensive cap — avoids one accidental click nuking an unbounded set
     // if selection state ever gets out of sync with what's rendered.
     if (ids.length > 500) {
       return { success: false, message: "Too many students selected at once." };
     }

     const result = await prisma.student.deleteMany({
       where: { id: { in: ids } },
     });

     return {
       success: true,
       deletedCount: result.count,
       message: `${result.count} student${result.count === 1 ? "" : "s"} deleted successfully.`,
     };
   }


export async function getStudentById(id: string) {
  await requireSystemAdmin();

  if (!id) {
    throw new Error("Student ID is required");
  }

  const student = await prisma.student.findUnique({
    where: {
      id,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      results: {
        include: {
          course: true,
        },
        orderBy: {
          academicSession: "desc",
        },
      },
    },
  });

  if (!student) {
    return {
      success: false,
      error: "Student not found",
    };
  }

  return {
    success: true,
    student,
  };
}

/* ============================================================
   CREATE STUDENT MANUALLY
   ============================================================ */

export async function createStudentManual(
  data: CreateStudentInput
) {
  const admin = await requireSystemAdmin();

  const validated = validateStudentData(data);

  const existing = await prisma.student.findUnique({
    where: {
      matricNumber: validated.matricNumber,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return {
      success: false,
      error: `Student with matric number "${validated.matricNumber}" already exists.`,
    };
  }

  try {
    const student = await prisma.student.create({
      data: {
        matricNumber: validated.matricNumber,
        fullName: validated.fullName,
        entrySession: validated.entrySession,
        currentLevel: validated.currentLevel,
        status: data.status ?? StudentStatus.ACTIVE,
        creationMethod: StudentCreationMethod.MANUAL,
        createdById: admin.id,
      },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    revalidatePath("/admin/students");

    return {
      success: true,
      student: {
        id: student.id,
        matricNumber: student.matricNumber,
        fullName: student.fullName,
        entrySession: student.entrySession,
        currentLevel: student.currentLevel,
        status: student.status,
        creationMethod: student.creationMethod,
        createdAt: student.createdAt.toISOString(),
        createdByName: student.createdBy.name,
      },
      message: "Student record created successfully.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "A student with this matric number already exists.",
      };
    }

    console.error("createStudentManual:", error);

    return {
      success: false,
      error: "Failed to create student.",
    };
  }
}

/* ============================================================
   UPDATE STUDENT
   ============================================================ */

export async function updateStudent(
  data: UpdateStudentInput
) {
  await requireSystemAdmin();

  if (!data.id) {
    return {
      success: false,
      error: "Student ID is required.",
    };
  }

  const validated = validateStudentData(data);

  const student = await prisma.student.findUnique({
    where: {
      id: data.id,
    },
  });

  if (!student) {
    return {
      success: false,
      error: "Student not found.",
    };
  }

  const matricOwner = await prisma.student.findUnique({
    where: {
      matricNumber: validated.matricNumber,
    },
    select: {
      id: true,
    },
  });

  if (matricOwner && matricOwner.id !== data.id) {
    return {
      success: false,
      error: `Matric number "${validated.matricNumber}" is already used by another student.`,
    };
  }

  try {
    const updatedStudent = await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        matricNumber: validated.matricNumber,
        fullName: validated.fullName,
        entrySession: validated.entrySession,
        currentLevel: validated.currentLevel,
        status: data.status,
      },
    });

    revalidatePath("/admin/students");

    return {
      success: true,
      student: updatedStudent,
      message: "Student details updated successfully.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "A student with this matric number already exists.",
      };
    }

    console.error("updateStudent:", error);

    return {
      success: false,
      error: "Failed to update student.",
    };
  }
}

/* ============================================================
   DELETE STUDENT
   ============================================================ */

export async function deleteStudent(id: string) {
  await requireSystemAdmin();

  if (!id) {
    return {
      success: false,
      error: "Student ID is required.",
    };
  }

  const student = await prisma.student.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      matricNumber: true,
    },
  });

  if (!student) {
    return {
      success: false,
      error: "Student not found.",
    };
  }

  try {
    await prisma.student.delete({
      where: {
        id,
      },
    });

    revalidatePath("/admin/students");

    return {
      success: true,
      message: `Student "${student.matricNumber}" deleted successfully.`,
    };
  } catch (error) {
    console.error("deleteStudent:", error);

    return {
      success: false,
      error:
        "Unable to delete student. The student may have related records.",
    };
  }
}

/* ============================================================
   IMPORT STUDENTS
   ============================================================ */

export async function importStudentsBatch(data: {
  entrySession: string;
  rows: ImportStudentRow[];
}) {
  const admin = await requireSystemAdmin();

  if (!data.entrySession?.trim()) {
    return {
      success: false,
      error: "Entry session is required.",
    };
  }

  if (!Array.isArray(data.rows) || data.rows.length === 0) {
    return {
      success: false,
      error: "No students were provided for import.",
    };
  }

  const entrySession = data.entrySession.trim();

  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  const batch = await prisma.studentSeedBatch.create({
    data: {
      entrySession,
      uploadedById: admin.id,
      status: "PROCESSING",
    },
  });

  for (const row of data.rows) {
    try {
      const validated = validateStudentData({
        matricNumber: row.matricNumber,
        fullName: row.fullName,
        entrySession: row.entrySession ?? entrySession,
        currentLevel: row.currentLevel,
      });

      const existing = await prisma.student.findUnique({
        where: {
          matricNumber: validated.matricNumber,
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        duplicateCount++;

        await prisma.studentSeedRow.create({
          data: {
            batchId: batch.id,
            matricNumberRaw: row.matricNumber,
            fullNameRaw: row.fullName,
            levelRaw: row.currentLevel,
            status: "DUPLICATE_MATRIC",
            errorMessage:
              "Student with this matric number already exists.",
          },
        });

        continue;
      }

      await prisma.$transaction(async (tx) => {
        const seedRow = await tx.studentSeedRow.create({
          data: {
            batchId: batch.id,
            matricNumberRaw: validated.matricNumber,
            fullNameRaw: validated.fullName,
            levelRaw: validated.currentLevel,
            status: "VALID",
          },
        });

        await tx.student.create({
          data: {
            matricNumber: validated.matricNumber,
            fullName: validated.fullName,
            entrySession: validated.entrySession,
            currentLevel: validated.currentLevel,
            status: StudentStatus.ACTIVE,
            creationMethod: StudentCreationMethod.EXCEL_IMPORT,
            seedRowId: seedRow.id,
            createdById: admin.id,
          },
        });

        await tx.studentSeedRow.update({
          where: {
            id: seedRow.id,
          },
          data: {
            status: "IMPORTED",
          },
        });
      });

      successCount++;
    } catch (error) {
      errorCount++;

      await prisma.studentSeedRow.create({
        data: {
          batchId: batch.id,
          matricNumberRaw: row.matricNumber ?? "",
          fullNameRaw: row.fullName ?? "",
          levelRaw: row.currentLevel ?? null,
          status: "FAILED",
          errorMessage:
            error instanceof Error
              ? error.message
              : "Failed to import student.",
        },
      });
    }
  }

  await prisma.studentSeedBatch.update({
    where: {
      id: batch.id,
    },
    data: {
      status:
        successCount === 0 && errorCount > 0
          ? "FAILED"
          : "COMPLETED",
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
    message:
      `Imported ${successCount} student(s). ` +
      `${duplicateCount} duplicate(s) skipped. ` +
      `${errorCount} error(s).`,
  };
}

/* ============================================================
   SESSION / COHORT OVERVIEW
   ============================================================ */

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
  await requireSystemAdmin();

  const [students, advisers] = await prisma.$transaction([
    prisma.student.findMany({
      select: {
        entrySession: true,
        currentLevel: true,
        status: true,
      },
    }),

    prisma.adviserAssignment.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        lecturer: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const adviserMap = new Map<string, string>();

  for (const assignment of advisers) {
    adviserMap.set(
      assignment.entrySession,
      assignment.lecturer.name
    );
  }

  const sessionMap = new Map<
    string,
    {
      level: number;
      totalStudents: number;
      activeStudents: number;
      graduatedStudents: number;
      suspendedStudents: number;
    }
  >();

  for (const student of students) {
    const existing = sessionMap.get(student.entrySession);

    if (!existing) {
      sessionMap.set(student.entrySession, {
        level: student.currentLevel,
        totalStudents: 1,
        activeStudents:
          student.status === "ACTIVE" ? 1 : 0,
        graduatedStudents:
          student.status === "GRADUATED" ? 1 : 0,
        suspendedStudents:
          student.status === "SUSPENDED" ||
          student.status === "WITHDRAWN"
            ? 1
            : 0,
      });

      continue;
    }

    existing.totalStudents++;

    if (student.status === "ACTIVE") {
      existing.activeStudents++;
    }

    if (student.status === "GRADUATED") {
      existing.graduatedStudents++;
    }

    if (
      student.status === "SUSPENDED" ||
      student.status === "WITHDRAWN"
    ) {
      existing.suspendedStudents++;
    }
  }

  const sessions = Array.from(sessionMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([session, data]) => ({
      session,
      level: data.level,
      levelName: `${data.level} Level`,
      totalStudents: data.totalStudents,
      activeStudents: data.activeStudents,
      graduatedStudents: data.graduatedStudents,
      suspendedStudents: data.suspendedStudents,
      adviserName:
        adviserMap.get(session) ?? "Unassigned",
    }));

  return {
    success: true,
    sessions,
  };
}
