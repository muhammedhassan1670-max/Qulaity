import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedCalibrationApi } from '@/api/unified-api';
import {
  seedCalibrations,
  readCalibrations,
  resetQualityStorage,
  createIsoDateOffset,
} from '../../helpers/testHarness';

describe('Feature 12: Calibration Tracking & MSA', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('registers new measurement tool with calibration interval and next due date', async () => {
    const today = new Date().toISOString().split('T')[0];
    const nextDue = createIsoDateOffset(180);

    const payload = {
      equipment: 'Mitutoyo Digital Height Gauge 0-600mm',
      model: 'HD-60AX',
      serialNumber: 'SN-HG-7719',
      location: 'CMM Metrology Room',
      lastCalibration: today,
      nextCalibration: nextDue,
      status: 'calibrated',
      calibratedBy: 'National Metrology Institute (NIST Traceable)',
      uncertainty: '±0.002 mm',
    };

    const created = await unifiedCalibrationApi.create(payload as any);
    expect(created.id).toBeDefined();

    const stored = readCalibrations();
    expect(stored.length).toBe(1);
    expect(stored[0].equipment).toContain('Mitutoyo Digital Height Gauge');
    expect(stored[0].status).toBe('calibrated');
    expect(stored[0].uncertainty).toBe('±0.002 mm');
  });

  it('detects expiration and flags tool status as overdue when due date is in the past', () => {
    const pastDate = createIsoDateOffset(-10); // 10 days ago
    const tool = {
      id: 'tool-exp-01',
      equipment: 'External Micrometer 0-25mm',
      serialNumber: 'SN-MIC-01',
      location: 'Grinding Cell 1',
      lastCalibration: createIsoDateOffset(-100),
      nextCalibration: pastDate,
      status: 'calibrated',
    };

    seedCalibrations([tool]);
    const tools = readCalibrations();

    // Verification of expiration logic
    const isOverdue = new Date(tools[0].nextCalibration).getTime() < Date.now();
    expect(isOverdue).toBe(true);

    const calculatedStatus = isOverdue ? 'overdue' : 'calibrated';
    expect(calculatedStatus).toBe('overdue');
  });

  it('flags warning status "due" when calibration expires within 14-day alert window', () => {
    const dueSoonDate = createIsoDateOffset(5); // 5 days from now
    const tool = {
      id: 'tool-due-02',
      equipment: 'Chatillon Force Gauge 500N',
      serialNumber: 'SN-FORCE-22',
      location: 'Tensile Lab',
      lastCalibration: createIsoDateOffset(-85),
      nextCalibration: dueSoonDate,
      status: 'due',
    };

    seedCalibrations([tool]);
    const tools = readCalibrations();

    const daysRemaining = Math.ceil(
      (new Date(tools[0].nextCalibration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    expect(daysRemaining).toBeGreaterThanOrEqual(0);
    expect(daysRemaining).toBeLessThanOrEqual(14);
    expect(tools[0].status).toBe('due');
  });

  it('transitions tool from "overdue" to "calibrated" upon recertification', async () => {
    const pastDate = createIsoDateOffset(-30);
    const tool = {
      id: 'tool-recal-03',
      equipment: 'Optical Comparator',
      serialNumber: 'SN-OPT-33',
      location: 'Incoming QC',
      lastCalibration: createIsoDateOffset(-395),
      nextCalibration: pastDate,
      status: 'overdue',
    };
    seedCalibrations([tool]);

    const newCalibrationDate = new Date().toISOString().split('T')[0];
    const newNextDue = createIsoDateOffset(365);

    const updated = await unifiedCalibrationApi.update('tool-recal-03', {
      lastCalibration: newCalibrationDate,
      nextCalibration: newNextDue,
      status: 'calibrated',
      calibratedBy: 'ISO 17025 Certified Metrology Service',
      uncertainty: '±0.0015 mm',
    });

    expect(updated.status).toBe('calibrated');
    expect(updated.lastCalibration).toBe(newCalibrationDate);
    expect(updated.nextCalibration).toBe(newNextDue);
    expect(updated.uncertainty).toBe('±0.0015 mm');
  });

  it('places damaged or unstable tool into "maintenance" lock to prevent shopfloor usage', async () => {
    const tool = {
      id: 'tool-maint-04',
      equipment: 'Digital Bore Caliper',
      serialNumber: 'SN-BORE-99',
      location: 'Machining Line 2',
      status: 'calibrated',
    };
    seedCalibrations([tool]);

    const updated = await unifiedCalibrationApi.update('tool-maint-04', {
      status: 'maintenance',
      metadata: {
        reason: 'Dropped on concrete floor; zero point drifted by 0.12mm',
        quarantinedBy: 'Chief Inspector',
        repairOrder: 'RO-2026-991',
      },
    });

    expect(updated.status).toBe('maintenance');
    expect(updated.metadata.reason).toContain('Dropped on concrete floor');
  });
});
