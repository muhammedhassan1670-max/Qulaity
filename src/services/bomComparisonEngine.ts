import {
  INITIAL_BOM_MODELS,
  INITIAL_BOM_PARTS,
  INITIAL_BOM_SNAPSHOTS,
  type BOMModelRecord,
  type BOMPartRecord,
  type BOMSnapshotRecord,
} from './bomInitialData';
import * as XLSX from 'xlsx';

const STORAGE_KEYS = {
  MODELS: 'qms_bom_models_v1',
  PARTS: 'qms_bom_parts_v1',
  SNAPSHOTS: 'qms_bom_snapshots_v1',
};

// Safe localStorage helpers
function getStoredJson<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error loading key ${key} from storage:`, e);
    return defaultValue;
  }
}

function setStoredJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing key ${key} to storage:`, e);
  }
}

// 1. Data Store Access
export function getBOMModels(): BOMModelRecord[] {
  const models = getStoredJson<BOMModelRecord[]>(STORAGE_KEYS.MODELS, []);
  if (!models || models.length === 0) {
    setStoredJson(STORAGE_KEYS.MODELS, INITIAL_BOM_MODELS);
    return INITIAL_BOM_MODELS;
  }
  return models;
}

export function getBOMParts(): BOMPartRecord[] {
  const parts = getStoredJson<BOMPartRecord[]>(STORAGE_KEYS.PARTS, []);
  if (!parts || parts.length === 0) {
    setStoredJson(STORAGE_KEYS.PARTS, INITIAL_BOM_PARTS);
    return INITIAL_BOM_PARTS;
  }
  return parts;
}

export function getBOMSnapshots(): BOMSnapshotRecord[] {
  const snapshots = getStoredJson<BOMSnapshotRecord[]>(STORAGE_KEYS.SNAPSHOTS, []);
  if (!snapshots || snapshots.length === 0) {
    setStoredJson(STORAGE_KEYS.SNAPSHOTS, INITIAL_BOM_SNAPSHOTS);
    return INITIAL_BOM_SNAPSHOTS;
  }
  return snapshots;
}

export function resetBOMToFactoryDefaults(): void {
  setStoredJson(STORAGE_KEYS.MODELS, INITIAL_BOM_MODELS);
  setStoredJson(STORAGE_KEYS.PARTS, INITIAL_BOM_PARTS);
  setStoredJson(STORAGE_KEYS.SNAPSHOTS, INITIAL_BOM_SNAPSHOTS);
}

// 2. 1-to-1 Model Comparison
export interface ModelDiffItem {
  partCode: string;
  descEn: string;
  descAr: string;
  uom: string;
  inA: boolean;
  inB: boolean;
  status: 'common' | 'onlyA' | 'onlyB';
}

export interface ModelComparisonResult {
  modelA: BOMModelRecord;
  modelB: BOMModelRecord;
  items: ModelDiffItem[];
  totalPartsA: number;
  totalPartsB: number;
  commonCount: number;
  onlyACount: number;
  onlyBCount: number;
  similarityRate: number; // e.g. 89.5%
}

export function compareTwoModels(modelACode: string, modelBCode: string): ModelComparisonResult | null {
  const models = getBOMModels();
  const parts = getBOMParts();

  const modelA = models.find((m) => m.code === modelACode);
  const modelB = models.find((m) => m.code === modelBCode);

  if (!modelA || !modelB) return null;

  const relevantParts = parts.filter(
    (p) => p.models.includes(modelACode) || p.models.includes(modelBCode)
  );

  let totalA = 0;
  let totalB = 0;
  let common = 0;
  let onlyA = 0;
  let onlyB = 0;

  const items: ModelDiffItem[] = relevantParts.map((p) => {
    const inA = p.models.includes(modelACode);
    const inB = p.models.includes(modelBCode);

    if (inA) totalA++;
    if (inB) totalB++;

    let status: 'common' | 'onlyA' | 'onlyB' = 'common';
    if (inA && inB) {
      common++;
      status = 'common';
    } else if (inA) {
      onlyA++;
      status = 'onlyA';
    } else {
      onlyB++;
      status = 'onlyB';
    }

    return {
      partCode: p.partCode,
      descEn: p.descEn,
      descAr: p.descAr,
      uom: p.uom,
      inA,
      inB,
      status,
    };
  });

  const unionTotal = items.length;
  const similarityRate = unionTotal > 0 ? Number(((common / unionTotal) * 100).toFixed(1)) : 100;

  return {
    modelA,
    modelB,
    items,
    totalPartsA: totalA,
    totalPartsB: totalB,
    commonCount: common,
    onlyACount: onlyA,
    onlyBCount: onlyB,
    similarityRate,
  };
}

