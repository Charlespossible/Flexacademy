-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "planId" TEXT,
ADD COLUMN     "pricingConfigVersion" TEXT,
ADD COLUMN     "termMonths" INTEGER;
