import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler'

export interface AdminAuthRequest extends Request {
  user?: {
    userId: string
    email: string
    role: string
  }
}

export const adminAuthMiddleware = async (
  req: AdminAuthRequest,
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
    
    // Check if user has admin or staff role
    if (decoded.role !== 'ADMIN' && decoded.role !== 'STAFF') {
      return next(new AppError('Access denied. Admin or Staff role required.', 403))
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
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