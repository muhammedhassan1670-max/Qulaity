/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/reliability/analytical-reliability.js
 * ============================================================================
 * Synthesizes data quality, sample adequacy, distribution stability, and leakage
 * into an AnalyticalReliabilityProfile that directly modulates downstream trust.
 * Core Principle: A beautiful model trained on unreliable data MUST receive low trust.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const AnalyticalReliability = {
        /**
         * Compute analytical reliability profile
         * @param {Object} profile - Profiler output
         * @param {Object} missingness - Missingness intelligence result
         * @param {Array} derived - Discovered derived variables
         * @returns {Object} AnalyticalReliabilityProfile
         */
        evaluate(profile, missingness = {}, derived = []) {
            const q = profile?.quality || {};
            const ds = profile?.dataset || {};
            const rowCount = ds.rowCount || 0;
            const colCount = ds.columnCount || 0;

            let score = 100;
            const riskFactors = [];
            const limitations = [];

            // 1. Sample Size Adequacy
            if (rowCount < 30) {
                score -= 30;
                riskFactors.push({ factor: 'Extreme Small Sample', penalty: 30, severity: 'Critical' });
                limitations.push(`Very small sample (N=${rowCount}); high risk of empirical variance and overfitting.`);
            } else if (rowCount < 100) {
                score -= 15;
                riskFactors.push({ factor: 'Limited Sample Size', penalty: 15, severity: 'Moderate' });
                limitations.push(`Sample size (N=${rowCount}) provides limited statistical power for complex interactions.`);
            }

            // 2. Missingness Impact
            const missRate = missingness.overallMissingRate || 0;
            if (missRate > 15) {
                score -= 20;
                riskFactors.push({ factor: 'High Missingness Density', penalty: 20, severity: 'High' });
                limitations.push(`Overall missingness (${missRate}%) undermines parameter stability.`);
            } else if (missRate > 5) {
                score -= 10;
                riskFactors.push({ factor: 'Moderate Missingness', penalty: 10, severity: 'Moderate' });
            }

            // 3. Duplicate Rows Redundancy
            const dupPct = q.duplicateRowsPct || 0;
            if (dupPct > 10) {
                score -= 15;
                riskFactors.push({ factor: 'High Redundancy / Duplicates', penalty: 15, severity: 'High' });
                limitations.push(`Duplicate records (${dupPct}%) inflate statistical significance spuriously.`);
            }

            // 4. Data Leakage / Derived Variables
            if (Array.isArray(derived) && derived.length > 0) {
                score -= 10;
                riskFactors.push({ factor: 'Potential Formula Artifacts / Leakage', penalty: 10, severity: 'Moderate' });
                limitations.push(`${derived.length} mathematical derivation(s) detected; separate predictive features from definitions.`);
            }

            // 5. Dimensionality Ratio (p / n)
            if (rowCount > 0 && colCount / rowCount > 0.25) {
                score -= 12;
                riskFactors.push({ factor: 'Curse of Dimensionality (High p/n ratio)', penalty: 12, severity: 'Moderate' });
                limitations.push(`High dimensional ratio (${colCount} cols / ${rowCount} rows); regularized estimators required.`);
            }

            score = Math.max(10, Math.min(100, score));

            let reliabilityGrade = 'A_EXEMPLARY';
            if (score < 50) reliabilityGrade = 'D_UNRELIABLE';
            else if (score < 70) reliabilityGrade = 'C_CAUTION';
            else if (score < 85) reliabilityGrade = 'B_ACCEPTABLE';

            return {
                overallScore: score,
                overallReliabilityScore: score,
                reliabilityGrade,
                sampleAdequacy: rowCount >= 200 ? 'Robust' : (rowCount >= 60 ? 'Acceptable' : 'Deficient'),
                riskFactors,
                limitations,
                confidenceDiscountMultiplier: +( (score / 100).toFixed(2) ),
                guidance: score >= 80
                    ? 'Data quality robust; findings support high-confidence statistical inference.'
                    : 'Analytical findings must be presented with wide uncertainty bounds due to data constraints.'
            };
        },

        assessReliability(arg1, arg2, arg3) {
            if (arg1 && arg1.profile) {
                return this.evaluate(arg1.profile, arg1.missingness, arg1.derived);
            }
            return this.evaluate(arg1, arg2, arg3);
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.AnalyticalReliability = AnalyticalReliability;

})(typeof window !== 'undefined' ? window : global);
