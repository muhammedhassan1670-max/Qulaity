import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedCapaApi } from '@/api/unified-api';
import {
  seedCapaRecords,
  readCapaRecords,
  resetQualityStorage,
} from '../../helpers/testHarness';
import type { CAPAItem } from '@/pages/quality/CAPA';

describe('Feature 04: CAPA Lifecycle Workflow', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('initializes CAPA in Phase 1 (Identified) with complete 14-field data model', async () => {
    const capaPayload: Omit<CAPAItem, 'id'> = {
      capaNumber: 'CAPA-2026-101',
      title: 'Repetitive Hydraulic Actuator Seal Degradation',
      description: 'Premature seal degradation observed in endurance qualification tests',
      type: 'corrective',
      status: 'identified',
      priority: 'critical',
      source: 'NCR-2026-001',
      createdDate: '2026-11-14',
      targetDate: '2026-12-15',
      owner: 'Eng. Marcus Thorne',
      department: 'Reliability Engineering',
      problemStatement: 'O-ring seals exhibit micro-tears after 20,000 cycles under 210 bar pressure',
      rootCause: '',
      fiveWhy: '',
      correctiveAction: '',
      preventiveAction: '',
      verificationNotes: '',
      effectiveness: 'pending',
    };

    const created = await unifiedCapaApi.create(capaPayload as any);
    expect(created.id).toBeDefined();

    const stored = readCapaRecords<CAPAItem>();
    expect(stored.length).toBe(1);
    expect(stored[0].status).toBe('identified');
    expect(stored[0].problemStatement).toContain('O-ring seals exhibit micro-tears');
    expect(stored[0].owner).toBe('Eng. Marcus Thorne');
  });

  it('transitions Phase 1 (Identified) -> Phase 2 (Analysis) with 5-Why and root cause verification', async () => {
    const capa: CAPAItem = {
      id: 'capa-life-01',
      capaNumber: 'CAPA-2026-102',
      title: 'Bearing Race Surface Flaking',
      description: 'Flaking on inner bearing race during high speed spin testing',
      type: 'corrective',
      status: 'identified',
      priority: 'high',
      source: 'Internal Test',
      createdDate: '2026-11-14',
      targetDate: '2026-12-10',
      owner: 'Sarah Jenkins',
      department: 'Testing Lab',
      problemStatement: 'Spindle vibration spike at 12,000 RPM due to inner ring spalling',
      effectiveness: 'pending',
    };
    seedCapaRecords([capa]);

    const updated = await unifiedCapaApi.update('capa-life-01', {
      status: 'analysis',
      rootCause: 'Inadequate lubricant film thickness caused by higher ambient test bench operating temperatures',
      fiveWhy: 'Why 1: Spalling. Why 2: Boundary lubrication. Why 3: Viscosity drop. Why 4: Oil temp 85C. Why 5: Cooler fan failed.',
    });

    expect(updated.status).toBe('analysis');
    expect(updated.rootCause).toContain('Inadequate lubricant film thickness');
    expect(updated.fiveWhy).toContain('Cooler fan failed');
  });

  it('transitions Phase 2 (Analysis) -> Phase 3 (Action Plan) establishing corrective and preventive controls', async () => {
    const capa: CAPAItem = {
      id: 'capa-life-02',
      capaNumber: 'CAPA-2026-103',
      title: 'CNC Mill Axis Over-Travel',
      description: 'Limit switch fail-safe delayed by 40ms',
      type: 'preventive',
      status: 'analysis',
      priority: 'medium',
      source: 'Safety Walk',
      createdDate: '2026-11-14',
      targetDate: '2026-12-01',
      owner: 'David Miller',
      department: 'Maintenance',
      rootCause: 'Optical sensor dust contamination',
      effectiveness: 'pending',
    };
    seedCapaRecords([capa]);

    const updated = await unifiedCapaApi.update('capa-life-02', {
      status: 'action',
      correctiveAction: 'Clean optical sensor lenses and replace worn dust baffles on Mill #4 and #5',
      preventiveAction: 'Install sealed inductive proximity sensors with IP67 rating across all CNC machines',
    });

    expect(updated.status).toBe('action');
    expect(updated.correctiveAction).toContain('Clean optical sensor lenses');
    expect(updated.preventiveAction).toContain('Install sealed inductive proximity sensors');
  });

  it('transitions Phase 3 (Action) -> Phase 4 (Verification) assessing effectiveness metrics', async () => {
    const capa: CAPAItem = {
      id: 'capa-life-03',
      capaNumber: 'CAPA-2026-104',
      title: 'Solder Bridging on PCB Controller',
      description: 'Bridging between QFP pins 44 and 45',
      type: 'corrective',
      status: 'action',
      priority: 'high',
      source: 'SMT Line 1',
      createdDate: '2026-11-14',
      targetDate: '2026-11-30',
      owner: 'Wei Zhang',
      department: 'Electronics SMT',
      correctiveAction: 'Adjusted solder paste stencil aperture by -10% and squeegee pressure to 4.2 kg',
      effectiveness: 'pending',
    };
    seedCapaRecords([capa]);

    const updated = await unifiedCapaApi.update('capa-life-03', {
      status: 'verification',
      verificationNotes: 'Audited 500 consecutive boards across 3 shifts. Zero solder bridges detected. First pass yield 99.8%.',
      effectiveness: 'effective',
    });

    expect(updated.status).toBe('verification');
    expect(updated.effectiveness).toBe('effective');
    expect(updated.verificationNotes).toContain('Zero solder bridges detected');
  });

  it('transitions Phase 4 (Verification) -> Phase 5 (Closed) finalizing permanent quality closure', async () => {
    const capa: CAPAItem = {
      id: 'capa-life-04',
      capaNumber: 'CAPA-2026-105',
      title: 'Carton Pallet Stacking Failure',
      description: 'Bottom cartons crushed during inter-plant transit',
      type: 'corrective',
      status: 'verification',
      priority: 'medium',
      source: 'Warehouse Logistics',
      createdDate: '2026-11-01',
      targetDate: '2026-11-15',
      owner: 'Elena Rostova',
      department: 'Logistics',
      effectiveness: 'effective',
      verificationNotes: 'Upgraded to double-wall corrugated boxes with corner protectors. 10 shipments completed with zero transit damage.',
    };
    seedCapaRecords([capa]);

    const updated = await unifiedCapaApi.update('capa-life-04', {
      status: 'closed',
      closedBy: 'Quality Assurance Director',
      metadata: {
        closureDate: new Date().toISOString(),
        auditConfirmation: 'Passed Q4 ISO 9001 surveillance review',
      },
    });

    expect(updated.status).toBe('closed');
    expect(updated.closedBy).toBe('Quality Assurance Director');
    expect(updated.metadata.auditConfirmation).toContain('Passed Q4 ISO 9001');
  });
});
