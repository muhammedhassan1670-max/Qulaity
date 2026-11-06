/**
 * UDIP Deep Intelligence Evolution vNext
 * RecurringPatterns - Seasonality & Periodic Anomaly Bursts
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.RecurringPatterns = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class RecurringPatterns {
        static detect(series) {
            if (!series || series.length < 14) {
                return { hasSeasonality: false, dominantPeriod: null };
            }

            // Test common periodicities (e.g. 7 for weekly, 12 for monthly, 24 for daily hourly)
            const candidates = [7, 12, 24].filter(p => series.length >= p * 2);
            let bestPeriod = null;
            let bestCorr = 0;

            const n = series.length;
            const mean = series.reduce((a, b) => a + b, 0) / n;
            let var0 = 0;
            for (let i = 0; i < n; i++) var0 += Math.pow(series[i] - mean, 2);

            if (var0 > 0) {
                for (const p of candidates) {
                    let cov = 0;
                    for (let i = p; i < n; i++) {
                        cov += (series[i] - mean) * (series[i - p] - mean);
                    }
                    const r = cov / var0;
                    if (r >= 0.40 && r > bestCorr) {
                        bestCorr = r;
                        bestPeriod = p;
                    }
                }
            }

            return {
                hasSeasonality: bestPeriod !== null,
                dominantPeriod: bestPeriod,
                seasonalityStrength: +bestCorr.toFixed(3),
                status: bestPeriod !== null ? 'OBSERVED' : 'UNKNOWN'
            };
        }
    }

    return RecurringPatterns;
}));
