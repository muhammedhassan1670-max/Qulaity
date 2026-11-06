/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/ingestion/ingestion-engine.js
 * ============================================================================
 * Master Ingestion Pipeline Coordinator:
 * Extraction -> Schema Mapping -> Normalization -> Ingestion Validation -> Dataset Versioning
 * Invariants:
 * - DatasetManager is single source of truth for datasets.
 * - Zero raw-data mutation: deterministic mapping & cleaning.
 * - Credential safety: never exposes secrets to logs or dataset payloads.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class IngestionEngine {
        constructor() {
            this._lastResult = null;
        }

        /**
         * Execute end-to-end ingestion pipeline
         * @param {Object} params
         * @returns {Promise<Object>}
         */
        async ingest(params = {}) {
            const startTime = Date.now();
            const {
                connector,
                connectionId,
                sourceId,
                extractionConfig = {},
                targetDatasetId = null,
                datasetName = null,
                mappingConfig = null,
                validationRules = {},
                actorId = 'system',
                projectId = 'prj_default',
                incremental = false,
                cursorConfig = null
            } = params;

            if (!connector) {
                throw new Error('Connector instance is required for ingestion');
            }

            // 1. Governance & Policy Check
            const policy = window.UDIP?.Integrations?.IntegrationPolicy;
            if (policy && typeof policy.evaluateAccess === 'function') {
                const check = policy.evaluateAccess(actorId, connectionId, 'INGEST', projectId);
                if (!check.allowed) {
                    throw new Error(`Ingestion rejected by policy: ${check.reason}`);
                }
            }

            // 2. Extraction
            let fetchRes;
            try {
                if (incremental && typeof connector.fetchIncremental === 'function') {
                    fetchRes = await connector.fetchIncremental(cursorConfig || extractionConfig);
                } else if (typeof connector.fetch === 'function') {
                    fetchRes = await connector.fetch(extractionConfig);
                } else {
                    throw new Error('Connector does not implement fetch or fetchIncremental');
                }
            } catch (err) {
                this._audit('INGESTION_EXTRACTION_FAILED', { connectionId, sourceId, error: err.message }, actorId, projectId);
                throw err;
            }

            const rawRecords = Array.isArray(fetchRes) ? fetchRes : (fetchRes?.records || []);
            const sourceCols = fetchRes?.columns || (rawRecords.length > 0 ? Object.keys(rawRecords[0]).map(k => ({ name: k, type: typeof rawRecords[0][k] === 'number' ? 'NUMBER' : 'TEXT' })) : []);

            // 3. Schema Mapping
            const SchemaMapper = window.UDIP?.Integrations?.SchemaMapper || (typeof require !== 'undefined' ? require('./schema-mapper') : null);
            const mappingRes = SchemaMapper ? SchemaMapper.mapSchema(sourceCols, mappingConfig?.targetSchema) : { mappings: null, warnings: [] };

            // 4. Normalization (Non-destructive)
            const Normalizer = window.UDIP?.Integrations?.Normalizer || (typeof require !== 'undefined' ? require('./normalizer') : null);
            let normalizedBatch;
            if (Normalizer) {
                normalizedBatch = Normalizer.normalizeBatch(rawRecords, mappingRes.mappings, { trimStrings: true });
            } else {
                normalizedBatch = { records: rawRecords.slice(), rejected: [], stats: { totalRows: rawRecords.length, acceptedRows: rawRecords.length } };
            }

            // 5. Ingestion Validation
            const IngestionValidator = window.UDIP?.Integrations?.IngestionValidator || (typeof require !== 'undefined' ? require('./ingestion-validator') : null);
            let validationRes;
            if (IngestionValidator) {
                validationRes = IngestionValidator.validate(normalizedBatch.records, mappingRes.mappings, validationRules);
            } else {
                validationRes = { valid: true, accepted: normalizedBatch.records, rejected: [], summary: {} };
            }

            if (!validationRes.valid) {
                const err = new Error(`Ingestion validation failed: error rate ${validationRes.summary.errorRate} exceeded threshold ${validationRules.maxErrorRate || 1.0}`);
                this._audit('INGESTION_VALIDATION_REJECTED', { connectionId, sourceId, summary: validationRes.summary }, actorId, projectId);
                throw err;
            }

            const acceptedRows = validationRes.accepted;
            const schemaDef = mappingRes.mappings?.map(m => ({ name: m.targetColumn, type: m.targetType })) || sourceCols;

            // 6. Dataset Manager & Versioning (Single Source of Truth)
            const dsMgr = window.UDIP?.Enterprise?.DatasetManager;
            const dsVer = window.UDIP?.Enterprise?.DatasetVersioning;
            let datasetId = targetDatasetId;
            let versionId = null;

            if (dsMgr) {
                if (datasetId) {
                    // Create new immutable version for existing dataset
                    if (dsVer) {
                        const version = dsVer.createVersion(datasetId, {
                            rows: acceptedRows,
                            rowCount: acceptedRows.length,
                            columnCount: schemaDef.length,
                            schema: schemaDef,
                            source: 'EXTERNAL_INTEGRATION',
                            connectionId,
                            sourceId
                        }, `Ingested ${acceptedRows.length} rows from ${connectionId || 'external source'}`, actorId);
                        versionId = version.id || version.versionId;
                    }
                } else {
                    // Register new dataset in project
                    const createdDs = dsMgr.registerDataset({
                        name: datasetName || `Source_${sourceId || connectionId || 'Ingestion'}`,
                        sourceType: 'EXTERNAL_INTEGRATION',
                        rows: acceptedRows,
                        rowCount: acceptedRows.length,
                        columnCount: schemaDef.length,
                        schema: schemaDef
                    }, projectId, actorId);
                    datasetId = createdDs.id;
                    versionId = createdDs.currentVersionId;
                }
            } else {
                // Fallback mock dataset ID for isolated testing
                datasetId = datasetId || `ds_mock_${Date.now()}`;
                versionId = `ver_${datasetId}_1`;
            }

            const durationMs = Date.now() - startTime;

            // 7. Lineage Tracking
            let lineageId = null;
            const lineageMgr = window.UDIP?.Integrations?.LineageManager;
            if (lineageMgr && typeof lineageMgr.recordLineage === 'function') {
                const lineageEntry = lineageMgr.recordLineage({
                    connectionId,
                    sourceId,
                    connectorType: connector.type,
                    datasetId,
                    versionId,
                    rowCount: acceptedRows.length,
                    rejectedCount: validationRes.rejected.length,
                    durationMs,
                    projectId
                });
                lineageId = lineageEntry?.id || null;
            }

            // 8. Metrics & Source Update
            const sourceReg = window.UDIP?.Integrations?.SourceRegistry;
            if (sourceReg && sourceId && typeof sourceReg.recordSync === 'function') {
                sourceReg.recordSync(sourceId, {
                    success: true,
                    rowCount: acceptedRows.length,
                    versionId,
                    durationMs
                });
            }

            const metrics = window.UDIP?.Integrations?.IntegrationMetrics;
            if (metrics && typeof metrics.recordIngestion === 'function') {
                metrics.recordIngestion({
                    connectionId,
                    sourceId,
                    rows: acceptedRows.length,
                    durationMs,
                    success: true
                });
            }

            // 9. Audit Logging
            this._audit('INGESTION_COMPLETED', {
                connectionId,
                sourceId,
                datasetId,
                versionId,
                rowsAccepted: acceptedRows.length,
                rowsRejected: validationRes.rejected.length,
                durationMs
            }, actorId, projectId);

            this._lastResult = {
                success: true,
                datasetId,
                versionId,
                rowCount: acceptedRows.length,
                rejectedCount: validationRes.rejected.length,
                cursor: fetchRes?.nextCursor || null,
                lineageId,
                durationMs,
                warnings: mappingRes.warnings
            };

            return this._lastResult;
        }

        _audit(action, metadata, actorId, projectId) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'INTEGRATION_INGESTION',
                        resourceId: metadata.sourceId || metadata.connectionId || 'unknown',
                        projectId,
                        result: action.includes('FAILED') || action.includes('REJECTED') ? 'FAILURE' : 'SUCCESS',
                        metadata
                    });
                }
            } catch (e) {
                // Non-blocking
            }
        }
    }

    const instance = new IngestionEngine();

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.IngestionEngine = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }

})(typeof window !== 'undefined' ? window : global);
