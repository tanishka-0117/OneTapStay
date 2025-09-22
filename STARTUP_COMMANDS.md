# OneTapStay - Complete Startup Commands Guide

## 🚀 Backend Server Commands

### Method 1: Using the PowerShell Script (Recommended)
```powershell
# Navigate to project root
cd "C:\Users\saxen\OneDrive\Documents\OneTapStay"

# Run the backend startup script
powershell -ExecutionPolicy Bypass -File "start_backend.ps1"
```

### Method 2: Manual Backend Startup
```powershell
# Navigate to backend directory
cd "C:\Users\saxen\OneDrive\Documents\OneTapStay\onetapstay\backend"

# Option A: Start with nodemon (auto-restart on file changes) - RECOMMENDED
npm run dev
# OR
npx nodemon

# Option B: Start with ts-node (manual restart needed)
npx ts-node src/index.ts
```

### Method 3: Using Built JavaScript (Alternative)
```powershell
# Navigate to backend directory
cd "C:\Users\saxen\OneDrive\Documents\OneTapStay\onetapstay\backend"

# Build TypeScript to JavaScript
npx tsc

# Run the built JavaScript
node dist/index.js
```

## 🌐 Frontend Server Commands

### Start Frontend Server
```powershell
# Navigate to frontend directory
cd "C:\Users\saxen\OneDrive\Documents\OneTapStay\onetapstay\frontend"

# Start Next.js development server
npm run dev
# OR
npx next dev

# Frontend will run on: http://localhost:3001
```

## 🔧 Troubleshooting Commands

### Kill Conflicting Processes
```powershell
# Find what's using port 5000 (backend)
netstat -ano | findstr :5000

# Kill specific process (replace PID with actual process ID)
taskkill /PID [PID] /F

# Kill all node processes (nuclear option)
taskkill /F /IM node.exe

# Find what's using port 3000/3001 (frontend)
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

### Check if Servers are Running
```powershell
# Test Backend (should return success message)
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/test-email" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@example.com"}'

# Test Frontend (open in browser)
# http://localhost:3001
```

## 📝 Complete Startup Sequence

### Step 1: Start Backend
```powershell
# Open PowerShell as Administrator (recommended)
cd "C:\Users\saxen\OneDrive\Documents\OneTapStay\onetapstay\backend"
npx ts-node src/index.ts
```

### Step 2: Start Frontend (in new terminal)
```powershell
# Open new PowerShell window
cd "C:\Users\saxen\OneDrive\Documents\OneTapStay\onetapstay\frontend"
npm run dev
```

### Step 3: Verify Both are Running
- Backend: http://localhost:5000 (API endpoints)
- Frontend: http://localhost:3001 (web interface)

## 🎯 Quick Test Commands

### Test Backend API
```powershell
# Test email functionality
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/test-email" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@example.com"}'

# Create a test booking
$checkIn = (Get-Date "2025-09-22 15:00:00").ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$checkOut = (Get-Date "2025-09-23 11:00:00").ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
Invoke-RestMethod -Uri "http://localhost:5000/api/staff/bookings" -Method POST -Headers @{"Content-Type"="application/json"} -Body "{`"externalBookingId`":`"TEST123`",`"guestName`":`"Test User`",`"guestEmail`":`"test@example.com`",`"roomNumber`":`"101`",`"roomType`":`"standard`",`"hotelName`":`"Test Hotel`",`"checkIn`":`"$checkIn`",`"checkOut`":`"$checkOut`",`"status`":`"confirmed`"}"

# Test OTP with booking validation
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/send-otp" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@example.com","bookingId":"TEST123"}'
```

## 📂 Important URLs

### Backend Endpoints (http://localhost:5000)
- `POST /api/auth/test-email` - Test email functionality
- `POST /api/auth/send-otp` - Send OTP (requires booking validation)
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/staff/bookings` - Create booking (staff)
- `GET /api/staff/bookings` - List bookings (staff)

### Frontend Pages (http://localhost:3001)
- `/` - Home page
- `/auth/login` - Guest login (booking ID + email)
- `/staff` - Staff dashboard
- `/staff/bookings/new` - Create new booking (staff)
- `/guest/dashboard` - Guest dashboard (after login)

## 🔥 One-Line Startup Commands

### Start Both Servers (run in separate terminals)
```powershell
# Terminal 1 - Backend
cd "C:\Users\saxen\OneDrive\Documents\OneTapStay\onetapstay\backend" && npx ts-node src/index.ts

# Terminal 2 - Frontend  
cd "C:\Users\saxen\OneDrive\Documents\OneTapStay\onetapstay\frontend" && npm run dev
```

## ⚡ Environment Check
```powershell
# Check Node.js version (should be 16+)
node --version

# Check npm version
npm --version

# Check if TypeScript is available
npx tsc --version
```

## 🛠️ Package Installation (if needed)
```powershell
# Backend dependencies
cd "C:\Users\saxen\OneDrive\Documents\OneTapStay\onetapstay\backend"
npm install

# Frontend dependencies  
cd "C:\Users\saxen\OneDrive\Documents\OneTapStay\onetapstay\frontend"
npm install
```

---

## 🎉 Success Indicators

### Backend Started Successfully:
- Console shows: "🚀 Server running on port 5000"
- Console shows: "📧 Email service configured"
- Console shows: "🗄️ Database connected"

### Frontend Started Successfully:
- Console shows: "✓ Ready on http://localhost:3001"
- Browser opens automatically or manually go to http://localhost:3001

### Both Working:
- Staff can create bookings at: http://localhost:3001/staff/bookings/new
- Guests can login at: http://localhost:3001/auth/login
- API responds to test requests without errors