import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a demo user (hotel manager) first
  const hotelManager = await prisma.user.create({
    data: {
      phone: '+1234567890',
      firstName: 'Demo',
      lastName: 'Manager',
      email: 'manager@onetapstay.com',
      type: 'hotel',
      isVerified: true,
      preferredLanguage: 'en',
      timezone: 'UTC'
    }
  })

  // Create a demo hotel
  const hotel = await prisma.hotel.create({
    data: {
      userId: hotelManager.id,
      name: 'OneTapStay Demo Hotel',
      address: '123 Demo Street',
      city: 'Demo City',
      state: 'Demo State',
      country: 'Demo Country',
      zipCode: '12345',
      phone: '+1-555-0123',
      email: 'demo@onetapstay.com',
      description: 'A demonstration hotel for OneTapStay platform',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      hasWifi: true,
      hasPool: true,
      hasGym: true,
      hasRestaurant: true,
      hasSpa: true
    }
  })

  console.log(`✅ Created hotel: ${hotel.name}`)

  // Create demo rooms
  const roomTypes = [
    { name: 'Standard Room', price: 120.00, capacity: 2 },
    { name: 'Deluxe Room', price: 180.00, capacity: 2 },
    { name: 'Suite', price: 250.00, capacity: 4 },
    { name: 'Presidential Suite', price: 500.00, capacity: 6 }
  ]

  for (let i = 0; i < 20; i++) {
    const roomType = roomTypes[i % roomTypes.length]
    const roomNumber = `${Math.floor(i / 4) + 1}${String(i % 4 + 1).padStart(2, '0')}`
    
    await prisma.room.create({
      data: {
        hotelId: hotel.id,
        number: roomNumber,
        type: roomType.name,
        basePrice: roomType.price,
        capacity: roomType.capacity,
        beds: roomType.capacity / 2,
        bathrooms: 1,
        hasWifi: true,
        hasAC: true,
        hasTV: true,
        isAvailable: true,
        lockId: `lock_${roomNumber.toLowerCase()}`,
        lockType: 'qr'
      }
    })
  }

  console.log('✅ Created 20 demo rooms')

  console.log(`✅ Created demo user: ${hotelManager.firstName} ${hotelManager.lastName}`)

  // Create a demo guest user
  const guest = await prisma.user.create({
    data: {
      phone: '+1987654321',
      firstName: 'Demo',
      lastName: 'Guest',
      email: 'guest@example.com',
      type: 'guest',
      isVerified: true,
      preferredLanguage: 'en',
      timezone: 'UTC'
    }
  })

  // Create a loyalty account for the guest
  await prisma.loyaltyAccount.create({
    data: {
      userId: guest.id,
      currentPoints: 1500,
      totalEarned: 2000,
      totalRedeemed: 500,
      tier: 'silver',
      pointsToNextTier: 500
    }
  })

  console.log(`✅ Created demo guest: ${guest.firstName} ${guest.lastName}`)

  // Create a demo booking
  const room = await prisma.room.findFirst({
    where: { hotelId: hotel.id }
  })

  if (room) {
    const totalAmount = room.basePrice * 2 // 2 nights
    
    const booking = await prisma.booking.create({
      data: {
        guestId: guest.id,
        hotelId: hotel.id,
        roomId: room.id,
        checkIn: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Day after tomorrow
        guests: 2,
        totalAmount: totalAmount,
        status: 'confirmed',
        guestName: `${guest.firstName} ${guest.lastName}`,
        guestEmail: guest.email || '',
        guestPhone: guest.phone,
        specialRequests: 'Late check-in requested'
      }
    })

    console.log(`✅ Created demo booking: ${booking.id}`)

    // Create a payment for the booking
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: totalAmount,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'card',
        stripePaymentIntentId: 'pi_demo_payment_intent',
        description: 'Room booking payment',
        metadata: JSON.stringify({
          cardLast4: '4242',
          cardBrand: 'visa'
        })
      }
    })

    console.log('✅ Created demo payment')
  }

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })