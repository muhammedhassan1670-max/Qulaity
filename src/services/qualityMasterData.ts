import { INITIAL_BOM_PARTS, INITIAL_BOM_MODELS } from './bomInitialData';

export type QualityMasterTableId =
  | 'parts'
  | 'models'
  | 'defects'
  | 'lines'
  | 'suppliers'
  | 'customers'
  | 'cost-rules'
  | 'escalation-rules'
  | 'inspection-points';

export interface QualityMasterField {
  key: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'number' | 'select' | 'textarea';
  options?: Array<{ value: string; label: string }>;
  aliases?: string[];
}

export interface QualityMasterTableConfig {
  id: QualityMasterTableId;
  name: string;
  description: string;
  primaryKey: string;
  duplicateKeys: string[];
  fields: QualityMasterField[];
}

export interface QualityMasterRecord {
  id: string;
  isActive: boolean;
  createdAt: string;
  lastUpdatedAt: string;
  lastUpdatedBy?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
  [key: string]: unknown;
}

export interface MasterDataSnapshot {
  masterDataVersion: string;
  masterDataMatched: boolean;
  masterDataMatchStatus: string;
  partNameAtTime?: string;
  supplierNameAtTime?: string;
  unitCostAtTime?: number;
  defectCategoryAtTime?: string;
  modelFamilyAtTime?: string;
  productionLineAtTime?: string;
  defaultInspectionPointAtTime?: string;
}

export interface MasterDataDuplicate {
  field: string;
  value: string;
  recordIds: string[];
}

const STORAGE_PREFIX = 'qms_quality_master_data_';
const STORAGE_VERSION = 'v1';
export const MASTER_DATA_VERSION = `${STORAGE_VERSION}-local`;

const nowIso = () => new Date().toISOString();

