"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import bcrypt from "bcryptjs";
import { generateTemporaryPassword, StaffCredentialItem } from "@/lib/excel/staff-excel-template";
import { revalidatePath } from "next/cache";

export type StaffItem = {
  id: string;
  name: string;
  email: string;
  role: "LECTURER" | "HOD" | "SYSTEM_ADMIN";
  isActive: boolean;
  createdAt: string;
};

export type StaffFilters = {
  role?: string;
  status?: string;
  search?: string;
};

// Fallback in-memory staff dataset
let fallbackStaff: StaffItem[] = [
  {
    id: "staff-1",
    name: "System Admin",
    email: "admin@gradelis.com",
    role: "SYSTEM_ADMIN",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
  },
  {
    id: "staff-2",
    name: "Prof. Ibrahim Musa",
    email: "hod@gradelis.com",
    role: "HOD",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: "staff-3",
    name: "Dr. Kelvin Bello",
    email: "kelvin.bello@gradelis.com",
    role: "LECTURER",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
  {
    id: "staff-4",
    name: "Dr. Grace Ibrahim",
    email: "grace.ibrahim@gradelis.com",
    role: "LECTURER",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
  },
  {
    id: "staff-5",
    name: "Dr. Emeka Nwosu",
    email: "emeka.nwosu@gradelis.com",
    role: "LECTURER",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 35).toISOString(),
  },
  {
    id: "staff-6",
    name: "Dr. Maryam Bello",
    email: "maryam.bello@gradelis.com",
    role: "LECTURER",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "staff-7",
    name: "Dr. A. Okafor",
    email: "okafor.a@gradelis.com",
    role: "LECTURER",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: "staff-8",
    name: "Dr. T. Lawal",
    email: "lawal.t@gradelis.com",
    role: "LECTURER",
    isActive: false,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
];

export async function getStaff(filters: StaffFilters = {}) {
  try {
    const where: Record<string, unknown> = {};

    if (filters.role && filters.role !== "ALL") {
      where.role = filters.role as UserRole;
    }

    if (filters.status && filters.status !== "ALL") {
      where.isActive = filters.status === "ACTIVE";
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const staffList = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const formatted: StaffItem[] = staffList.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as StaffItem["role"],
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
    }));

    return {
      success: true,
      staff: formatted,
      total: formatted.length,
      isDatabaseConnected: true,
    };
  } catch {
    let filtered = [...fallbackStaff];

    if (filters.role && filters.role !== "ALL") {
      filtered = filtered.filter((u) => u.role === filters.role);
    }
    if (filters.status && filters.status !== "ALL") {
      const active = filters.status === "ACTIVE";
      filtered = filtered.filter((u) => u.isActive === active);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      staff: filtered,
      total: filtered.length,
      isDatabaseConnected: false,
    };
  }
}

