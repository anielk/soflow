-- CreateEnum
CREATE TYPE "CreatorStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "MediaType" ADD VALUE 'DOCUMENT';

-- AlterTable
ALTER TABLE "Creator" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" "CreatorStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "creatorId" TEXT;

-- CreateIndex
CREATE INDEX "Media_creatorId_idx" ON "Media"("creatorId");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
