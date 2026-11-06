/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: decision/opportunity/opportunity-engine.js
 * ============================================================================
 * Detects evidence-backed strategic and operational opportunities from:
 * - Top predictive driver leverage
 * - Segment performance divergence (high-performing groups)
 * - Positive temporal trajectory momentum
 * - Predictable pattern stability
 * 
 * Strict Constraint:
 * Never invents financial or operational metrics (no fabricated currency/ROI)
 * if the dataset does not contain currency or cost dimensions.
 * Explicitly notes operational prerequisites and feasibility dependencies.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const OpportunityEngine = {
        /**
         * Detect empirical opportunities from fused analytical evidence
         * 
         * @param {Object} params
         * @param {Object} params.profile
         * @param {Object} params.analysisPlan
         * @param {Object} params.analytics
         * @param {Array<Object>} [params.evidenceItems]
         * @param {Object} [params.traceRegistry]
         * @returns {Array<Object>} List of detected opportunities
         */
        detect({ profile = {}, analysisPlan = {}, analytics = {}, evidenceItems = [], traceRegistry = null }) {
            const opportunities = [];
            let counter = 1;

            const nextId = () => `OPP-${String(counter++).padStart(3, '0')}`;
            const targetCol = analysisPlan?.primaryTarget?.column || null;

            const addOpp = (opp, evList = []) => {
                opportunities.push(opp);
                if (traceRegistry && typeof traceRegistry.addTrace === 'function') {
                    traceRegistry.addTrace(opp.id, 'opportunity', evList, `Opportunity: ${opp.title}`);
                }
            };

            // -----------------------------------------------------------------
            // 1. Predictive Driver Leverage Opportunity
            // -----------------------------------------------------------------
            const featEvs = evidenceItems.filter(e => e.type === 'feature_importance' && (e.value >= 25 || (e.value <= 1.0 && e.value >= 0.25)));
            if (featEvs.length > 0 && targetCol) {
                const topFeat = featEvs[0];
                const featName = topFeat.supportingColumns[0];
                const corrEv = evidenceItems.find(e => e.type === 'correlation' && e.supportingColumns.includes(featName));
                const direction = corrEv && corrEv.value > 0 ? 'increasing' : (corrEv && corrEv.value < 0 ? 'optimizing' : 'adjusting');

                addOpp({
                    id: nextId(),
                    title: `Leverage Primary Predictive Driver "${featName}"`,
                    opportunity: `Targeted intervention or resource allocation on "${featName}" offers the highest empirical sensitivity toward improving "${targetCol}" (${topFeat.value}% relative importance).`,
                    potentialImpact: `Substantial responsiveness in "${targetCol}" per unit shift in "${featName}" under current model structure.`,
                    confidence: 85,
                    prerequisites: [
                        `Verify operational control over "${featName}".`,
                        `Conduct controlled sensitivity trial before full-scale implementation.`
                    ],
                    limitations: [
                        'Observational relationship: assumes ceteris paribus (other factors held constant).',
                        'Financial ROI or operational implementation cost is not captured in the dataset.'
                    ],
                    evidence: [topFeat, corrEv].filter(Boolean).map(e => ({ id: e.id, source: e.source, metric: e.metric, value: e.value }))
                }, [topFeat, corrEv].filter(Boolean));
            }

            // -----------------------------------------------------------------
            // 2. High-Performing Segment Expansion Opportunity
            // -----------------------------------------------------------------
            const eda = analytics?.exploratory || {};
            if (Array.isArray(eda.groupComparisons)) {
                eda.groupComparisons.forEach(grp => {
                    if (grp.groups && grp.groups.length >= 2) {
                        const sortedGroups = [...grp.groups].sort((a, b) => (b.mean || 0) - (a.mean || 0));
                        const best = sortedGroups[0];
                        const worst = sortedGroups[sortedGroups.length - 1];

                        if (best && worst && best.mean > worst.mean * 1.25) {
                            const diffPct = (((best.mean - worst.mean) / (worst.mean || 1)) * 100).toFixed(1);
                            const grpEv = evidenceItems.find(e => e.type === 'segment_divergence' && e.supportingColumns.includes(grp.categoricalColumn));
                            const evList = grpEv ? [grpEv] : evidenceItems.slice(0, 1);
                            addOpp({
                                id: nextId(),
                                title: `Benchmark against Best-Performing Segment "${best.name}" in "${grp.categoricalColumn}"`,
                                opportunity: `Subgroup "${best.name}" outperforms "${worst.name}" by ${diffPct}% in "${grp.numericColumn}". Emulating practices of this segment represents an improvement opportunity.`,
                                potentialImpact: `Potential upward distributional convergence toward the ${best.name} performance benchmark.`,
                                confidence: 80,
                                prerequisites: [
                                    `Identify structural and process differentiators characteristic of the "${best.name}" subgroup.`,
                                    `Ensure transferability of conditions to other segments.`
                                ],
                                limitations: [
                                    'Subgroup differences may be confounded by unmeasured demographic or environmental factors.'
                                ],
                                evidence: evList
                            }, evList);
                        }
                    }
                });
            }

            // -----------------------------------------------------------------
            // 3. Favorable Temporal Momentum Opportunity
            // -----------------------------------------------------------------
            const trendEv = evidenceItems.find(e => e.type === 'temporal_trend' && e.direction === 'increasing' && e.strength !== 'weak');
            if (trendEv) {
                addOpp({
                    id: nextId(),
                    title: `Capitalize on Favorable Temporal Momentum`,
                    opportunity: `Persistent positive trend (slope = ${trendEv.value}) confirms sustained performance growth over time across historical records.`,
                    potentialImpact: `Compounding performance trajectory if current operational conditions remain steady.`,
                    confidence: 80,
                    prerequisites: [
                        'Maintain current allocation parameters.',
                        'Monitor lead indicators for potential trend plateau or saturation.'
                    ],
                    limitations: [
                        'Historical trend continuation is subject to external capacity or boundary constraints.'
                    ],
                    evidence: [trendEv]
                }, [trendEv]);
            }

            // Fallback general opportunity if none triggered
            if (opportunities.length === 0) {
                const fallbackEv = evidenceItems.slice(0, 2);
                addOpp({
                    id: nextId(),
                    title: `Establish Systematic Performance Baseline`,
                    opportunity: `Dataset establishes a clean foundation for benchmark tracking, diagnostic monitoring, and KPI reporting.`,
                    potentialImpact: `Reduced decision latency through standardized metric visibility.`,
                    confidence: 75,
                    prerequisites: [
                        'Set up periodic dataset refresh and automated validation ingestion.'
                    ],
                    limitations: [
                        'Requires ongoing monitoring infrastructure.',
                        'Operational cost and feasibility are not captured in the dataset.'
                    ],
                    evidence: fallbackEv
                }, fallbackEv);
            }

            return opportunities;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.OpportunityEngine = OpportunityEngine;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = OpportunityEngine;
    }
})(typeof window !== 'undefined' ? window : global);
