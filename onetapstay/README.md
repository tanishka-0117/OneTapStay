# 🏨 OneTapStay - Smart Hospitality Platform

[![CI/CD Pipeline](https://github.com/yourusername/onetapstay/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/yourusername/onetapstay/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive contactless hospitality platform that enables seamless check-in, room access, payments, and guest services through mobile technology.

## ✨ Features

### 🔐 **Contactless Access**
- QR code and NFC-based room entry
- Mobile-first room key generation
- Smart lock integration support
- Secure access logging and monitoring

### 💳 **Integrated Payments**
- Stripe payment processing
- Wallet management
- Automatic billing and receipts
- PCI-compliant tokenization

### 📱 **Guest Experience**
- SMS-based authentication with OTP
- Real-time booking management
- Instant WiFi credentials
- Loyalty points and rewards

### 🏢 **Hotel Management**
- Comprehensive dashboard
- Room and booking management
- Staff access controls
- Analytics and reporting

### 🛡️ **Security & Compliance**
- JWT-based authentication
- End-to-end encryption
- GDPR-compliant data handling
- SOC 2 security practices

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Frontend      │    │   Backend API   │    │   Databases     │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   Multi-DB      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  Mobile Apps    │    │  External APIs  │    │  Lock Providers │
│  (React Native) │    │  Stripe/Twilio  │    │  (Onity/ASSA)  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **Docker** and Docker Compose
- **MySQL** 8.0+ (or PlanetScale account)
- **MongoDB** 6.0+ (or Atlas account)
- **Redis** 7.0+ (or Upstash account)

### Required API Keys

Before running the application, you'll need to obtain the following API keys:

1. **Database Connections**
   - `DATABASE_URL_MYSQL` - MySQL/PlanetScale connection string
   - `DATABASE_URL_MONGO` - MongoDB Atlas URI
   - `REDIS_URL` - Redis/Upstash connection string

2. **Payment Processing**
   - `STRIPE_SECRET_KEY` - Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - `STRIPE_PUBLISHABLE_KEY` - Public key for frontend
   - `STRIPE_WEBHOOK_SECRET` - Webhook endpoint secret

3. **SMS/OTP Service**
   - `TWILIO_SID` - Account SID from [Twilio Console](https://console.twilio.com)
   - `TWILIO_TOKEN` - Auth Token
   - `TWILIO_PHONE` - Your Twilio phone number

4. **Authentication**
   - `JWT_SECRET` - Generate a secure 32+ character string
   - `NEXTAUTH_SECRET` - For NextAuth.js session management

5. **Lock Provider Integration** (Optional)
   - `LOCK_VENDOR_API_KEY` - API key from your lock provider
   - `LOCK_VENDOR_BASE_URL` - Base URL for lock API

### 📋 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/onetapstay.git
   cd onetapstay
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Start with Docker (Recommended)**
   ```bash
   npm run docker:up
   npm run setup
   ```

   Or manually:
   ```bash
   # Start databases
   docker-compose up mysql mongodb redis -d
   
   # Run database migrations
   npm run db:migrate
   
   # Generate mock data
   npm run generate-mock-data
   
   # Start development servers
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health: http://localhost:5000/health

## 🛠️ Development

### Project Structure

```
onetapstay/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App router pages
│   ├── components/          # Reusable components
│   ├── lib/                 # Utility functions
│   └── public/              # Static assets
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   └── index.ts         # Server entry point
│   └── prisma/              # Database schema and migrations
├── docker-compose.yml       # Local development environment
└── .github/workflows/       # CI/CD pipelines
```

### Available Scripts

```bash
# Development
npm run dev                  # Start both frontend and backend
npm run dev:frontend         # Start only frontend
npm run dev:backend          # Start only backend

# Building
npm run build               # Build both applications
npm run build:frontend      # Build frontend
npm run build:backend       # Build backend

# Testing
npm run test               # Run all tests
npm run test:frontend      # Test frontend
npm run test:backend       # Test backend

# Database
npm run db:migrate         # Run Prisma migrations
npm run db:generate        # Generate Prisma client
npm run db:studio          # Open Prisma Studio
npm run generate-mock-data # Generate sample data

# Docker
npm run docker:up          # Start all services
npm run docker:down        # Stop all services

# Linting
npm run lint              # Lint all code
npm run lint:fix          # Fix linting issues
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Backend server port | No | `5000` |
| `FRONTEND_URL` | Frontend application URL | No | `http://localhost:3000` |
| `DATABASE_URL_MYSQL` | MySQL connection string | Yes | - |
| `DATABASE_URL_MONGO` | MongoDB connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes | - |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes | - |
| `TWILIO_SID` | Twilio Account SID | Yes | - |
| `TWILIO_TOKEN` | Twilio Auth Token | Yes | - |
| `TWILIO_PHONE` | Twilio phone number | Yes | - |

### Database Setup

#### Option 1: PlanetScale (Recommended for Production)

1. Create account at [PlanetScale](https://planetscale.com)
2. Create new database
3. Get connection string from dashboard
4. Set `DATABASE_URL_MYSQL` in your `.env`

#### Option 2: Local MySQL

```bash
# Using Docker
docker run --name mysql-onetapstay \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=onetapstay \
  -p 3306:3306 -d mysql:8.0

# Connection string
DATABASE_URL_MYSQL="mysql://root:password@localhost:3306/onetapstay"
```

#### MongoDB Setup

Use MongoDB Atlas (recommended) or local installation:

```bash
# Local MongoDB with Docker
docker run --name mongo-onetapstay \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -e MONGO_INITDB_DATABASE=onetapstay \
  -p 27017:27017 -d mongo:7

# Connection string
DATABASE_URL_MONGO="mongodb://root:password@localhost:27017/onetapstay?authSource=admin"
```

## 🔐 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/send-otp` | Send OTP to phone number |
| `POST` | `/api/auth/verify-otp` | Verify OTP and authenticate |
| `POST` | `/api/auth/register-hotel` | Register new hotel account |
| `GET` | `/api/auth/me` | Get current user profile |

### Booking Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/bookings` | Get user bookings |
| `POST` | `/api/bookings` | Create new booking |
| `GET` | `/api/bookings/:id` | Get booking details |
| `PUT` | `/api/bookings/:id` | Update booking |
| `DELETE` | `/api/bookings/:id` | Cancel booking |

### Room Access Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/keys/qr/:bookingId` | Generate QR code for room access |
| `GET` | `/api/keys/nfc/:bookingId` | Generate NFC token |
| `POST` | `/api/keys/verify` | Verify and use access key |

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/create-intent` | Create Stripe payment intent |
| `POST` | `/api/payments/confirm` | Confirm payment |
| `GET` | `/api/payments/methods` | Get saved payment methods |
| `POST` | `/api/webhooks/stripe` | Stripe webhook handler |

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run specific test suites
npm run test:frontend
npm run test:backend

# Watch mode for development
npm run test:watch
```

### Test Structure

```
backend/src/__tests__/
├── auth.test.ts            # Authentication flow tests
├── bookings.test.ts        # Booking management tests
├── keys.test.ts            # Room access tests
├── payments.test.ts        # Payment processing tests
└── integration/
    ├── booking-flow.test.ts    # End-to-end booking
    └── unlock-flow.test.ts     # End-to-end room access
```

### Mock Data

Generate test data for development:

```bash
npm run generate-mock-data
```

This creates:
- 5 sample hotels with rooms
- 20 guest accounts
- 50 sample bookings
- Payment methods and loyalty accounts

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy Frontend**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure Environment Variables**
   
   In Vercel dashboard, add all required environment variables from your `.env` file.

4. **Set up Stripe Webhooks**
   
   Configure webhook endpoint: `https://your-app.vercel.app/api/webhooks/stripe`

### Docker Deployment

```bash
# Build production images
docker build -t onetapstay-frontend:latest ./frontend
docker build -t onetapstay-backend:latest ./backend

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-Specific Configs

Create separate `.env` files for different environments:

- `.env.development` - Local development
- `.env.staging` - Staging environment  
- `.env.production` - Production environment

## 🔌 Lock Provider Integration

### Currently Supported

- **Mock Provider** - For development and testing
- **Generic HTTP API** - RESTful lock provider integration

### Adding Real Lock Providers

1. **Onity Integration**
   ```javascript
   // backend/src/services/locks/onityProvider.ts
   import { LockProvider } from './baseLockProvider'
   
   export class OnityProvider extends LockProvider {
     async generateKey(roomId: string, validUntil: Date): Promise<string> {
       // Implementation for Onity lock system
     }
   }
   ```

2. **ASSA ABLOY Integration**
   ```javascript
   // backend/src/services/locks/assaProvider.ts
   import { LockProvider } from './baseLockProvider'
   
   export class AssaProvider extends LockProvider {
     async generateKey(roomId: string, validUntil: Date): Promise<string> {
       // Implementation for ASSA ABLOY system
     }
   }
   ```

3. **Configuration**
   ```bash
   # Add to .env
   LOCK_PROVIDER=onity
   ONITY_API_KEY=your_onity_api_key
   ONITY_BASE_URL=https://api.onity.com
   ```

### Lock Provider API Contract

```typescript
interface LockProvider {
  generateQRCode(roomId: string, guestId: string, validUntil: Date): Promise<string>
  generateNFCToken(roomId: string, guestId: string, validUntil: Date): Promise<string>
  verifyAccess(keyData: string, roomId: string): Promise<boolean>
  revokeAccess(keyId: string): Promise<boolean>
}
```

## 📊 Monitoring & Analytics

### Health Checks

- **Backend**: `GET /health`
- **Database**: Connection status monitoring
- **External APIs**: Stripe, Twilio status checks

### Logging

Structured logging with Winston:

```javascript
import { logger } from './utils/logger'

logger.info('Booking created', { bookingId, guestId, hotelId })
logger.error('Payment failed', { error, paymentIntentId })
```

### Error Tracking

Integration ready for:
- **Sentry** - Error monitoring
- **LogRocket** - Session replay
- **DataDog** - Application monitoring

## 🔒 Security

### Security Features

- **Rate Limiting** - API endpoint protection
- **CORS** - Cross-origin request security
- **Helmet** - Security headers
- **Input Validation** - Request sanitization
- **JWT Authentication** - Stateless auth
- **Password Hashing** - bcrypt implementation
- **SQL Injection Prevention** - Prisma ORM protection

### Security Checklist

- [ ] All secrets in environment variables
- [ ] HTTPS enforced in production
- [ ] Database connections encrypted
- [ ] API rate limiting configured
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies regularly updated
- [ ] Security headers configured
- [ ] GDPR compliance measures implemented

### Compliance

- **PCI DSS** - Payment card data security
- **GDPR** - Data protection and privacy
- **SOC 2** - Security and availability
- **ISO 27001** - Information security management

## 📈 Performance

### Frontend Optimization

- **Next.js App Router** - Modern routing and caching
- **Image Optimization** - Automatic WebP conversion
- **Code Splitting** - Route-based lazy loading
- **Static Generation** - Pre-built pages where possible

### Backend Optimization

- **Connection Pooling** - Database connection management
- **Redis Caching** - Session and data caching
- **Compression** - Response compression
- **CDN Ready** - Static asset optimization

### Database Optimization

- **Indexed Queries** - Proper database indexing
- **Connection Pooling** - Prisma connection management
- **Query Optimization** - Efficient data fetching
- **Caching Strategy** - Redis-based caching

## 📤 Uploading to GitHub

To upload your project to GitHub:
1. Create a new repository on GitHub (e.g. `onetapstay`).
2. Initialize git in your project folder (if not already):
   ```bash
   git init
   ```
3. Add your remote:
   ```bash
   git remote add origin https://github.com/<yourusername>/onetapstay.git
   ```
4. Add all files and commit:
   ```bash
   git add .
   git commit -m "Initial commit"
   ```
5. Push to GitHub:
   ```bash
   git push -u origin main
   ```

## 🤝 Contribution Guidelines

- Fork the repository and create a feature branch for your changes.
- Follow the code style and TypeScript best practices.
- Write tests for new features and update documentation.
- Submit a Pull Request with a clear description of your changes.

## 📝 Instruction Files

This project uses instruction files to customize and extend logic for various modules (e.g. payment, facility, journey, API hooks).

- Instruction files are located in the `/instructions` folder or alongside feature modules.
- To add or modify business logic, update the relevant instruction file and follow the comments for guidance.
- See the documentation in `/docs/instructions.md` for details on available hooks and extension points.

---

Built with ❤️ by the OneTapStay team