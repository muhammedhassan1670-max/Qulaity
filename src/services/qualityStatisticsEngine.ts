/**
 * QualityOps Enterprise 4.0 — Advanced Quality Engineering Mathematical Engine
 * 
 * Standards Compliance:
 * - AIAG SPC 4th Edition (EWMA & CUSUM Advanced Control Charts)
 * - ISO 2859-1 / ANSI/ASQ Z1.4 (Acceptance Sampling Plans & OC Curves)
 * - ISO 22514 / AIAG MSA 4th Edition (Gage Linearity & Bias Analysis)
 * - IEC 61649 / IEEE (Weibull 2-Parameter Reliability Analysis)
 * - Six Sigma DMAIC / Shainin Hypothesis Testing Suite (Student's t, F-test, ANOVA, Chi-Square)
 */

// ==========================================
// 1. Special Mathematical Functions
// ==========================================

export const mathSpecialFunctions = {
  /**
   * Natural logarithm of the Gamma function ln(Γ(z)) using Lanczos approximation (g=7, n=9)
   */
  logGamma: (z: number): number => {
    if (z <= 0) return 0;
    const c = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.138571095836526,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ];
    let x = z;
    let y = x;
    let tmp = x + 7.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = c[0];
    for (let j = 1; j < c.length; j++) {
      ser += c[j] / ++y;
    }
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  },

  /**
   * Gamma function Γ(z) = exp(ln(Γ(z)))
   */
  gamma: (z: number): number => {
    return Math.exp(mathSpecialFunctions.logGamma(z));
  },

  /**
   * Upper regularized incomplete gamma function Q(a, x) = 1 - P(a, x) = Γ(a, x) / Γ(a)
   */
  incompleteGammaQ: (a: number, x: number): number => {
    if (x < 0 || a <= 0) return 1.0;
    if (x === 0) return 1.0;

    // For x < a + 1, use series expansion for P(a, x) and return 1 - P
    if (x < a + 1) {
      let ap = a;
      let sum = 1 / a;
      let del = sum;
      for (let n = 1; n <= 100; n++) {
        ap += 1;
        del *= x / ap;
        sum += del;
        if (Math.abs(del) < Math.abs(sum) * 1e-12) break;
      }
      const p = sum * Math.exp(-x + a * Math.log(x) - mathSpecialFunctions.logGamma(a));
      return Math.max(0, Math.min(1, 1 - p));
    }

    // For x >= a + 1, use Lentz continued fraction for Q(a, x)
    let b = x + 1 - a;
    let c = 1e30;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i <= 100; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = b + an / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-12) break;
    }
    const q = Math.exp(-x + a * Math.log(x) - mathSpecialFunctions.logGamma(a)) * h;
    return Math.max(0, Math.min(1, q));
  },

  /**
   * Continued fraction for incomplete beta function (Numerical Recipes standard betacf)
   */
  betacf: (a: number, b: number, x: number): number => {
    const maxIt = 100;
    const eps = 1e-12;
    const fpmin = 1e-30;

    const qab = a + b;
    const qap = a + 1.0;
    const qam = a - 1.0;
    let c = 1.0;
    let d = 1.0 - qab * x / qap;
    if (Math.abs(d) < fpmin) d = fpmin;
    d = 1.0 / d;
    let h = d;

    for (let m = 1; m <= maxIt; m++) {
      const m2 = 2 * m;
      // Even step
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1.0 + aa * d;
      if (Math.abs(d) < fpmin) d = fpmin;
      c = 1.0 + aa / c;
      if (Math.abs(c) < fpmin) c = fpmin;
      d = 1.0 / d;
      h *= d * c;

      // Odd step
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1.0 + aa * d;
      if (Math.abs(d) < fpmin) d = fpmin;
      c = 1.0 + aa / c;
      if (Math.abs(c) < fpmin) c = fpmin;
      d = 1.0 / d;
      const del = d * c;
      h *= del;

      if (Math.abs(del - 1.0) < eps) break;
    }
    return h;
  },

  /**
   * Regularized incomplete beta function I_x(a, b) = B(x; a, b) / B(a, b)
   */
  incompleteBeta: (x: number, a: number, b: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    // Use symmetry if x > (a + 1) / (a + b + 2)
    if (x > (a + 1.0) / (a + b + 2.0)) {
      return 1.0 - mathSpecialFunctions.incompleteBeta(1.0 - x, b, a);
    }

    const front = Math.exp(
      mathSpecialFunctions.logGamma(a + b) -
      mathSpecialFunctions.logGamma(a) -
      mathSpecialFunctions.logGamma(b) +
      a * Math.log(x) +
      b * Math.log(1.0 - x)
    ) / a;

    return Math.max(0, Math.min(1.0, front * mathSpecialFunctions.betacf(a, b, x)));
  },

  /**
   * Two-tailed p-value for Student's t-distribution
   */
  studentTPValue: (t: number, df: number): number => {
    if (df <= 0) return 1.0;
    const x = df / (df + t * t);
    const p = mathSpecialFunctions.incompleteBeta(x, df / 2, 0.5);
    return Math.max(0, Math.min(1, p));
  },

  /**
   * Upper-tail p-value for Fisher's F-distribution P(F >= f)
   */
  fPValue: (f: number, df1: number, df2: number): number => {
    if (f <= 0 || df1 <= 0 || df2 <= 0) return 1.0;
    const x = df2 / (df2 + df1 * f);
    return mathSpecialFunctions.incompleteBeta(x, df2 / 2, df1 / 2);
  },

  /**
   * Upper-tail p-value for Chi-Square distribution P(χ² >= x)
   */
  chiSquarePValue: (chiSq: number, df: number): number => {
    if (chiSq <= 0 || df <= 0) return 1.0;
    return mathSpecialFunctions.incompleteGammaQ(df / 2, chiSq / 2);
  }
};

