import express from 'express'
import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'
import { PrismaClient } from '@prisma/client'
import { AppError, asyncHandler } from '../middleware/errorHandler'

const router = express.Router()
const prisma = new PrismaClient()

// JWT middleware for authentication
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// QR Code generation for room access
router.get('/qr/:bookingId', authenticateToken, asyncHandler(async (req: any, res) => {
  const { bookingId } = req.params
  const userEmail = req.user.email

  console.log(`🎯 QR code generation request for booking ${bookingId} by ${userEmail}`)

  // Validate booking
  const booking = await prisma.booking.findFirst({
    where: {
      externalBookingId: bookingId,
      guestEmail: userEmail
    },
    include: {
      room: true,
      hotel: true
    }
  })

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or access denied'
    })
  }

  // Check if booking is active
  const now = new Date()
  const checkInDate = new Date(booking.checkIn)
  const checkOutDate = new Date(booking.checkOut)
  const accessStartTime = new Date(checkInDate.getTime() - 3 * 60 * 60 * 1000) // 3 hours before check-in

  if (now < accessStartTime) {
    return res.status(403).json({
      success: false,
      message: `QR code not available yet. Access starts at ${accessStartTime.toLocaleString()}`
    })
  }

  if (now > checkOutDate) {
    return res.status(403).json({
      success: false,
      message: `QR code expired. Check-out was at ${checkOutDate.toLocaleString()}`
    })
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
    roomKey = await prisma.roomKey.create({
      data: {
        bookingId: booking.id,
        roomId: booking.roomId,
        keyType: 'QR_CODE',
        keyData: `QR_KEY_${booking.id}_${Date.now()}`,
        validFrom: accessStartTime,
        validUntil: checkOutDate,
        maxUses: 1000,
        usedCount: 0,
        isActive: true,
        isRevoked: false
      }
    })
  }

  // Generate QR token payload
  const qrTokenPayload = {
    keyId: roomKey.id,
    bookingId: booking.externalBookingId,
    roomId: booking.room.id,
    roomNumber: booking.room.number,
    hotelId: booking.hotel.id,
    guestEmail: userEmail,
    keyType: 'QR_CODE',
    validUntil: roomKey.validUntil.toISOString(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(roomKey.validUntil.getTime() / 1000)
  }

  // Create signed JWT token
  const qrToken = jwt.sign(qrTokenPayload, process.env.JWT_SECRET || 'fallback-secret')

  // Generate QR code
  const qrCodeDataURL = await QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 256
  })

  console.log(`✅ QR code generated for room ${booking.room.number}`)

  res.json({
    success: true,
    message: 'QR code generated successfully',
    data: {
      qrCode: qrCodeDataURL,
      qrToken: qrToken,
      roomNumber: booking.room.number,
      hotelName: booking.hotel.name,
      expiresAt: roomKey.validUntil.toISOString(),
      remainingUses: roomKey.maxUses ? roomKey.maxUses - roomKey.usedCount : 'Unlimited'
    }
  })
}))

