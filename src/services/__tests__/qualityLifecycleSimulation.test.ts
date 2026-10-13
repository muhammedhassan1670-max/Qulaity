import { describe, it, expect, beforeEach } from 'vitest';
import { seedComprehensiveQualityLifecycle } from '../seedLifecycleDemo';
import {
  loadQualityRelationships,
  relatedIdsForEntity,
  relationshipExists,
} from '../qualityRelationships';

// Polyfill localStorage in node test runner
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
  get length(): number {
    return Object.keys(this.store).length;
  }
  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new LocalStorageMock();
}

describe('End-to-End Quality 4.0 Closed-Loop Lifecycle Simulation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('executes full 5-material lifecycle, assembly, audit, CAPA, OQC, and customer complaint traceability', () => {
    // 1. Run the comprehensive simulation
    const result = seedComprehensiveQualityLifecycle();

    // Verify summary metadata
    expect(result).toBeDefined();
    expect(result.rawMaterials).toHaveLength(5);
    expect(result.assemblyDefects).toHaveLength(3);
    expect(result.totalRelationshipsLinked).toBeGreaterThanOrEqual(13);

    // ------------------------------------------------------------------------
    // Step 1: Verify 5 Raw Materials (5 different codes, lots, suppliers, IQC)
    // ------------------------------------------------------------------------
    const expectedCodes = [
      'RM-ALUM-7075',
      'RM-SEAL-NBR',
      'RM-VALV-SS316',
      'RM-BOLT-M8GR10',
      'RM-OIL-ISO46',
    ];
    const expectedLots = [
      'LOT-2026-AL-01',
      'LOT-2026-OR-02',
      'LOT-2026-VL-03',
      'LOT-2026-BL-04',
      'LOT-2026-OL-05',
    ];

    expectedCodes.forEach((code, idx) => {
      const mat = result.rawMaterials.find((m) => m.code === code);
      expect(mat).toBeDefined();
      expect(mat?.lot).toBe(expectedLots[idx]);
      expect(mat?.supplierId).toBe(`SUP-00${idx + 1}`);

      // Check that each incoming IQC inspection is linked to its supplier
      const linkedSuppliers = relatedIdsForEntity('inspection', mat!.inspectionId, 'supplier');
      expect(linkedSuppliers).toContain(`SUP-00${idx + 1}`);
    });

    // ------------------------------------------------------------------------
    // Step 2: Verify Rejected Seal Lot escalated to Supplier NCR
    // ------------------------------------------------------------------------
    const rejectedSealInspectionId = 'INS-2026-RM-02';
    const supplierNcrId = 'NCR-SUP-2026-001';

    expect(relationshipExists('inspection', rejectedSealInspectionId, 'ncr', supplierNcrId)).toBe(true);
    expect(relatedIdsForEntity('ncr', supplierNcrId, 'supplier')).toContain('SUP-002');
    expect(relatedIdsForEntity('ncr', supplierNcrId, 'inspection')).toContain(rejectedSealInspectionId);

    // ------------------------------------------------------------------------
    // Step 3: Verify Assembly Line Defects on Line 1
    // ------------------------------------------------------------------------
    const storedDefects = JSON.parse(localStorage.getItem('qms_local_defect-logs') || '[]');
    expect(storedDefects.length).toBeGreaterThanOrEqual(3);

    const crossThreadDefect = storedDefects.find((d: any) => d.id === 'DEF-2026-901A');
    expect(crossThreadDefect).toBeDefined();
    expect(crossThreadDefect.quantity).toBe(8);

    const leakDefect = storedDefects.find((d: any) => d.id === 'DEF-2026-901B');
    expect(leakDefect).toBeDefined();
    expect(leakDefect.severity).toBe('Critical');

    // Both defects linked to assembly NCR
    expect(relatedIdsForEntity('defect', 'DEF-2026-901A', 'ncr')).toContain('NCR-2026-901');
    expect(relatedIdsForEntity('defect', 'DEF-2026-901B', 'ncr')).toContain('NCR-2026-901');

    // ------------------------------------------------------------------------
    // Step 4: Verify Process Audit & Control Plan
    // ------------------------------------------------------------------------
    const storedAudits = JSON.parse(localStorage.getItem('qms_local_audits') || '[]');
    const audit = storedAudits.find((a: any) => a.id === 'AUD-2026-901');
    expect(audit).toBeDefined();
    expect(audit.findings).toBe(2);

    const storedControlPlans = JSON.parse(localStorage.getItem('qms_local_control-plans') || '[]');
    expect(storedControlPlans.some((cp: any) => cp.id === 'CP-PUMP-01')).toBe(true);

    // Audit finding linked to assembly NCR
    expect(relatedIdsForEntity('audit', 'AUD-2026-901', 'ncr')).toContain('NCR-2026-901');

    // ------------------------------------------------------------------------
    // Step 5: Verify Assembly NCR escalated to CAPA
    // ------------------------------------------------------------------------
    const storedCapas = JSON.parse(localStorage.getItem('qms_local_capa') || '[]');
    const capa = storedCapas.find((c: any) => c.id === 'CAPA-2026-901');
    expect(capa).toBeDefined();
    expect(capa.sourceNcrId).toBe('NCR-2026-901');

    expect(relationshipExists('ncr', 'NCR-2026-901', 'capa', 'CAPA-2026-901')).toBe(true);
    expect(relatedIdsForEntity('capa', 'CAPA-2026-901', 'ncr')).toContain('NCR-2026-901');

    // ------------------------------------------------------------------------
    // Step 6: Verify Outgoing Quality Inspection (OQC)
    // ------------------------------------------------------------------------
    const storedInspections = JSON.parse(localStorage.getItem('qms_local_inspections') || '[]');
    const oqc = storedInspections.find((i: any) => i.id === 'INS-2026-OQC-901');
    expect(oqc).toBeDefined();
    expect(oqc.type).toBe('final');
    expect(oqc.result).toBe('pass');

    // OQC inspection linked to raw material component lots
    const oqcComponentLots = relatedIdsForEntity('inspection', 'INS-2026-OQC-901', 'inspection');
    expect(oqcComponentLots).toContain('INS-2026-RM-01');
    expect(oqcComponentLots).toContain('INS-2026-RM-03');

    // ------------------------------------------------------------------------
    // Step 7: Verify Customer Complaint & Complete Backward Traceability
    // ------------------------------------------------------------------------
    const storedComplaints = JSON.parse(localStorage.getItem('qms_local_complaints') || '[]');
    const complaint = storedComplaints.find((c: any) => c.id === 'CMP-2026-101');
    expect(complaint).toBeDefined();
    expect(complaint.customerName).toBe('Al-Amal Industrial Equipment Co.');

    // Backward traceability check:
    // From Complaint -> OQC Inspection -> Assembly Defect / NCR / CAPA -> Raw Material Lots
    const complaintLinkedInspections = relatedIdsForEntity('complaint', 'CMP-2026-101', 'inspection');
    expect(complaintLinkedInspections).toContain('INS-2026-OQC-901');

    const complaintLinkedNcrs = relatedIdsForEntity('complaint', 'CMP-2026-101', 'ncr');
    expect(complaintLinkedNcrs).toContain('NCR-2026-901');

    // From NCR -> CAPA
    const ncrLinkedCapas = relatedIdsForEntity('ncr', 'NCR-2026-901', 'capa');
    expect(ncrLinkedCapas).toContain('CAPA-2026-901');

    // From NCR -> Shopfloor Defect Logs
    const ncrLinkedDefects = relatedIdsForEntity('ncr', 'NCR-2026-901', 'defect');
    expect(ncrLinkedDefects).toContain('DEF-2026-901A');
    expect(ncrLinkedDefects).toContain('DEF-2026-901B');

    // Total relationship graph integrity
    const allRelationships = loadQualityRelationships();
    expect(allRelationships.length).toBeGreaterThanOrEqual(13);
  });
});
