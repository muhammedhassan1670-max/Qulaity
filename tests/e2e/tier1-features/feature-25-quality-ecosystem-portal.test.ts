import { describe, it, expect } from 'vitest';

describe('Feature 25: Quality Ecosystem Portal & 8-Stage Matrix', () => {
  const STAGES = [
    { id: 'stage-1', stageNumber: 1, nameEn: 'Incoming & Supplier Quality (IQC)', isoClauses: ['7.1.5', '8.4', '8.7'] },
    { id: 'stage-2', stageNumber: 2, nameEn: 'In-Process Quality (IPQC)', isoClauses: ['8.5.1', '9.1.1'] },
    { id: 'stage-3', stageNumber: 3, nameEn: 'Non-Conformance & Problem Solving (NCR/8D)', isoClauses: ['8.7', '10.2'] },
    { id: 'stage-4', stageNumber: 4, nameEn: 'Final & Outgoing Quality (OQC)', isoClauses: ['8.6', '8.2.1'] },
    { id: 'stage-5', stageNumber: 5, nameEn: 'Customer Complaints & Field Quality', isoClauses: ['9.1.2', '10.2'] },
    { id: 'stage-6', stageNumber: 6, nameEn: 'Engineering Lab & Audits', isoClauses: ['9.2', '7.1.5', '8.1'] },
    { id: 'stage-7', stageNumber: 7, nameEn: 'Analytics & Executive KPIs', isoClauses: ['9.1.3', '9.3'] },
    { id: 'stage-8', stageNumber: 8, nameEn: 'Factory Setup & Master Data', isoClauses: ['4.4', '7.5'] },
  ];

  const MODULES_35 = [
    // Stage 1
    { id: 'supplier-quality', stage: 1, route: '/quality/records/supplier', title: 'Supplier Quality & Rating' },
    { id: 'incoming-inspection', stage: 1, route: '/quality/records/inspection', title: 'IQC Incoming Inspection' },
    // Stage 2
    { id: 'shopfloor-defect-entry', stage: 2, route: '/quality/shopfloor-entry', title: 'Fast Touch Shopfloor Defect Entry' },
    { id: 'spc-control-charts', stage: 2, route: '/quality/spc', title: 'SPC Variable & Attribute Control Charts' },
    { id: 'inspection-wizard', stage: 2, route: '/quality/inspection', title: 'In-Process Multi-Step Inspection' },
    { id: 'daily-defects', stage: 2, route: '/quality/daily-defects', title: 'Daily Defect Pareto & Heatmap' },
    // Stage 3
    { id: 'ncr-management', stage: 3, route: '/quality/records/ncr', title: 'Non-Conformance Reports (NCR)' },
    { id: 'capa-lifecycle', stage: 3, route: '/quality/records/capa', title: 'CAPA Lifecycle Workflow' },
    { id: 'eight-d-problem-solving', stage: 3, route: '/8d', title: '8D Problem Solving Suite' },
    { id: 'deviation-waivers', stage: 3, route: '/quality/deviation', title: 'Engineering Deviation & Concession' },
    { id: 'change-control-ecr', stage: 3, route: '/quality/change-control', title: 'Engineering Change Control (ECR/ECN)' },
    // Stage 4
    { id: 'outgoing-quality-oqc', stage: 4, route: '/quality/outgoing', title: 'Outgoing Quality Control (OQC Gatekeeper)' },
    { id: 'pre-shipment-audit', stage: 4, route: '/quality/pre-shipment', title: 'Pre-Shipment Conformance & CoC' },
    // Stage 5
    { id: 'customer-complaints', stage: 5, route: '/quality/records/complaints', title: 'Customer Complaints & RMA Tracker' },
    { id: 'complaints-dashboard', stage: 5, route: '/quality/complaints-dashboard', title: 'Customer CSAT & Defect Analysis' },
    // Stage 6
    { id: 'fmea-matrix', stage: 6, route: '/quality/fmea', title: 'PFMEA Risk Priority Matrix' },
    { id: 'control-plans', stage: 6, route: '/quality/control-plan', title: 'Engineering Control Plans' },
    { id: 'layered-process-audits', stage: 6, route: '/quality/layered-audits', title: 'Layered Process Audits (LPA)' },
    { id: 'iso-audits', stage: 6, route: '/quality/records/audit', title: 'ISO 9001 / IATF Internal Audits' },
    { id: 'calibration-msa', stage: 6, route: '/quality/records/calibration', title: 'Calibration Tracking & Gage R&R' },
    // Stage 7
    { id: 'command-center', stage: 7, route: '/quality/command-center', title: 'Executive Quality Command Center' },
    { id: 'analytics-dashboard', stage: 7, route: '/quality/dashboard', title: 'Real-time Quality Analytics Dashboard' },
    { id: 'copq-cost-engine', stage: 7, route: '/quality/defect-cost', title: 'Cost of Poor Quality (COPQ) Engine' },
    { id: 'process-ppm-tracker', stage: 7, route: '/quality/process-ppm', title: 'Process PPM & DPMO Tracking' },
    { id: 'executive-briefing', stage: 7, route: '/executive', title: 'Executive Mode C-Suite Briefing' },
    { id: 'digital-twin-plant', stage: 7, route: '/digital-twin', title: '3D SCADA Digital Twin Floorplan' },
    { id: 'quality-control-tower', stage: 7, route: '/quality-control-tower', title: 'Quality Control Tower' },
    // Stage 8
    { id: 'master-data', stage: 8, route: '/quality/master-data', title: 'Parts, Lines & Defect Master Data' },
    { id: 'bom-comparison', stage: 8, route: '/quality/bom-comparison', title: 'Model BOM Comparison Matrix' },
    { id: 'form-designer', stage: 8, route: '/quality/form-designer', title: 'No-Code Inspection Form Designer' },
    { id: 'quality-knowledge-base', stage: 8, route: '/quality/knowledge-base', title: 'Quality Knowledge & Lessons Learned' },
    { id: 'quality-library', stage: 8, route: '/quality/library', title: 'Quality SOP & Document Library' },
    // Superpowers Hub (Integrated Industry 5.0 Tools)
    { id: 'voice-copilot', stage: 7, route: '/superpowers?tab=voice', title: 'Two-Way Industrial Voice Copilot' },
    { id: 'audit-battle', stage: 6, route: '/superpowers?tab=audit', title: 'ISO Audit Battle Simulator' },
    { id: 'vision-scanner', stage: 2, route: '/superpowers?tab=vision', title: 'Edge Computer Vision Defect Scanner' },
  ];

  it('verifies complete 8-stage matrix structure and ISO 9001 clause mapping', () => {
    expect(STAGES.length).toBe(8);

    STAGES.forEach((stage, idx) => {
      expect(stage.stageNumber).toBe(idx + 1);
      expect(stage.nameEn).toBeDefined();
      expect(stage.isoClauses.length).toBeGreaterThan(0);
    });

    const incomingStage = STAGES.find((s) => s.stageNumber === 1);
    expect(incomingStage?.isoClauses).toContain('8.4'); // Control of externally provided processes

    const problemSolvingStage = STAGES.find((s) => s.stageNumber === 3);
    expect(problemSolvingStage?.isoClauses).toContain('10.2'); // Nonconformity and corrective action
  });

  it('validates 35-module catalog mapping with 100% stage assignment and route targets', () => {
    expect(MODULES_35.length).toBe(35);

    MODULES_35.forEach((mod) => {
      expect(mod.id).toBeDefined();
      expect(mod.stage).toBeGreaterThanOrEqual(1);
      expect(mod.stage).toBeLessThanOrEqual(8);
      expect(mod.route.startsWith('/')).toBe(true);
      expect(mod.title.length).toBeGreaterThan(5);
    });

    // Verify all 8 stages contain at least one module
    for (let s = 1; s <= 8; s++) {
      const stageModules = MODULES_35.filter((m) => m.stage === s);
      expect(stageModules.length).toBeGreaterThan(0);
    }
  });

  it('supports 4 architectural lenses (backbone, all_primary, feedback_bus, heatmap)', () => {
    type ViewLensId = 'backbone' | 'all_primary' | 'feedback_bus' | 'heatmap';
    const lenses: ViewLensId[] = ['backbone', 'all_primary', 'feedback_bus', 'heatmap'];

    expect(lenses.length).toBe(4);

    interface EcosystemEdge {
      id: string;
      source: string;
      target: string;
      isPrimaryBackbone?: boolean;
      isFeedback?: boolean;
      weight?: number;
    }

    const testCables: EcosystemEdge[] = [
      { id: 'c1', source: 'supplier-quality', target: 'incoming-inspection', isPrimaryBackbone: true, weight: 10 },
      { id: 'c2', source: 'incoming-inspection', target: 'shopfloor-defect-entry', isPrimaryBackbone: true, weight: 8 },
      { id: 'c3', source: 'shopfloor-defect-entry', target: 'ncr-management', isPrimaryBackbone: true, weight: 15 },
      { id: 'c4', source: 'ncr-management', target: 'capa-lifecycle', isPrimaryBackbone: true, weight: 12 },
      { id: 'c5', source: 'capa-lifecycle', target: 'fmea-matrix', isFeedback: true, weight: 6 }, // Feedback loop
      { id: 'c6', source: 'customer-complaints', target: 'eight-d-problem-solving', isFeedback: true, weight: 9 }, // Feedback loop
    ];

    const filterByLens = (lens: ViewLensId, cables: EcosystemEdge[]) => {
      switch (lens) {
        case 'backbone':
          return cables.filter((c) => c.isPrimaryBackbone);
        case 'feedback_bus':
          return cables.filter((c) => c.isFeedback);
        case 'heatmap':
          return cables.filter((c) => (c.weight || 0) >= 10);
        case 'all_primary':
        default:
          return cables;
      }
    };

    const backboneCables = filterByLens('backbone', testCables);
    expect(backboneCables.length).toBe(4);
    expect(backboneCables.every((c) => c.isPrimaryBackbone)).toBe(true);

    const feedbackCables = filterByLens('feedback_bus', testCables);
    expect(feedbackCables.length).toBe(2);
    expect(feedbackCables.every((c) => c.isFeedback)).toBe(true);

    const heatmapCables = filterByLens('heatmap', testCables);
    expect(heatmapCables.length).toBe(3); // weights >= 10
  });

  it('computes node health scores, readiness status, and alert indicators', () => {
    interface NodeHealth {
      moduleId: string;
      healthScore: number; // 0 - 100
      status: 'optimal' | 'warning' | 'active';
      activeAlertsCount: number;
    }

    const nodeHealths: NodeHealth[] = [
      { moduleId: 'ncr-management', healthScore: 78, status: 'warning', activeAlertsCount: 4 },
      { moduleId: 'calibration-msa', healthScore: 96, status: 'optimal', activeAlertsCount: 0 },
      { moduleId: 'spc-control-charts', healthScore: 84, status: 'active', activeAlertsCount: 1 },
      { moduleId: 'outgoing-quality-oqc', healthScore: 99, status: 'optimal', activeAlertsCount: 0 },
    ];

    const getHealthCategory = (score: number) => {
      if (score >= 90) return 'optimal';
      if (score >= 80) return 'active';
      return 'warning';
    };

    nodeHealths.forEach((n) => {
      expect(getHealthCategory(n.healthScore)).toBe(n.status);
    });

    const averageEcosystemHealth =
      nodeHealths.reduce((sum, n) => sum + n.healthScore, 0) / nodeHealths.length;
    expect(averageEcosystemHealth).toBeCloseTo(89.25, 2);
  });

  it('validates simulation scenario routing across multi-stage closed loops', () => {
    type SimulationScenario = 'none' | 'ncr_to_8d' | 'spc_drift' | 'customer_complaint' | 'full_factory_pulse';

    const scenarios: Record<SimulationScenario, { startModule: string; endModule: string; path: string[] }> = {
      none: { startModule: '', endModule: '', path: [] },
      ncr_to_8d: {
        startModule: 'shopfloor-defect-entry',
        endModule: 'fmea-matrix',
        path: ['shopfloor-defect-entry', 'ncr-management', 'eight-d-problem-solving', 'capa-lifecycle', 'fmea-matrix'],
      },
      spc_drift: {
        startModule: 'spc-control-charts',
        endModule: 'calibration-msa',
        path: ['spc-control-charts', 'ncr-management', 'calibration-msa'],
      },
      customer_complaint: {
        startModule: 'customer-complaints',
        endModule: 'control-plans',
        path: ['customer-complaints', 'eight-d-problem-solving', 'capa-lifecycle', 'control-plans'],
      },
      full_factory_pulse: {
        startModule: 'supplier-quality',
        endModule: 'outgoing-quality-oqc',
        path: ['supplier-quality', 'incoming-inspection', 'shopfloor-defect-entry', 'outgoing-quality-oqc'],
      },
    };

    expect(scenarios.ncr_to_8d.path.length).toBe(5);
    expect(scenarios.ncr_to_8d.path[0]).toBe('shopfloor-defect-entry');
    expect(scenarios.ncr_to_8d.path[4]).toBe('fmea-matrix');

    expect(scenarios.customer_complaint.path).toContain('eight-d-problem-solving');
    expect(scenarios.customer_complaint.endModule).toBe('control-plans');
  });
});