// ==========================================
// 2. Advanced Control Charts: EWMA & CUSUM
// ==========================================

export interface EwmaChartPoint {
  index: number;
  label: string;
  value: number;
  ewma: number;
  ucl: number;
  cl: number;
  lcl: number;
  outOfControl: boolean;
}

export interface EwmaChartResult {
  chartType: 'EWMA';
  lambda: number;
  lFactor: number;
  points: EwmaChartPoint[];
  cl: number;
  sigma: number;
  asymptoticUcl: number;
  asymptoticLcl: number;
  outOfControlCount: number;
}

/**
 * Calculates Exponentially Weighted Moving Average (EWMA) Control Chart
 * Optimal for detecting subtle shifts (0.5σ to 2.0σ) in processes.
 * @param data Array of observations with labels and values
 * @param lambda Smoothing weight (0 < λ <= 1, default 0.2)
 * @param lFactor Control limit multiplier L (default 3.0)
 * @param target Nominal target or historical mean (optional)
 * @param historicalSigma Historical or known standard deviation (optional)
 */
export function calculateEWMA(
  data: { label: string; value: number }[],
  lambda: number = 0.2,
  lFactor: number = 3.0,
  target?: number,
  historicalSigma?: number
): EwmaChartResult {
  if (!data || data.length === 0) {
    throw new Error('No data provided for EWMA calculation');
  }

  const values = data.map(d => d.value);
  const n = values.length;
  const mean = target !== undefined ? target : values.reduce((a, b) => a + b, 0) / n;
  
  let sigma = historicalSigma;
  if (!sigma || sigma <= 0) {
    // Estimate sigma from moving range of consecutive points (d2 for n=2 is 1.128)
    let sumMR = 0;
    for (let i = 1; i < n; i++) {
      sumMR += Math.abs(values[i] - values[i - 1]);
    }
    const mrBar = n > 1 ? sumMR / (n - 1) : 0;
    sigma = mrBar > 0 ? mrBar / 1.128 : 1.0;
  }

  const cl = mean;
  const asymptoticSigmaEwma = sigma * Math.sqrt(lambda / (2 - lambda));
  const asymptoticUcl = cl + lFactor * asymptoticSigmaEwma;
  const asymptoticLcl = cl - lFactor * asymptoticSigmaEwma;

  let currentEwma = cl;
  let outOfControlCount = 0;

  const points: EwmaChartPoint[] = data.map((d, i) => {
    // EWMA update: z_i = λ x_i + (1 - λ) z_{i-1}
    currentEwma = lambda * d.value + (1 - lambda) * currentEwma;
    
    // Time-varying exact limits: σ_z(i) = σ * sqrt( (λ/(2-λ)) * [1 - (1-λ)^(2*i)] )
    const timeFactor = 1 - Math.pow(1 - lambda, 2 * (i + 1));
    const sigmaEwma_i = sigma! * Math.sqrt((lambda / (2 - lambda)) * timeFactor);
    const ucl_i = cl + lFactor * sigmaEwma_i;
    const lcl_i = cl - lFactor * sigmaEwma_i;

    const outOfControl = currentEwma > ucl_i || currentEwma < lcl_i;
    if (outOfControl) outOfControlCount++;

    return {
      index: i,
      label: d.label,
      value: d.value,
      ewma: currentEwma,
      ucl: ucl_i,
      cl,
      lcl: lcl_i,
      outOfControl
    };
  });

  return {
    chartType: 'EWMA',
    lambda,
    lFactor,
    points,
    cl,
    sigma,
    asymptoticUcl,
    asymptoticLcl,
    outOfControlCount
  };
}

