/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/datasets/dataset-versioning.js
 * ============================================================================
 * Immutable Dataset Versioning Tree:
 * Dataset -> v1, v2, v3, ...
 * Every update creates an append-only, immutable version snapshot.
 * Invariant: Never overwrite an existing immutable dataset version.
 * Integrates Step 6 VersionComparator for deep cross-version analytical audits.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class DatasetVersioning {
        constructor() {
            this._repository = null;
        }

        _getRepo() {
            if (!this._repository) {
                const RepoClass = window.UDIP?.Enterprise?.Repository;
                if (RepoClass) {
                    this._repository = new RepoClass('dataset_versions', 'dsv');
                }
            }
            return this._repository;
        }

        /**
         * Create a new immutable version for a dataset
         * @param {string} datasetId
         * @param {Object} payload
         * @param {string} [changeSummary='Dataset version update']
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        createVersion(datasetId, payload = {}, changeSummary = 'Dataset version update', actorId = 'system') {
            if (!datasetId) throw new Error('datasetId is required to create a version');
            const repo = this._getRepo();
            if (!repo) throw new Error('Dataset version repository unavailable');

            // Determine next version number
            const existingVersions = this.listVersions(datasetId);
            const nextVersionNumber = existingVersions.length + 1;
            const versionTag = `v${nextVersionNumber}`;

            const rowCount = payload.rowCount ?? payload.rows?.length ?? 0;
            const columnCount = payload.columnCount ?? payload.columns?.length ?? 0;
            const schema = payload.schema || (payload.columns ? payload.columns.map(c => typeof c === 'string' ? { name: c, type: 'UNKNOWN' } : c) : []);
            const fingerprint = payload.fingerprint || ('fp_' + Math.random().toString(36).substr(2, 9));
            const schemaFingerprint = 'sfp_' + schema.map(s => (s.name || s) + ':' + (s.type || '')).join('|');

            const versionEntity = repo.create({
                versionId: `ver_${datasetId}_v${nextVersionNumber}`,
                datasetId,
                versionNumber: nextVersionNumber,
                versionTag,
                fingerprint,
                schemaFingerprint,
                rowCount,
                columnCount,
                schema,
                changeSummary,
                dataSnapshot: payload.dataRef || null,
                profileSnapshot: payload.profile || null,
                status: 'ACTIVE'
            }, actorId);

            // Update dataset pointer
            const dsMgr = window.UDIP?.Enterprise?.DatasetManager;
            if (dsMgr) {
                const ds = dsMgr.getDataset(datasetId);
                if (ds) {
                    dsMgr._getRepo()?.update(datasetId, {
                        currentVersionId: versionEntity.id,
                        rowCount,
                        columnCount,
                        fingerprint
                    }, actorId);
                }
            }

            this._audit('DATASET_VERSION_CREATED', versionEntity.id, datasetId, actorId, {
                versionNumber: nextVersionNumber,
                changeSummary,
                rowCount,
                columnCount
            });

            return versionEntity;
        }

        /**
         * Get a version by ID or version tag
         * @param {string} versionId
         * @returns {Object|null}
         */
        getVersion(versionId) {
            if (!versionId) return null;
            const repo = this._getRepo();
            if (!repo) return null;
            const byId = repo.findById(versionId);
            if (byId) return byId;
            const list = repo.findAll(v => v.versionId === versionId || v.id === versionId || v.versionTag === versionId);
            return list.length > 0 ? list[0] : null;
        }

        /**
         * List all immutable versions for a dataset in chronological order
         * @param {string} datasetId
         * @returns {Array<Object>}
         */
        listVersions(datasetId) {
            const repo = this._getRepo();
            if (!repo) return [];
            return repo.findAll(v => v.datasetId === datasetId)
                       .sort((a, b) => a.versionNumber - b.versionNumber);
        }

        /**
         * Compare two dataset versions
         * Integrates Step 6's VersionComparator if available, or produces structural diff
         * @param {string} versionIdA Earlier version
         * @param {string} versionIdB Later version
         * @returns {Object} Comparison report
         */
        compareVersions(versionIdA, versionIdB) {
            const vA = this.getVersion(versionIdA);
            const vB = this.getVersion(versionIdB);

            if (!vA || !vB) {
                throw new Error('Both version records must exist to perform comparison');
            }

            // If Step 6 VersionComparator is available and snapshots exist
            const comparator = window.UDIP?.Workspace?.VersionComparator;
            if (comparator && (vA.profileSnapshot || vB.profileSnapshot)) {
                return comparator.compare({
                    currentDataset: { rowCount: vB.rowCount, columnCount: vB.columnCount },
                    previousDataset: { rowCount: vA.rowCount, columnCount: vA.columnCount },
                    currentProfile: vB.profileSnapshot || { dataset: { rowCount: vB.rowCount, columnCount: vB.columnCount } },
                    previousProfile: vA.profileSnapshot || { dataset: { rowCount: vA.rowCount, columnCount: vA.columnCount } }
                });
            }

            // Direct structural & schema delta
            const rowDelta = vB.rowCount - vA.rowCount;
            const colDelta = vB.columnCount - vA.columnCount;

            const colsA = (vA.schema || []).map(s => s.name || s);
            const colsB = (vB.schema || []).map(s => s.name || s);

            const addedColumns = colsB.filter(c => !colsA.includes(c));
            const removedColumns = colsA.filter(c => !colsB.includes(c));
            const retainedColumns = colsB.filter(c => colsA.includes(c));

            return {
                versionA: { id: vA.id, versionNumber: vA.versionNumber, tag: vA.versionTag },
                versionB: { id: vB.id, versionNumber: vB.versionNumber, tag: vB.versionTag },
                rowComparison: {
                    previous: vA.rowCount,
                    current: vB.rowCount,
                    delta: rowDelta,
                    percentChange: vA.rowCount > 0 ? ((rowDelta / vA.rowCount) * 100).toFixed(2) + '%' : 'N/A'
                },
                columnComparison: {
                    previous: vA.columnCount,
                    current: vB.columnCount,
                    delta: colDelta,
                    added: addedColumns,
                    removed: removedColumns,
                    retained: retainedColumns
                },
                fingerprintMatch: vA.fingerprint === vB.fingerprint,
                schemaIdentical: vA.schemaFingerprint === vB.schemaFingerprint,
                evolutionStatus: (rowDelta === 0 && colDelta === 0) ? 'Identical' : (rowDelta >= 0 ? 'Expanded' : 'Reduced')
            };
        }

        _audit(action, versionId, datasetId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'DATASET_VERSION',
                        resourceId: versionId,
                        result: 'SUCCESS',
                        metadata: { datasetId, ...metadata }
                    });
                }
            } catch (e) {
                // Non-blocking
            }
        }
    }

    const instance = new DatasetVersioning();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.DatasetVersioning = instance;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
