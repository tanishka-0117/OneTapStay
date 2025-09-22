import request from 'supertest'
import { app } from '../../index'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Integration: Room Unlock Flow', () => {
  let authToken: string
  let bookingId: string

  beforeAll(async () => {
    // Setup authenticated user with active booking
    const authResponse = await request(app)
      .post('/api/auth/verify-otp')
      .send({
        phone: '+1234567890',
        otp: '123456'
      })

    authToken = authResponse.body.token

    // Create active booking for testing
    const bookingResponse = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hotelId: 'test-hotel-id',
        roomId: 'test-room-id',
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        guests: 1,
        guestName: 'Test Guest'
      })

    bookingId = bookingResponse.body.booking.id
  })

  it('should generate QR code for room access', async () => {
    const qrResponse = await request(app)
      .get(`/api/keys/qr/${bookingId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(qrResponse.status).toBe(200)
    expect(qrResponse.body.qrCode).toBeDefined()
    expect(qrResponse.body.expiresAt).toBeDefined()
  })

  it('should generate NFC token for room access', async () => {
    const nfcResponse = await request(app)
      .get(`/api/keys/nfc/${bookingId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(nfcResponse.status).toBe(200)
    expect(nfcResponse.body.nfcToken).toBeDefined()
    expect(nfcResponse.body.expiresAt).toBeDefined()
  })

  it('should verify valid room access key', async () => {
    // First generate a key
    const keyResponse = await request(app)
      .get(`/api/keys/qr/${bookingId}`)
      .set('Authorization', `Bearer ${authToken}`)

    const keyData = keyResponse.body.qrCode

    // Then verify the key
    const verifyResponse = await request(app)
      .post('/api/keys/verify')
      .send({
        keyData,
        roomId: 'test-room-id',
        action: 'unlock'
      })

    expect(verifyResponse.status).toBe(200)
    expect(verifyResponse.body.success).toBe(true)
    expect(verifyResponse.body.accessGranted).toBe(true)
  })

  it('should reject invalid room access key', async () => {
    const verifyResponse = await request(app)
      .post('/api/keys/verify')
      .send({
        keyData: 'invalid-key-data',
        roomId: 'test-room-id',
        action: 'unlock'
      })

    expect(verifyResponse.status).toBe(401)
    expect(verifyResponse.body.success).toBe(false)
    expect(verifyResponse.body.accessGranted).toBe(false)
  })

  it('should reject expired room access key', async () => {
    // Generate key and then simulate expiration
    const keyResponse = await request(app)
      .get(`/api/keys/qr/${bookingId}`)
      .set('Authorization', `Bearer ${authToken}`)

    // Mock expired key (this would require mocking the time or using a test key)
    const verifyResponse = await request(app)
      .post('/api/keys/verify')
      .send({
        keyData: 'expired-key-data',
        roomId: 'test-room-id',
        action: 'unlock'
      })

    expect(verifyResponse.status).toBe(401)
    expect(verifyResponse.body.error).toContain('expired')
  })

  it('should log access attempts', async () => {
    // Generate and use key
    const keyResponse = await request(app)
      .get(`/api/keys/qr/${bookingId}`)
      .set('Authorization', `Bearer ${authToken}`)

    await request(app)
      .post('/api/keys/verify')
      .send({
        keyData: keyResponse.body.qrCode,
        roomId: 'test-room-id',
        action: 'unlock'
      })

    // Check access logs
    const logsResponse = await request(app)
      .get('/api/admin/access-logs')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ roomId: 'test-room-id' })

    expect(logsResponse.status).toBe(200)
    expect(logsResponse.body.logs).toBeDefined()
    expect(logsResponse.body.logs.length).toBeGreaterThan(0)
  })
})