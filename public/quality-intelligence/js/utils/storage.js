/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: utils/storage.js
 * ============================================================================
 * Responsible for:
 * 1. Purging all legacy project localStorage keys on initialization
 * 2. Providing clean, isolated session storage without legacy contamination
 * ============================================================================
 */

(function (window) {
    'use strict';

    const STORAGE_PREFIX = 'udip_v1_';

    const LEGACY_KEYS = [
        'factory_qms_ml_engine_v1',
        'factory_master_db_overrides',
        'factory_quality_defects',
        'cachedFactoryData',
        'custom_master_defects',
        'factory_doe_factor_config',
        'factory_qms_ml_feedback',
        'factory_doe_selected_ids',
        'factory_doe_view_mode',
        'factory_doe_history'
    ];

    const StorageManager = {
        /**
         * Scan and purge all legacy keys and domain-specific artifacts
         */
        purgeLegacyStorage() {
            try {
                if (!window || !window.localStorage) return;
                const storage = window.localStorage;

                // 1. Remove known legacy keys
                LEGACY_KEYS.forEach(key => {
                    if (storage.getItem(key) !== null) {
                        storage.removeItem(key);
                        console.info(`[UDIP:Storage] Purged legacy key: ${key}`);
                    }
                });

                // 2. Scan for any keys starting with legacy prefixes
                const toRemove = [];
                for (let i = 0; i < storage.length; i++) {
                    const k = storage.key(i);
                    if (k && (k.startsWith('factory_') || k.startsWith('qie_') || k.startsWith('cooker_') || k.startsWith('master_db'))) {
                        toRemove.push(k);
                    }
                }
                toRemove.forEach(k => {
                    storage.removeItem(k);
                    console.info(`[UDIP:Storage] Purged legacy prefixed key: ${k}`);
                });

                // 3. Clear any legacy global objects from window
                if (window.MasterDB) delete window.MasterDB;
                if (window.QualityIntelligenceEngine) delete window.QualityIntelligenceEngine;
                if (window.QualityIntelligenceUI) delete window.QualityIntelligenceUI;
            } catch (err) {
                console.warn('[UDIP:Storage] Error during legacy purge:', err);
            }
        },

        set(key, value) {
            try {
                if (!window || !window.localStorage) return;
                window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
            } catch (e) {
                console.warn('[UDIP:Storage] Failed to save key:', key, e);
            }
        },

        get(key, defaultValue = null) {
            try {
                if (!window || !window.localStorage) return defaultValue;
                const item = window.localStorage.getItem(STORAGE_PREFIX + key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                return defaultValue;
            }
        },

        remove(key) {
            try {
                if (!window || !window.localStorage) return;
                window.localStorage.removeItem(STORAGE_PREFIX + key);
            } catch (e) {}
        },

        clearPlatformSession() {
            try {
                if (!window || !window.localStorage) return;
                const storage = window.localStorage;
                const toRemove = [];
                for (let i = 0; i < storage.length; i++) {
                    const k = storage.key(i);
                    if (k && k.startsWith(STORAGE_PREFIX)) {
                        toRemove.push(k);
                    }
                }
                toRemove.forEach(k => storage.removeItem(k));
            } catch (e) {}
        }
    };

    // Auto-run purge immediately on load
    StorageManager.purgeLegacyStorage();

    window.UDIP = window.UDIP || {};
    window.UDIP.StorageManager = StorageManager;

})(window);
