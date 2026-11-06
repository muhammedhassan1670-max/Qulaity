/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/sync/sync-state.js
 * ============================================================================
 * Tracks synchronization execution state and history.
 * Lifecycle: QUEUED -> RUNNING -> SUCCESS | PARTIAL_SUCCESS | FAILED | CANCELLED
 * ============================================================================
 */

(function (window) {
    'use strict';

    const SYNC_STATUS = Object.freeze({
        QUEUED: 'QUEUED',
        RUNNING: 'RUNNING',
        SUCCESS: 'SUCCESS',
        PARTIAL_SUCCESS: 'PARTIAL_SUCCESS',
        FAILED: 'FAILED',
        CANCELLED: 'CANCELLED'
    });

    class SyncStateTracker {
        constructor() {
            this._jobs = new Map();
            this._history = [];
        }

        /**
         * Create a new sync job
         * @param {Object} params
         * @returns {Object} job
         */
        createJob(params = {}) {
            const jobId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const job = {
                id: jobId,
                sourceId: params.sourceId || null,
                connectionId: params.connectionId || null,
                targetDatasetId: params.targetDatasetId || null,
                syncMode: params.syncMode || 'FULL_REFRESH',
                status: SYNC_STATUS.QUEUED,
                createdAt: new Date().toISOString(),
                startedAt: null,
                completedAt: null,
                durationMs: 0,
                rowCount: 0,
                rejectedCount: 0,
                versionId: null,
                error: null,
                warnings: [],
                metadata: params.metadata || {},
                projectId: params.projectId || 'prj_default',
                actorId: params.actorId || 'system'
            };

            this._jobs.set(jobId, job);
            return { ...job };
        }

        /**
         * Mark job as started
         * @param {string} jobId
         * @returns {Object}
         */
        startJob(jobId) {
            const job = this._jobs.get(jobId);
            if (!job) throw new Error(`Job ${jobId} not found`);

            job.status = SYNC_STATUS.RUNNING;
            job.startedAt = new Date().toISOString();
            return { ...job };
        }

        /**
         * Mark job as completed
         * @param {string} jobId
         * @param {Object} [result]
         * @returns {Object}
         */
        completeJob(jobId, result = {}) {
            const job = this._jobs.get(jobId);
            if (!job) throw new Error(`Job ${jobId} not found`);

            const startTime = job.startedAt ? new Date(job.startedAt).getTime() : Date.now();
            job.completedAt = new Date().toISOString();
            job.durationMs = Date.now() - startTime;
            job.rowCount = result.rowCount ?? result.rowsAccepted ?? 0;
            job.rejectedCount = result.rejectedCount ?? result.rowsRejected ?? 0;
            job.versionId = result.versionId || null;
            job.warnings = result.warnings || [];

            job.status = job.rejectedCount > 0 ? SYNC_STATUS.PARTIAL_SUCCESS : SYNC_STATUS.SUCCESS;
            this._history.unshift({ ...job });
            if (this._history.length > 500) this._history.pop();

            return { ...job };
        }

        /**
         * Mark job as failed
         * @param {string} jobId
         * @param {Error|string} error
         * @returns {Object}
         */
        failJob(jobId, error) {
            const job = this._jobs.get(jobId);
            if (!job) throw new Error(`Job ${jobId} not found`);

            const startTime = job.startedAt ? new Date(job.startedAt).getTime() : Date.now();
            job.completedAt = new Date().toISOString();
            job.durationMs = Date.now() - startTime;
            job.status = SYNC_STATUS.FAILED;
            job.error = error?.message || String(error);

            this._history.unshift({ ...job });
            if (this._history.length > 500) this._history.pop();

            return { ...job };
        }

        /**
         * Get job by ID
         * @param {string} jobId
         * @returns {Object|null}
         */
        getJob(jobId) {
            const job = this._jobs.get(jobId);
            return job ? { ...job } : null;
        }

        /**
         * List jobs with optional filtering
         * @param {Object} [filter]
         * @returns {Array<Object>}
         */
        listJobs(filter = {}) {
            let jobs = Array.from(this._jobs.values());

            if (filter.status) {
                jobs = jobs.filter(j => j.status === filter.status);
            }
            if (filter.sourceId) {
                jobs = jobs.filter(j => j.sourceId === filter.sourceId);
            }
            if (filter.connectionId) {
                jobs = jobs.filter(j => j.connectionId === filter.connectionId);
            }
            if (filter.projectId) {
                jobs = jobs.filter(j => j.projectId === filter.projectId);
            }

            return jobs.map(j => ({ ...j }));
        }

        /**
         * Get recent sync execution history
         * @param {number} [limit=20]
         * @returns {Array<Object>}
         */
        getHistory(limit = 20) {
            return this._history.slice(0, limit);
        }

        /**
         * Clear tracker state (testing utility)
         */
        reset() {
            this._jobs.clear();
            this._history = [];
        }
    }

    const instance = new SyncStateTracker();

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.SYNC_STATUS = SYNC_STATUS;
        window.UDIP.Integrations.SyncState = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            SYNC_STATUS,
            SyncStateTracker,
            instance
        };
    }

})(typeof window !== 'undefined' ? window : global);
