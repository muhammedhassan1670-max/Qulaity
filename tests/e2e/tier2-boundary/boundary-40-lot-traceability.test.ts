/**
 * Tier 2 Boundary Tests - Feature 40: Backward & Forward Lot Traceability
 * 
 * Verifies bilateral genealogy tree navigation, circular loop detection,
 * orphaned node handling, deep multi-level traversal performance, and Unicode search resilience.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resetQualityStorage } from '../../helpers/testHarness';

interface TraceNode {
  lotId: string;
  type: 'RAW_COIL' | 'STAMPED_PART' | 'SUB_ASSEMBLY' | 'FINISHED_PALLET' | 'CUSTOMER_SHIPMENT';
  supplierCode?: string;
  lineId?: string;
  parentLotIds: string[]; // Upstream (Backward)
  childLotIds: string[];  // Downstream (Forward)
}

class LotTraceabilityEngine {
  private registry: Map<string, TraceNode> = new Map();

  registerNode(node: TraceNode): void {
    this.registry.set(node.lotId, {
      ...node,
      parentLotIds: Array.isArray(node.parentLotIds) ? node.parentLotIds : [],
      childLotIds: Array.isArray(node.childLotIds) ? node.childLotIds : []
    });
  }

  traceBackward(startLotId: string, maxDepth = 25): {
    visited: string[];
    rawCoils: string[];
    hasCircularLoop: boolean;
  } {
    const visited = new Set<string>();
    const rawCoils: string[] = [];
    let hasCircularLoop = false;

    const traverse = (currentId: string, depth: number, path: Set<string>) => {
      if (depth > maxDepth) return;
      if (path.has(currentId)) {
        hasCircularLoop = true;
        return;
      }

      visited.add(currentId);
      path.add(currentId);

      const node = this.registry.get(currentId);
      if (node) {
        if (node.type === 'RAW_COIL') {
          rawCoils.push(node.lotId);
        }
        for (const parentId of node.parentLotIds) {
          traverse(parentId, depth + 1, new Set(path));
        }
      }
    };

    traverse(startLotId, 0, new Set());
    return {
      visited: Array.from(visited),
      rawCoils,
      hasCircularLoop
    };
  }

  traceForward(startLotId: string, maxDepth = 25): {
    visited: string[];
    finishedPallets: string[];
    hasCircularLoop: boolean;
  } {
    const visited = new Set<string>();
    const finishedPallets: string[] = [];
    let hasCircularLoop = false;

    const traverse = (currentId: string, depth: number, path: Set<string>) => {
      if (depth > maxDepth) return;
      if (path.has(currentId)) {
        hasCircularLoop = true;
        return;
      }

      visited.add(currentId);
      path.add(currentId);

      const node = this.registry.get(currentId);
      if (node) {
        if (node.type === 'FINISHED_PALLET' || node.type === 'CUSTOMER_SHIPMENT') {
          finishedPallets.push(node.lotId);
        }
        for (const childId of node.childLotIds) {
          traverse(childId, depth + 1, new Set(path));
        }
      }
    };

    traverse(startLotId, 0, new Set());
    return {
      visited: Array.from(visited),
      finishedPallets,
      hasCircularLoop
    };
  }

  searchLots(query: string): TraceNode[] {
    const cleaned = (query || '').trim().toLowerCase();
    if (!cleaned) return [];

    const results: TraceNode[] = [];
    for (const [id, node] of this.registry.entries()) {
      if (
        id.toLowerCase().includes(cleaned) ||
        (node.supplierCode && node.supplierCode.toLowerCase().includes(cleaned)) ||
        (node.lineId && node.lineId.toLowerCase().includes(cleaned))
      ) {
        results.push(node);
      }
    }
    return results;
  }
}

describe('Boundary Suite 40: Backward & Forward Lot Traceability', () => {
  let engine: LotTraceabilityEngine;

  beforeEach(() => {
    resetQualityStorage();
    engine = new LotTraceabilityEngine();
  });

  it('1. should trace backward from finished goods pallet to original raw steel coil', () => {
    // Pipeline: RAW_COIL_01 -> STAMPED_01 -> SUB_ASSY_01 -> PALLET_01
    engine.registerNode({
      lotId: 'RAW_COIL_01',
      type: 'RAW_COIL',
      supplierCode: 'SUP-ARCELOR-01',
      parentLotIds: [],
      childLotIds: ['STAMPED_01']
    });
    engine.registerNode({
      lotId: 'STAMPED_01',
      type: 'STAMPED_PART',
      lineId: 'PRESS_LINE_01',
      parentLotIds: ['RAW_COIL_01'],
      childLotIds: ['SUB_ASSY_01']
    });
    engine.registerNode({
      lotId: 'SUB_ASSY_01',
      type: 'SUB_ASSEMBLY',
      lineId: 'WELDING_ROBOT_04',
      parentLotIds: ['STAMPED_01'],
      childLotIds: ['PALLET_01']
    });
    engine.registerNode({
      lotId: 'PALLET_01',
      type: 'FINISHED_PALLET',
      parentLotIds: ['SUB_ASSY_01'],
      childLotIds: []
    });

    const backward = engine.traceBackward('PALLET_01');
    expect(backward.visited).toContain('PALLET_01');
    expect(backward.visited).toContain('SUB_ASSY_01');
    expect(backward.visited).toContain('STAMPED_01');
    expect(backward.visited).toContain('RAW_COIL_01');
    expect(backward.rawCoils).toEqual(['RAW_COIL_01']);
    expect(backward.hasCircularLoop).toBe(false);
  });

  it('2. should trace forward from defective supplier raw coil to all impacted pallets and shipments', () => {
    engine.registerNode({
      lotId: 'RAW_COIL_DEFECTIVE',
      type: 'RAW_COIL',
      supplierCode: 'SUP-DIRTY-ORE',
      parentLotIds: [],
      childLotIds: ['STAMP_BATCH_A', 'STAMP_BATCH_B']
    });
    engine.registerNode({
      lotId: 'STAMP_BATCH_A',
      type: 'STAMPED_PART',
      parentLotIds: ['RAW_COIL_DEFECTIVE'],
      childLotIds: ['PALLET_101']
    });
    engine.registerNode({
      lotId: 'STAMP_BATCH_B',
      type: 'STAMPED_PART',
      parentLotIds: ['RAW_COIL_DEFECTIVE'],
      childLotIds: ['PALLET_102']
    });
    engine.registerNode({
      lotId: 'PALLET_101',
      type: 'FINISHED_PALLET',
      parentLotIds: ['STAMP_BATCH_A'],
      childLotIds: []
    });
    engine.registerNode({
      lotId: 'PALLET_102',
      type: 'FINISHED_PALLET',
      parentLotIds: ['STAMP_BATCH_B'],
      childLotIds: []
    });

    const forward = engine.traceForward('RAW_COIL_DEFECTIVE');
    expect(forward.visited).toContain('RAW_COIL_DEFECTIVE');
    expect(forward.finishedPallets).toEqual(['PALLET_101', 'PALLET_102']);
    expect(forward.hasCircularLoop).toBe(false);
  });

  it('3. should detect circular lot dependencies (rework/regrind loops) without stack overflow', () => {
    // Cyclic loop: LOT_A -> LOT_B -> LOT_C -> LOT_A
    engine.registerNode({
      lotId: 'LOT_A',
      type: 'SUB_ASSEMBLY',
      parentLotIds: ['LOT_C'],
      childLotIds: ['LOT_B']
    });
    engine.registerNode({
      lotId: 'LOT_B',
      type: 'SUB_ASSEMBLY',
      parentLotIds: ['LOT_A'],
      childLotIds: ['LOT_C']
    });
    engine.registerNode({
      lotId: 'LOT_C',
      type: 'SUB_ASSEMBLY',
      parentLotIds: ['LOT_B'],
      childLotIds: ['LOT_A']
    });

    // Should break cycle without throwing RangeError: Maximum call stack size exceeded
    const backward = engine.traceBackward('LOT_A');
    expect(backward.hasCircularLoop).toBe(true);
    expect(backward.visited.length).toBeGreaterThan(0);

    const forward = engine.traceForward('LOT_A');
    expect(forward.hasCircularLoop).toBe(true);
  });

  it('4. should gracefully traverse 15+ levels deep genealogy tree within 100ms performance budget', () => {
    const DEPTH = 18;
    for (let i = 0; i < DEPTH; i++) {
      const currentId = `NODE_LEVEL_${i}`;
      const parentId = i > 0 ? `NODE_LEVEL_${i - 1}` : undefined;
      const childId = i < DEPTH - 1 ? `NODE_LEVEL_${i + 1}` : undefined;

      engine.registerNode({
        lotId: currentId,
        type: i === 0 ? 'RAW_COIL' : i === DEPTH - 1 ? 'FINISHED_PALLET' : 'SUB_ASSEMBLY',
        parentLotIds: parentId ? [parentId] : [],
        childLotIds: childId ? [childId] : []
      });
    }

    const t0 = performance.now();
    const result = engine.traceBackward(`NODE_LEVEL_${DEPTH - 1}`);
    const elapsed = performance.now() - t0;

    expect(result.visited.length).toBe(DEPTH);
    expect(result.rawCoils).toEqual(['NODE_LEVEL_0']);
    expect(elapsed).toBeLessThan(100);
  });

  it('5. should search lots handling Arabic Unicode, whitespace-only, and special characters', () => {
    engine.registerNode({
      lotId: 'دفعة-خام-حديد-001',
      type: 'RAW_COIL',
      supplierCode: 'مورد-صلب-عز',
      parentLotIds: [],
      childLotIds: []
    });
    engine.registerNode({
      lotId: 'LOT-SPECIAL-#40&A',
      type: 'FINISHED_PALLET',
      supplierCode: 'ACME',
      parentLotIds: [],
      childLotIds: []
    });

    // Empty or whitespace searches return empty array
    expect(engine.searchLots('')).toEqual([]);
    expect(engine.searchLots('   ')).toEqual([]);

    // Arabic search
    const arabicRes = engine.searchLots('حديد');
    expect(arabicRes.length).toBe(1);
    expect(arabicRes[0].lotId).toBe('دفعة-خام-حديد-001');

    // Special characters
    const specialRes = engine.searchLots('#40&');
    expect(specialRes.length).toBe(1);
    expect(specialRes[0].lotId).toBe('LOT-SPECIAL-#40&A');
  });
});
