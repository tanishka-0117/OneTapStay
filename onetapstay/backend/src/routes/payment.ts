import express, { Request, Response } from 'express'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'
import { body, validationResult } from 'express-validator'
import { AppError, asyncHandler } from '../middleware/errorHandler'

const router = express.Router()
const prisma = new PrismaClient()

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

/**
 * Create Payment Intent
 * POST /api/payments/create-payment-intent
 */
router.post('/create-payment-intent', [
  body('amount').isInt({ min: 50 }).withMessage('Amount must be at least $0.50'),
  body('currency').isIn(['usd', 'eur', 'gbp']).withMessage('Invalid currency'),
  body('bookingId').optional().isString(),
  body('facilityServiceId').optional().isString(),
  body('description').optional().isString(),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }

  const { amount, currency = 'usd', bookingId, facilityServiceId, description } = req.body
  const userId = (req as any).user?.id

  try {
    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId || 'guest',
        bookingId: bookingId || '',
        facilityServiceId: facilityServiceId || '',
        description: description || 'OneTapStay Payment',
      },
    })

    // Store payment intent in database
    const paymentRecord = await prisma.payment.create({
      data: {
        stripePaymentIntentId: paymentIntent.id,
        amount: amount,
        currency,
        status: 'pending',
        userId: userId || null,
        bookingId: bookingId || null,
        facilityServiceId: facilityServiceId || null,
        description: description || 'OneTapStay Payment',
        metadata: JSON.stringify({
          clientSecret: paymentIntent.client_secret,
        }),
      },
    })

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: paymentRecord.id,
    })
  } catch (error: any) {
    console.error('Payment intent creation failed:', error)
    throw new AppError('Failed to create payment intent', 500)
  }
}))

/**
 * Confirm Payment
 * POST /api/payments/confirm-payment
 */
router.post('/confirm-payment', [
  body('paymentIntentId').isString().withMessage('Payment intent ID is required'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }

  const { paymentIntentId } = req.body

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Update payment record in database
    const paymentRecord = await prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntentId },
      data: {
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
        completedAt: paymentIntent.status === 'succeeded' ? new Date() : null,
        failureReason: paymentIntent.status !== 'succeeded' ? 'Payment failed' : null,
      },
    })

    // If payment succeeded and it's for a facility service, update the facility transaction
    if (paymentIntent.status === 'succeeded' && paymentRecord.facilityServiceId) {
      await prisma.facilityTransaction.update({
        where: { id: paymentRecord.facilityServiceId },
        data: {
          paymentStatus: 'completed',
          paymentMethod: 'stripe',
        },
      })
    }

    res.status(200).json({
      success: true,
      status: paymentIntent.status,
      payment: paymentRecord,
    })
  } catch (error: any) {
    console.error('Payment confirmation failed:', error)
    throw new AppError('Failed to confirm payment', 500)
  }
}))

/**
 * Get Payment Status
 * GET /api/payments/:paymentId/status
 */
router.get('/:paymentId/status', asyncHandler(async (req: Request, res: Response) => {
  const { paymentId } = req.params

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        booking: {
          select: { id: true, confirmationCode: true }
        }
      }
    })

    if (!payment) {
      throw new AppError('Payment not found', 404)
    }

    // Get latest status from Stripe
    if (payment.stripePaymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId)
      
      // Update local status if different
      if (payment.status !== paymentIntent.status) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: paymentIntent.status === 'succeeded' ? 'completed' : 
                   paymentIntent.status === 'canceled' ? 'cancelled' : 
                   paymentIntent.status === 'requires_payment_method' ? 'failed' : 'pending',
          },
        })
      }
    }

    res.status(200).json({
      success: true,
      payment,
    })
  } catch (error: any) {
    console.error('Get payment status failed:', error)
    throw new AppError('Failed to get payment status', 500)
  }
}))

/**
 * Get Payment History
 * GET /api/payments/history
 */
router.get('/history', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { limit = 10, offset = 0 } = req.query

  if (!userId) {
    throw new AppError('Authentication required', 401)
  }

  try {
    const payments = await prisma.payment.findMany({
      where: { userId },
      include: {
        booking: {
          select: { id: true, confirmationCode: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    })

    const totalCount = await prisma.payment.count({
      where: { userId }
    })

    res.status(200).json({
      success: true,
      payments,
      pagination: {
        total: totalCount,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < totalCount,
      },
    })
  } catch (error: any) {
    console.error('Get payment history failed:', error)
    throw new AppError('Failed to get payment history', 500)
  }
}))

/**
 * Stripe Webhook Handler
 * POST /api/payments/webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new AppError('Webhook secret not configured', 500)
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    throw new AppError(`Webhook signature verification failed: ${err.message}`, 400)
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent
      await handlePaymentSucceeded(paymentIntentSucceeded)
      break
    
    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.object as Stripe.PaymentIntent
      await handlePaymentFailed(paymentIntentFailed)
      break
    
    case 'payment_method.attached':
      const paymentMethod = event.data.object as Stripe.PaymentMethod
      await handlePaymentMethodAttached(paymentMethod)
      break
    
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.status(200).json({ received: true })
}))

// Helper function to handle successful payments
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update payment record
    const payment = await prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    })

    // Update facility transaction if applicable
    if (payment.facilityServiceId) {
      await prisma.facilityTransaction.update({
        where: { id: payment.facilityServiceId },
        data: {
          paymentStatus: 'completed',
          paymentMethod: 'stripe',
        },
      })

      // Add to guest journey timeline
      if (payment.bookingId) {
        await prisma.guestJourneyEvent.create({
          data: {
            bookingId: payment.bookingId,
            eventType: 'payment_completed',
            title: 'Payment Completed',
            description: `Payment of $${payment.amount} completed successfully`,
            timestamp: new Date(),
            metadata: JSON.stringify({
              paymentId: payment.id,
              amount: payment.amount,
              currency: payment.currency,
            }),
          },
        })
      }
    }

    console.log(`Payment succeeded: ${paymentIntent.id}`)
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

// Helper function to handle failed payments
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    await prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'failed',
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
      },
    })

    console.log(`Payment failed: ${paymentIntent.id}`)
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

// Helper function to handle payment method attached
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  try {
    // Store payment method for future use if customer exists
    if (paymentMethod.customer) {
      console.log(`Payment method ${paymentMethod.id} attached to customer ${paymentMethod.customer}`)
    }
  } catch (error) {
    console.error('Error handling payment method attachment:', error)
  }
}

/**
 * Create Customer
 * POST /api/payments/create-customer
 */
router.post('/create-customer', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').isString().withMessage('Name is required'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }

  const { email, name } = req.body
  const userId = (req as any).user?.id

  try {
    // Create customer in Stripe
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId || '',
      },
    })

    // Update user record with Stripe customer ID
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      })
    }

    res.status(200).json({
      success: true,
      customerId: customer.id,
    })
  } catch (error: any) {
    console.error('Customer creation failed:', error)
    throw new AppError('Failed to create customer', 500)
  }
}))

/**
 * Get Publishable Key
 * GET /api/payments/config
 */
router.get('/config', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  })
})

export default router