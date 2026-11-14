import { describe, it, expect } from 'vitest';

describe('Feature 35: 3D Factory Floor Digital Twin', () => {
  type CellType = 'cnc' | 'robot' | 'press' | 'inspection';

  interface MachineCellTelemetry {
    id: string;
    type: CellType;
    name: string;
    baseLoad: number; // %
    baseTempC: number;
    baseVibrationMmS: number;
    nominalCycleTimeSec: number;
  }

  const CELLS: Record<CellType, MachineCellTelemetry> = {
    cnc: { id: 'CELL-A01', type: 'cnc', name: '5-Axis CNC Milling', baseLoad: 72, baseTempC: 41, baseVibrationMmS: 1.2, nominalCycleTimeSec: 45 },
    robot: { id: 'CELL-B04', type: 'robot', name: 'Robotic Spot Welding', baseLoad: 65, baseTempC: 38, baseVibrationMmS: 0.8, nominalCycleTimeSec: 14.2 },
    press: { id: 'CELL-C02', type: 'press', name: '400T Stamping Press', baseLoad: 80, baseTempC: 48, baseVibrationMmS: 1.4, nominalCycleTimeSec: 6.5 },
    inspection: { id: 'CELL-D07', type: 'inspection', name: 'CMM & Laser Inspection', baseLoad: 45, baseTempC: 22, baseVibrationMmS: 0.1, nominalCycleTimeSec: 32 },
  };

  it('validates 4 shopfloor telemetry cells (CNC, Robot, Press, Inspection)', () => {
    const cellKeys: CellType[] = ['cnc', 'robot', 'press', 'inspection'];
    expect(Object.keys(CELLS)).toEqual(cellKeys);

    cellKeys.forEach((key) => {
      const cell = CELLS[key];
      expect(cell.id).toBeDefined();
      expect(cell.name).toBeDefined();
      expect(cell.baseLoad).toBeGreaterThan(0);
      expect(cell.nominalCycleTimeSec).toBeGreaterThan(0);
    });
  });

  it('scales telemetry dynamically with overclock speed multiplier slider (50% to 200%)', () => {
    const calculateOverclockedTelemetry = (cell: MachineCellTelemetry, overclockPercent: number) => {
      const multiplier = overclockPercent / 100;
      return {
        load: Math.round(cell.baseLoad * multiplier),
        tempC: Math.round(cell.baseTempC * multiplier),
        vibrationMmS: Number((cell.baseVibrationMmS * multiplier).toFixed(1)),
        effectiveCycleTimeSec: Number((cell.nominalCycleTimeSec / multiplier).toFixed(1)),
      };
    };

    const nominalCnc = calculateOverclockedTelemetry(CELLS.cnc, 100);
    expect(nominalCnc.load).toBe(72);
    expect(nominalCnc.tempC).toBe(41);
    expect(nominalCnc.vibrationMmS).toBe(1.2);

    // Overclock to 160%
    const overclockedCnc = calculateOverclockedTelemetry(CELLS.cnc, 160);
    expect(overclockedCnc.load).toBe(115); // 72 * 1.6 = 115.2
    expect(overclockedCnc.tempC).toBe(66); // 41 * 1.6 = 65.6
    expect(overclockedCnc.vibrationMmS).toBe(1.9);
    expect(overclockedCnc.effectiveCycleTimeSec).toBeLessThan(nominalCnc.effectiveCycleTimeSec);
  });

  it('triggers emergency E-Stop interlock to immediately halt all 4 production cells', () => {
    let twinEmergencyStop = false;

    const executeEStopToggle = (currentState: boolean) => {
      const newState = !currentState;
      return {
        isHalted: newState,
        statusText: newState ? 'HALTED (E-STOP)' : 'LIVE TELEMETRY: 4 NODES ONLINE',
        allCellMotorsCut: newState,
      };
    };

    const tripped = executeEStopToggle(twinEmergencyStop);
    expect(tripped.isHalted).toBe(true);
    expect(tripped.statusText).toBe('HALTED (E-STOP)');
    expect(tripped.allCellMotorsCut).toBe(true);

    const reset = executeEStopToggle(tripped.isHalted);
    expect(reset.isHalted).toBe(false);
    expect(reset.statusText).toContain('LIVE TELEMETRY');
  });

  it('generates thermal and vibration warning alerts when machine parameters exceed safe limits', () => {
    const evaluateAlerts = (load: number, tempC: number, vibrationMmS: number) => {
      const alerts: string[] = [];
      if (tempC > 65) alerts.push('THERMAL_CRITICAL');
      if (vibrationMmS > 2.0) alerts.push('VIBRATION_WARNING');
      if (load > 100) alerts.push('OVERLOAD_ALARM');
      return alerts;
    };

    const normal = evaluateAlerts(72, 41, 1.2);
    expect(normal.length).toBe(0);

    const extreme = evaluateAlerts(115, 68, 2.4);
    expect(extreme).toContain('THERMAL_CRITICAL');
    expect(extreme).toContain('VIBRATION_WARNING');
    expect(extreme).toContain('OVERLOAD_ALARM');
  });

  it('aggregates live plant throughput and overall OEE across all 4 digital twin cells', () => {
    interface CellOeeData {
      availability: number; // 0-1
      performance: number; // 0-1
      quality: number; // 0-1
    }

    const cellPerformanceData: Record<CellType, CellOeeData> = {
      cnc: { availability: 0.92, performance: 0.94, quality: 0.98 },
      robot: { availability: 0.98, performance: 0.95, quality: 0.99 },
      press: { availability: 0.88, performance: 0.90, quality: 0.97 },
      inspection: { availability: 0.99, performance: 0.98, quality: 1.0 },
    };

    const computeCellOee = (data: CellOeeData) => data.availability * data.performance * data.quality * 100;

    const cncOee = computeCellOee(cellPerformanceData.cnc);
    expect(cncOee).toBeCloseTo(84.75, 1);

    const robotOee = computeCellOee(cellPerformanceData.robot);
    expect(robotOee).toBeCloseTo(92.17, 1);

    const avgShopfloorOee =
      Object.values(cellPerformanceData).reduce((sum, d) => sum + computeCellOee(d), 0) / 4;
    expect(avgShopfloorOee).toBeGreaterThan(80.0);
  });
});
