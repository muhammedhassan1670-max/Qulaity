/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/topology/topology-classifier.js
 * ============================================================================
 * Discovers multi-faceted structural topologies in datasets.
 * A dataset is NOT constrained to a single label (e.g. Panel + Time Series + Entity).
 * ============================================================================
 */

(function (window) {
    'use strict';

    const TopologyClassifier = {
        /**
         * Classify multi-faceted dataset topologies
         * @param {Object} profile - Profiler output
         * @param {Object} dataset - Raw dataset { rows, columns, ... }
         * @returns {Array<Object>} List of classified topologies with confidence and evidence
         */
        classify(profile, dataset) {
            if (!profile || !profile.columns || profile.columns.length === 0) {
                return [{ type: 'TABULAR', confidence: 0.5, label: 'General Tabular', evidence: ['Empty or minimal profile'] }];
            }

            const topologies = [];
            const cols = profile.columns;
            const rows = Array.isArray(dataset?.rows) ? dataset.rows : [];
            const rowCount = profile.dataset?.rowCount || rows.length;
            const colCount = cols.length;

            const isDate = (c) => ['date', 'datetime', 'time'].includes(c.detectedType) || 
                                 ['date', 'datetime', 'time'].includes(c.inferredType) || 
                                 /date|time|timestamp|_at$/i.test(c.name);
            const dateCols = cols.filter(isDate);
            const idCols = cols.filter(c => c.detectedType === 'identifier' || 
                                            c.semanticRole === 'identifier' || 
                                            c.semanticType === 'id' || 
                                            /_id$|^id$|uuid|code|key/i.test(c.name) || 
                                            ((c.stats?.uniqueCount === rowCount || c.stats?.distinctCount === rowCount) && rowCount > 10));
            const isNum = (c) => ['integer', 'decimal', 'numeric', 'float'].includes(c.detectedType) || 
                                 ['integer', 'decimal', 'numeric', 'float'].includes(c.inferredType) || 
                                 ['integer', 'decimal', 'numeric', 'float'].includes(c.subType);
            const numCols = cols.filter(isNum);
            const catCols = cols.filter(c => ['categorical', 'boolean', 'string', 'text'].includes(c.detectedType) || 
                                            ['categorical', 'boolean', 'string'].includes(c.inferredType));

            // 1. Tabular (Baseline topology for all tabular data)
            topologies.push({
                type: 'TABULAR',
                label: 'General Tabular Matrix',
                confidence: 0.98,
                evidence: [`${colCount} columns and ${rowCount} rows organized in rectangular schema.`]
            });

            // 2. Time Series
            if (dateCols.length > 0) {
                const dateCol = dateCols[0];
                const isOrdered = this._checkDateOrdering(dateCol.name, rows);
                const conf = isOrdered ? 0.90 : 0.65;
                topologies.push({
                    type: 'TIME_SERIES',
                    label: 'Time Series Sequence',
                    confidence: conf,
                    evidence: [
                        `Detected temporal axis column "${dateCol.name}".`,
                        isOrdered ? 'Observations exhibit verified chronological sequence.' : 'Dates present but require temporal sorting.'
                    ]
                });
            }

            // 3. Panel Data (Entity + Time + Metrics)
            if (idCols.length > 0 && dateCols.length > 0 && numCols.length > 0) {
                // Check if same ID repeats across multiple time points
                const hasRepeatedEntities = this._checkRepeatedEntities(idCols[0].name, rows);
                if (hasRepeatedEntities) {
                    topologies.push({
                        type: 'PANEL_DATA',
                        label: 'Panel / Longitudinal Matrix',
                        confidence: 0.88,
                        evidence: [
                            `Entity key "${idCols[0].name}" repeats across temporal intervals "${dateCols[0].name}".`,
                            'Cross-sectional units observed over multiple periods.'
                        ]
                    });
                }
            }

            // 4. Transaction Data (Customer/Account + Date + Monetary/Amount)
            const monetaryCol = cols.find(c => /amount|price|cost|revenue|sales|fee|balance|total/i.test(c.name));
            if (monetaryCol && (dateCols.length > 0 || idCols.length > 0)) {
                topologies.push({
                    type: 'TRANSACTION_DATA',
                    label: 'Transactional Ledger',
                    confidence: 0.85,
                    evidence: [
                        `Contains monetary/financial quantity "${monetaryCol.name}".`,
                        dateCols.length > 0 ? `Associated with transaction timestamps "${dateCols[0].name}".` : 'Structured as ledger entries.'
                    ]
                });
            }

            // 5. Customer / Entity Profile Data
            const customerCol = cols.find(c => /customer|user|client|patient|subscriber|account|member/i.test(c.name));
            if (customerCol && (!dateCols.length || idCols.includes(customerCol))) {
                topologies.push({
                    type: 'CUSTOMER_ENTITY_DATA',
                    label: 'Entity Profile Data',
                    confidence: 0.82,
                    evidence: [`Attributes clustered around entity dimension "${customerCol.name}".`]
                });
            }

            // 6. Measurement / Sensor Data
            const sensorKeywords = /sensor|temp|pressure|voltage|vibration|speed|humidity|rpm|flow|frequency/i;
            const sensorCols = numCols.filter(c => sensorKeywords.test(c.name));
            if (sensorCols.length >= 2 || (sensorCols.length >= 1 && dateCols.length > 0)) {
                topologies.push({
                    type: 'MEASUREMENT_DATA',
                    label: 'Telemetry & Sensor Stream',
                    confidence: 0.86,
                    evidence: [`Identified physical measurement signals (${sensorCols.map(c => c.name).slice(0, 3).join(', ')}).`]
                });
            }

            // 7. Event Log (Activity + Timestamp + Case/User)
            const activityCol = cols.find(c => /activity|event|action|step|status|stage|state/i.test(c.name));
            if (activityCol && dateCols.length > 0 && idCols.length > 0) {
                topologies.push({
                    type: 'EVENT_LOG',
                    label: 'Event & Workflow Log',
                    confidence: 0.84,
                    evidence: [
                        `Identified discrete event/activity field "${activityCol.name}".`,
                        `Correlated with sequence identifier "${idCols[0].name}" and timestamp "${dateCols[0].name}".`
                    ]
                });
            }

            // 8. High-Dimensional (p > 50 or p/n > 0.3)
            if (colCount >= 50 || (rowCount > 0 && colCount / rowCount > 0.3)) {
                topologies.push({
                    type: 'HIGH_DIMENSIONAL',
                    label: 'High-Dimensional Feature Space',
                    confidence: 0.80,
                    evidence: [`High feature-to-sample ratio (p=${colCount}, n=${rowCount}). Dimensionality reduction recommended.`]
                });
            }

            // 9. Hierarchical (Parent/Child ID or nested levels)
            const parentChild = cols.find(c => /parent|manager_id|category_id|group_id|region/i.test(c.name));
            if (parentChild && idCols.length > 0) {
                topologies.push({
                    type: 'HIERARCHICAL',
                    label: 'Hierarchical / Nested Structure',
                    confidence: 0.76,
                    evidence: [`Potential tree/nesting relationship via grouping dimension "${parentChild.name}".`]
                });
            }

            // Sort by confidence descending
            topologies.sort((a, b) => b.confidence - a.confidence);
            return topologies;
        },

        _checkDateOrdering(dateColName, rows) {
            if (!rows || rows.length < 5) return false;
            let ascCount = 0;
            const sampleSize = Math.min(30, rows.length - 1);
            for (let i = 0; i < sampleSize; i++) {
                const d1 = new Date(rows[i][dateColName]).getTime();
                const d2 = new Date(rows[i + 1][dateColName]).getTime();
                if (Number.isFinite(d1) && Number.isFinite(d2) && d2 >= d1) {
                    ascCount++;
                }
            }
            return (ascCount / sampleSize) >= 0.8;
        },

        _checkRepeatedEntities(idColName, rows) {
            if (!rows || rows.length < 10) return false;
            const seen = new Set();
            let repeats = 0;
            const sample = rows.slice(0, 100);
            for (const r of sample) {
                const val = r[idColName];
                if (val !== undefined && val !== null) {
                    if (seen.has(val)) repeats++;
                    else seen.add(val);
                }
            }
            return repeats >= 3;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.TopologyClassifier = TopologyClassifier;

})(typeof window !== 'undefined' ? window : global);
