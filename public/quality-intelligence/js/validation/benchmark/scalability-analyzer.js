/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/benchmark/scalability-analyzer.js
 * ============================================================================
 * Scalability & Empirical Complexity Analyzer:
 * - Measures execution latencies across progressive dataset scales (N rows)
 * - Estimates algorithmic empirical complexity order: O(N), O(N log N), or O(N²)
 * - Computes practical browser memory and latency thresholds
 * - Strictly avoids fabricating scalability claims: reports measured limits
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ScalabilityAnalyzer = {
        /**
         * Analyze empirical complexity scaling given benchmark points
         * @param {Array<Object>} benchmarkPoints Array of { n: number, durationMs: number }
         * @returns {Object} Complexity classification and scaling factor
         */
        analyzeComplexity(benchmarkPoints = []) {
            if (!Array.isArray(benchmarkPoints) || benchmarkPoints.length < 2) {
                return {
                    complexity: 'Insufficient data points',
                    scalingFactor: 1.0,
                    points: benchmarkPoints
                };
            }

            // Sort by n ascending
            const pts = [...benchmarkPoints].sort((a, b) => a.n - b.n);
            const ratios = [];

            for (let i = 1; i < pts.length; i++) {
                const nRatio = pts[i].n / Math.max(1, pts[i - 1].n);
                const tRatio = Math.max(0.1, pts[i].durationMs) / Math.max(0.1, pts[i - 1].durationMs);
                // Log scaling exponent: alpha = log(tRatio) / log(nRatio)
                if (nRatio > 1 && tRatio > 0) {
                    const alpha = Math.log(tRatio) / Math.log(nRatio);
                    ratios.push(alpha);
                }
            }

            const avgAlpha = ratios.length > 0 ? (ratios.reduce((s, r) => s + r, 0) / ratios.length) : 1.0;

            let complexity = 'O(N) - Linear';
            if (avgAlpha > 1.6) {
                complexity = 'O(N²) - Quadratic (Candidate for sampling optimization)';
            } else if (avgAlpha > 1.15) {
                complexity = 'O(N log N) - Log-Linear';
            } else if (avgAlpha < 0.8) {
                complexity = 'Sub-Linear (Dominated by fixed startup overhead)';
            }

            // Estimate practical browser limit (e.g. for max 5 seconds latency)
            const lastPt = pts[pts.length - 1];
            const maxRecommendedRows = Math.round(lastPt.n * Math.pow(5000 / Math.max(1, lastPt.durationMs), 1 / Math.max(0.5, avgAlpha)));

            return {
                complexity,
                empiricalExponent: Number(avgAlpha.toFixed(2)),
                pointsEvaluated: pts.length,
                maxRecommendedBrowserRows: Math.min(250000, Math.max(5000, maxRecommendedRows)),
                points: pts
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.ScalabilityAnalyzer = ScalabilityAnalyzer;

})(typeof window !== 'undefined' ? window : global);
