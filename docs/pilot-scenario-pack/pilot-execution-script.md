# Pilot Execution Script

Use this script with real plant data only. Do not rely on placeholder rows or generated demo records.

## Stage 0 - Pre-Pilot Preparation

1. Open `/quality-home`.
2. Confirm System Readiness and Pilot Readiness sections are visible.
3. Export the initial Pilot Readiness Report.
4. Record any configuration gap in the Pilot Issue Log.

## Stage 1 - Setup Master Data

1. Open `/quality-master-data`.
2. Import real Parts Master using `import-templates/parts-master.csv`.
3. Import real Defects Master using `import-templates/defects-master.csv`.
4. Import real Models Master using `import-templates/models-master.csv`.
5. Confirm search, duplicate detection, active/inactive status, and export work.
6. Return to `/quality-home` and confirm Master Data readiness improves.

## Stage 2 - Configure Form Designer

1. Open `/quality-form-designer`.
2. Import or recreate the form template structure.
3. Replace all placeholder labels/options with real factory fields.
4. Configure lookup mappings:
   - `partNumber` fills part name, model, supplier, unit cost, line, and inspection point.
   - `defectType` fills defect category, severity, and cost category.
5. Validate formulas:
   - `estimatedCost = quantity * unitCost`
   - `ppmPreview = quantity / inspectedQuantity * 1000000`
6. Preview the form as Inspector and Quality Engineer.
7. Publish only after validation warnings are reviewed.

## Stage 3 - Build Inspection and Audit Plans

1. Open `/quality-inspection-plans`.
2. Import or build a pilot inspection plan from real process criteria.
3. Add real required checks, acceptance criteria, evidence rules, and defect mapping.
4. Publish the plan.
5. Open `/quality-audits`.
6. Import or build a layered audit plan from real supervisor audit criteria.
7. Keep the audit plan draft until the supervisor verifies it.

## Stage 4 - Execute Shopfloor Inspection

1. Open `/quality-shopfloor`.
2. Select real line/model/inspection point.
3. Start an inspection run.
4. Complete checks using real observations.
5. For one legitimate failed check, use Create Defect from Failed Check.
6. Save defect after user review.
7. Confirm `/quality-execution-board` shows the run and failed-check follow-up status.

## Stage 5 - Defect Workflow and Escalation

1. Open `/defect-log`.
2. Confirm the defect appears in Daily Defects.
3. Verify recordType, quantity, inspectedQuantity, part, model, line, severity, and evidence.
4. Run workflow action: submit/review/investigate as allowed by role.
5. If pilot criteria require it, elevate to NCR manually.
6. Confirm related IDs and audit trail persist after refresh.

## Stage 6 - Improvement Action and Effectiveness

1. Open `/quality-command-center`.
2. Create an improvement action from a real risk or defect.
3. Assign owner and due date.
4. Move action through in-progress and pending verification.
5. Refresh effectiveness calculation after enough real before/after records exist.
6. Record whether the signal is Strong, Moderate, Weak, or Insufficient Data.

## Stage 7 - Knowledge and Search

1. Open `/quality-knowledge-base`.
2. Create a lesson from a verified closed-loop case only.
3. Open `/quality-search`.
4. Ask a local question based on the pilot data.
5. Confirm results show related records and safe wording.

## Stage 8 - Management Reporting and Backup

1. Open `/quality-command-center`.
2. Review overview, risk board, data health, backup/sync, and management report.
3. Export selected backup.
4. Return to `/quality-home`.
5. Export final Pilot Readiness Report.
6. Complete `pilot-final-report-template.md`.

