/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/machine-learning/model-selector.js
 * ============================================================================
 * Implements a baseline-first model selection strategy:
 * Selects appropriate candidate architectures for each analytical task.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ModelSelector = {
        /**
         * Get candidate models for a specified task
         * 
         * @param {string} taskType 'regression' | 'binary_classification' | 'multiclass_classification' | 'clustering'
         * @param {number} sampleSize Total row count
         * @returns {Array<Object>} List of candidate models with configurations
         */
        getCandidates(taskType, sampleSize = 100) {
            if (taskType === 'regression') {
                const candidates = [
                    { id: 'linear', name: 'Linear Regression (OLS)', type: 'linear', isBaseline: true },
                    { id: 'ridge', name: 'Ridge Regression (L2)', type: 'linear', isBaseline: false },
                    { id: 'tree', name: 'Decision Tree Regressor', type: 'tree', isBaseline: false }
                ];
                if (sampleSize >= 15) {
                    candidates.push({ id: 'gbdt', name: 'Gradient Boosted Regressor (GBDT)', type: 'gradient_boosting', isBaseline: false });
                    candidates.push({ id: 'forest', name: 'Random Forest Regressor', type: 'forest', isBaseline: false });
                    candidates.push({ id: 'knn', name: 'K-Nearest Neighbors (KNN)', type: 'knn', isBaseline: false });
                    candidates.push({ id: 'mlp', name: 'Neural Network (MLP)', type: 'neural_network', isBaseline: false });
                }
                return candidates;
            }

            if (taskType === 'binary_classification' || taskType === 'multiclass_classification') {
                const isBinary = taskType === 'binary_classification';
                const candidates = [
                    { id: 'logistic', name: isBinary ? 'Logistic Regression' : 'Multiclass Logistic (OvR)', type: 'linear', isBaseline: true },
                    { id: 'tree', name: 'Decision Tree Classifier', type: 'tree', isBaseline: false },
                    { id: 'nb', name: 'Gaussian Naive Bayes', type: 'naive_bayes', isBaseline: false }
                ];
                if (sampleSize >= 15) {
                    candidates.push({ id: 'gbdt', name: 'Gradient Boosted Trees (GBDT)', type: 'gradient_boosting', isBaseline: false });
                    candidates.push({ id: 'forest', name: 'Random Forest Classifier', type: 'forest', isBaseline: false });
                    candidates.push({ id: 'knn', name: 'K-Nearest Neighbors (KNN)', type: 'knn', isBaseline: false });
                    candidates.push({ id: 'mlp', name: 'Neural Network (MLP)', type: 'neural_network', isBaseline: false });
                }
                return candidates;
            }

            if (taskType === 'clustering') {
                return [
                    { id: 'kmeans', name: 'K-Means++', type: 'centroid', isBaseline: true }
                ];
            }

            return [];
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.ModelSelector = ModelSelector;

})(typeof window !== 'undefined' ? window : global);
