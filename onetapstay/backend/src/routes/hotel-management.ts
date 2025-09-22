import express, { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: any
}

const router = express.Router()
const prisma = new PrismaClient()

// Middleware to verify hotel admin authentication
const verifyHotelAdmin = (req: AuthenticatedRequest, res: Response, next: any) => {
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
    
    // Check if user is ADMIN or STAFF (hotel staff)
    if (decoded.role !== 'ADMIN' && decoded.role !== 'STAFF') {
      res.status(403).json({
        success: false,
        message: 'Access denied - Hotel admin access required'
      })
      return
    }

    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
    return
  }
}

/**
 * Get hotel WiFi configuration
 * GET /api/hotel/wifi-config/:hotelId
 */
router.get('/wifi-config/:hotelId', verifyHotelAdmin, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.hotelId

    // Fetch hotel and WiFi configuration
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        wifiConfig: true
      }
    })

    if (!hotel) {
      res.status(404).json({
        success: false,
        message: 'Hotel not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'WiFi configuration retrieved successfully',
      data: {
        hotel: {
          id: hotel.id,
          name: hotel.name,
          hasWifi: hotel.hasWifi
        },
        wifiConfig: hotel.wifiConfig
      }
    })
    return

  } catch (error) {
    console.error('Error fetching WiFi configuration:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
    return
  }
})

/**
 * Create or update hotel WiFi configuration
 * POST /api/hotel/wifi-config/:hotelId
 */
router.post('/wifi-config/:hotelId', [
  body('networkName').notEmpty().withMessage('Network name is required'),
  body('guestNetworkName').notEmpty().withMessage('Guest network name is required'),
  body('passwordFormat').notEmpty().withMessage('Password format is required'),
  body('securityType').isIn(['WPA2-Personal', 'WPA3-Personal', 'Open']).withMessage('Invalid security type'),
  body('bandwidth').notEmpty().withMessage('Bandwidth is required'),
  body('validityHours').isInt({ min: 1, max: 168 }).withMessage('Validity hours must be between 1 and 168 (1 week)'),
  body('autoConnect').isBoolean().withMessage('Auto connect must be boolean'),
  body('qrCodeEnabled').isBoolean().withMessage('QR code enabled must be boolean'),
  body('isActive').isBoolean().withMessage('Is active must be boolean')
], verifyHotelAdmin, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      })
      return
    }

    const hotelId = req.params.hotelId
    const {
      networkName,
      networkPassword,
      guestNetworkName,
      passwordFormat,
      securityType,
      bandwidth,
      connectionType,
      qrCodeEnabled,
      autoConnect,
      validityHours,
      supportInstructions,
      customInstructions,
      isActive
    } = req.body

    // Verify hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId }
    })

    if (!hotel) {
      res.status(404).json({
        success: false,
        message: 'Hotel not found'
      })
      return
    }

    // Create or update WiFi configuration
    const wifiConfig = await prisma.hotelWifiConfig.upsert({
      where: { hotelId },
      create: {
        hotelId,
        networkName,
        networkPassword,
        guestNetworkName,
        passwordFormat,
        securityType,
        bandwidth,
        connectionType: connectionType || 'automatic',
        qrCodeEnabled,
        autoConnect,
        validityHours,
        supportInstructions,
        customInstructions,
        isActive
      },
      update: {
        networkName,
        networkPassword,
        guestNetworkName,
        passwordFormat,
        securityType,
        bandwidth,
        connectionType: connectionType || 'automatic',
        qrCodeEnabled,
        autoConnect,
        validityHours,
        supportInstructions,
        customInstructions,
        isActive,
        updatedAt: new Date()
      }
    })

    // Update hotel WiFi status
    await prisma.hotel.update({
      where: { id: hotelId },
      data: { hasWifi: isActive }
    })

    res.status(200).json({
      success: true,
      message: 'WiFi configuration saved successfully',
      data: wifiConfig
    })
    return

  } catch (error) {
    console.error('Error saving WiFi configuration:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
    return
  }
})

/**
 * Get hotel dashboard data
 * GET /api/hotel/dashboard/:hotelId
 */
router.get('/dashboard/:hotelId', verifyHotelAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hotelId = req.params.hotelId

    // Fetch hotel with related data
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        rooms: {
          select: {
            id: true,
            number: true,
            type: true,
            basePrice: true,
            isAvailable: true
          }
        },
        bookings: {
          where: {
            status: {
              in: ['confirmed', 'pending', 'checked-in']
            }
          },
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
            status: true,
            room: {
              select: { number: true }
            }
          },
          orderBy: { checkIn: 'asc' },
          take: 10
        },
        wifiConfig: true,
        _count: {
          select: {
            rooms: true,
            bookings: {
              where: {
                status: {
                  in: ['confirmed', 'pending', 'checked-in']
                }
              }
            }
          }
        }
      }
    })

    if (!hotel) {
      res.status(404).json({
        success: false,
        message: 'Hotel not found'
      })
      return
    }

    // Calculate occupancy rate
    const totalRooms = hotel.rooms.length
    const occupiedRooms = hotel.rooms.filter(room => !room.isAvailable).length
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

    res.status(200).json({
      success: true,
      message: 'Hotel dashboard data retrieved successfully',
      data: {
        hotel: {
          id: hotel.id,
          name: hotel.name,
          address: hotel.address,
          city: hotel.city,
          state: hotel.state,
          phone: hotel.phone,
          email: hotel.email,
          hasWifi: hotel.hasWifi,
          isActive: hotel.isActive
        },
        stats: {
          totalRooms,
          occupiedRooms,
          occupancyRate: Math.round(occupancyRate),
          activeBookings: hotel._count.bookings
        },
        recentBookings: hotel.bookings,
        wifiStatus: {
          configured: !!hotel.wifiConfig,
          active: hotel.wifiConfig?.isActive || false,
          networkName: hotel.wifiConfig?.guestNetworkName || 'Not configured'
        }
      }
    })
    return

  } catch (error) {
    console.error('Error fetching hotel dashboard:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
    return
  }
})

/**
 * Get hotel bookings with WiFi access details
 * GET /api/hotel/bookings/:hotelId
 */
router.get('/bookings/:hotelId', verifyHotelAdmin, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.hotelId
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const status = req.query.status as string

    const whereClause: any = { hotelId }
    if (status && status !== 'all') {
      whereClause.status = status
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        guest: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        room: {
          select: {
            number: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const totalBookings = await prisma.booking.count({
      where: whereClause
    })

    res.status(200).json({
      success: true,
      message: 'Hotel bookings retrieved successfully',
      data: {
        bookings: bookings.map(booking => ({
          id: booking.id,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          status: booking.status,
          room: booking.room,
          totalAmount: booking.totalAmount,
          currency: booking.currency,
          confirmationCode: booking.confirmationCode
        })),
        pagination: {
          page,
          limit,
          total: totalBookings,
          pages: Math.ceil(totalBookings / limit)
        }
      }
    })
    return

  } catch (error) {
    console.error('Error fetching hotel bookings:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
    return
  }
})

export default router