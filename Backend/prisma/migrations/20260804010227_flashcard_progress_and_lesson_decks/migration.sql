/*
  Warnings:

  - You are about to drop the column `easeFactor` on the `flashcards` table. All the data in the column will be lost.
  - You are about to drop the column `interval` on the `flashcards` table. All the data in the column will be lost.
  - You are about to drop the column `lastReviewedAt` on the `flashcards` table. All the data in the column will be lost.
  - You are about to drop the column `nextReviewAt` on the `flashcards` table. All the data in the column will be lost.
  - You are about to drop the column `repetitions` on the `flashcards` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "flashcard_decks" DROP CONSTRAINT "flashcard_decks_userId_fkey";

-- DropIndex
DROP INDEX "flashcards_nextReviewAt_idx";

-- AlterTable
ALTER TABLE "flashcard_decks" ADD COLUMN     "lessonId" TEXT,
ADD COLUMN     "tutorProfileId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "flashcards" DROP COLUMN "easeFactor",
DROP COLUMN "interval",
DROP COLUMN "lastReviewedAt",
DROP COLUMN "nextReviewAt",
DROP COLUMN "repetitions",
ADD COLUMN     "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "flashcard_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcard_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flashcard_progress_userId_nextReviewAt_idx" ON "flashcard_progress"("userId", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "flashcard_progress_userId_flashcardId_key" ON "flashcard_progress"("userId", "flashcardId");

-- CreateIndex
CREATE INDEX "flashcard_decks_lessonId_idx" ON "flashcard_decks"("lessonId");

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_progress" ADD CONSTRAINT "flashcard_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_progress" ADD CONSTRAINT "flashcard_progress_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
