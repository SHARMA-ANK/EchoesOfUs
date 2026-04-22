-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "relation" TEXT,
    "shareSlug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "transcript" TEXT,
    "summary" TEXT,
    "audioUrl" TEXT,
    "voiceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Chapter_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_shareSlug_key" ON "Profile"("shareSlug");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_profileId_chapterNumber_key" ON "Chapter"("profileId", "chapterNumber");
