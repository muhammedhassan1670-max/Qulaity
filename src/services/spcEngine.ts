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
  
  // Constant for unbiasing sample standard deviation (S / c4)
  c4: [0, 0, 0.7979, 0.8862, 0.9213, 0.9400, 0.9515, 0.9594, 0.9650, 0.9693, 0.9727, 0.9754, 0.9776, 0.9794, 0.9810, 0.9823, 0.9835, 0.9845, 0.9854, 0.9862, 0.9869, 0.9876, 0.9882, 0.9887, 0.9892, 0.9896],
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

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidenceLevel: number; // e.g. 0.95
}

export interface NormalityTestResult {
  isNormal: boolean;
  pValue: number;
  adStatistic: number;
  adAdjusted: number;
  skewness: number;
  kurtosis: number;
  verdict: string;
}

export interface GageRRObservation {
  operator: string;
  part: string;
  trial: number;
  measurement: number;
}

export interface GageRRResult {
  equipmentVariationEV: number; // Repeatability
  appraiserVariationAV: number; // Reproducibility
  gageRR: number;               // Combined GRR
  partVariationPV: number;      // Part-to-part variation
  totalVariationTV: number;     // Total variation
  percentEV: number;            // %EV of TV
  percentAV: number;            // %AV of TV
  percentGRR: number;           // %GRR of TV
  percentPV: number;            // %PV of TV
  ndc: number;                  // Number of distinct categories
  status: 'acceptable' | 'marginal' | 'unacceptable';
  recommendation: string;
}

export interface SixSigmaMetrics {
  totalDefects: number;
  totalUnits: number;
  opportunitiesPerUnit: number;
  dpu: number;
  dpo: number;
  dpmo: number;
  ppm: number;
  poissonYield: number;
  observedYield: number;
  sigmaLevel: number;
  longTermSigma: number;
}

export interface NonNormalCapabilityResult {
  p0135: number;
  median: number;
  p99865: number;
  spread: number;
  pp: number;
  ppk: number;
  ppu?: number;
  ppl?: number;
  usl?: number;
  lsl?: number;
  method: string;
}

export type ActionPriority = 'High' | 'Medium' | 'Low';

export interface SpcCapabilityResult {
  cp: number;
  cpk: number;
  pp: number;
  ppk: number;
  cpm?: number;
  ciCp?: ConfidenceInterval;
  ciCpk?: ConfidenceInterval;
  ciPp?: ConfidenceInterval;
  ciPpk?: ConfidenceInterval;
  normality?: NormalityTestResult;
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

  skewness: (values: number[]): number => {
    const n = values.length;
    if (n < 3) return 0;
    const m = mathHelper.mean(values);
    const s = mathHelper.stdDev(values, false);
    if (s === 0) return 0;
    const m3 = values.reduce((sum, x) => sum + Math.pow((x - m) / s, 3), 0);
    return (n / ((n - 1) * (n - 2))) * m3;
  },

