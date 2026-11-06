/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/connectors/webhook-connector.js
 * ============================================================================
 * Inbound Webhook Event Connector.
 * Ingests external real-time events, buffers incoming event streams,
 * and converts event payloads into structured dataset versions.
 * In browser: supports local and simulated webhook event triggers.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const BaseConnector = window.UDIP?.Integrations?.BaseConnector || require('./base-connector.js');

    class WebhookConnector extends BaseConnector {
        constructor() {
            super({
                id: 'connector_webhook',
                name: 'Inbound Webhook Connector',
                type: 'WEBHOOK',
                version: '1.0.0'
            });
            this.endpointSecret = '';
            this._eventBuffer = [];
            this._listeners = new Set();
        }

        capabilities() {
            return {
                supportsPagination: true,
                supportsIncremental: true,
                supportsSchemaDiscovery: true,
                supportsWebhook: true,
                supportedAuth: ['API_KEY', 'NONE']
            };
        }

        async connect(config = {}) {
            await super.connect(config);
            this.endpointSecret = config.endpointSecret || '';
            return true;
        }

        /**
         * Receive an incoming webhook event payload
         * @param {Object|Array} payload
         * @param {string} [signature]
         * @returns {Object} { accepted: boolean, count: number, eventId: string }
         */
        receiveEvent(payload, signature = null) {
            const eventId = 'wh_evt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
            const events = Array.isArray(payload) ? payload : [payload];

            events.forEach(evt => {
                this._eventBuffer.push({
                    _webhookEventId: eventId,
                    _receivedAt: new Date().toISOString(),
                    ...evt
                });
            });

            // Notify subscribers
            this._listeners.forEach(fn => {
                try { fn(events); } catch (e) { /* non-blocking */ }
            });

            // Audit
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr) {
                    auditMgr.logEvent({
                        actorId: 'webhook_sender',
                        action: 'WEBHOOK_RECEIVED',
                        resourceType: 'WEBHOOK',
                        resourceId: eventId,
                        result: 'SUCCESS',
                        metadata: { count: events.length }
                    });
                }
            } catch (e) { /* non-blocking */ }

            return {
                accepted: true,
                count: events.length,
                eventId
            };
        }

        async discoverSchema() {
            if (this._eventBuffer.length === 0) {
                return {
                    columns: ['event_id', 'timestamp', 'data'],
                    types: { event_id: 'TEXT', timestamp: 'TIMESTAMP', data: 'TEXT' },
                    sampleRows: []
                };
            }

            const sample = this._eventBuffer.slice(0, 5);
            const columns = Object.keys(this._eventBuffer[0]);
            const types = {};
            columns.forEach(c => {
                const val = this._eventBuffer[0][c];
                types[c] = typeof val === 'number' ? 'NUMERIC' : (typeof val === 'boolean' ? 'BOOLEAN' : 'TEXT');
            });

            return {
                columns,
                types,
                sampleRows: sample,
                totalRowCount: this._eventBuffer.length
            };
        }

        async fetch(queryConfig = {}) {
            const limit = queryConfig.limit || this._eventBuffer.length;
            const records = this._eventBuffer.slice(0, limit);
            return {
                records,
                total: this._eventBuffer.length,
                hasMore: limit < this._eventBuffer.length
            };
        }

        async fetchPage(page = 1, pageSize = 50) {
            const start = (page - 1) * pageSize;
            const records = this._eventBuffer.slice(start, start + pageSize);
            return {
                records,
                page,
                pageSize,
                total: this._eventBuffer.length,
                hasMore: start + pageSize < this._eventBuffer.length
            };
        }

        async fetchIncremental(cursorConfig = {}) {
            const lastTime = cursorConfig.lastValue || '1970-01-01T00:00:00.000Z';
            const delta = this._eventBuffer.filter(e => (e._receivedAt || '') > lastTime);

            const newCursor = delta.length > 0 ? delta[delta.length - 1]._receivedAt : lastTime;
            return {
                records: delta,
                newCursorValue: newCursor,
                hasMore: false
            };
        }

        clearBuffer() {
            this._eventBuffer = [];
        }
    }

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.WebhookConnector = WebhookConnector;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = WebhookConnector;
    }
})(typeof window !== 'undefined' ? window : global);
