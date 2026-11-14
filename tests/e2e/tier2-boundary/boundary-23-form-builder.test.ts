import { describe, it, expect, beforeEach } from 'vitest';
import { resetQualityStorage } from '../../helpers/testHarness';
import {
  createBlankQualityFormTemplate,
  validateQualityFormTemplate,
  importQualityFormTemplate,
  type QualityFormTemplate,
  type QualityFormField,
} from '@/services/qualityFormTemplates';

describe('Feature 23 Boundary: No-Code Form Builder', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('rejects form template with empty name or missing record type', () => {
    const invalidTemplate = createBlankQualityFormTemplate({
      name: '   ', // whitespace only
      recordType: '' as any,
    });

    const validation = validateQualityFormTemplate(invalidTemplate);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.toLowerCase().includes('name') || e.toLowerCase().includes('title'))).toBe(true);
  });

  it('detects duplicate field keys in the same form schema', () => {
    const template = createBlankQualityFormTemplate({
      name: 'Duplicate Key Test Form',
      recordType: 'inspection',
    });

    const secId = template.sections[0].id;
    template.fields = [
      {
        id: 'fld-1',
        sectionId: secId,
        fieldKey: 'duplicate_key',
        label: 'Field 1',
        type: 'text',
        order: 1,
      },
      {
        id: 'fld-2',
        sectionId: secId,
        fieldKey: 'duplicate_key', // duplicate!
        label: 'Field 2',
        type: 'number',
        order: 2,
      },
    ];

    const validation = validateQualityFormTemplate(template);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.toLowerCase().includes('duplicate') || e.toLowerCase().includes('key'))).toBe(true);
  });

  it('safely configures form templates with Arabic Unicode labels and sections', () => {
    const arabicTemplate = createBlankQualityFormTemplate({
      name: 'نموذج فحص الجودة الميداني لمحطة التجميع',
      recordType: 'inspection',
      description: 'نموذج إلكتروني لتسجيل قراءات الفحص البصري والقياسات الدقيقة',
    });

    const secId = arabicTemplate.sections[0].id;
    arabicTemplate.sections[0].title = 'بيانات التشغيلة والقطعة';
    arabicTemplate.fields = [
      {
        id: 'fld-ar-1',
        sectionId: secId,
        fieldKey: 'lot_number_ar',
        label: 'رقم التشغيلة / الدفعة',
        type: 'text',
        required: true,
        order: 1,
      },
      {
        id: 'fld-ar-2',
        sectionId: secId,
        fieldKey: 'inspection_decision_ar',
        label: 'قرار الفحص',
        type: 'select',
        options: ['مطابق للمواصفات', 'مرفوض - خردة', 'تحت المراجعة'],
        required: true,
        order: 2,
      },
    ];

    const validation = validateQualityFormTemplate(arabicTemplate);
    expect(validation.valid).toBe(true);
    expect(arabicTemplate.fields[1].options?.length).toBe(3);
  });

  it('handles corrupted JSON schema in template importer without unhandled exception', () => {
    const corruptedJson = 'INVALID_JSON_{{NOT_A_SCHEMA';
    const imported = importQualityFormTemplate(corruptedJson);

    // Fallback safe blank template returned without throwing
    expect(imported).toBeDefined();
    expect(imported?.name).toBe('Untitled Quality Form');
  });

  it('validates template with massive number of fields (>100 fields) without performance bottleneck', () => {
    const template = createBlankQualityFormTemplate({
      name: 'Massive Telemetry Form',
      recordType: 'audit',
    });

    const secId = template.sections[0].id;
    const fields: QualityFormField[] = [];
    for (let i = 0; i < 120; i++) {
      fields.push({
        id: `fld-${i}`,
        sectionId: secId,
        fieldKey: `param_sensor_${i}`,
        label: `Sensor Channel #${i}`,
        type: 'number',
        order: i + 1,
      });
    }
    template.fields = fields;

    const t0 = performance.now();
    const validation = validateQualityFormTemplate(template);
    const elapsed = performance.now() - t0;

    expect(validation.valid).toBe(true);
    expect(elapsed).toBeLessThan(100);
  });
});
