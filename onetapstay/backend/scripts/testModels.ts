import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testModels() {
  try {
    // Test if our new models are available
    console.log('Testing Facility model...');
    const facilities = await prisma.facility.findMany();
    console.log(`Found ${facilities.length} facilities`);

    console.log('Testing FacilityService model...');
    const services = await prisma.facilityService.findMany();
    console.log(`Found ${services.length} services`);

    console.log('Testing FacilityTransaction model...');
    const transactions = await prisma.facilityTransaction.findMany();
    console.log(`Found ${transactions.length} transactions`);

    console.log('Testing GuestJourneyEvent model...');
    const events = await prisma.guestJourneyEvent.findMany();
    console.log(`Found ${events.length} journey events`);

    console.log('✅ All models are working!');
  } catch (error) {
    console.error('❌ Error testing models:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testModels();