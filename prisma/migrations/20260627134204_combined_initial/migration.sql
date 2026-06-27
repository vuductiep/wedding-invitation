-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "rsvpAttendance" TEXT,
    "rsvpAccompanyCount" INTEGER,
    "rsvpMessage" TEXT,
    "rsvpUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestbookMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guestId" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GuestbookMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_slug_key" ON "Guest"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GuestbookMessage_guestId_key" ON "GuestbookMessage"("guestId");

-- AddForeignKey
ALTER TABLE "GuestbookMessage" ADD CONSTRAINT "GuestbookMessage_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
