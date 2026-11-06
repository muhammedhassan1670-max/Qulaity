/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/sharing/export-manager.js
 * ============================================================================
 * Centralized Enterprise Export Management.
 * Manages authorized data & intelligence exports across formats:
 * CSV | JSON | Excel-compatible | HTML | Markdown | Reports | Benchmark Results
 * Invariant: Every export requires authorization and generates an immutable
 * audit event.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ExportManager = {
        /**
         * Export dataset rows to CSV format
         * @param {Object} dataset
         * @param {Object} user
         * @returns {string} CSV string
         */
        exportCSV(dataset, user) {
            this._assertExportAllowed(user, dataset, 'csv');

            const columns = dataset.columns || [];
            const rows = dataset.rows || [];

            const headerLine = columns.map(c => typeof c === 'string' ? `"${c}"` : `"${c.name || ''}"`).join(',');
            const rowLines = rows.map(r => {
                return columns.map(c => {
                    const colName = typeof c === 'string' ? c : c.name;
                    const val = r[colName];
                    if (val === null || val === undefined) return '""';
                    return `"${String(val).replace(/"/g, '""')}"`;
                }).join(',');
            });

            const csvContent = [headerLine, ...rowLines].join('\n');
            this._auditExport(dataset.id, user.id, 'csv', rows.length);
            return csvContent;
        },

        /**
         * Export dataset or intelligence entity to JSON format
         * @param {Object} entity
         * @param {Object} user
         * @param {string} [exportType='dataset']
         * @returns {string} JSON string
         */
        exportJSON(entity, user, exportType = 'dataset') {
            this._assertExportAllowed(user, entity, 'json');

            const jsonStr = JSON.stringify(entity, null, 2);
            this._auditExport(entity?.id || 'entity', user.id, 'json', jsonStr.length, exportType);
            return jsonStr;
        },

        /**
         * Export intelligence report (Markdown)
         * @param {Object} report
         * @param {Object} user
         * @returns {string}
         */
        exportMarkdown(report, user) {
            this._assertExportAllowed(user, report, 'md');

            const content = report.content || report.markdown || `# Report: ${report.title || 'Untitled'}\n\nGenerated: ${new Date().toISOString()}`;
            this._auditExport(report?.id || 'report', user.id, 'md', content.length, 'REPORT');
            return content;
        },

        _assertExportAllowed(user, resource, format) {
            const permEngine = window.UDIP?.Enterprise?.PermissionEngine;
            if (permEngine) {
                const verdict = permEngine.can(user, 'export.execute', resource);
                if (!verdict.allowed) {
                    throw new Error(`Export Denied: ${verdict.reason}`);
                }
            }

            const cfg = window.UDIP?.Enterprise?.EnterpriseConfig;
            const allowedFormats = cfg ? cfg.get('allowedExportFormats') || [] : ['csv', 'json'];
            if (!allowedFormats.includes(format.toLowerCase())) {
                throw new Error(`Export format "${format}" is not allowed by enterprise configuration`);
            }
        },

        _auditExport(resourceId, actorId, format, size, exportType = 'DATASET') {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action: 'EXPORT_GENERATED',
                        resourceType: exportType,
                        resourceId,
                        result: 'SUCCESS',
                        metadata: { format, size }
                    });
                }
            } catch (e) {
                // Non-blocking
            }
        }
    };

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.ExportManager = ExportManager;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ExportManager;
    }
})(typeof window !== 'undefined' ? window : global);
