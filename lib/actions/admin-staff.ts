"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import bcrypt from "bcryptjs";
import {
  generateTemporaryPassword,
  StaffCredentialItem,
} from "@/lib/excel/staff-excel-template";
import { revalidatePath } from "next/cache";

/* ============================================================================
   TYPES
============================================================================ */

export type StaffItem = {
  id: string;
  name: string;
  email: string;
  role: "LECTURER" | "HOD" | "SYSTEM_ADMIN";
  isActive: boolean;
  createdAt: string;
};

export type StaffFilters = {
  role?: "ALL" | "LECTURER" | "HOD" | "SYSTEM_ADMIN";
  status?: "ALL" | "ACTIVE" | "INACTIVE";
  search?: string;
};

type StaffRole = "LECTURER" | "HOD" | "SYSTEM_ADMIN";

/* ============================================================================
   AUTHORIZATION
============================================================================ */

async function requireSystemAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized.");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new Error("Authenticated user was not found.");
  }

  if (!user.isActive) {
    throw new Error("Your account is inactive.");
  }

  if (user.role !== UserRole.SYSTEM_ADMIN) {
    throw new Error("Only system administrators can manage staff.");
  }

  return user;
}

/* ============================================================================
   HELPERS
============================================================================ */

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidStaffRole(role: string): role is StaffRole {
  return (
    role === "LECTURER" ||
    role === "HOD" ||
    role === "SYSTEM_ADMIN"
  );
}

