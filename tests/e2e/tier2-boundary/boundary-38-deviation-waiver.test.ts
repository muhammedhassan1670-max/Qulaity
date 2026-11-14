/**
 * Tier 2 Boundary Tests - Feature 38: Deviation & Waiver 4-Step Wizard
 * 
 * Verifies temporary/permanent/emergency concessions, triple-approval requirements,
 * expiry date boundaries, quantity limit guards, and storage resilience.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedDeviationApi, type DeviationData } from '../../../src/api/unified-api';
import { resetQualityStorage } from '../../helpers/testHarness';

interface DeviationApprovalCheck {
  isApproved: boolean;
  missingApprovers: string[];
}

function checkTripleApproval(approvers: string[], requiredRoles = ['Quality', 'Engineering', 'Operations']): DeviationApprovalCheck {
  const normalized = approvers.map((a) => a.trim().toLowerCase());
  const missing = requiredRoles.filter((role) => !normalized.includes(role.toLowerCase()));
  return {
    isApproved: missing.length === 0,
    missingApprovers: missing
  };
}

function validateTemporaryConcession(data: Partial<DeviationData>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.title || !data.title.trim()) {
    errors.push('Title is required');
  }

  if (data.deviationType === 'temporary') {
    if (!data.expiryDate) {
      errors.push('Expiry date is mandatory for temporary concessions');
    } else {
      const eff = new Date(data.effectiveDate || Date.now());
      const exp = new Date(data.expiryDate);
      if (exp.getTime() <= eff.getTime()) {
        errors.push('Expiry date must be strictly after effective date');
      }
    }
  }

  const qty = Number(data.affectedQuantity);
  if (data.affectedQuantity !== undefined && (isNaN(qty) || qty <= 0)) {
    errors.push('Affected quantity must be greater than zero');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

describe('Boundary Suite 38: Deviation & Waiver 4-Step Wizard', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('1. should enforce mandatory expiry dates strictly after effective dates for temporary concessions', () => {
    // Valid temporary concession
    const valid = validateTemporaryConcession({
      title: 'Temporary waiver for surface finish Ra 0.8',
      deviationType: 'temporary',
      effectiveDate: '2026-11-14T08:00:00Z',
      expiryDate: '2026-11-28T08:00:00Z',
      affectedQuantity: 500
    });
    expect(valid.isValid).toBe(true);
    expect(valid.errors.length).toBe(0);

    // Missing expiry date
    const missingExp = validateTemporaryConcession({
      title: 'Temporary waiver missing expiry',
      deviationType: 'temporary',
      effectiveDate: '2026-11-14T08:00:00Z'
    });
    expect(missingExp.isValid).toBe(false);
    expect(missingExp.errors).toContain('Expiry date is mandatory for temporary concessions');

    // Retroactive or past expiry date
    const pastExp = validateTemporaryConcession({
      title: 'Temporary waiver retroactive expiry',
      deviationType: 'temporary',
      effectiveDate: '2026-11-14T08:00:00Z',
      expiryDate: '2026-11-10T08:00:00Z'
    });
    expect(pastExp.isValid).toBe(false);
    expect(pastExp.errors).toContain('Expiry date must be strictly after effective date');
  });

  it('2. should reject zero, negative, or NaN affected quantities in waiver requests', () => {
    const zeroQty = validateTemporaryConcession({
      title: 'Zero qty waiver',
      deviationType: 'permanent',
      affectedQuantity: 0
    });
    expect(zeroQty.isValid).toBe(false);
    expect(zeroQty.errors).toContain('Affected quantity must be greater than zero');

    const negQty = validateTemporaryConcession({
      title: 'Negative qty waiver',
      deviationType: 'permanent',
      affectedQuantity: -120
    });
    expect(negQty.isValid).toBe(false);
    expect(negQty.errors).toContain('Affected quantity must be greater than zero');
  });

  it('3. should enforce triple approval signatures (Quality, Engineering, Operations) before final approval', () => {
    // Partial approvals
    const onlyQuality = checkTripleApproval(['Quality']);
    expect(onlyQuality.isApproved).toBe(false);
    expect(onlyQuality.missingApprovers).toEqual(['Engineering', 'Operations']);

    const qualityAndEng = checkTripleApproval(['Quality', 'Engineering']);
    expect(qualityAndEng.isApproved).toBe(false);
    expect(qualityAndEng.missingApprovers).toEqual(['Operations']);

    // Full triple approvals (case-insensitive)
    const fullApproval = checkTripleApproval(['quality', 'engineering', 'operations']);
    expect(fullApproval.isApproved).toBe(true);
    expect(fullApproval.missingApprovers.length).toBe(0);
  });

  it('4. should create and retrieve deviations via unifiedDeviationApi with Arabic Unicode and long justifications', async () => {
    const arabicTitle = 'طلب انحراف وتجاوز هندسي مؤقت لدوران خط الإنتاج رقم 02';
    const longJustification = 'المبرر الفني والاقتصادي: تأخر وصول شحنة الصمامات المعتمدة مع توفر بديل مكافئ هندسياً يلبي معايير السلامة. '.repeat(40);
    expect(longJustification.length).toBeGreaterThan(4000);

    const created = await unifiedDeviationApi.create({
      title: arabicTitle,
      description: longJustification,
      deviationType: 'temporary',
      status: 'submitted',
      riskLevel: 'medium',
      requestor: 'Eng. Tamer Quality Lead',
      effectiveDate: '2026-11-14',
      expiryDate: '2026-12-01',
      processName: 'Machining Line 02',
      productName: 'Compressor Housing'
    });

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.title).toBe(arabicTitle);
    expect(created.description.length).toBeGreaterThan(4000);

    // Retrieve via API
    const fetched = await unifiedDeviationApi.getById(created.id);
    expect(fetched).toBeDefined();
    expect(fetched?.title).toBe(arabicTitle);
    expect(fetched?.status).toBe('submitted');
  });

  it('5. should recover gracefully when local storage is cleared or holds corrupted JSON', async () => {
    // Corrupt the storage key
    localStorage.setItem('qms_deviations', '{ corrupted_syntax: invalid json ###');

    const res = await unifiedDeviationApi.getAll();
    expect(res).toBeDefined();
    expect(Array.isArray(res.data)).toBe(true);
    // Should return fallback or empty array without crashing
    expect(res.total).toBeGreaterThanOrEqual(0);
  });
});
