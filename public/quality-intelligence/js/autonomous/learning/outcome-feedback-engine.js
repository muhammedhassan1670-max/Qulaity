/**
 * UDIP Outcome Feedback Engine
 * 
 * Closes the loop from prediction and recommendation to real-world empirical outcome:
 * Predict -> Recommend -> Act -> Measure -> Compare -> Learn
 * 
 * @module OutcomeFeedbackEngine
 */

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.OutcomeFeedbackEngine = factory();
        root.UDIPFeedbackEngine = root.OutcomeFeedbackEngine;
    }
}(typeof self !== 'undefined' ? self : this, function() {
    'use strict';

    class OutcomeFeedbackEngine {
        constructor() {
            this.interventions = [];
        }

        /**
         * Record an empirical intervention action
         * @param {Object} entry
         * @returns {Object} Processed intervention record with computed effect metrics
         */
        recordIntervention(entry = {}) {
            const before = Number(entry.beforeMetric);
            const after = Number(entry.afterMetric);
            const higherIsBetter = entry.higherIsBetter === true;

            const hasMetrics = !isNaN(before) && !isNaN(after);
            let deltaAbsolute = null;
            let deltaPercent = null;
            let isSuccessful = null;

            if (hasMetrics) {
                deltaAbsolute = Math.round((after - before) * 1000) / 1000;
                deltaPercent = before !== 0 ? Math.round(((after - before) / Math.abs(before)) * 10000) / 100 : 0;
                isSuccessful = higherIsBetter ? after > before : after < before;
            }

            const record = {
                id: entry.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                recommendationId: entry.recommendationId || null,
                actionTaken: entry.actionTaken || 'Operational adjustment',
                operator: entry.operator || 'Analyst',
                metricName: entry.metricName || 'Primary KPI',
                timestamp: entry.timestamp || new Date().toISOString(),
                beforeMetric: hasMetrics ? before : null,
                afterMetric: hasMetrics ? after : null,
                deltaAbsolute,
                deltaPercent,
                isSuccessful,
                notes: entry.notes || '',
                confidenceBoost: isSuccessful ? 0.05 : -0.05
            };

            this.interventions.push(record);
            return record;
        }

        /**
         * Analyze historical interventions and calculate empirical learning metrics
         * @returns {Object} Empirical efficacy report
         */
        analyzeLearningLoop() {
            const total = this.interventions.length;
            if (total === 0) {
                return {
                    totalInterventions: 0,
                    successRate: 0,
                    averageDeltaPercent: 0,
                    status: 'AWAITING_OUTCOMES',
                    insights: ['No closed-loop actions recorded yet. Track interventions to measure empirical recommendation impact.']
                };
            }

            const evaluated = this.interventions.filter(i => i.isSuccessful !== null);
            const successful = evaluated.filter(i => i.isSuccessful).length;
            const successRate = evaluated.length > 0 ? Math.round((successful / evaluated.length) * 100) : 0;
            const avgDelta = evaluated.length > 0 ? Math.round((evaluated.reduce((acc, i) => acc + (i.deltaPercent || 0), 0) / evaluated.length) * 100) / 100 : 0;

            return {
                totalInterventions: total,
                evaluatedInterventions: evaluated.length,
                successfulInterventions: successful,
                successRate: `${successRate}%`,
                averageDeltaPercent: `${avgDelta > 0 ? '+' : ''}${avgDelta}%`,
                status: successRate >= 70 ? 'HIGH_EFFICACY' : (successRate >= 40 ? 'MODERATE_EFFICACY' : 'UNDER_CALIBRATION'),
                insights: [
                    `Recorded ${total} operational interventions with ${successRate}% validated success rate.`,
                    `Average empirical metric shift observed: ${avgDelta > 0 ? '+' : ''}${avgDelta}%.`
                ],
                recentActions: this.interventions.slice(-5)
            };
        }

        /**
         * Reset or import existing interventions
         * @param {Array<Object>} list
         */
        setInterventions(list) {
            this.interventions = Array.isArray(list) ? list.slice() : [];
        }

        /**
         * Export all intervention logs
         * @returns {Array<Object>}
         */
        getInterventions() {
            return this.interventions;
        }
    }

    return OutcomeFeedbackEngine;
}));
