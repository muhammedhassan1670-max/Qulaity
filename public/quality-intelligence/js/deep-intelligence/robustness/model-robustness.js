/**
 * UDIP Deep Intelligence Evolution vNext
 * ModelRobustness - Subgroup, Temporal & Perturbation Stability
 * Evaluates performance stability across splits, subgroups, and feature noise.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.ModelRobustness = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class ModelRobustness {
        static evaluate({ validationScore = 0.80, cvScores = [], subgroupScores = {}, perturbationDrop = 0.05 } = {}) {
            let cvVariance = 0;
            if (cvScores.length > 1) {
                const meanCv = cvScores.reduce((a, b) => a + b, 0) / cvScores.length;
                cvVariance = cvScores.reduce((a, b) => a + Math.pow(b - meanCv, 2), 0) / cvScores.length;
            }
            const cvStd = Math.sqrt(cvVariance);

            // Subgroup stability: difference between highest and lowest subgroup score
            const subValues = Object.values(subgroupScores);
            let subgroupSpread = 0;
            if (subValues.length > 1) {
                subgroupSpread = Math.max(...subValues) - Math.min(...subValues);
            }

            const isSubgroupStable = subgroupSpread <= 0.15;
            const isPerturbationRobust = perturbationDrop <= 0.10;
            const isCvStable = cvStd <= 0.08;

            const isOverallRobust = isSubgroupStable && isPerturbationRobust && isCvStable;

            return {
                isRobust: isOverallRobust,
                cvStandardDeviation: +cvStd.toFixed(4),
                subgroupScoreSpread: +subgroupSpread.toFixed(4),
                perturbationSensitivity: +perturbationDrop.toFixed(4),
                status: isOverallRobust ? 'ROBUST' : 'UNSTABLE_ACROSS_DOMAINS',
                verdict: isOverallRobust ? 'STABLE' : 'CAVEAT_SUBGROUP_INSTABILITY',
                limitations: !isSubgroupStable
                    ? [`Model accuracy varies by ${(subgroupSpread * 100).toFixed(1)}% across population subgroups.`]
                    : []
            };
        }
    }

    return ModelRobustness;
}));
