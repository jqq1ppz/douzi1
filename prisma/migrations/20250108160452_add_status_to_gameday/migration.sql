/*
  Warnings:

  - The `status` column on the `GameDay` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "GameDayStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "GameDay" DROP COLUMN "status",
ADD COLUMN     "status" "GameDayStatus" NOT NULL DEFAULT 'NOT_STARTED';
