/*
  Warnings:

  - You are about to drop the column `accessMethod` on the `access_logs` table. All the data in the column will be lost.
  - You are about to drop the column `roomNumber` on the `access_logs` table. All the data in the column will be lost.
  - You are about to drop the column `nfcToken` on the `room_keys` table. All the data in the column will be lost.
  - You are about to drop the column `qrCode` on the `room_keys` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "facilities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hotelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "operatingHours" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresPayment" BOOLEAN NOT NULL DEFAULT false,
    "allowsCredit" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "facilities_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "facility_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "facility_services_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "facility_staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "facility_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facility_staff_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "facility_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "serviceId" TEXT,
    "staffId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "facility_transactions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facility_transactions_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facility_transactions_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "facility_services" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "guest_journey_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "facilityId" TEXT,
    "facilityTransactionId" TEXT,
    "roomKeyId" TEXT,
    "amount" REAL,
    "currency" TEXT DEFAULT 'USD',
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guest_journey_events_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "guest_journey_events_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "guest_journey_events_facilityTransactionId_fkey" FOREIGN KEY ("facilityTransactionId") REFERENCES "facility_transactions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "guest_journey_events_roomKeyId_fkey" FOREIGN KEY ("roomKeyId") REFERENCES "room_keys" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_access_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "keyId" TEXT,
    "action" TEXT NOT NULL,
    "device" TEXT,
    "ipAddress" TEXT,
    "location" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "access_logs_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "room_keys" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_access_logs" ("action", "createdAt", "device", "errorMessage", "id", "ipAddress", "keyId", "location", "success", "userId") SELECT "action", "createdAt", "device", "errorMessage", "id", "ipAddress", "keyId", "location", "success", "userId" FROM "access_logs";
DROP TABLE "access_logs";
ALTER TABLE "new_access_logs" RENAME TO "access_logs";
CREATE TABLE "new_room_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "keyType" TEXT NOT NULL,
    "keyData" TEXT NOT NULL,
    "validFrom" DATETIME NOT NULL,
    "validUntil" DATETIME NOT NULL,
    "maxUses" INTEGER DEFAULT 1000,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "room_keys_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "room_keys_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_room_keys" ("bookingId", "createdAt", "id", "isActive", "isRevoked", "keyData", "keyType", "maxUses", "roomId", "updatedAt", "usedCount", "validFrom", "validUntil") SELECT "bookingId", "createdAt", "id", "isActive", "isRevoked", "keyData", "keyType", "maxUses", "roomId", "updatedAt", "usedCount", "validFrom", "validUntil" FROM "room_keys";
DROP TABLE "room_keys";
ALTER TABLE "new_room_keys" RENAME TO "room_keys";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "facility_staff_userId_facilityId_key" ON "facility_staff"("userId", "facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_journey_events_facilityTransactionId_key" ON "guest_journey_events"("facilityTransactionId");
