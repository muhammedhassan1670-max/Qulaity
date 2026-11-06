/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/governance/lineage-manager.js
 * ============================================================================
 * End-to-End Data Lineage Tracking.
 * Traces data lifecycle:
 * External Source -> Connection -> Connector -> Extraction -> Ingestion -> Dataset -> Version
 * Guarantees full auditability of where every row originated.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class LineageManager {
        constructor() {
            this._records = new Map();
        }

        /**
         * Record an ingestion lineage hop
         * @param {Object} entry
         * @returns {Object} lineageRecord
         */
        recordLineage(entry = {}) {
            const id = `lin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const record = {
                id,
                connectionId: entry.connectionId || 'unknown',
                sourceId: entry.sourceId || 'unknown',
                connectorType: entry.connectorType || 'unknown',
                datasetId: entry.datasetId || null,
                versionId: entry.versionId || null,
                rowCount: entry.rowCount || 0,
                rejectedCount: entry.rejectedCount || 0,
                durationMs: entry.durationMs || 0,
                projectId: entry.projectId || 'prj_default',
                timestamp: new Date().toISOString()
            };

            this._records.set(id, record);
            return { ...record };
        }

        /**
         * Retrieve lineage history for a specific dataset
         * @param {string} datasetId
         * @returns {Array<Object>}
         */
        getLineageForDataset(datasetId) {
            return Array.from(this._records.values())
                .filter(r => r.datasetId === datasetId);
        }

        /**
         * Retrieve lineage record for a specific dataset version
         * @param {string} versionId
         * @returns {Object|null}
         */
        getLineageForVersion(versionId) {
            const list = Array.from(this._records.values())
                .filter(r => r.versionId === versionId);
            return list.length > 0 ? { ...list[list.length - 1] } : null;
        }

        /**
         * Generate a graph of nodes and edges for lineage visualization
         * @param {Object} [filter]
         * @returns {{ nodes: Array<Object>, edges: Array<Object> }}
         */
        getLineageGraph(filter = {}) {
            const nodes = new Map();
            const edges = [];

            let entries = Array.from(this._records.values());
            if (filter.projectId) {
                entries = entries.filter(e => e.projectId === filter.projectId);
            }
            if (filter.datasetId) {
                entries = entries.filter(e => e.datasetId === filter.datasetId);
            }

            entries.forEach(e => {
                // Source node
                const srcNodeId = `src_${e.sourceId}`;
                if (!nodes.has(srcNodeId)) {
                    nodes.set(srcNodeId, { id: srcNodeId, label: `Source: ${e.sourceId}`, type: 'SOURCE' });
                }

                // Connection node
                const connNodeId = `conn_${e.connectionId}`;
                if (!nodes.has(connNodeId)) {
                    nodes.set(connNodeId, { id: connNodeId, label: `Conn: ${e.connectionId} (${e.connectorType})`, type: 'CONNECTION' });
                }

                // Dataset node
                const dsNodeId = `ds_${e.datasetId}`;
                if (e.datasetId && !nodes.has(dsNodeId)) {
                    nodes.set(dsNodeId, { id: dsNodeId, label: `Dataset: ${e.datasetId}`, type: 'DATASET' });
                }

                // Version node
                const verNodeId = `ver_${e.versionId}`;
                if (e.versionId && !nodes.has(verNodeId)) {
                    nodes.set(verNodeId, { id: verNodeId, label: `Version: ${e.versionId} (${e.rowCount} rows)`, type: 'VERSION' });
                }

                // Connect edges
                edges.push({ from: srcNodeId, to: connNodeId, relation: 'ROUTES_THROUGH' });
                if (e.datasetId) {
                    edges.push({ from: connNodeId, to: dsNodeId, relation: 'INGESTED_INTO' });
                    if (e.versionId) {
                        edges.push({ from: dsNodeId, to: verNodeId, relation: 'CREATED_VERSION' });
                    }
                }
            });

            return {
                nodes: Array.from(nodes.values()),
                edges
            };
        }

        /**
         * Reset lineage records (for testing)
         */
        reset() {
            this._records.clear();
        }
    }

    const instance = new LineageManager();

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.LineageManager = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            LineageManager,
            instance
        };
    }

})(typeof window !== 'undefined' ? window : global);
