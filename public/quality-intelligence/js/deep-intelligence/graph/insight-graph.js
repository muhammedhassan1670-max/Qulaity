/**
 * UDIP Deep Intelligence Evolution vNext
 * InsightGraph - Directed Knowledge Graph 2.0
 * Nodes: DATASET, VARIABLE, RELATIONSHIP, HYPOTHESIS, METHOD, EVIDENCE, VALIDATION, FINDING, RISK, DECISION
 * Edges: SUPPORTS, CONTRADICTS, DEPENDS_ON, CORRELATES_WITH, PREDICTS, DERIVED_FROM, ASSOCIATED_WITH, VALIDATED_BY, CHALLENGED_BY
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.InsightGraph = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class InsightGraph {
        constructor() {
            this.nodes = new Map();
            this.edges = [];
        }

        static get NODE_TYPES() {
            return {
                DATASET: 'DATASET',
                VARIABLE: 'VARIABLE',
                RELATIONSHIP: 'RELATIONSHIP',
                HYPOTHESIS: 'HYPOTHESIS',
                METHOD: 'METHOD',
                EVIDENCE: 'EVIDENCE',
                VALIDATION: 'VALIDATION',
                FINDING: 'FINDING',
                RISK: 'RISK',
                DECISION: 'DECISION'
            };
        }

        static get EDGE_TYPES() {
            return {
                SUPPORTS: 'SUPPORTS',
                CONTRADICTS: 'CONTRADICTS',
                DEPENDS_ON: 'DEPENDS_ON',
                CORRELATES_WITH: 'CORRELATES_WITH',
                PREDICTS: 'PREDICTS',
                DERIVED_FROM: 'DERIVED_FROM',
                ASSOCIATED_WITH: 'ASSOCIATED_WITH',
                VALIDATED_BY: 'VALIDATED_BY',
                CHALLENGED_BY: 'CHALLENGED_BY'
            };
        }

        addNode(id, type, label, data = {}) {
            this.nodes.set(id, {
                id: String(id),
                type: type || 'FINDING',
                label: String(label || id),
                data: data,
                createdAt: new Date().toISOString()
            });
            return this;
        }

        addEdge(sourceId, targetId, edgeType, weight = 1.0, metadata = {}) {
            this.edges.push({
                source: String(sourceId),
                target: String(targetId),
                type: edgeType || 'ASSOCIATED_WITH',
                weight: typeof weight === 'number' ? weight : 1.0,
                metadata: metadata
            });
            return this;
        }

        getNode(id) {
            return this.nodes.get(String(id)) || null;
        }

        getEdgesFrom(sourceId) {
            return this.edges.filter(e => e.source === String(sourceId));
        }

        getEdgesTo(targetId) {
            return this.edges.filter(e => e.target === String(targetId));
        }

        toJSON() {
            return {
                nodes: Array.from(this.nodes.values()),
                edges: this.edges,
                nodeCount: this.nodes.size,
                edgeCount: this.edges.length
            };
        }
    }

    return InsightGraph;
}));
