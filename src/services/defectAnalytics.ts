import { unifiedDefectLogApi, type DefectLogData } from '@/api/unified-api';

export type DefectRecordType = 'process-ppm' | 'defect-cost' | 'outgoing-quality' | 'customer-return';
export type DefectPeriod = 'week' | 'month' | 'quarter' | 'year';

export type ExtendedDefectLog = DefectLogData & {
  recordType?: DefectRecordType | string;
  inspectedQuantity?: number | string;
  productionQuantity?: number | string;
  estimatedCost?: number | string;
  costCategory?: 'internal-failure' | 'external-failure' | 'appraisal' | 'prevention' | string;
  outgoingResult?: 'pass' | 'fail' | 'hold' | string;
  shipmentId?: string;
  customerName?: string;
  releaseTimeHrs?: number | string;
  returnReference?: string;
};

const COLORS = ['#00A3E0', '#EF4444', '#F59E0B', '#8B5CF6', '#10B981', '#F97316'];

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (!cleaned) return 0;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function dayKey(value?: string): string {
  if (!value) return new Date().toISOString().split('T')[0];
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.split('T')[0] : date.toISOString().split('T')[0];
}

function getPeriodStart(period: DefectPeriod): Date {
  const date = new Date();
  const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getDefectRecordType(record: ExtendedDefectLog): DefectRecordType {
  const raw = String(record.recordType || '').toLowerCase();
  if (raw === 'defect-cost' || raw === 'copq') return 'defect-cost';
  if (raw === 'outgoing-quality' || raw === 'outgoing') return 'outgoing-quality';
  if (raw === 'customer-return' || raw === 'returns' || raw === 'return') return 'customer-return';
  if (record.outgoingResult) return 'outgoing-quality';
  if (record.returnReference) return 'customer-return';
  if (toNumber(record.estimatedCost) > 0 || record.costCategory) return 'defect-cost';
  return 'process-ppm';
}

function isInPeriod(record: ExtendedDefectLog, period: DefectPeriod): boolean {
  const recordDate = new Date(record.date || record.createdAt || '');
  if (Number.isNaN(recordDate.getTime())) return true;
  return recordDate >= getPeriodStart(period);
}

function quantityOf(record: ExtendedDefectLog): number {
  return Math.max(0, toNumber(record.quantity));
}

function inspectedOf(record: ExtendedDefectLog): number {
  return Math.max(0, toNumber(record.inspectedQuantity || record.productionQuantity));
}

function costOf(record: ExtendedDefectLog): number {
  return Math.max(0, toNumber(record.estimatedCost));
}

function lineOf(record: ExtendedDefectLog): string {
  return record.productionLine || 'Unassigned';
}

function defectOf(record: ExtendedDefectLog): string {
  return record.defectType || 'Unclassified';
}

function groupSum<T>(
  rows: T[],
  keyer: (row: T) => string,
  valuer: (row: T) => number,
): Array<{ key: string; value: number }> {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const key = keyer(row);
    map.set(key, (map.get(key) || 0) + valuer(row));
  });
  return [...map.entries()]
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
}

function normalizeCostCategory(record: ExtendedDefectLog): 'internal-failure' | 'external-failure' | 'appraisal' | 'prevention' {
  const category = String(record.costCategory || '').toLowerCase();
  if (category === 'external-failure' || getDefectRecordType(record) === 'customer-return') return 'external-failure';
  if (category === 'appraisal') return 'appraisal';
  if (category === 'prevention') return 'prevention';
  return 'internal-failure';
}

export async function loadDefectRecords(): Promise<ExtendedDefectLog[]> {
  const response = await unifiedDefectLogApi.getAll();
  return (response.data || []) as ExtendedDefectLog[];
}

