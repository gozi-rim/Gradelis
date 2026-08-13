-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SYSTEM_ADMIN', 'HOD', 'LECTURER');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'SUSPENDED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('FIRST', 'SECOND');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('COMPULSORY', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "AdviserAssignmentStatus" AS ENUM ('OFFERED', 'ACTIVE', 'DECLINED', 'ENDED');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('PENDING', 'POSTED', 'CORRECTED');

-- CreateEnum
CREATE TYPE "CorrectionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UploadBatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "UploadFileStatus" AS ENUM ('VALID', 'UNMATCHED_COURSE', 'PROCESSING', 'FAILED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UploadRowStatus" AS ENUM ('VALID', 'UNMATCHED_STUDENT', 'DUPLICATE', 'INVALID_SCORE', 'IMPORTED');

-- CreateEnum
CREATE TYPE "GraduationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "creditUnits" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "semester" "Semester" NOT NULL,
    "courseType" "CourseType" NOT NULL DEFAULT 'COMPULSORY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "matricNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "entrySession" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdviserAssignment" (
    "id" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "entrySession" TEXT NOT NULL,
    "status" "AdviserAssignmentStatus" NOT NULL DEFAULT 'OFFERED',
    "offeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "expectedEndDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdviserAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentResult" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "academicSession" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "grade" TEXT,
    "gradePoint" DOUBLE PRECISION,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "ResultStatus" NOT NULL DEFAULT 'PENDING',
    "currentVersionOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectionRequest" (
    "id" TEXT NOT NULL,
    "studentResultId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "overrideTokenId" TEXT,
    "oldScore" DOUBLE PRECISION NOT NULL,
    "newScore" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "CorrectionStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "CorrectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OverrideToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "generatedById" TEXT NOT NULL,
    "issuedToId" TEXT,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OverrideToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultChangeLog" (
    "id" TEXT NOT NULL,
    "studentResultId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "oldScore" DOUBLE PRECISION,
    "newScore" DOUBLE PRECISION,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultSubmissionWindow" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "academicSession" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "openedById" TEXT NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultSubmissionWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadBatch" (
    "id" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "status" "UploadBatchStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadFile" (
    "id" TEXT NOT NULL,
    "uploadBatchId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "courseCodeRaw" TEXT NOT NULL,
    "academicSessionRaw" TEXT NOT NULL,
    "semesterRaw" TEXT NOT NULL,
    "matchedCourseId" TEXT,
    "status" "UploadFileStatus" NOT NULL DEFAULT 'VALID',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadRow" (
    "id" TEXT NOT NULL,
    "uploadFileId" TEXT NOT NULL,
    "matricNumberRaw" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "matchedStudentId" TEXT,
    "studentResultId" TEXT,
    "status" "UploadRowStatus" NOT NULL DEFAULT 'VALID',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraduationRun" (
    "id" TEXT NOT NULL,
    "academicSession" TEXT NOT NULL,
    "status" "GraduationStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "triggeredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GraduationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityRunItem" (
    "id" TEXT NOT NULL,
    "graduationRunId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "cgpa" DOUBLE PRECISION NOT NULL,
    "eligible" BOOLEAN NOT NULL,
    "remarks" JSONB,

    CONSTRAINT "EligibilityRunItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE INDEX "Course_level_semester_idx" ON "Course"("level", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "Student_matricNumber_key" ON "Student"("matricNumber");

-- CreateIndex
CREATE INDEX "Student_entrySession_idx" ON "Student"("entrySession");

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "Student"("status");

-- CreateIndex
CREATE INDEX "AdviserAssignment_lecturerId_status_idx" ON "AdviserAssignment"("lecturerId", "status");

-- CreateIndex
CREATE INDEX "AdviserAssignment_entrySession_idx" ON "AdviserAssignment"("entrySession");

-- CreateIndex
CREATE UNIQUE INDEX "StudentResult_currentVersionOfId_key" ON "StudentResult"("currentVersionOfId");

-- CreateIndex
CREATE INDEX "StudentResult_courseId_academicSession_idx" ON "StudentResult"("courseId", "academicSession");

-- CreateIndex
CREATE INDEX "StudentResult_status_idx" ON "StudentResult"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StudentResult_studentId_courseId_academicSession_attemptNum_key" ON "StudentResult"("studentId", "courseId", "academicSession", "attemptNumber");

-- CreateIndex
CREATE INDEX "CorrectionRequest_studentResultId_idx" ON "CorrectionRequest"("studentResultId");

-- CreateIndex
CREATE INDEX "CorrectionRequest_status_idx" ON "CorrectionRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OverrideToken_token_key" ON "OverrideToken"("token");

-- CreateIndex
CREATE INDEX "ResultChangeLog_studentResultId_idx" ON "ResultChangeLog"("studentResultId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultSubmissionWindow_courseId_academicSession_semester_key" ON "ResultSubmissionWindow"("courseId", "academicSession", "semester");

-- CreateIndex
CREATE INDEX "UploadFile_uploadBatchId_idx" ON "UploadFile"("uploadBatchId");

-- CreateIndex
CREATE INDEX "UploadFile_matchedCourseId_idx" ON "UploadFile"("matchedCourseId");

-- CreateIndex
CREATE INDEX "UploadFile_status_idx" ON "UploadFile"("status");

-- CreateIndex
CREATE INDEX "UploadRow_uploadFileId_idx" ON "UploadRow"("uploadFileId");

-- CreateIndex
CREATE INDEX "UploadRow_matchedStudentId_idx" ON "UploadRow"("matchedStudentId");

-- CreateIndex
CREATE INDEX "UploadRow_status_idx" ON "UploadRow"("status");

-- CreateIndex
CREATE INDEX "GraduationRun_academicSession_idx" ON "GraduationRun"("academicSession");

-- CreateIndex
CREATE INDEX "EligibilityRunItem_eligible_idx" ON "EligibilityRunItem"("eligible");

-- CreateIndex
CREATE UNIQUE INDEX "EligibilityRunItem_graduationRunId_studentId_key" ON "EligibilityRunItem"("graduationRunId", "studentId");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdviserAssignment" ADD CONSTRAINT "AdviserAssignment_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdviserAssignment" ADD CONSTRAINT "AdviserAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentResult" ADD CONSTRAINT "StudentResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentResult" ADD CONSTRAINT "StudentResult_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentResult" ADD CONSTRAINT "StudentResult_currentVersionOfId_fkey" FOREIGN KEY ("currentVersionOfId") REFERENCES "StudentResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionRequest" ADD CONSTRAINT "CorrectionRequest_studentResultId_fkey" FOREIGN KEY ("studentResultId") REFERENCES "StudentResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionRequest" ADD CONSTRAINT "CorrectionRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionRequest" ADD CONSTRAINT "CorrectionRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionRequest" ADD CONSTRAINT "CorrectionRequest_overrideTokenId_fkey" FOREIGN KEY ("overrideTokenId") REFERENCES "OverrideToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OverrideToken" ADD CONSTRAINT "OverrideToken_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OverrideToken" ADD CONSTRAINT "OverrideToken_issuedToId_fkey" FOREIGN KEY ("issuedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultChangeLog" ADD CONSTRAINT "ResultChangeLog_studentResultId_fkey" FOREIGN KEY ("studentResultId") REFERENCES "StudentResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultChangeLog" ADD CONSTRAINT "ResultChangeLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultSubmissionWindow" ADD CONSTRAINT "ResultSubmissionWindow_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultSubmissionWindow" ADD CONSTRAINT "ResultSubmissionWindow_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadBatch" ADD CONSTRAINT "UploadBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadFile" ADD CONSTRAINT "UploadFile_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadFile" ADD CONSTRAINT "UploadFile_matchedCourseId_fkey" FOREIGN KEY ("matchedCourseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadRow" ADD CONSTRAINT "UploadRow_uploadFileId_fkey" FOREIGN KEY ("uploadFileId") REFERENCES "UploadFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadRow" ADD CONSTRAINT "UploadRow_matchedStudentId_fkey" FOREIGN KEY ("matchedStudentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadRow" ADD CONSTRAINT "UploadRow_studentResultId_fkey" FOREIGN KEY ("studentResultId") REFERENCES "StudentResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraduationRun" ADD CONSTRAINT "GraduationRun_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityRunItem" ADD CONSTRAINT "EligibilityRunItem_graduationRunId_fkey" FOREIGN KEY ("graduationRunId") REFERENCES "GraduationRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityRunItem" ADD CONSTRAINT "EligibilityRunItem_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
