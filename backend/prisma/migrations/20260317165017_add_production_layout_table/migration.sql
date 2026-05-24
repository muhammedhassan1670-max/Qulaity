-- CreateTable
CREATE TABLE "production_layouts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plant_id" TEXT,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "layout" JSONB NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "production_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "production_layouts_tenant_id_plant_id_idx" ON "production_layouts"("tenant_id", "plant_id");

-- CreateIndex
CREATE INDEX "production_layouts_tenant_id_is_published_idx" ON "production_layouts"("tenant_id", "is_published");

-- AddForeignKey
ALTER TABLE "production_layouts" ADD CONSTRAINT "production_layouts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_layouts" ADD CONSTRAINT "production_layouts_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
