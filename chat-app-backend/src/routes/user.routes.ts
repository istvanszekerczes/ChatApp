import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/require-auth'

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { id: { not: req.user!.id } },
      select: { id: true, username: true, avatarColor: true },
      orderBy: { username: 'asc' },
    });
    res.json({ users });
  } catch (error) {
    console.error('Failed to list users:', error);
    res.status(500).json({ error: 'Could not load users.' });
  }
});

export default router;