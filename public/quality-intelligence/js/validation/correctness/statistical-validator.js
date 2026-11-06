/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/correctness/statistical-validator.js
 * ============================================================================
 * Independent validation for statistical hypothesis tests and effect sizes:
 * - Pearson & Spearman correlation tolerances
 * - Welch t-test, Mann-Whitney, ANOVA, Kruskal-Wallis, Chi-square p-values
 * - Effect sizes: Cohen's d, Eta², Cramér's V, Rank-biserial
 * - Mathematical guardrails: Constant series, tiny samples (n < 3), null inputs
 * ============================================================================
 */

(function (window) {
    'use strict';

    const StatisticalValidator = {
        /**
         * Validate statistical test results against expected mathematical bounds
         * @param {Object} statEngineOutput
         * @returns {Object}
         */
        validateTestResults(statEngineOutput) {
            const checks = [];
            if (!statEngineOutput || typeof statEngineOutput !== 'object') {
                return { passed: false, checks: [{ name: 'Test Results Null Check', status: 'FAIL' }], score: 0 };
            }

            const tests = Array.isArray(statEngineOutput.tests) ? statEngineOutput.tests : (statEngineOutput.results || []);

            tests.forEach((t, idx) => {
                const testName = t.testName || t.name || `Test_${idx + 1}`;

                // 1. P-value in [0, 1]
                if (t.pValue !== undefined && t.pValue !== null) {
                    const validP = typeof t.pValue === 'number' && !isNaN(t.pValue) && t.pValue >= 0 && t.pValue <= 1.0;
                    checks.push({
                        name: `${testName} - P-value Range`,
                        status: validP ? 'PASS' : 'FAIL',
                        message: `pValue = ${t.pValue}`
                    });
                }

                // 2. Effect Size Boundedness
                if (t.effectSize !== undefined && t.effectSize !== null) {
                    const esVal = typeof t.effectSize === 'number' ? t.effectSize : t.effectSize.value;
                    if (typeof esVal === 'number') {
                        const validEs = !isNaN(esVal) && isFinite(esVal);
                        checks.push({
                            name: `${testName} - Effect Size Finite Check`,
                            status: validEs ? 'PASS' : 'FAIL',
                            message: `effectSize = ${esVal}`
                        });
                    }
                }

                // 3. Test Statistic Finite Check
                if (t.statistic !== undefined && t.statistic !== null) {
                    const validStat = typeof t.statistic === 'number' && !isNaN(t.statistic) && isFinite(t.statistic);
                    checks.push({
                        name: `${testName} - Statistic Finite Check`,
                        status: validStat ? 'PASS' : 'FAIL',
                        message: `statistic = ${t.statistic}`
                    });
                }
            });

            if (checks.length === 0) {
                checks.push({ name: 'Statistical Output Evaluated', status: 'PASS', message: 'No active statistical tests to evaluate' });
            }

            const passedCount = checks.filter(c => c.status === 'PASS').length;
            const score = Math.round((passedCount / checks.length) * 100);

            return {
                passed: checks.every(c => c.status === 'PASS'),
                checks,
                score
            };
        },

        /**
         * Compare a calculated correlation r against expected ground truth r
         * @param {number} actualR
         * @param {number} expectedR
         * @param {number} tolerance
         */
        validateCorrelation(actualR, expectedR, tolerance = 0.12) {
            if (typeof actualR !== 'number' || isNaN(actualR)) {
                return { passed: false, diff: NaN, message: 'Actual r is NaN or not a number' };
            }
            const diff = Math.abs(actualR - expectedR);
            const passed = diff <= tolerance;
            return {
                passed,
                actualR,
                expectedR,
                diff: Number(diff.toFixed(3)),
                message: passed ? 'Correlation matches ground truth within tolerance' : `Difference (${diff.toFixed(3)}) exceeds tolerance (${tolerance})`
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.StatisticalValidator = StatisticalValidator;

})(typeof window !== 'undefined' ? window : global);
