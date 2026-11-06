/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/sync/sync-engine.js
 * ============================================================================
 * Master Synchronization Pipeline Coordinator:
 * Coordinates Schema Drift Detection, Strategy Resolution, Ingestion Pipeline,
 * State Tracking, Lineage, and Health Metrics.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class SyncEngine {
        constructor() {
            this._isRunning = false;
        }

        /**
         * Execute a complete synchronization run for a registered data source
         * @param {string} sourceId
         * @param {Object} [options]
         * @returns {Promise<Object>}
         */
        async syncSource(sourceId, options = {}) {
            const startTime = Date.now();

            const sourceReg = window.UDIP?.Integrations?.SourceRegistry;
            const connReg = window.UDIP?.Integrations?.ConnectionRegistry;
            const connectorReg = window.UDIP?.Integrations?.ConnectorRegistry;
            const syncState = window.UDIP?.Integrations?.SyncState;
            const changeDetector = window.UDIP?.Integrations?.ChangeDetector;
            const syncStrategy = window.UDIP?.Integrations?.SyncStrategy;
            const ingestionEngine = window.UDIP?.Integrations?.IngestionEngine;
            const healthMonitor = window.UDIP?.Integrations?.HealthMonitor;

            if (!sourceReg) throw new Error('SourceRegistry unavailable');
            const source = sourceReg.getSource(sourceId);
            if (!source) throw new Error(`Source "${sourceId}" not found`);

            if (!connReg) throw new Error('ConnectionRegistry unavailable');
            const connection = connReg.getConnection(source.connectionId);
            if (!connection) throw new Error(`Connection "${source.connectionId}" not found for source "${sourceId}"`);

            // Initialize or retrieve connector
            let connector = options.connector;
            if (!connector && connectorReg) {
                // Merge connection config with credentials if available
                const credProvider = window.UDIP?.Integrations?.CredentialProvider;
                const creds = credProvider ? credProvider.getCredentials(connection.id) : null;
                const fullConfig = { ...connection.config, ...(creds || {}) };
                connector = connectorReg.createInstance(connection.type, fullConfig);
            }

            if (!connector) {
                throw new Error(`Unable to resolve connector for type "${connection.type}"`);
            }

            // Create tracking job
            const job = syncState ? syncState.createJob({
                sourceId,
                connectionId: connection.id,
                targetDatasetId: source.targetDatasetId,
                syncMode: source.syncMode || 'FULL_REFRESH',
                projectId: source.projectId,
                actorId: options.actorId || 'system'
            }) : { id: `sync_${Date.now()}` };

            if (syncState) syncState.startJob(job.id);

            try {
                // 1. Connect if needed
                if (typeof connector.connect === 'function' && !connector._connected) {
                    await connector.connect(connector.config || {});
                }

                // 2. Discover Schema & Detect Drift
                let driftResult = null;
                let incomingSchema = [];
                if (typeof connector.discoverSchema === 'function') {
                    try {
                        const schemaInfo = await connector.discoverSchema(source.extractionConfig);
                        incomingSchema = schemaInfo.columns || [];
                        if (changeDetector && source.schemaSnapshot && source.schemaSnapshot.length > 0) {
                            driftResult = changeDetector.detectDrift(source.schemaSnapshot, incomingSchema);
                            if (driftResult.status !== 'NO_CHANGE') {
                                this._audit('SCHEMA_DRIFT_DETECTED', {
                                    sourceId,
                                    connectionId: connection.id,
                                    status: driftResult.status,
                                    changes: driftResult.changes
                                }, options.actorId, source.projectId);
                            }
                        }
                    } catch (schemaErr) {
                        // Non-fatal, proceed with extraction
                    }
                }

                // 3. Resolve Strategy (Full Refresh vs Incremental)
                const resolvedStrategy = syncStrategy
                    ? syncStrategy.resolveStrategy(source, connector, driftResult, options)
                    : { strategy: 'FULL_REFRESH', cursorConfig: null };

                // 4. Execute Ingestion Pipeline
                const isIncremental = resolvedStrategy.strategy === 'INCREMENTAL';
                const ingestRes = await ingestionEngine.ingest({
                    connector,
                    connectionId: connection.id,
                    sourceId: source.id,
                    extractionConfig: source.extractionConfig || {},
                    targetDatasetId: source.targetDatasetId,
                    datasetName: source.name,
                    incremental: isIncremental,
                    cursorConfig: resolvedStrategy.cursorConfig,
                    validationRules: source.validationRules || {},
                    actorId: options.actorId || 'system',
                    projectId: source.projectId || 'prj_default'
                });

                // 5. Update Source & Cursor State
                const newCursorValue = ingestRes.cursor || (isIncremental ? (source.lastCursorValue || Date.now()) : null);
                sourceReg.updateSource(source.id, {
                    lastSyncAt: new Date().toISOString(),
                    lastCursorValue: newCursorValue,
                    targetDatasetId: ingestRes.datasetId,
                    schemaSnapshot: incomingSchema.length > 0 ? incomingSchema : source.schemaSnapshot,
                    status: 'ACTIVE'
                });

                // 6. Complete Sync Job
                if (syncState) {
                    syncState.completeJob(job.id, {
                        rowCount: ingestRes.rowCount,
                        rejectedCount: ingestRes.rejectedCount,
                        versionId: ingestRes.versionId,
                        warnings: [
                            ...(resolvedStrategy.fallbackReason ? [resolvedStrategy.fallbackReason] : []),
                            ...(ingestRes.warnings || [])
                        ]
                    });
                }

                // 7. Update Connection Health
                if (healthMonitor && typeof healthMonitor.recordCheck === 'function') {
                    healthMonitor.recordCheck(connection.id, true, Date.now() - startTime);
                }

                return {
                    success: true,
                    jobId: job.id,
                    strategy: resolvedStrategy.strategy,
                    datasetId: ingestRes.datasetId,
                    versionId: ingestRes.versionId,
                    rowCount: ingestRes.rowCount,
                    rejectedCount: ingestRes.rejectedCount,
                    durationMs: Date.now() - startTime,
                    drift: driftResult
                };

            } catch (err) {
                // Sync Failed
                if (syncState) {
                    syncState.failJob(job.id, err);
                }

                if (healthMonitor && typeof healthMonitor.recordCheck === 'function') {
                    healthMonitor.recordCheck(connection.id, false, Date.now() - startTime, err.message);
                }

                this._audit('SYNC_JOB_FAILED', {
                    jobId: job.id,
                    sourceId,
                    connectionId: connection.id,
                    error: err.message
                }, options.actorId, source.projectId);

                throw err;
            }
        }

        _audit(action, metadata, actorId = 'system', projectId = 'prj_default') {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'INTEGRATION_SYNC',
                        resourceId: metadata.sourceId || metadata.connectionId || 'unknown',
                        projectId,
                        result: action.includes('FAILED') ? 'FAILURE' : 'SUCCESS',
                        metadata
                    });
                }
            } catch (e) {
                // Non-blocking
            }
        }
    }

    const instance = new SyncEngine();

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.SyncEngine = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }

})(typeof window !== 'undefined' ? window : global);