export interface CusumChartPoint {
  index: number;
  label: string;
  value: number;
  cusumHigh: number;
  cusumLow: number;
  decisionInterval: number;
  outOfControl: boolean;
  shiftDirection?: 'up' | 'down';
}

export interface CusumChartResult {
  chartType: 'CUSUM';
  target: number;
  sigma: number;
  kValue: number;
  hValue: number;
  points: CusumChartPoint[];
  outOfControlCount: number;
}

/**
 * Calculates Tabular Cumulative Sum (CUSUM) Control Chart
 * Standard for immediate detection of small persistent shifts.
 * @param data Array of observations
 * @param target Process target (mean)
 * @param kFactor Slack parameter k in sigma units (default 0.5)
 * @param hFactor Decision interval h in sigma units (default 5.0 or 4.0)
 */
export function calculateCUSUM(
  data: { label: string; value: number }[],
  target?: number,
  kFactor: number = 0.5,
  hFactor: number = 5.0
): CusumChartResult {
  if (!data || data.length === 0) {
    throw new Error('No data provided for CUSUM calculation');
  }

  const values = data.map(d => d.value);
  const n = values.length;
  const mean = target !== undefined ? target : values.reduce((a, b) => a + b, 0) / n;

  // Estimate within-sigma
  let sumMR = 0;
  for (let i = 1; i < n; i++) {
    sumMR += Math.abs(values[i] - values[i - 1]);
  }
  const sigma = n > 1 && sumMR > 0 ? (sumMR / (n - 1)) / 1.128 : 1.0;

  const K = kFactor * sigma;
  const H = hFactor * sigma;

  let cPlus = 0;
  let cMinus = 0;
  let outOfControlCount = 0;

  const points: CusumChartPoint[] = data.map((d, i) => {
    // Upper CUSUM: C+_i = max(0, x_i - (μ + K) + C+_{i-1})
    cPlus = Math.max(0, d.value - (mean + K) + cPlus);
    // Lower CUSUM: C-_i = max(0, (μ - K) - x_i + C-_{i-1})
    cMinus = Math.max(0, (mean - K) - d.value + cMinus);

    const highExceeded = cPlus > H;
    const lowExceeded = cMinus > H;
    const outOfControl = highExceeded || lowExceeded;
    if (outOfControl) outOfControlCount++;

    return {
      index: i,
      label: d.label,
      value: d.value,
      cusumHigh: cPlus,
      cusumLow: cMinus,
      decisionInterval: H,
      outOfControl,
      shiftDirection: highExceeded ? 'up' : lowExceeded ? 'down' : undefined
    };
  });

  return {
    chartType: 'CUSUM',
    target: mean,
    sigma,
    kValue: K,
    hValue: H,
    points,
    outOfControlCount
  };
}

// ==========================================
// 3. Industrial Hypothesis Testing Suite
// ==========================================

export interface HypothesisTestResult {
  testName: string;
  statistic: number;
  pValue: number;
  degreesOfFreedom: number | [number, number];
  alpha: number;
  significant: boolean;
  nullHypothesis: string;
  alternativeHypothesis: string;
  conclusion: string;
}

export interface TwoSampleTTestResult extends HypothesisTestResult {
  mean1: number;
  mean2: number;
  meanDifference: number;
  stdDev1: number;
  stdDev2: number;
  ci95Difference: [number, number];
}

/**
 * Two-Sample Welch's t-test for comparing batch or group means
 * (robust against unequal variances)
 */
export function calculateTwoSampleTTest(
  sample1: number[],
  sample2: number[],
  alpha: number = 0.05
): TwoSampleTTestResult {
  const n1 = sample1.length;
  const n2 = sample2.length;
  if (n1 < 2 || n2 < 2) {
    throw new Error('Both samples must contain at least 2 observations');
  }

  const mean1 = sample1.reduce((a, b) => a + b, 0) / n1;
  const mean2 = sample2.reduce((a, b) => a + b, 0) / n2;

  const var1 = sample1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (n1 - 1);
  const var2 = sample2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (n2 - 1);

  const stdDev1 = Math.sqrt(var1);
  const stdDev2 = Math.sqrt(var2);

  const seDiff = Math.sqrt(var1 / n1 + var2 / n2);
  const t = seDiff > 0 ? (mean1 - mean2) / seDiff : 0;

  // Welch-Satterthwaite degrees of freedom
  const dfNumerator = Math.pow(var1 / n1 + var2 / n2, 2);
  const dfDenominator = Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1);
  const df = dfDenominator > 0 ? dfNumerator / dfDenominator : n1 + n2 - 2;

  const pValue = mathSpecialFunctions.studentTPValue(t, df);
  const significant = pValue < alpha;

  const tCritical = 1.96; // 95% approximation
  const diff = mean1 - mean2;
  const ci95Difference: [number, number] = [diff - tCritical * seDiff, diff + tCritical * seDiff];

  return {
    testName: "Two-Sample Welch's t-Test",
    statistic: t,
    pValue,
    degreesOfFreedom: df,
    alpha,
    significant,
    mean1,
    mean2,
    meanDifference: diff,
    stdDev1,
    stdDev2,
    ci95Difference,
    nullHypothesis: 'H0: μ1 = μ2 (Mean values are equal)',
    alternativeHypothesis: 'H1: μ1 ≠ μ2 (Mean values are statistically different)',
    conclusion: significant
      ? `Reject H0 (p = ${pValue.toFixed(4)} < ${alpha}). Statistically significant difference between groups.`
      : `Fail to reject H0 (p = ${pValue.toFixed(4)} >= ${alpha}). No significant difference detected.`
  };
}

export interface PairedTTestResult extends HypothesisTestResult {
  meanDifference: number;
  stdDevDifference: number;
}

/**
 * Paired Student's t-test for comparing before/after or dual measurement methods
 */
export function calculatePairedTTest(
  before: number[],
  after: number[],
  alpha: number = 0.05
): PairedTTestResult {
  if (before.length !== after.length || before.length < 2) {
    throw new Error('Paired t-test requires paired arrays of equal length >= 2');
  }

  const n = before.length;
  const diffs = before.map((v, i) => v - after[i]);
  const meanDiff = diffs.reduce((a, b) => a + b, 0) / n;
  const varDiff = diffs.reduce((sum, d) => sum + Math.pow(d - meanDiff, 2), 0) / (n - 1);
  const sDiff = Math.sqrt(varDiff);
  const se = sDiff / Math.sqrt(n);

  const t = se > 0 ? meanDiff / se : 0;
  const df = n - 1;
  const pValue = mathSpecialFunctions.studentTPValue(t, df);
  const significant = pValue < alpha;

  return {
    testName: "Paired Student's t-Test",
    statistic: t,
    pValue,
    degreesOfFreedom: df,
    alpha,
    significant,
    meanDifference: meanDiff,
    stdDevDifference: sDiff,
    nullHypothesis: 'H0: μ_diff = 0 (No difference between paired conditions)',
    alternativeHypothesis: 'H1: μ_diff ≠ 0 (Significant difference between paired conditions)',
    conclusion: significant
      ? `Reject H0 (p = ${pValue.toFixed(4)} < ${alpha}). Significant change detected between paired sets.`
      : `Fail to reject H0 (p = ${pValue.toFixed(4)} >= ${alpha}). No significant difference observed.`
  };
}

export interface AnovaResult extends HypothesisTestResult {
  fStatistic: number;
  betweenSS: number;
  withinSS: number;
  totalSS: number;
  betweenDF: number;
  withinDF: number;
  betweenMS: number;
  withinMS: number;
  groupStats: Array<{
    groupName: string;
    count: number;
    mean: number;
    stdDev: number;
  }>;
}

/**
 * One-Way ANOVA (Analysis of Variance) for comparing 3 or more machines, shifts, or suppliers
 */
