-- CreateEnum
CREATE TYPE "ShareholderRole" AS ENUM ('OWNER', 'TECHNICAL_PARTNER');

-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('OPEN', 'FINALIZED');

-- CreateTable
CREATE TABLE "shareholders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "ShareholderRole" NOT NULL,
    "basis_points" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shareholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_periods" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "status" "PeriodStatus" NOT NULL DEFAULT 'OPEN',
    "net_sales_paisa" BIGINT NOT NULL,
    "payment_count" INTEGER NOT NULL,
    "finalized_at" TIMESTAMP(3),
    "finalized_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_allocations" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "shareholder_id" TEXT,
    "name" TEXT NOT NULL,
    "role" "ShareholderRole" NOT NULL,
    "basis_points" INTEGER NOT NULL,
    "amount_paisa" BIGINT NOT NULL,

    CONSTRAINT "revenue_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "revenue_periods_month_key" ON "revenue_periods"("month");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_allocations_period_id_shareholder_id_key" ON "revenue_allocations"("period_id", "shareholder_id");

-- AddForeignKey
ALTER TABLE "revenue_allocations" ADD CONSTRAINT "revenue_allocations_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "revenue_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_allocations" ADD CONSTRAINT "revenue_allocations_shareholder_id_fkey" FOREIGN KEY ("shareholder_id") REFERENCES "shareholders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

