/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/machine-learning/model-comparison.js
 * ============================================================================
 * Benchmarks candidate machine learning models on validation splits:
 * - Ranks models strictly by out-of-sample validation metrics (never training performance)
 * - Identifies best model and constructs evidence-based selection reasoning
 * - Exposes explicit model limitations and caveats
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ModelComparison = {
        /**
         * Compare candidate models and determine the winning model
         * 
         * @param {Object} params
         * @param {string} params.taskType 'regression' | 'binary_classification' | 'multiclass_classification'
         * @param {Array<Object>} params.modelRuns Array of { candidate, model, trainMetrics, valMetrics }
         * @param {number} [params.sampleSize] Total training rows
         * @param {number} [params.featureCount] Number of features
         * @returns {Object} Comparison summary and ranked leaderboard
         */
        compare({ taskType, modelRuns, sampleSize = 100, featureCount = 5 }) {
            if (!Array.isArray(modelRuns) || modelRuns.length === 0) {
                return {
                    leaderboard: [],
                    winner: null,
                    reasoning: ['No models available for comparison'],
                    limitations: ['Evaluation aborted due to lack of trained candidates']
                };
            }

            const isRegression = taskType === 'regression';

            // Sort leaderboard
            const sortedRuns = [...modelRuns].sort((a, b) => {
                if (isRegression) {
                    // Lowest RMSE wins
                    return (a.valMetrics.rmse || 999999) - (b.valMetrics.rmse || 999999);
                } else {
                    // Highest Macro F1 wins (fallback to balanced accuracy, then accuracy)
                    const scoreA = a.valMetrics.macroF1 || a.valMetrics.balancedAccuracy || a.valMetrics.accuracy || 0;
                    const scoreB = b.valMetrics.macroF1 || b.valMetrics.balancedAccuracy || b.valMetrics.accuracy || 0;
                    return scoreB - scoreA;
                }
            });

            const leaderboard = sortedRuns.map((run, idx) => ({
                rank: idx + 1,
                name: run.candidate.name,
                id: run.candidate.id,
                type: run.candidate.type,
                trainTimeMs: run.trainTimeMs || 8,
                valScore: isRegression ? run.valMetrics.rmse : (run.valMetrics.macroF1 || run.valMetrics.accuracy),
                metrics: run.valMetrics,
                featureImportances: run.model.featureImportances || []
            }));

            const winner = sortedRuns[0];
            const reasoning = [];
            if (isRegression) {
                reasoning.push(`"${winner.candidate.name}" ranked #1 based on lowest validation RMSE (${winner.valMetrics.rmse.toFixed(2)}) on held-out validation data.`);
                reasoning.push(`Achieved validation R² = ${winner.valMetrics.r2.toFixed(3)} and MAE = ${winner.valMetrics.mae.toFixed(2)}.`);
            } else {
                const f1 = winner.valMetrics.macroF1 || winner.valMetrics.f1;
                reasoning.push(`"${winner.candidate.name}" ranked #1 based on superior validation Macro F1 score (${(f1 * 100).toFixed(1)}%).`);
                reasoning.push(`Achieved validation accuracy = ${(winner.valMetrics.accuracy * 100).toFixed(1)}% and balanced accuracy = ${(winner.valMetrics.balancedAccuracy * 100).toFixed(1)}%.`);
            }

            // Deduce real limitations
            const limitations = [];
            if (sampleSize < 30) {
                limitations.push(`Small sample size (n = ${sampleSize}); model parameters have elevated estimation variance.`);
            }
            if (featureCount > sampleSize) {
                limitations.push(`High dimensionality risk: feature count (${featureCount}) exceeds sample size (${sampleSize}).`);
            }
            if (!isRegression && winner.valMetrics.classDistribution) {
                const counts = Object.values(winner.valMetrics.classDistribution);
                const maxC = Math.max(...counts);
                const minC = Math.min(...counts);
                if (maxC > minC * 3) {
                    limitations.push('Class imbalance detected; minority classes may have lower recall than majority classes.');
                }
            }

            return {
                leaderboard,
                winner: {
                    name: winner.candidate.name,
                    id: winner.candidate.id,
                    trainTimeMs: winner.trainTimeMs || 8,
                    metrics: winner.valMetrics,
                    model: winner.model,
                    featureImportances: winner.model.featureImportances || []
                },
                reasoning,
                limitations
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.ModelComparison = ModelComparison;

})(typeof window !== 'undefined' ? window : global);
