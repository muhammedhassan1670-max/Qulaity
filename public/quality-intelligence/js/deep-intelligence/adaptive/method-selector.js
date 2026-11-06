/**
 * UDIP Deep Intelligence Evolution vNext
 * MethodSelector - Algorithmic Suitability & Manifold-Aware Exclusion
 * Explicitly excludes inappropriate algorithms based on geometric & structural properties.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.MethodSelector = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class MethodSelector {
        static selectCandidates({ taskType = 'REGRESSION', hasNonLinearity = false, rowCount = 100, featureCount = 5, hasMissingness = false } = {}) {
            const candidates = [
                { id: 'gbdt', name: 'Gradient Boosted Trees (GBDT)', recommended: true, rationale: 'Robust non-linear partitioning, handles missingness, resistant to monotone transformations.' },
                { id: 'random_forest', name: 'Random Forest Ensemble', recommended: true, rationale: 'Low-variance ensemble, captures interactions cleanly.' },
                { id: 'decision_tree', name: 'Decision Tree (CART)', recommended: true, rationale: 'High interpretability baseline.' },
                { id: 'mlp_neural_net', name: 'MLP Neural Network', recommended: rowCount >= 50, rationale: 'Continuous manifold approximation with non-linear activations.' },
                { id: 'linear_model', name: 'Linear / Logistic Regressor', recommended: true, rationale: 'Fast, interpretable parametric baseline.' }
            ];

            const excluded = [];

            // If non-linear manifold is confirmed, exclude linear model from championship candidates
            if (hasNonLinearity) {
                const linearIdx = candidates.findIndex(c => c.id === 'linear_model');
                if (linearIdx !== -1) {
                    const lin = candidates.splice(linearIdx, 1)[0];
                    lin.recommended = false;
                    lin.exclusionReason = 'Excluded as champion candidate due to verified non-linear structure in feature space.';
                    excluded.push(lin);
                }
            }

            // If sample size is very small, exclude deep MLP
            if (rowCount < 40) {
                const mlpIdx = candidates.findIndex(c => c.id === 'mlp_neural_net');
                if (mlpIdx !== -1) {
                    const mlp = candidates.splice(mlpIdx, 1)[0];
                    mlp.recommended = false;
                    mlp.exclusionReason = `Insufficient sample volume (N=${rowCount}) for neural network parameter convergence.`;
                    excluded.push(mlp);
                }
            }

            return {
                recommendedCandidates: candidates,
                excludedCandidates: excluded,
                status: 'SELECTED'
            };
        }
    }

    return MethodSelector;
}));
