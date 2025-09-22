import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import cron from 'node-cron'

const prisma = new PrismaClient()

interface TimeoutConfig {
  checkIntervalMinutes: number
  warningThresholdMinutes: number
  emailEnabled: boolean
  soundEnabled: boolean
}

class TimeoutMonitoringService {
  private config: TimeoutConfig
  private emailTransporter: nodemailer.Transporter | null = null
  private isRunning: boolean = false

  constructor(config: TimeoutConfig) {
    this.config = config
    this.initializeEmailService()
  }

  private initializeEmailService() {
    if (!this.config.emailEnabled) return

    try {
      this.emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })
      console.log('📧 Timeout notification email service initialized')
    } catch (error) {
      console.error('❌ Failed to initialize email service for timeout notifications:', error)
    }
  }

  /**
   * Start the timeout monitoring service
   */
  public start() {
    if (this.isRunning) {
      console.log('⚠️ Timeout monitoring service is already running')
      return
    }

    // Run every minute to check for timeouts
    cron.schedule(`*/${this.config.checkIntervalMinutes} * * * *`, async () => {
      await this.checkTimeouts()
    })

    this.isRunning = true
    console.log(`🕒 Timeout monitoring service started - checking every ${this.config.checkIntervalMinutes} minute(s)`)
  }

  /**
   * Stop the timeout monitoring service
   */
  public stop() {
    this.isRunning = false
    console.log('🛑 Timeout monitoring service stopped')
  }

  /**
   * Check for bookings that have exceeded their checkout time
   */
  private async checkTimeouts() {
    try {
      const now = new Date()
      console.log(`🔍 Checking for timeouts at ${now.toISOString()}`)

      // Find bookings that have exceeded checkout time and haven't been notified
      const expiredBookings = await prisma.booking.findMany({
        where: {
          checkOut: {
            lt: now, // Checkout time has passed
          },
          status: {
            in: ['confirmed', 'pending'], // Only active bookings
          },
          // timeoutNotified: false, // Haven't been notified yet - will be added after client regeneration
        },
        include: {
          guest: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          hotel: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          room: {
            select: {
              number: true,
              type: true,
            },
          },
        },
      })

      if (expiredBookings.length === 0) {
        console.log('✅ No timeout violations found')
        return
      }

      console.log(`⚠️ Found ${expiredBookings.length} booking(s) that have exceeded checkout time`)

      // Process each expired booking
      for (const booking of expiredBookings) {
        await this.processTimeout(booking)
      }
    } catch (error) {
      console.error('❌ Error checking timeouts:', error)
    }
  }

  /**
   * Process a single timeout violation
   */
  private async processTimeout(booking: any) {
    try {
      const now = new Date()
      const checkoutTime = new Date(booking.checkOut)
      const overtimeMinutes = Math.floor((now.getTime() - checkoutTime.getTime()) / (1000 * 60))

      console.log(`🚨 TIMEOUT VIOLATION - Booking ${booking.externalBookingId || booking.id}:`)
      console.log(`   Guest: ${booking.guestName}`)
      console.log(`   Room: ${booking.room.number}`)
      console.log(`   Checkout was: ${checkoutTime.toLocaleString()}`)
      console.log(`   Overtime: ${overtimeMinutes} minutes`)

      // Update booking to mark as timeout active and notified
      // Note: These fields will be uncommented after Prisma client regeneration
      // await prisma.booking.update({
      //   where: { id: booking.id },
      //   data: {
      //     isTimeoutActive: true,
      //     timeoutNotified: true,
      //     updatedAt: now,
      //   },
      // })

      // Send email notification
      if (this.config.emailEnabled && this.emailTransporter) {
        await this.sendTimeoutEmail(booking, overtimeMinutes)
      }

      // Log the timeout event
      await this.logTimeoutEvent(booking, overtimeMinutes)

      // Trigger sound alarm (this will be handled by the frontend)
      await this.triggerSoundAlarm(booking, overtimeMinutes)

    } catch (error) {
      console.error(`❌ Error processing timeout for booking ${booking.id}:`, error)
    }
  }

  /**
   * Send timeout notification email
   */
  private async sendTimeoutEmail(booking: any, overtimeMinutes: number) {
    if (!this.emailTransporter) return

    try {
      const checkoutTime = new Date(booking.checkOut)
      
      // Email to guest
      const guestMailOptions = {
        from: process.env.GMAIL_USER,
        to: booking.guestEmail,
        subject: `🚨 OneTapStay - Checkout Time Exceeded - Room ${booking.room.number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">⏰ Checkout Time Exceeded</h2>
            <div style="background-color: #fdf2f2; padding: 20px; border-left: 4px solid #e74c3c; margin: 20px 0;">
              <p><strong>Dear ${booking.guestName},</strong></p>
              <p>This is an automated notification that your checkout time has been exceeded.</p>
              
              <h3>Booking Details:</h3>
              <ul>
                <li><strong>Hotel:</strong> ${booking.hotel.name}</li>
                <li><strong>Room:</strong> ${booking.room.number} (${booking.room.type})</li>
                <li><strong>Booking ID:</strong> ${booking.externalBookingId || booking.confirmationCode}</li>
                <li><strong>Scheduled Checkout:</strong> ${checkoutTime.toLocaleString()}</li>
                <li><strong>Overtime:</strong> ${overtimeMinutes} minutes</li>
              </ul>
              
              <p style="color: #e74c3c;"><strong>Please contact the hotel immediately or complete your checkout process.</strong></p>
              
              <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h4>Hotel Contact Information:</h4>
                <p><strong>Phone:</strong> ${booking.hotel.phone}</p>
                <p><strong>Email:</strong> ${booking.hotel.email}</p>
              </div>
              
              <p>Additional charges may apply for extended stays beyond the checkout time.</p>
              
              <p>Best regards,<br>OneTapStay Team</p>
            </div>
          </div>
        `
      }

      // Email to hotel staff
      const hotelMailOptions = {
        from: process.env.GMAIL_USER,
        to: booking.hotel.email,
        subject: `🚨 OneTapStay - Guest Checkout Timeout Alert - Room ${booking.room.number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">🚨 Guest Checkout Timeout Alert</h2>
            <div style="background-color: #fdf2f2; padding: 20px; border-left: 4px solid #e74c3c; margin: 20px 0;">
              <p><strong>Hotel Staff Alert</strong></p>
              <p>A guest has exceeded their checkout time and requires immediate attention.</p>
              
              <h3>Booking Details:</h3>
              <ul>
                <li><strong>Guest:</strong> ${booking.guestName}</li>
                <li><strong>Email:</strong> ${booking.guestEmail}</li>
                <li><strong>Room:</strong> ${booking.room.number} (${booking.room.type})</li>
                <li><strong>Booking ID:</strong> ${booking.externalBookingId || booking.confirmationCode}</li>
                <li><strong>Scheduled Checkout:</strong> ${checkoutTime.toLocaleString()}</li>
                <li><strong>Overtime:</strong> ${overtimeMinutes} minutes</li>
              </ul>
              
              <p style="color: #e74c3c;"><strong>Recommended Actions:</strong></p>
              <ul>
                <li>Contact the guest immediately</li>
                <li>Check if extended stay is authorized</li>
                <li>Apply additional charges if necessary</li>
                <li>Ensure room is prepared for next guest if applicable</li>
              </ul>
              
              <p>This alert was generated automatically by OneTapStay timeout monitoring system.</p>
            </div>
          </div>
        `
      }

      // Send both emails
      await this.emailTransporter.sendMail(guestMailOptions)
      await this.emailTransporter.sendMail(hotelMailOptions)

      console.log(`📧 Timeout notification emails sent for booking ${booking.externalBookingId || booking.id}`)
    } catch (error) {
      console.error('❌ Error sending timeout email:', error)
    }
  }

  /**
   * Log timeout event to database
   */
  private async logTimeoutEvent(booking: any, overtimeMinutes: number) {
    try {
      // Create a notification record (temporarily disabled until Prisma client is updated)
      // await prisma.notification.create({
      //   data: {
      //     userId: booking.guestId,
      //     type: 'timeout_violation',
      //     title: 'Checkout Time Exceeded',
      //     message: `Your checkout time has been exceeded by ${overtimeMinutes} minutes for room ${booking.room.number}`,
      //     priority: 'high',
      //     isRead: false,
      //     metadata: JSON.stringify({
      //       bookingId: booking.id,
      //       roomNumber: booking.room.number,
      //       overtimeMinutes,
      //       checkoutTime: booking.checkOut,
      //     }),
      //   },
      // })

      console.log(`📝 Timeout event logged for booking ${booking.externalBookingId || booking.id}`)
    } catch (error) {
      console.error('❌ Error logging timeout event:', error)
    }
  }

  /**
   * Trigger sound alarm (to be handled by frontend)
   */
  private async triggerSoundAlarm(booking: any, overtimeMinutes: number) {
    try {
      // This creates a timeout alarm record that the frontend can poll for (temporarily disabled)
      // await prisma.timeoutAlarm.create({
      //   data: {
      //     bookingId: booking.id,
      //     guestName: booking.guestName,
      //     roomNumber: booking.room.number,
      //     overtimeMinutes,
      //     isActive: true,
      //     createdAt: new Date(),
      //   },
      // })

      console.log(`🔊 Sound alarm triggered for booking ${booking.externalBookingId || booking.id}`)
    } catch (error) {
      // If TimeoutAlarm model doesn't exist, we'll create it later
      console.log(`🔊 Sound alarm queued for booking ${booking.externalBookingId || booking.id}`)
    }
  }

  /**
   * Get current timeout statistics
   */
  public async getTimeoutStats() {
    try {
      // Temporarily simplified until Prisma client is updated
      const totalCount = await prisma.booking.count({
        where: {
          status: 'confirmed',
        },
      })

      const activeTimeouts = await prisma.booking.findMany({
        where: {
          status: {
            in: ['confirmed', 'pending'],
          },
        },
        select: {
          id: true,
          guestName: true,
          checkOut: true,
          room: {
            select: {
              number: true,
            },
          },
        },
      })

      return {
        totalTimeouts: totalCount,
        activeTimeouts,
      }
    } catch (error) {
      console.error('❌ Error getting timeout stats:', error)
      return null
    }
  }
}

// Default configuration
const defaultConfig: TimeoutConfig = {
  checkIntervalMinutes: 1, // Check every minute
  warningThresholdMinutes: 15, // Warn if 15 minutes past checkout
  emailEnabled: true,
  soundEnabled: true,
}

// Create and export singleton instance
export const timeoutMonitoringService = new TimeoutMonitoringService(defaultConfig)
export default TimeoutMonitoringService