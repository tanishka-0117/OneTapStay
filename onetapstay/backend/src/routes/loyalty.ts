import express from 'express'
const router = express.Router()

router.get('/', (req, res) => res.json({ message: 'Loyalty route' }))
router.get('/points', (req, res) => res.json({ message: 'Get loyalty points' }))
export default router