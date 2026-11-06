/**
 * QMS 4.0 - Universal Quality Intelligence & Machine Learning Data Bridge
 * Connects platform live operational records (IQC, Shopfloor, NCR, 8D, CAPA, SPC)
 * to the UDIP 2.8.2 Machine Learning & Decision Intelligence Engine.
 */
import * as XLSX from 'xlsx';

export interface UdipDatasetPayload {
  filename: string;
  fileSize: number;
  fileType: string;
  columns: string[];
  rows: Record<string, any>[];
  columnTypes?: Record<string, string>;
}

export type PresetDatasetType = 'live-all' | 'factory-500' | 'shopfloor-defects' | 'incoming-quality' | 'ncr-capa';

/**
 * Safely parse JSON array from localStorage
 */
function getStorageArray<T = any>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn(`[QMS:Bridge] Failed to parse ${key} from storage`, e);
    return [];
  }
}

/**
 * Extract and synthesize all live QMS records from localStorage into a unified ML dataset
 */
export function extractLiveQmsDataset(): UdipDatasetPayload {
  const inspections = getStorageArray('qms_local_inspections');
  const defectLogs = getStorageArray('qms_local_defect-logs');
  const ncrs = getStorageArray('qms_local_ncr');
  const capas = getStorageArray('qms_local_capa');
  const eightDs = getStorageArray('qms_local_8d');
  const complaints = getStorageArray('qms_local_complaints');

  const rows: Record<string, any>[] = [];

  // 1. Ingest Inspections
  inspections.forEach((insp: any, i: number) => {
    rows.push({
      Record_ID: insp.id || `INSP-${1000 + i}`,
      Date: insp.date || insp.inspectionDate || new Date().toISOString().slice(0, 10),
      Source_Module: 'Inspection',
      Process_Stage: insp.type || 'Incoming',
      Product_Name: insp.product || 'Standard Product',
      Lot_Number: insp.batch || insp.batchNumber || 'LOT-GENERAL',
      Line_Or_Area: insp.type === 'Incoming' ? 'Receiving Dock' : 'Assembly Line 01',
      Shift: 'Morning',
      Defect_Type: insp.defectType || (insp.result === 'Pass' ? 'None (Conforming)' : 'Non-Conformance'),
      Severity: insp.result === 'Pass' ? 'None' : (insp.severity || 'Major'),
      Defect_Count: Number(insp.defectCount) || 0,
      Sample_Size: Number(insp.sampleSize) || 20,
      Inspection_Result: (insp.result || 'Pass').toUpperCase(),
      Decision_Status: insp.result === 'Pass' ? 'Released' : 'Quarantined',
      Estimated_Cost_EGP: (Number(insp.defectCount) || 0) * 150,
      Root_Cause_Category: insp.result === 'Pass' ? 'None' : 'Material (Raw Input)',
      Inspector: insp.inspectedBy || 'Quality Inspector'
    });
  });

  // 2. Ingest Defect Logs
  defectLogs.forEach((dl: any, i: number) => {
    rows.push({
      Record_ID: dl.id || `DEF-${2000 + i}`,
      Date: dl.date || new Date().toISOString().slice(0, 10),
      Source_Module: 'Shopfloor Defect Log',
      Process_Stage: 'In-Process',
      Product_Name: dl.model || dl.productName || 'Housing Part',
      Lot_Number: dl.lotNumber || 'LOT-WIP',
      Line_Or_Area: dl.line || 'Press Line 01',
      Shift: dl.shift || 'Morning',
      Defect_Type: dl.defectType || 'Surface Scratch',
      Severity: dl.severity || 'Minor',
      Defect_Count: Number(dl.quantity || dl.count) || 1,
      Sample_Size: Number(dl.totalInspected) || 50,
      Inspection_Result: 'FAIL',
      Decision_Status: dl.status || 'Under Review',
      Estimated_Cost_EGP: Number(dl.cost) || (Number(dl.quantity || 1) * 85),
      Root_Cause_Category: dl.causeCategory || 'Man (Operator Handling)',
      Inspector: dl.operator || dl.inspector || 'Line QA'
    });
  });

  // 3. Ingest NCRs
  ncrs.forEach((ncr: any, i: number) => {
    rows.push({
      Record_ID: ncr.id || ncr.ncrNumber || `NCR-${3000 + i}`,
      Date: ncr.date || ncr.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      Source_Module: 'NCR',
      Process_Stage: ncr.department?.includes('Incoming') ? 'Incoming' : 'In-Process',
      Product_Name: ncr.product || ncr.title || 'Assembled Unit',
      Lot_Number: ncr.lotNumber || 'LOT-NCR',
      Line_Or_Area: ncr.productionLine || 'Assembly Area',
      Shift: 'Morning',
      Defect_Type: ncr.defectType || 'Geometric Tolerance',
      Severity: ncr.severity || 'Major',
      Defect_Count: Number(ncr.affectedQuantity) || 5,
      Sample_Size: Number(ncr.affectedQuantity) || 20,
      Inspection_Result: 'FAIL',
      Decision_Status: ncr.dispositionDecision || ncr.status || 'Pending MRB',
      Estimated_Cost_EGP: (Number(ncr.affectedQuantity) || 5) * 320,
      Root_Cause_Category: ncr.rootCauseNotes ? 'Method (Procedure Deviation)' : 'Machine (Drift)',
      Inspector: ncr.assignedTo || 'QA Lead'
    });
  });

  // 4. Ingest Customer Complaints
  complaints.forEach((cmp: any, i: number) => {
    rows.push({
      Record_ID: cmp.id || cmp.complaintId || `CMP-${4000 + i}`,
      Date: cmp.dateReceived || cmp.date || new Date().toISOString().slice(0, 10),
      Source_Module: 'Customer Complaint',
      Process_Stage: 'Customer Field Return',
      Product_Name: cmp.productModel || cmp.product || 'Finished Product',
      Lot_Number: cmp.batchNumber || 'LOT-SHIPPED',
      Line_Or_Area: 'Finished Goods / Shipping',
      Shift: 'Normal',
      Defect_Type: cmp.defectType || cmp.title || 'Field Leakage / Failure',
      Severity: cmp.severity || 'Critical',
      Defect_Count: Number(cmp.quantityAffected) || 1,
      Sample_Size: 1,
      Inspection_Result: 'FAIL',
      Decision_Status: cmp.status || 'Investigating',
      Estimated_Cost_EGP: (Number(cmp.quantityAffected) || 1) * 1200,
      Root_Cause_Category: 'Escape (Undetected in Final OQC)',
      Inspector: cmp.assignedTo || 'Customer Quality Eng'
    });
  });

  // 5. Ingest CAPAs
  capas.forEach((capa: any, i: number) => {
    rows.push({
      Record_ID: capa.id || `CAPA-${5000 + i}`,
      Date: capa.targetDate || new Date().toISOString().slice(0, 10),
      Source_Module: 'CAPA',
      Process_Stage: 'Corrective Action',
      Product_Name: capa.title || 'CAPA Item',
      Lot_Number: capa.sourceNcrId || 'LOT-CAPA',
      Line_Or_Area: capa.department || 'Quality Governance',
      Shift: 'Normal',
      Defect_Type: capa.actionType || 'Corrective',
      Severity: capa.priority || 'High',
      Defect_Count: 1,
      Sample_Size: 1,
      Inspection_Result: capa.effectivenessVerification === 'Effective' ? 'PASS' : 'FAIL',
      Decision_Status: capa.statusPhase || 'Action',
      Estimated_Cost_EGP: 500,
      Root_Cause_Category: capa.rootCause ? 'Systemic Root Cause' : 'Operational',
      Inspector: capa.owner || 'CAPA Lead'
    });
  });

  // 6. Ingest 8Ds
  eightDs.forEach((d: any, i: number) => {
    rows.push({
      Record_ID: d.id || d.number || `8D-${6000 + i}`,
      Date: new Date().toISOString().slice(0, 10),
      Source_Module: '8D Problem Solving',
      Process_Stage: d.productionLine || 'Assembly',
      Product_Name: d.product || '8D Subject',
      Lot_Number: d.lotNumber || 'LOT-8D',
      Line_Or_Area: d.productionLine || 'Assembly Area',
      Shift: 'Morning',
      Defect_Type: d.title || 'Porosity / Deviation',
      Severity: 'Major',
      Defect_Count: Number(d.containedQty) || 1,
      Sample_Size: Number(d.containedQty) || 20,
      Inspection_Result: d.statusPhase === 'Closed' ? 'PASS' : 'FAIL',
      Decision_Status: d.statusPhase || 'D4: Root Cause',
      Estimated_Cost_EGP: 1500,
      Root_Cause_Category: d.rootCause ? '5-Why Validated Root Cause' : 'Investigation',
      Inspector: d.teamLeader || '8D Champion'
    });
  });

  // If local records are fewer than 15, synthesize realistic operational seed records so ML models can run immediately
  if (rows.length < 15) {
    const seedDefects = [
      { type: 'Porosity & Incomplete Weld', line: 'Welding Line 02', part: 'Compressor Housing X1', shift: 'Night', sev: 'Critical', res: 'FAIL', rpn: 140, cost: 450, cause: 'Machine (Gas Flow Low)' },
      { type: 'Surface Scratch Coating', line: 'Press Line 01', part: 'Steel Outer Chassis', shift: 'Morning', sev: 'Minor', res: 'FAIL', rpn: 36, cost: 75, cause: 'Man (Die Handling)' },
      { type: 'Thickness below minimum', line: 'Receiving Dock', part: 'Steel Coil 1.90mm', shift: 'Morning', sev: 'Major', res: 'FAIL', rpn: 105, cost: 600, cause: 'Material (Vendor Drift)' },
      { type: 'Mounting Hole Diameter', line: 'CNC Line 03', part: 'Transmission Gear Wheel', shift: 'Afternoon', sev: 'Major', res: 'FAIL', rpn: 80, cost: 220, cause: 'Machine (Tool Wear)' },
      { type: 'Label Placement & Barcode', line: 'Packaging Dock', part: 'Finished Carton Unit', shift: 'Morning', sev: 'Minor', res: 'FAIL', rpn: 18, cost: 40, cause: 'Method (Sensor Misaligned)' },
      { type: 'None (Conforming)', line: 'Press Line 01', part: 'Steel Outer Chassis', shift: 'Morning', sev: 'None', res: 'PASS', rpn: 10, cost: 0, cause: 'None' },
      { type: 'None (Conforming)', line: 'Assembly Line 01', part: 'Compressor Housing X1', shift: 'Morning', sev: 'None', res: 'PASS', rpn: 10, cost: 0, cause: 'None' },
      { type: 'None (Conforming)', line: 'Receiving Dock', part: 'Steel Coil 1.90mm', shift: 'Afternoon', sev: 'None', res: 'PASS', rpn: 10, cost: 0, cause: 'None' },
      { type: 'Oil Pressure Leak', line: 'Welding Line 02', part: 'Hydraulic Flow Tube', shift: 'Night', sev: 'Critical', res: 'FAIL', rpn: 210, cost: 890, cause: 'Machine (Seal Degradation)' },
      { type: 'None (Conforming)', line: 'CNC Line 03', part: 'Transmission Gear Wheel', shift: 'Morning', sev: 'None', res: 'PASS', rpn: 10, cost: 0, cause: 'None' },
      { type: 'Dimensional Out of Spec', line: 'Press Line 01', part: 'Steel Outer Chassis', shift: 'Afternoon', sev: 'Major', res: 'FAIL', rpn: 96, cost: 310, cause: 'Measurement (CMM Drift)' },
      { type: 'None (Conforming)', line: 'Assembly Line 01', part: 'Finished Unit Pro', shift: 'Night', sev: 'None', res: 'PASS', rpn: 10, cost: 0, cause: 'None' },
      { type: 'Paint Peeling', line: 'Paint Line 04', part: 'Top Cover Enclosure', shift: 'Afternoon', sev: 'Major', res: 'FAIL', rpn: 120, cost: 280, cause: 'Method (Curing Temp)' },
      { type: 'None (Conforming)', line: 'Receiving Dock', part: 'Alloy Flange 45mm', shift: 'Morning', sev: 'None', res: 'PASS', rpn: 10, cost: 0, cause: 'None' },
      { type: 'Gasket Misalignment', line: 'Assembly Line 02', part: 'Compressor Housing X1', shift: 'Night', sev: 'Major', res: 'FAIL', rpn: 84, cost: 190, cause: 'Man (Torque Sequence)' }
    ];

    seedDefects.forEach((seed, idx) => {
      rows.push({
        Record_ID: `SYN-${5000 + idx}`,
        Date: new Date(Date.now() - (idx * 86400000)).toISOString().slice(0, 10),
        Source_Module: 'Operational History',
        Process_Stage: seed.line.includes('Receiving') ? 'Incoming' : 'In-Process',
        Product_Name: seed.part,
        Lot_Number: `LOT-2611-0${10 + idx}`,
        Line_Or_Area: seed.line,
        Shift: seed.shift,
        Defect_Type: seed.type,
        Severity: seed.sev,
        Defect_Count: seed.res === 'PASS' ? 0 : Math.floor(1 + (idx % 6)),
        Sample_Size: 30,
        Inspection_Result: seed.res,
        Decision_Status: seed.res === 'PASS' ? 'Released' : 'Rework / Action',
        Estimated_Cost_EGP: seed.cost,
        Root_Cause_Category: seed.cause,
        Inspector: `Inspector ${1 + (idx % 4)}`
      });
    });
  }

  const columns = Object.keys(rows[0] || {});
  const jsonStr = JSON.stringify(rows);

  return {
    filename: 'qms_live_quality_records.csv',
    fileSize: jsonStr.length,
    fileType: 'csv',
    columns,
    rows
  };
}

