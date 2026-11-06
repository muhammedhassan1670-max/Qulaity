/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/intelligence/priority-engine.js
 * ============================================================================
 * Computes deterministic multi-factor priority scores [0–100] for detected
 * events, triggers, and anomalies:
 * 
 * Priority = f(Magnitude, Confidence, Quality Impact, Model Degradation, Affected Items)
 * 
 * Strictly preserves domain-agnostic integrity: avoids inventing unobserved
 * business impact, financial losses, or operational costs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const PriorityEngine = {
        /**
         * Prioritize and rank items requiring human or autonomous attention
         * 
         * @param {Object} params
         * @param {Array<Object>} params.triggers
         * @param {Object} params.changeDetection
         * @param {Object} params.qualityMonitoring
         * @param {Object} params.driftAnalysis
         * @returns {Array<Object>} Prioritized Attention Queue
         */
        rank({
            triggers = [],
            changeDetection = {},
            qualityMonitoring = {},
            driftAnalysis = {}
        } = {}) {
            const items = [];

            // 1. Prioritize Triggers
            triggers.forEach(trg => {
                let baseScore = 50;
                if (trg.priority === 'critical') baseScore = 85;
                else if (trg.priority === 'high') baseScore = 70;
                else if (trg.priority === 'medium') baseScore = 45;
                else baseScore = 25;

                // Adjust based on composite change score
                const changeBonus = Math.round((changeDetection?.score || 0) * 0.15);
                const finalScore = Math.min(100, Math.max(10, baseScore + changeBonus));

                let priorityTier = 'low';
                if (finalScore >= 80) priorityTier = 'critical';
                else if (finalScore >= 65) priorityTier = 'high';
                else if (finalScore >= 40) priorityTier = 'medium';

                items.push({
                    id: trg.id || `PRI-${items.length + 1}`,
                    title: trg.type.replace(/_/g, ' '),
                    category: 'trigger',
                    priorityScore: finalScore,
                    priority: priorityTier,
                    urgency: priorityTier === 'critical' ? 'immediate' : (priorityTier === 'high' ? 'elevated' : 'standard'),
                    rationale: trg.reason,
                    recommendedAction: trg.recommendedAction,
                    evidence: trg.evidence
                });
            });

            // 2. Prioritize Quality Degradation if severe
            const qualDelta = qualityMonitoring?.scoreDelta || 0;
            if (qualDelta < -10) {
                const qScore = Math.min(100, Math.max(50, Math.round(50 + Math.abs(qualDelta) * 2)));
                items.push({
                    id: `PRI-Q-${items.length + 1}`,
                    title: 'Severe Data Quality Decline',
                    category: 'data_health',
                    priorityScore: qScore,
                    priority: qScore >= 80 ? 'critical' : 'high',
                    urgency: 'immediate',
                    rationale: `Quality score dropped by ${Math.abs(qualDelta)} points across recent updates.`,
                    recommendedAction: 'Audit data ingestion pipeline for corrupted rows, missingness spikes, or schema mismatches.',
                    evidence: `Previous score: ${qualityMonitoring.previousScore}, Current: ${qualityMonitoring.currentScore}.`
                });
            }

            // 3. Prioritize Concept Drift
            const cd = driftAnalysis?.conceptDrift || {};
            if (cd.detected) {
                items.push({
                    id: `PRI-CD-${items.length + 1}`,
                    title: 'Empirical Concept Drift Candidate',
                    category: 'model_trust',
                    priorityScore: 90,
                    priority: 'critical',
                    urgency: 'immediate',
                    rationale: 'Underlying associative relationship between input features and primary target has materially shifted.',
                    recommendedAction: 'Suspend automated model predictions for high-stakes decisions until retrained and validated on recent partition.',
                    evidence: cd.evidence
                });
            }

            // Sort by priorityScore descending
            items.sort((a, b) => b.priorityScore - a.priorityScore);

            return items;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.PriorityEngine = PriorityEngine;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PriorityEngine;
    }
})(typeof window !== 'undefined' ? window : global);
