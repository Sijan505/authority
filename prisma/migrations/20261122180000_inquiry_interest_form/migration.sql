-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "contact" TEXT,
ADD COLUMN     "contact_type" TEXT,
ADD COLUMN     "contribution" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "deposit" TEXT,
ADD COLUMN     "field" TEXT,
ADD COLUMN     "help_build" TEXT,
ADD COLUMN     "perks" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "price_band" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "source_detail" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "world" DROP NOT NULL,
ALTER COLUMN "role" DROP NOT NULL,
ALTER COLUMN "building" DROP NOT NULL,
ALTER COLUMN "interests" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "bring" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "inquiries_contact_key" ON "inquiries"("contact");

