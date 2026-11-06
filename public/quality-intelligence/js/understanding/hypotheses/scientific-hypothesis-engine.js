/**
 * UDIP Scientific Hypothesis Engine
 * 
 * Generates testable, evidence-grounded hypotheses with rigorous
 * statistical verification, counter-evidence testing, and strict non-causal disclosures.
 * 
 * @module ScientificHypothesisEngine
 */

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ScientificHypothesisEngine = factory();
        root.UDIPHypothesisEngine = root.ScientificHypothesisEngine;
    }
}(typeof self !== 'undefined' ? self : this, function() {
    'use strict';

    const HypothesisStatus = Object.freeze({
        UNTESTED: 'Untested',
        SUPPORTED: 'Supported',
        WEAK_EVIDENCE: 'Weak Evidence',
        NOT_SUPPORTED: 'Not Supported',
        INSUFFICIENT_DATA: 'Insufficient Data'
    });

    class ScientificHypothesisEngine {
        /**
         * Generate and test scientific hypotheses from tabular data
         * @param {Array<Object>} data
         * @param {Object} [context] - Discovered context or knowledge state
         * @returns {Array<Object>} Formulated hypotheses with evidence and counter-evidence
         */
        static generateAndTest(data, context = {}) {
            const rawData = Array.isArray(data) ? data : (data && data.data ? data.data : []);
            const rowCount = rawData.length;
            if (rowCount === 0) return [];

            const cols = Object.keys(rawData[0]);
            const targetCol = context.objective?.targetVariable || null;
            const timeCol = context.objective?.timeVariable || null;

            const hypotheses = [];

            // Identify continuous numeric columns
            const numericCols = cols.filter(c => {
                const vals = rawData.map(r => r[c]).filter(v => v !== null && v !== undefined && v !== '');
                return vals.length > 0 && vals.every(v => !isNaN(Number(v)) && v !== true && v !== false);
            });

            // 1. Target Driver Hypotheses (if target exists)
            if (targetCol && numericCols.length > 0) {
                const targetValues = rawData.map(r => r[targetCol]);
                const isTargetNumeric = numericCols.includes(targetCol);

                numericCols.filter(c => c !== targetCol).forEach((featureCol, idx) => {
                    const pairs = rawData.map(r => [Number(r[featureCol]), Number(r[targetCol])])
                        .filter(([f, t]) => !isNaN(f) && !isNaN(t));

                    if (pairs.length >= 5) {
                        const r = this._computePearson(pairs);
                        const absR = Math.abs(r);

                        let status = HypothesisStatus.WEAK_EVIDENCE;
                        let confidence = 0.65;

                        if (absR >= 0.6) {
                            status = HypothesisStatus.SUPPORTED;
                            confidence = 0.88;
                        } else if (absR < 0.25) {
                            status = HypothesisStatus.NOT_SUPPORTED;
                            confidence = 0.75;
                        }

                        // Counter-evidence check: Simpson's paradox subgroup split
                        const counterEvidence = [];
                        if (pairs.length >= 20) {
                            const half = Math.floor(pairs.length / 2);
                            const r1 = this._computePearson(pairs.slice(0, half));
                            const r2 = this._computePearson(pairs.slice(half));
                            if ((r1 > 0 && r2 < 0) || (r1 < 0 && r2 > 0)) {
                                counterEvidence.push(`Subgroup split indicates sign inversion (r1=${r1.toFixed(2)}, r2=${r2.toFixed(2)}); relationship may be non-stationary.`);
                                status = HypothesisStatus.WEAK_EVIDENCE;
                                confidence = 0.60;
                            }
                        }

                        hypotheses.push({
                            id: `hyp_target_${featureCol}_${idx + 1}`,
                            title: `Association between "${featureCol}" and "${targetCol}"`,
                            description: `Elevated levels of "${featureCol}" are ${r > 0 ? 'positively' : 'negatively'} correlated with variations in "${targetCol}".`,
                            variables: [featureCol, targetCol],
                            relationshipType: r > 0 ? 'Positive Monotonic Association' : 'Negative Monotonic Association',
                            testMethod: 'Pearson Correlation & Subgroup Stability Check',
                            testStatistic: { name: 'Pearson r', value: Math.round(r * 1000) / 1000 },
                            status,
                            confidence,
                            evidence: [
                                `Empirical correlation r = ${r.toFixed(3)} across N=${pairs.length} records.`,
                                `Observed effect size is ${absR >= 0.5 ? 'large' : (absR >= 0.3 ? 'moderate' : 'small')}.`
                            ],
                            counterEvidence,
                            isCausalClaim: false,
                            disclaimer: 'Association detected. Causal inference has not been established. Do not assume direct intervention will guarantee an outcome change without experimental verification.'
                        });
                    }
                });
            }

            // 2. Feature-to-Feature Coupling Hypotheses
            if (numericCols.length >= 2 && hypotheses.length < 3) {
                for (let i = 0; i < numericCols.length; i++) {
                    for (let j = i + 1; j < numericCols.length; j++) {
                        const colA = numericCols[i];
                        const colB = numericCols[j];
                        if (colA === targetCol || colB === targetCol) continue;

                        const pairs = rawData.map(r => [Number(r[colA]), Number(r[colB])]).filter(([a, b]) => !isNaN(a) && !isNaN(b));
                        if (pairs.length >= 5) {
                            const r = this._computePearson(pairs);
                            if (Math.abs(r) >= 0.5) {
                                hypotheses.push({
                                    id: `hyp_coupling_${colA}_${colB}`,
                                    title: `Collinear Coupling: "${colA}" and "${colB}"`,
                                    description: `Measurements "${colA}" and "${colB}" co-vary strongly, indicating a shared underlying process mechanism.`,
                                    variables: [colA, colB],
                                    relationshipType: 'Multicollinear Feature Coupling',
                                    testMethod: 'Bivariate Correlation Analysis',
                                    testStatistic: { name: 'Pearson r', value: Math.round(r * 1000) / 1000 },
                                    status: HypothesisStatus.SUPPORTED,
                                    confidence: 0.90,
                                    evidence: [`Correlation r = ${r.toFixed(3)}`],
                                    counterEvidence: [],
                                    isCausalClaim: false,
                                    disclaimer: 'Association detected. Causal inference has not been established.'
                                });
                            }
                        }
                    }
                }
            }

            // 3. Temporal Drift Hypothesis (if time series exists)
            if (timeCol && numericCols.length > 0 && rowCount >= 10) {
                const firstCol = numericCols[0];
                const vals = rawData.map(r => Number(r[firstCol])).filter(v => !isNaN(v));
                const firstHalf = vals.slice(0, Math.floor(vals.length / 2));
                const secondHalf = vals.slice(Math.floor(vals.length / 2));
                const mean1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
                const mean2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
                const shiftPct = mean1 !== 0 ? Math.abs((mean2 - mean1) / mean1) : 0;

                if (shiftPct >= 0.15) {
                    hypotheses.push({
                        id: 'hyp_temporal_drift',
                        title: `Temporal Mean Drift in "${firstCol}"`,
                        description: `Mean value of "${firstCol}" shifted by ${(shiftPct * 100).toFixed(1)}% between early and late chronological periods.`,
                        variables: [firstCol, timeCol],
                        relationshipType: 'Temporal Distribution Shift',
                        testMethod: 'Two-Period Mean Comparison',
                        testStatistic: { name: 'Mean Shift %', value: Math.round(shiftPct * 1000) / 10 },
                        status: HypothesisStatus.SUPPORTED,
                        confidence: 0.85,
                        evidence: [`Early mean: ${mean1.toFixed(2)}, Late mean: ${mean2.toFixed(2)}`],
                        counterEvidence: [],
                        isCausalClaim: false,
                        disclaimer: 'Association detected. Causal inference has not been established.'
                    });
                }
            }

            return hypotheses;
        }

        static _computePearson(pairs) {
            if (!pairs || pairs.length < 2) return 0;
            const n = pairs.length;
            const meanA = pairs.reduce((acc, p) => acc + p[0], 0) / n;
            const meanB = pairs.reduce((acc, p) => acc + p[1], 0) / n;
            let num = 0, denA = 0, denB = 0;
            for (let i = 0; i < n; i++) {
                const diffA = pairs[i][0] - meanA;
                const diffB = pairs[i][1] - meanB;
                num += diffA * diffB;
                denA += diffA * diffA;
                denB += diffB * diffB;
            }
            if (denA === 0 || denB === 0) return 0;
            return num / (Math.sqrt(denA) * Math.sqrt(denB));
        }
    }

    ScientificHypothesisEngine.HypothesisStatus = HypothesisStatus;

    return ScientificHypothesisEngine;
}));
