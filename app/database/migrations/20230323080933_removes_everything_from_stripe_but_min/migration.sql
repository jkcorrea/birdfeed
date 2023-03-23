/*
  Warnings:

  - You are about to drop the column `cancelAtPeriodEnd` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `currentPeriodEnd` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `currentPeriodStart` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionStatus` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "cancelAtPeriodEnd",
DROP COLUMN "currentPeriodEnd",
DROP COLUMN "currentPeriodStart",
DROP COLUMN "stripeSubscriptionStatus";
