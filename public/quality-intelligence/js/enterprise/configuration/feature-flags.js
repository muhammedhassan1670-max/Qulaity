/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/configuration/feature-flags.js
 * ============================================================================
 * Centralized feature flag evaluation and toggle management.
 * Controls availability of enterprise and analytical capabilities.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DEFAULT_FLAGS = Object.freeze({
        COPILOT: true,
        AUTONOMOUS: true,
        BENCHMARK: true,
        ML: true,
        ADVANCED_ANALYTICS: true,
        ENTERPRISE_SEARCH: true,
        VERSIONING: true,
        GOVERNANCE: true,
        DATA_CLASSIFICATION: true,
        EXPORT_MANAGEMENT: true,
        MULTI_PROJECT: true,
        AUDIT_TRAIL: true
    });

    let _flags = { ...DEFAULT_FLAGS };

    const FeatureFlags = {
        /**
         * Check if a specific feature is enabled
         * @param {string} flag
         * @returns {boolean}
         */
        isEnabled(flag) {
            if (!flag) return false;
            const normalized = String(flag).toUpperCase().trim();
            return Boolean(_flags[normalized]);
        },

        /**
         * Set the state of a specific feature flag
         * @param {string} flag
         * @param {boolean} enabled
         */
        setFlag(flag, enabled) {
            if (!flag) return;
            const normalized = String(flag).toUpperCase().trim();
            _flags[normalized] = Boolean(enabled);
        },

        /**
         * Get a copy of all current feature flags
         * @returns {Object}
         */
        getAllFlags() {
            return { ..._flags };
        },

        /**
         * Set multiple flags at once
         * @param {Object} flagsObj
         */
        setFlags(flagsObj) {
            if (!flagsObj || typeof flagsObj !== 'object') return;
            Object.keys(flagsObj).forEach(k => {
                const normalized = k.toUpperCase().trim();
                _flags[normalized] = Boolean(flagsObj[k]);
            });
        },

        /**
         * Reset all flags to their default active state
         */
        resetFlags() {
            _flags = { ...DEFAULT_FLAGS };
        }
    };

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.FeatureFlags = FeatureFlags;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FeatureFlags;
    }
})(typeof window !== 'undefined' ? window : global);
