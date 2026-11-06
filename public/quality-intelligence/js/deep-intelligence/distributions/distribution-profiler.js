/**
 * UDIP Deep Intelligence Evolution vNext
 * DistributionProfiler - Statistical Moments, Skewness, Kurtosis & Boundedness
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.DistributionProfiler = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class DistributionProfiler {
        static profile(vals) {
            if (!vals || vals.length < 3) {
                return null;
            }

            const clean = vals.filter(v => typeof v === 'number' && !isNaN(v));
            const n = clean.length;
            if (n < 3) return null;

            const min = Math.min(...clean);
            const max = Math.max(...clean);
            const mean = clean.reduce((a, b) => a + b, 0) / n;

            let m2 = 0, m3 = 0, m4 = 0;
            for (let i = 0; i < n; i++) {
                const diff = clean[i] - mean;
                const d2 = diff * diff;
                m2 += d2;
                m3 += d2 * diff;
                m4 += d2 * d2;
            }

            m2 /= n;
            m3 /= n;
            m4 /= n;

            const stdDev = Math.sqrt(m2) || 1e-6;
            const skewness = +(m3 / Math.pow(stdDev, 3)).toFixed(3);
            const excessKurtosis = +(m4 / Math.pow(stdDev, 4) - 3).toFixed(3);

            let symmetry = 'SYMMETRIC';
            if (skewness > 1.0) symmetry = 'STRONGLY_RIGHT_SKEWED';
            else if (skewness > 0.5) symmetry = 'MODERATELY_RIGHT_SKEWED';
            else if (skewness < -1.0) symmetry = 'STRONGLY_LEFT_SKEWED';
            else if (skewness < -0.5) symmetry = 'MODERATELY_LEFT_SKEWED';

            const isNonNegative = min >= 0;
            const isBounded01 = min >= 0 && max <= 1;

            return {
                sampleSize: n,
                min: min,
                max: max,
                mean: +mean.toFixed(3),
                stdDev: +stdDev.toFixed(3),
                skewness: skewness,
                excessKurtosis: excessKurtosis,
                symmetry: symmetry,
                isNonNegative: isNonNegative,
                isBounded01: isBounded01,
                status: 'OBSERVED',
                explanation: `Variable is ${symmetry.toLowerCase().replace(/_/g, ' ')} (Skewness: ${skewness}, Excess Kurtosis: ${excessKurtosis}).`
            };
        }
    }

    return DistributionProfiler;
}));
