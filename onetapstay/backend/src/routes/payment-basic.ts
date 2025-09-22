import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// Initialize Stripe with fallback
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null

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

    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe not configured'
      })
    }

    const { amount, currency = 'usd', description } = req.body

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      description: description || 'Payment for OneTapStay services',
      payment_method_types: ['card']
    })

    return res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
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

// Basic payment confirmation
router.post('/confirm', [
  body('payment_intent_id').notEmpty().withMessage('Payment intent ID is required'),
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

    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe not configured'
      })
    }

    const { payment_intent_id } = req.body

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

    return res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      }
    })

  } catch (error) {
    console.error('Payment confirmation error:', error)
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Payment confirmation failed'
    })
  }
})

// Get payment methods
router.get('/methods', async (req: Request, res: Response) => {
  try {
    // Return mock payment methods
    return res.json({
      success: true,
      paymentMethods: [
        {
          id: 'pm_mock_card_1',
          last4: '4242',
          brand: 'visa',
          exp_month: 12,
          exp_year: 2025
        },
        {
          id: 'pm_mock_card_2',
          last4: '1234',
          brand: 'mastercard',
          exp_month: 6,
          exp_year: 2026
        }
      ]
    })
  } catch (error) {
    console.error('Payment methods retrieval error:', error)
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve payment methods'
    })
  }
})

// Get payment history
router.get('/history', async (req: Request, res: Response) => {
  try {
    // Return mock payment history
    return res.json({
      success: true,
      payments: [
        {
          id: 'pay_mock_1',
          amount: 2500, // $25.00 in cents
          currency: 'usd',
          status: 'succeeded',
          paymentMethod: 'Card',
          method_details: 'Visa •••• 4242',
          description: 'Hotel booking payment',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'pay_mock_2',
          amount: 1500, // $15.00 in cents
          currency: 'usd',
          status: 'succeeded',
          paymentMethod: 'Card',
          method_details: 'Mastercard •••• 1234',
          description: 'Service payment',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        }
      ]
    })
  } catch (error) {
    console.error('Payment history retrieval error:', error)
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve payment history'
    })
  }
})

// Basic webhook endpoint
router.post('/webhook', async (req: Request, res: Response) => {
  console.log('Stripe webhook received')
  res.json({ received: true })
})

export default router