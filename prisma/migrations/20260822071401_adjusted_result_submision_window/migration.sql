/*
  Warnings:

  - You are about to drop the column `academicSession` on the `ResultSubmissionWindow` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `ResultSubmissionWindow` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `ResultSubmissionWindow` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `ResultSubmissionWindow` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ResultSubmissionWindow" DROP CONSTRAINT "ResultSubmissionWindow_courseId_fkey";

-- DropIndex
DROP INDEX "ResultSubmissionWindow_courseId_academicSession_semester_key";

-- AlterTable
ALTER TABLE "ResultSubmissionWindow" DROP COLUMN "academicSession",
DROP COLUMN "courseId",
DROP COLUMN "semester",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
