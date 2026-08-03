import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/require-auth'
import { getOnlineUserIds } from '../lib/presense';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { id: { not: req.user!.id } },
      select: { id: true, username: true, avatarColor: true, lastOnline: true },
      orderBy: { username: 'asc' },
    });

    const online = new Set(getOnlineUserIds());

    res.json({
      users: users.map(u => ({ ...u, online: online.has(u.id) })),
    });
  } catch (error) {
    console.error('Failed to list users:', error);
    res.status(500).json({ error: 'Could not load users.' });
  }
});
export default router;