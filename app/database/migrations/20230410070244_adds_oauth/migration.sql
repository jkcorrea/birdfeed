-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TokenType" ADD VALUE 'PARTNER_ACCESS_TOKEN';
ALTER TYPE "TokenType" ADD VALUE 'PARTNER_AUTH_TOKEN';
ALTER TYPE "TokenType" ADD VALUE 'PARTNER_VERIFY_ACCOUNT_TOKEN';

-- CreateTable
CREATE TABLE "oauth_partners" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "oauth_partners_pkey" PRIMARY KEY ("id")
);
