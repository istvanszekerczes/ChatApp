import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure that the user is authenticated before accessing certain routes.
 * If the user is authenticated, the request proceeds to the next middleware or route handler.
 * If not, a 401 Unauthorized response is sent back to the client.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  res.status(401).json({ error: 'Not authenticated' });
}