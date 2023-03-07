/*
  Warnings:

  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tierId,interval,active]` on the table `prices` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "prices_id_tierId_interval_active_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "name";

-- CreateTable
CREATE TABLE "transcript" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "neverGenerated" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,

    CONSTRAINT "transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tweets" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "drafts" TEXT[],
    "document" TEXT NOT NULL,
    "sendAt" TIMESTAMP(3),
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "transcriptId" TEXT NOT NULL,

    CONSTRAINT "tweets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prices_tierId_interval_active_key" ON "prices"("tierId", "interval", "active");

-- AddForeignKey
ALTER TABLE "transcript" ADD CONSTRAINT "transcript_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "transcript"("id") ON DELETE CASCADE ON UPDATE CASCADE;
