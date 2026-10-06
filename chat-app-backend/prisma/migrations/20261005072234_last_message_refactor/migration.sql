/*
  Warnings:

  - You are about to drop the column `lastMessageContent` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessageSender` on the `Chat` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[lastMessageId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "lastMessageContent",
DROP COLUMN "lastMessageSender",
ADD COLUMN     "lastMessageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Chat_lastMessageId_key" ON "Chat"("lastMessageId");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
