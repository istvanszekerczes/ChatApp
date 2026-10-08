/*
  Warnings:

  - A unique constraint covering the columns `[userId,chatId]` on the table `LastSeenHelper` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "LastSeenHelper_userId_chatId_key" ON "LastSeenHelper"("userId", "chatId");
