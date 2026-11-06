/**
 * UDIP Deep Intelligence Evolution vNext
 * HypothesisGenerator - Explicit Falsifiable Empirical Hypotheses
 * Formulates structured hypotheses across 11 systemic archetypes.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.HypothesisGenerator = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class HypothesisGenerator {
        static generate({ dataset, profile, relationships = [], segments = [], temporal = null, derived = [], missingnessHypotheses = [] } = {}) {
            const hypotheses = [];
            let hypIdx = 1;
            const nextId = () => `HYP-${String(hypIdx++).padStart(3, '0')}`;

            // 1. Non-linear and Linear Relationship Hypotheses
            (relationships || []).slice(0, 5).forEach(rel => {
                if (rel.strength !== 'NONE') {
                    const isNonLinear = rel.isNonLinear || rel.shape !== 'LINEAR';
                    hypotheses.push({
                        id: nextId(),
                        statement: isNonLinear
                            ? `Variable "${rel.colA}" exhibits a non-linear (${rel.shape}) relationship with "${rel.colB}".`
                            : `Variable "${rel.colA}" has a linear association with "${rel.colB}".`,
                        type: isNonLinear ? 'NONLINEAR_RELATIONSHIP' : 'RELATIONSHIP',
                        variables: [rel.colA, rel.colB],
                        expectedEvidence: [`Mutual Information >= 0.25`, `Correlation magnitude >= 0.30`],
                        observedEvidence: rel.evidence || [],
                        counterEvidence: rel.counterEvidence || [],
                        status: 'INVESTIGATING',
                        confidence: rel.confidence || 0.75
                    });
                }
            });

            // 2. Subgroup Difference Hypotheses
            (segments || []).slice(0, 3).forEach(seg => {
                hypotheses.push({
                    id: nextId(),
                    statement: `Subgroups in "${seg.groupingColumn}" (${seg.subgroupA} vs ${seg.subgroupB}) follow distinct distribution profiles for "${seg.metricColumn}".`,
                    type: 'GROUP_DIFFERENCE',
                    variables: [seg.groupingColumn, seg.metricColumn],
                    expectedEvidence: [`Cohen's d >= 0.50`, `P-value < 0.05`],
                    observedEvidence: seg.evidence || [],
                    counterEvidence: [],
                    status: 'INVESTIGATING',
                    confidence: 0.85
                });
            });

            // 3. Derived Variable Hypotheses
            (derived || []).slice(0, 3).forEach(drv => {
                hypotheses.push({
                    id: nextId(),
                    statement: `Column "${drv.targetColumn}" is an arithmetic derivation of [${drv.sourceColumns.join(', ')}].`,
                    type: 'DERIVED_VARIABLE',
                    variables: [drv.targetColumn, ...drv.sourceColumns],
                    expectedEvidence: [drv.formula],
                    observedEvidence: [drv.explanation],
                    counterEvidence: [],
                    status: 'INVESTIGATING',
                    confidence: drv.confidence || 0.95
                });
            });

            // 4. Temporal Regime Change Hypotheses
            if (temporal && temporal.regimeShifts && temporal.regimeShifts.length > 0) {
                const shift = temporal.regimeShifts[0];
                hypotheses.push({
                    id: nextId(),
                    statement: `Metric "${shift.column || 'series'}" underwent a structural regime change at index ${shift.index} (magnitude: ${shift.shiftMagnitude || shift.shiftMagnitudeSigma}σ).`,
                    type: 'REGIME_CHANGE',
                    variables: [shift.column || 'series'],
                    expectedEvidence: [`Shift magnitude >= 1.5σ`],
                    observedEvidence: [`Mean shifted from ${shift.meanBefore} to ${shift.meanAfter}`],
                    counterEvidence: [],
                    status: 'INVESTIGATING',
                    confidence: 0.90
                });
            }

            // 5. Missingness Signal Hypotheses
            (missingnessHypotheses || []).slice(0, 2).forEach(m => {
                hypotheses.push({
                    id: nextId(),
                    statement: `Missingness in "${m.column}" follows a ${m.mechanism} pattern.`,
                    type: 'MISSINGNESS_SIGNAL',
                    variables: [m.column],
                    expectedEvidence: [m.rationale],
                    observedEvidence: [m.rationale],
                    counterEvidence: [],
                    status: 'INVESTIGATING',
                    confidence: m.confidence || 0.70
                });
            });

            return hypotheses;
        }
    }

    return HypothesisGenerator;
}));