function toStaffItem(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}): StaffItem {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as StaffItem["role"],
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

/* ============================================================================
   GET STAFF
============================================================================ */

export async function getStaff(filters: StaffFilters = {}) {
  try {
    await requireSystemAdmin();

    const where: {
      role?: UserRole;
      isActive?: boolean;
      OR?: Array<{
        name?: {
          contains: string;
          mode: "insensitive";
        };
        email?: {
          contains: string;
          mode: "insensitive";
        };
      }>;
    } = {};

    if (filters.role && filters.role !== "ALL") {
      where.role = filters.role as UserRole;
    }

    if (filters.status && filters.status !== "ALL") {
      where.isActive = filters.status === "ACTIVE";
    }

    const search = filters.search?.trim();

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    const staff = users.map(toStaffItem);

    return {
      success: true as const,
      staff,
      total: staff.length,
      isDatabaseConnected: true as const,
    };
  } catch (error) {
    console.error("getStaff error:", error);

    return {
      success: false as const,
      staff: [],
      total: 0,
      isDatabaseConnected: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load staff accounts.",
    };
  }
}

/* ============================================================================
   IMPORT STAFF BATCH
============================================================================ */

export async function importStaffBatch(data: {
  rows: {
    name: string;
    email: string;
    role: StaffRole;
  }[];
}) {
  const credentials: StaffCredentialItem[] = [];

  try {
    const admin = await requireSystemAdmin();

    if (!Array.isArray(data.rows) || data.rows.length === 0) {
      return {
        success: false as const,
        batchId: null,
        successCount: 0,
        duplicateCount: 0,
        errorCount: 0,
        credentials,
        error: "No staff records were supplied.",
      };
    }

    /* ------------------------------------------------------------------------
       Validate and normalize rows
    ------------------------------------------------------------------------ */

    const preparedRows = data.rows.map((row, index) => {
      const name = normalizeName(row.name ?? "");
      const email = normalizeEmail(row.email ?? "");
      const role = row.role;

      if (!name) {
        throw new Error(`Row ${index + 1}: name is required.`);
      }

      if (!email) {
        throw new Error(`Row ${index + 1}: email is required.`);
      }

      if (!isValidEmail(email)) {
        throw new Error(
          `Row ${index + 1}: invalid email address '${email}'.`
        );
      }

      if (!isValidStaffRole(role)) {
        throw new Error(`Row ${index + 1}: invalid staff role.`);
      }

      return {
        name,
        email,
        role,
      };
    });

    /* ------------------------------------------------------------------------
       Determine batch role metadata
    ------------------------------------------------------------------------ */

    const uniqueRoles = [
      ...new Set(preparedRows.map((row) => row.role)),
    ];

    const batchRole =
      uniqueRoles.length === 1
        ? uniqueRoles[0]
        : UserRole.LECTURER;

    /* ------------------------------------------------------------------------
       Create seed batch
    ------------------------------------------------------------------------ */

    const batch = await prisma.userSeedBatch.create({
      data: {
        role: batchRole,
        uploadedById: admin.id,
        status: "PROCESSING",
      },
    });

    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    /* ------------------------------------------------------------------------
       Process rows
    ------------------------------------------------------------------------ */

    const seenEmails = new Set<string>();

    for (const row of preparedRows) {
      /* ----------------------------------------------------------------------
         Duplicate inside uploaded file
      ---------------------------------------------------------------------- */

      if (seenEmails.has(row.email)) {
        duplicateCount++;

        await prisma.userSeedRow.create({
          data: {
            batchId: batch.id,
            nameRaw: row.name,
            emailRaw: row.email,
            status: "DUPLICATE_EMAIL",
            errorMessage: "Duplicate email in uploaded file.",
          },
        });

        credentials.push({
          name: row.name,
          email: row.email,
          role: row.role,
          temporaryPassword: "Duplicate in file",
          status: "Skipped (Duplicate)",
        });

        continue;
      }

      seenEmails.add(row.email);

      try {
        /* --------------------------------------------------------------------
           Check database
        -------------------------------------------------------------------- */

        const existing = await prisma.user.findUnique({
          where: {
            email: row.email,
          },
          select: {
            id: true,
          },
        });

        if (existing) {
          duplicateCount++;

          await prisma.userSeedRow.create({
            data: {
              batchId: batch.id,
              nameRaw: row.name,
              emailRaw: row.email,
              status: "DUPLICATE_EMAIL",
              errorMessage: "User with this email already exists.",
            },
          });

          credentials.push({
            name: row.name,
            email: row.email,
            role: row.role,
            temporaryPassword: "Already Exists",
            status: "Skipped (Duplicate)",
          });

          continue;
        }

        /* --------------------------------------------------------------------
           Generate password
        -------------------------------------------------------------------- */

        const temporaryPassword = generateTemporaryPassword();

        const passwordHash = await bcrypt.hash(
          temporaryPassword,
          12
        );

        /* --------------------------------------------------------------------
           Create user + seed row atomically
        -------------------------------------------------------------------- */

        const user = await prisma.$transaction(async (tx) => {
          const createdUser = await tx.user.create({
            data: {
              name: row.name,
              email: row.email,
              passwordHash,
              role: row.role as UserRole,
              isActive: true,
            },
          });

          await tx.userSeedRow.create({
            data: {
              batchId: batch.id,
              nameRaw: row.name,
              emailRaw: row.email,
              status: "IMPORTED",
              generatedPassword: temporaryPassword,
              userId: createdUser.id,
            },
          });

          return createdUser;
        });

        successCount++;

        credentials.push({
          name: user.name,
          email: user.email,
          role: user.role,
          temporaryPassword,
          status: "Created Successfully",
        });
      } catch (error) {
        errorCount++;

        await prisma.userSeedRow.create({
          data: {
            batchId: batch.id,
            nameRaw: row.name,
            emailRaw: row.email,
            status: "FAILED",
            errorMessage:
              error instanceof Error
                ? error.message
                : "Failed to create staff account.",
          },
        });
      }
    }

    /* ------------------------------------------------------------------------
       Complete batch
    ------------------------------------------------------------------------ */

    await prisma.userSeedBatch.update({
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

    revalidatePath("/admin/staff");
    revalidatePath("/admin/logs");

    return {
      success: true as const,
      batchId: batch.id,
      successCount,
      duplicateCount,
      errorCount,
      credentials,
      message:
        successCount > 0
          ? `Successfully created ${successCount} staff account(s).`
          : "No new staff accounts were created.",
    };
  } catch (error) {
    console.error("importStaffBatch error:", error);

    return {
      success: false as const,
      batchId: null,
      successCount: 0,
      duplicateCount: 0,
      errorCount: 0,
      credentials,
      error:
        error instanceof Error
          ? error.message
          : "Failed to import staff accounts.",
    };
  }
}

/* ============================================================================
   CREATE STAFF MANUALLY
============================================================================ */

export async function createStaffManual(data: {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}) {
  try {
    await requireSystemAdmin();

    const name = normalizeName(data.name ?? "");
    const email = normalizeEmail(data.email ?? "");

    if (!name) {
      return {
        success: false as const,
        error: "Name is required.",
      };
    }

    if (!isValidEmail(email)) {
      return {
        success: false as const,
        error: "Please provide a valid email address.",
      };
    }

    if (!Object.values(UserRole).includes(data.role)) {
      return {
        success: false as const,
        error: "Invalid staff role.",
      };
    }

    const existing = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return {
        success: false as const,
        error: `User with email '${email}' already exists.`,
      };
    }

    const temporaryPassword =
      data.password?.trim() || generateTemporaryPassword();

    if (temporaryPassword.length < 8) {
      return {
        success: false as const,
        error: "Password must contain at least 8 characters.",
      };
    }

    const passwordHash = await bcrypt.hash(
      temporaryPassword,
      12
    );

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: data.role,
        isActive: true,
      },
    });

    revalidatePath("/admin/staff");
    revalidatePath("/admin/logs");

    return {
      success: true as const,
      staff: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        temporaryPassword,
      },
      message: "Staff member created successfully.",
    };
  } catch (error) {
    console.error("createStaffManual error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create staff member.",
    };
  }
}

/* ============================================================================
   UPDATE STAFF
============================================================================ */

