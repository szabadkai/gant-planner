-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mandays" INTEGER NOT NULL DEFAULT 1,
    "jiraUrl" TEXT,
    "theme" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Assignment" (
    "taskId" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT,
    "position" DECIMAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "viewParams" TEXT,
    "expiresAt" DATETIME,
    "revokedAt" DATETIME,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ShareSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shareId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "csvUrl" TEXT,
    "jsonUrl" TEXT,
    "pngUrl" TEXT,
    "pdfUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShareSnapshot_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "ShareLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Task_theme_idx" ON "Task"("theme");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_name_key" ON "Staff"("name");

-- CreateIndex
CREATE INDEX "Assignment_staffId_position_idx" ON "Assignment"("staffId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_token_key" ON "ShareLink"("token");

-- CreateIndex
CREATE INDEX "ShareLink_expiresAt_idx" ON "ShareLink"("expiresAt");

-- CreateIndex
CREATE INDEX "ShareSnapshot_shareId_idx" ON "ShareSnapshot"("shareId");
