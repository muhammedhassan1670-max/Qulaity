/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: decision/ranking/decision-ranker.js
 * ============================================================================
 * Synthesizes insights, risks, and opportunities into prioritized, ranked
 * strategic decisions.
 * 
 * Decision scoring formula weights:
 * - Evidence Strength (multi-method support vs single method)
 * - Impact Potential & Strategic Leverage
 * - Urgency & Risk Severity Mitigation
 * - Data Hygiene & Model Governance Confidence
 * 
 * Strict Constraint:
 * Never assumes financial feasibility or implementation cost.
 * Feasibility is explicitly marked: "Feasibility: Unknown" unless explicit
 * external constraints are provided.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DecisionRanker = {
        /**
         * Rank and prioritize decisions derived from analytical outputs
         * 
         * @param {Object} params
         * @param {Array<Object>} params.insights
         * @param {Array<Object>} params.risks
         * @param {Array<Object>} params.opportunities
         * @param {Array<Object>} params.rootCauses
         * @param {Object} [params.traceRegistry]
         * @returns {Array<Object>} Ranked list of actionable decisions
         */
        /**
         * Rank and prioritize decisions derived from analytical outputs
         * 
         * @param {Object} params
         * @param {Array<Object>} params.insights
         * @param {Array<Object>} params.risks
         * @param {Array<Object>} params.opportunities
         * @param {Array<Object>} params.rootCauses
         * @param {Object} [params.selfChallenge] - Adversarial audit report
         * @param {Object} [params.modelGovernance] - Governance metrics
         * @param {Object} [params.traceRegistry]
         * @returns {Array<Object>} Ranked list of actionable decisions
         */
        rankDecisions({
            insights = [],
            risks = [],
            opportunities = [],
            rootCauses = [],
            selfChallenge = null,
            modelGovernance = null,
            expertReasoning = null,
            traceRegistry = null
        } = {}) {
            const decisions = [];
            let counter = 1;

            const nextId = () => `DEC-${String(counter++).padStart(3, '0')}`;
            const isReasoningWithheld = expertReasoning?.decisionGate?.status === 'WITHHELD';
            const isWithheld = selfChallenge?.decisionStatus === 'WITHHELD' || isReasoningWithheld;
            const withholdingReason = expertReasoning?.decisionGate?.reason || selfChallenge?.withholdingReason || 'Insufficient evidence — recommendation withheld.';

            // Helper to score decision priorities
            const scoreDecision = (impact, urgency, evStrength, conf) => {
                const iWeight = impact === 'high' ? 35 : (impact === 'medium' ? 25 : 15);
                const uWeight = urgency === 'immediate' ? 30 : (urgency === 'near_term' ? 20 : 10);
                const eWeight = evStrength === 'strong' ? 25 : (evStrength === 'moderate' ? 15 : 5);
                const cWeight = (conf / 100) * 10;
                return Math.min(100, Math.round(iWeight + uWeight + eWeight + cWeight));
            };

            // 1. Decisions from Critical / High Risks (Risk Mitigation Decisions)
            risks.filter(r => r.severity === 'critical' || r.severity === 'high').forEach(r => {
                const dec = {
                    id: nextId(),
                    decision: isWithheld ? `[WITHHELD] Remediate ${r.title}` : `Remediate ${r.title}`,
                    expectedObjective: `Mitigate risk "${r.title}" to prevent estimated performance/integrity degradation.`,
                    rationale: `${r.rationale} Recommended action: ${r.mitigation}`,
                    underlyingRationale: r.rationale || '',
                    category: 'risk_mitigation',
                    evidenceStrength: r.evidence?.length >= 2 ? 'strong' : 'moderate',
                    confidence: r.confidence || 85,
                    decisionConfidence: r.confidence || 85,
                    modelConfidence: modelGovernance?.trustScore || 80,
                    impact: 'high',
                    urgency: r.severity === 'critical' ? 'immediate' : 'near_term',
                    risk: 'low', // Risk of executing this mitigation is low
                    feasibility: 'Unknown',
                    adversarialAudit: selfChallenge?.decisionStatus || 'APPROVED',
                    postInterventionValidation: 'Audit tracking logs and monitor data quality / distribution stability post-remediation.',
                    status: isWithheld ? 'WITHHELD' : 'ACTIVE',
                    withholdingNotice: isWithheld ? withholdingReason : null,
                    supportingInsights: [r.id],
                    evidenceIds: (r.evidence || []).map(e => e.id).filter(Boolean)
                };
                dec.score = scoreDecision(dec.impact, dec.urgency, dec.evidenceStrength, dec.confidence);
                dec.priority = dec.score >= 80 ? 'critical' : (dec.score >= 65 ? 'high' : 'medium');
                decisions.push(dec);

                if (traceRegistry && typeof traceRegistry.addTrace === 'function') {
                    traceRegistry.addTrace(dec.id, 'decision', r.evidence || [], `Mitigation decision for ${r.id}: ${dec.decision}`);
                }
            });

            // 2. Decisions from Opportunities (Growth & Performance Optimization)
            opportunities.forEach(opp => {
                const dec = {
                    id: nextId(),
                    decision: isWithheld ? `[WITHHELD] ${opp.title}` : opp.title,
                    expectedObjective: `Capture identified opportunity with target leverage: ${opp.potentialImpact || 'Positive KPI shift'}.`,
                    rationale: `${opp.opportunity} ${opp.potentialImpact}`,
                    underlyingRationale: opp.opportunity || '',
                    category: 'performance_optimization',
                    evidenceStrength: opp.evidence?.length >= 2 ? 'strong' : 'moderate',
                    confidence: opp.confidence || 80,
                    decisionConfidence: opp.confidence || 80,
                    modelConfidence: modelGovernance?.trustScore || 80,
                    impact: 'high',
                    urgency: 'near_term',
                    risk: 'medium',
                    feasibility: 'Unknown',
                    adversarialAudit: selfChallenge?.decisionStatus || 'APPROVED',
                    postInterventionValidation: 'Establish randomized control / treatment cohorts to measure realized lift vs baseline.',
                    status: isWithheld ? 'WITHHELD' : 'ACTIVE',
                    withholdingNotice: isWithheld ? withholdingReason : null,
                    supportingInsights: [opp.id],
                    evidenceIds: (opp.evidence || []).map(e => e.id).filter(Boolean)
                };
                dec.score = scoreDecision(dec.impact, dec.urgency, dec.evidenceStrength, dec.confidence);
                dec.priority = dec.score >= 80 ? 'critical' : (dec.score >= 65 ? 'high' : 'medium');
                decisions.push(dec);

                if (traceRegistry && typeof traceRegistry.addTrace === 'function') {
                    traceRegistry.addTrace(dec.id, 'decision', opp.evidence || [], `Opportunity decision for ${opp.id}: ${dec.decision}`);
                }
            });

            // 3. Decisions from High-Weight Root-Cause Candidates (Experimental Trials)
            rootCauses.slice(0, 2).forEach(rc => {
                const dec = {
                    id: nextId(),
                    decision: isWithheld ? `[WITHHELD] Launch Controlled Trial on Candidate Driver "${rc.candidate}"` : `Launch Controlled Trial on Candidate Driver "${rc.candidate}"`,
                    expectedObjective: `Validate causal impact of "${rc.candidate}" on target outcomes through empirical trial.`,
                    rationale: `"${rc.candidate}" displays high empirical leverage (score: ${rc.score}/100) toward target outcomes. ${rc.validationRequirement}`,
                    underlyingRationale: rc.rationale || '',
                    category: 'diagnostic_experiment',
                    evidenceStrength: rc.confidence === 'very_high' || rc.confidence === 'high' ? 'strong' : 'moderate',
                    confidence: rc.confidence === 'very_high' ? 90 : 80,
                    decisionConfidence: rc.confidence === 'very_high' ? 90 : 80,
                    modelConfidence: modelGovernance?.trustScore || 80,
                    impact: 'medium',
                    urgency: 'near_term',
                    risk: 'low',
                    feasibility: 'Unknown',
                    adversarialAudit: selfChallenge?.decisionStatus || 'APPROVED',
                    postInterventionValidation: rc.validationRequirement || 'Verify causal hypothesis through A/B testing or randomized trial.',
                    status: isWithheld ? 'WITHHELD' : 'ACTIVE',
                    withholdingNotice: isWithheld ? withholdingReason : null,
                    supportingInsights: [rc.id],
                    evidenceIds: (rc.evidence || []).map(e => e.id).filter(Boolean)
                };
                dec.score = scoreDecision(dec.impact, dec.urgency, dec.evidenceStrength, dec.confidence);
                dec.priority = dec.score >= 80 ? 'critical' : (dec.score >= 65 ? 'high' : 'medium');
                decisions.push(dec);

                if (traceRegistry && typeof traceRegistry.addTrace === 'function') {
                    traceRegistry.addTrace(dec.id, 'decision', rc.evidence || [], `Diagnostic trial decision for candidate ${rc.candidate}`);
                }
            });

            // 4. Decisions from Key Insights
            insights.filter(i => i.priority === 'high').forEach(ins => {
                if (!decisions.some(d => d.decision.includes(ins.title))) {
                    const dec = {
                        id: nextId(),
                        decision: isWithheld ? `[WITHHELD] ${ins.potentialDecision || `Act on ${ins.title}`}` : (ins.potentialDecision || `Act on ${ins.title}`),
                        expectedObjective: `Align operational workflows with empirical findings in "${ins.title}".`,
                        rationale: `${ins.observation} ${ins.implication}`,
                        underlyingRationale: ins.observation || '',
                        category: 'strategic_alignment',
                        evidenceStrength: ins.evidence?.length >= 2 ? 'strong' : 'moderate',
                        confidence: ins.confidence || 75,
                        decisionConfidence: ins.confidence || 75,
                        modelConfidence: modelGovernance?.trustScore || 80,
                        impact: ins.severity === 'major' ? 'high' : 'medium',
                        urgency: 'strategic',
                        risk: 'low',
                        feasibility: 'Unknown',
                        adversarialAudit: selfChallenge?.decisionStatus || 'APPROVED',
                        postInterventionValidation: 'Monitor segment metric evolution against pre-intervention historical baselines.',
                        status: isWithheld ? 'WITHHELD' : 'ACTIVE',
                        withholdingNotice: isWithheld ? withholdingReason : null,
                        supportingInsights: [ins.id],
                        evidenceIds: (ins.evidence || []).map(e => e.id).filter(Boolean)
                    };
                    dec.score = scoreDecision(dec.impact, dec.urgency, dec.evidenceStrength, dec.confidence);
                    dec.priority = dec.score >= 80 ? 'critical' : (dec.score >= 65 ? 'high' : 'medium');
                    decisions.push(dec);

                    if (traceRegistry && typeof traceRegistry.addTrace === 'function') {
                        traceRegistry.addTrace(dec.id, 'decision', ins.evidence || [], `Strategic decision for ${ins.id}: ${dec.decision}`);
                    }
                }
            });

            // Fallback baseline decision if none generated
            if (decisions.length === 0) {
                const dec = {
                    id: nextId(),
                    decision: 'Maintain Descriptive Monitoring and Expand Sampling Coverage',
                    expectedObjective: 'Accumulate observation depth and track drift baselines.',
                    rationale: 'Current dataset provides baseline exploratory visibility but lacks high-confidence supervisory signals.',
                    underlyingRationale: 'Insufficient sample depth or signal-to-noise ratio.',
                    category: 'monitoring',
                    evidenceStrength: 'weak',
                    confidence: 70,
                    decisionConfidence: 70,
                    modelConfidence: 60,
                    impact: 'low',
                    urgency: 'strategic',
                    risk: 'low',
                    priority: 'low',
                    feasibility: 'Unknown',
                    adversarialAudit: selfChallenge?.decisionStatus || 'ADVISORY',
                    postInterventionValidation: 'Re-audit predictive readiness after ingestion of additional records.',
                    status: 'ACTIVE',
                    withholdingNotice: null,
                    score: 50,
                    supportingInsights: [],
                    evidenceIds: []
                };
                decisions.push(dec);
            }

            // Sort descending by decision score
            decisions.sort((a, b) => b.score - a.score);

            // Assign ranks (1, 2, 3...)
            decisions.forEach((d, idx) => {
                d.rank = idx + 1;
            });

            return decisions;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.DecisionRanker = DecisionRanker;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DecisionRanker;
    }
})(typeof window !== 'undefined' ? window : global);
