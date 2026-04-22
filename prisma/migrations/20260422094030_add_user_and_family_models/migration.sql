/*
  Warnings:

  - Added the required column `familyId` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - The required column `magicLinkToken` was added to the `Profile` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUserId" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "isPublishedToGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Family_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "relation" TEXT,
    "shareSlug" TEXT NOT NULL,
    "magicLinkToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("age", "createdAt", "id", "name", "relation", "shareSlug", "updatedAt") SELECT "age", "createdAt", "id", "name", "relation", "shareSlug", "updatedAt" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_shareSlug_key" ON "Profile"("shareSlug");
CREATE UNIQUE INDEX "Profile_magicLinkToken_key" ON "Profile"("magicLinkToken");
CREATE INDEX "Profile_familyId_idx" ON "Profile"("familyId");
CREATE INDEX "Profile_magicLinkToken_idx" ON "Profile"("magicLinkToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Family_adminUserId_idx" ON "Family"("adminUserId");

-- CreateIndex
CREATE INDEX "Family_isPublishedToGlobal_idx" ON "Family"("isPublishedToGlobal");
