import express, { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const router = express.Router()

// In-memory OTP storage (in production, use Redis or database)
interface OTPData {
  otp: string
  email: string
  bookingId: string
  createdAt: Date
  expiresAt: Date
}

const otpStorage = new Map<string, OTPData>()

// Clean expired OTPs every 5 minutes
setInterval(() => {
  const now = new Date()
  for (const [key, data] of otpStorage.entries()) {
    if (data.expiresAt < now) {
      otpStorage.delete(key)
    }
  }
}, 5 * 60 * 1000)

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
    console.log('✅ Email transporter initialized successfully')
  } else {
    console.log('⚠️ Gmail credentials not found in environment variables')
  }
} catch (error) {
  console.error('❌ Gmail transporter setup failed:', error)
}

// Generate random OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP via Email
const sendOTPEmail = async (email: string, otp: string, bookingDetails?: {
  bookingId: string
  hotelName: string
  guestName: string
  roomNumber: string
}) => {
  if (!emailTransporter) {
    throw new Error('Email service not configured')
  }

  const subject = bookingDetails 
    ? `OneTapStay - Your OTP Code for ${bookingDetails.hotelName}`
    : 'OneTapStay - Your Verification Code'

  const bookingInfo = bookingDetails ? `
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #0891b2; margin-top: 0;">Booking Details:</h3>
      <p><strong>Hotel:</strong> ${bookingDetails.hotelName}</p>
      <p><strong>Guest:</strong> ${bookingDetails.guestName}</p>
      <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
      <p><strong>Room:</strong> ${bookingDetails.roomNumber}</p>
    </div>
  ` : ''

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0891b2;">🏨 OneTapStay</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #0891b2, #0e7490); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 24px;">Your Verification Code</h2>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 15px 0;">${otp}</p>
        </div>
        
        ${bookingInfo}
        
        <div style="border-left: 4px solid #0891b2; padding-left: 15px; margin: 20px 0;">
          <p><strong>Important:</strong></p>
          <ul style="margin: 10px 0;">
            <li>This OTP will expire in 5 minutes</li>
            <li>Use this code to access your guest dashboard</li>
            <li>Do not share this code with anyone</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request this OTP, please contact hotel support.
          </p>
        </div>
      </div>
    `
  }

  await emailTransporter.sendMail(mailOptions)
}

/**
 * Unified login endpoint for both staff and guests
 * POST /api/auth/unified-login
 */
router.post('/unified-login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body

    // Validate inputs
    if (!email || !password || !role) {
      res.status(400).json({
        success: false,
        message: 'Email, password, and role are required'
      })
      return
    }

    // Mock authentication for testing
    if (email === 'admin@onetapstay.com' && password === 'admin123') {
      const token = jwt.sign(
        { userId: 'admin-1', email, role: 'ADMIN' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      )

      res.status(200).json({
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
      return
    }

    if (email === 'staff@onetapstay.com' && password === 'staff123') {
      const token = jwt.sign(
        { userId: 'staff-1', email, role: 'STAFF' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      )

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: 'staff-1',
          email,
          firstName: 'Staff',
          lastName: 'Member',
          role: 'STAFF'
        },
        role: 'STAFF'
      })
      return
    }

    if (email === 'guest@onetapstay.com' && password === 'guest123') {
      const token = jwt.sign(
        { userId: 'guest-1', email, role: 'GUEST' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      )

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: 'guest-1',
          email,
          firstName: 'Guest',
          lastName: 'User',
          role: 'GUEST'
        },
        role: 'GUEST'
      })
      return
    }

    res.status(401).json({
      success: false,
      message: 'Invalid credentials. Try: admin@onetapstay.com/admin123, staff@onetapstay.com/staff123, or guest@onetapstay.com/guest123'
    })

  } catch (error) {
    console.error('Unified login error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

/**
 * Send OTP for guest authentication
 * POST /api/auth/send-otp
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email, bookingId } = req.body

    if (!email || !bookingId) {
      res.status(400).json({
        success: false,
        message: 'Email and booking ID are required'
      })
      return
    }

    // First, validate if the booking exists and matches the email
    console.log(`🔍 Validating booking ${bookingId} with email ${email}`)
    
    const booking = await prisma.booking.findFirst({
      where: {
        externalBookingId: bookingId,
        guestEmail: email.toLowerCase()
      },
      include: {
        hotel: true,
        room: true
      }
    })

    if (!booking) {
      console.log(`❌ Booking not found for ${bookingId} with email ${email}`)
      res.status(404).json({
        success: false,
        message: '❌ Booking not found. Please check your Booking ID and email address.'
      })
      return
    }

    console.log(`✅ Booking validated: ${booking.hotel.name} - ${booking.guestName}`)

    // Only proceed with OTP generation if booking is found
    const otp = generateOTP()

    // Send OTP via email with booking details
    try {
      await sendOTPEmail(email, otp, {
        bookingId,
        hotelName: booking.hotel.name,
        guestName: booking.guestName,
        roomNumber: booking.room?.number || 'TBD'
      })
      console.log(`✅ OTP sent successfully to ${email} for booking ${bookingId}`)
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError)
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please check your email configuration.'
      })
      return
    }

    // Store OTP in memory with expiration (5 minutes)
    const otpKey = `${email}:${bookingId}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes from now
    
    otpStorage.set(otpKey, {
      otp,
      email,
      bookingId,
      createdAt: now,
      expiresAt
    })

    console.log(`💾 OTP stored for ${email}:${bookingId}, expires at ${expiresAt.toISOString()}`)

    res.status(200).json({
      success: true,
      message: `✅ OTP sent successfully to ${email}`,
      hotelName: booking.hotel.name,
      // In development, return the OTP for easy testing
      ...(process.env.NODE_ENV === 'development' && { otp: otp })
    })

  } catch (error) {
    console.error('Send OTP error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

/**
 * Verify OTP for guest authentication
 * POST /api/auth/verify-otp
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, bookingId, otp } = req.body

    if (!email || !bookingId || !otp) {
      res.status(400).json({
        success: false,
        message: 'Email, booking ID, and OTP are required'
      })
      return
    }

    // Check if OTP exists and is valid
    const otpKey = `${email}:${bookingId}`
    const storedOtpData = otpStorage.get(otpKey)

    if (!storedOtpData) {
      res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      })
      return
    }

    // Check if OTP has expired
    const now = new Date()
    if (storedOtpData.expiresAt < now) {
      otpStorage.delete(otpKey) // Clean up expired OTP
      res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      })
      return
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check your email and try again.'
      })
      return
    }

    // OTP is valid, remove it from storage (single use)
    otpStorage.delete(otpKey)
    console.log(`✅ OTP verified successfully for ${email}:${bookingId}`)

    // Generate JWT token for guest
    const token = jwt.sign(
      { userId: 'guest-' + bookingId, email, role: 'GUEST', bookingId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    )

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: 'guest-' + bookingId,
        email,
        firstName: 'Guest',
        lastName: 'User',
        role: 'GUEST',
        bookingId
      }
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

/**
 * Get guest profile data - updated to use real database data
 * GET /api/auth/guest-profile
 * Requires: Authorization header with JWT token
 */
router.get('/guest-profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authorization token required'
      })
      return
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    
    // Extract booking info from token (guest-{bookingId} format)
    const userId = decoded.userId
    const email = decoded.email
    
    if (!userId.startsWith('guest-')) {
      res.status(403).json({
        success: false,
        message: 'Access denied - guest token required'
      })
      return
    }

    const bookingId = userId.replace('guest-', '')
    
    // Fetch real booking data from database
    const booking = await prisma.booking.findUnique({
      where: { 
        externalBookingId: bookingId 
      },
      include: {
        guest: true,
        hotel: true,
        room: true,
        keys: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
      return
    }

    // Get guest's loyalty account if exists
    const loyaltyAccount = booking.guest ? await prisma.loyaltyAccount.findUnique({
      where: { userId: booking.guest.id }
    }) : null

    // Build room amenities array based on room features
    const roomAmenities: string[] = []
    if (booking.room.hasWifi) roomAmenities.push("WiFi")
    if (booking.room.hasAC) roomAmenities.push("Air Conditioning")
    if (booking.room.hasTV) roomAmenities.push("TV")
    if (booking.room.hasBalcony) roomAmenities.push("Balcony")
    if (booking.room.hasKitchen) roomAmenities.push("Kitchen")
    if (booking.room.hasBathtub) roomAmenities.push("Bathtub")

    // Calculate loyalty points tier info
    const loyaltyInfo = loyaltyAccount ? {
      current: loyaltyAccount.currentPoints,
      tier: loyaltyAccount.tier.charAt(0).toUpperCase() + loyaltyAccount.tier.slice(1),
      pointsToNextTier: loyaltyAccount.pointsToNextTier
    } : {
      current: 0,
      tier: "Bronze",
      pointsToNextTier: 500
    }

    // Check if room key is active and if checkout time has passed
    const currentTime = new Date()
    const checkoutTime = new Date(booking.checkOut)
    const hasActiveKey = booking.keys && booking.keys.length > 0
    const isCheckoutTimeExceeded = currentTime > checkoutTime
    
    // Room key is active only if there's a key AND checkout time hasn't passed
    const roomKeyActive = hasActiveKey && !isCheckoutTimeExceeded
    
    // If checkout time is exceeded, automatically deactivate room keys in database
    if (isCheckoutTimeExceeded && hasActiveKey) {
      await prisma.roomKey.updateMany({
        where: {
          bookingId: booking.id,
          isActive: true
        },
        data: {
          isActive: false,
          isRevoked: true
        }
      })
    }
    
    const keyExpiry = hasActiveKey ? booking.keys[0].validUntil.toISOString() : booking.checkOut.toISOString()

    const guestData = {
      guestName: booking.guestName,
      email: booking.guestEmail || email,
      bookingId: booking.externalBookingId || booking.id,
      hotel: {
        name: booking.hotel.name,
        address: `${booking.hotel.address}, ${booking.hotel.city}, ${booking.hotel.state} ${booking.hotel.zipCode}`,
        phone: booking.hotel.phone,
        checkInTime: booking.hotel.checkInTime, // Hotel's standard check-in time policy
        checkOutTime: booking.hotel.checkOutTime // Hotel's standard check-out time policy
      },
      booking: {
        confirmationCode: booking.confirmationCode,
        checkIn: booking.checkIn.toISOString().split('T')[0],
        checkOut: booking.checkOut.toISOString().split('T')[0],
        guests: booking.guests,
        status: booking.status,
        room: {
          number: booking.room.number,
          type: booking.room.type,
          floor: booking.room.floor,
          beds: booking.room.beds,
          capacity: booking.room.capacity,
          amenities: roomAmenities
        },
        totalAmount: booking.totalAmount,
        currency: booking.currency
      },
      loyaltyPoints: loyaltyInfo,
      specialRequests: booking.specialRequests || null,
      accessInfo: {
        roomKeyActive: roomKeyActive,
        wifiCredentialsAvailable: true,
        digitalKeyExpiry: keyExpiry,
        checkoutExceeded: isCheckoutTimeExceeded
      }
    }

    res.status(200).json({
      success: true,
      message: 'Guest profile retrieved successfully',
      data: guestData
    })
    return

  } catch (error) {
    console.error('Error fetching guest profile:', error)
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
    return
  }
})

