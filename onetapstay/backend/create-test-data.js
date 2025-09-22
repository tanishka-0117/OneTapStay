const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTestData() {
  try {
    console.log('🔧 Creating test data...')

    // Create test user
    const user = await prisma.user.upsert({
      where: { email: 'test@onetapstay.com' },
      update: {},
      create: {
        email: 'test@onetapstay.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1999888777',
        role: 'GUEST',
        type: 'GUEST'
      }
    })
    console.log('✅ Created test user:', user.email)

    // Create hotel owner user
    const hotelOwner = await prisma.user.upsert({
      where: { email: 'owner@onetapstay.com' },
      update: {},
      create: {
        email: 'owner@onetapstay.com',
        firstName: 'Hotel',
        lastName: 'Owner',
        phone: '+1888777666',
        role: 'ADMIN',
        type: 'ADMIN'
      }
    })
    console.log('✅ Created hotel owner:', hotelOwner.email)

    // Create test hotel
    const hotel = await prisma.hotel.upsert({
      where: { userId: hotelOwner.id },
      update: {},
      create: {
        userId: hotelOwner.id,
        name: 'OneTapStay Test Hotel',
        description: 'A test hotel for OneTapStay system',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'USA',
        zipCode: '12345',
        phone: '+1555000001',
        email: 'hotel@onetapstay.com'
      }
    })
    console.log('✅ Created test hotel:', hotel.name)

    // Create test room
    const room = await prisma.room.upsert({
      where: { 
        hotelId_number: {
          hotelId: hotel.id,
          number: '101'
        }
      },
      update: {},
      create: {
        hotelId: hotel.id,
        number: '101',
        floor: 1,
        type: 'Standard',
        basePrice: 150.00
      }
    })
    console.log('✅ Created test room:', room.number)

    // Create test booking
    const booking = await prisma.booking.upsert({
      where: { confirmationCode: 'TEST001' },
      update: {},
      create: {
        confirmationCode: 'TEST001',
        guestId: user.id,
        hotelId: hotel.id,
        roomId: room.id,
        guestName: `${user.firstName} ${user.lastName}`,
        guestEmail: user.email,
        guestPhone: user.phone,
        checkIn: new Date('2025-09-22T15:00:00Z'),
        checkOut: new Date('2025-09-25T11:00:00Z'),
        status: 'CONFIRMED',
        guests: 1,
        totalAmount: 299.99
      }
    })
    console.log('✅ Created test booking:', booking.confirmationCode)

    // Create room key for this booking
    const roomKey = await prisma.roomKey.create({
      data: {
        bookingId: booking.id,
        roomId: room.id,
        keyType: 'DIGITAL',
        keyData: 'test-key-data-' + booking.id,
        validFrom: new Date('2025-09-22T15:00:00Z'),
        validUntil: new Date('2025-09-25T11:00:00Z'),
        maxUses: 50,
        usedCount: 0
      }
    })
    console.log('✅ Created room key for booking')

    console.log('\n🎉 Test data created successfully!')
    console.log('\n📋 Use these credentials to test:')
    console.log('   Email: test@onetapstay.com')
    console.log('   Booking ID: TEST001')
    console.log('   Room: 101')
    console.log('\n🔗 Room unlock URL: http://localhost:3000/unlock/' + booking.id)

  } catch (error) {
    console.error('❌ Error creating test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestData()