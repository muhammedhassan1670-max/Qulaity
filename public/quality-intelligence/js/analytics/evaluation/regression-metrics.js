/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/evaluation/regression-metrics.js
 * ============================================================================
 * Computes standard regression performance metrics:
 * MAE, MSE, RMSE, R², MAPE (with zero-division protection).
 * Guarantees NO NaN, NO Infinity, and NO undefined outputs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const RegressionMetrics = {
        /**
         * Compute all regression metrics between actual and predicted arrays
         * 
         * @param {Array<number>} actual 
         * @param {Array<number>} predicted 
         * @returns {{ mae: number, mse: number, rmse: number, r2: number, mape: number, n: number }}
         */
        calculate(actual, predicted) {
            const emptyResult = { mae: 0, mse: 0, rmse: 0, r2: 0, mape: 0, n: 0 };
            if (!Array.isArray(actual) || !Array.isArray(predicted) || actual.length === 0 || predicted.length === 0) {
                return emptyResult;
            }

            const validPairs = [];
            const n = Math.min(actual.length, predicted.length);
            for (let i = 0; i < n; i++) {
                const a = Number(actual[i]);
                const p = Number(predicted[i]);
                if (Number.isFinite(a) && Number.isFinite(p)) {
                    validPairs.push({ a, p });
                }
            }

            const count = validPairs.length;
            if (count === 0) return emptyResult;

            let sumAbsErr = 0;
            let sumSqErr = 0;
            let sumActual = 0;
            let sumApe = 0;
            let nonZeroActualCount = 0;

            for (let i = 0; i < count; i++) {
                const diff = validPairs[i].a - validPairs[i].p;
                sumAbsErr += Math.abs(diff);
                sumSqErr += diff * diff;
                sumActual += validPairs[i].a;

                const absActual = Math.abs(validPairs[i].a);
                if (absActual > 1e-9) {
                    sumApe += Math.abs(diff) / absActual;
                    nonZeroActualCount++;
                }
            }

            const mae = sumAbsErr / count;
            const mse = sumSqErr / count;
            const rmse = Math.sqrt(mse);
            const meanActual = sumActual / count;

            let ssTot = 0;
            for (let i = 0; i < count; i++) {
                const dev = validPairs[i].a - meanActual;
                ssTot += dev * dev;
            }

            // R² calculation (capped reasonably to [-10, 1] to prevent runaway negative infinities)
            let r2 = 0;
            if (ssTot > 1e-9) {
                r2 = 1 - (sumSqErr / ssTot);
                if (!Number.isFinite(r2)) r2 = 0;
                if (r2 < -10) r2 = -10;
            } else if (sumSqErr < 1e-9) {
                // Constant actual and constant prediction match
                r2 = 1.0;
            } else {
                r2 = 0.0;
            }

            // MAPE calculation (safe handling of zeroes)
            const mape = nonZeroActualCount > 0 ? (sumApe / nonZeroActualCount) * 100 : 0;

            return {
                mae: Number(mae.toFixed(4)),
                mse: Number(mse.toFixed(4)),
                rmse: Number(rmse.toFixed(4)),
                r2: Number(r2.toFixed(4)),
                mape: Number(mape.toFixed(2)),
                n: count
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.RegressionMetrics = RegressionMetrics;

})(typeof window !== 'undefined' ? window : global);
