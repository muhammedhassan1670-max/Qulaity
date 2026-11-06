/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/learning/outcome-tracker.js
 * ============================================================================
 * Closes the empirical feedback loop by tracking real-world predictions against
 * actual observed outcomes (TP, FP, TN, FN, Realized MAE/RMSE).
 * 
 * Computes Live Model Health Status:
 * - HEALTHY   (Realized performance closely matches validation metrics)
 * - WARNING   (Mild degradation or localized variance detected)
 * - DEGRADED  (Significant performance drop; triggers automated retraining)
 * ============================================================================
 */

(function (window) {
    'use strict';

    const _predictionStore = [];
    const _outcomeStore = [];

    const OutcomeTracker = {
        /**
         * Log an inference prediction made by an active model
         * 
         * @param {Object} params
         * @param {string} [params.id]
         * @param {string} params.modelName
         * @param {string} [params.taskType] - 'classification' | 'regression'
         * @param {Object} [params.instance] - Input feature values
         * @param {any} params.prediction - Predicted class or value
         * @param {number} [params.probability] - Estimated probability (0-1)
         * @param {number} [params.confidence] - Confidence score (0-100)
         * @param {any} [params.baselinePrediction] - Naive baseline comparison
         * @returns {Object} Logged prediction record
         */
        logPrediction({
            id = null,
            modelName = 'Primary Model',
            taskType = 'classification',
            instance = {},
            prediction = null,
            probability = null,
            confidence = 80,
            baselinePrediction = null
        } = {}) {
            const predId = id || `PRED-${String(_predictionStore.length + 1).padStart(4, '0')}`;
            const record = {
                predictionId: predId,
                timestamp: new Date().toISOString(),
                modelName,
                taskType,
                instance,
                prediction,
                probability: Number.isFinite(probability) ? probability : null,
                confidence: Number.isFinite(confidence) ? confidence : 80,
                baselinePrediction,
                status: 'PENDING_OUTCOME',
                actualOutcome: null,
                realizedAt: null,
                evaluation: null
            };

            _predictionStore.push(record);
            return record;
        },

        /**
         * Record the actual realized outcome for a previous prediction
         * 
         * @param {Object} params
         * @param {string} params.predictionId
         * @param {any} params.actualOutcome
         * @param {string} [params.context]
         * @returns {Object} Evaluation record
         */
        recordActualOutcome({
            predictionId = '',
            actualOutcome = null,
            context = ''
        } = {}) {
            if (!predictionId) {
                throw new Error('[UDIP:OutcomeTracker] predictionId is required to record actual outcome.');
            }

            const pred = _predictionStore.find(p => p.predictionId === predictionId);
            if (!pred) {
                throw new Error(`[UDIP:OutcomeTracker] Prediction with ID "${predictionId}" was not found in registry.`);
            }

            const isClassification = pred.taskType === 'classification' || typeof pred.prediction === 'string' || typeof pred.prediction === 'boolean';
            let evalResult = {};

            if (isClassification) {
                const predStr = String(pred.prediction).toLowerCase().trim();
                const actStr = String(actualOutcome).toLowerCase().trim();
                const isCorrect = predStr === actStr;

                const isPredPositive = predStr === '1' || predStr === 'true' || predStr === 'yes' || predStr === 'positive';
                const isActPositive = actStr === '1' || actStr === 'true' || actStr === 'yes' || actStr === 'positive';

                let classificationType = 'TN';
                if (isPredPositive && isActPositive) classificationType = 'TP';
                else if (isPredPositive && !isActPositive) classificationType = 'FP';
                else if (!isPredPositive && isActPositive) classificationType = 'FN';
                else classificationType = 'TN';

                const prob = pred.probability != null ? pred.probability : (isPredPositive ? 0.8 : 0.2);
                const yVal = isActPositive ? 1.0 : 0.0;
                const brierComponent = Math.pow(prob - yVal, 2);

                evalResult = {
                    isCorrect,
                    classificationType,
                    brierComponent: +brierComponent.toFixed(4),
                    prediction: pred.prediction,
                    actual: actualOutcome
                };
            } else {
                const predNum = Number(pred.prediction) || 0;
                const actNum = Number(actualOutcome) || 0;
                const error = +(actNum - predNum).toFixed(4);
                const absError = +(Math.abs(error)).toFixed(4);
                const sqError = +(error * error).toFixed(4);
                const pctError = actNum !== 0 ? +((absError / Math.abs(actNum)) * 100).toFixed(2) : 0;

                evalResult = {
                    error,
                    absError,
                    sqError,
                    pctError,
                    prediction: predNum,
                    actual: actNum
                };
            }

            pred.status = 'REALIZED';
            pred.actualOutcome = actualOutcome;
            pred.realizedAt = new Date().toISOString();
            pred.evaluation = evalResult;

            _outcomeStore.push({
                outcomeId: `OUT-${String(_outcomeStore.length + 1).padStart(4, '0')}`,
                predictionId,
                modelName: pred.modelName,
                taskType: pred.taskType,
                evaluation: evalResult,
                context,
                timestamp: pred.realizedAt
            });

            return {
                predictionId,
                status: 'EVALUATED',
                evaluation: evalResult
            };
        },

        /**
         * Get live health status and realized metrics for a model
         * 
         * @param {Object} params
         * @param {string} params.modelName
         * @param {Object} [params.validationMetrics] - Baseline validation metrics from training
         * @returns {Object} Live Model Health Report
         */
        getModelHealth({ modelName = null, validationMetrics = {} } = {}) {
            const evaluated = _predictionStore.filter(p => {
                if (p.status !== 'REALIZED' || !p.evaluation) return false;
                if (modelName && p.modelName !== modelName) return false;
                return true;
            });

            if (evaluated.length === 0) {
                return {
                    status: 'INSUFFICIENT_OUTCOMES',
                    modelName: modelName || 'All Models',
                    totalEvaluated: 0,
                    healthStatus: 'HEALTHY',
                    realizedMetrics: {},
                    validationMetrics,
                    degradationPct: 0,
                    retrainingTriggered: false,
                    recommendation: 'Accumulate realized outcomes to calibrate ongoing operational accuracy.'
                };
            }

            const isClass = evaluated[0].taskType === 'classification';
            let realizedMetrics = {};
            let degradationPct = 0;
            let healthStatus = 'HEALTHY';
            let retrainingTriggered = false;

            if (isClass) {
                const total = evaluated.length;
                const tp = evaluated.filter(e => e.evaluation.classificationType === 'TP').length;
                const fp = evaluated.filter(e => e.evaluation.classificationType === 'FP').length;
                const tn = evaluated.filter(e => e.evaluation.classificationType === 'TN').length;
                const fn = evaluated.filter(e => e.evaluation.classificationType === 'FN').length;
                const correct = evaluated.filter(e => e.evaluation.isCorrect).length;

                const accuracy = +(correct / total).toFixed(4);
                const precision = (tp + fp) > 0 ? +(tp / (tp + fp)).toFixed(4) : 1.0;
                const recall = (tp + fn) > 0 ? +(tp / (tp + fn)).toFixed(4) : 1.0;
                const f1 = (precision + recall) > 0 ? +((2 * precision * recall) / (precision + recall)).toFixed(4) : 0;
                const avgBrier = +(evaluated.reduce((acc, e) => acc + (e.evaluation.brierComponent || 0), 0) / total).toFixed(4);

                realizedMetrics = {
                    total,
                    confusionMatrix: { TP: tp, FP: fp, TN: tn, FN: fn },
                    accuracy,
                    precision,
                    recall,
                    f1,
                    brierScore: avgBrier
                };

                const valAcc = validationMetrics.accuracy || validationMetrics.macroF1 || 0.85;
                if (valAcc > 0 && accuracy < valAcc) {
                    degradationPct = +(((valAcc - accuracy) / valAcc) * 100).toFixed(1);
                }
            } else {
                const total = evaluated.length;
                const sumAbsErr = evaluated.reduce((acc, e) => acc + (e.evaluation.absError || 0), 0);
                const sumSqErr = evaluated.reduce((acc, e) => acc + (e.evaluation.sqError || 0), 0);
                const mae = +(sumAbsErr / total).toFixed(4);
                const rmse = +(Math.sqrt(sumSqErr / total)).toFixed(4);
                const mape = +(evaluated.reduce((acc, e) => acc + (e.evaluation.pctError || 0), 0) / total).toFixed(2);

                realizedMetrics = {
                    total,
                    mae,
                    rmse,
                    mape
                };

                const valMae = validationMetrics.mae || 1.0;
                if (valMae > 0 && mae > valMae) {
                    degradationPct = +(((mae - valMae) / valMae) * 100).toFixed(1);
                }
            }

            // Health Status Determination
            if (degradationPct > 25 || (evaluated.length >= 5 && degradationPct > 20)) {
                healthStatus = 'DEGRADED';
                retrainingTriggered = true;
            } else if (degradationPct > 10 || (evaluated.length >= 3 && degradationPct > 5)) {
                healthStatus = 'WARNING';
            }

            let recommendation = 'Model operating within normal empirical performance boundaries.';
            if (healthStatus === 'DEGRADED') {
                recommendation = `CRITICAL: Model performance degraded by ${degradationPct}% against baseline validation metrics. Retraining trigger signaled.`;
            } else if (healthStatus === 'WARNING') {
                recommendation = `ADVISORY: Realized error rate is elevated (${degradationPct}% degradation). Monitor incoming observations closely.`;
            }

            return {
                status: 'COMPLETED',
                modelName: modelName || evaluated[0].modelName,
                totalEvaluated: evaluated.length,
                healthStatus,
                realizedMetrics,
                validationMetrics,
                degradationPct,
                retrainingTriggered,
                recommendation,
                timestamp: new Date().toISOString()
            };
        },

        /**
         * Get list of all logged predictions
         */
        getAllPredictions() {
            return [..._predictionStore];
        },

        /**
         * Get list of all realized outcomes
         */
        getAllOutcomes() {
            return [..._outcomeStore];
        },

        /**
         * Clear stores (for unit testing and reset)
         */
        clear() {
            _predictionStore.length = 0;
            _outcomeStore.length = 0;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.OutcomeTracker = OutcomeTracker;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = OutcomeTracker;
    }
})(typeof window !== 'undefined' ? window : global);
