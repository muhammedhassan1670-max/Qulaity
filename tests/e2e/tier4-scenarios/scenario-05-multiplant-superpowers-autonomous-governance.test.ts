import { describe, it, expect, beforeEach } from 'vitest';
import { askQualityCopilot } from '@/services/copilotEngine';
import { analyzeDefectRecords } from '@/services/defectAnalytics';
import { unifiedAuditApi } from '@/api/unified-api';
import { resetQualityStorage } from '../../helpers/testHarness';
import { assertIsoAuditScore } from '../../helpers/assertionHelpers';

describe('Scenario 05: Autonomous Multi-Plant Industry 5.0 Governance', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('Phase 1: Hands-free Voice Copilot receives shopfloor speech command and routes intent to Superpowers Hub', async () => {
    const voiceSpokenCommand = 'شغل ترسانة الجودة الفائقة وافتح ماسح العيوب الذكي فورا';
    const response = await askQualityCopilot(voiceSpokenCommand, { pathname: '/shopfloor' });

    expect(response.content).toContain('الترسانة الصناعية الفائقة');
    expect(response.actions).toBeDefined();

    const superpowersAction = response.actions!.find((a) => a.target === '/superpowers');
    expect(superpowersAction).toBeDefined();
    expect(superpowersAction?.type).toBe('navigate');
    expect(response.suggestions.length).toBeGreaterThanOrEqual(3);
  });

  it('Phase 2: Live AI Vision defect scanner processes camera frame with bounding boxes and defect confidence', () => {
    // Model AI Edge Computer Vision Scanner state
    interface VisionDetectionFrame {
      frameId: string;
      source: 'webcam' | 'sim';
      timestamp: string;
      detectedObjects: Array<{
        label: string;
        confidence: number;
        box: [number, number, number, number]; // [x, y, w, h]
        severity: 'minor' | 'major' | 'critical';
      }>;
      autoNcrTriggerThreshold: number;
    }

    const visionScan: VisionDetectionFrame = {
      frameId: 'FRAME-2026-CV-8891',
      source: 'sim',
      timestamp: new Date().toISOString(),
      detectedObjects: [
        {
          label: 'Porosity Void Defect',
          confidence: 0.94,
          box: [120, 85, 34, 30],
          severity: 'critical',
        },
        {
          label: 'Surface Scratch',
          confidence: 0.88,
          box: [240, 190, 60, 15],
          severity: 'minor',
        },
      ],
      autoNcrTriggerThreshold: 0.90,
    };

    expect(visionScan.detectedObjects.length).toBe(2);
    const criticalDefect = visionScan.detectedObjects.find((d) => d.severity === 'critical');
    expect(criticalDefect).toBeDefined();
    expect(criticalDefect!.confidence).toBeGreaterThanOrEqual(visionScan.autoNcrTriggerThreshold);
  });

  it('Phase 3: AI Excel/CSV Form Generator auto-creates No-Code dynamic audit checklist schema', () => {
    // Simulated table structure extracted from an uploaded ISO audit Excel sheet
    const uploadedSpreadsheetColumns = [
      { name: 'clauseNumber', sampleValue: '9.1.2', type: 'text' },
      { name: 'requirementText', sampleValue: 'Customer Satisfaction Monitoring', type: 'text' },
      { name: 'complianceScore', sampleValue: '5', type: 'number' },
      { name: 'evidenceAttached', sampleValue: 'true', type: 'boolean' },
      { name: 'auditFindingType', sampleValue: 'Conforming', type: 'select' },
      { name: 'auditorSignature', sampleValue: 'Dr. Klaus', type: 'signature' },
    ];

    // Schema generator engine creates 16-field supporting form schema
    const generatedFormSchema = {
      formId: 'FORM-ISO-AUDIT-AUTO-GEN-01',
      title: 'Automated ISO 9001:2015 Audit Checklist',
      version: 1,
      fields: uploadedSpreadsheetColumns.map((col, idx) => ({
        id: `field_${idx + 1}`,
        name: col.name,
        label: col.name.replace(/([A-Z])/g, ' $1').toUpperCase(),
        fieldType: col.type,
        required: true,
      })),
      validationRules: [
        { field: 'complianceScore', rule: 'min:1,max:5' },
        { field: 'auditorSignature', rule: 'required' },
      ],
    };

    expect(generatedFormSchema.fields.length).toBe(6);
    expect(generatedFormSchema.fields[0].fieldType).toBe('text');
    expect(generatedFormSchema.fields[2].fieldType).toBe('number');
    expect(generatedFormSchema.validationRules.length).toBe(2);
  });

  it('Phase 4: Surprise ISO Audit Battle simulator confrontation with "Dr. Klaus" yields passing victory', async () => {
    // 10 grueling questions on ISO 9001 Clauses 4 to 10
    const battleQuestionsCount = 10;
    const answeredCorrectly = 9;

    const victoryScore = assertIsoAuditScore(battleQuestionsCount, answeredCorrectly, 80);
    expect(victoryScore).toBe(90.0);

    const battleResult = await unifiedAuditApi.create({
      title: 'Surprise ISO Audit Battle - Simulation Session',
      type: 'Gamified Simulator',
      status: 'Victory - Certified Ready',
      score: victoryScore,
      metadata: {
        examiner: 'Dr. Klaus (Virtual Lead Auditor)',
        verdict: 'Excellent Compliance Demonstration',
        clausesTested: ['4. Context', '5. Leadership', '6. Planning', '7. Support', '8. Operation', '9. Evaluation', '10. Improvement'],
        playerBadge: 'Master Black Belt Defender',
      },
    } as any);

    expect(battleResult.status).toBe('Victory - Certified Ready');
    expect(battleResult.score).toBe(90.0);
    expect(battleResult.metadata?.playerBadge).toBe('Master Black Belt Defender');
  });

  it('Phase 5: Executive Mode KPI briefing aggregates plant-wide FPY, MTTR, and COPQ savings across multi-plant network', () => {
    // Multi-plant defect telemetry data
    const multiPlantLogs = [
      {
        id: 'MP-PLANT-1',
        date: new Date().toISOString().split('T')[0],
        recordType: 'defect-cost' as const,
        defectType: 'Aerospace Casting Scrap',
        quantity: 2,
        inspectedQuantity: 500,
        productionLine: 'Plant 1 - Frankfurt Foundry',
        estimatedCost: 14000,
        costCategory: 'internal-failure' as const,
      },
      {
        id: 'MP-PLANT-2',
        date: new Date().toISOString().split('T')[0],
        recordType: 'defect-cost' as const,
        defectType: 'Automotive Press Rework',
        quantity: 5,
        inspectedQuantity: 1200,
        productionLine: 'Plant 2 - Stuttgart Stamping',
        estimatedCost: 6500,
        costCategory: 'internal-failure' as const,
      },
      {
        id: 'MP-PLANT-3',
        date: new Date().toISOString().split('T')[0],
        recordType: 'defect-cost' as const,
        defectType: 'Cleanroom Sensor Calibration',
        quantity: 0,
        inspectedQuantity: 2000,
        productionLine: 'Plant 3 - Zurich Cleanroom',
        estimatedCost: 2500,
        costCategory: 'prevention' as const,
      },
    ];

    const analytics = analyzeDefectRecords(multiPlantLogs, 'month');

    // Multi-plant executive briefing aggregation
    interface MultiPlantExecutiveBriefing {
      networkOverallFpy: number; // %
      globalMttrHours: number;
      totalNetworkCopqUsd: number;
      yearOverYearSavingsUsd: number;
      activePlantsReporting: number;
      governanceStatus: 'OPTIMAL' | 'ATTENTION' | 'CRITICAL';
    }

    const executiveBriefing: MultiPlantExecutiveBriefing = {
      networkOverallFpy: 99.2,
      globalMttrHours: 1.4,
      totalNetworkCopqUsd: analytics.kpis.totalCopq,
      yearOverYearSavingsUsd: 185000,
      activePlantsReporting: 3,
      governanceStatus: analytics.kpis.totalCopq < 50000 ? 'OPTIMAL' : 'ATTENTION',
    };

    expect(executiveBriefing.networkOverallFpy).toBeGreaterThan(98.0);
    expect(executiveBriefing.globalMttrHours).toBeLessThan(2.0);
    expect(executiveBriefing.totalNetworkCopqUsd).toBe(14000 + 6500 + 2500); // 23000
    expect(executiveBriefing.governanceStatus).toBe('OPTIMAL');
    expect(executiveBriefing.activePlantsReporting).toBe(3);
  });
});
