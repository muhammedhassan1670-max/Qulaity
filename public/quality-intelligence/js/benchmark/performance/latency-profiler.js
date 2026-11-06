/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: benchmark/performance/latency-profiler.js
 * ============================================================================
 * Interactive Operation Latency Profiler:
 * Benchmarks standard user-facing interactive actions:
 * - Open dataset
 * - Open profile
 * - Open insight
 * - Open evidence
 * - Ask Copilot
 * - Open chart
 * - Run What-If
 * - Compare versions
 * - Start investigation
 *
 * Computes statistical percentiles (P50, P75, P95, P99) strictly when N >= 3.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const INTERACTIVE_OPERATIONS = [
        'Open dataset',
        'Open profile',
        'Open insight',
        'Open evidence',
        'Ask Copilot',
        'Open chart',
        'Run What-If',
        'Compare versions',
        'Start investigation'
    ];

    const LatencyProfiler = {
        INTERACTIVE_OPERATIONS,

        /**
         * Benchmark a suite of interactive operations over repeated runs
         * @param {Object} operationRunners Map of operationName -> fn()
         * @param {number} repeats Number of iterations per operation, default 5
         * @returns {Object} Profiler results
         */
        profileOperations(operationRunners = {}, repeats = 5) {
            const repeatRunner = window.UDIP?.Benchmark?.RepeatRunner;
            const operations = {};

            INTERACTIVE_OPERATIONS.forEach(opName => {
                const runner = operationRunners[opName];

                if (typeof runner === 'function') {
                    if (repeatRunner) {
                        const repRes = repeatRunner.runRepeated(runner, repeats);
                        operations[opName] = {
                            operation: opName,
                            measured: true,
                            iterations: repRes.successfulRuns,
                            meanMs: repRes.stats.mean,
                            medianMs: repRes.stats.median,
                            p50Ms: repRes.stats.p50,
                            p75Ms: repRes.stats.p75,
                            p95Ms: repRes.stats.p95,
                            p99Ms: repRes.stats.p99
                        };
                    } else {
                        // Fallback single run
                        const t0 = Date.now();
                        runner();
                        const dur = Date.now() - t0;
                        operations[opName] = {
                            operation: opName,
                            measured: true,
                            iterations: 1,
                            meanMs: dur,
                            medianMs: dur,
                            p50Ms: 'NOT MEASURED',
                            p75Ms: 'NOT MEASURED',
                            p95Ms: 'NOT MEASURED',
                            p99Ms: 'NOT MEASURED'
                        };
                    }
                } else {
                    operations[opName] = {
                        operation: opName,
                        measured: false,
                        status: 'NOT MEASURED',
                        reason: 'No runner provided'
                    };
                }
            });

            return {
                timestamp: new Date().toISOString(),
                operationsCount: INTERACTIVE_OPERATIONS.length,
                operations
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Benchmark = window.UDIP.Benchmark || {};
    window.UDIP.Benchmark.LatencyProfiler = LatencyProfiler;

})(typeof window !== 'undefined' ? window : global);
