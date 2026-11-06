/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/configuration/enterprise-config.js
 * ============================================================================
 * Centralized configuration for enterprise governance, quotas, limits,
 * default roles, and operational behaviors.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DEFAULT_CONFIG = Object.freeze({
        maxDatasetSize: 50 * 1024 * 1024, // 50MB browser default
        maxProjectMembers: 50,
        maxWorkspaceCount: 20,
        retentionDays: 90,
        allowedExportFormats: ['csv', 'json', 'xlsx', 'html', 'md', 'report', 'benchmark'],
        defaultPermissions: {
            Owner: ['*'],
            Administrator: [
                'dataset.*',
                'analysis.*',
                'model.*',
                'insight.*',
                'investigation.*',
                'report.*',
                'project.*',
                'workspace.*',
                'user.*',
                'role.*',
                'audit.*',
                'governance.*',
                'export.*',
                'search.*',
                'copilot.*',
                'benchmark.*'
            ],
            Analyst: [
                'dataset.read',
                'dataset.create',
                'dataset.update',
                'dataset.version',
                'analysis.run',
                'analysis.read',
                'analysis.export',
                'model.read',
                'model.create',
                'model.validate',
                'insight.read',
                'insight.create',
                'insight.export',
                'investigation.create',
                'investigation.read',
                'investigation.update',
                'report.create',
                'report.read',
                'report.export',
                'project.read',
                'workspace.read',
                'workspace.create',
                'export.execute',
                'search.execute',
                'copilot.query',
                'copilot.read',
                'benchmark.run',
                'benchmark.read'
            ],
            Viewer: [
                'dataset.read',
                'analysis.read',
                'model.read',
                'insight.read',
                'investigation.read',
                'report.read',
                'project.read',
                'workspace.read',
                'search.execute',
                'copilot.read',
                'benchmark.read'
            ],
            Auditor: [
                'audit.read',
                'governance.read',
                'dataset.read',
                'analysis.read',
                'model.read',
                'insight.read',
                'investigation.read',
                'report.read',
                'project.read',
                'workspace.read',
                'search.execute',
                'copilot.read',
                'benchmark.read'
            ]
        },
        benchmarkLimits: {
            maxRows: 250000,
            maxCols: 500
        },
        identityProvider: 'LOCAL DEVELOPMENT IDENTITY',
        environment: 'enterprise_production_ready',
        version: '10.0.0-enterprise'
    });

    let _currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

    const EnterpriseConfig = {
        /**
         * Get full enterprise configuration or specific key
         * @param {string} [key]
         * @returns {*}
         */
        get(key) {
            if (!key) return JSON.parse(JSON.stringify(_currentConfig));
            return _currentConfig[key] !== undefined ? JSON.parse(JSON.stringify(_currentConfig[key])) : undefined;
        },

        /**
         * Set or update configuration key
         * @param {string} key
         * @param {*} value
         */
        set(key, value) {
            if (!key || value === undefined) return;
            _currentConfig[key] = JSON.parse(JSON.stringify(value));
        },

        /**
         * Update multiple config values
         * @param {Object} partialConfig
         */
        update(partialConfig) {
            if (!partialConfig || typeof partialConfig !== 'object') return;
            Object.keys(partialConfig).forEach(k => {
                _currentConfig[k] = JSON.parse(JSON.stringify(partialConfig[k]));
            });
        },

        /**
         * Reset configuration to frozen defaults
         */
        resetToDefaults() {
            _currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        },

        /**
         * Get default identity label
         * @returns {string}
         */
        getIdentityLabel() {
            return _currentConfig.identityProvider;
        }
    };

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.EnterpriseConfig = EnterpriseConfig;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = EnterpriseConfig;
    }
})(typeof window !== 'undefined' ? window : global);
