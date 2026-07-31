import { ChatType } from '@prisma/client';
import { prisma } from './prisma';

export async function canAccessChat(userId: string, chatId: string): Promise<boolean> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: {
      type: true,
      participants: { where: { userId }, select: { id: true } },
    },
  });

  if (!chat) return false;
  if (chat.participants.length > 0) return true;

  return chat.type === ChatType.PUBLIC_GROUP;
}