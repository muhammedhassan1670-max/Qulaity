/**
 * UDIP Deep Intelligence Evolution vNext
 * ChangePointAnalysis - Structural Breaks in Mean & Variance (>= 1.5 sigma)
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.ChangePointAnalysis = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class ChangePointAnalysis {
        static detect(series, minWindow = 10, thresholdSigma = 1.5) {
            if (!series || series.length < minWindow * 2) {
                return [];
            }

            const n = series.length;
            const changePoints = [];

            // Sliding split-window test
            for (let t = minWindow; t <= n - minWindow; t++) {
                const w1 = series.slice(t - minWindow, t);
                const w2 = series.slice(t, t + minWindow);

                const m1 = w1.reduce((a, b) => a + b, 0) / w1.length;
                const m2 = w2.reduce((a, b) => a + b, 0) / w2.length;
                const s1 = Math.sqrt(w1.reduce((a, b) => a + Math.pow(b - m1, 2), 0) / w1.length) || 1e-4;

                const diff = Math.abs(m2 - m1);
                const sigmaShift = diff / s1;

                if (sigmaShift >= thresholdSigma) {
                    changePoints.push({
                        index: t,
                        shiftMagnitude: +sigmaShift.toFixed(2),
                        shiftMagnitudeSigma: +sigmaShift.toFixed(2),
                        meanBefore: +m1.toFixed(2),
                        meanAfter: +m2.toFixed(2),
                        type: 'PERSISTENT_LEVEL_SHIFT',
                        status: 'OBSERVED',
                        evidence: [`Mean shifted from ${m1.toFixed(2)} to ${m2.toFixed(2)} (${sigmaShift.toFixed(1)}σ jump).`]
                    });
                    // Advance window to avoid duplicate nearby detections
                    t += minWindow - 1;
                }
            }

            return changePoints;
        }
    }

    return ChangePointAnalysis;
}));