/**
 * Get WiFi credentials for guest
 * GET /api/auth/wifi-credentials/:bookingId
 * Requires: Authorization header with JWT token
 */
router.get('/wifi-credentials/:bookingId', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authorization token required'
      })
      return
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const bookingId = req.params.bookingId
    
    // Verify the booking ID matches the token
    if (!decoded.userId.endsWith(bookingId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied - booking ID mismatch'
      })
      return
    }

    // For now, use mock hotel-specific WiFi data based on booking ID
    // This will work until we properly seed the database with real data
    
    // Determine hotel context from booking ID pattern
    let hotelName, hotelLocation, wifiNetwork, passwordFormat
    
    if (bookingId.includes('GP') || bookingId.includes('grand')) {
      hotelName = "Grand Plaza Hotel"
      hotelLocation = "New York, NY"
      wifiNetwork = "GrandPlaza_Guest"
      passwordFormat = `GP_${bookingId}_2025`
    } else if (bookingId.includes('OV') || bookingId.includes('ocean')) {
      hotelName = "Ocean View Resort"
      hotelLocation = "Miami, FL"
      wifiNetwork = "OceanView_Resort"
      passwordFormat = `OCEAN_${bookingId}_2025`
    } else if (bookingId.includes('CC') || bookingId.includes('city')) {
      hotelName = "City Center Lodge"
      hotelLocation = "Chicago, IL"
      wifiNetwork = "CityCenter_Lodge"
      passwordFormat = `CC_${bookingId}_2025`
    } else {
      // Default hotel for any other booking ID
      hotelName = "Grand Plaza Hotel"
      hotelLocation = "New York, NY"
      wifiNetwork = "GrandPlaza_Guest"
      passwordFormat = `GP_${bookingId}_2025`
    }

    const currentYear = new Date().getFullYear()
    const validUntil = new Date()
    validUntil.setHours(validUntil.getHours() + 72) // 72 hours validity

    // For testing: Use actual WiFi network for connection testing
    const wifiCredentials = {
      networkName: "Yamete kudasai", // Your actual WiFi network
      password: "........", // Your actual WiFi password (hidden for security)
      connectionType: "WPA2-Personal",
      guestNetwork: true,
      bandwidth: "50 Mbps",
      validUntil: validUntil.toISOString(),
      autoConnect: true,
      qrCodeEnabled: true,
      connectionInstructions: {
        windows: "Connect via Settings > Network & Internet > WiFi",
        mac: "Connect via System Preferences > Network > WiFi", 
        mobile: "Go to WiFi settings and select the network",
        automatic: true,
        custom: `Testing WiFi auto-connection with your network. If successful, you'll see "Connected" status.`
      },
      hotelInfo: {
        name: hotelName,
        location: hotelLocation,
        supportPhone: "+1 (555) 123-4567",
        supportInstructions: "Testing WiFi connection functionality - this will attempt to connect to your actual network."
      }
    }

    res.status(200).json({
      success: true,
      message: 'WiFi credentials retrieved successfully',
      data: wifiCredentials
    })
    return

  } catch (error) {
    console.error('Error fetching WiFi credentials:', error)
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
    return
  }
})

