import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { MongoClient } from 'mongodb'
import { createClient } from 'redis'

// Import routes
import authRoutes from './routes/auth-simple'
import bookingRoutes from './routes/bookings'
import keyRoutes from './routes/keys'
import paymentRoutes from './routes/payment-basic'
import hotelRoutes from './routes/hotels'
import guestRoutes from './routes/guests'
import loyaltyRoutes from './routes/loyalty'
import webhookRoutes from './routes/webhooks'
import adminRoutes from './routes/admin'
import timeoutRoutes from './routes/timeout'
import facilityRoutes from './routes/facility'
import journeyRoutes from './routes/journey'

// Import services
import { timeoutMonitoringService } from './services/timeoutMonitoring'

// Import middleware
import { errorHandler } from './middleware/errorHandler'
import { authMiddleware } from './middleware/auth'
import { adminAuthMiddleware } from './middleware/adminAuth'
import { logger } from './utils/logger'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Initialize database connections
export const prisma = new PrismaClient()
export let mongoClient: MongoClient
export let redisClient: any

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
}))

app.use(compression())
app.use(limiter)
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))

// Body parsing middleware
app.use('/api/webhooks', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/bookings', authMiddleware, bookingRoutes)
app.use('/api/keys', keyRoutes)
// Payment webhook endpoint (no auth required for Stripe)
app.use('/api/payments/webhook', paymentRoutes)
app.use('/api/payments', authMiddleware, paymentRoutes)
app.use('/api/hotels', hotelRoutes)
app.use('/api/guests', authMiddleware, guestRoutes)
app.use('/api/loyalty', authMiddleware, loyaltyRoutes)
app.use('/api/webhooks', webhookRoutes)
app.use('/api/admin', adminAuthMiddleware, adminRoutes)
app.use('/api/timeout', timeoutRoutes)
app.use('/api/facility', facilityRoutes)
app.use('/api/journey', journeyRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist on this server`,
  })
})

// Error handling middleware
app.use(errorHandler)

// Database connection function
async function connectDatabases() {
  try {
    // Test Prisma connection
    await prisma.$connect()
    logger.info('✅ Connected to MySQL database via Prisma')

    // Connect to MongoDB (optional)
    if (process.env.DATABASE_URL_MONGO) {
      try {
        mongoClient = new MongoClient(process.env.DATABASE_URL_MONGO)
        await mongoClient.connect()
        logger.info('✅ Connected to MongoDB database')
      } catch (error) {
        logger.warn('⚠️ MongoDB connection failed, continuing without it:', error)
      }
    }

    // Connect to Redis (optional)
    if (process.env.REDIS_URL) {
      try {
        redisClient = createClient({
          url: process.env.REDIS_URL,
        })
        
        redisClient.on('error', (err: any) => logger.error('Redis Client Error', err))
        await redisClient.connect()
        logger.info('✅ Connected to Redis cache')
      } catch (error) {
        logger.warn('⚠️ Redis connection failed, continuing without it:', error)
      }
    }
  } catch (error) {
    logger.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT. Graceful shutdown...')
  
  await prisma.$disconnect()
  if (mongoClient) await mongoClient.close()
  if (redisClient) await redisClient.quit()
  
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM. Graceful shutdown...')
  
  await prisma.$disconnect()
  if (mongoClient) await mongoClient.close()
  if (redisClient) await redisClient.quit()
  
  process.exit(0)
})

// Start server
async function startServer() {
  try {
    await connectDatabases()
    
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`)
      logger.info(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`)
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
      
      // Start timeout monitoring service
      // if (process.env.ENABLE_TIMEOUT_MONITORING !== 'false') {
      //   timeoutMonitoringService.start()
      //   logger.info('🕒 Timeout monitoring service started')
      // }
    })
  } catch (error) {
    logger.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export { app }