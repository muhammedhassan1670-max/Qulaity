/**
 * QMS 4.0 — SPC Engine (Statistical Process Control)
 * Core engine for calculating control limits, capability indices, and analyzing process stability.
 * Uses standard AIAG / ASTM constants.
 */

// ==========================================
// 1. SPC Constants (For Subgroup Sizes 2-25)
// ==========================================

export const SPC_CONSTANTS = {
  // Constants for X-bar / R Charts
  // Index matches subgroup size (n). n=0,1 are null/0.
  A2: [0, 0, 1.880, 1.023, 0.729, 0.577, 0.483, 0.419, 0.373, 0.337, 0.308, 0.285, 0.266, 0.249, 0.235, 0.223, 0.212, 0.203, 0.194, 0.187, 0.180, 0.173, 0.167, 0.162, 0.157, 0.153],
  D3: [0, 0, 0, 0, 0, 0, 0, 0.076, 0.136, 0.184, 0.223, 0.256, 0.283, 0.307, 0.328, 0.347, 0.363, 0.378, 0.391, 0.403, 0.415, 0.425, 0.434, 0.443, 0.451, 0.459],
  D4: [0, 0, 3.267, 2.574, 2.282, 2.114, 2.004, 1.924, 1.864, 1.816, 1.777, 1.744, 1.717, 1.693, 1.672, 1.653, 1.637, 1.622, 1.608, 1.597, 1.585, 1.575, 1.566, 1.557, 1.548, 1.541],
  
  // Constants for X-bar / S Charts
  A3: [0, 0, 2.659, 1.954, 1.628, 1.427, 1.287, 1.182, 1.099, 1.032, 0.975, 0.927, 0.886, 0.850, 0.817, 0.789, 0.763, 0.739, 0.718, 0.698, 0.680, 0.663, 0.647, 0.633, 0.619, 0.606],
  B3: [0, 0, 0, 0, 0, 0, 0.030, 0.118, 0.185, 0.239, 0.284, 0.321, 0.354, 0.382, 0.406, 0.428, 0.448, 0.466, 0.482, 0.497, 0.510, 0.523, 0.534, 0.545, 0.555, 0.565],
  B4: [0, 0, 3.267, 2.568, 2.266, 2.089, 1.970, 1.882, 1.815, 1.761, 1.716, 1.679, 1.646, 1.618, 1.594, 1.572, 1.552, 1.534, 1.518, 1.503, 1.490, 1.477, 1.466, 1.455, 1.445, 1.435],
  
  // Constant for estimating Sigma from R-bar or MR-bar
  d2: [0, 0, 1.128, 1.693, 2.059, 2.326, 2.534, 2.704, 2.847, 2.970, 3.078, 3.173, 3.258, 3.336, 3.407, 3.472, 3.532, 3.588, 3.640, 3.689, 3.735, 3.778, 3.819, 3.858, 3.895, 3.931],
  // d2 value for n=2 is 1.128 (used for I-MR charts)
};

// ==========================================
// 2. Types & Interfaces
// ==========================================

export interface SpcSubgroup {
  id: string;
  label: string;
  values: number[];
}

export interface SpcControlLimits {
  ucl: number;
  cl: number;
  lcl: number;
}

export interface SpcViolation {
  index: number;
  rule: number;
  description: string;
}

export interface SpcChartPoint {
  label: string;
  value: number | null; // null for moving range first point
  ucl: number;
  cl: number;
  lcl: number;
  outOfControl: boolean;
  violations: string[];
}

export interface SpcControlChartResult {
  chartType: string;
  primaryChart: SpcChartPoint[];
  secondaryChart?: SpcChartPoint[];
  primaryLimits: SpcControlLimits;
  secondaryLimits?: SpcControlLimits;
  overallMean: number;
  overallSigma: number;
  withinSigma: number;
}

export interface SpcCapabilityResult {
  cp: number;
  cpk: number;
  pp: number;
  ppk: number;
  overallMean: number;
  withinSigma: number;
  overallSigma: number;
  usl: number;
  lsl: number;
  target?: number;
  ppmAboveUSL: number;
  ppmBelowLSL: number;
  ppmTotal: number;
}

export interface HistogramBin {
  binStart: number;
  binEnd: number;
  binLabel: string;
  count: number;
  frequency: number;
  normalY: number;
}

// ==========================================
// 3. Helper Mathematical Functions
// ==========================================

