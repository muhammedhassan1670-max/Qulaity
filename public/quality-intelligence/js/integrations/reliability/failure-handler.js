/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/reliability/failure-handler.js
 * ============================================================================
 * Structured error classification and credential redaction.
 * Invariant: Never expose passwords, API keys, bearer tokens, or connection
 * credentials in error messages, stack traces, or logs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ERROR_TYPES = Object.freeze({
        TRANSIENT: 'TRANSIENT',
        RATE_LIMITED: 'RATE_LIMITED',
        AUTHENTICATION: 'AUTHENTICATION',
        AUTHORIZATION: 'AUTHORIZATION',
        VALIDATION: 'VALIDATION',
        SCHEMA: 'SCHEMA',
        NETWORK: 'NETWORK',
        SERVER: 'SERVER',
        UNKNOWN: 'UNKNOWN'
    });

    const SENSITIVE_PATTERNS = [
        /(password|passwd|pwd)\s*[:=]\s*['"]?[^'",;\s]+['"]?/gi,
        /(bearer\s+)[a-zA-Z0-9_\-\.]{10,}/gi,
        /(api[_\-]?key\s*[:=]\s*['"]?)[^'",;\s]+['"]?/gi,
        /(secret\s*[:=]\s*['"]?)[^'",;\s]+['"]?/gi,
        /(token\s*[:=]\s*['"]?)[^'",;\s]+['"]?/gi,
        /(postgres|mysql|mongodb|redis):\/\/[^:]+:[^@]+@/gi
    ];

    const FailureHandler = {
        ERROR_TYPES,

        /**
         * Redact sensitive credentials from any text, URL, or error string
         * @param {string} text
         * @returns {string}
         */
        sanitize(text) {
            if (!text || typeof text !== 'string') return '';
            let sanitized = text;
            SENSITIVE_PATTERNS.forEach(pat => {
                sanitized = sanitized.replace(pat, '$1[REDACTED_CREDENTIAL]');
            });
            return sanitized;
        },

        /**
         * Classify an error into an explicit, actionable error type
         * @param {Error|Object|string} err
         * @param {string} [stage='unknown']
         * @returns {Object} Structured error payload
         */
        classify(err, stage = 'unknown') {
            const rawMessage = typeof err === 'string' ? err : (err?.message || 'Unknown integration error');
            const sanitizedMsg = this.sanitize(rawMessage);
            const status = err?.status || err?.statusCode || 0;

            let type = ERROR_TYPES.UNKNOWN;
            let retryable = false;

            if (status === 429 || /429|too\s*many\s*requests|rate\s*limit/i.test(rawMessage)) {
                type = ERROR_TYPES.RATE_LIMITED;
                retryable = true;
            } else if (status === 401 || /unauthorized|unauthenticated|invalid\s*key|invalid\s*token/i.test(rawMessage)) {
                type = ERROR_TYPES.AUTHENTICATION;
                retryable = false;
            } else if (status === 403 || /forbidden|permission|access\s*denied/i.test(rawMessage)) {
                type = ERROR_TYPES.AUTHORIZATION;
                retryable = false;
            } else if (/schema|column\s*mismatch|type\s*incompatible/i.test(rawMessage)) {
                type = ERROR_TYPES.SCHEMA;
                retryable = false;
            } else if (/validation|malformed|corrupted|empty\s*payload/i.test(rawMessage)) {
                type = ERROR_TYPES.VALIDATION;
                retryable = false;
            } else if (status >= 500 && status < 600) {
                type = ERROR_TYPES.SERVER;
                retryable = true;
            } else if (/timeout|timed?out|timed\s*out|etimedout|econnreset|econnrefused|enotfound|network|fetch\s*failed/i.test(rawMessage)) {
                type = ERROR_TYPES.NETWORK;
                retryable = true;
            } else if (/temporary|busy|locked|deadlock/i.test(rawMessage)) {
                type = ERROR_TYPES.TRANSIENT;
                retryable = true;
            }

            const errorObj = {
                code: err?.code || 'INT_ERR_' + type,
                type,
                category: type,
                message: sanitizedMsg,
                retryable,
                isRetryable: retryable,
                stage,
                timestamp: new Date().toISOString()
            };

            return {
                success: false,
                type,
                category: type,
                retryable,
                isRetryable: retryable,
                error: errorObj
            };
        }
    };

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.FailureHandler = FailureHandler;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FailureHandler;
    }
})(typeof window !== 'undefined' ? window : global);
