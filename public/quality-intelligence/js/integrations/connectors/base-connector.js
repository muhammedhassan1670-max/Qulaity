/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/connectors/base-connector.js
 * ============================================================================
 * Universal Connector Interface & Contract.
 * Every source connector must adhere to this unified contract:
 * connect() | disconnect() | testConnection() | discoverSchema() |
 * preview() | fetch() | fetchPage() | fetchIncremental() | health() | capabilities()
 * ============================================================================
 */

(function (window) {
    'use strict';

    class BaseConnector {
        /**
         * @param {Object} metadata
         */
        constructor(metadata = {}) {
            this.id = metadata.id || 'conn_base';
            this.name = metadata.name || 'Base Connector';
            this.type = metadata.type || 'GENERIC';
            this.version = metadata.version || '1.0.0';
            this.status = 'DISCONNECTED';
            this.config = {};
            this.isConnected = false;
        }

        /**
         * Expose connector capabilities flags
         * @returns {Object}
         */
        capabilities() {
            return {
                supportsPagination: false,
                supportsIncremental: false,
                supportsSchemaDiscovery: true,
                supportsWebhook: false,
                supportedAuth: ['NONE']
            };
        }

        /**
         * Connect to source with given configuration
         * @param {Object} config
         * @returns {Promise<boolean>}
         */
        async connect(config = {}) {
            this.config = { ...config };
            this.isConnected = true;
            this.status = 'CONNECTED';
            return true;
        }

        /**
         * Disconnect from source
         * @returns {Promise<boolean>}
         */
        async disconnect() {
            this.isConnected = false;
            this.status = 'DISCONNECTED';
            return true;
        }

        /**
         * Test connectivity and measure response latency
         * @returns {Promise<Object>} { success, latencyMs, message }
         */
        async testConnection() {
            const start = performance.now();
            try {
                if (!this.isConnected) {
                    await this.connect(this.config);
                }
                const latencyMs = Math.round(performance.now() - start);
                return {
                    success: true,
                    latencyMs,
                    message: `${this.name} connected successfully`
                };
            } catch (err) {
                const latencyMs = Math.round(performance.now() - start);
                const fh = window.UDIP?.Integrations?.FailureHandler;
                return {
                    success: false,
                    latencyMs,
                    message: fh ? fh.sanitize(err.message) : err.message,
                    error: err
                };
            }
        }

        /**
         * Discover schema of the target entity
         * @param {Object} [options]
         * @returns {Promise<Object>} { columns: Array, types: Object, sampleRows: Array }
         */
        async discoverSchema(options = {}) {
            throw new Error(`discoverSchema() not implemented on ${this.constructor.name}`);
        }

        /**
         * Preview a small sample of records
         * @param {number} [limit=10]
         * @returns {Promise<Array<Object>>}
         */
        async preview(limit = 10) {
            const res = await this.fetchPage(1, limit);
            return res.records || [];
        }

        /**
         * Fetch all records matching query parameters
         * @param {Object} [queryConfig]
         * @returns {Promise<Object>} { records: Array, total: number, hasMore: boolean }
         */
        async fetch(queryConfig = {}) {
            throw new Error(`fetch() not implemented on ${this.constructor.name}`);
        }

        /**
         * Fetch a paginated page of records
         * @param {number} page (1-indexed)
         * @param {number} pageSize
         * @param {Object} [options]
         * @returns {Promise<Object>} { records: Array, page: number, total: number, hasMore: boolean }
         */
        async fetchPage(page = 1, pageSize = 50, options = {}) {
            throw new Error(`fetchPage() not implemented on ${this.constructor.name}`);
        }

        /**
         * Fetch incremental delta records using cursor or watermark
         * @param {Object} cursorConfig { cursorField, lastValue, strategy }
         * @returns {Promise<Object>} { records: Array, newCursorValue: *, hasMore: boolean }
         */
        async fetchIncremental(cursorConfig = {}) {
            // Default fallback if unsupported: warn and fetch full
            console.warn(`[UDIP:${this.name}] Incremental loading unsupported; falling back to full fetch.`);
            const full = await this.fetch(cursorConfig);
            return {
                records: full.records || [],
                newCursorValue: null,
                hasMore: false,
                fallback: 'FULL_REFRESH'
            };
        }

        /**
         * Health assessment
         * @returns {Promise<string>} 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'
         */
        async health() {
            try {
                const testRes = await this.testConnection();
                return testRes.success ? 'HEALTHY' : 'UNHEALTHY';
            } catch (e) {
                return 'UNHEALTHY';
            }
        }
    }

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.BaseConnector = BaseConnector;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BaseConnector;
    }
})(typeof window !== 'undefined' ? window : global);
