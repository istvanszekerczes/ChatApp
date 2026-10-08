/*
  Warnings:

  - You are about to drop the column `lastSeendTimestamp` on the `LastSeenHelper` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LastSeenHelper" DROP COLUMN "lastSeendTimestamp",
ADD COLUMN     "lastSeenTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
