import { Router, Request, Response } from 'express';
import { ChatType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

const GROUP_TYPES = [
  ChatType.PUBLIC_GROUP,
  ChatType.PRIVATE_GROUP,
  ChatType.PROTECTED_GROUP,
];

const ALLOWED_AVATAR_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#a855f7', '#f59e0b', '#ec4899',
];

router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { type, name, avatarColor, password, participantIds } = req.body;
  const creatorId = req.user!.id;

  if (!GROUP_TYPES.includes(type)) {
    res.status(400).json({ error: 'Invalid chat type.' });
    return;
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Group name is required.' });
    return;
  }

  if (avatarColor && !ALLOWED_AVATAR_COLORS.includes(avatarColor)) {
    res.status(400).json({ error: 'Invalid avatar color.' });
    return;
  }

  if (type === ChatType.PROTECTED_GROUP && (!password || password.length < 4)) {
    res.status(400).json({ error: 'Protected groups need a password of at least 4 characters.' });
    return;
  }

  let memberIds: string[] = [creatorId];

  if (type === ChatType.PRIVATE_GROUP) {
    if (!Array.isArray(participantIds)) {
      res.status(400).json({ error: 'Private groups need a participant list.' });
      return;
    }
    const found = await prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: { id: true },
    });
    memberIds = [...new Set([creatorId, ...found.map(u => u.id)])];
  }

  try {
    const chat = await prisma.chat.create({
      data: {
        type,
        name: name.trim(),
        avatarColor: avatarColor ?? null,
        password: type === ChatType.PROTECTED_GROUP
          ? await bcrypt.hash(password, 10)
          : null,
        participants: {
          create: memberIds.map(userId => ({ userId })),
        },
      },
      select: {
        id: true, type: true, name: true, avatarColor: true, createdAt: true,
      },
    });
    res.status(201).json({ chat });
  } catch (error) {
    console.error('Failed to create chat:', error);
    res.status(500).json({ error: 'Could not create chat.' });
  }
});

export default router;