// 3. Master Matrix Generation
export interface MasterMatrixRow {
  partCode: string;
  descEn: string;
  descAr: string;
  uom: string;
  usageCount: number;
  hasVariance: boolean;
  modelPresence: Record<string, boolean>;
}

export function getMasterMatrix(options?: {
  filterVarianceOnly?: boolean;
  search?: string;
  modelSubset?: string[];
}): { rows: MasterMatrixRow[]; models: BOMModelRecord[] } {
  const allModels = getBOMModels();
  const allParts = getBOMParts();

  const activeModels =
    options?.modelSubset && options.modelSubset.length > 0
      ? allModels.filter((m) => options.modelSubset!.includes(m.code))
      : allModels;

  const search = (options?.search || '').trim().toLowerCase();

  const rows: MasterMatrixRow[] = [];

  allParts.forEach((part) => {
    // Search filter
    if (search) {
      const matchCode = part.partCode.toLowerCase().includes(search);
      const matchEn = part.descEn.toLowerCase().includes(search);
      const matchAr = part.descAr.toLowerCase().includes(search);
      if (!matchCode && !matchEn && !matchAr) return;
    }

    const presence: Record<string, boolean> = {};
    let countInSubset = 0;

    activeModels.forEach((m) => {
      const isPresent = part.models.includes(m.code);
      presence[m.code] = isPresent;
      if (isPresent) countInSubset++;
    });

    // If part is not in ANY of the models in the subset, skip it
    if (countInSubset === 0) return;

    // Variance = used in some models, but not all of the active models
    const hasVariance = countInSubset > 0 && countInSubset < activeModels.length;

    if (options?.filterVarianceOnly && !hasVariance) {
      return;
    }

    rows.push({
      partCode: part.partCode,
      descEn: part.descEn,
      descAr: part.descAr,
      uom: part.uom,
      usageCount: countInSubset,
      hasVariance,
      modelPresence: presence,
    });
  });

  return {
    rows,
    models: activeModels,
  };
}

// 4. Baseline Snapshots & Change Audit
export interface ModelAuditSummary {
  modelCode: string;
  productName: string;
  currentPartsCount: number;
  baselinePartsCount: number;
  addedCount: number;
  removedCount: number;
  status: 'synced' | 'has_changes';
  lastSnapshotDate?: string;
}

export interface ModelDetailedAudit {
  modelCode: string;
  modelName: string;
  snapshotDate: string;
  items: Array<{
    partCode: string;
    descEn: string;
    descAr: string;
    uom: string;
    inBaseline: boolean;
    inCurrent: boolean;
    status: 'added' | 'removed' | 'unchanged';
  }>;
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
}

export function getModelAuditSummaries(): ModelAuditSummary[] {
  const models = getBOMModels();
  const parts = getBOMParts();
  const snapshots = getBOMSnapshots();

  return models.map((model) => {
    const currentParts = parts.filter((p) => p.models.includes(model.code));
    const modelSnapshots = snapshots.filter((s) => s.modelCode === model.code);

    const snapshotPartCodes = new Set(modelSnapshots.map((s) => s.partCode));
    const currentPartCodes = new Set(currentParts.map((p) => p.partCode));

    let addedCount = 0;
    let removedCount = 0;

    currentPartCodes.forEach((code) => {
      if (!snapshotPartCodes.has(code)) addedCount++;
    });

    snapshotPartCodes.forEach((code) => {
      if (!currentPartCodes.has(code)) removedCount++;
    });

    const lastDate = modelSnapshots.length > 0 ? modelSnapshots[0].snapshotDate : undefined;

    return {
      modelCode: model.code,
      productName: model.name,
      currentPartsCount: currentParts.length,
      baselinePartsCount: modelSnapshots.length,
      addedCount,
      removedCount,
      status: addedCount === 0 && removedCount === 0 ? 'synced' : 'has_changes',
      lastSnapshotDate: lastDate,
    };
  });
}

