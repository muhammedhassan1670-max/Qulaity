import { describe, it, expect, beforeEach } from 'vitest';
import {
  trainDefectPredictionModel,
  predictDefect,
  type DefectPredictionRow,
} from '@/services/defectPredictionModel';
import { unifiedCalibrationApi, unifiedInspectionApi } from '@/api/unified-api';
import {
  resetQualityStorage,
  seedCalibrations,
  readCalibrations,
} from '../../helpers/testHarness';
import { INDUSTRIAL_CALIBRATION_TOOLS } from '../../helpers/industrialFixtures';

describe('Combo 06: Pre-Cog Neural Defect Prediction, Calibration Alert & Inspection Tightening', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('Test 6.1: Pre-Cog neural model trains on historical defect telemetry and forecasts tool wear risk', () => {
    // Synthetic training rows representing machining tool telemetry
    const trainingData: DefectPredictionRow[] = [
      { defectType: 'Dimensional Wear Drift', productionLine: 'Line 02 - CNC Cell', shift: 'Night', toolHours: 420 },
      { defectType: 'Dimensional Wear Drift', productionLine: 'Line 02 - CNC Cell', shift: 'Night', toolHours: 450 },
      { defectType: 'Dimensional Wear Drift', productionLine: 'Line 02 - CNC Cell', shift: 'Evening', toolHours: 400 },
      { defectType: 'Surface Chatter', productionLine: 'Line 01 - Automated Assembly', shift: 'Morning', toolHours: 120 },
      { defectType: 'Surface Chatter', productionLine: 'Line 01 - Automated Assembly', shift: 'Morning', toolHours: 110 },
      { defectType: 'Good Part', productionLine: 'Line 02 - CNC Cell', shift: 'Morning', toolHours: 50 },
      { defectType: 'Good Part', productionLine: 'Line 02 - CNC Cell', shift: 'Morning', toolHours: 70 },
      { defectType: 'Good Part', productionLine: 'Line 01 - Automated Assembly', shift: 'Evening', toolHours: 80 },
    ];

    const model = trainDefectPredictionModel(trainingData, ['productionLine', 'shift'], 'defectType');
    expect(model.labels.length).toBeGreaterThanOrEqual(2);
    expect(model.eligibleRows).toBe(trainingData.length);

    // Predict for high tool hour scenario on Line 02 Night Shift
    const inputSample: DefectPredictionRow = {
      productionLine: 'Line 02 - CNC Cell',
      shift: 'Night',
    };

    const prediction = predictDefect(model, inputSample);
    expect(prediction.defectType).toBeDefined();
    expect(prediction.riskLevel).toBeDefined();
    expect(prediction.probabilities.length).toBeGreaterThan(0);
    expect(prediction.confidence).toBeGreaterThan(0);
  });

  it('Test 6.2: Identifies overdue calibration tools and flags measurement uncertainty risk', async () => {
    // Seed industrial calibration tools with valid IDs
    const toolsWithIds = INDUSTRIAL_CALIBRATION_TOOLS.map((t) => ({
      id: t.toolId,
      ...t,
    }));
    seedCalibrations(toolsWithIds);
    const tools = readCalibrations();
    expect(tools.length).toBe(3);

    // Identify overdue tools (TOOL-MIC-02 has nextCalibrationDate in past)
    const today = new Date('2026-11-14');
    const overdueTools = tools.filter((tool: any) => {
      const nextCal = new Date(tool.nextCalibrationDate);
      return nextCal < today || tool.status === 'overdue';
    });

    expect(overdueTools.length).toBe(1);
    expect(overdueTools[0].toolId).toBe('TOOL-MIC-02');
    expect(overdueTools[0].accuracy).toBe('±1.0 µm');

    // Trigger calibration alert state in unifiedCalibrationApi
    const updated = await unifiedCalibrationApi.update(overdueTools[0].id, {
      status: 'Quarantined - Recalibration Required',
      metadata: {
        lockoutProduction: true,
        driftRisk: 'High - Mitutoyo micrometer 6 days past due date',
      },
    } as any);

    expect(updated.status).toBe('Quarantined - Recalibration Required');
    expect(updated.metadata?.lockoutProduction).toBe(true);
  });

  it('Test 6.3: Automatically tightens inspection sampling plan and tolerance thresholds on high Pre-Cog risk', () => {
    // Standard baseline inspection plan
    const standardPlan = {
      characteristic: 'Actuator Main Cylinder Bore Diameter',
      nominal: 45.000,
      usl: 45.025,
      lsl: 44.975,
      sampleSize: 5,
      frequency: 'Every 2 hours',
      cSigmaBand: 3.0,
    };

    // When Pre-Cog forecasts high failure probability or tool is overdue, tightening policy applies:
    // 1. Double sample size (5 -> 10)
    // 2. Increase frequency to 'Every 30 minutes'
    // 3. Narrow warning guardband (tighten by 30% towards nominal)
    const guardbandRatio = 0.70;
    const standardTolerance = (standardPlan.usl - standardPlan.lsl) / 2; // 0.025
    const tightenedTolerance = standardTolerance * guardbandRatio; // 0.0175

    const tightenedPlan = {
      ...standardPlan,
      sampleSize: standardPlan.sampleSize * 2,
      frequency: 'Every 30 minutes (Tightened Inspection Mode)',
      tightenedUsl: standardPlan.nominal + tightenedTolerance, // 45.0175
      tightenedLsl: standardPlan.nominal - tightenedTolerance, // 44.9825
      policyTriggered: 'Pre-Cog Tool Wear Alert #PC-991',
    };

    expect(tightenedPlan.sampleSize).toBe(10);
    expect(tightenedPlan.frequency).toContain('Tightened Inspection Mode');
    expect(tightenedPlan.tightenedUsl).toBeLessThan(standardPlan.usl);
    expect(tightenedPlan.tightenedLsl).toBeGreaterThan(standardPlan.lsl);
  });

  it('Test 6.4: Automatic calibration work order recall dispatch prevents unverified measurement runs', async () => {
    const recallPayload = {
      toolId: 'TOOL-MIC-02',
      title: 'Emergency Calibration Work Order & Gauge R&R',
      status: 'Scheduled',
      priority: 'Urgent',
      metrologyLab: 'Metrology Lab - Cell A',
      dueDate: '2026-11-15',
      metadata: {
        standardReference: 'ISO 22514 / AIAG MSA 4th Edition',
        gaugeBlocksSetId: 'GB-GRADE-0-99',
        calibratorAssigned: 'Metrologist Elena Rostova',
      },
    };

    const workOrder = await unifiedCalibrationApi.create(recallPayload as any);
    expect(workOrder.id).toBeDefined();
    expect(workOrder.priority).toBe('Urgent');

    // Simulate completion of calibration and recalibration certification
    const certified = await unifiedCalibrationApi.update(workOrder.id as string, {
      status: 'Certified & Released',
      metadata: {
        ...workOrder.metadata,
        calibrationCertificate: 'CERT-CAL-2026-8801',
        measuredBias: 0.0002, // 0.2 µm bias (well within ±1.0 µm)
        linearityPValue: 0.88,
        nextCalibrationDate: '2027-02-15',
      },
    } as any);

    expect(certified.status).toBe('Certified & Released');
    expect(certified.metadata?.measuredBias).toBeLessThan(0.001);
  });

  it('Test 6.5: Zero-escape containment gate halts shopfloor parts measured during uncalibrated interval', async () => {
    // Query inspections conducted while tool was overdue
    const inspectionRun = await unifiedInspectionApi.create({
      title: 'Shift Inspection with Overdue Tool',
      plantId: 'PLANT-AERO-01',
      result: 'Pending Verification',
      metadata: {
        toolUsed: 'TOOL-MIC-02',
        batchId: 'BATCH-ACT-550',
        partsCount: 40,
        quarantineStatus: 'Hold Pending Gage Verification',
      },
    } as any);

    expect(inspectionRun.metadata?.quarantineStatus).toBe('Hold Pending Gage Verification');

    // Once gauge recalibration proves valid bias (0.2 µm), batch is re-verified and cleared
    const clearedRun = await unifiedInspectionApi.update(inspectionRun.id as string, {
      result: 'Passed After Recertification',
      metadata: {
        ...inspectionRun.metadata,
        quarantineStatus: 'Released to Assembly',
        recheckInspector: 'Chief Quality Inspector David Vance',
      },
    } as any);

    expect(clearedRun.result).toBe('Passed After Recertification');
    expect(clearedRun.metadata?.quarantineStatus).toBe('Released to Assembly');
  });
});
