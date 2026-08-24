-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('ONE_OFF', 'ASSIGNMENT_SESSION', 'REMEDIAL');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "GapSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "GapStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REGRESSED');

-- CreateEnum
CREATE TYPE "CertificationStatus" AS ENUM ('PENDING_REVIEW', 'CERTIFIED', 'DEFERRED', 'REVOKED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'GAP_DETECTED';
ALTER TYPE "NotificationType" ADD VALUE 'TUTOR_INSIGHT_READY';
ALTER TYPE "NotificationType" ADD VALUE 'STUDENT_IMPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'EXAM_READINESS_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE 'INTERVENTION_REQUIRED';
ALTER TYPE "NotificationType" ADD VALUE 'CERTIFICATION_READY';

-- AlterTable
ALTER TABLE "ai_tutor_sessions" ADD COLUMN     "gapsDetected" JSONB,
ADD COLUMN     "insightTriggered" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "assignmentId" TEXT,
ADD COLUMN     "sessionType" "SessionType" NOT NULL DEFAULT 'ONE_OFF';

-- AlterTable
ALTER TABLE "study_plans" ADD COLUMN     "assignmentId" TEXT,
ADD COLUMN     "isSharedWithTutor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tutor_profiles" ADD COLUMN     "maxStudents" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "student_tutor_assignments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_tutor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_gaps" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "topicId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "severity" "GapSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "GapStatus" NOT NULL DEFAULT 'OPEN',
    "masteryAtDetection" DECIMAL(5,2) NOT NULL,
    "evidence" JSONB NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedMastery" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_gaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_insights" (
    "id" TEXT NOT NULL,
    "gapId" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "aiSummary" TEXT NOT NULL,
    "recommendedApproach" TEXT,
    "focusAreas" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isActedOn" BOOLEAN NOT NULL DEFAULT false,
    "actedOnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_interventions" (
    "id" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "bookingId" TEXT,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiReEvaluated" BOOLEAN NOT NULL DEFAULT false,
    "postMastery" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutor_interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_readiness_certifications" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "examCategory" "ExamCategory" NOT NULL,
    "aiReadinessScore" DECIMAL(5,2) NOT NULL,
    "subjectBreakdown" JSONB NOT NULL,
    "openGapsCount" INTEGER NOT NULL DEFAULT 0,
    "status" "CertificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "tutorReviewedBy" TEXT,
    "tutorCoSignedAt" TIMESTAMP(3),
    "tutorNotes" TEXT,
    "certifiedAt" TIMESTAMP(3),
    "deferredReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_readiness_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_tutor_assignments_studentId_idx" ON "student_tutor_assignments"("studentId");

-- CreateIndex
CREATE INDEX "student_tutor_assignments_tutorProfileId_idx" ON "student_tutor_assignments"("tutorProfileId");

-- CreateIndex
CREATE INDEX "student_tutor_assignments_status_idx" ON "student_tutor_assignments"("status");

-- CreateIndex
CREATE INDEX "learning_gaps_studentId_status_idx" ON "learning_gaps"("studentId", "status");

-- CreateIndex
CREATE INDEX "learning_gaps_assignmentId_idx" ON "learning_gaps"("assignmentId");

-- CreateIndex
CREATE INDEX "tutor_insights_tutorProfileId_isRead_idx" ON "tutor_insights"("tutorProfileId", "isRead");

-- CreateIndex
CREATE INDEX "tutor_insights_studentId_idx" ON "tutor_insights"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_interventions_bookingId_key" ON "tutor_interventions"("bookingId");

-- CreateIndex
CREATE INDEX "tutor_interventions_insightId_idx" ON "tutor_interventions"("insightId");

-- CreateIndex
CREATE INDEX "tutor_interventions_studentId_idx" ON "tutor_interventions"("studentId");

-- CreateIndex
CREATE INDEX "exam_readiness_certifications_studentId_status_idx" ON "exam_readiness_certifications"("studentId", "status");

-- CreateIndex
CREATE INDEX "exam_readiness_certifications_examCategory_idx" ON "exam_readiness_certifications"("examCategory");

-- CreateIndex
CREATE INDEX "bookings_assignmentId_idx" ON "bookings"("assignmentId");

-- CreateIndex
CREATE INDEX "study_plans_assignmentId_idx" ON "study_plans"("assignmentId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "student_tutor_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "student_tutor_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_tutor_assignments" ADD CONSTRAINT "student_tutor_assignments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_tutor_assignments" ADD CONSTRAINT "student_tutor_assignments_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_tutor_assignments" ADD CONSTRAINT "student_tutor_assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_gaps" ADD CONSTRAINT "learning_gaps_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_gaps" ADD CONSTRAINT "learning_gaps_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "student_tutor_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_gaps" ADD CONSTRAINT "learning_gaps_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_insights" ADD CONSTRAINT "tutor_insights_gapId_fkey" FOREIGN KEY ("gapId") REFERENCES "learning_gaps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_insights" ADD CONSTRAINT "tutor_insights_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_insights" ADD CONSTRAINT "tutor_insights_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_interventions" ADD CONSTRAINT "tutor_interventions_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "tutor_insights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_interventions" ADD CONSTRAINT "tutor_interventions_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_interventions" ADD CONSTRAINT "tutor_interventions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_interventions" ADD CONSTRAINT "tutor_interventions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_readiness_certifications" ADD CONSTRAINT "exam_readiness_certifications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_readiness_certifications" ADD CONSTRAINT "exam_readiness_certifications_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "student_tutor_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
