/**
 * Industrial Production Quality Fixtures
 * Realistic aerospace, automotive, medical, and heavy manufacturing data fixtures.
 */

export interface MaterialFixture {
  materialCode: string;
  name: string;
  grade: string;
  supplierCode: string;
  standard: string;
  density: number; // g/cm³
  tensileStrengthMpa: number;
}

export interface PartFixture {
  partNumber: string;
  partName: string;
  family: 'Automotive' | 'Aerospace' | 'Medical' | 'Electronics';
  nominalWeightKg: number;
  criticalCharacteristics: string[];
}

export interface SupplierFixture {
  id: string;
  supplierCode: string;
  name: string;
  category: string;
  rating: number; // 1-5 scale
  status: 'approved' | 'conditional' | 'blocked';
  qualityPpm: number;
  deliveryPerformance: number; // %
  lastAuditDate: string;
  iso9001Certified: boolean;
  iatf16949Certified: boolean;
}

export interface InspectionSpecFixture {
  specId: string;
  characteristic: string;
  dimensionType: 'variable' | 'attribute';
  nominal?: number;
  lsl?: number;
  usl?: number;
  unit: string;
  subgroupSize: number;
  gaugeType: string;
}

export interface FmeaEntryFixture {
  id: string;
  processStep: string;
  failureMode: string;
  failureEffect: string;
  potentialCause: string;
  severity: number; // 1-10
  occurrence: number; // 1-10
  detection: number; // 1-10
  preventionControls: string;
  detectionControls: string;
}

export interface CalibrationToolFixture {
  toolId: string;
  toolName: string;
  serialNumber: string;
  model: string;
  location: string;
  accuracy: string;
  intervalDays: number;
  lastCalibrationDate: string;
  nextCalibrationDate: string;
  status: 'calibrated' | 'due' | 'overdue' | 'maintenance';
}

export const INDUSTRIAL_MATERIALS: MaterialFixture[] = [
  {
    materialCode: 'MAT-AL-7075',
    name: 'Aluminum Alloy 7075-T6',
    grade: 'Aerospace Structural',
    supplierCode: 'SUP-001',
    standard: 'AMS 4045',
    density: 2.81,
    tensileStrengthMpa: 572,
  },
  {
    materialCode: 'MAT-TI-6AL4V',
    name: 'Titanium Grade 5 Ti-6Al-4V',
    grade: 'Aero-Engine Rotor',
    supplierCode: 'SUP-001',
    standard: 'ASTM B348',
    density: 4.43,
    tensileStrengthMpa: 950,
  },
  {
    materialCode: 'MAT-STEEL-DC04',
    name: 'Cold Rolled Deep Drawing Steel',
    grade: 'Automotive Body',
    supplierCode: 'SUP-002',
    standard: 'EN 10130',
    density: 7.85,
    tensileStrengthMpa: 350,
  },
  {
    materialCode: 'MAT-MED-PP801',
    name: 'Medical Polypropylene Homopolymer',
    grade: 'USP Class VI Sterile Packaging',
    supplierCode: 'SUP-003',
    standard: 'ISO 11607',
    density: 0.905,
    tensileStrengthMpa: 34,
  },
];

export const INDUSTRIAL_PARTS: PartFixture[] = [
  {
    partNumber: 'PART-ACT-1001',
    partName: 'Hydraulic Flight Actuator Housing',
    family: 'Aerospace',
    nominalWeightKg: 4.25,
    criticalCharacteristics: ['Bore Diameter', 'Wall Thickness', 'Surface Roughness'],
  },
  {
    partNumber: 'PART-BLD-2002',
    partName: 'Turbine High Pressure Rotor Blade',
    family: 'Aerospace',
    nominalWeightKg: 0.48,
    criticalCharacteristics: ['Airfoil Contour', 'Root Dovetail Width', 'Micro-porosity'],
  },
  {
    partNumber: 'PART-PNL-3003',
    partName: 'Automotive Door Outer Skin Panel',
    family: 'Automotive',
    nominalWeightKg: 6.80,
    criticalCharacteristics: ['Flange Height', 'Hole Pitch', 'Surface Denting'],
  },
  {
    partNumber: 'PART-MED-4004',
    partName: 'Sterile Syringe Blister Chamber',
    family: 'Medical',
    nominalWeightKg: 0.015,
    criticalCharacteristics: ['Seal Burst Pressure', 'Flange Width', 'Sterile Barrier Integrity'],
  },
];

export const INDUSTRIAL_SUPPLIERS: SupplierFixture[] = [
  {
    id: 'sup-001',
    supplierCode: 'SUP-APEX-01',
    name: 'Apex Precision Aerospace Forgings',
    category: 'Forging & Extrusion',
    rating: 4.85,
    status: 'approved',
    qualityPpm: 14,
    deliveryPerformance: 98.5,
    lastAuditDate: '2026-08-15',
    iso9001Certified: true,
    iatf16949Certified: false,
  },
  {
    id: 'sup-002',
    supplierCode: 'SUP-RHEIN-02',
    name: 'Rhein Metallurgical Coil Services',
    category: 'Sheet Metal & Slitting',
    rating: 3.40,
    status: 'conditional',
    qualityPpm: 280,
    deliveryPerformance: 88.0,
    lastAuditDate: '2026-06-20',
    iso9001Certified: true,
    iatf16949Certified: true,
  },
  {
    id: 'sup-003',
    supplierCode: 'SUP-BIOMED-03',
    name: 'BioMed Sterile Packaging Solutions',
    category: 'Polymer Extrusion',
    rating: 4.95,
    status: 'approved',
    qualityPpm: 3,
    deliveryPerformance: 99.8,
    lastAuditDate: '2026-10-05',
    iso9001Certified: true,
    iatf16949Certified: false,
  },
  {
    id: 'sup-004',
    supplierCode: 'SUP-DELTA-04',
    name: 'Delta Structural Hardware Inc',
    category: 'Fasteners & Rivets',
    rating: 2.75,
    status: 'blocked',
    qualityPpm: 1250,
    deliveryPerformance: 74.2,
    lastAuditDate: '2026-03-10',
    iso9001Certified: false,
    iatf16949Certified: false,
  },
];

