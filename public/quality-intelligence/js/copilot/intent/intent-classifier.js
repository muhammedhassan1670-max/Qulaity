/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/intent/intent-classifier.js
 * ============================================================================
 * Classifies detected intent, associates required analytical capabilities,
 * specifies needed evidence types, and maps the primary required action.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const CAPABILITY_MAPPINGS = {
        SUMMARY: {
            capabilities: ['workspace_narrative', 'profile_summary'],
            evidenceTypes: ['overview', 'datasetPatterns'],
            defaultAction: 'OPEN_EXECUTIVE_MODE'
        },
        EXPLANATION: {
            capabilities: ['reasoning_chain', 'evidence_trace'],
            evidenceTypes: ['correlation', 'statisticalTest', 'featureImportance'],
            defaultAction: 'OPEN_ANALYST_MODE'
        },
        EVIDENCE_REQUEST: {
            capabilities: ['evidence_matrix', 'traceability'],
            evidenceTypes: ['metric', 'sampleSupport', 'p_value'],
            defaultAction: 'OPEN_EVIDENCE_MODE'
        },
        COMPARISON: {
            capabilities: ['version_comparator', 'dataset_monitor'],
            evidenceTypes: ['distributionShift', 'schemaDelta', 'qualityDelta'],
            defaultAction: 'COMPARE_VERSIONS'
        },
        TREND_ANALYSIS: {
            capabilities: ['exploratory_engine', 'trend_analysis'],
            evidenceTypes: ['slope', 'direction', 'r_squared'],
            defaultAction: 'OPEN_CHART'
        },
        ANOMALY_ANALYSIS: {
            capabilities: ['anomaly_engine', 'outlier_analysis'],
            evidenceTypes: ['anomalyCount', 'outlierScore', 'distributionZ'],
            defaultAction: 'RUN_ANALYSIS'
        },
        FORECAST_REQUEST: {
            capabilities: ['forecasting_engine', 'time_series'],
            evidenceTypes: ['forecastHorizon', 'predictionInterval', 'mape'],
            defaultAction: 'RUN_ANALYSIS'
        },
        MODEL_COMPARISON: {
            capabilities: ['machine_learning', 'model_governance'],
            evidenceTypes: ['leaderboard', 'metrics', 'generalizationScore'],
            defaultAction: 'VIEW_MODEL'
        },
        MODEL_EXPLANATION: {
            capabilities: ['machine_learning', 'feature_importance', 'model_governance'],
            evidenceTypes: ['featureImportance', 'shapValues', 'stabilityIndex'],
            defaultAction: 'VIEW_MODEL'
        },
        RISK_ANALYSIS: {
            capabilities: ['risk_engine', 'decision_intelligence'],
            evidenceTypes: ['severity', 'likelihood', 'mitigation'],
            defaultAction: 'VIEW_RISK'
        },
        OPPORTUNITY_ANALYSIS: {
            capabilities: ['opportunity_engine', 'decision_intelligence'],
            evidenceTypes: ['potentialImpact', 'feasibility', 'gain'],
            defaultAction: 'VIEW_OPPORTUNITY'
        },
        ROOT_CAUSE_INVESTIGATION: {
            capabilities: ['root_cause_engine', 'investigation_engine'],
            evidenceTypes: ['driverCorrelation', 'subgroupDisparity', 'candidateCauses'],
            defaultAction: 'OPEN_INVESTIGATION'
        },
        WHAT_IF: {
            capabilities: ['what_if_engine', 'scenario_engine', 'machine_learning'],
            evidenceTypes: ['simulationDelta', 'predictedOutcome', 'sensitivity'],
            defaultAction: 'RUN_WHAT_IF'
        },
        SCENARIO_ANALYSIS: {
            capabilities: ['scenario_engine', 'decision_intelligence'],
            evidenceTypes: ['scenarioImpact', 'riskMultiplier', 'consequence'],
            defaultAction: 'RUN_WHAT_IF'
        },
        DATA_QUALITY: {
            capabilities: ['quality_profile', 'quality_monitor'],
            evidenceTypes: ['healthScore', 'completeness', 'outlierRate'],
            defaultAction: 'VIEW_EVIDENCE'
        },
        DRIFT_ANALYSIS: {
            capabilities: ['concept_drift_detector', 'distribution_monitor'],
            evidenceTypes: ['tvdScore', 'wassersteinDistance', 'psi'],
            defaultAction: 'VIEW_DRIFT'
        },
        INSIGHT_HISTORY: {
            capabilities: ['insight_memory', 'analytical_timeline', 'insight_evolution'],
            evidenceTypes: ['historicalTimestamp', 'evolutionStatus', 'fingerprint'],
            defaultAction: 'OPEN_TIMELINE'
        },
        DECISION_REQUEST: {
            capabilities: ['decision_ranker', 'executive_summary'],
            evidenceTypes: ['rankScore', 'tradeoffs', 'decisionRationale'],
            defaultAction: 'OPEN_EXECUTIVE_MODE'
        },
        REPORT_REQUEST: {
            capabilities: ['report_generator', 'insight_exporter'],
            evidenceTypes: ['fullExecutiveBrief', 'findingsList'],
            defaultAction: 'GENERATE_REPORT'
        },
        VISUALIZATION_REQUEST: {
            capabilities: ['chart_selector', 'story_engine'],
            evidenceTypes: ['recommendedChart', 'chartRationale'],
            defaultAction: 'OPEN_CHART'
        },
        INVESTIGATION_REQUEST: {
            capabilities: ['investigation_engine', 'hypothesis_engine'],
            evidenceTypes: ['hypothesisStatus', 'evidenceMatch', 'conclusions'],
            defaultAction: 'OPEN_INVESTIGATION'
        },
        GENERAL_DATA_QUESTION: {
            capabilities: ['workspace_narrative', 'profile_summary'],
            evidenceTypes: ['datasetOverview'],
            defaultAction: 'VIEW_EVIDENCE'
        }
    };

    const IntentClassifier = {
        /**
         * Classify an intent and associate capabilities, evidence, and actions
         * @param {Object} detectionResult { intent, confidence }
         * @param {Array} entities
         * @returns {Object}
         */
        classify(detectionResult = {}, entities = []) {
            const intent = detectionResult.intent || 'GENERAL_DATA_QUESTION';
            const baseConfidence = typeof detectionResult.confidence === 'number' ? detectionResult.confidence : 0.75;
            const mapping = CAPABILITY_MAPPINGS[intent] || CAPABILITY_MAPPINGS.GENERAL_DATA_QUESTION;

            // Boost confidence if specific entities match intent
            let adjustedConfidence = baseConfidence;
            if (entities.length > 0) {
                if (intent === 'WHAT_IF' && entities.some(e => e.type === 'magnitude')) adjustedConfidence += 0.05;
                if (intent === 'MODEL_EXPLANATION' && entities.some(e => e.type === 'column')) adjustedConfidence += 0.05;
                if (intent === 'MODEL_COMPARISON' && entities.some(e => e.type === 'model')) adjustedConfidence += 0.05;
            }

            return {
                intent: intent,
                confidence: Math.min(0.99, Number(adjustedConfidence.toFixed(2))),
                requiredCapabilities: [...mapping.capabilities],
                requiredEvidence: [...mapping.evidenceTypes],
                requiredAction: mapping.defaultAction
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.IntentClassifier = IntentClassifier;

})(typeof window !== 'undefined' ? window : global);
