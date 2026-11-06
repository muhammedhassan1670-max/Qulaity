/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/statistics/effect-size.js
 * ============================================================================
 * Computes standardized effect size measures for statistical hypothesis tests:
 * - Cohen's d (Two-group means comparison)
 * - Eta squared (ANOVA between-group variance explained)
 * - Cramér's V (Contingency table association strength)
 * - Rank-biserial correlation (Mann-Whitney U non-parametric effect)
 * Domain-agnostic & math-safe (zero division guards).
 * ============================================================================
 */

(function (window) {
    'use strict';

    const EffectSize = {
        /**
         * Compute Cohen's d for two independent groups
         * 
         * @param {Array<number>} g1 
         * @param {Array<number>} g2 
         * @returns {{ value: number, magnitude: string }}
         */
        cohensD(g1, g2) {
            if (!Array.isArray(g1) || !Array.isArray(g2) || g1.length < 2 || g2.length < 2) {
                return { value: 0, magnitude: 'negligible' };
            }

            const n1 = g1.length;
            const n2 = g2.length;
            const m1 = g1.reduce((a, b) => a + b, 0) / n1;
            const m2 = g2.reduce((a, b) => a + b, 0) / n2;

            let ss1 = 0, ss2 = 0;
            g1.forEach(v => { ss1 += (v - m1) * (v - m1); });
            g2.forEach(v => { ss2 += (v - m2) * (v - m2); });

            const s1Sq = ss1 / (n1 - 1);
            const s2Sq = ss2 / (n2 - 1);
            const pooledVar = ((n1 - 1) * s1Sq + (n2 - 1) * s2Sq) / (n1 + n2 - 2);

            if (pooledVar <= 1e-9) {
                return { value: 0, magnitude: 'negligible' };
            }

            const d = (m1 - m2) / Math.sqrt(pooledVar);
            const absD = Math.abs(d);

            let magnitude = 'negligible';
            if (absD >= 0.8) magnitude = 'large';
            else if (absD >= 0.5) magnitude = 'medium';
            else if (absD >= 0.2) magnitude = 'small';

            return {
                value: Number(d.toFixed(4)),
                magnitude
            };
        },

        /**
         * Compute Eta squared (η²) for ANOVA
         * 
         * @param {number} ssBetween Sum of squares between groups
         * @param {number} ssTotal Total sum of squares
         * @returns {{ value: number, magnitude: string }}
         */
        etaSquared(ssBetween, ssTotal) {
            if (ssTotal <= 1e-9 || !Number.isFinite(ssBetween) || !Number.isFinite(ssTotal)) {
                return { value: 0, magnitude: 'negligible' };
            }

            const eta2 = Math.max(0, Math.min(1, ssBetween / ssTotal));
            let magnitude = 'negligible';
            if (eta2 >= 0.14) magnitude = 'large';
            else if (eta2 >= 0.06) magnitude = 'medium';
            else if (eta2 >= 0.01) magnitude = 'small';

            return {
                value: Number(eta2.toFixed(4)),
                magnitude
            };
        },

        /**
         * Compute Cramér's V for Chi-Square test
         * 
         * @param {number} chiSquare 
         * @param {number} n Total observations
         * @param {number} rows Number of table rows
         * @param {number} cols Number of table columns
         * @returns {{ value: number, magnitude: string }}
         */
        cramersV(chiSquare, n, rows, cols) {
            const minDim = Math.min(rows - 1, cols - 1);
            if (n <= 0 || minDim <= 0 || !Number.isFinite(chiSquare)) {
                return { value: 0, magnitude: 'negligible' };
            }

            const v = Math.sqrt(Math.max(0, chiSquare) / (n * minDim));
            const clampedV = Math.max(0, Math.min(1, v));

            let magnitude = 'negligible';
            if (clampedV >= 0.35) magnitude = 'large';
            else if (clampedV >= 0.20) magnitude = 'medium';
            else if (clampedV >= 0.10) magnitude = 'small';

            return {
                value: Number(clampedV.toFixed(4)),
                magnitude
            };
        },

        /**
         * Compute Rank-Biserial correlation for Mann-Whitney U test
         * 
         * @param {number} u Mann-Whitney U statistic
         * @param {number} n1 Group 1 size
         * @param {number} n2 Group 2 size
         * @returns {{ value: number, magnitude: string }}
         */
        rankBiserial(u, n1, n2) {
            if (n1 <= 0 || n2 <= 0 || !Number.isFinite(u)) {
                return { value: 0, magnitude: 'negligible' };
            }

            const r = 1 - (2 * u) / (n1 * n2);
            const absR = Math.abs(r);

            let magnitude = 'negligible';
            if (absR >= 0.5) magnitude = 'large';
            else if (absR >= 0.3) magnitude = 'medium';
            else if (absR >= 0.1) magnitude = 'small';

            return {
                value: Number(r.toFixed(4)),
                magnitude
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.EffectSize = EffectSize;

})(typeof window !== 'undefined' ? window : global);
