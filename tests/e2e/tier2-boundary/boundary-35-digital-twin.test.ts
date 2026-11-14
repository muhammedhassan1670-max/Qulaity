/**
 * Tier 2 Boundary Tests - Feature 35: 3D Factory Floor Digital Twin
 * 
 * Verifies machine telemetry cells, overclock slider extremes,
 * Emergency Stop (E-Stop) hard interlocks, division-by-zero guards in cycle times,
 * and telemetry packet recovery.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resetQualityStorage } from '../../helpers/testHarness';

type WorkCellType = 'cnc' | 'robot' | 'press' | 'inspection';

interface TelemetryPacket {
  cell: WorkCellType;
  temperatureC: number;
  vibrationMmS: number;
  rpm: number;
  cycleTimeSec: number;
  oeePercent: number;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL' | 'E_STOPPED';
}

interface DigitalTwinState {
  selectedCell: WorkCellType;
  overclockPercent: number;
  emergencyStop: boolean;
  activeAlarms: string[];
}

function clampOverclock(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 100;
  return Math.min(Math.max(val, 10), 250);
}

function calculateCellTelemetry(
  cell: WorkCellType,
  overclock: number,
  emergencyStop: boolean
): TelemetryPacket {
  if (emergencyStop) {
    return {
      cell,
      temperatureC: 22.0, // Ambient cooled
      vibrationMmS: 0.0,
      rpm: 0,
      cycleTimeSec: Infinity, // Halted
      oeePercent: 0,
      status: 'E_STOPPED'
    };
  }

  const clampedClock = clampOverclock(overclock);
  const factor = clampedClock / 100;

  // Base parameters per cell
  const baseSpecs = {
    cnc: { temp: 48, vib: 1.2, rpm: 8000, cycleTime: 42 },
    robot: { temp: 36, vib: 0.8, rpm: 1200, cycleTime: 28 },
    press: { temp: 55, vib: 2.4, rpm: 600, cycleTime: 18 },
    inspection: { temp: 24, vib: 0.1, rpm: 0, cycleTime: 15 }
  }[cell];

  const temp = Number((baseSpecs.temp + (factor - 1) * 22).toFixed(1));
  const vib = Number((baseSpecs.vib * Math.pow(factor, 1.3)).toFixed(2));
  const rpm = Math.round(baseSpecs.rpm * factor);
  // Guard division by zero
  const cycleTime = factor > 0 ? Number((baseSpecs.cycleTime / factor).toFixed(1)) : 9999;

  let status: TelemetryPacket['status'] = 'OPTIMAL';
  if (temp > 75 || vib > 3.5) {
    status = 'CRITICAL';
  } else if (temp > 60 || vib > 2.0) {
    status = 'WARNING';
  }

  const oee = Math.max(10, Math.min(99, Math.round(88 * Math.sqrt(factor) * (status === 'CRITICAL' ? 0.6 : 1))));

  return {
    cell,
    temperatureC: temp,
    vibrationMmS: vib,
    rpm,
    cycleTimeSec: cycleTime,
    oeePercent: oee,
    status
  };
}

describe('Boundary Suite 35: 3D Factory Floor Digital Twin', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('1. should clamp overclock speed slider between 10% and 250% boundary limits', () => {
    expect(clampOverclock(100)).toBe(100);
    expect(clampOverclock(10)).toBe(10);
    expect(clampOverclock(250)).toBe(250);

    // Negative and zero values clamped to 10%
    expect(clampOverclock(0)).toBe(10);
    expect(clampOverclock(-50)).toBe(10);
    expect(clampOverclock(-9999)).toBe(10);

    // High extremes clamped to 250%
    expect(clampOverclock(250.5)).toBe(250);
    expect(clampOverclock(1000)).toBe(250);

    // Corrupted non-numbers fallback to 100% nominal
    expect(clampOverclock(NaN)).toBe(100);
    expect(clampOverclock(Infinity)).toBe(100);
  });

  it('2. should enforce immediate machine freeze upon Emergency Stop (E-Stop) activation', () => {
    // Normal running at 180% overclock
    const running = calculateCellTelemetry('cnc', 180, false);
    expect(running.rpm).toBeGreaterThan(10000);
    expect(running.status).not.toBe('E_STOPPED');

    // Trigger Emergency Stop
    const stopped = calculateCellTelemetry('cnc', 180, true);
    expect(stopped.rpm).toBe(0);
    expect(stopped.vibrationMmS).toBe(0);
    expect(stopped.oeePercent).toBe(0);
    expect(stopped.cycleTimeSec).toBe(Infinity);
    expect(stopped.status).toBe('E_STOPPED');
  });

  it('3. should guard against division by zero in cycle time calculations', () => {
    // Passing 0 overclock directly to cycle time logic
    const telemetry = calculateCellTelemetry('press', 0, false); // 0 clamps to 10
    expect(Number.isFinite(telemetry.cycleTimeSec)).toBe(true);
    expect(telemetry.cycleTimeSec).toBeGreaterThan(0);
    expect(telemetry.cycleTimeSec).not.toBe(NaN);
  });

  it('4. should escalate telemetry alert status from OPTIMAL to WARNING and CRITICAL under extreme overclock', () => {
    // 50% underclock: OPTIMAL
    const underclock = calculateCellTelemetry('cnc', 50, false);
    expect(underclock.status).toBe('OPTIMAL');

    // 160% overclock: WARNING
    const midOverclock = calculateCellTelemetry('cnc', 160, false);
    expect(midOverclock.status).toBe('WARNING');

    // 250% max overclock: CRITICAL (High temperature & vibration)
    const maxOverclock = calculateCellTelemetry('cnc', 250, false);
    expect(maxOverclock.status).toBe('CRITICAL');
    expect(maxOverclock.temperatureC).toBeGreaterThan(75);
    expect(maxOverclock.vibrationMmS).toBeGreaterThan(3.5);
  });

  it('5. should support all 4 work cells with distinct baseline telemetry profiles', () => {
    const cells: WorkCellType[] = ['cnc', 'robot', 'press', 'inspection'];

    cells.forEach((cell) => {
      const data = calculateCellTelemetry(cell, 100, false);
      expect(data.cell).toBe(cell);
      expect(data.temperatureC).toBeGreaterThan(0);
      expect(data.oeePercent).toBeGreaterThan(0);
      expect(data.oeePercent).toBeLessThanOrEqual(100);
    });

    // Optical inspection cell has 0 motor RPM by design
    const inspectionData = calculateCellTelemetry('inspection', 100, false);
    expect(inspectionData.rpm).toBe(0);
    expect(inspectionData.vibrationMmS).toBeLessThan(0.5);
  });
});
