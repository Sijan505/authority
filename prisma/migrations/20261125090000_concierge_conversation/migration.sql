-- AlterTable
ALTER TABLE "concierge_requests" ADD COLUMN     "member_unread" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "needs_team" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "replies_locked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "concierge_messages" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "from_team" BOOLEAN NOT NULL,
    "author_id" TEXT,
    "body" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concierge_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "concierge_messages_request_id_created_at_idx" ON "concierge_messages"("request_id", "created_at");

-- AddForeignKey
ALTER TABLE "concierge_messages" ADD CONSTRAINT "concierge_messages_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "concierge_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Carry over the replies written before conversations existed, as the first team message.
INSERT INTO "concierge_messages" ("id", "request_id", "from_team", "author_id", "body", "created_at")
SELECT 'migrated_' || "id", "id", true, NULL, "reply", "updated_at"
FROM "concierge_requests"
WHERE "reply" IS NOT NULL AND "reply" <> '';

-- Requests the team already answered aren't waiting for the team.
UPDATE "concierge_requests" SET "needs_team" = false WHERE "reply" IS NOT NULL AND "reply" <> '';
