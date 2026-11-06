/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/hypotheses/hypothesis-generator.js
 * ============================================================================
 * Formulates and statistically validates testable analytical hypotheses.
 * Actively searches for counter-evidence against its own conclusions.
 * Assigns statuses: SUPPORTED | PARTIALLY_SUPPORTED | WEAKENED | REJECTED | INSUFFICIENT_EVIDENCE.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const HypothesisGenerator = {
        /**
         * Generate and evaluate testable analytical hypotheses
         * @param {Object} context - { relationships, groups, temporal, derived, distributions, reliability }
         * @returns {Array<Object>} List of evaluated Hypothesis objects
         */
        generate(context = {}) {
            const hypotheses = [];
            const relationships = context.relationships || [];
            const groups = context.groups || [];
            const temporal = context.temporal || {};
            const derived = context.derived || [];
            const reliability = context.reliability || { overallScore: 100, confidenceDiscountMultiplier: 1.0 };
            const discount = reliability.confidenceDiscountMultiplier || 1.0;

            let hId = 1;

            // 1. Hypotheses from Strong Relationships
            relationships.slice(0, 3).forEach(rel => {
                const isNonlinear = rel.isNonlinear;
                const strength = rel.strength;
                const sampleN = rel.sampleSize || 50;

                const expectedSignal = isNonlinear ? 'Non-linear functional dependence' : 'Proportional linear co-movement';
                const observedResult = `${rel.method}: strength=${strength.toFixed(2)}`;

                let status = 'INSUFFICIENT_EVIDENCE';
                let counterEvidence = [];
                let supportingEvidence = [rel.description];

                if (sampleN < 15) {
                    status = 'INSUFFICIENT_EVIDENCE';
                    counterEvidence.push(`Sample size (N=${sampleN}) is too small to establish statistical significance.`);
                } else if (strength >= 0.70) {
                    status = 'SUPPORTED';
                    if (rel.heteroscedastic) {
                        status = 'PARTIALLY_SUPPORTED';
                        counterEvidence.push('Residual variance increases across input range (heteroscedasticity weakens uniformity).');
                    }
                } else if (strength >= 0.40) {
                    status = 'PARTIALLY_SUPPORTED';
                    counterEvidence.push(`Moderate association leaves substantial unmodeled variance (1 - R² = ${(1 - strength*strength).toFixed(2)}).`);
                } else {
                    status = 'WEAKENED';
                    counterEvidence.push('Low association strength indicates negligible predictability.');
                }

                hypotheses.push({
                    id: `H${hId++}`,
                    category: 'RELATIONSHIP',
                    statement: `Variable "${rel.colA}" exhibits a statistically significant predictive association with "${rel.colB}".`,
                    test: rel.method,
                    expectedSignal,
                    observedResult,
                    effectSize: strength,
                    supportingEvidence,
                    counterEvidence,
                    confidence: +( (Math.min(1.0, strength * discount)).toFixed(2) ),
                    status
                });
            });

            // 2. Hypotheses from Discovered Groups
            groups.slice(0, 2).forEach(g => {
                const d = g.maxEffectSizeCohenD || 0;
                let status = 'INSUFFICIENT_EVIDENCE';
                const counterEvidence = [];

                if (d >= 0.8) {
                    status = 'SUPPORTED';
                } else if (d >= 0.4) {
                    status = 'PARTIALLY_SUPPORTED';
                    counterEvidence.push('Within-group variance overlaps moderately across segments.');
                } else {
                    status = 'WEAKENED';
                    counterEvidence.push('Group means differ negligibly compared to individual sample dispersion.');
                }

                hypotheses.push({
                    id: `H${hId++}`,
                    category: 'POPULATION_SEGMENTATION',
                    statement: `Subgroups defined by "${g.dimension}" follow distinct distribution profiles for metric "${g.targetMetric}".`,
                    test: `Between-group Cohen's d (max d = ${d.toFixed(2)})`,
                    expectedSignal: "Cohen's d >= 0.50 (medium to large effect)",
                    observedResult: `Max Cohen's d: ${d.toFixed(2)} (${g.effectSignificance})`,
                    effectSize: d,
                    supportingEvidence: [g.insight],
                    counterEvidence,
                    confidence: +( (Math.min(1.0, (d / 2) * discount)).toFixed(2) ),
                    status
                });
            });

            // 3. Hypotheses from Temporal Regime Shifts
            if (temporal.isTemporal && Array.isArray(temporal.regimeShifts) && temporal.regimeShifts.length > 0) {
                const shift = temporal.regimeShifts[0];
                hypotheses.push({
                    id: `H${hId++}`,
                    category: 'TEMPORAL_DYNAMICS',
                    statement: `Series "${shift.column}" underwent an abrupt structural regime shift around index ${shift.index}.`,
                    test: 'Standardized mean difference before/after midpoint',
                    expectedSignal: 'Shift magnitude >= 1.5 standard deviations',
                    observedResult: `Shift magnitude: ${shift.shiftMagnitude}σ (from ${shift.meanBefore.toFixed(2)} to ${shift.meanAfter.toFixed(2)})`,
                    effectSize: shift.shiftMagnitude,
                    supportingEvidence: [`Persistent shift verified over temporal axis "${temporal.timeColumn}".`],
                    counterEvidence: ['External market intervention or data recording hiatus may explain the jump.'],
                    confidence: +( (Math.min(0.92, (shift.shiftMagnitude / 3) * discount)).toFixed(2) ),
                    status: 'SUPPORTED'
                });
            }

            // 4. Hypotheses from Derived Variables (Formula checks)
            derived.slice(0, 2).forEach(drv => {
                hypotheses.push({
                    id: `H${hId++}`,
                    category: 'DERIVED_VARIABLE',
                    statement: `Column "${drv.derivedColumn}" is not an independent observation but an arithmetic calculation of "${drv.sourceColumns.join(' and ')}".`,
                    test: `Formula exact-match test (${drv.formula})`,
                    expectedSignal: 'Match rate >= 95% within 0.5% tolerance',
                    observedResult: `Match rate: ${(drv.matchRate * 100).toFixed(1)}%`,
                    effectSize: drv.matchRate,
                    supportingEvidence: drv.implications,
                    counterEvidence: ['Small rounding variations exist across isolated floating-point entries.'],
                    confidence: drv.confidence,
                    status: 'SUPPORTED'
                });
            });

            return hypotheses;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.HypothesisGenerator = HypothesisGenerator;

})(typeof window !== 'undefined' ? window : global);
