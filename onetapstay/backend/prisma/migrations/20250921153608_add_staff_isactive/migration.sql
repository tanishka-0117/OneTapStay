-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_staff_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "department" TEXT,
    "position" TEXT,
    "permissions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hiredAt" DATETIME,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "staff_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_staff_accounts" ("createdAt", "department", "employeeId", "hiredAt", "id", "lastLogin", "permissions", "position", "updatedAt", "userId") SELECT "createdAt", "department", "employeeId", "hiredAt", "id", "lastLogin", "permissions", "position", "updatedAt", "userId" FROM "staff_accounts";
DROP TABLE "staff_accounts";
ALTER TABLE "new_staff_accounts" RENAME TO "staff_accounts";
CREATE UNIQUE INDEX "staff_accounts_userId_key" ON "staff_accounts"("userId");
CREATE UNIQUE INDEX "staff_accounts_employeeId_key" ON "staff_accounts"("employeeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
