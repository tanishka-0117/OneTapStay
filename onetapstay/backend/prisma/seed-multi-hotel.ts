import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding for multi-hotel platform...')

  // Create sample users for hotels
  const hotelUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@grandplaza.com' },
      update: {},
      create: {
        email: 'admin@grandplaza.com',
        firstName: 'Grand Plaza',
        lastName: 'Admin',
        phone: '+1-555-0101',
        isVerified: true,
        role: 'ADMIN',
        type: 'ADMIN'
      }
    }),
    
    prisma.user.upsert({
      where: { email: 'admin@oceanviewresort.com' },
      update: {},
      create: {
        email: 'admin@oceanviewresort.com',
        firstName: 'Ocean View',
        lastName: 'Admin',
        phone: '+1-555-0102',
        isVerified: true,
        role: 'ADMIN',
        type: 'ADMIN'
      }
    }),

    prisma.user.upsert({
      where: { email: 'admin@citycenterlodge.com' },
      update: {},
      create: {
        email: 'admin@citycenterlodge.com',
        firstName: 'City Center',
        lastName: 'Admin',
        phone: '+1-555-0103',
        isVerified: true,
        role: 'ADMIN',
        type: 'ADMIN'
      }
    })
  ])

  console.log('✅ Created hotel admin users')

  // Create sample hotels
  const hotels = await Promise.all([
    prisma.hotel.upsert({
      where: { userId: hotelUsers[0].id },
      update: {},
      create: {
        userId: hotelUsers[0].id,
        name: 'Grand Plaza Hotel',
        description: 'Luxury hotel in the heart of downtown with world-class amenities',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001',
        phone: '+1-555-123-4567',
        email: 'info@grandplaza.com',
        website: 'https://grandplaza.com',
        checkInTime: '15:00',
        checkOutTime: '11:00',
        currency: 'USD',
        timezone: 'America/New_York',
        hasWifi: true,
        hasParking: true,
        hasPool: true,
        hasGym: true,
        hasSpa: true,
        hasRestaurant: true,
        isActive: true,
        isVerified: true
      }
    }),

    prisma.hotel.upsert({
      where: { userId: hotelUsers[1].id },
      update: {},
      create: {
        userId: hotelUsers[1].id,
        name: 'Ocean View Resort',
        description: 'Beachfront resort with stunning ocean views and tropical ambiance',
        address: '456 Beach Boulevard',
        city: 'Miami',
        state: 'FL',
        country: 'USA',
        zipCode: '33139',
        phone: '+1-555-789-0123',
        email: 'reservations@oceanviewresort.com',
        website: 'https://oceanviewresort.com',
        checkInTime: '16:00',
        checkOutTime: '10:00',
        currency: 'USD',
        timezone: 'America/Miami',
        hasWifi: true,
        hasParking: true,
        hasPool: true,
        hasGym: false,
        hasSpa: true,
        hasRestaurant: true,
        isActive: true,
        isVerified: true
      }
    }),

    prisma.hotel.upsert({
      where: { userId: hotelUsers[2].id },
      update: {},
      create: {
        userId: hotelUsers[2].id,
        name: 'City Center Lodge',
        description: 'Modern boutique hotel perfect for business travelers',
        address: '789 Business District',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        zipCode: '60601',
        phone: '+1-555-456-7890',
        email: 'contact@citycenterlodge.com',
        website: 'https://citycenterlodge.com',
        checkInTime: '14:30',
        checkOutTime: '12:00',
        currency: 'USD',
        timezone: 'America/Chicago',
        hasWifi: true,
        hasParking: false,
        hasPool: false,
        hasGym: true,
        hasSpa: false,
        hasRestaurant: false,
        isActive: true,
        isVerified: true
      }
    })
  ])

  console.log('✅ Created hotels')

  // Create WiFi configurations for each hotel
  const wifiConfigs = await Promise.all([
    // Grand Plaza Hotel WiFi Config
    prisma.hotelWifiConfig.upsert({
      where: { hotelId: hotels[0].id },
      update: {},
      create: {
        hotelId: hotels[0].id,
        networkName: 'GrandPlaza_Staff',
        networkPassword: 'GrandPlaza2025!',
        guestNetworkName: 'GrandPlaza_Guest',
        passwordFormat: 'GP_{BOOKING_ID}_{YEAR}',
        securityType: 'WPA2-Personal',
        bandwidth: '100 Mbps',
        connectionType: 'automatic',
        qrCodeEnabled: true,
        autoConnect: true,
        validityHours: 72,
        supportInstructions: 'For WiFi assistance, call front desk at ext. 0 or visit our concierge.',
        customInstructions: 'Welcome to Grand Plaza! Connect automatically or scan the QR code provided in your room.',
        isActive: true
      }
    }),

    // Ocean View Resort WiFi Config
    prisma.hotelWifiConfig.upsert({
      where: { hotelId: hotels[1].id },
      update: {},
      create: {
        hotelId: hotels[1].id,
        networkName: 'OceanView_Internal',
        networkPassword: 'OceanBreeze2025',
        guestNetworkName: 'OceanView_Resort',
        passwordFormat: 'OCEAN_{ROOM_NUMBER}_{BOOKING_ID}',
        securityType: 'WPA3-Personal',
        bandwidth: '50 Mbps',
        connectionType: 'automatic',
        qrCodeEnabled: true,
        autoConnect: true,
        validityHours: 96, // 4 days
        supportInstructions: 'Need help? Visit the Beach Cabana or call our 24/7 guest services.',
        customInstructions: 'Surf the web with Ocean View! Your WiFi access is valid throughout your entire stay.',
        isActive: true
      }
    }),

    // City Center Lodge WiFi Config
    prisma.hotelWifiConfig.upsert({
      where: { hotelId: hotels[2].id },
      update: {},
      create: {
        hotelId: hotels[2].id,
        networkName: 'CityCenter_Business',
        networkPassword: 'Business2025Secure',
        guestNetworkName: 'CityCenter_Lodge',
        passwordFormat: 'CC{HOTEL_NAME}{YEAR}',
        securityType: 'WPA2-Personal',
        bandwidth: '75 Mbps',
        connectionType: 'automatic',
        qrCodeEnabled: false, // Business hotel, QR codes disabled
        autoConnect: true,
        validityHours: 48,
        supportInstructions: 'Business center available 24/7 for technical support.',
        customInstructions: 'Professional-grade WiFi for all your business needs. Contact front desk for conference room connectivity.',
        isActive: true
      }
    })
  ])

  console.log('✅ Created WiFi configurations')

  // Create sample rooms for each hotel
  const rooms = []
  
  // Grand Plaza rooms (luxury suites)
  for (let i = 1; i <= 5; i++) {
    const room = await prisma.room.create({
      data: {
        hotelId: hotels[0].id,
        number: `${100 + i}`,
        type: i <= 2 ? 'Presidential Suite' : 'Deluxe Suite',
        capacity: 4,
        beds: 2,
        basePrice: i <= 2 ? 500 : 300,
        isAvailable: true
      }
    })
    rooms.push(room)
  }

  // Ocean View rooms (beach view)
  for (let i = 1; i <= 5; i++) {
    const room = await prisma.room.create({
      data: {
        hotelId: hotels[1].id,
        number: `${200 + i}`,
        type: i <= 2 ? 'Ocean Front Suite' : 'Beach View Room',
        capacity: 3,
        beds: 2,
        basePrice: i <= 2 ? 400 : 250,
        isAvailable: true
      }
    })
    rooms.push(room)
  }

  // City Center rooms (business)
  for (let i = 1; i <= 5; i++) {
    const room = await prisma.room.create({
      data: {
        hotelId: hotels[2].id,
        number: `${300 + i}`,
        type: i <= 2 ? 'Executive Suite' : 'Business Room',
        capacity: 2,
        beds: 1,
        basePrice: i <= 2 ? 350 : 200,
        isAvailable: true
      }
    })
    rooms.push(room)
  }

  console.log('✅ Created hotel rooms')

  // Create sample guest users
  const guestUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john.doe@email.com' },
      update: {},
      create: {
        email: 'john.doe@email.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-111-2222',
        isVerified: true,
        role: 'GUEST',
        type: 'GUEST'
      }
    }),

    prisma.user.upsert({
      where: { email: 'sarah.wilson@email.com' },
      update: {},
      create: {
        email: 'sarah.wilson@email.com',
        firstName: 'Sarah',
        lastName: 'Wilson',
        phone: '+1-555-333-4444',
        isVerified: true,
        role: 'GUEST',
        type: 'GUEST'
      }
    }),

    prisma.user.upsert({
      where: { email: 'mike.johnson@email.com' },
      update: {},
      create: {
        email: 'mike.johnson@email.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        phone: '+1-555-555-6666',
        isVerified: true,
        role: 'GUEST',
        type: 'GUEST'
      }
    })
  ])

  console.log('✅ Created guest users')

  // Create sample bookings for different hotels
  const bookings = await Promise.all([
    // Grand Plaza booking
    prisma.booking.create({
      data: {
        guestId: guestUsers[0].id,
        hotelId: hotels[0].id,
        roomId: rooms[0].id, // Presidential Suite
        checkIn: new Date('2025-01-15T15:00:00Z'),
        checkOut: new Date('2025-01-18T11:00:00Z'),
        guests: 2,
        totalAmount: 1500.00,
        currency: 'USD',
        status: 'confirmed',
        guestName: 'John Doe',
        guestEmail: 'john.doe@email.com',
        guestPhone: '+1-555-111-2222',
        specialRequests: 'Late checkout requested',
        confirmationCode: 'GP2025001'
      }
    }),

    // Ocean View booking
    prisma.booking.create({
      data: {
        guestId: guestUsers[1].id,
        hotelId: hotels[1].id,
        roomId: rooms[5].id, // Ocean Front Suite
        checkIn: new Date('2025-01-20T16:00:00Z'),
        checkOut: new Date('2025-01-25T10:00:00Z'),
        guests: 3,
        totalAmount: 2200.00,
        currency: 'USD',
        status: 'confirmed',
        guestName: 'Sarah Wilson',
        guestEmail: 'sarah.wilson@email.com',
        guestPhone: '+1-555-333-4444',
        specialRequests: 'Beach view room preferred',
        confirmationCode: 'OV2025002'
      }
    }),

    // City Center booking
    prisma.booking.create({
      data: {
        guestId: guestUsers[2].id,
        hotelId: hotels[2].id,
        roomId: rooms[10].id, // Executive Suite
        checkIn: new Date('2025-01-12T14:30:00Z'),
        checkOut: new Date('2025-01-15T12:00:00Z'),
        guests: 1,
        totalAmount: 800.00,
        currency: 'USD',
        status: 'confirmed',
        guestName: 'Mike Johnson',
        guestEmail: 'mike.johnson@email.com',
        guestPhone: '+1-555-555-6666',
        specialRequests: 'Business center access needed',
        confirmationCode: 'CC2025003'
      }
    })
  ])

  console.log('✅ Created sample bookings')

  // Display summary
  console.log('\n🎉 Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`• Hotels created: ${hotels.length}`)
  console.log(`• WiFi configurations: ${wifiConfigs.length}`)
  console.log(`• Rooms created: ${rooms.length}`)
  console.log(`• Guest users: ${guestUsers.length}`)
  console.log(`• Bookings created: ${bookings.length}`)

  console.log('\n🏨 Hotels:')
  hotels.forEach((hotel, index) => {
    console.log(`  ${index + 1}. ${hotel.name} (${hotel.city}, ${hotel.state})`)
    console.log(`     📧 ${hotel.email}`)
    console.log(`     📱 ${hotel.phone}`)
    console.log(`     🌐 WiFi: ${wifiConfigs[index].guestNetworkName}`)
    console.log('')
  })

  console.log('🔑 Sample Guest Logins:')
  bookings.forEach((booking, index) => {
    console.log(`  • Booking ID: ${booking.id}`)
    console.log(`    Guest: ${booking.guestName}`)
    console.log(`    Email: ${booking.guestEmail}`)
    console.log(`    Hotel: ${hotels[index].name}`)
    console.log(`    WiFi Network: ${wifiConfigs[index].guestNetworkName}`)
    console.log('')
  })
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })