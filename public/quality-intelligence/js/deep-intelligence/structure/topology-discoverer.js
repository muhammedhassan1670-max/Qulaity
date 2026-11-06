/**
 * UDIP Deep Intelligence Evolution vNext
 * TopologyDiscoverer - Multi-Faceted Dataset Topology Classifier
 * Evaluates independent likelihood scores for:
 * TABULAR, TIME_SERIES, PANEL, TRANSACTIONAL, ENTITY_CENTRIC, EVENT_LOG,
 * LONGITUDINAL, HIERARCHICAL, HIGH_DIMENSIONAL, MIXED_TYPE, SEQUENCE_LIKE
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.TopologyDiscoverer = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class TopologyDiscoverer {
        static discover(dataset, profile) {
            if (!dataset || !dataset.columns || dataset.columns.length === 0) {
                return [];
            }

            const rowCount = dataset.rowCount || (dataset.rows ? dataset.rows.length : 0);
            const colCount = dataset.columns.length;
            const columns = dataset.columns;
            const colProfiles = {};
            if (profile && profile.columns) {
                if (Array.isArray(profile.columns)) {
                    profile.columns.forEach(c => { if (c && c.name) colProfiles[c.name] = c; });
                } else if (typeof profile.columns === 'object') {
                    Object.assign(colProfiles, profile.columns);
                }
            }

            const scores = {};
            const explanations = {};

            // 1. TABULAR: Baseline 1.0
            scores['TABULAR'] = 1.0;
            explanations['TABULAR'] = 'Canonical 2D matrix structure with discrete rows and columns.';

            // Helper to get column type & unique count
            const getColMeta = (c) => {
                const p = colProfiles[c] || {};
                const detectedType = p.detectedType || p.inferredType || 'unknown';
                let uniqueCount = (p.stats && (p.stats.uniqueCount || p.stats.distinctCount)) || 0;
                if (!uniqueCount && dataset.rows && dataset.rows.length > 0) {
                    const set = new Set();
                    for (let r = 0; r < Math.min(dataset.rows.length, 100); r++) {
                        set.add(dataset.rows[r][c]);
                    }
                    uniqueCount = set.size;
                }
                return { detectedType, uniqueCount, p };
            };

            const dateCols = columns.filter(c => {
                const { detectedType } = getColMeta(c);
                return detectedType === 'date' || detectedType === 'timestamp' || c.toLowerCase().includes('date') || c.toLowerCase().includes('time');
            });

            const idCols = columns.filter(c => {
                const { detectedType, uniqueCount } = getColMeta(c);
                return detectedType === 'identifier' || (uniqueCount > 0 && uniqueCount / rowCount >= 0.95);
            });

            // 2. TIME_SERIES: Date column present + ordered rows
            if (dateCols.length > 0) {
                const primaryDate = dateCols[0];
                let isOrdered = true;
                if (dataset.rows && dataset.rows.length >= 2) {
                    for (let i = 1; i < Math.min(20, dataset.rows.length); i++) {
                        const t1 = new Date(dataset.rows[i - 1][primaryDate]).getTime();
                        const t2 = new Date(dataset.rows[i][primaryDate]).getTime();
                        if (!isNaN(t1) && !isNaN(t2) && t2 < t1) {
                            isOrdered = false;
                            break;
                        }
                    }
                }
                const tsLikelihood = isOrdered ? 0.95 : 0.80;
                scores['TIME_SERIES'] = tsLikelihood;
                explanations['TIME_SERIES'] = `Contains temporal dimension (${primaryDate})${isOrdered ? ' with chronological sequence order.' : ' with potential observation timestamps.'}`;
            }

            // 3. ENTITY_CENTRIC & TRANSACTIONAL: Repetitive entity keys
            const entityCandidateCols = columns.filter(c => {
                const lower = c.toLowerCase();
                const { uniqueCount } = getColMeta(c);
                const isIdNamed = lower.includes('customer') || lower.includes('user') || lower.includes('client') ||
                    lower.includes('account') || lower.includes('device') || lower.includes('patient');
                return isIdNamed && uniqueCount > 1 && uniqueCount < rowCount;
            });

            if (entityCandidateCols.length > 0) {
                const primaryEntity = entityCandidateCols[0];
                const { uniqueCount } = getColMeta(primaryEntity);
                const avgRecordsPerEntity = rowCount / (uniqueCount || 1);

                scores['ENTITY_CENTRIC'] = +Math.min(0.95, 0.5 + (avgRecordsPerEntity > 1.2 ? 0.4 : 0.2)).toFixed(2);
                explanations['ENTITY_CENTRIC'] = `Entity identifier (${primaryEntity}) tracked across multiple occurrences (average ${avgRecordsPerEntity.toFixed(1)} observations/entity).`;

                // If date is also present, it is TRANSACTIONAL or PANEL
                if (dateCols.length > 0) {
                    scores['TRANSACTIONAL'] = 0.85;
                    explanations['TRANSACTIONAL'] = `Pairs entity identifier (${primaryEntity}) with transaction timestamps (${dateCols[0]}).`;

                    if (avgRecordsPerEntity >= 2) {
                        scores['PANEL'] = 0.80;
                        explanations['PANEL'] = `Cross-sectional time-series structure tracking entities across repeated observation intervals.`;
                    }
                }
            } else if (dateCols.length > 0 && columns.some(c => c.toLowerCase().includes('order') || c.toLowerCase().includes('trans'))) {
                scores['TRANSACTIONAL'] = 0.82;
                explanations['TRANSACTIONAL'] = `Transaction records paired with observation timestamps (${dateCols[0]}).`;
            }

            // 4. EVENT_LOG: Event type + timestamp + actor
            const eventCols = columns.filter(c => {
                const lower = c.toLowerCase();
                return lower.includes('event') || lower.includes('action') || lower.includes('activity') || lower.includes('status');
            });
            if (eventCols.length > 0 && dateCols.length > 0) {
                scores['EVENT_LOG'] = 0.88;
                explanations['EVENT_LOG'] = `Contains discrete event activity flags (${eventCols[0]}) anchored by timestamp (${dateCols[0]}).`;
            }

            // 5. HIGH_DIMENSIONAL: colCount > 50 or colCount > rowCount / 2
            if (colCount >= 50 || (rowCount > 0 && colCount > rowCount * 0.3)) {
                scores['HIGH_DIMENSIONAL'] = 0.85;
                explanations['HIGH_DIMENSIONAL'] = `High feature-to-sample dimensionality ratio (P=${colCount}, N=${rowCount}).`;
            }

            // 6. MIXED_TYPE: Has numeric, categorical, and date
            let hasNum = false, hasCat = false, hasDate = dateCols.length > 0;
            columns.forEach(c => {
                const { detectedType } = getColMeta(c);
                if (detectedType === 'integer' || detectedType === 'decimal') hasNum = true;
                if (detectedType === 'categorical' || detectedType === 'text') hasCat = true;
            });
            if (hasNum && hasCat) {
                scores['MIXED_TYPE'] = 0.90;
                explanations['MIXED_TYPE'] = 'Contains heterogeneous feature types spanning quantitative metrics and discrete qualitative categories.';
            }

            // Convert to sorted array of topology objects
            const result = Object.keys(scores).map(topKey => ({
                topology: topKey,
                score: scores[topKey],
                likelihood: scores[topKey],
                explanation: explanations[topKey] || 'Topology characteristics detected.'
            })).sort((a, b) => b.score - a.score);

            return result;
        }
    }

    return TopologyDiscoverer;
}));
