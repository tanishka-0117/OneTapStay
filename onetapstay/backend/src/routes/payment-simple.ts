import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()
const prisma = new PrismaClient()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Create payment intent
router.post('/create-intent', [
  body('amount').isNumeric().withMessage('Amount is required and must be numeric'),
  body('currency').optional().isString(),
  body('description').optional().isString(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { amount, currency = 'usd', description } = req.body
    const userId = (req as any).user?.id
    // Create Stripe customer if user doesn't have one
    let stripeCustomerId: string | null = null
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (user && !user.stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
        })
        
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customer.id }
        })
        
        stripeCustomerId = customer.id
      } else if (user) {
        stripeCustomerId = user.stripeCustomerId
      }
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Stripe expects amount in cents
      currency,
      customer: stripeCustomerId || undefined,
      description: description || 'Payment for OneTapStay services',
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: Math.round(amount),
        currency,
        status: 'pending',
        paymentMethod: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId,
        description: description || 'Payment for services',
        metadata: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
        }),
      },
    })

    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
      payment: {
        id: payment.id,
        status: payment.status,
      }
    })

  } catch (error) {
    console.error('Payment intent creation error:', error)
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Payment intent creation failed'
    })
  }
})

// Confirm payment
router.post('/confirm', [
  body('payment_intent_id').notEmpty().withMessage('Payment intent ID is required'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed',
      errors: errors.array()
    })
  }

  const { payment_intent_id } = req.body

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

    // Update payment record in database
    const payment = await prisma.payment.update({
      where: { stripePaymentIntentId: payment_intent_id },
      data: {
        status: paymentIntent.status === 'succeeded' ? 'completed' : paymentIntent.status,
        completedAt: paymentIntent.status === 'succeeded' ? new Date() : null,
        failureReason: paymentIntent.status === 'requires_payment_method' ? 'Payment method required' : null,
      },
    })

    res.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
      },
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
      }
    })

  } catch (error) {
    console.error('Payment confirmation error:', error)
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Payment confirmation failed'
    })
  }
}))

// Get payment methods for user
router.get('/methods', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user?.stripeCustomerId) {
      return res.json({
        success: true,
        paymentMethods: []
      })
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    })

    const methods = paymentMethods.data.map(method => ({
      id: method.id,
      last4: method.card?.last4,
      brand: method.card?.brand,
      exp_month: method.card?.exp_month,
      exp_year: method.card?.exp_year,
    }))

    res.json({
      success: true,
      paymentMethods: methods
    })

  } catch (error) {
    console.error('Payment methods retrieval error:', error)
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve payment methods'
    })
  }
}))

// Get payment history
router.get('/history', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const limit = parseInt(req.query.limit as string) || 10

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    })
  }

  try {
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    res.json({
      success: true,
      payments: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        description: payment.description,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
      }))
    })

  } catch (error) {
    console.error('Payment history retrieval error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve payment history'
    })
  }
}))

// Stripe webhook endpoint
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update payment status
        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        })
        
        console.log(`Payment ${paymentIntent.id} succeeded`)
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        
        // Update payment status
        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: failedPayment.id },
          data: {
            status: 'failed',
            failureReason: 'Payment failed',
          },
        })
        
        console.log(`Payment ${failedPayment.id} failed`)
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Webhook error'
    })
  }
}))

export default router