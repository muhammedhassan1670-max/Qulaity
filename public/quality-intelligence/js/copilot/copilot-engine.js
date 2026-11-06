/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/copilot-engine.js
 * ============================================================================
 * Master Orchestrator for the Universal Data Intelligence Copilot.
 * Consumes:
 * - userMessage
 * - dataset
 * - profile
 * - analysisPlan
 * - analytics
 * - decisionIntelligence
 * - autonomousIntelligence
 * - workspace
 * - history
 * Returns an evidence-grounded, explainable response with contextual actions
 * and an inspectable response trace.
 * Guarantees zero mutation of raw data or analytical objects.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const CopilotEngine = {
        /**
         * Process a user query through the full Copilot intelligence pipeline
         * @param {Object} input
         * @returns {Object} Complete Copilot output payload
         */
        ask(input = {}, maybeDataset = null) {
            let params = {};
            if (typeof input === 'string') {
                params = { userMessage: input, dataset: maybeDataset };
            } else if (input && typeof input === 'object') {
                params = input;
            }

            const {
                userMessage = '',
                dataset = null,
                profile = null,
                analysisPlan = null,
                analytics = null,
                decisionIntelligence = null,
                autonomousIntelligence = null,
                workspace = null,
                history = null
            } = params;

            const platformContext = {
                dataset,
                profile: profile || dataset?.profile || null,
                analysisPlan,
                analytics,
                decisionIntelligence,
                autonomousIntelligence,
                workspace,
                knowledgeModel: dataset?.knowledgeModel || null
            };

            const copilotModules = window.UDIP?.Copilot || {};
            const ResponseTrace = copilotModules.ResponseTrace;
            const ContextManager = copilotModules.ContextManager;
            const ConversationState = copilotModules.ConversationState;
            const ConversationMemory = copilotModules.ConversationMemory;
            const EntityExtractor = copilotModules.EntityExtractor;
            const IntentDetector = copilotModules.IntentDetector;
            const IntentClassifier = copilotModules.IntentClassifier;
            const CapabilityRouter = copilotModules.CapabilityRouter;
            const QueryPlanner = copilotModules.QueryPlanner;
            const EvidenceRetriever = copilotModules.EvidenceRetriever;
            const ContextRetriever = copilotModules.ContextRetriever;
            const HistoryRetriever = copilotModules.HistoryRetriever;
            const UncertaintyEngine = copilotModules.UncertaintyEngine;
            const AnswerReasoner = copilotModules.AnswerReasoner;
            const SafetyValidator = copilotModules.SafetyValidator;
            const AnswerValidator = copilotModules.AnswerValidator;
            const EvidenceValidator = copilotModules.EvidenceValidator;
            const ActionPlanner = copilotModules.ActionPlanner;
            const CopilotAudit = copilotModules.CopilotAudit;

            // 1. Initialize Response Trace
            const trace = ResponseTrace ? ResponseTrace.createTrace(userMessage) : { id: 'trc_' + Date.now() };

            // 2. Synchronize Dataset Context
            if (ContextManager?.syncDataset) {
                ContextManager.syncDataset(dataset);
            }

            // 3. Extract Entities
            const entityResult = EntityExtractor 
                ? EntityExtractor.extract(userMessage, platformContext)
                : { entities: [], ambiguous: false, clarifications: [] };
            
            const entities = entityResult.entities || [];

            // 3b. Check for Ambiguity
            if (entityResult.ambiguous && entityResult.clarifications.length > 0) {
                const clar = entityResult.clarifications[0];
                const clarAnswer = `${clar.question}\n\n` + clar.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n');
                
                return {
                    response: {
                        answer: clarAnswer,
                        keyPoints: ['يتطلب الاستفسار تحديد جانب المقارنة المطلوب بدقة تجنباً للتخمين.'],
                        confidence: 'High confidence',
                        evidence: [],
                        actions: clar.options.map((opt, idx) => ({
                            type: 'CLARIFY',
                            label: opt,
                            isSafe: true,
                            id: 'opt_' + idx
                        })),
                        limitations: 'تم طلب التوضيح لضمان دقة الإجابة التحليلية.',
                        followUpSuggestions: clar.options.slice(0, 3),
                        sources: []
                    },
                    intent: { intent: 'AMBIGUOUS_QUERY', confidence: 0.95 },
                    execution: { stepsCount: 1, durationMs: 5 },
                    trace: ResponseTrace ? ResponseTrace.finalize(trace) : trace
                };
            }

            // 4. Detect Intent
            const detection = IntentDetector 
                ? IntentDetector.detect(userMessage, platformContext)
                : { intent: 'GENERAL_DATA_QUESTION', confidence: 0.75, matches: [] };

            // 5. Classify Intent & Capabilities
            const classification = IntentClassifier
                ? IntentClassifier.classify(detection, entities)
                : { intent: detection.intent, confidence: detection.confidence, requiredCapabilities: [], requiredEvidence: [] };

            if (ResponseTrace) {
                ResponseTrace.recordIntent(trace, classification, entities);
            }

            // 6. Route Capabilities & Generate Query Plan
            const route = CapabilityRouter ? CapabilityRouter.route(classification.intent) : {};
            const queryPlan = QueryPlanner 
                ? QueryPlanner.createPlan(classification, entities, userMessage)
                : { steps: [] };

            if (ResponseTrace) {
                ResponseTrace.recordPlan(trace, queryPlan);
            }

            // 7. Context & Evidence Retrieval
            const minimalContext = ContextRetriever
                ? ContextRetriever.buildContext({
                    userMessage,
                    intent: classification.intent,
                    entities,
                    ...platformContext
                })
                : {};

            const evidence = EvidenceRetriever
                ? EvidenceRetriever.retrieve({
                    intent: classification.intent,
                    entities,
                    platform: platformContext
                })
                : [];

            if (ResponseTrace) {
                ResponseTrace.recordEvidence(trace, evidence);
            }

            // Check historical queries if intent involves history or evolution
            let historyContext = null;
            if (classification.intent === 'INSIGHT_HISTORY' || classification.intent === 'COMPARISON') {
                historyContext = HistoryRetriever 
                    ? HistoryRetriever.retrieveHistory({ userMessage, entities, platform: platformContext })
                    : null;
                minimalContext.historySummary = historyContext;
            }

            // 8. Uncertainty Propagation
            const uncertainty = UncertaintyEngine
                ? UncertaintyEngine.assessUncertainty({ evidence, context: minimalContext })
                : { level: 'Moderate confidence', levelArabic: 'ثقة متوسطة', numericScore: 70 };

            // 9. Answer Synthesis
            let rawResponse = AnswerReasoner
                ? AnswerReasoner.synthesize({
                    userMessage,
                    intent: classification.intent,
                    entities,
                    evidence,
                    uncertainty,
                    context: minimalContext,
                    platform: platformContext
                })
                : { answer: 'Analytical response generated.', evidence: [], confidence: 'Moderate confidence' };

            // 10. Safety Sanitization (Guardrail against causal claims)
            let causalSanitized = false;
            if (SafetyValidator?.sanitizeCausalClaims) {
                const sanitized = SafetyValidator.sanitizeCausalClaims(rawResponse.answer);
                rawResponse.answer = sanitized.sanitizedText;
                causalSanitized = sanitized.causalSanitized;
            }

            // 11. Fact-Checking Validation
            const answerValidation = AnswerValidator
                ? AnswerValidator.validate({ response: rawResponse, platform: platformContext })
                : { passed: true, flags: [] };

            const evidenceValidation = EvidenceValidator
                ? EvidenceValidator.validateEvidenceGrounding({ evidence, response: rawResponse })
                : { passed: true, flags: [] };

            const overallPassed = answerValidation.passed && evidenceValidation.passed;
            if (ResponseTrace) {
                ResponseTrace.recordValidation(trace, {
                    passed: overallPassed,
                    flags: [...answerValidation.flags, ...evidenceValidation.flags],
                    causalSanitized
                });
            }

            // 12. Action Planning
            const actions = ActionPlanner
                ? ActionPlanner.planActions(classification.intent, entities, platformContext)
                : [];

            actions.forEach(act => {
                if (ResponseTrace) ResponseTrace.recordAction(trace, act);
            });

            // 13. State Tracking & Conversation Memory
            if (ConversationState?.trackEntities) {
                ConversationState.trackEntities(entities);
                ConversationState.update({
                    lastIntent: classification.intent,
                    lastEvidence: evidence
                });
            }

            if (ConversationMemory?.addTurn) {
                ConversationMemory.addTurn({
                    question: userMessage,
                    intent: classification.intent,
                    evidenceUsed: evidence,
                    actions: actions,
                    answer: rawResponse.answer,
                    confidence: rawResponse.confidence,
                    entities: entities,
                    traceId: trace.id
                });
            }

            // 14. Audit Log
            if (CopilotAudit?.record) {
                CopilotAudit.record({
                    userQuestion: userMessage,
                    detectedIntent: classification.intent,
                    intentConfidence: classification.confidence,
                    modulesUsed: trace.modulesUsed || [route.primaryEngine],
                    actionsExecuted: actions,
                    evidenceCount: evidence.length,
                    confidence: rawResponse.confidence,
                    validationStatus: overallPassed ? 'passed' : 'flagged'
                });
            }

            // 15. Finalize Trace
            const finalTrace = ResponseTrace ? ResponseTrace.finalize(trace) : trace;

            return {
                response: {
                    answer: rawResponse.answer,
                    keyPoints: rawResponse.keyPoints || [],
                    confidence: rawResponse.confidence,
                    evidence: rawResponse.evidence || [],
                    visualCard: rawResponse.visualCard || null,
                    actions: actions,
                    limitations: rawResponse.limitations || '',
                    followUpSuggestions: rawResponse.followUpSuggestions || [],
                    sources: evidence.map(e => e.source).filter((v, i, a) => a.indexOf(v) === i)
                },
                intent: classification,
                execution: {
                    planId: queryPlan.planId,
                    stepsCount: queryPlan.stepCount || (queryPlan.steps?.length || 0),
                    durationMs: finalTrace?.executionTimeMs || 0
                },
                trace: finalTrace
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.ask = CopilotEngine.ask.bind(CopilotEngine);
    window.UDIP.Copilot.Engine = CopilotEngine;
    window.UDIP.CopilotEngine = CopilotEngine;

})(typeof window !== 'undefined' ? window : global);
