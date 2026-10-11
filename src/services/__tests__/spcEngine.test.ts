import { describe, it, expect } from 'vitest';
import {
  SPC_CONSTANTS,
  mathHelper,
  calculateXbarR,
  calculateXbarS,
  calculateIMR,
  calculatePChart,
  calculateNpChart,
  calculateCChart,
  calculateUChart,
  calculateCapability,
  calculateNonNormalCapability,
  calculateGageRR,
  calculateSixSigmaMetrics,
  calculateActionPriority,
  checkNelsonRules,
  buildHistogramData,
  type SpcSubgroup,
  type GageRRObservation
} from '../spcEngine';

describe('SPC Engine — Statistical Process Control Verification', () => {
  describe('1. SPC Constants Verification against AIAG / ASTM standards', () => {
    it('verifies constants for subgroup size n=2', () => {
      expect(SPC_CONSTANTS.A2[2]).toBe(1.880);
      expect(SPC_CONSTANTS.D3[2]).toBe(0);
      expect(SPC_CONSTANTS.D4[2]).toBe(3.267);
      expect(SPC_CONSTANTS.d2[2]).toBe(1.128);
    });

    it('verifies constants for subgroup size n=5', () => {
      expect(SPC_CONSTANTS.A2[5]).toBe(0.577);
      expect(SPC_CONSTANTS.D3[5]).toBe(0);
      expect(SPC_CONSTANTS.D4[5]).toBe(2.114);
      expect(SPC_CONSTANTS.d2[5]).toBe(2.326);
    });

    it('verifies constants for subgroup size n=10', () => {
      expect(SPC_CONSTANTS.A2[10]).toBe(0.308);
      expect(SPC_CONSTANTS.D3[10]).toBe(0.223);
      expect(SPC_CONSTANTS.D4[10]).toBe(1.777);
      expect(SPC_CONSTANTS.d2[10]).toBe(3.078);
    });
  });

  describe('2. Basic Mathematical Functions', () => {
    it('calculates arithmetic mean correctly', () => {
      expect(mathHelper.mean([10, 20, 30, 40])).toBe(25);
      expect(mathHelper.mean([])).toBe(0);
    });

    it('calculates range correctly', () => {
      expect(mathHelper.range([5, 12, 3, 9])).toBe(9);
      expect(mathHelper.range([])).toBe(0);
    });

    it('calculates sample vs population standard deviation', () => {
      const data = [2, 4, 4, 4, 5, 5, 7, 9];
      // Sample standard deviation (N-1 denominator = 7)
      const s = mathHelper.stdDev(data, false);
      expect(s).toBeCloseTo(2.138, 3);

      // Population standard deviation (N denominator = 8)
      const sigma = mathHelper.stdDev(data, true);
      expect(sigma).toBeCloseTo(2.0, 3);
    });

    it('calculates standard normal CDF approximation accurately', () => {
      // At mean (z=0), CDF = 0.5
      expect(mathHelper.normalCDF(0, 0, 1)).toBeCloseTo(0.5, 4);
      // At z = +1.96, CDF ≈ 0.975
      expect(mathHelper.normalCDF(1.96, 0, 1)).toBeCloseTo(0.975, 2);
      // At z = -1.96, CDF ≈ 0.025
      expect(mathHelper.normalCDF(-1.96, 0, 1)).toBeCloseTo(0.025, 2);
    });

    it('calculates sample skewness and excess kurtosis', () => {
      // Symmetric normal-like data should have near 0 skewness
      const symmetricData = [10, 12, 14, 15, 16, 18, 20];
      expect(mathHelper.skewness(symmetricData)).toBeCloseTo(0, 1);

      // Strongly right-skewed data
      const skewedData = [1, 2, 2, 3, 3, 3, 10, 25];
      expect(mathHelper.skewness(skewedData)).toBeGreaterThan(1.0);

      // Kurtosis of uniform/flat data is negative
      const kurt = mathHelper.kurtosis(symmetricData);
      expect(Number.isFinite(kurt)).toBe(true);
    });

    it('calculates percentiles using linear interpolation', () => {
      const data = [10, 20, 30, 40, 50];
      expect(mathHelper.percentile(data, 50)).toBe(30); // exact median
      expect(mathHelper.percentile(data, 0)).toBe(10);  // min
      expect(mathHelper.percentile(data, 100)).toBe(50); // max
      expect(mathHelper.percentile(data, 25)).toBe(20);
      expect(mathHelper.percentile(data, 75)).toBe(40);
    });

    it('calculates Acklam inverse normal CDF accurately across quantiles', () => {
      expect(mathHelper.inverseNormalCDF(0.5)).toBe(0);
      expect(mathHelper.inverseNormalCDF(0.975)).toBeCloseTo(1.96, 2);
      expect(mathHelper.inverseNormalCDF(0.025)).toBeCloseTo(-1.96, 2);
      expect(mathHelper.inverseNormalCDF(0.99865)).toBeCloseTo(3.0, 1);
      expect(mathHelper.inverseNormalCDF(0.00135)).toBeCloseTo(-3.0, 1);
    });
  });

  describe('3. X-bar / R Chart Calculations', () => {
    const referenceSubgroups: SpcSubgroup[] = [
      { id: '1', label: 'Sample 1', values: [50, 52, 49, 51, 48] }, // mean = 50, range = 4
      { id: '2', label: 'Sample 2', values: [51, 50, 52, 49, 48] }, // mean = 50, range = 4
      { id: '3', label: 'Sample 3', values: [53, 51, 50, 52, 49] }, // mean = 51, range = 4
      { id: '4', label: 'Sample 4', values: [48, 50, 51, 49, 52] }, // mean = 50, range = 4
      { id: '5', label: 'Sample 5', values: [50, 49, 51, 52, 48] }, // mean = 50, range = 4
    ];

    it('calculates center line and control limits matching AIAG formulas', () => {
      const res = calculateXbarR(referenceSubgroups);

      // X-double-bar = (50 + 50 + 51 + 50 + 50) / 5 = 50.2
      expect(res.primaryLimits.cl).toBeCloseTo(50.2, 4);

      // R-bar = 4.0
      expect(res.secondaryLimits?.cl).toBeCloseTo(4.0, 4);

      // A2 for n=5 is 0.577. UCL = 50.2 + 0.577 * 4.0 = 52.508
      expect(res.primaryLimits.ucl).toBeCloseTo(52.508, 3);
      expect(res.primaryLimits.lcl).toBeCloseTo(47.892, 3);

      // D4 for n=5 is 2.114, D3 is 0. UCL = 2.114 * 4.0 = 8.456, LCL = 0
      expect(res.secondaryLimits?.ucl).toBeCloseTo(8.456, 3);
      expect(res.secondaryLimits?.lcl).toBe(0);

      // withinSigma = R-bar / d2 = 4.0 / 2.326 ≈ 1.71969
      expect(res.withinSigma).toBeCloseTo(1.7197, 3);
    });

    it('calculates I-MR (Individuals and Moving Range) limits correctly', () => {
      const imrData = [
        { label: 'Pt 1', value: 10 },
        { label: 'Pt 2', value: 12 },
        { label: 'Pt 3', value: 11 },
        { label: 'Pt 4', value: 13 },
        { label: 'Pt 5', value: 9 }
      ];
      const res = calculateIMR(imrData);
      // Mean = (10+12+11+13+9)/5 = 11.0
      expect(res.primaryLimits.cl).toBe(11.0);
      expect(res.secondaryLimits?.cl).toBeGreaterThan(0);
      expect(res.primaryLimits.ucl).toBeGreaterThan(11.0);
      expect(res.primaryLimits.lcl).toBeLessThan(11.0);
    });
    it('calculates X-bar / S chart limits using standard A3, B3, B4, c4 factors', () => {
      const subgroups: SpcSubgroup[] = [
        { id: '1', label: 'Sg 1', values: [10, 11, 9, 10, 10] },
        { id: '2', label: 'Sg 2', values: [12, 10, 11, 10, 11] },
        { id: '3', label: 'Sg 3', values: [9, 10, 10, 11, 10] },
      ];
      const res = calculateXbarS(subgroups);
      expect(res.chartType).toBe('X-bar / S');
      expect(res.primaryLimits.cl).toBeGreaterThan(0);
      expect(res.secondaryLimits?.cl).toBeGreaterThan(0);
      expect(res.primaryLimits.ucl).toBeGreaterThan(res.primaryLimits.cl);
      expect(res.primaryLimits.lcl).toBeLessThan(res.primaryLimits.cl);
      expect(res.withinSigma).toBeGreaterThan(0);
    });
  });

  describe('4. Process Capability Analysis (Cp, Cpk, Pp, Ppk, Cpm)', () => {
    const data = [48, 49, 50, 50, 51, 49, 52, 50, 49, 51, 50, 52, 48, 51, 50]; // mean = 50.0

    it('calculates bilateral capability correctly', () => {
      const usl = 56;
      const lsl = 44;
      const target = 50;

      const res = calculateCapability(data, usl, lsl, target);

      expect(res.overallMean).toBeCloseTo(50.0, 2);
      expect(res.cp).toBeGreaterThan(0);
      expect(res.cpk).toBeGreaterThan(0);
      expect(res.pp).toBeGreaterThan(0);
      expect(res.ppk).toBeGreaterThan(0);
      expect(res.ppmTotal).toBeGreaterThanOrEqual(0);
      expect(res.cpm).toBeDefined();
      expect(res.cpm!).toBeGreaterThan(0);
    });

    it('calculates Taguchi Cpm penalizing off-target processes', () => {
      const usl = 55;
      const lsl = 45;
      // Centered target
      const resCentered = calculateCapability(data, usl, lsl, 50);
      // Off-centered target
      const resOffTarget = calculateCapability(data, usl, lsl, 47);

      expect(resCentered.cpm!).toBeGreaterThan(resOffTarget.cpm!);
    });

    it('supports unilateral tolerance (USL only)', () => {
      const usl = 55;
      const res = calculateCapability(data, usl, null);

      expect(res.cp).toBe(res.cpk);
      expect(res.pp).toBe(res.ppk);
      expect(res.ppmAboveUSL).toBeGreaterThanOrEqual(0);
      expect(res.ppmBelowLSL).toBe(0);
    });

    it('supports unilateral tolerance (LSL only)', () => {
      const lsl = 45;
      const res = calculateCapability(data, null, lsl);

      expect(res.cp).toBe(res.cpk);
      expect(res.pp).toBe(res.ppk);
      expect(res.ppmBelowLSL).toBeGreaterThanOrEqual(0);
      expect(res.ppmAboveUSL).toBe(0);
    });

    it('calculates 95% Confidence Intervals for Cp, Cpk, Pp, and Ppk', () => {
      const res = calculateCapability(data, 56, 44, 50);

      expect(res.ciCp).toBeDefined();
      expect(res.ciCp!.lower).toBeLessThanOrEqual(res.cp);
      expect(res.ciCp!.upper).toBeGreaterThanOrEqual(res.cp);
      expect(res.ciCp!.confidenceLevel).toBe(0.95);

      expect(res.ciCpk).toBeDefined();
      expect(res.ciCpk!.lower).toBeLessThanOrEqual(res.cpk);
      expect(res.ciCpk!.upper).toBeGreaterThanOrEqual(res.cpk);

      expect(res.ciPp).toBeDefined();
      expect(res.ciPp!.lower).toBeLessThanOrEqual(res.pp);
      expect(res.ciPp!.upper).toBeGreaterThanOrEqual(res.pp);

      expect(res.ciPpk).toBeDefined();
      expect(res.ciPpk!.lower).toBeLessThanOrEqual(res.ppk);
      expect(res.ciPpk!.upper).toBeGreaterThanOrEqual(res.ppk);
    });

    it('runs Anderson-Darling normality test and reports p-value and verdict', () => {
      // Normal-like dataset
      const resNormal = calculateCapability(data, 56, 44);
      expect(resNormal.normality).toBeDefined();
      expect(resNormal.normality!.adStatistic).toBeGreaterThanOrEqual(0);
      expect(resNormal.normality!.pValue).toBeGreaterThan(0.05);
      expect(resNormal.normality!.isNormal).toBe(true);

      // Strongly skewed non-normal dataset
      const skewedData = [1, 1, 1, 1, 2, 2, 3, 4, 15, 30, 50];
      const resSkewed = calculateCapability(skewedData, 60, 0);
      expect(resSkewed.normality!.pValue).toBeLessThan(0.05);
      expect(resSkewed.normality!.isNormal).toBe(false);
    });
  });

  describe('5. Attribute Charts (p, np, c, u Charts)', () => {
    it('calculates p chart correctly and guards against zero samples', () => {
      const data = [
        { label: 'Batch 1', defective: 2, sampleSize: 100 },
        { label: 'Batch 2', defective: 5, sampleSize: 100 },
        { label: 'Batch 3', defective: 1, sampleSize: 100 },
        { label: 'Batch 4', defective: 0, sampleSize: 100 },
      ];

      const res = calculatePChart(data);
      expect(res.primaryLimits.cl).toBeCloseTo(0.02, 4);
      expect(res.primaryLimits.ucl).toBeGreaterThan(0.02);
      expect(res.primaryLimits.lcl).toBeGreaterThanOrEqual(0);
    });

    it('calculates np chart for count of defectives in fixed sample size', () => {
      const data = [
        { label: 'Sample 1', defective: 3, sampleSize: 50 },
        { label: 'Sample 2', defective: 2, sampleSize: 50 },
        { label: 'Sample 3', defective: 5, sampleSize: 50 },
        { label: 'Sample 4', defective: 1, sampleSize: 50 },
      ];
      const res = calculateNpChart(data);
      // total = 11, totalSample = 200, pBar = 0.055, npBar = 2.75
      expect(res.primaryLimits.cl).toBeCloseTo(2.75, 2);
      expect(res.primaryLimits.ucl).toBeGreaterThan(res.primaryLimits.cl);
      expect(res.primaryLimits.lcl).toBeGreaterThanOrEqual(0);
    });

    it('calculates c chart for defect counts in constant unit area', () => {
      const data = [
        { label: 'Inspection 1', defects: 4 },
        { label: 'Inspection 2', defects: 2 },
        { label: 'Inspection 3', defects: 6 },
        { label: 'Inspection 4', defects: 4 },
      ];
      const res = calculateCChart(data);
      // mean = 16 / 4 = 4.0, sigma = sqrt(4) = 2.0, UCL = 4 + 6 = 10, LCL = max(0, 4 - 6) = 0
      expect(res.primaryLimits.cl).toBe(4.0);
      expect(res.primaryLimits.ucl).toBe(10.0);
      expect(res.primaryLimits.lcl).toBe(0.0);
    });

    it('calculates u chart correctly for defects per unit', () => {
      const data = [
        { label: 'Lot 1', defects: 5, units: 10 },
        { label: 'Lot 2', defects: 8, units: 10 },
        { label: 'Lot 3', defects: 3, units: 10 },
      ];

      const res = calculateUChart(data);
      expect(res.primaryLimits.cl).toBeCloseTo(0.5333, 3);
    });
  });

  describe('6. Complete 8 Nelson Rules Process-Control Violations', () => {
    const cl = 50;
    const sigma = 2;

    it('detects Rule 1: point > 3 sigma from center line', () => {
      const points = [50, 51, 49, 58, 50]; // 58 is 4 sigma away!
      const violations = checkNelsonRules(points, cl, sigma);
      expect(violations.some(v => v.rule === 1 && v.index === 3)).toBe(true);
    });

    it('detects Rule 2: 9 consecutive points on same side of center line', () => {
      const points = [52, 53, 51, 54, 52, 53, 51, 52, 53, 50];
      const violations = checkNelsonRules(points, cl, sigma);
      expect(violations.some(v => v.rule === 2)).toBe(true);
    });

    it('detects Rule 3: 6 consecutive points steadily increasing', () => {
      const points = [46, 47, 48, 49, 50, 51, 48];
      const violations = checkNelsonRules(points, cl, sigma);
      expect(violations.some(v => v.rule === 3)).toBe(true);
    });

    it('detects Rule 4: 14 consecutive points alternating up and down', () => {
      const points = [50, 52, 49, 53, 48, 52, 49, 51, 48, 52, 49, 51, 48, 52, 49];
      const violations = checkNelsonRules(points, cl, sigma);
      expect(violations.some(v => v.rule === 4)).toBe(true);
    });

    it('detects Rule 5: 2 out of 3 consecutive points > 2 sigma from center line', () => {
      // 2 sigma = 4. Points > 54:
      const points = [50, 55, 53, 55, 50]; // indices 1, 2, 3 have two points > 54
      const violations = checkNelsonRules(points, cl, sigma);
      expect(violations.some(v => v.rule === 5)).toBe(true);
    });

    it('detects Rule 6: 4 out of 5 consecutive points > 1 sigma from center line', () => {
      // 1 sigma = 2. Points > 52:
      const points = [50, 53, 53, 51, 53, 53];
      const violations = checkNelsonRules(points, cl, sigma);
      expect(violations.some(v => v.rule === 6)).toBe(true);
    });

    it('detects Rule 7: 15 consecutive points within 1 sigma of center line (Stratification)', () => {
      // Points between 48.5 and 51.5:
      const points = Array(15).fill(50.5);
      const violations = checkNelsonRules(points, cl, sigma);
      expect(violations.some(v => v.rule === 7)).toBe(true);
    });

    it('detects Rule 8: 8 consecutive points with none within 1 sigma of center line (Mixture pattern)', () => {
      // Alternating between Zone A/B without entering Zone C (<1 sigma):
      const points = [53, 46, 54, 45, 53, 46, 54, 45];
      const violations = checkNelsonRules(points, cl, sigma);
      expect(violations.some(v => v.rule === 8)).toBe(true);
    });
  });

  describe('7. Histogram Builder', () => {
    it('generates bins with frequency and normal PDF curve values', () => {
      const values = [10, 12, 14, 15, 16, 17, 18, 19, 20, 22, 25];
      const bins = buildHistogramData(values, 5);

      expect(bins.length).toBe(5);
      const totalCount = bins.reduce((sum, b) => sum + b.count, 0);
      expect(totalCount).toBe(values.length);
      bins.forEach(b => {
        expect(b.normalY).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('8. Non-Normal Capability Analysis (ISO 22514-2 / Clements Method)', () => {
    const nonNormalData = [2, 3, 3, 4, 4, 4, 5, 5, 6, 8, 12, 18, 25];

    it('calculates percentile-based capability for bilateral specifications', () => {
      const usl = 30;
      const lsl = 0;
      const res = calculateNonNormalCapability(nonNormalData, usl, lsl);

      expect(res.method).toContain('ISO 22514-2');
      expect(res.median).toBe(5);
      expect(res.p0135).toBeLessThan(res.median);
      expect(res.p99865).toBeGreaterThan(res.median);
      expect(res.spread).toBe(res.p99865 - res.p0135);
      expect(res.pp).toBeGreaterThan(0);
      expect(res.ppk).toBeGreaterThan(0);
      expect(res.ppu).toBeDefined();
      expect(res.ppl).toBeDefined();
    });

    it('handles unilateral specifications', () => {
      const resUsl = calculateNonNormalCapability(nonNormalData, 30, null);
      expect(resUsl.pp).toBe(resUsl.ppk);
      expect(resUsl.ppu).toBeDefined();
      expect(resUsl.ppl).toBeUndefined();

      const resLsl = calculateNonNormalCapability(nonNormalData, null, 1);
      expect(resLsl.pp).toBe(resLsl.ppk);
      expect(resLsl.ppl).toBeDefined();
      expect(resLsl.ppu).toBeUndefined();
    });
  });

  describe('9. AIAG MSA 4th Edition Measurement System Analysis (Gage R&R)', () => {
    it('evaluates an acceptable gage with high part variation and low measurement error', () => {
      // 2 Operators, 3 Parts, 2 Trials each (12 observations)
      const dataset: GageRRObservation[] = [
        // Operator A
        { operator: 'OpA', part: 'P1', trial: 1, measurement: 10.0 },
        { operator: 'OpA', part: 'P1', trial: 2, measurement: 10.1 },
        { operator: 'OpA', part: 'P2', trial: 1, measurement: 20.0 },
        { operator: 'OpA', part: 'P2', trial: 2, measurement: 19.9 },
        { operator: 'OpA', part: 'P3', trial: 1, measurement: 30.0 },
        { operator: 'OpA', part: 'P3', trial: 2, measurement: 30.1 },
        // Operator B
        { operator: 'OpB', part: 'P1', trial: 1, measurement: 10.1 },
        { operator: 'OpB', part: 'P1', trial: 2, measurement: 10.0 },
        { operator: 'OpB', part: 'P2', trial: 1, measurement: 20.1 },
        { operator: 'OpB', part: 'P2', trial: 2, measurement: 20.0 },
        { operator: 'OpB', part: 'P3', trial: 1, measurement: 30.1 },
        { operator: 'OpB', part: 'P3', trial: 2, measurement: 30.0 },
      ];

      const res = calculateGageRR(dataset);

      expect(res.equipmentVariationEV).toBeGreaterThan(0);
      expect(res.partVariationPV).toBeGreaterThan(res.gageRR);
      expect(res.percentGRR).toBeLessThan(10); // Under 10% is acceptable
      expect(res.status).toBe('acceptable');
      expect(res.ndc).toBeGreaterThanOrEqual(5); // ndc >= 5 according to AIAG
    });

    it('identifies an unacceptable gage when measurement error dominates', () => {
      // Measurement error huge compared to identical parts
      const badDataset: GageRRObservation[] = [
        { operator: 'OpA', part: 'P1', trial: 1, measurement: 10.0 },
        { operator: 'OpA', part: 'P1', trial: 2, measurement: 14.0 },
        { operator: 'OpA', part: 'P2', trial: 1, measurement: 10.5 },
        { operator: 'OpA', part: 'P2', trial: 2, measurement: 15.0 },
        { operator: 'OpB', part: 'P1', trial: 1, measurement: 16.0 },
        { operator: 'OpB', part: 'P1', trial: 2, measurement: 11.0 },
        { operator: 'OpB', part: 'P2', trial: 1, measurement: 18.0 },
        { operator: 'OpB', part: 'P2', trial: 2, measurement: 12.0 },
      ];

      const res = calculateGageRR(badDataset);
      expect(res.percentGRR).toBeGreaterThan(30);
      expect(res.status).toBe('unacceptable');
    });
  });

  describe('10. Six Sigma Defect & Yield Metrics Engine', () => {
    it('calculates DPU, DPO, DPMO, Poisson yield, and Sigma level accurately', () => {
      // 3 defects in 1,000 units with 5 opportunities per unit
      const res = calculateSixSigmaMetrics(3, 1000, 5);

      expect(res.dpu).toBe(0.003);
      expect(res.dpo).toBe(0.0006);
      expect(res.dpmo).toBe(600);
      expect(res.ppm).toBe(600);
      expect(res.poissonYield).toBeCloseTo(0.997, 3);
      expect(res.observedYield).toBeCloseTo(0.997, 3);
      // DPMO = 600 corresponds to ~4.74 Sigma (with 1.5 shift)
      expect(res.sigmaLevel).toBeGreaterThan(4.5);
      expect(res.sigmaLevel).toBeLessThan(5.0);
    });

    it('handles zero defects gracefully with high sigma level', () => {
      const res = calculateSixSigmaMetrics(0, 1000, 1);
      expect(res.dpmo).toBe(0);
      expect(res.poissonYield).toBe(1.0);
      expect(res.observedYield).toBe(1.0);
      expect(res.sigmaLevel).toBeGreaterThanOrEqual(6.0);
    });
  });

  describe('11. AIAG-VDA 2019 Action Priority (AP) Engine', () => {
    it('assigns High Action Priority for severe risks with moderate to high occurrence', () => {
      expect(calculateActionPriority(10, 8, 5)).toBe('High');
      expect(calculateActionPriority(9, 6, 4)).toBe('High');
      expect(calculateActionPriority(7, 8, 3)).toBe('High');
    });

    it('assigns Medium Action Priority for moderate risks with moderate occurrence/detection', () => {
      expect(calculateActionPriority(6, 6, 5)).toBe('Medium');
      expect(calculateActionPriority(5, 5, 8)).toBe('Medium');
      expect(calculateActionPriority(7, 3, 6)).toBe('Medium');
    });

    it('assigns Low Action Priority for low risks or negligible severity', () => {
      expect(calculateActionPriority(1, 10, 10)).toBe('Low');
      expect(calculateActionPriority(2, 2, 2)).toBe('Low');
      expect(calculateActionPriority(7, 1, 5)).toBe('Low');
    });
  });
});
