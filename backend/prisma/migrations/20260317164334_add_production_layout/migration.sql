-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "supplier_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT DEFAULT 'General',
    "status" TEXT NOT NULL DEFAULT 'approved',
    "address" JSONB,
    "primary_contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "rating" DOUBLE PRECISION DEFAULT 4.0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "inspection_number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "batch_number" TEXT,
    "inspected_by" TEXT,
    "inspection_date" TIMESTAMP(3) NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'pending',
    "sample_size" INTEGER NOT NULL DEFAULT 0,
    "defect_count" INTEGER NOT NULL DEFAULT 0,
    "inspection_points" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inspection_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "calibration_number" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "model" TEXT,
    "serial_number" TEXT NOT NULL,
    "location" TEXT,
    "last_calibration" TIMESTAMP(3),
    "next_calibration" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'calibrated',
    "calibrated_by" TEXT,
    "uncertainty" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "calibration_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppliers_tenant_id_status_idx" ON "suppliers"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_tenant_id_supplier_code_key" ON "suppliers"("tenant_id", "supplier_code");

-- CreateIndex
CREATE INDEX "inspection_records_tenant_id_type_idx" ON "inspection_records"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "inspection_records_tenant_id_result_idx" ON "inspection_records"("tenant_id", "result");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_records_tenant_id_inspection_number_key" ON "inspection_records"("tenant_id", "inspection_number");

-- CreateIndex
CREATE INDEX "calibration_records_tenant_id_status_idx" ON "calibration_records"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "calibration_records_tenant_id_calibration_number_key" ON "calibration_records"("tenant_id", "calibration_number");

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_records" ADD CONSTRAINT "inspection_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibration_records" ADD CONSTRAINT "calibration_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
