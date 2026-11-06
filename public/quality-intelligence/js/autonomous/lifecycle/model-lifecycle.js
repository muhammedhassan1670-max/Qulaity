/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/lifecycle/model-lifecycle.js
 * ============================================================================
 * Manages the governance lifecycle states for trained predictive models:
 * - CANDIDATE       (Candidate algorithm evaluated on validation set)
 * - VALIDATED       (Passed out-of-sample holdout checks)
 * - ACTIVE          (Currently authoritative for inference and scenarios)
 * - DEGRADED        (Validation metrics or trust score plunged materially)
 * - STALE           (Underlying distributions or schema shifted substantially)
 * - REVIEW_REQUIRED (Evidence ambiguous or borderline stability)
 * - RETIRED         (Superseded or permanently non-viable)
 * 
 * Epistemological Rule: Never automatically deletes a model; preserves
 * full historical lineage.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ModelLifecycle = {
        /**
         * Evaluate and assign model lifecycle status
         * 
         * @param {Object} params
         * @param {Object} params.analytics
         * @param {Object} params.governance
         * @param {Object} params.driftAnalysis
         * @param {Object} params.previousModel
         * @returns {Object} Model Lifecycle Report
         */
        evaluate({
            analytics = {},
            governance = {},
            driftAnalysis = {},
            previousModel = null
        } = {}) {
            const ml = analytics?.machineLearning || {};
            const winner = ml.winner || null;

            if (!winner || !winner.model) {
                return {
                    status: 'NO_MODEL',
                    modelName: 'None',
                    lifecycleState: 'RETIRED',
                    previousState: null,
                    rationale: 'No predictive model trained or active in current analytical session.',
                    recommendation: 'Train candidate algorithms or ingest labeled supervised dataset.'
                };
            }

            const trustScore = governance?.trustScore != null ? governance.trustScore : 70;
            const hasConceptDrift = driftAnalysis?.conceptDrift?.detected || false;
            const hasDataDrift = driftAnalysis?.dataDrift?.detected || false;
            const hasPerfDrop = driftAnalysis?.performanceDrift?.detected || false;

            let lifecycleState = 'ACTIVE';
            let rationale = 'Model satisfies out-of-sample validation and stability benchmarks.';
            let recommendation = 'Maintain current model in active deployment for scenario simulation.';

            if (hasConceptDrift || (hasPerfDrop && trustScore < 50)) {
                lifecycleState = 'DEGRADED';
                rationale = 'Severe performance decline or candidate concept drift detected: predictions are unreliable.';
                recommendation = 'Deprecate model from automated decisioning; initiate retraining on updated training partition.';
            } else if (hasDataDrift || trustScore < 60) {
                lifecycleState = 'STALE';
                rationale = 'Input data distributions have drifted from training baseline, reducing confidence.';
                recommendation = 'Re-evaluate model sensitivity and calibrate predictions against fresh data.';
            } else if (governance?.validationQuality === 'limited_sample_holdout' || trustScore < 70) {
                lifecycleState = 'REVIEW_REQUIRED';
                rationale = 'Validation holdout size or dimensionality ratio requires human supervision.';
                recommendation = 'Audit out-of-sample errors before operational reliance.';
            } else if (winner.metrics?.n >= 10 && trustScore >= 70) {
                lifecycleState = 'ACTIVE';
                rationale = 'Model verified against holdout partition with robust trust score.';
                recommendation = 'Model active and approved for scenario simulations.';
            }

            return {
                modelName: winner.name || 'Primary Model',
                taskType: ml.taskType || 'unknown',
                lifecycleState,
                previousState: previousModel ? (previousModel.lifecycleState || 'ACTIVE') : 'CANDIDATE',
                trustScore,
                rationale,
                recommendation,
                timestamp: new Date().toISOString()
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.ModelLifecycle = ModelLifecycle;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ModelLifecycle;
    }
})(typeof window !== 'undefined' ? window : global);
