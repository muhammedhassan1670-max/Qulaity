/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/datasets/dataset-manager.js
 * ============================================================================
 * Central Dataset Registry for enterprise projects.
 * Tracks dataset lifecycle:
 * UPLOADED -> PROFILED -> READY -> ANALYZING -> ANALYZED -> ARCHIVED
 * Maintains current version pointer and enforces project-level dataset ownership.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DATASET_STATUSES = Object.freeze({
        UPLOADED: 'UPLOADED',
        PROFILED: 'PROFILED',
        READY: 'READY',
        ANALYZING: 'ANALYZING',
        ANALYZED: 'ANALYZED',
        ARCHIVED: 'ARCHIVED',
        DELETED: 'DELETED'
    });

    class DatasetManager {
        constructor() {
            this._repository = null;
        }

        _getRepo() {
            if (!this._repository) {
                const RepoClass = window.UDIP?.Enterprise?.Repository;
                if (RepoClass) {
                    this._repository = new RepoClass('datasets', 'ds');
                }
            }
            return this._repository;
        }

        /**
         * Register a new dataset in an enterprise project
         * @param {Object} datasetObj Raw/parsed dataset or profile
         * @param {string} [projectId='prj_default']
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        registerDataset(datasetObj = {}, projectId = 'prj_default', actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) throw new Error('Dataset repository unavailable');

            const name = datasetObj.name || datasetObj.filename || 'Untitled Dataset';
            const rowCount = datasetObj.rowCount || datasetObj.rows?.length || datasetObj.profile?.dataset?.rowCount || 0;
            const columnCount = datasetObj.columnCount || datasetObj.columns?.length || datasetObj.profile?.dataset?.columnCount || 0;
            const schema = datasetObj.schema || (datasetObj.columns ? datasetObj.columns.map(c => typeof c === 'string' ? { name: c, type: 'UNKNOWN' } : c) : []);
            const fingerprint = datasetObj.fingerprint || datasetObj.profile?.fingerprint || ('fp_' + Math.random().toString(36).substr(2, 9));

            const ds = repo.create({
                name,
                description: datasetObj.description || `Enterprise dataset: ${name}`,
                sourceType: datasetObj.sourceType || 'FILE_UPLOAD',
                projectId,
                ownerId: actorId,
                schema,
                rowCount,
                columnCount,
                fingerprint,
                currentVersionId: null,
                classification: datasetObj.classification || 'INTERNAL',
                status: DATASET_STATUSES.READY
            }, actorId);

            // Automatically create initial Version 1
            const versioning = window.UDIP?.Enterprise?.DatasetVersioning;
            if (versioning) {
                const v1 = versioning.createVersion(ds.id, {
                    rowCount,
                    columnCount,
                    schema,
                    fingerprint,
                    dataRef: datasetObj
                }, 'Initial dataset registration (v1)', actorId);

                const chosenVerId = v1.id || v1.versionId;
                repo.update(ds.id, { currentVersionId: chosenVerId }, actorId);
                ds.currentVersionId = chosenVerId;
            }

            this._audit('DATASET_CREATED', ds.id, projectId, actorId, { name, rowCount, columnCount });
            return ds;
        }

        /**
         * Get dataset by ID
         * @param {string} id
         * @param {boolean} [includeDeleted=false]
         * @returns {Object|null}
         */
        getDataset(id, includeDeleted = false) {
            const repo = this._getRepo();
            return repo ? repo.findById(id, includeDeleted) : null;
        }

        /**
         * List datasets for a project with optional user filtering
         * @param {string} [projectId]
         * @param {Object} [user]
         * @returns {Array<Object>}
         */
        listDatasets(projectId = null, user = null) {
            const repo = this._getRepo();
            if (!repo) return [];

            const list = repo.findAll(ds => {
                if (projectId && ds.projectId !== projectId) return false;
                return true;
            });

            if (!user) return list;

            // Permission filter
            const permEngine = window.UDIP?.Enterprise?.PermissionEngine;
            if (!permEngine) return list;

            return list.filter(ds => permEngine.can(user, 'dataset.read', ds).allowed);
        }

        /**
         * Update dataset status
         * @param {string} id
         * @param {string} status
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        updateStatus(id, status, actorId = 'system') {
            if (!DATASET_STATUSES[status]) {
                throw new Error(`Invalid status: ${status}`);
            }
            const repo = this._getRepo();
            if (!repo) return null;

            const updated = repo.update(id, { status }, actorId);
            if (updated) {
                this._audit('DATASET_STATUS_CHANGED', id, updated.projectId, actorId, { status });
            }
            return updated;
        }

        /**
         * Archive dataset
         * @param {string} id
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        archiveDataset(id, actorId = 'system') {
            return this.updateStatus(id, DATASET_STATUSES.ARCHIVED, actorId);
        }

        /**
         * Soft delete dataset
         * @param {string} id
         * @param {string} [actorId='system']
         * @returns {boolean}
         */
        deleteDataset(id, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return false;

            const existing = repo.findById(id);
            const success = repo.softDelete(id, actorId);
            if (success) {
                this._audit('DATASET_DELETED', id, existing?.projectId, actorId, { softDelete: true });
            }
            return success;
        }

        _audit(action, datasetId, projectId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'DATASET',
                        resourceId: datasetId,
                        projectId,
                        result: 'SUCCESS',
                        metadata
                    });
                }
            } catch (e) {
                // Non-blocking
            }
        }
    }

    const instance = new DatasetManager();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.DatasetManager = instance;
    window.UDIP.Enterprise.DATASET_STATUSES = DATASET_STATUSES;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
