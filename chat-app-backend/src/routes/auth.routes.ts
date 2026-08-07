import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { isValidAvatarColor } from "../lib/avatar-colors";
import { requireAuth } from "../middleware/require-auth";
import { getIo } from "../lib/socket";
import { GOOGLE_OAUTH_ENABLED, FACEBOOK_OAUTH_ENABLED } from "../config/authentication";

const router = Router();

/**
 * Transforms user object to version without password so it's safe to send it to the client.
 *   
 * @param user 
 * @returns 
 */
function toSafeUser(user: Express.User) {
  const { password, ...safeUser } = user as {
    password?: string;
    [key: string]: unknown;
  };
  return safeUser;
}

function requireOAuthEnabled(enabled: boolean, provider: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!enabled) {
      res.status(501).json({ error: `${provider} login is not configured on this server.` });
      return;
    }
    next();
  };
}

/**
 * POST /api/auth/register
 * Register a new user with email, username, and password.
 * Passwords are hashed before storing in the database.
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      res
        .status(400)
        .json({ error: "Please provide email, username, and password." });
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

    getIo().emit("user_registered", {
      id: newUser.id,
      username: newUser.username,
      avatarColor: newUser.avatarColor,
      online: false,
      lastOnline: null,
    });

    res
      .status(201)
      .json({ message: "User created successfully", userId: newUser.id });
  } catch (error) {
    console.error("Registration failed:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({ error: "Email or username already in use." });
      return;
    }
    res
      .status(500)
      .json({ error: "Registration failed. Please try again later." });
  }
});

/**
 * POST /api/auth/login
 * Authenticate a user using Passport's local strategy.
 * On successful login, update the user's lastOnline timestamp.
 */
router.post(
  "/login",
  passport.authenticate("local"),
  async (req: Request, res: Response) => {
    try {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { lastOnline: new Date() },
      });
    } catch (error) {
      console.error("Failed to update lastOnline on login:", error);
    }
    res.json({
      message: "Logged in successfully",
      user: toSafeUser(req.user!),
    });
  },
);

/**
 * GET /login/google
 * Google authentication endpoint
 */
router.get(
  "/login/google",
  requireOAuthEnabled(GOOGLE_OAUTH_ENABLED, "Google"),
  passport.authenticate("google", {
    prompt: "select_account",
  }),
);

router.get(
  "/oauth2/redirect/google",
  requireOAuthEnabled(GOOGLE_OAUTH_ENABLED, "Google"),
  passport.authenticate("google", {
    failureRedirect: "http://localhost:4200/login?error=google_failed",
  }),
  async (req: Request, res: Response) => {
    try {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { lastOnline: new Date() },
      });
    } catch (error) {
      console.error("Failed to update lastOnline on Google login:", error);
    }
    res.redirect("http://localhost:4200/");
  },
);

/**
 * GET /login/facebook
 * Facebook authentication endpoint
 */
router.get(
  "/login/facebook",
  requireOAuthEnabled(FACEBOOK_OAUTH_ENABLED, "Facebook"),
  passport.authenticate("facebook", {
    scope: ["email"],
  }),
);

router.get(
  "/oauth2/redirect/facebook",
  requireOAuthEnabled(FACEBOOK_OAUTH_ENABLED, "Facebook"),
  passport.authenticate("facebook", {
    failureRedirect: "http://localhost:4200/login?error=facebook_failed",
  }),
  async (req: Request, res: Response) => {
    try {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { lastOnline: new Date() },
      });
    } catch (error) {
      console.error("Failed to update lastOnline on Facebook login:", error);
    }
    res.redirect("http://localhost:4200/");
  },
);
/**
 * GET /api/auth/me
 * Get the authenticated user's information.
 */
router.get("/me", requireAuth, (req: Request, res: Response): void => {
  res.json({ user: toSafeUser(req.user!) });
});

/**
 * PATCH /api/auth/me
 * Update the authenticated user's avatar color.
 */
router.patch(
  "/me",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { avatarColor } = req.body;

    if (!isValidAvatarColor(avatarColor)) {
      res.status(400).json({ error: "Invalid avatar color." });
      return;
    }

    try {
      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data: { avatarColor },
      });
      getIo().emit("user_updated", {
        id: updated.id,
        username: updated.username,
        avatarColor: updated.avatarColor,
      });

      res.json({ user: toSafeUser(updated) });
    } catch (error) {
      console.error("Failed to update avatar color:", error);
      res.status(500).json({ error: "Could not update avatar color." });
    }
  },
);

/**
 * POST /api/auth/logout
 * Log out the authenticated user and destroy their session.
 */
router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
});

export default router;
