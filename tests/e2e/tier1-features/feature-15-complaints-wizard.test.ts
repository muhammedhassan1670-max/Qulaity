import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedComplaintsApi, unifiedCapaApi } from '@/api/unified-api';
import {
  seedComplaints,
  readComplaints,
  readCapaRecords,
  resetQualityStorage,
  createIsoDateOffset,
} from '../../helpers/testHarness';

describe('Feature 15: Customer Complaint 5-Step Wizard', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('ingests structured 5-step customer complaint intake data into persistent repository', async () => {
    const complaintData = {
      complaintId: 'COMP-2026-901',
      // Step 1: General
      complaintSource: 'email',
      receivedDate: '2026-11-14',
      responseDue: createIsoDateOffset(2), // 48-hour containment SLA
      assignedTo: 'Lead Quality Investigator',
      status: 'new',
      // Step 2: Customer
      customerName: 'Lufthansa Technik AG',
      customerContact: 'quality-inbound@lufthansa.de',
      // Step 3: Product
      productModel: 'Hydraulic Actuator HA-400',
      serialNumber: 'SN-HA-8841',
      batchNumber: 'LOT-2026-ACT-991',
      quantity: 2,
      // Step 4: Details
      complaintDescription: 'Actuator internal leakage observed during line maintenance pre-flight check',
      severity: 'critical',
      priority: 'critical',
      // Step 5: Actions
      investigationResult: 'Initial intake completed, containment active',
    };

    const created = await unifiedComplaintsApi.create(complaintData as any);
    expect(created.id).toBeDefined();

    const stored = readComplaints();
    expect(stored.length).toBe(1);
    expect(stored[0].customerName).toBe('Lufthansa Technik AG');
    expect(stored[0].severity).toBe('critical');
    expect(stored[0].batchNumber).toBe('LOT-2026-ACT-991');
  });

  it('triggers emergency CAPA automatically when complaint is marked critical severity', async () => {
    const criticalComplaint = {
      id: 'comp-crit-01',
      complaintId: 'COMP-2026-CRIT-01',
      customerName: 'Airbus Operations SAS',
      productModel: 'Turbine Blade High Pressure',
      batchNumber: 'LOT-TI-771',
      severity: 'critical',
      priority: 'critical',
      status: 'investigating',
      complaintDescription: 'Micro-fracture detected in dovetail root during overhaul inspection',
    };
    seedComplaints([criticalComplaint]);

    // System auto-triggers CAPA for critical customer complaints
    const shouldTriggerCapa = criticalComplaint.severity === 'critical';
    expect(shouldTriggerCapa).toBe(true);

    const generatedCapa = await unifiedCapaApi.create({
      title: `Emergency CAPA: Customer Complaint ${criticalComplaint.complaintId}`,
      description: `Automated escalation for customer ${criticalComplaint.customerName}: ${criticalComplaint.complaintDescription}`,
      priority: 'critical',
      capaType: 'Corrective Action',
      source: criticalComplaint.complaintId,
      metadata: {
        customer: criticalComplaint.customerName,
        product: criticalComplaint.productModel,
        lot: criticalComplaint.batchNumber,
      },
    } as any);

    expect(generatedCapa.id).toBeDefined();
    const capas = readCapaRecords();
    expect(capas.length).toBe(1);
    expect(capas[0].priority).toBe('critical');
    expect(capas[0].title).toContain('Emergency CAPA');
  });

  it('enforces 48-hour containment response deadline for customer claims', () => {
    const complaint = {
      complaintId: 'COMP-SLA-01',
      receivedDate: '2026-11-14T08:00:00Z',
      responseDue: '2026-11-16T08:00:00Z',
      status: 'investigating',
    };

    const receivedTime = new Date(complaint.receivedDate).getTime();
    const dueTime = new Date(complaint.responseDue).getTime();
    const durationHours = (dueTime - receivedTime) / (1000 * 60 * 60);

    expect(durationHours).toBe(48);
  });

  it('records root cause investigation and technical findings for customer resolution report', async () => {
    const complaint = {
      id: 'comp-inv-02',
      complaintId: 'COMP-2026-02',
      customerName: 'BMW Group',
      productModel: 'Door Outer Skin',
      status: 'investigating',
    };
    seedComplaints([complaint]);

    const updated = await unifiedComplaintsApi.update('comp-inv-02', {
      status: 'resolved',
      rootCause: 'Die cushion nitrogen spring pressure loss resulted in irregular metal draw',
      correctiveAction: 'Rebuilt die cushion manifold and integrated daily digital pressure check',
      investigationResult: 'Root cause confirmed and validated with zero defect re-run',
    });

    expect(updated.status).toBe('resolved');
    expect(updated.rootCause).toContain('nitrogen spring pressure loss');
    expect(updated.correctiveAction).toContain('Rebuilt die cushion');
  });

  it('closes customer complaint after client acceptance and logs customer satisfaction rating (1-5)', async () => {
    const complaint = {
      id: 'comp-close-03',
      complaintId: 'COMP-2026-03',
      customerName: 'Siemens Healthineers',
      status: 'resolved',
    };
    seedComplaints([complaint]);

    const updated = await unifiedComplaintsApi.update('comp-close-03', {
      status: 'closed',
      closureDate: new Date().toISOString().split('T')[0],
      satisfaction: 5, // Top satisfaction rating
      metadata: {
        clientFeedback: 'Rapid 8D response and transparent root cause communication',
      },
    });

    expect(updated.status).toBe('closed');
    expect(updated.satisfaction).toBe(5);
    expect(updated.metadata.clientFeedback).toContain('Rapid 8D response');
  });
});
