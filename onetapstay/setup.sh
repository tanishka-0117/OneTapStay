#!/bin/bash

# OneTapStay Setup Script
# This script installs dependencies and sets up the development environment

set -e

echo "🚀 OneTapStay Setup Script"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Backend dependencies installed"
cd ..

# Create environment files if they don't exist
if [ ! -f .env.local ]; then
    echo "📄 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your API keys"
fi

if [ ! -f backend/.env ]; then
    echo "📄 Creating backend .env file..."
    cat > backend/.env << EOL
NODE_ENV=development
PORT=5000

# Database URLs (update with your actual database URLs)
DATABASE_URL="mysql://root:password@localhost:3306/onetapstay_dev"
MONGODB_URI="mongodb://localhost:27017/onetapstay_dev"
REDIS_URL="redis://localhost:6379"

# Test database URLs
TEST_DATABASE_URL="mysql://root:password@localhost:3306/onetapstay_test"
TEST_MONGODB_URI="mongodb://localhost:27017/onetapstay_test"
TEST_REDIS_URL="redis://localhost:6380"

# Security
JWT_SECRET="dev-secret-change-in-production-$(openssl rand -base64 32 | tr -d '\n')"
NEXTAUTH_SECRET="dev-nextauth-secret-$(openssl rand -base64 32 | tr -d '\n')"
NEXTAUTH_URL="http://localhost:3000"

# Twilio (use test credentials)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+15005550006"

# Stripe (use test keys)
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_test_your-webhook-secret"

# Lock Provider (mock/test)
LOCK_PROVIDER_API_KEY="test-lock-api-key"
LOCK_PROVIDER_SECRET="test-lock-secret"
EOL
    echo "⚠️  Please update backend/.env with your actual API keys"
fi

if [ ! -f frontend/.env.local ]; then
    echo "📄 Creating frontend .env.local file..."
    cat > frontend/.env.local << EOL
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="dev-nextauth-secret-$(openssl rand -base64 32 | tr -d '\n')"

NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
EOL
    echo "⚠️  Please update frontend/.env.local with your actual API keys"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update environment variables in .env.local and backend/.env"
echo "2. Start your databases (MySQL, MongoDB, Redis)"
echo "3. Run database migrations: cd backend && npm run prisma:migrate"
echo "4. Seed the database: cd backend && npm run prisma:seed"
echo "5. Start the development servers:"
echo "   - Backend: cd backend && npm run dev"
echo "   - Frontend: cd frontend && npm run dev"
echo ""
echo "📚 For detailed setup instructions, see README.md"
echo "🚀 For deployment instructions, see DEPLOYMENT.md"