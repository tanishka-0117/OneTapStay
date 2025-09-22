import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { AppError } from './errorHandler'

const prisma = new PrismaClient()

export interface AuthRequest extends Request {
  user?: {
    id: string
    phone?: string
    type: 'guest' | 'hotel' | 'admin'
    email: string
  }
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return next(new AppError('Access denied. No token provided.', 401))
    }

    if (!process.env.JWT_SECRET) {
      return next(new AppError('JWT secret not configured', 500))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        phone: true,
        email: true,
        type: true,
        isActive: true,
      }
    })

    if (!user || !user.isActive || !user.email) {
      return next(new AppError('Invalid token or user not found', 401))
    }

    req.user = {
      id: user.id,
      phone: user.phone || undefined,
      type: user.type as 'guest' | 'hotel' | 'admin',
      email: user.email,
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401))
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401))
    }
    next(new AppError('Token verification failed', 401))
  }
}

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401))
    }

    if (!roles.includes(req.user.type)) {
      return next(new AppError('Insufficient permissions', 403))
    }

    next()
  }
}

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return next()
    }

    if (!process.env.JWT_SECRET) {
      return next()
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        phone: true,
        email: true,
        type: true,
        isActive: true,
      }
    })

    if (user && user.isActive && user.email) {
      req.user = {
        id: user.id,
        phone: user.phone || undefined,
        type: user.type as 'guest' | 'hotel' | 'admin',
        email: user.email,
      }
    }

    next()
  } catch (error) {
    // Ignore auth errors for optional auth
    next()
  }
}