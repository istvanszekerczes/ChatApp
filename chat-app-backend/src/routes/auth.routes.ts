import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';

const router = Router();

// Register Route
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      res.status(400).json({ error: 'Please provide email, username, and password.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: 'User created successfully', userId: newUser.id });
  } catch (error) {
    console.error('Registration failed:', error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      res.status(409).json({ error: 'Email or username already in use.' });
      return;
    }
    res.status(500).json({ error: 'Registration failed. Please try again later.' });
  }
});

// Login Route
function toSafeUser(user: Express.User) {
  const { password, ...safeUser } = user as { password?: string; [key: string]: unknown };
  return safeUser;
}

router.post('/login', passport.authenticate('local'), async (req: Request, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { lastOnline: new Date() }
    });
  } catch (error) {
    console.error('Failed to update lastOnline on login:', error);
  }
  res.json({ message: 'Logged in successfully', user: toSafeUser(req.user!) });
});

router.get('/me', (req: Request, res: Response): void => {
  if (req.isAuthenticated()) {
    res.json({ user: toSafeUser(req.user!) });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Logout Route
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

//Validating avatar color string
const ALLOWED_AVATAR_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#a855f7', '#f59e0b', '#ec4899',
];

router.patch('/me', async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { avatarColor } = req.body;

  if (!ALLOWED_AVATAR_COLORS.includes(avatarColor)) {
    res.status(400).json({ error: 'Invalid avatar color.' });
    return;
  }

  try {
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarColor },
    });
    res.json({ user: toSafeUser(updated) });
  } catch (error) {
    console.error('Failed to update avatar color:', error);
    res.status(500).json({ error: 'Could not update avatar color.' });
  }
});



export default router;