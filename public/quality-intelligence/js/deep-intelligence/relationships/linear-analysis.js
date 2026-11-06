/**
 * UDIP Deep Intelligence Evolution vNext
 * LinearAnalysis - Pearson Correlation & Confidence Bounds
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.LinearAnalysis = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class LinearAnalysis {
        static compute(xVals, yVals) {
            if (!xVals || !yVals || xVals.length < 3 || xVals.length !== yVals.length) {
                return { r: 0, r2: 0, n: 0, pValue: 1, standardError: 0, confidenceInterval: [0, 0] };
            }

            const n = xVals.length;
            let sumX = 0, sumY = 0;
            for (let i = 0; i < n; i++) {
                sumX += xVals[i];
                sumY += yVals[i];
            }
            const meanX = sumX / n;
            const meanY = sumY / n;

            let num = 0, denX = 0, denY = 0;
            for (let i = 0; i < n; i++) {
                const dx = xVals[i] - meanX;
                const dy = yVals[i] - meanY;
                num += dx * dy;
                denX += dx * dx;
                denY += dy * dy;
            }

            const denom = Math.sqrt(denX * denY);
            let r = denom === 0 ? 0 : num / denom;
            r = Math.max(-1, Math.min(1, r));

            const r2 = +(r * r).toFixed(4);
            const se = n > 2 ? Math.sqrt((1 - r2) / (n - 2)) : 0;

            // Fisher z-transformation for 95% confidence interval
            let ciLower = r, ciUpper = r;
            if (n > 3 && Math.abs(r) < 0.999) {
                const z = 0.5 * Math.log((1 + r) / (1 - r));
                const zSe = 1 / Math.sqrt(n - 3);
                const zLow = z - 1.96 * zSe;
                const zHigh = z + 1.96 * zSe;
                ciLower = (Math.exp(2 * zLow) - 1) / (Math.exp(2 * zLow) + 1);
                ciUpper = (Math.exp(2 * zHigh) - 1) / (Math.exp(2 * zHigh) + 1);
            }

            // Approximate two-tailed t-test p-value
            let pValue = 1.0;
            if (n > 2 && Math.abs(r) < 1.0) {
                const t = Math.abs(r) * Math.sqrt((n - 2) / Math.max(1e-9, 1 - r * r));
                // Normal approximation for p-value when df is reasonable
                pValue = +(2 * (1 - this._approxNormalCdf(t))).toFixed(5);
            } else if (Math.abs(r) === 1.0) {
                pValue = 0.0;
            }

            return {
                r: +r.toFixed(4),
                r2: r2,
                n: n,
                standardError: +se.toFixed(4),
                confidenceInterval: [+ciLower.toFixed(4), +ciUpper.toFixed(4)],
                pValue: Math.max(0, Math.min(1, pValue)),
                isSignificant: pValue < 0.05
            };
        }

        static analyze(xVals, yVals) {
            const res = this.compute(xVals, yVals);
            return {
                ...res,
                pearson: res.r,
                rSquared: res.r2,
                significant: res.isSignificant,
                confidenceInterval: {
                    ciLower: res.confidenceInterval[0],
                    ciUpper: res.confidenceInterval[1]
                }
            };
        }

        static _approxNormalCdf(x) {
            const t = 1 / (1 + 0.2316419 * Math.abs(x));
            const d = 0.3989423 * Math.exp(-x * x / 2);
            const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
            return x > 0 ? 1 - prob : prob;
        }
    }

    return LinearAnalysis;
}));
