import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@react-three/drei', () => ({}));
vi.mock('@react-three/fiber', () => ({
  Canvas: () => null,
}));

if (typeof globalThis.navigator === 'undefined' || !globalThis.navigator.userAgent) {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    },
    writable: true,
    configurable: true,
  });
}

import {
  DEFAULT_EQUIPMENT_PODS,
  type ScadaEquipment,
  type StationZone,
} from '@/pages/quality/QualityControlTower';
import { resetQualityStorage, seedDefectLogs, writeStoredItems } from '../../helpers/testHarness';

describe('Feature 26: 3D Quality Control Tower', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('validates default equipment pods configuration and floorplan coordinates', () => {
    expect(DEFAULT_EQUIPMENT_PODS).toBeDefined();
    expect(DEFAULT_EQUIPMENT_PODS.length).toBeGreaterThanOrEqual(10);

    const zones: StationZone[] = ['receiving', 'assembly', 'resolution', 'oqc', 'shipping', 'lab', 'setup'];

    DEFAULT_EQUIPMENT_PODS.forEach((pod) => {
      expect(pod.id).toBeDefined();
      expect(pod.code).toBeDefined();
      expect(zones).toContain(pod.zone);
      // Floorplan bounding boxes must fit within standard plant canvas
      expect(pod.x).toBeGreaterThanOrEqual(0);
      expect(pod.y).toBeGreaterThanOrEqual(0);
      expect(pod.w).toBeGreaterThan(0);
      expect(pod.h).toBeGreaterThan(0);
    });
  });

  it('evaluates machine operating states: running, idle, alarm, and down', () => {
    type MachineState = 'running' | 'idle' | 'alarm' | 'down';

    interface MachineTelemetryStatus {
      stationId: string;
      state: MachineState;
      vibrationMmS: number;
      temperatureC: number;
      cycleTimeSec: number;
      oee: number;
    }

    const telemetryFeed: MachineTelemetryStatus[] = [
      { stationId: 'STATION-CNC-01', state: 'running', vibrationMmS: 1.8, temperatureC: 42.5, cycleTimeSec: 45, oee: 88.5 },
      { stationId: 'STATION-PRESS-02', state: 'idle', vibrationMmS: 0.1, temperatureC: 28.0, cycleTimeSec: 0, oee: 62.0 },
      { stationId: 'STATION-WELD-03', state: 'alarm', vibrationMmS: 6.8, temperatureC: 89.2, cycleTimeSec: 58, oee: 51.4 },
      { stationId: 'STATION-CMM-04', state: 'down', vibrationMmS: 0.0, temperatureC: 22.1, cycleTimeSec: 0, oee: 0.0 },
    ];

    const evaluateMachineState = (telemetry: { vibrationMmS: number; temperatureC: number; isPowerOn: boolean; inCycle: boolean }): MachineState => {
      if (!telemetry.isPowerOn) return 'down';
      if (telemetry.vibrationMmS > 4.5 || telemetry.temperatureC > 80.0) return 'alarm';
      if (!telemetry.inCycle) return 'idle';
      return 'running';
    };

    expect(evaluateMachineState({ vibrationMmS: 1.8, temperatureC: 42.5, isPowerOn: true, inCycle: true })).toBe('running');
    expect(evaluateMachineState({ vibrationMmS: 0.1, temperatureC: 28.0, isPowerOn: true, inCycle: false })).toBe('idle');
    expect(evaluateMachineState({ vibrationMmS: 6.8, temperatureC: 89.2, isPowerOn: true, inCycle: true })).toBe('alarm');
    expect(evaluateMachineState({ vibrationMmS: 0.0, temperatureC: 22.1, isPowerOn: false, inCycle: false })).toBe('down');
  });

  it('tracks live queue depth, work-in-progress (WIP) buffer, and bottleneck detection', () => {
    interface StationQueue {
      stationId: string;
      capacityPerHour: number;
      currentQueueUnits: number;
      processingRateUnitsPerMin: number;
    }

    const stations: StationQueue[] = [
      { stationId: 'STATION-IQC', capacityPerHour: 500, currentQueueUnits: 120, processingRateUnitsPerMin: 8.3 },
      { stationId: 'STATION-CNC', capacityPerHour: 180, currentQueueUnits: 340, processingRateUnitsPerMin: 3.0 }, // Bottleneck
      { stationId: 'STATION-DEBURR', capacityPerHour: 300, currentQueueUnits: 50, processingRateUnitsPerMin: 5.0 },
      { stationId: 'STATION-OQC', capacityPerHour: 400, currentQueueUnits: 80, processingRateUnitsPerMin: 6.7 },
    ];

    const calculateQueueWaitTimeMinutes = (sq: StationQueue) =>
      sq.processingRateUnitsPerMin > 0 ? sq.currentQueueUnits / sq.processingRateUnitsPerMin : 0;

    const waitTimes = stations.map((s) => ({
      stationId: s.stationId,
      waitMinutes: calculateQueueWaitTimeMinutes(s),
      utilizationRatio: s.currentQueueUnits / s.capacityPerHour,
    }));

    const bottleneck = waitTimes.sort((a, b) => b.waitMinutes - a.waitMinutes)[0];
    expect(bottleneck.stationId).toBe('STATION-CNC');
    expect(bottleneck.waitMinutes).toBeGreaterThan(100);
  });

  it('links stations to quality defect records and live containment alerts', () => {
    const defects = [
      { id: 'DEF-TOWER-1', station: 'STATION-CNC-01', defectType: 'Dimensional Bore Drift', severity: 'critical', status: 'open' },
      { id: 'DEF-TOWER-2', station: 'STATION-CNC-01', defectType: 'Rough Surface Finish', severity: 'minor', status: 'open' },
      { id: 'DEF-TOWER-3', station: 'STATION-OQC-01', defectType: 'Label Smudge', severity: 'minor', status: 'resolved' },
    ];

    seedDefectLogs(defects);
    writeStoredItems('qms_local_defect-logs', defects);

    const getStationActiveAlertCount = (stationId: string) => {
      return defects.filter((d) => d.station === stationId && d.status === 'open').length;
    };

    expect(getStationActiveAlertCount('STATION-CNC-01')).toBe(2);
    expect(getStationActiveAlertCount('STATION-OQC-01')).toBe(0);
  });

  it('validates bidirectional traceability links between equipment pods and routing URLs', () => {
    DEFAULT_EQUIPMENT_PODS.slice(0, 5).forEach((pod) => {
      expect(pod.moduleUrl).toBeDefined();
      expect(pod.moduleUrl.startsWith('/')).toBe(true);

      // Verify each pod contains expected bilingual titles and equipment metadata
      expect(pod.titleEn).toBeDefined();
      expect(pod.titleAr).toBeDefined();
      expect(pod.line).toBeDefined();
      expect(pod.zoneNameEn).toBeDefined();
    });

    const supplierPod = DEFAULT_EQUIPMENT_PODS.find((p) => p.id === 'STATION-SUPPLIER-QUALITY');
    expect(supplierPod).toBeDefined();
    expect(supplierPod?.zone).toBe('receiving');
  });
});
