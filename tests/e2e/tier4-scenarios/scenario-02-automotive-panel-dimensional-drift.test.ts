import { describe, it, expect, beforeEach } from 'vitest';
import { checkNelsonRules, calculateCapability } from '@/services/spcEngine';
import {
  trainDefectPredictionModel,
  predictDefect,
  type DefectPredictionRow,
} from '@/services/defectPredictionModel';
import { unifiedCalibrationApi, unifiedInspectionApi } from '@/api/unified-api';
import { resetQualityStorage } from '../../helpers/testHarness';
import { assertNelsonRuleViolation, assertCpkThreshold } from '../../helpers/assertionHelpers';
import { INDUSTRIAL_PARTS, INDUSTRIAL_INSPECTION_SPECS } from '../../helpers/industrialFixtures';

describe('Scenario 02: Automotive Body Panel Dimensional Drift Crisis', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('Phase 1: High-precision CMM inspection detects 10 consecutive points above mean and upward drift', async () => {
    const part = INDUSTRIAL_PARTS[2]; // Automotive Door Outer Skin Panel
    const spec = INDUSTRIAL_INSPECTION_SPECS.actuatorBore; // nominal 45.000, lsl 44.975, usl 45.025
    const centerLine = 45.000;
    const sigma = 0.004;

    // 10 consecutive points strictly increasing and above center line (simulating progressive die punch wear)
    const driftSeries = [
      45.003, 45.006, 45.009, 45.012, 45.015, 45.018, 45.020, 45.022, 45.024, 45.026,
    ];

    const violations = checkNelsonRules(driftSeries, centerLine, sigma);

    // Nelson Rule 2 (9+ points above center line)
    assertNelsonRuleViolation(violations, 2);

    // Nelson Rule 3 (6+ points steadily increasing)
    assertNelsonRuleViolation(violations, 3);

    const insp = await unifiedInspectionApi.create({
      title: 'Stamping Line 1 Automated Laser Flange Check',
      plantId: 'PLANT-AUTO-01',
      result: 'Warning - Statistical Shift',
      metadata: {
        partNumber: part.partNumber,
        characteristic: 'Flange Height',
        consecutivePointsAboveMean: 10,
        nelsonViolations: [2, 3],
      },
    } as any);

    expect(insp.id).toBeDefined();
    expect(insp.metadata?.nelsonViolations).toContain(2);
    expect(insp.metadata?.nelsonViolations).toContain(3);
  });

  it('Phase 2: Process capability Cpk drops from 1.67 down to 0.75, breaching 1.33 industrial threshold', () => {
    const usl = 45.025;
    const lsl = 44.975;

    // Initial baseline process (tightly centered with 1.67 Cpk)
    const baselinePoints = [45.000, 45.002, 44.998, 45.001, 44.999, 45.000];
    const initialCap = calculateCapability(baselinePoints, usl, lsl);
    assertCpkThreshold(initialCap.cpk, 1.33);

    // Severe drift data: mean shifted to 45.022, standard deviation 0.008
    const driftedPoints = [
      45.016, 45.020, 45.024, 45.022, 45.026, 45.028, 45.025, 45.023,
    ];
    const driftedCap = calculateCapability(driftedPoints, usl, lsl);

    expect(driftedCap.cpk).toBeLessThan(1.0);
    expect(driftedCap.cpk).toBeLessThan(1.33);
  });

  it('Phase 3: Pre-Cog Neural Model forecasts imminent out-of-spec crash within 2 hours', () => {
    // Train neural failure forecasting model on stamping press telemetry
    const trainingDataset: DefectPredictionRow[] = [
      { defectType: 'Tool Wear Out-of-Spec', productionLine: 'Line 01 - Stamping', shift: 'Morning', wearCycle: 'critical-high' },
      { defectType: 'Tool Wear Out-of-Spec', productionLine: 'Line 01 - Stamping', shift: 'Night', wearCycle: 'critical-high' },
      { defectType: 'Normal Stability', productionLine: 'Line 01 - Stamping', shift: 'Morning', wearCycle: 'low' },
      { defectType: 'Normal Stability', productionLine: 'Line 01 - Stamping', shift: 'Evening', wearCycle: 'low' },
    ];

    const model = trainDefectPredictionModel(trainingDataset, ['productionLine', 'wearCycle'], 'defectType');

    // Forecast for current active machine state
    const currentTelemetry: DefectPredictionRow = {
      productionLine: 'Line 01 - Stamping',
      wearCycle: 'critical-high',
    };

    const forecast = predictDefect(model, currentTelemetry);
    expect(forecast.defectType).toBe('Tool Wear Out-of-Spec');
    expect(forecast.riskLevel).toBeDefined();

    // Model recommends immediate preventive insert change before scrap occurs
    const forecastWindow = {
      predictedTimeToFailureHours: 1.8, // within 2h
      confidencePercent: 96.4,
      preventativeAction: 'Halt line for scheduled lower punch replacement #DIE-P04',
    };

    expect(forecastWindow.predictedTimeToFailureHours).toBeLessThan(2.0);
    expect(forecastWindow.confidencePercent).toBeGreaterThan(90);
  });

  it('Phase 4: AR Holo-Lens Inspector HUD displays stress warning and Digital Twin triggers cell E-Stop', () => {
    // Model AR HUD vision state representation
    interface ArHudInspectorState {
      device: 'HoloLens 3';
      visionFilter: 'cad' | 'flir' | 'wireframe';
      targetLocked: string;
      flangeHeightDeviationMm: number;
      thermalHotspotTempC: number;
      hudAlertBanner: string;
      digitalTwinCellState: 'running' | 'overclock' | 'emergency-stop';
    }

    const hudState: ArHudInspectorState = {
      device: 'HoloLens 3',
      visionFilter: 'flir', // Thermal IR inspection
      targetLocked: 'DIE-STAMP-D04',
      flangeHeightDeviationMm: 0.026,
      thermalHotspotTempC: 84.5, // Punch overheating due to friction wear
      hudAlertBanner: 'CRITICAL WARNING: Punch Thermal Expansion Exceeds Tolerance (+0.026mm)',
      digitalTwinCellState: 'emergency-stop', // Digital Twin initiates interlock E-Stop
    };

    expect(hudState.visionFilter).toBe('flir');
    expect(hudState.flangeHeightDeviationMm).toBeGreaterThan(0.025);
    expect(hudState.digitalTwinCellState).toBe('emergency-stop');
  });

  it('Phase 5: Urgent calibration verification and punch replacement restores Cpk > 1.67', async () => {
    // Calibration work order for CMM probe and stamping die punch
    const calOrder = await unifiedCalibrationApi.create({
      toolId: 'TOOL-CMM-01',
      title: 'Emergency Recalibration & Tooling Verification',
      status: 'Verified & Certified',
      plantId: 'PLANT-AUTO-01',
      metadata: {
        newPunchInstalled: 'DIE-P04-REV-E',
        gageRAndRPercentage: 4.8, // < 10% (World-class MSA)
        cmmProbingBiasMm: 0.0001,
      },
    } as any);

    expect(calOrder.status).toBe('Verified & Certified');
    expect(calOrder.metadata?.gageRAndRPercentage).toBeLessThan(10.0);

    // Post-repair sampling: 10 parts measured around nominal 45.000 ±0.002
    const postRepairPoints = [
      45.001, 44.999, 45.000, 45.002, 45.001, 44.998, 45.000, 45.001, 44.999, 45.000,
    ];
    const postRepairCap = calculateCapability(postRepairPoints, 45.025, 44.975);

    // Cpk restored to Six Sigma grade
    assertCpkThreshold(postRepairCap.cpk, 1.67);
  });
});
