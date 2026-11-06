/**
 * UDIP Deep Intelligence Evolution vNext
 * GraphBuilder - Incremental InsightGraph Synthesis
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.GraphBuilder = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class GraphBuilder {
        static build({ dataset, variables = {}, relationships = [], hypotheses = [], counterEvidence = [], criticAudit = null } = {}) {
            const glob = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
            const InsightGraph = glob.UDIP && glob.UDIP.InsightGraph ? glob.UDIP.InsightGraph : null;
            if (!InsightGraph) return null;

            const g = new InsightGraph();
            const dsId = (dataset && dataset.name) || 'dataset_root';

            // Root Dataset Node
            g.addNode(dsId, InsightGraph.NODE_TYPES.DATASET, dataset ? (dataset.name || 'Active Dataset') : 'Dataset', {
                rows: dataset ? (dataset.rowCount || (dataset.rows ? dataset.rows.length : 0)) : 0
            });

            // Variable Nodes
            for (const [col, vInfo] of Object.entries(variables || {})) {
                const varNodeId = `var_${col}`;
                g.addNode(varNodeId, InsightGraph.NODE_TYPES.VARIABLE, col, { role: vInfo.role, type: vInfo.detectedType });
                g.addEdge(dsId, varNodeId, InsightGraph.EDGE_TYPES.DEPENDS_ON);
            }

            // Relationship Nodes & Edges
            (relationships || []).slice(0, 10).forEach((rel, idx) => {
                const relNodeId = `rel_${rel.colA}_${rel.colB}_${idx}`;
                const label = `${rel.colA} ↔ ${rel.colB} (${rel.shape || 'RELATION'})`;
                g.addNode(relNodeId, InsightGraph.NODE_TYPES.RELATIONSHIP, label, {
                    strength: rel.strength,
                    shape: rel.shape,
                    isNonLinear: rel.isNonLinear
                });
                g.addEdge(`var_${rel.colA}`, relNodeId, InsightGraph.EDGE_TYPES.CORRELATES_WITH, rel.pearson || 0.5);
                g.addEdge(`var_${rel.colB}`, relNodeId, InsightGraph.EDGE_TYPES.CORRELATES_WITH, rel.pearson || 0.5);
            });

            // Hypothesis Nodes & Edges
            (hypotheses || []).slice(0, 8).forEach(h => {
                const hNodeId = `hyp_${h.id}`;
                g.addNode(hNodeId, InsightGraph.NODE_TYPES.HYPOTHESIS, h.statement, {
                    status: h.status,
                    type: h.type,
                    confidence: h.confidence
                });

                // Link to variables
                (h.variables || []).forEach(v => {
                    if (g.getNode(`var_${v}`)) {
                        g.addEdge(hNodeId, `var_${v}`, InsightGraph.EDGE_TYPES.ASSOCIATED_WITH);
                    }
                });

                // Link counter-evidence if present
                (h.counterEvidence || []).forEach((ce, ceIdx) => {
                    const ceNodeId = `ce_${h.id}_${ceIdx}`;
                    g.addNode(ceNodeId, InsightGraph.NODE_TYPES.EVIDENCE, ce.type || 'Counter-Evidence', { details: ce.evidence });
                    g.addEdge(ceNodeId, hNodeId, InsightGraph.EDGE_TYPES.CONTRADICTS);
                });
            });

            // Critic Validation Node
            if (criticAudit) {
                const criticNodeId = 'critic_audit_gate';
                g.addNode(criticNodeId, InsightGraph.NODE_TYPES.VALIDATION, `Adversarial Critic: ${criticAudit.verdict}`, {
                    verdict: criticAudit.verdict,
                    score: criticAudit.score
                });
                g.addEdge(criticNodeId, dsId, InsightGraph.EDGE_TYPES.VALIDATED_BY);
            }

            return g;
        }
    }

    return GraphBuilder;
}));
