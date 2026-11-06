/**
 * UDIP Deep Intelligence Evolution vNext
 * ZeroInflation - Hurdle & Two-Part Model Detection
 * Identifies variables with excessive zero frequency requiring hurdle/two-part models.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.ZeroInflation = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class ZeroInflation {
        static analyze(vals) {
            if (!vals || vals.length < 10) {
                return { isZeroInflated: false, zeroFraction: 0 };
            }

            const clean = vals.filter(v => typeof v === 'number' && !isNaN(v));
            if (clean.length < 10) return { isZeroInflated: false, zeroFraction: 0 };

            let zeroCount = 0;
            for (let i = 0; i < clean.length; i++) {
                if (clean[i] === 0) zeroCount++;
            }

            const zeroFraction = +(zeroCount / clean.length).toFixed(3);
            // Zero-inflated if zeros represent >= 30% of distribution
            const isZeroInflated = zeroFraction >= 0.30;

            return {
                isZeroInflated: isZeroInflated,
                zeroCount: zeroCount,
                sampleSize: clean.length,
                zeroFraction: zeroFraction,
                status: isZeroInflated ? 'OBSERVED' : 'UNKNOWN',
                recommendation: isZeroInflated ? 'RECOMMEND_HURDLE_OR_TWO_PART_MODEL' : 'STANDARD_REGRESSION',
                evidence: isZeroInflated
                    ? [`Exact zeros account for ${(zeroFraction * 100).toFixed(1)}% of values, indicating a distinct hurdle generation process.`]
                    : ['No significant zero-inflation mass observed.']
            };
        }
    }

    return ZeroInflation;
}));
