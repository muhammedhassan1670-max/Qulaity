/**
 * UDIP Intelligent Question Engine
 * 
 * Generates grounded, high-information-gain analytical questions
 * derived strictly from dataset evidence and uncertainty gaps.
 * 
 * Priority Formula:
 * Score = Expected Information Gain * Impact on Analytical Plan * Confidence Gap
 * 
 * @module IntelligentQuestionEngine
 */

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.IntelligentQuestionEngine = factory();
        root.UDIPQuestionEngine = root.IntelligentQuestionEngine;
    }
}(typeof self !== 'undefined' ? self : this, function() {
    'use strict';

    class IntelligentQuestionEngine {
        /**
         * Generate prioritized, high-gain questions from discovered context
         * @param {Object} context - Output from ContextDiscoveryEngine or dataset metadata
         * @param {Object} [options]
         * @returns {Array<Object>} Top prioritized questions (1 to 3)
         */
        static generateQuestions(context = {}, options = {}) {
            const maxQuestions = options.maxQuestions || 3;
            const variables = context.variables || {};
            const potentialTargets = context.potentialTargets || [];
            const potentialTimeVars = context.potentialTimeVars || [];
            const potentialLeakages = context.potentialLeakages || [];
            const isTimeSeries = context.isTimeSeries || false;

            const candidates = [];

            // 1. Critical Target Outcome Clarification
            if (potentialTargets.length > 0) {
                const topTarget = potentialTargets[0];
                const colName = topTarget.column;
                const varInfo = variables[colName] || {};
                const distinctCount = topTarget.distinctCount || 2;

                candidates.push({
                    id: `q_target_clarify_${colName}`,
                    category: 'TARGET_CONFIRMATION',
                    impactType: 'SET_TARGET',
                    targetColumn: colName,
                    question: `I identified "${colName}" (${distinctCount} distinct states) as a potential outcome event. Are you trying to understand why this occurs or predict it in advance?`,
                    reason: `Confirming whether "${colName}" is the primary target determines whether UDIP plans root-cause diagnostics or predictive modeling.`,
                    evidence: `Column "${colName}" matches target outcome patterns with confidence ${(topTarget.confidence * 100).toFixed(0)}%.`,
                    expectedInformationGain: 0.96,
                    impactOnAnalysis: 0.95,
                    confidenceGap: 1.0 - (topTarget.confidence || 0.85),
                    priorityScore: 0.96 * 0.95 * (1.0 - (topTarget.confidence || 0.85) + 0.5), // High baseline
                    possibleAnswers: [
                        { label: `Understand root causes of ${colName}`, value: 'understand_drivers' },
                        { label: `Predict future ${colName} events`, value: 'predict_outcome' },
                        { label: `Both (Diagnostic & Predictive)`, value: 'both' },
                        { label: `"${colName}" is not the target outcome`, value: 'NONE' }
                    ],
                    allowsCustom: true
                });
            } else {
                candidates.push({
                    id: 'q_unsupervised_intent',
                    category: 'OBJECTIVE_SELECTION',
                    impactType: 'SET_OBJECTIVE',
                    targetColumn: null,
                    question: 'No explicit target variable was detected. What is your primary objective with this dataset?',
                    reason: 'Configures appropriate unsupervised statistical pipelines versus exploratory clustering.',
                    evidence: 'All variables exhibit feature/measurement profiles without distinct binary/event labels.',
                    expectedInformationGain: 0.90,
                    impactOnAnalysis: 0.90,
                    confidenceGap: 0.60,
                    priorityScore: 0.90 * 0.90 * 0.60,
                    possibleAnswers: [
                        { label: 'Exploratory & Correlation Discovery', value: 'exploratory_discovery' },
                        { label: 'Multivariate Anomaly Detection', value: 'detect_anomalies' },
                        { label: 'Statistical Process Control (SPC)', value: 'monitor_process' }
                    ],
                    allowsCustom: true
                });
            }

            // 2. Data Leakage Resolution (High Priority if present)
            if (potentialLeakages.length > 0) {
                const topLeak = potentialLeakages[0];
                candidates.push({
                    id: `q_leakage_${topLeak.feature}`,
                    category: 'DATA_LEAKAGE_CONFIRMATION',
                    impactType: 'EXCLUDE_FEATURE',
                    targetColumn: topLeak.feature,
                    question: `Variable "${topLeak.feature}" has an exceptionally high correlation (r = ${topLeak.correlation.toFixed(3)}) with target "${topLeak.target}". Is "${topLeak.feature}" recorded post-event or directly derived?`,
                    reason: 'Including post-event attributes creates artificial predictive accuracy that fails in real-world deployment.',
                    evidence: `Correlation r = ${topLeak.correlation.toFixed(3)} indicates potential direct data leakage.`,
                    expectedInformationGain: 0.94,
                    impactOnAnalysis: 0.98,
                    confidenceGap: 0.70,
                    priorityScore: 0.94 * 0.98 * 0.70,
                    possibleAnswers: [
                        { label: `Exclude "${topLeak.feature}" (Post-event or derived measurement)`, value: 'EXCLUDE' },
                        { label: `Keep "${topLeak.feature}" (Valid pre-event predictor)`, value: 'KEEP' }
                    ],
                    allowsCustom: false
                });
            }

            // 3. Temporal Sequence & Advance Horizon
            if (isTimeSeries && potentialTimeVars.length > 0) {
                const timeCol = potentialTimeVars[0].column;
                candidates.push({
                    id: `q_advance_horizon_${timeCol}`,
                    category: 'PREDICTION_HORIZON',
                    impactType: 'SET_HORIZON',
                    targetColumn: timeCol,
                    question: `For time-dependent prediction along "${timeCol}", what lead time or advance warning horizon is most useful?`,
                    reason: 'Controls the lag window parameters X(t-k) -> Y(t+H) for honest forward forecasting.',
                    evidence: `Chronological sequence detected in column "${timeCol}".`,
                    expectedInformationGain: 0.85,
                    impactOnAnalysis: 0.80,
                    confidenceGap: 0.50,
                    priorityScore: 0.85 * 0.80 * 0.50,
                    possibleAnswers: [
                        { label: 'Immediate 1-step ahead', value: '1 step' },
                        { label: 'Short lead time (3–5 steps ahead)', value: '5 steps' },
                        { label: 'Operational horizon (10+ steps ahead)', value: '10 steps' }
                    ],
                    allowsCustom: true
                });
            }

            // Rank candidates by priority score and return top N
            return candidates
                .sort((a, b) => b.priorityScore - a.priorityScore)
                .slice(0, maxQuestions);
        }
    }

    return IntelligentQuestionEngine;
}));
