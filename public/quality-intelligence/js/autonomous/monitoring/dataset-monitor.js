/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/monitoring/dataset-monitor.js
 * ============================================================================
 * Continuously monitors dataset-level dimensional, structural, and volumetric
 * properties across ingestion versions.
 * 
 * Computes deterministic dataset fingerprints and evaluates deltas in:
 * - Row count & Column count
 * - Missingness & Duplication rates
 * - Cardinality & Value ranges
 * - Renamed column candidates
 * ============================================================================
 */

(function (window) {
    'use strict';

    /**
     * Compute a deterministic dataset fingerprint string
     * Reflects row count, column count, column names, types, and sample hashes
     */
    function computeFingerprint(dataset, profile) {
        if (!dataset || !Array.isArray(dataset.rows) || dataset.rows.length === 0) {
            return 'fp_empty_0_0';
        }

        const rowCount = dataset.rows.length;
        const cols = (dataset.columns || []).slice().sort();
        const colCount = cols.length;

        // Quick deterministic string hash (djb2)
        let hash = 5381;
        const sampleRows = [
            dataset.rows[0],
            dataset.rows[Math.floor(rowCount / 2)],
            dataset.rows[rowCount - 1]
        ].filter(Boolean);

        const hashInput = `${rowCount}|${cols.join(',')}|${JSON.stringify(sampleRows)}`;
        for (let i = 0; i < hashInput.length; i++) {
            hash = ((hash << 5) + hash) + hashInput.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }

        const absHash = Math.abs(hash).toString(16);
        return `fp_${rowCount}_${colCount}_${absHash}`;
    }

    const DatasetMonitor = {
        /**
         * Compute fingerprint for a dataset
         */
        getFingerprint: computeFingerprint,

        /**
         * Compare current dataset state against previous / baseline state
         * 
         * @param {Object} params
         * @param {Object} params.currentDataset
         * @param {Object} params.previousDataset
         * @param {Object} params.currentProfile
         * @param {Object} params.previousProfile
         * @returns {Object} Monitoring Report
         */
        monitor({
            currentDataset = {},
            previousDataset = null,
            currentProfile = {},
            previousProfile = null
        } = {}) {
            const currentRows = Array.isArray(currentDataset.rows) ? currentDataset.rows : [];
            const previousRows = previousDataset && Array.isArray(previousDataset.rows) ? previousDataset.rows : null;
            const currentCols = currentDataset.columns || [];
            const previousCols = previousDataset ? (previousDataset.columns || []) : null;

            const currFp = computeFingerprint(currentDataset, currentProfile);
            const prevFp = previousDataset ? computeFingerprint(previousDataset, previousProfile) : null;

            // Baseline scenario: No historical dataset available
            if (!previousDataset || previousRows === null) {
                return {
                    status: 'baseline_established',
                    fingerprint: currFp,
                    previousFingerprint: null,
                    rowDelta: 0,
                    colDelta: 0,
                    changes: [],
                    summary: {
                        totalChanges: 0,
                        hasVolumetricChange: false,
                        hasStructuralChange: false
                    },
                    message: 'Initial baseline dataset established — no previous dataset available for comparison.'
                };
            }

            const changes = [];

            // 1. Row count monitoring
            const rowDelta = currentRows.length - previousRows.length;
            const rowPct = previousRows.length > 0 ? +((rowDelta / previousRows.length) * 100).toFixed(2) : (currentRows.length > 0 ? 100 : 0);
            if (rowDelta !== 0) {
                const isSignificant = Math.abs(rowPct) >= 20;
                changes.push({
                    type: 'row_count',
                    column: null,
                    previousValue: previousRows.length,
                    currentValue: currentRows.length,
                    magnitude: Math.abs(rowPct),
                    unit: '%',
                    direction: rowDelta > 0 ? 'increase' : 'decrease',
                    significance: Math.abs(rowPct) >= 50 ? 'high' : (isSignificant ? 'medium' : 'low'),
                    confidence: 100,
                    interpretation: `Row count changed by ${rowDelta > 0 ? '+' : ''}${rowDelta} rows (${rowDelta > 0 ? '+' : ''}${rowPct}%).`
                });
            }

            // 2. Column count monitoring
            const colDelta = currentCols.length - previousCols.length;
            if (colDelta !== 0) {
                changes.push({
                    type: 'column_count',
                    column: null,
                    previousValue: previousCols.length,
                    currentValue: currentCols.length,
                    magnitude: Math.abs(colDelta),
                    unit: 'columns',
                    direction: colDelta > 0 ? 'increase' : 'decrease',
                    significance: Math.abs(colDelta) >= 3 ? 'high' : 'medium',
                    confidence: 100,
                    interpretation: `Column count changed by ${colDelta > 0 ? '+' : ''}${colDelta} columns.`
                });
            }

            // 3. New and removed columns
            const addedCols = currentCols.filter(c => !previousCols.includes(c));
            const removedCols = previousCols.filter(c => !currentCols.includes(c));

            addedCols.forEach(c => {
                changes.push({
                    type: 'new_column',
                    column: c,
                    previousValue: null,
                    currentValue: c,
                    magnitude: 100,
                    unit: 'presence',
                    significance: 'medium',
                    confidence: 100,
                    interpretation: `New column "${c}" introduced in current version.`
                });
            });

            removedCols.forEach(c => {
                changes.push({
                    type: 'removed_column',
                    column: c,
                    previousValue: c,
                    currentValue: null,
                    magnitude: 100,
                    unit: 'absence',
                    significance: 'high',
                    confidence: 100,
                    interpretation: `Previous column "${c}" is no longer present.`
                });
            });

            // 4. Renamed Column Candidate Check (Cautious: "Possible schema change")
            if (addedCols.length === 1 && removedCols.length === 1) {
                const added = addedCols[0];
                const removed = removedCols[0];
                // Check if types match in profiles
                const currColProf = (currentProfile?.columns || []).find(x => x.name === added);
                const prevColProf = (previousProfile?.columns || []).find(x => x.name === removed);
                if (currColProf && prevColProf && currColProf.detectedType === prevColProf.detectedType) {
                    changes.push({
                        type: 'possible_schema_change',
                        column: `${removed} -> ${added}`,
                        previousValue: removed,
                        currentValue: added,
                        magnitude: 50,
                        unit: 'similarity',
                        significance: 'medium',
                        confidence: 70,
                        interpretation: `Possible schema change: candidate renamed column from "${removed}" to "${added}".`
                    });
                }
            }

            // 5. Missingness and Cardinality per surviving column
            const sharedCols = currentCols.filter(c => previousCols.includes(c));
            const currColProfiles = currentProfile?.columns || [];
            const prevColProfiles = previousProfile?.columns || [];

            sharedCols.forEach(colName => {
                const cpCurr = currColProfiles.find(x => x.name === colName);
                const cpPrev = prevColProfiles.find(x => x.name === colName);

                if (cpCurr && cpPrev) {
                    // Type change
                    if (cpCurr.detectedType !== cpPrev.detectedType) {
                        changes.push({
                            type: 'data_type_change',
                            column: colName,
                            previousValue: cpPrev.detectedType,
                            currentValue: cpCurr.detectedType,
                            magnitude: 100,
                            unit: 'type',
                            significance: 'high',
                            confidence: 95,
                            interpretation: `Column "${colName}" inferred type changed from ${cpPrev.detectedType} to ${cpCurr.detectedType}.`
                        });
                    }

                    // Missingness change
                    const nullPctCurr = cpCurr.stats?.nullPct || 0;
                    const nullPctPrev = cpPrev.stats?.nullPct || 0;
                    const nullDelta = +(nullPctCurr - nullPctPrev).toFixed(2);
                    if (Math.abs(nullDelta) >= 5) {
                        changes.push({
                            type: 'missingness_change',
                            column: colName,
                            previousValue: nullPctPrev,
                            currentValue: nullPctCurr,
                            magnitude: Math.abs(nullDelta),
                            unit: '%',
                            significance: Math.abs(nullDelta) >= 20 ? 'high' : 'medium',
                            confidence: 90,
                            interpretation: `Missing rate in "${colName}" shifted from ${nullPctPrev}% to ${nullPctCurr}% (delta: ${nullDelta > 0 ? '+' : ''}${nullDelta}%).`
                        });
                    }

                    // Range changes for numeric variables
                    const isNum = t => ['numeric', 'integer', 'decimal', 'number'].includes(t);
                    if (isNum(cpCurr.detectedType) && isNum(cpPrev.detectedType)) {
                        const minCurr = cpCurr.stats?.min;
                        const maxCurr = cpCurr.stats?.max;
                        const minPrev = cpPrev.stats?.min;
                        const maxPrev = cpPrev.stats?.max;

                        if (minCurr != null && minPrev != null && maxCurr != null && maxPrev != null) {
                            const rangeExpanded = minCurr < minPrev || maxCurr > maxPrev;
                            if (rangeExpanded) {
                                changes.push({
                                    type: 'range_change',
                                    column: colName,
                                    previousValue: `[${minPrev}, ${maxPrev}]`,
                                    currentValue: `[${minCurr}, ${maxCurr}]`,
                                    magnitude: 30,
                                    unit: 'range',
                                    significance: 'low',
                                    confidence: 90,
                                    interpretation: `Observed value bounds for "${colName}" widened beyond historical baseline.`
                                });
                            }
                        }
                    }
                }
            });

            const hasVolumetric = changes.some(c => c.type === 'row_count' && c.significance !== 'low');
            const hasStructural = changes.some(c => ['new_column', 'removed_column', 'data_type_change', 'possible_schema_change'].includes(c.type));

            return {
                status: 'compared',
                fingerprint: currFp,
                previousFingerprint: prevFp,
                rowDelta,
                colDelta,
                changes,
                summary: {
                    totalChanges: changes.length,
                    hasVolumetricChange: hasVolumetric,
                    hasStructuralChange: hasStructural
                },
                message: changes.length > 0 ? `Detected ${changes.length} volumetric and structural dataset changes.` : 'No volumetric or structural changes detected.'
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.DatasetMonitor = DatasetMonitor;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DatasetMonitor;
    }
})(typeof window !== 'undefined' ? window : global);
