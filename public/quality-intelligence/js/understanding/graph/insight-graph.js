/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/graph/insight-graph.js
 * ============================================================================
 * Directed Knowledge Graph connecting:
 * Nodes: Dataset, Variable, Relationship, Pattern, Hypothesis, Model, Evidence, Finding, Risk, Decision.
 * Edges: supports, contradicts, depends_on, predicts, correlates_with, derived_from, associated_with, validated_by.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class InsightGraph {
        constructor() {
            this.nodes = new Map();
            this.edges = [];
        }

        addNode(id, type, label, metadata = {}) {
            if (!this.nodes.has(id)) {
                this.nodes.set(id, {
                    id,
                    type, // 'Dataset' | 'Variable' | 'Relationship' | 'Hypothesis' | 'Evidence' | 'Finding' | 'Risk'
                    label: String(label || id),
                    metadata
                });
            }
            return this.nodes.get(id);
        }

        addEdge(source, target, type, weight = 1.0, metadata = {}) {
            this.edges.push({
                source,
                target,
                type, // 'supports' | 'contradicts' | 'depends_on' | 'predicts' | 'correlates_with' | 'derived_from' | 'associated_with' | 'validated_by'
                weight: Number.isFinite(weight) ? weight : 1.0,
                metadata
            });
        }

        getNodes() {
            return Array.from(this.nodes.values());
        }

        getEdges() {
            return [...this.edges];
        }

        getNeighbors(nodeId) {
            const outgoing = this.edges.filter(e => e.source === nodeId);
            const incoming = this.edges.filter(e => e.target === nodeId);
            return { outgoing, incoming };
        }

        toJSON() {
            return {
                nodeCount: this.nodes.size,
                edgeCount: this.edges.length,
                nodes: this.getNodes(),
                edges: this.getEdges()
            };
        }
    }

    window.UDIP = window.UDIP || {};
    window.UDIP.InsightGraph = InsightGraph;

})(typeof window !== 'undefined' ? window : global);
