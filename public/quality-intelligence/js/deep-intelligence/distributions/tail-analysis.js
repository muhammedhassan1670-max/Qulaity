/**
 * UDIP Deep Intelligence Evolution vNext
 * TailAnalysis - Heavy Tail Index & Extreme Concentration Analysis
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.TailAnalysis = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class TailAnalysis {
        static analyze(vals) {
            if (!vals || vals.length < 20) {
                return { isHeavyTailed: false, tailRatio: 0, kurtosis: 0 };
            }

            const clean = vals.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
            const n = clean.length;
            if (n < 20) return { isHeavyTailed: false, tailRatio: 0, kurtosis: 0 };

            const q95Idx = Math.floor(n * 0.95);
            const q99Idx = Math.floor(n * 0.99);
            const q50Idx = Math.floor(n * 0.50);

            const median = clean[q50Idx];
            const p95 = clean[q95Idx];
            const p99 = clean[q99Idx];

            // Ratio of top 1% gap to top 5% gap
            const gap95 = Math.abs(p95 - median) || 1e-4;
            const gap99 = Math.abs(p99 - median);
            const tailRatio = +(gap99 / gap95).toFixed(2);

            // Concentration: proportion of total sum held by top 1%
            let sumTotal = 0;
            for (let i = 0; i < n; i++) sumTotal += Math.abs(clean[i]);
            let sumTop1 = 0;
            for (let i = q99Idx; i < n; i++) sumTop1 += Math.abs(clean[i]);
            const top1PctConcentration = sumTotal > 0 ? +(sumTop1 / sumTotal).toFixed(3) : 0;

            const isHeavyTailed = tailRatio >= 2.0 || top1PctConcentration >= 0.20;

            return {
                isHeavyTailed: isHeavyTailed,
                tailRatio: tailRatio,
                top1PctConcentration: top1PctConcentration,
                p95: p95,
                p99: p99,
                median: median,
                status: isHeavyTailed ? 'OBSERVED' : 'UNKNOWN',
                evidence: isHeavyTailed
                    ? [`Heavy right tail: Top 1% accounts for ${(top1PctConcentration * 100).toFixed(1)}% of cumulative absolute magnitude.`]
                    : ['Standard exponential/sub-Gaussian tail profile.']
            };
        }
    }

    return TailAnalysis;
}));
