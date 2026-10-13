/**
 * QMS Enterprise 4.0 - End-to-End Quality Lifecycle Simulation & Seeding
 *
 * Demonstrates a complete closed-loop manufacturing & quality journey:
 * 1. 5 Incoming Raw Materials (Different codes, lots, suppliers, IQC inspections & defects)
 * 2. Supplier NCR on rejected seal lot (Quarantine & Return)
 * 3. Assembly Line Execution (500 units, Assembly defects logged in Defect Recorder)
 * 4. Control Plan & Process Audit discovering torque deviation
 * 5. Internal NCR & CAPA with 5-Whys Root Cause Analysis
 * 6. Outgoing Quality Control (OQC) sampling inspection on finished batch
 * 7. Customer Delivery & Customer Complaint with full backward traceability
 */

import { createQualityRelationship, loadQualityRelationships } from './qualityRelationships';

export interface QualitySimulationSummary {
  timestamp: string;
  rawMaterials: Array<{
    code: string;
    name: string;
    lot: string;
    quantity: string;
    supplier: string;
    supplierId: string;
    inspectionId: string;
    result: 'Pass' | 'Fail' | 'Conditional';
    defectReported?: string;
  }>;
  supplierNcrId?: string;
  assemblyBatch: string;
  assemblyDefects: Array<{
    id: string;
    defectType: string;
    quantity: number;
    severity: string;
    productionLine?: string;
    station?: string;
    [key: string]: any;
  }>;
  controlPlanId: string;
  auditId: string;
  assemblyNcrId: string;
  capaId: string;
  oqcInspectionId: string;
  customerComplaintId: string;
  totalRelationshipsLinked: number;
  traceabilityChain: Array<{
    step: string;
    module: string;
    recordId: string;
    description: string;
    linkedTo: string;
  }>;
}

