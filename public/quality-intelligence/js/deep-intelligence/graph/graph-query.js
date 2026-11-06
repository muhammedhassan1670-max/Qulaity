/**
 * UDIP Deep Intelligence Evolution vNext
 * GraphQuery - Graph Traversal & Evidence Tracing
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.GraphQuery = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class GraphQuery {
        static traceEvidenceChain(insightGraph, targetNodeId) {
            if (!insightGraph) return [];
            const chain = [];
            const visited = new Set();

            const traverse = (nodeId, depth = 0) => {
                if (depth > 5 || visited.has(nodeId)) return;
                visited.add(nodeId);

                const node = insightGraph.getNode(nodeId);
                if (node) {
                    chain.push({ depth, node });
                    const incoming = insightGraph.getEdgesTo(nodeId);
                    incoming.forEach(edge => {
                        traverse(edge.source, depth + 1);
                    });
                }
            };

            traverse(targetNodeId);
            return chain;
        }

        static findContradictions(insightGraph) {
            if (!insightGraph || !insightGraph.edges) return [];
            return insightGraph.edges.filter(e => e.type === 'CONTRADICTS' || e.type === 'CHALLENGED_BY');
        }
    }

    return GraphQuery;
}));