export const mathHelper = {
  mean: (values: number[]): number => {
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  },
  
  range: (values: number[]): number => {
    if (!values || values.length === 0) return 0;
    return Math.max(...values) - Math.min(...values);
  },
  
  stdDev: (values: number[], isPopulation: boolean = false): number => {
    if (!values || values.length <= 1) return 0;
    const m = mathHelper.mean(values);
    const sumSq = values.reduce((sum, val) => sum + Math.pow(val - m, 2), 0);
    return Math.sqrt(sumSq / (isPopulation ? values.length : values.length - 1));
  },
  
  normalPDF: (x: number, mean: number, sigma: number): number => {
    if (sigma === 0) return x === mean ? 1 : 0;
    const coef = 1 / (sigma * Math.sqrt(2 * Math.PI));
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(sigma, 2));
    return coef * Math.exp(exponent);
  },
  
  normalCDF: (x: number, mean: number, sigma: number): number => {
    if (sigma === 0) return x >= mean ? 1 : 0;
    const z = (x - mean) / sigma;
    // Approximation for error function
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (z > 0) p = 1 - p;
    return p;
  }
};

// ==========================================
// 4. Nelson Rules Checker
// ==========================================

export function checkNelsonRules(points: number[], cl: number, sigma: number): SpcViolation[] {
  const violations: SpcViolation[] = [];
  if (points.length === 0 || sigma === 0) return violations;

  for (let i = 0; i < points.length; i++) {
    const val = points[i];
    if (val === null || isNaN(val)) continue;

    // Rule 1: 1 point > 3σ from center line
    if (Math.abs(val - cl) > 3 * sigma) {
      violations.push({ index: i, rule: 1, description: '1 point > 3σ from center line' });
    }

    // Rule 2: 9 points in a row on same side of center line
    if (i >= 8) {
      const slice = points.slice(i - 8, i + 1);
      if (slice.every(p => p > cl) || slice.every(p => p < cl)) {
        violations.push({ index: i, rule: 2, description: '9 consecutive points on same side of center line' });
      }
    }

    // Rule 3: 6 points in a row, all increasing or all decreasing
    if (i >= 5) {
      const slice = points.slice(i - 5, i + 1);
      let inc = true, dec = true;
      for (let j = 1; j < slice.length; j++) {
        if (slice[j] <= slice[j-1]) inc = false;
        if (slice[j] >= slice[j-1]) dec = false;
      }
      if (inc || dec) {
        violations.push({ index: i, rule: 3, description: '6 consecutive points steadily increasing or decreasing' });
      }
    }

    // Rule 4: 14 points in a row, alternating up and down
    if (i >= 13) {
      const slice = points.slice(i - 13, i + 1);
      let alt = true;
      for (let j = 2; j < slice.length; j++) {
        const dir1 = slice[j-1] > slice[j-2];
        const dir2 = slice[j] > slice[j-1];
        if (dir1 === dir2) { alt = false; break; }
      }
      if (alt) {
        violations.push({ index: i, rule: 4, description: '14 consecutive points alternating up and down' });
      }
    }
    
    // We'll stick to the first 4 main rules for performance, but 5-8 can be added similarly.
  }
  return violations;
}

// ==========================================
// 5. Control Chart Calculations
// ==========================================

export function calculateXbarR(subgroups: SpcSubgroup[]): SpcControlChartResult {
  if (subgroups.length === 0) throw new Error('No data');
  
  const n = subgroups[0].values.length;
  if (n < 2 || n > 25) throw new Error('Subgroup size must be between 2 and 25 for X-bar/R charts');
  
  const means = subgroups.map(sg => mathHelper.mean(sg.values));
  const ranges = subgroups.map(sg => mathHelper.range(sg.values));
  
  const xDoubleBar = mathHelper.mean(means);
  const rBar = mathHelper.mean(ranges);
  
  const A2 = SPC_CONSTANTS.A2[n];
  const D3 = SPC_CONSTANTS.D3[n];
  const D4 = SPC_CONSTANTS.D4[n];
  const d2 = SPC_CONSTANTS.d2[n];
  
  const xbarLimits: SpcControlLimits = {
    ucl: xDoubleBar + (A2 * rBar),
    cl: xDoubleBar,
    lcl: xDoubleBar - (A2 * rBar)
  };
  
  const rLimits: SpcControlLimits = {
    ucl: D4 * rBar,
    cl: rBar,
    lcl: D3 * rBar
  };
  
  const withinSigma = rBar / d2;
  const allValues = subgroups.flatMap(sg => sg.values);
  const overallSigma = mathHelper.stdDev(allValues);
  
  const xbarViolations = checkNelsonRules(means, xbarLimits.cl, withinSigma / Math.sqrt(n));
  const primaryChart = subgroups.map((sg, i) => ({
    label: sg.label,
    value: means[i],
    ...xbarLimits,
    outOfControl: means[i] > xbarLimits.ucl || means[i] < xbarLimits.lcl,
    violations: xbarViolations.filter(v => v.index === i).map(v => v.description)
  }));
  
  const rViolations = checkNelsonRules(ranges, rLimits.cl, (D4-1)*rBar/3); // Approximate sigma for R
  const secondaryChart = subgroups.map((sg, i) => ({
    label: sg.label,
    value: ranges[i],
    ...rLimits,
    outOfControl: ranges[i] > rLimits.ucl || ranges[i] < rLimits.lcl,
    violations: rViolations.filter(v => v.index === i).map(v => v.description)
  }));

  return {
    chartType: 'X-bar / R',
    primaryChart,
    secondaryChart,
    primaryLimits: xbarLimits,
    secondaryLimits: rLimits,
    overallMean: xDoubleBar,
    overallSigma,
    withinSigma
  };
}