export const INDUSTRIAL_INSPECTION_SPECS: Record<string, InspectionSpecFixture> = {
  actuatorBore: {
    specId: 'SPEC-ACT-01',
    characteristic: 'Actuator Main Cylinder Bore Diameter',
    dimensionType: 'variable',
    nominal: 45.000,
    lsl: 44.975,
    usl: 45.025,
    unit: 'mm',
    subgroupSize: 5,
    gaugeType: 'Air Bore Gauge CMM',
  },
  turbineRoot: {
    specId: 'SPEC-BLD-02',
    characteristic: 'Turbine Dovetail Root Thickness',
    dimensionType: 'variable',
    nominal: 18.500,
    lsl: 18.480,
    usl: 18.520,
    unit: 'mm',
    subgroupSize: 5,
    gaugeType: 'Laser Profilometer',
  },
  blisterSealBurst: {
    specId: 'SPEC-MED-03',
    characteristic: 'Sterile Blister Packaging Burst Pressure',
    dimensionType: 'variable',
    nominal: 280.0,
    lsl: 220.0,
    usl: 350.0,
    unit: 'kPa',
    subgroupSize: 5,
    gaugeType: 'Mocon Burst Tester',
  },
  panelSurfaceDefect: {
    specId: 'SPEC-PNL-04',
    characteristic: 'Visual Dents and Scratches',
    dimensionType: 'attribute',
    unit: 'defects/panel',
    subgroupSize: 50,
    gaugeType: 'Automated Optical Inspection (AOI)',
  },
};

export const INDUSTRIAL_FMEA_TEMPLATES: FmeaEntryFixture[] = [
  {
    id: 'fmea-cast-01',
    processStep: 'High Pressure Die Casting',
    failureMode: 'Sub-surface gas and shrinkage porosity',
    failureEffect: 'Pressure containment leak in actuator barrel',
    potentialCause: 'Shot sleeve temperature drop and venting blockage',
    severity: 8,
    occurrence: 6,
    detection: 4,
    preventionControls: 'Vacuum assisted evacuation, thermoregulated die channels',
    detectionControls: '100% Helium Mass Spectrometer Leak Test & In-line X-Ray',
  },
  {
    id: 'fmea-aero-02',
    processStep: 'Precision Forging & Creep-Feed Grinding',
    failureMode: 'Thermal micro-cracking in blade root serration',
    failureEffect: 'Rotor blade uncoupling during high-RPM qualification',
    potentialCause: 'Coolant nozzle cavitation during high-feed grind pass',
    severity: 10,
    occurrence: 2,
    detection: 3,
    preventionControls: 'Adaptive grinding wheel dressing and Acoustic Emission sensor',
    detectionControls: 'Fluorescent Penetrant Inspection (FPI Level 4) & Eddy Current',
  },
  {
    id: 'fmea-med-03',
    processStep: 'Rotary Thermoforming & Heat Sealing',
    failureMode: 'Non-uniform seal channel and pinhole breach',
    failureEffect: 'Sterile barrier breach and pathogen contamination risk',
    potentialCause: 'Heater bar thermocouple resistance drift',
    severity: 9,
    occurrence: 3,
    detection: 4,
    preventionControls: 'Closed-loop PID multi-zone temperature controllers with alarms',
    detectionControls: 'Methylene blue dye penetration & burst seal destructive sampling',
  },
];

export const INDUSTRIAL_CALIBRATION_TOOLS: CalibrationToolFixture[] = [
  {
    toolId: 'TOOL-CMM-01',
    toolName: 'Zeiss Prismo Ultra CNC CMM',
    serialNumber: 'SN-ZEISS-99810',
    model: 'Prismo 7/9/5',
    location: 'Metrology Lab - Cell A',
    accuracy: '±0.5 µm + L/500',
    intervalDays: 365,
    lastCalibrationDate: '2026-01-15',
    nextCalibrationDate: '2027-01-15',
    status: 'calibrated',
  },
  {
    toolId: 'TOOL-MIC-02',
    toolName: 'Mitutoyo Digimatic Micrometer 25-50mm',
    serialNumber: 'SN-MIT-44122',
    model: 'MDC-50MX',
    location: 'Machining Line 2 Workstation',
    accuracy: '±1.0 µm',
    intervalDays: 90,
    lastCalibrationDate: '2026-08-10',
    nextCalibrationDate: '2026-11-08', // expired
    status: 'overdue',
  },
  {
    toolId: 'TOOL-BURST-03',
    toolName: 'Mocon Lippke 5000 Package Seal Tester',
    serialNumber: 'SN-MOCON-3301',
    model: 'Lippke 5000',
    location: 'Cleanroom Packaging Bay 4',
    accuracy: '±0.2 kPa',
    intervalDays: 180,
    lastCalibrationDate: '2026-05-20',
    nextCalibrationDate: '2026-11-16', // due soon
    status: 'due',
  },
];
