import { Request, Response, NextFunction } from 'express';

import { config } from '../config/env';

const attemptsMap = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = config.devMode ? 1000 : 20;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  if (config.devMode) {
    return next(); // Bypass rate limiting completely in dev mode for smooth demoing
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown_ip';
  const now = Date.now();

  const record = attemptsMap.get(ip);

  if (!record) {
    attemptsMap.set(ip, { count: 1, firstAttempt: now });
    return next();
  }

  if (now - record.firstAttempt > WINDOW_MS) {
    // Reset window
    attemptsMap.set(ip, { count: 1, firstAttempt: now });
    return next();
  }

  if (record.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many requests. Please try again after 15 minutes.' });
  }

  record.count += 1;
  next();
}
