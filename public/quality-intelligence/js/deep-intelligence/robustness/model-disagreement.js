/**
 * UDIP Deep Intelligence Evolution vNext
 * ModelDisagreement - Explains Why Models Diverge in Performance
 * Diagnoses whether performance gap (e.g. Linear R²=0.31 vs Tree R²=0.74 vs GBDT R²=0.81)
 * is caused by non-linear manifolds, threshold effects, or feature interactions.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.ModelDisagreement = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class ModelDisagreement {
        static analyze({ modelScores = {}, hasNonLinearity = false, hasInteractions = false, hasThresholds = false } = {}) {
            const models = Object.keys(modelScores);
            if (models.length < 2) {
                return { hasDisagreement: false, explanation: 'Single or uniform model evaluation.' };
            }

            const scores = Object.values(modelScores);
            const minScore = Math.min(...scores);
            const maxScore = Math.max(...scores);
            const scoreSpread = maxScore - minScore;

            const linearScore = modelScores.linear || modelScores.linear_regression || modelScores.logistic || null;
            const treeScore = modelScores.tree || modelScores.decision_tree || modelScores.random_forest || null;
            const gbdtScore = modelScores.gbdt || modelScores.gradient_boost || null;

            let primaryCause = 'MARGINAL_VARIANCE';
            let explanation = 'Model evaluations demonstrate broad performance consensus across algorithmic families.';
            const hasDisagreement = scoreSpread >= 0.20;

            if (hasDisagreement) {
                if (linearScore !== null && (treeScore !== null || gbdtScore !== null)) {
                    const nonLinearScore = Math.max(treeScore || 0, gbdtScore || 0);
                    if (nonLinearScore - linearScore >= 0.25) {
                        if (hasNonLinearity) {
                            primaryCause = 'NONLINEAR_MANIFOLD';
                            explanation = `Tree/GBDT models substantially outperform linear models (${(nonLinearScore * 100).toFixed(0)}% vs ${(linearScore * 100).toFixed(0)}%) due to non-linear relationships in the feature space that violate linear parametric assumptions.`;
                        } else if (hasInteractions) {
                            primaryCause = 'FEATURE_INTERACTIONS';
                            explanation = `Tree/GBDT models capture higher-order feature interactions that a purely additive linear model cannot express.`;
                        } else {
                            primaryCause = 'LOCAL_THRESHOLD_EFFECTS';
                            explanation = `Tree partitions capture step-function thresholds in the decision boundary that cannot be represented linearly.`;
                        }
                    }
                }
            }

            return {
                hasDisagreement: hasDisagreement,
                scoreSpread: +scoreSpread.toFixed(4),
                primaryCause: primaryCause,
                explanation: explanation,
                status: 'OBSERVED',
                evidence: [`Evaluated models exhibit spread of ${scoreSpread.toFixed(2)} between best and worst performing architectures.`]
            };
        }
    }

    return ModelDisagreement;
}));
