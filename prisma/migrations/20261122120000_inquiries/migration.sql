-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT,
    "world" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "link" TEXT,
    "interests" TEXT[],
    "bring" TEXT NOT NULL,
    "referrer" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inquiries_created_at_idx" ON "inquiries"("created_at");

