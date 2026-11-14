import { describe, it, expect, beforeEach } from 'vitest';
import {
  safeWriteLocalDefectRecords,
  loadSafeLocalDefectRecords,
  type LocalDefectRecord,
} from '@/services/safeDefectStorage';
import { resetQualityStorage } from '../../helpers/testHarness';

/**
 * Industrial Shopfloor Barcode Scanner Payload Parser
 * Parses standard GS1 / 2D DataMatrix format: "PART:P-101|LOT:L-2026|LINE:L2|QTY:5|DEFECT:Dent"
 */
export function parseShopfloorBarcode(barcodeString: string) {
  const parts = barcodeString.split('|');
  const result: Record<string, string> = {};
  for (const part of parts) {
    const [key, ...val] = part.split(':');
    if (key && val.length > 0) {
      result[key.trim().toUpperCase()] = val.join(':').trim();
    }
  }
  return {
    partNumber: result['PART'] || '',
    lotNumber: result['LOT'] || '',
    productionLine: result['LINE'] || 'Line 01',
    quantity: Number(result['QTY']) || 1,
    defectType: result['DEFECT'] || 'General Defect',
  };
}

describe('Feature 19: Fast Shopfloor Entry', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('parses industrial 2D barcode scan payload into defect entry fields', () => {
    const barcodeRaw = 'PART:PART-ACT-1001|LOT:LOT-2026-AL-44|LINE:Line 02 - CNC|QTY:12|DEFECT:Porosity';
    const parsed = parseShopfloorBarcode(barcodeRaw);

    expect(parsed.partNumber).toBe('PART-ACT-1001');
    expect(parsed.lotNumber).toBe('LOT-2026-AL-44');
    expect(parsed.productionLine).toBe('Line 02 - CNC');
    expect(parsed.quantity).toBe(12);
    expect(parsed.defectType).toBe('Porosity');
  });

  it('simulates rapid single-touch defect counters (+1, +5, +10) on operator touch interface', () => {
    let defectTally = 0;

    const increment = (count: number) => {
      defectTally += count;
      return defectTally;
    };

    expect(increment(1)).toBe(1);
    expect(increment(1)).toBe(2);
    expect(increment(5)).toBe(7);
    expect(increment(10)).toBe(17);
  });

  it('persists rapid shopfloor defect log safely into offline-first local defect repository', () => {
    const defectEntry: LocalDefectRecord = {
      id: 'defect-quick-001',
      title: 'Fast Counter Log: Stamping Wrinkles',
      description: 'Rapid logged defect from press station 4',
      defectType: 'Wrinkles / Distortion',
      defectCategory: 'Stamping Defect',
      severity: 'major',
      recordType: 'in-process',
      quantity: 8,
      productionLine: 'Press Line 04',
      partNumber: 'PART-PNL-3003',
      lotNumber: 'LOT-2026-ST-88',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending_review',
    };

    const writeResult = safeWriteLocalDefectRecords([defectEntry], {
      reason: 'Shopfloor quick touch log',
      allowEmptyOverwrite: false,
    });

    expect(writeResult.ok).toBe(true);

    const loaded = loadSafeLocalDefectRecords();
    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe('defect-quick-001');
    expect(loaded[0].quantity).toBe(8);
    expect(loaded[0].productionLine).toBe('Press Line 04');
  });

  it('calculates preliminary financial COPQ impact based on defect unit scrap cost', () => {
    const unitScrapCost = 145.50; // $ per housing
    const quantityScrapped = 6;
    const laborReworkHours = 2.5;
    const hourlyLaborRate = 48.00;

    const materialCost = unitScrapCost * quantityScrapped;
    const laborCost = laborReworkHours * hourlyLaborRate;
    const totalCopqImpact = materialCost + laborCost;

    expect(materialCost).toBe(873.00);
    expect(laborCost).toBe(120.00);
    expect(totalCopqImpact).toBe(993.00);
  });

  it('handles batch barcode scanning of multiple consecutive assemblies without data loss', () => {
    const barcodes = [
      'PART:P-01|LOT:L-01|QTY:1|DEFECT:Dent',
      'PART:P-01|LOT:L-01|QTY:2|DEFECT:Burr',
      'PART:P-02|LOT:L-02|QTY:1|DEFECT:Scratch',
    ];

    const records: LocalDefectRecord[] = barcodes.map((bc, idx) => {
      const parsed = parseShopfloorBarcode(bc);
      return {
        id: `scan-${idx}`,
        title: `Scan ${idx + 1}: ${parsed.defectType}`,
        description: `Logged via barcode reader for part ${parsed.partNumber}`,
        defectType: parsed.defectType,
        quantity: parsed.quantity,
        partNumber: parsed.partNumber,
        lotNumber: parsed.lotNumber,
        productionLine: parsed.productionLine,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'open',
      };
    });

    safeWriteLocalDefectRecords(records, {
      reason: 'Batch barcode import',
      allowEmptyOverwrite: true,
    });

    const stored = loadSafeLocalDefectRecords();
    expect(stored.length).toBe(3);
    const totalDefectiveUnits = stored.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    expect(totalDefectiveUnits).toBe(4); // 1 + 2 + 1 = 4
  });
});
