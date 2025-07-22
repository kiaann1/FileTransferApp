/*
  Warnings:

  - You are about to drop the column `userToken` on the `GalleryRole` table. All the data in the column will be lost.
  - Added the required column `userId` to the `GalleryRole` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GalleryRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "galleryCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GalleryRole_galleryCode_fkey" FOREIGN KEY ("galleryCode") REFERENCES "Gallery" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GalleryRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GalleryRole" ("createdAt", "galleryCode", "id", "role") SELECT "createdAt", "galleryCode", "id", "role" FROM "GalleryRole";
DROP TABLE "GalleryRole";
ALTER TABLE "new_GalleryRole" RENAME TO "GalleryRole";
CREATE UNIQUE INDEX "GalleryRole_galleryCode_userId_key" ON "GalleryRole"("galleryCode", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