export function getModelDetailedAudit(modelCode: string): ModelDetailedAudit | null {
  const models = getBOMModels();
  const parts = getBOMParts();
  const snapshots = getBOMSnapshots();

  const model = models.find((m) => m.code === modelCode);
  if (!model) return null;

  const currentParts = parts.filter((p) => p.models.includes(modelCode));
  const modelSnapshots = snapshots.filter((s) => s.modelCode === modelCode);

  const snapshotMap = new Map<string, string>();
  modelSnapshots.forEach((s) => snapshotMap.set(s.partCode, s.snapshotDate));

  const currentPartCodes = new Set(currentParts.map((p) => p.partCode));

  // Collect union of codes
  const allCodes = new Set([...currentPartCodes, ...snapshotMap.keys()]);
  const partsLookup = new Map<string, BOMPartRecord>();
  parts.forEach((p) => partsLookup.set(p.partCode, p));

  let added = 0;
  let removed = 0;
  let unchanged = 0;

  const items: ModelDetailedAudit['items'] = [];

  allCodes.forEach((code) => {
    const inCurrent = currentPartCodes.has(code);
    const inBaseline = snapshotMap.has(code);
    const partInfo = partsLookup.get(code);

    let status: 'added' | 'removed' | 'unchanged' = 'unchanged';
    if (inCurrent && !inBaseline) {
      status = 'added';
      added++;
    } else if (!inCurrent && inBaseline) {
      status = 'removed';
      removed++;
    } else {
      unchanged++;
    }

    items.push({
      partCode: code,
      descEn: partInfo?.descEn || '',
      descAr: partInfo?.descAr || '',
      uom: partInfo?.uom || 'PC',
      inBaseline,
      inCurrent,
      status,
    });
  });

  // Sort so changes (added/removed) appear at the top!
  items.sort((a, b) => {
    const priority = { added: 0, removed: 1, unchanged: 2 };
    return priority[a.status] - priority[b.status];
  });

  const latestDate = modelSnapshots.length > 0 ? modelSnapshots[0].snapshotDate : new Date().toISOString().split('T')[0];

  return {
    modelCode: model.code,
    modelName: model.name,
    snapshotDate: latestDate,
    items,
    addedCount: added,
    removedCount: removed,
    unchangedCount: unchanged,
  };
}

export function commitModelBaselineSnapshot(modelCode: string): void {
  const parts = getBOMParts();
  const snapshots = getBOMSnapshots();

  const currentParts = parts.filter((p) => p.models.includes(modelCode));
  const today = new Date().toISOString().split('T')[0];

  // Remove old snapshots for this model
  const remainingSnapshots = snapshots.filter((s) => s.modelCode !== modelCode);

  // Add new snapshots for all current parts
  const newSnapshots: BOMSnapshotRecord[] = currentParts.map((p) => ({
    modelCode,
    partCode: p.partCode,
    snapshotDate: today,
  }));

  const updated = [...remainingSnapshots, ...newSnapshots];
  setStoredJson(STORAGE_KEYS.SNAPSHOTS, updated);
}

