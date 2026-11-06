/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: profiling/statistics.js
 * ============================================================================
 * Detailed statistical profiling for all data types:
 * - Numerical: moments, quantiles, percentiles, IQR outliers, CV
 * - Categorical: frequencies, top/rare categories, entropy
 * - Date/Time: range, interval analysis, periodicity / granularity, time gaps
 * - Text: length distribution, cardinality
 * - Boolean: distribution of true/false
 * Guarantees zero NaN / Infinity outputs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const Statistics = {
        /**
         * Compute complete profile statistics for a single column based on its detected type
         */
        profileColumn(colName, rows, detectedTypeInfo) {
            const utils = window.UDIP.ProfilerUtils;
            const detectedType = detectedTypeInfo.detectedType;
            const totalRows = rows.length;

            // Extract all raw values
            const rawValues = [];
            let nullCount = 0;

            for (let i = 0; i < totalRows; i++) {
                const val = rows[i] ? rows[i][colName] : null;
                let isNullVal = (val === null || val === undefined || val === '');
                if (!isNullVal && typeof val === 'string') {
                    const str = val.trim().toLowerCase();
                    if (str === '' || str === 'nan' || str === 'null' || str === 'none' || str === 'n/a' || str === '-' || str === 'undefined') {
                        isNullVal = true;
                    }
                }
                if (isNullVal) {
                    nullCount++;
                } else {
                    rawValues.push(val);
                }
            }

            const nonNullCount = rawValues.length;
            const nullPct = totalRows > 0 ? (nullCount / totalRows) * 100 : 0;

            // Base stats container
            const stats = {
                totalCount: totalRows,
                nonNullCount: nonNullCount,
                nullCount: nullCount,
                nullPct: +nullPct.toFixed(2),
                completenessPct: +(100 - nullPct).toFixed(2),
                type: detectedType,
                uniqueCount: 0,
                uniquePct: 0,
                isConstant: false,
                isNearConstant: false
            };

            // Route to type-specific statistical calculators
            if (detectedType === 'integer' || detectedType === 'decimal' || detectedType === 'numeric' || detectedType === 'mixed') {
                Object.assign(stats, this._profileNumeric(rawValues, utils));
            } else if (detectedType === 'date' || detectedType === 'datetime' || detectedType === 'time') {
                Object.assign(stats, this._profileDateTime(rawValues, detectedType, utils));
            } else if (detectedType === 'boolean') {
                Object.assign(stats, this._profileBoolean(rawValues, totalRows));
            } else if (detectedType === 'text') {
                Object.assign(stats, this._profileText(rawValues));
            } else {
                // Categorical / Identifier / String
                Object.assign(stats, this._profileCategorical(rawValues, totalRows));
            }

            return stats;
        },

        /**
         * Numeric Statistical Profiling
         * @private
         */
        _profileNumeric(rawValues, utils) {
            const numbers = [];
            for (let i = 0; i < rawValues.length; i++) {
                const n = utils.toNumber(rawValues[i]);
                if (n !== null && isFinite(n)) {
                    numbers.push(n);
                }
            }

            if (numbers.length === 0) {
                return {
                    numericCount: 0,
                    uniqueCount: 0,
                    uniquePct: 0,
                    min: null, max: null, range: 0,
                    mean: null, median: null,
                    variance: 0, stdDev: 0, cv: null,
                    skewness: 0,
                    q1: null, q3: null, iqr: 0,
                    percentiles: { p1: null, p5: null, p25: null, p50: null, p75: null, p95: null, p99: null },
                    outliers: { count: 0, pct: 0, lowerBound: null, upperBound: null },
                    isConstant: false,
                    isNearConstant: false
                };
            }

            // Sort for quantiles & percentiles
            numbers.sort((a, b) => a - b);

            const min = numbers[0];
            const max = numbers[numbers.length - 1];
            const range = max - min;
            const mean = utils.mean(numbers);
            const variance = utils.variance(numbers, mean);
            const stdDev = utils.stdDev(numbers, mean);
            const { q1, median, q3, iqr } = utils.quartiles(numbers);
            const cv = utils.coefficientOfVariation(mean, stdDev);
            const skewness = utils.skewness(numbers, mean, stdDev);

            // Percentiles
            const percentiles = {
                p1: +utils.percentile(numbers, 1).toFixed(4),
                p5: +utils.percentile(numbers, 5).toFixed(4),
                p25: +q1.toFixed(4),
                p50: +median.toFixed(4),
                p75: +q3.toFixed(4),
                p95: +utils.percentile(numbers, 95).toFixed(4),
                p99: +utils.percentile(numbers, 99).toFixed(4)
            };

            // IQR Outliers
            const bounds = utils.iqrBounds(q1, q3, 1.5);
            let outlierCount = 0;
            if (bounds.lower !== null && bounds.upper !== null) {
                for (let i = 0; i < numbers.length; i++) {
                    if (numbers[i] < bounds.lower || numbers[i] > bounds.upper) {
                        outlierCount++;
                    }
                }
            }

            const outlierPct = numbers.length > 0 ? +((outlierCount / numbers.length) * 100).toFixed(2) : 0;

            // Unique count
            const uniqueSet = new Set(numbers);

            return {
                numericCount: numbers.length,
                uniqueCount: uniqueSet.size,
                uniquePct: +((uniqueSet.size / numbers.length) * 100).toFixed(2),
                min: +min.toFixed(4),
                max: +max.toFixed(4),
                range: +range.toFixed(4),
                mean: mean !== null ? +mean.toFixed(4) : null,
                median: median !== null ? +median.toFixed(4) : null,
                variance: +variance.toFixed(4),
                stdDev: +stdDev.toFixed(4),
                cv: cv !== null ? +cv.toFixed(2) : null,
                skewness: +skewness.toFixed(3),
                q1: q1 !== null ? +q1.toFixed(4) : null,
                q3: q3 !== null ? +q3.toFixed(4) : null,
                iqr: +iqr.toFixed(4),
                percentiles,
                outliers: {
                    count: outlierCount,
                    pct: outlierPct,
                    lowerBound: bounds.lower !== null ? +bounds.lower.toFixed(4) : null,
                    upperBound: bounds.upper !== null ? +bounds.upper.toFixed(4) : null
                },
                isConstant: uniqueSet.size === 1,
                isNearConstant: numbers.length > 1 && (numbers.filter(x => x === numbers[0]).length / numbers.length >= 0.95 || numbers.filter(x => x === numbers[numbers.length - 1]).length / numbers.length >= 0.95)
            };
        },

        /**
         * Categorical Statistical Profiling
         * @private
         */
        _profileCategorical(rawValues, totalRows) {
            const freqMap = {};
            for (let i = 0; i < rawValues.length; i++) {
                const s = String(rawValues[i]).trim();
                freqMap[s] = (freqMap[s] || 0) + 1;
            }

            const entries = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
            const uniqueCount = entries.length;
            const uniquePct = rawValues.length > 0 ? +((uniqueCount / rawValues.length) * 100).toFixed(2) : 0;

            const topValue = entries.length > 0 ? entries[0][0] : null;
            const topCount = entries.length > 0 ? entries[0][1] : 0;
            const topPct = rawValues.length > 0 ? +((topCount / rawValues.length) * 100).toFixed(2) : 0;

            // Top categories breakdown (up to 15)
            const topCategories = entries.slice(0, 15).map(([val, count]) => ({
                value: val,
                count,
                pct: +((count / (rawValues.length || 1)) * 100).toFixed(2)
            }));

            // Rare categories (< 1% of non-null observations)
            const rareThreshold = Math.max(1, Math.floor(rawValues.length * 0.01));
            const rareCategories = entries.filter(([_, count]) => count < rareThreshold).map(([val]) => val);

            return {
                uniqueCount,
                uniquePct,
                cardinalityRatio: +(uniqueCount / (totalRows || 1)).toFixed(4),
                topValue,
                topCount,
                topPct,
                topCategories,
                rareCategoryCount: rareCategories.length,
                isConstant: uniqueCount === 1,
                isNearConstant: topPct >= 95 && uniqueCount > 1
            };
        },

        /**
         * Date / Time Statistical Profiling
         * @private
         */
        _profileDateTime(rawValues, detectedType, utils) {
            const timestamps = [];
            const strSet = new Set();
            let duplicateTimestamps = 0;

            for (let i = 0; i < rawValues.length; i++) {
                const s = String(rawValues[i]).trim();
                if (strSet.has(s)) duplicateTimestamps++;
                strSet.add(s);

                const dt = new Date(s);
                if (!isNaN(dt.getTime())) {
                    timestamps.push(dt.getTime());
                }
            }

            if (timestamps.length === 0) {
                return {
                    uniqueCount: strSet.size,
                    uniquePct: rawValues.length > 0 ? +((strSet.size / rawValues.length) * 100).toFixed(2) : 0,
                    minDate: null, maxDate: null,
                    spanDays: 0,
                    granularity: 'unknown',
                    duplicateTimestamps: 0,
                    isRegular: false,
                    isConstant: strSet.size === 1,
                    isNearConstant: false
                };
            }

            timestamps.sort((a, b) => a - b);
            const minTs = timestamps[0];
            const maxTs = timestamps[timestamps.length - 1];
            const spanMs = maxTs - minTs;
            const spanDays = +(spanMs / (1000 * 60 * 60 * 24)).toFixed(2);

            // Granularity & Interval Regularity Detection
            const intervals = [];
            for (let i = 1; i < timestamps.length; i++) {
                const diff = timestamps[i] - timestamps[i - 1];
                if (diff > 0) intervals.push(diff);
            }

            const medianInterval = intervals.length > 0 ? utils.median(intervals.sort((a, b) => a - b)) : 0;
            let granularity = 'irregular';
            const minuteMs = 60 * 1000;
            const hourMs = 60 * minuteMs;
            const dayMs = 24 * hourMs;
            const weekMs = 7 * dayMs;
            const monthMs = 30 * dayMs;
            const yearMs = 365 * dayMs;

            if (medianInterval >= 0.9 * yearMs && medianInterval <= 1.1 * yearMs) granularity = 'yearly';
            else if (medianInterval >= 25 * dayMs && medianInterval <= 35 * dayMs) granularity = 'monthly';
            else if (medianInterval >= 6 * dayMs && medianInterval <= 8 * dayMs) granularity = 'weekly';
            else if (medianInterval >= 20 * hourMs && medianInterval <= 28 * hourMs) granularity = 'daily';
            else if (medianInterval >= 50 * minuteMs && medianInterval <= 70 * minuteMs) granularity = 'hourly';
            else if (medianInterval >= 50 * 1000 && medianInterval <= 70 * 1000) granularity = 'minute-level';

            // Check regularity
            let regularCount = 0;
            if (medianInterval > 0) {
                intervals.forEach(diff => {
                    if (Math.abs(diff - medianInterval) / medianInterval <= 0.15) {
                        regularCount++;
                    }
                });
            }
            const regularityPct = intervals.length > 0 ? Math.round((regularCount / intervals.length) * 100) : 0;

            return {
                uniqueCount: strSet.size,
                uniquePct: rawValues.length > 0 ? +((strSet.size / rawValues.length) * 100).toFixed(2) : 0,
                minDate: new Date(minTs).toISOString().split('T')[0],
                maxDate: new Date(maxTs).toISOString().split('T')[0],
                minTimestamp: new Date(minTs).toISOString(),
                maxTimestamp: new Date(maxTs).toISOString(),
                spanDays,
                granularity,
                duplicateTimestamps,
                regularityPct,
                isRegular: regularityPct >= 80,
                hasTimeGaps: intervals.some(diff => medianInterval > 0 && diff >= 2.0 * medianInterval),
                isConstant: strSet.size === 1,
                isNearConstant: false
            };
        },

        /**
         * Text Statistical Profiling
         * @private
         */
        _profileText(rawValues) {
            let totalLen = 0;
            let minLen = Infinity;
            let maxLen = 0;
            const uniqueSet = new Set();
            const examples = [];

            for (let i = 0; i < rawValues.length; i++) {
                const s = String(rawValues[i]).trim();
                const len = s.length;
                totalLen += len;
                if (len < minLen) minLen = len;
                if (len > maxLen) maxLen = len;
                uniqueSet.add(s);
                if (examples.length < 5 && s.length > 0) examples.push(s);
            }

            const avgLen = rawValues.length > 0 ? Math.round(totalLen / rawValues.length) : 0;

            return {
                uniqueCount: uniqueSet.size,
                uniquePct: rawValues.length > 0 ? +((uniqueSet.size / rawValues.length) * 100).toFixed(2) : 0,
                avgLength: avgLen,
                minLength: minLen === Infinity ? 0 : minLen,
                maxLength: maxLen,
                sampleExamples: examples,
                isConstant: uniqueSet.size === 1,
                isNearConstant: false
            };
        },

        /**
         * Boolean Statistical Profiling
         * @private
         */
        _profileBoolean(rawValues, totalRows) {
            let trueCount = 0;
            let falseCount = 0;
            const truthy = new Set(['true', 'yes', 'y', '1', 't', 'نعم']);

            for (let i = 0; i < rawValues.length; i++) {
                const s = String(rawValues[i]).trim().toLowerCase();
                if (truthy.has(s)) {
                    trueCount++;
                } else {
                    falseCount++;
                }
            }

            const validCount = trueCount + falseCount;
            const uniqueCount = (trueCount > 0 ? 1 : 0) + (falseCount > 0 ? 1 : 0);
            const truePct = validCount > 0 ? +((trueCount / validCount) * 100).toFixed(2) : 0;
            const falsePct = validCount > 0 ? +((falseCount / validCount) * 100).toFixed(2) : 0;

            return {
                uniqueCount,
                uniquePct: validCount > 0 ? +((uniqueCount / validCount) * 100).toFixed(2) : 0,
                trueCount,
                falseCount,
                truePct,
                falsePct,
                isConstant: uniqueCount === 1,
                isNearConstant: (truePct >= 95 || falsePct >= 95) && uniqueCount > 1
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Statistics = Statistics;

})(window);
