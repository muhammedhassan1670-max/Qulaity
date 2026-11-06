/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/auth/auth-strategy.js
 * ============================================================================
 * Pluggable Authentication Strategies:
 * NONE | API_KEY | BEARER_TOKEN | OAUTH2 | BASIC_AUTH | DATABASE_CREDENTIAL | SUPABASE_AUTH
 * Invariant: Credential secrets are never persisted in plaintext LocalStorage.
 * Masking functions mask secrets before any logging or UI display.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const AUTH_TYPES = Object.freeze({
        NONE: 'NONE',
        API_KEY: 'API_KEY',
        BEARER_TOKEN: 'BEARER_TOKEN',
        OAUTH2: 'OAUTH2',
        BASIC_AUTH: 'BASIC_AUTH',
        DATABASE_CREDENTIAL: 'DATABASE_CREDENTIAL',
        SUPABASE_AUTH: 'SUPABASE_AUTH'
    });

    const AuthStrategy = {
        AUTH_TYPES,

        /**
         * Mask a sensitive secret string for safe display
         * @param {string} secret
         * @returns {string}
         */
        maskSecret(secret) {
            if (!secret || typeof secret !== 'string') return '';
            if (secret.length <= 8) return '****';
            const start = secret.slice(0, 4);
            const end = secret.slice(-4);
            return `${start}****${end}`;
        },

        /**
         * Redact all sensitive fields in a configuration object
         * @param {Object} config
         * @returns {Object} Deep-cloned object with masked secrets
         */
        redactConfig(config = {}) {
            if (!config || typeof config !== 'object') return {};
            const copy = JSON.parse(JSON.stringify(config));
            const sensitiveKeys = ['password', 'passwd', 'pwd', 'apiKey', 'api_key', 'token', 'secret', 'bearerToken', 'clientSecret'];

            function walk(obj) {
                if (!obj || typeof obj !== 'object') return;
                for (const [k, v] of Object.entries(obj)) {
                    if (sensitiveKeys.includes(k) && typeof v === 'string') {
                        obj[k] = AuthStrategy.maskSecret(v);
                    } else if (typeof v === 'object') {
                        walk(v);
                    }
                }
            }
            walk(copy);
            return copy;
        },

        /**
         * Apply authentication headers to an HTTP request options object
         * @param {string} authType
         * @param {Object} credentials
         * @param {Object} headers
         * @returns {Object} Headers with authentication applied
         */
        applyAuth(authType, credentials = {}, headers = {}) {
            const outHeaders = { ...headers };
            const type = String(authType).toUpperCase().trim();

            switch (type) {
                case AUTH_TYPES.API_KEY:
                    if (credentials.headerName && credentials.apiKey) {
                        outHeaders[credentials.headerName] = credentials.apiKey;
                    } else if (credentials.apiKey) {
                        outHeaders['X-API-Key'] = credentials.apiKey;
                    }
                    break;

                case AUTH_TYPES.BEARER_TOKEN:
                case AUTH_TYPES.OAUTH2:
                case AUTH_TYPES.SUPABASE_AUTH:
                    if (credentials.token) {
                        outHeaders['Authorization'] = `Bearer ${credentials.token}`;
                    }
                    if (type === AUTH_TYPES.SUPABASE_AUTH && credentials.apiKey) {
                        outHeaders['apikey'] = credentials.apiKey;
                    }
                    break;

                case AUTH_TYPES.BASIC_AUTH:
                    if (credentials.username && credentials.password) {
                        const b64 = typeof btoa === 'function' 
                            ? btoa(`${credentials.username}:${credentials.password}`)
                            : Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
                        outHeaders['Authorization'] = `Basic ${b64}`;
                    }
                    break;

                case AUTH_TYPES.NONE:
                default:
                    break;
            }

            return outHeaders;
        }
    };

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.AuthStrategy = AuthStrategy;
    window.UDIP.Integrations.AUTH_TYPES = AUTH_TYPES;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AuthStrategy;
    }
})(typeof window !== 'undefined' ? window : global);
