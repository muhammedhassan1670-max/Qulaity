/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: profiling/profiler-utils.js
 * ============================================================================
 * Statistical, mathematical, and data-sampling primitives for the profiling engine.
 * Guarantees zero NaN / Infinity outputs and safe zero-variance handling.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ProfilerUtils = {
        /**
         * Test if a value can be reliably coerced to a finite numeric value
         */
        isNumeric(val) {
            if (val === null || val === undefined || val === '') return false;
            if (typeof val === 'boolean') return false;
            const n = Number(val);
            return !isNaN(n) && isFinite(n);
        },

        /**
         * Safely coerce value to float or return null
         */
        toNumber(val) {
            if (!this.isNumeric(val)) return null;
            return Number(val);
        },

        /**
         * Calculate safe mean
         */
        mean(arr) {
            if (!Array.isArray(arr) || arr.length === 0) return null;
            let sum = 0;
            let count = 0;
            for (let i = 0; i < arr.length; i++) {
                const v = arr[i];
                if (v !== null && !isNaN(v) && isFinite(v)) {
                    sum += v;
                    count++;
                }
            }
            return count > 0 ? sum / count : null;
        },

        /**
         * Calculate safe sample variance
         */
        variance(arr, avg) {
            if (!Array.isArray(arr) || arr.length < 2) return 0;
            const m = avg != null ? avg : this.mean(arr);
            if (m === null) return 0;
            let sumSq = 0;
            let count = 0;
            for (let i = 0; i < arr.length; i++) {
                const v = arr[i];
                if (v !== null && !isNaN(v) && isFinite(v)) {
                    sumSq += (v - m) * (v - m);
                    count++;
                }
            }
            return count > 1 ? sumSq / (count - 1) : 0;
        },

        /**
         * Calculate safe sample standard deviation
         */
        stdDev(arr, avg) {
            const v = this.variance(arr, avg);
            return Math.sqrt(Math.max(0, v));
        },

        /**
         * Calculate percentile on a sorted array of numbers (0 <= p <= 100)
         */
        percentile(sortedArr, p) {
            if (!Array.isArray(sortedArr) || sortedArr.length === 0) return null;
            if (sortedArr.length === 1) return sortedArr[0];
            if (p <= 0) return sortedArr[0];
            if (p >= 100) return sortedArr[sortedArr.length - 1];

            const index = (p / 100) * (sortedArr.length - 1);
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index - lower;

            if (lower === upper) return sortedArr[lower];
            return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
        },

        /**
         * Calculate safe median of a sorted array
         */
        median(sortedArr) {
            return this.percentile(sortedArr, 50);
        },

        /**
         * Calculate median and quartiles (Q1, Median, Q3, IQR)
         */
        quartiles(sortedArr) {
            if (!Array.isArray(sortedArr) || sortedArr.length === 0) {
                return { q1: null, median: null, q3: null, iqr: 0 };
            }
            const q1 = this.percentile(sortedArr, 25);
            const median = this.percentile(sortedArr, 50);
            const q3 = this.percentile(sortedArr, 75);
            const iqr = (q1 !== null && q3 !== null) ? Math.max(0, q3 - q1) : 0;
            return { q1, median, q3, iqr };
        },

        /**
         * Calculate skewness (Fisher-Pearson coefficient)
         */
        skewness(arr, avg, sd) {
            if (!Array.isArray(arr) || arr.length < 3) return 0;
            const m = avg != null ? avg : this.mean(arr);
            const s = sd != null ? sd : this.stdDev(arr, m);
            if (s === 0 || m === null) return 0;

            const n = arr.length;
            let sumCubed = 0;
            for (let i = 0; i < n; i++) {
                sumCubed += Math.pow((arr[i] - m) / s, 3);
            }
            const skew = (n / ((n - 1) * (n - 2))) * sumCubed;
            return isFinite(skew) ? skew : 0;
        },

        /**
         * Calculate Coefficient of Variation (CV = stdDev / mean)
         */
        coefficientOfVariation(avg, sd) {
            if (avg === null || sd === null || avg === 0 || !isFinite(avg) || !isFinite(sd)) {
                return null;
            }
            const cv = (sd / Math.abs(avg)) * 100;
            return isFinite(cv) ? cv : null;
        },

        /**
         * Calculate IQR outlier bounds
         */
        iqrBounds(q1, q3, multiplier = 1.5) {
            if (q1 === null || q3 === null) return { lower: null, upper: null };
            const iqr = Math.max(0, q3 - q1);
            return {
                lower: q1 - multiplier * iqr,
                upper: q3 + multiplier * iqr
            };
        },

        /**
         * Compute Pearson correlation between two numeric arrays
         */
        pearsonCorrelation(arrX, arrY) {
            if (!Array.isArray(arrX) || !Array.isArray(arrY)) return 0;
            const n = Math.min(arrX.length, arrY.length);
            if (n < 3) return 0;

            let sumX = 0, sumY = 0;
            let sumX2 = 0, sumY2 = 0;
            let sumXY = 0;
            let validCount = 0;

            for (let i = 0; i < n; i++) {
                const x = arrX[i];
                const y = arrY[i];
                if (x != null && y != null && isFinite(x) && isFinite(y)) {
                    sumX += x;
                    sumY += y;
                    sumX2 += x * x;
                    sumY2 += y * y;
                    sumXY += x * y;
                    validCount++;
                }
            }

            if (validCount < 3) return 0;

            const numerator = (validCount * sumXY) - (sumX * sumY);
            const denomX = (validCount * sumX2) - (sumX * sumX);
            const denomY = (validCount * sumY2) - (sumY * sumY);

            if (denomX <= 0 || denomY <= 0) return 0;

            const r = numerator / Math.sqrt(denomX * denomY);
            if (!isFinite(r)) return 0;
            return Math.max(-1, Math.min(1, r));
        },

        /**
         * Intelligent sampling for large datasets (> 20,000 rows)
         * Keeps profiler responsive while retaining transparency
         */
        sampleDataset(rows, maxLimit = 20000) {
            if (!Array.isArray(rows) || rows.length <= maxLimit) {
                return {
                    isSampled: false,
                    sampleSize: rows ? rows.length : 0,
                    totalSize: rows ? rows.length : 0,
                    sampleRatePct: 100,
                    rows: rows || []
                };
            }

            const step = rows.length / maxLimit;
            const sampled = [];
            for (let i = 0; i < maxLimit; i++) {
                sampled.push(rows[Math.floor(i * step)]);
            }

            return {
                isSampled: true,
                sampleSize: sampled.length,
                totalSize: rows.length,
                sampleRatePct: Math.round((sampled.length / rows.length) * 100),
                rows: sampled
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.ProfilerUtils = ProfilerUtils;

})(window);
