/**
 * UDIP Deep Intelligence Evolution vNext
 * StoppingRules - Analytical Convergence & Uncertainty Stopping Triggers
 * Prevents endless computation and avoids hallucinating certainty.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.StoppingRules = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class StoppingRules {
        static evaluate({ iteration = 1, maxIterations = 5, evidenceDivergence = 0, informationDelta = 0.1, hasContradiction = false } = {}) {
            // 1. Evidence Convergence
            if (informationDelta < 0.01 && iteration >= 2) {
                return {
                    shouldStop: true,
                    reason: 'EVIDENCE_CONVERGED',
                    status: 'CONVERGED',
                    message: 'Additional iterations yield marginal information gain (< 1%). Sufficient analytical depth achieved.'
                };
            }

            // 2. Persistent Contradiction
            if (hasContradiction && iteration >= 3) {
                return {
                    shouldStop: true,
                    reason: 'PERSISTENT_CONTRADICTION',
                    status: 'INSUFFICIENT_EVIDENCE',
                    message: 'Conflicting empirical signals cannot be reconciled via observational data alone.'
                };
            }

            // 3. Iteration limit
            if (iteration >= maxIterations) {
                return {
                    shouldStop: true,
                    reason: 'ITERATION_BUDGET_EXHAUSTED',
                    status: 'BOUNDED_STOP',
                    message: `Completed scheduled search depth (${iteration}/${maxIterations}).`
                };
            }

            return {
                shouldStop: false,
                reason: 'CONTINUE_ANALYSIS',
                status: 'INVESTIGATING',
                message: 'Continuing progressive refinement.'
            };
        }
    }

    return StoppingRules;
}));
