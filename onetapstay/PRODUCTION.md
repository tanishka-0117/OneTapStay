# Production Environment Variables

This document outlines all the environment variables required for running OneTapStay in production.

## Required API Keys and Services

### 1. Database Configuration

#### MySQL Database (Primary)
```bash
# PlanetScale (Recommended)
DATABASE_URL="mysql://username:password@host:port/database?sslaccept=strict"

# Alternative: AWS RDS MySQL
DATABASE_URL="mysql://admin:password@rds-endpoint:3306/onetapstay"
```

#### MongoDB Database (Secondary)
```bash
# MongoDB Atlas (Recommended)
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/onetapstay?retryWrites=true&w=majority"

# Alternative: Self-hosted
MONGODB_URI="mongodb://username:password@host:27017/onetapstay"
```

#### Redis Cache
```bash
# Upstash Redis (Recommended for Vercel)
REDIS_URL="redis://username:password@host:port"

# Alternative: AWS ElastiCache
REDIS_URL="redis://cache-cluster-endpoint:6379"
```

### 2. Authentication & Security

```bash
# JWT Secret (Generate with: openssl rand -base64 32)
JWT_SECRET="your-256-bit-secret-key-here"

# NextAuth Secret (Generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-nextauth-secret-here"

# App Base URL
NEXTAUTH_URL="https://your-domain.com"
```

### 3. SMS & Communication

#### Twilio SMS
```bash
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

**Setup Instructions:**
1. Sign up at https://twilio.com
2. Verify your phone number
3. Purchase a phone number with SMS capabilities
4. Copy Account SID and Auth Token from Console

### 4. Payment Processing

#### Stripe
```bash
# # Production Keys
# STRIPE_PUBLISHABLE_KEY="pk_test_PLACEHOLDE"
# STRIPE_SECRET_KEY="sk_test_PLACEHOLDE"

# Webhook Secret (from Stripe Dashboard)
# STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Setup Instructions:**
1. Create account at https://stripe.com
2. Complete business verification
3. Get API keys from Dashboard → Developers → API keys
4. Create webhook endpoint for `/api/webhooks/stripe`
5. Copy webhook signing secret

### 5. Smart Lock Integration

#### August/Yale (Example)
```bash
LOCK_PROVIDER_API_KEY="your-lock-provider-api-key"
LOCK_PROVIDER_SECRET="your-lock-provider-secret"
LOCK_PROVIDER_BASE_URL="https://api.august.com/v1"
```

#### Nuki (Alternative)
```bash
NUKI_API_TOKEN="your-nuki-api-token"
NUKI_BRIDGE_IP="192.168.1.100"
NUKI_BRIDGE_PORT="8080"
```

### 6. Cloud Storage (Optional)

#### AWS S3
```bash
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="onetapstay-uploads"
```

### 7. Monitoring & Analytics

#### Sentry (Error Tracking)
```bash
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
```

#### PostHog (Analytics)
```bash
POSTHOG_API_KEY="phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
POSTHOG_HOST="https://app.posthog.com"
```

## Environment Files by Deployment

### Vercel Deployment

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Production
NODE_ENV=production
DATABASE_URL=your-mysql-url
MONGODB_URI=your-mongodb-uri
REDIS_URL=your-redis-url
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.vercel.app
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
STRIPE_PUBLISHABLE_KEY=your-stripe-pub-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
LOCK_PROVIDER_API_KEY=your-lock-api-key
LOCK_PROVIDER_SECRET=your-lock-secret
```

### Docker Production

Create `.env.production`:

```bash
# Copy all variables from above
NODE_ENV=production
# ... all other variables
```

### Local Development

Create `.env.local`:

```bash
NODE_ENV=development
DATABASE_URL="mysql://root:password@localhost:3306/onetapstay_dev"
MONGODB_URI="mongodb://localhost:27017/onetapstay_dev"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="dev-secret-change-in-production"
NEXTAUTH_SECRET="dev-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Use Twilio test credentials for development
TWILIO_ACCOUNT_SID="your-test-sid"
TWILIO_AUTH_TOKEN="your-test-token"
TWILIO_PHONE_NUMBER="+15005550006"

# Use Stripe test keys
STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## Security Checklist

### Required for Production:

- [ ] All secrets are generated randomly (min 256-bit for JWT)
- [ ] Database connections use SSL/TLS
- [ ] Stripe is in live mode with real keys
- [ ] Twilio is using a verified phone number
- [ ] CORS is configured for your domain only
- [ ] Rate limiting is enabled
- [ ] Error logging is configured (Sentry)
- [ ] Health checks are enabled
- [ ] Backup strategy is in place

### Recommended:

- [ ] Use managed database services (PlanetScale, MongoDB Atlas)
- [ ] Enable database connection pooling
- [ ] Set up monitoring alerts
- [ ] Configure log retention policies
- [ ] Enable API request logging
- [ ] Set up automated backups
- [ ] Use CDN for static assets

## Cost Estimates (Monthly)

### Minimal Setup:
- PlanetScale (Hobby): $0
- MongoDB Atlas (Free): $0
- Upstash Redis: $0.20
- Vercel (Pro): $20
- Twilio: $1 + usage
- Stripe: 2.9% + 30¢ per transaction
- **Total Base Cost: ~$21/month**

### Production Setup:
- PlanetScale (Scale): $39
- MongoDB Atlas (M10): $57
- Upstash Redis: $20
- Vercel (Pro): $20
- Twilio: $1 + usage
- Stripe: 2.9% + 30¢ per transaction
- Sentry: $26
- **Total Base Cost: ~$163/month**

## Deployment Commands

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add PRODUCTION
```

### Docker
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues:

1. **Database Connection Fails**
   - Check DATABASE_URL format
   - Verify SSL settings
   - Ensure IP whitelist includes your deployment

2. **SMS Not Sending**
   - Verify Twilio phone number
   - Check account balance
   - Ensure phone number is verified

3. **Stripe Webhooks Failing**
   - Verify webhook URL is accessible
   - Check webhook secret matches
   - Ensure HTTPS is enabled

4. **Lock Integration Issues**
   - Verify API credentials
   - Check network connectivity
   - Ensure device registration

For support, check the logs or contact your deployment provider.