  kurtosis: (values: number[]): number => {
    const n = values.length;
    if (n < 4) return 0;
    const m = mathHelper.mean(values);
    const s = mathHelper.stdDev(values, false);
    if (s === 0) return 0;
    const m4 = values.reduce((sum, x) => sum + Math.pow((x - m) / s, 4), 0);
    const term1 = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)) * m4;
    const term2 = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    return term1 - term2; // Excess kurtosis (0 for normal)
  },

  andersonDarlingNormality: (values: number[]): NormalityTestResult => {
    const n = values.length;
    if (n < 4) {
      return {
        isNormal: true,
        pValue: 1.0,
        adStatistic: 0,
        adAdjusted: 0,
        skewness: 0,
        kurtosis: 0,
        verdict: 'Insufficient sample size (n < 4) for Anderson-Darling test'
      };
    }
    const m = mathHelper.mean(values);
    const s = mathHelper.stdDev(values, false);
    const skew = mathHelper.skewness(values);
    const kurt = mathHelper.kurtosis(values);
    if (s === 0) {
      return {
        isNormal: false,
        pValue: 0,
        adStatistic: 999,
        adAdjusted: 999,
        skewness: 0,
        kurtosis: 0,
        verdict: 'Zero variance dataset'
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    let sumS = 0;
    for (let i = 1; i <= n; i++) {
      const z = (sorted[i - 1] - m) / s;
      const cdf = Math.min(Math.max(mathHelper.normalCDF(z, 0, 1), 1e-12), 1 - 1e-12);
      sumS += (2 * i - 1) * Math.log(cdf) + (2 * (n - i) + 1) * Math.log(1 - cdf);
    }
    const a2 = -n - (sumS / n);
    const a2Star = a2 * (1 + 0.75 / n + 2.25 / (n * n));

    // Stephens piecewise p-value approximation
    let pValue = 0;
    if (a2Star >= 0.60) {
      pValue = Math.exp(1.2937 - 5.709 * a2Star + 0.0186 * Math.pow(a2Star, 2));
    } else if (a2Star > 0.34) {
      pValue = Math.exp(0.9177 - 4.279 * a2Star - 1.38 * Math.pow(a2Star, 2));
    } else if (a2Star > 0.20) {
      pValue = 1 - Math.exp(-8.318 + 42.796 * a2Star - 59.938 * Math.pow(a2Star, 2));
    } else {
      pValue = 1 - Math.exp(-13.436 + 101.14 * a2Star - 223.73 * Math.pow(a2Star, 2));
    }
    pValue = Math.min(Math.max(pValue, 0), 1);

    const isNormal = pValue >= 0.05;
    const verdict = isNormal 
      ? `Data follows a normal distribution (p = ${pValue.toFixed(4)} >= 0.05)`
      : `Data departs significantly from normality (p = ${pValue.toFixed(4)} < 0.05). Use caution interpreting standard Cp/Cpk.`;

    return {
      isNormal,
      pValue,
      adStatistic: a2,
      adAdjusted: a2Star,
      skewness: skew,
      kurtosis: kurt,
      verdict
    };
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
  },

  percentile: (values: number[], p: number): number => {
    if (!values || values.length === 0) return 0;
    if (values.length === 1) return values[0];
    const sorted = [...values].sort((a, b) => a - b);
    const index = (Math.max(0, Math.min(100, p)) / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  },

  inverseNormalCDF: (p: number): number => {
    if (p <= 0) return -8.0;
    if (p >= 1) return 8.0;

    const a = [
      -3.969683028665376e+01,  2.209460984245205e+02,
      -2.759285104469687e+02,  1.383577518672690e+02,
      -3.066479806614716e+01,  2.506628277459239e+00
    ];
    const b = [
      -5.447609879822406e+01,  1.615858368580409e+02,
      -1.556989798598866e+02,  6.680131188771972e+01,
      -1.328068155288572e+01
    ];
    const c = [
      -7.784894002430293e-03, -3.223964580411365e-01,
      -2.400758277161838e+00, -2.549732539343734e+00,
       4.374664141464968e+00,  2.938163982698783e+00
    ];
    const d = [
       7.784695709041462e-03,  3.224671290700398e-01,
       2.445134137142996e+00,  3.754408661907416e+00
    ];

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    if (p < pLow) {
      const q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) /
             ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1);
    }

    if (p > pHigh) {
      const q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) /
              ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1);
    }

    const q = p - 0.5;
    const r = q * q;
    return (((((a[0]*r + a[1])*r + a[2])*r + a[3])*r + a[4])*r + a[5]) * q /
           (((((b[0]*r + b[1])*r + b[2])*r + b[3])*r + b[4])*r + 1);
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
      violations.push({ index: i, rule: 1, description: 'Rule 1: 1 point > 3σ from center line (Outlier)' });
    }

    // Rule 2: 9 points in a row on same side of center line
    if (i >= 8) {
      const slice = points.slice(i - 8, i + 1);
      if (slice.every(p => p > cl) || slice.every(p => p < cl)) {
        violations.push({ index: i, rule: 2, description: 'Rule 2: 9 consecutive points on same side of center line (Shift)' });
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
        violations.push({ index: i, rule: 3, description: 'Rule 3: 6 consecutive points steadily increasing or decreasing (Trend)' });
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
        violations.push({ index: i, rule: 4, description: 'Rule 4: 14 consecutive points alternating up and down (Over-control)' });
      }
    }

    // Rule 5: 2 out of 3 consecutive points > 2σ from center line on same side (Zone A)
    if (i >= 2) {
      const slice = points.slice(i - 2, i + 1);
      const upper2s = slice.filter(p => p > cl + 2 * sigma).length;
      const lower2s = slice.filter(p => p < cl - 2 * sigma).length;
      if (upper2s >= 2 || lower2s >= 2) {
        violations.push({ index: i, rule: 5, description: 'Rule 5: 2 out of 3 consecutive points > 2σ from center line on same side' });
      }
    }

    // Rule 6: 4 out of 5 consecutive points > 1σ from center line on same side (Zone B)
    if (i >= 4) {
      const slice = points.slice(i - 4, i + 1);
      const upper1s = slice.filter(p => p > cl + 1 * sigma).length;
      const lower1s = slice.filter(p => p < cl - 1 * sigma).length;
      if (upper1s >= 4 || lower1s >= 4) {
        violations.push({ index: i, rule: 6, description: 'Rule 6: 4 out of 5 consecutive points > 1σ from center line on same side' });
      }
    }

    // Rule 7: 15 consecutive points within 1σ of center line on either side (Zone C - Stratification)
    if (i >= 14) {
      const slice = points.slice(i - 14, i + 1);
      if (slice.every(p => Math.abs(p - cl) < 1 * sigma)) {
        violations.push({ index: i, rule: 7, description: 'Rule 7: 15 consecutive points within 1σ of center line (Stratification)' });
      }
    }

    // Rule 8: 8 consecutive points with none within 1σ of center line on either side (Mixture pattern)
    if (i >= 7) {
      const slice = points.slice(i - 7, i + 1);
      if (slice.every(p => Math.abs(p - cl) > 1 * sigma)) {
        violations.push({ index: i, rule: 8, description: 'Rule 8: 8 consecutive points with none within 1σ of center line (Mixture pattern)' });
      }
    }
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

