/*
  Warnings:

  - The values [PARTNER_AUTH_TOKEN] on the enum `TokenType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TokenType_new" AS ENUM ('ANON_CHECKOUT_TOKEN', 'AUTH_CHECKOUT_TOKEN', 'CLIENT_OAUTH_ACCESS_TOKEN', 'CLIENT_OAUTH_REQUEST_TOKEN', 'PARTNER_ACCESS_TOKEN', 'PARTNER_REQUEST_TOKEN', 'PARTNER_VERIFY_ACCOUNT_TOKEN');
ALTER TABLE "tokens" ALTER COLUMN "type" TYPE "TokenType_new" USING ("type"::text::"TokenType_new");
ALTER TYPE "TokenType" RENAME TO "TokenType_old";
ALTER TYPE "TokenType_new" RENAME TO "TokenType";
DROP TYPE "TokenType_old";
COMMIT;
