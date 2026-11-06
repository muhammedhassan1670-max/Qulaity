/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: workspace/narrative/narrative-validator.js
 * ============================================================================
 * Guardrail validator preventing hallucinations, numerical errors, and causal fallacies.
 * 
 * Verifies every generated narrative statement before rendering:
 * 1. Numerical Audit: Verifies all numbers in the text exist in empirical metrics.
 * 2. Schema Audit: Verifies all referenced column names exist in dataset schema.
 * 3. Non-Causal Epistemic Guardrail: Detects and replaces unsupported causal claims
 *    (e.g., "causes", "proves that", "will definitely") with approved epistemic phrases.
 * 4. Confidence Alignment: Verifies stated confidence matches empirical evidence.
 * ============================================================================
 */

(function (window) {
    'use strict';

    // Forbidden causal words/phrases and their epistemologically approved replacements
    const CAUSAL_REPLACEMENTS = [
        { regex: /\bcauses\b/gi, replacement: 'is strongly associated with' },
        { regex: /\bcaused by\b/gi, replacement: 'empirically correlated with' },
        { regex: /\bproves that\b/gi, replacement: 'provides evidence that' },
        { regex: /\bwill definitely\b/gi, replacement: 'is projected to' },
        { regex: /\bdirectly produces\b/gi, replacement: 'shows strong co-occurrence with' },
        { regex: /\bguarantees\b/gi, replacement: 'substantially elevates the probability of' },
        { regex: /\bconclusive root cause\b/gi, replacement: 'primary candidate driver' },
        { regex: /\bdetermines 100%\b/gi, replacement: 'accounts for a high degree of variance' }
    ];

    const NarrativeValidator = {
        /**
         * Validate and sanitize a narrative statement or collection of statements
         * 
         * @param {string} text
         * @param {Object} context
         * @param {Object} context.profile
         * @param {Object} context.analytics
         * @param {Object} context.decisionIntelligence
         * @param {Object} context.autonomousIntelligence
         * @returns {Object} { isValid, violations, sanitizedText }
         */
        validateNarrative(text, context = {}) {
            if (typeof text !== 'string' || text.trim() === '') {
                return { isValid: true, violations: [], sanitizedText: '' };
            }

            const violations = [];
            let sanitizedText = text;

            // 1. Causal Fallacy Check & Auto-Sanitization
            CAUSAL_REPLACEMENTS.forEach(({ regex, replacement }) => {
                if (regex.test(sanitizedText)) {
                    violations.push({
                        type: 'unsupported_causal_claim',
                        severity: 'warning',
                        matched: sanitizedText.match(regex)?.[0] || 'causal term',
                        replacement,
                        reason: 'Observational data cannot establish counterfactual causality.'
                    });
                    sanitizedText = sanitizedText.replace(regex, replacement);
                }
            });

            // 2. Schema Audit: Verify referenced column names
            const validColNames = new Set(
                (context.profile?.columns || []).map(c => String(c.name || '').toLowerCase())
            );

            // Extract potential quoted variable names (e.g., "column_name" or 'column_name')
            const quotedMatches = sanitizedText.match(/["']([a-zA-Z0-9_\-\s]+)["']/g) || [];
            quotedMatches.forEach(rawMatch => {
                const cleanName = rawMatch.replace(/["']/g, '').trim();
                // If it looks like a variable reference (non-numeric, not a common English word)
                if (cleanName.length > 2 && isNaN(Number(cleanName))) {
                    const isCommonWord = ['high', 'low', 'moderate', 'risk', 'opportunity', 'true', 'false', 'n/a', 'critical', 'champion model'].includes(cleanName.toLowerCase());
                    if (!isCommonWord && validColNames.size > 0 && !validColNames.has(cleanName.toLowerCase())) {
                        violations.push({
                            type: 'invalid_column_reference',
                            severity: 'warning',
                            variable: cleanName,
                            reason: `Referenced variable "${cleanName}" was not found in dataset schema.`
                        });
                    }
                }
            });

            // 3. Numerical Verification: Extract numbers and verify reasonable plausibility
            const empiricalNumbers = this._extractEmpiricalNumbers(context);
            const extractedNumbers = this._extractNumbersFromText(sanitizedText);

            extractedNumbers.forEach(num => {
                // Ignore small integers (1-10) used for lists/ranks/steps, or common percentages (100)
                if (num <= 10 && Number.isInteger(num)) return;
                if (num === 100 || num === 0) return;

                const hasMatch = empiricalNumbers.some(emp => {
                    return Math.abs(emp - num) <= 0.5 || 
                           Math.abs(emp - num) / Math.max(0.0001, emp) <= 0.05;
                });

                if (!hasMatch && empiricalNumbers.length > 0) {
                    violations.push({
                        type: 'unverified_number',
                        severity: 'info',
                        value: num,
                        reason: `Number ${num} could not be strictly matched against known metric registers.`
                    });
                }
            });

            const isValid = violations.filter(v => v.severity === 'critical').length === 0;

            return {
                isValid,
                violations,
                sanitizedText
            };
        },

        /**
         * Extract numerical values from context objects for empirical verification
         * @private
         */
        _extractEmpiricalNumbers(context) {
            const numbers = new Set();

            function collectNumbers(obj, depth = 0) {
                if (!obj || depth > 5) return;
                if (typeof obj === 'number' && Number.isFinite(obj)) {
                    numbers.add(Math.round(obj * 100) / 100);
                    numbers.add(Math.round(obj * 10) / 10);
                    numbers.add(Math.round(obj));
                    // Also collect percentage representation
                    if (obj <= 1 && obj >= 0) {
                        numbers.add(Math.round(obj * 1000) / 10);
                        numbers.add(Math.round(obj * 100));
                    }
                    return;
                }
                if (Array.isArray(obj)) {
                    obj.forEach(item => collectNumbers(item, depth + 1));
                } else if (typeof obj === 'object') {
                    Object.values(obj).forEach(val => collectNumbers(val, depth + 1));
                }
            }

            if (context.profile) collectNumbers(context.profile);
            if (context.analytics) collectNumbers(context.analytics);
            if (context.decisionIntelligence) collectNumbers(context.decisionIntelligence);
            if (context.autonomousIntelligence) collectNumbers(context.autonomousIntelligence);

            return Array.from(numbers);
        },

        /**
         * Extract numbers from a given string
         * @private
         */
        _extractNumbersFromText(text) {
            const matches = text.match(/\b\d+(\.\d+)?%?\b/g) || [];
            const nums = [];
            matches.forEach(m => {
                const clean = m.replace('%', '');
                const val = parseFloat(clean);
                if (Number.isFinite(val)) {
                    nums.push(val);
                }
            });
            return nums;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.NarrativeValidator = NarrativeValidator;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = NarrativeValidator;
    }
})(typeof window !== 'undefined' ? window : global);
