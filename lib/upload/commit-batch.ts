import "server-only";
import {
  Prisma,
  UploadBatchStatus,
  UploadFileStatus,
  UploadRowStatus,
} from "@/generated/prisma";
import { commitRow } from "./commit";
import { normalizeSession } from "./normalize";

/** Save every clean row. Returns how many went in. */
export async function commitValidRows(
  tx: Prisma.TransactionClient,
  uploadFileId: string,
): Promise<number> {
  const file = await tx.uploadFile.findUnique({
    where: { id: uploadFileId },
    include: { rows: { where: { status: UploadRowStatus.VALID } } },
  });

  if (!file || !file.matchedCourseId) return 0;
  if (file.status === UploadFileStatus.REJECTED) return 0;

  const academicSession = normalizeSession(file.academicSessionRaw);
  if (!academicSession) return 0;

  let imported = 0;

  for (const row of file.rows) {
    if (!row.matchedStudentId || row.score === null) continue;

    await commitRow(tx, {
      uploadRowId: row.id,
      studentId: row.matchedStudentId,
      courseId: file.matchedCourseId,
      academicSession,
      score: row.score,
    });

    imported += 1;
  }

  // Only mark it done when nothing is still waiting.
  const outstanding = await tx.uploadRow.count({
    where: {
      uploadFileId,
      status: { notIn: [UploadRowStatus.IMPORTED, UploadRowStatus.REJECTED] },
    },
  });

  if (outstanding === 0) {
    await tx.uploadFile.update({
      where: { id: uploadFileId },
      data: { status: UploadFileStatus.COMPLETED },
    });
  }

  return imported;
}

/** Batch status just follows its files. */
export async function syncBatchStatus(
  tx: Prisma.TransactionClient,
  uploadBatchId: string,
): Promise<void> {
  const outstanding = await tx.uploadFile.count({
    where: {
      uploadBatchId,
      status: { notIn: [UploadFileStatus.COMPLETED, UploadFileStatus.REJECTED] },
    },
  });

  await tx.uploadBatch.update({
    where: { id: uploadBatchId },
    data: {
      status:
        outstanding === 0 ? UploadBatchStatus.COMPLETED : UploadBatchStatus.PROCESSING,
    },
  });
}