export function calculateOneWayANOVA(
  groups: { name: string; values: number[] }[],
  alpha: number = 0.05
): AnovaResult {
  if (!groups || groups.length < 2) {
    throw new Error('ANOVA requires at least 2 distinct groups');
  }

  const k = groups.length;
  const allValues = groups.flatMap(g => g.values);
  const N = allValues.length;
  if (N <= k) {
    throw new Error('Total observations must exceed the number of groups');
  }

  const grandMean = allValues.reduce((a, b) => a + b, 0) / N;

  const groupStats = groups.map(g => {
    const n = g.values.length;
    const mean = n > 0 ? g.values.reduce((a, b) => a + b, 0) / n : 0;
    const s = n > 1 ? Math.sqrt(g.values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1)) : 0;
    return { groupName: g.name, count: n, mean, stdDev: s };
  });

  // Between-group sum of squares (SSB)
  let betweenSS = 0;
  groups.forEach(g => {
    const mean = g.values.reduce((a, b) => a + b, 0) / g.values.length;
    betweenSS += g.values.length * Math.pow(mean - grandMean, 2);
  });
  const betweenDF = k - 1;
  const betweenMS = betweenDF > 0 ? betweenSS / betweenDF : 0;

  // Within-group sum of squares (SSW)
  let withinSS = 0;
  groups.forEach(g => {
    const mean = g.values.reduce((a, b) => a + b, 0) / g.values.length;
    g.values.forEach(v => {
      withinSS += Math.pow(v - mean, 2);
    });
  });
  const withinDF = N - k;
  const withinMS = withinDF > 0 ? withinSS / withinDF : 0;

  const fStatistic = withinMS > 0 ? betweenMS / withinMS : 0;
  const pValue = mathSpecialFunctions.fPValue(fStatistic, betweenDF, withinDF);
  const significant = pValue < alpha;

  return {
    testName: 'One-Way Analysis of Variance (ANOVA)',
    statistic: fStatistic,
    fStatistic,
    pValue,
    degreesOfFreedom: [betweenDF, withinDF],
    alpha,
    significant,
    betweenSS,
    withinSS,
    totalSS: betweenSS + withinSS,
    betweenDF,
    withinDF,
    betweenMS,
    withinMS,
    groupStats,
    nullHypothesis: 'H0: All group means are equal (μ1 = μ2 = ... = μk)',
    alternativeHypothesis: 'H1: At least one group mean is significantly different',
    conclusion: significant
      ? `Reject H0 (p = ${pValue.toFixed(4)} < ${alpha}). Statistically significant difference exists among group means.`
      : `Fail to reject H0 (p = ${pValue.toFixed(4)} >= ${alpha}). No significant difference detected among group means.`
  };
}

export interface ChiSquareResult extends HypothesisTestResult {
  chiSquareStatistic: number;
  observed: number[][];
  expected: number[][];
}

/**
 * Chi-Square Test of Independence for contingency tables (e.g., Defect Type vs Production Line)
 */
export function calculateChiSquareTest(
  contingencyTable: number[][],
  alpha: number = 0.05
): ChiSquareResult {
  const r = contingencyTable.length;
  const c = contingencyTable[0]?.length || 0;
  if (r < 2 || c < 2) {
    throw new Error('Contingency table must be at least 2x2');
  }

  const rowSums = contingencyTable.map(row => row.reduce((a, b) => a + b, 0));
  const colSums = Array.from({ length: c }, (_, j) => contingencyTable.reduce((sum, row) => sum + row[j], 0));
  const total = rowSums.reduce((a, b) => a + b, 0);

  if (total <= 0) throw new Error('Contingency table total must be positive');

  let chiSquare = 0;
  const expected: number[][] = [];

  for (let i = 0; i < r; i++) {
    expected[i] = [];
    for (let j = 0; j < c; j++) {
      const e = (rowSums[i] * colSums[j]) / total;
      expected[i][j] = e;
      if (e > 0) {
        chiSquare += Math.pow(contingencyTable[i][j] - e, 2) / e;
      }
    }
  }

  const df = (r - 1) * (c - 1);
  const pValue = mathSpecialFunctions.chiSquarePValue(chiSquare, df);
  const significant = pValue < alpha;

  return {
    testName: 'Chi-Square Test of Independence (χ²)',
    statistic: chiSquare,
    chiSquareStatistic: chiSquare,
    pValue,
    degreesOfFreedom: df,
    alpha,
    significant,
    observed: contingencyTable,
    expected,
    nullHypothesis: 'H0: The two categorical classifications are independent',
    alternativeHypothesis: 'H1: The two categorical classifications are significantly associated',
    conclusion: significant
      ? `Reject H0 (p = ${pValue.toFixed(4)} < ${alpha}). Strong association exists between the classifications.`
      : `Fail to reject H0 (p = ${pValue.toFixed(4)} >= ${alpha}). No statistically significant dependency found.`
  };
}

// ==========================================
// 4. Acceptance Sampling Plans & OC Curves (ISO 2859-1)
// ==========================================

export interface SamplingPlanResult {
  standard: 'ISO 2859-1 / ANSI/ASQ Z1.4';
  lotSize: number;
  inspectionLevel: 'I' | 'II' | 'III';
  aql: number;
  codeLetter: string;
  sampleSize: number;
  acceptNumber: number;
  rejectNumber: number;
  aoql: number;
}

export interface OcCurvePoint {
  incomingDefectRate: number;
  probabilityOfAcceptance: number;
  aoq: number;
  ati: number;
}

