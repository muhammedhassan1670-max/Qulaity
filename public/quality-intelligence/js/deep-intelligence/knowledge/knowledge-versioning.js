/**
 * UDIP Deep Intelligence Evolution vNext
 * KnowledgeVersioning - Tracks version deltas and snapshots across dataset operations.
 * Zero-dependency pure vanilla JavaScript.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.KnowledgeVersioning = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class KnowledgeVersioning {
        constructor() {
            this.history = [];
        }

        createSnapshot(dkm, changeReason = 'INITIAL_SYNTHESIS') {
            if (!dkm) return null;
            const snapshot = {
                versionId: `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                timestamp: new Date().toISOString(),
                changeReason: String(changeReason),
                datasetId: dkm.datasetId,
                summary: {
                    topologies: (dkm.topology || []).map(t => t.topology || t.name),
                    variableCount: Object.keys(dkm.variables || {}).length,
                    relationshipCount: (dkm.relationships || []).length,
                    hypothesisCount: (dkm.hypotheses || []).length,
                    criticVerdict: dkm.criticAudit ? dkm.criticAudit.verdict : 'PENDING'
                }
            };
            this.history.push(snapshot);
            return snapshot;
        }

        getHistory() {
            return [...this.history];
        }

        diff(snapA, snapB) {
            if (!snapA || !snapB) return null;
            return {
                topologyChanged: JSON.stringify(snapA.summary.topologies) !== JSON.stringify(snapB.summary.topologies),
                variableCountDelta: snapB.summary.variableCount - snapA.summary.variableCount,
                relationshipCountDelta: snapB.summary.relationshipCount - snapA.summary.relationshipCount,
                hypothesisCountDelta: snapB.summary.hypothesisCount - snapA.summary.hypothesisCount,
                criticVerdictChanged: snapA.summary.criticVerdict !== snapB.summary.criticVerdict
            };
        }
    }

    return KnowledgeVersioning;
}));
