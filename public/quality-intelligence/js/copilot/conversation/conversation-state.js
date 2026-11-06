/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/conversation/conversation-state.js
 * ============================================================================
 * Maintains active conversational context and state across interactions:
 * Tracks active topic, selected column, model, finding, investigation,
 * and handles anaphora resolution for follow-up questions (e.g. "ليه؟").
 * ============================================================================
 */

(function (window) {
    'use strict';

    function createDefaultState() {
        return {
            sessionId: 'copilot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            currentTopic: null,
            selectedDatasetVersion: 'current',
            selectedFinding: null,
            selectedColumn: null,
            selectedModel: null,
            activeInvestigation: null,
            lastIntent: null,
            lastEvidence: [],
            pendingClarification: null,
            updatedAt: new Date().toISOString()
        };
    }

    let _state = createDefaultState();

    const ConversationState = {
        /**
         * Get current snapshot of conversation state
         */
        getState() {
            return { ..._state };
        },

        /**
         * Update state fields
         */
        update(partial = {}) {
            _state = {
                ..._state,
                ...partial,
                updatedAt: new Date().toISOString()
            };
            return _state;
        },

        /**
         * Set current selected entities from extracted entities
         */
        trackEntities(entities = []) {
            if (!Array.isArray(entities)) return;
            entities.forEach(e => {
                if (!e || !e.type) return;
                if (e.type === 'column') _state.selectedColumn = e.value;
                if (e.type === 'model') _state.selectedModel = e.value;
                if (e.type === 'finding') _state.selectedFinding = e.value;
                if (e.type === 'topic') _state.currentTopic = e.value;
            });
            _state.updatedAt = new Date().toISOString();
        },

        /**
         * Resolve implicit follow-up references (anaphora)
         * E.g. "ليه؟" or "why is that?" when user previously discussed a column or model
         */
        resolveImplicitEntity() {
            if (_state.selectedColumn) {
                return { type: 'column', value: _state.selectedColumn };
            }
            if (_state.selectedFinding) {
                return { type: 'finding', value: _state.selectedFinding };
            }
            if (_state.selectedModel) {
                return { type: 'model', value: _state.selectedModel };
            }
            return null;
        },

        /**
         * Set clarification request
         */
        setPendingClarification(clarification) {
            _state.pendingClarification = clarification;
        },

        /**
         * Clear clarification
         */
        clearPendingClarification() {
            _state.pendingClarification = null;
        },

        /**
         * Reset conversation state (e.g. on new dataset upload or explicit reset)
         */
        reset() {
            _state = createDefaultState();
            return _state;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.ConversationState = ConversationState;

})(typeof window !== 'undefined' ? window : global);
