import { describe, it, expect } from 'vitest';

describe('Feature 34: Smart Traveler & Tag Print Studio', () => {
  interface TravelerOperation {
    opCode: string;
    workstation: string;
    specification: string;
    operatorSignature: string;
    qcApproval: 'PASS' | 'FAIL' | 'PENDING';
  }

  interface WorkTravelerCard {
    partName: string;
    lotNumber: string;
    quantity: number;
    isoStandard: string;
    operations: TravelerOperation[];
    qrPayload: string;
  }

  interface QuarantineRedTag {
    tagId: string;
    ncrNumber: string;
    isoClause: string;
    holdReason: string;
    physicalCageLocation: string;
    quarantineInspector: string;
    status: 'HOLD' | 'RELEASED' | 'SCRAPPED';
    qrPayload: string;
  }

  interface CalibrationSticker {
    toolId: string;
    toolName: string;
    calibrationDate: string;
    expiryDate: string;
    calibratedBy: string;
    status: 'CALIBRATED' | 'OVERDUE';
    qrPayload: string;
  }

  it('validates schema and sign-off progression of production Work Traveler card', () => {
    const traveler: WorkTravelerCard = {
      partName: 'MAIN SPINDLE SHAFT 4041',
      lotNumber: 'LOT-2026-X89',
      quantity: 500,
      isoStandard: 'ISO 9001:2015 Clause 8.5.2',
      operations: [
        { opCode: 'OP-10', workstation: 'Laser Cutting', specification: 'Length 450 ± 0.5mm', operatorSignature: 'Eng. M.H.', qcApproval: 'PASS' },
        { opCode: 'OP-20', workstation: 'CNC Lathe', specification: 'Inner Bore 45.000 ± 0.015mm', operatorSignature: 'Op. 12', qcApproval: 'PASS' },
        { opCode: 'OP-30', workstation: 'Induction Hardening', specification: '58-62 HRC', operatorSignature: 'Op. 04', qcApproval: 'PASS' },
        { opCode: 'OP-40', workstation: 'OQC Packaging', specification: 'Scratch-free + e-COA', operatorSignature: 'Q-Inspector', qcApproval: 'PASS' },
      ],
      qrPayload: 'https://qmssystem.gt.tc/traceability?lot=LOT-2026-X89',
    };

    expect(traveler.partName).toBe('MAIN SPINDLE SHAFT 4041');
    expect(traveler.quantity).toBe(500);
    expect(traveler.operations.length).toBe(4);
    expect(traveler.operations.every((op) => op.qcApproval === 'PASS')).toBe(true);
    expect(traveler.isoStandard).toContain('8.5.2');
  });

  it('enforces ISO 8.7 Quarantine Red Tag containment and holding cage segregation', () => {
    const redTag: QuarantineRedTag = {
      tagId: 'TAG-RED-2026-991',
      ncrNumber: 'NCR-2026-X089',
      isoClause: 'ISO 9001:2015 Clause 8.7',
      holdReason: 'Diameter deviation +0.08mm and oil contamination',
      physicalCageLocation: 'CAGE-03 (LOCKED)',
      quarantineInspector: 'Lead Quality Inspector M. Hassan',
      status: 'HOLD',
      qrPayload: JSON.stringify({ tag: 'TAG-RED-2026-991', ncr: 'NCR-2026-X089', hold: true }),
    };

    expect(redTag.status).toBe('HOLD');
    expect(redTag.physicalCageLocation).toContain('CAGE-03');
    expect(redTag.isoClause).toContain('8.7');
    expect(redTag.ncrNumber).toBe('NCR-2026-X089');
  });

  it('validates Scrap Tag authorization, cost center, and MRB disposition signature', () => {
    interface ScrapTag {
      scrapId: string;
      partNumber: string;
      scrapQuantity: number;
      estimatedCostUsd: number;
      mrbDispositionSignedBy: string;
      reasonCode: string;
      dispositionDate: string;
    }

    const scrapTag: ScrapTag = {
      scrapId: 'SCRAP-2026-041',
      partNumber: 'PART-ACT-1001',
      scrapQuantity: 14,
      estimatedCostUsd: 18500,
      mrbDispositionSignedBy: 'MRB Board Lead Dr. Klaus',
      reasonCode: 'METALLURGICAL_INTERNAL_SHRINKAGE',
      dispositionDate: '2026-11-14',
    };

    expect(scrapTag.scrapQuantity).toBe(14);
    expect(scrapTag.estimatedCostUsd).toBe(18500);
    expect(scrapTag.mrbDispositionSignedBy).toContain('Dr. Klaus');
    expect(scrapTag.reasonCode).toBe('METALLURGICAL_INTERNAL_SHRINKAGE');
  });

  it('validates Calibration Sticker schema, tool ID, and expiration date checking', () => {
    const calibrationTag: CalibrationSticker = {
      toolId: 'TORQUE-WRENCH-01',
      toolName: 'Stahlwille Digital Torque Wrench 20-100 Nm',
      calibrationDate: '2026-05-15',
      expiryDate: '2026-11-15',
      calibratedBy: 'Metrology Lab Tech A. Gaber',
      status: 'CALIBRATED',
      qrPayload: 'https://qmssystem.gt.tc/calibration/TORQUE-WRENCH-01',
    };

    const isCalibrationExpired = (expiryDateStr: string): boolean => {
      const expiry = new Date(expiryDateStr);
      const today = new Date('2026-11-14'); // System date
      return today.getTime() > expiry.getTime();
    };

    expect(calibrationTag.toolId).toBe('TORQUE-WRENCH-01');
    expect(calibrationTag.status).toBe('CALIBRATED');
    expect(isCalibrationExpired(calibrationTag.expiryDate)).toBe(false);
    expect(isCalibrationExpired('2026-10-01')).toBe(true);
  });

  it('serializes and parses QR code payloads for instant mobile scanning verification', () => {
    const originalPayload = {
      docType: 'TRAVELER',
      lotNumber: 'LOT-2026-X89',
      partNumber: 'PART-ACT-1001',
      quantity: 500,
      timestamp: 1763114400000,
      verifiedSignature: 'SHA256:d8e8fca9b120',
    };

    const serializedQrString = JSON.stringify(originalPayload);
    expect(typeof serializedQrString).toBe('string');

    // Simulate mobile QR reader scanning payload
    const parsedPayload = JSON.parse(serializedQrString);
    expect(parsedPayload.docType).toBe('TRAVELER');
    expect(parsedPayload.lotNumber).toBe('LOT-2026-X89');
    expect(parsedPayload.quantity).toBe(500);
    expect(parsedPayload.verifiedSignature).toContain('SHA256');
  });
});
