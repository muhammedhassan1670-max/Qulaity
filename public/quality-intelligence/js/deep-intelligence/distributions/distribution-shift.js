/**
 * UDIP Deep Intelligence Evolution vNext
 * DistributionShift - Kolmogorov-Smirnov Distance & Distributional Divergence
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.DistributionShift = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class DistributionShift {
        static computeKsDistance(sample1, sample2) {
            if (!sample1 || !sample2 || sample1.length < 5 || sample2.length < 5) {
                return { ksStatistic: 0, hasShifted: false };
            }

            const s1 = sample1.filter(v => !isNaN(v)).sort((a, b) => a - b);
            const s2 = sample2.filter(v => !isNaN(v)).sort((a, b) => a - b);
            const n1 = s1.length;
            const n2 = s2.length;

            let i = 0, j = 0;
            let maxDiff = 0;

            while (i < n1 && j < n2) {
                const val = Math.min(s1[i], s2[j]);
                while (i < n1 && s1[i] <= val) i++;
                while (j < n2 && s2[j] <= val) j++;

                const cdf1 = i / n1;
                const cdf2 = j / n2;
                const diff = Math.abs(cdf1 - cdf2);
                if (diff > maxDiff) maxDiff = diff;
            }

            const criticalVal = 1.36 * Math.sqrt((n1 + n2) / (n1 * n2));
            const hasShifted = maxDiff > criticalVal;

            return {
                ksStatistic: +maxDiff.toFixed(4),
                criticalThreshold: +criticalVal.toFixed(4),
                hasShifted: hasShifted,
                status: hasShifted ? 'OBSERVED' : 'STABLE'
            };
        }
    }

    return DistributionShift;
}));
