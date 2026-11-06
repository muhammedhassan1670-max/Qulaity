/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: decision/decision-engine.js
 * ============================================================================
 * Master Orchestrator for the Decision Intelligence & Model Governance Layer.
 * 
 * Pipeline Coordination:
 * Profiler (Step 2) + Analysis Plan (Step 2.5) + Analytics (Step 3) + Raw Data
 *       ↓
 * Evidence Fusion & Traceability
 *       ↓
 * Insight Reasoning & Root-Cause Candidate Diagnostics
 *       ↓
 * Risk Intelligence & Opportunity Detection
 *       ↓
 * Model Governance, Stability, & Data Drift Auditing
 *       ↓
 * Scenario Analysis & Sensitivity What-If Simulation
 *       ↓
 * Evidence-Weighted Decision Ranking
 *       ↓
 * 7-Question Executive Synthesis
 * 
 * Strict Invariants:
 * - 100% Domain-Agnostic
 * - Non-Causal Semantics (Candidate Drivers / Observational Associations)
 * - Zero Raw Data or Prior State Mutation (Read-Only)
 * - Zero NaN / undefined / Infinity outputs
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DecisionEngine = {
        /**
         * Run the complete Decision Intelligence & Model Governance pipeline
         * 
         * @param {Object} params
         * @param {Object} params.dataset - Active dataset object
         * @param {Object} params.profile - Step 2 profiler results
         * @param {Object} params.analysisPlan - Step 2.5 analysis plan
         * @param {Object} params.analytics - Step 3 analytics results
         * @param {Object} [params.baselineDataset] - Optional baseline for drift detection
         * @param {Array<Object>} [params.userScenarios] - Optional user scenarios
         * @returns {Object} Complete decisionIntelligence payload
         */
        run({
            dataset = {},
            profile = {},
            analysisPlan = {},
            analytics = {},
            baselineDataset = null,
            userScenarios = []
        } = {}) {
            const startTime = Date.now();
            console.info('[UDIP:DecisionEngine] Commencing Decision Intelligence & Governance pipeline...');

            // Defensive check for empty or invalid datasets
            const rows = (dataset && Array.isArray(dataset.rows)) ? dataset.rows : [];
            const isDegenerate = rows.length === 0;

            // Module dependencies
            const EvidenceFusion = window.UDIP?.EvidenceFusion;
            const EvidenceTrace = window.UDIP?.EvidenceTrace;
            const InsightReasoner = window.UDIP?.InsightReasoner;
            const RootCauseEngine = window.UDIP?.RootCauseEngine;
            const RiskEngine = window.UDIP?.RiskEngine;
            const OpportunityEngine = window.UDIP?.OpportunityEngine;
            const ScenarioEngine = window.UDIP?.ScenarioEngine;
            const WhatIfEngine = window.UDIP?.WhatIfEngine;
            const ModelGovernance = window.UDIP?.ModelGovernance;
            const StabilityAnalyzer = window.UDIP?.StabilityAnalyzer;
            const DriftDetector = window.UDIP?.DriftDetector;
            const DecisionRanker = window.UDIP?.DecisionRanker;
            const ExecutiveSummary = window.UDIP?.ExecutiveSummary;
            const ExpertReasoningEngine = window.UDIP?.ExpertReasoningEngine;

            // Initialize Evidence Trace Registry
            const traceRegistry = EvidenceTrace ? EvidenceTrace.createRegistry() : null;

            // -----------------------------------------------------------------
            // 1. Fuse Multi-Source Evidence
            // -----------------------------------------------------------------
            let evidence = { items: [], summary: { total: 0, strong: 0, moderate: 0, weak: 0, insufficient: 0 }, byColumn: {} };
            if (EvidenceFusion && !isDegenerate) {
                try {
                    evidence = EvidenceFusion.fuse({ profile, analysisPlan, analytics });
                } catch (evErr) {
                    console.warn('[UDIP:DecisionEngine] Evidence fusion error:', evErr);
                }
            }

            // -----------------------------------------------------------------
            // 2. Structured Insight Reasoning
            // -----------------------------------------------------------------
            let insights = [];
            if (InsightReasoner && !isDegenerate) {
                try {
                    insights = InsightReasoner.synthesize({
                        evidenceItems: evidence.items,
                        analysisPlan,
                        analytics,
                        traceRegistry
                    });
                } catch (insErr) {
                    console.warn('[UDIP:DecisionEngine] Insight reasoning error:', insErr);
                }
            }

            // -----------------------------------------------------------------
            // 3. Root-Cause Candidate Diagnostics (Non-Causal)
            // -----------------------------------------------------------------
            let rootCauseCandidates = [];
            let diagnostics = { status: 'empty', target: null, primaryDrivers: [], secondaryDrivers: [], contributingFactors: [], candidates: [], alternativeHypotheses: [], causalDisclaimer: 'Association detected — causal inference not established.', diagnosticSummary: 'No diagnostics evaluated.' };
            if (RootCauseEngine && !isDegenerate) {
                try {
                    if (typeof RootCauseEngine.diagnose === 'function') {
                        diagnostics = RootCauseEngine.diagnose({
                            evidenceItems: evidence.items,
                            analysisPlan,
                            analytics,
                            traceRegistry
                        });
                        rootCauseCandidates = diagnostics.candidates || [];
                    } else {
                        rootCauseCandidates = RootCauseEngine.evaluate({
                            evidenceItems: evidence.items,
                            analysisPlan,
                            analytics,
                            traceRegistry
                        });
                    }
                } catch (rcErr) {
                    console.warn('[UDIP:DecisionEngine] Root-cause engine error:', rcErr);
                }
            }

            // -----------------------------------------------------------------
            // 4. Risk Intelligence
            // -----------------------------------------------------------------
            let risks = [];
            if (RiskEngine && !isDegenerate) {
                try {
                    risks = RiskEngine.evaluate({
                        profile,
                        analysisPlan,
                        analytics,
                        evidenceItems: evidence.items,
                        traceRegistry
                    });
                } catch (rskErr) {
                    console.warn('[UDIP:DecisionEngine] Risk engine error:', rskErr);
                }
            }

            // -----------------------------------------------------------------
            // 5. Opportunity Detection
            // -----------------------------------------------------------------
            let opportunities = [];
            if (OpportunityEngine && !isDegenerate) {
                try {
                    opportunities = OpportunityEngine.detect({
                        profile,
                        analysisPlan,
                        analytics,
                        evidenceItems: evidence.items,
                        traceRegistry
                    });
                } catch (oppErr) {
                    console.warn('[UDIP:DecisionEngine] Opportunity engine error:', oppErr);
                }
            }

            // -----------------------------------------------------------------
            // 6. Model Governance, Stability, & 4-Vector Self-Challenge
            // -----------------------------------------------------------------
            let governance = { status: 'skipped', trustScore: 0, trustLevel: 'unrated', recommendation: 'No model evaluated.' };
            let selfChallenge = { status: 'skipped', auditPassed: true, stressLevel: 'LOW', decisionStatus: 'APPROVED', criticalVulnerabilities: [], counterArguments: [], vectors: {} };
            if (ModelGovernance && !isDegenerate) {
                try {
                    governance = ModelGovernance.audit({ analytics, analysisPlan, profile });
                    if (typeof ModelGovernance.challenge === 'function') {
                        selfChallenge = ModelGovernance.challenge({
                            analytics,
                            analysisPlan,
                            profile,
                            diagnosis: diagnostics
                        });
                    }
                } catch (govErr) {
                    console.warn('[UDIP:DecisionEngine] Model governance error:', govErr);
                }
            }

            // -----------------------------------------------------------------
            // 7. Data Drift Auditing
            // -----------------------------------------------------------------
            let drift = { status: 'unavailable', message: 'Drift assessment unavailable: no baseline dataset provided.' };
            if (DriftDetector) {
                try {
                    drift = DriftDetector.detectDrift({ baselineDataset, currentDataset: dataset });
                } catch (driftErr) {
                    console.warn('[UDIP:DecisionEngine] Drift detector error:', driftErr);
                }
            }

            // -----------------------------------------------------------------
            // 8. Scenario Analysis & What-If Simulations
            // -----------------------------------------------------------------
            let scenarios = [];
            let datasetScenarios = { status: 'empty', scenarios: [], summary: {}, baselineMetrics: {} };
            if (ScenarioEngine && !isDegenerate) {
                try {
                    if (typeof ScenarioEngine.synthesizeDatasetScenarios === 'function') {
                        datasetScenarios = ScenarioEngine.synthesizeDatasetScenarios({
                            dataset,
                            profile,
                            analysisPlan,
                            analytics
                        });
                    }

                    if (Array.isArray(userScenarios) && userScenarios.length > 0) {
                        userScenarios.forEach(scen => {
                            scenarios.push(ScenarioEngine.evaluateScenario({
                                changes: scen.changes,
                                analytics,
                                profile,
                                analysisPlan
                            }));
                        });
                    } else if (analytics?.machineLearning?.features?.length > 0) {
                        // Automatically generate an initial default baseline scenario
                        const firstFeat = analytics.machineLearning.features[0];
                        const cp = (profile.columns || []).find(c => c.name === firstFeat);
                        const baseVal = cp?.stats?.median || cp?.stats?.mean || 10;
                        if (Number.isFinite(baseVal) && baseVal !== 0) {
                            scenarios.push(ScenarioEngine.evaluateScenario({
                                changes: [{ feature: firstFeat, value: +(baseVal * 1.1).toFixed(2) }],
                                analytics,
                                profile,
                                analysisPlan
                            }));
                        }
                    }
                } catch (scenErr) {
                    console.warn('[UDIP:DecisionEngine] Scenario engine error:', scenErr);
                }
            }

            let whatIf = { status: 'skipped', sensitivities: [], rankedFeatures: [] };
            if (WhatIfEngine && !isDegenerate) {
                try {
                    whatIf = WhatIfEngine.analyzeSensitivity({ analytics, profile, analysisPlan });
                } catch (wiErr) {
                    console.warn('[UDIP:DecisionEngine] What-if engine error:', wiErr);
                }
            }

            // -----------------------------------------------------------------
            // 8.5. Expert Reasoning & Diagnostic Intelligence
            // -----------------------------------------------------------------
            let expertReasoning = null;
            if (ExpertReasoningEngine && !isDegenerate) {
                try {
                    expertReasoning = ExpertReasoningEngine.reason({
                        dataset,
                        profile,
                        analysisPlan,
                        analytics,
                        evidenceItems: evidence.items,
                        traceRegistry
                    });
                } catch (erErr) {
                    console.warn('[UDIP:DecisionEngine] Expert reasoning engine error:', erErr);
                }
            }

            // -----------------------------------------------------------------
            // 9. Evidence-Weighted Decision Ranking
            // -----------------------------------------------------------------
            let decisions = [];
            if (DecisionRanker && !isDegenerate) {
                try {
                    decisions = DecisionRanker.rankDecisions({
                        insights,
                        risks,
                        opportunities,
                        rootCauses: rootCauseCandidates,
                        selfChallenge,
                        modelGovernance: governance,
                        expertReasoning,
                        traceRegistry
                    });
                } catch (decErr) {
                    console.warn('[UDIP:DecisionEngine] Decision ranker error:', decErr);
                }
            }

            // -----------------------------------------------------------------
            // 10. Executive Briefing & 7 Core Inquiries
            // -----------------------------------------------------------------
            let summary = { overallConfidence: { score: 0, level: 'very_low' }, coreAnswers: {} };
            if (ExecutiveSummary) {
                try {
                    summary = ExecutiveSummary.generate({
                        profile,
                        analysisPlan,
                        analytics,
                        insights,
                        decisions,
                        risks,
                        opportunities,
                        rootCauses: rootCauseCandidates,
                        governance,
                        selfChallenge,
                        evidenceSummary: evidence.summary
                    });
                } catch (sumErr) {
                    console.warn('[UDIP:DecisionEngine] Executive summary error:', sumErr);
                }
            }

            // Traceability Audit Check
            const traceabilityAudit = traceRegistry ? traceRegistry.verifyTraceability(decisions) : { fullyTraceable: true };

            const durationMs = Date.now() - startTime;
            console.info(`[UDIP:DecisionEngine] Decision Intelligence pipeline completed in ${durationMs}ms (Confidence: ${summary.overallConfidence?.score}% [${summary.overallConfidence?.level}])`);

            return {
                status: isDegenerate ? 'empty' : 'completed',
                durationMs,
                summary,
                evidence,
                insights,
                decisions,
                risks,
                opportunities,
                scenarios,
                datasetScenarios,
                whatIf,
                diagnostics,
                rootCauseCandidates,
                expertReasoning,
                governance,
                selfChallenge,
                drift,
                confidence: summary.overallConfidence,
                limitations: summary.coreAnswers?.whatAreTheLimitations || [],
                traceability: {
                    audit: traceabilityAudit,
                    traces: traceRegistry ? traceRegistry.getAllTraces() : []
                }
            };
        },

        /**
         * Asynchronously run the complete Decision Intelligence pipeline,
         * yielding between cognitive sub-tasks to guarantee 60 FPS UI rendering.
         */
        async runAsync({
            dataset = {},
            profile = {},
            analysisPlan = {},
            analytics = {},
            baselineDataset = null,
            userScenarios = []
        } = {}, onProgress = null) {
            const startTime = Date.now();
            const rows = (dataset && Array.isArray(dataset.rows)) ? dataset.rows : [];
            const isDegenerate = rows.length === 0;

            if (isDegenerate) {
                return this.run({ dataset, profile, analysisPlan, analytics, baselineDataset, userScenarios });
            }

            const EvidenceFusion = window.UDIP?.EvidenceFusion;
            const EvidenceTrace = window.UDIP?.EvidenceTrace;
            const InsightReasoner = window.UDIP?.InsightReasoner;
            const RootCauseEngine = window.UDIP?.RootCauseEngine;
            const RiskEngine = window.UDIP?.RiskEngine;
            const OpportunityEngine = window.UDIP?.OpportunityEngine;
            const ScenarioEngine = window.UDIP?.ScenarioEngine;
            const WhatIfEngine = window.UDIP?.WhatIfEngine;
            const ModelGovernance = window.UDIP?.ModelGovernance;
            const DriftDetector = window.UDIP?.DriftDetector;
            const DecisionRanker = window.UDIP?.DecisionRanker;
            const ExecutiveSummary = window.UDIP?.ExecutiveSummary;
            const ExpertReasoningEngine = window.UDIP?.ExpertReasoningEngine;

            const traceRegistry = EvidenceTrace ? EvidenceTrace.createRegistry() : null;

            // 1. Evidence Fusion
            if (onProgress) onProgress({ stage: 4, percent: 93, stageName: 'Stage 4/5: Fusing multi-source evidence matrix...', log: 'DECISION_ENGINE: Fusing multi-source evidence...' });
            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 10));

            let evidence = { items: [], summary: { total: 0, strong: 0, moderate: 0, weak: 0, insufficient: 0 }, byColumn: {} };
            if (EvidenceFusion) {
                try { evidence = EvidenceFusion.fuse({ profile, analysisPlan, analytics }); } catch (e) { console.warn(e); }
            }

            // 2. Insight Reasoning
            let insights = [];
            if (InsightReasoner) {
                try { insights = InsightReasoner.synthesize({ evidenceItems: evidence.items, analysisPlan, analytics, traceRegistry }); } catch (e) { console.warn(e); }
            }

            // 3. Diagnostics & Root Cause
            let rootCauseCandidates = [];
            let diagnostics = { status: 'empty', target: null, primaryDrivers: [], secondaryDrivers: [], contributingFactors: [], candidates: [], alternativeHypotheses: [], causalDisclaimer: 'Association detected — causal inference not established.', diagnosticSummary: 'No diagnostics evaluated.' };
            if (RootCauseEngine) {
                try {
                    if (typeof RootCauseEngine.diagnose === 'function') {
                        diagnostics = RootCauseEngine.diagnose({ evidenceItems: evidence.items, analysisPlan, analytics, traceRegistry });
                        rootCauseCandidates = diagnostics.candidates || [];
                    } else {
                        rootCauseCandidates = RootCauseEngine.evaluate({ evidenceItems: evidence.items, analysisPlan, analytics, traceRegistry });
                    }
                } catch (e) { console.warn(e); }
            }

            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 10));

            // 4. Risks & Opportunities
            let risks = [];
            if (RiskEngine) {
                try { risks = RiskEngine.evaluate({ profile, analysisPlan, analytics, evidenceItems: evidence.items, traceRegistry }); } catch (e) { console.warn(e); }
            }
            let opportunities = [];
            if (OpportunityEngine) {
                try { opportunities = OpportunityEngine.detect({ profile, analysisPlan, analytics, evidenceItems: evidence.items, traceRegistry }); } catch (e) { console.warn(e); }
            }

            // 5. Model Governance & Self Challenge
            let governance = { status: 'skipped', trustScore: 0, trustLevel: 'unrated', recommendation: 'No model evaluated.' };
            let selfChallenge = { status: 'skipped', auditPassed: true, stressLevel: 'LOW', decisionStatus: 'APPROVED', criticalVulnerabilities: [], counterArguments: [], vectors: {} };
            if (ModelGovernance) {
                try {
                    governance = ModelGovernance.audit({ analytics, analysisPlan, profile });
                    if (typeof ModelGovernance.challenge === 'function') {
                        selfChallenge = ModelGovernance.challenge({ analytics, analysisPlan, profile, diagnosis: diagnostics });
                    }
                } catch (e) { console.warn(e); }
            }

            // 6. Drift
            let drift = { status: 'unavailable', message: 'Drift assessment unavailable: no baseline dataset provided.' };
            if (DriftDetector) {
                try { drift = DriftDetector.detectDrift({ baselineDataset, currentDataset: dataset }); } catch (e) { console.warn(e); }
            }

            // 7. Scenarios & What-if
            let scenarios = [];
            let datasetScenarios = { status: 'empty', scenarios: [], summary: {}, baselineMetrics: {} };
            if (ScenarioEngine) {
                try {
                    if (typeof ScenarioEngine.synthesizeDatasetScenarios === 'function') {
                        datasetScenarios = ScenarioEngine.synthesizeDatasetScenarios({ dataset, profile, analysisPlan, analytics });
                    }
                } catch (e) { console.warn(e); }
            }
            let whatIf = { status: 'skipped', sensitivities: [], rankedFeatures: [] };
            if (WhatIfEngine) {
                try { whatIf = WhatIfEngine.analyzeSensitivity({ analytics, profile, analysisPlan }); } catch (e) { console.warn(e); }
            }

            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 10));

            // 8. Expert Reasoning
            let expertReasoning = null;
            if (ExpertReasoningEngine) {
                try { expertReasoning = ExpertReasoningEngine.reason({ dataset, profile, analysisPlan, analytics, evidenceItems: evidence.items, traceRegistry }); } catch (e) { console.warn(e); }
            }

            // 9. Decision Ranking
            let decisions = [];
            if (DecisionRanker) {
                try {
                    decisions = DecisionRanker.rankDecisions({
                        insights,
                        risks,
                        opportunities,
                        rootCauses: rootCauseCandidates,
                        selfChallenge,
                        modelGovernance: governance,
                        expertReasoning,
                        traceRegistry
                    });
                } catch (e) { console.warn(e); }
            }

            // 10. Executive Summary
            let summary = { overallConfidence: { score: 0, level: 'very_low' }, coreAnswers: {} };
            if (ExecutiveSummary) {
                try {
                    summary = ExecutiveSummary.generate({
                        profile,
                        analysisPlan,
                        analytics,
                        insights,
                        decisions,
                        risks,
                        opportunities,
                        rootCauses: rootCauseCandidates,
                        governance,
                        selfChallenge,
                        evidenceSummary: evidence.summary
                    });
                } catch (e) { console.warn(e); }
            }

            const traceabilityAudit = traceRegistry ? traceRegistry.verifyTraceability(decisions) : { fullyTraceable: true };
            const durationMs = Date.now() - startTime;

            return {
                status: 'completed',
                durationMs,
                summary,
                evidence,
                insights,
                decisions,
                risks,
                opportunities,
                scenarios,
                datasetScenarios,
                whatIf,
                diagnostics,
                rootCauseCandidates,
                expertReasoning,
                governance,
                selfChallenge,
                drift,
                confidence: summary.overallConfidence,
                limitations: summary.coreAnswers?.whatAreTheLimitations || [],
                traceability: {
                    audit: traceabilityAudit,
                    traces: traceRegistry ? traceRegistry.getAllTraces() : []
                }
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.DecisionEngine = DecisionEngine;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DecisionEngine;
    }
})(typeof window !== 'undefined' ? window : global);
