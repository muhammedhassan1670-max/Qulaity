/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/conversation/context-manager.js
 * ============================================================================
 * Manages conversational context bounding, session expiry, and ensures
 * that queries only access the minimum relevant contextual payload.
 * Wipes conversational state upon dataset reload to guarantee isolation.
 * ============================================================================
 */

(function (window) {
    'use strict';

    let _currentDatasetId = null;
    const MAX_CONTEXT_TURNS = 10;

    const ContextManager = {
        /**
         * Synchronize active dataset context
         * Automatically flushes state if dataset changed
         * @param {Object} dataset
         */
        syncDataset(dataset) {
            const dsId = dataset ? (dataset.id || dataset.filename) : null;
            if (dsId !== _currentDatasetId) {
                _currentDatasetId = dsId;
                // Dataset switched or cleared -> clear conversation memory & state
                if (window.UDIP && window.UDIP.Copilot) {
                    if (window.UDIP.Copilot.ConversationState) {
                        window.UDIP.Copilot.ConversationState.reset();
                    }
                    if (window.UDIP.Copilot.ConversationMemory) {
                        window.UDIP.Copilot.ConversationMemory.clear();
                    }
                }
            }
        },

        /**
         * Get pruned recent context suitable for answer generation
         * @param {number} [limit=5]
         * @returns {Array<Object>}
         */
        getRecentContext(limit = 5) {
            if (window.UDIP && window.UDIP.Copilot && window.UDIP.Copilot.ConversationMemory) {
                return window.UDIP.Copilot.ConversationMemory.getRecentTurns(Math.min(limit, MAX_CONTEXT_TURNS));
            }
            return [];
        },

        /**
         * Reset all context manually
         */
        resetContext() {
            if (window.UDIP && window.UDIP.Copilot) {
                if (window.UDIP.Copilot.ConversationState) {
                    window.UDIP.Copilot.ConversationState.reset();
                }
                if (window.UDIP.Copilot.ConversationMemory) {
                    window.UDIP.Copilot.ConversationMemory.clear();
                }
            }
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.ContextManager = ContextManager;

})(typeof window !== 'undefined' ? window : global);
