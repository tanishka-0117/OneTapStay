import { Request, Response, NextFunction } from 'express';
import { authMiddleware, requireRole, AuthRequest } from './auth';

export const guestAuthMiddleware = [
  authMiddleware,
  requireRole('guest')
];

export type { AuthRequest };