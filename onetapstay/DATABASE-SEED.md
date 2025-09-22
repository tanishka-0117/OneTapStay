# Database Seeding Guide

## Prerequisites

Before running the seed script, ensure you have:

1. **Database running**: MySQL server accessible
2. **Environment variables set**: Update `backend/.env` with your database connection
3. **Prisma migrations applied**: Run migrations first

## Quick Setup for Development

### 1. Start Database (Docker - Recommended)

```bash
# In root directory
docker-compose up -d mysql
```

### 2. Set Environment Variables

Update `backend/.env`:
```bash
DATABASE_URL="mysql://root:password@localhost:3306/onetapstay_dev"
```

### 3. Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name init
```

### 4. Run Seed Script

```bash
npm run prisma:seed
# or directly: npx tsx prisma/seed.ts
```

## What the Seed Creates

✅ **Demo Hotel Manager User**
- Phone: +1234567890
- Name: Demo Manager
- Email: manager@onetapstay.com
- Type: hotel

✅ **Demo Hotel**
- Name: OneTapStay Demo Hotel
- Address: 123 Demo Street, Demo City
- Features: WiFi, Pool, Gym, Restaurant, Spa

✅ **20 Demo Rooms**
- 4 Room Types: Standard, Deluxe, Suite, Presidential
- Room Numbers: 101-105, 201-205, etc.
- Smart lock integration ready
- Prices: $120-$500 per night

✅ **Demo Guest User**
- Phone: +1987654321
- Name: Demo Guest
- Email: guest@example.com
- Type: guest

✅ **Loyalty Account**
- 1,500 current points
- Silver tier status
- 2,000 total earned points

✅ **Sample Booking**
- 2-night stay
- Check-in: Tomorrow
- Status: Confirmed
- Total: $240 (2 nights × $120)

✅ **Payment Record**
- Amount: $240
- Status: Completed
- Method: Card
- Stripe integration ready

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db push

# Reset database if needed
npx prisma migrate reset
```

### Missing Environment Variables
Ensure all required variables in `backend/.env`:
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXTAUTH_SECRET`

### Seed Script Errors
```bash
# Clear and re-seed
npx prisma migrate reset
npm run prisma:seed
```

## Using Docker Compose

For complete development environment:

```bash
# Start all services
docker-compose up -d

# Wait for services to be ready, then:
cd backend
npx prisma migrate dev
npm run prisma:seed
```

## Production Notes

- **Never run seed script in production**
- Use proper migrations for production data
- Seed is for development and testing only
- Consider using fixtures or factories for tests