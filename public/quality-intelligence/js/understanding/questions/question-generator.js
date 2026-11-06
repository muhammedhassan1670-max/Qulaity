/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/questions/question-generator.js
 * ============================================================================
 * Formulates high-value, grounded analytical questions based on discovered
 * dataset topology, variable roles, population groups, and regime shifts.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const QuestionGenerator = {
        /**
         * Propose grounded analytical questions
         * @param {Object} context - { topologies, variables, relationships, groups, temporal }
         * @returns {Array<Object>} List of formulated analytical questions with action intent
         */
        generateQuestions(context = {}) {
            const topologies = context.topologies || [];
            const variables = context.variables || {};
            const relationships = context.relationships || [];
            const groups = context.groups || [];
            const temporal = context.temporal || {};

            const questions = [];

            // 1. Target / Outcome Explanation Questions
            const targets = Object.keys(variables).filter(k => variables[k].primaryRole === 'Target' || variables[k].primaryRole === 'Outcome');
            if (targets.length > 0) {
                const target = targets[0];
                questions.push({
                    id: 'Q1',
                    category: 'EXPLANATORY_MODELING',
                    question: `What primary factors explain the variance and outcomes observed in "${target}"?`,
                    rationale: `Target column "${target}" identified as primary business outcome.`,
                    suggestedAction: 'RUN_SUPERVISED_TOURNAMENT',
                    parameters: { target }
                });
            }

            // 2. Subgroup Disparity Questions
            if (groups.length > 0) {
                const topGroup = groups[0];
                questions.push({
                    id: 'Q2',
                    category: 'POPULATION_DISPARITY',
                    question: `Why do segments across "${topGroup.dimension}" display statistically distinct distributions of "${topGroup.targetMetric}"?`,
                    rationale: `Detected substantial variation (Cohen's d = ${topGroup.maxEffectSizeCohenD}).`,
                    suggestedAction: 'COMPARE_GROUPS',
                    parameters: { dimension: topGroup.dimension, metric: topGroup.targetMetric }
                });
            }

            // 3. Temporal Stability & Regime Questions
            if (temporal.isTemporal) {
                if (temporal.regimeShifts && temporal.regimeShifts.length > 0) {
                    const shift = temporal.regimeShifts[0];
                    questions.push({
                        id: 'Q3',
                        category: 'REGIME_CHANGE',
                        question: `What external or internal event triggered the structural shift in "${shift.column}" around index ${shift.index}?`,
                        rationale: `Detected ${shift.shiftMagnitude}σ mean level shift across temporal axis.`,
                        suggestedAction: 'INSPECT_CHANGE_POINT',
                        parameters: { column: shift.column, index: shift.index }
                    });
                } else {
                    questions.push({
                        id: 'Q3',
                        category: 'TEMPORAL_FORECASTING',
                        question: `Can future trajectory of series be accurately projected from chronological trends in "${temporal.timeColumn}"?`,
                        rationale: 'Validated chronological time ordering without major structural break.',
                        suggestedAction: 'RUN_FORECASTING',
                        parameters: { timeCol: temporal.timeColumn }
                    });
                }
            }

            // 4. Non-Linear Interaction Questions
            const nonlinear = relationships.find(r => r.isNonlinear);
            if (nonlinear) {
                questions.push({
                    id: 'Q4',
                    category: 'NONLINEAR_DYNAMICS',
                    question: `What threshold or saturation mechanisms govern the non-linear relationship between "${nonlinear.colA}" and "${nonlinear.colB}"?`,
                    rationale: `Identified ${nonlinear.patternType.replace(/_/g, ' ')} dependency (${nonlinear.method}).`,
                    suggestedAction: 'EXPLORE_NONLINEAR_SURFACE',
                    parameters: { colA: nonlinear.colA, colB: nonlinear.colB }
                });
            }

            return questions;
        },

        generate(context = {}) {
            return this.generateQuestions(context);
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.QuestionGenerator = QuestionGenerator;

})(typeof window !== 'undefined' ? window : global);
