/**
 * UDIP Deep Intelligence Evolution vNext
 * CausalReasoner - Observational Humility & Confounder Detection
 * Strict Invariant: "Association detected, causal inference not established."
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.CausalReasoner = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class CausalReasoner {
        static get INVARIANT() {
            return 'Association detected, causal inference not established. Unobserved confounding and selection bias cannot be ruled out without experimental intervention.';
        }

        static analyze(dataset, relationships, temporalStructure = null) {
            const warnings = [];
            const confounders = [];

            if (!relationships || relationships.length === 0) {
                return { warnings: [this.INVARIANT], confounders: [], invariant: this.INVARIANT };
            }

            // Always enforce observational humility invariant
            warnings.push(this.INVARIANT);

            // 1. Confounder Detection: Variable C correlated with both A and B
            for (let i = 0; i < relationships.length; i++) {
                for (let j = i + 1; j < relationships.length; j++) {
                    const r1 = relationships[i];
                    const r2 = relationships[j];

                    // Find common variable
                    let common = null;
                    let pairA = null, pairB = null;

                    if (r1.colA === r2.colA) { common = r1.colA; pairA = r1.colB; pairB = r2.colB; }
                    else if (r1.colA === r2.colB) { common = r1.colA; pairA = r1.colB; pairB = r2.colA; }
                    else if (r1.colB === r2.colA) { common = r1.colB; pairA = r1.colA; pairB = r2.colB; }
                    else if (r1.colB === r2.colB) { common = r1.colB; pairA = r1.colA; pairB = r2.colA; }

                    if (common && pairA && pairB && pairA !== pairB) {
                        const str1 = Math.abs(r1.pearson || r1.spearman || 0);
                        const str2 = Math.abs(r2.pearson || r2.spearman || 0);

                        if (str1 >= 0.35 && str2 >= 0.35) {
                            confounders.push({
                                candidateConfounder: common,
                                targetA: pairA,
                                targetB: pairB,
                                status: 'POSSIBLE',
                                warning: `Variable "${common}" correlates with both "${pairA}" (r=${str1.toFixed(2)}) and "${pairB}" (r=${str2.toFixed(2)}), acting as a potential common-cause confounder.`
                            });
                        }
                    }
                }
            }

            // 2. Reverse Causality Risk
            if (!temporalStructure || !temporalStructure.hasTemporal) {
                warnings.push('Cross-sectional dataset lacks chronological sequencing; temporal direction of effects cannot be confirmed.');
            }

            return {
                invariant: this.INVARIANT,
                warnings: warnings,
                confounders: confounders.slice(0, 5)
            };
        }
    }

    return CausalReasoner;
}));
