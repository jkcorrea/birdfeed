-- AlterTable
ALTER TABLE "users" ADD COLUMN     "featureFlags" JSONB NOT NULL DEFAULT '[]';
