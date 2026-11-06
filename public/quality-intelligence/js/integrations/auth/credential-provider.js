/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/auth/credential-provider.js
 * ============================================================================
 * Ephemeral Session Credential Provider.
 * Stores runtime credentials (API keys, passwords, bearer tokens) in
 * volatile, session-only memory.
 * Invariant: Never allows plaintext credentials into persistent LocalStorage.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class CredentialProvider {
        constructor() {
            this._sessionCredentials = new Map(); // connectionId -> credentials object
        }

        /**
         * Store runtime credentials for a connection in session memory
         * @param {string} connectionId
         * @param {Object} credentials
         */
        setCredentials(connectionId, credentials = {}) {
            if (!connectionId) return;
            this._sessionCredentials.set(connectionId, { ...credentials });
        }

        /**
         * Retrieve runtime credentials for connection execution
         * @param {string} connectionId
         * @returns {Object|null}
         */
        getCredentials(connectionId) {
            const creds = this._sessionCredentials.get(connectionId);
            return creds ? { ...creds } : null;
        }

        /**
         * Check if credentials exist for connection
         * @param {string} connectionId
         * @returns {boolean}
         */
        hasCredentials(connectionId) {
            return this._sessionCredentials.has(connectionId);
        }

        /**
         * Clear credentials for a connection
         * @param {string} connectionId
         */
        clearCredentials(connectionId) {
            this._sessionCredentials.delete(connectionId);
        }

        /**
         * Clear all session credentials
         */
        clearAll() {
            this._sessionCredentials.clear();
        }

        /**
         * Reset helper for testing
         */
        reset() {
            this.clearAll();
        }
    }

    const defaultProvider = new CredentialProvider();
    defaultProvider.CredentialProvider = CredentialProvider;

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.CredentialProvider = defaultProvider;
    window.UDIP.Integrations.defaultCredentialProvider = defaultProvider;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = defaultProvider;
    }
})(typeof window !== 'undefined' ? window : global);
