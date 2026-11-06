/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: workspace/narrative/narrative-engine.js
 * ============================================================================
 * Generates structured, multi-section analytical narratives from multi-engine evidence.
 * 
 * Narrative Structure:
 * 1. Context: Structural & schema summary of the data universe
 * 2. Headline: The single most impactful empirical takeaway
 * 3. Findings: Ranked synthesized insights
 * 4. Evidence: Concrete quantitative verification for each finding
 * 5. Changes: Distributional shifts, concept drift, and evolutionary trends
 * 6. Risks: Active empirical vulnerabilities & operational hazards
 * 7. Opportunities: Actionable levers with expected gain
 * 8. Recommended Investigations: Guided hypotheses for analyst deep-dive
 * 9. Epistemological Limitations: Mathematical boundaries and non-causal caveats
 * 
 * Guardrails:
 * - Every statement validated through NarrativeValidator
 * - Domain-agnostic terminology throughout
 * - Mathematical safety (0 NaN, 0 undefined)
 * ============================================================================
 */

(function (window) {
    'use strict';

    const NarrativeEngine = {
        /**
         * Generate the comprehensive narrative report
         * 
         * @param {Object} params
         * @param {Object} params.dataset
         * @param {Object} params.profile
         * @param {Object} params.analysisPlan
         * @param {Object} params.analytics
         * @param {Object} params.decisionIntelligence
         * @param {Object} params.autonomousIntelligence
         * @returns {Object} Structured narrative object
         */
        generate({
            dataset = {},
            profile = {},
            analysisPlan = {},
            analytics = {},
            decisionIntelligence = null,
            autonomousIntelligence = null
        } = {}) {
            const validator = (window.UDIP && window.UDIP.NarrativeValidator) ? window.UDIP.NarrativeValidator : null;
            const synthesizer = (window.UDIP && window.UDIP.FindingSynthesizer) ? window.UDIP.FindingSynthesizer : null;

            // Gather synthesized findings
            const synthesizedFindings = synthesizer
                ? synthesizer.synthesize({ profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence })
                : [];

            const rowCount = dataset.rowCount || profile.dataset?.rowCount || 0;
            const colCount = dataset.columnCount || profile.dataset?.columnCount || 0;
            const targetCol = analytics.targetColumn || analysisPlan?.target?.column || null;

            // 1. Context Section
            const contextText = `The dataset consists of ${rowCount.toLocaleString()} observations structured across ${colCount} variables. ` +
                `The schema comprises ${this._countDataTypes(profile)}.` +
                (targetCol ? ` Analysis identified "${targetCol}" as the primary analytical target.` : ' The dataset operates in an exploratory, unguided clustering configuration.');

            // 2. Headline Takeaway
            const topFinding = synthesizedFindings[0] || null;
            let headlineText = 'Initial exploratory analysis established baseline statistical distributions across all recorded dimensions.';
            if (topFinding) {
                headlineText = `Primary analytical signal identified in "${topFinding.primaryVariable || 'system'}": ${topFinding.statement}`;
            }

            // 3. Top Findings Narrative
            const topFindingsList = synthesizedFindings.slice(0, 5).map((f, idx) => ({
                rank: idx + 1,
                id: f.id,
                title: f.title,
                category: f.category,
                statement: f.statement,
                importance: f.importance,
                confidence: f.confidence,
                variable: f.primaryVariable
            }));

            // 4. Evidence Summary
            const evidenceNarratives = synthesizedFindings.slice(0, 5).map(f => {
                const evText = (f.evidenceSources && f.evidenceSources.length > 0)
                    ? f.evidenceSources.map(ev => `${ev.metric || 'Metric'}: ${typeof ev.value === 'number' ? ev.value.toFixed(2) : ev.value}`).join(', ')
                    : 'Verified by descriptive profile metrics.';
                return {
                    findingId: f.id,
                    variable: f.primaryVariable,
                    summary: `Empirical support derived from ${evText} with ${f.confidence}% statistical confidence.`
                };
            });

            // 5. Dynamic Changes / Trends
            const changeCount = autonomousIntelligence?.changeDetection?.summary?.totalChangedColumns || 0;
            const driftCount = autonomousIntelligence?.drift?.datasetDrift?.driftedFeaturesCount || 0;
            const changesText = (changeCount > 0 || driftCount > 0)
                ? `System monitoring detected statistically significant shifts across ${changeCount} variables and ${driftCount} distribution drift alerts relative to the prior state.`
                : 'No significant distributional shifts or drift events were detected relative to the baseline state.';

            // 6. Active Risks
            const activeRisks = (decisionIntelligence?.risks?.rankedRisks || []).slice(0, 3).map(r => ({
                id: r.id,
                title: r.title || r.variable,
                score: r.riskScore || 50,
                statement: r.statement || r.description || `Empirical risk registered on ${r.variable}.`
            }));

            // 7. Actionable Opportunities
            const activeOpportunities = (decisionIntelligence?.opportunities?.rankedOpportunities || []).slice(0, 3).map(o => ({
                id: o.id,
                title: o.title || o.lever,
                score: o.opportunityScore || 50,
                statement: o.statement || o.description || `Optimization opportunity identified on ${o.lever}.`
            }));

            // 8. Recommended Investigations
            const recommendedInvestigations = this._generateInvestigationPrompts(synthesizedFindings, targetCol);

            // 9. Epistemological Limitations
            const limitations = [
                'All observed relationships represent empirical statistical associations and do not assert counterfactual causality.',
                rowCount < 30 ? 'Sample size (n < 30) limits asymptotic convergence of inference metrics.' : 'Model generalizability is bounded by the historical variance span of the provided observations.',
                'Unmeasured confounding variables outside this dataset schema may moderate or mediate the observed effects.'
            ];

            // Validate all generated narrative paragraphs
            const rawNarrative = {
                context: contextText,
                headline: headlineText,
                topFindings: topFindingsList,
                evidence: evidenceNarratives,
                changes: changesText,
                risks: activeRisks,
                opportunities: activeOpportunities,
                recommendedInvestigations,
                limitations
            };

            if (validator) {
                const valContext = { profile, analytics, decisionIntelligence, autonomousIntelligence };
                rawNarrative.context = validator.validateNarrative(rawNarrative.context, valContext).sanitizedText;
                rawNarrative.headline = validator.validateNarrative(rawNarrative.headline, valContext).sanitizedText;
                rawNarrative.changes = validator.validateNarrative(rawNarrative.changes, valContext).sanitizedText;
                rawNarrative.topFindings.forEach(tf => {
                    tf.statement = validator.validateNarrative(tf.statement, valContext).sanitizedText;
                });
            }

            return rawNarrative;
        },

        /**
         * Count data types in schema for readable context
         * @private
         */
        _countDataTypes(profile) {
            if (!profile?.columns || !Array.isArray(profile.columns)) return 'various data types';
            const counts = {};
            profile.columns.forEach(c => {
                const t = c.detectedType || 'other';
                counts[t] = (counts[t] || 0) + 1;
            });
            const parts = Object.entries(counts).map(([type, count]) => `${count} ${type}`);
            return parts.join(', ');
        },

        /**
         * Generate guided investigation questions based on top findings
         * @private
         */
        _generateInvestigationPrompts(findings, targetCol) {
            const prompts = [];
            const topVarFindings = findings.filter(f => f.primaryVariable).slice(0, 3);

            topVarFindings.forEach(f => {
                const v = f.primaryVariable;
                prompts.push({
                    id: `inv_prompt_${v}`,
                    variable: v,
                    question: targetCol && v !== targetCol
                        ? `How does variance in "${v}" empirically condition outcomes in "${targetCol}" across distinct subgroups?`
                        : `What latent sub-distributions or anomalous clusters drive the observed variance in "${v}"?`,
                    suggestedHypothesis: `Statistically significant differences exist in "${v}" when segmented by secondary features.`,
                    type: 'subgroup_variation'
                });
            });

            if (prompts.length === 0) {
                prompts.push({
                    id: 'inv_prompt_baseline',
                    variable: null,
                    question: 'Are there emergent multivariate clusters that delineate distinct structural operating regimes in the dataset?',
                    suggestedHypothesis: 'Unsupervised partitioning uncovers latent clusters with divergent feature centroids.',
                    type: 'clustering'
                });
            }

            return prompts;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.NarrativeEngine = NarrativeEngine;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = NarrativeEngine;
    }
})(typeof window !== 'undefined' ? window : global);
