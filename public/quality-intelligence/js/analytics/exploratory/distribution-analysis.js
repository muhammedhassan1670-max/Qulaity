/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/exploratory/distribution-analysis.js
 * ============================================================================
 * Generates comprehensive distribution summaries for numeric & categorical features:
 * - Central tendencies, spread, skewness, histogram bins
 * - Categorical dominant frequencies, rare categories, imbalance
 * Pure browser-compatible & 100% domain-agnostic.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DistributionAnalysis = {
        /**
         * Analyze numeric column distributions
         * 
         * @param {string} colName
         * @param {Array<number>} values Non-null numeric values
         * @param {Object} [colProfile] Precomputed column profile from Step 2
         * @returns {Object} Detailed distribution profile
         */
        analyzeNumeric(colName, values, colProfile = null) {
            const PUtils = window.UDIP && window.UDIP.ProfilerUtils;
            if (!Array.isArray(values) || values.length === 0) {
                return {
                    column: colName,
                    type: 'numeric',
                    count: 0,
                    mean: 0,
                    median: 0,
                    stdDev: 0,
                    skewness: 0,
                    cv: 0,
                    shape: 'insufficient_data',
                    bins: []
                };
            }

            const sorted = [...values].sort((a, b) => a - b);
            const n = sorted.length;
            const min = sorted[0];
            const max = sorted[n - 1];

            const mean = PUtils ? PUtils.mean(sorted) : sorted.reduce((a, b) => a + b, 0) / n;
            const stdDev = PUtils ? PUtils.stdDev(sorted, mean) : 0;
            const quartiles = PUtils ? PUtils.quartiles(sorted) : { q1: min, median: mean, q3: max, iqr: max - min };
            const skewness = PUtils ? PUtils.skewness(sorted, mean, stdDev) : 0;
            const cv = PUtils ? PUtils.coefficientOfVariation(mean, stdDev) : 0;

            // Determine distribution shape
            let shape = 'symmetric';
            if (min === max) {
                shape = 'constant';
            } else if (Math.abs(skewness) <= 0.5) {
                shape = 'approximately_normal';
            } else if (skewness > 0.5) {
                shape = 'right_skewed';
            } else {
                shape = 'left_skewed';
            }

            // Generate histogram bins (up to 10 bins)
            const numBins = Math.min(10, Math.max(3, Math.floor(Math.sqrt(n))));
            const binRange = max - min;
            const binSize = binRange > 0 ? binRange / numBins : 1;
            const bins = [];

            for (let b = 0; b < numBins; b++) {
                const binStart = min + b * binSize;
                const binEnd = b === numBins - 1 ? max : binStart + binSize;
                bins.push({
                    start: Number(binStart.toFixed(2)),
                    end: Number(binEnd.toFixed(2)),
                    label: `${binStart.toFixed(1)} - ${binEnd.toFixed(1)}`,
                    count: 0
                });
            }

            sorted.forEach(val => {
                let binIdx = Math.floor((val - min) / binSize);
                if (binIdx >= numBins) binIdx = numBins - 1;
                if (binIdx < 0) binIdx = 0;
                if (bins[binIdx]) bins[binIdx].count++;
            });

            return {
                column: colName,
                type: 'numeric',
                count: n,
                min: Number(min.toFixed(4)),
                max: Number(max.toFixed(4)),
                mean: Number(mean.toFixed(4)),
                median: Number(quartiles.median.toFixed(4)),
                stdDev: Number(stdDev.toFixed(4)),
                q1: Number(quartiles.q1.toFixed(4)),
                q3: Number(quartiles.q3.toFixed(4)),
                iqr: Number(quartiles.iqr.toFixed(4)),
                skewness: Number(skewness.toFixed(4)),
                cv: Number(cv.toFixed(2)),
                shape,
                bins
            };
        },

        /**
         * Analyze categorical column distribution
         * 
         * @param {string} colName
         * @param {Array<string>} values
         * @returns {Object}
         */
        analyzeCategorical(colName, values) {
            if (!Array.isArray(values) || values.length === 0) {
                return {
                    column: colName,
                    type: 'categorical',
                    count: 0,
                    uniqueCount: 0,
                    dominantCategory: null,
                    dominantShare: 0,
                    rareCategories: [],
                    isImbalanced: false,
                    topCategories: []
                };
            }

            const freq = {};
            values.forEach(v => {
                const str = String(v !== null && v !== undefined ? v : '').trim();
                if (str !== '') freq[str] = (freq[str] || 0) + 1;
            });

            const total = Object.values(freq).reduce((a, b) => a + b, 0);
            if (total === 0) {
                return {
                    column: colName,
                    type: 'categorical',
                    count: 0,
                    uniqueCount: 0,
                    dominantCategory: null,
                    dominantShare: 0,
                    rareCategories: [],
                    isImbalanced: false,
                    topCategories: []
                };
            }

            const sortedEntries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
            const dominantCategory = sortedEntries[0][0];
            const dominantShare = Number(((sortedEntries[0][1] / total) * 100).toFixed(1));

            const rareCategories = sortedEntries
                .filter(([_, count]) => (count / total) < 0.05)
                .map(([cat]) => cat);

            // Check imbalance: dominant category > 65% of total in multiclass or > 75% in binary
            const isImbalanced = dominantShare >= 65;

            const topCategories = sortedEntries.slice(0, 10).map(([cat, count]) => ({
                category: cat,
                count,
                percentage: Number(((count / total) * 100).toFixed(1))
            }));

            return {
                column: colName,
                type: 'categorical',
                count: total,
                uniqueCount: sortedEntries.length,
                dominantCategory,
                dominantShare,
                rareCategories,
                isImbalanced,
                topCategories
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.DistributionAnalysis = DistributionAnalysis;

})(typeof window !== 'undefined' ? window : global);
