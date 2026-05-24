-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "logo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plant_id" TEXT,
    "department_id" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "avatar" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" TEXT,
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ncr_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "ncr_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "detected_date" TIMESTAMP(3) NOT NULL,
    "reported_by_id" TEXT NOT NULL,
    "assigned_to_id" TEXT,
    "department" TEXT,
    "product_code" TEXT,
    "lot_number" TEXT,
    "quantity_affected" INTEGER,
    "root_cause" TEXT,
    "containment_action" TEXT,
    "corrective_action" TEXT,
    "preventive_action" TEXT,
    "capa_id" TEXT,
    "closed_at" TIMESTAMP(3),
    "closed_by_id" TEXT,
    "updated_by_id" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ncr_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ncr_comments" (
    "id" TEXT NOT NULL,
    "ncr_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ncr_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ncr_approvals" (
    "id" TEXT NOT NULL,
    "ncr_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "ncr_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capa_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "capa_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_id" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "assigned_to_id" TEXT,
    "due_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "effectiveness" TEXT,
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "verification_notes" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,

    CONSTRAINT "capa_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capa_actions" (
    "id" TEXT NOT NULL,
    "capa_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "assigned_to" TEXT,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "evidence" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capa_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eight_d_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "d_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customer_name" TEXT,
    "customer_ref" TEXT,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "team_members" JSONB NOT NULL DEFAULT '[]',
    "team_lead_id" TEXT,
    "problem_description" TEXT,
    "what" TEXT,
    "where" TEXT,
    "when" TEXT,
    "who" TEXT,
    "why" TEXT,
    "how" TEXT,
    "how_many" INTEGER,
    "containment_actions" TEXT,
    "containment_date" TIMESTAMP(3),
    "root_cause" TEXT,
    "escape_point" TEXT,
    "corrective_actions" TEXT,
    "implementation_date" TIMESTAMP(3),
    "preventive_actions" TEXT,
    "lessons_learned" TEXT,
    "completed_at" TIMESTAMP(3),
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eight_d_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deviation_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "deviation_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "duration" INTEGER,
    "product_code" TEXT,
    "product_name" TEXT,
    "batch_number" TEXT,
    "process_name" TEXT,
    "reason" TEXT NOT NULL,
    "impact" TEXT,
    "risk_assessment" TEXT,
    "requested_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "approved_until" TIMESTAMP(3),
    "closed_by_id" TEXT,
    "closed_at" TIMESTAMP(3),
    "closure_notes" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "related_ncr_id" TEXT,
    "related_capa_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "deviation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_control_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "change_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "current_state" TEXT NOT NULL,
    "proposed_state" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "quality_impact" TEXT,
    "safety_impact" TEXT,
    "regulatory_impact" TEXT,
    "cost_impact" TEXT,
    "timeline_impact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "requested_by_id" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL,
    "implementation_plan" TEXT,
    "implementation_date" TIMESTAMP(3),
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "verification_result" TEXT,
    "closed_at" TIMESTAMP(3),
    "closed_by_id" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "change_control_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_approvals" (
    "id" TEXT NOT NULL,
    "change_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "change_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "complaint_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_code" TEXT,
    "customer_contact" TEXT,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "severity" TEXT NOT NULL DEFAULT 'minor',
    "product_name" TEXT,
    "product_code" TEXT,
    "batch_number" TEXT,
    "quantity_affected" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'new',
    "assigned_to_id" TEXT,
    "received_date" TIMESTAMP(3) NOT NULL,
    "acknowledged_at" TIMESTAMP(3),
    "target_close_date" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "root_cause" TEXT,
    "investigation_notes" TEXT,
    "investigated_by_id" TEXT,
    "investigated_at" TIMESTAMP(3),
    "resolution" TEXT,
    "corrective_action" TEXT,
    "preventive_action" TEXT,
    "related_capa_id" TEXT,
    "customer_satisfaction" TEXT,
    "feedback" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "complaint_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "control_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "product_name" TEXT,
    "product_code" TEXT,
    "process_name" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "prepared_by_id" TEXT NOT NULL,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "effective_date" TIMESTAMP(3),
    "obsolete_date" TIMESTAMP(3),
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "control_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_characteristics" (
    "id" TEXT NOT NULL,
    "control_plan_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "process_step" TEXT NOT NULL,
    "characteristic" TEXT NOT NULL,
    "specification" TEXT NOT NULL,
    "tolerance" TEXT,
    "measurement_method" TEXT,
    "sample_size" INTEGER,
    "sample_frequency" TEXT,
    "control_method" TEXT,
    "reaction_plan" TEXT,
    "responsible" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "control_characteristics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fmea_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fmea_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "product_name" TEXT,
    "process_name" TEXT,
    "team_members" JSONB NOT NULL DEFAULT '[]',
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fmea_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fmea_items" (
    "id" TEXT NOT NULL,
    "fmea_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "function" TEXT NOT NULL,
    "failure_mode" TEXT NOT NULL,
    "failure_effect" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "cause" TEXT NOT NULL,
    "occurrence" INTEGER NOT NULL DEFAULT 1,
    "current_controls" TEXT,
    "detection" INTEGER NOT NULL DEFAULT 1,
    "rpn" INTEGER NOT NULL,
    "recommended_action" TEXT,
    "responsibility" TEXT,
    "target_date" TIMESTAMP(3),
    "action_taken" TEXT,
    "action_date" TIMESTAMP(3),
    "new_severity" INTEGER,
    "new_occurrence" INTEGER,
    "new_detection" INTEGER,
    "new_rpn" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fmea_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "audit_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "lead_auditor_id" TEXT NOT NULL,
    "auditors" JSONB NOT NULL DEFAULT '[]',
    "auditees" JSONB NOT NULL DEFAULT '[]',
    "location" TEXT,
    "findings_summary" TEXT,
    "report_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_findings" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "finding_number" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "clause" TEXT,
    "evidence" TEXT,
    "corrective_action_required" BOOLEAN NOT NULL DEFAULT true,
    "capa_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spc_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "chart_type" TEXT NOT NULL,
    "characteristic" TEXT NOT NULL,
    "part_number" TEXT NOT NULL,
    "process_name" TEXT NOT NULL,
    "machine_id" TEXT,
    "sample_size" INTEGER NOT NULL,
    "sample_frequency" TEXT NOT NULL,
    "ucl" DOUBLE PRECISION NOT NULL,
    "lcl" DOUBLE PRECISION NOT NULL,
    "center_line" DOUBLE PRECISION NOT NULL,
    "usl" DOUBLE PRECISION,
    "lsl" DOUBLE PRECISION,
    "cp" DOUBLE PRECISION,
    "cpk" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spc_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spc_data_points" (
    "id" TEXT NOT NULL,
    "spc_record_id" TEXT NOT NULL,
    "sample_number" TEXT NOT NULL,
    "sample_date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "values" JSONB NOT NULL,
    "is_out_of_control" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spc_data_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spc_rule_violations" (
    "id" TEXT NOT NULL,
    "spc_record_id" TEXT NOT NULL,
    "rule_number" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "data_point_ids" JSONB NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by" TEXT,

    CONSTRAINT "spc_rule_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "machine_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "model" TEXT,
    "serial_number" TEXT,
    "manufacturer" TEXT,
    "installation_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "location" TEXT,
    "specifications" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iot_devices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "machine_id" TEXT,
    "device_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "mqtt_topic" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'online',
    "battery_level" INTEGER,
    "signal_strength" INTEGER,
    "last_reading_at" TIMESTAMP(3),
    "last_reading_value" DOUBLE PRECISION,
    "unit" TEXT,
    "thresholds" JSONB NOT NULL DEFAULT '{}',
    "calibration_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iot_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_data_points" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "device_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "is_anomaly" BOOLEAN NOT NULL DEFAULT false,
    "anomaly_score" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_data_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entity_type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "action_type" TEXT NOT NULL,
    "assignee_role_id" TEXT,
    "assignee_user_id" TEXT,
    "sla_hours" INTEGER,
    "escalation_user_id" TEXT,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "next_step_id" TEXT,
    "reject_step_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "current_step_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_history" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "schedule" TEXT,
    "last_run_at" TIMESTAMP(3),
    "last_run_status" TEXT,
    "file_url" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");

-- CreateIndex
CREATE UNIQUE INDEX "plants_tenant_id_code_key" ON "plants"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_plant_id_code_key" ON "departments"("plant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenant_id_name_key" ON "roles"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "ncr_records_tenant_id_status_idx" ON "ncr_records"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "ncr_records_tenant_id_plant_id_idx" ON "ncr_records"("tenant_id", "plant_id");

-- CreateIndex
CREATE UNIQUE INDEX "ncr_records_tenant_id_ncr_number_key" ON "ncr_records"("tenant_id", "ncr_number");

-- CreateIndex
CREATE INDEX "capa_records_tenant_id_status_idx" ON "capa_records"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "capa_records_tenant_id_capa_number_key" ON "capa_records"("tenant_id", "capa_number");

-- CreateIndex
CREATE UNIQUE INDEX "eight_d_records_tenant_id_d_number_key" ON "eight_d_records"("tenant_id", "d_number");

-- CreateIndex
CREATE INDEX "deviation_records_tenant_id_status_idx" ON "deviation_records"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "deviation_records_tenant_id_deviation_number_key" ON "deviation_records"("tenant_id", "deviation_number");

-- CreateIndex
CREATE INDEX "change_control_records_tenant_id_status_idx" ON "change_control_records"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "change_control_records_tenant_id_change_number_key" ON "change_control_records"("tenant_id", "change_number");

-- CreateIndex
CREATE INDEX "complaint_records_tenant_id_status_idx" ON "complaint_records"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "complaint_records_tenant_id_customer_name_idx" ON "complaint_records"("tenant_id", "customer_name");

-- CreateIndex
CREATE UNIQUE INDEX "complaint_records_tenant_id_complaint_id_key" ON "complaint_records"("tenant_id", "complaint_id");

-- CreateIndex
CREATE INDEX "control_plans_tenant_id_status_idx" ON "control_plans"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "control_plans_tenant_id_control_plan_id_key" ON "control_plans"("tenant_id", "control_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "fmea_records_tenant_id_fmea_number_key" ON "fmea_records"("tenant_id", "fmea_number");

-- CreateIndex
CREATE UNIQUE INDEX "audit_records_tenant_id_audit_number_key" ON "audit_records"("tenant_id", "audit_number");

-- CreateIndex
CREATE INDEX "spc_data_points_spc_record_id_sample_date_idx" ON "spc_data_points"("spc_record_id", "sample_date");

-- CreateIndex
CREATE UNIQUE INDEX "machines_plant_id_machine_code_key" ON "machines"("plant_id", "machine_code");

-- CreateIndex
CREATE UNIQUE INDEX "iot_devices_tenant_id_device_code_key" ON "iot_devices"("tenant_id", "device_code");

-- CreateIndex
CREATE INDEX "machine_data_points_machine_id_timestamp_idx" ON "machine_data_points"("machine_id", "timestamp");

-- CreateIndex
CREATE INDEX "machine_data_points_device_id_timestamp_idx" ON "machine_data_points"("device_id", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_instances_entity_type_entity_id_key" ON "workflow_instances"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_entity_type_idx" ON "audit_logs"("tenant_id", "entity_type");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_user_id_idx" ON "audit_logs"("tenant_id", "user_id");

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncr_records" ADD CONSTRAINT "ncr_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncr_records" ADD CONSTRAINT "ncr_records_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncr_records" ADD CONSTRAINT "ncr_records_reported_by_id_fkey" FOREIGN KEY ("reported_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncr_records" ADD CONSTRAINT "ncr_records_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncr_records" ADD CONSTRAINT "ncr_records_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncr_comments" ADD CONSTRAINT "ncr_comments_ncr_id_fkey" FOREIGN KEY ("ncr_id") REFERENCES "ncr_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncr_approvals" ADD CONSTRAINT "ncr_approvals_ncr_id_fkey" FOREIGN KEY ("ncr_id") REFERENCES "ncr_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capa_records" ADD CONSTRAINT "capa_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capa_records" ADD CONSTRAINT "capa_records_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capa_records" ADD CONSTRAINT "capa_records_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capa_records" ADD CONSTRAINT "capa_records_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capa_records" ADD CONSTRAINT "capa_records_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capa_actions" ADD CONSTRAINT "capa_actions_capa_id_fkey" FOREIGN KEY ("capa_id") REFERENCES "capa_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eight_d_records" ADD CONSTRAINT "eight_d_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deviation_records" ADD CONSTRAINT "deviation_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_control_records" ADD CONSTRAINT "change_control_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_approvals" ADD CONSTRAINT "change_approvals_change_id_fkey" FOREIGN KEY ("change_id") REFERENCES "change_control_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_records" ADD CONSTRAINT "complaint_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_plans" ADD CONSTRAINT "control_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_characteristics" ADD CONSTRAINT "control_characteristics_control_plan_id_fkey" FOREIGN KEY ("control_plan_id") REFERENCES "control_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fmea_records" ADD CONSTRAINT "fmea_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fmea_items" ADD CONSTRAINT "fmea_items_fmea_id_fkey" FOREIGN KEY ("fmea_id") REFERENCES "fmea_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_records" ADD CONSTRAINT "audit_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audit_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spc_records" ADD CONSTRAINT "spc_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spc_data_points" ADD CONSTRAINT "spc_data_points_spc_record_id_fkey" FOREIGN KEY ("spc_record_id") REFERENCES "spc_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spc_rule_violations" ADD CONSTRAINT "spc_rule_violations_spc_record_id_fkey" FOREIGN KEY ("spc_record_id") REFERENCES "spc_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_data_points" ADD CONSTRAINT "machine_data_points_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_data_points" ADD CONSTRAINT "machine_data_points_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "iot_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
