/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: workspace/investigation/hypothesis-engine.js
 * ============================================================================
 * Hypothesis Testing, Evidence Evaluation, & Epistemic Classification.
 * 
 * Supports rigorous empirical testing of hypotheses against data and metrics:
 * Relations:
 * - 'positive_association'
 * - 'negative_association'
 * - 'strong_association'
 * - 'predictive_driver'
 * - 'higher_than'
 * - 'lower_than'
 * 
 * Classification Statuses:
 * - SUPPORTED
 * - PARTIALLY_SUPPORTED
 * - WEAKENED
 * - REJECTED
 * - INSUFFICIENT_EVIDENCE
 * ============================================================================
 */

(function (window) {
    'use strict';

    const HypothesisEngine = {
        /**
         * Formulate and empirically test a hypothesis
         * 
         * @param {Object} hypothesis
         * @param {string} hypothesis.variableA
         * @param {string} hypothesis.relation - 'positive_association' | 'negative_association' | 'strong_association' | 'predictive_driver' | 'higher_than' | 'lower_than'
         * @param {string} [hypothesis.variableB]
         * @param {number} [hypothesis.threshold]
         * @param {string} [hypothesis.statement]
         * @param {Object} context
         * @param {Object} context.profile
         * @param {Object} context.dataset
         * @param {Object} context.analytics
         * @returns {Object} Evaluated hypothesis result
         */
        testHypothesis(hypothesis = {}, context = {}) {
            const varA = hypothesis.variableA;
            const varB = hypothesis.variableB;
            const relation = hypothesis.relation || 'positive_association';
            const profile = context.profile || {};
            const dataset = context.dataset || {};
            const analytics = context.analytics || {};

            const isNumeric = (t) => ['numeric', 'integer', 'decimal', 'number'].includes(t);

            // Verify variable A exists
            const colA = (profile.columns || []).find(c => c.name === varA);
            if (!colA) {
                return this._formatResult(hypothesis, 'INSUFFICIENT_EVIDENCE', 0, `Variable "${varA}" does not exist in the dataset schema.`);
            }

            const n = dataset.rowCount || profile.dataset?.rowCount || 0;
            if (n < 6) {
                return this._formatResult(hypothesis, 'INSUFFICIENT_EVIDENCE', 20, `Sample size (n = ${n}) is too small for statistical hypothesis validation.`);
            }

            // Route relation testing
            switch (relation) {
                case 'positive_association':
                case 'negative_association':
                case 'strong_association':
                    return this._testCorrelationHypothesis(colA, varB, relation, context, hypothesis);

                case 'predictive_driver':
                    return this._testPredictiveDriverHypothesis(varA, analytics, hypothesis);

                case 'higher_than':
                case 'lower_than':
                    return this._testMeanComparisonHypothesis(colA, varB, hypothesis.threshold, relation, profile, hypothesis);

                default:
                    return this._testCorrelationHypothesis(colA, varB, 'positive_association', context, hypothesis);
            }
        },

        /**
         * Test association / correlation hypothesis
         * @private
         */
        _testCorrelationHypothesis(colA, varB, relation, context, hypothesis) {
            const profile = context.profile || {};
            const dataset = context.dataset || {};

            const colB = (profile.columns || []).find(c => c.name === varB);
            if (!colB) {
                return this._formatResult(hypothesis, 'INSUFFICIENT_EVIDENCE', 0, `Target comparison variable "${varB}" not found in schema.`);
            }

            // Compute Pearson correlation r
            const explorer = (window.UDIP && window.UDIP.EvidenceExplorer) ? window.UDIP.EvidenceExplorer : null;
            let r = 0;
            if (explorer) {
                r = explorer._pearsonCorrelation(dataset.rows || [], colA.name, colB.name);
            }

            let status = 'INSUFFICIENT_EVIDENCE';
            let confidence = 50;
            let summary = '';

            if (relation === 'positive_association') {
                if (r >= 0.35) {
                    status = 'SUPPORTED';
                    confidence = Math.min(95, Math.round(50 + (r * 45)));
                    summary = `Strong positive correlation observed (r = ${r.toFixed(3)}). Empirical data confirms co-movement.`;
                } else if (r >= 0.15) {
                    status = 'PARTIALLY_SUPPORTED';
                    confidence = 65;
                    summary = `Moderate positive correlation observed (r = ${r.toFixed(3)}). Weak co-movement trend detected.`;
                } else if (r >= -0.15) {
                    status = 'WEAKENED';
                    confidence = 55;
                    summary = `Correlation is near zero (r = ${r.toFixed(3)}). No reliable linear association was found.`;
                } else {
                    status = 'REJECTED';
                    confidence = 85;
                    summary = `Empirical evidence contradicts the claim: variables exhibit negative association (r = ${r.toFixed(3)}).`;
                }
            } else if (relation === 'negative_association') {
                if (r <= -0.35) {
                    status = 'SUPPORTED';
                    confidence = Math.min(95, Math.round(50 + (Math.abs(r) * 45)));
                    summary = `Strong inverse correlation observed (r = ${r.toFixed(3)}). Empirical data confirms negative co-movement.`;
                } else if (r <= -0.15) {
                    status = 'PARTIALLY_SUPPORTED';
                    confidence = 65;
                    summary = `Moderate inverse correlation observed (r = ${r.toFixed(3)}).`;
                } else if (r <= 0.15) {
                    status = 'WEAKENED';
                    confidence = 55;
                    summary = `Correlation is near zero (r = ${r.toFixed(3)}). No reliable inverse association observed.`;
                } else {
                    status = 'REJECTED';
                    confidence = 85;
                    summary = `Empirical evidence contradicts the claim: variables exhibit positive association (r = ${r.toFixed(3)}).`;
                }
            } else if (relation === 'strong_association') {
                const absR = Math.abs(r);
                if (absR >= 0.5) {
                    status = 'SUPPORTED';
                    confidence = 90;
                    summary = `Strong association confirmed (|r| = ${absR.toFixed(3)}).`;
                } else if (absR >= 0.3) {
                    status = 'PARTIALLY_SUPPORTED';
                    confidence = 70;
                    summary = `Moderate association observed (|r| = ${absR.toFixed(3)}), falling slightly below strong threshold.`;
                } else {
                    status = 'WEAKENED';
                    confidence = 75;
                    summary = `Association is weak (|r| = ${absR.toFixed(3)}).`;
                }
            }

            return this._formatResult(hypothesis, status, confidence, summary, { name: 'Pearson Correlation', value: Number(r.toFixed(3)) });
        },

        /**
         * Test whether variable is a significant predictive driver
         * @private
         */
        _testPredictiveDriverHypothesis(varA, analytics, hypothesis) {
            const fiList = (analytics?.machineLearning?.featureImportance ||
                            analytics?.interpretation?.featureImportances ||
                            []).map(f => ({
                                variable: f.variable || f.feature || f.name,
                                importance: Number.isFinite(f.importance) ? f.importance : 0.1
                            }));
            // Match exact column or one-hot encoded variant (e.g. "category" matches "category_GroupA")
            const match = fiList.find(f => f.variable === varA || (typeof f.variable === 'string' && (f.variable.startsWith(varA + '_') || f.variable.startsWith(varA + ':'))));

            if (!match) {
                return this._formatResult(hypothesis, 'WEAKENED', 60, `Variable "${varA}" is not among the active features evaluated by predictive models.`);
            }

            const imp = match.importance || 0;
            const impPct = (imp * 100).toFixed(1);

            let status = 'WEAKENED';
            let confidence = 70;
            let summary = '';

            if (imp >= 0.20) {
                status = 'SUPPORTED';
                confidence = 92;
                summary = `Confirmed as a primary driver: accounts for ${impPct}% of target predictive contribution.`;
            } else if (imp >= 0.08) {
                status = 'PARTIALLY_SUPPORTED';
                confidence = 78;
                summary = `Moderate predictive contribution: accounts for ${impPct}% of target contribution.`;
            } else {
                status = 'WEAKENED';
                confidence = 80;
                summary = `Marginal contribution: accounts for only ${impPct}% of predictive importance.`;
            }

            return this._formatResult(hypothesis, status, confidence, summary, { name: 'Permutation Importance', value: Number((imp * 100).toFixed(2)) });
        },

        /**
         * Test relative mean comparison hypothesis
         * @private
         */
        _testMeanComparisonHypothesis(colA, varB, threshold, relation, profile, hypothesis) {
            const statsA = colA.stats || {};
            const meanA = statsA.mean;

            if (meanA == null) {
                return this._formatResult(hypothesis, 'INSUFFICIENT_EVIDENCE', 0, `Variable "${colA.name}" is non-numeric; mean cannot be computed.`);
            }

            let compareVal = threshold;
            let compareLabel = `threshold ${threshold}`;

            if (varB) {
                const colB = (profile.columns || []).find(c => c.name === varB);
                if (colB && colB.stats?.mean != null) {
                    compareVal = colB.stats.mean;
                    compareLabel = `mean of "${varB}" (${compareVal.toFixed(2)})`;
                }
            }

            if (compareVal == null) {
                return this._formatResult(hypothesis, 'INSUFFICIENT_EVIDENCE', 0, 'No valid numeric benchmark or comparison variable provided.');
            }

            const diff = meanA - compareVal;
            let status = 'INSUFFICIENT_EVIDENCE';
            let confidence = 85;
            let summary = '';

            if (relation === 'higher_than') {
                if (diff > 0.05 * Math.abs(compareVal)) {
                    status = 'SUPPORTED';
                    summary = `Empirically supported: mean of "${colA.name}" (${meanA.toFixed(2)}) exceeds ${compareLabel}.`;
                } else if (Math.abs(diff) <= 0.05 * Math.abs(compareVal)) {
                    status = 'WEAKENED';
                    summary = `Indeterminate: mean of "${colA.name}" (${meanA.toFixed(2)}) is approximately equal to ${compareLabel}.`;
                } else {
                    status = 'REJECTED';
                    summary = `Empirically rejected: mean of "${colA.name}" (${meanA.toFixed(2)}) is lower than ${compareLabel}.`;
                }
            } else if (relation === 'lower_than') {
                if (diff < -0.05 * Math.abs(compareVal)) {
                    status = 'SUPPORTED';
                    summary = `Empirically supported: mean of "${colA.name}" (${meanA.toFixed(2)}) is lower than ${compareLabel}.`;
                } else if (Math.abs(diff) <= 0.05 * Math.abs(compareVal)) {
                    status = 'WEAKENED';
                    summary = `Indeterminate: values are approximately equal.`;
                } else {
                    status = 'REJECTED';
                    summary = `Empirically rejected: mean of "${colA.name}" (${meanA.toFixed(2)}) is higher than ${compareLabel}.`;
                }
            }

            return this._formatResult(hypothesis, status, confidence, summary, { name: 'Delta vs Benchmark', value: Number(diff.toFixed(2)) });
        },

        /**
         * Format standard hypothesis result
         * @private
         */
        _formatResult(hypothesis, status, confidence, summary, testMetric = null) {
            return {
                id: hypothesis.id || `hyp_${Date.now()}`,
                statement: hypothesis.statement || `Hypothesis on ${hypothesis.variableA || 'variable'}`,
                variableA: hypothesis.variableA,
                variableB: hypothesis.variableB || null,
                relation: hypothesis.relation,
                status, // 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'WEAKENED' | 'REJECTED' | 'INSUFFICIENT_EVIDENCE'
                confidence: Math.max(0, Math.min(100, confidence)),
                evidenceSummary: summary,
                testMetric,
                evaluatedAt: Date.now()
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.HypothesisEngine = HypothesisEngine;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = HypothesisEngine;
    }
})(typeof window !== 'undefined' ? window : global);
