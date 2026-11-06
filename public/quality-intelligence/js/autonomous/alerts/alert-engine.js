/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/alerts/alert-engine.js
 * ============================================================================
 * Generates structured, prioritized notifications for critical systemic events:
 * - Major schema changes & breaking column removals
 * - Severe data quality deterioration
 * - Input feature distribution drift
 * - Candidate concept drift & performance degradation
 * - Model trust score deterioration
 * - Insight invalidations
 * ============================================================================
 */

(function (window) {
    'use strict';

    let _alertSeq = 0;
    function nextAlertId() {
        _alertSeq++;
        return `ALT-${String(_alertSeq).padStart(3, '0')}`;
    }

    const AlertEngine = {
        /**
         * Generate raw alerts across intelligence subsystems
         * 
         * @param {Object} params
         * @param {Object} params.schemaMonitoring
         * @param {Object} params.qualityMonitoring
         * @param {Object} params.driftAnalysis
         * @param {Array<Object>} params.triggers
         * @param {Array<Object>} params.evolutions
         * @param {Object} params.modelComparison
         * @returns {Array<Object>} List of structured alerts
         */
        generate({
            schemaMonitoring = {},
            qualityMonitoring = {},
            driftAnalysis = {},
            triggers = [],
            evolutions = [],
            modelComparison = {}
        } = {}) {
            const alerts = [];

            // 1. Schema Change Alerts
            if (schemaMonitoring?.removedColumns?.length > 0) {
                alerts.push({
                    id: nextAlertId(),
                    type: 'SCHEMA_BREAKING_CHANGE',
                    title: 'Columns Removed from Dataset Schema',
                    severity: 'critical',
                    priority: 'critical',
                    message: `${schemaMonitoring.removedColumns.length} column(s) previously modeled are missing in current version.`,
                    evidence: `Missing: ${schemaMonitoring.removedColumns.map(c => c.column).join(', ')}.`,
                    affectedItems: schemaMonitoring.removedColumns.map(c => c.column),
                    recommendedAction: 'Verify data extraction pipeline or update feature dictionary before retraining.',
                    confidence: 100
                });
            }

            if (schemaMonitoring?.typeChanges?.length > 0) {
                alerts.push({
                    id: nextAlertId(),
                    type: 'SCHEMA_TYPE_CHANGE',
                    title: 'Column Data Type Changed',
                    severity: 'high',
                    priority: 'high',
                    message: `Data types changed for ${schemaMonitoring.typeChanges.length} column(s).`,
                    evidence: schemaMonitoring.typeChanges.map(tc => `${tc.column}: ${tc.previousType} -> ${tc.currentType}`).join('; '),
                    affectedItems: schemaMonitoring.typeChanges.map(tc => tc.column),
                    recommendedAction: 'Verify type coercion and downstream pipeline transformation compatibility.',
                    confidence: 95
                });
            }

            // 2. Data Quality Alerts
            const qualDelta = qualityMonitoring?.scoreDelta || 0;
            if (qualDelta <= -10) {
                const isCrit = qualDelta <= -20;
                alerts.push({
                    id: nextAlertId(),
                    type: 'QUALITY_DEGRADATION',
                    title: isCrit ? 'Critical Data Quality Plunge' : 'Substantial Data Quality Decline',
                    severity: isCrit ? 'critical' : 'high',
                    priority: isCrit ? 'critical' : 'high',
                    message: `Data quality score dropped by ${Math.abs(qualDelta)} points (${qualityMonitoring.previousScore} -> ${qualityMonitoring.currentScore}).`,
                    evidence: (qualityMonitoring.degradedMetrics || []).map(m => m.interpretation).join('; '),
                    affectedItems: (qualityMonitoring.degradedMetrics || []).map(m => m.metric),
                    recommendedAction: 'Conduct immediate data hygiene audit before relying on downstream statistical inference.',
                    confidence: 95
                });
            }

            // 3. Distribution Drift Alerts (Individual feature alerts generated for prioritizer to group)
            const dd = driftAnalysis?.dataDrift || {};
            if (dd.detected && Array.isArray(dd.affectedColumns)) {
                dd.affectedColumns.forEach(col => {
                    alerts.push({
                        id: nextAlertId(),
                        type: 'DISTRIBUTION_DRIFT',
                        title: `Distribution Shift in "${col}"`,
                        severity: dd.severity === 'critical' ? 'critical' : 'medium',
                        priority: dd.severity === 'critical' ? 'high' : 'medium',
                        message: `Observed value distribution of feature "${col}" significantly diverged from baseline.`,
                        evidence: `Standardized shift exceeded significance threshold in "${col}".`,
                        affectedItems: [col],
                        recommendedAction: `Inspect "${col}" value bounds and histogram for empirical shift.`,
                        confidence: 85
                    });
                });
            }

            // 4. Concept Drift Candidate Alert
            const cd = driftAnalysis?.conceptDrift || {};
            if (cd.detected) {
                alerts.push({
                    id: nextAlertId(),
                    type: 'CONCEPT_DRIFT_CANDIDATE',
                    title: 'Candidate Concept Drift Detected',
                    severity: 'critical',
                    priority: 'critical',
                    message: 'Statistical associations between input variables and target have materially inverted or weakened.',
                    evidence: cd.evidence,
                    affectedItems: (cd.correlationShifts || []).map(cs => cs.pair),
                    recommendedAction: 'Retrain and evaluate model candidate algorithms on recent validation data.',
                    confidence: 85
                });
            }

            // 5. Model Performance Degradation Alert
            const pd = driftAnalysis?.performanceDrift || {};
            if (pd.detected) {
                alerts.push({
                    id: nextAlertId(),
                    type: 'MODEL_PERFORMANCE_DROP',
                    title: 'Model Validation Performance Deteriorated',
                    severity: pd.severity || 'high',
                    priority: 'high',
                    message: `Primary validation metric ${pd.primaryMetric} dropped by ${Math.abs(pd.delta)} points.`,
                    evidence: pd.evidence,
                    affectedItems: [pd.primaryMetric],
                    recommendedAction: 'Investigate feature importance shifts or rebuild model architecture.',
                    confidence: 90
                });
            }

            // 6. Insight Invalidation Alerts
            const invalidInsights = evolutions.filter(e => e.status === 'INVALIDATED');
            if (invalidInsights.length > 0) {
                alerts.push({
                    id: nextAlertId(),
                    type: 'INSIGHT_INVALIDATED',
                    title: `${invalidInsights.length} Historical Insight(s) Invalidated`,
                    severity: 'medium',
                    priority: 'medium',
                    message: 'Previous analytical findings are no longer supported by current data.',
                    evidence: invalidInsights.map(i => `"${i.title}": ${i.whatChanged}`).join('; '),
                    affectedItems: invalidInsights.map(i => i.insightId),
                    recommendedAction: 'Review invalidated insight cards and adjust operational assumptions.',
                    confidence: 80
                });
            }

            return alerts;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.AlertEngine = AlertEngine;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AlertEngine;
    }
})(typeof window !== 'undefined' ? window : global);
