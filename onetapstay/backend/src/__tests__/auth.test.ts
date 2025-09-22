import request from 'supertest'
import { app } from '../index'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Authentication', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect()
  })

  afterAll(async () => {
    // Cleanup
    await prisma.$disconnect()
  })

  describe('POST /api/auth/send-otp', () => {
    it('should send OTP for valid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({
          phone: '+1234567890'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('OTP sent')
    })

    it('should reject invalid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({
          phone: 'invalid-phone'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/auth/verify-otp', () => {
    it('should authenticate with valid OTP', async () => {
      // First send OTP
      await request(app)
        .post('/api/auth/send-otp')
        .send({
          phone: '+1234567890'
        })

      // Then verify with development OTP
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone: '+1234567890',
          otp: '123456' // Mock OTP for testing
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.token).toBeDefined()
      expect(response.body.user).toBeDefined()
    })

    it('should reject invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone: '+1234567890',
          otp: '000000'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/auth/register-hotel', () => {
    it('should register new hotel', async () => {
      const hotelData = {
        phone: '+1987654321',
        email: 'test@hotel.com',
        hotelName: 'Test Hotel',
        address: '123 Main St',
        city: 'Test City',
        country: 'Test Country',
        firstName: 'John',
        lastName: 'Doe'
      }

      const response = await request(app)
        .post('/api/auth/register-hotel')
        .send(hotelData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.user.type).toBe('hotel')
      expect(response.body.user.hotel).toBeDefined()
    })

    it('should reject duplicate hotel registration', async () => {
      const hotelData = {
        phone: '+1987654321',
        email: 'test@hotel.com',
        hotelName: 'Test Hotel',
        address: '123 Main St',
        city: 'Test City',
        country: 'Test Country'
      }

      // Register once
      await request(app)
        .post('/api/auth/register-hotel')
        .send(hotelData)

      // Try to register again
      const response = await request(app)
        .post('/api/auth/register-hotel')
        .send(hotelData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })
})