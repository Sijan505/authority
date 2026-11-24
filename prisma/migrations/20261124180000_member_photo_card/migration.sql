-- AlterTable
ALTER TABLE "users" ADD COLUMN     "member_code" TEXT,
ADD COLUMN     "photo" BYTEA,
ADD COLUMN     "photo_updated_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_member_code_key" ON "users"("member_code");

