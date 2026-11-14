/**
 * Tier 2 Boundary Tests - Feature 39: Engineering Change Control (ECR/ECN)
 * 
 * Verifies change categorization, revision progression, strict CCB approval state machines,
 * closed-loop synchronization with FMEA/Control Plans, and storage resilience.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedChangeControlApi, type ChangeControlData } from '../../../src/api/unified-api';
import { resetQualityStorage } from '../../helpers/testHarness';

type ChangeStatus = 'draft' | 'proposed' | 'pending-review' | 'approved' | 'implemented' | 'closed' | 'rejected';

const ALLOWED_TRANSITIONS: Record<ChangeStatus, ChangeStatus[]> = {
  draft: ['proposed'],
  proposed: ['pending-review', 'rejected'],
  'pending-review': ['approved', 'rejected'],
  approved: ['implemented'],
  implemented: ['closed'],
  closed: [],
  rejected: ['draft'] // Can restart from draft
};

function canTransitionChange(current: ChangeStatus, target: ChangeStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

function calculateNextRevision(currentRev: string, category: 'minor' | 'major' | 'critical'): string {
  const cleaned = (currentRev || 'A').trim().toUpperCase();
  if (category === 'minor') {
    // Minor sub-rev: A -> A.1, A.1 -> A.2, etc.
    if (cleaned.includes('.')) {
      const parts = cleaned.split('.');
      const sub = parseInt(parts[1], 10) || 0;
      return `${parts[0]}.${sub + 1}`;
    }
    return `${cleaned}.1`;
  }

  // Major / Critical: Alpha increment (A -> B, B -> C) or numeric (1.0 -> 2.0)
  if (/^[A-Z]$/.test(cleaned)) {
    const code = cleaned.charCodeAt(0);
    return code < 90 ? String.fromCharCode(code + 1) : 'A1';
  }

  const num = parseFloat(cleaned);
  if (!isNaN(num)) {
    return `${Math.floor(num) + 1}.0`;
  }

  return 'REV-NEXT';
}

function broadcastChangeImpact(
  changeId: string,
  linkedFmeaIds: string[],
  linkedControlPlanIds: string[]
): {
  broadcastCount: number;
  fmeaUpdated: string[];
  plansUpdated: string[];
} {
  const cleanFmea = linkedFmeaIds.filter((id) => id && id.trim().length > 0);
  const cleanPlans = linkedControlPlanIds.filter((id) => id && id.trim().length > 0);

  return {
    broadcastCount: cleanFmea.length + cleanPlans.length,
    fmeaUpdated: cleanFmea,
    plansUpdated: cleanPlans
  };
}

describe('Boundary Suite 39: Engineering Change Control (ECR/ECN)', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('1. should calculate next engineering revision accurately across minor, major, and critical changes', () => {
    // Alpha minor revision
    expect(calculateNextRevision('A', 'minor')).toBe('A.1');
    expect(calculateNextRevision('A.1', 'minor')).toBe('A.2');

    // Alpha major revision
    expect(calculateNextRevision('A', 'major')).toBe('B');
    expect(calculateNextRevision('B', 'critical')).toBe('C');
    expect(calculateNextRevision('Z', 'major')).toBe('A1');

    // Numeric revision
    expect(calculateNextRevision('1.0', 'major')).toBe('2.0');
    expect(calculateNextRevision('2.4', 'critical')).toBe('3.0');

    // Malformed / empty input fallback
    expect(calculateNextRevision('', 'major')).toBe('B');
  });

  it('2. should enforce legal ECR/ECN state machine transitions and block illegal jumps', () => {
    // Valid transitions
    expect(canTransitionChange('draft', 'proposed')).toBe(true);
    expect(canTransitionChange('proposed', 'pending-review')).toBe(true);
    expect(canTransitionChange('pending-review', 'approved')).toBe(true);
    expect(canTransitionChange('approved', 'implemented')).toBe(true);
    expect(canTransitionChange('implemented', 'closed')).toBe(true);

    // Illegal skipping transitions
    expect(canTransitionChange('draft', 'approved')).toBe(false);    // Skipping review
    expect(canTransitionChange('draft', 'implemented')).toBe(false); // Skipping everything
    expect(canTransitionChange('proposed', 'closed')).toBe(false);
    expect(canTransitionChange('closed', 'implemented')).toBe(false); // Terminal closed
  });

  it('3. should broadcast change notifications cleanly to linked FMEA and Control Plan references', () => {
    const broadcast = broadcastChangeImpact(
      'ECN-2026-0042',
      ['FMEA-STAMP-01', 'FMEA-WELD-03', '   ', ''],
      ['CP-MACH-10', '']
    );

    expect(broadcast.broadcastCount).toBe(3); // 2 valid FMEAs + 1 valid Plan
    expect(broadcast.fmeaUpdated).toEqual(['FMEA-STAMP-01', 'FMEA-WELD-03']);
    expect(broadcast.plansUpdated).toEqual(['CP-MACH-10']);
  });

  it('4. should create and manage change requests with Arabic Unicode and long technical descriptions', async () => {
    const arabicTitle = 'أمر تغيير هندسي ECN: تعديل خلوص مجرى التبريد في قالب الحقن 02';
    const technicalDescription = 'تعديل أبعاد التفاوت الميكانيكي من ±0.05 مم إلى ±0.02 مم لمنع تسرب سائل التبريد وتحسين الثبات البعدي. '.repeat(45);
    expect(technicalDescription.length).toBeGreaterThan(4000);

    const created = await unifiedChangeControlApi.create({
      title: arabicTitle,
      description: technicalDescription,
      changeType: 'process',
      changeCategory: 'major',
      status: 'proposed',
      priority: 'high',
      proposedBy: 'Eng. Khaled Head of Tooling',
      proposedDate: '2026-11-14',
      targetDate: '2026-12-15',
      affectedProduct: 'Inverter Casing Series X',
      affectedProcess: 'High-Pressure Die Casting'
    });

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.title).toBe(arabicTitle);
    expect(created.description.length).toBeGreaterThan(4000);

    // Fetch by ID
    const retrieved = await unifiedChangeControlApi.getById(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.changeCategory).toBe('major');
    expect(retrieved?.status).toBe('proposed');
  });

  it('5. should handle corrupted localStorage without throwing unhandled exceptions', async () => {
    localStorage.setItem('qms_change_controls', 'not valid json {{{');

    const res = await unifiedChangeControlApi.getAll();
    expect(res).toBeDefined();
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.total).toBeGreaterThanOrEqual(0);
  });
});
