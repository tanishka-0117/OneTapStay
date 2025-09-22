-- AlterTable
ALTER TABLE "access_logs" ADD COLUMN "accessMethod" TEXT;
ALTER TABLE "access_logs" ADD COLUMN "roomNumber" TEXT;

-- AlterTable
ALTER TABLE "room_keys" ADD COLUMN "nfcToken" TEXT;
ALTER TABLE "room_keys" ADD COLUMN "qrCode" TEXT;

-- CreateTable
CREATE TABLE "hotel_wifi_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hotelId" TEXT NOT NULL,
    "networkName" TEXT NOT NULL,
    "networkPassword" TEXT,
    "guestNetworkName" TEXT NOT NULL,
    "passwordFormat" TEXT NOT NULL DEFAULT 'HOTEL_{BOOKING_ID}_{YEAR}',
    "securityType" TEXT NOT NULL DEFAULT 'WPA2-Personal',
    "bandwidth" TEXT NOT NULL DEFAULT '50 Mbps',
    "connectionType" TEXT NOT NULL DEFAULT 'automatic',
    "qrCodeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoConnect" BOOLEAN NOT NULL DEFAULT true,
    "validityHours" INTEGER NOT NULL DEFAULT 72,
    "supportInstructions" TEXT,
    "customInstructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hotel_wifi_configs_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "hotel_wifi_configs_hotelId_key" ON "hotel_wifi_configs"("hotelId");