/**
 * Calculates Single Acceptance Sampling Plan according to ISO 2859-1 / ANSI/ASQ Z1.4 (Normal Inspection)
 */
export function calculateAcceptanceSamplingPlan(
  lotSize: number,
  aql: number = 1.0,
  inspectionLevel: 'I' | 'II' | 'III' = 'II'
): SamplingPlanResult {
  const N = Math.max(2, lotSize);

  // 1. Code Letter Lookup based on ISO 2859-1 Table I
  let letter = 'A';
  if (N <= 8) letter = inspectionLevel === 'III' ? 'B' : 'A';
  else if (N <= 15) letter = inspectionLevel === 'I' ? 'A' : inspectionLevel === 'II' ? 'B' : 'C';
  else if (N <= 25) letter = inspectionLevel === 'I' ? 'B' : inspectionLevel === 'II' ? 'C' : 'D';
  else if (N <= 50) letter = inspectionLevel === 'I' ? 'C' : inspectionLevel === 'II' ? 'D' : 'E';
  else if (N <= 90) letter = inspectionLevel === 'I' ? 'C' : inspectionLevel === 'II' ? 'E' : 'F';
  else if (N <= 150) letter = inspectionLevel === 'I' ? 'D' : inspectionLevel === 'II' ? 'F' : 'G';
  else if (N <= 280) letter = inspectionLevel === 'I' ? 'E' : inspectionLevel === 'II' ? 'G' : 'H';
  else if (N <= 500) letter = inspectionLevel === 'I' ? 'F' : inspectionLevel === 'II' ? 'H' : 'J';
  else if (N <= 1200) letter = inspectionLevel === 'I' ? 'G' : inspectionLevel === 'II' ? 'J' : 'K';
  else if (N <= 3200) letter = inspectionLevel === 'I' ? 'H' : inspectionLevel === 'II' ? 'K' : 'L';
  else if (N <= 10000) letter = inspectionLevel === 'I' ? 'J' : inspectionLevel === 'II' ? 'L' : 'M';
  else if (N <= 35000) letter = inspectionLevel === 'I' ? 'K' : inspectionLevel === 'II' ? 'M' : 'N';
  else if (N <= 150000) letter = inspectionLevel === 'I' ? 'L' : inspectionLevel === 'II' ? 'N' : 'P';
  else if (N <= 500000) letter = inspectionLevel === 'I' ? 'M' : inspectionLevel === 'II' ? 'P' : 'Q';
  else letter = inspectionLevel === 'I' ? 'N' : inspectionLevel === 'II' ? 'Q' : 'R';

  // 2. Code letter to sample size (ISO 2859-1 Table II-A)
  const sampleSizes: Record<string, number> = {
    A: 2, B: 3, C: 5, D: 8, E: 13, F: 20, G: 32, H: 50,
    J: 80, K: 125, L: 200, M: 315, N: 500, P: 800, Q: 1250, R: 2000
  };
  const n = sampleSizes[letter] || 50;

  // 3. Acceptance/Rejection numbers (Table II-A standard mapping for common AQLs)
  // Expected defect count = n * (AQL / 100)
  const mu = n * (aql / 100);
  let ac = Math.floor(mu);
  if (mu < 0.35) ac = 0;
  else if (mu < 0.95) ac = 1;
  else if (mu < 1.7) ac = 2;
  else if (mu < 2.5) ac = 3;
  else if (mu < 3.8) ac = 5;
  else if (mu < 5.2) ac = 7;
  else ac = Math.max(1, Math.round(mu));

  const re = ac + 1;

  // Approximate AOQL (Average Outgoing Quality Limit)
  // For single sampling: y * (1/n - 1/N), where y is standard constant depending on Ac
  const yConstants = [0.3679, 0.8400, 1.371, 1.942, 2.543, 3.172, 3.818, 4.472];
  const y = yConstants[Math.min(ac, yConstants.length - 1)] || (ac * 0.7);
  const aoql = ((y * (1 - n / N)) / n) * 100;

  return {
    standard: 'ISO 2859-1 / ANSI/ASQ Z1.4',
    lotSize: N,
    inspectionLevel,
    aql,
    codeLetter: letter,
    sampleSize: n,
    acceptNumber: ac,
    rejectNumber: re,
    aoql: Math.max(0.01, aoql)
  };
}

/**
 * Calculates Operating Characteristic (OC) Curve Points for Acceptance Sampling
 */
