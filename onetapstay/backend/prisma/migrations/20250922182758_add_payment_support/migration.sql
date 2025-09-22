-- AlterTable
ALTER TABLE "users" ADD COLUMN "stripeCustomerId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "bookingId" TEXT,
    "facilityServiceId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT NOT NULL DEFAULT 'stripe',
    "stripePaymentIntentId" TEXT,
    "stripeCustomerId" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "refundAmount" REAL,
    "refundReason" TEXT,
    "refundedAt" DATETIME,
    "completedAt" DATETIME,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "bookingId", "createdAt", "currency", "description", "id", "metadata", "paymentMethod", "refundAmount", "refundReason", "refundedAt", "status", "stripeCustomerId", "stripePaymentIntentId", "updatedAt") SELECT "amount", "bookingId", "createdAt", "currency", "description", "id", "metadata", "paymentMethod", "refundAmount", "refundReason", "refundedAt", "status", "stripeCustomerId", "stripePaymentIntentId", "updatedAt" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "payments"("stripePaymentIntentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