export const qualityMasterTableConfigs: QualityMasterTableConfig[] = [
  {
    id: 'parts',
    name: 'Parts Master',
    description: 'Part codes, names, supplier links, cost, product family, and default inspection point.',
    primaryKey: 'partNumber',
    duplicateKeys: ['partNumber', 'partId'],
    fields: [
      { key: 'partNumber', label: 'Part Number', required: true, aliases: ['part code', 'Part Code', 'partCode', 'partcode', 'رقم الكود'] },
      { key: 'partId', label: 'Part ID / Barcode', aliases: ['id', 'PartID', 'Part ID', 'barcode', 'الباركود'] },
      { key: 'partName', label: 'Part Name', aliases: ['Part Name', 'partName', 'name', 'الجزء'] },
      { key: 'model', label: 'Model', aliases: ['الموديل', 'Model'] },
      { key: 'supplierName', label: 'Supplier', aliases: ['Supplier', 'supplier', 'المورد'] },
      { key: 'unitCost', label: 'Unit Cost', type: 'number', aliases: ['UnitCost', 'cost', 'Cost', 'تكلفة', 'السعر'] },
      { key: 'productFamily', label: 'Product Family', aliases: ['model type', 'Model Type', 'family', 'productFamily'] },
      { key: 'productionLine', label: 'Default Line', aliases: ['Line', 'line', 'خط الانتاج', 'القسم', 'العملية'] },
      { key: 'defaultInspectionPoint', label: 'Default Inspection Point', aliases: ['inspection point', 'Inspection Point', 'نقطة الفحص'] },
    ],
  },
  {
    id: 'models',
    name: 'Models Master',
    description: 'Product model routing, workshop, line, capacity, and inspection plan metadata.',
    primaryKey: 'model',
    duplicateKeys: ['model'],
    fields: [
      { key: 'model', label: 'Model', required: true, aliases: ['الموديل', 'Model'] },
      { key: 'product', label: 'Product' },
      { key: 'factory', label: 'Factory', aliases: ['مصنع'] },
      { key: 'workshop', label: 'Workshop', aliases: ['ورشة', 'القسم'] },
      { key: 'productionLine', label: 'Production Line', aliases: ['Line', 'line', 'خط الانتاج'] },
      { key: 'capacity', label: 'Capacity', type: 'number' },
      { key: 'inspectionPlan', label: 'Inspection Plan', type: 'textarea' },
      { key: 'productFamily', label: 'Product Family', aliases: ['model type', 'Model Type'] },
    ],
  },
  {
    id: 'defects',
    name: 'Defects Master',
    description: 'Defect names, categories, severity, containment, and default COPQ category.',
    primaryKey: 'defectType',
    duplicateKeys: ['defectType'],
    fields: [
      { key: 'defectType', label: 'Defect Type', required: true, aliases: ['العيب', 'نوع العيب', 'Defect Type'] },
      { key: 'defectCategory', label: 'Defect Category', aliases: ['تصنيف العيب', 'اصل العيب', 'category'] },
      { key: 'defaultSeverity', label: 'Default Severity', type: 'select', options: [{ value: 'minor', label: 'Minor' }, { value: 'major', label: 'Major' }, { value: 'critical', label: 'Critical' }] },
      { key: 'suggestedContainment', label: 'Suggested Containment', type: 'textarea' },
      { key: 'defaultCostCategory', label: 'Default Cost Category' },
      { key: 'riskWeight', label: 'Risk Weight', type: 'number' },
    ],
  },
  {
    id: 'lines',
    name: 'Lines & Workshops',
    description: 'Line, workshop, factory, and inspection area routing.',
    primaryKey: 'productionLine',
    duplicateKeys: ['productionLine'],
    fields: [
      { key: 'productionLine', label: 'Production Line', required: true, aliases: ['Line', 'line', 'خط الانتاج'] },
      { key: 'workshop', label: 'Workshop', aliases: ['ورشة', 'القسم'] },
      { key: 'factory', label: 'Factory' },
      { key: 'inspectionArea', label: 'Inspection Area', aliases: ['منطقة الاكتشاف', 'المنطقة'] },
      { key: 'defaultInspectionPoint', label: 'Default Inspection Point' },
    ],
  },
  {
    id: 'suppliers',
    name: 'Suppliers',
    description: 'Supplier codes, names, and quality ownership.',
    primaryKey: 'supplierName',
    duplicateKeys: ['supplierName', 'supplierCode'],
    fields: [
      { key: 'supplierName', label: 'Supplier Name', required: true },
      { key: 'supplierCode', label: 'Supplier Code' },
      { key: 'category', label: 'Category' },
      { key: 'contact', label: 'Contact' },
    ],
  },
  {
    id: 'customers',
    name: 'Customers',
    description: 'Customer return handling, code, market, and escalation context.',
    primaryKey: 'customerName',
    duplicateKeys: ['customerName', 'customerCode'],
    fields: [
      { key: 'customerName', label: 'Customer Name', required: true },
      { key: 'customerCode', label: 'Customer Code' },
      { key: 'market', label: 'Market' },
      { key: 'defaultReturnHandling', label: 'Default Return Handling', type: 'textarea' },
    ],
  },
  {
    id: 'cost-rules',
    name: 'Cost Rules',
    description: 'Configurable cost bands and default impact labels.',
    primaryKey: 'ruleName',
    duplicateKeys: ['ruleName'],
    fields: [
      { key: 'ruleName', label: 'Rule Name', required: true },
      { key: 'recordType', label: 'Record Type' },
      { key: 'minCost', label: 'Min Cost', type: 'number' },
      { key: 'impactLevel', label: 'Impact Level' },
      { key: 'warningMessage', label: 'Warning Message', type: 'textarea' },
    ],
  },
  {
    id: 'escalation-rules',
    name: 'Escalation Rules',
    description: 'Simple configurable rules for NCR suggestion, approvals, warnings, and routing.',
    primaryKey: 'ruleName',
    duplicateKeys: ['ruleName'],
    fields: [
      { key: 'ruleName', label: 'Rule Name', required: true },
      { key: 'field', label: 'Condition Field', required: true },
      { key: 'operator', label: 'Operator', required: true },
      { key: 'value', label: 'Value' },
      { key: 'action', label: 'Action', required: true },
      { key: 'message', label: 'Message', type: 'textarea' },
      { key: 'setField', label: 'Set Field' },
      { key: 'setValue', label: 'Set Value' },
    ],
  },
  {
    id: 'inspection-points',
    name: 'Inspection Points',
    description: 'Inspection point ownership and area mapping.',
    primaryKey: 'inspectionPoint',
    duplicateKeys: ['inspectionPoint'],
    fields: [
      { key: 'inspectionPoint', label: 'Inspection Point', required: true },
      { key: 'inspectionArea', label: 'Inspection Area' },
      { key: 'process', label: 'Process' },
      { key: 'owner', label: 'Owner' },
      { key: 'checklist', label: 'Checklist', type: 'textarea' },
    ],
  },
];

