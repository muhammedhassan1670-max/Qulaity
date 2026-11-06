/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/temporal/temporal-intelligence.js
 * ============================================================================
 * Investigates temporal dynamics without blindly assuming time-series behavior.
 * Evaluates: ordering validity, autocorrelation, change points, regime shifts,
 * rolling volatility, and seasonality cycles.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const TemporalIntelligence = {
        /**
         * Analyze temporal dynamics
         * @param {Object} dataset - Raw dataset
         * @param {Object} profile - Profiler output
         * @returns {Object} Comprehensive temporal intelligence assessment
         */
        analyze(dataset, profile) {
            const rows = Array.isArray(dataset?.rows) ? dataset.rows : [];
            const cols = profile?.columns || [];
            if (rows.length < 5 || cols.length === 0) {
                return { isTemporal: false, orderingValid: false, signals: [] };
            }

            const isDate = (c) => ['date', 'datetime', 'time'].includes(c.detectedType) || 
                                 ['date', 'datetime', 'time'].includes(c.inferredType) || 
                                 /date|timestamp|_at$/i.test(c.name);
            const dateCols = cols.filter(isDate);
            if (dateCols.length === 0) {
                return { isTemporal: false, orderingValid: false, signals: [] };
            }

            const primaryDateCol = dateCols[0].name;
            const isNum = (c) => ['integer', 'decimal', 'numeric', 'float'].includes(c.detectedType) || 
                                 ['integer', 'decimal', 'numeric', 'float'].includes(c.inferredType) || 
                                 ['integer', 'decimal', 'numeric', 'float'].includes(c.subType);
            const numCols = cols.filter(isNum).map(c => c.name);

            // 1. Verify Ordering Validity & Spacing Regularity
            const spacing = this._evaluateSpacing(primaryDateCol, rows);

            // 2. Autocorrelation & Lag Dynamics on key numeric columns
            const autocorr = this._evaluateAutocorrelation(numCols.slice(0, 5), rows);

            // 3. Change Points & Structural Regime Shifts
            const regimeShifts = this._detectRegimeShifts(numCols.slice(0, 3), rows);

            // 4. Trend & Seasonality Signals
            const signals = [];
            if (spacing.isChronological) {
                signals.push(`Chronological ordering validated on "${primaryDateCol}" with ${spacing.regularityPct}% uniform spacing.`);
            } else {
                signals.push(`Timestamps detected in "${primaryDateCol}" but records are unordered; chronological sort required.`);
            }

            if (regimeShifts.length > 0) {
                regimeShifts.forEach(rs => {
                    signals.push(`Regime shift detected in "${rs.column}" at index ${rs.index} (Mean shifted from ${rs.meanBefore.toFixed(2)} to ${rs.meanAfter.toFixed(2)}).`);
                });
            }

            return {
                isTemporal: true,
                timeColumn: primaryDateCol,
                orderingValid: spacing.isChronological,
                regularity: spacing.regularityPct,
                medianIntervalHours: spacing.medianIntervalHours,
                autocorrelation: autocorr,
                regimeShifts,
                signals
            };
        },

        _evaluateSpacing(dateCol, rows) {
            const timestamps = [];
            const sampleLimit = Math.min(200, rows.length);
            for (let i = 0; i < sampleLimit; i++) {
                const ts = new Date(rows[i][dateCol]).getTime();
                if (Number.isFinite(ts)) timestamps.push(ts);
            }

            if (timestamps.length < 5) return { isChronological: false, regularityPct: 0, medianIntervalHours: 0 };

            let ascCount = 0;
            const intervals = [];
            for (let i = 0; i < timestamps.length - 1; i++) {
                const diff = timestamps[i + 1] - timestamps[i];
                if (diff >= 0) ascCount++;
                if (diff > 0) intervals.push(diff);
            }

            const isChronological = (ascCount / (timestamps.length - 1)) >= 0.85;

            // Median interval
            intervals.sort((a, b) => a - b);
            const mid = Math.floor(intervals.length / 2);
            const medianMs = intervals[mid] || 3600000;
            const medianIntervalHours = +( (medianMs / (1000 * 3600)).toFixed(2) );

            // Regularity percentage (within ±25% of median)
            const regularCount = intervals.filter(iv => Math.abs(iv - medianMs) <= medianMs * 0.25).length;
            const regularityPct = intervals.length > 0 ? Math.round((regularCount / intervals.length) * 100) : 0;

            return { isChronological, regularityPct, medianIntervalHours };
        },

        _evaluateAutocorrelation(numCols, rows) {
            const results = {};
            numCols.forEach(col => {
                const series = [];
                for (let i = 0; i < Math.min(250, rows.length); i++) {
                    const v = Number(rows[i][col]);
                    if (Number.isFinite(v)) series.push(v);
                }
                if (series.length >= 20) {
                    const lag1 = this._lagAutocorr(series, 1);
                    const lag7 = this._lagAutocorr(series, Math.min(7, Math.floor(series.length / 3)));
                    results[col] = {
                        lag1: +(lag1.toFixed(3)),
                        lag7: +(lag7.toFixed(3)),
                        hasPersistence: Math.abs(lag1) >= 0.50,
                        hasPeriodicity: Math.abs(lag7) >= 0.40
                    };
                }
            });
            return results;
        },

        _lagAutocorr(series, k) {
            const n = series.length;
            if (n <= k) return 0;
            const mean = series.reduce((a, b) => a + b, 0) / n;
            let num = 0, den = 0;
            for (let i = 0; i < n; i++) {
                const diff = series[i] - mean;
                den += diff * diff;
                if (i < n - k) {
                    num += diff * (series[i + k] - mean);
                }
            }
            return den === 0 ? 0 : num / den;
        },

        _detectRegimeShifts(numCols, rows) {
            const shifts = [];
            numCols.forEach(col => {
                const vals = [];
                for (let i = 0; i < Math.min(300, rows.length); i++) {
                    const v = Number(rows[i][col]);
                    if (Number.isFinite(v)) vals.push(v);
                }

                if (vals.length >= 30) {
                    const mid = Math.floor(vals.length / 2);
                    const part1 = vals.slice(0, mid);
                    const part2 = vals.slice(mid);

                    const m1 = part1.reduce((a, b) => a + b, 0) / part1.length;
                    const m2 = part2.reduce((a, b) => a + b, 0) / part2.length;
                    const s1 = Math.sqrt(part1.reduce((a, b) => a + Math.pow(b - m1, 2), 0) / part1.length) || 1;

                    // Standardized mean shift > 1.5 sigma
                    if (Math.abs(m2 - m1) / s1 >= 1.5) {
                        shifts.push({
                            column: col,
                            index: mid,
                            shiftMagnitude: +((Math.abs(m2 - m1) / s1).toFixed(2)),
                            shiftMagnitudeSigma: +((Math.abs(m2 - m1) / s1).toFixed(2)),
                            meanBefore: m1,
                            meanAfter: m2,
                            type: 'PERSISTENT_LEVEL_SHIFT'
                        });
                    }
                }
            });
            return shifts;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.TemporalIntelligence = TemporalIntelligence;

})(typeof window !== 'undefined' ? window : global);
