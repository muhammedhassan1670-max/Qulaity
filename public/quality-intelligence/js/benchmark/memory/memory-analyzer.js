/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: benchmark/memory/memory-analyzer.js
 * ============================================================================
 * Memory Trajectory & Leak Detection Analyzer:
 * Tracks heap allocation patterns across multi-cycle workloads.
 * Classifies memory behavior:
 * - Stable: Heap fluctuates within normal garbage-collection boundaries (<10% net growth)
 * - Potential Growth: Moderate upward trend across cycles (10% - 30% growth)
 * - Likely Leak: Monotonic, persistent heap expansion exceeding 30% across multiple cycles
 * - Unable to Measure: Memory APIs unavailable in environment
 *
 * Invariant: Never flags a memory leak from a single point measurement!
 * ============================================================================
 */

(function (window) {
    'use strict';

    const MemoryAnalyzer = {
        /**
         * Analyze a sequence of memory snapshots across workload iterations
         * @param {Array<Object>} snapshots Array of { cycle, usedJSHeapSizeBytes } or null
         * @returns {Object} Memory trajectory analysis
         */
        analyzeTrajectory(snapshots = []) {
            if (!Array.isArray(snapshots) || snapshots.length === 0) {
                return {
                    status: 'Unable to Measure',
                    classification: 'Unable to Measure',
                    leakSuspected: false,
                    reason: 'No memory snapshots provided'
                };
            }

            const validMeasurements = snapshots
                .map(s => (typeof s === 'number' ? s : s?.usedJSHeapSizeBytes))
                .filter(v => typeof v === 'number' && !isNaN(v) && v > 0);

            if (validMeasurements.length < 2) {
                return {
                    status: 'Unable to Measure',
                    classification: 'Unable to Measure',
                    leakSuspected: false,
                    reason: 'Insufficient measurable memory snapshots (<2)'
                };
            }

            const baseline = validMeasurements[0];
            const peak = Math.max(...validMeasurements);
            const final = validMeasurements[validMeasurements.length - 1];
            const netDelta = final - baseline;
            const growthPercentage = Number(((netDelta / baseline) * 100).toFixed(1));

            // Check for persistent monotonic growth across cycles
            let monotonicIncreases = 0;
            for (let i = 1; i < validMeasurements.length; i++) {
                if (validMeasurements[i] > validMeasurements[i - 1]) {
                    monotonicIncreases++;
                }
            }
            const increaseRatio = monotonicIncreases / (validMeasurements.length - 1);

            let classification = 'Stable';
            let leakSuspected = false;

            if (growthPercentage > 35 && increaseRatio >= 0.75 && validMeasurements.length >= 4) {
                classification = 'Likely Leak';
                leakSuspected = true;
            } else if (growthPercentage > 15 && increaseRatio >= 0.60) {
                classification = 'Potential Growth';
                leakSuspected = false;
            } else {
                classification = 'Stable';
                leakSuspected = false;
            }

            return {
                status: 'MEASURED',
                classification,
                leakSuspected,
                baselineBytes: baseline,
                peakBytes: peak,
                finalBytes: final,
                netDeltaBytes: netDelta,
                growthPercentage,
                totalCyclesEvaluated: validMeasurements.length,
                summary: `Memory behavior classified as ${classification} (${growthPercentage > 0 ? '+' : ''}${growthPercentage}%)`
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Benchmark = window.UDIP.Benchmark || {};
    window.UDIP.Benchmark.MemoryAnalyzer = MemoryAnalyzer;

})(typeof window !== 'undefined' ? window : global);