/**
 * Fetch and parse the pre-loaded 500 Factory Quality Master dataset
 */
export async function fetchFactoryMasterDataset(): Promise<UdipDatasetPayload> {
  const res = await fetch('/quality-intelligence/factory_quality_master_500.csv');
  if (!res.ok) {
    throw new Error('Could not load factory_quality_master_500.csv');
  }
  const text = await res.text();
  const wb = XLSX.read(text, { type: 'string' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('Factory master CSV is empty');
  }

  // Clean and normalize column names for ML modeling
  const rows = rawRows.map((r) => {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(r)) {
      const cleanKey = k.trim().replace(/\s+/g, '_').replace(/[/\\?%*:]/g, '');
      clean[cleanKey] = v;
    }
    return clean;
  });

  const columns = Object.keys(rows[0]);
  return {
    filename: 'factory_quality_master_500.csv',
    fileSize: text.length,
    fileType: 'csv',
    columns,
    rows
  };
}

/**
 * Deliver dataset payload directly to the embedded UDIP iframe
 */
export function sendDatasetToUdip(
  iframe: HTMLIFrameElement | null,
  dataset: UdipDatasetPayload,
  targetTab: string = 'models'
): boolean {
  if (!iframe || !iframe.contentWindow) return false;

  try {
    // 1. Direct window method if same origin
    const win = iframe.contentWindow as any;
    if (win.UDIP && win.UDIP.DatasetSession) {
      win.UDIP.DatasetSession.loadNewDataset(dataset);
      if (win.UDIP.App && typeof win.UDIP.App.switchTab === 'function') {
        setTimeout(() => win.UDIP.App.switchTab(targetTab), 250);
      }
      return true;
    }
  } catch (e) {
    console.warn('[QMS:Bridge] Direct contentWindow access restricted, falling back to postMessage', e);
  }

  // 2. PostMessage fallback
  iframe.contentWindow.postMessage(
    {
      type: 'UDIP_LOAD_DATASET',
      payload: dataset,
      tab: targetTab
    },
    '*'
  );
  return true;
}

/**
 * Switch active workspace tab inside UDIP
 */
export function switchUdipTab(iframe: HTMLIFrameElement | null, tab: string): void {
  if (!iframe || !iframe.contentWindow) return;

  try {
    const win = iframe.contentWindow as any;
    if (win.UDIP && win.UDIP.App && typeof win.UDIP.App.switchTab === 'function') {
      win.UDIP.App.switchTab(tab);
      return;
    }
  } catch (e) {}

  iframe.contentWindow.postMessage({ type: 'UDIP_SWITCH_TAB', tab }, '*');
}

/**
 * Set platform language inside UDIP
 */
export function setUdipLang(iframe: HTMLIFrameElement | null, lang: 'ar' | 'en'): void {
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage({ type: 'UDIP_SET_LANG', lang }, '*');
}
