-- CreateTable
CREATE TABLE "GalleryRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "galleryCode" TEXT NOT NULL,
    "userToken" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GalleryRole_galleryCode_fkey" FOREIGN KEY ("galleryCode") REFERENCES "Gallery" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GalleryRole_galleryCode_userToken_key" ON "GalleryRole"("galleryCode", "userToken");