export function calculateOCCurve(
  lotSize: number,
  sampleSize: number,
  acceptNumber: number,
  steps: number = 25
): OcCurvePoint[] {
  const n = sampleSize;
  const ac = acceptNumber;
  const N = lotSize;

  const points: OcCurvePoint[] = [];
  const maxDefectRate = Math.max(0.10, (ac + 4) / n);

  for (let i = 0; i <= steps; i++) {
    const p = (i / steps) * maxDefectRate;
    
    // Poisson approximation for probability of acceptance Pa
    const lambda = n * p;
    let pa = 0;
    for (let d = 0; d <= ac; d++) {
      let term = Math.exp(-lambda);
      for (let k = 1; k <= d; k++) {
        term *= lambda / k;
      }
      pa += term;
    }
    pa = Math.min(1.0, Math.max(0.0, pa));

    // Average Outgoing Quality (AOQ)
    const aoq = pa * p * (1 - n / N);

    // Average Total Inspection (ATI)
    const ati = n + (1 - pa) * (N - n);

    points.push({
      incomingDefectRate: p,
      probabilityOfAcceptance: pa,
      aoq,
      ati
    });
  }

  return points;
}

// ==========================================
// 5. Weibull 2-Parameter Reliability Analysis
// ==========================================

export interface WeibullAnalysisResult {
  beta: number;
  eta: number;
  rSquared: number;
  mttf: number;
  b10Life: number;
  b50Life: number;
  failureMode: 'Infant Mortality' | 'Random / Constant Failure Rate' | 'Wear-Out';
  interpretation: string;
}

/**
 * 2-Parameter Weibull Life Data Analysis
 * Fits failure times to estimate shape parameter β and scale parameter η (Characteristic Life).
 * @param failureTimes Array of time-to-failure observations (hours, cycles, etc.)
 */
export function calculateWeibullAnalysis(failureTimes: number[]): WeibullAnalysisResult {
  if (!failureTimes || failureTimes.length < 3) {
    throw new Error('Weibull analysis requires at least 3 failure times');
  }

  const sorted = [...failureTimes].filter(t => t > 0).sort((a, b) => a - b);
  const n = sorted.length;

  // Benard's median ranks: F_i = (i - 0.3) / (n + 0.4)
  // Linearization: x_i = ln(t_i), y_i = ln(-ln(1 - F_i))
  const xVals: number[] = [];
  const yVals: number[] = [];

  for (let i = 1; i <= n; i++) {
    const t = sorted[i - 1];
    const rank = (i - 0.3) / (n + 0.4);
    xVals.push(Math.log(t));
    yVals.push(Math.log(-Math.log(1 - rank)));
  }

  // Linear regression: y = beta * x + intercept
  const xMean = xVals.reduce((a, b) => a + b, 0) / n;
  const yMean = yVals.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    num += (xVals[i] - xMean) * (yVals[i] - yMean);
    den += Math.pow(xVals[i] - xMean, 2);
    ssTot += Math.pow(yVals[i] - yMean, 2);
  }

  const beta = den > 0 ? num / den : 1.0;
  const intercept = yMean - beta * xMean;

  // Characteristic life eta: intercept = -beta * ln(eta)  => eta = exp(-intercept / beta)
  const eta = beta > 0 ? Math.exp(-intercept / beta) : sorted[Math.floor(n / 2)];

  // R^2 calculation
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yPred = beta * xVals[i] + intercept;
    ssRes += Math.pow(yVals[i] - yPred, 2);
  }
  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1.0;

  // MTTF = eta * Γ(1 + 1/beta)
  const mttf = eta * mathSpecialFunctions.gamma(1 + 1 / beta);

  // B10 Life: time when F(t) = 0.10 => t = eta * (-ln(0.90))^(1/beta)
  const b10Life = eta * Math.pow(-Math.log(0.90), 1 / beta);

  // B50 Life (Median): t = eta * (ln(2))^(1/beta)
  const b50Life = eta * Math.pow(Math.LN2, 1 / beta);

  let failureMode: 'Infant Mortality' | 'Random / Constant Failure Rate' | 'Wear-Out' = 'Wear-Out';
  let interpretation = '';

  if (beta < 0.95) {
    failureMode = 'Infant Mortality';
    interpretation = `Beta = ${beta.toFixed(2)} (< 1.0): Indicates early-life manufacturing defects or assembly errors (decreasing failure rate).`;
  } else if (beta <= 1.05) {
    failureMode = 'Random / Constant Failure Rate';
    interpretation = `Beta = ${beta.toFixed(2)} (≈ 1.0): Indicates random environmental/operational stresses (constant failure rate, exponential distribution).`;
  } else {
    failureMode = 'Wear-Out';
    interpretation = `Beta = ${beta.toFixed(2)} (> 1.0): Indicates fatigue, aging, or wear-out mechanisms (increasing failure rate over time).`;
  }

  return {
    beta,
    eta,
    rSquared,
    mttf,
    b10Life,
    b50Life,
    failureMode,
    interpretation
  };
}

