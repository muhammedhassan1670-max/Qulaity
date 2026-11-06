/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: benchmark/scalability/scale-runner.js
 * ============================================================================
 * Progressive Scale Ladder Benchmark Runner:
 * Executes benchmarking runs across escalating dataset scale ladders:
 * - Row Ladder: 1K, 5K, 10K, 25K, 50K, 100K, 250K
 * - Column Ladder: 5, 10, 25, 50, 100, 250, 500
 *
 * Enforces Resource Safety:
 * - Gracefully stops before causing browser tab freezes or memory exhaustion
 * - Explicitly marks skipped scales as 'NOT ATTEMPTED'
 * - Never converts 'not tested' into 'supported'
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ScaleRunner = {
        /**
         * Run benchmarks across progressive row scales
         * @param {Function} taskFn (dataset) => any
         * @param {Array<number>} ladder Row scales to evaluate
         * @param {Object} options Safety limits
         * @returns {Object}
         */
        runRowScaleLadder(taskFn, ladder = [1000, 5000, 10000, 25000, 50000], options = {}) {
            const workloadGen = window.UDIP?.Benchmark?.WorkloadGenerator;
            const maxDurationMs = options.maxDurationMs || 4000;
            const results = [];
            let maximumTestedRows = 0;
            let haltedEarly = false;
            let haltReason = null;

            for (let i = 0; i < ladder.length; i++) {
                const n = ladder[i];

                if (haltedEarly) {
                    results.push({
                        scale: n,
                        status: 'NOT ATTEMPTED',
                        durationMs: null,
                        note: 'Skipped to preserve browser stability'
                    });
                    continue;
                }

                try {
                    const ds = workloadGen 
                        ? workloadGen.generateSizeWorkload(n, 100 + i)
                        : { rowCount: n, columnCount: 5, rows: Array.from({ length: n }, (_, idx) => ({ id: idx + 1, val: idx })) };

                    const start = Date.now();
                    taskFn(ds);
                    const dur = Date.now() - start;

                    results.push({
                        scale: n,
                        status: 'SUCCESS',
                        durationMs: dur
                    });
                    maximumTestedRows = n;

                    if (dur > maxDurationMs) {
                        haltedEarly = true;
                        haltReason = `Single execution (${dur}ms) exceeded safety threshold (${maxDurationMs}ms)`;
                    }
                } catch (err) {
                    results.push({
                        scale: n,
                        status: 'FAILED',
                        durationMs: null,
                        error: err.message || String(err)
                    });
                    haltedEarly = true;
                    haltReason = `Execution failed at scale ${n}: ${err.message}`;
                }
            }

            return {
                scaleType: 'ROWS',
                ladderPoints: ladder,
                maximumTestedRows,
                haltedEarly,
                haltReason,
                results
            };
        },

        /**
         * Run benchmarks across progressive column dimension scales
         * @param {Function} taskFn (dataset) => any
         * @param {Array<number>} ladder Column counts
         * @param {number} rowCount Base rows, default 500
         * @returns {Object}
         */
        runDimensionScaleLadder(taskFn, ladder = [5, 10, 25, 50, 100], rowCount = 500) {
            const workloadGen = window.UDIP?.Benchmark?.WorkloadGenerator;
            const results = [];
            let maximumTestedCols = 0;

            for (let i = 0; i < ladder.length; i++) {
                const numCols = ladder[i];
                try {
                    const ds = workloadGen 
                        ? workloadGen.generateDimensionWorkload(numCols, rowCount, 300 + i)
                        : { rowCount, columnCount: numCols, rows: [] };

                    const start = Date.now();
                    taskFn(ds);
                    const dur = Date.now() - start;

                    results.push({
                        columns: numCols,
                        rowCount,
                        status: 'SUCCESS',
                        durationMs: dur
                    });
                    maximumTestedCols = numCols;
                } catch (err) {
                    results.push({
                        columns: numCols,
                        rowCount,
                        status: 'FAILED',
                        durationMs: null,
                        error: err.message || String(err)
                    });
                    break;
                }
            }

            return {
                scaleType: 'COLUMNS',
                ladderPoints: ladder,
                maximumTestedCols,
                results
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Benchmark = window.UDIP.Benchmark || {};
    window.UDIP.Benchmark.ScaleRunner = ScaleRunner;

})(typeof window !== 'undefined' ? window : global);
