"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { UserRole } from "@/generated/prisma";
import { requireRole } from "@/lib/auth-guard";
import { type ActionResult, fail } from "@/lib/actions/result";
import {
  applyFileRejection,
  applyFileResolution,
  applyRowRejection,
  applyRowResolution,
} from "@/lib/upload/resolve";

const resolveFileSchema = z.object({
  fileId: z.string().min(1),
  courseCode: z.string().min(1, "Enter a course code."),
  note: z.string().max(500).optional(),
});

export async function resolveUploadFile(
  input: z.infer<typeof resolveFileSchema>,
): Promise<ActionResult<{ imported: number }>> {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) return fail(guard.message);

  const parsed = resolveFileSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.", z.flattenError(parsed.error).fieldErrors);

  const result = await applyFileResolution(guard.actor.id, parsed.data);
  if (result.ok) refresh();
  return result;
}

const rejectFileSchema = z.object({
  fileId: z.string().min(1),
  note: z.string().min(1, "Give a reason for rejecting this file.").max(500),
});

export async function rejectUploadFile(
  input: z.infer<typeof rejectFileSchema>,
): Promise<ActionResult<{ rowsRejected: number }>> {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) return fail(guard.message);

  const parsed = rejectFileSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.", z.flattenError(parsed.error).fieldErrors);

  const result = await applyFileRejection(guard.actor.id, parsed.data);
  if (result.ok) refresh();
  return result;
}

const resolveRowSchema = z.object({
  rowId: z.string().min(1),
  studentId: z.string().min(1).optional(),
  score: z.number().min(0).max(100).optional(),
  note: z.string().max(500).optional(),
});

export async function resolveUploadRow(
  input: z.infer<typeof resolveRowSchema>,
): Promise<ActionResult<{ studentResultId: string }>> {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) return fail(guard.message);

  const parsed = resolveRowSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.", z.flattenError(parsed.error).fieldErrors);

  const result = await applyRowResolution(guard.actor.id, parsed.data);
  if (result.ok) refresh();
  return result;
}

const rejectRowSchema = z.object({
  rowId: z.string().min(1),
  note: z.string().min(1, "Give a reason for rejecting this row.").max(500),
});

export async function rejectUploadRow(
  input: z.infer<typeof rejectRowSchema>,
): Promise<ActionResult<void>> {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) return fail(guard.message);

  const parsed = rejectRowSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.", z.flattenError(parsed.error).fieldErrors);

  const result = await applyRowRejection(guard.actor.id, parsed.data);
  if (result.ok) refresh();
  return result;
}
