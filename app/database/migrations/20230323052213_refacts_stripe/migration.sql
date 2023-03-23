/*
  Warnings:

  - You are about to drop the column `currency` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tierId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `prices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `prices_currencies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tiers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tiers_limit` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stripeCustomerId` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripeSubscriptionId` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripeSubscriptionStatus` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('ANON_CHECKOUT_TOKEN');

-- DropForeignKey
ALTER TABLE "prices" DROP CONSTRAINT "prices_tierId_fkey";

-- DropForeignKey
ALTER TABLE "prices_currencies" DROP CONSTRAINT "prices_currencies_priceId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_priceId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_tierId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_userId_fkey";

-- DropForeignKey
ALTER TABLE "tiers" DROP CONSTRAINT "tiers_tierLimitId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_tierId_fkey";

-- DropIndex
DROP INDEX "users_customerId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "currency",
DROP COLUMN "customerId",
DROP COLUMN "tierId",
ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "currentPeriodStart" TIMESTAMP(3),
ADD COLUMN     "stripeCustomerId" TEXT NOT NULL,
ADD COLUMN     "stripeSubscriptionId" TEXT NOT NULL,
ADD COLUMN     "stripeSubscriptionStatus" "SubscriptionStatus" NOT NULL;

-- DropTable
DROP TABLE "prices";

-- DropTable
DROP TABLE "prices_currencies";

-- DropTable
DROP TABLE "subscriptions";

-- DropTable
DROP TABLE "tiers";

-- DropTable
DROP TABLE "tiers_limit";

-- DropEnum
DROP TYPE "Currency";

-- DropEnum
DROP TYPE "Interval";

-- DropEnum
DROP TYPE "TierId";

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "token" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_type_key" ON "tokens"("token", "type");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");
