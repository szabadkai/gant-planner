-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mandays" INTEGER NOT NULL DEFAULT 1,
    "jiraUrl" TEXT,
    "theme" TEXT,
    "dependencies" TEXT,
    "dueDate" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("createdAt", "id", "jiraUrl", "mandays", "name", "projectId", "theme", "updatedAt", "userId") SELECT "createdAt", "id", "jiraUrl", "mandays", "name", "projectId", "theme", "updatedAt", "userId" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_userId_theme_idx" ON "Task"("userId", "theme");
CREATE INDEX "Task_projectId_theme_idx" ON "Task"("projectId", "theme");
CREATE INDEX "Task_theme_idx" ON "Task"("theme");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "Task_priority_idx" ON "Task"("priority");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
