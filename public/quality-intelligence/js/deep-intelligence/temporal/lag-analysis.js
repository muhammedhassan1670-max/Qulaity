/**
 * UDIP Deep Intelligence Evolution vNext
 * LagAnalysis - Cross-Lagged Dependency Discovery: X(t-k) -> Y(t)
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.LagAnalysis = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class LagAnalysis {
        static analyze(seriesX, seriesY, maxLag = 3) {
            if (!seriesX || !seriesY || seriesX.length < maxLag + 10 || seriesX.length !== seriesY.length) {
                return [];
            }

            const n = seriesX.length;
            const results = [];

            for (let k = 1; k <= maxLag; k++) {
                const xLag = [];
                const yCurr = [];

                for (let i = k; i < n; i++) {
                    xLag.push(seriesX[i - k]);
                    yCurr.push(seriesY[i]);
                }

                const r = this._corr(xLag, yCurr);
                const bound = 1.96 / Math.sqrt(xLag.length);

                if (Math.abs(r) >= 0.30 && Math.abs(r) > bound) {
                    results.push({
                        lag: k,
                        crossCorrelation: +r.toFixed(4),
                        significant: true,
                        confidenceThreshold: +bound.toFixed(4),
                        status: 'OBSERVED',
                        interpretation: `X at t-${k} displays correlation r=${r.toFixed(2)} with Y at t (predictive temporal dependency).`
                    });
                }
            }

            return results;
        }

        static _corr(a, b) {
            let sA = 0, sB = 0;
            const n = a.length;
            for (let i = 0; i < n; i++) { sA += a[i]; sB += b[i]; }
            const mA = sA / n, mB = sB / n;
            let num = 0, dA = 0, dB = 0;
            for (let i = 0; i < n; i++) {
                const da = a[i] - mA;
                const db = b[i] - mB;
                num += da * db;
                dA += da * da;
                dB += db * db;
            }
            return (dA * dB > 0) ? num / Math.sqrt(dA * dB) : 0;
        }
    }

    return LagAnalysis;
}));
