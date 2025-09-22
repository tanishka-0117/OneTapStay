const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createSampleData() {
  try {
    console.log('Creating sample facilities and journey events...')

    // Get the first hotel
    const hotel = await prisma.hotel.findFirst()
    if (!hotel) {
      console.log('No hotel found. Please run the seed script first.')
      return
    }

    console.log(`Found hotel: ${hotel.name}`)

    // Create sample facilities
    const restaurant = await prisma.facility.create({
      data: {
        hotelId: hotel.id,
        name: 'Restaurant',
        type: 'dining',
        description: 'Fine dining restaurant with local and international cuisine',
        location: 'Ground Floor, Main Building',
        operatingHours: JSON.stringify({
          breakfast: '07:00-10:00',
          lunch: '12:00-15:00',
          dinner: '18:00-22:00'
        }),
        isActive: true,
        requiresPayment: true,
        allowsCredit: true
      }
    })

    const pool = await prisma.facility.create({
      data: {
        hotelId: hotel.id,
        name: 'Swimming Pool',
        type: 'recreation',
        description: 'Olympic-size swimming pool with pool bar',
        location: 'Pool Deck, 2nd Floor',
        operatingHours: JSON.stringify({
          daily: '06:00-22:00'
        }),
        isActive: true,
        requiresPayment: false,
        allowsCredit: true
      }
    })

    const gym = await prisma.facility.create({
      data: {
        hotelId: hotel.id,
        name: 'Fitness Center',
        type: 'wellness',
        description: 'Fully equipped fitness center with modern equipment',
        location: 'Basement Level',
        operatingHours: JSON.stringify({
          daily: '05:00-23:00'
        }),
        isActive: true,
        requiresPayment: false,
        allowsCredit: false
      }
    })

    const spa = await prisma.facility.create({
      data: {
        hotelId: hotel.id,
        name: 'Spa & Wellness',
        type: 'wellness',
        description: 'Luxurious spa offering massages and wellness treatments',
        location: '3rd Floor, West Wing',
        operatingHours: JSON.stringify({
          daily: '09:00-21:00'
        }),
        isActive: true,
        requiresPayment: true,
        allowsCredit: true
      }
    })

    console.log('Created facilities:', {
      restaurant: restaurant.name,
      pool: pool.name,
      gym: gym.name,
      spa: spa.name
    })

    // Create sample services for restaurant
    await prisma.facilityService.createMany({
      data: [
        {
          facilityId: restaurant.id,
          name: 'Continental Breakfast',
          description: 'Full breakfast buffet with continental options',
          price: 25.00,
          currency: 'USD',
          category: 'food',
          isActive: true
        },
        {
          facilityId: restaurant.id,
          name: 'Lunch Menu',
          description: 'À la carte lunch menu',
          price: 35.00,
          currency: 'USD',
          category: 'food',
          isActive: true
        },
        {
          facilityId: restaurant.id,
          name: 'Dinner Set Menu',
          description: 'Three-course dinner set menu',
          price: 65.00,
          currency: 'USD',
          category: 'food',
          isActive: true
        }
      ]
    })

    // Create sample services for spa
    await prisma.facilityService.createMany({
      data: [
        {
          facilityId: spa.id,
          name: 'Swedish Massage',
          description: '60-minute relaxing Swedish massage',
          price: 120.00,
          currency: 'USD',
          category: 'service',
          isActive: true
        },
        {
          facilityId: spa.id,
          name: 'Facial Treatment',
          description: 'Rejuvenating facial treatment',
          price: 85.00,
          currency: 'USD',
          category: 'service',
          isActive: true
        }
      ]
    })

    // Get first booking to create journey events
    const booking = await prisma.booking.findFirst({
      include: {
        guest: true,
        room: true
      }
    })

    if (booking) {
      console.log(`Creating journey events for booking: ${booking.confirmationCode}`)

      // Create sample journey events
      await prisma.guestJourneyEvent.createMany({
        data: [
          {
            bookingId: booking.id,
            eventType: 'check_in',
            title: 'Checked In',
            description: `Welcome to ${hotel.name}! You've been checked into Room ${booking.room.number}`,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            metadata: JSON.stringify({
              roomNumber: booking.room.number,
              checkInTime: new Date().toISOString()
            })
          },
          {
            bookingId: booking.id,
            eventType: 'door_access',
            title: 'Room Access',
            description: 'Successfully unlocked your room using digital key',
            timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
            metadata: JSON.stringify({
              accessMethod: 'digital_key',
              roomNumber: booking.room.number
            })
          },
          {
            bookingId: booking.id,
            eventType: 'facility_visit',
            title: 'Swimming Pool Visit',
            description: 'Enjoyed the pool facilities',
            facilityId: pool.id,
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            metadata: JSON.stringify({
              facilityName: pool.name,
              visitDuration: '45 minutes'
            })
          },
          {
            bookingId: booking.id,
            eventType: 'facility_visit',
            title: 'Fitness Center Visit',
            description: 'Used the gym facilities',
            facilityId: gym.id,
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            metadata: JSON.stringify({
              facilityName: gym.name,
              visitDuration: '30 minutes'
            })
          }
        ]
      })

      console.log('Created sample journey events for guest')
    }

    console.log('✅ Sample data created successfully!')
    console.log('\nFacilities created:')
    console.log('- Restaurant (with breakfast, lunch, dinner services)')
    console.log('- Swimming Pool')
    console.log('- Fitness Center')
    console.log('- Spa & Wellness (with massage and facial services)')
    console.log('\nJourney events created:')
    console.log('- Check-in event')
    console.log('- Room access event')
    console.log('- Pool visit event')
    console.log('- Gym visit event')

  } catch (error) {
    console.error('Error creating sample data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleData()