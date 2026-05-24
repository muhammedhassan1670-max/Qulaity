-- CreateTable
CREATE TABLE "ProductionLayout" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "plantId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "layout" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID,
    "updatedById" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductionLayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductionLayout_plantId_idx" ON "ProductionLayout"("plantId");

-- CreateIndex
CREATE INDEX "ProductionLayout_isPublished_idx" ON "ProductionLayout"("isPublished");

-- CreateIndex
CREATE INDEX "ProductionLayout_deletedAt_idx" ON "ProductionLayout"("deletedAt");

-- AddForeignKey
ALTER TABLE "ProductionLayout" ADD CONSTRAINT "ProductionLayout_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
