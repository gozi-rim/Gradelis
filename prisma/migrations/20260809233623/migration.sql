/*
  Warnings:

  - A unique constraint covering the columns `[seedRowId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StudentCreationMethod" AS ENUM ('MANUAL', 'EXCEL_IMPORT');

-- CreateEnum
CREATE TYPE "StudentSeedBatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "StudentSeedRowStatus" AS ENUM ('VALID', 'DUPLICATE_MATRIC', 'INVALID_DATA', 'IMPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "UserSeedBatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "UserSeedRowStatus" AS ENUM ('VALID', 'DUPLICATE_EMAIL', 'INVALID_DATA', 'IMPORTED', 'FAILED');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "creationMethod" "StudentCreationMethod" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "seedRowId" TEXT;

-- CreateTable
CREATE TABLE "HodAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HodAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSeedBatch" (
    "id" TEXT NOT NULL,
    "entrySession" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "status" "StudentSeedBatchStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "StudentSeedBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSeedRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "matricNumberRaw" TEXT NOT NULL,
    "fullNameRaw" TEXT NOT NULL,
    "levelRaw" INTEGER,
    "status" "StudentSeedRowStatus" NOT NULL DEFAULT 'VALID',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentSeedRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSeedBatch" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'LECTURER',
    "uploadedById" TEXT NOT NULL,
    "status" "UserSeedBatchStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UserSeedBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSeedRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "nameRaw" TEXT NOT NULL,
    "emailRaw" TEXT NOT NULL,
    "status" "UserSeedRowStatus" NOT NULL DEFAULT 'VALID',
    "errorMessage" TEXT,
    "generatedPassword" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSeedRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HodAssignment_userId_idx" ON "HodAssignment"("userId");

-- CreateIndex
CREATE INDEX "HodAssignment_endDate_idx" ON "HodAssignment"("endDate");

-- CreateIndex
CREATE INDEX "StudentSeedBatch_entrySession_idx" ON "StudentSeedBatch"("entrySession");

-- CreateIndex
CREATE INDEX "StudentSeedRow_batchId_idx" ON "StudentSeedRow"("batchId");

-- CreateIndex
CREATE INDEX "StudentSeedRow_status_idx" ON "StudentSeedRow"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserSeedRow_userId_key" ON "UserSeedRow"("userId");

-- CreateIndex
CREATE INDEX "UserSeedRow_batchId_idx" ON "UserSeedRow"("batchId");

-- CreateIndex
CREATE INDEX "UserSeedRow_status_idx" ON "UserSeedRow"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Student_seedRowId_key" ON "Student"("seedRowId");

-- AddForeignKey
ALTER TABLE "HodAssignment" ADD CONSTRAINT "HodAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HodAssignment" ADD CONSTRAINT "HodAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_seedRowId_fkey" FOREIGN KEY ("seedRowId") REFERENCES "StudentSeedRow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSeedBatch" ADD CONSTRAINT "StudentSeedBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSeedRow" ADD CONSTRAINT "StudentSeedRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StudentSeedBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSeedBatch" ADD CONSTRAINT "UserSeedBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSeedRow" ADD CONSTRAINT "UserSeedRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UserSeedBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSeedRow" ADD CONSTRAINT "UserSeedRow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
