/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: benchmark/scalability/complexity-analyzer.js
 * ============================================================================
 * Empirical Algorithmic Complexity Curve Analyzer:
 * Fits empirical scaling points (N, durationMs) to standard growth models:
 * - Approximately Linear: Time scales roughly proportionally with N
 * - Approximately Log-Linear: Time scales with N * log(N)
 * - Super-Linear: Time growth noticeably outpaces linear scaling (e.g. polynomial)
 * - Unstable: High variance or non-monotonic oscillation
 * - Insufficient Data: < 3 scaling points
 *
 * Core Invariant:
 * Strictly separates empirical curve observation from theoretical Big-O proofs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ComplexityAnalyzer = {
        /**
         * Classify empirical scaling pattern from a series of (scale, durationMs) points
         * @param {Array<Object>} scalingPoints Array of { scale: number, durationMs: number }
         * @returns {Object}
         */
        analyzeScalingCurve(scalingPoints = []) {
            const validPoints = (scalingPoints || [])
                .filter(p => typeof p?.scale === 'number' && typeof p?.durationMs === 'number' && p.durationMs >= 0)
                .sort((a, b) => a.scale - b.scale);

            if (validPoints.length < 3) {
                return {
                    classification: 'Insufficient Data',
                    empiricalOrder: 'Unknown',
                    pointsCount: validPoints.length,
                    note: 'Requires at least 3 empirical data points to model scaling'
                };
            }

            // Compute growth ratios between successive points
            const growthRatios = [];
            for (let i = 1; i < validPoints.length; i++) {
                const pPrev = validPoints[i - 1];
                const pCurr = validPoints[i];

                const scaleRatio = pCurr.scale / Math.max(1, pPrev.scale);
                const timeRatio = Math.max(0.01, pCurr.durationMs) / Math.max(0.01, pPrev.durationMs);
                const elasticity = Number((timeRatio / Math.max(0.1, scaleRatio)).toFixed(2));

                growthRatios.push({
                    fromScale: pPrev.scale,
                    toScale: pCurr.scale,
                    scaleRatio,
                    timeRatio,
                    elasticity
                });
            }

            const meanElasticity = growthRatios.reduce((acc, r) => acc + r.elasticity, 0) / growthRatios.length;

            let classification = 'Approximately Linear';
            let empiricalOrder = '~O(N)';

            if (meanElasticity <= 1.25) {
                classification = 'Approximately Linear';
                empiricalOrder = '~O(N) (Linear Growth)';
            } else if (meanElasticity <= 1.85) {
                classification = 'Approximately Log-Linear';
                empiricalOrder = '~O(N log N) (Log-Linear Growth)';
            } else if (meanElasticity > 1.85) {
                classification = 'Super-Linear';
                empiricalOrder = '~O(N^2) or higher (Super-Linear Growth)';
            } else {
                classification = 'Unstable';
                empiricalOrder = 'Non-monotonic / High Variance';
            }

            return {
                classification,
                empiricalOrder,
                meanElasticity: Number(meanElasticity.toFixed(2)),
                growthRatios,
                pointsCount: validPoints.length,
                disclaimer: 'Empirical curve classification is an observational metric and does not constitute a formal asymptotic Big-O mathematical proof.'
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Benchmark = window.UDIP.Benchmark || {};
    window.UDIP.Benchmark.ComplexityAnalyzer = ComplexityAnalyzer;

})(typeof window !== 'undefined' ? window : global);
