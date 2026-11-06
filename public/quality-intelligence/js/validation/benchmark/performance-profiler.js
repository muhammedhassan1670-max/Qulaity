/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/benchmark/performance-profiler.js
 * ============================================================================
 * High-Precision Performance Profiler:
 * Measures exact execution latencies for each pipeline stage:
 * - Profiling
 * - Intelligence Planning
 * - Advanced Analytics & ML
 * - Decision Intelligence
 * - Autonomous Monitoring
 * - Intelligence Workspace
 * - Copilot Query Execution
 * Uses high-resolution timers (performance.now()) with sub-millisecond precision.
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

    const PerformanceProfiler = {
        /**
         * Measure execution time of a synchronous or asynchronous task
         * @param {string} taskName
         * @param {Function} taskFn
         * @returns {Object} { result: any, durationMs: number, taskName: string }
         */
        profileTask(taskName, taskFn) {
            const start = getNow();
            let result = null;
            let error = null;

            try {
                result = taskFn();
            } catch (err) {
                error = err;
            }

            const end = getNow();
            const durationMs = Number((end - start).toFixed(2));

            if (error) {
                throw error;
            }

            return {
                taskName,
                durationMs,
                result
            };
        },

        /**
         * Benchmark an end-to-end UDIP analytical pipeline
         * @param {Object} dataset
         * @param {Object} engines
         * @returns {Object} Timings breakdown
         */
        profileFullPipeline(dataset, engines = {}) {
            const timings = {};
            let currentProfile = null;
            let currentPlan = null;
            let currentAnalytics = null;
            let currentDecision = null;
            let currentAutonomous = null;
            let currentWorkspace = null;

            // 1. Profiling
            if (engines.Profiler) {
                const pRes = this.profileTask('Profiling', () => engines.Profiler.profileDataset(dataset));
                timings.profilingMs = pRes.durationMs;
                currentProfile = pRes.result;
            }

            // 2. Planning
            if (engines.IntelligenceEngine && currentProfile) {
                const plRes = this.profileTask('Planning', () => engines.IntelligenceEngine.generatePlan(currentProfile, dataset));
                timings.planningMs = plRes.durationMs;
                currentPlan = plRes.result;
            }

            // 3. Analytics & ML
            if (engines.AnalyticsEngine && currentProfile && currentPlan) {
                const aRes = this.profileTask('Analytics & ML', () => engines.AnalyticsEngine.run({
                    data: dataset,
                    profile: currentProfile,
                    analysisPlan: currentPlan
                }));
                timings.analyticsMs = aRes.durationMs;
                currentAnalytics = aRes.result;
            }

            // 4. Decision Intelligence
            if (engines.DecisionEngine && currentProfile && currentPlan) {
                const dRes = this.profileTask('Decision Intelligence', () => engines.DecisionEngine.run({
                    dataset,
                    profile: currentProfile,
                    analysisPlan: currentPlan,
                    analytics: currentAnalytics
                }));
                timings.decisionMs = dRes.durationMs;
                currentDecision = dRes.result;
            }

            // 5. Autonomous Intelligence
            if (engines.AutonomousEngine && currentProfile && currentPlan) {
                const auRes = this.profileTask('Autonomous Intelligence', () => engines.AutonomousEngine.run({
                    dataset,
                    profile: currentProfile,
                    analysisPlan: currentPlan,
                    analytics: currentAnalytics,
                    decisionIntelligence: currentDecision
                }));
                timings.autonomousMs = auRes.durationMs;
                currentAutonomous = auRes.result;
            }

            // 6. Workspace
            if (engines.WorkspaceEngine && currentProfile && currentPlan) {
                const wRes = this.profileTask('Workspace Generation', () => engines.WorkspaceEngine.run({
                    dataset,
                    profile: currentProfile,
                    analysisPlan: currentPlan,
                    analytics: currentAnalytics,
                    decisionIntelligence: currentDecision,
                    autonomousIntelligence: currentAutonomous
                }));
                timings.workspaceMs = wRes.durationMs;
                currentWorkspace = wRes.result;
            }

            const totalMs = Object.values(timings).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
            timings.totalPipelineMs = Number(totalMs.toFixed(2));

            return {
                rowCount: dataset?.rowCount || 0,
                columnCount: dataset?.columnCount || 0,
                timings,
                outputs: {
                    profile: currentProfile,
                    analysisPlan: currentPlan,
                    analytics: currentAnalytics,
                    decisionIntelligence: currentDecision,
                    autonomousIntelligence: currentAutonomous,
                    workspace: currentWorkspace
                }
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.PerformanceProfiler = PerformanceProfiler;

})(typeof window !== 'undefined' ? window : global);
