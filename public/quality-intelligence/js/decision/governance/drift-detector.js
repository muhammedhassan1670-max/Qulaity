/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: decision/governance/drift-detector.js
 * ============================================================================
 * Audits empirical distribution drift between a Baseline Dataset and a Current Dataset.
 * 
 * Computes:
 * - Numeric Mean, Standard Deviation, and Range shifts
 * - Categorical frequency shifts & novel unobserved category occurrences
 * - Missingness rate divergence
 * 
 * Strict Constraint:
 * If no baseline dataset is provided, strictly returns:
 * "Drift assessment unavailable: no baseline dataset provided."
 * Never fabricates or hallucinates drift without an empirical baseline.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DriftDetector = {
        /**
         * Detect statistical and structural distribution drift across datasets
         * 
         * @param {Object} params
         * @param {Object} [params.baselineDataset] - Historical or reference baseline dataset
         * @param {Object} params.currentDataset - Currently active dataset
         * @returns {Object} Drift evaluation report
         */
        detectDrift({ baselineDataset = null, currentDataset = null } = {}) {
            if (!currentDataset || !Array.isArray(currentDataset.rows)) {
                return {
                    status: 'error',
                    driftDetected: false,
                    totalDriftedColumns: 0,
                    columns: [],
                    message: 'Current dataset is empty or invalid.'
                };
            }

            if (!baselineDataset || !Array.isArray(baselineDataset.rows) || baselineDataset.rows.length === 0) {
                return {
                    status: 'unavailable',
                    driftDetected: false,
                    totalDriftedColumns: 0,
                    columns: [],
                    message: 'Drift assessment unavailable: no baseline dataset provided.'
                };
            }

            const baseRows = baselineDataset.rows;
            const currRows = currentDataset.rows;
            const baseCols = baselineDataset.columns || Object.keys(baseRows[0] || {});
            const currCols = currentDataset.columns || Object.keys(currRows[0] || {});

            // Common columns present in both datasets
            const commonCols = currCols.filter(c => baseCols.includes(c));

            if (commonCols.length === 0) {
                return {
                    status: 'completed',
                    driftDetected: true,
                    totalDriftedColumns: 0,
                    columns: [],
                    structuralDrift: true,
                    message: 'Severe structural drift: zero overlapping columns between baseline and current datasets.'
                };
            }

            const driftedColumns = [];

            commonCols.forEach(col => {
                const baseVals = baseRows.map(r => r[col]);
                const currVals = currRows.map(r => r[col]);

                // Missingness drift
                const baseNullCount = baseVals.filter(v => v === null || v === undefined || v === '').length;
                const currNullCount = currVals.filter(v => v === null || v === undefined || v === '').length;
                const baseNullPct = +((baseNullCount / (baseVals.length || 1)) * 100).toFixed(2);
                const currNullPct = +((currNullCount / (currVals.length || 1)) * 100).toFixed(2);
                const nullDelta = +(currNullPct - baseNullPct).toFixed(2);

                // Numeric drift check
                const baseNums = baseVals.map(Number).filter(Number.isFinite);
                const currNums = currVals.map(Number).filter(Number.isFinite);

                const isNumeric = baseNums.length >= 3 && (baseNums.length / (baseVals.length || 1)) >= 0.7;

                if (isNumeric && currNums.length >= 3) {
                    const baseMean = baseNums.reduce((a, b) => a + b, 0) / baseNums.length;
                    const currMean = currNums.reduce((a, b) => a + b, 0) / currNums.length;

                    const baseVar = baseNums.reduce((a, b) => a + Math.pow(b - baseMean, 2), 0) / (baseNums.length - 1);
                    const baseStd = Math.sqrt(Math.max(1e-9, baseVar));

                    // Standardized mean shift (Cohen's d like shift)
                    const meanShiftZ = Math.abs(currMean - baseMean) / baseStd;
                    const baseMin = Math.min(...baseNums);
                    const baseMax = Math.max(...baseNums);
                    const currMin = Math.min(...currNums);
                    const currMax = Math.max(...currNums);

                    const outOfBoundsCount = currNums.filter(v => v < baseMin || v > baseMax).length;
                    const outOfBoundsPct = +((outOfBoundsCount / currNums.length) * 100).toFixed(2);

                    const isDrifted = meanShiftZ >= 0.5 || Math.abs(nullDelta) >= 15 || outOfBoundsPct >= 10;
                    let severity = 'low';
                    if (meanShiftZ >= 1.5 || Math.abs(nullDelta) >= 30) severity = 'high';
                    else if (meanShiftZ >= 0.8 || Math.abs(nullDelta) >= 20) severity = 'moderate';

                    driftedColumns.push({
                        column: col,
                        type: 'numeric',
                        driftDetected: isDrifted,
                        driftScore: +Math.min(1.0, meanShiftZ / 2.0).toFixed(3),
                        severity,
                        baselineSummary: {
                            mean: +baseMean.toFixed(2),
                            stdDev: +baseStd.toFixed(2),
                            nullPct: baseNullPct,
                            min: baseMin,
                            max: baseMax
                        },
                        currentSummary: {
                            mean: +currMean.toFixed(2),
                            nullPct: currNullPct,
                            min: currMin,
                            max: currMax
                        },
                        interpretation: isDrifted
                            ? `Mean shifted by ${meanShiftZ.toFixed(2)} standard deviations (${baseMean.toFixed(1)} → ${currMean.toFixed(1)})${nullDelta !== 0 ? ` and missingness shifted by ${nullDelta > 0 ? '+' : ''}${nullDelta}%` : ''}.`
                            : `Distribution remains stable (standardized mean shift = ${meanShiftZ.toFixed(2)} SD).`
                    });
                } else {
                    // Categorical drift check
                    const baseFreq = {};
                    const currFreq = {};
                    baseVals.forEach(v => { const s = String(v ?? '').trim(); baseFreq[s] = (baseFreq[s] || 0) + 1; });
                    currVals.forEach(v => { const s = String(v ?? '').trim(); currFreq[s] = (currFreq[s] || 0) + 1; });

                    const baseTotal = baseVals.length || 1;
                    const currTotal = currVals.length || 1;

                    // Compute maximum category percentage delta
                    let maxCategoryShift = 0;
                    let shiftedCategory = '';
                    const novelCategories = [];

                    Object.keys(currFreq).forEach(cat => {
                        if (!baseFreq[cat]) novelCategories.push(cat);
                        const bPct = ((baseFreq[cat] || 0) / baseTotal) * 100;
                        const cPct = (currFreq[cat] / currTotal) * 100;
                        const diff = Math.abs(cPct - bPct);
                        if (diff > maxCategoryShift) {
                            maxCategoryShift = diff;
                            shiftedCategory = cat;
                        }
                    });

                    const isDrifted = maxCategoryShift >= 20 || novelCategories.length > 0 || Math.abs(nullDelta) >= 15;
                    let severity = 'low';
                    if (maxCategoryShift >= 35 || novelCategories.length >= 3) severity = 'high';
                    else if (maxCategoryShift >= 20 || novelCategories.length > 0) severity = 'moderate';

                    driftedColumns.push({
                        column: col,
                        type: 'categorical',
                        driftDetected: isDrifted,
                        driftScore: +Math.min(1.0, maxCategoryShift / 100.0).toFixed(3),
                        severity,
                        baselineSummary: { nullPct: baseNullPct, categoryCount: Object.keys(baseFreq).length },
                        currentSummary: { nullPct: currNullPct, categoryCount: Object.keys(currFreq).length, novelCategories },
                        interpretation: isDrifted
                            ? `Frequency shift of ${maxCategoryShift.toFixed(1)}% observed in category "${shiftedCategory}"${novelCategories.length > 0 ? ` with ${novelCategories.length} novel unobserved categories` : ''}.`
                            : `Category distribution remains consistent with baseline.`
                    });
                }
            });

            const totalDrifted = driftedColumns.filter(c => c.driftDetected).length;

            return {
                status: 'completed',
                driftDetected: totalDrifted > 0,
                totalDriftedColumns: totalDrifted,
                evaluatedColumnsCount: commonCols.length,
                columns: driftedColumns,
                message: totalDrifted > 0
                    ? `Distribution drift detected across ${totalDrifted} of ${commonCols.length} audited columns.`
                    : 'All audited columns show stable distribution alignment with historical baseline.'
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.DriftDetector = DriftDetector;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DriftDetector;
    }
})(typeof window !== 'undefined' ? window : global);
