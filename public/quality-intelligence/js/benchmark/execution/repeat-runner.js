/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: benchmark/execution/repeat-runner.js
 * ============================================================================
 * Repeated Workload Execution & Statistical Distribution Analyzer:
 * Runs analytical workloads across multiple iterations (5, 10, 25, 50 cycles).
 * Computes statistically valid distribution metrics:
 * - Mean, Median, Standard Deviation, Min, Max
 * - Percentiles: P50, P75, P95, P99
 *
 * Enforces Statistical Invariants:
 * - Never calculates percentiles on N < 3 observations (returns NOT MEASURED)
 * - Identifies runtime drift or latency degradation across successive iterations
 * ============================================================================
 */

(function (window) {
    'use strict';

    /**
     * Helper to compute exact percentile from sorted array
     */
    function computePercentile(sortedArr, p) {
        if (!sortedArr || sortedArr.length === 0) return null;
        if (sortedArr.length < 3) return 'NOT MEASURED';
        const rank = (p / 100) * (sortedArr.length - 1);
        const lower = Math.floor(rank);
        const upper = Math.ceil(rank);
        const weight = rank - lower;
        if (lower === upper) return Number(sortedArr[lower].toFixed(2));
        return Number((sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight).toFixed(2));
    }

    const RepeatRunner = {
        /**
         * Run a task repeatedly and calculate statistical telemetry
         * @param {Function} taskFn Task returning durationMs or execution telemetry
         * @param {number} runs Number of iterations, default 5
         * @returns {Object} Statistical summary
         */
        runRepeated(taskFn, runs = 5) {
            const rawLatencies = [];
            const errors = [];

            for (let i = 0; i < runs; i++) {
                try {
                    const res = taskFn(i + 1);
                    const dur = typeof res === 'number' ? res : (res?.durationMs || 0);
                    rawLatencies.push(dur);
                } catch (err) {
                    errors.push({ run: i + 1, error: err.message || String(err) });
                }
            }

            if (rawLatencies.length === 0) {
                return {
                    runsAttempted: runs,
                    successfulRuns: 0,
                    status: 'FAILED',
                    errors
                };
            }

            const sorted = [...rawLatencies].sort((a, b) => a - b);
            const count = sorted.length;
            const sum = sorted.reduce((acc, val) => acc + val, 0);
            const mean = Number((sum / count).toFixed(2));
            const min = sorted[0];
            const max = sorted[count - 1];

            // Median
            const mid = Math.floor(count / 2);
            const median = count % 2 === 0
                ? Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2))
                : sorted[mid];

            // Standard Deviation
            const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / Math.max(1, count);
            const stdDev = Number(Math.sqrt(variance).toFixed(2));

            // Percentiles (require N >= 3)
            const p50 = computePercentile(sorted, 50);
            const p75 = computePercentile(sorted, 75);
            const p95 = computePercentile(sorted, 95);
            const p99 = computePercentile(sorted, 99);

            // Latency drift detection (compare first half to second half)
            let driftRatio = 1.0;
            let degradationDetected = false;
            if (rawLatencies.length >= 6) {
                const half = Math.floor(rawLatencies.length / 2);
                const firstHalfMean = rawLatencies.slice(0, half).reduce((a, b) => a + b, 0) / half;
                const secondHalfMean = rawLatencies.slice(half).reduce((a, b) => a + b, 0) / (rawLatencies.length - half);
                driftRatio = Number((secondHalfMean / Math.max(0.01, firstHalfMean)).toFixed(2));
                if (driftRatio > 1.25) {
                    degradationDetected = true;
                }
            }

            return {
                runsAttempted: runs,
                successfulRuns: count,
                errorsCount: errors.length,
                stats: {
                    mean,
                    median,
                    stdDev,
                    min,
                    max,
                    p50,
                    p75,
                    p95,
                    p99
                },
                rawLatencies,
                degradation: {
                    detected: degradationDetected,
                    driftRatio,
                    note: degradationDetected ? 'Performance degraded across repeated runs' : 'Stable execution across cycles'
                }
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Benchmark = window.UDIP.Benchmark || {};
    window.UDIP.Benchmark.RepeatRunner = RepeatRunner;

})(typeof window !== 'undefined' ? window : global);
