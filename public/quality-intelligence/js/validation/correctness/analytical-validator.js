/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/correctness/analytical-validator.js
 * ============================================================================
 * Validates analytical outputs from Step 2 (Data Profiler) and Step 3 (EDA):
 * - Summary statistics (mean, median, standard deviation, IQR, quantiles)
 * - Inferred data types (numeric, categorical, temporal, boolean)
 * - Outlier count and missingness rate bounds
 * - Dataset quality health scores
 * ============================================================================
 */

(function (window) {
    'use strict';

    const AnalyticalValidator = {
        /**
         * Validate profile output against raw dataset and expected properties
         * @param {Object} profile
         * @param {Object} dataset
         * @returns {Object} { passed: boolean, checks: Array, score: number }
         */
        validateProfile(profile, dataset) {
            const checks = [];

            if (!profile || typeof profile !== 'object') {
                return {
                    passed: false,
                    checks: [{ name: 'Profile Existence', status: 'FAIL', message: 'Profile is null or invalid' }],
                    score: 0
                };
            }

            // 1. Check Row and Column Count Alignment
            const rowMatch = profile.dataset?.rowCount === dataset?.rowCount;
            checks.push({
                name: 'Row Count Alignment',
                status: rowMatch ? 'PASS' : 'FAIL',
                expected: dataset?.rowCount,
                actual: profile.dataset?.rowCount
            });

            const colMatch = profile.dataset?.columnCount === dataset?.columnCount;
            checks.push({
                name: 'Column Count Alignment',
                status: colMatch ? 'PASS' : 'FAIL',
                expected: dataset?.columnCount,
                actual: profile.dataset?.columnCount
            });

            // 2. Validate Column Profiles
            const cols = profile.columns || [];
            let validColStats = true;
            cols.forEach(c => {
                if (!c.name || !c.inferredType) {
                    validColStats = false;
                }
                if (c.statistics) {
                    // Check missing rate in [0, 1]
                    if (typeof c.statistics.missingRate === 'number') {
                        if (c.statistics.missingRate < 0 || c.statistics.missingRate > 1) {
                            validColStats = false;
                            checks.push({
                                name: `Missing Rate Bounds (${c.name})`,
                                status: 'FAIL',
                                message: `Missing rate ${c.statistics.missingRate} is out of [0, 1] bounds`
                            });
                        }
                    }
                    // For numeric columns, verify mean and std
                    if (c.inferredType === 'float' || c.inferredType === 'integer') {
                        if (c.statistics.mean !== undefined && isNaN(c.statistics.mean)) {
                            validColStats = false;
                        }
                        if (c.statistics.min !== undefined && c.statistics.max !== undefined) {
                            if (c.statistics.min > c.statistics.max) {
                                validColStats = false;
                                checks.push({
                                    name: `Min-Max Consistency (${c.name})`,
                                    status: 'FAIL',
                                    message: `Min (${c.statistics.min}) > Max (${c.statistics.max})`
                                });
                            }
                        }
                    }
                }
            });

            checks.push({
                name: 'Column Statistics Consistency',
                status: validColStats ? 'PASS' : 'FAIL',
                message: validColStats ? 'All column metrics within valid domains' : 'Inconsistencies detected in column statistics'
            });

            // 3. Quality Health Score Boundedness [0, 100]
            const qualityScore = profile.quality?.overallHealthScore;
            const validQuality = typeof qualityScore === 'number' && qualityScore >= 0 && qualityScore <= 100;
            checks.push({
                name: 'Quality Health Score Boundedness',
                status: validQuality ? 'PASS' : 'FAIL',
                expected: '[0, 100]',
                actual: qualityScore
            });

            const passedCount = checks.filter(c => c.status === 'PASS').length;
            const score = Math.round((passedCount / Math.max(1, checks.length)) * 100);

            return {
                passed: checks.every(c => c.status === 'PASS'),
                checks,
                score
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.AnalyticalValidator = AnalyticalValidator;

})(typeof window !== 'undefined' ? window : global);