// ==========================================
// 6. AIAG MSA Linearity & Bias Analysis
// ==========================================

export interface GageLinearityBiasObservation {
  referenceValue: number;
  measuredValue: number;
}

export interface GageLinearityBiasResult {
  standard: 'AIAG MSA 4th Edition';
  slope: number;
  intercept: number;
  rSquared: number;
  overallBias: number;
  percentOverallBias: number;
  linearity: number;
  percentLinearity: number;
  isLinearityAcceptable: boolean;
  isBiasAcceptable: boolean;
  slopeTStatistic: number;
  slopePValue: number;
  biasTStatistic: number;
  biasPValue: number;
  evaluation: string;
}

/**
 * Calculates Gage Linearity and Bias according to AIAG MSA 4th Edition
 * Evaluates whether measurement bias is constant across the operating range of the gage.
 * @param observations Array of reference and measured pairs
 * @param tolerance Part or process tolerance band (USL - LSL)
 */
export function calculateGageLinearityAndBias(
  observations: GageLinearityBiasObservation[],
  tolerance: number
): GageLinearityBiasResult {
  if (!observations || observations.length < 5) {
    throw new Error('Gage Linearity & Bias study requires at least 5 observations');
  }
  if (tolerance <= 0) {
    throw new Error('Tolerance must be greater than zero');
  }

  const n = observations.length;
  const xVals = observations.map(o => o.referenceValue);
  const biasVals = observations.map(o => o.measuredValue - o.referenceValue);

  const xMean = xVals.reduce((a, b) => a + b, 0) / n;
  const biasMean = biasVals.reduce((a, b) => a + b, 0) / n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;

  for (let i = 0; i < n; i++) {
    const dx = xVals[i] - xMean;
    const dy = biasVals[i] - biasMean;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }

  const slope = sxx > 0 ? sxy / sxx : 0;
  const intercept = biasMean - slope * xMean;

  // Residual variance and standard errors
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const pred = slope * xVals[i] + intercept;
    ssRes += Math.pow(biasVals[i] - pred, 2);
  }
  const df = n - 2;
  const sRes = df > 0 ? Math.sqrt(ssRes / df) : 0;
  const seSlope = sxx > 0 && sRes > 0 ? sRes / Math.sqrt(sxx) : 0;
  const seIntercept = sxx > 0 && sRes > 0 ? sRes * Math.sqrt(1 / n + Math.pow(xMean, 2) / sxx) : 0;

  const rSquared = syy > 0 ? Math.max(0, 1 - ssRes / syy) : 0;

  // Linearity = |slope| * Tolerance
  const linearity = Math.abs(slope) * tolerance;
  const percentLinearity = (linearity / tolerance) * 100;

  // Overall Bias
  const overallBias = Math.abs(biasMean);
  const percentOverallBias = (overallBias / tolerance) * 100;

  // Hypothesis tests:
  // H0: slope = 0 (no linearity issue)
  const slopeT = seSlope > 0 ? slope / seSlope : 0;
  const slopeP = mathSpecialFunctions.studentTPValue(slopeT, df);

  // H0: bias = 0 (testing intercept against zero)
  const biasT = seIntercept > 0 ? intercept / seIntercept : 0;
  const biasP = mathSpecialFunctions.studentTPValue(biasT, df);

  const isLinearityAcceptable = percentLinearity <= 5.0; // AIAG benchmark <= 5%
  const isBiasAcceptable = percentOverallBias <= 5.0;

  const evaluation = (isLinearityAcceptable && isBiasAcceptable)
    ? 'Measurement system meets AIAG MSA linearity and bias criteria (%Linearity <= 5%, %Bias <= 5%).'
    : `Measurement system requires investigation: ${!isLinearityAcceptable ? 'Linearity exceeds 5%. ' : ''}${!isBiasAcceptable ? 'Bias exceeds 5%.' : ''}`;

  return {
    standard: 'AIAG MSA 4th Edition',
    slope,
    intercept,
    rSquared,
    overallBias,
    percentOverallBias,
    linearity,
    percentLinearity,
    isLinearityAcceptable,
    isBiasAcceptable,
    slopeTStatistic: slopeT,
    slopePValue: slopeP,
    biasTStatistic: biasT,
    biasPValue: biasP,
    evaluation
  };
}
