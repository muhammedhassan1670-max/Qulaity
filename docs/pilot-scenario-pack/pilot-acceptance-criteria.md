# Pilot Acceptance Criteria

Use this checklist to decide whether the local/offline-first pilot is ready for controlled rollout.

## 1. Route Health

- `npm run check:routes` passes.
- `/quality-home` opens.
- `/quality-master-data` opens.
- `/quality-form-designer` opens.
- `/quality-inspection-plans` opens.
- `/quality-shopfloor` opens.
- `/quality-execution-board` opens.
- `/defect-log` opens.
- `/quality-command-center` opens.
- `/quality-search` opens.
- `/quality-knowledge-base` opens.
- `/ncr`, `/capa`, and `/8d` remain reachable through existing routes.

Acceptance: no broken route or sidebar mismatch.

## 2. Form Designer Success

- A defect-log template can be created or imported.
- Template can be edited without code changes.
- Template can be previewed.
- Template can be published.
- Existing Defect Recorder still loads if no active template is available.

Acceptance: a quality engineer can publish a pilot form without developer help.

## 3. Lookup and Formula Validation

- Part lookup reads real Parts Master.
- Defect lookup reads real Defects Master.
- Auto-fill uses fill-empty-only behavior by default.
- Formula sandbox validates PPM and estimated cost.
- Divide-by-zero or missing-value behavior does not crash the form.

Acceptance: no silent overwrite of manually entered values and no formula crash.

## 4. Shopfloor Defect Creation

- Shopfloor Entry opens on mobile-sized viewport.
- Barcode/partNumber entry is accepted.
- Lookup fills available fields.
- Save Draft works.
- Save & New works.
- Created record appears in Defect Recorder.

Acceptance: inspector can create one real record with minimal typing.

## 5. Inspection Run Completion

- Active inspection plan loads in Shopfloor Entry.
- Check results can be pass/fail/NA.
- Numeric checks can capture measured values.
- Evidence requirement is visible.
- Failed check can create a defect after user confirmation.
- Execution Board shows run, failures, and created defect count.

Acceptance: failed-check-to-defect journey is traceable.

## 6. Defect Escalation

- Defect details show workflow and related data.
- Elevate to NCR remains user-triggered.
- relatedNcrId updates after elevation.
- Duplicate escalation button is hidden or disabled after linkage.
- Audit trail persists after refresh.

Acceptance: escalation is controlled and traceable.

## 7. Action Effectiveness

- Improvement action can be created from a real defect/risk.
- Owner and due date can be assigned.
- Status transitions work.
- Effectiveness check uses real matching defect records.
- Insufficient data is shown when before/after evidence is weak.

Acceptance: no guaranteed effectiveness claim is shown.

## 8. Knowledge and Search Usage

- Lesson can be created from verified closed-loop case.
- Knowledge item can be searched.
- Unified Search returns real local records only.
- Assistant response includes data limitations and confidence label.

Acceptance: search and knowledge support decisions without claiming confirmed root cause.

## 9. Command Center Reporting

- Command Center cards are based on real records.
- Risk board shows empty state if no real risks exist.
- Data Health identifies missing fields and backup/sync status.
- Management Report can be generated after real records exist.

Acceptance: no fake KPI appears.

## 10. Backup / Export Validation

- Quality backup export works.
- Setup report export works.
- Pilot readiness report export works.
- Exported reports do not include unnecessary raw dataset rows.

Acceptance: pilot data can be backed up and reviewed offline.

