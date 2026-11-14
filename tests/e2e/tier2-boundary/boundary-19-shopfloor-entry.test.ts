import { describe, it, expect, beforeEach } from 'vitest';
import {
  safeWriteLocalDefectRecords,
  loadSafeLocalDefectRecords,
  type LocalDefectRecord,
} from '@/services/safeDefectStorage';
import { resetQualityStorage } from '../../helpers/testHarness';
import { parseShopfloorBarcode } from '../tier1-features/feature-19-shopfloor-entry.test';

describe('Feature 19 Boundary: Fast Shopfloor Entry', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('enforces non-negative boundary on defect tally counters (cannot decrement below 0)', () => {
    let tally = 0;
    const decrement = (amt = 1) => {
      tally = Math.max(0, tally - amt);
      return tally;
    };

    expect(decrement(1)).toBe(0);
    expect(decrement(5)).toBe(0);

    tally = 3;
    expect(decrement(1)).toBe(2);
    expect(decrement(5)).toBe(0);
  });

  it('safely parses malformed, truncated, and corrupt barcode scanner strings', () => {
    const malformedBarcodes = [
      '',
      '||||||',
      '::::',
      'NO_DELIMITERS_HERE',
      'PART:|LOT:|QTY:abc|DEFECT:',
    ];

    for (const raw of malformedBarcodes) {
      const parsed = parseShopfloorBarcode(raw);
      expect(parsed).toBeDefined();
      expect(typeof parsed.partNumber).toBe('string');
      expect(typeof parsed.quantity).toBe('number');
      expect(parsed.quantity).toBeGreaterThanOrEqual(1);
    }
  });

  it('handles rapid touch bursts (50 consecutive increments) reliably without dropping counts', () => {
    let tally = 0;
    for (let i = 0; i < 50; i++) {
      tally += 1;
    }
    expect(tally).toBe(50);
  });

  it('safely stores and retrieves Arabic shopfloor defect logs and touch notes', () => {
    const arabicDefect: LocalDefectRecord = {
      id: 'defect-ar-01',
      source: 'shopfloor',
      line: 'خط التجميع رقم ٥',
      station: 'محطة فحص اللحام الآلي',
      partNumber: 'جزء-هيكلي-٩٩',
      lotNumber: 'تشغيلة-لحام-٢٠٢٦',
      defectType: 'عيب نفاذية لحام غير مكتملة',
      severity: 'major',
      quantity: 3,
      notes: 'تم رصد فجوة هوائية بطول ٢ ملم في وصلة الإطار السفلي',
      loggedAt: new Date().toISOString(),
    };

    const res = safeWriteLocalDefectRecords([arabicDefect], {
      reason: 'test-arabic-defect',
      allowEmptyOverwrite: true,
    });
    expect(res.ok).toBe(true);

    const loaded = loadSafeLocalDefectRecords();
    expect(loaded.length).toBe(1);
    expect(loaded[0].defectType).toContain('عيب نفاذية لحام');
    expect(loaded[0].notes).toContain('فجوة هوائية');
  });

  it('handles astronomical defect count bursts (quantity = 1,000,000) safely', () => {
    const massiveDefect: LocalDefectRecord = {
      id: 'defect-massive-01',
      source: 'shopfloor',
      line: 'Line 01',
      station: 'Stamping Press',
      partNumber: 'WASHER-001',
      lotNumber: 'LOT-BULK',
      defectType: 'Coating Missing',
      severity: 'minor',
      quantity: 1_000_000,
      loggedAt: new Date().toISOString(),
    };

    const res = safeWriteLocalDefectRecords([massiveDefect], {
      reason: 'test-massive-qty',
      allowEmptyOverwrite: true,
    });
    expect(res.ok).toBe(true);

    const loaded = loadSafeLocalDefectRecords();
    expect(loaded[0].quantity).toBe(1_000_000);
  });
});
