"use server";

import { z } from "zod";
import { UserRole } from "@/generated/prisma";
import { requireRole } from "@/lib/auth-guard";
import { ingestResultFile } from "@/lib/upload/ingest";

export type UploadSubmitState = {
  message?: string;
  batchId?: string;
  imported?: number;
  flagged?: number;
  total?: number;
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const fileSchema = z
  .instanceof(File, { message: "Please choose an Excel file." })
  .refine((file) => /\.(xlsx|xls)$/i.test(file.name), "Only .xlsx and .xls files are allowed.")
  .refine((file) => file.size <= MAX_FILE_SIZE_BYTES, "File must be 10 MB or smaller.");

export async function submitResultUpload(
  _prev: UploadSubmitState,
  formData: FormData,
): Promise<UploadSubmitState> {
  const guard = await requireRole(UserRole.LECTURER);
  if (!guard.ok) return { message: guard.message };

  const parsedFile = fileSchema.safeParse(formData.get("file"));
  if (!parsedFile.success) {
    return { message: z.flattenError(parsedFile.error).formErrors[0] ?? "Invalid file." };
  }

  const result = await ingestResultFile(guard.actor.id, parsedFile.data);
  if (!result.ok) return { message: result.message };

  return {
    message: "success",
    batchId: result.batchId,
    imported: result.imported,
    flagged: result.flagged,
    total: result.total,
  };
}
