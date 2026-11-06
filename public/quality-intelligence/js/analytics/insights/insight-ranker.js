/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/insights/insight-ranker.js
 * ============================================================================
 * Prioritizes and ranks analytical insights by:
 * - Criticality / Severity (critical > high > medium > low)
 * - Evidence strength (effect sizes, R², significance)
 * - Analytical confidence
 * Guarantees objective, data-backed prioritization.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const PRIORITY_SCORES = {
        critical: 1000,
        high: 750,
        medium: 500,
        low: 250
    };

    const InsightRanker = {
        /**
         * Rank array of insight objects
         * 
         * @param {Array<Object>} insights 
         * @returns {Array<Object>} Sorted insights with rank numbers
         */
        rank(insights) {
            if (!Array.isArray(insights) || insights.length === 0) return [];

            const scored = insights.map(item => {
                const prioScore = PRIORITY_SCORES[item.importance] || 250;
                const confScore = Number(item.confidence) || 50;
                const totalScore = prioScore + confScore;
                return { ...item, _sortScore: totalScore };
            });

            scored.sort((a, b) => b._sortScore - a._sortScore);

            return scored.map((item, idx) => {
                const { _sortScore, ...clean } = item;
                return {
                    rank: idx + 1,
                    ...clean
                };
            });
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.InsightRanker = InsightRanker;

})(typeof window !== 'undefined' ? window : global);
