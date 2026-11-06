/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/intelligence/intelligence-trigger.js
 * ============================================================================
 * Evaluates detected changes, quality deltas, distribution shifts, and model
 * performance metrics to synthesize typed, priority-calibrated intelligence triggers:
 * - SCHEMA_CHANGE
 * - DATA_QUALITY_DEGRADATION
 * - DISTRIBUTION_DRIFT
 * - CONCEPT_DRIFT
 * - MODEL_PERFORMANCE_DEGRADATION
 * - NEW_PATTERN
 * - NEW_ANOMALY
 * - FORECAST_DEGRADATION
 * - TARGET_BEHAVIOR_CHANGE
 * - INSIGHT_INVALIDATION
 * ============================================================================
 */

(function (window) {
    'use strict';

    let _triggerSeq = 0;
    function nextTriggerId() {
        _triggerSeq++;
        return `TRG-${String(_triggerSeq).padStart(3, '0')}`;
    }

    const IntelligenceTrigger = {
        /**
         * Evaluate events across monitoring and drift subsystems
         * 
         * @param {Object} params
         * @param {Object} params.schemaMonitoring
         * @param {Object} params.qualityMonitoring
         * @param {Object} params.driftAnalysis
         * @param {Object} params.changePoints
         * @param {Object} params.currentAnalytics
         * @param {Object} params.previousAnalytics
         * @returns {Array<Object>} List of typed Intelligence Triggers
         */
        evaluate({
            schemaMonitoring = {},
            qualityMonitoring = {},
            driftAnalysis = {},
            changePoints = {},
            currentAnalytics = {},
            previousAnalytics = null
        } = {}) {
            const triggers = [];

            // 1. SCHEMA_CHANGE Trigger
            const schemaChanges = schemaMonitoring?.changes || [];
            if (schemaChanges.length > 0) {
                const hasBreaking = (schemaMonitoring.removedColumns?.length > 0) || (schemaMonitoring.typeChanges?.length > 0);
                triggers.push({
                    id: nextTriggerId(),
                    type: 'SCHEMA_CHANGE',
                    priority: hasBreaking ? 'critical' : 'medium',
                    reason: `Schema evolution detected: ${schemaChanges.length} structural modification(s).`,
                    evidence: schemaChanges.map(c => c.evidence || c.interpretation || c.column).slice(0, 3).join('; '),
                    recommendedAction: hasBreaking
                        ? 'Trigger full Profiling and Intelligence Planning update; verify pipeline feature compatibility.'
                        : 'Update schema dictionary and feature selection.'
                });
            }

            // 2. DATA_QUALITY_DEGRADATION Trigger
            const qualDelta = qualityMonitoring?.scoreDelta || 0;
            if (qualityMonitoring?.hasDegradation || qualDelta < -5) {
                const isSevere = qualDelta <= -15 || qualityMonitoring.severity === 'severe';
                triggers.push({
                    id: nextTriggerId(),
                    type: 'DATA_QUALITY_DEGRADATION',
                    priority: isSevere ? 'critical' : 'high',
                    reason: `Data quality deteriorated by ${Math.abs(qualDelta)} points (score: ${qualityMonitoring.currentScore}/100).`,
                    evidence: (qualityMonitoring.degradedMetrics || []).map(m => m.interpretation).join('; ') || `Score declined by ${Math.abs(qualDelta)} points.`,
                    recommendedAction: 'Execute data hygiene audit and inspect missingness/outlier influx before updating downstream models.'
                });
            }

            // 3. DISTRIBUTION_DRIFT Trigger
            const dataDrift = driftAnalysis?.dataDrift || {};
            if (dataDrift.detected) {
                const isMajor = dataDrift.severity === 'critical' || dataDrift.severity === 'major';
                triggers.push({
                    id: nextTriggerId(),
                    type: 'DISTRIBUTION_DRIFT',
                    priority: isMajor ? 'high' : 'medium',
                    reason: `Input feature distribution shift detected across ${dataDrift.shiftedColumnCount} variable(s).`,
                    evidence: dataDrift.evidence || `Distribution shift across: ${(dataDrift.affectedColumns || []).join(', ')}.`,
                    recommendedAction: 'Re-evaluate exploratory distributions, anomaly thresholds, and feature scaling boundaries.'
                });
            }

            // 4. CONCEPT_DRIFT Trigger
            const conceptDrift = driftAnalysis?.conceptDrift || {};
            if (conceptDrift.detected) {
                triggers.push({
                    id: nextTriggerId(),
                    type: 'CONCEPT_DRIFT',
                    priority: 'critical',
                    reason: 'Candidate concept drift: empirical feature-to-target associative structure has shifted.',
                    evidence: conceptDrift.evidence || 'Bivariate correlations or feature importance hierarchies diverged from baseline.',
                    recommendedAction: 'Trigger comprehensive re-analysis of statistical relationships, feature selection, and model retraining.'
                });
            }

            // 5. MODEL_PERFORMANCE_DEGRADATION Trigger
            const perfDrift = driftAnalysis?.performanceDrift || {};
            if (perfDrift.detected) {
                triggers.push({
                    id: nextTriggerId(),
                    type: 'MODEL_PERFORMANCE_DEGRADATION',
                    priority: 'high',
                    reason: `Model validation ${perfDrift.primaryMetric} degraded by ${Math.abs(perfDrift.delta)} points.`,
                    evidence: perfDrift.evidence,
                    recommendedAction: 'Re-benchmark candidate algorithm leaderboard and re-evaluate hyperparameter tuning.'
                });
            }

            // 6. NEW_PATTERN / STRUCTURAL_CHANGE Trigger (Change-points)
            if (changePoints?.detected && (changePoints.points || []).length > 0) {
                triggers.push({
                    id: nextTriggerId(),
                    type: 'NEW_PATTERN',
                    priority: 'medium',
                    reason: `Structural change-point identified along temporal axis of "${changePoints.target}".`,
                    evidence: changePoints.summary?.firstChangePoint?.evidence || `Detected ${changePoints.points.length} structural level shifts.`,
                    recommendedAction: 'Segment historical data across change-point to evaluate pre-shift vs post-shift dynamics.'
                });
            }

            // 7. NEW_ANOMALY Trigger
            const anomalies = currentAnalytics?.anomalies || {};
            if (anomalies.totalAnomalies > 0 && (!previousAnalytics || (previousAnalytics.anomalies?.totalAnomalies || 0) === 0)) {
                triggers.push({
                    id: nextTriggerId(),
                    type: 'NEW_ANOMALY',
                    priority: 'medium',
                    reason: `High-confidence multivariate anomalies detected in dataset (${anomalies.totalAnomalies} records).`,
                    evidence: `Adaptive scoring flagged ${anomalies.totalAnomalies} anomalous records (${anomalies.anomalyRate}%).`,
                    recommendedAction: 'Inspect anomalous records in exploratory deep dive to isolate recording anomalies from genuine shifts.'
                });
            }

            // 8. TARGET_BEHAVIOR_CHANGE Trigger
            if (schemaMonitoring?.targetChanges?.length > 0) {
                triggers.push({
                    id: nextTriggerId(),
                    type: 'TARGET_BEHAVIOR_CHANGE',
                    priority: 'high',
                    reason: 'Primary predictive target suitability altered between dataset versions.',
                    evidence: schemaMonitoring.targetChanges.map(tc => tc.evidence).join('; '),
                    recommendedAction: 'Update Intelligence Plan and re-align predictive modeling objectives.'
                });
            }

            return triggers;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.IntelligenceTrigger = IntelligenceTrigger;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = IntelligenceTrigger;
    }
})(typeof window !== 'undefined' ? window : global);
