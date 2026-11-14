import { describe, it, expect, beforeEach } from 'vitest';
import { resetQualityStorage, setWindowLocation } from '../../helpers/testHarness';

/**
 * URL Query Handoff Parser matching NCRPage logic in src/pages/quality/NCR.tsx:252-274
 */
export function parseNcrUrlParams(searchParamsString: string) {
  const p = new URLSearchParams(searchParamsString);
  return {
    title: p.get('title') || '',
    description: p.get('desc') || p.get('description') || '',
    defectType: p.get('defectType') || 'Dimensional / Geometry',
    severity: (p.get('severity') as any) || 'major',
    status: 'open' as const,
    priority: (p.get('priority') as any) || 'medium',
    department: p.get('department') || 'Quality Assurance',
    productionLine: p.get('line') || p.get('productionLine') || 'Line 01',
    affectedQuantity: Number(p.get('qty')) || 1,
    lotNumber: p.get('lot') || p.get('partNumber') || '',
    containmentAction: p.get('containment') || '',
    disposition: 'pending' as const,
    dispositionNotes: '',
    rootCauseNotes: '',
    assignedTo: 'Eng. Quality Team',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  };
}

describe('Feature 02: URL Query Handoff', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('correctly auto-fills form fields from full inspection escalation URL', () => {
    const search = '?create=1&source=Inspection&title=Porosity+in+Ingot&desc=Subsurface+voids+detected&defectType=Porosity&severity=critical&priority=critical&department=Foundry&line=Line+03&qty=50&lot=LOT-AL-990&containment=Hold+pallet+in+quarantine';
    setWindowLocation(`http://localhost:3000/ncr${search}`);

    const parsed = parseNcrUrlParams(window.location.search);
    expect(parsed.title).toBe('Porosity in Ingot');
    expect(parsed.description).toBe('Subsurface voids detected');
    expect(parsed.defectType).toBe('Porosity');
    expect(parsed.severity).toBe('critical');
    expect(parsed.priority).toBe('critical');
    expect(parsed.department).toBe('Foundry');
    expect(parsed.productionLine).toBe('Line 03');
    expect(parsed.affectedQuantity).toBe(50);
    expect(parsed.lotNumber).toBe('LOT-AL-990');
    expect(parsed.containmentAction).toBe('Hold pallet in quarantine');
    expect(parsed.status).toBe('open');
    expect(parsed.disposition).toBe('pending');
  });

  it('handles query parameter aliases (desc vs description, line vs productionLine, lot vs partNumber)', () => {
    const searchWithAliases = '?description=Detailed+failure+report&productionLine=Line+05+-+Robotics&partNumber=PART-BLD-7712&qty=15';
    const parsed = parseNcrUrlParams(searchWithAliases);

    expect(parsed.description).toBe('Detailed failure report');
    expect(parsed.productionLine).toBe('Line 05 - Robotics');
    expect(parsed.lotNumber).toBe('PART-BLD-7712');
    expect(parsed.affectedQuantity).toBe(15);
  });

  it('applies defaults for missing optional URL parameters', () => {
    const minimalSearch = '?title=Unknown+Anomaly';
    const parsed = parseNcrUrlParams(minimalSearch);

    expect(parsed.title).toBe('Unknown Anomaly');
    expect(parsed.description).toBe('');
    expect(parsed.defectType).toBe('Dimensional / Geometry');
    expect(parsed.severity).toBe('major');
    expect(parsed.priority).toBe('medium');
    expect(parsed.department).toBe('Quality Assurance');
    expect(parsed.productionLine).toBe('Line 01');
    expect(parsed.affectedQuantity).toBe(1);
    expect(parsed.lotNumber).toBe('');
    expect(parsed.containmentAction).toBe('');
  });

  it('correctly handles non-numeric quantity parameters safely', () => {
    const invalidQtySearch = '?qty=invalid_number&title=Test';
    const parsed = parseNcrUrlParams(invalidQtySearch);

    expect(parsed.affectedQuantity).toBe(1);
  });

  it('simulates bi-directional round-trip: inspection generates escalation URL -> NCR handoff reconstructs defect', () => {
    const inspectionFailure = {
      product: 'Turbine Rotor Disc',
      batch: 'BATCH-2026-X1',
      defectType: 'Crack / Microfracture',
      failedCount: 3,
      inspectionStation: 'Station 4 - Eddy Current',
    };

    const escalationParams = new URLSearchParams({
      create: '1',
      source: 'Station 4 - Eddy Current',
      title: `Escalated Defect: ${inspectionFailure.defectType} in ${inspectionFailure.product}`,
      desc: `Automated handoff from inspection run. Defective parts: ${inspectionFailure.failedCount}`,
      defectType: inspectionFailure.defectType,
      severity: 'critical',
      priority: 'high',
      line: inspectionFailure.inspectionStation,
      qty: String(inspectionFailure.failedCount),
      lot: inspectionFailure.batch,
      containment: 'Segregate batch from packaging line',
    });

    const handoffResult = parseNcrUrlParams(escalationParams.toString());

    expect(handoffResult.title).toContain('Crack / Microfracture');
    expect(handoffResult.description).toContain('Defective parts: 3');
    expect(handoffResult.lotNumber).toBe('BATCH-2026-X1');
    expect(handoffResult.affectedQuantity).toBe(3);
    expect(handoffResult.severity).toBe('critical');
  });
});
