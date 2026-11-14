import { describe, it, expect } from 'vitest';
import {
  calculateXbarR,
  calculateXbarS,
  calculateIMR,
  type SpcSubgroup,
} from '@/services/spcEngine';
import { assertControlLimits } from '../../helpers/assertionHelpers';

describe('Feature 07: Variable Control Charts (X-bar, R, S, I-MR)', () => {
  it('calculates X-bar and R chart limits for subgroup size n=5 using AIAG constants', () => {
    // 6 subgroups of size n=5
    const subgroups: SpcSubgroup[] = [
      { id: '1', label: 'SG1', timestamp: '2026-11-14T08:00:00Z', values: [45.01, 45.02, 45.00, 44.99, 45.03] }, // mean 45.010, R 0.04
      { id: '2', label: 'SG2', timestamp: '2026-11-14T09:00:00Z', values: [45.00, 44.98, 45.01, 45.02, 44.99] }, // mean 45.000, R 0.04
      { id: '3', label: 'SG3', timestamp: '2026-11-14T10:00:00Z', values: [45.03, 45.01, 45.02, 45.00, 45.04] }, // mean 45.020, R 0.04
      { id: '4', label: 'SG4', timestamp: '2026-11-14T11:00:00Z', values: [44.99, 45.00, 45.01, 44.98, 45.02] }, // mean 45.000, R 0.04
      { id: '5', label: 'SG5', timestamp: '2026-11-14T12:00:00Z', values: [45.02, 45.03, 45.01, 45.00, 44.99] }, // mean 45.010, R 0.04
      { id: '6', label: 'SG6', timestamp: '2026-11-14T13:00:00Z', values: [45.01, 45.00, 45.02, 45.03, 44.99] }, // mean 45.010, R 0.04
    ];

    const result = calculateXbarR(subgroups);

    // X-bar grand mean
    expect(result.overallMean).toBeCloseTo(45.0083, 3);
    // Range mean
    expect(result.secondaryLimits.cl).toBeCloseTo(0.040, 3);

    // Primary limits for X-bar
    const rBar = result.secondaryLimits.cl;
    const expectedXbarUcl = result.overallMean + 0.577 * rBar;
    const expectedXbarLcl = result.overallMean - 0.577 * rBar;
    expect(result.primaryLimits.ucl).toBeCloseTo(expectedXbarUcl, 3);
    expect(result.primaryLimits.lcl).toBeCloseTo(expectedXbarLcl, 3);
    assertControlLimits(result.overallMean, result.primaryLimits.ucl, result.primaryLimits.lcl, 'X-bar Limits');

    // Range limits: D4=2.114, D3=0
    expect(result.secondaryLimits.ucl).toBeCloseTo(2.114 * rBar, 3);
    expect(result.secondaryLimits.lcl).toBe(0);
  });

  it('calculates X-bar and S chart limits for large subgroup sizes (n=10)', () => {
    const subgroups: SpcSubgroup[] = [
      { id: '1', label: 'SG1', timestamp: 'T1', values: [10, 11, 10, 12, 10, 11, 10, 10, 11, 11] },
      { id: '2', label: 'SG2', timestamp: 'T2', values: [10, 10, 11, 11, 10, 12, 10, 11, 10, 11] },
      { id: '3', label: 'SG3', timestamp: 'T3', values: [11, 11, 10, 10, 11, 10, 11, 11, 10, 10] },
      { id: '4', label: 'SG4', timestamp: 'T4', values: [10, 11, 11, 10, 10, 11, 10, 10, 11, 12] },
    ];

    const result = calculateXbarS(subgroups);
    expect(result.overallMean).toBeGreaterThan(10);
    expect(result.secondaryLimits.cl).toBeGreaterThan(0);
    expect(result.primaryLimits.ucl).toBeGreaterThan(result.overallMean);
    expect(result.primaryLimits.lcl).toBeLessThan(result.overallMean);
    assertControlLimits(result.overallMean, result.primaryLimits.ucl, result.primaryLimits.lcl, 'X-bar (S) Limits');
  });

  it('calculates I-MR (Individuals and Moving Range) chart for single continuous observations', () => {
    // 8 sequential batch reactor temperatures
    const observations = [
      { label: 'B1', value: 182.4 },
      { label: 'B2', value: 183.1 },
      { label: 'B3', value: 182.9 },
      { label: 'B4', value: 183.5 },
      { label: 'B5', value: 182.8 },
      { label: 'B6', value: 183.2 },
      { label: 'B7', value: 183.0 },
      { label: 'B8', value: 183.4 },
    ];
    const result = calculateIMR(observations);

    expect(result.overallMean).toBeCloseTo(183.0375, 2);
    expect(result.secondaryLimits.cl).toBeGreaterThan(0);

    const mrBar = result.secondaryLimits.cl;
    // AIAG d2 constant for n=2 is 1.128; 3 / 1.128 = 2.66
    const expectedUcl = result.overallMean + 2.66 * mrBar;
    const expectedLcl = result.overallMean - 2.66 * mrBar;
    expect(result.primaryLimits.ucl).toBeCloseTo(expectedUcl, 1);
    expect(result.primaryLimits.lcl).toBeCloseTo(expectedLcl, 1);

    // Moving range limits: D4=3.267, D3=0
    expect(result.secondaryLimits.ucl).toBeCloseTo(3.267 * mrBar, 1);
    expect(result.secondaryLimits.lcl).toBe(0);
  });

  it('detects out-of-control conditions when subgroup points breach upper or lower control limits', () => {
    const normalSubgroups: SpcSubgroup[] = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      label: `SG${i}`,
      timestamp: `T${i}`,
      values: [100.1, 99.9, 100.0, 100.2, 99.8],
    }));

    // Add severe outlier
    const outlierSubgroup: SpcSubgroup = {
      id: 'outlier',
      label: 'SG_OUT',
      timestamp: 'T11',
      values: [105.0, 106.2, 104.9, 105.8, 105.5], // Mean > 105 (far above UCL ~ 100.3)
    };

    const chart = calculateXbarR([...normalSubgroups, outlierSubgroup]);
    const lastPoint = chart.primaryChart[chart.primaryChart.length - 1];

    expect(lastPoint.value).toBeGreaterThan(chart.primaryLimits.ucl);
    expect(lastPoint.outOfControl).toBe(true);
  });

  it('validates comprehensive plotting dataset structure for chart renderers', () => {
    const subgroups: SpcSubgroup[] = [
      { id: 'sub-01', label: 'Batch A', timestamp: '2026-11-14T08:00:00Z', values: [10.2, 10.4, 10.3] },
      { id: 'sub-02', label: 'Batch B', timestamp: '2026-11-14T09:00:00Z', values: [10.1, 10.2, 10.5] },
    ];

    const chart = calculateXbarR(subgroups);
    expect(chart.primaryChart.length).toBe(2);

    const first = chart.primaryChart[0];
    expect(first.label).toBe('Batch A');
    expect(first.value).toBeCloseTo(10.30, 2);
    expect(typeof first.outOfControl).toBe('boolean');
    expect(Array.isArray(first.violations)).toBe(true);
  });
});
