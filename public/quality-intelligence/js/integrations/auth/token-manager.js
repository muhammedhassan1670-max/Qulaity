/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/auth/token-manager.js
 * ============================================================================
 * In-Memory Token Manager.
 * Maintains volatile session tokens and tracks expiry deadlines.
 * Invariant: Never writes raw access tokens to persistent storage.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class TokenManager {
        constructor() {
            this._tokens = new Map(); // connectionId -> { token, expiresAt }
        }

        /**
         * Store an ephemeral token in volatile memory
         * @param {string} connectionId
         * @param {string} token
         * @param {number} [expiresInSeconds=3600]
         */
        setToken(connectionId, token, expiresInSeconds = 3600) {
            if (!connectionId || !token) return;
            const expiresAt = Date.now() + (expiresInSeconds * 1000);
            this._tokens.set(connectionId, {
                token,
                expiresAt
            });
        }

        /**
         * Retrieve active token or null if expired
         * @param {string} connectionId
         * @returns {string|null}
         */
        getToken(connectionId) {
            const entry = this._tokens.get(connectionId);
            if (!entry) return null;

            if (Date.now() >= entry.expiresAt) {
                this._tokens.delete(connectionId);
                return null;
            }

            return entry.token;
        }

        /**
         * Check if token is valid and not expired
         * @param {string} connectionId
         * @returns {boolean}
         */
        hasValidToken(connectionId) {
            return this.getToken(connectionId) !== null;
        }

        /**
         * Clear cached token
         * @param {string} connectionId
         */
        clearToken(connectionId) {
            this._tokens.delete(connectionId);
        }

        /**
         * Clear all tokens
         */
        clearAll() {
            this._tokens.clear();
        }
    }

    const defaultTokenManager = new TokenManager();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.TokenManager = TokenManager;
    window.UDIP.Integrations.defaultTokenManager = defaultTokenManager;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { TokenManager, defaultTokenManager };
    }
})(typeof window !== 'undefined' ? window : global);
