-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "edited_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "group_messages" ADD COLUMN     "edited_at" TIMESTAMP(3);
