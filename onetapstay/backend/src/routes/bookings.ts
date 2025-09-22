import express from 'express'
import { AppError, asyncHandler } from '../middleware/errorHandler'

const router = express.Router()

// Placeholder routes - will be implemented with auth middleware

router.get('/', asyncHandler(async (req, res) => {
  res.json({ message: 'Bookings route - requires authentication' })
}))

router.post('/', asyncHandler(async (req, res) => {
  res.json({ message: 'Create booking - requires authentication' })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  res.json({ message: 'Get booking details - requires authentication' })
}))

export default router