export function calculateXbarS(subgroups: SpcSubgroup[]): SpcControlChartResult {
  if (subgroups.length === 0) throw new Error('No data provided for X-bar/S chart');
  
  const n = subgroups[0].values.length;
  if (n < 2 || n > 25) throw new Error('Subgroup size must be between 2 and 25 for X-bar/S charts');
  
  const means = subgroups.map(sg => mathHelper.mean(sg.values));
  const stdDevs = subgroups.map(sg => mathHelper.stdDev(sg.values, false)); // sample std dev s
  
  const xDoubleBar = mathHelper.mean(means);
  const sBar = mathHelper.mean(stdDevs);
  
  const A3 = SPC_CONSTANTS.A3[n];
  const B3 = SPC_CONSTANTS.B3[n];
  const B4 = SPC_CONSTANTS.B4[n];
  const c4 = SPC_CONSTANTS.c4[n];
  
  const xbarLimits: SpcControlLimits = {
    ucl: xDoubleBar + (A3 * sBar),
    cl: xDoubleBar,
    lcl: xDoubleBar - (A3 * sBar)
  };
  
  const sLimits: SpcControlLimits = {
    ucl: B4 * sBar,
    cl: sBar,
    lcl: B3 * sBar
  };
  
  const withinSigma = sBar / c4;
  const allValues = subgroups.flatMap(sg => sg.values);
  const overallSigma = mathHelper.stdDev(allValues, false);
  
  const xbarViolations = checkNelsonRules(means, xbarLimits.cl, withinSigma / Math.sqrt(n));
  const primaryChart = subgroups.map((sg, i) => ({
    label: sg.label,
    value: means[i],
    ...xbarLimits,
    outOfControl: means[i] > xbarLimits.ucl || means[i] < xbarLimits.lcl,
    violations: xbarViolations.filter(v => v.index === i).map(v => v.description)
  }));
  
  const secondaryChart = subgroups.map((sg, i) => ({
    label: sg.label,
    value: stdDevs[i],
    ...sLimits,
    outOfControl: stdDevs[i] > sLimits.ucl || stdDevs[i] < sLimits.lcl,
    violations: []
  }));

  return {
    chartType: 'X-bar / S',
    primaryChart,
    secondaryChart,
    primaryLimits: xbarLimits,
    secondaryLimits: sLimits,
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
  if (!data || data.length === 0) {
    throw new Error('No data provided for p Chart');
  }
  const totalDefective = data.reduce((sum, d) => sum + (d.defective || 0), 0);
  const totalSample = data.reduce((sum, d) => sum + (d.sampleSize || 0), 0);
  
  const pBar = totalSample > 0 ? totalDefective / totalSample : 0; // average proportion
  
  const primaryChart = data.map(d => {
    const n = d.sampleSize > 0 ? d.sampleSize : 1;
    const p = d.sampleSize > 0 ? d.defective / d.sampleSize : 0;
    // UCL/LCL are variable based on sample size!
    const sigma = Math.sqrt((pBar * (1 - pBar)) / n);
    const ucl = Math.min(1, pBar + 3 * sigma);
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
  const avgSampleSize = totalSample > 0 ? totalSample / data.length : 1;
  const avgSigma = Math.sqrt((pBar * (1 - pBar)) / avgSampleSize);
  
  return {
    chartType: 'p Chart',
    primaryChart,
    primaryLimits: {
      ucl: Math.min(1, pBar + 3 * avgSigma),
      cl: pBar,
      lcl: Math.max(0, pBar - 3 * avgSigma)
    },
    overallMean: pBar,
    overallSigma: avgSigma,
    withinSigma: avgSigma
  };
}

export function calculateUChart(data: {label: string, defects: number, units: number}[]): SpcControlChartResult {
  if (!data || data.length === 0) {
    throw new Error('No data provided for u Chart');
  }
  const totalDefects = data.reduce((sum, d) => sum + (d.defects || 0), 0);
  const totalUnits = data.reduce((sum, d) => sum + (d.units || 0), 0);
  
  const uBar = totalUnits > 0 ? totalDefects / totalUnits : 0;
  
  const primaryChart = data.map(d => {
    const n = d.units > 0 ? d.units : 1;
    const u = d.units > 0 ? d.defects / d.units : 0;
    const sigma = Math.sqrt(uBar / n);
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
  
  const avgUnits = totalUnits > 0 ? totalUnits / data.length : 1;
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

export function calculateNpChart(data: {label: string, defective: number, sampleSize: number}[]): SpcControlChartResult {
  if (!data || data.length === 0) {
    throw new Error('No data provided for np Chart');
  }
  const n = data[0].sampleSize;
  const totalDefective = data.reduce((sum, d) => sum + (d.defective || 0), 0);
  const totalSample = data.reduce((sum, d) => sum + (d.sampleSize || 0), 0);
  const pBar = totalSample > 0 ? totalDefective / totalSample : 0;
  const npBar = n * pBar;
  const sigma = Math.sqrt(n * pBar * (1 - pBar));
  const ucl = Math.min(n, npBar + 3 * sigma);
  const lcl = Math.max(0, npBar - 3 * sigma);

  const primaryChart = data.map(d => ({
    label: d.label,
    value: d.defective,
    ucl,
    cl: npBar,
    lcl,
    outOfControl: d.defective > ucl || d.defective < lcl,
    violations: []
  }));

  return {
    chartType: 'np Chart',
    primaryChart,
    primaryLimits: { ucl, cl: npBar, lcl },
    overallMean: npBar,
    overallSigma: sigma,
    withinSigma: sigma
  };
}

export function calculateCChart(data: {label: string, defects: number}[]): SpcControlChartResult {
  if (!data || data.length === 0) {
    throw new Error('No data provided for c Chart');
  }
  const totalDefects = data.reduce((sum, d) => sum + (d.defects || 0), 0);
  const cBar = totalDefects / data.length;
  const sigma = Math.sqrt(cBar);
  const ucl = cBar + 3 * sigma;
  const lcl = Math.max(0, cBar - 3 * sigma);

  const primaryChart = data.map(d => ({
    label: d.label,
    value: d.defects,
    ucl,
    cl: cBar,
    lcl,
    outOfControl: d.defects > ucl || d.defects < lcl,
    violations: []
  }));

  return {
    chartType: 'c Chart',
    primaryChart,
    primaryLimits: { ucl, cl: cBar, lcl },
    overallMean: cBar,
    overallSigma: sigma,
    withinSigma: sigma
  };
}

// ==========================================
// 6. Capability Analysis
// ==========================================

export function calculateCapability(
  values: number[], 
  usl?: number | null, 
  lsl?: number | null, 
  target?: number, 
  withinSigma?: number
): SpcCapabilityResult {
  if (!values || values.length === 0) {
    throw new Error('No values provided for capability analysis');
  }
  const mean = mathHelper.mean(values);
  let overallSigma = mathHelper.stdDev(values);
  
  // If withinSigma not provided, estimate from moving range
  if (!withinSigma) {
    let sumMR = 0;
    for (let i = 1; i < values.length; i++) {
      sumMR += Math.abs(values[i] - values[i-1]);
    }
    const mrBar = values.length > 1 ? sumMR / (values.length - 1) : 0;
    withinSigma = mrBar / 1.128; // d2 for n=2
  }
  
  if (withinSigma === 0) withinSigma = 0.0001; // prevent div by zero
  if (overallSigma === 0) overallSigma = 0.0001;
  
  const hasUsl = usl !== undefined && usl !== null && !isNaN(usl);
  const hasLsl = lsl !== undefined && lsl !== null && !isNaN(lsl);

  let cp = 0;
  let cpk = 0;
  let pp = 0;
  let ppk = 0;
  let ppmAboveUSL = 0;
  let ppmBelowLSL = 0;

  const cpu = hasUsl ? (usl! - mean) / (3 * withinSigma) : 0;
  const cpl = hasLsl ? (mean - lsl!) / (3 * withinSigma) : 0;
  const ppu = hasUsl ? (usl! - mean) / (3 * overallSigma) : 0;
  const ppl = hasLsl ? (mean - lsl!) / (3 * overallSigma) : 0;

  if (hasUsl && hasLsl) {
    cp = (usl! - lsl!) / (6 * withinSigma);
    cpk = Math.min(cpu, cpl);
    pp = (usl! - lsl!) / (6 * overallSigma);
    ppk = Math.min(ppu, ppl);
  } else if (hasUsl) {
    // Unilateral Upper Tolerance
    cp = cpu;
    cpk = cpu;
    pp = ppu;
    ppk = ppu;
  } else if (hasLsl) {
    // Unilateral Lower Tolerance
    cp = cpl;
    cpk = cpl;
    pp = ppl;
    ppk = ppl;
  }

  // Taguchi capability index Cpm (evaluates centering relative to target T)
  let cpm: number | undefined;
  if (hasUsl && hasLsl && target !== undefined && target !== null && !isNaN(target)) {
    const targetDevSq = Math.pow(mean - target, 2);
    const tau = Math.sqrt(Math.pow(overallSigma, 2) + targetDevSq);
    cpm = tau > 0 ? (usl! - lsl!) / (6 * tau) : undefined;
  }

  // 95% Confidence Intervals (Z_0.025 = 1.96)
  const n = values.length;
  const z95 = 1.96;
  
  // SE and CI for Cp
  const seCp = cp > 0 && n > 1 ? cp / Math.sqrt(2 * (n - 1)) : 0;
  const ciCp: ConfidenceInterval = {
    lower: Math.max(0, cp - z95 * seCp),
    upper: cp + z95 * seCp,
    confidenceLevel: 0.95
  };

  // SE and CI for Cpk (Bissell's approximation)
  const seCpk = cpk > 0 && n > 1 ? Math.sqrt(1 / (9 * n) + Math.pow(cpk, 2) / (2 * (n - 1))) : 0;
  const ciCpk: ConfidenceInterval = {
    lower: Math.max(0, cpk - z95 * seCpk),
    upper: cpk + z95 * seCpk,
    confidenceLevel: 0.95
  };

  // SE and CI for Pp & Ppk
  const sePp = pp > 0 && n > 1 ? pp / Math.sqrt(2 * (n - 1)) : 0;
  const ciPp: ConfidenceInterval = {
    lower: Math.max(0, pp - z95 * sePp),
    upper: pp + z95 * sePp,
    confidenceLevel: 0.95
  };

  const sePpk = ppk > 0 && n > 1 ? Math.sqrt(1 / (9 * n) + Math.pow(ppk, 2) / (2 * (n - 1))) : 0;
  const ciPpk: ConfidenceInterval = {
    lower: Math.max(0, ppk - z95 * sePpk),
    upper: ppk + z95 * sePpk,
    confidenceLevel: 0.95
  };

  // Normality Test
  const normality = mathHelper.andersonDarlingNormality(values);

  if (hasUsl) {
    ppmAboveUSL = (1 - mathHelper.normalCDF(usl!, mean, overallSigma)) * 1_000_000;
  }
  if (hasLsl) {
    ppmBelowLSL = mathHelper.normalCDF(lsl!, mean, overallSigma) * 1_000_000;
  }
  
  return {
    cp,
    cpk,
    pp,
    ppk,
    cpm,
    ciCp,
    ciCpk,
    ciPp,
    ciPpk,
    normality,
    overallMean: mean,
    withinSigma,
    overallSigma,
    usl: hasUsl ? usl! : 0,
    lsl: hasLsl ? lsl! : 0,
    target,
    ppmAboveUSL,
    ppmBelowLSL,
    ppmTotal: ppmAboveUSL + ppmBelowLSL
  };
}

// ==========================================
// 7. Measurement System Analysis (Gage R&R)
// ==========================================

export function calculateGageRR(observations: GageRRObservation[]): GageRRResult {
  if (!observations || observations.length === 0) {
    throw new Error('No observations provided for Gage R&R analysis');
  }

  const operators = Array.from(new Set(observations.map(o => o.operator)));
  const parts = Array.from(new Set(observations.map(o => o.part)));
  const trials = Array.from(new Set(observations.map(o => o.trial)));

  const k = operators.length; // number of operators
  const m = parts.length;     // number of parts
  const r = trials.length;    // number of trials

  if (k < 2 || m < 2 || r < 2) {
    throw new Error('Gage R&R requires at least 2 operators, 2 parts, and 2 trials');
  }

  // Calculate range per operator-part combination
  const rangesPerOpPart: number[] = [];
  operators.forEach(op => {
    parts.forEach(pt => {
      const vals = observations.filter(o => o.operator === op && o.part === pt).map(o => o.measurement);
      if (vals.length > 0) {
        rangesPerOpPart.push(mathHelper.range(vals));
      }
    });
  });

  const rDoubleBar = mathHelper.mean(rangesPerOpPart);

  // Mean per operator
  const opMeans = operators.map(op => {
    const vals = observations.filter(o => o.operator === op).map(o => o.measurement);
    return mathHelper.mean(vals);
  });
  const xDiff = mathHelper.range(opMeans);

  // Mean per part
  const partMeans = parts.map(pt => {
    const vals = observations.filter(o => o.part === pt).map(o => o.measurement);
    return mathHelper.mean(vals);
  });
  const rp = mathHelper.range(partMeans);

  const d2_r = SPC_CONSTANTS.d2[Math.min(r, 25)] || 1.128;
  const d2_k = SPC_CONSTANTS.d2[Math.min(k, 25)] || 1.128;
  const d2_m = SPC_CONSTANTS.d2[Math.min(m, 25)] || 1.128;

  // Equipment Variation (Repeatability)
  const ev = rDoubleBar / d2_r;

  // Appraiser Variation (Reproducibility)
  const avRaw = Math.pow(xDiff / d2_k, 2) - Math.pow(ev, 2) / (m * r);
  const av = avRaw > 0 ? Math.sqrt(avRaw) : 0;

  // Total Gage R&R
  const grr = Math.sqrt(Math.pow(ev, 2) + Math.pow(av, 2));

  // Part Variation
  const pv = rp / d2_m;

  // Total Variation
  const tv = Math.sqrt(Math.pow(grr, 2) + Math.pow(pv, 2));

  const percentEV = tv > 0 ? (ev / tv) * 100 : 0;
  const percentAV = tv > 0 ? (av / tv) * 100 : 0;
  const percentGRR = tv > 0 ? (grr / tv) * 100 : 0;
  const percentPV = tv > 0 ? (pv / tv) * 100 : 0;

  // Number of Distinct Categories (ndc = 1.41 * PV / GRR)
  const ndc = grr > 0 ? Math.floor(1.41 * (pv / grr)) : 0;

  let status: 'acceptable' | 'marginal' | 'unacceptable' = 'acceptable';
  let recommendation = 'Measurement system is acceptable and capable (%GRR < 10%).';

  if (percentGRR > 30) {
    status = 'unacceptable';
    recommendation = 'Measurement system is unacceptable (%GRR > 30%). Needs root-cause investigation.';
  } else if (percentGRR >= 10) {
    status = 'marginal';
    recommendation = 'Measurement system is marginal (10% <= %GRR <= 30%). Acceptable for non-critical features.';
  }

  return {
    equipmentVariationEV: ev,
    appraiserVariationAV: av,
    gageRR: grr,
    partVariationPV: pv,
    totalVariationTV: tv,
    percentEV,
    percentAV,
    percentGRR,
    percentPV,
    ndc,
    status,
    recommendation
  };
}

// ==========================================
// 8. Histogram Builder
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

// ==========================================
// 9. Non-Normal Capability Analysis (ISO 22514-2)
// ==========================================

export function calculateNonNormalCapability(
  values: number[], 
  usl?: number | null, 
  lsl?: number | null
): NonNormalCapabilityResult {
  if (!values || values.length === 0) {
    throw new Error('No values provided for non-normal capability analysis');
  }
  const p0135 = mathHelper.percentile(values, 0.135);
  const median = mathHelper.percentile(values, 50.0);
  const p99865 = mathHelper.percentile(values, 99.865);
  const spread = p99865 - p0135;

  const hasUsl = usl !== undefined && usl !== null && !isNaN(usl);
  const hasLsl = lsl !== undefined && lsl !== null && !isNaN(lsl);

  let pp = 0;
  let ppk = 0;
  let ppu: number | undefined;
  let ppl: number | undefined;

  const upperSpread = p99865 - median;
  const lowerSpread = median - p0135;

  if (hasUsl && upperSpread > 0) {
    ppu = (usl! - median) / upperSpread;
  }
  if (hasLsl && lowerSpread > 0) {
    ppl = (median - lsl!) / lowerSpread;
  }

  if (hasUsl && hasLsl && spread > 0) {
    pp = (usl! - lsl!) / spread;
    ppk = Math.min(ppu ?? pp, ppl ?? pp);
  } else if (hasUsl && ppu !== undefined) {
    pp = ppu;
    ppk = ppu;
  } else if (hasLsl && ppl !== undefined) {
    pp = ppl;
    ppk = ppl;
  }

  return {
    p0135,
    median,
    p99865,
    spread,
    pp,
    ppk,
    ppu,
    ppl,
    usl: hasUsl ? usl! : undefined,
    lsl: hasLsl ? lsl! : undefined,
    method: 'ISO 22514-2 Percentile Method (Clements)'
  };
}

// ==========================================
// 10. Six Sigma Defect & Yield Metrics
// ==========================================

export function calculateSixSigmaMetrics(
  totalDefects: number, 
  totalUnits: number, 
  opportunitiesPerUnit: number = 1
): SixSigmaMetrics {
  const units = Math.max(1, totalUnits);
  const opp = Math.max(1, opportunitiesPerUnit);
  const totalOpportunities = units * opp;
  const defects = Math.max(0, totalDefects);

  const dpu = defects / units;
  const dpo = defects / totalOpportunities;
  const dpmo = dpo * 1_000_000;
  const ppm = dpmo;

  const poissonYield = Math.exp(-dpu);
  const observedYield = Math.max(0, Math.min(1, 1 - (defects / units)));

  const clampedDpo = Math.min(Math.max(dpo, 1e-9), 1 - 1e-9);
  const longTermSigma = mathHelper.inverseNormalCDF(1 - clampedDpo);
  const sigmaLevel = longTermSigma + 1.5; // AIAG / Motorola 1.5 sigma shift

  return {
    totalDefects: defects,
    totalUnits: units,
    opportunitiesPerUnit: opp,
    dpu,
    dpo,
    dpmo,
    ppm,
    poissonYield,
    observedYield,
    sigmaLevel,
    longTermSigma
  };
}

// ==========================================
// 11. AIAG-VDA 2019 Action Priority (AP) Engine
// ==========================================

export function calculateActionPriority(
  severity: number, 
  occurrence: number, 
  detection: number
): ActionPriority {
  const s = Math.max(1, Math.min(10, Math.round(severity)));
  const o = Math.max(1, Math.min(10, Math.round(occurrence)));
  const d = Math.max(1, Math.min(10, Math.round(detection)));

  if (s >= 9) {
    if (o >= 8) return 'High';
    if (o >= 6) return d <= 1 ? 'Medium' : 'High';
    if (o >= 4) return d >= 4 ? 'High' : 'Medium';
    if (o >= 2) return d >= 7 ? 'High' : (d >= 2 ? 'Medium' : 'Low');
    return 'Low';
  }

  if (s >= 7) {
    if (o >= 8) return 'High';
    if (o >= 6) return d >= 4 ? 'High' : 'Medium';
    if (o >= 4) return d >= 7 ? 'High' : 'Medium';
    if (o >= 2) return d >= 5 ? 'Medium' : 'Low';
    return 'Low';
  }

  if (s >= 4) {
    if (o >= 8) return d >= 5 ? 'High' : 'Medium';
    if (o >= 6) return d >= 4 ? 'Medium' : 'Low';
    if (o >= 4) return d >= 7 ? 'Medium' : 'Low';
    return 'Low';
  }

  if (s >= 2) {
    if (o >= 8 && d >= 7) return 'Medium';
    return 'Low';
  }

  return 'Low';
}

// Re-export advanced statistical quality engineering functions
export * from './qualityStatisticsEngine';
