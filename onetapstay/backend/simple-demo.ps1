Write-Host "🏨 OneTapStay Timeout Alarm System - Demo" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

Write-Host "`n1️⃣ Checking Backend Status..." -ForegroundColor Yellow
$stats = Invoke-RestMethod -Uri "http://localhost:5000/api/timeout/stats" -Method GET
Write-Host "✅ Backend Running - Total Timeouts: $($stats.data.totalTimeouts)" -ForegroundColor Green

Write-Host "`n2️⃣ Starting Timeout Monitoring..." -ForegroundColor Yellow
$start = Invoke-RestMethod -Uri "http://localhost:5000/api/timeout/start" -Method POST
Write-Host "✅ $($start.message)" -ForegroundColor Green

Write-Host "`n3️⃣ Creating Test Booking..." -ForegroundColor Yellow
$bookingId = "DEMO-$(Get-Date -Format 'HHmmss')"
$pastTime = (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss.000Z")
$booking = "{`"externalBookingId`":`"$bookingId`",`"guestName`":`"Demo User`",`"guestEmail`":`"demo@test.com`",`"roomNumber`":`"999`",`"checkIn`":`"2025-09-20T14:00:00.000Z`",`"checkOut`":`"$pastTime`",`"hotelName`":`"Demo Hotel`",`"roomType`":`"Suite`"}"

$result = Invoke-RestMethod -Uri "http://localhost:5000/api/staff/bookings" -Method POST -Body $booking -ContentType "application/json"
Write-Host "✅ Booking Created: $bookingId" -ForegroundColor Green

Write-Host "`n4️⃣ Triggering Timeout Check..." -ForegroundColor Yellow
$check = Invoke-RestMethod -Uri "http://localhost:5000/api/timeout/check" -Method POST
Write-Host "✅ $($check.message)" -ForegroundColor Green

Write-Host "`n5️⃣ Checking for Alarms..." -ForegroundColor Yellow
$alarms = Invoke-RestMethod -Uri "http://localhost:5000/api/timeout/alarms" -Method GET
Write-Host "🚨 Active Alarms: $($alarms.data.totalActiveAlarms)" -ForegroundColor Red

Write-Host "`n🎯 TEST URLS:" -ForegroundColor Yellow
Write-Host "Staff Dashboard: http://localhost:3000/staff" -ForegroundColor Cyan
Write-Host "Alarm Test: http://localhost:3000/alarm-test" -ForegroundColor Cyan

Write-Host "`n✅ SYSTEM READY FOR TESTING!" -ForegroundColor Green