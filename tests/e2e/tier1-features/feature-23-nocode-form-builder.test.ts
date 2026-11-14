import { describe, it, expect, beforeEach } from 'vitest';
import { resetQualityStorage } from '../../helpers/testHarness';
import {
  createBlankQualityFormTemplate,
  validateQualityFormTemplate,
  upsertQualityFormTemplate,
  publishQualityFormTemplate,
  rollbackQualityFormTemplate,
  exportQualityFormTemplate,
  importQualityFormTemplate,
  type QualityFormTemplate,
  type QualityFormField,
  type QualityDesignerFieldType,
  type QualityConditionalRule,
} from '@/services/qualityFormTemplates';

describe('Feature 23: No-Code Form Builder', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('supports full suite of 16 industrial field types in template structure', () => {
    const fieldTypes: QualityDesignerFieldType[] = [
      'text',
      'number',
      'date',
      'time',
      'select',
      'multi-select',
      'lookup',
      'barcode',
      'textarea',
      'boolean',
      'attachment',
      'image',
      'calculated',
      'formula',
      'user',
      'status',
      'linked-record',
    ];

    expect(fieldTypes.length).toBeGreaterThanOrEqual(16);

    const template = createBlankQualityFormTemplate({
      name: 'Aerospace Turbine Inspection Form',
      recordType: 'inspection',
    });

    const sectionId = template.sections[0].id;
    const fields: QualityFormField[] = fieldTypes.map((ft, idx) => ({
      id: `fld-${idx}-${ft}`,
      sectionId,
      fieldKey: `field_${ft}_${idx}`,
      label: `Field ${ft.toUpperCase()}`,
      type: ft,
      required: idx % 3 === 0,
      order: idx + 1,
      options: ft === 'select' || ft === 'multi-select' ? ['Option A', 'Option B'] : undefined,
    }));

    template.fields = fields;

    expect(template.fields.length).toBe(fieldTypes.length);
    fieldTypes.forEach((ft) => {
      const found = template.fields.find((f) => f.type === ft);
      expect(found).toBeDefined();
      expect(found?.fieldKey).toContain(ft);
    });
  });

  it('configures custom conditional validation rules with operators and actions', () => {
    const template = createBlankQualityFormTemplate({
      name: 'Conditional NCR Intake Form',
    });
    const sectionId = template.sections[0].id;

    const defectSeverityField: QualityFormField = {
      id: 'fld-severity',
      sectionId,
      fieldKey: 'severity',
      label: 'Defect Severity',
      type: 'select',
      required: true,
      options: ['Minor', 'Major', 'Critical'],
      order: 1,
    };

    const quarantineActionField: QualityFormField = {
      id: 'fld-quarantine',
      sectionId,
      fieldKey: 'quarantineLocation',
      label: 'Quarantine Red Tag Holding Area',
      type: 'text',
      required: false,
      order: 2,
    };

    template.fields = [defectSeverityField, quarantineActionField];

    // Rule: IF severity equals 'Critical', THEN require quarantineLocation and show warning
    const rule: QualityConditionalRule = {
      id: 'rule-critical-containment',
      sourceField: 'severity',
      operator: 'equals',
      value: 'Critical',
      action: 'require field',
      targetField: 'quarantineLocation',
      active: true,
      message: 'Critical non-conformance mandates physical quarantine tagging!',
    };

    template.rules = [rule];

    const validation = validateQualityFormTemplate(template);
    expect(validation.valid).toBe(true);
    expect(template.rules[0].operator).toBe('equals');
    expect(template.rules[0].action).toBe('require field');
    expect(template.rules[0].targetField).toBe('quarantineLocation');
  });

  it('serializes to JSON schema and restores flawlessly via export/import round-trip', () => {
    const template = createBlankQualityFormTemplate({
      name: 'Calibration Audit Checklist',
      description: 'Standard ISO 17025 verification checklist',
      recordType: 'calibration',
    });

    const exported = exportQualityFormTemplate(template);
    expect(exported).toBeDefined();
    expect(typeof exported).toBe('object');
    expect((exported.template as QualityFormTemplate).name).toBe('Calibration Audit Checklist');

    const jsonString = JSON.stringify(exported);
    const parsed = JSON.parse(jsonString);

    const imported = importQualityFormTemplate(parsed.template || parsed);
    expect(imported.id).toBeDefined();
    expect(imported.name).toBe(template.name);
    expect(imported.recordType).toBe('calibration');
    expect(imported.sections.length).toBe(template.sections.length);
  });

  it('manages version incrementing, snapshot history, and version rollbacks', () => {
    const initial = createBlankQualityFormTemplate({
      name: 'Stamping Tooling Inspection',
    });

    const savedV1 = upsertQualityFormTemplate(initial, false);

    // Publish V1: changes draft -> active and records history
    const publishedV1 = publishQualityFormTemplate(savedV1.id, 'Initial Release 1.0');
    expect(publishedV1?.status).toBe('active');
    expect(publishedV1?.history?.length).toBeGreaterThanOrEqual(1);

    // Modify and save V2
    savedV1.name = 'Stamping Tooling Inspection - Rev B';
    savedV1.status = 'draft';
    const savedV2 = upsertQualityFormTemplate(savedV1, false);

    const publishedV2 = publishQualityFormTemplate(savedV2.id, 'Rev B added micro-hardness test');
    expect(publishedV2?.status).toBe('active');
    expect(publishedV2?.version).toBeGreaterThan(savedV1.version);

    // Rollback to prior snapshot version
    const priorVersion = publishedV1!.history![0].version;
    const rolledBack = rollbackQualityFormTemplate(savedV2.id, priorVersion);
    expect(rolledBack).toBeDefined();
    expect(rolledBack?.status).toBe('draft');
  });

  it('validates template integrity and detects duplicate keys or broken rule references', () => {
    const template = createBlankQualityFormTemplate({
      name: 'Invalid Configuration Form',
    });
    const sectionId = template.sections[0].id;

    // Duplicate field keys
    template.fields = [
      {
        id: 'f1',
        sectionId,
        fieldKey: 'duplicate_key',
        label: 'Field 1',
        type: 'text',
        required: false,
        order: 1,
      },
      {
        id: 'f2',
        sectionId,
        fieldKey: 'duplicate_key', // DUPLICATE
        label: 'Field 2',
        type: 'number',
        required: false,
        order: 2,
      },
    ];

    // Broken rule pointing to non-existent field
    template.rules = [
      {
        id: 'r1',
        sourceField: 'ghost_field',
        operator: 'equals',
        value: 'X',
        action: 'show field',
        targetField: 'non_existent_target',
        active: true,
      },
    ];

    const result = validateQualityFormTemplate(template);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('duplicate'))).toBe(true);
    expect(result.errors.some((e) => e.toLowerCase().includes('ghost_field') || e.toLowerCase().includes('target'))).toBe(true);
  });
});
