-- AlterTable
ALTER TABLE "tweets" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" INTEGER;