export function calculateIMR(data: {label: string, value: number}[]): SpcControlChartResult {
  if (data.length < 2) throw new Error('Need at least 2 data points for I-MR chart');
  
  const values = data.map(d => d.value);
  const xBar = mathHelper.mean(values);
  
  const movingRanges: (number | null)[] = [null];
  for (let i = 1; i < values.length; i++) {
    movingRanges.push(Math.abs(values[i] - values[i-1]));
  }
  
  const validMRs = movingRanges.filter(mr => mr !== null) as number[];
  const mrBar = mathHelper.mean(validMRs);
  
  // For n=2 (moving range of 2 consecutive points)
  const d2 = 1.128;
  const D3 = 0;
  const D4 = 3.267;
  const E2 = 2.66; // 3/d2
  
  const withinSigma = mrBar / d2;
  const overallSigma = mathHelper.stdDev(values);
  
  const iLimits: SpcControlLimits = {
    ucl: xBar + (E2 * mrBar),
    cl: xBar,
    lcl: xBar - (E2 * mrBar)
  };
  
  const mrLimits: SpcControlLimits = {
    ucl: D4 * mrBar,
    cl: mrBar,
    lcl: D3 * mrBar
  };
  
  const iViolations = checkNelsonRules(values, iLimits.cl, withinSigma);
  const primaryChart = data.map((d, i) => ({
    label: d.label,
    value: d.value,
    ...iLimits,
    outOfControl: d.value > iLimits.ucl || d.value < iLimits.lcl,
    violations: iViolations.filter(v => v.index === i).map(v => v.description)
  }));
  
  const secondaryChart = data.map((d, i) => ({
    label: d.label,
    value: movingRanges[i],
    ...mrLimits,
    outOfControl: movingRanges[i] !== null && (movingRanges[i]! > mrLimits.ucl || movingRanges[i]! < mrLimits.lcl),
    violations: [] // Nelson rules usually not applied to MR chart
  }));
  
  return {
    chartType: 'I-MR',
    primaryChart,
    secondaryChart,
    primaryLimits: iLimits,
    secondaryLimits: mrLimits,
    overallMean: xBar,
    overallSigma,
    withinSigma
  };
}

export function calculatePChart(data: {label: string, defective: number, sampleSize: number}[]): SpcControlChartResult {
  const totalDefective = data.reduce((sum, d) => sum + d.defective, 0);
  const totalSample = data.reduce((sum, d) => sum + d.sampleSize, 0);
  
  const pBar = totalDefective / totalSample; // average proportion
  
  const primaryChart = data.map(d => {
    const p = d.defective / d.sampleSize;
    // UCL/LCL are variable based on sample size!
    const sigma = Math.sqrt((pBar * (1 - pBar)) / d.sampleSize);
    const ucl = pBar + 3 * sigma;
    const lcl = Math.max(0, pBar - 3 * sigma);
    
    return {
      label: d.label,
      value: p,
      ucl,
      cl: pBar,
      lcl,
      outOfControl: p > ucl || p < lcl,
      violations: []
    };
  });
  
  // Approximate average limits for the summary
  const avgSampleSize = totalSample / data.length;
  const avgSigma = Math.sqrt((pBar * (1 - pBar)) / avgSampleSize);
  
  return {
    chartType: 'p Chart',
    primaryChart,
    primaryLimits: {
      ucl: pBar + 3 * avgSigma,
      cl: pBar,
      lcl: Math.max(0, pBar - 3 * avgSigma)
    },
    overallMean: pBar,
    overallSigma: avgSigma,
    withinSigma: avgSigma
  };
}

