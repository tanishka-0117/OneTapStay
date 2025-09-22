import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFacilities() {
  try {
    console.log('Starting facility seeding...');

    // Get the first hotel to add facilities to
    const hotel = await prisma.hotel.findFirst();
    
    if (!hotel) {
      console.log('No hotel found. Please create a hotel first.');
      return;
    }

    console.log(`Adding facilities to hotel: ${hotel.name}`);

    // Create Restaurant facility
    const restaurant = await prisma.facility.create({
      data: {
        hotelId: hotel.id,
        name: 'Main Restaurant',
        type: 'restaurant',
        description: 'Hotel main dining restaurant with international cuisine',
        isActive: true,
        operatingHours: JSON.stringify({
          monday: { open: '07:00', close: '22:00' },
          tuesday: { open: '07:00', close: '22:00' },
          wednesday: { open: '07:00', close: '22:00' },
          thursday: { open: '07:00', close: '22:00' },
          friday: { open: '07:00', close: '23:00' },
          saturday: { open: '07:00', close: '23:00' },
          sunday: { open: '08:00', close: '22:00' }
        })
      }
    });

    // Create Pool Bar facility
    const poolBar = await prisma.facility.create({
      data: {
        hotelId: hotel.id,
        name: 'Pool Bar',
        type: 'bar',
        description: 'Poolside bar serving drinks and light snacks',
        isActive: true,
        operatingHours: JSON.stringify({
          monday: { open: '10:00', close: '20:00' },
          tuesday: { open: '10:00', close: '20:00' },
          wednesday: { open: '10:00', close: '20:00' },
          thursday: { open: '10:00', close: '20:00' },
          friday: { open: '10:00', close: '22:00' },
          saturday: { open: '10:00', close: '22:00' },
          sunday: { open: '10:00', close: '20:00' }
        })
      }
    });

    // Create Spa facility
    const spa = await prisma.facility.create({
      data: {
        hotelId: hotel.id,
        name: 'Wellness Spa',
        type: 'spa',
        description: 'Full-service spa offering massages, treatments, and wellness services',
        isActive: true,
        operatingHours: JSON.stringify({
          monday: { open: '09:00', close: '21:00' },
          tuesday: { open: '09:00', close: '21:00' },
          wednesday: { open: '09:00', close: '21:00' },
          thursday: { open: '09:00', close: '21:00' },
          friday: { open: '09:00', close: '21:00' },
          saturday: { open: '09:00', close: '21:00' },
          sunday: { open: '10:00', close: '20:00' }
        })
      }
    });

    // Create Gym facility
    const gym = await prisma.facility.create({
      data: {
        hotelId: hotel.id,
        name: 'Fitness Center',
        type: 'gym',
        description: '24/7 fitness center with modern equipment',
        isActive: true,
        operatingHours: JSON.stringify({
          always_open: true
        })
      }
    });

    console.log('Facilities created successfully!');

    // Add services to Restaurant
    const restaurantServices = [
      { name: 'Breakfast Buffet', category: 'meal', price: 25.00, description: 'Continental breakfast buffet' },
      { name: 'Lunch Menu', category: 'meal', price: 35.00, description: 'À la carte lunch menu' },
      { name: 'Dinner Menu', category: 'meal', price: 45.00, description: 'Fine dining dinner experience' },
      { name: 'Coffee & Pastry', category: 'snack', price: 8.50, description: 'Fresh coffee with pastries' },
      { name: 'Room Service', category: 'service', price: 15.00, description: 'In-room dining service charge' }
    ];

    for (const service of restaurantServices) {
      await prisma.facilityService.create({
        data: {
          ...service,
          facilityId: restaurant.id,
          isActive: true
        }
      });
    }

    // Add services to Pool Bar
    const poolBarServices = [
      { name: 'Tropical Cocktail', category: 'beverage', price: 12.00, description: 'Fresh tropical cocktails' },
      { name: 'Beer (Local)', category: 'beverage', price: 6.00, description: 'Local draft beer' },
      { name: 'Beer (Import)', category: 'beverage', price: 8.00, description: 'Imported premium beer' },
      { name: 'Soft Drink', category: 'beverage', price: 4.00, description: 'Assorted soft drinks' },
      { name: 'Pool Snack Platter', category: 'snack', price: 18.00, description: 'Mixed snacks perfect for poolside' },
      { name: 'Fresh Fruit Bowl', category: 'snack', price: 12.00, description: 'Seasonal fresh fruits' }
    ];

    for (const service of poolBarServices) {
      await prisma.facilityService.create({
        data: {
          ...service,
          facilityId: poolBar.id,
          isActive: true
        }
      });
    }

    // Add services to Spa
    const spaServices = [
      { name: 'Swedish Massage (60min)', category: 'treatment', price: 120.00, description: 'Relaxing full body massage' },
      { name: 'Deep Tissue Massage (60min)', category: 'treatment', price: 140.00, description: 'Therapeutic deep tissue massage' },
      { name: 'Facial Treatment (90min)', category: 'treatment', price: 95.00, description: 'Rejuvenating facial treatment' },
      { name: 'Couples Massage (60min)', category: 'treatment', price: 220.00, description: 'Relaxing massage for couples' },
      { name: 'Spa Day Package', category: 'package', price: 280.00, description: 'Full day spa experience with multiple treatments' }
    ];

    for (const service of spaServices) {
      await prisma.facilityService.create({
        data: {
          ...service,
          facilityId: spa.id,
          isActive: true
        }
      });
    }

    // Add services to Gym
    const gymServices = [
      { name: 'Personal Training (1hr)', category: 'service', price: 75.00, description: 'One-on-one personal training session' },
      { name: 'Group Fitness Class', category: 'service', price: 25.00, description: 'Join a group fitness class' },
      { name: 'Equipment Rental', category: 'rental', price: 10.00, description: 'Towel and equipment rental' }
    ];

    for (const service of gymServices) {
      await prisma.facilityService.create({
        data: {
          ...service,
          facilityId: gym.id,
          isActive: true
        }
      });
    }

    console.log('Services added successfully!');

    // Get admin/staff users to assign to facilities
    const staffUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'STAFF' }
        ]
      },
      take: 4
    });

    if (staffUsers.length > 0) {
      // Assign staff to facilities
      const facilities = [restaurant, poolBar, spa, gym];
      
      for (let i = 0; i < facilities.length && i < staffUsers.length; i++) {
        await prisma.facilityStaff.create({
          data: {
            facilityId: facilities[i].id,
            userId: staffUsers[i].id,
            role: 'manager',
            isActive: true
          }
        });
      }

      console.log('Staff assigned to facilities successfully!');
    } else {
      console.log('No staff users found to assign to facilities.');
    }

    console.log('\n✅ Facility seeding completed successfully!');
    console.log(`\nCreated facilities:`);
    console.log(`- ${restaurant.name} (${restaurant.type})`);
    console.log(`- ${poolBar.name} (${poolBar.type})`);
    console.log(`- ${spa.name} (${spa.type})`);
    console.log(`- ${gym.name} (${gym.type})`);

  } catch (error) {
    console.error('Error seeding facilities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedFacilities();