const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addTestBooking() {
  try {
    // First check if we have existing data
    const existingUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    })

    let testGuest = existingUser
    if (!testGuest) {
      testGuest = await prisma.user.create({
        data: {
          phone: '+1234567899',
          firstName: 'Test',
          lastName: 'Guest', 
          email: 'test@example.com',
          type: 'guest',
          isVerified: true
        }
      })
    }

    // Find the demo hotel
    const hotel = await prisma.hotel.findFirst()
    if (!hotel) {
      console.log('❌ No hotel found, run seed first')
      return
    }

    // Find a room
    const room = await prisma.room.findFirst({
      where: { hotelId: hotel.id }
    })
    if (!room) {
      console.log('❌ No room found')
      return
    }

    // Create test booking with externalBookingId
    const booking = await prisma.booking.create({
      data: {
        guestId: testGuest.id,
        hotelId: hotel.id,
        roomId: room.id,
        checkIn: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Day after tomorrow
        guests: 1,
        totalAmount: 200.00,
        status: 'confirmed',
        guestName: 'Test Guest',
        guestEmail: 'test@example.com',
        guestPhone: '+1234567899',
        externalBookingId: 'TEST123', // This is the key field for validation
        specialRequests: 'Test booking for OTP validation'
      }
    })

    console.log('✅ Test booking created:')
    console.log(`📧 Email: ${booking.guestEmail}`)
    console.log(`🎫 Booking ID: ${booking.externalBookingId}`)
    console.log(`🏨 Hotel: ${hotel.name}`)
    console.log('Use these credentials to test OTP validation!')

  } catch (error) {
    console.error('❌ Error creating test booking:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestBooking()