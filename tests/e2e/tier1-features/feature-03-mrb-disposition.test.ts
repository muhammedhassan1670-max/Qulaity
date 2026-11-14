import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedNcrApi } from '@/api/unified-api';
import {
  seedNcrRecords,
  readNcrRecords,
  resetQualityStorage,
} from '../../helpers/testHarness';
import type { NCRItem } from '@/pages/quality/NCR';

describe('Feature 03: MRB Disposition Decision', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('handles Rework disposition with specific routing instructions and status update', async () => {
    const ncr: NCRItem = {
      id: 'ncr-mrb-01',
      ncrNumber: 'NCR-2026-001',
      title: 'Flange Oversize by 0.15mm',
      description: 'Machined flange thickness exceeds upper tolerance limit',
      defectType: 'Dimensional',
      severity: 'major',
      status: 'disposition',
      priority: 'high',
      createdDate: '2026-11-14',
      dueDate: '2026-11-20',
      assignedTo: 'Lead Machinist',
      department: 'Machining',
      productionLine: 'Line 01',
      affectedQuantity: 18,
      lotNumber: 'LOT-FLANGE-101',
      containmentAction: 'Held in staging',
      disposition: 'pending',
      source: 'CMM',
    };
    seedNcrRecords([ncr]);

    const updated = await unifiedNcrApi.update('ncr-mrb-01', {
      disposition: 'rework',
      dispositionNotes: 'Re-machine face on Milling Center #3 to 12.00 ± 0.02mm. Re-inspect 100%.',
      status: 'in-progress' as any,
    });

    expect(updated.disposition).toBe('rework');
    expect(updated.dispositionNotes).toContain('Re-machine face on Milling Center #3');
    expect(updated.status).toBe('in-progress');
  });

  it('handles Scrap disposition with inventory scrap tagging and write-off notes', async () => {
    const ncr: NCRItem = {
      id: 'ncr-mrb-02',
      ncrNumber: 'NCR-2026-002',
      title: 'Internal Casting Cracks',
      description: 'Severe thermal shock cracks throughout main body casting',
      defectType: 'Casting Defect',
      severity: 'critical',
      status: 'disposition',
      priority: 'critical',
      createdDate: '2026-11-14',
      dueDate: '2026-11-16',
      assignedTo: 'MRB Coordinator',
      department: 'Foundry',
      productionLine: 'Foundry Cell 1',
      affectedQuantity: 40,
      lotNumber: 'LOT-CAST-99',
      containmentAction: 'Transferred to red tag quarantine',
      disposition: 'pending',
      source: 'NDT Ultrasonic',
    };
    seedNcrRecords([ncr]);

    const updated = await unifiedNcrApi.update('ncr-mrb-02', {
      disposition: 'scrap',
      dispositionNotes: 'Unrecoverable internal cracks. Full write-off of 40 units authorized by Quality Director.',
      status: 'closed' as any,
    });

    expect(updated.disposition).toBe('scrap');
    expect(updated.dispositionNotes).toContain('Full write-off of 40 units');
    expect(updated.status).toBe('closed');
  });

  it('handles Return to Vendor (RTV) disposition with supplier debit charge notification', async () => {
    const ncr: NCRItem = {
      id: 'ncr-mrb-03',
      ncrNumber: 'NCR-2026-003',
      title: 'Raw Material Hardness Non-Conformance',
      description: 'Incoming titanium bars fail Rockwell C hardness specification',
      defectType: 'Material Defect',
      severity: 'critical',
      status: 'disposition',
      priority: 'critical',
      createdDate: '2026-11-14',
      dueDate: '2026-11-18',
      assignedTo: 'Supplier Quality Lead',
      department: 'Incoming Warehouse',
      productionLine: 'Dock 2',
      affectedQuantity: 250,
      lotNumber: 'LOT-RAW-TI-44',
      containmentAction: 'Pallet shrink-wrapped and quarantined at inbound dock',
      disposition: 'pending',
      source: 'Incoming Metallurgical Lab',
    };
    seedNcrRecords([ncr]);

    const updated = await unifiedNcrApi.update('ncr-mrb-03', {
      disposition: 'return-to-vendor',
      dispositionNotes: 'RTV RMA #99812 issued. Shipping back to Apex Forgings. Issue debit note for freight and material cost.',
      status: 'in-progress' as any,
    });

    expect(updated.disposition).toBe('return-to-vendor');
    expect(updated.dispositionNotes).toContain('RTV RMA #99812');
  });

  it('handles Use As Is (UAI) disposition requiring engineering justification and concession approval', async () => {
    const ncr: NCRItem = {
      id: 'ncr-mrb-04',
      ncrNumber: 'NCR-2026-004',
      title: 'Non-Functional Bevel Angle 0.5 Deg Below Nominal',
      description: 'Cosmetic edge chamfer angle 44.5 deg instead of 45.0 deg',
      defectType: 'Minor Geometry',
      severity: 'minor',
      status: 'disposition',
      priority: 'low',
      createdDate: '2026-11-14',
      dueDate: '2026-11-20',
      assignedTo: 'Chief Design Engineer',
      department: 'Assembly',
      productionLine: 'Line 04',
      affectedQuantity: 100,
      lotNumber: 'LOT-CHAMF-33',
      containmentAction: 'Batch verified for fit and clearance',
      disposition: 'pending',
      source: 'Optical Comparator',
    };
    seedNcrRecords([ncr]);

    const updated = await unifiedNcrApi.update('ncr-mrb-04', {
      disposition: 'use-as-is',
      dispositionNotes: 'Engineering Concession #EC-2026-88 approved. Chamfer does not affect structural integrity or sealing surface.',
      status: 'closed' as any,
    });

    expect(updated.disposition).toBe('use-as-is');
    expect(updated.dispositionNotes).toContain('Engineering Concession #EC-2026-88 approved');
    expect(updated.status).toBe('closed');
  });

  it('persists MRB disposition history across storage queries', async () => {
    const ncr: NCRItem = {
      id: 'ncr-mrb-05',
      ncrNumber: 'NCR-2026-005',
      title: 'Test Persist',
      description: 'Checking persistence',
      defectType: 'General',
      severity: 'medium' as any,
      status: 'disposition',
      priority: 'medium',
      createdDate: '2026-11-14',
      dueDate: '2026-11-20',
      assignedTo: 'Auditor',
      department: 'QA',
      productionLine: 'L1',
      affectedQuantity: 10,
      lotNumber: 'L1',
      containmentAction: 'Held',
      disposition: 'pending',
      source: 'Audit',
    };
    seedNcrRecords([ncr]);

    await unifiedNcrApi.update('ncr-mrb-05', {
      disposition: 'rework',
      dispositionNotes: 'Verified disposition persistence',
    });

    const retrieved = await unifiedNcrApi.getById('ncr-mrb-05');
    expect(retrieved.disposition).toBe('rework');
    expect(retrieved.dispositionNotes).toBe('Verified disposition persistence');
  });
});
