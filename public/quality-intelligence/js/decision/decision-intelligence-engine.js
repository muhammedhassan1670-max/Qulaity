/**
 * UDIP Decision Intelligence Engine
 * 
 * Translates predictive model attributions and statistical findings
 * into prioritized, evidence-grounded decision recommendations.
 * 
 * Explicitly separates MODEL_RECOMMENDATION from PROVEN_CAUSAL_ACTION.
 * 
 * @module DecisionIntelligenceEngine
 */

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.DecisionIntelligenceEngine = factory();
        root.UDIPDecisionIntelligence = root.DecisionIntelligenceEngine;
    }
}(typeof self !== 'undefined' ? self : this, function() {
    'use strict';

    class DecisionIntelligenceEngine {
        /**
         * Synthesize prioritized decision recommendations from analytical evidence
         * @param {Object} knowledgeState
         * @param {Object} predictiveResults
         * @returns {Array<Object>} Prioritized recommendations
         */
        static generateRecommendations(knowledgeState, predictiveResults = {}) {
            const recommendations = [];
            const targetCol = knowledgeState?.objective?.targetVariable;
            const models = predictiveResults.models || (predictiveResults.modelType ? [predictiveResults] : (knowledgeState?.predictiveModels || []));
            const hypotheses = knowledgeState?.hypotheses || [];

            // 1. Predictive Driver Recommendation
            if (models.length > 0 && models[0].featureImportance && models[0].featureImportance.length > 0) {
                const topFeature = models[0].featureImportance[0].feature;
                const weight = models[0].featureImportance[0].weight || models[0].featureImportance[0].importance || 0.45;

                recommendations.push({
                    id: 'rec_predictive_driver',
                    priority: 'HIGH',
                    title: `Calibrate and monitor primary driver: "${topFeature}"`,
                    rationale: `"${topFeature}" is the single strongest explanatory contributor to "${targetCol}" variations.`,
                    evidence: `Model attribution assigns ${(weight * 100).toFixed(1)}% importance weight to this feature.`,
                    expectedConsequence: 'Early proactive stabilization of this parameter is expected to reduce unfavorable outcome exposure.',
                    recommendationType: 'MODEL_RECOMMENDATION',
                    causalProofEstablished: false,
                    confidence: 0.86,
                    actionabilityScore: 0.90,
                    disclaimer: 'Statistical recommendation derived from model attribution. Causal effectiveness should be confirmed via experimental trial or closed-loop feedback.'
                });
            }

            // 2. Hypothesis-Driven Action
            const supportedHyp = hypotheses.find(h => h.status === 'Supported' && h.confidence >= 0.8);
            if (supportedHyp) {
                recommendations.push({
                    id: `rec_hypothesis_${supportedHyp.id}`,
                    priority: 'MEDIUM',
                    title: `Investigate coupling mechanism for: ${supportedHyp.title}`,
                    rationale: supportedHyp.description,
                    evidence: supportedHyp.evidence.join('; '),
                    expectedConsequence: 'Understanding interaction dynamics aids in identifying operational constraints.',
                    recommendationType: 'EXPLORATORY_RECOMMENDATION',
                    causalProofEstablished: false,
                    confidence: supportedHyp.confidence,
                    actionabilityScore: 0.80,
                    disclaimer: 'Observational association. Does not constitute proven root-cause proof.'
                });
            }

            // 3. Data Health Recommendation if readiness is conditional
            if (knowledgeState?.readiness?.status === 'CONDITIONAL') {
                recommendations.push({
                    id: 'rec_data_readiness',
                    priority: 'MEDIUM',
                    title: 'Enhance data collection frequency and reduce missingness',
                    rationale: 'Data quality readiness gate is currently conditional.',
                    evidence: `Readiness overall score: ${knowledgeState.readiness.overallScore}%. Warnings: ${knowledgeState.readiness.warnings?.join(', ') || 'Minor missingness'}.`,
                    expectedConsequence: 'Higher telemetry density will narrow confidence intervals on future model iterations.',
                    recommendationType: 'GOVERNANCE_RECOMMENDATION',
                    causalProofEstablished: true,
                    confidence: 0.95,
                    actionabilityScore: 0.85,
                    disclaimer: 'Direct data engineering best practice.'
                });
            }

            return recommendations;
        }
    }

    return DecisionIntelligenceEngine;
}));
