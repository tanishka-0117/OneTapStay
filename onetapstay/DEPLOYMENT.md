# OneTapStay Deployment Guide

This guide provides step-by-step instructions for deploying OneTapStay to various platforms.

## Prerequisites

Before deploying, ensure you have:

- [ ] All required API keys (see [PRODUCTION.md](./PRODUCTION.md))
- [ ] Domain name configured
- [ ] SSL certificate (handled by most platforms)
- [ ] Database instances provisioned
- [ ] Payment processing account verified

## Platform-Specific Deployment

### 1. Vercel (Recommended for Next.js)

#### Step 1: Prepare Repository
```bash
# Ensure your repo is pushed to GitHub
git add .
git commit -m "Production ready"
git push origin main
```

#### Step 2: Deploy Frontend
1. Visit [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project" and select your OneTapStay repository
3. Configure build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Step 3: Deploy Backend API
1. Create a new Vercel project for the backend
2. Configure build settings:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### Step 4: Configure Environment Variables
In Vercel Dashboard → Project → Settings → Environment Variables, add all variables from [PRODUCTION.md](./PRODUCTION.md).

#### Step 5: Configure Custom Domain
1. Go to Domains tab in Vercel project
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` to your domain

### 2. Railway (Full-Stack Alternative)

#### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

#### Step 2: Initialize Project
```bash
railway init
railway link
```

#### Step 3: Deploy Services
```bash
# Deploy backend
cd backend
railway up

# Deploy frontend
cd ../frontend
railway up
```

#### Step 4: Configure Services
1. Add all environment variables via Railway dashboard
2. Configure custom domain
3. Set up database connections

### 3. AWS (Advanced Setup)

#### Architecture:
- **Frontend**: CloudFront + S3
- **Backend**: ECS Fargate or Lambda
- **Database**: RDS (MySQL) + DocumentDB (MongoDB)
- **Cache**: ElastiCache (Redis)

#### Step 1: Build and Push Images
```bash
# Build backend image
cd backend
docker build -t onetapstay-backend .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag onetapstay-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/onetapstay-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/onetapstay-backend:latest

# Build frontend
cd ../frontend
npm run build
aws s3 sync out/ s3://onetapstay-frontend --delete
```

#### Step 2: Deploy Infrastructure
Use the provided Terraform configuration:
```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

### 4. Google Cloud Platform

#### Step 1: Enable APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
```

#### Step 2: Deploy Backend
```bash
cd backend
gcloud builds submit --tag gcr.io/PROJECT-ID/onetapstay-backend
gcloud run deploy onetapstay-backend --image gcr.io/PROJECT-ID/onetapstay-backend --platform managed
```

#### Step 3: Deploy Frontend
```bash
cd frontend
npm run build
gsutil -m rsync -r -d out gs://onetapstay-frontend
```

## Database Setup

### MySQL (PlanetScale - Recommended)

1. Create account at [planetscale.com](https://planetscale.com)
2. Create new database: `onetapstay`
3. Create production branch
4. Get connection string
5. Run migrations:
```bash
npx prisma migrate deploy
npx prisma generate
```

### MongoDB (Atlas - Recommended)

1. Create account at [mongodb.com](https://mongodb.com)
2. Create new cluster
3. Configure network access (0.0.0.0/0 for cloud deployments)
4. Create database user
5. Get connection string

### Redis (Upstash - Recommended)

1. Create account at [upstash.com](https://upstash.com)
2. Create new Redis database
3. Choose region close to your app deployment
4. Get connection URL

## SSL Certificate Setup

### Automatic (Recommended)
Most platforms (Vercel, Railway, CloudFlare) provide automatic SSL certificates.

### Manual (Let's Encrypt)
```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Configure renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## DNS Configuration

### Required DNS Records:
```
Type    Name    Value                   TTL
A       @       <your-server-ip>        300
A       www     <your-server-ip>        300
CNAME   api     <your-backend-url>      300
TXT     @       v=spf1 include:_spf.google.com ~all  300
```

### Vercel DNS:
```
Type    Name    Value
CNAME   @       cname.vercel-dns.com
CNAME   www     cname.vercel-dns.com
```

## Monitoring Setup

### 1. Application Monitoring (Sentry)
```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Create new project
sentry-cli projects create onetapstay

# Upload source maps (for better error tracking)
sentry-cli releases files <version> upload-sourcemaps ./frontend/.next
```

### 2. Performance Monitoring (New Relic/DataDog)
Add monitoring agent to your deployment configuration.

### 3. Uptime Monitoring (Pingdom/UptimeRobot)
Configure HTTP checks for:
- Main website: `https://yourdomain.com`
- API health: `https://yourdomain.com/api/health`
- Database connectivity: Custom endpoint

## Security Hardening

### 1. Rate Limiting
Ensure rate limiting is enabled (already configured in the backend).

### 2. CORS Configuration
Update CORS settings for your domain:
```javascript
// backend/src/index.ts
app.use(cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true
}))
```

### 3. Firewall Rules
Configure cloud provider firewall to allow only:
- Port 443 (HTTPS)
- Port 80 (HTTP, redirects to HTTPS)
- Database ports (only from app servers)

### 4. Environment Variables
Never commit sensitive data. Use platform-specific secret management.

## Testing Deployment

### 1. Smoke Tests
```bash
# Test API endpoints
curl -X GET https://yourdomain.com/api/health
curl -X POST https://yourdomain.com/api/auth/send-otp -d '{"phone":"+1234567890"}'

# Test frontend
curl -I https://yourdomain.com
```

### 2. End-to-End Tests
Run the complete test suite against production:
```bash
npm run test:e2e -- --baseUrl=https://yourdomain.com
```

### 3. Load Testing
Use tools like Artillery or K6 to test under load:
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run loadtest-config.yml
```

## Rollback Strategy

### Quick Rollback (Vercel)
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback <deployment-url>
```

### Database Rollback
```bash
# Prisma migration rollback
npx prisma migrate reset

# Restore from backup
# (Implementation depends on your backup strategy)
```

## Monitoring Checklist

After deployment, verify:

- [ ] Website loads correctly (https://yourdomain.com)
- [ ] API endpoints respond (https://yourdomain.com/api/health)
- [ ] Database connections work
- [ ] SMS sending works (test OTP)
- [ ] Payment processing works (test with small amount)
- [ ] Error tracking is receiving data
- [ ] Performance monitoring is active
- [ ] SSL certificate is valid
- [ ] All redirects work correctly
- [ ] Mobile app features work (if applicable)

## Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Database Connection Issues**
   - Verify connection strings
   - Check network security groups
   - Ensure SSL settings match

3. **Environment Variable Issues**
   - Check variable names (case-sensitive)
   - Verify all required variables are set
   - Check for special characters in values

4. **API Endpoint 404s**
   - Verify API routes are correctly deployed
   - Check reverse proxy configuration
   - Ensure CORS is properly configured

For additional help:
- Check platform-specific documentation
- Review application logs
- Contact platform support if needed

## Maintenance

### Regular Tasks:
- Monitor error rates and performance
- Update dependencies monthly
- Review and rotate API keys quarterly
- Update SSL certificates (if manual)
- Review backup and disaster recovery procedures
- Monitor cost and optimize resources

### Scaling Considerations:
- Database connection pooling
- CDN for static assets
- Load balancing for high traffic
- Auto-scaling configuration
- Database read replicas
- Caching strategies