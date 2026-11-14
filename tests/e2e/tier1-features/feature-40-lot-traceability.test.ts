import { describe, it, expect, beforeEach } from 'vitest';
import { assertLotGenealogyNode } from '../../helpers/assertionHelpers';
import {
  INDUSTRIAL_MATERIALS,
  INDUSTRIAL_PARTS,
  INDUSTRIAL_SUPPLIERS,
} from '../../helpers/industrialFixtures';

describe('Feature 40: Backward & Forward Lot Traceability Genealogy', () => {
  interface LotNode {
    lotNumber: string;
    level: 'SUPPLIER_RAW_COIL' | 'MACHINED_PART' | 'SUBASSEMBLY' | 'FINISHED_PALLET';
    itemName: string;
    supplierCode?: string;
    heatNumber?: string;
    machineLine?: string;
    date: string;
    parents?: string[];
    children?: string[];
  }

  const GENEALOGY_GRAPH: LotNode[] = [
    // Level 1: Supplier Raw Material Coils / Heats
    {
      lotNumber: 'COIL-TI-SUP-001',
      level: 'SUPPLIER_RAW_COIL',
      itemName: INDUSTRIAL_MATERIALS[1].name, // Titanium Ti-6Al-4V
      supplierCode: INDUSTRIAL_SUPPLIERS[0].supplierCode,
      heatNumber: 'HEAT-99420-A',
      date: '2026-10-01',
      parents: [],
      children: ['PART-BLD-BATCH-101', 'PART-BLD-BATCH-102'],
    },
    {
      lotNumber: 'COIL-TI-SUP-002',
      level: 'SUPPLIER_RAW_COIL',
      itemName: INDUSTRIAL_MATERIALS[1].name,
      supplierCode: INDUSTRIAL_SUPPLIERS[0].supplierCode,
      heatNumber: 'HEAT-99421-B',
      date: '2026-10-05',
      parents: [],
      children: ['PART-BLD-BATCH-103'],
    },

    // Level 2: Machined Parts
    {
      lotNumber: 'PART-BLD-BATCH-101',
      level: 'MACHINED_PART',
      itemName: INDUSTRIAL_PARTS[1].partName, // Rotor Blade
      machineLine: 'CNC Line 02 - Creep Feed Grind',
      date: '2026-10-15',
      parents: ['COIL-TI-SUP-001'],
      children: ['SUBASSY-ROTOR-STG1-A'],
    },
    {
      lotNumber: 'PART-BLD-BATCH-102',
      level: 'MACHINED_PART',
      itemName: INDUSTRIAL_PARTS[1].partName,
      machineLine: 'CNC Line 02 - Creep Feed Grind',
      date: '2026-10-18',
      parents: ['COIL-TI-SUP-001'],
      children: ['SUBASSY-ROTOR-STG1-B'],
    },
    {
      lotNumber: 'PART-BLD-BATCH-103',
      level: 'MACHINED_PART',
      itemName: INDUSTRIAL_PARTS[1].partName,
      machineLine: 'CNC Line 02 - Creep Feed Grind',
      date: '2026-10-22',
      parents: ['COIL-TI-SUP-002'],
      children: ['SUBASSY-ROTOR-STG1-C'],
    },

    // Level 3: Subassemblies
    {
      lotNumber: 'SUBASSY-ROTOR-STG1-A',
      level: 'SUBASSEMBLY',
      itemName: 'High-Pressure Turbine Rotor Disk Stage 1',
      machineLine: 'Cleanroom Assembly Bay 3',
      date: '2026-11-01',
      parents: ['PART-BLD-BATCH-101'],
      children: ['PALLET-AERO-EXP-9901'],
    },
    {
      lotNumber: 'SUBASSY-ROTOR-STG1-B',
      level: 'SUBASSEMBLY',
      itemName: 'High-Pressure Turbine Rotor Disk Stage 1',
      machineLine: 'Cleanroom Assembly Bay 3',
      date: '2026-11-03',
      parents: ['PART-BLD-BATCH-102'],
      children: ['PALLET-AERO-EXP-9902'],
    },
    {
      lotNumber: 'SUBASSY-ROTOR-STG1-C',
      level: 'SUBASSEMBLY',
      itemName: 'High-Pressure Turbine Rotor Disk Stage 1',
      machineLine: 'Cleanroom Assembly Bay 3',
      date: '2026-11-06',
      parents: ['PART-BLD-BATCH-103'],
      children: ['PALLET-AERO-EXP-9903'],
    },

    // Level 4: Shipping Pallets / Containers
    {
      lotNumber: 'PALLET-AERO-EXP-9901',
      level: 'FINISHED_PALLET',
      itemName: 'Certified Aerospace Turbine Rotor Consignment',
      date: '2026-11-10',
      parents: ['SUBASSY-ROTOR-STG1-A'],
      children: [],
    },
    {
      lotNumber: 'PALLET-AERO-EXP-9902',
      level: 'FINISHED_PALLET',
      itemName: 'Certified Aerospace Turbine Rotor Consignment',
      date: '2026-11-12',
      parents: ['SUBASSY-ROTOR-STG1-B'],
      children: [],
    },
    {
      lotNumber: 'PALLET-AERO-EXP-9903',
      level: 'FINISHED_PALLET',
      itemName: 'Certified Aerospace Turbine Rotor Consignment',
      date: '2026-11-14',
      parents: ['SUBASSY-ROTOR-STG1-C'],
      children: [],
    },
  ];

  it('verifies multi-tier bilateral genealogy tree linkages using assertLotGenealogyNode', () => {
    // Coil -> Part
    assertLotGenealogyNode(GENEALOGY_GRAPH, 'COIL-TI-SUP-001', 'PART-BLD-BATCH-101');
    assertLotGenealogyNode(GENEALOGY_GRAPH, 'COIL-TI-SUP-001', 'PART-BLD-BATCH-102');

    // Part -> Subassembly
    assertLotGenealogyNode(GENEALOGY_GRAPH, 'PART-BLD-BATCH-101', 'SUBASSY-ROTOR-STG1-A');

    // Subassembly -> Finished Pallet
    assertLotGenealogyNode(GENEALOGY_GRAPH, 'SUBASSY-ROTOR-STG1-A', 'PALLET-AERO-EXP-9901');
  });

  it('performs backward genealogy tracing from customer field unit back to raw supplier coil', () => {
    const traceBackward = (startLot: string, graph: LotNode[]): string[] => {
      const visited: string[] = [];
      const queue = [startLot];

      while (queue.length > 0) {
        const current = queue.shift()!;
        visited.push(current);
        const node = graph.find((n) => n.lotNumber === current);
        if (node && node.parents) {
          node.parents.forEach((parent) => {
            if (!visited.includes(parent)) queue.push(parent);
          });
        }
      }
      return visited;
    };

    const backwardTrail = traceBackward('PALLET-AERO-EXP-9901', GENEALOGY_GRAPH);

    expect(backwardTrail).toContain('PALLET-AERO-EXP-9901');
    expect(backwardTrail).toContain('SUBASSY-ROTOR-STG1-A');
    expect(backwardTrail).toContain('PART-BLD-BATCH-101');
    expect(backwardTrail).toContain('COIL-TI-SUP-001');

    // Root source node must be the raw supplier coil
    const rootNode = GENEALOGY_GRAPH.find((n) => n.lotNumber === backwardTrail[backwardTrail.length - 1]);
    expect(rootNode?.level).toBe('SUPPLIER_RAW_COIL');
    expect(rootNode?.heatNumber).toBe('HEAT-99420-A');
  });

  it('executes forward genealogy containment tracing from suspect raw coil to all affected shipments', () => {
    const traceForward = (startLot: string, graph: LotNode[]): string[] => {
      const visited: string[] = [];
      const queue = [startLot];

      while (queue.length > 0) {
        const current = queue.shift()!;
        visited.push(current);
        const node = graph.find((n) => n.lotNumber === current);
        if (node && node.children) {
          node.children.forEach((child) => {
            if (!visited.includes(child)) queue.push(child);
          });
        }
      }
      return visited;
    };

    // Suspect supplier coil COIL-TI-SUP-001 identified with internal micro-voids
    const forwardImpact = traceForward('COIL-TI-SUP-001', GENEALOGY_GRAPH);

    // Both batches 101 and 102 were produced from coil 001
    expect(forwardImpact).toContain('PART-BLD-BATCH-101');
    expect(forwardImpact).toContain('PART-BLD-BATCH-102');
    expect(forwardImpact).toContain('SUBASSY-ROTOR-STG1-A');
    expect(forwardImpact).toContain('SUBASSY-ROTOR-STG1-B');
    expect(forwardImpact).toContain('PALLET-AERO-EXP-9901');
    expect(forwardImpact).toContain('PALLET-AERO-EXP-9902');

    // Batch 103 was from a different coil and MUST NOT be affected
    expect(forwardImpact).not.toContain('PART-BLD-BATCH-103');
    expect(forwardImpact).not.toContain('PALLET-AERO-EXP-9903');
  });

  it('performs containment search filtering by heat number, CNC machine line, and dates', () => {
    const searchContainmentScope = (
      graph: LotNode[],
      filter: { heatNumber?: string; machineLine?: string; level?: LotNode['level'] }
    ) => {
      return graph.filter((node) => {
        if (filter.heatNumber && node.heatNumber !== filter.heatNumber) return false;
        if (filter.machineLine && node.machineLine !== filter.machineLine) return false;
        if (filter.level && node.level !== filter.level) return false;
        return true;
      });
    };

    const heatMatches = searchContainmentScope(GENEALOGY_GRAPH, { heatNumber: 'HEAT-99420-A' });
    expect(heatMatches.length).toBe(1);
    expect(heatMatches[0].lotNumber).toBe('COIL-TI-SUP-001');

    const cncMatches = searchContainmentScope(GENEALOGY_GRAPH, {
      machineLine: 'CNC Line 02 - Creep Feed Grind',
    });
    expect(cncMatches.length).toBe(3);
  });

  it('generates an immediate ERP Quarantine Containment Manifest for all compromised lots', () => {
    const compromisedLots = ['COIL-TI-SUP-001', 'PART-BLD-BATCH-101', 'SUBASSY-ROTOR-STG1-A', 'PALLET-AERO-EXP-9901'];

    const generateContainmentManifest = (lots: string[], graph: LotNode[], reason: string) => ({
      manifestId: `CONTAINMENT-MAN-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      reason,
      totalHoldLots: lots.length,
      quarantinedNodes: lots.map((lot) => {
        const node = graph.find((n) => n.lotNumber === lot);
        return {
          lotNumber: lot,
          itemName: node?.itemName,
          level: node?.level,
          lockState: 'ERP_BATCH_LOCKED_AND_HOLD_RED_TAGGED',
        };
      }),
    });

    const manifest = generateContainmentManifest(compromisedLots, GENEALOGY_GRAPH, 'Supplier Ti-6Al-4V Porosity Recall');

    expect(manifest.manifestId).toContain('CONTAINMENT-MAN-');
    expect(manifest.totalHoldLots).toBe(4);
    expect(manifest.quarantinedNodes.every((n) => n.lockState === 'ERP_BATCH_LOCKED_AND_HOLD_RED_TAGGED')).toBe(true);
    expect(manifest.quarantinedNodes[3].lotNumber).toBe('PALLET-AERO-EXP-9901');
  });
});
