/**
 * UDIP Deep Intelligence Evolution vNext
 * QuestionGenerator - Grounded Analytical Question Generator
 * Synthesizes high-value empirical questions based on discovered topology, non-linearity, and regimes.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.QuestionGenerator = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class QuestionGenerator {
        static generate({ relationships = [], hypotheses = [], segments = [], temporal = null, derived = [] } = {}) {
            const questions = [];

            // 1. Non-linear & Relationship Questions
            (relationships || []).slice(0, 3).forEach(r => {
                if (r.isNonLinear || r.shape === 'U_SHAPED' || r.shape === 'INVERTED_U') {
                    questions.push({
                        question: `Which features exhibit the strongest non-linear manifold relationships with "${r.colB}"?`,
                        category: 'NONLINEAR_DYNAMICS',
                        targetEntity: r.colB,
                        rationale: `Detected ${r.shape} dynamic between ${r.colA} and ${r.colB}.`,
                        expectedInformationValue: 0.90
                    });
                }
            });

            // 2. Subgroup & Simpson's Paradox Questions
            (segments || []).slice(0, 2).forEach(s => {
                questions.push({
                    question: `Why does metric "${s.metricColumn}" diverge significantly (Cohen's d = ${s.cohensD}) between "${s.subgroupA}" and "${s.subgroupB}"?`,
                    category: 'SUBGROUP_DISPARITY',
                    targetEntity: s.groupingColumn,
                    rationale: `Subgroups show large effect size differences.`,
                    expectedInformationValue: 0.85
                });
            });

            // 3. Temporal Regime Change Questions
            if (temporal && temporal.regimeShifts && temporal.regimeShifts.length > 0) {
                const sh = temporal.regimeShifts[0];
                questions.push({
                    question: `What external or internal factors triggered the ${sh.shiftMagnitude || sh.shiftMagnitudeSigma}σ structural level shift at index ${sh.index}?`,
                    category: 'REGIME_CHANGE',
                    targetEntity: sh.column || 'series',
                    rationale: 'Persistent mean shift detected across time partitions.',
                    expectedInformationValue: 0.95
                });
            }

            // 4. Derived Variable Redundancy Questions
            (derived || []).slice(0, 2).forEach(d => {
                questions.push({
                    question: `Should derived variable "${d.targetColumn}" (${d.formula}) be excluded to prevent data leakage in predictive modeling?`,
                    category: 'DATA_LEAKAGE_PREVENTION',
                    targetEntity: d.targetColumn,
                    rationale: 'Exact mathematical identity detected in feature space.',
                    expectedInformationValue: 0.88
                });
            });

            // Ensure baseline questions if dataset has sparse patterns
            if (questions.length === 0) {
                questions.push({
                    question: 'What are the dominant statistical drivers of variance in this dataset?',
                    category: 'EXPLORATORY',
                    targetEntity: 'global',
                    rationale: 'Baseline empirical exploration.',
                    expectedInformationValue: 0.70
                });
            }

            return questions;
        }

        static generateQuestions(dkm) {
            return this.generate({
                relationships: dkm.relationships,
                hypotheses: dkm.hypotheses,
                segments: dkm.segments,
                temporal: dkm.temporalStructure,
                derived: dkm.derivedVariables
            });
        }
    }

    return QuestionGenerator;
}));
