/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/connectors/postgres-connector.js
 * ============================================================================
 * PostgreSQL Adapter Connector.
 * Extends DatabaseConnector with Postgres-specific schema inspection,
 * SSL mode configurations, and SQL type casting.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DatabaseConnector = window.UDIP?.Integrations?.DatabaseConnector || require('./database-connector.js');

    class PostgresConnector extends DatabaseConnector {
        constructor() {
            super({
                id: 'connector_postgres',
                name: 'PostgreSQL Connector',
                type: 'POSTGRES',
                version: '1.0.0'
            });
            this.port = 5432;
            this.sslMode = 'require';
        }

        async connect(config = {}) {
            this.port = config.port || 5432;
            this.sslMode = config.sslMode || 'require';
            return await super.connect(config);
        }

        /**
         * Postgres-specific schema query (e.g. information_schema)
         */
        async discoverSchema(options = {}) {
            const baseSchema = await super.discoverSchema(options);
            return {
                ...baseSchema,
                engine: 'PostgreSQL',
                dialect: 'postgres',
                sslActive: this.sslMode !== 'disable'
            };
        }
    }

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.PostgresConnector = PostgresConnector;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PostgresConnector;
    }
})(typeof window !== 'undefined' ? window : global);
