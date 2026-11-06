/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: intelligence/planning/target-selector.js
 * ============================================================================
 * Deep target evaluation and selection engine:
 * Evaluates candidates based on statistical suitability, missingness,
 * variance, entropy/cardinality, semantic role, temporal relationships,
 * and penalty for identifiers or constant values.
 * Identifies primaryTarget and alternativeTargets without forcing false targets.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const TargetSelector = {
        /**
         * Select primary and alternative targets from profile information
         * @param {Object} profile - Step 2 Profiler result
         * @returns {Object} { primaryTarget, alternativeTargets, status, explanation }
         */
        selectTargets(profile) {
            if (!profile || !profile.columns || profile.columns.length === 0) {
                return {
                    primaryTarget: null,
                    alternativeTargets: [],
                    status: 'no_columns',
                    explanation: 'Dataset contains no columns to evaluate as targets'
                };
            }

            const candidates = [];
            const cols = profile.columns;
            const totalRows = profile.dataset ? profile.dataset.rowCount : 0;

            for (let i = 0; i < cols.length; i++) {
                const c = cols[i];
                const stats = c.stats || {};
                const suitabilityInfo = c.targetSuitability || { score: 0, taskHint: 'unknown', reasons: [] };
                let score = suitabilityInfo.score || 0;
                const taskHints = [];
                const reasons = [...(suitabilityInfo.reasons || [])];

                // Penalties
                if (stats.nullPct >= 50) {
                    score = Math.max(0, score - 40);
                    reasons.push(`Severely penalized: ${stats.nullPct}% missing values`);
                } else if (stats.nullPct >= 20) {
                    score = Math.max(0, score - 15);
                    reasons.push(`Penalized: moderate missingness (${stats.nullPct}%)`);
                }

                if (stats.isConstant) {
                    score = 0;
                    reasons.push('Excluded: zero-variance / constant column cannot serve as a predictive target');
                } else if (stats.isNearConstant) {
                    score = Math.max(0, score - 35);
                    reasons.push('Heavy penalty: near-constant (>95% single value)');
                }

                // Identifier check
                if (c.semanticRole === 'identifier' || c.detectedType === 'identifier') {
                    score = Math.max(0, Math.min(score, 15));
                    reasons.push('Excluded: identifiers cannot serve as target variables');
                }

                // Date / Timestamp check (dates are temporal indices, not raw targets, unless duration is modeled)
                if (c.detectedType === 'date' || c.detectedType === 'datetime' || c.detectedType === 'time') {
                    score = Math.max(0, Math.min(score, 20));
                    reasons.push('Temporal indices are sequence coordinates rather than prediction targets');
                }

                // Task hint attribution
                if (c.detectedType === 'boolean' || stats.uniqueCount === 2) {
                    taskHints.push('binary_classification');
                } else if (c.detectedType === 'categorical' && stats.uniqueCount >= 3 && stats.uniqueCount <= 20) {
                    taskHints.push('multiclass_classification');
                } else if (c.detectedType === 'integer' || c.detectedType === 'decimal' || c.detectedType === 'numeric') {
                    taskHints.push('regression');
                    if (profile.datasetPatterns && profile.datasetPatterns.some(p => p.pattern.toLowerCase().includes('time-series'))) {
                        taskHints.push('forecasting');
                    }
                }

                if (suitabilityInfo.taskHint && !taskHints.includes(suitabilityInfo.taskHint) && suitabilityInfo.taskHint !== 'unknown') {
                    taskHints.unshift(suitabilityInfo.taskHint);
                }

                const finalScore = Math.max(0, Math.min(100, Math.round(score)));

                let suitabilityLevel = 'low';
                if (finalScore >= 80) suitabilityLevel = 'high';
                else if (finalScore >= 60) suitabilityLevel = 'medium';

                if (finalScore >= 40) {
                    candidates.push({
                        column: c.name,
                        score: finalScore,
                        taskHints: taskHints.length > 0 ? taskHints : ['exploratory'],
                        suitability: suitabilityLevel,
                        reasoning: reasons,
                        type: c.detectedType,
                        semanticRole: c.semanticRole
                    });
                }
            }

            // Sort descending by score
            candidates.sort((a, b) => b.score - a.score);

            if (candidates.length === 0 || candidates[0].score < 50) {
                return {
                    primaryTarget: null,
                    alternativeTargets: candidates,
                    status: 'no_reliable_target',
                    explanation: 'No reliable prediction target identified with sufficient confidence. Dataset is better suited for descriptive, exploratory, or unsupervised clustering analysis.'
                };
            }

            const primary = candidates[0];
            const alternatives = candidates.slice(1);

            return {
                primaryTarget: primary,
                alternativeTargets: alternatives,
                status: 'target_selected',
                explanation: `Identified "${primary.column}" as the primary prediction target (${primary.suitability} suitability: ${primary.score}/100) for ${primary.taskHints.join(', ')}.`
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.TargetSelector = TargetSelector;

})(window);
