/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/retrieval/context-retriever.js
 * ============================================================================
 * Assembles the minimal high-signal context needed to answer user questions.
 * Avoids sending bulky raw tabular rows across every conversational turn.
 * Synthesizes: Intent + Relevant Findings + Relevant Evidence + History.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ContextRetriever = {
        /**
         * Build compact focused analytical context
         * @param {Object} params
         * @returns {Object}
         */
        buildContext({
            userMessage = '',
            intent = 'GENERAL_DATA_QUESTION',
            entities = [],
            dataset = null,
            profile = null,
            analysisPlan = null,
            analytics = null,
            decisionIntelligence = null,
            autonomousIntelligence = null,
            workspace = null
        } = {}) {
            const context = {
                datasetSummary: {
                    name: dataset?.filename || 'Active Dataset',
                    rows: dataset?.rowCount || 0,
                    columns: dataset?.columnCount || 0,
                    target: analysisPlan?.targetColumn || null,
                    taskType: analysisPlan?.recommendedTask || 'Exploratory'
                },
                intent: intent,
                entities: entities,
                relevantMetrics: {},
                relevantFindings: [],
                historySummary: null
            };

            // Focused extractions based on intent
            if (intent === 'SUMMARY' || intent === 'GENERAL_DATA_QUESTION') {
                context.relevantFindings = (workspace?.narrative?.findings || []).slice(0, 3);
                context.executiveInquiries = workspace?.narrative?.structuredNarrative?.inquiries || null;
            } else if (intent === 'EXPLANATION' || intent === 'MODEL_EXPLANATION') {
                const colEntity = entities.find(e => e.type === 'column')?.value;
                if (colEntity) {
                    const fi = (analytics?.machineLearning?.featureImportance || []).find(f => f.feature === colEntity);
                    if (fi) context.relevantMetrics.featureImportance = fi.importance;

                    const colProfile = (profile?.columns || []).find(c => c.name === colEntity);
                    if (colProfile) {
                        context.relevantMetrics.columnType = colProfile.inferredType;
                        context.relevantMetrics.missingRate = colProfile.statistics?.missingRate || 0;
                    }
                }
                // Winning model
                context.relevantMetrics.bestModel = analytics?.machineLearning?.winner?.name || null;
            } else if (intent === 'WHAT_IF') {
                context.simulationTarget = analysisPlan?.targetColumn;
                context.winningModel = analytics?.machineLearning?.winner?.name;
            } else if (intent === 'COMPARISON' || intent === 'DRIFT_ANALYSIS') {
                context.changeSummary = autonomousIntelligence?.changeDetection?.classification || 'No prior version';
                context.shiftedCount = (autonomousIntelligence?.changeDetection?.shiftedFeatures || []).length;
            } else if (intent === 'RISK_ANALYSIS') {
                const risks = Array.isArray(decisionIntelligence?.risks)
                    ? decisionIntelligence.risks
                    : (decisionIntelligence?.risks?.rankedRisks || []);
                context.relevantFindings = risks.slice(0, 3);
            } else if (intent === 'OPPORTUNITY_ANALYSIS') {
                const opps = Array.isArray(decisionIntelligence?.opportunities)
                    ? decisionIntelligence.opportunities
                    : (decisionIntelligence?.opportunities?.rankedOpportunities || []);
                context.relevantFindings = opps.slice(0, 3);
            }

            return context;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.ContextRetriever = ContextRetriever;

})(typeof window !== 'undefined' ? window : global);