export function getQualityMasterTableConfig(table: QualityMasterTableId): QualityMasterTableConfig {
  return qualityMasterTableConfigs.find((config) => config.id === table) || qualityMasterTableConfigs[0];
}

function storageKey(table: QualityMasterTableId): string {
  return `${STORAGE_PREFIX}${table}_${STORAGE_VERSION}`;
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstValue(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && normalizeText(value) !== '') return value;
  }
  return undefined;
}

export function normalizeMasterRow(table: QualityMasterTableId, row: Record<string, unknown>, index = 0): QualityMasterRecord {
  const config = getQualityMasterTableConfig(table);
  const normalized: Record<string, unknown> = { ...row };
  config.fields.forEach((field) => {
    const value = firstValue(row, [field.key, field.label, ...(field.aliases || [])]);
    if (value !== undefined) {
      normalized[field.key] = field.type === 'number' ? toNumber(value) : normalizeText(value);
    }
  });

  if (table === 'parts') {
    if (!normalizeText(normalized.partId)) normalized.partId = normalizeText(normalized.partNumber);
    if (!normalizeText(normalized.partName)) normalized.partName = normalizeText(normalized.partNumber);
  }

  const primaryValue = normalizeText(normalized[config.primaryKey]) || `${table}-${index + 1}`;
  return {
    ...normalized,
    id: normalizeText(row.id) || `${table}-${primaryValue}`.replace(/\s+/g, '-').toLowerCase(),
    isActive: row.isActive === false ? false : String(row.status || '').toLowerCase() !== 'inactive',
    createdAt: normalizeText(row.createdAt) || nowIso(),
    lastUpdatedAt: nowIso(),
    lastUpdatedBy: normalizeText(row.lastUpdatedBy) || 'local-user',
  };
}

