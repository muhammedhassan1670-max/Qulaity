/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/registry/source-registry.js
 * ============================================================================
 * Data Source Registry.
 * Separates "How we connect" (Connection) from "What data we extract" (Source).
 * Tracks endpoints, tables, extraction policies, and classification tiers.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class SourceRegistry {
        constructor() {
            this._repository = null;
            this._memStore = new Map();
        }

        _getRepo() {
            if (!this._repository) {
                const RepoClass = window.UDIP?.Enterprise?.Repository;
                if (RepoClass) {
                    try {
                        this._repository = new RepoClass('data_sources', 'src');
                    } catch (e) {
                        this._repository = null;
                    }
                }
            }
            return this._repository;
        }

        /**
         * Register a new data source under an existing connection
         * @param {Object} sourceData
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        registerSource(sourceData = {}, actorId = 'system') {
            const connectionId = sourceData.connectionId;
            const name = sourceData.name;
            if (!connectionId || !name) throw new Error('connectionId and source name are required');

            const id = sourceData.id || `src_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const record = {
                id,
                connectionId,
                name,
                location: sourceData.location || '',
                schema: sourceData.schema || null,
                schemaSnapshot: sourceData.schemaSnapshot || [],
                extractionConfig: sourceData.extractionConfig || {},
                refreshPolicy: sourceData.refreshPolicy || { strategy: 'FULL_REFRESH', intervalHours: 24 },
                syncMode: sourceData.syncMode || 'FULL_REFRESH',
                cursorField: sourceData.cursorField || null,
                lastCursorValue: sourceData.lastCursorValue || null,
                classification: sourceData.classification || 'INTERNAL',
                projectId: sourceData.projectId || 'prj_default',
                targetDatasetId: sourceData.targetDatasetId || null,
                ownerId: actorId,
                status: 'ACTIVE',
                lastSyncAt: null,
                lastSyncStatus: 'NEVER_SYNCED',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const repo = this._getRepo();
            if (repo) {
                const created = repo.create(record, actorId);
                record.id = created.id || record.id;
            } else {
                this._memStore.set(record.id, record);
            }

            this._audit('SOURCE_CREATED', record.id, record.projectId, actorId, { name, connectionId });
            return { ...record };
        }

        createSource(sourceData, actorId) {
            return this.registerSource(sourceData, actorId);
        }

        /**
         * Get source by ID
         * @param {string} id
         * @returns {Object|null}
         */
        getSource(id) {
            const repo = this._getRepo();
            if (repo) {
                const found = repo.findById(id);
                return found ? { ...found } : null;
            }
            const mem = this._memStore.get(id);
            return mem ? { ...mem } : null;
        }

        /**
         * Update source definition
         * @param {string} id
         * @param {Object} updates
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        updateSource(id, updates = {}, actorId = 'system') {
            const existing = this.getSource(id);
            if (!existing) return null;

            const sanitized = { ...updates, updatedAt: new Date().toISOString() };
            const repo = this._getRepo();
            if (repo) {
                return repo.update(id, sanitized, actorId);
            }

            const merged = { ...existing, ...sanitized };
            this._memStore.set(id, merged);
            return { ...merged };
        }

        /**
         * Record a sync execution on the source
         * @param {string} id
         * @param {Object} syncResult
         */
        recordSync(id, syncResult = {}) {
            return this.updateSource(id, {
                lastSyncAt: new Date().toISOString(),
                lastSyncStatus: syncResult.success ? 'SUCCESS' : 'FAILED',
                lastSyncRows: syncResult.rowCount || 0,
                lastSyncDurationMs: syncResult.durationMs || 0
            });
        }

        /**
         * List sources by connection or project
         * @param {Object|string} [filter] - { connectionId, projectId } or connectionId string
         * @param {string} [projectId]
         * @returns {Array<Object>}
         */
        listSources(filter = null, projectId = null) {
            let connId = null;
            let prjId = projectId;

            if (typeof filter === 'string') {
                connId = filter;
            } else if (filter && typeof filter === 'object') {
                connId = filter.connectionId || null;
                prjId = filter.projectId || prjId;
            }

            const repo = this._getRepo();
            let all = [];
            if (repo) {
                all = repo.findAll(s => {
                    if (connId && s.connectionId !== connId) return false;
                    if (prjId && s.projectId !== prjId) return false;
                    return true;
                });
            } else {
                all = Array.from(this._memStore.values()).filter(s => {
                    if (connId && s.connectionId !== connId) return false;
                    if (prjId && s.projectId !== prjId) return false;
                    return true;
                });
            }

            return all.map(s => ({ ...s }));
        }

        /**
         * Delete source
         * @param {string} id
         * @param {string} [actorId='system']
         * @returns {boolean}
         */
        deleteSource(id, actorId = 'system') {
            const repo = this._getRepo();
            if (repo) return repo.softDelete(id, actorId);
            return this._memStore.delete(id);
        }

        /**
         * Reset helper for testing
         */
        reset() {
            this._memStore.clear();
        }

        _audit(action, sourceId, projectId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr) {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'DATA_SOURCE',
                        resourceId: sourceId,
                        projectId,
                        result: 'SUCCESS',
                        metadata
                    });
                }
            } catch (e) { /* non-blocking */ }
        }
    }

    const instance = new SourceRegistry();
    instance.SourceRegistry = SourceRegistry;

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.SourceRegistry = instance;
    window.UDIP.Integrations.defaultSourceRegistry = instance;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
