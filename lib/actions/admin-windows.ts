"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { UserRole } from "@/generated/prisma";

const WINDOWS_PATH = "/admin/upload-windows";

const GLOBAL_SCOPE = "GLOBAL";

export type SubmissionWindowStatus =
  | "OPEN"
  | "CLOSED"
  | "SCHEDULED";

export type SubmissionWindowItem = {
  id: string;
  opensAt: string;
  closesAt: string;
  status: SubmissionWindowStatus;
  daysRemaining: number;
  openedByName: string;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionWindowResult = {
  success: boolean;
  message: string;
};

export type SubmissionWindowListResult = {
  success: boolean;
  windows: SubmissionWindowItem[];
  total: number;
  openCount: number;
  closedCount: number;
  scheduledCount: number;
  error?: string;
};

/**
 * Calculate the current state of a submission window.
 */
function calculateStatus(
  opensAt: Date,
  closesAt: Date
): {
  status: SubmissionWindowStatus;
  daysRemaining: number;
} {
  const now = Date.now();
  const openTime = opensAt.getTime();
  const closeTime = closesAt.getTime();

  if (now < openTime) {
    return {
      status: "SCHEDULED",
      daysRemaining: Math.ceil(
        (openTime - now) / (1000 * 60 * 60 * 24)
      ),
    };
  }

  if (now >= closeTime) {
    return {
      status: "CLOSED",
      daysRemaining: 0,
    };
  }

  return {
    status: "OPEN",
    daysRemaining: Math.ceil(
      (closeTime - now) / (1000 * 60 * 60 * 24)
    ),
  };
}

/**
 * Validate and convert an incoming date string.
 */
function parseDate(value: string): Date | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Require an authenticated and active administrator/HOD.
 *
 * These are the users allowed to create, modify, extend,
 * close, or delete the global submission period.
 */
async function requireWindowManager() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
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
    throw new Error("Authenticated user was not found.");
  }

  if (!user.isActive) {
    throw new Error("Your account is inactive.");
  }

  const allowedRoles: UserRole[] = [
    UserRole.SYSTEM_ADMIN,
    UserRole.HOD,
  ];

  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      "Only the System Admin or HOD can manage the result submission period."
    );
  }

  return user;
}

/**
 * ============================================================================
 * GET GLOBAL SUBMISSION WINDOW
 * ============================================================================
 *
 * Returns the single global submission window.
 *
 * There is intentionally no course, academic session, semester,
 * adviser, or lecturer filter here.
 */
export async function getSubmissionWindows(): Promise<SubmissionWindowListResult> {
  try {
    const window =
      await prisma.resultSubmissionWindow.findUnique({
        where: {
          scope: GLOBAL_SCOPE,
        },
        include: {
          openedBy: {
            select: {
              name: true,
            },
          },
        },
      });

    if (!window) {
      return {
        success: true,
        windows: [],
        total: 0,
        openCount: 0,
        closedCount: 0,
        scheduledCount: 0,
      };
    }

    const { status, daysRemaining } = calculateStatus(
      window.opensAt,
      window.closesAt
    );

    const item: SubmissionWindowItem = {
      id: window.id,
      opensAt: window.opensAt.toISOString(),
      closesAt: window.closesAt.toISOString(),
      status,
      daysRemaining,
      openedByName: window.openedBy.name,
      createdAt: window.createdAt.toISOString(),
      updatedAt: window.updatedAt.toISOString(),
    };

    return {
      success: true,
      windows: [item],
      total: 1,
      openCount: status === "OPEN" ? 1 : 0,
      closedCount: status === "CLOSED" ? 1 : 0,
      scheduledCount: status === "SCHEDULED" ? 1 : 0,
    };
  } catch (error) {
    console.error("getSubmissionWindows error:", error);

    return {
      success: false,
      windows: [],
      total: 0,
      openCount: 0,
      closedCount: 0,
      scheduledCount: 0,
      error: "Unable to load the result submission period.",
    };
  }
}

/**
 * ============================================================================
 * GET CURRENT GLOBAL SUBMISSION WINDOW
 * ============================================================================
 *
 * Convenience function when the UI only needs the current window.
 */
