import request from 'supertest'
import { app } from '../../index'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Integration: Booking Flow', () => {
  let authToken: string
  let userId: string
  let hotelId: string
  let roomId: string
  let bookingId: string

  beforeAll(async () => {
    // Authenticate as guest
    const authResponse = await request(app)
      .post('/api/auth/verify-otp')
      .send({
        phone: '+1234567890',
        otp: '123456'
      })

    authToken = authResponse.body.token
    userId = authResponse.body.user.id

    // Create a test hotel and room (would normally be done via hotel dashboard)
    // This is simplified for testing
  })

  it('should complete full booking flow', async () => {
    // 1. Search for available rooms (simplified)
    const searchResponse = await request(app)
      .get('/api/hotels/search')
      .query({
        checkIn: '2024-02-01',
        checkOut: '2024-02-03',
        guests: 2
      })

    expect(searchResponse.status).toBe(200)

    // 2. Create booking
    const bookingResponse = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hotelId: 'test-hotel-id',
        roomId: 'test-room-id',
        checkIn: '2024-02-01',
        checkOut: '2024-02-03',
        guests: 2,
        guestName: 'John Doe',
        guestEmail: 'john@example.com'
      })

    expect(bookingResponse.status).toBe(201)
    expect(bookingResponse.body.booking).toBeDefined()
    bookingId = bookingResponse.body.booking.id

    // 3. Process payment
    const paymentResponse = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        bookingId,
        amount: 20000, // $200.00
        currency: 'usd'
      })

    expect(paymentResponse.status).toBe(200)
    expect(paymentResponse.body.client_secret).toBeDefined()

    // 4. Confirm payment (simplified)
    const confirmResponse = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        paymentIntentId: paymentResponse.body.id,
        bookingId
      })

    expect(confirmResponse.status).toBe(200)

    // 5. Verify booking status is confirmed
    const bookingStatusResponse = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(bookingStatusResponse.status).toBe(200)
    expect(bookingStatusResponse.body.booking.status).toBe('confirmed')
  })

  it('should handle booking cancellation', async () => {
    const cancelResponse = await request(app)
      .delete(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(cancelResponse.status).toBe(200)
    expect(cancelResponse.body.success).toBe(true)
  })
})