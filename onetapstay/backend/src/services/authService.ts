import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface LoginCredentials {
  email: string
  password?: string
  bookingId?: string
}

interface AuthResult {
  success: boolean
  user?: any
  token?: string
  role?: string
  message?: string
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
  private readonly JWT_EXPIRES_IN = '24h'

  /**
   * Unified login method for both staff and guests
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { email, password, bookingId } = credentials

    try {
      // Try staff/admin login first (requires password)
      if (password) {
        return await this.staffLogin(email, password)
      }

      // Try guest login (requires booking ID)
      if (bookingId) {
        return await this.guestLogin(email, bookingId)
      }

      return {
        success: false,
        message: 'Please provide either password (for staff) or booking ID (for guests)'
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: 'An error occurred during login'
      }
    }
  }

  /**
   * Staff/Admin login with email and password
   */
  private async staffLogin(email: string, password: string): Promise<AuthResult> {
    // Find user with staff or admin role
    const user = await prisma.user.findFirst({
      where: {
        email,
        role: { in: ['STAFF', 'ADMIN'] },
        isActive: true
      },
      include: {
        staffAccount: true
      }
    })

    if (!user || !user.password) {
      return {
        success: false,
        message: 'Invalid staff credentials'
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid staff credentials'
      }
    }

    // Update last login
    if (user.staffAccount) {
      await prisma.staffAccount.update({
        where: { userId: user.id },
        data: { lastLogin: new Date() }
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    )

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        staffAccount: user.staffAccount
      },
      token,
      role: user.role,
      message: `Welcome back, ${user.firstName || 'Staff Member'}!`
    }
  }

  /**
   * Guest login with email and booking ID
   */
  private async guestLogin(email: string, bookingId: string): Promise<AuthResult> {
    // Find booking with matching email and booking ID
    const booking = await prisma.booking.findFirst({
      where: {
        externalBookingId: bookingId,
        guestEmail: email,
        status: { in: ['confirmed', 'checked-in'] }
      },
      include: {
        guest: true,
        room: {
          include: {
            hotel: true
          }
        }
      }
    })

    if (!booking) {
      return {
        success: false,
        message: 'Invalid booking credentials. Please check your booking ID and email.'
      }
    }

    let user = booking.guest

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          role: 'GUEST',
          type: 'guest',
          isVerified: true,
          firstName: booking.guestName?.split(' ')[0] || 'Guest',
          lastName: booking.guestName?.split(' ').slice(1).join(' ') || ''
        }
      })

      // Link booking to user
      await prisma.booking.update({
        where: { id: booking.id },
        data: { guestId: user.id }
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        bookingId: booking.id
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    )

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        booking: {
          id: booking.id,
          externalBookingId: booking.externalBookingId,
          roomNumber: booking.room?.number,
          hotelName: booking.room?.hotel?.name,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          status: booking.status
        }
      },
      token,
      role: user.role,
      message: `Welcome, ${user.firstName}! Your booking is confirmed.`
    }
  }

  /**
   * Create a new staff member (admin only)
   */
  async createStaffMember(staffData: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: 'STAFF' | 'ADMIN'
    department?: string
    position?: string
    employeeId?: string
  }) {
    const { email, password, firstName, lastName, role, department, position, employeeId } = staffData

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and staff account in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          type: role.toLowerCase(),
          isActive: true,
          isVerified: true
        }
      })

      const staffAccount = await tx.staffAccount.create({
        data: {
          userId: user.id,
          employeeId,
          department,
          position,
          permissions: JSON.stringify([
            'view_bookings',
            'manage_bookings',
            'view_alarms',
            ...(role === 'ADMIN' ? ['manage_staff', 'system_settings'] : [])
          ]),
          hiredAt: new Date()
        }
      })

      return { user, staffAccount }
    })

    return {
      success: true,
      message: 'Staff member created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        staffAccount: result.staffAccount
      }
    }
  }

  /**
   * Verify JWT token and get user info
   */
  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          staffAccount: true
        }
      })

      if (!user || !user.isActive) {
        throw new Error('Invalid token')
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          staffAccount: user.staffAccount
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Invalid or expired token'
      }
    }
  }
}

export const authService = new AuthService()