export async function getCurrentSubmissionWindow(): Promise<{
  success: boolean;
  window: SubmissionWindowItem | null;
  error?: string;
}> {
  try {
    const result = await getSubmissionWindows();

    if (!result.success) {
      return {
        success: false,
        window: null,
        error: result.error,
      };
    }

    return {
      success: true,
      window: result.windows[0] ?? null,
    };
  } catch (error) {
    console.error("getCurrentSubmissionWindow error:", error);

    return {
      success: false,
      window: null,
      error: "Unable to load submission period.",
    };
  }
}

/**
 * ============================================================================
 * CREATE OR UPDATE GLOBAL SUBMISSION PERIOD
 * ============================================================================
 *
 * There is only one submission period in the system.
 *
 * If one already exists, it is updated.
 * If none exists, it is created.
 */
export async function openOrScheduleWindow(data: {
  opensAt: string;
  closesAt: string;
}): Promise<SubmissionWindowResult> {
  try {
    const user = await requireWindowManager();

    const opensAt = parseDate(data.opensAt);
    const closesAt = parseDate(data.closesAt);

    if (!opensAt) {
      return {
        success: false,
        message: "Invalid opening date and time.",
      };
    }

    if (!closesAt) {
      return {
        success: false,
        message: "Invalid closing date and time.",
      };
    }

    if (closesAt <= opensAt) {
      return {
        success: false,
        message: "Closing date must be after the opening date.",
      };
    }

    await prisma.resultSubmissionWindow.upsert({
      where: {
        scope: GLOBAL_SCOPE,
      },
      update: {
        opensAt,
        closesAt,
        openedById: user.id,
      },
      create: {
        scope: GLOBAL_SCOPE,
        opensAt,
        closesAt,
        openedById: user.id,
      },
    });

    revalidatePath(WINDOWS_PATH);

    const { status } = calculateStatus(
      opensAt,
      closesAt
    );

    const statusMessage =
      status === "OPEN"
        ? "Result submission is now open."
        : status === "SCHEDULED"
          ? "Result submission period has been scheduled."
          : "Result submission period has been saved as closed.";

    return {
      success: true,
      message: statusMessage,
    };
  } catch (error) {
    console.error("openOrScheduleWindow error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to save the result submission period.",
    };
  }
}

/**
 * ============================================================================
 * EXTEND GLOBAL SUBMISSION DEADLINE
 * ============================================================================
 *
 * Extends the closing time by the specified number of days.
 *
 * If the period is already closed, the extension starts from NOW.
 * Otherwise, it extends from the existing closing time.
 */
export async function extendWindowDeadline(
  id: string,
  extraDays = 7
): Promise<SubmissionWindowResult> {
  try {
    await requireWindowManager();

    if (!id) {
      return {
        success: false,
        message: "Submission window ID is required.",
      };
    }

    if (!Number.isInteger(extraDays) || extraDays <= 0) {
      return {
        success: false,
        message: "Extension must be a positive number of days.",
      };
    }

    const window =
      await prisma.resultSubmissionWindow.findUnique({
        where: {
          id,
        },
      });

    if (!window) {
      return {
        success: false,
        message: "Submission period not found.",
      };
    }

    if (window.scope !== GLOBAL_SCOPE) {
      return {
        success: false,
        message: "Invalid submission period.",
      };
    }

    const baseTime = Math.max(
      Date.now(),
      window.closesAt.getTime()
    );

    const newCloseDate = new Date(
      baseTime +
        extraDays * 24 * 60 * 60 * 1000
    );

    await prisma.resultSubmissionWindow.update({
      where: {
        id,
      },
      data: {
        closesAt: newCloseDate,
      },
    });

    revalidatePath(WINDOWS_PATH);

    return {
      success: true,
      message: `Submission deadline extended by ${extraDays} days.`,
    };
  } catch (error) {
    console.error("extendWindowDeadline error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to extend the submission deadline.",
    };
  }
}

/**
 * ============================================================================
 * CLOSE GLOBAL SUBMISSION PERIOD
 * ============================================================================
 *
 * Immediately prevents new result submissions.
 */
