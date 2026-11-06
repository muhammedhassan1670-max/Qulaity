/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/intelligence/reanalysis-planner.js
 * ============================================================================
 * Formulates the MINIMAL, targeted analytical re-execution pipeline.
 * 
 * Avoids blind, computationally expensive full reruns by dynamically routing
 * execution only through genuinely affected analytical and decision layers:
 * - Distribution-only shifts: Profiler → Distribution Analysis → Drift
 * - Concept drift: Relationship Analysis → Statistical Tests → ML Leaderboard → Decision Engine
 * - Temporal change: Trend → Seasonality → Change-Point → Forecasting → Decision Engine
 * - Quality degradation: Profiler → Planning Engine → Affected Analytics
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ALL_CAPABILITIES = [
        'profiling',
        'quality_audit',
        'intelligence_planning',
        'exploratory_distributions',
        'statistical_testing',
        'anomaly_detection',
        'time_series_forecasting',
        'machine_learning',
        'decision_intelligence',
        'model_governance'
    ];

    const ReanalysisPlanner = {
        /**
         * Formulate minimum required reanalysis pipeline
         * 
         * @param {Object} params
         * @param {Array<Object>} params.triggers
         * @param {Object} params.analysisPlan
         * @param {Object} params.currentProfile
         * @returns {Object} Targeted Reanalysis Plan
         */
        plan({
            triggers = [],
            analysisPlan = {},
            currentProfile = {}
        } = {}) {
            if (!Array.isArray(triggers) || triggers.length === 0) {
                return {
                    status: 'idle',
                    triggerCount: 0,
                    requiredModules: [],
                    skippedModules: [...ALL_CAPABILITIES],
                    estimatedPriority: 'low',
                    rationale: 'No triggers active; all existing analytical and decision artifacts remain valid.'
                };
            }

            const requiredSet = new Set();
            const rationales = [];

            // 1. Schema Change Trigger Routing
            if (triggers.some(t => t.type === 'SCHEMA_CHANGE')) {
                requiredSet.add('profiling');
                requiredSet.add('quality_audit');
                requiredSet.add('intelligence_planning');
                requiredSet.add('exploratory_distributions');
                requiredSet.add('machine_learning');
                requiredSet.add('decision_intelligence');
                requiredSet.add('model_governance');
                rationales.push('Schema changes mandate full profiling, plan regeneration, and model re-specification.');
            }

            // 2. Data Quality Degradation Routing
            if (triggers.some(t => t.type === 'DATA_QUALITY_DEGRADATION')) {
                requiredSet.add('quality_audit');
                requiredSet.add('profiling');
                requiredSet.add('intelligence_planning');
                rationales.push('Quality degradation requires refreshing hygiene metrics and verifying feature leakage/missingness rules.');
            }

            // 3. Distribution Drift Routing (Targeted: exploratory + drift, skip ML unless severe)
            if (triggers.some(t => t.type === 'DISTRIBUTION_DRIFT')) {
                requiredSet.add('exploratory_distributions');
                requiredSet.add('anomaly_detection');
                rationales.push('Distribution drift isolated to input features: refreshing distribution profiles and anomaly thresholds.');
            }

            // 4. Concept Drift or Performance Degradation Routing
            if (triggers.some(t => t.type === 'CONCEPT_DRIFT' || t.type === 'MODEL_PERFORMANCE_DEGRADATION')) {
                requiredSet.add('statistical_testing');
                requiredSet.add('machine_learning');
                requiredSet.add('decision_intelligence');
                requiredSet.add('model_governance');
                rationales.push('Concept/performance drift requires re-testing feature-target relationships and retraining candidate models.');
            }

            // 5. New Pattern / Change Point Routing
            if (triggers.some(t => t.type === 'NEW_PATTERN')) {
                requiredSet.add('time_series_forecasting');
                requiredSet.add('decision_intelligence');
                rationales.push('Temporal structural shift detected: recalibrating forecast horizon and scenario bounds.');
            }

            // 6. Target Behavior Change Routing
            if (triggers.some(t => t.type === 'TARGET_BEHAVIOR_CHANGE')) {
                requiredSet.add('intelligence_planning');
                requiredSet.add('statistical_testing');
                requiredSet.add('machine_learning');
                requiredSet.add('decision_intelligence');
                rationales.push('Predictive target re-alignment requires updating plan, relationship matrix, and model objectives.');
            }

            const requiredModules = Array.from(requiredSet);
            const skippedModules = ALL_CAPABILITIES.filter(m => !requiredSet.has(m));

            // Estimate execution priority
            let estimatedPriority = 'low';
            if (triggers.some(t => t.priority === 'critical')) estimatedPriority = 'critical';
            else if (triggers.some(t => t.priority === 'high')) estimatedPriority = 'high';
            else if (triggers.some(t => t.priority === 'medium')) estimatedPriority = 'medium';

            return {
                status: 'planned',
                triggerCount: triggers.length,
                requiredModules,
                skippedModules,
                estimatedPriority,
                rationale: rationales.join(' ') || 'Minimal targeted reanalysis plan formulated.',
                summary: `Executing ${requiredModules.length} module(s); bypassing ${skippedModules.length} unaffected module(s).`
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.ReanalysisPlanner = ReanalysisPlanner;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ReanalysisPlanner;
    }
})(typeof window !== 'undefined' ? window : global);
