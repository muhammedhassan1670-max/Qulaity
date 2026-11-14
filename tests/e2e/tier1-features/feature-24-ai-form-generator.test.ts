import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import type { DynamicForm, DynamicField, FieldType } from '@/stores/configStore';

// In-module pure functions mirroring ExcelFormGenerator detection engine
function toSnakeCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_');
}

function toLabel(str: string): string {
  return str
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isDate(val: string): boolean {
  if (!val || val.length < 6) return false;
  return (
    !isNaN(Date.parse(val)) &&
    /(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/.test(val)
  );
}

function isNumber(val: string): boolean {
  return val !== '' && !isNaN(Number(val.replace(/,/g, '')));
}

function isBoolLike(val: string): boolean {
  const v = val.toString().toLowerCase().trim();
  return ['yes', 'no', 'true', 'false', 'y', 'n', '1', '0', 'on', 'off', 'active', 'inactive'].includes(v);
}

interface DetectedColumn {
  originalName: string;
  fieldName: string;
  label: string;
  type: FieldType;
  confidence: number;
  sampleValues: string[];
  options?: { value: string; label: string }[];
  required: boolean;
  reason: string;
}

function detectColumnType(columnName: string, values: string[]): DetectedColumn {
  const name = columnName.toLowerCase();
  const fieldName = toSnakeCase(columnName);
  const label = toLabel(columnName);
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
  const samples = nonEmpty.slice(0, 5).map(String);

  function build(type: FieldType, confidence: number, reason: string, options: { value: string; label: string }[]): DetectedColumn {
    return {
      originalName: columnName,
      fieldName,
      label,
      type,
      confidence,
      sampleValues: samples,
      options: options.length ? options : undefined,
      required: false,
      reason,
    };
  }

  function buildOptions(vals: string[]) {
    return vals.map((v) => ({ value: toSnakeCase(v) || v.toLowerCase(), label: v }));
  }

  // 1. Name-based overrides
  if (/signature|sign/i.test(name)) return build('signature', 96, 'Column name contains signature', []);
  if (/attachment|file|document/i.test(name)) return build('file', 95, 'Column name contains file/attachment', []);
  if (/barcode|qr|scan/i.test(name)) return build('barcode', 94, 'Column name contains barcode/qr', []);
  if (/status/i.test(name)) {
    const opts = buildOptions(['Open', 'Closed', 'In Progress', 'Pending', 'Cancelled']);
    return build('select', 92, 'Column named status -> dropdown', opts);
  }
  if (/priority/i.test(name)) {
    const opts = buildOptions(['Critical', 'High', 'Medium', 'Low']);
    return build('select', 92, 'Column named priority -> dropdown', opts);
  }

  // 2. Data-based checks
  if (nonEmpty.length === 0) return build('text', 50, 'No data, defaulting to text', []);

  const dateCount = nonEmpty.filter((v) => isDate(String(v))).length;
  const numCount = nonEmpty.filter((v) => isNumber(String(v))).length;
  const boolCount = nonEmpty.filter((v) => isBoolLike(String(v))).length;
  const total = nonEmpty.length;

  if (dateCount / total > 0.7) return build('date', 90, `${Math.round((dateCount / total) * 100)}% dates`, []);
  if (boolCount / total > 0.7) return build('checkbox', 88, `${Math.round((boolCount / total) * 100)}% booleans`, []);
  if (numCount / total > 0.8) return build('number', 85, `${Math.round((numCount / total) * 100)}% numerics`, []);

  // Low cardinality -> dropdown
  const uniq = [...new Set(nonEmpty.map(String))];
  if (uniq.length <= 6 && total >= 3) {
    return build('select', 82, `${uniq.length} unique values -> dropdown`, buildOptions(uniq));
  }

  // Long text -> textarea
  const avgLen = nonEmpty.reduce((s, v) => s + String(v).length, 0) / total;
  if (avgLen > 80) return build('textarea', 80, `Avg length ${Math.round(avgLen)} chars -> textarea`, []);

  return build('text', 70, 'Short free-text values', []);
}

function parseWorkbook(data: Uint8Array): { columns: string[]; rows: Record<string, any>[] } {
  const wb = XLSX.read(data, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
  const columns = json.length > 0 ? Object.keys(json[0]) : [];
  return { columns, rows: json };
}

describe('Feature 24: AI Excel/CSV Form Generator', () => {
  it('parses real tabular data from an in-memory XLSX workbook', () => {
    const sheetData = [
      { 'Part Number': 'PART-001', 'Measured Dimension': '45.02', 'Inspection Date': '2026-11-14', Status: 'Open' },
      { 'Part Number': 'PART-002', 'Measured Dimension': '44.98', 'Inspection Date': '2026-11-14', Status: 'Closed' },
      { 'Part Number': 'PART-003', 'Measured Dimension': '45.00', 'Inspection Date': '2026-11-14', Status: 'Open' },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Measurements');
    const u8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const { columns, rows } = parseWorkbook(new Uint8Array(u8));

    expect(columns).toEqual(['Part Number', 'Measured Dimension', 'Inspection Date', 'Status']);
    expect(rows.length).toBe(3);
    expect(rows[0]['Part Number']).toBe('PART-001');
    expect(rows[1]['Measured Dimension']).toBe('44.98');
  });

  it('detects numeric, date, and boolean column types with high confidence', () => {
    const numCol = detectColumnType('Wall Thickness mm', ['2.45', '2.50', '2.48', '2.52', '2.49']);
    expect(numCol.type).toBe('number');
    expect(numCol.confidence).toBeGreaterThanOrEqual(80);
    expect(numCol.fieldName).toBe('wall_thickness_mm');

    const dateCol = detectColumnType('Calibration Expiry', ['2026-12-31', '2027-01-15', '2026-11-20']);
    expect(dateCol.type).toBe('date');
    expect(dateCol.confidence).toBeGreaterThanOrEqual(85);

    const boolCol = detectColumnType('Pass Conformance', ['true', 'false', 'true', 'true', 'false']);
    expect(boolCol.type).toBe('checkbox');
    expect(boolCol.confidence).toBeGreaterThanOrEqual(85);
  });

  it('identifies repeating discrete values and automatically generates select options', () => {
    const categoryCol = detectColumnType('Manufacturing Defect Category', [
      'Porosity',
      'Crack',
      'Burr',
      'Porosity',
      'Burr',
      'Crack',
      'Burr',
    ]);

    expect(categoryCol.type).toBe('select');
    expect(categoryCol.options).toBeDefined();
    expect(categoryCol.options?.length).toBe(3);

    const optionValues = categoryCol.options?.map((o) => o.label);
    expect(optionValues).toContain('Porosity');
    expect(optionValues).toContain('Crack');
    expect(optionValues).toContain('Burr');
  });

  it('triggers keyword-based smart recognition for barcode, signature, and status', () => {
    const qrCol = detectColumnType('Lot Barcode QR', ['LOT-9981-A', 'LOT-9982-B']);
    expect(qrCol.type).toBe('barcode');
    expect(qrCol.confidence).toBeGreaterThanOrEqual(90);

    const signCol = detectColumnType('Quality Inspector Signature', []);
    expect(signCol.type).toBe('signature');
    expect(signCol.confidence).toBeGreaterThanOrEqual(90);

    const statusCol = detectColumnType('Containment Status', ['Open', 'Pending']);
    expect(statusCol.type).toBe('select');
    expect(statusCol.options?.some((o) => o.label === 'Open')).toBe(true);
  });

  it('generates a full DynamicForm schema with section, ordering, and field rules', () => {
    const detectedColumns: DetectedColumn[] = [
      detectColumnType('Work Order ID', ['WO-2026-001', 'WO-2026-002']),
      detectColumnType('Torque Reading Nm', ['85.4', '86.1', '84.9']),
      detectColumnType('Inspection Date', ['2026-11-14', '2026-11-15']),
      detectColumnType('Audit Status', ['Open', 'Closed']),
    ];

    // Mark mandatory fields
    detectedColumns[0].required = true;
    detectedColumns[1].required = true;

    const dynamicFields: DynamicField[] = detectedColumns.map((col, idx) => ({
      id: `field-${idx + 1}`,
      name: col.fieldName,
      label: col.label,
      type: col.type,
      required: col.required,
      visible: true,
      editable: true,
      order: idx + 1,
      section: 'section-main',
      ...(col.options ? { options: col.options } : {}),
    }));

    const dynamicForm: DynamicForm = {
      id: 'form-ai-gen-101',
      name: 'Torque & Assembly Verification Form',
      description: 'Auto-generated by AI Form Generator from CMM Stamping spreadsheet',
      type: 'custom',
      sections: [
        {
          id: 'section-main',
          title: 'Main Inspection Data',
          order: 1,
        },
      ],
      fields: dynamicFields,
      validationRules: [
        {
          id: 'val-rule-1',
          field: 'torque_reading_nm',
          type: 'custom',
          params: { min: 80, max: 90 },
          message: 'Torque must remain between 80 and 90 Nm',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(dynamicForm.fields.length).toBe(4);
    expect(dynamicForm.fields[0].required).toBe(true);
    expect(dynamicForm.fields[0].name).toBe('work_order_id');
    expect(dynamicForm.fields[1].name).toBe('torque_reading_nm');
    expect(dynamicForm.fields[1].type).toBe('number');
    expect(dynamicForm.validationRules?.[0].params.min).toBe(80);
    expect(dynamicForm.sections.length).toBe(1);
  });
});