export async function closeWindowImmediately(
  id: string
): Promise<SubmissionWindowResult> {
  try {
    await requireWindowManager();

    if (!id) {
      return {
        success: false,
        message: "Submission window ID is required.",
      };
    }

    const window =
      await prisma.resultSubmissionWindow.findUnique({
        where: {
          id,
        },
      });

    if (!window) {
      return {
        success: false,
        message: "Submission period not found.",
      };
    }

    if (window.scope !== GLOBAL_SCOPE) {
      return {
        success: false,
        message: "Invalid submission period.",
      };
    }

    await prisma.resultSubmissionWindow.update({
      where: {
        id,
      },
      data: {
        closesAt: new Date(),
      },
    });

    revalidatePath(WINDOWS_PATH);

    return {
      success: true,
      message: "Result submission period closed successfully.",
    };
  } catch (error) {
    console.error("closeWindowImmediately error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to close the submission period.",
    };
  }
}

/**
 * ============================================================================
 * DELETE GLOBAL SUBMISSION PERIOD
 * ============================================================================
 *
 * Removes the configured submission period entirely.
 *
 * This does NOT delete any uploaded results.
 */
export async function deleteWindow(
  id: string
): Promise<SubmissionWindowResult> {
  try {
    await requireWindowManager();

    if (!id) {
      return {
        success: false,
        message: "Submission window ID is required.",
      };
    }

    const window =
      await prisma.resultSubmissionWindow.findUnique({
        where: {
          id,
        },
      });

    if (!window) {
      return {
        success: false,
        message: "Submission period not found.",
      };
    }

    if (window.scope !== GLOBAL_SCOPE) {
      return {
        success: false,
        message: "Invalid submission period.",
      };
    }

    await prisma.resultSubmissionWindow.delete({
      where: {
        id,
      },
    });

    revalidatePath(WINDOWS_PATH);

    return {
      success: true,
      message: "Result submission period removed.",
    };
  } catch (error) {
    console.error("deleteWindow error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to remove the submission period.",
    };
  }
}

/**
 * ============================================================================
 * CHECK WHETHER RESULT SUBMISSION IS CURRENTLY OPEN
 * ============================================================================
 *
 * This is the important function for the result-upload pipeline.
 *
 * It does NOT care:
 * - which lecturer is uploading
 * - which adviser is uploading
 * - which course is being uploaded
 * - which academic session is being uploaded
 * - which semester the result belongs to
 *
 * It only determines whether the global submission period is open.
 */
export async function checkSubmissionWindow(): Promise<{
  success: boolean;
  isOpen: boolean;
  status: SubmissionWindowStatus | null;
  opensAt: string | null;
  closesAt: string | null;
  message: string;
}> {
  try {
    const window =
      await prisma.resultSubmissionWindow.findUnique({
        where: {
          scope: GLOBAL_SCOPE,
        },
      });

    if (!window) {
      return {
        success: true,
        isOpen: false,
        status: null,
        opensAt: null,
        closesAt: null,
        message:
          "Result submission is currently unavailable. No submission period has been configured.",
      };
    }

    const { status } = calculateStatus(
      window.opensAt,
      window.closesAt
    );

    if (status === "SCHEDULED") {
      return {
        success: true,
        isOpen: false,
        status,
        opensAt: window.opensAt.toISOString(),
        closesAt: window.closesAt.toISOString(),
        message:
          "The result submission period has not opened yet.",
      };
    }

    if (status === "CLOSED") {
      return {
        success: true,
        isOpen: false,
        status,
        opensAt: window.opensAt.toISOString(),
        closesAt: window.closesAt.toISOString(),
        message:
          "The result submission period has closed.",
      };
    }

    return {
      success: true,
      isOpen: true,
      status: "OPEN",
      opensAt: window.opensAt.toISOString(),
      closesAt: window.closesAt.toISOString(),
      message:
        "Result submission is currently open.",
    };
  } catch (error) {
    console.error("checkSubmissionWindow error:", error);

    return {
      success: false,
      isOpen: false,
      status: null,
      opensAt: null,
      closesAt: null,
      message:
        "Unable to verify the result submission period.",
    };
  }
}

/**
 * ============================================================================
 * REQUIRE OPEN SUBMISSION PERIOD
 * ============================================================================
 *
 * Convenience function for upload server actions.
 *
 * Instead of repeating:
 *
 * const check = await checkSubmissionWindow();
 * if (!check.success) ...
 * if (!check.isOpen) ...
 *
 * an upload action can simply call this function.
 */
export async function requireOpenSubmissionWindow(): Promise<void> {
  const result = await checkSubmissionWindow();

  if (!result.success) {
    throw new Error(result.message);
  }

  if (!result.isOpen) {
    throw new Error(result.message);
  }
}
