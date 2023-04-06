/*
  Warnings:

  - You are about to drop the column `stripeCustomerId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `twitterOAuthToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `twitterOAuthTokenSecret` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customerId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "TokenType" ADD VALUE 'TWITTER_OAUTH_TOKEN';

-- DropIndex
DROP INDEX "users_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripeSubscriptionId",
DROP COLUMN "twitterOAuthToken",
DROP COLUMN "twitterOAuthTokenSecret",
ADD COLUMN     "customerId" TEXT NOT NULL,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "subscriptionId" TEXT;

-- CreateTable
CREATE TABLE "twitter_credentials" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "twitterId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "twitter_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "twitter_credentials_twitterId_userId_key" ON "twitter_credentials"("twitterId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_customerId_key" ON "users"("customerId");

-- AddForeignKey
ALTER TABLE "twitter_credentials" ADD CONSTRAINT "twitter_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
