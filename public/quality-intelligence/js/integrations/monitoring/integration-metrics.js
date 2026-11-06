/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/monitoring/integration-metrics.js
 * ============================================================================
 * Operational telemetry metrics collector for enterprise integrations:
 * - Throughput: records ingested, records rejected, bytes transferred
 * - Reliability: success rates, failure classifications, retry counts
 * - Performance: latency distribution (min, max, mean) across connectors
 * ============================================================================
 */

(function (window) {
    'use strict';

    class IntegrationMetrics {
        constructor() {
            this._global = {
                totalSyncs: 0,
                successfulSyncs: 0,
                failedSyncs: 0,
                totalRowsIngested: 0,
                totalRowsRejected: 0,
                totalDurationMs: 0,
                errorCounts: {}
            };
            this._connectionStats = new Map();
            this._sourceStats = new Map();
        }

        /**
         * Record an ingestion or sync event
         * @param {Object} event
         */
        recordIngestion(event = {}) {
            const {
                connectionId,
                sourceId,
                rows = 0,
                rejected = 0,
                durationMs = 0,
                success = true,
                errorType = null
            } = event;

            // Global stats
            this._global.totalSyncs++;
            if (success) {
                this._global.successfulSyncs++;
                this._global.totalRowsIngested += rows;
                this._global.totalRowsRejected += rejected;
            } else {
                this._global.failedSyncs++;
                if (errorType) {
                    this._global.errorCounts[errorType] = (this._global.errorCounts[errorType] || 0) + 1;
                }
            }
            this._global.totalDurationMs += durationMs;

            // Per-connection stats
            if (connectionId) {
                if (!this._connectionStats.has(connectionId)) {
                    this._connectionStats.set(connectionId, {
                        syncs: 0,
                        successes: 0,
                        failures: 0,
                        rows: 0,
                        totalDuration: 0,
                        durations: []
                    });
                }
                const cStats = this._connectionStats.get(connectionId);
                cStats.syncs++;
                if (success) {
                    cStats.successes++;
                    cStats.rows += rows;
                } else {
                    cStats.failures++;
                }
                cStats.totalDuration += durationMs;
                cStats.durations.push(durationMs);
                if (cStats.durations.length > 100) cStats.durations.shift();
            }

            // Per-source stats
            if (sourceId) {
                if (!this._sourceStats.has(sourceId)) {
                    this._sourceStats.set(sourceId, {
                        syncs: 0,
                        successes: 0,
                        failures: 0,
                        rows: 0,
                        rejected: 0,
                        lastDuration: 0
                    });
                }
                const sStats = this._sourceStats.get(sourceId);
                sStats.syncs++;
                if (success) {
                    sStats.successes++;
                    sStats.rows += rows;
                    sStats.rejected += rejected;
                } else {
                    sStats.failures++;
                }
                sStats.lastDuration = durationMs;
            }
        }

        /**
         * Get global integration telemetry summary
         * @returns {Object}
         */
        getSummary() {
            const total = this._global.totalSyncs;
            const successRate = total > 0 ? (this._global.successfulSyncs / total) * 100 : 100;
            const avgDurationMs = total > 0 ? Math.round(this._global.totalDurationMs / total) : 0;

            return {
                totalSyncs: total,
                successfulSyncs: this._global.successfulSyncs,
                failedSyncs: this._global.failedSyncs,
                successRate: Number(successRate.toFixed(2)),
                totalRowsIngested: this._global.totalRowsIngested,
                totalRowsRejected: this._global.totalRowsRejected,
                avgDurationMs,
                errorBreakdown: { ...this._global.errorCounts },
                activeConnectionsCount: this._connectionStats.size,
                activeSourcesCount: this._sourceStats.size
            };
        }

        /**
         * Get metrics for a specific connection
         * @param {string} connectionId
         * @returns {Object|null}
         */
        getConnectionMetrics(connectionId) {
            const stats = this._connectionStats.get(connectionId);
            if (!stats) return null;

            const avg = stats.syncs > 0 ? Math.round(stats.totalDuration / stats.syncs) : 0;
            const min = stats.durations.length > 0 ? Math.min(...stats.durations) : 0;
            const max = stats.durations.length > 0 ? Math.max(...stats.durations) : 0;

            return {
                syncs: stats.syncs,
                successRate: stats.syncs > 0 ? Number(((stats.successes / stats.syncs) * 100).toFixed(2)) : 100,
                totalRows: stats.rows,
                latency: { avg, min, max }
            };
        }

        /**
         * Reset all metrics
         */
        reset() {
            this._global = {
                totalSyncs: 0,
                successfulSyncs: 0,
                failedSyncs: 0,
                totalRowsIngested: 0,
                totalRowsRejected: 0,
                totalDurationMs: 0,
                errorCounts: {}
            };
            this._connectionStats.clear();
            this._sourceStats.clear();
        }
    }

    const instance = new IntegrationMetrics();

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.IntegrationMetrics = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }

})(typeof window !== 'undefined' ? window : global);
