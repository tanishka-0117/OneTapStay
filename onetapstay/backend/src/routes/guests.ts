import express from 'express'
const router = express.Router()

router.get('/', (req, res) => res.json({ message: 'Guests route' }))
router.get('/profile', (req, res) => res.json({ message: 'Guest profile' }))
export default router