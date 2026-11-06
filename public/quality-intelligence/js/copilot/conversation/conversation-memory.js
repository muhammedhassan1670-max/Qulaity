/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/conversation/conversation-memory.js
 * ============================================================================
 * In-memory store for analytical conversation turns.
 * Each turn preserves: Question, Intent, Evidence Used, Action, Answer,
 * Confidence, and Timestamp.
 * Does NOT store unnecessary sensitive personal data.
 * ============================================================================
 */

(function (window) {
    'use strict';

    let _turns = [];
    const MAX_TURNS = 100;

    const ConversationMemory = {
        /**
         * Add a new conversation turn
         * @param {Object} turn
         */
        addTurn({
            question = '',
            intent = '',
            evidenceUsed = [],
            actions = [],
            answer = '',
            confidence = 'High',
            entities = [],
            traceId = null
        } = {}) {
            const turnObj = {
                id: 'turn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                timestamp: new Date().toISOString(),
                question: String(question || ''),
                intent: String(intent || ''),
                evidenceUsed: Array.isArray(evidenceUsed) ? evidenceUsed.map(e => ({
                    metric: e.metric || e.title || '',
                    source: e.source || '',
                    value: e.value !== undefined ? e.value : null
                })) : [],
                actions: Array.isArray(actions) ? [...actions] : [],
                answer: String(answer || ''),
                confidence: String(confidence || 'Moderate'),
                entities: Array.isArray(entities) ? [...entities] : [],
                traceId: traceId || null
            };

            _turns.push(turnObj);
            if (_turns.length > MAX_TURNS) {
                _turns.shift();
            }

            return turnObj;
        },

        /**
         * Get the N most recent turns
         * @param {number} [limit=10]
         * @returns {Array<Object>}
         */
        getRecentTurns(limit = 10) {
            return _turns.slice(-limit);
        },

        /**
         * Search previous turns by keyword
         * @param {string} query
         * @returns {Array<Object>}
         */
        searchTurns(query) {
            if (!query) return [];
            const q = String(query).toLowerCase();
            return _turns.filter(t => 
                t.question.toLowerCase().includes(q) || 
                t.answer.toLowerCase().includes(q) ||
                t.intent.toLowerCase().includes(q)
            );
        },

        /**
         * Get turn count
         */
        getCount() {
            return _turns.length;
        },

        /**
         * Clear all turns (e.g. on dataset unload)
         */
        clear() {
            _turns = [];
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.ConversationMemory = ConversationMemory;

})(typeof window !== 'undefined' ? window : global);
