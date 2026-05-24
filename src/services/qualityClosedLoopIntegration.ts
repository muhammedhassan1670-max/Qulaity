import type { CapaData, DefectLogData, EightDData, NcrData } from '@/api/unified-api';
import type { DefectWorkflowNotification, DefectWorkflowTask } from '@/services/defectWorkflowGovernance';
import {
  calculateActionEffectiveness,
  type ImprovementEffectivenessResult,
  type QualityImprovementAction,
} from '@/services/qualityImprovementActions';
import { relatedIdsForEntity, type QualityRelationshipEntityType } from '@/services/qualityRelationships';

export interface ClosedLoopSourceLinks {
  sourceType: 'ncr' | 'capa' | 'eightD';
  sourceId: string;
  linkedDefects: DefectLogData[];
  linkedActions: Array<{ action: QualityImprovementAction; effectiveness: ImprovementEffectivenessResult }>;
  linkedNcr?: NcrData;
  linkedCapa?: CapaData;
  linkedEightD?: EightDData;
  effectivenessStatus: string;
  confidenceLabel: string;
  beforeMetric: number;
  afterMetric: number;
  improvementPercent: number | null;
  dataLimitations: string[];
  recommendedFollowUp: string;
}

export interface ClosedLoopCommandSummary {
  openNcrs: number;
  ncrsWaitingCapa: number;
  openCapas: number;
  capasPendingVerification: number;
  notEffectiveCapas: number;
  openEightD: number;
  overdueEightD: number;
  actionsLinkedToEscalations: number;
  effectivenessBySourceType: Array<{ label: string; count: number; effective: number; notEffective: number; pending: number }>;
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function metadataOf(record: { metadata?: unknown }): Record<string, unknown> {
  return record.metadata && typeof record.metadata === 'object' ? record.metadata as Record<string, unknown> : {};
}

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function sourceIds(record: NcrData | CapaData | EightDData): string[] {
  const metadata = metadataOf(record);
  return [
    record.id,
    (record as NcrData).ncrNumber,
    (record as CapaData).capaNumber,
    (record as EightDData).eightDNumber,
    (record as NcrData).sourceDefectId,
    (record as CapaData).sourceNcrId,
    (record as EightDData).ncrReportId,
    ...asArray((record as NcrData | CapaData | EightDData).linkedDefectIds),
    ...asArray((record as NcrData | CapaData | EightDData).relatedActionIds),
    ...asArray(metadata.linkedDefectIds),
    ...asArray(metadata.relatedActionIds),
    String(metadata.sourceDefectId || ''),
    String(metadata.sourceNcrId || ''),
    String(metadata.ncrReportId || ''),
  ].filter(Boolean).map(String);
}

function sourceMatches(action: QualityImprovementAction, sourceType: 'ncr' | 'capa' | 'eightD', source: NcrData | CapaData | EightDData): boolean {
  const ids = new Set(sourceIds(source).map(normalize));
  if (action.sourceType === sourceType && action.sourceId && ids.has(normalize(action.sourceId))) return true;
  if (sourceType === 'ncr' && action.relatedNcrId && ids.has(normalize(action.relatedNcrId))) return true;
  if (sourceType === 'capa' && action.relatedCapaId && ids.has(normalize(action.relatedCapaId))) return true;
  if (sourceType === 'eightD' && action.relatedEightDId && ids.has(normalize(action.relatedEightDId))) return true;
  return asArray((source as NcrData | CapaData | EightDData).relatedActionIds).some((id) => id === action.id)
    || asArray(metadataOf(source).relatedActionIds).some((id) => id === action.id);
}

function defectMatches(source: NcrData | CapaData | EightDData, defect: DefectLogData): boolean {
  const ids = new Set(sourceIds(source).map(normalize));
  return ids.has(normalize(defect.id))
    || ids.has(normalize(defect.relatedNcrId))
    || ids.has(normalize(defect.relatedCapaId))
    || ids.has(normalize(defect.relatedEightDId))
    || Boolean(defect.relatedActionIds?.some((id) => ids.has(normalize(id))));
}

function pickPrimaryEffectiveness(linkedActions: Array<{ action: QualityImprovementAction; effectiveness: ImprovementEffectivenessResult }>): ImprovementEffectivenessResult | null {
  const ranked = linkedActions.slice().sort((a, b) => {
    const aScore = a.effectiveness.effectivenessStatus === 'Effective' ? 4 : a.effectiveness.effectivenessStatus === 'Partially Effective' ? 3 : a.effectiveness.effectivenessStatus === 'Monitoring Required' ? 2 : a.effectiveness.effectivenessStatus === 'Not Effective' ? 1 : 0;
    const bScore = b.effectiveness.effectivenessStatus === 'Effective' ? 4 : b.effectiveness.effectivenessStatus === 'Partially Effective' ? 3 : b.effectiveness.effectivenessStatus === 'Monitoring Required' ? 2 : b.effectiveness.effectivenessStatus === 'Not Effective' ? 1 : 0;
    return bScore - aScore;
  });
  return ranked[0]?.effectiveness || null;
}

export function buildClosedLoopSourceLinks(input: {
  sourceType: 'ncr' | 'capa' | 'eightD';
  source: NcrData | CapaData | EightDData;
  defects: DefectLogData[];
  actions: QualityImprovementAction[];
  ncrs?: NcrData[];
  capas?: CapaData[];
  eightDs?: EightDData[];
}): ClosedLoopSourceLinks {
  const relationshipDefectIds = new Set(relatedIdsForEntity(input.sourceType as QualityRelationshipEntityType, String(input.source.id || ''), 'defect').map(normalize));
  const relationshipActionIds = new Set(relatedIdsForEntity(input.sourceType as QualityRelationshipEntityType, String(input.source.id || ''), 'improvement-action').map(normalize));
  const linkedDefects = input.defects.filter((defect) => defectMatches(input.source, defect) || relationshipDefectIds.has(normalize(defect.id)));
  const linkedActions = input.actions
    .filter((action) => sourceMatches(action, input.sourceType, input.source) || relationshipActionIds.has(normalize(action.id)))
    .map((action) => ({ action, effectiveness: calculateActionEffectiveness(action, input.defects) }));
  const primary = pickPrimaryEffectiveness(linkedActions);
  const metadata = metadataOf(input.source);
  const linkedNcrId = String((input.source as CapaData).sourceNcrId || (input.source as EightDData).ncrReportId || metadata.sourceNcrId || metadata.ncrReportId || '');
  const linkedCapaId = String((input.source as NcrData).relatedCapaId || (input.source as EightDData).relatedCapaId || metadata.relatedCapaId || '');
  const linkedEightDId = String((input.source as NcrData).relatedEightDId || (input.source as CapaData).relatedEightDId || metadata.relatedEightDId || '');
  const dataLimitations: string[] = [];
  if (linkedDefects.length === 0) dataLimitations.push('No linked defect records were found for before/after verification.');
  if (linkedActions.length === 0) dataLimitations.push('No linked improvement actions are registered yet.');
  if (primary?.confidenceLabel === 'Insufficient Data') dataLimitations.push('Matching before/after records are not enough for a strong effectiveness signal.');
  if (dataLimitations.length === 0) dataLimitations.push('Use this effectiveness signal with engineering verification before closure.');

  return {
    sourceType: input.sourceType,
    sourceId: String(input.source.id || ''),
    linkedDefects,
    linkedActions,
    linkedNcr: input.ncrs?.find((ncr) => normalize(ncr.id) === normalize(linkedNcrId)),
    linkedCapa: input.capas?.find((capa) => normalize(capa.id) === normalize(linkedCapaId)),
    linkedEightD: input.eightDs?.find((eightD) => normalize(eightD.id) === normalize(linkedEightDId)),
    effectivenessStatus: primary?.effectivenessStatus || String((input.source as NcrData | CapaData | EightDData).effectivenessResult || metadata.effectivenessResult || 'Insufficient Data'),
    confidenceLabel: primary?.confidenceLabel || 'Insufficient Data',
    beforeMetric: primary?.primaryMetric.before || 0,
    afterMetric: primary?.primaryMetric.after || 0,
    improvementPercent: primary?.primaryMetric.improvementPercent ?? null,
    dataLimitations,
    recommendedFollowUp: primary?.verificationRecommendation || 'Link defects and improvement actions, then run effectiveness verification using real records.',
  };
}

export function buildClosedLoopCommandSummary(input: {
  ncrs: NcrData[];
  capas: CapaData[];
  eightDs: EightDData[];
  actions: QualityImprovementAction[];
}): ClosedLoopCommandSummary {
  const escalationTypes: QualityRelationshipEntityType[] = ['ncr', 'capa', 'eightD'];
  const actionLinkedToEscalation = (action: QualityImprovementAction, type?: QualityRelationshipEntityType): boolean => {
    if (type === 'ncr') return Boolean(action.relatedNcrId) || relatedIdsForEntity('improvement-action', action.id, 'ncr').length > 0;
    if (type === 'capa') return Boolean(action.relatedCapaId) || relatedIdsForEntity('improvement-action', action.id, 'capa').length > 0;
    if (type === 'eightD') return Boolean(action.relatedEightDId) || relatedIdsForEntity('improvement-action', action.id, 'eightD').length > 0;
    return Boolean(action.relatedNcrId || action.relatedCapaId || action.relatedEightDId)
      || escalationTypes.includes(action.sourceType as QualityRelationshipEntityType)
      || escalationTypes.some((escalationType) => relatedIdsForEntity('improvement-action', action.id, escalationType).length > 0);
  };
  const openNcrs = input.ncrs.filter((ncr) => !['closed', 'completed'].includes(normalize(ncr.status))).length;
  const ncrsWaitingCapa = input.ncrs.filter((ncr) => !ncr.relatedCapaId && !metadataOf(ncr).relatedCapaId && !['closed', 'completed'].includes(normalize(ncr.status))).length;
  const openCapas = input.capas.filter((capa) => !['closed', 'effective'].includes(normalize(capa.status))).length;
  const capasPendingVerification = input.capas.filter((capa) => ['verification', 'pending-verification'].includes(normalize(capa.status)) || normalize(capa.effectivenessResult) === 'monitoring required').length;
  const notEffectiveCapas = input.capas.filter((capa) => normalize(capa.effectivenessResult).includes('not effective') || normalize(metadataOf(capa).effectivenessResult).includes('not effective')).length;
  const openEightD = input.eightDs.filter((report) => !['closed', 'd8', 'completed'].includes(normalize(report.status))).length;
  const overdueEightD = input.eightDs.filter((report) => {
    const due = new Date(String(metadataOf(report).dueDate || metadataOf(report).targetDate || ''));
    return !Number.isNaN(due.getTime()) && due.getTime() < Date.now() && !['closed', 'd8', 'completed'].includes(normalize(report.status));
  }).length;
  const actionsLinkedToEscalations = input.actions.filter((action) => actionLinkedToEscalation(action)).length;
  const byType = escalationTypes.map((type) => {
    const actions = input.actions.filter((action) => action.sourceType === type || actionLinkedToEscalation(action, type));
    return {
      label: type,
      count: actions.length,
      effective: actions.filter((action) => action.effectivenessResult === 'Effective' || action.status === 'effective' || action.status === 'closed').length,
      notEffective: actions.filter((action) => action.effectivenessResult === 'Not Effective' || action.status === 'not-effective').length,
      pending: actions.filter((action) => !['effective', 'not-effective', 'closed', 'cancelled'].includes(action.status)).length,
    };
  });
  return { openNcrs, ncrsWaitingCapa, openCapas, capasPendingVerification, notEffectiveCapas, openEightD, overdueEightD, actionsLinkedToEscalations, effectivenessBySourceType: byType };
}

export function buildClosedLoopNotifications(input: {
  ncrs: NcrData[];
  capas: CapaData[];
  eightDs: EightDData[];
  actions: QualityImprovementAction[];
  readIds?: string[];
}): DefectWorkflowNotification[] {
  const readIds = input.readIds || [];
  const notifications: DefectWorkflowNotification[] = [];
  input.ncrs.filter((ncr) => !['closed', 'completed'].includes(normalize(ncr.status))).forEach((ncr) => {
    const id = `closed-loop-ncr-review-${ncr.id}`;
    notifications.push({
      id,
      type: 'pending-review',
      title: 'NCR requires review',
      message: `${ncr.title} requires review, containment, and linked action follow-up.`,
      severity: normalize(ncr.priority) === 'critical' ? 'critical' : 'warning',
      relatedDefectId: ncr.sourceDefectId || String(ncr.id || ''),
      createdAt: ncr.updatedAt || ncr.createdAt || new Date().toISOString(),
      read: readIds.includes(id),
      suggestedAction: 'Review NCR linkage to defects, CAPA/8D need, and improvement actions.',
    });
  });
  input.capas.filter((capa) => !['closed', 'effective'].includes(normalize(capa.status))).forEach((capa) => {
    const due = new Date(capa.dueDate || capa.targetCloseDate || '');
    const overdue = !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
    const id = `closed-loop-capa-${overdue ? 'overdue' : 'due'}-${capa.id}`;
    notifications.push({
      id,
      type: overdue ? 'action-overdue' : 'action-due-soon',
      title: overdue ? 'CAPA overdue' : 'CAPA follow-up required',
      message: `${capa.title} requires action planning, implementation, or effectiveness verification.`,
      severity: overdue ? 'critical' : 'warning',
      relatedDefectId: capa.sourceNcrId || String(capa.id || ''),
      createdAt: capa.updatedAt || capa.createdAt || new Date().toISOString(),
      read: readIds.includes(id),
      suggestedAction: 'Verify owner, due date, linked actions, and effectiveness status.',
    });
  });
  input.eightDs.filter((report) => !['closed', 'd8', 'completed'].includes(normalize(report.status))).forEach((report) => {
    const id = `closed-loop-8d-${report.id}`;
    notifications.push({
      id,
      type: 'eight-d-suggested',
      title: '8D step follow-up required',
      message: `${report.subject} has open 8D steps that require owner review.`,
      severity: 'warning',
      relatedDefectId: report.ncrReportId || String(report.id || ''),
      createdAt: report.updatedAt || report.createdAt || new Date().toISOString(),
      read: readIds.includes(id),
      suggestedAction: 'Review D-section owners, due dates, evidence, and linked improvement actions.',
    });
  });
  return notifications.slice(0, 100);
}

export function buildClosedLoopTasks(input: {
  ncrs: NcrData[];
  capas: CapaData[];
  eightDs: EightDData[];
}): DefectWorkflowTask[] {
  const tasks: DefectWorkflowTask[] = [];
  input.ncrs.filter((ncr) => !['closed', 'completed'].includes(normalize(ncr.status))).forEach((ncr) => {
    tasks.push({
      id: `task-ncr-${ncr.id}`,
      title: `Review NCR: ${ncr.title}`,
      category: 'review',
      relatedDefectId: ncr.sourceDefectId || String(ncr.id || ''),
      status: ncr.status || 'open',
      dueDate: ncr.targetCloseDate,
      overdue: Boolean(ncr.targetCloseDate && new Date(ncr.targetCloseDate).getTime() < Date.now()),
      message: 'NCR requires controlled review and linked improvement follow-up.',
    });
  });
  input.capas.filter((capa) => !['closed', 'effective'].includes(normalize(capa.status))).forEach((capa) => {
    tasks.push({
      id: `task-capa-${capa.id}`,
      title: `Progress CAPA: ${capa.title}`,
      category: normalize(capa.status).includes('verification') ? 'verification' : 'action',
      relatedDefectId: capa.sourceNcrId || String(capa.id || ''),
      status: capa.status || 'opened',
      dueDate: capa.dueDate || capa.targetCloseDate,
      overdue: Boolean((capa.dueDate || capa.targetCloseDate) && new Date(capa.dueDate || capa.targetCloseDate || '').getTime() < Date.now()),
      message: 'CAPA needs owner progress and effectiveness evidence.',
    });
  });
  input.eightDs.filter((report) => !['closed', 'd8', 'completed'].includes(normalize(report.status))).forEach((report) => {
    tasks.push({
      id: `task-8d-${report.id}`,
      title: `Follow 8D: ${report.subject}`,
      category: 'follow-up',
      relatedDefectId: report.ncrReportId || String(report.id || ''),
      status: report.status || 'open',
      overdue: false,
      message: '8D step completion and evidence should be reviewed.',
    });
  });
  return tasks.slice(0, 150);
}
