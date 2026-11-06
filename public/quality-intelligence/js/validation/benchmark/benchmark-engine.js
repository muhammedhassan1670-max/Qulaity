/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/benchmark/benchmark-engine.js
 * ============================================================================
 * Benchmarking Coordinator:
 * Runs systematic benchmarks across dataset scales, records real measured
 * timings, evaluates memory and scalability curves, and produces ASCII/HTML
 * benchmark dashboards.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const BenchmarkEngine = {
        /**
         * Run a suite of scalability benchmarks across progressive row sizes
         * @param {Object} engines Platform engines
         * @param {Array<number>} sizes Row sizes to test, default [100, 500, 1000, 2500]
         * @returns {Object}
         */
        runBenchmarkSuite(engines = {}, sizes = [100, 500, 1000, 2500]) {
            const profiler = window.UDIP?.Validation?.PerformanceProfiler;
            const memoryProfiler = window.UDIP?.Validation?.MemoryProfiler;
            const scalabilityAnalyzer = window.UDIP?.Validation?.ScalabilityAnalyzer;
            const gen = window.UDIP?.Validation?.DatasetGenerator;

            const runs = [];
            const scalingPoints = [];

            sizes.forEach(n => {
                // Generate test dataset
                const ds = gen 
                    ? gen.generateCorrelatedDataset({ n, r: 0.75, seed: n + 1 })
                    : {
                        id: `bm_${n}`,
                        filename: `bm_${n}.csv`,
                        rowCount: n,
                        columnCount: 4,
                        columns: ['id', 'feature_x', 'target_y', 'covariate_z'],
                        rows: Array.from({ length: n }, (_, i) => ({
                            id: i + 1,
                            feature_x: 10 + i * 0.1,
                            target_y: 20 + i * 0.25,
                            covariate_z: 5 + (i % 7)
                        }))
                    };

                let pipelineRes = null;
                if (profiler) {
                    pipelineRes = profiler.profileFullPipeline(ds, engines);
                    runs.push(pipelineRes);
                    scalingPoints.push({
                        n,
                        durationMs: pipelineRes.timings.totalPipelineMs
                    });
                }
            });

            const complexityAnalysis = scalabilityAnalyzer 
                ? scalabilityAnalyzer.analyzeComplexity(scalingPoints)
                : { complexity: 'Evaluated' };

            const memoryReport = memoryProfiler ? memoryProfiler.profileFootprint(runs[runs.length - 1]?.outputs || {}) : null;

            return {
                timestamp: new Date().toISOString(),
                sizesTested: sizes,
                runs,
                scalingPoints,
                complexityAnalysis,
                memoryReport,
                summary: this.formatAsciiSummary(scalingPoints)
            };
        },

        /**
         * Format ASCII scaling visualization for console or reports
         */
        formatAsciiSummary(scalingPoints = []) {
            if (!scalingPoints || scalingPoints.length === 0) return 'No benchmark points recorded.';
            const maxMs = Math.max(...scalingPoints.map(p => p.durationMs), 1);
            const maxBarLen = 25;

            const lines = [];
            lines.push('DATASET SIZE  | LATENCY (ms) | SCALING VISUALIZATION');
            lines.push('--------------+--------------+--------------------------');
            scalingPoints.forEach(pt => {
                const barLen = Math.max(1, Math.round((pt.durationMs / maxMs) * maxBarLen));
                const bar = '█'.repeat(barLen);
                const sizeStr = String(pt.n + ' rows').padEnd(13, ' ');
                const msStr = String(pt.durationMs + ' ms').padEnd(12, ' ');
                lines.push(`${sizeStr} | ${msStr} | ${bar}`);
            });

            return lines.join('\n');
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.BenchmarkEngine = BenchmarkEngine;

})(typeof window !== 'undefined' ? window : global);