export function seedComprehensiveQualityLifecycle(): QualitySimulationSummary {
  if (typeof localStorage === 'undefined') {
    throw new Error('localStorage is not available in this environment');
  }

  // --------------------------------------------------------------------------
  // 1. SUPPLIERS
  // --------------------------------------------------------------------------
  const suppliers = [
    {
      id: 'SUP-001',
      supplierCode: 'SUP-001',
      name: 'Precision Metals Co.',
      category: 'Metals & Castings',
      rating: 4.8,
      status: 'Approved',
      email: 'quality@precisionmetals.com',
      primaryContact: 'Eng. Tarek Amer',
    },
    {
      id: 'SUP-002',
      supplierCode: 'SUP-002',
      name: 'Apex Polymer & Seals Ltd.',
      category: 'Polymers & Gaskets',
      rating: 3.2,
      status: 'Conditional',
      email: 'support@apexpolymer.com',
      primaryContact: 'Mona Radwan',
    },
    {
      id: 'SUP-003',
      supplierCode: 'SUP-003',
      name: 'Delta Precision Components',
      category: 'Machined Parts',
      rating: 4.9,
      status: 'Approved',
      email: 'orders@deltacomponents.com',
      primaryContact: 'Karim Youssef',
    },
    {
      id: 'SUP-004',
      supplierCode: 'SUP-004',
      name: 'Titan Fasteners Global',
      category: 'Hardware & Fasteners',
      rating: 4.5,
      status: 'Approved',
      email: 'sales@titanfasteners.com',
      primaryContact: 'Ramy Helmy',
    },
    {
      id: 'SUP-005',
      supplierCode: 'SUP-005',
      name: 'Gulf Lubricants & Fluids',
      category: 'Chemicals & Oils',
      rating: 4.7,
      status: 'Approved',
      email: 'lab@gulflubricants.com',
      primaryContact: 'Hassan Nabil',
    },
  ];
  localStorage.setItem('qms_local_suppliers', JSON.stringify(suppliers));

  // --------------------------------------------------------------------------
  // 2. INCOMING RAW MATERIALS & IQC INSPECTIONS (5 Materials, 5 Lots)
  // --------------------------------------------------------------------------
  const rawMaterials = [
    {
      code: 'RM-ALUM-7075',
      name: 'Aluminum 7075-T6 Billets (Pump Body)',
      lot: 'LOT-2026-AL-01',
      quantity: '1,500 Kg',
      supplier: 'Precision Metals Co.',
      supplierId: 'SUP-001',
      inspectionId: 'INS-2026-RM-01',
      result: 'Conditional' as const,
      defectReported: 'Surface roughness (Ra 3.8 µm) slightly above 3.2 µm target. Accepted with internal machining concession.',
    },
    {
      code: 'RM-SEAL-NBR',
      name: 'High-Pressure NBR O-Rings 25x3mm',
      lot: 'LOT-2026-OR-02',
      quantity: '5,000 Pcs',
      supplier: 'Apex Polymer & Seals Ltd.',
      supplierId: 'SUP-002',
      inspectionId: 'INS-2026-RM-02',
      result: 'Fail' as const,
      defectReported: 'Shore A hardness out of spec (62 vs 75 required) and diameter shrinkage. LOT REJECTED to Quarantine.',
    },
    {
      code: 'RM-VALV-SS316',
      name: 'Stainless Steel 316 Valve Plungers',
      lot: 'LOT-2026-VL-03',
      quantity: '2,000 Pcs',
      supplier: 'Delta Precision Components',
      supplierId: 'SUP-003',
      inspectionId: 'INS-2026-RM-03',
      result: 'Pass' as const,
      defectReported: '100% conforming dimensions and ultrasonic test certified.',
    },
    {
      code: 'RM-BOLT-M8GR10',
      name: 'M8x45 Grade 10.9 Zinc Coated Bolts',
      lot: 'LOT-2026-BL-04',
      quantity: '10,000 Pcs',
      supplier: 'Titan Fasteners Global',
      supplierId: 'SUP-004',
      inspectionId: 'INS-2026-RM-04',
      result: 'Pass' as const,
      defectReported: '12 bolts had thread burrs in 200-sample check. Sorted and cleaned on site.',
    },
    {
      code: 'RM-OIL-ISO46',
      name: 'ISO VG 46 Anti-Wear Hydraulic Oil',
      lot: 'LOT-2026-OL-05',
      quantity: '8 Barrels (1,600 L)',
      supplier: 'Gulf Lubricants & Fluids',
      supplierId: 'SUP-005',
      inspectionId: 'INS-2026-RM-05',
      result: 'Pass' as const,
      defectReported: 'Viscosity index 102 meets DIN 51524 spec.',
    },
  ];

  const incomingInspections = [
    {
      id: 'INS-2026-RM-01',
      inspectionNumber: 'INS-2026-RM-01',
      productName: 'Aluminum 7075-T6 Billets',
      product: 'RM-ALUM-7075',
      batchNumber: 'LOT-2026-AL-01',
      batch: 'LOT-2026-AL-01',
      type: 'incoming',
      inspectedBy: 'Eng. Mostafa Refaat',
      inspectionDate: '2026-10-01',
      sampleSize: 32,
      defectCount: 3,
      inspectionPoints: 6,
      result: 'pass',
      status: 'pass',
      supplierId: 'SUP-001',
      notes: rawMaterials[0].defectReported,
      relatedSupplierIds: ['SUP-001'],
    },
    {
      id: 'INS-2026-RM-02',
      inspectionNumber: 'INS-2026-RM-02',
      productName: 'High-Pressure NBR O-Rings 25x3mm',
      product: 'RM-SEAL-NBR',
      batchNumber: 'LOT-2026-OR-02',
      batch: 'LOT-2026-OR-02',
      type: 'incoming',
      inspectedBy: 'Eng. Mostafa Refaat',
      inspectionDate: '2026-10-02',
      sampleSize: 80,
      defectCount: 28,
      inspectionPoints: 4,
      result: 'fail',
      status: 'fail',
      supplierId: 'SUP-002',
      notes: rawMaterials[1].defectReported,
      relatedSupplierIds: ['SUP-002'],
      relatedNcrIds: ['NCR-SUP-2026-001'],
    },
    {
      id: 'INS-2026-RM-03',
      inspectionNumber: 'INS-2026-RM-03',
      productName: 'Stainless Steel 316 Valve Plungers',
      product: 'RM-VALV-SS316',
      batchNumber: 'LOT-2026-VL-03',
      batch: 'LOT-2026-VL-03',
      type: 'incoming',
      inspectedBy: 'Tamer Adel',
      inspectionDate: '2026-10-02',
      sampleSize: 50,
      defectCount: 0,
      inspectionPoints: 8,
      result: 'pass',
      status: 'pass',
      supplierId: 'SUP-003',
      notes: rawMaterials[2].defectReported,
      relatedSupplierIds: ['SUP-003'],
    },
    {
      id: 'INS-2026-RM-04',
      inspectionNumber: 'INS-2026-RM-04',
      productName: 'M8x45 Grade 10.9 Zinc Bolts',
      product: 'RM-BOLT-M8GR10',
      batchNumber: 'LOT-2026-BL-04',
      batch: 'LOT-2026-BL-04',
      type: 'incoming',
      inspectedBy: 'Tamer Adel',
      inspectionDate: '2026-10-03',
      sampleSize: 200,
      defectCount: 12,
      inspectionPoints: 5,
      result: 'pass',
      status: 'pass',
      supplierId: 'SUP-004',
      notes: rawMaterials[3].defectReported,
      relatedSupplierIds: ['SUP-004'],
    },
    {
      id: 'INS-2026-RM-05',
      inspectionNumber: 'INS-2026-RM-05',
      productName: 'ISO VG 46 Hydraulic Oil',
      product: 'RM-OIL-ISO46',
      batchNumber: 'LOT-2026-OL-05',
      batch: 'LOT-2026-OL-05',
      type: 'incoming',
      inspectedBy: 'Lab Chemist Salma',
      inspectionDate: '2026-10-03',
      sampleSize: 8,
      defectCount: 0,
      inspectionPoints: 4,
      result: 'pass',
      status: 'pass',
      supplierId: 'SUP-005',
      notes: rawMaterials[4].defectReported,
      relatedSupplierIds: ['SUP-005'],
    },
  ];

  // --------------------------------------------------------------------------
  // 3. SUPPLIER NCR (On the Rejected Seal Lot)
  // --------------------------------------------------------------------------
  const supplierNcr = {
    id: 'NCR-SUP-2026-001',
    ncrNumber: 'NCR-SUP-2026-001',
    title: 'Rejected O-Ring Lot LOT-2026-OR-02 (Dimensional Shrinkage & Hardness)',
    description: 'Incoming IQC inspection INS-2026-RM-02 detected 28/80 defectives. Shore A hardness at 62 instead of 75 required, causing high risk of hydraulic failure under 200+ bar.',
    priority: 'critical',
    severity: 'critical',
    status: 'open',
    source: 'Inspection',
    sourceInspectionId: 'INS-2026-RM-02',
    supplierId: 'SUP-002',
    supplierName: 'Apex Polymer & Seals Ltd.',
    plantId: 'MAIN-PLANT',
    containmentAction: 'Lot quarantined in Yellow Bin #4. Return to Vendor (RTV) initiated.',
    relatedSupplierIds: ['SUP-002'],
    relatedInspectionIds: ['INS-2026-RM-02'],
  };

  // --------------------------------------------------------------------------
  // 4. ASSEMBLY EXECUTION & SHOPFLOOR DEFECT RECORDER (Assembly Line 1)
  // --------------------------------------------------------------------------
  const assemblyDefects = [
    {
      id: 'DEF-2026-901A',
      date: '2026-10-06',
      shift: 'Morning',
      productionLine: 'Assembly Line 1',
      partId: 'ASSY-PUMP-400',
      partNumber: 'ASSY-PUMP-400',
      recordType: 'process-ppm',
      defectType: 'Bolt Cross-Threading (Torque Mismatch)',
      quantity: 8,
      severity: 'Major',
      description: 'M8 bolts cross-threaded in aluminum body casing due to excessive pneumatic tool RPM.',
      operatorName: 'Mahmoud Saeed',
      actionTaken: 'Heli-coil thread repaired and bolts re-torqued with manual gauge.',
      status: 'logged',
      relatedNcrIds: ['NCR-2026-901'],
    },
    {
      id: 'DEF-2026-901B',
      date: '2026-10-06',
      shift: 'Afternoon',
      productionLine: 'Assembly Line 1 - Test Bench',
      partId: 'ASSY-PUMP-400',
      partNumber: 'ASSY-PUMP-400',
      recordType: 'process-ppm',
      defectType: 'Hydrostatic Seal Micro-Leakage',
      quantity: 5,
      severity: 'Critical',
      description: 'Micro-leak detected under 250 Bar pressure testing during initial line testing.',
      operatorName: 'Ali Gamal',
      actionTaken: 'Pumps disassembled and seals replaced from qualified backup lot.',
      status: 'logged',
      relatedNcrIds: ['NCR-2026-901'],
    },
    {
      id: 'DEF-2026-901C',
      date: '2026-10-07',
      shift: 'Morning',
      productionLine: 'Assembly Line 1 - Station 3',
      partId: 'ASSY-PUMP-400',
      partNumber: 'ASSY-PUMP-400',
      recordType: 'process-ppm',
      defectType: 'Plunger Stroke Clearance Out-of-Tolerance',
      quantity: 4,
      severity: 'Medium',
      description: 'Clearance exceeded 0.05mm limit. Shims adjusted.',
      operatorName: 'Ahmed Fathy',
      actionTaken: 'Shim pack replaced to achieve 0.025mm clearance.',
      status: 'logged',
      relatedNcrIds: ['NCR-2026-901'],
    },
  ];

  // --------------------------------------------------------------------------
  // 5. CONTROL PLAN & INTERNAL AUDIT
  // --------------------------------------------------------------------------
  const controlPlan = {
    id: 'CP-PUMP-01',
    controlPlanNumber: 'CP-PUMP-01',
    title: 'Control Plan: Hydraulic Pump ASSY-PUMP-400 Assembly',
    partNumber: 'ASSY-PUMP-400',
    partName: 'Hydraulic Pump Assembly 400 Bar',
    processStep: 'Bolting & Pressure Testing',
    characteristics: 'Torque: 25 ± 2 Nm | Proof Pressure: 250 Bar | Zero Leakage',
    measurementTechnique: 'Calibrated Digital Torque Wrench & Hydrostatic Rig',
    sampleSize: '5 pcs / hour',
    frequency: 'Hourly',
    controlMethod: 'SPC X-bar R Chart',
    reactionPlan: 'Stop line, contain previous 1 hour production, notify QA Lead',
    status: 'active',
  };

  const processAudit = {
    id: 'AUD-2026-901',
    auditNumber: 'AUD-2026-901',
    title: 'Layered Process Audit (LPA) - Assembly Line 1 Torquing & Pressurizing',
    auditType: 'Internal',
    type: 'Internal',
    standard: 'IATF 16949 / ISO 9001:2015',
    scope: 'Assembly Line 1 Station 2 (Torque application) and Station 4 (Pressure check)',
    department: 'Manufacturing',
    auditor: 'Lead Auditor Hazem Shaker',
    auditee: 'Line Supervisor Ibrahim Tawfik',
    scheduledDate: '2026-10-07',
    plannedDate: '2026-10-07',
    duration: '1 Day',
    findings: 2,
    ncCount: 1,
    status: 'Completed',
    findingsSummary: 'Audit finding: Pneumatic nutrunner torque limit calibration tag expired by 14 days. Torque reading variation between 22 Nm and 31 Nm.',
    relatedNcrIds: ['NCR-2026-901'],
    relatedCapaIds: ['CAPA-2026-901'],
  };

  // --------------------------------------------------------------------------
  // 6. INTERNAL ASSEMBLY NCR & CAPA
  // --------------------------------------------------------------------------
  const assemblyNcr = {
    id: 'NCR-2026-901',
    ncrNumber: 'NCR-2026-901',
    title: 'Uncontrolled Torque Application on Pump Body Assembly Line 1',
    description: 'Triggered by Audit AUD-2026-901 and Shopfloor Defects DEF-2026-901A. Fasteners torqued outside of 25±2 Nm specification, leading to stripped threads and gasket seating issues.',
    priority: 'high',
    severity: 'major',
    status: 'investigation',
    source: 'Audit',
    sourceAuditId: 'AUD-2026-901',
    plantId: 'MAIN-PLANT',
    containmentAction: '100% torque re-verification on all 500 pump assemblies produced on Oct 6-7.',
    relatedAuditIds: ['AUD-2026-901'],
    relatedCapaIds: ['CAPA-2026-901'],
    relatedDefectIds: ['DEF-2026-901A', 'DEF-2026-901B'],
  };

  const capa = {
    id: 'CAPA-2026-901',
    capaNumber: 'CAPA-2026-901',
    title: 'Error-Proofing (Poka-Yoke) Torquing Process on Assembly Line 1',
    description: 'Root cause analysis (5-Whys) showed pneumatic tool lacked torque transducer shutoff. Solution: Install digital smart angle-torque tool with PLC interlock to prevent line advance if torque is out of range.',
    source: 'NCR',
    sourceNcrId: 'NCR-2026-901',
    status: 'in-progress',
    rootCause: 'Lack of automatic torque shutoff and reliance on manual operator visual inspection.',
    actionPlan: '1) Procure Atlas Copco smart nutrunner with PLC interlock. 2) Update Control Plan CP-PUMP-01. 3) Re-train line operators on digital torque confirmation.',
    targetDate: '2026-10-25',
    assignedTo: 'Eng. Walid Fawzy (Process Quality Engineer)',
    plantId: 'MAIN-PLANT',
    relatedNcrIds: ['NCR-2026-901'],
    relatedAuditIds: ['AUD-2026-901'],
  };

  // --------------------------------------------------------------------------
  // 7. OUTGOING QUALITY CONTROL (OQC INSPECTION)
  // --------------------------------------------------------------------------
  const oqcInspection = {
    id: 'INS-2026-OQC-901',
    inspectionNumber: 'INS-2026-OQC-901',
    productName: 'Hydraulic Pump Assembly (Finished Goods Batch BATCH-2026-901)',
    product: 'ASSY-PUMP-400',
    batchNumber: 'BATCH-2026-901',
    batch: 'BATCH-2026-901',
    type: 'final',
    inspectedBy: 'Senior QA Inspector Sherif Mansour',
    inspectionDate: '2026-10-09',
    sampleSize: 50,
    defectCount: 0,
    inspectionPoints: 10,
    result: 'pass',
    status: 'pass',
    notes: 'Sampling check under MIL-STD-105E Level II AQL 0.65. Hydrostatic proof tested at 280 Bar. Packaging, barcode labels and certificate of conformity attached.',
    relatedInspectionIds: ['INS-2026-RM-01', 'INS-2026-RM-03', 'INS-2026-RM-04', 'INS-2026-RM-05'],
    relatedComplaintIds: ['CMP-2026-101'],
  };

  // --------------------------------------------------------------------------
  // 8. CUSTOMER COMPLAINT & FIELD INCIDENT
  // --------------------------------------------------------------------------
  const customerComplaint = {
    id: 'CMP-2026-101',
    complaintNumber: 'CMP-2026-101',
    customerName: 'Al-Amal Industrial Equipment Co.',
    customerContact: 'Eng. Amr Khaled (Operations Director)',
    title: 'Hydraulic Micro-Leak on 2 Pumps at Maximum Working Pressure (280 Bar)',
    description: 'Customer reported oil weeping from body joint after 40 hours of continuous operation in excavator assembly. Pump Serial # PUMP-901-042 & PUMP-901-043 from Batch BATCH-2026-901.',
    severity: 'high',
    status: 'investigating',
    reportedDate: '2026-10-12',
    productNumber: 'ASSY-PUMP-400',
    batchNumber: 'BATCH-2026-901',
    immediateAction: 'Customer provided with 2 immediate replacement pumps from buffer stock; failed units returned for metallurgical and seal teardown analysis.',
    relatedInspectionIds: ['INS-2026-OQC-901'],
    relatedNcrIds: ['NCR-2026-901'],
  };

  // --------------------------------------------------------------------------
  // SAVE ALL RECORDS TO LOCAL STORAGE (API MOCK PERSISTENCE)
  // --------------------------------------------------------------------------
  const existingInspections = JSON.parse(localStorage.getItem('qms_local_inspections') || '[]');
  const allInspections = [
    ...incomingInspections,
    oqcInspection,
    ...existingInspections.filter((item: any) => !item.id?.startsWith('INS-2026-')),
  ];
  localStorage.setItem('qms_local_inspections', JSON.stringify(allInspections));

  const existingNcrs = JSON.parse(localStorage.getItem('qms_local_ncr') || '[]');
  const allNcrs = [
    supplierNcr,
    assemblyNcr,
    ...existingNcrs.filter((item: any) => !item.id?.startsWith('NCR-2026-') && !item.id?.startsWith('NCR-SUP-')),
  ];
  localStorage.setItem('qms_local_ncr', JSON.stringify(allNcrs));
  localStorage.setItem('qms_local_ncrs', JSON.stringify(allNcrs));

  const existingDefects = JSON.parse(localStorage.getItem('qms_local_defect-logs') || '[]');
  const allDefects = [
    ...assemblyDefects,
    ...existingDefects.filter((item: any) => !item.id?.startsWith('DEF-2026-901')),
  ];
  localStorage.setItem('qms_local_defect-logs', JSON.stringify(allDefects));

  const existingAudits = JSON.parse(localStorage.getItem('qms_local_audits') || '[]');
  const allAudits = [
    processAudit,
    ...existingAudits.filter((item: any) => !item.id?.startsWith('AUD-2026-901')),
  ];
  localStorage.setItem('qms_local_audits', JSON.stringify(allAudits));

  const existingCapas = JSON.parse(localStorage.getItem('qms_local_capa') || '[]');
  const allCapas = [
    capa,
    ...existingCapas.filter((item: any) => !item.id?.startsWith('CAPA-2026-901')),
  ];
  localStorage.setItem('qms_local_capa', JSON.stringify(allCapas));

  const existingControlPlans = JSON.parse(localStorage.getItem('qms_local_control-plans') || '[]');
  const allControlPlans = [
    controlPlan,
    ...existingControlPlans.filter((item: any) => item.id !== 'CP-PUMP-01'),
  ];
  localStorage.setItem('qms_local_control-plans', JSON.stringify(allControlPlans));

  const existingComplaints = JSON.parse(localStorage.getItem('qms_local_complaints') || '[]');
  const allComplaints = [
    customerComplaint,
    ...existingComplaints.filter((item: any) => item.id !== 'CMP-2026-101'),
  ];
  localStorage.setItem('qms_local_complaints', JSON.stringify(allComplaints));

  // --------------------------------------------------------------------------
  // ESTABLISH COMPLETE BIDIRECTIONAL RELATIONSHIPS GRAPH
  // --------------------------------------------------------------------------
  const linkList: Array<Parameters<typeof createQualityRelationship>[0]> = [
    // 1. Raw Materials -> Suppliers
    {
      sourceType: 'inspection',
      sourceId: 'INS-2026-RM-01',
      targetType: 'supplier',
      targetId: 'SUP-001',
      relationshipType: 'incoming-raw-material',
      notes: 'Raw material Aluminum 7075 receipt inspection linked to Precision Metals Co.',
    },
    {
      sourceType: 'inspection',
      sourceId: 'INS-2026-RM-02',
      targetType: 'supplier',
      targetId: 'SUP-002',
      relationshipType: 'incoming-raw-material',
      notes: 'Raw material NBR Seals receipt inspection linked to Apex Polymer & Seals Ltd.',
    },
    {
      sourceType: 'inspection',
      sourceId: 'INS-2026-RM-03',
      targetType: 'supplier',
      targetId: 'SUP-003',
      relationshipType: 'incoming-raw-material',
      notes: 'Raw material Plungers receipt inspection linked to Delta Precision Components.',
    },
    {
      sourceType: 'inspection',
      sourceId: 'INS-2026-RM-04',
      targetType: 'supplier',
      targetId: 'SUP-004',
      relationshipType: 'incoming-raw-material',
      notes: 'Raw material M8 Bolts receipt inspection linked to Titan Fasteners Global.',
    },
    {
      sourceType: 'inspection',
      sourceId: 'INS-2026-RM-05',
      targetType: 'supplier',
      targetId: 'SUP-005',
      relationshipType: 'incoming-raw-material',
      notes: 'Raw material Hydraulic Oil receipt inspection linked to Gulf Lubricants & Fluids.',
    },

    // 2. Rejected Seal Lot -> Supplier NCR
    {
      sourceType: 'inspection',
      sourceId: 'INS-2026-RM-02',
      targetType: 'ncr',
      targetId: 'NCR-SUP-2026-001',
      relationshipType: 'defect-escalation',
      notes: 'Failed seal inspection escalated to Supplier NCR-SUP-2026-001.',
    },
    {
      sourceType: 'ncr',
      sourceId: 'NCR-SUP-2026-001',
      targetType: 'supplier',
      targetId: 'SUP-002',
      relationshipType: 'supplier-nonconformance',
      notes: 'Supplier NCR assigned to Apex Polymer & Seals Ltd.',
    },

    // 3. Assembly Defects -> Assembly NCR
    {
      sourceType: 'defect',
      sourceId: 'DEF-2026-901A',
      targetType: 'ncr',
      targetId: 'NCR-2026-901',
      relationshipType: 'shopfloor-defect-link',
      notes: 'Bolt cross-threading defect linked to assembly NCR.',
    },
    {
      sourceType: 'defect',
      sourceId: 'DEF-2026-901B',
      targetType: 'ncr',
      targetId: 'NCR-2026-901',
      relationshipType: 'shopfloor-defect-link',
      notes: 'Hydrostatic seal micro-leak linked to assembly NCR.',
    },

    // 4. Audit -> NCR & CAPA
    {
      sourceType: 'audit',
      sourceId: 'AUD-2026-901',
      targetType: 'ncr',
      targetId: 'NCR-2026-901',
      relationshipType: 'audit-finding-escalation',
      notes: 'Layered Process Audit torque finding escalated to NCR-2026-901.',
    },
    {
      sourceType: 'ncr',
      sourceId: 'NCR-2026-901',
      targetType: 'capa',
      targetId: 'CAPA-2026-901',
      relationshipType: 'corrective-action-plan',
      notes: 'NCR escalated to error-proofing CAPA-2026-901.',
    },

    // 5. Outgoing Inspection (OQC) -> Incoming Lots
    {
      sourceType: 'inspection',
      sourceId: 'INS-2026-OQC-901',
      targetType: 'inspection',
      targetId: 'INS-2026-RM-01',
      relationshipType: 'lot-traceability-bill-of-materials',
      notes: 'Finished Pump Batch traced to Aluminum lot LOT-2026-AL-01.',
    },
    {
      sourceType: 'inspection',
      sourceId: 'INS-2026-OQC-901',
      targetType: 'inspection',
      targetId: 'INS-2026-RM-03',
      relationshipType: 'lot-traceability-bill-of-materials',
      notes: 'Finished Pump Batch traced to Plunger lot LOT-2026-VL-03.',
    },

    // 6. Customer Complaint -> OQC Inspection -> Assembly Defect & Root Cause
    {
      sourceType: 'complaint',
      sourceId: 'CMP-2026-101',
      targetType: 'inspection',
      targetId: 'INS-2026-OQC-901',
      relationshipType: 'field-failure-to-batch-inspection',
      notes: 'Customer field leak linked directly to final outgoing inspection batch BATCH-2026-901.',
    },
    {
      sourceType: 'complaint',
      sourceId: 'CMP-2026-101',
      targetType: 'ncr',
      targetId: 'NCR-2026-901',
      relationshipType: 'investigation-trace',
      notes: 'Customer complaint investigation references Assembly Line 1 torque non-conformance NCR-2026-901.',
    },
  ];

  linkList.forEach((link) => {
    createQualityRelationship(link);
  });

  const allActiveRelationships = loadQualityRelationships();

  return {
    timestamp: new Date().toISOString(),
    rawMaterials,
    supplierNcrId: supplierNcr.id,
    assemblyBatch: 'BATCH-2026-901',
    assemblyDefects,
    controlPlanId: controlPlan.id,
    auditId: processAudit.id,
    assemblyNcrId: assemblyNcr.id,
    capaId: capa.id,
    oqcInspectionId: oqcInspection.id,
    customerComplaintId: customerComplaint.id,
    totalRelationshipsLinked: allActiveRelationships.length,
    traceabilityChain: [
      {
        step: '1. Incoming Raw Materials (IQC)',
        module: 'Inspection Hub / Suppliers',
        recordId: 'INS-2026-RM-01 to 05',
        description: '5 raw materials inspected; LOT-2026-OR-02 rejected for hardness deviation.',
        linkedTo: 'Suppliers SUP-001 through SUP-005',
      },
      {
        step: '2. Supplier Non-Conformance (NCR)',
        module: 'NCR Management',
        recordId: 'NCR-SUP-2026-001',
        description: 'Quarantine and return-to-vendor on rejected O-ring batch.',
        linkedTo: 'Supplier SUP-002 & Inspection INS-2026-RM-02',
      },
      {
        step: '3. Assembly Line Defect Logging',
        module: 'Shopfloor Defect Recorder',
        recordId: 'DEF-2026-901A / B / C',
        description: 'Cross-threading and micro-leak defects logged during assembly of 500 pumps.',
        linkedTo: 'Part ASSY-PUMP-400 & Line 1',
      },
      {
        step: '4. Process Audit & Control Plan',
        module: 'Audit Hub & Control Plans',
        recordId: 'AUD-2026-901 & CP-PUMP-01',
        description: 'Process audit detected uncalibrated pneumatic nutrunner exceeding torque spec.',
        linkedTo: 'Assembly Line 1 & Control Plan CP-PUMP-01',
      },
      {
        step: '5. Internal NCR & CAPA Closed Loop',
        module: 'NCR & CAPA Management',
        recordId: 'NCR-2026-901 & CAPA-2026-901',
        description: 'Root cause error-proofing (Smart tool with PLC interlock) assigned.',
        linkedTo: 'Audit AUD-2026-901 & Defects DEF-2026-901A/B',
      },
      {
        step: '6. Outgoing Quality Control (OQC)',
        module: 'Inspection Hub / Outgoing',
        recordId: 'INS-2026-OQC-901',
        description: 'Final 50-sample AQL check approved for release after 100% torque rework.',
        linkedTo: 'BOM Incoming Lots & Finished Batch BATCH-2026-901',
      },
      {
        step: '7. Customer Complaint & Reverse Traceability',
        module: 'Customer Complaints Hub',
        recordId: 'CMP-2026-101',
        description: 'Customer field report traced backwards to batch, OQC, assembly defect, and raw materials.',
        linkedTo: 'OQC INS-2026-OQC-901, NCR-2026-901, and Raw Material Lots',
      },
    ],
  };
}
