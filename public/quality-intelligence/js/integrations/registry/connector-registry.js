/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/registry/connector-registry.js
 * ============================================================================
 * Universal Connector Registry.
 * Catalogs and instantiates connectors by sourceType:
 * FILE | REST | DATABASE | POSTGRES | SUPABASE | WEBHOOK
 * ============================================================================
 */

(function (window) {
    'use strict';

    class ConnectorRegistry {
        constructor() {
            this._connectors = new Map(); // type -> Connector class
        }

        /**
         * Register a connector class for a source type
         * @param {string} sourceType
         * @param {Function} connectorClass
         */
        register(sourceType, connectorClass) {
            if (!sourceType || !connectorClass) return;
            const norm = String(sourceType).toLowerCase().trim();
            this._connectors.set(norm, connectorClass);
        }

        /**
         * Get an instantiated connector instance for a given source type
         * @param {string} sourceType
         * @returns {Object|null}
         */
        getConnector(sourceType) {
            const norm = String(sourceType).toLowerCase().trim();
            const ConnectorClass = this._connectors.get(norm);
            return ConnectorClass ? new ConnectorClass() : null;
        }

        /**
         * Create an instance with configuration
         * @param {string} sourceType
         * @param {Object} [config]
         * @returns {Object|null}
         */
        createInstance(sourceType, config = {}) {
            const connector = this.getConnector(sourceType);
            if (connector && config) {
                connector.config = { ...config };
            }
            return connector;
        }

        /**
         * List metadata of all registered connector types
         * @returns {Array<Object>}
         */
        listConnectors() {
            const list = [];
            for (const [type, Cls] of this._connectors.entries()) {
                const inst = new Cls();
                list.push({
                    type,
                    name: inst.name,
                    version: inst.version,
                    capabilities: inst.capabilities()
                });
            }
            return list;
        }

        /**
         * Initialize default platform connectors
         */
        initDefaults() {
            const intg = window.UDIP?.Integrations || {};
            if (intg.FileConnector) this.register('file', intg.FileConnector);
            if (intg.RestConnector) this.register('rest', intg.RestConnector);
            if (intg.DatabaseConnector) this.register('database', intg.DatabaseConnector);
            if (intg.PostgresConnector) this.register('postgres', intg.PostgresConnector);
            if (intg.SupabaseConnector) this.register('supabase', intg.SupabaseConnector);
            if (intg.WebhookConnector) this.register('webhook', intg.WebhookConnector);
        }
    }

    const defaultRegistry = new ConnectorRegistry();
    defaultRegistry.ConnectorRegistry = ConnectorRegistry;

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.ConnectorRegistry = defaultRegistry;
    window.UDIP.Integrations.defaultConnectorRegistry = defaultRegistry;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = defaultRegistry;
    }
})(typeof window !== 'undefined' ? window : global);
