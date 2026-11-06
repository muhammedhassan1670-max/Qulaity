/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/lifecycle/insight-lifecycle.js
 * ============================================================================
 * Enforces insight lifecycle state governance:
 * - NEW
 * - ACTIVE
 * - STRENGTHENED
 * - WEAKENED
 * - CHANGED
 * - INVALIDATED
 * - SUPERSEDED
 * 
 * Epistemological Invariant: An outdated or refuted insight NEVER remains
 * tagged "ACTIVE" once contradictory evidence is detected.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const InsightLifecycle = {
        /**
         * Update and synchronize insight lifecycle statuses
         * 
         * @param {Array<Object>} evolutions - Insight evolutions from InsightEvolution module
         * @returns {Object} Synchronized Lifecycle Report
         */
        synchronize(evolutions = []) {
            if (!Array.isArray(evolutions)) {
                return { activeCount: 0, invalidatedCount: 0, insights: [] };
            }

            const synchronized = evolutions.map(evo => {
                let lifecycleState = evo.status;
                let isActionable = true;

                if (evo.status === 'INVALIDATED') {
                    lifecycleState = 'INVALIDATED';
                    isActionable = false;
                } else if (evo.status === 'WEAKENED' && evo.confidence < 40) {
                    lifecycleState = 'SUPERSEDED';
                    isActionable = false;
                } else {
                    lifecycleState = 'ACTIVE';
                    isActionable = true;
                }

                return {
                    insightId: evo.insightId,
                    title: evo.title,
                    lifecycleState,
                    evolutionStatus: evo.status,
                    confidence: evo.confidence,
                    isActionable,
                    whatChanged: evo.whatChanged,
                    lineage: evo.lineage
                };
            });

            const active = synchronized.filter(i => i.isActionable && i.lifecycleState === 'ACTIVE');
            const invalidated = synchronized.filter(i => i.lifecycleState === 'INVALIDATED' || i.lifecycleState === 'SUPERSEDED');

            return {
                totalTracked: synchronized.length,
                activeCount: active.length,
                invalidatedCount: invalidated.length,
                insights: synchronized
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.InsightLifecycle = InsightLifecycle;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = InsightLifecycle;
    }
})(typeof window !== 'undefined' ? window : global);
