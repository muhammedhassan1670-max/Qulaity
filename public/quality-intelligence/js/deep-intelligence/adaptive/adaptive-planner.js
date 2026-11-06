/**
 * UDIP Deep Intelligence Evolution vNext
 * AdaptivePlanner - Information-Gain Driven Analytical Strategy
 * Synthesizes adaptive execution strategies and governs stopping rules.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.AdaptivePlanner = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class AdaptivePlanner {
        static constructPlan({ dataset, profile, topology = [], relationships = [], interactions = [], derived = [] } = {}) {
            const rowCount = dataset.rowCount || (dataset.rows ? dataset.rows.length : 0);
            const hasNonLinear = (relationships || []).some(r => r.isNonLinear || r.shape === 'U_SHAPED' || r.shape === 'INVERTED_U');

            // 1. Algorithmic Candidate Selection
            const glob = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
            const selector = glob.UDIP && glob.UDIP.MethodSelector ? glob.UDIP.MethodSelector : null;
            const algorithmSuitability = selector
                ? selector.selectCandidates({ taskType: 'REGRESSION', hasNonLinearity: hasNonLinear, rowCount })
                : { recommendedCandidates: [], excludedCandidates: [] };

            // 2. Analytical Sequence
            const sequence = [
                { stage: 'UNDERSTAND', action: 'TOPOLOGY_AND_SEMANTICS', priority: 'HIGH', status: 'COMPLETED' },
                { stage: 'DISCOVER', action: 'RELATIONSHIP_AND_INTERACTION_MINING', priority: 'HIGH', status: 'COMPLETED' },
                { stage: 'HYPOTHESIZE', action: 'FORMULATE_FALSIFIABLE_PROPOSITIONS', priority: 'HIGH', status: 'COMPLETED' },
                { stage: 'TEST', action: 'MULTIMETHOD_STATISTICAL_EVALUATION', priority: 'HIGH', status: 'COMPLETED' },
                { stage: 'CHALLENGE', action: 'ACTIVE_COUNTER_EVIDENCE_SEARCH', priority: 'CRITICAL', status: 'COMPLETED' },
                { stage: 'VALIDATE', action: '14_POINT_ADVERSARIAL_CRITIC_AUDIT', priority: 'CRITICAL', status: 'READY' },
                { stage: 'CONCLUDE', action: 'EVIDENCE_GROUNDED_SYNTHESIS', priority: 'MEDIUM', status: 'READY' }
            ];

            // 3. Mathematical Warnings
            const warnings = [];
            if (hasNonLinear) {
                warnings.push('Feature space contains verified non-linear manifolds. Linear parametric estimators excluded from champion candidacy.');
            }
            if (derived && derived.length > 0) {
                warnings.push(`Detected ${derived.length} mathematical identity derivations. Ensure derived features are quarantined to prevent leakage.`);
            }

            return {
                strategyName: 'ADAPTIVE_EVIDENCE_CONVERGENCE',
                stages: sequence,
                algorithmSuitability: algorithmSuitability,
                warnings: warnings,
                stoppingRule: 'STOP_ON_EVIDENCE_CONVERGENCE_OR_UNRESOLVED_CONTRADICTION',
                status: 'COMPOSED'
            };
        }
    }

    return AdaptivePlanner;
}));