export function getDefaultMasterRecords(table: QualityMasterTableId): QualityMasterRecord[] {
  if (table === 'parts') {
    return INITIAL_BOM_PARTS.map((part) => {
      const code = part.partCode;
      const name = part.descAr ? `${part.descAr} (${part.descEn})` : part.descEn;
      const model = (part.models && part.models[0]) || 'R-250MGR-BK2';
      return {
        id: `part-${code}`,
        partNumber: code,
        partId: code,
        barcode: code,
        partName: name,
        descAr: part.descAr,
        descEn: part.descEn,
        uom: part.uom || 'PC',
        model,
        models: part.models || [],
        supplierName: 'ELARABY Component Supplier',
        unitCost: 120,
        productFamily: 'Microwave',
        productionLine: 'Line 1 - Microwave Assembly',
        defaultInspectionPoint: 'Incoming / Sub-assembly',
        isActive: true,
        createdAt: nowIso(),
        lastUpdatedAt: nowIso(),
        lastUpdatedBy: 'system-seed',
      };
    });
  }

  if (table === 'models') {
    return INITIAL_BOM_MODELS.map((model) => ({
      id: `model-${model.code}`,
      model: model.code,
      product: model.name,
      factory: 'Benha Factory',
      workshop: 'Microwave Workshop',
      productionLine: 'Line 1 - Microwave Assembly',
      capacity: 250,
      inspectionPlan: 'PLN-MW-GENERAL-01',
      productFamily: 'Microwave',
      isActive: true,
      createdAt: nowIso(),
      lastUpdatedAt: nowIso(),
      lastUpdatedBy: 'system-seed',
    }));
  }

  if (table === 'lines') {
    return [
      { id: 'line-1', productionLine: 'Line 1 - Microwave Assembly', name: 'خط تجميع الميكروويف 1', factory: 'Benha', workshop: 'Assembly', targetPpm: 150, defaultInspectionPoint: 'Final Testing', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'line-2', productionLine: 'Line 2 - Sheet Metal Stamping', name: 'خط كبس وتشكيل الصاج', factory: 'Benha', workshop: 'Stamping', targetPpm: 200, defaultInspectionPoint: 'Stamping QC', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'line-3', productionLine: 'Line 3 - Painting & Powder Coating', name: 'خط الدهان والطلاء', factory: 'Benha', workshop: 'Coating', targetPpm: 180, defaultInspectionPoint: 'Paint Lab', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'line-4', productionLine: 'Line 4 - Sub-Assembly & Wiring', name: 'خط الضفائر والتجميع الفرعي', factory: 'Benha', workshop: 'Sub-assembly', targetPpm: 120, defaultInspectionPoint: 'Electrical Bench', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'line-5', productionLine: 'Line 5 - Final Quality Inspection', name: 'خط الفحص النهائي والتغليف', factory: 'Benha', workshop: 'Packaging', targetPpm: 100, defaultInspectionPoint: 'OQC Gate', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
    ];
  }

  if (table === 'defects') {
    return [
      { id: 'def-1', defectType: 'خدش دهان / Paint Scratch', defectCategory: 'Cosmetic / مظهرية', defaultSeverity: 'minor', defaultCostCategory: 'Rework', suggestedContainment: 'إعادة دهان الجزء الخارجي أو استبدال الغطاء', defaultInspectionPoint: 'Paint Inspection', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'def-2', defectType: 'انبعاج صاج / Dent on Casing', defectCategory: 'Mechanical / ميكانيكية', defaultSeverity: 'major', defaultCostCategory: 'Scrap', suggestedContainment: 'عزل الغلاف واستبداله بصاج سليم من المخزن', defaultInspectionPoint: 'Stamping QC', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'def-3', defectType: 'عطل مغناطيس كهربي / Magnetron Failure', defectCategory: 'Electrical / كهربية', defaultSeverity: 'critical', defaultCostCategory: 'Supplier Claim', suggestedContainment: 'حجز فوري للدفعة وفحص عزل الجهد ومطالبة المورد', defaultInspectionPoint: 'Electrical Bench', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'def-4', defectType: 'تسريب ميكروويف / RF Microwave Leakage', defectCategory: 'Safety / أمان صناعي', defaultSeverity: 'critical', defaultCostCategory: 'Immediate Recall', suggestedContainment: 'إيقاف الخط فوراً وضبط شفة الباب وفحص ميكرو-سويتش الأمان', defaultInspectionPoint: 'Final Testing', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'def-5', defectType: 'صوت غير طبيعي بالموتور / Motor Abnormal Noise', defectCategory: 'Functional / تشغيلية', defaultSeverity: 'major', defaultCostCategory: 'Rework', suggestedContainment: 'تشحيم محور الصينية الدوارة أو تغيير محرك التدوير', defaultInspectionPoint: 'Testing Bench', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'def-6', defectType: 'كسر صينية زجاجية / Broken Glass Turntable', defectCategory: 'Material / خامات', defaultSeverity: 'major', defaultCostCategory: 'Replacement', suggestedContainment: 'تغيير الصينية وفحص سلامة التغليف ومسار النقل', defaultInspectionPoint: 'Packaging', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'def-7', defectType: 'خطأ برمجة لوحة التحكم / PCB Controller Error', defectCategory: 'Electronic / إلكترونية', defaultSeverity: 'critical', defaultCostCategory: 'Rework', suggestedContainment: 'إعادة ضبط سوفتوير الكنترول أو استبدال بوردة PCB', defaultInspectionPoint: 'Testing Bench', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'def-8', defectType: 'خلل سويتش قفل الباب / Door Latch Interlock Defect', defectCategory: 'Safety / أمان صناعي', defaultSeverity: 'critical', defaultCostCategory: 'Rework', suggestedContainment: 'تعديل خلوص ذراع السويتش وتأكيد الإغلاق الميكانيكي', defaultInspectionPoint: 'Door Assembly', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
    ];
  }

  if (table === 'inspection-points') {
    return [
      { id: 'ip-1', inspectionPoint: 'Incoming / Sub-assembly', inspectionArea: 'فحص استلام الخامات والمكونات IQC', process: 'Material Receiving', owner: 'مهندس جودة الواردات', checklist: 'فحص الأبعاد، مطابقة شهادة الجودة، فحص خلو الخدوش', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'ip-2', inspectionPoint: 'Stamping QC', inspectionArea: 'صالة كبس وتشكيل الصاج', process: 'Sheet Metal Stamping', owner: 'مراقب جودة الصاج', checklist: 'فحص سمك الصاج، الزوايا، استواء الحواف', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'ip-3', inspectionPoint: 'Door Assembly', inspectionArea: 'تجميع أبواب الميكروويف', process: 'Door Latch Assembly', owner: 'مفتش جودة الأبواب', checklist: 'قوة القفل، ملامسة السويتشات، سلامة الشبك المانع', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'ip-4', inspectionPoint: 'Electrical Bench', inspectionArea: 'محطة الاختبار الكهربائي', process: 'Hipot & Insulation Test', owner: 'فني جودة الاختبارات', checklist: 'فحص عزل الجهد العالي، استهلاك الأمبير، اختبار التأريض', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
      { id: 'ip-5', inspectionPoint: 'Final Testing & OQC', inspectionArea: 'بوابة الفحص النهائي OQC', process: 'Full Functional & Safety Test', owner: 'مهندس الجودة النهائي', checklist: 'اختبار التسريب RF، التسخين المائي 1 لتر، المظهر الخارجي، التغليف', isActive: true, createdAt: nowIso(), lastUpdatedAt: nowIso(), lastUpdatedBy: 'system-seed' },
    ];
  }

  return [];
}

export function loadQualityMasterTable(table: QualityMasterTableId): QualityMasterRecord[] {
  if (typeof localStorage === 'undefined') return getDefaultMasterRecords(table);
  try {
    const raw = localStorage.getItem(storageKey(table));
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const defaults = getDefaultMasterRecords(table);
    if (defaults.length > 0) {
      saveQualityMasterTable(table, defaults);
      return defaults;
    }
    return [];
  } catch {
    return getDefaultMasterRecords(table);
  }
}

export function saveQualityMasterTable(table: QualityMasterTableId, records: QualityMasterRecord[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(storageKey(table), JSON.stringify(records));
}

export function loadAllQualityMasterTables(): Record<QualityMasterTableId, QualityMasterRecord[]> {
  return qualityMasterTableConfigs.reduce((acc, config) => {
    acc[config.id] = loadQualityMasterTable(config.id);
    return acc;
  }, {} as Record<QualityMasterTableId, QualityMasterRecord[]>);
}

export function validateMasterRecord(table: QualityMasterTableId, record: Record<string, unknown>): string[] {
  const config = getQualityMasterTableConfig(table);
  return config.fields
    .filter((field) => field.required)
    .filter((field) => normalizeText(record[field.key]) === '')
    .map((field) => field.label);
}

export function upsertQualityMasterRecord(table: QualityMasterTableId, record: Record<string, unknown>, user = 'local-user'): QualityMasterRecord {
  const records = loadQualityMasterTable(table);
  const normalized = normalizeMasterRow(table, { ...record, lastUpdatedBy: user }, records.length);
  const idx = records.findIndex((item) => item.id === normalized.id);
  const next: QualityMasterRecord = {
    ...(idx >= 0 ? records[idx] : {}),
    ...normalized,
    isActive: record.isActive === false ? false : normalized.isActive,
    lastUpdatedAt: nowIso(),
    lastUpdatedBy: user,
  };
  if (idx >= 0) records[idx] = next;
  else records.unshift(next);
  saveQualityMasterTable(table, records);
  return next;
}

export function deactivateQualityMasterRecord(table: QualityMasterTableId, id: string, user = 'local-user'): void {
  const records = loadQualityMasterTable(table).map((record) => (
    record.id === id
      ? { ...record, isActive: false, deactivatedAt: nowIso(), deactivatedBy: user, lastUpdatedAt: nowIso(), lastUpdatedBy: user }
      : record
  ));
  saveQualityMasterTable(table, records);
}

export function importQualityMasterRows(table: QualityMasterTableId, rows: Array<Record<string, unknown>>, user = 'local-user'): QualityMasterRecord[] {
  const existing = loadQualityMasterTable(table);
  const byId = new Map(existing.map((record) => [record.id, record]));
  rows.forEach((row, index) => {
    const normalized = normalizeMasterRow(table, { ...row, lastUpdatedBy: user }, index);
    byId.set(normalized.id, {
      ...(byId.get(normalized.id) || {}),
      ...normalized,
      lastUpdatedAt: nowIso(),
      lastUpdatedBy: user,
    });
  });
  const next = Array.from(byId.values()).sort((a, b) => String(b.lastUpdatedAt).localeCompare(String(a.lastUpdatedAt)));
  saveQualityMasterTable(table, next);
  return next;
}

export function detectMasterDuplicates(table: QualityMasterTableId, records = loadQualityMasterTable(table)): MasterDataDuplicate[] {
  const config = getQualityMasterTableConfig(table);
  const duplicates: MasterDataDuplicate[] = [];
  config.duplicateKeys.forEach((field) => {
    const groups = new Map<string, string[]>();
    records.forEach((record) => {
      const key = normalizeText(record[field]).toLowerCase();
      if (!key) return;
      groups.set(key, [...(groups.get(key) || []), record.id]);
    });
    groups.forEach((recordIds, value) => {
      if (recordIds.length > 1) duplicates.push({ field, value, recordIds });
    });
  });
  return duplicates;
}

export function findMasterRecord(
  table: QualityMasterTableId,
  field: string,
  value: unknown,
  activeOnly = true,
): QualityMasterRecord | null {
  const needle = normalizeText(value).toLowerCase();
  if (!needle) return null;
  return loadQualityMasterTable(table).find((record) => {
    if (activeOnly && record.isActive === false) return false;
    return normalizeText(record[field]).toLowerCase() === needle;
  }) || null;
}

export function buildMasterDataSnapshot(values: Record<string, unknown>): MasterDataSnapshot {
  const part = findMasterRecord('parts', 'partNumber', values.partId)
    || findMasterRecord('parts', 'partId', values.partId)
    || findMasterRecord('parts', 'partNumber', values.partNumber);
  const defect = findMasterRecord('defects', 'defectType', values.defectType);
  const model = findMasterRecord('models', 'model', values.model || values.productFamily);
  const line = findMasterRecord('lines', 'productionLine', values.productionLine);

  const matches = [part, defect, model, line].filter(Boolean).length;
  return {
    masterDataVersion: MASTER_DATA_VERSION,
    masterDataMatched: matches > 0,
    masterDataMatchStatus: matches > 0 ? `${matches} master data match${matches > 1 ? 'es' : ''}` : 'No master data match yet',
    partNameAtTime: normalizeText(part?.partName || values.partNumber || values.partName),
    supplierNameAtTime: normalizeText(part?.supplierName || values.supplierName),
    unitCostAtTime: toNumber(part?.unitCost ?? values.unitCost),
    defectCategoryAtTime: normalizeText(defect?.defectCategory || values.defectCategory),
    modelFamilyAtTime: normalizeText(model?.productFamily || part?.productFamily || values.productFamily),
    productionLineAtTime: normalizeText(line?.productionLine || values.productionLine),
    defaultInspectionPointAtTime: normalizeText(part?.defaultInspectionPoint || line?.defaultInspectionPoint || values.defaultInspectionPoint),
  };
}

export function buildMasterOptionItems(table: QualityMasterTableId, valueField?: string, labelFields?: string[]): Array<{ value: string; label: string }> {
  const config = getQualityMasterTableConfig(table);
  const valueKey = valueField || config.primaryKey;
  const labelKeys = labelFields || [config.primaryKey];
  return loadQualityMasterTable(table)
    .filter((record) => record.isActive !== false)
    .map((record) => {
      const value = normalizeText(record[valueKey]);
      const label = labelKeys.map((key) => normalizeText(record[key])).filter(Boolean).join(' - ') || value;
      return { value, label };
    })
    .filter((item) => item.value);
}

export function getExternalDataSourceRows(table: QualityMasterTableId): QualityMasterRecord[] {
  return loadQualityMasterTable(table).filter((record) => record.isActive !== false);
}
