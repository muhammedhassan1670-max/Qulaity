/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/evaluation/evaluator.js
 * ============================================================================
 * Unified model evaluation dispatcher for Regression and Classification tasks.
 * Automatically delegates to appropriate metric calculators and formats results.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const Evaluator = {
        /**
         * Evaluate model predictions based on task type
         * 
         * @param {Object} params
         * @param {string} params.taskType 'regression', 'binary_classification', 'multiclass_classification'
         * @param {Array} params.actual
         * @param {Array} params.predicted
         * @param {Array} [params.knownClasses] Optional known class labels
         * @returns {Object} Metric evaluation result
         */
        evaluate({ taskType, actual, predicted, knownClasses = null }) {
            if (!taskType || !actual || !predicted) {
                return { valid: false, reason: 'Missing evaluation parameters' };
            }

            const isRegression = taskType === 'regression' || taskType === 'forecasting';

            if (isRegression) {
                const regMetrics = window.UDIP && window.UDIP.RegressionMetrics
                    ? window.UDIP.RegressionMetrics.calculate(actual, predicted)
                    : { mae: 0, mse: 0, rmse: 0, r2: 0, mape: 0, n: 0 };

                return {
                    valid: true,
                    taskType,
                    metrics: regMetrics,
                    primaryMetric: 'rmse',
                    primaryScore: regMetrics.rmse
                };
            } else {
                const clfMetrics = window.UDIP && window.UDIP.ClassificationMetrics
                    ? window.UDIP.ClassificationMetrics.calculate(actual, predicted, knownClasses)
                    : { accuracy: 0, precision: 0, recall: 0, f1: 0, balancedAccuracy: 0, macroF1: 0, weightedF1: 0, n: 0 };

                return {
                    valid: true,
                    taskType,
                    metrics: clfMetrics,
                    primaryMetric: 'macroF1',
                    primaryScore: clfMetrics.macroF1
                };
            }
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Evaluator = Evaluator;

})(typeof window !== 'undefined' ? window : global);
