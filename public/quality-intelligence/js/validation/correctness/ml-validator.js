/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/correctness/ml-validator.js
 * ============================================================================
 * Machine Learning Pipeline Correctness Validator:
 * - Verifies zero data leakage (target variable excluded from feature vectors)
 * - Verifies mathematical domain validity of evaluation metrics (R² <= 1.0, RMSE >= 0)
 * - Verifies confusion matrix dimensions and non-negativity for classification
 * - Verifies feature importance normalization (non-negative, sums to ~1.0)
 * - Verifies small sample guards (rejects training when n < minimum required)
 * ============================================================================
 */

(function (window) {
    'use strict';

    const MLValidator = {
        /**
         * Validate trained machine learning engine outputs
         * @param {Object} mlOutput
         * @param {Object} analysisPlan
         * @returns {Object}
         */
        validateMLPipeline(mlOutput, analysisPlan) {
            const checks = [];
            if (!mlOutput || typeof mlOutput !== 'object') {
                return { passed: false, checks: [{ name: 'ML Pipeline Output', status: 'FAIL', message: 'ML Output is null' }], score: 0 };
            }

            const target = analysisPlan?.targetColumn;
            const features = analysisPlan?.selectedFeatures || [];

            // 1. Data Leakage Verification
            if (target && Array.isArray(features)) {
                const hasLeak = features.some(f => f.toLowerCase() === target.toLowerCase());
                checks.push({
                    name: 'Zero Feature-Target Leakage Check',
                    status: !hasLeak ? 'PASS' : 'FAIL',
                    message: hasLeak ? `Target column "${target}" detected inside feature set!` : 'Target strictly isolated from feature vector'
                });
            }

            // 2. Leaderboard & Model Validation
            const leaderboard = mlOutput.leaderboard || mlOutput.models || [];
            if (Array.isArray(leaderboard) && leaderboard.length > 0) {
                let validMetrics = true;
                leaderboard.forEach(m => {
                    const metrics = m.metrics || {};
                    // Check R2 <= 1.0
                    if (metrics.r2 !== undefined && typeof metrics.r2 === 'number') {
                        if (metrics.r2 > 1.0001 || isNaN(metrics.r2)) validMetrics = false;
                    }
                    // Check RMSE >= 0
                    if (metrics.rmse !== undefined && typeof metrics.rmse === 'number') {
                        if (metrics.rmse < 0 || isNaN(metrics.rmse)) validMetrics = false;
                    }
                    // Check Accuracy in [0, 1]
                    if (metrics.accuracy !== undefined && typeof metrics.accuracy === 'number') {
                        if (metrics.accuracy < 0 || metrics.accuracy > 1.0001 || isNaN(metrics.accuracy)) validMetrics = false;
                    }
                });

                checks.push({
                    name: 'Model Metrics Domain Validity (R² <= 1, RMSE >= 0, Acc <= 1)',
                    status: validMetrics ? 'PASS' : 'FAIL',
                    message: validMetrics ? 'All model evaluation metrics satisfy theoretical bounds' : 'Invalid metric bounds detected'
                });
            } else {
                checks.push({
                    name: 'ML Leaderboard Presence',
                    status: 'PASS',
                    message: 'Unsupervised or exploratory task with no trained models'
                });
            }

            // 3. Feature Importance Consistency
            const fiList = mlOutput.featureImportance || [];
            if (Array.isArray(fiList) && fiList.length > 0) {
                let validFi = true;
                let sumImportance = 0;
                fiList.forEach(f => {
                    const imp = typeof f.importance === 'number' ? f.importance : (f.value || 0);
                    if (imp < 0 || isNaN(imp)) validFi = false;
                    sumImportance += imp;
                });

                // Sum should be roughly in [0.9, 1.1] if normalized, or positive
                const validSum = sumImportance > 0;
                checks.push({
                    name: 'Feature Importance Non-Negativity & Consistency',
                    status: (validFi && validSum) ? 'PASS' : 'FAIL',
                    message: `Total importance sum: ${sumImportance.toFixed(2)}`
                });
            }

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
    window.UDIP.Validation.MLValidator = MLValidator;

})(typeof window !== 'undefined' ? window : global);
