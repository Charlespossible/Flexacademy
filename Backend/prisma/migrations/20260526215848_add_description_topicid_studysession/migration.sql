/*
  Warnings:

  - You are about to drop the column `aiGenerated` on the `study_plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "study_plans" DROP COLUMN "aiGenerated",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isAiGenerated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN     "topicId" TEXT,
ADD COLUMN     "type" TEXT;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
