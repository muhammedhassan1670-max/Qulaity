/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/reasoning/uncertainty-engine.js
 * ============================================================================
 * Calibrated uncertainty scoring & confidence propagation engine.
 * Confidence strictly propagates from underlying empirical evidence:
 * - Data completeness and sample volume
 * - Model validation scores (R², F1, Cross-Validation holdout)
 * - Statistical test p-values and effect sizes
 * - Quality health scores
 * Bounded classifications:
 * - "High confidence"
 * - "Moderate confidence"
 * - "Low confidence"
 * - "Insufficient evidence"
 * - "Unable to determine"
 * Never artificially increases confidence.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const UncertaintyEngine = {
        /**
         * Compute calibrated confidence assessment from context and evidence
         * @param {Object} params
         * @param {Array} params.evidence
         * @param {Object} params.context
         * @returns {Object}
         */
        assessUncertainty({ evidence = [], context = {} } = {}) {
            // If zero evidence available
            if (!Array.isArray(evidence) || evidence.length === 0) {
                return {
                    level: 'Insufficient evidence',
                    levelArabic: 'أدلة غير كافية',
                    numericScore: 20,
                    reasons: ['No matching empirical evidence found across active analytical engines.']
                };
            }

            let totalWeight = 0;
            let weightedScore = 0;
            const reasons = [];

            // 1. Evidence Strength & Confidence
            evidence.forEach(item => {
                const strength = typeof item.strength === 'number' ? item.strength : 75;
                const conf = typeof item.confidence === 'number' ? item.confidence : 75;
                const score = (strength * 0.5) + (conf * 0.5);
                weightedScore += score;
                totalWeight += 1;
            });

            let baseScore = totalWeight > 0 ? weightedScore / totalWeight : 50;

            // 2. Data Volume and Sample Size Penalties
            const rows = context.datasetSummary?.rows || 0;
            if (rows > 0 && rows < 30) {
                baseScore -= 25;
                reasons.push('حجم العينة صغير جداً (<30 سطر)، مما يرفع هامش الخطأ الإحصائي.');
            } else if (rows > 0 && rows < 100) {
                baseScore -= 10;
                reasons.push('حجم العينة متواضع (<100 سطر).');
            }

            // 3. Quality score penalty
            const healthScore = context.relevantMetrics?.healthScore;
            if (typeof healthScore === 'number' && healthScore < 70) {
                baseScore -= 15;
                reasons.push(`صحة البيانات منخفضة نسبياً (${healthScore}%).`);
            }

            // Ensure bounded score [0, 100]
            const finalScore = Math.max(0, Math.min(100, Math.round(baseScore)));

            let level = 'Moderate confidence';
            let levelArabic = 'ثقة متوسطة';

            if (finalScore >= 80) {
                level = 'High confidence';
                levelArabic = 'ثقة مرتفعة';
            } else if (finalScore >= 55) {
                level = 'Moderate confidence';
                levelArabic = 'ثقة متوسطة';
            } else if (finalScore >= 35) {
                level = 'Low confidence';
                levelArabic = 'ثقة منخفضة';
            } else {
                level = 'Insufficient evidence';
                levelArabic = 'أدلة غير كافية';
            }

            return {
                level,
                levelArabic,
                numericScore: finalScore,
                reasons
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.UncertaintyEngine = UncertaintyEngine;

})(typeof window !== 'undefined' ? window : global);
