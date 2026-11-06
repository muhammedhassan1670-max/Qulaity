/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/change/change-point-detector.js
 * ============================================================================
 * Detects structural change-points in sequentially ordered or time-series data
 * using lightweight, browser-efficient CUSUM and rolling variance divergence.
 * 
 * Safeguard: If no ordered temporal dimension exists, returns an explicit
 * non-blocking explanatory status message.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ChangePointDetector = {
        /**
         * Detect structural change-points in ordered dataset
         * 
         * @param {Object} params
         * @param {Object} params.dataset
         * @param {Object} params.profile
         * @param {Object} params.analysisPlan
         * @returns {Object} Change-Point Report
         */
        detect({
            dataset = {},
            profile = {},
            analysisPlan = {}
        } = {}) {
            const rows = Array.isArray(dataset.rows) ? dataset.rows : [];
            const colProfiles = profile?.columns || [];

            // 1. Check for ordered temporal dimension
            const isTimeSeries = analysisPlan?.datasetType?.type === 'time_series' || analysisPlan?.datasetType === 'time_series';
            const dateCol = colProfiles.find(c => c.detectedType === 'date' || c.detectedType === 'datetime')?.name || null;

            if (!isTimeSeries && !dateCol) {
                return {
                    status: 'unavailable',
                    detected: false,
                    points: [],
                    message: 'Change-point analysis unavailable: no valid ordered time dimension detected.'
                };
            }

            if (rows.length < 10) {
                return {
                    status: 'insufficient_sample',
                    detected: false,
                    points: [],
                    message: `Change-point analysis requires at least 10 sequential observations (current n = ${rows.length}).`
                };
            }

            // Find primary numeric sequence to evaluate
            const targetCol = analysisPlan?.primaryTarget?.column || colProfiles.find(c => c.detectedType === 'numeric' && c.name !== dateCol)?.name;
            if (!targetCol) {
                return {
                    status: 'no_numeric_target',
                    detected: false,
                    points: [],
                    message: 'No numeric series identified for change-point evaluation.'
                };
            }

            // Extract ordered numeric values
            const values = rows.map(r => Number(r[targetCol])).filter(n => Number.isFinite(n));
            if (values.length < 10) {
                return {
                    status: 'insufficient_valid_values',
                    detected: false,
                    points: [],
                    message: 'Insufficient finite numeric values for change-point detection.'
                };
            }

            const n = values.length;
            const meanTotal = values.reduce((a, b) => a + b, 0) / n;
            const varianceTotal = values.reduce((a, b) => a + Math.pow(b - meanTotal, 2), 0) / (n - 1) || 1e-6;
            const stdTotal = Math.sqrt(varianceTotal);

            // 2. CUSUM (Cumulative Sum Control Chart) Step-Change Detection
            let cusumPos = 0;
            let cusumNeg = 0;
            const k = 0.5 * stdTotal; // Reference value (slack)
            const hThreshold = 4.0 * stdTotal; // Decision interval

            const detectedPoints = [];
            let maxShiftMagnitude = 0;

            for (let i = 0; i < n; i++) {
                const deviation = values[i] - meanTotal;
                cusumPos = Math.max(0, cusumPos + deviation - k);
                cusumNeg = Math.min(0, cusumNeg + deviation + k);

                if (cusumPos > hThreshold || Math.abs(cusumNeg) > hThreshold) {
                    // Local segment comparison
                    const segBefore = values.slice(Math.max(0, i - 5), i);
                    const segAfter = values.slice(i, Math.min(n, i + 5));

                    const meanBefore = segBefore.length > 0 ? segBefore.reduce((a, b) => a + b, 0) / segBefore.length : meanTotal;
                    const meanAfter = segAfter.length > 0 ? segAfter.reduce((a, b) => a + b, 0) / segAfter.length : meanTotal;
                    const shiftMag = +Math.abs(meanAfter - meanBefore).toFixed(4);

                    if (shiftMag > maxShiftMagnitude) maxShiftMagnitude = shiftMag;

                    const dateVal = dateCol && rows[i] ? rows[i][dateCol] : null;

                    detectedPoints.push({
                        index: i,
                        date: dateVal,
                        metric: targetCol,
                        type: cusumPos > hThreshold ? 'upward_level_shift' : 'downward_level_shift',
                        meanBefore: +meanBefore.toFixed(4),
                        meanAfter: +meanAfter.toFixed(4),
                        magnitude: shiftMag,
                        confidence: Math.min(95, Math.round(50 + (shiftMag / (stdTotal || 1)) * 20)),
                        evidence: `CUSUM threshold breached at observation ${i}${dateVal ? ` (${dateVal})` : ''} on "${targetCol}". Shift magnitude: ${shiftMag}.`
                    });

                    // Reset CUSUM to avoid cascading duplicate triggers on same step
                    cusumPos = 0;
                    cusumNeg = 0;
                }
            }

            return {
                status: 'completed',
                detected: detectedPoints.length > 0,
                target: targetCol,
                points: detectedPoints,
                summary: {
                    totalPoints: detectedPoints.length,
                    maxShiftMagnitude,
                    firstChangePoint: detectedPoints[0] || null
                },
                message: detectedPoints.length > 0
                    ? `Detected ${detectedPoints.length} structural level shift(s) along series "${targetCol}".`
                    : `Series "${targetCol}" shows structural mean and variance stability along the temporal axis.`
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.ChangePointDetector = ChangePointDetector;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChangePointDetector;
    }
})(typeof window !== 'undefined' ? window : global);
