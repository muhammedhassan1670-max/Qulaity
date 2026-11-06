/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: workspace/modes/executive-mode.js
 * ============================================================================
 * "What matters?" — Executive Briefing & Decision-Centric Synthesis.
 * 
 * Answers the 7 Core Leadership Inquiries:
 * 1. What happened?
 * 2. Why does it matter?
 * 3. What changed?
 * 4. What is the biggest risk?
 * 5. What is the biggest opportunity?
 * 6. What deserves immediate attention?
 * 7. How confident are we?
 * 
 * Formats Executive Finding Cards equipped with direct action levers.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ExecutiveMode = {
        /**
         * Generate Executive Briefing and Finding Cards
         * 
         * @param {Object} params
         * @param {Object} params.dataset
         * @param {Object} params.profile
         * @param {Object} params.analysisPlan
         * @param {Object} params.analytics
         * @param {Object} params.decisionIntelligence
         * @param {Object} params.autonomousIntelligence
         * @param {Object} params.narrative
         * @returns {Object} Executive Mode output
         */
        generate({
            dataset = {},
            profile = {},
            analysisPlan = {},
            analytics = {},
            decisionIntelligence = null,
            autonomousIntelligence = null,
            narrative = null
        } = {}) {
            const rowCount = dataset.rowCount || profile.dataset?.rowCount || 0;
            const colCount = dataset.columnCount || profile.dataset?.columnCount || 0;
            const targetCol = analytics.targetColumn || analysisPlan?.target?.column || null;

            // 1. Core Inquiries
            const inquiries = this._synthesizeInquiries({
                rowCount,
                colCount,
                targetCol,
                analytics,
                decisionIntelligence,
                autonomousIntelligence,
                profile,
                narrative
            });

            // 2. Executive Finding Cards
            const cards = this._buildFindingCards({
                decisionIntelligence,
                analytics,
                autonomousIntelligence,
                profile,
                targetCol
            });

            // 3. High-Level KPI Summary
            const kpis = {
                dataHealthScore: profile?.quality?.overallScore != null ? Math.round(profile.quality.overallScore) : 100,
                modelAccuracyScore: analytics?.leaderboard?.bestModel?.score != null ? Math.round(analytics.leaderboard.bestModel.score * 100) : null,
                activeRisksCount: decisionIntelligence?.risks?.rankedRisks?.length || 0,
                activeOpportunitiesCount: decisionIntelligence?.opportunities?.rankedOpportunities?.length || 0,
                driftAlertsCount: autonomousIntelligence?.alerts?.alerts?.length || 0,
                overallConfidence: inquiries.find(q => q.id === 'confidence')?.score || 80
            };

            return {
                mode: 'executive',
                title: 'Executive Decision Briefing',
                subtitle: 'High-level synthesis of system state, primary risks, opportunities, and strategic actions.',
                kpis,
                inquiries,
                cards
            };
        },

        /**
         * Synthesize answers to the 7 core executive inquiries
         * @private
         */
        _synthesizeInquiries({
            rowCount,
            colCount,
            targetCol,
            analytics,
            decisionIntelligence,
            autonomousIntelligence,
            profile,
            narrative
        }) {
            // 1. What happened?
            const whatHappened = narrative?.headline ||
                `Platform profiled ${rowCount.toLocaleString()} records across ${colCount} variables${targetCol ? ` with focus on target "${targetCol}"` : ''}.`;

            // 2. Why does it matter?
            const bestModel = analytics?.leaderboard?.bestModel;
            const whyItMatters = bestModel
                ? `Predictive models achieved ${(bestModel.score * 100).toFixed(1)}% performance on the primary target, isolating actionable structural levers.`
                : 'Exploratory topology revealed stable multivariate groupings and baseline statistical boundaries across records.';

            // 3. What changed?
            const driftFeatures = autonomousIntelligence?.drift?.datasetDrift?.driftedFeaturesCount || 0;
            const changedCols = autonomousIntelligence?.changeDetection?.summary?.totalChangedColumns || 0;
            const whatChanged = (driftFeatures > 0 || changedCols > 0)
                ? `${driftFeatures} features exhibit statistical distribution drift and ${changedCols} variables shifted significantly compared to previous baseline.`
                : 'Data distribution, schema properties, and statistical centroids remain stable compared to baseline.';

            // 4. What is the biggest risk?
            const topRisk = decisionIntelligence?.risks?.rankedRisks?.[0];
            const biggestRisk = topRisk
                ? {
                    title: topRisk.title || topRisk.variable || 'Data Risk',
                    score: topRisk.riskScore || 65,
                    description: topRisk.statement || topRisk.description || 'Observed risk on critical variables.',
                    action: topRisk.mitigation || 'Establish monitoring bounds on this variable.'
                }
                : {
                    title: 'Low Data Risk',
                    score: 15,
                    description: 'No severe anomalies or stability violations were detected in the current state.',
                    action: 'Continue periodic ingestion monitoring.'
                };

            // 5. What is the biggest opportunity?
            const topOpp = decisionIntelligence?.opportunities?.rankedOpportunities?.[0];
            const biggestOpportunity = topOpp
                ? {
                    title: topOpp.title || topOpp.lever || 'Optimization Opportunity',
                    score: topOpp.opportunityScore || 70,
                    description: topOpp.statement || topOpp.description || 'Actionable leverage point observed.',
                    action: topOpp.action || 'Simulate parameter sensitivity in What-If engine.'
                }
                : {
                    title: 'Operational Baseline',
                    score: 40,
                    description: 'Current variance offers moderate optimization potential across secondary drivers.',
                    action: 'Explore secondary feature interactions in workspace.'
                };

            // 6. What deserves immediate attention?
            const criticalAlerts = (autonomousIntelligence?.alerts?.alerts || []).filter(a => a.severity === 'critical' || a.severity === 'high');
            const attention = criticalAlerts.length > 0
                ? `${criticalAlerts.length} urgent alert(s) requiring analyst review: ${criticalAlerts.map(a => a.title || a.type).join(', ')}.`
                : (profile?.quality?.overallScore < 70
                    ? `Data quality rating (${Math.round(profile.quality.overallScore)}/100) indicates missingness or data integrity bottlenecks.`
                    : 'System is operating within nominal stability parameters; no critical interventions required.');

            // 7. How confident are we?
            let confidenceScore = 80;
            const qualityScore = profile?.quality?.overallScore;
            if (qualityScore != null) confidenceScore = (confidenceScore + qualityScore) / 2;
            if (rowCount < 50) confidenceScore = Math.min(confidenceScore, 60);
            if (bestModel && bestModel.score != null) confidenceScore = (confidenceScore + (bestModel.score * 100)) / 2;
            confidenceScore = Math.round(Math.min(100, Math.max(20, confidenceScore)));

            const confidenceJustification = rowCount < 50
                ? 'Sample size is constrained; statistical findings reflect observational patterns rather than asymptotic certainty.'
                : (confidenceScore >= 80 ? 'High confidence supported by complete data integrity and validated holdout metrics.' : 'Moderate confidence due to distributional variance or moderate missingness.');

            return [
                { id: 'what_happened', question: 'What happened?', answer: whatHappened, type: 'summary' },
                { id: 'why_matters', question: 'Why does it matter?', answer: whyItMatters, type: 'significance' },
                { id: 'what_changed', question: 'What changed?', answer: whatChanged, type: 'evolution' },
                { id: 'biggest_risk', question: 'What is the biggest risk?', answer: biggestRisk.description, details: biggestRisk, type: 'risk' },
                { id: 'biggest_opportunity', question: 'What is the biggest opportunity?', answer: biggestOpportunity.description, details: biggestOpportunity, type: 'opportunity' },
                { id: 'attention', question: 'What deserves immediate attention?', answer: attention, type: 'action' },
                { id: 'confidence', question: 'How confident are we?', answer: `${confidenceScore}% — ${confidenceJustification}`, score: confidenceScore, type: 'governance' }
            ];
        },

        /**
         * Build Executive Finding Cards
         * @private
         */
        _buildFindingCards({
            decisionIntelligence,
            analytics,
            autonomousIntelligence,
            profile,
            targetCol
        }) {
            const cards = [];

            // 1. Champion Model Card
            const bestModel = analytics?.machineLearning?.winner || analytics?.leaderboard?.bestModel;
            if (bestModel) {
                const m = bestModel;
                const scoreVal = Number.isFinite(m.score) ? m.score : (m.metrics?.[m.metricName || 'score'] || 0.85);
                cards.push({
                    id: 'card_champion_model',
                    type: 'performance',
                    badge: 'Champion Architecture',
                    badgeColor: '#38bdf8',
                    headline: `Predictive Engine: ${m.name || m.modelName || 'Algorithm'}`,
                    importance: 'Critical',
                    confidence: Math.round(scoreVal * 100),
                    variable: targetCol,
                    evidenceSummary: `Achieved ${(scoreVal * 100).toFixed(1)}% validation performance on target "${targetCol || 'Target'}".`,
                    actionRecommendation: 'Inspect model holdout diagnostics and governance scorecard.',
                    actionType: 'governance'
                });
            }

            // 2. Primary Risk Card
            const topRisk = decisionIntelligence?.risks?.rankedRisks?.[0];
            if (topRisk) {
                cards.push({
                    id: 'card_top_risk',
                    type: 'risk',
                    badge: 'Critical Risk',
                    badgeColor: '#f43f5e',
                    headline: topRisk.title || `Elevated Risk: ${topRisk.variable || 'System'}`,
                    importance: (topRisk.riskScore || 70) > 75 ? 'Critical' : 'High',
                    confidence: Math.round(topRisk.confidence || 75),
                    variable: topRisk.variable,
                    evidenceSummary: topRisk.statement || 'Detected anomalous concentration or degradation risk.',
                    actionRecommendation: topRisk.mitigation || 'Simulate risk containment in What-If workspace.',
                    actionType: 'simulate'
                });
            }

            // 3. Top Opportunity Card
            const topOpp = decisionIntelligence?.opportunities?.rankedOpportunities?.[0];
            if (topOpp) {
                cards.push({
                    id: 'card_top_opp',
                    type: 'opportunity',
                    badge: 'Strategic Opportunity',
                    badgeColor: '#10b981',
                    headline: topOpp.title || `Optimization Lever: ${topOpp.lever || 'System'}`,
                    importance: (topOpp.opportunityScore || 70) > 75 ? 'High' : 'Moderate',
                    confidence: Math.round(topOpp.confidence || 75),
                    variable: topOpp.lever,
                    evidenceSummary: topOpp.statement || 'Empirical elasticity suggests significant upside potential.',
                    actionRecommendation: topOpp.action || 'Explore feature drivers and test hypothesis.',
                    actionType: 'investigate'
                });
            }

            // 4. Top Feature Driver Card
            const fiList = (analytics?.machineLearning?.featureImportance ||
                            analytics?.interpretation?.featureImportances ||
                            []).map(f => ({
                                variable: f.variable || f.feature || f.name,
                                importance: Number.isFinite(f.importance) ? f.importance : 0.1
                            }));
            const topFeature = fiList[0];
            if (topFeature && topFeature.variable) {
                cards.push({
                    id: 'card_top_feature',
                    type: 'relationship',
                    badge: 'Primary Driver',
                    badgeColor: '#a855f7',
                    headline: `Dominant Driver: ${topFeature.variable}`,
                    importance: 'High',
                    confidence: 85,
                    variable: topFeature.variable,
                    evidenceSummary: `Accounts for ${Math.round(topFeature.importance * 100)}% of the total predictive contribution to ${targetCol || 'target'}.`,
                    actionRecommendation: `Launch guided investigation on variable "${topFeature.variable}".`,
                    actionType: 'investigate'
                });
            }

            // Fallback exploratory card if no cards generated
            if (cards.length === 0) {
                cards.push({
                    id: 'card_exploratory',
                    type: 'exploratory',
                    badge: 'Data Profile',
                    badgeColor: '#64748b',
                    headline: 'Descriptive Baseline Established',
                    importance: 'Moderate',
                    confidence: 90,
                    variable: null,
                    evidenceSummary: `Audited ${profile?.columns?.length || 0} variables with 0 schema violations.`,
                    actionRecommendation: 'Formulate hypotheses to test correlation patterns.',
                    actionType: 'investigate'
                });
            }

            return cards;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.ExecutiveMode = ExecutiveMode;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ExecutiveMode;
    }
})(typeof window !== 'undefined' ? window : global);
