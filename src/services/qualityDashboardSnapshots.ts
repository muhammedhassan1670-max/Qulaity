import type { QualityAnalyticsSnapshot, QualityDashboardFilters } from '@/services/qualityAnalyticsHub';
import { loadQualityDashboardFilters, saveQualityDashboardFilters } from '@/services/qualityAnalyticsHub';
import { getDefectPersistenceDiagnostics } from '@/services/safeDefectStorage';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';

export interface QualityDashboardSnapshotMetric {
  label: string;
  value: string | number;
  note?: string;
}

export interface QualityDashboardSnapshotPayload {
  exportType: 'quality-dashboard-snapshot';
  dashboardName: string;
  generatedAt: string;
  appliedFilters: QualityDashboardFilters;
  keyMetrics: QualityDashboardSnapshotMetric[];
  dataQualityWarnings: string[];
  confidenceLabels: Record<string, string>;
  topRisks: Array<{ title: string; score: number; suggestedNextAction: string }>;
  focusAreas: string[];
  sourceNote: string;
  defectStorageHealth: {
    storageKey: string;
    recordCount: number;
    latestBackupExists: boolean;
    latestBackupCount: number;
    storageHealth: string;
  };
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

export function summarizeDashboardFilters(filters: QualityDashboardFilters): string {
  const active = Object.entries(filters)
    .filter(([key, value]) => key !== 'fromDate' && key !== 'toDate' && clean(value) !== '' && !(key === 'datePreset' && value === 'all'))
    .map(([key, value]) => `${key}: ${value}`);
  if (filters.datePreset === 'custom') {
    active.unshift(`date: ${filters.fromDate || 'start'} to ${filters.toDate || 'end'}`);
  }
  return active.length ? active.join(', ') : 'No active filters';
}

export function buildDashboardSnapshotPayload(input: {
  dashboardName: string;
  snapshot: QualityAnalyticsSnapshot;
  keyMetrics?: QualityDashboardSnapshotMetric[];
  focusAreas?: string[];
}): QualityDashboardSnapshotPayload {
  const diagnostics = getDefectPersistenceDiagnostics();
  const snapshot = input.snapshot;
  const keyMetrics = input.keyMetrics?.length ? input.keyMetrics : [
    { label: 'Defect records', value: snapshot.defectMetrics.totalRecords },
    { label: 'Defect quantity', value: snapshot.defectMetrics.totalDefectQuantity },
    { label: 'Process PPM', value: snapshot.ppmMetrics.currentPpm },
    { label: 'COPQ', value: snapshot.copqMetrics.totalCopq },
    { label: 'Failed checks without defect', value: snapshot.inspectionExecutionMetrics.failedChecksWithoutDefect },
    { label: 'Open NCRs', value: snapshot.escalationMetrics.openNcrs },
    { label: 'Open CAPAs', value: snapshot.escalationMetrics.openCapas },
    { label: 'Open 8Ds', value: snapshot.escalationMetrics.openEightD },
    { label: 'Open actions', value: snapshot.actionEffectivenessMetrics.openActions },
  ];

  return {
    exportType: 'quality-dashboard-snapshot',
    dashboardName: input.dashboardName,
    generatedAt: new Date().toISOString(),
    appliedFilters: snapshot.filters,
    keyMetrics,
    dataQualityWarnings: snapshot.dataQualityMetrics.warnings.map((warning) => `${warning.title}: ${warning.message}`),
    confidenceLabels: snapshot.dashboardConfidenceLabels,
    topRisks: snapshot.riskMetrics.topRisks.slice(0, 5).map((risk) => ({
      title: risk.title,
      score: risk.riskScore,
      suggestedNextAction: risk.suggestedNextAction,
    })),
    focusAreas: input.focusAreas?.length
      ? input.focusAreas
      : [
        snapshot.managementSummary,
        ...snapshot.riskMetrics.topRisks.slice(0, 3).map((risk) => `${risk.title}: ${risk.suggestedNextAction}`),
      ].filter(Boolean),
    sourceNote: 'Real local QMS records only. Snapshot exports do not include raw dataset rows.',
    defectStorageHealth: {
      storageKey: diagnostics.storageKey,
      recordCount: diagnostics.recordCount,
      latestBackupExists: diagnostics.latestBackupExists,
      latestBackupCount: diagnostics.latestBackupCount,
      storageHealth: diagnostics.storageHealth,
    },
  };
}

export function formatDashboardSnapshotMarkdown(payload: QualityDashboardSnapshotPayload): string {
  return [
    `# ${payload.dashboardName} Snapshot`,
    `Generated: ${new Date(payload.generatedAt).toLocaleString()}`,
    '',
    '## Applied Filters',
    summarizeDashboardFilters(payload.appliedFilters),
    '',
    '## Key Metrics',
    ...payload.keyMetrics.map((metric) => `- ${metric.label}: ${metric.value}${metric.note ? ` (${metric.note})` : ''}`),
    '',
    '## Confidence',
    ...Object.entries(payload.confidenceLabels).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Data Quality Warnings',
    ...(payload.dataQualityWarnings.length ? payload.dataQualityWarnings.map((warning) => `- ${warning}`) : ['- No key missing-data warnings in the current filtered snapshot.']),
    '',
    '## Top Risks / Focus Areas',
    ...(payload.topRisks.length
      ? payload.topRisks.map((risk, index) => `${index + 1}. ${risk.title} | Score ${risk.score} | ${risk.suggestedNextAction}`)
      : payload.focusAreas.map((item, index) => `${index + 1}. ${item}`)),
    '',
    '## Defect Storage Health',
    `- Key: ${payload.defectStorageHealth.storageKey}`,
    `- Records: ${payload.defectStorageHealth.recordCount}`,
    `- Latest backup: ${payload.defectStorageHealth.latestBackupExists ? `${payload.defectStorageHealth.latestBackupCount} record(s)` : 'Not available yet'}`,
    `- Health: ${payload.defectStorageHealth.storageHealth}`,
    '',
    `Note: ${payload.sourceNote}`,
  ].join('\n');
}

export async function copyDashboardSnapshotSummary(payload: QualityDashboardSnapshotPayload): Promise<void> {
  await navigator.clipboard.writeText(formatDashboardSnapshotMarkdown(payload));
  enqueueQualitySyncItem({
    entityType: 'dashboard',
    entityId: payload.dashboardName,
    operation: 'dashboard-summary-copied',
    payloadSummary: `${payload.dashboardName} dashboard summary copied locally.`,
  });
}

export function exportDashboardSnapshot(payload: QualityDashboardSnapshotPayload, format: 'markdown' | 'json'): void {
  const content = format === 'json' ? JSON.stringify(payload, null, 2) : formatDashboardSnapshotMarkdown(payload);
  const type = format === 'json' ? 'application/json;charset=utf-8' : 'text/markdown;charset=utf-8';
  const extension = format === 'json' ? 'json' : 'md';
  const fileName = `${payload.dashboardName.toLowerCase().replace(/[^a-z0-9]+/gi, '_')}_${new Date(payload.generatedAt).toISOString().split('T')[0]}.${extension}`;
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  enqueueQualitySyncItem({
    entityType: 'dashboard',
    entityId: payload.dashboardName,
    operation: 'dashboard-snapshot-export',
    payloadSummary: `${payload.dashboardName} dashboard snapshot exported as ${format}.`,
  });
}

export function buildDashboardDrilldownUrl(route: string, filters: Partial<QualityDashboardFilters> = {}): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (clean(value)) params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `${route}?${query}` : route;
}

export function recordDashboardDrilldown(route: string, filters: Partial<QualityDashboardFilters> = {}, label = 'dashboard drilldown'): void {
  const merged = saveQualityDashboardFilters({ ...loadQualityDashboardFilters(), ...filters }, false);
  enqueueQualitySyncItem({
    entityType: 'dashboard',
    entityId: route,
    operation: 'dashboard-drilldown-opened',
    payloadSummary: `${label} opened with filters: ${summarizeDashboardFilters(merged)}.`,
  });
}
