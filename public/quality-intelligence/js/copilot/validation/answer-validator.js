/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/validation/answer-validator.js
 * ============================================================================
 * Factual verification of Copilot responses:
 * - Validates referenced column names against the active dataset schema
 * - Validates referenced model names against the ML leaderboard
 * - Verifies that numbers cited are tied to known empirical metrics
 * Flags or rejects answers containing fabricated entities.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const AnswerValidator = {
        /**
         * Validate an answer against active platform entities
         * @param {Object} params
         * @param {Object} params.response { answer, keyPoints, evidence }
         * @param {Object} params.platform
         * @returns {Object} { passed: boolean, flags: Array, verifiedEntities: Array }
         */
        validate({ response = {}, platform = {} } = {}) {
            const answer = String(response.answer || '');
            const keyPoints = Array.isArray(response.keyPoints) ? response.keyPoints.join(' ') : '';
            const fullText = (answer + ' ' + keyPoints).toLowerCase();

            const flags = [];
            const verifiedEntities = [];

            const dataset = platform.dataset;
            const profile = platform.profile;
            const analytics = platform.analytics;

            const knownCols = Array.isArray(dataset?.columns)
                ? dataset.columns
                : (profile?.columns?.map(c => c.name) || []);

            const knownModels = (analytics?.machineLearning?.leaderboard || analytics?.leaderboard || [])
                .map(m => (m.name || m.modelName || '').toLowerCase())
                .filter(Boolean);

            // 1. Column reference validation (if any specific column is cited in evidence)
            if (Array.isArray(response.evidence)) {
                response.evidence.forEach(ev => {
                    if (ev.column) {
                        const exists = knownCols.some(c => c.toLowerCase() === ev.column.toLowerCase());
                        if (exists) {
                            verifiedEntities.push({ type: 'column', value: ev.column });
                        } else {
                            flags.push(`Referenced column "${ev.column}" not found in dataset schema.`);
                        }
                    }
                    if (ev.model) {
                        const exists = knownModels.some(m => m.includes(ev.model.toLowerCase()) || ev.model.toLowerCase().includes(m));
                        if (exists) {
                            verifiedEntities.push({ type: 'model', value: ev.model });
                        } else {
                            flags.push(`Referenced model "${ev.model}" not found in ML leaderboard.`);
                        }
                    }
                });
            }

            // 2. Hallucination check for unsupported percentage claims without evidence
            const percentMatches = fullText.match(/\d+(?:\.\d+)?%/g);
            if (percentMatches && (!response.evidence || response.evidence.length === 0)) {
                flags.push('Quantitative percentage cited without supporting empirical evidence.');
            }

            const passed = flags.length === 0;

            return {
                passed,
                flags,
                verifiedEntities
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.AnswerValidator = AnswerValidator;

})(typeof window !== 'undefined' ? window : global);
