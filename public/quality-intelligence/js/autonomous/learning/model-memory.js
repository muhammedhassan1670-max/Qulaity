/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/learning/model-memory.js
 * ============================================================================
 * Manages chronological performance benchmarks, validation rigor records,
 * and trust history across trained machine learning models.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const _modelHistoryStore = [];

    const ModelMemory = {
        /**
         * Record a trained model snapshot in continuous memory
         * 
         * @param {Object} params
         * @param {Object} params.analytics
         * @param {Object} params.governance
         * @param {string} params.datasetFingerprint
         * @returns {Object|null} Recorded snapshot
         */
        record({
            analytics = {},
            governance = {},
            datasetFingerprint = 'fp_initial'
        } = {}) {
            const ml = analytics?.machineLearning || {};
            const winner = ml.winner || null;
            if (!winner || !winner.model) return null;

            const timestamp = new Date().toISOString();
            const modelId = `MDL-${_modelHistoryStore.length + 1}`;

            const record = {
                modelId,
                algorithm: winner.name || 'Primary Model',
                taskType: ml.taskType || 'unknown',
                target: ml.target || 'Target',
                features: ml.features || [],
                performance: winner.metrics || {},
                validation: {
                    rigor: governance.validationQuality || 'holdout',
                    n: winner.metrics?.n || 0
                },
                stability: governance.stability || 'moderate',
                trustScore: governance.trustScore != null ? governance.trustScore : 70,
                featureImportance: (ml.featureImportance || []).slice(0, 5),
                createdAt: timestamp,
                datasetFingerprint
            };

            _modelHistoryStore.push(record);
            return record;
        },

        /**
         * Compare latest model against historical benchmark
         */
        compareWithPrevious() {
            if (_modelHistoryStore.length < 2) {
                return {
                    status: 'baseline',
                    hasPrevious: false,
                    message: 'Model benchmark baseline established — no historical model record available.'
                };
            }

            const current = _modelHistoryStore[_modelHistoryStore.length - 1];
            const previous = _modelHistoryStore[_modelHistoryStore.length - 2];

            const isReg = current.taskType === 'regression';
            const currPerf = isReg ? (current.performance?.r2 ?? 0) : (current.performance?.accuracy ?? 0);
            const prevPerf = isReg ? (previous.performance?.r2 ?? 0) : (previous.performance?.accuracy ?? 0);
            const perfDelta = +(currPerf - prevPerf).toFixed(4);

            const trustDelta = current.trustScore - previous.trustScore;

            return {
                status: 'compared',
                hasPrevious: true,
                currentModelId: current.modelId,
                previousModelId: previous.modelId,
                algorithm: current.algorithm,
                performanceMetric: isReg ? 'R²' : 'Accuracy',
                previousPerformance: prevPerf,
                currentPerformance: currPerf,
                performanceDelta: perfDelta,
                previousTrust: previous.trustScore,
                currentTrust: current.trustScore,
                trustDelta,
                isDegraded: perfDelta <= -0.15 || trustDelta <= -15,
                message: perfDelta < 0
                    ? `Model performance declined by ${Math.abs(perfDelta)} points against previous version.`
                    : (perfDelta > 0 ? `Model performance improved by +${perfDelta} points.` : 'Model performance is consistent with previous benchmark.')
            };
        },

        /**
         * Return all historical model snapshots
         */
        getHistory() {
            return [..._modelHistoryStore];
        },

        /**
         * Reset store (for testing)
         */
        clear() {
            _modelHistoryStore.length = 0;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.ModelMemory = ModelMemory;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ModelMemory;
    }
})(typeof window !== 'undefined' ? window : global);
