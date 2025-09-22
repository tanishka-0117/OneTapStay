import express from 'express'
const router = express.Router()

router.get('/', (req, res) => res.json({ message: 'Hotels route' }))
router.post('/', (req, res) => res.json({ message: 'Create hotel' }))
router.get('/:id', (req, res) => res.json({ message: 'Get hotel details' }))
export default router