import express, { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { redisClient } from '../index'
import { authService } from '../services/authService'
// import { authenticateToken, requireRole } from '../middleware/auth' // TODO: Create middleware

const router = express.Router()
const prisma = new PrismaClient()

// Gmail transporter setup
let emailTransporter: nodemailer.Transporter | null = null

try {
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS // App password, not regular password
      }
    })
  }
} catch (error) {
  console.error('Gmail transporter setup failed:', error)
}

// Generate random OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP via Email
const sendOTPEmail = async (email: string, otp: string) => {
  if (!emailTransporter) {
    throw new AppError('Email service not configured', 500)
  }

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'OneTapStay - Your Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #333;">OneTapStay Verification Code</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <p>Best regards,<br>OneTapStay Team</p>
      </div>
    `
  }

  await emailTransporter.sendMail(mailOptions)
}

// @desc Test email configuration (development only)
// @route POST /api/auth/test-email
// @access Public (only in development)
if (process.env.NODE_ENV === 'development') {
  router.post('/test-email', [
    body('email').isEmail().withMessage('Valid email required'),
  ], asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed: ' + errors.array()[0].msg, 400)
    }

    const { email } = req.body
    const testOtp = '123456'

    try {
      await sendOTPEmail(email, testOtp)
      res.status(200).json({
        success: true,
        message: `Test email sent successfully to ${email}`,
        note: 'Check your email for the test OTP: 123456'
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new AppError(`Failed to send test email: ${errorMessage}`, 500)
    }
  }))
}

// Generate JWT token
const generateToken = (userId: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET not configured', 500)
  }
  
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  })
}

// @desc Send OTP to email (requires valid booking)
// @route POST /api/auth/send-otp
// @access Public
router.post('/send-otp', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('bookingId')
    .notEmpty()
    .withMessage('Booking ID is required')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed: ' + errors.array()[0].msg, 400)
  }

  const { email, bookingId } = req.body

  // Validate booking exists with matching email
  const booking = await (prisma as any).booking.findUnique({
    where: { externalBookingId: bookingId },
    include: {
      guest: { select: { id: true, email: true } },
      hotel: { select: { name: true } },
      room: { select: { number: true } }
    }
  })

  if (!booking) {
    throw new AppError('Invalid booking ID. Please check your booking details.', 404)
  }

  if (booking.guestEmail !== email) {
    throw new AppError('Email does not match the booking record. Please use the email address associated with your booking.', 400)
  }

  // Check if booking is still valid (not cancelled or expired)
  if (booking.status === 'cancelled') {
    throw new AppError('This booking has been cancelled. Please contact support if you need assistance.', 400)
  }

  // Check if checkout date has passed
  const now = new Date()
  if (booking.checkOut < now) {
    throw new AppError('This booking has expired. Please contact support if you need assistance.', 400)
  }

  // Check rate limiting (1 OTP per email every 30 seconds)
  if (redisClient) {
    const rateLimitKey = `otp_rate_limit:${email}`
    const lastSent = await redisClient.get(rateLimitKey)
    
    if (lastSent) {
      const timeDiff = Date.now() - parseInt(lastSent)
      if (timeDiff < 30000) { // 30 seconds
        throw new AppError('Please wait 30 seconds before requesting another OTP.', 429)
      }
    }
  }

  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  // Store OTP in database
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  await (prisma as any).otpCode.create({
    data: {
      email,
      code: otp,
      purpose: 'login',
      expiresAt,
      userId: existingUser?.id
    }
  })

  // Send OTP via Email
  try {
    await sendOTPEmail(email, otp)
    console.log(`OTP sent successfully to ${email}`)
  } catch (emailError) {
    console.error('Email sending failed:', emailError)
    // In development, don't fail if Gmail is not configured
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('Failed to send OTP email. Please try again.', 500)
    } else {
      console.warn('⚠️ Gmail SMTP not configured properly. Please check your .env file.')
    }
  }

  // Update rate limiting
  if (redisClient) {
    const rateLimitKey = `otp_rate_limit:${email}`
    await redisClient.setEx(rateLimitKey, 30, Date.now().toString()) // 30 seconds
  }

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully to your email address'
  })
}))

// @desc Verify OTP and login/register
// @route POST /api/auth/verify-otp
// @access Public
router.post('/verify-otp', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('Please provide a valid 6-digit OTP')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  body('bookingId')
    .notEmpty()
    .withMessage('Booking ID is required')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed: ' + errors.array()[0].msg, 400)
  }

  const { email, otp, bookingId } = req.body

  // Verify booking again
  const booking = await (prisma as any).booking.findUnique({
    where: { externalBookingId: bookingId },
    include: {
      guest: { select: { id: true, email: true } },
      hotel: { select: { name: true } },
      room: { select: { number: true } }
    }
  })

  if (!booking || booking.guestEmail !== email) {
    throw new AppError('Invalid booking details.', 400)
  }

  // Find and verify OTP
  const otpRecord = await (prisma as any).otpCode.findFirst({
    where: {
      email,
      code: otp,
      isUsed: false,
      expiresAt: {
        gt: new Date()
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  if (!otpRecord) {
    // Update attempts
    await (prisma as any).otpCode.updateMany({
      where: {
        email,
        code: otp
      },
      data: {
        attempts: {
          increment: 1
        }
      }
    })
    
    throw new AppError('Invalid or expired OTP', 400)
  }

  // Mark OTP as used
  await (prisma as any).otpCode.update({
    where: {
      id: otpRecord.id
    },
    data: {
      isUsed: true
    }
  })

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    // Create new user
    user = await (prisma as any).user.create({
      data: {
        email,
        firstName: booking.guestName.split(' ')[0],
        lastName: booking.guestName.split(' ').slice(1).join(' ') || '',
        type: 'guest',
        isActive: true,
        isVerified: true
      }
    })
  } else {
    // Update user as verified
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true }
    })
  }

  // Update booking timeout status when user logs in
  await (prisma as any).booking.update({
    where: { id: booking.id },
    data: { isTimeoutActive: true }
  })

  // Ensure user exists
  if (!user) {
    throw new AppError('Failed to create or find user', 500)
  }

  // Generate JWT token
  const token = generateToken(user.id)

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      type: user.type,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified
    },
    booking: {
      id: booking.id,
      externalBookingId: booking.externalBookingId,
      hotelName: booking.hotel.name,
      roomNumber: booking.room.number,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut
    }
  })
}))

// @desc Get current user profile
// @route GET /api/auth/me
// @access Private
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'This endpoint requires authentication middleware'
  })
}))

// @desc Register hotel
// @route POST /api/auth/register-hotel
// @access Public
router.post('/register-hotel', [
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('hotelName').isLength({ min: 2 }).withMessage('Hotel name required'),
  body('address').isLength({ min: 5 }).withMessage('Address required'),
  body('city').isLength({ min: 2 }).withMessage('City required'),
  body('country').isLength({ min: 2 }).withMessage('Country required')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed: ' + errors.array()[0].msg, 400)
  }

  const { 
    phone, 
    email, 
    hotelName, 
    address, 
    city, 
    state, 
    country, 
    zipCode,
    firstName,
    lastName 
  } = req.body

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      email: email
    }
  })

  if (existingUser) {
    throw new AppError('User with this email already exists', 400)
  }

  // Create hotel user
  const user = await prisma.user.create({
    data: {
      email,
      phone,
      type: 'hotel',
      firstName: firstName || hotelName,
      lastName: lastName || '',
      isActive: true,
      isVerified: false
    }
  })

  // Create hotel record
  await prisma.hotel.create({
    data: {
      userId: user.id,
      name: hotelName,
      address,
      city,
      state: state || '',
      country,
      zipCode: zipCode || '',
      phone: phone || '',
      email: email,
      isActive: true,
      isVerified: false
    } as any
  })

  res.status(201).json({
    success: true,
    message: 'Hotel registration successful. Please verify your email to activate your account.',
    user: {
      id: user.id,
      email: user.email,
      type: user.type,
      isVerified: user.isVerified
    }
  })
}))

/**
 * Unified login endpoint for both staff and guests
 * POST /api/auth/unified-login
 */
router.post('/unified-login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body

    // Validate inputs
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required'
      })
    }

    // Mock authentication for testing
    if (email === 'admin@onetapstay.com' && password === 'admin123') {
      const token = jwt.sign(
        { userId: 'admin-1', email, role: 'ADMIN' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      )

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: 'admin-1',
          email,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN'
        },
        role: 'ADMIN'
      })
    }

    // Staff login options for different facilities
    const staffAccounts = [
      {
        email: 'restaurant@onetapstay.com',
        password: 'restaurant123',
        facility: 'restaurant',
        name: { first: 'Sarah', last: 'Johnson' }
      },
      {
        email: 'spa@onetapstay.com',
        password: 'spa123',
        facility: 'spa',
        name: { first: 'Emma', last: 'Wilson' }
      },
      {
        email: 'gym@onetapstay.com',
        password: 'gym123',
        facility: 'gym',
        name: { first: 'Mike', last: 'Davis' }
      },
      {
        email: 'pool@onetapstay.com',
        password: 'pool123',
        facility: 'pool',
        name: { first: 'Lisa', last: 'Brown' }
      },
      {
        email: 'staff@onetapstay.com',
        password: 'staff123',
        facility: 'general',
        name: { first: 'Staff', last: 'Member' }
      }
    ]

    const staffAccount = staffAccounts.find(acc => acc.email === email && acc.password === password && role === 'STAFF')
    
    if (staffAccount) {
      const token = jwt.sign(
        { userId: `staff-${staffAccount.facility}`, email, role: 'STAFF' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      )

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: `staff-${staffAccount.facility}`,
          email,
          firstName: staffAccount.name.first,
          lastName: staffAccount.name.last,
          role: 'STAFF',
          facilityType: staffAccount.facility
        },
        role: 'STAFF'
      })
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    })

  } catch (error) {
    console.error('Unified login error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

export default router