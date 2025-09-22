import express from 'express'
const router = express.Router()

// Stripe webhook handler
router.post('/stripe', express.raw({type: 'application/json'}), (req, res) => {
  res.json({ message: 'Stripe webhook handler' })
})

export default router