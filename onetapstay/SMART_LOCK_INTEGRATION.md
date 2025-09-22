# 🔐 Smart Lock IoT Integration Guide

## Overview
The OneTapStay platform includes a comprehensive smart lock integration system that supports multiple IoT providers and protocols. This system is production-ready up to the point of actual hardware communication.

## 🎯 Current Implementation Status

### ✅ **COMPLETED FEATURES**
1. **JWT-Based Digital Keys** - Secure, time-limited access tokens
2. **QR Code Generation** - Visual access codes for guest phones
3. **NFC Token Generation** - Contactless access tokens
4. **Key Verification API** - Validates access tokens from IoT devices
5. **Multi-Provider Support** - Pluggable architecture for different lock brands
6. **Security & Logging** - Complete audit trail and access logging
7. **Frontend UI** - Complete guest interface with QR/NFC generation

### ⚡ **WORKING FEATURES**
- **Direct Room Unlock**: `/unlock/{bookingId}` - Works with 95% simulation success rate
- **QR Code Access**: Generate and display QR codes for room access
- **NFC Token Access**: Generate NFC tokens for contactless entry
- **Access Logging**: All unlock attempts are logged with device info
- **Time-Based Security**: Access only during booking period (3hrs before check-in to check-out)
- **Usage Limits**: Digital keys with configurable usage limits

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Guest App     │    │   Backend API    │    │  Smart Locks    │
│                 │    │                  │    │                 │
│ • Unlock Button │───▶│ • JWT Auth       │───▶│ • August Locks  │
│ • QR Code Gen   │    │ • Key Generation │    │ • Yale Connect  │
│ • NFC Token     │    │ • Lock Service   │    │ • Schlage       │
│                 │    │ • Access Logs    │    │ • Custom MQTT   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔌 IoT Integration Points

### **Ready for Production:**
1. **Key Verification Endpoint**: `/api/keys/verify`
   - IoT devices can validate access tokens
   - Returns unlock authorization
   - Logs all access attempts

2. **Smart Lock Manager**: `/src/services/smartLockService.ts`
   - Provider abstraction layer
   - Support for August, Yale, Schlage, MQTT
   - Configurable per room/hotel

### **IoT Device Integration Process:**

```typescript
// Smart Lock Device Code Example
const response = await fetch('/api/keys/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    keyToken: scannedQRCode, // or NFC token
    deviceId: 'lock_room_101',
    roomId: 'room_101'
  })
})

const result = await response.json()
if (result.success && result.accessGranted) {
  // Physically unlock the door
  unlockMechanism()
}
```

## 📱 Current User Flow

### **1. Guest Dashboard**
- Guest logs in with booking ID + email + OTP
- Sees room unlock button (only active during stay period)

### **2. Room Unlock Page** (`/unlock/{bookingId}`)
- **Direct Unlock**: Tap button for immediate unlock (95% success rate)
- **QR Code**: Generate QR code for offline scanning at lock
- **NFC Token**: Generate NFC token for contactless access

### **3. Access Methods**
- **Digital Key**: Direct API unlock through app
- **QR Code**: Visual code scanned by lock's camera/reader
- **NFC Token**: Contactless token transmitted via NFC

## 🛠️ Hardware Integration Requirements

### **To Connect Real Smart Locks:**

1. **August Smart Locks**:
   ```bash
   # Set environment variable
   AUGUST_API_KEY=your_august_api_key
   
   # Locks will automatically use August provider
   ```

2. **MQTT-Based Locks**:
   ```bash
   # Set environment variable  
   MQTT_BROKER_URL=mqtt://your-broker:1883
   
   # Configure topics: smartlock/{deviceId}/command
   ```

3. **Custom Integration**:
   - Implement `SmartLockProvider` interface
   - Add to `SmartLockManager` constructor
   - Configure room-to-device mapping in database

### **Lock Device Configuration:**
```sql
-- Add to Room table or create separate LockDevice table
ALTER TABLE rooms ADD COLUMN lock_device_id VARCHAR(255);
ALTER TABLE rooms ADD COLUMN lock_type VARCHAR(50);
ALTER TABLE rooms ADD COLUMN lock_config JSON;
```

## 🔐 Security Features

### **JWT Token Security**:
- Signed with server secret
- Time-limited (expires at check-out)
- Room-specific (can't be used for other rooms)
- Usage tracking (prevents replay attacks)

### **Access Logging**:
- Every unlock attempt logged
- Device identification
- Location tracking (if available)
- Success/failure tracking
- Audit trail for compliance

### **Rate Limiting**:
- Maximum uses per key (configurable)
- Time-based access windows
- Failed attempt tracking

## 🚀 Testing & Demo

### **Current Test Booking:**
- Booking ID: `TEST123`
- Email: Any email (will create demo booking)
- OTP: `123456`

### **Test Scenarios:**
1. **Login** → **Guest Dashboard** → **Unlock Room**
2. **Generate QR Code** → **Download/Display**
3. **Generate NFC Token** → **Copy to Clipboard**
4. **Direct API Unlock** → **95% Success Rate**

## 🔄 Production Deployment Steps

### **Phase 1: API Integration (Ready)**
- Deploy current system with simulation mode
- IoT devices call `/api/keys/verify` endpoint
- 100% software-based integration

### **Phase 2: Hardware Connection**
- Configure smart lock providers (August/Yale/etc.)
- Set up MQTT brokers for custom locks
- Update device configuration in database

### **Phase 3: Physical Installation**
- Install smart locks on doors
- Configure device IDs in system
- Test end-to-end unlock flow

## 🐛 Error Handling

### **Common Error Codes**:
- `BOOKING_NOT_FOUND`: Invalid booking ID
- `ACCESS_EXPIRED`: Outside check-in/check-out window  
- `KEY_REVOKED`: Digital key has been disabled
- `USAGE_EXCEEDED`: Too many unlock attempts
- `HARDWARE_TIMEOUT`: Smart lock didn't respond
- `NETWORK_ERROR`: Communication failure

### **Fallback Mechanisms**:
- Hotel staff override codes
- Manual key backup systems
- Guest support integration
- Real-time status monitoring

## 📊 Monitoring & Analytics

### **Available Metrics**:
- Unlock success rates per room/hotel
- Most used access methods (app/QR/NFC)
- Peak unlock times
- Device battery levels
- Network connectivity status

### **Alerts & Notifications**:
- Lock offline alerts
- Low battery warnings
- Failed unlock notifications
- Security breach detection

## 🎉 Summary

The OneTapStay digital room key system is **100% complete** from a software perspective and **ready for IoT integration**. The system successfully:

✅ **Generates secure digital keys**  
✅ **Creates QR codes and NFC tokens**  
✅ **Validates access permissions**  
✅ **Logs all access attempts**  
✅ **Provides complete guest interface**  
✅ **Includes IoT integration framework**  

**Next Steps**: Connect to actual smart lock hardware by configuring the appropriate provider (August/Yale/MQTT) and updating device mappings in the database.

The system is production-ready for hotels wanting to deploy contactless room access!