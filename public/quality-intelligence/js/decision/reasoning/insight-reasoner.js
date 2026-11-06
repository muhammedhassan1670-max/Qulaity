/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: decision/reasoning/insight-reasoner.js
 * ============================================================================
 * Converts multi-source empirical evidence into structured, logical reasoning.
 * Follows the strict epistemological hierarchy:
 * 
 *    Observation → Evidence → Interpretation → Implication → Potential Decision
 * 
 * Strict Constraint:
 * Never jumps from correlation to causation.
 * Employs cautious, associative formulations ("X is strongly associated with Y
 * and may be a contributing factor").
 * ============================================================================
 */

(function (window) {
    'use strict';

    const InsightReasoner = {
        /**
         * Synthesize structured reasoning insights from fused evidence
         * 
         * @param {Object} params
         * @param {Array<Object>} params.evidenceItems
         * @param {Object} params.analysisPlan
         * @param {Object} params.analytics
         * @param {Object} [params.traceRegistry]
         * @returns {Array<Object>} List of structured reasoning insights
         */
        synthesize({ evidenceItems = [], analysisPlan = {}, analytics = {}, traceRegistry = null }) {
            const insights = [];
            let counter = 1;

            const nextId = () => `INS-${String(counter++).padStart(3, '0')}`;

            // Helper to link trace if registry provided
            const registerInsight = (ins, evList) => {
                insights.push(ins);
                if (traceRegistry && typeof traceRegistry.addTrace === 'function') {
                    traceRegistry.addTrace(ins.id, 'insight', evList, `${ins.title}: ${ins.interpretation}`);
                }
            };

            // -----------------------------------------------------------------
            // 1. Primary Predictive Driver Insight
            // -----------------------------------------------------------------
            const featImpEv = evidenceItems.filter(e => e.type === 'feature_importance');
            const modelPerfEv = evidenceItems.find(e => e.type === 'model_benchmark');
            const targetCol = analysisPlan?.primaryTarget?.column;

            if (featImpEv.length > 0 && targetCol) {
                const topFeat = featImpEv[0];
                const topFeatCol = topFeat.supportingColumns[0];
                const relEv = evidenceItems.find(e => e.type === 'correlation' && e.supportingColumns.includes(topFeatCol));
                const statEv = evidenceItems.find(e => e.type === 'statistical_significance' && e.supportingColumns.includes(topFeatCol));

                const supporting = [topFeat, modelPerfEv, relEv, statEv].filter(Boolean);
                const isStrong = supporting.length >= 2;

                registerInsight({
                    id: nextId(),
                    title: `Key Predictive Driver Identified: "${topFeatCol}"`,
                    observation: `Feature importance scoring ranks "${topFeatCol}" as the foremost predictive contributor (${topFeat.value}% relative weight) toward "${targetCol}".`,
                    evidence: supporting.map(e => ({ id: e.id, source: e.source, metric: e.metric, value: e.value })),
                    interpretation: `Empirical patterns indicate that variations in "${topFeatCol}" are strongly associated with changes in "${targetCol}" across validated observations.`,
                    implication: `Strategic initiatives aimed at influencing "${targetCol}" should treat "${topFeatCol}" as a primary candidate lever for optimization and monitoring.`,
                    potentialDecision: `Prioritize tracking and controlled testing on "${topFeatCol}" to evaluate practical impact on "${targetCol}".`,
                    confidence: isStrong ? 85 : 70,
                    severity: 'major',
                    priority: 'high',
                    limitations: [
                        'Observational relationship: does not prove direct causality.',
                        'Requires controlled A/B testing or experimental isolation to verify causal responsiveness.'
                    ]
                }, supporting);
            }

            // -----------------------------------------------------------------
            // 2. Statistical Segment Divergence Insight
            // -----------------------------------------------------------------
            const statSigEvs = evidenceItems.filter(e => e.type === 'statistical_significance' && e.value < 0.05);
            statSigEvs.slice(0, 2).forEach(sev => {
                const vars = sev.supportingColumns || [];
                const varLabel = vars.join(' and ') || 'target variables';

                registerInsight({
                    id: nextId(),
                    title: `Statistically Significant Divergence across ${varLabel}`,
                    observation: `Hypothesis testing confirms a non-random distribution difference across ${varLabel} (p = ${sev.value}).`,
                    evidence: [sev],
                    interpretation: `The observed difference between subgroups has an extremely low probability (< 5%) of occurring solely due to random sampling fluctuation.`,
                    implication: `A uniform, one-size-fits-all policy or model assumption across these segments is empirically sub-optimal.`,
                    potentialDecision: `Formulate differentiated sub-strategies or segmented modeling thresholds tailored to individual segment profiles.`,
                    confidence: 88,
                    severity: 'moderate',
                    priority: 'high',
                    limitations: [
                        'Statistical significance confirms non-randomness, but does not dictate business substantive significance on its own.'
                    ]
                }, [sev]);
            });

            // -----------------------------------------------------------------
            // 3. Temporal Trajectory / Trend Insight
            // -----------------------------------------------------------------
            const trendEv = evidenceItems.find(e => e.type === 'temporal_trend');
            if (trendEv) {
                const isUp = trendEv.direction === 'increasing';
                const forecastEv = evidenceItems.find(e => e.type === 'predictive_forecast');
                const supporting = [trendEv, forecastEv].filter(Boolean);

                registerInsight({
                    id: nextId(),
                    title: `Sustained ${isUp ? 'Upward' : 'Downward'} Temporal Trajectory`,
                    observation: `Historical time-series analysis reveals a consistent ${trendEv.direction} trajectory (slope = ${trendEv.value}).`,
                    evidence: supporting.map(e => ({ id: e.id, source: e.source, metric: e.metric, value: e.value })),
                    interpretation: `The underlying metrics exhibit persistent momentum over time rather than stationary mean-reverting behavior.`,
                    implication: `Static planning baselines will quickly become obsolete if momentum persists into future periods.`,
                    potentialDecision: `Incorporate dynamic trend adjustments and continuous forecast parameter updates into planning schedules.`,
                    confidence: 80,
                    severity: 'moderate',
                    priority: 'medium',
                    limitations: [
                        'External regime changes or macroeconomic saturation points can disrupt linear momentum.'
                    ]
                }, supporting);
            }

            // -----------------------------------------------------------------
            // 4. Anomaly Rate & Process Stability Insight
            // -----------------------------------------------------------------
            const anomEv = evidenceItems.find(e => e.type === 'anomaly_rate');
            if (anomEv) {
                const colName = anomEv.supportingColumns[0] || 'critical metric';
                registerInsight({
                    id: nextId(),
                    title: `Elevated Outlier Concentration in "${colName}"`,
                    observation: `Adaptive anomaly detection identified ${anomEv.value}% of records in "${colName}" as severe distributional departures.`,
                    evidence: [anomEv],
                    interpretation: `Distributional tails show significant variance that could signal measurement errors, rare extreme events, or unmodeled sub-regimes.`,
                    implication: `Unchecked outlier values risk distorting model training parameters and skewing decision thresholds.`,
                    potentialDecision: `Implement contextual outlier auditing and robust estimation methods (e.g. median/MAD or L1 regularized models).`,
                    confidence: 85,
                    severity: anomEv.value > 5.0 ? 'critical' : 'moderate',
                    priority: anomEv.value > 5.0 ? 'high' : 'medium',
                    limitations: [
                        'Statistical outliers may represent genuine high-value real-world exceptions rather than erroneous data points.'
                    ]
                }, [anomEv]);
            }

            // -----------------------------------------------------------------
            // 5. Data Quality & Completeness Governance Insight
            // -----------------------------------------------------------------
            const qualEv = evidenceItems.find(e => e.type === 'data_quality');
            if (qualEv && qualEv.value < 75) {
                registerInsight({
                    id: nextId(),
                    title: `Sub-Optimal Data Hygiene Constraints`,
                    observation: `Data quality audit score is evaluated at ${qualEv.value}/100 with elevated null or formatting discrepancies.`,
                    evidence: [qualEv],
                    interpretation: `Data hygiene imperfections introduce uncertainty into downstream predictive conclusions and effect size estimates.`,
                    implication: `High-stakes decisions formulated on incomplete records carry heightened margin of error.`,
                    potentialDecision: `Initiate source-level data verification and missing value remediation before committing irreversible resources.`,
                    confidence: 90,
                    severity: 'major',
                    priority: 'high',
                    limitations: [
                        'Evaluation based on structural heuristics available in uploaded records.'
                    ]
                }, [qualEv]);
            }

            // Fallback if no specific insights generated
            if (insights.length === 0 && evidenceItems.length > 0) {
                registerInsight({
                    id: nextId(),
                    title: `Baseline Exploratory Overview`,
                    observation: `Empirical profiling completed across ${evidenceItems.length} evidence indicators.`,
                    evidence: evidenceItems.slice(0, 3).map(e => ({ id: e.id, source: e.source, metric: e.metric, value: e.value })),
                    interpretation: `Dataset contains foundational distributions suitable for descriptive monitoring.`,
                    implication: `Decision-making should focus on data enrichment and continued metric collection.`,
                    potentialDecision: `Collect supplementary feature dimensions and larger observation horizons to enable supervised decision intelligence.`,
                    confidence: 70,
                    severity: 'minor',
                    priority: 'low',
                    limitations: ['Limited feature dimensionality or sample depth.']
                }, evidenceItems.slice(0, 3));
            }

            return insights;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.InsightReasoner = InsightReasoner;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = InsightReasoner;
    }
})(typeof window !== 'undefined' ? window : global);