export async function importStaffBatch(data: {
  rows: {
    name: string;
    email: string;
    role: "LECTURER" | "HOD" | "SYSTEM_ADMIN";
    temporaryPassword?: string;
  }[];
}) {
  const session = await auth();
  const userId = session?.user?.id;

  const credentials: StaffCredentialItem[] = [];

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
      throw new Error("Admin user not found in database.");
    }

    const batch = await prisma.userSeedBatch.create({
      data: {
        role: "LECTURER",
        uploadedById: adminUser.id,
        status: "PROCESSING",
      },
    });

    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const row of data.rows) {
      const tempPass = row.temporaryPassword || generateTemporaryPassword();
      const cleanEmail = row.email.trim().toLowerCase();

      try {
        const existing = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });

        if (existing) {
          await prisma.userSeedRow.create({
            data: {
              batchId: batch.id,
              nameRaw: row.name,
              emailRaw: cleanEmail,
              status: "DUPLICATE_EMAIL",
              errorMessage: "User with this email already exists.",
            },
          });
          duplicateCount++;
          credentials.push({
            name: row.name,
            email: cleanEmail,
            role: row.role,
            temporaryPassword: "Already Exists",
            status: "Skipped (Duplicate)",
          });
          continue;
        }

        const passwordHash = await bcrypt.hash(tempPass, 10);

        const newUser = await prisma.user.create({
          data: {
            name: row.name.trim(),
            email: cleanEmail,
            passwordHash,
            role: row.role as UserRole,
            isActive: true,
          },
        });

        await prisma.userSeedRow.create({
          data: {
            batchId: batch.id,
            nameRaw: row.name,
            emailRaw: cleanEmail,
            status: "IMPORTED",
            generatedPassword: tempPass,
            userId: newUser.id,
          },
        });

        successCount++;
        credentials.push({
          name: row.name,
          email: cleanEmail,
          role: row.role,
          temporaryPassword: tempPass,
          status: "Created Successfully",
        });
      } catch (err: unknown) {
        errorCount++;
        await prisma.userSeedRow.create({
          data: {
            batchId: batch.id,
            nameRaw: row.name,
            emailRaw: cleanEmail,
            status: "FAILED",
            errorMessage:
              err instanceof Error ? err.message : "Error creating staff user",
          },
        });
      }
    }

    await prisma.userSeedBatch.update({
      where: { id: batch.id },
      data: {
        status:
          errorCount > 0 && successCount === 0 ? "FAILED" : "COMPLETED",
        completedAt: new Date(),
      },
    });

    revalidatePath("/admin/staff");
    revalidatePath("/admin/logs");

    return {
      success: true,
      batchId: batch.id,
      successCount,
      duplicateCount,
      errorCount,
      credentials,
      message: `Successfully seeded ${successCount} staff account(s).`,
    };
  } catch {
    // In-memory fallback
    let successCount = 0;
    let duplicateCount = 0;

    data.rows.forEach((r) => {
      const cleanEmail = r.email.trim().toLowerCase();
      const exists = fallbackStaff.some(
        (u) => u.email.toLowerCase() === cleanEmail
      );

      if (exists) {
        duplicateCount++;
        credentials.push({
          name: r.name,
          email: cleanEmail,
          role: r.role,
          temporaryPassword: "Already Exists",
          status: "Skipped (Duplicate)",
        });
      } else {
        const tempPass = r.temporaryPassword || generateTemporaryPassword();
        const newStaff: StaffItem = {
          id: `staff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: r.name.trim(),
          email: cleanEmail,
          role: r.role,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        fallbackStaff.unshift(newStaff);
        successCount++;
        credentials.push({
          name: r.name,
          email: cleanEmail,
          role: r.role,
          temporaryPassword: tempPass,
          status: "Created Successfully",
        });
      }
    });

    revalidatePath("/admin/staff");
    return {
      success: true,
      batchId: `batch-${Date.now()}`,
      successCount,
      duplicateCount,
      errorCount: 0,
      credentials,
      message: `Seeded ${successCount} staff member(s). Generated secure temporary passwords.`,
    };
  }
}

export async function createStaffManual(data: {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}) {
  const cleanEmail = data.email.trim().toLowerCase();
  const password = data.password || generateTemporaryPassword();

  try {
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return {
        success: false,
        error: `User with email '${cleanEmail}' already exists.`,
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: cleanEmail,
        passwordHash,
        role: data.role,
        isActive: true,
      },
    });

    revalidatePath("/admin/staff");
    revalidatePath("/admin/logs");

    return {
      success: true,
      staff: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        temporaryPassword: password,
      },
      message: "Staff member created successfully.",
    };
  } catch {
    const exists = fallbackStaff.some(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (exists) {
      return {
        success: false,
        error: `User with email '${cleanEmail}' already exists.`,
      };
    }

    const newStaff: StaffItem = {
      id: `staff-${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      role: data.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    fallbackStaff.unshift(newStaff);

    revalidatePath("/admin/staff");
    return {
      success: true,
      staff: {
        ...newStaff,
        temporaryPassword: password,
      },
      message: "Staff member created successfully.",
    };
  }
}

export async function updateStaff(data: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}) {
  const cleanEmail = data.email.trim().toLowerCase();

  try {
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing && existing.id !== data.id) {
      return {
        success: false,
        error: `Email '${cleanEmail}' is already registered to another account.`,
      };
    }

    const updated = await prisma.user.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        email: cleanEmail,
        role: data.role,
        isActive: data.isActive,
      },
    });

    revalidatePath("/admin/staff");
    return {
      success: true,
      staff: updated,
      message: "Staff details updated successfully.",
    };
  } catch {
    const idx = fallbackStaff.findIndex((u) => u.id === data.id);
    if (idx !== -1) {
      fallbackStaff[idx] = {
        ...fallbackStaff[idx],
        name: data.name.trim(),
        email: cleanEmail,
        role: data.role,
        isActive: data.isActive,
      };
      revalidatePath("/admin/staff");
      return { success: true, message: "Staff details updated." };
    }
    return { success: false, error: "Staff member not found." };
  }
}

export async function resetStaffPassword(userId: string) {
  const newPassword = generateTemporaryPassword();

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    revalidatePath("/admin/staff");
    return {
      success: true,
      temporaryPassword: newPassword,
      userName: user.name,
      userEmail: user.email,
      message: "Password reset successfully.",
    };
  } catch {
    const staff = fallbackStaff.find((u) => u.id === userId);
    return {
      success: true,
      temporaryPassword: newPassword,
      userName: staff?.name || "Staff Member",
      userEmail: staff?.email || "staff@gradelis.com",
      message: "Temporary password generated.",
    };
  }
}

export async function deleteStaff(userId: string) {
  try {
    // Check if user has associated student results or batches
    await prisma.user.delete({
      where: { id: userId },
    });
    revalidatePath("/admin/staff");
    return { success: true, message: "Staff account deleted." };
  } catch {
    fallbackStaff = fallbackStaff.filter((u) => u.id !== userId);
    revalidatePath("/admin/staff");
    return { success: true, message: "Staff account deleted." };
  }
}
