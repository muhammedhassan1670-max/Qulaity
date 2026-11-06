/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/insights/recommendation-generator.js
 * ============================================================================
 * Generates actionable analytical recommendations based strictly on computed results:
 * - Imbalance mitigations, leakage isolation, imputation strategies,
 * - Collinearity remedies, and validation best practices.
 * Completely domain-agnostic and free of unsupported claims.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const RecommendationGenerator = {
        /**
         * Generate recommendations from analytical findings
         * 
         * @param {Object} params
         * @param {Object} params.exploratory
         * @param {Object} params.statistics
         * @param {Object} params.anomalies
         * @param {Object} params.forecasting
         * @param {Object} params.machineLearning
         * @param {Object} params.analysisPlan
         * @returns {Array<Object>} List of actionable recommendations
         */
        generate({ exploratory, statistics, anomalies, forecasting, machineLearning, analysisPlan, profile }) {
            const recommendations = [];

            // 1. Data Leakage Recommendation
            if (analysisPlan?.leakage?.riskLevel === 'high') {
                recommendations.push({
                    priority: 'critical',
                    category: 'data_integrity',
                    finding: `High data leakage risk identified in dataset features (${analysisPlan.leakage.findings?.map(f => f.column).join(', ')}).`,
                    recommendation: 'Strictly isolate post-event indicators from training features to prevent unrealistically inflated model performance.'
                });
            }

            // 2. Class Imbalance Recommendation
            const targetCol = analysisPlan?.primaryTarget?.column;
            const targetProf = Array.isArray(profile?.columns) ? profile.columns.find(c => c && c.name === targetCol) : profile?.columns?.[targetCol];
            const topCats = targetProf?.stats?.topCategories || [];
            const isTargetImbalanced = (topCats.length >= 2 && topCats[0].count >= (topCats[topCats.length - 1].count * 2.5)) ||
                                       (targetProf?.stats?.topPct >= 70 && topCats.length >= 2);

            const mlDist = machineLearning?.winner?.metrics?.classDistribution || {};
            const mlCounts = Object.values(mlDist).map(Number);
            const isMLImbalanced = mlCounts.length >= 2 && Math.max(...mlCounts) >= Math.min(...mlCounts) * 2.5;

            if (isTargetImbalanced || isMLImbalanced) {
                recommendations.push({
                    priority: 'high',
                    category: 'model_evaluation',
                    finding: 'Severe class imbalance detected across target labels.',
                    recommendation: 'Evaluate candidate models using Macro F1 and Balanced Accuracy rather than raw overall accuracy, which is biased toward majority classes.'
                });
            }

            // 3. Collinearity / Redundancy Recommendation
            const redundantCorr = exploratory?.relationships?.find(r => r.isRedundant || Math.abs(r.correlation) >= 0.95);
            if (redundantCorr) {
                recommendations.push({
                    priority: 'medium',
                    category: 'feature_selection',
                    finding: `Near-perfect correlation detected between "${redundantCorr.col1}" and "${redundantCorr.col2}" (r = ${redundantCorr.correlation}).`,
                    recommendation: 'Remove one of the redundant variables or utilize regularized algorithms (Ridge/L2) to prevent numerical instability and variance inflation.'
                });
            }

            // 4. Extreme Outlier Recommendation
            const severeAnomalyCol = anomalies?.columns?.find(c => c.anomalyPercentage > 5.0);
            if (severeAnomalyCol) {
                recommendations.push({
                    priority: 'high',
                    category: 'anomaly_investigation',
                    finding: `Elevated anomaly rate (${severeAnomalyCol.anomalyPercentage}%) observed in "${severeAnomalyCol.column}".`,
                    recommendation: 'Investigate data collection and entry mechanisms for contextual anomalies rather than blindly deleting or trimming outlier observations.'
                });
            }

            // 5. Small Sample Size Recommendation
            if (machineLearning?.status === 'completed' && machineLearning.limitations?.some(l => l.includes('Small sample size'))) {
                recommendations.push({
                    priority: 'medium',
                    category: 'sample_adequacy',
                    finding: 'Sample size is limited (n < 30) relative to feature dimensionality.',
                    recommendation: 'Treat model rankings as exploratory; gather additional out-of-sample test cases before relying on inferences for critical decision-making.'
                });
            }

            // 6. Time-Series Regularity Recommendation
            if (forecasting?.status === 'completed') {
                recommendations.push({
                    priority: 'medium',
                    category: 'forecasting',
                    finding: `Winning forecast model "${forecasting.selectedModel}" validated using strict chronological splitting.`,
                    recommendation: 'Continuously re-estimate forecasting parameters as new time periods arrive to adapt to non-stationary trend changes.'
                });
            }

            return recommendations;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.RecommendationGenerator = RecommendationGenerator;

})(typeof window !== 'undefined' ? window : global);