/**
 * Debug OTP storage (development only)
 * GET /api/auth/debug-otps
 */
if (process.env.NODE_ENV === 'development') {
  router.get('/debug-otps', (req: Request, res: Response) => {
    const otps = Array.from(otpStorage.entries()).map(([key, data]) => ({
      key,
      otp: data.otp,
      email: data.email,
      bookingId: data.bookingId,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      isExpired: data.expiresAt < new Date()
    }))

    res.status(200).json({
      success: true,
      message: 'Current OTP storage',
      otps,
      count: otps.length
    })
  })
}

/**
 * Test email endpoint (development only)
 * POST /api/auth/test-email
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test-email', async (req: Request, res: Response) => {
    try {
      const { email } = req.body

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required'
        })
        return
      }

      const testOtp = '123456'
      await sendOTPEmail(email, testOtp)

      res.status(200).json({
        success: true,
        message: `Test email sent successfully to ${email}`,
        note: 'Check your email for the test OTP: 123456'
      })

    } catch (error) {
      console.error('Test email error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to send test email: ' + (error as Error).message
      })
    }
  })
}

/**
 * Unlock room for authenticated guest
 * POST /api/auth/unlock-room/:bookingId
 */
router.post('/unlock-room/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params
    const authHeader = req.headers.authorization
    const { deviceInfo, location } = req.body

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authorization token required'
      })
      return
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      })
      return
    }

    console.log(`🔑 Room unlock request for booking ${bookingId} by ${decoded.email}`)

    // Validate booking and get room details
    const booking = await prisma.booking.findFirst({
      where: {
        externalBookingId: bookingId,
        guestEmail: decoded.email
      },
      include: {
        room: true,
        hotel: true
      }
    })

    if (!booking) {
      console.log(`❌ Booking not found for unlock request: ${bookingId}`)
      res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      })
      return
    }

    // Check if booking is active and guest can access room
    const now = new Date()
    const checkInDate = new Date(booking.checkIn)
    const checkOutDate = new Date(booking.checkOut)

    // Allow access from 3 hours before check-in until check-out time
    const accessStartTime = new Date(checkInDate.getTime() - 3 * 60 * 60 * 1000)

    if (now < accessStartTime) {
      res.status(403).json({
        success: false,
        message: `Room access not available yet. Check-in starts at ${checkInDate.toLocaleString()}`
      })
      return
    }

    if (now > checkOutDate) {
      res.status(403).json({
        success: false,
        message: `Room access expired. Check-out was at ${checkOutDate.toLocaleString()}`
      })
      return
    }

    // Find or create room key
    let roomKey = await prisma.roomKey.findFirst({
      where: {
        bookingId: booking.id,
        roomId: booking.roomId,
        isActive: true,
        isRevoked: false
      }
    })

    if (!roomKey) {
      // Create new room key
      roomKey = await prisma.roomKey.create({
        data: {
          bookingId: booking.id,
          roomId: booking.roomId,
          keyType: 'DIGITAL',
          keyData: `DIGITAL_KEY_${booking.id}_${Date.now()}`,
          validFrom: accessStartTime,
          validUntil: checkOutDate,
          maxUses: 1000,
          usedCount: 0,
          isActive: true,
          isRevoked: false
        }
      })
      console.log(`🔑 Created new digital key for booking ${bookingId}`)
    }

    // Check if key is still valid and has uses left
    if (!roomKey.isActive || roomKey.isRevoked) {
      res.status(403).json({
        success: false,
        message: 'Room key is not active'
      })
      return
    }

    if (roomKey.maxUses && roomKey.usedCount >= roomKey.maxUses) {
      res.status(403).json({
        success: false,
        message: 'Room key usage limit exceeded'
      })
      return
    }

    // Use Smart Lock Service for actual room unlock
    const { smartLockManager } = await import('../services/smartLockService')
    const unlockResult = await smartLockManager.unlockRoom(booking.roomId, roomKey.keyData)
    const unlockSuccess = unlockResult.success

    // Update key usage count
    await prisma.roomKey.update({
      where: { id: roomKey.id },
      data: {
        usedCount: { increment: 1 },
        updatedAt: new Date()
      }
    })

    // Log the access attempt
    await prisma.accessLog.create({
      data: {
        userId: decoded.userId || null,
        keyId: roomKey.id,
        action: 'ROOM_UNLOCK',
        device: deviceInfo || 'Unknown Device',
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        location: location || null,
        success: unlockSuccess,
        errorMessage: unlockSuccess ? null : unlockResult.message
      }
    })

    if (unlockSuccess) {
      console.log(`✅ Room ${booking.room.number} unlocked successfully for ${decoded.email}`)
      res.status(200).json({
        success: true,
        message: `🎉 Room ${booking.room.number} unlocked successfully!`,
        data: {
          roomNumber: booking.room.number,
          hotelName: booking.hotel.name,
          unlockTime: new Date().toISOString(),
          remainingUses: roomKey.maxUses ? roomKey.maxUses - (roomKey.usedCount + 1) : 'Unlimited',
          keyValidUntil: roomKey.validUntil.toISOString()
        }
      })
    } else {
      console.log(`❌ Room unlock failed for ${decoded.email} - ${unlockResult.message}`)
      res.status(500).json({
        success: false,
        message: `❌ ${unlockResult.message}. Please try again or contact hotel staff.`,
        data: {
          roomNumber: booking.room.number,
          errorCode: unlockResult.errorCode || 'SMART_LOCK_ERROR'
        }
      })
    }

  } catch (error) {
    console.error('Room unlock error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error during room unlock'
    })
  }
})

export default router