// NFC token generation
router.get('/nfc/:bookingId', authenticateToken, asyncHandler(async (req: any, res) => {
  const { bookingId } = req.params
  const userEmail = req.user.email

  console.log(`📱 NFC token generation request for booking ${bookingId} by ${userEmail}`)

  // Validate booking (same logic as QR)
  const booking = await prisma.booking.findFirst({
    where: {
      externalBookingId: bookingId,
      guestEmail: userEmail
    },
    include: {
      room: true,
      hotel: true
    }
  })

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or access denied'
    })
  }

  // Time validation
  const now = new Date()
  const checkInDate = new Date(booking.checkIn)
  const checkOutDate = new Date(booking.checkOut)
  const accessStartTime = new Date(checkInDate.getTime() - 3 * 60 * 60 * 1000)

  if (now < accessStartTime || now > checkOutDate) {
    return res.status(403).json({
      success: false,
      message: 'NFC token not available for this time period'
    })
  }

  // Find or create room key
  let roomKey = await prisma.roomKey.findFirst({
    where: {
      bookingId: booking.id,
      roomId: booking.roomId,
      keyType: 'NFC_TOKEN',
      isActive: true,
      isRevoked: false
    }
  })

  if (!roomKey) {
    roomKey = await prisma.roomKey.create({
      data: {
        bookingId: booking.id,
        roomId: booking.roomId,
        keyType: 'NFC_TOKEN',
        keyData: `NFC_KEY_${booking.id}_${Date.now()}`,
        validFrom: accessStartTime,
        validUntil: checkOutDate,
        maxUses: 1000,
        usedCount: 0,
        isActive: true,
        isRevoked: false
      }
    })
  }

  // Generate NFC token
  const nfcTokenPayload = {
    keyId: roomKey.id,
    bookingId: booking.externalBookingId,
    roomId: booking.room.id,
    roomNumber: booking.room.number,
    hotelId: booking.hotel.id,
    guestEmail: userEmail,
    keyType: 'NFC_TOKEN',
    validUntil: roomKey.validUntil.toISOString(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(roomKey.validUntil.getTime() / 1000)
  }

  const nfcToken = jwt.sign(nfcTokenPayload, process.env.JWT_SECRET || 'fallback-secret')

  console.log(`✅ NFC token generated for room ${booking.room.number}`)

  res.json({
    success: true,
    message: 'NFC token generated successfully',
    data: {
      nfcToken: nfcToken,
      roomNumber: booking.room.number,
      hotelName: booking.hotel.name,
      expiresAt: roomKey.validUntil.toISOString(),
      remainingUses: roomKey.maxUses ? roomKey.maxUses - roomKey.usedCount : 'Unlimited'
    }
  })
}))

// Verify and use key (for IoT devices/smart locks)
router.post('/verify', asyncHandler(async (req, res) => {
  const { keyToken, deviceId, roomId } = req.body

  if (!keyToken || !deviceId || !roomId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: keyToken, deviceId, roomId'
    })
  }

  try {
    // Verify JWT token
    const decoded: any = jwt.verify(keyToken, process.env.JWT_SECRET || 'fallback-secret')
    
    console.log(`🔐 Key verification request for room ${decoded.roomNumber} from device ${deviceId}`)

    // Validate token data
    if (decoded.roomId !== roomId) {
      return res.status(403).json({
        success: false,
        message: 'Key not valid for this room'
      })
    }

    // Check if key is still valid
    const now = new Date()
    const validUntil = new Date(decoded.validUntil)

    if (now > validUntil) {
      return res.status(403).json({
        success: false,
        message: 'Key has expired'
      })
    }

    // Get room key from database
    const roomKey = await prisma.roomKey.findUnique({
      where: { id: decoded.keyId },
      include: {
        booking: {
          include: {
            room: true,
            hotel: true
          }
        }
      }
    })

    if (!roomKey || !roomKey.isActive || roomKey.isRevoked) {
      return res.status(403).json({
        success: false,
        message: 'Key is not active or has been revoked'
      })
    }

    // Check usage limits
    if (roomKey.maxUses && roomKey.usedCount >= roomKey.maxUses) {
      return res.status(403).json({
        success: false,
        message: 'Key usage limit exceeded'
      })
    }

    // Simulate smart lock interaction (90% success rate)
    const unlockSuccess = Math.random() > 0.1

    // Update key usage
    await prisma.roomKey.update({
      where: { id: roomKey.id },
      data: {
        usedCount: { increment: 1 },
        updatedAt: new Date()
      }
    })

    // Log access attempt
    await prisma.accessLog.create({
      data: {
        keyId: roomKey.id,
        action: 'KEY_VERIFICATION',
        device: deviceId,
        success: unlockSuccess,
        errorMessage: unlockSuccess ? null : 'Smart lock timeout'
      }
    })

    if (unlockSuccess) {
      console.log(`✅ Key verified and room unlocked: ${decoded.roomNumber}`)
      res.json({
        success: true,
        accessGranted: true,
        message: 'Access granted - room unlocked',
        data: {
          roomNumber: decoded.roomNumber,
          unlockTime: new Date().toISOString(),
          remainingUses: roomKey.maxUses ? roomKey.maxUses - (roomKey.usedCount + 1) : 'Unlimited'
        }
      })
    } else {
      console.log(`❌ Key verified but unlock failed: ${decoded.roomNumber}`)
      res.status(500).json({
        success: false,
        accessGranted: false,
        message: 'Key valid but smart lock failed to respond'
      })
    }

  } catch (error: any) {
    console.error('Key verification error:', error)
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Access key has expired'
      })
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid access key'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Key verification failed'
    })
  }
}))

export default router