/**
 * QMS Enterprise 4.0 - End-to-End Quality Lifecycle Simulation & Seeding
 *
 * Disabled to prevent generating fake/mock records.
 * System is strictly 100% real user data.
 */

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
  // Pure no-op: Real user data only. No fake seed data generated.
  return {
    timestamp: new Date().toISOString(),
    rawMaterials: [],
    supplierNcrId: undefined,
    assemblyBatch: '',
    assemblyDefects: [],
    controlPlanId: '',
    auditId: '',
    assemblyNcrId: '',
    capaId: '',
    oqcInspectionId: '',
    customerComplaintId: '',
    totalRelationshipsLinked: 0,
    traceabilityChain: [],
  };
}
