/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/anomaly/anomaly-detectors.js
 * ============================================================================
 * Implements multi-method anomaly detection algorithms:
 * 1. Tukey IQR Bounds (Non-parametric quartile thresholds)
 * 2. Standard Z-Score (|z| > 3.0, parametric threshold)
 * 3. Modified Z-Score (Iglewicz & Hoaglin MAD-based, robust against outliers)
 * Completely domain-agnostic, zero division safety.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const AnomalyDetectors = {
        /**
         * Detect anomalies using Tukey IQR method
         * 
         * @param {Array<number>} values 
         * @param {number} [multiplier=1.5] 
         * @returns {Object}
         */
        detectIqr(values, multiplier = 1.5) {
            const empty = { method: 'iqr', anomalies: [], count: 0, percentage: 0, threshold: multiplier };
            if (!Array.isArray(values) || values.length < 4) return empty;

            const PUtils = window.UDIP && window.UDIP.ProfilerUtils;
            const valid = values.filter(v => Number.isFinite(v));
            if (valid.length < 4) return empty;

            const sorted = [...valid].sort((a, b) => a - b);
            const quartiles = PUtils ? PUtils.quartiles(sorted) : { q1: sorted[Math.floor(sorted.length * 0.25)], q3: sorted[Math.floor(sorted.length * 0.75)], iqr: 0 };
            const iqr = quartiles.iqr;

            if (iqr <= 1e-9) return { ...empty, note: 'Zero IQR (highly concentrated distribution)' };

            const lower = quartiles.q1 - multiplier * iqr;
            const upper = quartiles.q3 + multiplier * iqr;

            const anomalies = [];
            values.forEach((v, idx) => {
                if (Number.isFinite(v) && (v < lower || v > upper)) {
                    anomalies.push({
                        index: idx,
                        value: v,
                        score: Number((Math.abs(v < lower ? lower - v : v - upper) / iqr).toFixed(2))
                    });
                }
            });

            return {
                method: 'iqr',
                threshold: multiplier,
                lowerBound: Number(lower.toFixed(4)),
                upperBound: Number(upper.toFixed(4)),
                anomalies,
                count: anomalies.length,
                percentage: Number(((anomalies.length / valid.length) * 100).toFixed(2))
            };
        },

        /**
         * Detect anomalies using Standard Z-Score (|z| > 3.0)
         * 
         * @param {Array<number>} values 
         * @param {number} [threshold=3.0] 
         * @returns {Object}
         */
        detectZScore(values, threshold = 3.0) {
            const empty = { method: 'z_score', anomalies: [], count: 0, percentage: 0, threshold };
            if (!Array.isArray(values) || values.length < 4) return empty;

            const valid = values.filter(v => Number.isFinite(v));
            const n = valid.length;
            if (n < 4) return empty;

            const mean = valid.reduce((a, b) => a + b, 0) / n;
            let variance = 0;
            valid.forEach(v => { variance += (v - mean) * (v - mean); });
            const stdDev = Math.sqrt(variance / (n - 1));

            if (stdDev <= 1e-9) return { ...empty, note: 'Zero variance' };

            const anomalies = [];
            values.forEach((v, idx) => {
                if (Number.isFinite(v)) {
                    const z = (v - mean) / stdDev;
                    if (Math.abs(z) > threshold) {
                        anomalies.push({
                            index: idx,
                            value: v,
                            score: Number(Math.abs(z).toFixed(2))
                        });
                    }
                }
            });

            return {
                method: 'z_score',
                threshold,
                mean: Number(mean.toFixed(4)),
                stdDev: Number(stdDev.toFixed(4)),
                anomalies,
                count: anomalies.length,
                percentage: Number(((anomalies.length / n) * 100).toFixed(2))
            };
        },

        /**
         * Detect anomalies using Modified Z-Score (Iglewicz & Hoaglin MAD-based)
         * Formula: M_i = 0.6745 * |x_i - median| / MAD
         * Default threshold: 3.5
         * 
         * @param {Array<number>} values 
         * @param {number} [threshold=3.5] 
         * @returns {Object}
         */
        detectModifiedZScore(values, threshold = 3.5) {
            const empty = { method: 'modified_zscore', anomalies: [], count: 0, percentage: 0, threshold };
            if (!Array.isArray(values) || values.length < 4) return empty;

            const valid = values.filter(v => Number.isFinite(v));
            const n = valid.length;
            if (n < 4) return empty;

            const sorted = [...valid].sort((a, b) => a - b);
            const median = sorted[Math.floor(n / 2)];

            // Median Absolute Deviation (MAD)
            const absDevs = sorted.map(v => Math.abs(v - median)).sort((a, b) => a - b);
            const mad = absDevs[Math.floor(n / 2)];

            if (mad <= 1e-9) {
                // When MAD is zero, fall back to IQR
                return this.detectIqr(values, 2.0);
            }

            const anomalies = [];
            values.forEach((v, idx) => {
                if (Number.isFinite(v)) {
                    const modZ = (0.6745 * Math.abs(v - median)) / mad;
                    if (modZ > threshold) {
                        anomalies.push({
                            index: idx,
                            value: v,
                            score: Number(modZ.toFixed(2))
                        });
                    }
                }
            });

            return {
                method: 'modified_zscore',
                threshold,
                median: Number(median.toFixed(4)),
                mad: Number(mad.toFixed(4)),
                anomalies,
                count: anomalies.length,
                percentage: Number(((anomalies.length / n) * 100).toFixed(2))
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.AnomalyDetectors = AnomalyDetectors;

})(typeof window !== 'undefined' ? window : global);
