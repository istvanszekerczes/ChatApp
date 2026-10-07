-- CreateTable
CREATE TABLE "LastSeenHelper" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "lastSeendTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LastSeenHelper_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LastSeenHelper" ADD CONSTRAINT "LastSeenHelper_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LastSeenHelper" ADD CONSTRAINT "LastSeenHelper_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
