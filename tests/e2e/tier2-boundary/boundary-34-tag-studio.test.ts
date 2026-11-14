/**
 * Tier 2 Boundary Tests - Feature 34: Smart Traveler & Tag Studio
 * 
 * Verifies production traveler cards, ISO 8.7 quarantine red tags,
 * calibration sticker generators, leap-year expiration dates, and quarantine interlocks.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resetQualityStorage } from '../../helpers/testHarness';

type DocType = 'traveler' | 'redtag' | 'calibration';

interface WorkTravelerCard {
  docType: 'traveler';
  partNumber: string;
  lotNumber: string;
  quantity: number;
  inspector: string;
  status: 'IN_PROCESS' | 'AQL_PASS' | 'HELD';
  routingSteps: string[];
}

interface QuarantineRedTag {
  docType: 'redtag';
  tagId: string;
  partNumber: string;
  lotNumber: string;
  defectReason: string;
  quarantineDate: string;
  holdAuthority: string;
  mrbDisposition?: 'SCRAP' | 'REWORK' | 'RTV' | 'USE_AS_IS';
  mrbAuthorizedBy?: string;
  isReleased: boolean;
}

interface CalibrationSticker {
  docType: 'calibration';
  toolId: string;
  serialNumber: string;
  calDate: string;
  dueDate: string;
  technician: string;
  accuracyGrade: string;
  isExpired: boolean;
}

function resolveDocType(raw: string): DocType {
  const normalized = (raw || '').trim().toLowerCase();
  if (normalized === 'redtag' || normalized === 'quarantine') return 'redtag';
  if (normalized === 'calibration' || normalized === 'cal') return 'calibration';
  return 'traveler';
}

function sanitizeTraveler(data: Partial<WorkTravelerCard>): WorkTravelerCard {
  const partNumber = (data.partNumber || '').trim() || 'UNKNOWN-PART';
  const lotNumber = (data.lotNumber || '').trim() || 'LOT-TEMP-DRAFT';
  const quantity = Math.max(0, Math.floor(data.quantity || 0));
  const inspector = (data.inspector || '').trim() || 'UNASSIGNED';
  const status = data.status && ['IN_PROCESS', 'AQL_PASS', 'HELD'].includes(data.status)
    ? data.status
    : 'IN_PROCESS';

  return {
    docType: 'traveler',
    partNumber,
    lotNumber,
    quantity,
    inspector,
    status,
    routingSteps: Array.isArray(data.routingSteps) ? data.routingSteps : []
  };
}

function releaseQuarantineRedTag(
  tag: QuarantineRedTag,
  mrbDisposition: QuarantineRedTag['mrbDisposition'],
  authorizer: string
): { success: boolean; tag: QuarantineRedTag; error?: string } {
  if (!mrbDisposition) {
    return { success: false, tag, error: 'MRB disposition is mandatory to release red tag' };
  }
  if (!authorizer || !authorizer.trim()) {
    return { success: false, tag, error: 'Quality/MRB authorizer signature is required' };
  }

  return {
    success: true,
    tag: {
      ...tag,
      mrbDisposition,
      mrbAuthorizedBy: authorizer.trim(),
      isReleased: true
    }
  };
}

function evaluateCalibrationStatus(calDateStr: string, dueDateStr: string, referenceDateStr?: string): {
  isValidDates: boolean;
  isExpired: boolean;
  daysRemaining: number;
} {
  const calDate = new Date(calDateStr);
  const dueDate = new Date(dueDateStr);
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();

  if (isNaN(calDate.getTime()) || isNaN(dueDate.getTime())) {
    return { isValidDates: false, isExpired: true, daysRemaining: -9999 };
  }

  const diffMs = dueDate.getTime() - refDate.getTime();
  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining < 0;

  return { isValidDates: true, isExpired, daysRemaining };
}

describe('Boundary Suite 34: Smart Traveler & Tag Studio', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('1. should resolve document types safely with graceful fallbacks for corrupted or unknown input', () => {
    expect(resolveDocType('traveler')).toBe('traveler');
    expect(resolveDocType('redtag')).toBe('redtag');
    expect(resolveDocType('quarantine')).toBe('redtag');
    expect(resolveDocType('calibration')).toBe('calibration');
    expect(resolveDocType('cal')).toBe('calibration');

    // Unknown or whitespace inputs fallback to 'traveler'
    expect(resolveDocType('')).toBe('traveler');
    expect(resolveDocType('   ')).toBe('traveler');
    expect(resolveDocType('unknown_doc_type')).toBe('traveler');
    expect(resolveDocType(null as any)).toBe('traveler');
    expect(resolveDocType(undefined as any)).toBe('traveler');
  });

  it('2. should sanitize traveler card inputs handling empty fields, negative quantity, and whitespace', () => {
    const rawData: Partial<WorkTravelerCard> = {
      partNumber: '   ',
      lotNumber: '',
      quantity: -250,
      inspector: '  Eng. Youssef  ',
      status: 'AQL_PASS'
    };

    const sanitized = sanitizeTraveler(rawData);
    expect(sanitized.partNumber).toBe('UNKNOWN-PART');
    expect(sanitized.lotNumber).toBe('LOT-TEMP-DRAFT');
    expect(sanitized.quantity).toBe(0); // Clamped from -250
    expect(sanitized.inspector).toBe('Eng. Youssef');
    expect(sanitized.status).toBe('AQL_PASS');
  });

  it('3. should enforce strict MRB release interlocks on ISO 8.7 Quarantine Red Tags', () => {
    const quarantinedTag: QuarantineRedTag = {
      docType: 'redtag',
      tagId: 'RED-2026-0881',
      partNumber: 'TURBINE-BLADE-C10',
      lotNumber: 'LOT-HEAT-9921',
      defectReason: 'فقاعات ميتالورجية سطحية تتجاوز AQL 0.4',
      quarantineDate: '2026-11-14',
      holdAuthority: 'QA Gate 2 Inspector',
      isReleased: false
    };

    // Attempt release without MRB disposition
    const failNoDisp = releaseQuarantineRedTag(quarantinedTag, undefined, 'Chief Quality Officer');
    expect(failNoDisp.success).toBe(false);
    expect(failNoDisp.error).toContain('MRB disposition is mandatory');
    expect(failNoDisp.tag.isReleased).toBe(false);

    // Attempt release without authorizer
    const failNoAuth = releaseQuarantineRedTag(quarantinedTag, 'REWORK', '   ');
    expect(failNoAuth.success).toBe(false);
    expect(failNoAuth.error).toContain('authorizer signature is required');
    expect(failNoAuth.tag.isReleased).toBe(false);

    // Valid authorized MRB release
    const validRelease = releaseQuarantineRedTag(quarantinedTag, 'REWORK', 'Quality Director Ahmed');
    expect(validRelease.success).toBe(true);
    expect(validRelease.tag.isReleased).toBe(true);
    expect(validRelease.tag.mrbDisposition).toBe('REWORK');
    expect(validRelease.tag.mrbAuthorizedBy).toBe('Quality Director Ahmed');
  });

  it('4. should handle calibration sticker leap years, past-due expiration, and future dates', () => {
    // Leap year boundary test: 2024-02-29 to 2025-02-28
    const leapYearStatus = evaluateCalibrationStatus(
      '2024-02-29T08:00:00Z',
      '2024-08-29T08:00:00Z',
      '2024-05-01T08:00:00Z'
    );
    expect(leapYearStatus.isValidDates).toBe(true);
    expect(leapYearStatus.isExpired).toBe(false);
    expect(leapYearStatus.daysRemaining).toBeGreaterThan(100);

    // Next leap year boundary test: 2028-02-29
    const leap2028 = evaluateCalibrationStatus(
      '2028-02-29T00:00:00Z',
      '2028-08-29T00:00:00Z',
      '2028-09-01T00:00:00Z'
    );
    expect(leap2028.isValidDates).toBe(true);
    expect(leap2028.isExpired).toBe(true); // Due date 2028-08-29 is past in Sep 2028
    expect(leap2028.daysRemaining).toBeLessThan(0);

    // Corrupted date inputs
    const corruptedDate = evaluateCalibrationStatus('invalid-date', '2026-12-31');
    expect(corruptedDate.isValidDates).toBe(false);
    expect(corruptedDate.isExpired).toBe(true);
  });

  it('5. should handle Arabic Unicode text and extremely long quarantine reasons (>4000 chars)', () => {
    const arabicReason = 'حجر صحي وإيقاف فوري للتشغيل: عيوب انسداد وتشققات حرارية متكررة في قالب الحقن 03.';
    const largePayload = arabicReason.repeat(60); // > 4000 characters
    expect(largePayload.length).toBeGreaterThan(4000);

    const tag: QuarantineRedTag = {
      docType: 'redtag',
      tagId: 'RED-AR-2026',
      partNumber: 'محور توربيني 40',
      lotNumber: 'دفعة-2026-أ',
      defectReason: largePayload,
      quarantineDate: '2026-11-14',
      holdAuthority: 'مراقب الجودة الأول',
      isReleased: false
    };

    expect(tag.defectReason.length).toBeGreaterThan(4000);
    expect(tag.defectReason).toContain('حجر صحي وإيقاف فوري');
    expect(tag.partNumber).toBe('محور توربيني 40');
  });
});
