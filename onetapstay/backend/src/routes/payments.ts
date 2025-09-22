import express from 'express'
const router = express.Router()

router.get('/', (req, res) => res.json({ message: 'Payments route' }))
router.post('/', (req, res) => res.json({ message: 'Create payment' }))
export default router