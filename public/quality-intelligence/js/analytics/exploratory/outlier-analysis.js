/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/exploratory/outlier-analysis.js
 * ============================================================================
 * Categorizes distribution outliers across numeric columns using Tukey IQR:
 * - Distinguishes mild outliers (1.5x IQR) from extreme outliers (3.0x IQR)
 * - Highlights potential anomalies without automated destructive filtering
 * Domain-agnostic & math-safe.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const OutlierAnalysis = {
        /**
         * Analyze outliers in a numeric column
         * 
         * @param {string} colName
         * @param {Array<number>} values Non-null numeric values
         * @returns {Object} Outlier analysis result
         */
        analyze(colName, values) {
            const emptyResult = {
                column: colName,
                count: 0,
                totalValues: 0,
                percentage: 0,
                mildCount: 0,
                extremeCount: 0,
                lowerBound: 0,
                upperBound: 0,
                extremeLowerBound: 0,
                extremeUpperBound: 0,
                sampleOutliers: [],
                recommendation: 'No outliers detected'
            };

            if (!Array.isArray(values) || values.length < 4) {
                return emptyResult;
            }

            const sorted = [...values].filter(v => Number.isFinite(v)).sort((a, b) => a - b);
            const n = sorted.length;
            if (n < 4) return emptyResult;

            const PUtils = window.UDIP && window.UDIP.ProfilerUtils;
            const quartiles = PUtils ? PUtils.quartiles(sorted) : { q1: sorted[Math.floor(n * 0.25)], q3: sorted[Math.floor(n * 0.75)], iqr: 0 };
            const iqr = quartiles.iqr;

            if (iqr <= 0) {
                return {
                    ...emptyResult,
                    totalValues: n,
                    recommendation: 'Zero interquartile range (concentrated values); no IQR outliers detected'
                };
            }

            const lower15 = quartiles.q1 - 1.5 * iqr;
            const upper15 = quartiles.q3 + 1.5 * iqr;
            const lower30 = quartiles.q1 - 3.0 * iqr;
            const upper30 = quartiles.q3 + 3.0 * iqr;

            let mildCount = 0;
            let extremeCount = 0;
            const sampleOutliers = [];

            sorted.forEach(val => {
                const isExtreme = val < lower30 || val > upper30;
                const isMild = !isExtreme && (val < lower15 || val > upper15);

                if (isExtreme) {
                    extremeCount++;
                    if (sampleOutliers.length < 5) sampleOutliers.push({ value: val, severity: 'extreme' });
                } else if (isMild) {
                    mildCount++;
                    if (sampleOutliers.length < 5) sampleOutliers.push({ value: val, severity: 'mild' });
                }
            });

            const totalOutliers = mildCount + extremeCount;
            const percentage = Number(((totalOutliers / n) * 100).toFixed(2));

            let recommendation = 'Outlier level within standard tolerance.';
            if (extremeCount > 0) {
                recommendation = `${extremeCount} extreme outlier(s) detected beyond 3.0x IQR. Inspect data entry and domain validity before modeling.`;
            } else if (mildCount > 0) {
                recommendation = `${mildCount} mild outlier(s) observed. Consider robust scaling rather than arbitrary deletion.`;
            }

            return {
                column: colName,
                count: totalOutliers,
                totalValues: n,
                percentage,
                mildCount,
                extremeCount,
                lowerBound: Number(lower15.toFixed(4)),
                upperBound: Number(upper15.toFixed(4)),
                extremeLowerBound: Number(lower30.toFixed(4)),
                extremeUpperBound: Number(upper30.toFixed(4)),
                sampleOutliers,
                recommendation
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.OutlierAnalysis = OutlierAnalysis;

})(typeof window !== 'undefined' ? window : global);
