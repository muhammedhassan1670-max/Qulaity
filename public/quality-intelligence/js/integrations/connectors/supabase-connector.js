/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/connectors/supabase-connector.js
 * ============================================================================
 * Supabase Connector.
 * Connects directly to Supabase PostgREST tables with API key and bearer auth,
 * pagination headers, and cursor-based synchronization.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const RestConnector = window.UDIP?.Integrations?.RestConnector || require('./rest-connector.js');

    class SupabaseConnector extends RestConnector {
        constructor() {
            super();
            this.id = 'connector_supabase';
            this.name = 'Supabase Connector';
            this.type = 'SUPABASE';
            this.version = '1.0.0';
            this.supabaseUrl = '';
            this.anonKey = '';
        }

        capabilities() {
            return {
                supportsPagination: true,
                supportsIncremental: true,
                supportsSchemaDiscovery: true,
                supportsWebhook: false,
                supportedAuth: ['SUPABASE_AUTH', 'BEARER_TOKEN']
            };
        }

        async connect(config = {}) {
            this.supabaseUrl = config.supabaseUrl || config.url || '';
            this.anonKey = config.anonKey || config.apiKey || '';

            const restConfig = {
                baseUrl: `${this.supabaseUrl.replace(/\/$/, '')}/rest/v1`,
                authType: 'SUPABASE_AUTH',
                credentials: {
                    apiKey: this.anonKey,
                    token: config.token || this.anonKey
                },
                headers: {
                    'apikey': this.anonKey,
                    'Prefer': 'return=representation'
                }
            };

            return await super.connect(restConfig);
        }

        async queryTable(tableName, options = {}) {
            return await this.fetch({
                endpoint: tableName,
                ...options
            });
        }
    }

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.SupabaseConnector = SupabaseConnector;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SupabaseConnector;
    }
})(typeof window !== 'undefined' ? window : global);
