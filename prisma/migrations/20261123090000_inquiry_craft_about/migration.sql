-- AlterTable
ALTER TABLE "applications" ALTER COLUMN "deposit" DROP NOT NULL;

-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "about" TEXT,
ADD COLUMN     "craft" TEXT;

