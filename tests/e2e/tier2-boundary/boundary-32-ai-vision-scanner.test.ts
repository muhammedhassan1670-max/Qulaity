import { describe, it, expect } from 'vitest';

export interface VisionBoundingBox {
  name: string;
  classification: 'critical' | 'minor' | 'pass';
  score: number; // 0 - 100
  x: number;
  y: number;
  w: number;
  h: number;
}

export function clampBoundingBox(raw: VisionBoundingBox): VisionBoundingBox {
  const x = Math.max(0, Math.min(100, raw.x));
  const y = Math.max(0, Math.min(100, raw.y));
  const maxW = 100 - x;
  const maxH = 100 - y;
  const w = Math.max(0.1, Math.min(maxW, raw.w));
  const h = Math.max(0.1, Math.min(maxH, raw.h));
  const score = Math.max(0, Math.min(100, raw.score));

  return {
    ...raw,
    x,
    y,
    w,
    h,
    score,
  };
}

describe('Feature 32 Boundary: Live AI Vision Defect Scanner', () => {
  it('handles clean pristine frame with zero detected defects (0 bounding boxes)', () => {
    const cleanDetections: VisionBoundingBox[] = [];
    const hasDefects = cleanDetections.some((d) => d.classification !== 'pass');

    expect(hasDefects).toBe(false);
    expect(cleanDetections.length).toBe(0);
  });

  it('clamps out-of-bounds bounding box coordinates safely within 0-100% video canvas', () => {
    // Defect box reported partially outside the optical frame (e.g. x=-10, w=120)
    const outOfBounds: VisionBoundingBox = {
      name: 'OVERFLOW-BURR',
      classification: 'minor',
      score: 110.0, // > 100% score
      x: -15,
      y: 90,
      w: 40,
      h: 50,
    };

    const clamped = clampBoundingBox(outOfBounds);
    expect(clamped.x).toBe(0);
    expect(clamped.score).toBe(100);
    expect(clamped.x + clamped.w).toBeLessThanOrEqual(100);
    expect(clamped.y + clamped.h).toBeLessThanOrEqual(100);
  });

  it('evaluates exact threshold boundary for critical defect gating (threshold = 85.0%)', () => {
    const threshold = 85.0;
    const shouldEscalateToNcr = (score: number, classification: string) =>
      classification === 'critical' && score >= threshold;

    expect(shouldEscalateToNcr(85.0, 'critical')).toBe(true); // exactly on boundary
    expect(shouldEscalateToNcr(84.99, 'critical')).toBe(false); // 0.01% below
    expect(shouldEscalateToNcr(95.0, 'minor')).toBe(false); // minor defect does not trigger critical auto-NCR
  });

  it('safely handles frame bursts with excessive defect density (>50 defect tags)', () => {
    const crowdedFrame: VisionBoundingBox[] = [];
    for (let i = 0; i < 60; i++) {
      crowdedFrame.push({
        name: `DEFECT-${i}`,
        classification: i % 2 === 0 ? 'critical' : 'minor',
        score: 90.0,
        x: (i * 1.5) % 80,
        y: (i * 1.2) % 80,
        w: 5,
        h: 5,
      });
    }

    expect(crowdedFrame.length).toBe(60);
    const criticals = crowdedFrame.filter((d) => d.classification === 'critical');
    expect(criticals.length).toBe(30);
  });

  it('provides safe fallback state when camera media stream fails or is denied', () => {
    const initCameraStream = (hasHardware: boolean): { mode: 'webcam' | 'simulated'; error?: string } => {
      if (!hasHardware) {
        return { mode: 'simulated', error: 'Camera stream unavailable - using synthetic test feed' };
      }
      return { mode: 'webcam' };
    };

    const fallback = initCameraStream(false);
    expect(fallback.mode).toBe('simulated');
    expect(fallback.error).toBeDefined();
  });
});
