import { PrismaClient } from '@prisma/client'
import { MongoClient } from 'mongodb'
import Redis from 'redis'

declare global {
  var __PRISMA__: PrismaClient | undefined
  var __MONGO__: MongoClient | undefined
  var __REDIS__: any | undefined
}

// Setup test database connections
beforeAll(async () => {
  if (!global.__PRISMA__) {
    const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    global.__PRISMA__ = new PrismaClient({
      datasources: dbUrl ? {
        db: {
          url: dbUrl
        }
      } : undefined
    })
  }

  if (!global.__MONGO__) {
    global.__MONGO__ = new MongoClient(
      process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/onetapstay_test'
    )
    await global.__MONGO__.connect()
  }

  if (!global.__REDIS__) {
    global.__REDIS__ = Redis.createClient({
      url: process.env.TEST_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379'
    })
    await global.__REDIS__.connect()
  }
})

// Cleanup after all tests
afterAll(async () => {
  if (global.__PRISMA__) {
    await global.__PRISMA__.$disconnect()
  }

  if (global.__MONGO__) {
    await global.__MONGO__.close()
  }

  if (global.__REDIS__) {
    await global.__REDIS__.disconnect()
  }
})

// Clean database before each test
beforeEach(async () => {
  if (global.__PRISMA__) {
    // Clean up test data
    await global.__PRISMA__.roomKey.deleteMany()
    await global.__PRISMA__.payment.deleteMany()
    await global.__PRISMA__.booking.deleteMany()
    await global.__PRISMA__.room.deleteMany()
    await global.__PRISMA__.hotel.deleteMany()
    await global.__PRISMA__.user.deleteMany()
  }

  if (global.__REDIS__) {
    await global.__REDIS__.flushAll()
  }
})