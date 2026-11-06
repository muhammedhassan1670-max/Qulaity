/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/learning/feedback-engine.js
 * ============================================================================
 * Records and processes human supervision feedback across insights,
 * recommendations, candidate drivers, and models.
 * 
 * Epistemological Rule: Human feedback is ingested and audited as empirical
 * evidence to calibrate future prioritization weights; it never silently
 * overwrites historical factual data.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const _feedbackStore = [];

    const FeedbackEngine = {
        /**
         * Record a human feedback item
         * 
         * @param {Object} params
         * @param {string} params.itemId - Target ID (e.g. INS-001, DEC-001, RC-001)
         * @param {string} params.targetType - 'insight' | 'decision' | 'root_cause' | 'model' | 'alert'
         * @param {string} params.feedbackType - 'accurate' | 'inaccurate' | 'useful' | 'unhelpful' | 'false_positive'
         * @param {number} params.value - Numeric weight (+1, -1, 0)
         * @param {string} params.comment - Optional qualitative rationale
         * @returns {Object} Stored feedback record
         */
        recordFeedback({
            itemId = '',
            targetType = 'insight',
            feedbackType = 'useful',
            value = 1,
            comment = ''
        } = {}) {
            if (!itemId) {
                throw new Error('[UDIP:FeedbackEngine] itemId is required to record feedback.');
            }

            const record = {
                id: `FB-${_feedbackStore.length + 1}`,
                itemId,
                targetType,
                feedbackType,
                value: Math.max(-1, Math.min(1, Number(value) || 0)),
                comment: String(comment || '').trim(),
                timestamp: new Date().toISOString()
            };

            _feedbackStore.push(record);
            return record;
        },

        /**
         * Get feedback history for a specific item
         */
        getFeedbackForItem(itemId) {
            return _feedbackStore.filter(f => f.itemId === itemId);
        },

        /**
         * Aggregate feedback summary
         */
        getSummary() {
            const total = _feedbackStore.length;
            const positive = _feedbackStore.filter(f => f.value > 0).length;
            const negative = _feedbackStore.filter(f => f.value < 0).length;
            const falsePositives = _feedbackStore.filter(f => f.feedbackType === 'false_positive').length;

            return {
                total,
                positive,
                negative,
                neutral: total - positive - negative,
                falsePositives,
                accuracyRate: total > 0 ? +((positive / total) * 100).toFixed(1) : 100
            };
        },

        /**
         * Get all feedback entries
         */
        getAll() {
            return [..._feedbackStore];
        },

        /**
         * Clear feedback store (for testing)
         */
        clear() {
            _feedbackStore.length = 0;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.FeedbackEngine = FeedbackEngine;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FeedbackEngine;
    }
})(typeof window !== 'undefined' ? window : global);
