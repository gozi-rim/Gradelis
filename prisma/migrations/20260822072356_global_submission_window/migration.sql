/*
  Warnings:

  - A unique constraint covering the columns `[scope]` on the table `ResultSubmissionWindow` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ResultSubmissionWindow" ADD COLUMN     "scope" TEXT NOT NULL DEFAULT 'GLOBAL';

-- CreateIndex
CREATE UNIQUE INDEX "ResultSubmissionWindow_scope_key" ON "ResultSubmissionWindow"("scope");
