/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: benchmark/execution/stage-timer.js
 * ============================================================================
 * Precision Stage Timer:
 * Measures execution latencies at sub-millisecond precision using performance.now()
 * Records granular telemetry per stage:
 * - Started timestamp
 * - Duration in ms (rounded to 2 decimal places)
 * - Status ('SUCCESS' | 'ERROR' | 'SKIPPED')
 * - Memory snapshots (before / after where supported)
 * ============================================================================
 */

(function (window) {
    'use strict';

    function getNow() {
        if (typeof performance !== 'undefined' && performance.now) {
            return performance.now();
        }
        return Date.now();
    }

    function getMemorySnapshot() {
        if (typeof performance !== 'undefined' && performance.memory) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize
            };
        }
        return null;
    }

    const StageTimer = {
        /**
         * Time a specific pipeline or analytical stage
         * @param {string} stage Name of stage
         * @param {Function} stageFn Executable synchronous function
         * @param {Object} context Optional context (rows, columns)
         * @returns {Object} Stage telemetry record
         */
        timeStage(stage, stageFn, context = {}) {
            const startedAt = new Date().toISOString();
            const memoryBefore = getMemorySnapshot();
            const start = getNow();

            let result = null;
            let status = 'SUCCESS';
            let error = null;

            try {
                result = stageFn();
            } catch (err) {
                status = 'ERROR';
                error = err.message || String(err);
            }

            const end = getNow();
            const durationMs = Number(Math.max(0, end - start).toFixed(2));
            const memoryAfter = getMemorySnapshot();

            return {
                stage,
                startedAt,
                durationMs,
                status,
                rows: context.rows || 0,
                columns: context.columns || 0,
                memoryBefore,
                memoryAfter,
                error,
                result
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Benchmark = window.UDIP.Benchmark || {};
    window.UDIP.Benchmark.StageTimer = StageTimer;

})(typeof window !== 'undefined' ? window : global);
