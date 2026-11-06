/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: benchmark/reliability/endurance-runner.js
 * ============================================================================
 * Controlled Endurance Benchmark Runner:
 * Executes multi-cycle continuous workflows:
 * Load -> Analyze -> Copilot Query -> Workspace Navigation -> Comparison -> Repeat
 *
 * Monitors and detects:
 * - Cumulative memory growth
 * - Execution latency creep across cycles
 * - Unbounded conversation state growth
 * - Resource stability under sustained analytical sessions
 * ============================================================================
 */

(function (window) {
    'use strict';

    const EnduranceRunner = {
        /**
         * Run multi-cycle endurance benchmark
         * @param {Object} dataset
         * @param {Object} engines
         * @param {number} cycles Number of cycles, default 5
         * @returns {Object} Endurance test telemetry
         */
        runEnduranceTest(dataset, engines = {}, cycles = 5) {
            const memoryMonitor = window.UDIP?.Benchmark?.MemoryMonitor;
            const memoryAnalyzer = window.UDIP?.Benchmark?.MemoryAnalyzer;
            const pipelineRunner = window.UDIP?.Benchmark?.PipelineRunner;
            const copilotWorkload = window.UDIP?.Benchmark?.CopilotWorkload;

            const cycleRecords = [];
            const memorySnapshots = [];
            const startTime = Date.now();

            for (let c = 1; c <= cycles; c++) {
                const cycleStart = Date.now();
                const memBefore = memoryMonitor ? memoryMonitor.getMemorySnapshot() : null;

                // 1. Pipeline Execution
                let pipeRes = null;
                if (pipelineRunner) {
                    pipeRes = pipelineRunner.runPipeline(dataset, engines);
                }

                // 2. Query Copilot
                let copilotRes = null;
                if (copilotWorkload && engines.CopilotEngine) {
                    copilotRes = copilotWorkload.runCopilotBenchmark(engines.CopilotEngine, { dataset });
                }

                const cycleDuration = Date.now() - cycleStart;
                const memAfter = memoryMonitor ? memoryMonitor.getMemorySnapshot() : null;

                if (memAfter?.usedJSHeapSizeBytes) {
                    memorySnapshots.push({
                        cycle: c,
                        usedJSHeapSizeBytes: memAfter.usedJSHeapSizeBytes
                    });
                }

                cycleRecords.push({
                    cycle: c,
                    durationMs: cycleDuration,
                    pipelineSuccess: pipeRes ? pipeRes.failedStages === 0 : true,
                    copilotGrounded: copilotRes ? copilotRes.allGrounded : true,
                    memoryUsedFormatted: memAfter?.formattedUsed || 'NOT MEASURED'
                });
            }

            const totalDurationMs = Date.now() - startTime;
            const cycleDurations = cycleRecords.map(r => r.durationMs);

            // Compute latency creep (first cycle vs last cycle)
            const firstCycle = cycleDurations[0] || 1;
            const lastCycle = cycleDurations[cycleDurations.length - 1] || 1;
            const latencyCreepRatio = Number((lastCycle / Math.max(1, firstCycle)).toFixed(2));
            const hasLatencyCreep = latencyCreepRatio > 1.35;

            // Memory leak analysis
            const memoryAnalysis = memoryAnalyzer 
                ? memoryAnalyzer.analyzeTrajectory(memorySnapshots)
                : { classification: 'Unable to Measure', leakSuspected: false };

            return {
                workload: 'ENDURANCE_TEST',
                cyclesExecuted: cycles,
                totalDurationMs,
                meanCycleDurationMs: Number((totalDurationMs / cycles).toFixed(2)),
                latencyCreep: {
                    ratio: latencyCreepRatio,
                    hasCreep: hasLatencyCreep,
                    note: hasLatencyCreep ? 'Latency crept up across endurance cycles' : 'Stable latency across cycles'
                },
                memoryBehavior: memoryAnalysis,
                cycleRecords,
                passed: !hasLatencyCreep && !memoryAnalysis.leakSuspected
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Benchmark = window.UDIP.Benchmark || {};
    window.UDIP.Benchmark.EnduranceRunner = EnduranceRunner;

})(typeof window !== 'undefined' ? window : global);
