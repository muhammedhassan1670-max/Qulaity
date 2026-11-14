import { describe, it, expect, beforeEach } from 'vitest';
import { resetQualityStorage, setWindowLocation } from '../../helpers/testHarness';

/**
 * URL Query Handoff Parser matching NCRPage logic in src/pages/quality/NCR.tsx:252-274
 */
export function parseNcrUrlParams(searchParamsString: string) {
  const p = new URLSearchParams(searchParamsString);
  const rawQty = p.get('qty');
  const parsedQty = Number(rawQty);

  return {
    title: p.get('title') || '',
    description: p.get('desc') || p.get('description') || '',
    defectType: p.get('defectType') || 'Dimensional / Geometry',
    severity: (p.get('severity') as any) || 'major',
    status: 'open' as const,
    priority: (p.get('priority') as any) || 'medium',
    department: p.get('department') || 'Quality Assurance',
    productionLine: p.get('line') || p.get('productionLine') || 'Line 01',
    affectedQuantity: Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1,
    lotNumber: p.get('lot') || p.get('partNumber') || '',
    containmentAction: p.get('containment') || '',
    disposition: 'pending' as const,
    dispositionNotes: '',
    rootCauseNotes: '',
    assignedTo: 'Eng. Quality Team',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  };
}

describe('Feature 02 Boundary: URL Query Handoff', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('handles empty, malformed, and corrupted query strings without throwing', () => {
    const malformedQueries = [
      '',
      '?',
      '???&&&=&=&',
      '?keywithoutval&===&test',
      '?title=&desc=&qty=',
    ];

    for (const q of malformedQueries) {
      setWindowLocation(`http://localhost:3000/ncr${q}`);
      const parsed = parseNcrUrlParams(window.location.search);
      expect(parsed).toBeDefined();
      expect(parsed.title).toBe('');
      expect(parsed.status).toBe('open');
      expect(parsed.affectedQuantity).toBe(1);
    }
  });

  it('correctly decodes Arabic Unicode URL-encoded query parameters', () => {
    const arabicTitle = 'عيب هيكلي في مسبوكة الألومنيوم';
    const arabicLot = 'تشغيلة-دقيقة-٢٠٢٦';
    const arabicDept = 'قسم رقابة الجودة المتقدمة';
    const query = `?title=${encodeURIComponent(arabicTitle)}&lot=${encodeURIComponent(arabicLot)}&department=${encodeURIComponent(arabicDept)}&qty=18`;

    setWindowLocation(`http://localhost:3000/ncr${query}`);
    const parsed = parseNcrUrlParams(window.location.search);

    expect(parsed.title).toBe(arabicTitle);
    expect(parsed.lotNumber).toBe(arabicLot);
    expect(parsed.department).toBe(arabicDept);
    expect(parsed.affectedQuantity).toBe(18);
  });

  it('handles hostile script and injection payloads safely as plain text', () => {
    const injectionQuery = '?title=%3Cscript%3Ealert(%22xss%22)%3C/script%3E&desc=%27%20OR%201=1%20--&containment=%3Cimg%20src=x%20onerror=alert(1)%3E';
    setWindowLocation(`http://localhost:3000/ncr${injectionQuery}`);

    const parsed = parseNcrUrlParams(window.location.search);
    expect(parsed.title).toBe('<script>alert("xss")</script>');
    expect(parsed.description).toBe("' OR 1=1 --");
    expect(parsed.containmentAction).toBe('<img src=x onerror=alert(1)>');
  });

  it('handles numerical extremes and invalid formats in quantity query parameter', () => {
    const testCases = [
      { qtyParam: 'qty=0', expected: 1 }, // zero defaults to 1
      { qtyParam: 'qty=-50', expected: 1 }, // negative defaults to 1
      { qtyParam: 'qty=not_a_number', expected: 1 }, // NaN defaults to 1
      { qtyParam: 'qty=999999999', expected: 999999999 }, // massive valid number
      { qtyParam: 'qty=3.14159', expected: 3.14159 }, // decimal float quantity
    ];

    for (const tc of testCases) {
      const parsed = parseNcrUrlParams(`?${tc.qtyParam}`);
      expect(parsed.affectedQuantity).toBe(tc.expected);
    }
  });

  it('preserves parameter integrity across massive query string length (>4000 chars)', () => {
    const hugeDesc = 'BURR-BURST-'.repeat(350); // ~3850 chars
    const query = `?title=Massive+Escalation&desc=${encodeURIComponent(hugeDesc)}&qty=42&line=Line+09`;
    setWindowLocation(`http://localhost:3000/ncr${query}`);

    const parsed = parseNcrUrlParams(window.location.search);
    expect(parsed.title).toBe('Massive Escalation');
    expect(parsed.description).toBe(hugeDesc);
    expect(parsed.affectedQuantity).toBe(42);
    expect(parsed.productionLine).toBe('Line 09');
  });
});
