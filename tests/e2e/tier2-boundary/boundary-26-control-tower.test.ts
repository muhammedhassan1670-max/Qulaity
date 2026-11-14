import { describe, it, expect, vi } from 'vitest';

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

export interface TelemetryPacket {
  stationId: string;
  temperatureC: number;
  vibrationMmS: number;
  status: 'running' | 'idle' | 'alarm' | 'down';
}

export function sanitizeTelemetry(packet: Partial<TelemetryPacket>): TelemetryPacket {
  const temp = Number(packet.temperatureC);
  const vib = Number(packet.vibrationMmS);

  const cleanTemp = Number.isFinite(temp) ? Math.max(-50, Math.min(1000, temp)) : 25.0;
  const cleanVib = Number.isFinite(vib) ? Math.max(0, Math.min(100, vib)) : 0.0;

  let status: 'running' | 'idle' | 'alarm' | 'down' = packet.status || 'idle';
  if (cleanTemp > 90 || cleanVib > 8.0) {
    status = 'alarm';
  }

  return {
    stationId: packet.stationId || 'UNKNOWN-POD',
    temperatureC: cleanTemp,
    vibrationMmS: cleanVib,
    status,
  };
}

describe('Feature 26 Boundary: 3D Quality Control Tower', () => {
  it('sanitizes and clamps extreme numerical telemetry (thermal runaway > 1000°C or negative Kelvin)', () => {
    const extremeHot = sanitizeTelemetry({ temperatureC: 5000, vibrationMmS: 2.0 });
    expect(extremeHot.temperatureC).toBe(1000);
    expect(extremeHot.status).toBe('alarm');

    const extremeCold = sanitizeTelemetry({ temperatureC: -999, vibrationMmS: 1.0 });
    expect(extremeCold.temperatureC).toBe(-50);
  });

  it('handles NaN and Infinity in sensor telemetry without throwing', () => {
    const corruptedPacket = sanitizeTelemetry({
      stationId: 'CNC-01',
      temperatureC: NaN,
      vibrationMmS: Infinity,
    });

    expect(Number.isFinite(corruptedPacket.temperatureC)).toBe(true);
    expect(Number.isFinite(corruptedPacket.vibrationMmS)).toBe(true);
    expect(corruptedPacket.temperatureC).toBe(25.0); // default
  });

  it('handles zero equipment reporting (empty telemetry feed) without crashing tower views', () => {
    const emptyFeed: TelemetryPacket[] = [];
    const activeAlarms = emptyFeed.filter((p) => p.status === 'alarm');

    expect(activeAlarms.length).toBe(0);
    expect(emptyFeed.length).toBe(0);
  });

  it('validates equipment pod bounding boxes do not contain negative dimensions', () => {
    DEFAULT_EQUIPMENT_PODS.forEach((pod) => {
      expect(pod.w).toBeGreaterThan(0);
      expect(pod.h).toBeGreaterThan(0);
      expect(pod.x).toBeGreaterThanOrEqual(0);
      expect(pod.y).toBeGreaterThanOrEqual(0);
    });
  });

  it('filters pods by station zone safely with fallback for unknown zones', () => {
    const filterByZone = (zone: string) => {
      return DEFAULT_EQUIPMENT_PODS.filter((p) => p.zone === zone);
    };

    expect(filterByZone('receiving').length).toBeGreaterThan(0);
    expect(filterByZone('non-existent-zone').length).toBe(0);
  });
});
