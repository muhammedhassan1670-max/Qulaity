/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/reporting/integration-report.js
 * ============================================================================
 * Comprehensive Integration & Sync Operational Report Generator.
 * Consolidates connection states, health assessments, synchronization metrics,
 * schema drift events, and data lineage into an executive audit report.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class IntegrationReport {
        /**
         * Generate an operational integration summary report
         * @param {Object} [options]
         * @returns {Object} { json: Object, markdown: string }
         */
        generateReport(options = {}) {
            const connReg = window.UDIP?.Integrations?.ConnectionRegistry;
            const sourceReg = window.UDIP?.Integrations?.SourceRegistry;
            const healthMon = window.UDIP?.Integrations?.HealthMonitor;
            const metricsMon = window.UDIP?.Integrations?.IntegrationMetrics;
            const schMgr = window.UDIP?.Integrations?.ScheduleManager;
            const lineageMgr = window.UDIP?.Integrations?.LineageManager;

            const connections = connReg ? connReg.listConnections() : [];
            const sources = sourceReg ? sourceReg.listSources() : [];
            const health = healthMon ? healthMon.evaluateAll() : { overallStatus: 'UNKNOWN', healthScore: 100 };
            const metrics = metricsMon ? metricsMon.getSummary() : { totalSyncs: 0, successRate: 100 };
            const schedules = schMgr ? schMgr.listSchedules() : [];
            const lineage = lineageMgr ? lineageMgr.getLineageGraph() : { nodes: [], edges: [] };

            const data = {
                timestamp: new Date().toISOString(),
                summary: {
                    totalConnections: connections.length,
                    activeConnections: connections.filter(c => c.status === 'CONNECTED').length,
                    totalSources: sources.length,
                    totalSyncs: metrics.totalSyncs,
                    syncSuccessRate: metrics.successRate,
                    totalRowsIngested: metrics.totalRowsIngested,
                    totalRowsRejected: metrics.totalRowsRejected,
                    healthStatus: health.overallStatus,
                    healthScore: health.healthScore,
                    executionMode: 'LOCAL_BROWSER_SCHEDULE'
                },
                connections: connections.map(c => ({
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    status: c.status,
                    health: healthMon ? healthMon.getConnectionHealth(c.id).status : 'UNKNOWN'
                })),
                sources: sources.map(s => ({
                    id: s.id,
                    name: s.name,
                    connectionId: s.connectionId,
                    lastSyncAt: s.lastSyncAt,
                    status: s.status
                })),
                schedulesCount: schedules.length,
                lineageNodesCount: lineage.nodes.length
            };

            const markdown = this._renderMarkdown(data);

            return {
                data,
                markdown
            };
        }

        _renderMarkdown(data) {
            const s = data.summary;
            return `# Enterprise Data Integration Report
*Generated: ${data.timestamp}*
*Execution Mode: \`${s.executionMode}\`*

---

## 1. Executive Summary
- **Overall Health**: **${s.healthStatus}** (Health Score: **${s.healthScore}%**)
- **Connections Configured**: **${s.totalConnections}** (${s.activeConnections} active)
- **Data Sources Registered**: **${s.totalSources}**
- **Total Synchronizations**: **${s.totalSyncs}** (Success Rate: **${s.syncSuccessRate}%**)
- **Throughput**: **${s.totalRowsIngested}** rows ingested (**${s.totalRowsRejected}** rejected)

## 2. Connections Roster
| ID | Name | Connector Type | Status | Health |
|---|---|---|---|---|
${data.connections.map(c => `| \`${c.id}\` | ${c.name} | \`${c.type}\` | **${c.status}** | ${c.health} |`).join('\n') || '| - | No connections configured | - | - | - |'}

## 3. Registered Data Sources
| ID | Source Name | Connection | Last Sync | Status |
|---|---|---|---|---|
${data.sources.map(src => `| \`${src.id}\` | ${src.name} | \`${src.connectionId}\` | ${src.lastSyncAt || 'Never'} | ${src.status} |`).join('\n') || '| - | No data sources registered | - | - | - |'}

## 4. Operational Boundaries
> [!NOTE]
> Scheduling is currently executing under \`${s.executionMode}\`. Synchronizations require an active browser tab session.
`;
        }
    }

    const instance = new IntegrationReport();

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.IntegrationReport = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            IntegrationReport,
            instance
        };
    }

})(typeof window !== 'undefined' ? window : global);
