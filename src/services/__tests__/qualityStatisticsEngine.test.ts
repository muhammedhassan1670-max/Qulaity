import { describe, it, expect } from 'vitest';
import {
  mathSpecialFunctions,
  calculateEWMA,
  calculateCUSUM,
  calculateTwoSampleTTest,
  calculatePairedTTest,
  calculateOneWayANOVA,
  calculateChiSquareTest,
  calculateAcceptanceSamplingPlan,
  calculateOCCurve,
  calculateWeibullAnalysis,
  calculateGageLinearityAndBias
} from '../qualityStatisticsEngine';

describe('Quality Statistics Engine — Advanced Statistical Calculations', () => {

  describe('1. Special Mathematical Functions (Gamma, Beta, and Distributions)', () => {
    it('calculates Gamma function correctly for integer and half-integer values', () => {
      // Γ(5) = 4! = 24
      expect(mathSpecialFunctions.gamma(5)).toBeCloseTo(24.0, 4);
      // Γ(1) = 0! = 1
      expect(mathSpecialFunctions.gamma(1)).toBeCloseTo(1.0, 4);
      // Γ(0.5) = sqrt(π) ≈ 1.77245
      expect(mathSpecialFunctions.gamma(0.5)).toBeCloseTo(Math.sqrt(Math.PI), 4);
    });

    it('calculates Student t two-tailed p-value accurately', () => {
      // For large df, t=1.96 gives two-tailed p ≈ 0.05
      const p95 = mathSpecialFunctions.studentTPValue(1.96, 1000);
      expect(p95).toBeCloseTo(0.05, 2);

      // At t=0, p=1.0
      expect(mathSpecialFunctions.studentTPValue(0, 10)).toBe(1.0);
    });

    it('calculates Fisher F distribution p-value accurately', () => {
      // For large df, F=1.0 gives p ≈ 0.5
      const p = mathSpecialFunctions.fPValue(1.0, 100, 100);
      expect(p).toBeCloseTo(0.5, 1);

      // Large F statistic gives very small p-value
      const pSmall = mathSpecialFunctions.fPValue(10.0, 2, 20);
      expect(pSmall).toBeLessThan(0.01);
    });

    it('calculates Chi-Square distribution p-value accurately', () => {
      // For df=1, χ²=3.84 gives p ≈ 0.05
      const p = mathSpecialFunctions.chiSquarePValue(3.8415, 1);
      expect(p).toBeCloseTo(0.05, 2);

      // For df=2, χ²=5.99 gives p ≈ 0.05
      const p2 = mathSpecialFunctions.chiSquarePValue(5.991, 2);
      expect(p2).toBeCloseTo(0.05, 2);
    });
  });

  describe('2. EWMA (Exponentially Weighted Moving Average) Control Chart', () => {
    it('calculates EWMA with time-varying limits and catches persistent subtle shifts', () => {
      // 20 points centered at 50, then 10 points shifted by +1.5 sigma to 53
      const data: { label: string; value: number }[] = [];
      for (let i = 1; i <= 20; i++) {
        data.push({ label: `Pt ${i}`, value: 50 + (i % 2 === 0 ? 0.8 : -0.8) });
      }
      for (let i = 21; i <= 30; i++) {
        data.push({ label: `Pt ${i}`, value: 53.5 }); // +1.5 sigma shift
      }

      const res = calculateEWMA(data, 0.2, 3.0, 50, 2.0);

      expect(res.chartType).toBe('EWMA');
      expect(res.lambda).toBe(0.2);
      expect(res.points.length).toBe(30);

      // First point EWMA starts towards value
      expect(res.points[0].ewma).toBeGreaterThan(49);
      expect(res.points[0].ewma).toBeLessThan(51);

      // Time-varying limits widen over time towards asymptotic limits
      const earlyWidth = res.points[1].ucl - res.points[1].cl;
      const lateWidth = res.points[25].ucl - res.points[25].cl;
      expect(lateWidth).toBeGreaterThan(earlyWidth);

      // Detects the shift in the shifted region
      expect(res.outOfControlCount).toBeGreaterThan(0);
      const lastPoint = res.points[res.points.length - 1];
      expect(lastPoint.outOfControl).toBe(true);
    });
  });

  describe('3. CUSUM (Cumulative Sum) Control Chart', () => {
    it('detects positive and negative shifts using high and low cumulative sums', () => {
      const shiftedUpData: { label: string; value: number }[] = [];
      for (let i = 1; i <= 15; i++) {
        shiftedUpData.push({ label: `S ${i}`, value: 100 });
      }
      for (let i = 16; i <= 25; i++) {
        shiftedUpData.push({ label: `S ${i}`, value: 104 }); // Sustained +2 sigma shift
      }

      const res = calculateCUSUM(shiftedUpData, 100, 0.5, 4.0);

      expect(res.chartType).toBe('CUSUM');
      expect(res.points.length).toBe(25);
      // In stable region C+ stays 0
      expect(res.points[5].cusumHigh).toBe(0);
      // In shifted region C+ accumulates and triggers violation
      expect(res.outOfControlCount).toBeGreaterThan(0);
      expect(res.points[24].outOfControl).toBe(true);
      expect(res.points[24].shiftDirection).toBe('up');
    });
  });

  describe('4. Industrial Hypothesis Testing Suite', () => {
    it('runs Two-Sample Welch t-Test correctly', () => {
      const batchA = [10.1, 10.2, 9.9, 10.0, 10.1, 9.8];
      const batchB = [12.5, 12.4, 12.6, 12.3, 12.5, 12.7]; // Clearly higher

      const res = calculateTwoSampleTTest(batchA, batchB);

      expect(res.mean1).toBeCloseTo(10.02, 2);
      expect(res.mean2).toBeCloseTo(12.5, 2);
      expect(res.significant).toBe(true);
      expect(res.pValue).toBeLessThan(0.001);
      expect(res.conclusion).toContain('Reject H0');
    });

    it('runs Paired t-Test for before/after process intervention', () => {
      const beforeIntervention = [50, 52, 49, 53, 51];
      const afterIntervention = [45, 46, 44, 47, 45]; // ~5 units reduction

      const res = calculatePairedTTest(beforeIntervention, afterIntervention);

      expect(res.meanDifference).toBeCloseTo(5.6, 1);
      expect(res.significant).toBe(true);
      expect(res.pValue).toBeLessThan(0.01);
    });

    it('runs One-Way ANOVA across 3 distinct production lines', () => {
      const groups = [
        { name: 'Line 1', values: [10, 11, 10, 12, 11] },
        { name: 'Line 2', values: [15, 14, 16, 15, 15] },
        { name: 'Line 3', values: [20, 21, 19, 20, 22] }
      ];

      const res = calculateOneWayANOVA(groups);

      expect(res.fStatistic).toBeGreaterThan(50);
      expect(res.pValue).toBeLessThan(0.0001);
      expect(res.significant).toBe(true);
      expect(res.groupStats.length).toBe(3);
    });

    it('runs Chi-Square Test of Independence for defect contingency matrix', () => {
      // 2x2 table: [Line A Defects, Line B Defects] across [Type 1, Type 2]
      const table = [
        [50, 10],  // Line 1: predominantly Type 1
        [15, 45]   // Line 2: predominantly Type 2
      ];

      const res = calculateChiSquareTest(table);

      expect(res.chiSquareStatistic).toBeGreaterThan(15);
      expect(res.degreesOfFreedom).toBe(1);
      expect(res.pValue).toBeLessThan(0.001);
      expect(res.significant).toBe(true);
    });
  });

  describe('5. Acceptance Sampling Plans & OC Curves (ISO 2859-1)', () => {
    it('derives ISO 2859-1 sampling plan matching standard tables', () => {
      // Lot size 1,000, AQL 1.0, Level II
      const plan = calculateAcceptanceSamplingPlan(1000, 1.0, 'II');

      expect(plan.standard).toBe('ISO 2859-1 / ANSI/ASQ Z1.4');
      expect(plan.codeLetter).toBe('J'); // For N=1000, Level II is J
      expect(plan.sampleSize).toBe(80);  // Code letter J = n=80
      expect(plan.acceptNumber).toBeGreaterThanOrEqual(1);
      expect(plan.rejectNumber).toBe(plan.acceptNumber + 1);
      expect(plan.aoql).toBeGreaterThan(0);
    });

    it('generates monotonic OC curve data points', () => {
      const points = calculateOCCurve(1000, 80, 2, 10);

      expect(points.length).toBe(11);
      // At defect rate 0%, acceptance probability is 1.0
      expect(points[0].probabilityOfAcceptance).toBe(1.0);
      // As incoming defects increase, Pa decreases monotonically
      const lastPoint = points[points.length - 1];
      expect(lastPoint.probabilityOfAcceptance).toBeLessThan(0.2);
    });
  });

  describe('6. 2-Parameter Weibull Reliability Analysis', () => {
    it('fits failure times and estimates shape parameter (beta), scale (eta), and B10 life', () => {
      // Wear-out failure times around 1000 hours (beta > 1)
      const times = [850, 920, 980, 1020, 1060, 1100, 1150, 1210];

      const res = calculateWeibullAnalysis(times);

      expect(res.beta).toBeGreaterThan(2.0); // Clear wear-out pattern
      expect(res.failureMode).toBe('Wear-Out');
      expect(res.eta).toBeGreaterThan(950);
      expect(res.eta).toBeLessThan(1250);
      expect(res.rSquared).toBeGreaterThan(0.90);
      expect(res.b10Life).toBeLessThan(res.mttf);
      expect(res.b50Life).toBeGreaterThan(res.b10Life);
    });
  });

  describe('7. AIAG MSA 4th Edition Linearity & Bias Analysis', () => {
    it('evaluates gage linearity and bias across reference parts', () => {
      const tolerance = 10.0;
      // 5 Reference parts measured with minimal bias
      const observations = [
        { referenceValue: 2.0, measuredValue: 2.02 },
        { referenceValue: 2.0, measuredValue: 1.99 },
        { referenceValue: 4.0, measuredValue: 4.01 },
        { referenceValue: 4.0, measuredValue: 4.03 },
        { referenceValue: 6.0, measuredValue: 6.02 },
        { referenceValue: 6.0, measuredValue: 5.98 },
        { referenceValue: 8.0, measuredValue: 8.01 },
        { referenceValue: 8.0, measuredValue: 8.03 }
      ];

      const res = calculateGageLinearityAndBias(observations, tolerance);

      expect(res.standard).toBe('AIAG MSA 4th Edition');
      expect(res.percentLinearity).toBeLessThan(5.0); // Within acceptable 5%
      expect(res.percentOverallBias).toBeLessThan(5.0);
      expect(res.isLinearityAcceptable).toBe(true);
      expect(res.isBiasAcceptable).toBe(true);
    });
  });
});
