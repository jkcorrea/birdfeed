/*
  Warnings:

  - You are about to drop the column `twitterOAuthToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `twitterOAuthTokenSecret` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TokenType" ADD VALUE 'OAUTH_REQUEST_TOKEN';
ALTER TYPE "TokenType" ADD VALUE 'OAUTH_ACCESS_TOKEN';

-- AlterTable
ALTER TABLE "tokens" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "twitterOAuthToken",
DROP COLUMN "twitterOAuthTokenSecret",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "twitterHandle" TEXT,
ADD COLUMN     "twitterId" TEXT,
ALTER COLUMN "stripeSubscriptionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
