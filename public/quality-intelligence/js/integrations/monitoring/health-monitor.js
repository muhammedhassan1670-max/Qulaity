/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/monitoring/health-monitor.js
 * ============================================================================
 * Connection & Connector Health Monitor.
 * Classifies health state: HEALTHY | DEGRADED | UNHEALTHY | UNKNOWN.
 * Calculates composite integration health metrics across all endpoints.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const HEALTH_STATUS = Object.freeze({
        HEALTHY: 'HEALTHY',
        DEGRADED: 'DEGRADED',
        UNHEALTHY: 'UNHEALTHY',
        UNKNOWN: 'UNKNOWN'
    });

    class HealthMonitor {
        constructor() {
            this._connectionHealth = new Map();
        }

        /**
         * Record a health check or sync result for a connection
         * @param {string} connectionId
         * @param {boolean} success
         * @param {number} [latencyMs=0]
         * @param {string} [errorMsg=null]
         * @returns {Object} healthRecord
         */
        recordCheck(connectionId, success, latencyMs = 0, errorMsg = null) {
            if (!connectionId) return null;

            if (!this._connectionHealth.has(connectionId)) {
                this._connectionHealth.set(connectionId, {
                    connectionId,
                    status: HEALTH_STATUS.UNKNOWN,
                    consecutiveFailures: 0,
                    consecutiveSuccesses: 0,
                    lastCheckAt: null,
                    lastLatencyMs: 0,
                    lastError: null,
                    history: []
                });
            }

            const rec = this._connectionHealth.get(connectionId);
            rec.lastCheckAt = new Date().toISOString();
            rec.lastLatencyMs = latencyMs;
            rec.history.push({ success, latencyMs, timestamp: rec.lastCheckAt, error: errorMsg });
            if (rec.history.length > 20) rec.history.shift();

            if (success) {
                rec.consecutiveSuccesses++;
                rec.consecutiveFailures = 0;
                rec.lastError = null;
                // High latency (> 5000ms) marks DEGRADED even on success
                rec.status = latencyMs > 5000 ? HEALTH_STATUS.DEGRADED : HEALTH_STATUS.HEALTHY;
            } else {
                rec.consecutiveFailures++;
                rec.consecutiveSuccesses = 0;
                rec.lastError = errorMsg;
                // 1 failure = DEGRADED, 2+ failures = UNHEALTHY
                rec.status = rec.consecutiveFailures >= 2 ? HEALTH_STATUS.UNHEALTHY : HEALTH_STATUS.DEGRADED;
            }

            return { ...rec };
        }

        /**
         * Get health record for a specific connection
         * @param {string} connectionId
         * @returns {Object}
         */
        getConnectionHealth(connectionId) {
            const rec = this._connectionHealth.get(connectionId);
            if (!rec) {
                return {
                    connectionId,
                    status: HEALTH_STATUS.UNKNOWN,
                    consecutiveFailures: 0,
                    consecutiveSuccesses: 0,
                    lastCheckAt: null,
                    lastLatencyMs: 0,
                    lastError: null
                };
            }
            return { ...rec };
        }

        /**
         * Evaluate health across all registered connections
         * @returns {Object}
         */
        evaluateAll() {
            const records = Array.from(this._connectionHealth.values());
            if (records.length === 0) {
                return {
                    overallStatus: HEALTH_STATUS.UNKNOWN,
                    healthScore: 100,
                    totalConnections: 0,
                    healthyCount: 0,
                    degradedCount: 0,
                    unhealthyCount: 0
                };
            }

            let healthyCount = 0;
            let degradedCount = 0;
            let unhealthyCount = 0;

            records.forEach(r => {
                if (r.status === HEALTH_STATUS.HEALTHY) healthyCount++;
                else if (r.status === HEALTH_STATUS.DEGRADED) degradedCount++;
                else if (r.status === HEALTH_STATUS.UNHEALTHY) unhealthyCount++;
            });

            // Health Score calculation (Healthy: 1.0, Degraded: 0.5, Unhealthy: 0.0)
            const score = Math.round(
                ((healthyCount * 1.0 + degradedCount * 0.5) / records.length) * 100
            );

            let overallStatus = HEALTH_STATUS.HEALTHY;
            if (unhealthyCount > 0) {
                overallStatus = unhealthyCount >= records.length / 2 ? HEALTH_STATUS.UNHEALTHY : HEALTH_STATUS.DEGRADED;
            } else if (degradedCount > 0) {
                overallStatus = HEALTH_STATUS.DEGRADED;
            }

            return {
                overallStatus,
                healthScore: score,
                totalConnections: records.length,
                healthyCount,
                degradedCount,
                unhealthyCount
            };
        }

        /**
         * Reset monitor state
         */
        reset() {
            this._connectionHealth.clear();
        }
    }

    const instance = new HealthMonitor();

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.HEALTH_STATUS = HEALTH_STATUS;
        window.UDIP.Integrations.HealthMonitor = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            HEALTH_STATUS,
            HealthMonitor,
            instance
        };
    }

})(typeof window !== 'undefined' ? window : global);
