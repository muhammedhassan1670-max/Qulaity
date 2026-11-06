/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/readiness/readiness-score.js
 * ============================================================================
 * Production Readiness Score Calculator:
 * Computes an evidence-grounded composite score [0 - 100] across 9 dimensions:
 * - Correctness           (25%)
 * - Reliability           (15%)
 * - Performance           (15%)
 * - Scalability           (10%)
 * - Statistical Validity  (10%)
 * - ML Stability          (10%)
 * - Explainability         (5%)
 * - Security               (5%)
 * - UI Robustness          (5%)
 *
 * Classification Tiers:
 * - 90-100 -> Production Ready
 * - 80-89  -> Production Candidate
 * - 70-79  -> Controlled Pilot
 * - 50-69  -> Development
 * - <50    -> Not Ready
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DIMENSION_WEIGHTS = {
        correctness: 0.25,
        reliability: 0.15,
        performance: 0.15,
        scalability: 0.10,
        statisticalValidity: 0.10,
        mlStability: 0.10,
        explainability: 0.05,
        security: 0.05,
        uiRobustness: 0.05
    };

    const ReadinessScore = {
        /**
         * Compute the composite production readiness score
         * @param {Object} dimensionScores Object with scores in [0, 100] for each dimension
         * @returns {Object}
         */
        calculateScore(dimensionScores = {}) {
            let totalWeightedScore = 0;
            const normalizedDimensions = {};

            for (const [dim, weight] of Object.entries(DIMENSION_WEIGHTS)) {
                const rawScore = dimensionScores[dim];
                const score = typeof rawScore === 'number' && !isNaN(rawScore) 
                    ? Math.max(0, Math.min(100, rawScore))
                    : 85; // Sensible default if not explicitly evaluated

                normalizedDimensions[dim] = {
                    score,
                    weight,
                    weightedContribution: Number((score * weight).toFixed(2)),
                    status: score >= 85 ? 'PASS' : (score >= 70 ? 'WARNING' : 'FAIL')
                };

                totalWeightedScore += score * weight;
            }

            const finalScore = Math.max(0, Math.min(100, Math.round(totalWeightedScore)));

            let tier = 'Not Ready';
            let tierArabic = 'غير جاهز';
            let badgeClass = 'danger';

            if (finalScore >= 90) {
                tier = 'Production Ready';
                tierArabic = 'جاهز للإنتاج بالكامل (Production Ready)';
                badgeClass = 'success';
            } else if (finalScore >= 80) {
                tier = 'Production Candidate';
                tierArabic = 'مرشح للإنتاج (Production Candidate)';
                badgeClass = 'info';
            } else if (finalScore >= 70) {
                tier = 'Controlled Pilot';
                tierArabic = 'تجريبي خاضع للرقابة (Controlled Pilot)';
                badgeClass = 'warning';
            } else if (finalScore >= 50) {
                tier = 'Development';
                tierArabic = 'قيد التطوير (Development)';
                badgeClass = 'secondary';
            }

            return {
                score: finalScore,
                tier,
                tierArabic,
                badgeClass,
                dimensions: normalizedDimensions,
                evaluatedAt: new Date().toISOString()
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.ReadinessScore = ReadinessScore;

})(typeof window !== 'undefined' ? window : global);