export function analyzeDefectRecords(records: ExtendedDefectLog[], period: DefectPeriod = 'month') {
  const periodRecords = records.filter((record) => isInPeriod(record, period));
  const processRecords = periodRecords.filter((record) => getDefectRecordType(record) === 'process-ppm');
  const costRecords = periodRecords.filter((record) => costOf(record) > 0 || getDefectRecordType(record) === 'defect-cost' || getDefectRecordType(record) === 'customer-return');
  const outgoingRecords = periodRecords.filter((record) => getDefectRecordType(record) === 'outgoing-quality');
  const returnRecords = periodRecords.filter((record) => getDefectRecordType(record) === 'customer-return');

  const totalDefects = periodRecords.reduce((sum, record) => sum + quantityOf(record), 0);
  const inspectedTotal = processRecords.reduce((sum, record) => sum + inspectedOf(record), 0);
  const currentPpm = inspectedTotal > 0 ? Math.round((processRecords.reduce((sum, record) => sum + quantityOf(record), 0) / inspectedTotal) * 1_000_000) : 0;

  const lineStats = groupSum(processRecords, lineOf, quantityOf).map((line) => {
    const lineRows = processRecords.filter((record) => lineOf(record) === line.key);
    const inspected = lineRows.reduce((sum, record) => sum + inspectedOf(record), 0);
    return {
      line: line.key,
      defects: line.value,
      inspected,
      ppm: inspected > 0 ? Math.round((line.value / inspected) * 1_000_000) : 0,
    };
  });

  const linePpm = lineStats.filter((line) => line.defects > 0 || line.inspected > 0);
  const bestLine = linePpm.length ? [...linePpm].sort((a, b) => a.ppm - b.ppm)[0] : null;
  const worstLine = linePpm.length ? [...linePpm].sort((a, b) => b.ppm - a.ppm)[0] : null;

  const ppmTrendData = groupSum(processRecords, (record) => dayKey(record.date), quantityOf)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((day) => {
      const dayRows = processRecords.filter((record) => dayKey(record.date) === day.key);
      const inspected = dayRows.reduce((sum, record) => sum + inspectedOf(record), 0);
      return {
        period: day.key,
        name: day.key,
        ppm: inspected > 0 ? Math.round((day.value / inspected) * 1_000_000) : 0,
        target: 0,
        open: day.value,
      };
    });

  const defectDistribution = groupSum(periodRecords, defectOf, quantityOf).map((item, index) => ({
    name: item.key,
    value: item.value,
    color: COLORS[index % COLORS.length],
  }));

  const defectTrendData = groupSum(periodRecords, (record) => dayKey(record.date), quantityOf)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((day) => ({
      period: day.key,
      name: day.key,
      open: day.value,
    }));

  const topDefects = groupSum(processRecords, (record) => `${defectOf(record)}|${lineOf(record)}`, quantityOf)
    .slice(0, 10)
    .map((item) => {
      const [defect, line] = item.key.split('|');
      const related = processRecords.filter((record) => defectOf(record) === defect && lineOf(record) === line);
      const inspected = related.reduce((sum, record) => sum + inspectedOf(record), 0);
      return {
        defect,
        line,
        ppm: inspected > 0 ? Math.round((item.value / inspected) * 1_000_000) : 0,
        trend: 0,
      };
    });

  const costs = {
    internalFailure: 0,
    externalFailure: 0,
    appraisal: 0,
    prevention: 0,
  };
  costRecords.forEach((record) => {
    const cost = costOf(record);
    const category = normalizeCostCategory(record);
    if (category === 'external-failure') costs.externalFailure += cost;
    else if (category === 'appraisal') costs.appraisal += cost;
    else if (category === 'prevention') costs.prevention += cost;
    else costs.internalFailure += cost;
  });
  const totalCopq = costs.internalFailure + costs.externalFailure + costs.appraisal + costs.prevention;
  const copqBreakdown = [
    { name: 'Internal Failure', value: costs.internalFailure, color: '#F97316' },
    { name: 'External Failure', value: costs.externalFailure, color: '#DC2626' },
    { name: 'Appraisal', value: costs.appraisal, color: '#3B82F6' },
    { name: 'Prevention', value: costs.prevention, color: '#22C55E' },
  ].filter((item) => item.value > 0);

  const monthlyCost = groupSum(costRecords, (record) => dayKey(record.date).slice(0, 7), costOf)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((month) => {
      const rows = costRecords.filter((record) => dayKey(record.date).startsWith(month.key));
      return {
        month: month.key,
        internal: rows.filter((record) => normalizeCostCategory(record) === 'internal-failure').reduce((sum, record) => sum + costOf(record), 0),
        external: rows.filter((record) => normalizeCostCategory(record) === 'external-failure').reduce((sum, record) => sum + costOf(record), 0),
        appraisal: rows.filter((record) => normalizeCostCategory(record) === 'appraisal').reduce((sum, record) => sum + costOf(record), 0),
        prevention: rows.filter((record) => normalizeCostCategory(record) === 'prevention').reduce((sum, record) => sum + costOf(record), 0),
      };
    });

  const topCostDrivers = groupSum(costRecords, defectOf, costOf).slice(0, 10).map((item) => ({
    driver: item.key,
    category: 'COPQ',
    cost: item.value,
    trend: 0,
  }));

  const passedOutgoing = outgoingRecords.filter((record) => String(record.outgoingResult || '').toLowerCase() === 'pass').length;
  const holds = outgoingRecords.filter((record) => String(record.outgoingResult || '').toLowerCase() === 'hold').length;
  const failedOutgoing = outgoingRecords.filter((record) => String(record.outgoingResult || '').toLowerCase() === 'fail').length;
  const releaseTrend = groupSum(outgoingRecords, (record) => dayKey(record.date), () => 1)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((day) => {
      const dayRows = outgoingRecords.filter((record) => dayKey(record.date) === day.key);
      const passed = dayRows.filter((record) => String(record.outgoingResult || '').toLowerCase() === 'pass').length;
      return {
        day: day.key,
        releaseHrs: dayRows.length ? Number((dayRows.reduce((sum, record) => sum + toNumber(record.releaseTimeHrs), 0) / dayRows.length).toFixed(1)) : 0,
        passRate: dayRows.length ? Math.round((passed / dayRows.length) * 100) : 0,
      };
    });

  const recentOutgoing = outgoingRecords.slice(0, 10).map((record) => {
    const result = String(record.outgoingResult || 'hold').toLowerCase();
    return {
      id: record.id,
      shipment: record.shipmentId || record.partId || '--',
      customer: record.customerName || '--',
      result: result === 'pass' || result === 'fail' || result === 'hold' ? result : 'hold',
      defects: quantityOf(record),
      holds: result === 'hold',
      date: dayKey(record.date),
    };
  });

  return {
    records: periodRecords,
    kpis: {
      totalRecords: periodRecords.length,
      totalDefects,
      currentPpm,
      targetPpm: 0,
      bestLinePpm: bestLine?.ppm || 0,
      worstLinePpm: worstLine?.ppm || 0,
      ppmTrend: 0,
      totalCopq,
      internalFailure: costs.internalFailure,
      externalFailure: costs.externalFailure,
      appraisal: costs.appraisal,
      prevention: costs.prevention,
      copqPercentSales: 0,
      shipments: outgoingRecords.length,
      outgoingInspections: outgoingRecords.length,
      passRate: outgoingRecords.length ? Math.round((passedOutgoing / outgoingRecords.length) * 100) : 0,
      holds,
      escapes: failedOutgoing + returnRecords.length,
      avgReleaseTimeHrs: outgoingRecords.length ? Number((outgoingRecords.reduce((sum, record) => sum + toNumber(record.releaseTimeHrs), 0) / outgoingRecords.length).toFixed(1)) : 0,
      returns: returnRecords.length,
      returnQty: returnRecords.reduce((sum, record) => sum + quantityOf(record), 0),
    },
    ppmTrendData,
    defectTrendData,
    linePpm,
    topDefects,
    defectDistribution,
    monthlyCost,
    copqBreakdown,
    topCostDrivers,
    releaseTrend,
    recentOutgoing,
  };
}
