/*
  Warnings:

  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" DATETIME,
    "avatar" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC'
);
-- Update NULL emails to temporary email addresses before migration
UPDATE "users" SET "email" = "temp_" || substr("id", 1, 8) || "@example.com" WHERE "email" IS NULL;

INSERT INTO "new_users" ("avatar", "createdAt", "dateOfBirth", "email", "firstName", "id", "isActive", "isVerified", "lastName", "phone", "preferredLanguage", "timezone", "type", "updatedAt") SELECT "avatar", "createdAt", "dateOfBirth", "email", "firstName", "id", "isActive", "isVerified", "lastName", "phone", "preferredLanguage", "timezone", "type", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
