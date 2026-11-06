/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/exploratory/seasonality-analysis.js
 * ============================================================================
 * Evaluates periodic seasonal patterns across temporal data:
 * - Checks weekly, monthly, quarterly autocorrelation lags
 * - Enforces strict sample-size thresholds to avoid false positives
 * Domain-agnostic & math-safe.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const SeasonalityAnalysis = {
        /**
         * Detect potential seasonality in a time series
         * 
         * @param {Array<Object>} rows Dataset rows
         * @param {string} timeCol Timestamp column
         * @param {string} numCol Target numeric column
         * @returns {Object} Seasonality evaluation
         */
        analyze(rows, timeCol, numCol) {
            const emptyResult = {
                timeColumn: timeCol,
                numericColumn: numCol,
                detected: false,
                period: null,
                strength: 0,
                confidence: 0,
                reason: 'Insufficient temporal history'
            };

            if (!Array.isArray(rows) || rows.length < 14 || !timeCol || !numCol) {
                return {
                    ...emptyResult,
                    reason: `Requires at least 14 sequential observations (got ${Array.isArray(rows) ? rows.length : 0})`
                };
            }

            // Extract and sort values
            const pairs = [];
            rows.forEach(r => {
                if (!r) return;
                const t = Date.parse(r[timeCol]);
                const v = Number(r[numCol]);
                if (!isNaN(t) && Number.isFinite(v)) {
                    pairs.push({ t, v });
                }
            });

            if (pairs.length < 14) {
                return {
                    ...emptyResult,
                    reason: `Requires at least 14 valid chronological pairs (found ${pairs.length})`
                };
            }

            pairs.sort((a, b) => a.t - b.t);
            const series = pairs.map(p => p.v);
            const n = series.length;

            // Compute mean and variance
            const mean = series.reduce((a, b) => a + b, 0) / n;
            let variance = 0;
            series.forEach(v => { variance += (v - mean) * (v - mean); });
            variance = variance / n;

            if (variance < 1e-8) {
                return {
                    ...emptyResult,
                    reason: 'Series has zero or near-zero variance'
                };
            }

            // Test standard candidate lags: 7 (weekly), 4 (quarterly), 12 (monthly)
            const candidateLags = [
                { lag: 7, period: 'weekly', minPoints: 21 },
                { lag: 12, period: 'monthly', minPoints: 36 },
                { lag: 4, period: 'quarterly', minPoints: 16 }
            ];

            let bestLag = null;
            let maxAutocorr = -1;

            candidateLags.forEach(cand => {
                if (n >= cand.minPoints) {
                    const r_k = this._autocorrelation(series, cand.lag, mean, variance);
                    if (r_k > maxAutocorr) {
                        maxAutocorr = r_k;
                        bestLag = cand;
                    }
                }
            });

            // Significance threshold for autocorrelation: ~ 2 / sqrt(n)
            const significanceThreshold = Math.max(0.35, 2 / Math.sqrt(n));

            if (bestLag && maxAutocorr >= significanceThreshold) {
                const strength = Math.round(Math.min(100, Math.max(0, maxAutocorr * 100)));
                const confidence = Math.min(90, Math.round(50 + strength * 0.4));

                return {
                    timeColumn: timeCol,
                    numericColumn: numCol,
                    detected: true,
                    period: bestLag.period,
                    lag: bestLag.lag,
                    autocorrelation: Number(maxAutocorr.toFixed(3)),
                    strength,
                    confidence,
                    reason: `Statistically significant periodicity detected at lag ${bestLag.lag} (${bestLag.period} cycle) with autocorrelation = ${maxAutocorr.toFixed(3)}.`
                };
            }

            return {
                timeColumn: timeCol,
                numericColumn: numCol,
                detected: false,
                period: null,
                strength: Math.round(Math.max(0, maxAutocorr * 100)),
                confidence: 40,
                reason: `No dominant cyclical pattern detected above significance threshold (${significanceThreshold.toFixed(2)}).`
            };
        },

        /**
         * Calculate sample autocorrelation at given lag
         * @private
         */
        _autocorrelation(series, lag, mean, variance) {
            const n = series.length;
            if (lag >= n || variance <= 0) return 0;

            let sum = 0;
            for (let i = 0; i < n - lag; i++) {
                sum += (series[i] - mean) * (series[i + lag] - mean);
            }
            return (sum / (n * variance));
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.SeasonalityAnalysis = SeasonalityAnalysis;

})(typeof window !== 'undefined' ? window : global);
