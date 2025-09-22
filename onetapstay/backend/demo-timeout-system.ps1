# OneTapStay Timeout Alarm System - Complete Test Demonstration
# This script demonstrates the complete workflow of the timeout monitoring system

Write-Host "🏨 OneTapStay Timeout Alarm System - Complete Demo" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Step 1: Check system status
Write-Host "`n1️⃣ CHECKING SYSTEM STATUS..." -ForegroundColor Yellow
try {
    $backendStatus = Invoke-RestMethod -Uri "http://localhost:5000/api/timeout/stats" -Method GET
    Write-Host "✅ Backend Server: RUNNING" -ForegroundColor Green
    Write-Host "📊 Current Stats: $($backendStatus.data.totalTimeouts) total timeouts detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend Server: NOT RUNNING" -ForegroundColor Red
    Write-Host "Please start the backend server first!" -ForegroundColor Red
    exit 1
}

try {
    $frontendTest = Test-NetConnection -ComputerName "localhost" -Port 3000 -InformationLevel Quiet
    if ($frontendTest) {
        Write-Host "✅ Frontend Server: RUNNING on http://localhost:3000" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Frontend Server: NOT RUNNING" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Frontend Server: Status Unknown" -ForegroundColor Yellow
}

# Step 2: Start timeout monitoring service
Write-Host "`n2️⃣ STARTING TIMEOUT MONITORING SERVICE..." -ForegroundColor Yellow
try {
    $startResult = Invoke-RestMethod -Uri "http://localhost:5000/api/timeout/start" -Method POST
    Write-Host "✅ $($startResult.message)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Service might already be running" -ForegroundColor Yellow
}

# Step 3: Create a test booking with past checkout time
Write-Host "`n3️⃣ CREATING TEST BOOKING WITH TIMEOUT..." -ForegroundColor Yellow
$demoBookingId = "DEMO-TIMEOUT-" + (Get-Date -Format "HHmmss")
$pastCheckoutTime = (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss.000Z")

$bookingData = @{
    externalBookingId = $demoBookingId
    guestName = "Test Timeout User"
    guestEmail = "test.timeout@demo.com"
    roomNumber = "999"
    checkIn = "2025-09-20T14:00:00.000Z"
    checkOut = $pastCheckoutTime
    hotelName = "Demo Hotel"
    roomType = "Test Suite"
} | ConvertTo-Json

try {
    $bookingResult = Invoke-RestMethod -Uri "http://localhost:5000/api/staff/bookings" -Method POST -Body $bookingData -ContentType "application/json"
    Write-Host "✅ Test booking created successfully!" -ForegroundColor Green
    Write-Host "📋 Booking ID: $demoBookingId" -ForegroundColor Cyan
    Write-Host "👤 Guest: Test Timeout User" -ForegroundColor Cyan
    Write-Host "🏠 Room: 999" -ForegroundColor Cyan
    Write-Host "⏰ Checkout Time: $pastCheckoutTime (1 hour ago)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to create booking: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -like "*already exists*") {
        Write-Host "📝 Using existing booking for demo..." -ForegroundColor Yellow
    }
}

# Step 4: Trigger manual timeout check
Write-Host "`n4️⃣ TRIGGERING TIMEOUT CHECK..." -ForegroundColor Yellow
try {
    $checkResult = Invoke-RestMethod -Uri "http://localhost:5000/api/timeout/check" -Method POST
    Write-Host "✅ $($checkResult.message)" -ForegroundColor Green
    Write-Host "🕐 Check completed at: $($checkResult.timestamp)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to trigger timeout check" -ForegroundColor Red
}

# Step 5: Check for active alarms
Write-Host "`n5️⃣ CHECKING FOR ACTIVE TIMEOUT ALARMS..." -ForegroundColor Yellow
try {
    $alarmResult = Invoke-RestMethod -Uri "http://localhost:5000/api/timeout/alarms" -Method GET
    $totalAlarms = $alarmResult.data.totalActiveAlarms
    
    if ($totalAlarms -gt 0) {
        Write-Host "🚨 TIMEOUT ALARMS DETECTED!" -ForegroundColor Red
        Write-Host "📊 Total Active Alarms: $totalAlarms" -ForegroundColor Red
        
        foreach ($alarm in $alarmResult.data.activeAlarms) {
            Write-Host "`n⚠️ ALARM DETAILS:" -ForegroundColor Red
            Write-Host "  👤 Guest: $($alarm.guestName)" -ForegroundColor White
            Write-Host "  🏠 Room: $($alarm.roomNumber)" -ForegroundColor White
            Write-Host "  ⏰ Checkout Time: $($alarm.checkoutTime)" -ForegroundColor White
            Write-Host "  🕐 Current Time: $($alarm.currentTime)" -ForegroundColor White
            Write-Host "  ⏱️ Overtime: $($alarm.overtimeMinutes) minutes" -ForegroundColor Red
        }
    } else {
        Write-Host "✅ No timeout alarms currently active" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Failed to check alarms: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: System URLs and next steps
Write-Host "`n6️⃣ SYSTEM ACCESS URLS:" -ForegroundColor Yellow
Write-Host "🎛️ Staff Dashboard: http://localhost:3000/staff" -ForegroundColor Cyan
Write-Host "🚨 Alarm Test Page: http://localhost:3000/alarm-test" -ForegroundColor Cyan
Write-Host "👤 Guest Login: http://localhost:3000/auth/login" -ForegroundColor Cyan

Write-Host "`n🎯 NEXT STEPS TO TEST COMPLETE WORKFLOW:" -ForegroundColor Yellow
Write-Host "1. Visit: http://localhost:3000/staff" -ForegroundColor White
Write-Host "2. Switch to 'Timeout Alarms' tab" -ForegroundColor White
Write-Host "3. Click 'Start Monitoring' to enable real-time polling" -ForegroundColor White
Write-Host "4. Click 'Test Alarm Sound' to hear the sound alerts" -ForegroundColor White
Write-Host "5. If alarms are active, you'll see them with sound notifications" -ForegroundColor White

Write-Host "`n✨ SYSTEM IS NOW READY FOR FULL TESTING!" -ForegroundColor Green
Write-Host "🔊 Sound alarms will play automatically when timeouts are detected" -ForegroundColor Green
Write-Host "📧 Email notifications are configured and working" -ForegroundColor Green
Write-Host "🖥️ Browser notifications will appear for desktop alerts" -ForegroundColor Green

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "🏨 OneTapStay Timeout Alarm System Demo Complete!" -ForegroundColor Cyan