// 5. Cross-Module Defect Risk Intelligence
export interface PartQualityRisk {
  partCode: string;
  descAr: string;
  descEn: string;
  modelsCount: number;
  modelsList: string[];
  defectCount: number;
  exposureScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

export function getCrossModelQualityRisks(): PartQualityRisk[] {
  const parts = getBOMParts();

  // Load defects from localStorage if present
  let defectLogs: any[] = [];
  try {
    const raw = localStorage.getItem('qms_local_defect-logs');
    if (raw) defectLogs = JSON.parse(raw);
  } catch (e) {
    // ignore
  }

  // Count defects per part code or description
  const defectCountMap = new Map<string, number>();
  defectLogs.forEach((log) => {
    const pCode = String(log.partNumber || log.partId || log.partCode || '').trim();
    if (pCode) {
      defectCountMap.set(pCode, (defectCountMap.get(pCode) || 0) + 1);
    }
  });

  return parts
    .map((part) => {
      const defects = defectCountMap.get(part.partCode) || 0;
      const count = part.models.length;
      // Exposure score = defects * model adoption count
      const score = (defects > 0 ? defects : 1) * count;

      let riskLevel: PartQualityRisk['riskLevel'] = 'low';
      if (defects > 0 && count >= 10) riskLevel = 'critical';
      else if (defects > 0 || count >= 12) riskLevel = 'high';
      else if (count >= 6) riskLevel = 'medium';

      return {
        partCode: part.partCode,
        descAr: part.descAr,
        descEn: part.descEn,
        modelsCount: count,
        modelsList: part.models,
        defectCount: defects,
        exposureScore: score,
        riskLevel,
      };
    })
    .sort((a, b) => b.exposureScore - a.exposureScore);
}

// 6. Clean Excel Exporters
export function exportComparisonToXlsx(result: ModelComparisonResult): void {
  const data = result.items.map((item, idx) => ({
    '#': idx + 1,
    'كود الجزء': item.partCode,
    'الوصف بالعربية': item.descAr,
    'الوصف بالإنجليزية': item.descEn,
    'الوحدة': item.uom,
    [`موجود في ${result.modelA.code}؟`]: item.inA ? 'نعم' : 'لا',
    [`موجود في ${result.modelB.code}؟`]: item.inB ? 'نعم' : 'لا',
    'الحالة':
      item.status === 'common'
        ? 'مشترك'
        : item.status === 'onlyA'
        ? `خاص بـ ${result.modelA.code}`
        : `خاص بـ ${result.modelB.code}`,
  }));

  const summary = [
    { 'المؤشر': 'الموديل الأول', 'القيمة': `${result.modelA.code} (${result.modelA.name})` },
    { 'المؤشر': 'الموديل الثاني', 'القيمة': `${result.modelB.code} (${result.modelB.name})` },
    { 'المؤشر': 'إجمالي أجزاء الموديل الأول', 'القيمة': result.totalPartsA },
    { 'المؤشر': 'إجمالي أجزاء الموديل الثاني', 'القيمة': result.totalPartsB },
    { 'المؤشر': 'الأكواد المشتركة', 'القيمة': result.commonCount },
    { 'المؤشر': `حصرية لـ ${result.modelA.code}`, 'القيمة': result.onlyACount },
    { 'المؤشر': `حصرية لـ ${result.modelB.code}`, 'القيمة': result.onlyBCount },
    { 'المؤشر': 'نسبة التطابق الإجمالية', 'القيمة': `${result.similarityRate}%` },
  ];

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summary);
  const wsDetails = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص المقارنة');
  XLSX.utils.book_append_sheet(wb, wsDetails, 'تفاصيل الأجزاء');

  XLSX.writeFile(wb, `مقارنة_${result.modelA.code}_مع_${result.modelB.code}.xlsx`);
}

export function exportMatrixToXlsx(rows: MasterMatrixRow[], models: BOMModelRecord[]): void {
  const data = rows.map((r, idx) => {
    const rowObj: Record<string, any> = {
      '#': idx + 1,
      'كود الجزء': r.partCode,
      'الوصف بالعربية': r.descAr,
      'الوصف بالإنجليزية': r.descEn,
      'الوحدة': r.uom,
      'عدد الموديلات': r.usageCount,
      'يوجد فرق؟': r.hasVariance ? 'فرق ⚠️' : 'مطابق —',
    };

    models.forEach((m) => {
      rowObj[m.code] = r.modelPresence[m.code] ? 'X' : '';
    });

    return rowObj;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'المصفوفة الشاملة');
  XLSX.writeFile(wb, `المصفوفة_الشاملة_لأشجار_الموديلات.xlsx`);
}
