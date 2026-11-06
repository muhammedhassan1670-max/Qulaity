/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: benchmark/performance/bottleneck-detector.js
 * ============================================================================
 * Pipeline Bottleneck Detector:
 * Identifies and ranks the most computationally intensive pipeline stages:
 * - Absolute runtime (ms)
 * - Relative runtime share (% of total pipeline)
 * - Stage rank ordering
 *
 * Formulates empirical optimization rules based strictly on measured costs:
 * - Profiling dominance -> optimize distribution histogram bucketing
 * - Relationship dominance -> optimize pairwise covariance matrix computation
 * - ML dominance -> sub-sample for initial model screening or prune hyperparameter grid
 * - Copilot retrieval dominance -> optimize vector/keyword index and context pruning
 * ============================================================================
 */

(function (window) {
    'use strict';

    const BottleneckDetector = {
        /**
         * Detect and rank bottlenecks from pipeline stage records
         * @param {Array<Object>} stageRecords Array of { stage, durationMs }
         * @returns {Object} Bottleneck analysis report
         */
        detectBottlenecks(stageRecords = []) {
            if (!Array.isArray(stageRecords) || stageRecords.length === 0) {
                return {
                    totalRuntimeMs: 0,
                    rankedStages: [],
                    primaryBottleneck: null,
                    recommendations: []
                };
            }

            const totalMs = stageRecords.reduce((acc, s) => acc + (s.durationMs || 0), 0);
            const safeTotal = Math.max(0.001, totalMs);

            const ranked = stageRecords.map(s => {
                const dur = s.durationMs || 0;
                const pct = Number(((dur / safeTotal) * 100).toFixed(1));
                return {
                    stage: s.stage,
                    durationMs: dur,
                    percentage: pct,
                    status: s.status || 'SUCCESS'
                };
            }).sort((a, b) => b.durationMs - a.durationMs);

            // Assign ranks
            ranked.forEach((item, idx) => {
                item.rank = idx + 1;
            });

            const primary = ranked[0] || null;
            const recommendations = [];

            if (primary && primary.percentage > 35) {
                const stageName = primary.stage.toLowerCase();
                if (stageName.includes('machine learning') || stageName.includes('ml')) {
                    recommendations.push({
                        stage: primary.stage,
                        finding: `Machine Learning accounts for ${primary.percentage}% of total execution time`,
                        action: 'Apply progressive sub-sampling for initial model screening and early stopping on cross-validation.'
                    });
                } else if (stageName.includes('analytics') || stageName.includes('relationship')) {
                    recommendations.push({
                        stage: primary.stage,
                        finding: `Advanced Analytics accounts for ${primary.percentage}% of total runtime`,
                        action: 'Vectorize pairwise correlation calculations and filter zero-variance columns prior to matrix generation.'
                    });
                } else if (stageName.includes('profiling')) {
                    recommendations.push({
                        stage: primary.stage,
                        finding: `Data Profiling accounts for ${primary.percentage}% of total runtime`,
                        action: 'Consolidate single-pass quantile estimation and optimize type inference passes.'
                    });
                } else if (stageName.includes('copilot')) {
                    recommendations.push({
                        stage: primary.stage,
                        finding: `Copilot query execution accounts for ${primary.percentage}% of runtime`,
                        action: 'Pre-index analytical findings and cache recurring semantic intent patterns.'
                    });
                } else {
                    recommendations.push({
                        stage: primary.stage,
                        finding: `${primary.stage} is the primary computational bottleneck (${primary.percentage}%)`,
                        action: 'Review inner algorithm loops and minimize redundant deep object cloning.'
                    });
                }
            }

            return {
                totalRuntimeMs: Number(totalMs.toFixed(2)),
                rankedStages: ranked,
                primaryBottleneck: primary ? primary.stage : null,
                primarySharePercentage: primary ? primary.percentage : 0,
                recommendations
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Benchmark = window.UDIP.Benchmark || {};
    window.UDIP.Benchmark.BottleneckDetector = BottleneckDetector;

})(typeof window !== 'undefined' ? window : global);
