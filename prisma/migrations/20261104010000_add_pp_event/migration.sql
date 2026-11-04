-- CreateTable
CREATE TABLE "PpEvent" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PpEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PpEvent_shop_type_idx" ON "PpEvent"("shop", "type");

