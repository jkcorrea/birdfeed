ALTER TABLE "transcript" RENAME TO "transcripts";

-- AlterTable
ALTER TABLE "transcripts" RENAME CONSTRAINT "transcript_pkey" TO "transcripts_pkey";

-- RenameForeignKey
ALTER TABLE "transcripts" RENAME CONSTRAINT "transcript_userId_fkey" TO "transcripts_userId_fkey";
