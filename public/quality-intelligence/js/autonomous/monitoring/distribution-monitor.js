/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/monitoring/distribution-monitor.js
 * ============================================================================
 * Evaluates feature-level distribution shifts between current and baseline/previous
 * dataset states across both numerical and categorical variables.
 * 
 * Computes:
 * - Standardized mean shift (Cohen's d equivalent) & IQR/quantiles delta
 * - Categorical frequency Total Variation Distance (TVD) & vocabulary changes
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DistributionMonitor = {
        /**
         * Compare feature distributions between dataset states
         * 
         * @param {Object} params
         * @param {Object} params.currentProfile
         * @param {Object} params.previousProfile
         * @returns {Object} Distribution Monitoring Report
         */
        monitor({
            currentProfile = {},
            previousProfile = null
        } = {}) {
            if (!previousProfile || !Array.isArray(previousProfile.columns)) {
                return {
                    status: 'baseline',
                    hasShift: false,
                    numericShifts: [],
                    categoricalShifts: [],
                    summary: { totalEvaluated: 0, shiftedCount: 0, maxShiftMagnitude: 0 },
                    message: 'Distribution baseline established — no historical distributions for comparison.'
                };
            }

            const currCols = currentProfile.columns || [];
            const prevCols = previousProfile.columns || [];

            const isNumericType = t => ['numeric', 'integer', 'decimal', 'number'].includes(t);
            const isCategoricalType = t => ['categorical', 'text', 'string', 'boolean'].includes(t);

            const numericShifts = [];
            const categoricalShifts = [];
            let maxMagnitude = 0;

            currCols.forEach(cCurr => {
                const cPrev = prevCols.find(x => x.name === cCurr.name);
                if (!cPrev) return;

                // 1. Numeric Feature Shift Evaluation
                if (isNumericType(cCurr.detectedType) && isNumericType(cPrev.detectedType)) {
                    const sCurr = cCurr.stats || {};
                    const sPrev = cPrev.stats || {};

                    const meanCurr = sCurr.mean != null ? sCurr.mean : 0;
                    const meanPrev = sPrev.mean != null ? sPrev.mean : 0;
                    const stdCurr = sCurr.stdDev != null ? sCurr.stdDev : 1;
                    const stdPrev = sPrev.stdDev != null ? sPrev.stdDev : 1;

                    // Pooled standard deviation (defensive against zero variance)
                    const pooledStd = Math.sqrt(((stdCurr * stdCurr) + (stdPrev * stdPrev)) / 2) || 1e-6;
                    const standardizedShift = +((Math.abs(meanCurr - meanPrev)) / pooledStd).toFixed(4);

                    const medianDelta = +( (sCurr.median ?? meanCurr) - (sPrev.median ?? meanPrev) ).toFixed(4);
                    const iqrDelta = +( (sCurr.iqr ?? (stdCurr * 1.349)) - (sPrev.iqr ?? (stdPrev * 1.349)) ).toFixed(4);

                    let shiftSeverity = 'none';
                    if (standardizedShift >= 1.0) shiftSeverity = 'critical';
                    else if (standardizedShift >= 0.5) shiftSeverity = 'major';
                    else if (standardizedShift >= 0.25) shiftSeverity = 'moderate';
                    else if (standardizedShift >= 0.1) shiftSeverity = 'minor';

                    if (standardizedShift > maxMagnitude) maxMagnitude = standardizedShift;

                    numericShifts.push({
                        column: cCurr.name,
                        type: 'numeric',
                        standardizedShift,
                        meanDelta: +(meanCurr - meanPrev).toFixed(4),
                        medianDelta,
                        iqrDelta,
                        previousMean: +meanPrev.toFixed(4),
                        currentMean: +meanCurr.toFixed(4),
                        previousStd: +stdPrev.toFixed(4),
                        currentStd: +stdCurr.toFixed(4),
                        shiftSeverity,
                        shiftDetected: shiftSeverity !== 'none' && shiftSeverity !== 'minor',
                        interpretation: `Standardized shift magnitude: ${standardizedShift} (severity: ${shiftSeverity}).`
                    });
                }

                // 2. Categorical Feature Shift Evaluation
                if (isCategoricalType(cCurr.detectedType) && isCategoricalType(cPrev.detectedType)) {
                    const distCurr = cCurr.stats?.frequencies || {};
                    const distPrev = cPrev.stats?.frequencies || {};

                    const catsCurr = Object.keys(distCurr);
                    const catsPrev = Object.keys(distPrev);

                    const newCats = catsCurr.filter(k => !catsPrev.includes(k));
                    const removedCats = catsPrev.filter(k => !catsCurr.includes(k));

                    // Total Variation Distance (TVD)
                    const allCats = Array.from(new Set([...catsCurr, ...catsPrev]));
                    let totalAbsDiff = 0;
                    allCats.forEach(k => {
                        const p = (distCurr[k] || 0) / 100;
                        const q = (distPrev[k] || 0) / 100;
                        totalAbsDiff += Math.abs(p - q);
                    });
                    const tvd = +(totalAbsDiff / 2).toFixed(4);

                    let catSeverity = 'none';
                    if (tvd >= 0.4 || newCats.length >= 3) catSeverity = 'major';
                    else if (tvd >= 0.2 || newCats.length > 0) catSeverity = 'moderate';
                    else if (tvd >= 0.05) catSeverity = 'minor';

                    if (tvd > maxMagnitude) maxMagnitude = tvd;

                    categoricalShifts.push({
                        column: cCurr.name,
                        type: 'categorical',
                        tvd,
                        newCategories: newCats,
                        removedCategories: removedCats,
                        shiftSeverity: catSeverity,
                        shiftDetected: catSeverity !== 'none' && catSeverity !== 'minor',
                        interpretation: `Total variation distance: ${tvd}${newCats.length > 0 ? ` (${newCats.length} new categories)` : ''}.`
                    });
                }
            });

            const shiftedNumeric = numericShifts.filter(s => s.shiftDetected);
            const shiftedCategorical = categoricalShifts.filter(s => s.shiftDetected);
            const totalShifted = shiftedNumeric.length + shiftedCategorical.length;

            return {
                status: 'monitored',
                hasShift: totalShifted > 0,
                numericShifts,
                categoricalShifts,
                summary: {
                    totalEvaluated: numericShifts.length + categoricalShifts.length,
                    shiftedCount: totalShifted,
                    maxShiftMagnitude: maxMagnitude,
                    criticalShifts: numericShifts.filter(s => s.shiftSeverity === 'critical').map(s => s.column)
                },
                message: totalShifted > 0
                    ? `Distribution shift detected across ${totalShifted} column(s).`
                    : 'Feature distributions remain statistically consistent with baseline.'
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.DistributionMonitor = DistributionMonitor;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DistributionMonitor;
    }
})(typeof window !== 'undefined' ? window : global);
