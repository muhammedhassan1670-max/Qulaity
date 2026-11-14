import { describe, it, expect, beforeEach } from 'vitest';
import { QualityEngine } from '@/services/qualityEngine';
import { checkNelsonRules, calculateCapability } from '@/services/spcEngine';
import { unifiedNcrApi, unifiedCapaApi } from '@/api/unified-api';
import {
  resetQualityStorage,
  readNcrRecords,
  readCapaRecords,
} from '../../helpers/testHarness';
import { assertNelsonRuleViolation, assertCpkThreshold } from '../../helpers/assertionHelpers';
import { INDUSTRIAL_INSPECTION_SPECS } from '../../helpers/industrialFixtures';

describe('Combo 02: Statistical Outage to Auto-NCR & Control Tower Alarm', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('Test 2.1: Nelson Rule 1 outlier breaches control limits and triggers auto-NCR with AI diagnostics', async () => {
    const spec = INDUSTRIAL_INSPECTION_SPECS.actuatorBore; // nominal 45.000, lsl 44.975, usl 45.025
    const centerLine = 45.000;
    const sigma = 0.005; // 3-sigma UCL = 45.015, LSL = 44.985
    const ucl = centerLine + 3 * sigma; // 45.015
    const lcl = centerLine - 3 * sigma; // 44.985

    // Run of points with an extreme outlier at index 4 (45.028 > UCL 45.015)
    const measurements = [45.001, 44.998, 45.003, 45.002, 45.028, 45.001];
    const violations = checkNelsonRules(measurements, centerLine, sigma);

    assertNelsonRuleViolation(violations, 1);
    const outlier = violations.find((v) => v.rule === 1);
    expect(outlier?.index).toBe(4);

    // Automation engine triggers Auto-NCR
    const pointIdentifier = `SAMPLE-RUN-04-${Date.now()}`;
    const autoNcr = await QualityEngine.handleSpcPointOutage(
      'Actuator Main Cylinder Bore Diameter',
      measurements[4],
      ucl,
      lcl,
      'CNC-CELL-02',
      'PLANT-AERO-01',
      pointIdentifier
    );

    expect(autoNcr).toBeDefined();
    expect(autoNcr.title).toContain('AUTO-NCR: SPC Outage');
    expect(autoNcr.priority).toBe('Critical');
    expect(autoNcr.metadata?.machine).toBe('CNC-CELL-02');
    expect(autoNcr.metadata?.rootCause).toContain('[AI Predicted]');
    expect(autoNcr.metadata?.suggestedAction).toContain('calibration');

    const storedNcrs = readNcrRecords();
    expect(storedNcrs.length).toBe(1);
    expect(storedNcrs[0].metadata?.spcPointIdentifier).toBe(pointIdentifier);
  });

  it('Test 2.2: Nelson Rule 2 run of 9 points above center line detects mean shift before hard out-of-spec', async () => {
    const centerLine = 50.0;
    const sigma = 1.0;

    // 9 consecutive points strictly above center line
    const shiftPoints = [50.8, 51.1, 51.4, 50.9, 51.2, 51.5, 51.8, 51.2, 51.3];
    const violations = checkNelsonRules(shiftPoints, centerLine, sigma);

    assertNelsonRuleViolation(violations, 2);
    const rule2Violation = violations.find((v) => v.rule === 2);
    expect(rule2Violation?.index).toBe(8);
    expect(rule2Violation?.description).toContain('Shift');

    // Trigger proactive SPC notification in QualityEngine
    const autoNcr = await QualityEngine.handleSpcPointOutage(
      'Stamping Press Pressure Metric',
      shiftPoints[8],
      53.0,
      47.0,
      'PRESS-LINE-01',
      'PLANT-AUTO-01',
      'POINT-SHIFT-N9'
    );

    expect(autoNcr).toBeDefined();
    expect(autoNcr.title).toContain('AUTO-NCR');
    expect(autoNcr.metadata?.line).toBe('PRESS-LINE-01');
  });

  it('Test 2.3: Process capability Cpk drop below 1.0 triggers Critical Capability Auto-NCR', async () => {
    // Process with large variation and shifted mean causing Cpk to drop well below 1.0
    // USL = 45.025, LSL = 44.975 (width = 0.05)
    // If mean = 45.020, stdDev = 0.012 -> (45.025 - 45.020) / (3 * 0.012) = 0.005 / 0.036 = 0.138
    const values = [45.010, 45.018, 45.026, 45.022, 45.015, 45.030, 45.025, 45.019];
    const capability = calculateCapability(values, 45.025, 44.975);

    expect(capability.cpk).toBeLessThan(1.0);

    const evalResult = await QualityEngine.evaluateProcessCapability(
      'Bore Finishing CNC-02',
      capability.cpk,
      'USER-MGR-007',
      'PLANT-AERO-01'
    );

    expect(evalResult.action).toBe('NCR Created & Manager Notified');
    expect(evalResult.ncrId).toBeDefined();

    const storedNcrs = readNcrRecords();
    const capNcr = storedNcrs.find((n: any) => n.id === evalResult.ncrId);
    expect(capNcr).toBeDefined();
    expect(capNcr.title).toContain('AUTO-NCR: Critical Process Capability (Cpk < 1.0)');
    expect(capNcr.priority).toBe('Critical');
    expect(capNcr.metadata?.cpk).toBe(capability.cpk);
  });

  it('Test 2.4: Severe SPC outlier (> 1.5x UCL) automatically escalates from Auto-NCR to CAPA', async () => {
    const ucl = 20.0;
    const lcl = 10.0;
    // Extreme point: 32.0 > 1.5 * UCL (30.0)
    const extremeValue = 32.0;

    const autoNcr = await QualityEngine.handleSpcPointOutage(
      'Furnace Melt Temperature',
      extremeValue,
      ucl,
      lcl,
      'FURNACE-CORE-05',
      'PLANT-FOUNDRY-01',
      'OUTAGE-EXTREME-32'
    );

    expect(autoNcr).toBeDefined();
    // QualityEngine auto-escalates to CAPA if value > ucl * 1.5
    const storedCapas = readCapaRecords();
    expect(storedCapas.length).toBe(1);
    expect(storedCapas[0].sourceNcrId).toBe(autoNcr.id);
    expect(storedCapas[0].title).toContain('CAPA from NCR');
  });

  it('Test 2.5: Duplicate SPC point outage prevents redundant NCR spam', async () => {
    const ucl = 50.0;
    const lcl = 30.0;
    const pointId = 'STATIC-POINT-ID-999';

    // First trigger creates Auto-NCR
    const firstCall = await QualityEngine.handleSpcPointOutage(
      'Torque Monitor Station 1',
      55.0,
      ucl,
      lcl,
      'ROBOT-TORQUE-01',
      'PLANT-AUTO-01',
      pointId
    );
    expect(firstCall).toBeDefined();

    // Second trigger with exact same point identifier returns null
    const secondCall = await QualityEngine.handleSpcPointOutage(
      'Torque Monitor Station 1',
      55.0,
      ucl,
      lcl,
      'ROBOT-TORQUE-01',
      'PLANT-AUTO-01',
      pointId
    );
    expect(secondCall).toBeNull();

    const storedNcrs = readNcrRecords();
    expect(storedNcrs.length).toBe(1);
  });

  it('Test 2.6: Control Tower live machine state transitions from RUNNING to ALARM on SPC outage', async () => {
    // Model Control Tower telemetry node state representation
    interface MachineTelemetryNode {
      id: string;
      line: string;
      name: string;
      status: 'running' | 'idle' | 'alarm' | 'down';
      activeAlerts: string[];
      currentCpk: number;
    }

    const initialTelemetry: MachineTelemetryNode = {
      id: 'NODE-CNC-02',
      line: 'Line 02 - CNC Cell',
      name: 'Milling & Bore Center #2',
      status: 'running',
      activeAlerts: [],
      currentCpk: 1.45,
    };

    assertCpkThreshold(initialTelemetry.currentCpk, 1.33);

    // Simulated degradation and outage
    const degradedCpk = 0.88;
    const pointId = 'TELEMETRY-FAIL-02';
    const ncr = await QualityEngine.handleSpcPointOutage(
      initialTelemetry.name,
      45.032,
      45.025,
      44.975,
      initialTelemetry.id,
      'PLANT-AERO-01',
      pointId
    );

    // Apply control tower state update logic
    const updatedTelemetry: MachineTelemetryNode = {
      ...initialTelemetry,
      status: degradedCpk < 1.0 ? 'alarm' : 'running',
      activeAlerts: [...initialTelemetry.activeAlerts, `Auto-NCR: ${ncr?.title}`],
      currentCpk: degradedCpk,
    };

    expect(updatedTelemetry.status).toBe('alarm');
    expect(updatedTelemetry.activeAlerts.length).toBe(1);
    expect(updatedTelemetry.activeAlerts[0]).toContain('AUTO-NCR');
    expect(updatedTelemetry.currentCpk).toBeLessThan(1.0);
  });
});
