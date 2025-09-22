const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestRoom() {
  try {
    // Get the demo hotel
    const hotel = await prisma.hotel.findFirst()
    if (!hotel) {
      console.log('❌ No hotel found')
      return
    }

    // Check if room already exists
    let room = await prisma.room.findFirst({
      where: { 
        hotelId: hotel.id,
        number: '101'
      }
    })

    if (!room) {
      // Create a test room
      room = await prisma.room.create({
        data: {
          hotelId: hotel.id,
          number: '101',
          type: 'Standard Room',
          floor: 1,
          capacity: 2,
          basePrice: 120.00,
          description: 'A comfortable standard room with modern amenities',
          amenities: JSON.stringify(['WiFi', 'AC', 'TV', 'Mini Bar']),
          isAvailable: true,
          isActive: true
        }
      })
      console.log('✅ Created test room:', room.number)
    }

    // Update our test booking to use this room
    const booking = await prisma.booking.findFirst({
      where: { externalBookingId: 'TEST123' }
    })

    if (booking && booking.roomId !== room.id) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { roomId: room.id }
      })
      console.log('✅ Updated booking to use room 101')
    }

    console.log('✅ Room setup complete!')
    console.log(`🏨 Hotel: ${hotel.name}`)
    console.log(`🏠 Room: ${room.number} (${room.type})`)
    console.log(`🎫 Booking ID: TEST123`)
    console.log(`📧 Email: test@example.com`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestRoom()