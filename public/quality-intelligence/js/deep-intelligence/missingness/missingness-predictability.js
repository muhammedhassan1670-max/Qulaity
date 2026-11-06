/**
 * UDIP Deep Intelligence Evolution vNext
 * MissingnessPredictability - Tests if missingness is predictable by other observed features
 * Distinguishes Missing At Random (MAR) from Missing Completely At Random (MCAR).
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.MissingnessPredictability = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class MissingnessPredictability {
        static testPredictability(dataset, targetCol) {
            if (!dataset || !dataset.rows || dataset.rows.length < 20) {
                return { isPredictable: false, topPredictor: null, correlation: 0 };
            }

            const rows = dataset.rows;
            const isMissing = (val) => val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val));

            // Missingness binary target
            const missingTarget = rows.map(r => isMissing(r[targetCol]) ? 1 : 0);
            const missingCount = missingTarget.reduce((a, b) => a + b, 0);

            // Must have both missing and non-missing
            if (missingCount < 3 || missingCount > rows.length - 3) {
                return { isPredictable: false, topPredictor: null, correlation: 0 };
            }

            let bestPredictor = null;
            let maxCorr = 0;

            dataset.columns.forEach(col => {
                if (col === targetCol) return;
                const numVals = rows.map(r => +r[col]);
                const validPairs = [];

                for (let i = 0; i < rows.length; i++) {
                    if (!isNaN(numVals[i])) {
                        validPairs.push({ x: numVals[i], y: missingTarget[i] });
                    }
                }

                if (validPairs.length >= 15) {
                    const r = Math.abs(this._pointBiserial(validPairs.map(p => p.x), validPairs.map(p => p.y)));
                    if (r > maxCorr) {
                        maxCorr = r;
                        bestPredictor = col;
                    }
                }
            });

            const isPredictable = maxCorr >= 0.25;

            return {
                targetColumn: targetCol,
                isPredictable: isPredictable,
                topPredictor: bestPredictor,
                correlation: +maxCorr.toFixed(4),
                suggestedMechanism: isPredictable ? 'MAR_CANDIDATE' : 'MCAR_CANDIDATE',
                status: isPredictable ? 'OBSERVED' : 'POSSIBLE'
            };
        }

        static _pointBiserial(xVals, yBinary) {
            const n = xVals.length;
            const n1 = yBinary.reduce((a, b) => a + b, 0);
            const n0 = n - n1;
            if (n0 === 0 || n1 === 0) return 0;

            let sum1 = 0, sum0 = 0;
            for (let i = 0; i < n; i++) {
                if (yBinary[i] === 1) sum1 += xVals[i];
                else sum0 += xVals[i];
            }
            const m1 = sum1 / n1;
            const m0 = sum0 / n0;

            let meanAll = (sum1 + sum0) / n;
            let ss = 0;
            for (let i = 0; i < n; i++) ss += Math.pow(xVals[i] - meanAll, 2);
            const sAll = Math.sqrt(ss / n) || 1e-6;

            return ((m1 - m0) / sAll) * Math.sqrt((n1 * n0) / (n * n));
        }
    }

    return MissingnessPredictability;
}));
