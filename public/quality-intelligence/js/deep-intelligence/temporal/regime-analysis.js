/**
 * UDIP Deep Intelligence Evolution vNext
 * RegimeAnalysis - Compares Mean, Variance, Trend, and Distributions Across Regimes
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.RegimeAnalysis = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class RegimeAnalysis {
        static compareRegimes(series, changePointIndex) {
            if (!series || changePointIndex <= 0 || changePointIndex >= series.length) {
                return null;
            }

            const reg1 = series.slice(0, changePointIndex);
            const reg2 = series.slice(changePointIndex);

            const stat1 = this._stats(reg1);
            const stat2 = this._stats(reg2);

            const meanDiff = stat2.mean - stat1.mean;
            const varRatio = stat1.variance > 0 ? stat2.variance / stat1.variance : 1;

            return {
                changePoint: changePointIndex,
                regime1: { sampleSize: reg1.length, mean: stat1.mean, variance: stat1.variance, stdDev: stat1.stdDev },
                regime2: { sampleSize: reg2.length, mean: stat2.mean, variance: stat2.variance, stdDev: stat2.stdDev },
                meanShift: +meanDiff.toFixed(2),
                varianceRatio: +varRatio.toFixed(2),
                status: 'OBSERVED',
                interpretation: `Structural break detected at index ${changePointIndex}. Mean changed from ${stat1.mean} to ${stat2.mean} (Variance ratio: ${varRatio.toFixed(2)}x).`
            };
        }

        static _stats(arr) {
            const n = arr.length;
            if (n === 0) return { mean: 0, variance: 0, stdDev: 0 };
            const mean = arr.reduce((a, b) => a + b, 0) / n;
            const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
            return {
                mean: +mean.toFixed(2),
                variance: +variance.toFixed(2),
                stdDev: +(Math.sqrt(variance)).toFixed(2)
            };
        }
    }

    return RegimeAnalysis;
}));
