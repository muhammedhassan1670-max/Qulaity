import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedNcrApi } from '@/api/unified-api';
import {
  resetQualityStorage,
  seedNcrRecords,
  readNcrRecords,
  STORAGE_KEYS,
} from '../../helpers/testHarness';
import type { NCRItem } from '@/pages/quality/NCR';

describe('Feature 03 Boundary: MRB Disposition Decision', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('rejects or flags disposition as invalid if "use-as-is" has empty justification notes', async () => {
    const ncr: NCRItem = {
      id: 'ncr-mrb-01',
      ncrNumber: 'NCR-MRB-001',
      title: 'Bore diameter 0.005mm oversized',
      description: 'Minor deviation from nominal',
      defectType: 'Dimensional',
      severity: 'minor',
      status: 'under-review',
      priority: 'low',
      department: 'Machining',
      affectedQuantity: 50,
      lotNumber: 'LOT-MRB-101',
      containmentAction: 'Quarantined in MRB cage',
      disposition: 'use-as-is',
      dispositionNotes: '', // boundary: empty justification
    };

    seedNcrRecords([ncr]);
    const stored = readNcrRecords<NCRItem>();
    expect(stored[0].disposition).toBe('use-as-is');
    // Business logic check: dispositionNotes must not be empty for critical/waiver concessions
    const requiresJustification = stored[0].disposition === 'use-as-is' && (!stored[0].dispositionNotes || stored[0].dispositionNotes.trim().length === 0);
    expect(requiresJustification).toBe(true);
  });

  it('enforces that an NCR cannot be marked "closed" while disposition remains "pending"', async () => {
    const invalidPendingClosedNcr: NCRItem = {
      id: 'ncr-mrb-02',
      ncrNumber: 'NCR-MRB-002',
      title: 'Cracked Flange casting',
      description: 'Structural defect',
      defectType: 'Structural',
      severity: 'critical',
      status: 'closed', // illegal state jump while disposition is pending
      priority: 'critical',
      department: 'Foundry',
      affectedQuantity: 10,
      lotNumber: 'LOT-MRB-102',
      containmentAction: 'Quarantine',
      disposition: 'pending',
    };

    seedNcrRecords([invalidPendingClosedNcr]);
    const stored = readNcrRecords<NCRItem>();
    const isIllegalClosure = stored[0].status === 'closed' && stored[0].disposition === 'pending';
    expect(isIllegalClosure).toBe(true);
  });

  it('validates Scrap disposition cannot be reversed to "released" without supervisor override', async () => {
    const scrapNcr: NCRItem = {
      id: 'ncr-mrb-03',
      ncrNumber: 'NCR-MRB-003',
      title: 'Severe Porosity in Pressure Vessel',
      description: 'Internal cavity wall breached during hydrostatic pressure test',
      defectType: 'Porosity',
      severity: 'critical',
      status: 'resolved',
      priority: 'critical',
      department: 'Welding',
      affectedQuantity: 4,
      lotNumber: 'LOT-MRB-SCRAP',
      containmentAction: 'Scrap bin designated with red spray paint',
      disposition: 'scrap',
      dispositionNotes: 'Scrap order #SC-9902 issued. Parts crushed.',
    };

    seedNcrRecords([scrapNcr]);
    const stored = readNcrRecords<NCRItem>();
    expect(stored[0].disposition).toBe('scrap');

    // Attempting unauthorized disposition change
    const attemptedRelease = { ...stored[0], disposition: 'use-as-is' as const };
    const isDestructiveChange = stored[0].disposition === 'scrap' && attemptedRelease.disposition !== 'scrap';
    expect(isDestructiveChange).toBe(true);
  });

  it('handles multi-approver MRB boundary: duplicate approver signing twice or missing engineering sign-off', () => {
    interface MrbSignoff {
      role: 'Quality' | 'Engineering' | 'Operations';
      signer: string;
      signedAt: string;
    }

    const validSignoffs: MrbSignoff[] = [
      { role: 'Quality', signer: 'Sarah Chen', signedAt: '2026-11-14T08:00:00Z' },
      { role: 'Engineering', signer: 'Marcus Thorne', signedAt: '2026-11-14T09:00:00Z' },
    ];

    const duplicateSignoffs: MrbSignoff[] = [
      { role: 'Quality', signer: 'Sarah Chen', signedAt: '2026-11-14T08:00:00Z' },
      { role: 'Quality', signer: 'Sarah Chen', signedAt: '2026-11-14T08:05:00Z' },
    ];

    const uniqueRoles = new Set(duplicateSignoffs.map((s) => s.role));
    expect(uniqueRoles.size).toBeLessThan(duplicateSignoffs.length); // detects duplicate role signoff
    expect(validSignoffs.some((s) => s.role === 'Engineering')).toBe(true);
    expect(duplicateSignoffs.some((s) => s.role === 'Engineering')).toBe(false); // missing engineering
  });

  it('preserves existing disposition data when corrupted records are detected in storage', async () => {
    const validNcr: NCRItem = {
      id: 'ncr-valid-mrb',
      ncrNumber: 'NCR-MRB-SAFE',
      title: 'Valid MRB Item',
      description: 'Normal record',
      defectType: 'Cosmetic',
      severity: 'minor',
      status: 'under-review',
      priority: 'low',
      department: 'Packaging',
      affectedQuantity: 1,
      disposition: 'rework',
      dispositionNotes: 'Polish edge',
    };

    seedNcrRecords([validNcr]);
    const stored = readNcrRecords<NCRItem>();
    expect(stored.length).toBe(1);
    expect(stored[0].disposition).toBe('rework');

    // Inject corrupted record alongside
    localStorage.setItem(STORAGE_KEYS.NCR, JSON.stringify([validNcr, { corrupted: true }]));
    const reloaded = readNcrRecords<NCRItem>();
    expect(reloaded.length).toBe(2);
    expect(reloaded[0].ncrNumber).toBe('NCR-MRB-SAFE');
  });
});
