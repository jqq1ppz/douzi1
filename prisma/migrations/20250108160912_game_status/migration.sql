-- DropForeignKey
ALTER TABLE "GameDay" DROP CONSTRAINT "GameDay_creatorId_fkey";

-- AlterTable
ALTER TABLE "GameDay" ALTER COLUMN "creatorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "GameDay" ADD CONSTRAINT "GameDay_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
