/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: decision/root-cause/root-cause-engine.js
 * ============================================================================
 * Evaluates candidate drivers and potential contributing factors.
 * 
 * Strict Epistemological Policy:
 * Observational data CANNOT prove causality.
 * Every identified factor is explicitly labeled as a "Candidate Driver" or
 * "Potential Contributing Factor" and must include explicit validation
 * requirements (e.g. experimental validation, A/B testing).
 * ============================================================================
 */

(function (window) {
    'use strict';

    const RootCauseEngine = {
        /**
         * Evaluate and rank candidate root causes / contributing factors
         * 
         * @param {Object} params
         * @param {Array<Object>} params.evidenceItems
         * @param {Object} params.analysisPlan
         * @param {Object} params.analytics
         * @param {Object} [params.traceRegistry]
         * @returns {Array<Object>} List of candidate drivers
         */
        evaluate({ evidenceItems = [], analysisPlan = {}, analytics = {}, traceRegistry = null }) {
            const candidates = [];
            let counter = 1;

            const nextId = () => `RCC-${String(counter++).padStart(3, '0')}`;
            const targetCol = analysisPlan?.primaryTarget?.column || analytics?.machineLearning?.target || null;

            // Map evidence by column
            const colEvidence = {};
            evidenceItems.forEach(ev => {
                (ev.supportingColumns || []).forEach(c => {
                    if (targetCol && c === targetCol) return; // Skip target itself
                    if (!colEvidence[c]) colEvidence[c] = [];
                    colEvidence[c].push(ev);
                });
            });

            // Evaluate each potential candidate column
            Object.keys(colEvidence).forEach(colName => {
                const evs = colEvidence[colName];
                const supportingMethods = [];
                let compositeScore = 0;
                let directionalSignal = 'neutral';

                // 1. Feature Importance signal (up to 40 pts)
                const featEv = evs.find(e => e.type === 'feature_importance');
                if (featEv) {
                    supportingMethods.push('Machine Learning Feature Contribution');
                    const impPct = (featEv.value <= 1.0 && featEv.value > 0) ? featEv.value * 100 : (featEv.value || 0);
                    compositeScore += Math.min(40, impPct * 0.4);
                }

                // 2. Statistical Significance signal (up to 30 pts)
                const sigEv = evs.find(e => e.type === 'statistical_significance' && e.value < 0.05);
                if (sigEv) {
                    supportingMethods.push('Hypothesis Testing Significance');
                    compositeScore += 30;
                }

                // 3. Correlation signal (up to 20 pts)
                const corrEv = evs.find(e => e.type === 'correlation');
                if (corrEv) {
                    supportingMethods.push('Bivariate Correlation');
                    const rVal = corrEv.value || 0;
                    compositeScore += Math.min(20, Math.abs(rVal) * 20);
                    if (rVal > 0.15) directionalSignal = 'positive';
                    else if (rVal < -0.15) directionalSignal = 'negative';
                }

                // Check ML feature directional impact if available
                const mlFeatures = analytics?.machineLearning?.featureImportance || [];
                const matchedFeat = mlFeatures.find(f => f.feature === colName);
                if (matchedFeat && matchedFeat.direction && matchedFeat.direction !== 'neutral') {
                    directionalSignal = matchedFeat.direction;
                }

                // 4. Temporal Trend / Precedence signal (up to 15 pts)
                const trendEv = evs.find(e => e.type === 'temporal_trend');
                if (trendEv) {
                    supportingMethods.push('Temporal Precedence & Trend');
                    compositeScore += 15;
                }

                // 5. Segment Divergence signal (up to 15 pts)
                const grpEv = evs.find(e => e.type === 'segment_divergence');
                if (grpEv) {
                    supportingMethods.push('Categorical Subgroup Divergence');
                    compositeScore += 15;
                }

                const finalScore = Math.max(0, Math.min(100, Math.round(compositeScore)));

                // Threshold: candidates with empirical support
                if (finalScore >= 20 && supportingMethods.length >= 1) {
                    let confLevel = 'low';
                    if (finalScore >= 75 && supportingMethods.length >= 2) confLevel = 'very_high';
                    else if (finalScore >= 60) confLevel = 'high';
                    else if (finalScore >= 45) confLevel = 'moderate';

                    // Generate competing alternative hypotheses for this candidate
                    const altHypotheses = [
                        `Alternative Hypothesis 1 (Confounding): "${colName}" may serve as a proxy for unobserved background variables (e.g. temporal seasonality, macro shift, or customer cohort variance).`,
                        `Alternative Hypothesis 2 (Reverse Association): Variations in "${targetCol || 'target'}" could influence "${colName}" or arise simultaneously from common structural upstream factors.`
                    ];

                    const item = {
                        id: nextId(),
                        candidate: colName,
                        target: targetCol || 'Systemic Distributional Outcomes',
                        role: 'Candidate Driver / Potential Contributing Factor',
                        diagnosticCategory: 'Contributing Factor', // refined after sorting
                        score: finalScore,
                        confidence: confLevel,
                        directionOfImpact: directionalSignal,
                        impactSummary: directionalSignal === 'positive'
                            ? `Higher values of "${colName}" are associated with higher target outcomes.`
                            : (directionalSignal === 'negative'
                                ? `Higher values of "${colName}" are associated with lower target outcomes.`
                                : `Non-linear or mixed association observed with target outcomes.`),
                        supportingMethods: Array.from(new Set(supportingMethods)),
                        evidence: evs.map(e => ({ id: e.id, source: e.source, metric: e.metric, value: e.value })),
                        rationale: `"${colName}" exhibits high associative weight supported by ${supportingMethods.join(', ')}.`,
                        alternativeHypotheses: altHypotheses,
                        causalDisclaimer: 'Association detected — causal inference not established.',
                        validationRequirement: 'Requires controlled randomized trial, quasi-experiment, or A/B testing to establish whether intentional interventions on this variable reliably produce downstream shifts in the target.',
                        limitations: [
                            'Observational data only: statistical correlation does not establish causal directionality or intervention leverage.',
                            'Potential unobserved confounding variables could explain part or all of the empirical association.'
                        ]
                    };

                    candidates.push(item);

                    if (traceRegistry && typeof traceRegistry.addTrace === 'function') {
                        traceRegistry.addTrace(item.id, 'root_cause_candidate', evs, `Candidate driver "${colName}" (score: ${finalScore}/100)`);
                    }
                }
            });

            // Sort descending by evidence score
            candidates.sort((a, b) => b.score - a.score);

            // Assign Diagnostic Categories and Ranks
            candidates.forEach((c, idx) => {
                c.rank = idx + 1;
                if (idx === 0 && c.score >= 50) {
                    c.diagnosticCategory = 'Primary Driver';
                    c.role = 'Primary Candidate Driver';
                } else if (idx <= 2 && c.score >= 35) {
                    c.diagnosticCategory = 'Secondary Driver';
                    c.role = 'Secondary Contributing Driver';
                } else {
                    c.diagnosticCategory = 'Contributing Factor';
                    c.role = 'Potential Contributing Factor';
                }
            });

            return candidates;
        },

        /**
         * Generate a complete diagnostic report with structured driver hierarchy & competing hypotheses
         * 
         * @param {Object} params
         * @returns {Object} Comprehensive Diagnostic Report
         */
        diagnose({ evidenceItems = [], analysisPlan = {}, analytics = {}, traceRegistry = null } = {}) {
            const candidates = this.evaluate({ evidenceItems, analysisPlan, analytics, traceRegistry });
            const target = analysisPlan?.primaryTarget?.column || analytics?.machineLearning?.target || 'Systemic Target';

            const primaryDrivers = candidates.filter(c => c.diagnosticCategory === 'Primary Driver');
            const secondaryDrivers = candidates.filter(c => c.diagnosticCategory === 'Secondary Driver');
            const contributingFactors = candidates.filter(c => c.diagnosticCategory === 'Contributing Factor');

            const allAltHypotheses = candidates.flatMap(c => c.alternativeHypotheses || []);

            return {
                status: candidates.length > 0 ? 'completed' : 'insufficient_drivers',
                target,
                primaryDrivers,
                secondaryDrivers,
                contributingFactors,
                candidates,
                alternativeHypotheses: Array.from(new Set(allAltHypotheses)),
                causalDisclaimer: 'Association detected — causal inference not established.',
                diagnosticSummary: candidates.length > 0
                    ? `Identified ${candidates.length} candidate driver(s) associated with "${target}". Primary driver: "${candidates[0]?.candidate}" (score: ${candidates[0]?.score}/100, direction: ${candidates[0]?.directionOfImpact}).`
                    : `No statistically supported candidate drivers met minimum empirical thresholds for "${target}".`
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.RootCauseEngine = RootCauseEngine;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RootCauseEngine;
    }
})(typeof window !== 'undefined' ? window : global);
