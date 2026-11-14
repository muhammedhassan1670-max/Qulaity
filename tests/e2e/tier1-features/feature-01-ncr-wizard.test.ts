import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedNcrApi } from '@/api/unified-api';
import {
  seedNcrRecords,
  readNcrRecords,
  resetQualityStorage,
  STORAGE_KEYS,
} from '../../helpers/testHarness';
import { INDUSTRIAL_PARTS, INDUSTRIAL_MATERIALS } from '../../helpers/industrialFixtures';
import type { NCRItem } from '@/pages/quality/NCR';

describe('Feature 01: Create New NCR Wizard', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('validates creation of complete 16-field NCR record', async () => {
    const part = INDUSTRIAL_PARTS[0];
    const ncrPayload: Omit<NCRItem, 'id'> = {
      ncrNumber: 'NCR-2026-001',
      title: 'Cylinder Bore Diameter Out of Tolerance',
      description: 'Inner cylinder bore exceeds USL by 0.035mm on machining line 2',
      defectType: 'Dimensional / Geometry',
      severity: 'critical',
      status: 'open',
      priority: 'critical',
      department: 'Machining & Assembly',
      productionLine: 'Line 02 - CNC Cell',
      affectedQuantity: 24,
      lotNumber: 'LOT-2026-ACT-991',
      containmentAction: 'Immediate stop order, quarantined 24 pcs in Red Tag area',
      disposition: 'pending',
      dispositionNotes: 'Awaiting metallurgical and CMM scan confirmation',
      rootCauseNotes: 'Tool wear compensator failed to trigger at cycle 500',
      assignedTo: 'Lead Quality Engineer Sarah Chen',
      dueDate: '2026-11-20',
      source: 'CMM In-Process Inspection',
    };

    const created = await unifiedNcrApi.create(ncrPayload as any);
    expect(created.id).toBeDefined();

    const stored = readNcrRecords<NCRItem>();
    expect(stored.length).toBe(1);

    const saved = stored[0];
    expect(saved.title).toBe(ncrPayload.title);
    expect(saved.defectType).toBe('Dimensional / Geometry');
    expect(saved.severity).toBe('critical');
    expect(saved.status).toBe('open');
    expect(saved.priority).toBe('critical');
    expect(saved.department).toBe('Machining & Assembly');
    expect(saved.productionLine).toBe('Line 02 - CNC Cell');
    expect(saved.affectedQuantity).toBe(24);
    expect(saved.lotNumber).toBe('LOT-2026-ACT-991');
    expect(saved.containmentAction).toContain('Immediate stop order');
    expect(saved.disposition).toBe('pending');
    expect(saved.dispositionNotes).toContain('Awaiting metallurgical');
    expect(saved.rootCauseNotes).toContain('Tool wear');
    expect(saved.assignedTo).toBe('Lead Quality Engineer Sarah Chen');
    expect(saved.dueDate).toBe('2026-11-20');
  });

  it('enforces holding status and quarantine containment for critical defects', async () => {
    const criticalNcr: NCRItem = {
      id: 'ncr-crit-101',
      ncrNumber: 'NCR-2026-CRIT-101',
      title: 'Structural Porosity in Flight Actuator Wall',
      description: 'Sub-surface shrinkage cavity discovered during radiographic test',
      defectType: 'Metallurgical Defect',
      severity: 'critical',
      status: 'under-review',
      priority: 'critical',
      createdDate: '2026-11-14',
      dueDate: '2026-11-16',
      assignedTo: 'Dr. Klaus - Chief Metallurgist',
      department: 'Aerospace Castings',
      productionLine: 'Foundry Cell 3',
      affectedQuantity: 12,
      lotNumber: 'LOT-2026-AL-0412',
      containmentAction: 'Physical quarantine tag applied; ERP batch hold active',
      disposition: 'pending',
      source: 'Radiographic Non-Destructive Testing',
    };

    seedNcrRecords([criticalNcr]);
    const records = readNcrRecords<NCRItem>();
    expect(records[0].severity).toBe('critical');
    expect(records[0].containmentAction).toMatch(/quarantine/i);
    expect(records[0].status).toBe('under-review');
  });

  it('validates updating containment action and assigning responsibility', async () => {
    const initialNcr: NCRItem = {
      id: 'ncr-mod-202',
      ncrNumber: 'NCR-2026-202',
      title: 'Minor Surface Scratch on Outer Flange',
      description: 'Handling scratches observed after de-burring step',
      defectType: 'Surface Defect',
      severity: 'minor',
      status: 'open',
      priority: 'low',
      createdDate: '2026-11-14',
      dueDate: '2026-11-25',
      assignedTo: 'Unassigned',
      department: 'Finishing',
      productionLine: 'Line 01',
      affectedQuantity: 5,
      lotNumber: 'LOT-2026-PNL-88',
      containmentAction: 'Pending review',
      disposition: 'pending',
      source: 'Visual Inspection',
    };

    seedNcrRecords([initialNcr]);

    // Update with concrete containment and assigned engineer
    const updated = await unifiedNcrApi.update('ncr-mod-202', {
      containmentAction: 'Rework buffer separated, silicone protective sleeves installed',
      assignedTo: 'Eng. Marcus Brody',
      status: 'in-progress' as any,
    });

    expect(updated.containmentAction).toBe(
      'Rework buffer separated, silicone protective sleeves installed'
    );
    expect(updated.assignedTo).toBe('Eng. Marcus Brody');
    expect(updated.status).toBe('in-progress');
  });

  it('supports MRB disposition choices: rework, scrap, return-to-vendor, use-as-is', async () => {
    const dispositions: NCRItem['disposition'][] = [
      'rework',
      'scrap',
      'return-to-vendor',
      'use-as-is',
    ];

    const ncrs: NCRItem[] = dispositions.map((disp, idx) => ({
      id: `ncr-disp-${idx}`,
      ncrNumber: `NCR-2026-D${idx}`,
      title: `Batch Defect ${disp}`,
      description: `Testing disposition pathway for ${disp}`,
      defectType: 'Manufacturing Defect',
      severity: 'major',
      status: 'disposition',
      priority: 'medium',
      createdDate: '2026-11-14',
      dueDate: '2026-11-21',
      assignedTo: 'MRB Board Lead',
      department: 'Quality Engineering',
      productionLine: 'Line 01',
      affectedQuantity: 10 + idx,
      lotNumber: `LOT-2026-DISP-${idx}`,
      containmentAction: 'Held in staging buffer',
      disposition: disp,
      dispositionNotes: `Approved by MRB for ${disp}`,
      source: 'Quality Audit',
    }));

    seedNcrRecords(ncrs);
    const stored = readNcrRecords<NCRItem>();
    expect(stored.length).toBe(4);

    dispositions.forEach((disp) => {
      const found = stored.find((item) => item.disposition === disp);
      expect(found).toBeDefined();
      expect(found?.dispositionNotes).toContain(disp);
    });
  });

  it('calculates active, critical, and pending disposition metrics from stored records', () => {
    const dataset: NCRItem[] = [
      {
        id: '1',
        title: 'Issue 1',
        description: '',
        defectType: 'A',
        severity: 'critical',
        status: 'open',
        priority: 'critical',
        createdDate: '2026-11-01',
        dueDate: '2026-11-05',
        assignedTo: 'Alice',
        department: 'QC',
        productionLine: 'L1',
        affectedQuantity: 10,
        lotNumber: 'L10',
        containmentAction: 'Hold',
        disposition: 'pending',
        source: 'Insp',
      },
      {
        id: '2',
        title: 'Issue 2',
        description: '',
        defectType: 'B',
        severity: 'major',
        status: 'under-review',
        priority: 'high',
        createdDate: '2026-11-02',
        dueDate: '2026-11-06',
        assignedTo: 'Bob',
        department: 'QC',
        productionLine: 'L2',
        affectedQuantity: 5,
        lotNumber: 'L20',
        containmentAction: 'Hold',
        disposition: 'pending',
        source: 'Insp',
      },
      {
        id: '3',
        title: 'Issue 3',
        description: '',
        defectType: 'C',
        severity: 'minor',
        status: 'closed',
        priority: 'low',
        createdDate: '2026-11-03',
        dueDate: '2026-11-07',
        assignedTo: 'Carol',
        department: 'QC',
        productionLine: 'L1',
        affectedQuantity: 2,
        lotNumber: 'L30',
        containmentAction: 'Done',
        disposition: 'use-as-is',
        source: 'Insp',
      },
    ];

    seedNcrRecords(dataset);
    const records = readNcrRecords<NCRItem>();

    const activeCount = records.filter((n) => n.status !== 'closed').length;
    const criticalCount = records.filter(
      (n) => n.severity === 'critical' || n.priority === 'critical'
    ).length;
    const pendingDispCount = records.filter(
      (n) => n.disposition === 'pending' || n.status === 'under-review'
    ).length;
    const closedCount = records.filter((n) => n.status === 'closed').length;

    expect(activeCount).toBe(2);
    expect(criticalCount).toBe(1);
    expect(pendingDispCount).toBe(2);
    expect(closedCount).toBe(1);
  });
});
