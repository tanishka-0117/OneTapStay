@echo off
REM OneTapStay Setup Script for Windows
REM This script installs dependencies and sets up the development environment

echo 🚀 OneTapStay Setup Script
echo ==========================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed.
    exit /b 1
)

echo ✅ npm version: 
npm --version

REM Install root dependencies
echo 📦 Installing root dependencies...
npm install

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
npm install
cd ..

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
npm install

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npx prisma generate

echo ✅ Backend dependencies installed
cd ..

REM Create environment files if they don't exist
if not exist .env.local (
    echo 📄 Creating .env.local from template...
    copy .env.example .env.local
    echo ⚠️  Please update .env.local with your API keys
)

if not exist backend\.env (
    echo 📄 Creating backend .env file...
    (
        echo NODE_ENV=development
        echo PORT=5000
        echo.
        echo # Database URLs ^(update with your actual database URLs^)
        echo DATABASE_URL="mysql://root:password@localhost:3306/onetapstay_dev"
        echo MONGODB_URI="mongodb://localhost:27017/onetapstay_dev"
        echo REDIS_URL="redis://localhost:6379"
        echo.
        echo # Test database URLs
        echo TEST_DATABASE_URL="mysql://root:password@localhost:3306/onetapstay_test"
        echo TEST_MONGODB_URI="mongodb://localhost:27017/onetapstay_test"
        echo TEST_REDIS_URL="redis://localhost:6380"
        echo.
        echo # Security
        echo JWT_SECRET="dev-secret-change-in-production"
        echo NEXTAUTH_SECRET="dev-nextauth-secret"
        echo NEXTAUTH_URL="http://localhost:3000"
        echo.
        echo # Twilio ^(use test credentials^)
        echo TWILIO_ACCOUNT_SID="your-twilio-account-sid"
        echo TWILIO_AUTH_TOKEN="your-twilio-auth-token"
        echo TWILIO_PHONE_NUMBER="+15005550006"
        echo.
        echo # Stripe ^(use test keys^)
        echo STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
        echo STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
        echo STRIPE_WEBHOOK_SECRET="whsec_test_your-webhook-secret"
        echo.
        echo # Lock Provider ^(mock/test^)
        echo LOCK_PROVIDER_API_KEY="test-lock-api-key"
        echo LOCK_PROVIDER_SECRET="test-lock-secret"
    ) > backend\.env
    echo ⚠️  Please update backend\.env with your actual API keys
)

if not exist frontend\.env.local (
    echo 📄 Creating frontend .env.local file...
    (
        echo NEXTAUTH_URL=http://localhost:3000
        echo NEXTAUTH_SECRET="dev-nextauth-secret"
        echo.
        echo NEXT_PUBLIC_API_URL=http://localhost:5000
        echo NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
    ) > frontend\.env.local
    echo ⚠️  Please update frontend\.env.local with your actual API keys
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Update environment variables in .env.local and backend\.env
echo 2. Start your databases ^(MySQL, MongoDB, Redis^)
echo 3. Run database migrations: cd backend ^&^& npm run prisma:migrate
echo 4. Seed the database: cd backend ^&^& npm run prisma:seed
echo 5. Start the development servers:
echo    - Backend: cd backend ^&^& npm run dev
echo    - Frontend: cd frontend ^&^& npm run dev
echo.
echo 📚 For detailed setup instructions, see README.md
echo 🚀 For deployment instructions, see DEPLOYMENT.md

pause