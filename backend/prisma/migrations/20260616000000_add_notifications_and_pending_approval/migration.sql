-- Add PENDING_APPROVAL to BorrowStatus enum
ALTER TYPE "BorrowStatus" ADD VALUE 'PENDING_APPROVAL' BEFORE 'BORROWED';

-- Create NotificationType enum
CREATE TYPE "NotificationType" AS ENUM ('BORROW_REQUEST', 'BORROW_APPROVED', 'BORROW_REJECTED', 'OVERDUE_REMINDER', 'RESERVATION_READY', 'FINE_ISSUED');

-- Create Notification table
CREATE TABLE "Notification" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "type"      "NotificationType" NOT NULL,
    "title"     TEXT NOT NULL,
    "message"   TEXT NOT NULL,
    "read"      BOOLEAN NOT NULL DEFAULT false,
    "link"      TEXT,
    "data"      JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- Foreign key
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
