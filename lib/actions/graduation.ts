"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { UserRole } from "@/generated/prisma";
import { requireRole } from "@/lib/auth-guard";
import { type ActionResult, fail } from "@/lib/actions/result";
import { performGraduationRun, type RunSummary } from "@/lib/graduation/run";

const startRunSchema = z.object({
  // This is the year they entered, not the year they finish.
  entrySession: z.string().regex(/^\d{4}\/\d{4}$/, "Use the format 2021/2022."),
});

export async function startGraduationRun(
  input: z.infer<typeof startRunSchema>,
): Promise<ActionResult<RunSummary>> {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) return fail(guard.message);

  const parsed = startRunSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.", z.flattenError(parsed.error).fieldErrors);

  const result = await performGraduationRun(guard.actor.id, parsed.data.entrySession);
  if (result.ok) refresh();
  return result;
}
