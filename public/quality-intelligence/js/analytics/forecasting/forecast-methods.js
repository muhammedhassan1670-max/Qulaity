/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/forecasting/forecast-methods.js
 * ============================================================================
 * Baseline time-series forecasting algorithms:
 * 1. Naive Forecast (Random walk persistence)
 * 2. Moving Average (Rolling window mean)
 * 3. Simple Exponential Smoothing (SES with parameter search)
 * 4. Linear Trend Extrapolation (OLS on time index)
 * Completely browser-native, pure JavaScript, zero external dependencies.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ForecastMethods = {
        /**
         * Naive Forecast (last known value carried forward)
         * 
         * @param {Array<number>} train 
         * @param {number} horizon Steps ahead
         * @returns {Array<number>}
         */
        naive(train, horizon = 5) {
            if (!Array.isArray(train) || train.length === 0) return [];
            const last = train[train.length - 1];
            return Array(horizon).fill(last);
        },

        /**
         * Moving Average Forecast
         * 
         * @param {Array<number>} train 
         * @param {number} horizon 
         * @param {number} [windowSize] 
         * @returns {Array<number>}
         */
        movingAverage(train, horizon = 5, windowSize = null) {
            if (!Array.isArray(train) || train.length === 0) return [];
            const k = windowSize || Math.max(2, Math.min(5, Math.floor(train.length / 3)));
            const slice = train.slice(-k);
            const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
            return Array(horizon).fill(Number(mean.toFixed(4)));
        },

        /**
         * Simple Exponential Smoothing (SES)
         * 
         * @param {Array<number>} train 
         * @param {number} horizon 
         * @param {number} [alpha] Optional smoothing parameter (0 < alpha < 1)
         * @returns {{ forecasts: Array<number>, fitted: Array<number>, alpha: number }}
         */
        exponentialSmoothing(train, horizon = 5, alpha = null) {
            if (!Array.isArray(train) || train.length === 0) {
                return { forecasts: [], fitted: [], alpha: 0.3 };
            }

            const n = train.length;
            if (n === 1) {
                return { forecasts: Array(horizon).fill(train[0]), fitted: [train[0]], alpha: 0.3 };
            }

            // If alpha not provided, grid search alpha in [0.1, 0.9] to minimize MSE
            let bestAlpha = alpha !== null ? alpha : 0.3;
            if (alpha === null) {
                let minMse = Infinity;
                const candidates = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
                candidates.forEach(a => {
                    let level = train[0];
                    let sse = 0;
                    for (let i = 1; i < n; i++) {
                        const err = train[i] - level;
                        sse += err * err;
                        level = a * train[i] + (1 - a) * level;
                    }
                    const mse = sse / (n - 1);
                    if (mse < minMse) {
                        minMse = mse;
                        bestAlpha = a;
                    }
                });
            }

            // Run SES with bestAlpha
            const fitted = [train[0]];
            let level = train[0];
            for (let i = 1; i < n; i++) {
                fitted.push(Number(level.toFixed(4)));
                level = bestAlpha * train[i] + (1 - bestAlpha) * level;
            }

            const forecasts = Array(horizon).fill(Number(level.toFixed(4)));

            return {
                forecasts,
                fitted,
                alpha: bestAlpha
            };
        },

        /**
         * Linear Trend Extrapolation
         * 
         * @param {Array<number>} train 
         * @param {number} horizon 
         * @returns {{ forecasts: Array<number>, slope: number, intercept: number }}
         */
        linearTrend(train, horizon = 5) {
            if (!Array.isArray(train) || train.length === 0) {
                return { forecasts: [], slope: 0, intercept: 0 };
            }

            const n = train.length;
            if (n === 1) {
                return { forecasts: Array(horizon).fill(train[0]), slope: 0, intercept: train[0] };
            }

            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
            for (let i = 0; i < n; i++) {
                sumX += i;
                sumY += train[i];
                sumXY += i * train[i];
                sumX2 += i * i;
            }

            const denom = n * sumX2 - sumX * sumX;
            const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
            const intercept = (sumY - slope * sumX) / n;

            const forecasts = [];
            for (let h = 0; h < horizon; h++) {
                const pred = intercept + slope * (n + h);
                forecasts.push(Number(pred.toFixed(4)));
            }

            return {
                forecasts,
                slope: Number(slope.toFixed(4)),
                intercept: Number(intercept.toFixed(4))
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.ForecastMethods = ForecastMethods;

})(typeof window !== 'undefined' ? window : global);
