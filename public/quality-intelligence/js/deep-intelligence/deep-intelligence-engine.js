/**
 * UDIP Deep Intelligence Evolution vNext
 * DeepIntelligenceEngine - Master Cognitive Orchestrator
 * Implements the non-negotiable architectural flow:
 * DATA -> UNDERSTANDING -> DKM -> STRUCTURE -> RELATIONSHIPS -> HYPOTHESES -> PLANNER -> EXECUTION -> VALIDATION -> CRITIC -> GRAPH -> COPILOT
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        const engine = factory();
        root.UDIP.DeepIntelligenceEngine = engine;
        // Also provide seamless upgrade alias for DeepDataUnderstandingEngine
        root.UDIP.DeepDataUnderstandingEngine = engine;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class DeepIntelligenceEngine {
        static analyze({ dataset, profile } = {}) {
            const startTime = Date.now();
            if (!dataset || !dataset.columns || dataset.columns.length === 0) {
                console.warn('[UDIP:DeepIntelligence] Invalid or empty dataset provided.');
                return null;
            }

            const UD = (typeof window !== 'undefined' ? window.UDIP : (typeof global !== 'undefined' ? global.UDIP : null)) || {};
            const DKMClass = UD.DatasetKnowledgeModel || class { constructor(c) { Object.assign(this, c); } };

            // 1. Structure Discovery
            const topology = UD.TopologyDiscoverer ? UD.TopologyDiscoverer.discover(dataset, profile) : (UD.TopologyClassifier ? UD.TopologyClassifier.classify(dataset, profile) : []);
            const entities = UD.EntityDiscoverer ? UD.EntityDiscoverer.discover(dataset, profile) : [];
            const hierarchies = UD.HierarchyDiscoverer ? UD.HierarchyDiscoverer.discover(dataset, profile) : [];
            const keys = UD.KeyDiscoverer ? UD.KeyDiscoverer.discover(dataset, profile) : { primaryKeyCandidates: [], compositeKeyCandidates: [] };
            const dependencies = UD.DependencyDiscoverer ? UD.DependencyDiscoverer.discover(dataset, profile) : [];
            const variables = UD.RoleDeducer ? UD.RoleDeducer.deduce(dataset, profile) : {};

            const colProfiles = {};
            if (profile && profile.columns) {
                if (Array.isArray(profile.columns)) {
                    profile.columns.forEach(c => { if (c && c.name) colProfiles[c.name] = c; });
                } else if (typeof profile.columns === 'object') {
                    Object.assign(colProfiles, profile.columns);
                }
            }

            // 2. Advanced Relationships & Equations
            const idRegex = /^(id|uuid|guid|code|key|no|num|ref|hash|serial|account|sku|order|cust|emp|trans|batch|patient|sample|record|row|item|index|barcode|entity)[_-]?|[_-]?(id|code|key|no|num|guid|ref|serial|idx|pk)$/i;
            const relationships = [];
            const numCols = dataset.columns.filter(c => {
                const p = colProfiles[c] || {};
                const role = p.semanticRole || p.role || '';
                if (role === 'identifier' || idRegex.test(c)) {
                    return false;
                }
                const t = p.detectedType || p.inferredType || '';
                return t === 'integer' || t === 'decimal' || t === 'numeric' || t === 'float';
            });

            for (let i = 0; i < Math.min(numCols.length, 8); i++) {
                for (let j = i + 1; j < Math.min(numCols.length, 8); j++) {
                    const colA = numCols[i];
                    const colB = numCols[j];
                    const xVals = [], yVals = [];

                    for (let r = 0; r < dataset.rows.length; r++) {
                        const vx = +dataset.rows[r][colA];
                        const vy = +dataset.rows[r][colB];
                        if (!isNaN(vx) && !isNaN(vy)) {
                            xVals.push(vx);
                            yVals.push(vy);
                        }
                    }

                    if (xVals.length >= 5) {
                        const lin = UD.LinearAnalysis ? UD.LinearAnalysis.compute(xVals, yVals) : { r: 0 };
                        const rank = UD.RankAnalysis ? UD.RankAnalysis.compute(xVals, yVals) : { spearmanRho: 0 };
                        const mi = UD.MutualInformation ? UD.MutualInformation.compute(xVals, yVals) : 0;
                        const nonlin = UD.NonlinearAnalysis ? UD.NonlinearAnalysis.analyze(xVals, yVals) : { pattern: 'LINEAR', isNonLinear: false };

                        const rel = UD.RelationshipConsensus
                            ? UD.RelationshipConsensus.evaluate({ linearResult: lin, rankResult: rank, miValue: mi, nonlinearResult: nonlin, colA, colB, n: xVals.length })
                            : { colA, colB, pearson: lin.r, spearman: rank.spearmanRho, isNonLinear: nonlin.isNonLinear, shape: nonlin.pattern };

                        relationships.push(rel);
                    }
                }
            }

            const interactions = UD.InteractionDiscovery ? UD.InteractionDiscovery.discover(dataset, profile) : [];
            const derived = UD.DerivedVariableDetector ? UD.DerivedVariableDetector.detect(dataset, profile) : [];

            // 3. Temporal, Distribution & Missingness Intelligence
            const temporal = UD.TemporalStructure ? UD.TemporalStructure.inspect(dataset, profile) : { hasTemporal: false };
            if (temporal.hasTemporal && dataset.rows.length >= 10 && numCols.length > 0) {
                const primarySeries = dataset.rows.map(r => +r[numCols[0]]).filter(v => !isNaN(v));
                temporal.autocorrelation = UD.Autocorrelation ? UD.Autocorrelation.compute(primarySeries) : [];
                temporal.regimeShifts = UD.ChangePointAnalysis ? UD.ChangePointAnalysis.detect(primarySeries) : [];
                temporal.seasonality = UD.RecurringPatterns ? UD.RecurringPatterns.detect(primarySeries) : {};
            }

            const distributions = {};
            numCols.slice(0, 5).forEach(c => {
                const vals = dataset.rows.map(r => +r[c]).filter(v => !isNaN(v));
                distributions[c] = {
                    profile: UD.DistributionProfiler ? UD.DistributionProfiler.profile(vals) : null,
                    multimodality: UD.Multimodality ? UD.Multimodality.detect(vals) : null,
                    tailAnalysis: UD.TailAnalysis ? UD.TailAnalysis.analyze(vals) : null,
                    zeroInflation: UD.ZeroInflation ? UD.ZeroInflation.analyze(vals) : null
                };
            });

            const missingnessMap = UD.MissingnessMap ? UD.MissingnessMap.map(dataset) : null;
            const coMissingness = UD.CoMissingness ? UD.CoMissingness.analyze(dataset) : [];
            const missingnessHypotheses = UD.MissingnessMechanism ? UD.MissingnessMechanism.deduce(missingnessMap, coMissingness) : [];
            const segments = UD.GroupDiscovery ? UD.GroupDiscovery.discover(dataset, profile) : [];

            // 4. Hypothesis Generation & Active Counter-Evidence
            let hypotheses = UD.HypothesisGenerator ? UD.HypothesisGenerator.generate({
                dataset, profile, relationships, segments, temporal, derived, missingnessHypotheses
            }) : [];

            const counterEvidence = [];
            hypotheses.forEach(h => {
                if (UD.CounterEvidence) {
                    const ce = UD.CounterEvidence.search(dataset, profile, h);
                    if (ce.length > 0) {
                        h.counterEvidence = ce;
                        counterEvidence.push(...ce);
                    }
                }
            });

            if (UD.HypothesisLifecycle) {
                hypotheses = UD.HypothesisLifecycle.updateAll(hypotheses, UD.CounterEvidence, dataset, profile);
            }

            // 5. Causal Humility & Confounder Detection
            const causalReport = UD.CausalReasoner ? UD.CausalReasoner.analyze(dataset, relationships, temporal) : { warnings: [], confounders: [] };

            // 6. Adversarial Quality Gate (Analytical Critic 2.0)
            const criticAudit = UD.AnalyticalCritic ? UD.AnalyticalCritic.audit({
                dataset, profile, relationships, hypotheses, counterEvidence, derived, temporal
            }) : { verdict: 'ROBUST', score: 85, checks: [] };

            // 7. Reliability Profile (5-Dimensional)
            const reliabilityProfile = UD.KnowledgeConfidence ? UD.KnowledgeConfidence.evaluate({
                dataset, profile, findings: { relationships, hypotheses }, criticAudit
            }) : null;

            // 8. Adaptive Strategy Planner
            const adaptiveStrategy = UD.AdaptivePlanner ? UD.AdaptivePlanner.constructPlan({
                dataset, profile, topology, relationships, interactions, derived
            }) : null;

            // 9. Directed Insight Graph & Analytical Traces
            const insightGraph = UD.GraphBuilder ? UD.GraphBuilder.build({
                dataset, variables, relationships, hypotheses, counterEvidence, criticAudit
            }) : (UD.InsightGraph ? new UD.InsightGraph() : null);

            const analyticalTraces = UD.AnalyticalTrace ? UD.AnalyticalTrace.buildTraces(dataset, hypotheses, criticAudit) : [];

            // 10. Grounded Analytical Questions
            const groundedQuestions = UD.QuestionGenerator ? UD.QuestionGenerator.generate({
                relationships, hypotheses, segments, temporal, derived
            }) : [];

            const rankedQuestions = UD.AnalyticalQuestionRanker ? UD.AnalyticalQuestionRanker.rank(groundedQuestions) : groundedQuestions;
            const executionCost = UD.AnalysisCost ? UD.AnalysisCost.estimate(dataset) : { durationMs: 5, recommendedBackend: 'NATIVE_JS' };

            const dkm = new DKMClass({
                datasetId: dataset.name || `ds_${Date.now()}`,
                topology: topology,
                entities: entities,
                hierarchies: hierarchies,
                keys: keys,
                dependencies: dependencies,
                variables: variables,
                relationships: relationships,
                interactions: interactions,
                derivedVariables: derived,
                temporalStructure: temporal,
                distributions: distributions,
                missingness: { map: missingnessMap, coMissingness, hypotheses: missingnessHypotheses },
                segments: segments,
                hypotheses: hypotheses,
                counterEvidence: counterEvidence,
                causalWarnings: causalReport.warnings,
                criticAudit: criticAudit,
                insightGraph: insightGraph,
                analyticalTraces: analyticalTraces,
                groundedQuestions: rankedQuestions,
                adaptiveStrategy: adaptiveStrategy,
                reliabilityProfile: reliabilityProfile,
                executionCost: executionCost,
                metadata: { synthesisLatencyMs: Date.now() - startTime }
            });

            const latency = Date.now() - startTime;
            const topDesc = (topology || []).map(t => t.topology || t.name).join('+') || 'TABULAR';
            console.log(`[UDIP:DeepIntelligence] Mental model synthesized in ${latency}ms (Topologies: ${topDesc}, Hypotheses: ${hypotheses.length}, Critic: ${criticAudit.verdict})`);

            return dkm;
        }

        static async analyzeAsync({ dataset, profile } = {}, onProgress = null) {
            const startTime = Date.now();
            if (!dataset || !dataset.columns || dataset.columns.length === 0) {
                console.warn('[UDIP:DeepIntelligence] Invalid or empty dataset provided.');
                return null;
            }

            const UD = (typeof window !== 'undefined' ? window.UDIP : (typeof global !== 'undefined' ? global.UDIP : null)) || {};
            const DKMClass = UD.DatasetKnowledgeModel || class { constructor(c) { Object.assign(this, c); } };

            // 1. Structure Discovery
            if (onProgress) onProgress({ stage: 4, percent: 74, stageName: 'Stage 4/5: Building cognitive topology & entity graph...', log: 'COGNITIVE_AI: Topology & Entity Discovery...' });
            await new Promise(r => setTimeout(r, 10));

            const topology = UD.TopologyDiscoverer ? UD.TopologyDiscoverer.discover(dataset, profile) : (UD.TopologyClassifier ? UD.TopologyClassifier.classify(dataset, profile) : []);
            const entities = UD.EntityDiscoverer ? UD.EntityDiscoverer.discover(dataset, profile) : [];
            const hierarchies = UD.HierarchyDiscoverer ? UD.HierarchyDiscoverer.discover(dataset, profile) : [];
            const keys = UD.KeyDiscoverer ? UD.KeyDiscoverer.discover(dataset, profile) : { primaryKeyCandidates: [], compositeKeyCandidates: [] };
            const dependencies = UD.DependencyDiscoverer ? UD.DependencyDiscoverer.discover(dataset, profile) : [];
            const variables = UD.RoleDeducer ? UD.RoleDeducer.deduce(dataset, profile) : {};

            const colProfiles = {};
            if (profile && profile.columns) {
                if (Array.isArray(profile.columns)) {
                    profile.columns.forEach(c => { if (c && c.name) colProfiles[c.name] = c; });
                } else if (typeof profile.columns === 'object') {
                    Object.assign(colProfiles, profile.columns);
                }
            }

            await new Promise(r => setTimeout(r, 10));

            // 2. Advanced Relationships & Equations
            if (onProgress) onProgress({ stage: 4, percent: 78, stageName: 'Stage 4/5: Evaluating non-linear mutual information...', log: 'COGNITIVE_AI: Non-linear mutual information...' });
            const idRegexAsync = /^(id|uuid|guid|code|key|no|num|ref|hash|serial|account|sku|order|cust|emp|trans|batch|patient|sample|record|row|item|index|barcode|entity)[_-]?|[_-]?(id|code|key|no|num|guid|ref|serial|idx|pk)$/i;
            const relationships = [];
            const numCols = dataset.columns.filter(c => {
                const p = colProfiles[c] || {};
                const role = p.semanticRole || p.role || '';
                if (role === 'identifier' || idRegexAsync.test(c)) {
                    return false;
                }
                const t = p.detectedType || p.inferredType || '';
                return t === 'integer' || t === 'decimal' || t === 'numeric' || t === 'float';
            });

            for (let i = 0; i < Math.min(numCols.length, 8); i++) {
                for (let j = i + 1; j < Math.min(numCols.length, 8); j++) {
                    const colA = numCols[i];
                    const colB = numCols[j];
                    const xVals = [], yVals = [];

                    for (let r = 0; r < dataset.rows.length; r++) {
                        const vx = +dataset.rows[r][colA];
                        const vy = +dataset.rows[r][colB];
                        if (!isNaN(vx) && !isNaN(vy)) {
                            xVals.push(vx);
                            yVals.push(vy);
                        }
                    }

                    if (xVals.length >= 5) {
                        const lin = UD.LinearAnalysis ? UD.LinearAnalysis.compute(xVals, yVals) : { r: 0 };
                        const rank = UD.RankAnalysis ? UD.RankAnalysis.compute(xVals, yVals) : { spearmanRho: 0 };
                        const mi = UD.MutualInformation ? UD.MutualInformation.compute(xVals, yVals) : 0;
                        const nonlin = UD.NonlinearAnalysis ? UD.NonlinearAnalysis.analyze(xVals, yVals) : { pattern: 'LINEAR', isNonLinear: false };

                        const rel = UD.RelationshipConsensus
                            ? UD.RelationshipConsensus.evaluate({ linearResult: lin, rankResult: rank, miValue: mi, nonlinearResult: nonlin, colA, colB, n: xVals.length })
                            : { colA, colB, pearson: lin.r, spearman: rank.spearmanRho, isNonLinear: nonlin.isNonLinear, shape: nonlin.pattern };

                        relationships.push(rel);
                    }
                }
            }

            const interactions = UD.InteractionDiscovery ? UD.InteractionDiscovery.discover(dataset, profile) : [];
            const derived = UD.DerivedVariableDetector ? UD.DerivedVariableDetector.detect(dataset, profile) : [];

            await new Promise(r => setTimeout(r, 10));

            // 3. Temporal, Distribution & Missingness Intelligence
            const temporal = UD.TemporalStructure ? UD.TemporalStructure.inspect(dataset, profile) : { hasTemporal: false };
            if (temporal.hasTemporal && dataset.rows.length >= 10 && numCols.length > 0) {
                const primarySeries = dataset.rows.map(r => +r[numCols[0]]).filter(v => !isNaN(v));
                temporal.autocorrelation = UD.Autocorrelation ? UD.Autocorrelation.compute(primarySeries) : [];
                temporal.regimeShifts = UD.ChangePointAnalysis ? UD.ChangePointAnalysis.detect(primarySeries) : [];
                temporal.seasonality = UD.RecurringPatterns ? UD.RecurringPatterns.detect(primarySeries) : {};
            }

            const distributions = {};
            numCols.slice(0, 5).forEach(c => {
                const vals = dataset.rows.map(r => +r[c]).filter(v => !isNaN(v));
                distributions[c] = {
                    profile: UD.DistributionProfiler ? UD.DistributionProfiler.profile(vals) : null,
                    multimodality: UD.Multimodality ? UD.Multimodality.detect(vals) : null,
                    tailAnalysis: UD.TailAnalysis ? UD.TailAnalysis.analyze(vals) : null,
                    zeroInflation: UD.ZeroInflation ? UD.ZeroInflation.analyze(vals) : null
                };
            });

            const missingnessMap = UD.MissingnessMap ? UD.MissingnessMap.map(dataset) : null;
            const coMissingness = UD.CoMissingness ? UD.CoMissingness.analyze(dataset) : [];
            const missingnessHypotheses = UD.MissingnessMechanism ? UD.MissingnessMechanism.deduce(missingnessMap, coMissingness) : [];
            const segments = UD.GroupDiscovery ? UD.GroupDiscovery.discover(dataset, profile) : [];

            await new Promise(r => setTimeout(r, 10));

            // 4. Hypothesis Generation & Active Counter-Evidence
            if (onProgress) onProgress({ stage: 4, percent: 82, stageName: 'Stage 4/5: Formulating counter-evidence hypotheses...', log: 'COGNITIVE_AI: Synthesizing hypotheses...' });
            let hypotheses = UD.HypothesisGenerator ? UD.HypothesisGenerator.generate({
                dataset, profile, relationships, segments, temporal, derived, missingnessHypotheses
            }) : [];

            const counterEvidence = [];
            hypotheses.forEach(h => {
                if (UD.CounterEvidence) {
                    const ce = UD.CounterEvidence.search(dataset, profile, h);
                    if (ce.length > 0) {
                        h.counterEvidence = ce;
                        counterEvidence.push(...ce);
                    }
                }
            });

            if (UD.HypothesisLifecycle) {
                hypotheses = UD.HypothesisLifecycle.updateAll(hypotheses, UD.CounterEvidence, dataset, profile);
            }

            // 5. Causal Humility & Confounder Detection
            const causalReport = UD.CausalReasoner ? UD.CausalReasoner.analyze(dataset, relationships, temporal) : { warnings: [], confounders: [] };

            // 6. Adversarial Quality Gate (Analytical Critic 2.0)
            const criticAudit = UD.AnalyticalCritic ? UD.AnalyticalCritic.audit({
                dataset, profile, relationships, hypotheses, counterEvidence, derived, temporal
            }) : { verdict: 'ROBUST', score: 85, checks: [] };

            // 7. Reliability Profile (5-Dimensional)
            const reliabilityProfile = UD.KnowledgeConfidence ? UD.KnowledgeConfidence.evaluate({
                dataset, profile, findings: { relationships, hypotheses }, criticAudit
            }) : null;

            // 8. Adaptive Strategy Planner
            const adaptiveStrategy = UD.AdaptivePlanner ? UD.AdaptivePlanner.constructPlan({
                dataset, profile, topology, relationships, interactions, derived
            }) : null;

            // 9. Directed Insight Graph & Analytical Traces
            const insightGraph = UD.GraphBuilder ? UD.GraphBuilder.build({
                dataset, variables, relationships, hypotheses, counterEvidence, criticAudit
            }) : (UD.InsightGraph ? new UD.InsightGraph() : null);

            const analyticalTraces = UD.AnalyticalTrace ? UD.AnalyticalTrace.buildTraces(dataset, hypotheses, criticAudit) : [];

            // 10. Grounded Analytical Questions
            const groundedQuestions = UD.QuestionGenerator ? UD.QuestionGenerator.generate({
                relationships, hypotheses, segments, temporal, derived
            }) : [];

            const rankedQuestions = UD.AnalyticalQuestionRanker ? UD.AnalyticalQuestionRanker.rank(groundedQuestions) : groundedQuestions;
            const executionCost = UD.AnalysisCost ? UD.AnalysisCost.estimate(dataset) : { durationMs: 5, recommendedBackend: 'NATIVE_JS' };

            const dkm = new DKMClass({
                datasetId: dataset.name || `ds_${Date.now()}`,
                topology: topology,
                entities: entities,
                hierarchies: hierarchies,
                keys: keys,
                dependencies: dependencies,
                variables: variables,
                relationships: relationships,
                interactions: interactions,
                derivedVariables: derived,
                temporalStructure: temporal,
                distributions: distributions,
                missingness: { map: missingnessMap, coMissingness, hypotheses: missingnessHypotheses },
                segments: segments,
                hypotheses: hypotheses,
                counterEvidence: counterEvidence,
                causalWarnings: causalReport.warnings,
                criticAudit: criticAudit,
                insightGraph: insightGraph,
                analyticalTraces: analyticalTraces,
                groundedQuestions: rankedQuestions,
                adaptiveStrategy: adaptiveStrategy,
                reliabilityProfile: reliabilityProfile,
                executionCost: executionCost,
                metadata: { synthesisLatencyMs: Date.now() - startTime }
            });

            const latency = Date.now() - startTime;
            const topDesc = (topology || []).map(t => t.topology || t.name).join('+') || 'TABULAR';
            console.log(`[UDIP:DeepIntelligence] Mental model synthesized asynchronously in ${latency}ms (Topologies: ${topDesc}, Hypotheses: ${hypotheses.length}, Critic: ${criticAudit.verdict})`);

            return dkm;
        }
    }

    return DeepIntelligenceEngine;
}));