export async function updateStaff(data: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}) {
  try {
    const admin = await requireSystemAdmin();

    const name = normalizeName(data.name ?? "");
    const email = normalizeEmail(data.email ?? "");

    if (!data.id) {
      return {
        success: false as const,
        error: "Staff ID is required.",
      };
    }

    if (!name) {
      return {
        success: false as const,
        error: "Name is required.",
      };
    }

    if (!isValidEmail(email)) {
      return {
        success: false as const,
        error: "Invalid email address.",
      };
    }

    if (!Object.values(UserRole).includes(data.role)) {
      return {
        success: false as const,
        error: "Invalid staff role.",
      };
    }

    /* Prevent self-deactivation */

    if (data.id === admin.id && !data.isActive) {
      return {
        success: false as const,
        error:
          "You cannot deactivate your own administrator account.",
      };
    }

    /* Check target user */

    const existing = await prisma.user.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!existing) {
      return {
        success: false as const,
        error: "Staff member not found.",
      };
    }

    /* Prevent removing the final active administrator */

    if (
      existing.role === UserRole.SYSTEM_ADMIN &&
      existing.isActive &&
      !data.isActive
    ) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: UserRole.SYSTEM_ADMIN,
          isActive: true,
        },
      });

      if (activeAdminCount <= 1) {
        return {
          success: false as const,
          error:
            "The last active system administrator cannot be deactivated.",
        };
      }
    }

    /* Check email */

    const emailOwner = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (emailOwner && emailOwner.id !== data.id) {
      return {
        success: false as const,
        error:
          `Email '${email}' is already registered to another account.`,
      };
    }

    const updated = await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        name,
        email,
        role: data.role,
        isActive: data.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    revalidatePath("/admin/staff");
    revalidatePath("/admin/logs");

    return {
      success: true as const,
      staff: toStaffItem(updated),
      message: "Staff details updated successfully.",
    };
  } catch (error) {
    console.error("updateStaff error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update staff.",
    };
  }
}

/* ============================================================================
   DEACTIVATE STAFF
============================================================================ */

export async function deactivateStaff(userId: string) {
  try {
    const admin = await requireSystemAdmin();

    if (!userId) {
      return {
        success: false as const,
        error: "User ID is required.",
      };
    }

    if (userId === admin.id) {
      return {
        success: false as const,
        error:
          "You cannot deactivate your own administrator account.",
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return {
        success: false as const,
        error: "Staff member not found.",
      };
    }

    if (!user.isActive) {
      return {
        success: false as const,
        error: "This staff account is already inactive.",
      };
    }

    /* Protect the final active administrator */

    if (user.role === UserRole.SYSTEM_ADMIN) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: UserRole.SYSTEM_ADMIN,
          isActive: true,
        },
      });

      if (activeAdminCount <= 1) {
        return {
          success: false as const,
          error:
            "The last active system administrator cannot be deactivated.",
        };
      }
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/admin/staff");
    revalidatePath("/admin/logs");

    return {
      success: true as const,
      message: `${user.name}'s account has been deactivated.`,
    };
  } catch (error) {
    console.error("deactivateStaff error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to deactivate staff account.",
    };
  }
}

/* ============================================================================
   ACTIVATE STAFF
============================================================================ */

export async function activateStaff(userId: string) {
  try {
    await requireSystemAdmin();

    if (!userId) {
      return {
        success: false as const,
        error: "User ID is required.",
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (!user) {
      return {
        success: false as const,
        error: "Staff member not found.",
      };
    }

    if (user.isActive) {
      return {
        success: false as const,
        error: "This staff account is already active.",
      };
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isActive: true,
      },
    });

    revalidatePath("/admin/staff");
    revalidatePath("/admin/logs");

    return {
      success: true as const,
      message: `${user.name}'s account has been activated.`,
    };
  } catch (error) {
    console.error("activateStaff error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to activate staff account.",
    };
  }
}

/* ============================================================================
   RESET STAFF PASSWORD
============================================================================ */

export async function resetStaffPassword(userId: string) {
  try {
    const admin = await requireSystemAdmin();

    if (!userId) {
      return {
        success: false as const,
        error: "User ID is required.",
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    if (!user) {
      return {
        success: false as const,
        error: "Staff member not found.",
      };
    }

    if (!user.isActive) {
      return {
        success: false as const,
        error:
          "Cannot reset the password of an inactive staff account.",
      };
    }

    const newPassword = generateTemporaryPassword();

    const passwordHash = await bcrypt.hash(
      newPassword,
      12
    );

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash,
      },
    });

    revalidatePath("/admin/staff");
    revalidatePath("/admin/logs");

    return {
      success: true as const,
      temporaryPassword: newPassword,
      userName: user.name,
      userEmail: user.email,
      resetBy: admin.id,
      message: "Password reset successfully.",
    };
  } catch (error) {
    console.error("resetStaffPassword error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to reset password.",
    };
  }
}

/* ============================================================================
   DEPRECATED DELETE ACTION
============================================================================ */

/*
 * Staff accounts should not be physically deleted because User is referenced
 * by many historical/audit models.
 *
 * Keep this export temporarily so any older component importing deleteStaff
 * does not break. It performs a safe deactivation instead.
 */

export async function deleteStaff(userId: string) {
  return deactivateStaff(userId);
}
