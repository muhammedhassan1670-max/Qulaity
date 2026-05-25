import type { DefectLogData, FmeaData } from '@/api/unified-api';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';

export const FMEA_LOCAL_STORAGE_KEY = 'qms_local_fmea';

export type FmeaReviewStatus = 'draft' | 'review' | 'approved';

export interface DefectFmeaRiskPreview {
  shouldSync: boolean;
  severityScore: number;
  occurrenceScore: number;
  detectionScore: number;
  rpn: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  repeatedCount: number;
  reason: string;
  recommendedAction: string;
}

export interface DefectFmeaSyncResult extends DefectFmeaRiskPreview {
  synced: boolean;
  created: boolean;
  updated: boolean;
  fmeaId?: string;
  message: string;
}

export interface NormalizedFmeaItem extends FmeaData {
  id: string;
  process: string;
  failureMode: string;
  failureEffect: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  actions: string;
  owner: string;
  status: FmeaReviewStatus;
  sourceDefectId?: string;
  sourceNote?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function lower(value: unknown): string {
  return text(value).toLowerCase();
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampScore(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function includesAny(value: unknown, tokens: string[]): boolean {
  const normalized = lower(value);
  return tokens.some((token) => normalized.includes(token.toLowerCase()));
}

function scoreSeverity(record: Record<string, unknown>): number {
  const severity = `${text(record.severity)} ${text(record.defectCategory)} ${text(record.defectType)}`;
  if (includesAny(severity, ['critical', 'urgent', 'severe', 'catastrophic', 'حرج', 'خطير جدا', 'كارث'])) return 10;
  if (includesAny(severity, ['high', 'major', 'serious', 'عالي', 'خطير', 'كبير'])) return 8;
  if (includesAny(severity, ['medium', 'moderate', 'متوسط'])) return 5;
  if (includesAny(severity, ['low', 'minor', 'منخفض', 'بسيط'])) return 3;

  const estimatedCost = toNumber(record.estimatedCost);
  const quantity = toNumber(record.quantity);
  if (lower(record.recordType) === 'customer-return') return 9;
  if (estimatedCost >= 10000 || quantity >= 20) return 8;
  if (estimatedCost >= 1000 || quantity >= 5) return 6;
  return 5;
}

function countSimilarDefects(record: Record<string, unknown>, allDefects: Array<Partial<DefectLogData> | Record<string, unknown>>): number {
  const defectType = lower(record.defectType);
  const partNumber = lower(record.partNumber || record.partId);
  const model = lower(record.model);
  const line = lower(record.productionLine);
  const currentId = text(record.id);

  const similar = allDefects.filter((item) => {
    const row = asRecord(item);
    if (currentId && text(row.id) === currentId) return true;
    if (defectType && lower(row.defectType) !== defectType) return false;

    const hasContext = Boolean(partNumber || model || line);
    if (!hasContext) return Boolean(defectType);

    return Boolean(
      (partNumber && lower(row.partNumber || row.partId) === partNumber) ||
      (model && lower(row.model) === model) ||
      (line && lower(row.productionLine) === line),
    );
  });

  return Math.max(1, similar.length || (currentId ? 1 : 0));
}

function scoreOccurrence(record: Record<string, unknown>, allDefects: Array<Partial<DefectLogData> | Record<string, unknown>>): { score: number; repeatedCount: number } {
  const repeatedCount = countSimilarDefects(record, allDefects);
  const quantity = toNumber(record.quantity);
  if (repeatedCount >= 10) return { score: 10, repeatedCount };
  if (repeatedCount >= 5) return { score: 8, repeatedCount };
  if (repeatedCount >= 3) return { score: 6, repeatedCount };
  if (quantity >= 10) return { score: 6, repeatedCount };
  if (quantity >= 3) return { score: 4, repeatedCount };
  return { score: 2, repeatedCount };
}

function scoreDetection(record: Record<string, unknown>): number {
  const recordType = lower(record.recordType);
  const outgoing = `${text(record.outgoingResult)} ${text(record.releaseStatus)} ${text(record.outgoingImpact)}`;
  if (recordType === 'customer-return') return 9;
  if (includesAny(outgoing, ['escape', 'customer', 'return', 'fail', 'failed', 'reject', 'فشل', 'رفض', 'مرتجع', 'عميل'])) return 9;
  if (recordType === 'outgoing-quality' || includesAny(outgoing, ['hold', 'blocked', 'هولد', 'حجز'])) return 7;
  if (!text(record.relatedInspectionPlanId || record.inspectionPlan || record.relatedCheckItemId)) return 6;
  if (!Array.isArray(record.evidence) || record.evidence.length === 0) return 5;
  return 4;
}

function riskLevelFromRpn(rpn: number): DefectFmeaRiskPreview['riskLevel'] {
  if (rpn >= 200) return 'Critical';
  if (rpn >= 100) return 'High';
  if (rpn >= 50) return 'Moderate';
  return 'Low';
}

function buildRecommendedAction(record: Record<string, unknown>, riskLevel: DefectFmeaRiskPreview['riskLevel']): string {
  const label = `${text(record.defectType)} ${text(record.defectCategory)} ${text(record.description)}`;
  if (includesAny(label, ['leak', 'weld', 'welding', 'تسريب', 'لحام'])) {
    return 'Review leak/welding controls, verify tester calibration, check fixture condition, and update detection controls if the signal repeats.';
  }
  if (includesAny(label, ['material', 'component', 'part', 'مكون', 'خامة', 'مورد'])) {
    return 'Verify part code, supplier/batch condition, incoming inspection evidence, and update prevention controls for repeated component issues.';
  }
  if (includesAny(label, ['assembly', 'تجميع', 'تركيب'])) {
    return 'Verify assembly sequence, work instruction adherence, fixture condition, and operator training evidence.';
  }
  if (includesAny(label, ['performance', 'اداء', 'أداء'])) {
    return 'Verify performance test readings, sensors, refrigerant/airflow conditions, and detection method stability.';
  }
  if (includesAny(label, ['handling', 'تداول', 'نقل'])) {
    return 'Review handling route, trolley/protection condition, and recurrence by line, shift, and model.';
  }
  return `${riskLevel} FMEA signal: review current prevention and detection controls, verify recurrence, and decide whether PFMEA/control plan updates are needed.`;
}

function buildReason(record: Record<string, unknown>, preview: Omit<DefectFmeaRiskPreview, 'reason' | 'recommendedAction'>): string {
  const signals = [
    `RPN ${preview.rpn} = S${preview.severityScore} x O${preview.occurrenceScore} x D${preview.detectionScore}`,
  ];
  if (preview.repeatedCount > 1) signals.push(`${preview.repeatedCount} similar historical record(s)`);
  if (lower(record.recordType) === 'customer-return') signals.push('customer return route');
  if (includesAny(record.outgoingResult, ['fail', 'escape', 'reject', 'فشل', 'رفض', 'مرتجع'])) signals.push('outgoing/customer detection concern');
  return signals.join(' | ');
}

export function buildDefectFmeaRiskPreview(
  defect: Partial<DefectLogData> | Record<string, unknown>,
  allDefects: Array<Partial<DefectLogData> | Record<string, unknown>> = [],
): DefectFmeaRiskPreview {
  const record = asRecord(defect);
  const severityScore = clampScore(scoreSeverity(record));
  const occurrence = scoreOccurrence(record, allDefects);
  const detectionScore = clampScore(scoreDetection(record));
  const rpn = severityScore * occurrence.score * detectionScore;
  const riskLevel = riskLevelFromRpn(rpn);
  const shouldSync = Boolean(
    rpn >= 100 ||
    severityScore >= 8 ||
    occurrence.score >= 6 ||
    detectionScore >= 8 ||
    record.ncrSuggested === true,
  );
  const base = {
    shouldSync,
    severityScore,
    occurrenceScore: occurrence.score,
    detectionScore,
    rpn,
    riskLevel,
    repeatedCount: occurrence.repeatedCount,
  };

  return {
    ...base,
    reason: shouldSync ? buildReason(record, base) : `RPN ${rpn} is below the automatic FMEA review threshold.`,
    recommendedAction: buildRecommendedAction(record, riskLevel),
  };
}

function loadLocalFmeaRecords(): Array<Record<string, unknown>> {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(FMEA_LOCAL_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>> : [];
  } catch {
    return [];
  }
}

function saveLocalFmeaRecords(records: Array<Record<string, unknown>>): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(FMEA_LOCAL_STORAGE_KEY, JSON.stringify(records));
}

function sourceDefectIdOf(record: Record<string, unknown>): string {
  const meta = asRecord(record.metadata);
  return text(record.sourceDefectId || meta.sourceDefectId || meta.defectId || meta.relatedDefectId);
}

function buildFmeaPayload(defect: Record<string, unknown>, preview: DefectFmeaRiskPreview, existing?: Record<string, unknown>): Record<string, unknown> {
  const sourceDefectId = text(defect.id);
  const now = nowIso();
  const defectType = text(defect.defectType) || 'Recorded defect';
  const process = text(defect.productionLine || defect.workshop || defect.defaultInspectionPoint || defect.recordType) || 'Defect process';
  const title = `FMEA risk signal - ${defectType}`;
  const existingMetadata = asRecord(existing?.metadata);
  const metadata = {
    ...existingMetadata,
    sourceType: 'defect-log',
    sourceDefectId,
    defectId: sourceDefectId,
    processStep: process,
    failureMode: defectType,
    potentialEffect: text(defect.description) || `Quality risk from ${defectType}`,
    severityRating: preview.severityScore,
    occurrenceRating: preview.occurrenceScore,
    detectionRating: preview.detectionScore,
    rpn: preview.rpn,
    riskLevel: preview.riskLevel,
    repeatedCount: preview.repeatedCount,
    recommendedAction: preview.recommendedAction,
    fmeaRiskReason: preview.reason,
    productionLine: text(defect.productionLine),
    model: text(defect.model),
    partNumber: text(defect.partNumber || defect.partId),
    recordType: text(defect.recordType),
    severity: text(defect.severity),
    syncedFromDefectAt: now,
  };

  return {
    ...(existing || {}),
    id: text(existing?.id) || `fmea-defect-${sourceDefectId}`,
    fmeaNumber: text(existing?.fmeaNumber) || `FMEA-DEF-${sourceDefectId}`,
    title,
    description: text(defect.description) || `Automatically prepared FMEA review signal from defect ${sourceDefectId}.`,
    type: text(existing?.type) || 'process',
    plantId: text(existing?.plantId) || text(defect.factory) || 'LOCAL',
    departmentId: text(existing?.departmentId) || text(defect.workshop || defect.productionLine),
    status: preview.shouldSync ? 'review' : 'draft',
    processStep: process,
    process,
    failureMode: defectType,
    potentialEffect: metadata.potentialEffect,
    failureEffect: metadata.potentialEffect,
    severityRating: preview.severityScore,
    occurrenceRating: preview.occurrenceScore,
    detectionRating: preview.detectionScore,
    severity: preview.severityScore,
    occurrence: preview.occurrenceScore,
    detection: preview.detectionScore,
    rpn: preview.rpn,
    recommendedAction: preview.recommendedAction,
    actions: preview.recommendedAction,
    owner: text(defect.assignedTo || defect.currentOwner || existing?.owner) || 'Quality Engineering',
    sourceDefectId,
    sourceNote: 'Created from a real high-risk defect record. Use as decision-support for PFMEA review.',
    metadata,
    createdAt: text(existing?.createdAt) || now,
    updatedAt: now,
  };
}

export function upsertFmeaFromDefectRisk(
  defect: Partial<DefectLogData> | Record<string, unknown>,
  allDefects: Array<Partial<DefectLogData> | Record<string, unknown>> = [],
): DefectFmeaSyncResult {
  const record = asRecord(defect);
  const sourceDefectId = text(record.id);
  const preview = buildDefectFmeaRiskPreview(record, allDefects);
  if (!sourceDefectId) {
    return {
      ...preview,
      synced: false,
      created: false,
      updated: false,
      message: 'FMEA sync skipped because the defect record has no id yet.',
    };
  }

  const records = loadLocalFmeaRecords();
  const existingIndex = records.findIndex((item) => sourceDefectIdOf(item) === sourceDefectId);
  const existing = existingIndex >= 0 ? records[existingIndex] : undefined;

  if (!preview.shouldSync && !existing) {
    return {
      ...preview,
      synced: false,
      created: false,
      updated: false,
      message: 'FMEA sync not required because the risk is below the review threshold.',
    };
  }

  const nextRecord = buildFmeaPayload(record, preview, existing);
  const nextRecords = [...records];
  if (existingIndex >= 0) nextRecords[existingIndex] = nextRecord;
  else nextRecords.unshift(nextRecord);
  saveLocalFmeaRecords(nextRecords);

  enqueueQualitySyncItem({
    entityType: 'fmea',
    entityId: text(nextRecord.id),
    operation: existing ? 'update' : 'create',
    payloadSummary: `FMEA RPN ${preview.rpn} updated from defect ${sourceDefectId}. ${preview.reason}`,
  });

  return {
    ...preview,
    synced: true,
    created: !existing,
    updated: Boolean(existing),
    fmeaId: text(nextRecord.id),
    message: `${existing ? 'Updated' : 'Created'} FMEA review signal ${text(nextRecord.id)} with RPN ${preview.rpn}.`,
  };
}

export function normalizeFmeaRecord(input: unknown): NormalizedFmeaItem {
  const record = asRecord(input);
  const metadata = asRecord(record.metadata);
  const severity = clampScore(toNumber(record.severityRating ?? metadata.severityRating ?? record.severity ?? metadata.severity, 1));
  const occurrence = clampScore(toNumber(record.occurrenceRating ?? metadata.occurrenceRating ?? record.occurrence ?? metadata.occurrence, 1));
  const detection = clampScore(toNumber(record.detectionRating ?? metadata.detectionRating ?? record.detection ?? metadata.detection, 1));
  const rpn = toNumber(record.rpn ?? metadata.rpn, severity * occurrence * detection);
  const rawStatus = lower(record.status || metadata.status || 'draft');
  const status: FmeaReviewStatus = rawStatus === 'approved' ? 'approved' : rawStatus === 'review' ? 'review' : 'draft';

  return {
    ...(record as unknown as FmeaData),
    id: text(record.id) || `fmea-${Date.now()}`,
    fmeaNumber: text(record.fmeaNumber),
    title: text(record.title) || text(metadata.failureMode) || 'FMEA',
    description: text(record.description),
    type: text(record.type) || 'process',
    plantId: text(record.plantId) || 'LOCAL',
    departmentId: text(record.departmentId),
    metadata,
    createdAt: text(record.createdAt),
    updatedAt: text(record.updatedAt),
    process: text(record.processStep || record.process || metadata.processStep || metadata.process) || 'Unassigned process',
    failureMode: text(record.failureMode || metadata.failureMode) || 'Failure mode not defined',
    failureEffect: text(record.potentialEffect || record.failureEffect || record.effect || metadata.potentialEffect || metadata.failureEffect) || 'Effect requires review',
    severity,
    occurrence,
    detection,
    rpn,
    actions: text(record.recommendedAction || record.actions || metadata.recommendedAction) || 'Review prevention and detection controls.',
    owner: text(asRecord(record.ownerUser).name || record.owner || metadata.owner) || 'Unassigned',
    status,
    sourceDefectId: sourceDefectIdOf(record),
    sourceNote: text(record.sourceNote || metadata.sourceNote),
  };
}
