import { Copy, Download, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { QualityAnalyticsSnapshot } from '@/services/qualityAnalyticsHub';
import {
  buildDashboardSnapshotPayload,
  copyDashboardSnapshotSummary,
  exportDashboardSnapshot,
  summarizeDashboardFilters,
  type QualityDashboardSnapshotMetric,
} from '@/services/qualityDashboardSnapshots';
import { getDefectPersistenceDiagnostics } from '@/services/safeDefectStorage';

interface QualityAnalyticsConsistencyBadgeProps {
  dashboardName: string;
  snapshot: QualityAnalyticsSnapshot | null;
  keyMetrics?: QualityDashboardSnapshotMetric[];
  focusAreas?: string[];
  compact?: boolean;
}

function confidenceClass(value?: string): string {
  if (value === 'Strong Signal') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
  if (value === 'Moderate Signal') return 'border-[#00A3E0]/20 bg-[#00A3E0]/10 text-[#8be3ff]';
  if (value === 'Weak Signal') return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
  return 'border-white/10 bg-white/5 text-white/50';
}

function storageClass(value?: string): string {
  if (value === 'OK') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
  if (value === 'Warning') return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
  return 'border-red-400/20 bg-red-400/10 text-red-200';
}

export function QualityAnalyticsConsistencyBadge({
  dashboardName,
  snapshot,
  keyMetrics,
  focusAreas,
  compact = false,
}: QualityAnalyticsConsistencyBadgeProps) {
  if (!snapshot) return null;
  const diagnostics = getDefectPersistenceDiagnostics();
  const warnings = snapshot.dataQualityMetrics.warnings.slice(0, compact ? 2 : 4);
  const payload = buildDashboardSnapshotPayload({ dashboardName, snapshot, keyMetrics, focusAreas });
  const confidence = snapshot.dashboardConfidenceLabels.defects || snapshot.dashboardConfidenceLabels.overall || 'Moderate Signal';

  const copySummary = async () => {
    try {
      await copyDashboardSnapshotSummary(payload);
      toast.success('Dashboard summary copied', { description: `${dashboardName} summary copied without raw dataset rows.` });
    } catch {
      toast.error('Copy failed', { description: 'Clipboard access is not available in this browser.' });
    }
  };

  const exportSummary = (format: 'markdown' | 'json') => {
    exportDashboardSnapshot(payload, format);
    toast.success('Dashboard snapshot exported', { description: `Exported ${dashboardName} as ${format}.` });
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#00A3E0]/20 bg-[#00A3E0]/10 px-3 py-1 text-xs font-black text-[#8be3ff]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Using Unified Analytics Hub
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${confidenceClass(confidence)}`}>
              {confidence}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${storageClass(diagnostics.storageHealth)}`}>
              Defect storage: {diagnostics.storageHealth}
            </span>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/45">
            Filters: {summarizeDashboardFilters(snapshot.filters)}. Last calculated: {new Date(snapshot.loadedAt).toLocaleString()}.
          </p>
          <p className="mt-1 text-xs text-white/35">
            Source note: real local records only. Defect key: {diagnostics.storageKey} / {diagnostics.recordCount} record(s).
          </p>
          {warnings.length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              {warnings.map((warning) => (
                <p key={warning.id} className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  {warning.message}
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={copySummary} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
            <Copy className="h-4 w-4" /> Copy
          </button>
          <button type="button" onClick={() => exportSummary('markdown')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
            <Download className="h-4 w-4" /> MD
          </button>
          <button type="button" onClick={() => exportSummary('json')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
            <Download className="h-4 w-4" /> JSON
          </button>
        </div>
      </div>
    </section>
  );
}

export default QualityAnalyticsConsistencyBadge;
