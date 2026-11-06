/**
 * UDIP Explainable Analysis Planner
 * 
 * Automatically generates a scientifically sound, explainable analytical plan
 * matching dataset constraints, temporal structure, target properties, and user objective.
 * 
 * @module AnalysisPlanner
 */

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.AnalysisPlanner = factory();
        root.UDIPAnalysisPlanner = root.AnalysisPlanner;
    }
}(typeof self !== 'undefined' ? self : this, function() {
    'use strict';

    class AnalysisPlanner {
        /**
         * Generate explainable analysis plan based on knowledge state and dataset metadata
         * @param {Object} knowledgeState
         * @param {Array<Object>|Object} dataset
         * @returns {Object} Complete explainable analysis plan
         */
        static plan(knowledgeState, dataset) {
            const rawData = Array.isArray(dataset) ? dataset : (dataset && dataset.data ? dataset.data : []);
            const rowCount = rawData.length || knowledgeState?.dataset?.rowCount || 0;
            const objective = knowledgeState?.objective?.primary || 'exploratory_discovery';
            const targetCol = knowledgeState?.objective?.targetVariable || null;
            const timeCol = knowledgeState?.objective?.timeVariable || null;
            const isTimeSeries = knowledgeState?.dataset?.isTimeSeries || !!timeCol;
            const readiness = knowledgeState?.readiness || { overallScore: 80, status: 'READY' };

            const plannedMethods = [];
            const rejectedMethods = [];

            // 1. Exploratory & Distribution Phase (Always foundational)
            plannedMethods.push({
                stage: '03_INVESTIGATE',
                method: 'Non-Parametric & Robust Distribution Profiling',
                objective: 'Profile skewness, kurtosis, Tukey outlier bounds, and multimodality',
                rationale: 'Establishes valid statistical distributions before applying parametric assumptions.',
                suitabilityScore: 0.98
            });

            // 2. Correlation & Mutual Information Matrix
            plannedMethods.push({
                stage: '03_INVESTIGATE',
                method: 'Bivariate Pearson / Spearman / Mutual Information Matrix',
                objective: 'Identify linear and non-linear associations across continuous and discrete variables',
                rationale: 'Uncovers both monotonic and non-linear couplings without assuming linear relationships.',
                suitabilityScore: 0.95
            });

            // 3. Supervised vs Unsupervised Planning
            if (targetCol) {
                const targetValues = rawData.map(r => r[targetCol]).filter(v => v !== null && v !== undefined);
                const distinctTarget = new Set(targetValues);
                const isClassification = distinctTarget.size <= 10;

                if (isClassification) {
                    plannedMethods.push({
                        stage: '04_ANALYZE',
                        method: 'Class-Balanced Logistic Regression with L2 Regularization',
                        objective: `Model binary/multiclass target "${targetCol}" with calibrated probabilities`,
                        rationale: `Target is discrete (${distinctTarget.size} classes). Logistic regression provides interpretable log-odds and prevents overfitting on sample size N=${rowCount}.`,
                        suitabilityScore: 0.92
                    });

                    if (rowCount >= 20) {
                        plannedMethods.push({
                            stage: '04_ANALYZE',
                            method: 'Constrained Decision Tree Classifier (Max Depth = 4)',
                            objective: 'Extract human-auditable decision rules and feature splits',
                            rationale: 'Provides interpretable IF-THEN rules directly explaining failure/event conditions.',
                            suitabilityScore: 0.88
                        });
                    }

                    if (rowCount >= 50) {
                        plannedMethods.push({
                            stage: '04_ANALYZE',
                            method: 'Random Forest Ensemble with Out-of-Bag Validation',
                            objective: 'Compute non-linear feature importance and robust ensemble predictions',
                            rationale: 'Ensemble bagging reduces variance and captures complex feature interactions.',
                            suitabilityScore: 0.90
                        });
                    } else {
                        rejectedMethods.push({
                            method: 'Deep Random Forests & High-Capacity Gradient Boosters',
                            reason: `Sample size (N=${rowCount}) is too small; high-capacity ensembles risk severe overfitting.`
                        });
                    }
                } else {
                    // Continuous Regression
                    plannedMethods.push({
                        stage: '04_ANALYZE',
                        method: 'ElasticNet Regularized Regression with Robust Scaling',
                        objective: `Predict continuous target "${targetCol}" and estimate feature coefficients`,
                        rationale: 'ElasticNet handles multicollinearity by combining L1 and L2 penalties.',
                        suitabilityScore: 0.91
                    });
                }
            } else {
                // Unsupervised Anomaly / Clustering / SPC
                plannedMethods.push({
                    stage: '04_ANALYZE',
                    method: 'Robust Isolation & Mahalanobis Anomaly Scoring',
                    objective: 'Detect multivariate outliers and unusual process states without target labels',
                    rationale: 'Unsupervised distance metrics isolate atypical multi-sensor configurations.',
                    suitabilityScore: 0.89
                });

                rejectedMethods.push({
                    method: 'Supervised Classifiers & Regression Models',
                    reason: 'No confirmed target outcome variable is designated by the user.'
                });
            }

            // 4. Temporal & Time-Aware Forecasting Planning
            let validationStrategy = 'Stratified 5-Fold Cross Validation';

            if (isTimeSeries) {
                plannedMethods.push({
                    stage: '05_PREDICT',
                    method: 'Time-Aware Lagged Feature Predictor X(t-k) -> Y(t+H)',
                    objective: 'Predict future outcomes with realistic lead-time horizon without future data leakage',
                    rationale: 'Chronological time ordering requires walk-forward sliding window evaluation.',
                    suitabilityScore: 0.94
                });
                validationStrategy = 'Chronological Walk-Forward Temporal Split (80% Train / 20% Test)';

                rejectedMethods.push({
                    method: 'Randomized K-Fold Shuffling',
                    reason: 'Random train/test shuffling across time-series data causes lookahead leakage.'
                });
            } else {
                rejectedMethods.push({
                    method: 'Autoregressive Lag Modeling',
                    reason: 'No temporal ordering variable was confirmed.'
                });
            }

            return {
                primaryObjective: objective,
                targetVariable: targetCol || 'None (Unsupervised)',
                plannedMethods,
                rejectedMethods,
                validationStrategy,
                summaryRationale: `Formulated ${plannedMethods.length} tailored methods based on dataset properties (N=${rowCount}, Time-Series=${isTimeSeries}, Target=${targetCol || 'None'}). Excluded ${rejectedMethods.length} unviable methods.`,
                readinessConstraint: readiness.status === 'READY' ? 'Full execution cleared' : `Execution conditioned on: ${readiness.warnings?.join('; ') || 'Data quality gate'}`
            };
        }
    }

    return AnalysisPlanner;
}));