export function calculateUChart(data: {label: string, defects: number, units: number}[]): SpcControlChartResult {
  const totalDefects = data.reduce((sum, d) => sum + d.defects, 0);
  const totalUnits = data.reduce((sum, d) => sum + d.units, 0);
  
  const uBar = totalDefects / totalUnits;
  
  const primaryChart = data.map(d => {
    const u = d.defects / d.units;
    const sigma = Math.sqrt(uBar / d.units);
    const ucl = uBar + 3 * sigma;
    const lcl = Math.max(0, uBar - 3 * sigma);
    
    return {
      label: d.label,
      value: u,
      ucl,
      cl: uBar,
      lcl,
      outOfControl: u > ucl || u < lcl,
      violations: []
    };
  });
  
  const avgUnits = totalUnits / data.length;
  const avgSigma = Math.sqrt(uBar / avgUnits);
  
  return {
    chartType: 'u Chart',
    primaryChart,
    primaryLimits: {
      ucl: uBar + 3 * avgSigma,
      cl: uBar,
      lcl: Math.max(0, uBar - 3 * avgSigma)
    },
    overallMean: uBar,
    overallSigma: avgSigma,
    withinSigma: avgSigma
  };
}

// ==========================================
// 6. Capability Analysis
// ==========================================

export function calculateCapability(values: number[], usl: number, lsl: number, target?: number, withinSigma?: number): SpcCapabilityResult {
  const mean = mathHelper.mean(values);
  let overallSigma = mathHelper.stdDev(values);
  
  // If withinSigma not provided, estimate from moving range
  if (!withinSigma) {
    let sumMR = 0;
    for (let i = 1; i < values.length; i++) {
      sumMR += Math.abs(values[i] - values[i-1]);
    }
    const mrBar = sumMR / (values.length - 1);
    withinSigma = mrBar / 1.128; // d2 for n=2
  }
  
  if (withinSigma === 0) withinSigma = 0.0001; // prevent div by zero
  if (overallSigma === 0) overallSigma = 0.0001;
  
  const cp = (usl - lsl) / (6 * withinSigma);
  const cpu = (usl - mean) / (3 * withinSigma);
  const cpl = (mean - lsl) / (3 * withinSigma);
  const cpk = Math.min(cpu, cpl);
  
  const pp = (usl - lsl) / (6 * overallSigma);
  const ppu = (usl - mean) / (3 * overallSigma);
  const ppl = (mean - lsl) / (3 * overallSigma);
  const ppk = Math.min(ppu, ppl);
  
  const ppmAboveUSL = (1 - mathHelper.normalCDF(usl, mean, overallSigma)) * 1_000_000;
  const ppmBelowLSL = mathHelper.normalCDF(lsl, mean, overallSigma) * 1_000_000;
  
  return {
    cp,
    cpk,
    pp,
    ppk,
    overallMean: mean,
    withinSigma,
    overallSigma,
    usl,
    lsl,
    target,
    ppmAboveUSL,
    ppmBelowLSL,
    ppmTotal: ppmAboveUSL + ppmBelowLSL
  };
}

// ==========================================
// 7. Histogram Builder
// ==========================================

export function buildHistogramData(values: number[], binCount?: number): HistogramBin[] {
  if (values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = mathHelper.mean(values);
  const sigma = mathHelper.stdDev(values);
  
  // Sturges' rule
  if (!binCount) {
    binCount = Math.ceil(Math.log2(values.length) + 1);
  }
  if (binCount < 5) binCount = 5;
  
  // Widen range slightly so min/max don't fall exactly on bounds
  const range = max - min;
  const binWidth = range === 0 ? 1 : (range * 1.1) / binCount;
  const start = range === 0 ? min - 2.5 : min - (range * 0.05);
  
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    binStart: start + i * binWidth,
    binEnd: start + (i + 1) * binWidth,
    binLabel: `${(start + i * binWidth + binWidth/2).toFixed(2)}`,
    count: 0,
    frequency: 0,
    normalY: 0
  }));
  
  values.forEach(v => {
    let placed = false;
    for (let i = 0; i < bins.length; i++) {
      if (v >= bins[i].binStart && v < bins[i].binEnd) {
        bins[i].count++;
        placed = true;
        break;
      }
    }
    // Handle exact max value
    if (!placed && v >= bins[bins.length-1].binEnd) {
      bins[bins.length-1].count++;
    }
  });
  
  bins.forEach(b => {
    b.frequency = b.count / values.length;
    // Scale normal PDF to match frequency for overlay
    b.normalY = mathHelper.normalPDF((b.binStart + b.binEnd)/2, mean, sigma) * binWidth;
  });
  
  return bins;
}
