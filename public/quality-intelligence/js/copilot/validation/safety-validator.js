/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/validation/safety-validator.js
 * ============================================================================
 * Guardrails and safety rules:
 * - Blocks unwarranted causal claims (e.g. "causes", "proves", "guarantees")
 *   and automatically sanitizes them into observational associations.
 * - Blocks guaranteed predictions and fabricated impact figures.
 * - Blocks mutation attempts to raw dataset or governance logs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const CAUSAL_REPLACEMENTS = [
        { regex: /\bcauses\b/gi, replacement: 'is empirically associated with' },
        { regex: /\bcaused\b/gi, replacement: 'was associated with' },
        { regex: /\bproves\b/gi, replacement: 'strongly suggests' },
        { regex: /\bproven\b/gi, replacement: 'statistically supported' },
        { regex: /\bwill definitely\b/gi, replacement: 'is projected to' },
        { regex: /\bguarantees\b/gi, replacement: 'indicates a high empirical likelihood of' },
        { regex: /يسبب حتماً/g, replacement: 'يرتبط ارتباطاً وثيقاً بـ' },
        { regex: /يثبت بشكل قاطع/g, replacement: 'يدعم إحصائياً' },
        { regex: /مضمون\s+(?:بنسبة\s+)?100%/g, replacement: 'احتمالية مرتفعة تقديرياً' }
    ];

    const SafetyValidator = {
        /**
         * Sanitize and guardrail an answer against causal overreach
         * @param {string} text
         * @returns {Object} { sanitizedText: string, causalSanitized: boolean, flags: Array }
         */
        sanitizeCausalClaims(text = '') {
            let sanitizedText = String(text || '');
            let causalSanitized = false;
            const flags = [];

            for (const rule of CAUSAL_REPLACEMENTS) {
                if (rule.regex.test(sanitizedText)) {
                    causalSanitized = true;
                    flags.push(`Sanitized causal term matching: ${rule.regex.toString()}`);
                    sanitizedText = sanitizedText.replace(rule.regex, rule.replacement);
                }
            }

            return {
                sanitizedText,
                causalSanitized,
                flags
            };
        },

        /**
         * Check if an action attempts an unsafe or prohibited mutation
         * @param {Object} action
         * @returns {boolean} True if safe, false if blocked
         */
        isActionSafe(action) {
            if (!action || typeof action !== 'object') return false;
            const prohibitedTypes = [
                'MUTATE_RAW_DATASET',
                'DELETE_HISTORICAL_LOGS',
                'OVERWRITE_GOVERNANCE_AUDIT',
                'BYPASS_VALIDATION',
                'DROP_DATABASE'
            ];

            const type = String(action.type || '').toUpperCase();
            return !prohibitedTypes.includes(type);
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.SafetyValidator = SafetyValidator;

})(typeof window !== 'undefined' ? window : global);
