/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/insights/insight-engine.js
 * ============================================================================
 * Synthesizes computed analytical results across all sub-engines into
 * explainable, evidence-backed insights:
 * - Trends, relationships, distribution shapes, anomalies, forecasts, and models
 * - Prioritized by InsightRanker into Critical, High, Medium, and Low
 * - Zero hallucinated or unsupported statements
 * ============================================================================
 */

(function (window) {
    'use strict';

    const InsightEngine = {
        /**
         * Synthesize analytical results into ranked insights
         * 
         * @param {Object} params
         * @param {Object} params.exploratory
         * @param {Object} params.statistics
         * @param {Object} params.anomalies
         * @param {Object} params.forecasting
         * @param {Object} params.machineLearning
         * @param {Object} params.analysisPlan
         * @returns {Array<Object>} Ranked insights
         */
        synthesize({ exploratory, statistics, anomalies, forecasting, machineLearning, analysisPlan }) {
            const rawInsights = [];
            const Ranker = window.UDIP && window.UDIP.InsightRanker;

            // 1. Trend Insights
            if (exploratory?.trends?.length) {
                exploratory.trends.forEach(tr => {
                    if (tr.hasTrend) {
                        const isInc = tr.direction === 'increasing';
                        rawInsights.push({
                            category: 'trend',
                            importance: tr.strength >= 60 ? 'high' : 'medium',
                            title: `${isInc ? 'Upward' : 'Downward'} Trend Detected`,
                            insight: `Column "${tr.numericColumn}" exhibits a persistent ${tr.direction} trajectory across ${tr.observations} chronological time steps.`,
                            evidence: `Slope = ${tr.slope > 0 ? '+' : ''}${tr.slope.toFixed(4)} per step (R² = ${tr.r2.toFixed(2)}, strength = ${tr.strength}%)`,
                            confidence: tr.confidence
                        });
                    }
                });
            }

            // 2. Strong Relationship Insights
            if (exploratory?.relationships?.length) {
                const strong = exploratory.relationships.filter(r => Math.abs(r.correlation) >= 0.7);
                strong.slice(0, 3).forEach(rel => {
                    const isPos = rel.correlation > 0;
                    rawInsights.push({
                        category: 'relationship',
                        importance: rel.isRedundant ? 'critical' : 'high',
                        title: rel.isRedundant ? 'Near-Redundant Variable Pair' : 'Strong Statistical Association',
                        insight: `A strong ${isPos ? 'positive' : 'inverse'} relationship exists between "${rel.col1}" and "${rel.col2}".`,
                        evidence: `Pearson r = ${rel.correlation.toFixed(3)} (${rel.isRedundant ? 'Redundant |r| >= 0.95' : 'Strong correlation'})`,
                        confidence: 90
                    });
                });
            }

            // 3. Statistical Test Insights
            if (statistics?.tests?.length) {
                statistics.tests.filter(t => t.isSignificant).slice(0, 3).forEach(test => {
                    rawInsights.push({
                        category: 'statistics',
                        importance: test.effectSize?.magnitude === 'large' ? 'high' : 'medium',
                        title: `Statistically Significant Difference: ${test.test}`,
                        insight: test.interpretation,
                        evidence: `Statistic = ${test.statistic.toFixed(2)}, p-value = ${test.pValue.toFixed(4)}, Effect Size = ${test.effectSize?.value || 'N/A'} (${test.effectSize?.magnitude || 'standard'})`,
                        confidence: test.confidence
                    });
                });
            }

            // 4. Anomaly Insights
            if (anomalies?.columns?.length) {
                anomalies.columns.filter(c => c.anomalyCount > 0).forEach(anom => {
                    rawInsights.push({
                        category: 'anomaly',
                        importance: anom.anomalyPercentage >= 5 ? 'high' : 'medium',
                        title: `Potential Anomalies in "${anom.column}"`,
                        insight: `${anom.anomalyCount} observation(s) (${anom.anomalyPercentage}% of data) fall outside robust boundaries using ${anom.method}.`,
                        evidence: `Threshold = ${anom.threshold} via ${anom.method}`,
                        confidence: anom.confidence
                    });
                });
            }

            // 5. Forecasting Insights
            if (forecasting?.status === 'completed' && forecasting.selectedModel) {
                rawInsights.push({
                    category: 'forecast',
                    importance: 'high',
                    title: `Forecast Benchmark: ${forecasting.selectedModel}`,
                    insight: `Time-series projection generated for "${forecasting.target}" over a ${forecasting.horizon}-step horizon.`,
                    evidence: `Validated via chronological split: RMSE = ${forecasting.models[0]?.rmse.toFixed(2)}, MAE = ${forecasting.models[0]?.mae.toFixed(2)}`,
                    confidence: forecasting.confidence
                });
            }

            // 6. Machine Learning Model Insights
            if (machineLearning?.status === 'completed' && machineLearning.winner) {
                const w = machineLearning.winner;
                const isReg = machineLearning.taskType === 'regression';
                const scoreText = isReg
                    ? `Validation RMSE = ${w.metrics.rmse.toFixed(2)}, R² = ${w.metrics.r2.toFixed(3)}`
                    : `Validation Macro F1 = ${(w.metrics.macroF1 * 100).toFixed(1)}%, Accuracy = ${(w.metrics.accuracy * 100).toFixed(1)}%`;

                rawInsights.push({
                    category: 'model',
                    importance: 'high',
                    title: `Optimal Model: ${w.name}`,
                    insight: `Autonomous benchmarking selected "${w.name}" as the superior candidate for predicting "${machineLearning.target}".`,
                    evidence: scoreText,
                    confidence: machineLearning.confidence
                });

                // Top Feature Driver Insight
                if (machineLearning.featureImportance?.length) {
                    const topFeat = machineLearning.featureImportance[0];
                    if (topFeat && topFeat.importance > 0.2) {
                        rawInsights.push({
                            category: 'feature_importance',
                            importance: 'high',
                            title: `Primary Predictive Driver: ${topFeat.feature}`,
                            insight: `"${topFeat.feature}" demonstrates the strongest relative contribution (${(topFeat.importance * 100).toFixed(1)}%) in predicting "${machineLearning.target}".`,
                            evidence: `Normalized importance score = ${topFeat.importance.toFixed(3)} (non-causal association)`,
                            confidence: machineLearning.confidence
                        });
                    }
                }
            }

            // 7. Group Differences Insight
            if (exploratory?.groups?.length) {
                exploratory.groups.slice(0, 2).forEach(g => {
                    rawInsights.push({
                        category: 'distribution',
                        importance: 'medium',
                        title: `Group Variance: ${g.categoryColumn} → ${g.numericColumn}`,
                        insight: g.interpretation,
                        evidence: `Relative spread = ${g.relativeDifferencePct}% between "${g.maxMeanGroup}" and "${g.minMeanGroup}"`,
                        confidence: 80
                    });
                });
            }

            // Rank all collected insights
            return Ranker ? Ranker.rank(rawInsights) : rawInsights;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.InsightEngine = InsightEngine;

})(typeof window !== 'undefined' ? window : global);
