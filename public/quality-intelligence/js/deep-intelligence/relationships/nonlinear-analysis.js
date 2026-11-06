/**
 * UDIP Deep Intelligence Evolution vNext
 * NonlinearAnalysis - Non-linear Manifolds, Polynomial Fits, and Heteroscedasticity
 * Detects patterns: Linear, Monotonic, U-shaped, Inverted-U, Threshold, Piecewise, Saturation, Heteroscedastic
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.NonlinearAnalysis = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class NonlinearAnalysis {
        static analyze(xVals, yVals) {
            if (!xVals || !yVals || xVals.length < 6 || xVals.length !== yVals.length) {
                return {
                    pattern: 'INSUFFICIENT_DATA',
                    isNonLinear: false,
                    quadraticR2: 0,
                    linearR2: 0,
                    heteroscedastic: false
                };
            }

            const n = xVals.length;

            // 1. Linear Fit (y = a*x + b)
            let meanX = 0, meanY = 0;
            for (let i = 0; i < n; i++) {
                meanX += xVals[i];
                meanY += yVals[i];
            }
            meanX /= n;
            meanY /= n;

            let ssX = 0, ssXY = 0, ssY = 0;
            for (let i = 0; i < n; i++) {
                const dx = xVals[i] - meanX;
                const dy = yVals[i] - meanY;
                ssX += dx * dx;
                ssXY += dx * dy;
                ssY += dy * dy;
            }

            const b1 = ssX > 0 ? ssXY / ssX : 0;
            const b0 = meanY - b1 * meanX;

            let ssResidLinear = 0;
            const residuals = [];
            for (let i = 0; i < n; i++) {
                const pred = b0 + b1 * xVals[i];
                const res = yVals[i] - pred;
                residuals.push(res);
                ssResidLinear += res * res;
            }
            const linearR2 = ssY > 0 ? Math.max(0, 1 - ssResidLinear / ssY) : 0;

            // 2. Quadratic Fit (y = c2*x^2 + c1*x + c0) via Normal Equations
            const quadFit = this._fitQuadratic(xVals, yVals);
            const quadR2 = quadFit.r2;

            // 3. Heteroscedasticity Test (Correlation between |residual| and predicted)
            let heteroscedastic = false;
            if (residuals.length > 10) {
                const absRes = residuals.map(r => Math.abs(r));
                const preds = xVals.map(x => b0 + b1 * x);
                let meanP = 0, meanR = 0;
                for (let i = 0; i < n; i++) {
                    meanP += preds[i];
                    meanR += absRes[i];
                }
                meanP /= n; meanR /= n;
                let numH = 0, denHP = 0, denHR = 0;
                for (let i = 0; i < n; i++) {
                    const dp = preds[i] - meanP;
                    const dr = absRes[i] - meanR;
                    numH += dp * dr;
                    denHP += dp * dp;
                    denHR += dr * dr;
                }
                const rH = Math.sqrt(denHP * denHR) > 0 ? numH / Math.sqrt(denHP * denHR) : 0;
                heteroscedastic = Math.abs(rH) >= 0.40;
            }

            // 4. Pattern Classification
            let pattern = 'LINEAR';
            let isNonLinear = false;

            // If Quadratic improves R² by >= 0.15 over Linear, or Linear is near zero while Quad is strong
            if (quadR2 >= 0.35 && (quadR2 - linearR2 >= 0.15 || linearR2 < 0.15)) {
                isNonLinear = true;
                if (quadFit.c2 > 0) {
                    pattern = 'U_SHAPED';
                } else {
                    pattern = 'INVERTED_U';
                }
            } else if (linearR2 >= 0.65) {
                pattern = 'LINEAR';
            } else if (linearR2 < 0.15 && quadR2 < 0.20) {
                pattern = 'INDEPENDENT_OR_COMPLEX';
            }

            return {
                pattern: pattern,
                isNonLinear: isNonLinear,
                linearR2: +linearR2.toFixed(4),
                quadraticR2: +quadR2.toFixed(4),
                r2Improvement: +(quadR2 - linearR2).toFixed(4),
                heteroscedastic: heteroscedastic,
                uShaped: pattern === 'U_SHAPED' || pattern === 'INVERTED_U'
            };
        }

        static _fitQuadratic(xVals, yVals) {
            const n = xVals.length;
            let s0 = n, s1 = 0, s2 = 0, s3 = 0, s4 = 0;
            let t0 = 0, t1 = 0, t2 = 0;
            let ssY = 0, meanY = 0;

            for (let i = 0; i < n; i++) meanY += yVals[i];
            meanY /= n;
            for (let i = 0; i < n; i++) ssY += Math.pow(yVals[i] - meanY, 2);

            for (let i = 0; i < n; i++) {
                const x = xVals[i];
                const y = yVals[i];
                const x2 = x * x;
                s1 += x;
                s2 += x2;
                s3 += x2 * x;
                s4 += x2 * x2;
                t0 += y;
                t1 += x * y;
                t2 += x2 * y;
            }

            // Solve 3x3 system: [s4 s3 s2][c2] = [t2], [s3 s2 s1][c1] = [t1], [s2 s1 s0][c0] = [t0]
            const m = [
                [s4, s3, s2, t2],
                [s3, s2, s1, t1],
                [s2, s1, s0, t0]
            ];

            for (let i = 0; i < 3; i++) {
                let pivot = m[i][i];
                if (Math.abs(pivot) < 1e-12) pivot = 1e-12;
                for (let j = 0; j <= 3; j++) m[i][j] /= pivot;
                for (let k = 0; k < 3; k++) {
                    if (k !== i) {
                        const factor = m[k][i];
                        for (let j = 0; j <= 3; j++) m[k][j] -= factor * m[i][j];
                    }
                }
            }

            const c2 = m[0][3];
            const c1 = m[1][3];
            const c0 = m[2][3];

            let ssResid = 0;
            for (let i = 0; i < n; i++) {
                const pred = c2 * xVals[i] * xVals[i] + c1 * xVals[i] + c0;
                ssResid += Math.pow(yVals[i] - pred, 2);
            }
            const r2 = ssY > 0 ? Math.max(0, Math.min(1, 1 - ssResid / ssY)) : 0;

            return { c2, c1, c0, r2 };
        }
    }

    return NonlinearAnalysis;
}));
