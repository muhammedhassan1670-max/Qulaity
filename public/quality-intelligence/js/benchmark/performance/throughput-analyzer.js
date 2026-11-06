/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: benchmark/performance/throughput-analyzer.js
 * ============================================================================
 * Processing Throughput Analyzer:
 * Measures data processing velocities across operations:
 * - Rows per second (rows/sec)
 * - Data cells per second (cells/sec)
 * - Copilot queries per second (queries/sec)
 * Handles small timings safely with non-zero divisors and finite limits.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ThroughputAnalyzer = {
        /**
         * Calculate processing throughput for dataset operations
         * @param {number} rowCount
         * @param {number} columnCount
         * @param {number} durationMs Execution time in ms
         * @returns {Object}
         */
        calculateThroughput(rowCount = 0, columnCount = 0, durationMs = 0) {
            const sec = Math.max(0.001, durationMs / 1000);
            const totalCells = rowCount * columnCount;

            const rowsPerSec = Math.round(rowCount / sec);
            const cellsPerSec = Math.round(totalCells / sec);

            return {
                rowCount,
                columnCount,
                totalCells,
                durationMs,
                rowsPerSec,
                cellsPerSec,
                formattedRowsPerSec: `${rowsPerSec.toLocaleString()} rows/s`,
                formattedCellsPerSec: `${cellsPerSec.toLocaleString()} cells/s`
            };
        },

        /**
         * Calculate query throughput for Copilot workload
         * @param {number} queryCount
         * @param {number} totalDurationMs
         * @returns {Object}
         */
        calculateQueryThroughput(queryCount = 0, totalDurationMs = 0) {
            const sec = Math.max(0.001, totalDurationMs / 1000);
            const queriesPerSec = Number((queryCount / sec).toFixed(2));

            return {
                queryCount,
                totalDurationMs,
                queriesPerSec,
                formatted: `${queriesPerSec} queries/s`
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Benchmark = window.UDIP.Benchmark || {};
    window.UDIP.Benchmark.ThroughputAnalyzer = ThroughputAnalyzer;

})(typeof window !== 'undefined' ? window : global);
