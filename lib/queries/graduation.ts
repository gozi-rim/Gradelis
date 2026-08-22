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

  // Spread the run first, then override items, so every list here has
  // remarks already parsed rather than raw Json.
  return {
    ...run,
    items,
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

/** Sessions we could actually run graduation for. */
export async function listEntrySessions(): Promise<string[]> {
  const rows = await prisma.student.groupBy({
    by: ["entrySession"],
    orderBy: { entrySession: "desc" },
  });
  return rows.map((r) => r.entrySession);
}

export type GraduationRunDetail = NonNullable<Awaited<ReturnType<typeof getGraduationRun>>>;
