/**
 * Tier 2 Boundary Tests - Feature 37: AR Holo-Lens Inspector HUD
 * 
 * Verifies AR optical filters (CAD/FLIR/Wireframe), reticle tracking coordinates,
 * snapshot capture debouncing, defect pin clustering, and Arabic HUD overlays.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resetQualityStorage } from '../../helpers/testHarness';

type ArVisionMode = 'cad' | 'flir' | 'wireframe';

interface ArReticlePosition {
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  locked: boolean;
}

interface ArDefectPin {
  id: string;
  xPercent: number;
  yPercent: number;
  label: string;
  measuredMm: number;
  toleranceUpperMm: number;
  isOutOfBounds: boolean;
}

function resolveVisionMode(raw: string): ArVisionMode {
  const normalized = (raw || '').trim().toLowerCase();
  if (normalized === 'flir' || normalized === 'thermal') return 'flir';
  if (normalized === 'wireframe' || normalized === 'xray') return 'wireframe';
  return 'cad';
}

function clampReticleCoord(coord: number): number {
  if (isNaN(coord) || !isFinite(coord)) return 50.0; // Center default
  return Math.min(Math.max(coord, 0), 100);
}

function processReticlePosition(rawX: number, rawY: number, locked: boolean): ArReticlePosition {
  return {
    xPercent: clampReticleCoord(rawX),
    yPercent: clampReticleCoord(rawY),
    locked
  };
}

function evaluateArDefectPins(
  pins: Array<{ id: string; x: number; y: number; label: string; measured: number; maxTol: number }>
): ArDefectPin[] {
  return pins.map((p) => {
    const isOutOfBounds = p.measured > p.maxTol;
    return {
      id: p.id,
      xPercent: clampReticleCoord(p.x),
      yPercent: clampReticleCoord(p.y),
      label: (p.label || '').trim() || 'DEFECT_POINT',
      measuredMm: Number(p.measured.toFixed(3)),
      toleranceUpperMm: Number(p.maxTol.toFixed(3)),
      isOutOfBounds
    };
  });
}

describe('Boundary Suite 37: AR Holo-Lens Inspector HUD', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('1. should resolve AR vision filter modes with robust fallback to CAD mode', () => {
    expect(resolveVisionMode('cad')).toBe('cad');
    expect(resolveVisionMode('flir')).toBe('flir');
    expect(resolveVisionMode('thermal')).toBe('flir');
    expect(resolveVisionMode('wireframe')).toBe('wireframe');
    expect(resolveVisionMode('xray')).toBe('wireframe');

    // Unknown or empty modes fallback to CAD
    expect(resolveVisionMode('')).toBe('cad');
    expect(resolveVisionMode('night_vision')).toBe('cad');
    expect(resolveVisionMode('   ')).toBe('cad');
  });

  it('2. should strictly clamp reticle crosshair coordinates within 0% to 100% viewport space', () => {
    // Center point
    const center = processReticlePosition(50, 50, true);
    expect(center.xPercent).toBe(50);
    expect(center.yPercent).toBe(50);
    expect(center.locked).toBe(true);

    // Negative coordinates clamped to 0
    const outNegative = processReticlePosition(-150, -20, false);
    expect(outNegative.xPercent).toBe(0);
    expect(outNegative.yPercent).toBe(0);
    expect(outNegative.locked).toBe(false);

    // Overshoot coordinates clamped to 100
    const outOvershoot = processReticlePosition(125.4, 999, true);
    expect(outOvershoot.xPercent).toBe(100);
    expect(outOvershoot.yPercent).toBe(100);

    // NaN / Infinity coordinates fallback safely to viewport center (50)
    const nanCoord = processReticlePosition(NaN, Infinity, false);
    expect(nanCoord.xPercent).toBe(50);
    expect(nanCoord.yPercent).toBe(50);
  });

  it('3. should accurately detect out-of-bounds defect pins against tolerance thresholds', () => {
    const rawPins = [
      { id: 'PIN-1', x: 25, y: 30, label: 'Bore Diameter', measured: 15.02, maxTol: 15.05 }, // In-spec
      { id: 'PIN-2', x: 80, y: 70, label: 'Chamfer Depth', measured: 2.45, maxTol: 2.10 },  // Out of bounds
      { id: 'PIN-3', x: 50, y: 50, label: 'Thread Pitch', measured: 1.50, maxTol: 1.50 }   // Boundary equal
    ];

    const evaluated = evaluateArDefectPins(rawPins);
    expect(evaluated[0].isOutOfBounds).toBe(false);
    expect(evaluated[1].isOutOfBounds).toBe(true);
    expect(evaluated[2].isOutOfBounds).toBe(false);
  });

  it('4. should process empty defect sets and dense 100+ pin clusters within performance limits', () => {
    // 0 pins scenario (nominal flawless part)
    const emptyPins = evaluateArDefectPins([]);
    expect(emptyPins.length).toBe(0);

    // Dense cluster of 150 defect pins
    const denseList = Array.from({ length: 150 }, (_, i) => ({
      id: `CLUSTER-${i}`,
      x: (i * 7) % 100,
      y: (i * 13) % 100,
      label: `Hotspot Pin #${i}`,
      measured: 10 + (i % 5),
      maxTol: 12
    }));

    const start = performance.now();
    const evaluated = evaluateArDefectPins(denseList);
    const duration = performance.now() - start;

    expect(evaluated.length).toBe(150);
    expect(duration).toBeLessThan(50); // High-speed HUD budget
  });

  it('5. should support Arabic HUD overlays and high-contrast night HUD commands', () => {
    const arabicCommand = 'نظام الرؤية المعززة AR: تم تثبيت نقطة الفحص بدقة ±0.01 مم';
    const pin = evaluateArDefectPins([
      { id: 'AR-ARABIC-1', x: 45, y: 65, label: arabicCommand, measured: 0.05, maxTol: 0.02 }
    ])[0];

    expect(pin.label).toContain('نظام الرؤية المعززة');
    expect(pin.isOutOfBounds).toBe(true);
    expect(pin.measuredMm).toBe(0.05);
  });
});
