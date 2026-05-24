# QMS Pilot Scenario Pack

This pack is external to the application code. It does not load anything automatically and does not create demo records inside the platform.

Use it to prepare a controlled pilot using real factory data only.

## Contents

- `import-templates/parts-master.csv`
- `import-templates/defects-master.csv`
- `import-templates/models-master.csv`
- `import-templates/form-template.defect-log.structure.json`
- `import-templates/inspection-plan.structure.json`
- `import-templates/audit-plan.structure.json`
- `pilot-execution-script.md`
- `pilot-acceptance-criteria.md`
- `pilot-issue-categories.md`
- `pilot-final-report-template.md`

## Important Rule

Do not import these structure files as final production setup without replacing placeholders with real factory values. They are templates for pilot preparation, not generated app data.

## Suggested Pilot Flow

1. Fill the CSV templates with real parts, models, and defect definitions.
2. Import Master Data from the platform UI.
3. Import or manually build the form, inspection plan, and audit plan from the structure JSON files.
4. Publish only after reviewing lookup mappings, formula fields, required fields, and role visibility.
5. Execute the pilot script and log findings in the Pilot Issue Log inside `/quality-home`.
6. Export the Pilot Readiness Report and complete the final report template.

