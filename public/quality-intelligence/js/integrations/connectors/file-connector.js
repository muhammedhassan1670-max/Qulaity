/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/connectors/file-connector.js
 * ============================================================================
 * Connector for structured file formats: CSV, XLSX, and JSON.
 * Reuses existing parser utilities without duplicating in-memory buffers.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const BaseConnector = window.UDIP?.Integrations?.BaseConnector || require('./base-connector.js');

    class FileConnector extends BaseConnector {
        constructor() {
            super({
                id: 'connector_file',
                name: 'Structured File Connector',
                type: 'FILE',
                version: '1.0.0'
            });
            this._parsedRecords = [];
            this._columns = [];
        }

        capabilities() {
            return {
                supportsPagination: true,
                supportsIncremental: false,
                supportsSchemaDiscovery: true,
                supportsWebhook: false,
                supportedAuth: ['NONE']
            };
        }

        /**
         * Load and parse file data (raw text, array, or pre-parsed object)
         * @param {Object} config { content, format: 'CSV'|'JSON'|'XLSX', filename }
         * @returns {Promise<boolean>}
         */
        async connect(config = {}) {
            await super.connect(config);

            const format = String(config.format || 'CSV').toUpperCase();
            const content = config.content;

            if (!content) {
                this._parsedRecords = [];
                this._columns = [];
                return true;
            }

            if (Array.isArray(content)) {
                this._parsedRecords = [...content];
                this._columns = content.length > 0 ? Object.keys(content[0]) : [];
                return true;
            }

            if (format === 'JSON') {
                try {
                    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
                    this._parsedRecords = Array.isArray(parsed) ? parsed : (parsed.data || [parsed]);
                    this._columns = this._parsedRecords.length > 0 ? Object.keys(this._parsedRecords[0]) : [];
                } catch (e) {
                    throw new Error(`Failed to parse JSON file content: ${e.message}`);
                }
            } else if (format === 'CSV') {
                const parser = window.UDIP?.Parser;
                if (parser && typeof parser.parseCSV === 'function') {
                    const res = await parser.parseCSV(content);
                    this._parsedRecords = res.rows || [];
                    this._columns = res.columns || [];
                } else {
                    // Fallback basic CSV parser
                    const lines = String(content).split(/\r?\n/).filter(l => l.trim().length > 0);
                    if (lines.length > 0) {
                        this._columns = lines[0].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
                        this._parsedRecords = lines.slice(1).map(line => {
                            const cells = line.split(',');
                            const row = {};
                            this._columns.forEach((col, idx) => {
                                const rawVal = (cells[idx] || '').trim().replace(/^["']|["']$/g, '');
                                const num = Number(rawVal);
                                row[col] = (!isNaN(num) && rawVal !== '') ? num : rawVal;
                            });
                            return row;
                        });
                    }
                }
            }

            return true;
        }

        async discoverSchema() {
            const sample = this._parsedRecords.slice(0, 10);
            const types = {};

            this._columns.forEach(col => {
                const sampleVals = sample.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
                if (sampleVals.length === 0) {
                    types[col] = 'TEXT';
                } else if (sampleVals.every(v => typeof v === 'number' || !isNaN(Number(v)))) {
                    types[col] = 'NUMERIC';
                } else if (sampleVals.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) {
                    types[col] = 'BOOLEAN';
                } else {
                    types[col] = 'TEXT';
                }
            });

            return {
                columns: [...this._columns],
                types,
                sampleRows: sample,
                totalRowCount: this._parsedRecords.length
            };
        }

        async fetch(queryConfig = {}) {
            if (queryConfig && queryConfig.content) {
                await this.connect(queryConfig);
            }
            const limit = queryConfig.limit || this._parsedRecords.length;
            const records = this._parsedRecords.slice(0, limit);
            return {
                records,
                total: this._parsedRecords.length,
                hasMore: limit < this._parsedRecords.length
            };
        }

        async fetchPage(page = 1, pageSize = 50) {
            const start = (page - 1) * pageSize;
            const records = this._parsedRecords.slice(start, start + pageSize);
            return {
                records,
                page,
                pageSize,
                total: this._parsedRecords.length,
                hasMore: start + pageSize < this._parsedRecords.length
            };
        }
    }

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.FileConnector = FileConnector;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FileConnector;
    }
})(typeof window !== 'undefined' ? window : global);
