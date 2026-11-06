/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: decision/executive/executive-summary.js
 * ============================================================================
 * Synthesizes analytical and decision intelligence into a concise,
 * executive-level decision briefing.
 * 
 * Directly answers the 7 Core Leadership Inquiries:
 * 1. What happened? (Empirical State)
 * 2. What matters most? (Primary Driver)
 * 3. What evidence supports it? (Evidentiary Corroboration)
 * 4. What should be investigated? (Root-Cause Candidates & Risks)
 * 5. What should be prioritized? (Ranked Decisions)
 * 6. How confident are we? (Overall Confidence & Trust)
 * 7. What are the limitations? (Uncertainty & Boundaries)
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ExecutiveSummary = {
        /**
         * Generate a 7-question executive decision briefing
         * 
         * @param {Object} params
         * @param {Object} params.profile
         * @param {Object} params.analysisPlan
         * @param {Object} params.analytics
         * @param {Array<Object>} params.insights
         * @param {Array<Object>} params.decisions
         * @param {Array<Object>} params.risks
         * @param {Array<Object>} params.opportunities
         * @param {Array<Object>} params.rootCauses
         * @param {Object} params.governance
         * @param {Object} params.evidenceSummary
         * @returns {Object} Structured Executive Briefing
         */
        generate({
            profile = {},
            analysisPlan = {},
            analytics = {},
            insights = [],
            decisions = [],
            risks = [],
            opportunities = [],
            rootCauses = [],
            governance = {},
            selfChallenge = null,
            evidenceSummary = {}
        } = {}) {
            const totalRows = profile?.dataset?.rowCount || 0;
            const totalCols = profile?.dataset?.columnCount || 0;
            const targetCol = analysisPlan?.primaryTarget?.column || null;

            if (totalRows === 0) {
                return {
                    overallConfidence: {
                        score: 0,
                        level: 'very_low',
                        label: 'No Confidence (Empty Dataset)',
                        dataQualityScore: 0,
                        modelTrustScore: 0
                    },
                    coreAnswers: {
                        whatHappened: 'Dataset contains no records to analyze.',
                        whatMattersMost: 'N/A — Ingestion required.',
                        whatEvidenceSupportsIt: 'No empirical evidence generated.',
                        whatShouldBeInvestigated: 'Verify data source and pipeline integrity.',
                        whatShouldBePrioritized: 'Upload a non-empty tabular dataset.',
                        howConfidentAreWe: 'Confidence is 0% due to zero observations.',
                        whatAreTheLimitations: ['Dataset contains no records.']
                    }
                };
            }

            // 1. Overall Confidence Synthesis
            const qualScore = profile?.quality?.score || 80;
            const planConf = analysisPlan?.confidence?.score || 80;
            const analyticsConf = analytics?.confidence?.score || 80;
            const govTrust = governance?.trustScore || (governance.status === 'completed' ? 70 : 80);

            // Penalties
            let penalty = 0;
            if (totalRows < 30 && totalRows > 0) penalty += 15;
            if (analysisPlan?.leakage?.riskLevel === 'high') penalty += 20;
            if (selfChallenge?.decisionStatus === 'WITHHELD') penalty += 25;

            const compositeConf = Math.max(10, Math.min(100, Math.round(
                (qualScore * 0.25 + planConf * 0.25 + analyticsConf * 0.25 + govTrust * 0.25) - penalty
            )));

            let confidenceLevel = 'moderate';
            if (compositeConf >= 85) confidenceLevel = 'very_high';
            else if (compositeConf >= 70) confidenceLevel = 'high';
            else if (compositeConf >= 50) confidenceLevel = 'moderate';
            else if (compositeConf >= 35) confidenceLevel = 'low';
            else confidenceLevel = 'very_low';

            const isWithheld = selfChallenge?.decisionStatus === 'WITHHELD';

            // Top items
            const topDecision = decisions[0] || null;
            const topRisk = risks[0] || null;
            const topOpp = opportunities[0] || null;
            const topInsight = insights[0] || null;
            const topCandidate = rootCauses[0] || null;

            // Answering the 7 Core Leadership Questions
            const coreAnswers = {
                whatHappened: `Audited ${totalRows} records across ${totalCols} columns. ${targetCol ? `Identified "${targetCol}" as primary outcome variable with ${analytics?.machineLearning?.taskType || 'exploratory'} modeling.` : 'Completed descriptive distribution profiling and unsupervised correlation analysis.'}`,
                whatMattersMost: topInsight
                    ? `${topInsight.title}: ${topInsight.observation}`
                    : (topCandidate ? `Key candidate driver "${topCandidate.candidate}" exhibits dominant predictive association with target outcomes.` : 'Baseline exploratory parameters established across all features.'),
                whatEvidenceSupportsIt: `Supported by ${evidenceSummary?.total || 0} empirical findings (${evidenceSummary?.strong || 0} strong, ${evidenceSummary?.moderate || 0} moderate) across hypothesis testing, regression/classification benchmarks, and distribution profiling.`,
                whatShouldBeInvestigated: topRisk
                    ? `Priority investigation: ${topRisk.title} — ${topRisk.mitigation}`
                    : (topCandidate ? `Investigate causal responsiveness of candidate driver "${topCandidate.candidate}" via controlled trials.` : 'Audit data capture processes for completeness.'),
                whatShouldBePrioritized: isWithheld
                    ? `Insufficient evidence — recommendation withheld. (Vulnerabilities: ${(selfChallenge?.criticalVulnerabilities || []).join('; ')})`
                    : (topDecision
                        ? `Top Decision [Priority: ${topDecision.priority?.toUpperCase() || 'HIGH'}]: ${topDecision.decision}. ${topDecision.rationale}`
                        : 'Maintain automated KPI monitoring and periodic data refresh.'),
                howConfidentAreWe: `Overall Decision Intelligence Confidence is rated at ${compositeConf}% (${confidenceLevel.toUpperCase()}). Data Quality: ${qualScore}/100, Model Trust: ${governance?.trustScore || 'N/A'}/100, Self-Challenge Status: ${selfChallenge?.decisionStatus || 'APPROVED'}.`,
                whatAreTheLimitations: [
                    totalRows < 50 ? `Small sample size (n = ${totalRows}) increases estimator variance.` : null,
                    analysisPlan?.leakage?.riskLevel === 'high' ? 'High data leakage risk requires feature isolation before production deployment.' : null,
                    isWithheld ? `Self-challenge withheld active recommendations: ${(selfChallenge?.criticalVulnerabilities || []).join(', ')}` : null,
                    'Observational dataset: statistical associations cannot guarantee causal intervention outcomes without experimental validation.',
                    'Operational cost, feasibility, and resource constraints are unobserved in the uploaded tabular dataset.'
                ].filter(Boolean)
            };

            return {
                overallConfidence: {
                    score: compositeConf,
                    level: confidenceLevel,
                    dataQualityScore: qualScore,
                    modelTrustScore: governance?.trustScore || null,
                    selfChallengeStatus: selfChallenge?.decisionStatus || 'APPROVED'
                },
                highlights: {
                    topFinding: topInsight?.title || 'Data Profiling Complete',
                    topDecision: isWithheld ? 'Recommendation Withheld (Insufficient Evidence)' : (topDecision?.decision || 'Continue Monitoring'),
                    topRisk: topRisk?.title || 'None Identified',
                    topOpportunity: topOpp?.title || 'Process Baseline'
                },
                coreAnswers,
                executiveGuidance: isWithheld
                    ? `Operational recommendations withheld due to adversarial audit failure: ${(selfChallenge?.criticalVulnerabilities || []).join(', ')}. Restrict usage to diagnostic trials.`
                    : (topDecision
                        ? `Immediate operational focus should be directed toward Rank 1 decision ("${topDecision.decision}"), accompanied by risk mitigation for "${topRisk?.title || 'data quality'}".`
                        : 'Maintain metric collection to accumulate sufficient sample depth for supervised optimization.')
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.ExecutiveSummary = ExecutiveSummary;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ExecutiveSummary;
    }
})(typeof window !== 'undefined' ? window : global);
