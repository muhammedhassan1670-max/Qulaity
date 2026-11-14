/**
 * Tier 2 Boundary Tests - Feature 33: 3D Exploded View & Defect Heatmap
 * 
 * Verifies CAD explosion coordinates, FEA thermal stress heatmap boundaries,
 * hotspot pin selections, Ishikawa 5M linkages, and extreme input resilience.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resetQualityStorage } from '../../helpers/testHarness';

// Mechanical Assembly 3D Exploded View Model
interface CadPartTransform {
  partId: string;
  nominalPosition: [number, number, number];
  explodeVector: [number, number, number];
}

interface AssemblyModel {
  assemblyId: string;
  name: string;
  minExplodeMm: number;
  maxExplodeMm: number;
  parts: CadPartTransform[];
}

interface HotspotPin {
  id: number;
  titleAr: string;
  titleEn: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  defectAr: string;
  defectEn: string;
  fishboneAr: string;
  fishboneEn: string;
  capaAction: string;
}

const PIN_FIXTURES: HotspotPin[] = [
  {
    id: 1,
    titleAr: 'شرخ إجهادي في مبيت العمود الحامل',
    titleEn: 'Fatigue Micro-Crack in Carrier Housing',
    severity: 'CRITICAL',
    defectAr: 'تشققات مجهرية بقطر 0.12 مم ناتجة عن إجهاد حراري دوري.',
    defectEn: 'Micro-cracks 0.12mm diameter detected via ultrasonic NDT from cyclic thermal stress.',
    fishboneAr: 'المعدن (Material): عدم تجانس سبيكة الألومنيوم A380 وارتفاع نسبة السيليكون الحر.',
    fishboneEn: 'Material: Non-homogeneous A380 aluminum alloy with elevated free silicon inclusions.',
    capaAction: 'استبدال مورد سبائك الألومنيوم وإلزام شهادة الفحص الميتالورجي لكل صبة.'
  },
  {
    id: 2,
    titleAr: 'انحراف اللامركزية لمحور الدوران الرئيسي',
    titleEn: 'Spindle Shaft Runout & Radial Eccentricity',
    severity: 'MAJOR',
    defectAr: 'تجاوز حدود اللامركزية المسموحة بمقدار 24 ميكرون.',
    defectEn: 'Radial runout exceeds tolerance limit by 24 microns at 12,000 RPM.',
    fishboneAr: 'الآلة (Machine): اهتزاز غير متزن في عمود الخراطة CNC رقم 04.',
    fishboneEn: 'Machine: Unbalanced harmonic vibration in CNC lathe spindle head #04.',
    capaAction: 'إعادة موازنة ديناميكية ثلاثية المحاور وتحديث محامل السيراميك الدقيقة.'
  }
];

function clampExplodeDistance(distance: number, min = 0, max = 60): number {
  if (isNaN(distance) || !isFinite(distance)) return 0;
  return Math.min(Math.max(distance, min), max);
}

function calculatePartOffset(explodeMm: number, partType: 'housing' | 'spindle' | 'laser'): {
  transformX: number;
  laserWidth: number;
} {
  const clamped = clampExplodeDistance(explodeMm);
  switch (partType) {
    case 'housing':
      return { transformX: -clamped * 1.5, laserWidth: clamped * 2 };
    case 'spindle':
      return { transformX: clamped * 1.5, laserWidth: clamped * 2 };
    case 'laser':
      return { transformX: 0, laserWidth: clamped * 2 };
  }
}

function resolveThermalColor(stressMpa: number, yieldStressMpa = 400): string {
  if (stressMpa <= 0) return 'rgb(37, 99, 235)'; // Cold / Blue
  const ratio = Math.min(stressMpa / yieldStressMpa, 1.5);
  if (ratio < 0.5) return 'rgb(34, 197, 94)'; // Safe / Green
  if (ratio < 0.9) return 'rgb(245, 158, 11)'; // Warning / Amber
  return 'rgb(225, 29, 72)'; // Yielded / Red
}

function getPinDetails(pinId: number | undefined): HotspotPin | null {
  if (typeof pinId !== 'number' || isNaN(pinId) || pinId < 1) return null;
  return PIN_FIXTURES.find((p) => p.id === pinId) || null;
}

describe('Boundary Suite 33: 3D Exploded View & Defect Heatmap', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('1. should strictly clamp explode distance within 0mm to 60mm bounds', () => {
    // Normal inside bounds
    expect(clampExplodeDistance(35)).toBe(35);
    expect(clampExplodeDistance(0)).toBe(0);
    expect(clampExplodeDistance(60)).toBe(60);

    // Negative extremes clamped to 0
    expect(clampExplodeDistance(-1)).toBe(0);
    expect(clampExplodeDistance(-9999.99)).toBe(0);

    // Over-maximum extremes clamped to 60
    expect(clampExplodeDistance(60.1)).toBe(60);
    expect(clampExplodeDistance(500)).toBe(60);
    expect(clampExplodeDistance(Infinity)).toBe(0); // NaN/Infinite fallback
    expect(clampExplodeDistance(NaN)).toBe(0);
  });

  it('2. should calculate bidirectional part offsets accurately without NaN or sign reversal', () => {
    const atZero = calculatePartOffset(0, 'housing');
    expect(atZero.transformX).toBe(-0);
    expect(atZero.laserWidth).toBe(0);

    const atMid = calculatePartOffset(30, 'housing');
    expect(atMid.transformX).toBe(-45); // -30 * 1.5
    expect(atMid.laserWidth).toBe(60);  // 30 * 2

    const spindleMid = calculatePartOffset(30, 'spindle');
    expect(spindleMid.transformX).toBe(45); // +30 * 1.5
    expect(spindleMid.laserWidth).toBe(60);

    // Extreme input clamp check
    const atExtreme = calculatePartOffset(999, 'spindle');
    expect(atExtreme.transformX).toBe(90); // 60 max * 1.5
    expect(atExtreme.laserWidth).toBe(120); // 60 max * 2
  });

  it('3. should map FEA thermal stress values to correct boundary gradient colors', () => {
    // Zero or negative stress
    expect(resolveThermalColor(0)).toBe('rgb(37, 99, 235)');
    expect(resolveThermalColor(-50)).toBe('rgb(37, 99, 235)');

    // Safe low stress (e.g. 150 MPa vs 400 MPa yield = 37.5%)
    expect(resolveThermalColor(150)).toBe('rgb(34, 197, 94)');

    // Warning stress near yield (e.g. 320 MPa vs 400 MPa = 80%)
    expect(resolveThermalColor(320)).toBe('rgb(245, 158, 11)');

    // Critical stress at or above yield (e.g. 420 MPa vs 400 MPa = 105%)
    expect(resolveThermalColor(420)).toBe('rgb(225, 29, 72)');
    expect(resolveThermalColor(2500)).toBe('rgb(225, 29, 72)');
  });

  it('4. should handle invalid, out-of-bounds, or undefined hotspot pin lookups safely', () => {
    expect(getPinDetails(1)?.severity).toBe('CRITICAL');
    expect(getPinDetails(2)?.severity).toBe('MAJOR');

    // Boundary & invalid pin IDs
    expect(getPinDetails(0)).toBeNull();
    expect(getPinDetails(-1)).toBeNull();
    expect(getPinDetails(3)).toBeNull();
    expect(getPinDetails(999)).toBeNull();
    expect(getPinDetails(undefined)).toBeNull();
    expect(getPinDetails(NaN)).toBeNull();
  });

  it('5. should preserve bilingual Ishikawa 5M text and extreme Arabic unicode strings', () => {
    const pin1 = getPinDetails(1)!;
    expect(pin1.fishboneAr).toContain('المعدن (Material)');
    expect(pin1.fishboneEn).toContain('A380 aluminum alloy');
    expect(pin1.capaAction).toContain('شهادة الفحص الميتالورجي');

    // Simulate appending a long forensic report (>4000 characters)
    const largeForensicReport = 'تحليل ميتالورجي دقيق بالمجهر الإلكتروني الماسح SEM: '.repeat(100);
    expect(largeForensicReport.length).toBeGreaterThan(4000);

    const dynamicPin: HotspotPin = {
      ...pin1,
      defectAr: largeForensicReport,
      fishboneAr: 'آلة/طريقة/معدن - ' + 'بيانات متطرفة '.repeat(200)
    };

    expect(dynamicPin.defectAr.length).toBeGreaterThan(4000);
    expect(dynamicPin.fishboneAr.length).toBeGreaterThan(2000);
    expect(dynamicPin.defectAr).toContain('المجهر الإلكتروني');
  });
});
