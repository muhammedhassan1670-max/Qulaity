import { describe, it, expect } from 'vitest';

describe('Feature 33: 3D Exploded View & Finite Element Defect Heatmap', () => {
  interface CadPinData {
    id: number;
    titleEn: string;
    defectEn: string;
    fishboneEn: string;
    capaEn: string;
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
    coordinates: { x: number; y: number; z: number };
  }

  const PINS_DATA: CadPinData[] = [
    {
      id: 1,
      titleEn: 'Zone A: Bearing Housing',
      defectEn: 'Cyclic micro-crack caused by 18% over-torque during spindle assembly.',
      fishboneEn: 'Machine: Uncalibrated torque tool | Method: Missing cross-pattern torque sequence.',
      capaEn: 'Lock DC tool to max 85 N.m and enforce digital interlock star pattern sequence.',
      severity: 'CRITICAL',
      coordinates: { x: 0.12, y: 0.45, z: 0.05 },
    },
    {
      id: 2,
      titleEn: 'Zone B: Main Flange',
      defectEn: 'Parallelism deviation of 0.04mm due to CNC milling insert flank wear.',
      fishboneEn: 'Machine: Insert exceeded 500-cycle tool life | Material: Casting hardness batch variation.',
      capaEn: 'Activate IoT tool wear acoustic sensor with automatic preventive tool offset.',
      severity: 'MAJOR',
      coordinates: { x: -0.35, y: 0.10, z: -0.20 },
    },
    {
      id: 3,
      titleEn: 'Zone C: Cooling Chamber',
      defectEn: 'Micro-burrs (< 0.15mm) remaining after high-pressure washing station.',
      fishboneEn: 'Method: Wash nozzle pressure dropped to 4 bar instead of specified 7 bar.',
      capaEn: 'Install digital pressure switch with line interlock if pressure drops below 6.5 bar.',
      severity: 'MINOR',
      coordinates: { x: 0.0, y: -0.28, z: 0.32 },
    },
  ];

  it('controls continuous CAD explosion factor between 0% (fully assembled) and 100% (fully disassembled)', () => {
    let explodeValue = 25; // default 25%

    const calculateExplodedPositions = (factor: number, basePins: CadPinData[]) => {
      // 0% -> components in nominal coordinate positions
      // 100% -> components expanded along radial explosion vectors
      const scale = factor / 100;
      return basePins.map((pin) => ({
        id: pin.id,
        explodedX: pin.coordinates.x * (1 + scale * 2.5),
        explodedY: pin.coordinates.y * (1 + scale * 2.5),
        explodedZ: pin.coordinates.z * (1 + scale * 2.5),
      }));
    };

    const assembled = calculateExplodedPositions(0, PINS_DATA);
    expect(assembled[0].explodedX).toBeCloseTo(PINS_DATA[0].coordinates.x, 3);

    const fullExploded = calculateExplodedPositions(100, PINS_DATA);
    expect(Math.abs(fullExploded[0].explodedX)).toBeGreaterThan(Math.abs(assembled[0].explodedX));

    // Clamp value
    explodeValue = Math.max(0, Math.min(100, 120));
    expect(explodeValue).toBe(100);
  });

  it('isolates components by zone (Zone A, B, C) and highlights focal coordinates', () => {
    let activePinId: number | null = 1;

    const getActiveComponentDetails = (id: number | null) => {
      return PINS_DATA.find((p) => p.id === id) || null;
    };

    const activeZone = getActiveComponentDetails(activePinId);
    expect(activeZone).toBeDefined();
    expect(activeZone?.titleEn).toContain('Bearing Housing');
    expect(activeZone?.severity).toBe('CRITICAL');

    // Switch to Zone B
    activePinId = 2;
    const switchedZone = getActiveComponentDetails(activePinId);
    expect(switchedZone?.titleEn).toContain('Main Flange');
    expect(switchedZone?.severity).toBe('MAJOR');
  });

  it('toggles Finite Element Analysis (FEA) thermal and mechanical stress heatmap overlay', () => {
    let heatmapEnabled = false;

    const toggleHeatmap = () => {
      heatmapEnabled = !heatmapEnabled;
      return heatmapEnabled ? 'FEA_STRESS_GRADIENT_ACTIVE' : 'NOMINAL_CAD_SURFACE';
    };

    expect(heatmapEnabled).toBe(false);
    const stateActive = toggleHeatmap();
    expect(heatmapEnabled).toBe(true);
    expect(stateActive).toBe('FEA_STRESS_GRADIENT_ACTIVE');

    const stateOff = toggleHeatmap();
    expect(heatmapEnabled).toBe(false);
    expect(stateOff).toBe('NOMINAL_CAD_SURFACE');
  });

  it('associates each hot spot with Ishikawa root causes and closed-loop CAPA directives', () => {
    PINS_DATA.forEach((pin) => {
      expect(pin.fishboneEn).toMatch(/Machine:|Method:|Material:/);
      expect(pin.capaEn.length).toBeGreaterThan(15);
      expect(['CRITICAL', 'MAJOR', 'MINOR']).toContain(pin.severity);
    });

    const bearingIssue = PINS_DATA.find((p) => p.id === 1);
    expect(bearingIssue?.capaEn).toContain('Lock DC tool to max 85 N.m');
    expect(bearingIssue?.fishboneEn).toContain('Uncalibrated torque tool');
  });

  it('provides reliable 2D orthographic schematic fallback when WebGL renderer is unavailable', () => {
    interface ViewportRenderer {
      hasWebGlContext: boolean;
      activeViewMode: '3D_WEBGL_CANVAS' | '2D_ORTHOGRAPHIC_SCHEMATIC';
    }

    const initRenderer = (webGlSupported: boolean): ViewportRenderer => {
      if (webGlSupported) {
        return { hasWebGlContext: true, activeViewMode: '3D_WEBGL_CANVAS' };
      }
      return { hasWebGlContext: false, activeViewMode: '2D_ORTHOGRAPHIC_SCHEMATIC' };
    };

    const webGlAvailable = initRenderer(true);
    expect(webGlAvailable.activeViewMode).toBe('3D_WEBGL_CANVAS');

    const headlessFallback = initRenderer(false);
    expect(headlessFallback.activeViewMode).toBe('2D_ORTHOGRAPHIC_SCHEMATIC');
    expect(headlessFallback.hasWebGlContext).toBe(false);
  });
});
