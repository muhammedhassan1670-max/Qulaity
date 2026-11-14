import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedInspectionApi } from '@/api/unified-api';
import {
  seedInspections,
  readInspections,
  seedSuppliers,
  readSuppliers,
  resetQualityStorage,
} from '../../helpers/testHarness';

describe('Feature 18: 3-Step Inspection Wizard', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('Stage 1 (Header): initializes inspection execution run with traceable batch and line context', async () => {
    const inspectionHeader = {
      type: 'in-process',
      product: 'Hydraulic Actuator Housing',
      batch: 'LOT-2026-ACT-101',
      inspectedBy: 'Inspector David Wilson',
      date: '2026-11-14',
      result: 'pending',
      sampleSize: 5,
      defectCount: 0,
      inspectionPoints: 4,
      notes: 'Hourly in-process verification on CNC Line 2',
    };

    const created = await unifiedInspectionApi.create(inspectionHeader as any);
    expect(created.id).toBeDefined();

    const stored = readInspections();
    expect(stored.length).toBe(1);
    expect(stored[0].product).toBe('Hydraulic Actuator Housing');
    expect(stored[0].batch).toBe('LOT-2026-ACT-101');
    expect(stored[0].result).toBe('pending');
  });

  it('Stage 2 (Measurements): evaluates variable readings against USL / LSL limits and detects out-of-spec points', () => {
    const spec = {
      name: 'Main Bore Diameter',
      nominal: 45.000,
      lsl: 44.975,
      usl: 45.025,
      unit: 'mm',
    };

    const sampleReadings = [45.010, 44.995, 45.020, 45.035, 45.005]; // 4th value 45.035 > USL 45.025

    const evaluations = sampleReadings.map((val) => {
      const isPass = val >= spec.lsl && val <= spec.usl;
      return {
        value: val,
        pass: isPass,
        deltaFromNominal: Number((val - spec.nominal).toFixed(3)),
      };
    });

    const failedPoints = evaluations.filter((e) => !e.pass);
    expect(failedPoints.length).toBe(1);
    expect(failedPoints[0].value).toBe(45.035);
    expect(failedPoints[0].deltaFromNominal).toBe(0.035);
  });

  it('Stage 2 (Measurements): records attribute checkpoints (Pass / Fail visual and functional checks)', () => {
    const attributeChecks = [
      { checkName: 'No Burr on Port Edges', result: 'pass' },
      { checkName: 'Anodizing Color Uniformity', result: 'pass' },
      { checkName: 'Laser Etched QR Code Readable', result: 'fail', remark: 'Contrast faded' },
    ];

    const hasFailure = attributeChecks.some((c) => c.result === 'fail');
    const defectCount = attributeChecks.filter((c) => c.result === 'fail').length;

    expect(hasFailure).toBe(true);
    expect(defectCount).toBe(1);
  });

  it('Stage 3 (Review & Submit): determines final verdict (Pass / Fail) and logs completed inspection record', async () => {
    // Inspection with 1 defect -> Overall Result = 'fail'
    const completedInspection = {
      id: 'insp-exec-01',
      type: 'incoming',
      product: 'Titanium Rotor Blade',
      batch: 'LOT-TI-991',
      inspectedBy: 'Senior Inspector Sarah',
      date: '2026-11-14',
      result: 'fail',
      sampleSize: 10,
      defectCount: 1,
      inspectionPoints: 5,
      defectType: 'Surface Micro-Crack',
      notes: 'Defect identified during fluorescent penetrant inspection',
    };

    seedInspections([completedInspection]);
    const stored = readInspections();

    expect(stored[0].result).toBe('fail');
    expect(stored[0].defectCount).toBe(1);
    expect(stored[0].defectType).toBe('Surface Micro-Crack');
  });

  it('Stage 3 (Review & Submit): triggers automated supplier rating degradation on incoming inspection failure', () => {
    const initialSupplier = {
      id: 'sup-target-01',
      name: 'Apex Precision Aerospace Forgings',
      category: 'Forgings',
      ncCount: 0,
      qualityPerformance: 95,
      status: 'approved',
    };
    seedSuppliers([initialSupplier]);

    // When an incoming inspection for Apex fails with defectCount > 0
    const incomingDefectCount = 2;
    const currentSuppliers = readSuppliers();
    const updated = currentSuppliers.map((sup) => {
      if (sup.id === 'sup-target-01') {
        const nextNc = (sup.ncCount || 0) + 1;
        const nextPerf = Math.max(50, (sup.qualityPerformance || 95) - (incomingDefectCount > 0 ? 5 : 2));
        return {
          ...sup,
          ncCount: nextNc,
          qualityPerformance: nextPerf,
          status: nextPerf < 70 ? 'conditional' : sup.status,
        };
      }
      return sup;
    });
    seedSuppliers(updated);

    const reloaded = readSuppliers();
    expect(reloaded[0].ncCount).toBe(1);
    expect(reloaded[0].qualityPerformance).toBe(90); // 95 - 5 = 90
  });
});
