/*
  Warnings:

  - You are about to drop the `notes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_userId_fkey";

-- DropTable
DROP TABLE "notes";

-- Enable RLS for new tables
alter table if exists "tweets" ENABLE row level security;
alter table if exists "transcripts" ENABLE row level security;
