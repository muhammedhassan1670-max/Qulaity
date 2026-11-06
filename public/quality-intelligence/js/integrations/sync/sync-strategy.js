/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/sync/sync-strategy.js
 * ============================================================================
 * Resolves synchronization strategy (FULL_REFRESH vs INCREMENTAL).
 * Handles automatic fallback when incremental sync is infeasible or unsafe.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const SYNC_MODES = Object.freeze({
        FULL_REFRESH: 'FULL_REFRESH',
        INCREMENTAL: 'INCREMENTAL'
    });

    const SyncStrategy = {
        SYNC_MODES,

        /**
         * Resolve the appropriate sync strategy given source, connector, and schema drift
         * @param {Object} source - Registered data source object
         * @param {Object} connector - BaseConnector instance
         * @param {Object} [driftResult] - Output from ChangeDetector.detectDrift()
         * @param {Object} [options]
         * @returns {{ strategy: string, fallbackReason: string|null, cursorConfig: Object }}
         */
        resolveStrategy(source = {}, connector = null, driftResult = null, options = {}) {
            const requestedMode = options.forceMode || source.syncMode || SYNC_MODES.FULL_REFRESH;

            // 1. If FULL_REFRESH was requested, execute FULL_REFRESH
            if (requestedMode === SYNC_MODES.FULL_REFRESH) {
                return {
                    strategy: SYNC_MODES.FULL_REFRESH,
                    fallbackReason: null,
                    cursorConfig: null
                };
            }

            // 2. If INCREMENTAL requested, verify connector capability
            const capabilities = connector && typeof connector.capabilities === 'function'
                ? connector.capabilities()
                : {};

            if (!capabilities.supportsIncremental) {
                return {
                    strategy: SYNC_MODES.FULL_REFRESH,
                    fallbackReason: `Connector "${connector?.type || 'unknown'}" does not support incremental synchronization. Falling back to FULL_REFRESH.`,
                    cursorConfig: null
                };
            }

            // 3. Verify schema drift is not BREAKING
            if (driftResult && driftResult.isBreaking) {
                return {
                    strategy: SYNC_MODES.FULL_REFRESH,
                    fallbackReason: `Breaking schema change detected: ${driftResult.summary}. Incremental cursor invalidated. Falling back to FULL_REFRESH.`,
                    cursorConfig: null
                };
            }

            // 4. Verify source has incremental cursor configuration
            const cursorField = source.cursorField || options.cursorField;
            if (!cursorField && !capabilities.supportsCursorlessIncremental) {
                return {
                    strategy: SYNC_MODES.FULL_REFRESH,
                    fallbackReason: 'No cursor column or watermark defined on data source. Falling back to FULL_REFRESH.',
                    cursorConfig: null
                };
            }

            // 5. Safe to proceed with INCREMENTAL
            const cursorConfig = {
                strategy: source.incrementalStrategy || 'WATERMARK',
                cursorField: cursorField,
                lastValue: source.lastCursorValue || null,
                pageSize: options.pageSize || source.batchSize || 100
            };

            return {
                strategy: SYNC_MODES.INCREMENTAL,
                fallbackReason: null,
                cursorConfig
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.SyncStrategy = SyncStrategy;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SyncStrategy;
    }

})(typeof window !== 'undefined' ? window : global);
