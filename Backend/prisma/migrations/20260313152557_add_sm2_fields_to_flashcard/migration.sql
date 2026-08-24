-- AlterEnum
ALTER TYPE "StudyPlanStatus" ADD VALUE 'ABANDONED';

-- AlterTable
ALTER TABLE "flashcards" ADD COLUMN     "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "interval" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "repetitions" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "flashcards_nextReviewAt_idx" ON "flashcards"("nextReviewAt");
