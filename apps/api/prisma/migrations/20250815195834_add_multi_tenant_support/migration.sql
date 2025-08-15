/*
  Warnings:

  - Made the column `createdBy` on table `ShareLink` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `userId` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create default admin user for existing data
INSERT INTO "User" ("id", "email", "name", "createdAt", "updatedAt") 
VALUES ('admin-user-001', 'admin@example.com', 'Admin User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShareLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "viewParams" TEXT,
    "expiresAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "ShareLink_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ShareLink" ("createdAt", "createdBy", "expiresAt", "id", "permission", "revokedAt", "token", "type", "viewParams") SELECT "createdAt", COALESCE("createdBy", 'admin-user-001'), "expiresAt", "id", "permission", "revokedAt", "token", "type", "viewParams" FROM "ShareLink";
DROP TABLE "ShareLink";
ALTER TABLE "new_ShareLink" RENAME TO "ShareLink";
CREATE UNIQUE INDEX "ShareLink_token_key" ON "ShareLink"("token");
CREATE INDEX "ShareLink_expiresAt_idx" ON "ShareLink"("expiresAt");
CREATE INDEX "ShareLink_createdBy_idx" ON "ShareLink"("createdBy");
CREATE TABLE "new_Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Staff" ("id", "name", "userId") SELECT "id", "name", 'admin-user-001' FROM "Staff";
DROP TABLE "Staff";
ALTER TABLE "new_Staff" RENAME TO "Staff";
CREATE INDEX "Staff_userId_name_idx" ON "Staff"("userId", "name");
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mandays" INTEGER NOT NULL DEFAULT 1,
    "jiraUrl" TEXT,
    "theme" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("createdAt", "id", "jiraUrl", "mandays", "name", "theme", "updatedAt", "userId") SELECT "createdAt", "id", "jiraUrl", "mandays", "name", "theme", "updatedAt", 'admin-user-001' FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_userId_theme_idx" ON "Task"("userId", "theme");
CREATE INDEX "Task_theme_idx" ON "Task"("theme");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
