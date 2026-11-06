/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: intelligence/planning/feature-selector.js
 * ============================================================================
 * Evaluates and classifies input features into:
 * - recommended: High-utility, stable features with strong analytical value
 * - potential: Moderately viable features needing transformation or review
 * - excluded: Zero-variance, 100% missing, or high-cardinality noisy identifiers
 * Guarantees zero NaN / Infinity outputs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const FeatureSelector = {
        /**
         * Evaluate and partition features
         * @param {Object} profile - Step 2 Profiler result
         * @param {Object|null} primaryTarget - Selected target object or null
         * @param {Object} leakageResult - Result from LeakageDetector
         * @returns {Object} { recommended, potential, excluded }
         */
        selectFeatures(profile, primaryTarget = null, leakageResult = null) {
            if (!profile || !profile.columns || profile.columns.length === 0) {
                return { recommended: [], potential: [], excluded: [] };
            }

            const recommended = [];
            const potential = [];
            const excluded = [];

            const cols = profile.columns;
            const totalRows = profile.dataset ? profile.dataset.rowCount : 0;
            const leakedColumns = (leakageResult && leakageResult.findings)
                ? new Set(leakageResult.findings.filter(f => f.risk >= 80).map(f => f.column))
                : new Set();

            const targetName = primaryTarget ? primaryTarget.column : null;

            for (let i = 0; i < cols.length; i++) {
                const c = cols[i];
                const name = c.name;
                const stats = c.stats || {};
                const featSuit = c.featureSuitability || { score: 50, reasons: [] };
                let score = featSuit.score || 50;
                const reasons = [...(featSuit.reasons || [])];

                // 1. If this column is the primary target itself
                if (targetName && name === targetName) {
                    excluded.push({
                        column: name,
                        score: 0,
                        status: 'excluded',
                        reasons: ['Selected as the primary target variable (excluded from predictor feature matrix to prevent self-leakage)']
                    });
                    continue;
                }

                // 2. Severe Data Leakage Check
                if (leakedColumns.has(name)) {
                    excluded.push({
                        column: name,
                        score: 0,
                        status: 'excluded',
                        reasons: ['High data leakage risk: column shows suspicious post-outcome dependency with the target']
                    });
                    continue;
                }

                // 3. Constant / Zero-Variance Check
                if (stats.isConstant) {
                    excluded.push({
                        column: name,
                        score: 0,
                        status: 'excluded',
                        reasons: ['Zero variance / constant column provides zero discriminative information']
                    });
                    continue;
                }

                // 4. Complete Missingness Check
                if (stats.nullPct >= 95) {
                    excluded.push({
                        column: name,
                        score: 0,
                        status: 'excluded',
                        reasons: [`Critical missingness (${stats.nullPct}%): insufficient non-null observations to train or evaluate`]
                    });
                    continue;
                }

                // 5. Identifier Evaluation
                const isIdType = c.detectedType === 'identifier' || c.semanticRole === 'identifier';
                const isCategoricalOrText = c.detectedType === 'categorical' || c.detectedType === 'text' || c.detectedType === 'string';
                const uniquenessPct = stats.uniquePct || 0;

                if (isIdType || (isCategoricalOrText && uniquenessPct >= 95 && totalRows >= 5)) {
                    // Check if it might carry analytical meaning (e.g. structured grouping, batch, or moderate uniqueness)
                    if (uniquenessPct === 100 && (isIdType || isCategoricalOrText)) {
                        excluded.push({
                            column: name,
                            score: 10,
                            status: 'excluded',
                            reasons: ['High-cardinality unique identifier with low analytical utility (risk of memorization and overfitting)']
                        });
                        continue;
                    } else {
                        // Moderate identifier / key with potential grouping utility
                        score = Math.min(score, 45);
                        potential.push({
                            column: name,
                            score: Math.round(score),
                            status: 'potential',
                            reasons: [
                                'Classified as an identifier, but exhibits grouping characteristics',
                                'Recommended for group-level aggregation or target encoding rather than raw feature input'
                            ]
                        });
                        continue;
                    }
                }

                // 6. High Missingness (50% to 94%)
                if (stats.nullPct >= 50) {
                    score = Math.max(20, score - 30);
                    potential.push({
                        column: name,
                        score: Math.round(score),
                        status: 'potential',
                        reasons: [
                            `High missingness (${stats.nullPct}%) requires imputation or missingness indicator flags before modeling`,
                            ...reasons
                        ]
                    });
                    continue;
                }

                // 7. Text features
                if (c.detectedType === 'text') {
                    potential.push({
                        column: name,
                        score: Math.min(score, 65),
                        status: 'potential',
                        reasons: [
                            'Unstructured text column: requires tokenization, TF-IDF, or embeddings before inclusion in standard ML estimators',
                            ...reasons
                        ]
                    });
                    continue;
                }

                // 8. Near-Constant Features
                if (stats.isNearConstant) {
                    potential.push({
                        column: name,
                        score: Math.min(score, 40),
                        status: 'potential',
                        reasons: [
                            'Near-constant feature (>95% single value): low information entropy may destabilize models',
                            ...reasons
                        ]
                    });
                    continue;
                }

                // 9. Standard Numerical & Categorical Features
                const safeScore = Math.max(0, Math.min(100, Math.round(score)));
                if (safeScore >= 65) {
                    recommended.push({
                        column: name,
                        score: safeScore,
                        status: 'recommended',
                        reasons: [
                            c.detectedType === 'categorical' ? 'Categorical feature with well-balanced cardinality' :
                            c.detectedType === 'date' || c.detectedType === 'datetime' ? 'Temporal dimension suitable for lag/trend feature extraction' :
                            'Continuous numerical metric with healthy variation and completeness',
                            ...reasons
                        ]
                    });
                } else {
                    potential.push({
                        column: name,
                        score: safeScore,
                        status: 'potential',
                        reasons: [
                            'Viable feature requiring standard preprocessing or scaling',
                            ...reasons
                        ]
                    });
                }
            }

            // Sort lists by score descending
            recommended.sort((a, b) => b.score - a.score);
            potential.sort((a, b) => b.score - a.score);
            excluded.sort((a, b) => a.score - b.score);

            return { recommended, potential, excluded };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.FeatureSelector = FeatureSelector;

})(window);
