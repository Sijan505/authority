-- AlterTable
ALTER TABLE "users" ADD COLUMN     "group_read_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "group_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'message',
    "body" TEXT NOT NULL,
    "join_key" TEXT,
    "removed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_messages_join_key_key" ON "group_messages"("join_key");

-- CreateIndex
CREATE INDEX "group_messages_created_at_idx" ON "group_messages"("created_at");

-- AddForeignKey
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Members who opened the app before the group existed start with nothing unread.
UPDATE "users" SET "group_read_at" = CURRENT_TIMESTAMP;
