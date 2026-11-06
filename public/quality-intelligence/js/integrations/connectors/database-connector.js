/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/connectors/database-connector.js
 * ============================================================================
 * SQL-Compatible Database Connector Abstraction.
 * Exposes universal schema discovery, table previews, and query execution.
 * Adaptable to PostgreSQL, MySQL, SQLite, and client-side database bridges.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const BaseConnector = window.UDIP?.Integrations?.BaseConnector || require('./base-connector.js');

    class DatabaseConnector extends BaseConnector {
        constructor(metadata = {}) {
            super({
                id: metadata.id || 'connector_database',
                name: metadata.name || 'Generic Database Connector',
                type: metadata.type || 'DATABASE',
                version: metadata.version || '1.0.0'
            });
            this.host = '';
            this.database = '';
            this.tables = new Map(); // table -> Array of rows
        }

        capabilities() {
            return {
                supportsPagination: true,
                supportsIncremental: true,
                supportsSchemaDiscovery: true,
                supportsWebhook: false,
                supportedAuth: ['DATABASE_CREDENTIAL', 'NONE']
            };
        }

        async connect(config = {}) {
            await super.connect(config);
            this.host = config.host || 'localhost';
            this.database = config.database || 'default_db';

            // Seed mock tables if provided in config for testing/adapter bridges
            if (config.mockTables && typeof config.mockTables === 'object') {
                for (const [tbl, rows] of Object.entries(config.mockTables)) {
                    this.tables.set(tbl, [...rows]);
                }
            }
            return true;
        }

        async discoverSchema(options = {}) {
            const table = options.table || Array.from(this.tables.keys())[0] || 'records';
            const rows = this.tables.get(table) || [];

            if (rows.length === 0) {
                return {
                    table,
                    columns: ['id', 'created_at', 'value'],
                    types: { id: 'NUMERIC', created_at: 'TIMESTAMP', value: 'TEXT' },
                    sampleRows: []
                };
            }

            const columns = Object.keys(rows[0]);
            const types = {};
            columns.forEach(c => {
                const val = rows[0][c];
                types[c] = typeof val === 'number' ? 'NUMERIC' : (typeof val === 'boolean' ? 'BOOLEAN' : 'TEXT');
            });

            return {
                table,
                columns,
                types,
                sampleRows: rows.slice(0, 5),
                totalRowCount: rows.length
            };
        }

        async fetch(queryConfig = {}) {
            const table = queryConfig.table || Array.from(this.tables.keys())[0] || 'records';
            const rows = this.tables.get(table) || [];
            const limit = queryConfig.limit || rows.length;

            return {
                records: rows.slice(0, limit),
                total: rows.length,
                hasMore: limit < rows.length
            };
        }

        async fetchPage(page = 1, pageSize = 50, options = {}) {
            const table = options.table || Array.from(this.tables.keys())[0] || 'records';
            const rows = this.tables.get(table) || [];
            const start = (page - 1) * pageSize;
            const records = rows.slice(start, start + pageSize);

            return {
                records,
                page,
                pageSize,
                total: rows.length,
                hasMore: start + pageSize < rows.length
            };
        }

        async fetchIncremental(cursorConfig = {}) {
            const { table, cursorField = 'id', lastValue = 0 } = cursorConfig;
            const targetTable = table || Array.from(this.tables.keys())[0] || 'records';
            const rows = this.tables.get(targetTable) || [];

            const delta = rows.filter(r => r[cursorField] > lastValue);
            const newCursor = delta.length > 0 ? delta[delta.length - 1][cursorField] : lastValue;

            return {
                records: delta,
                newCursorValue: newCursor,
                hasMore: false
            };
        }
    }

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.DatabaseConnector = DatabaseConnector;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DatabaseConnector;
    }
})(typeof window !== 'undefined' ? window : global);
