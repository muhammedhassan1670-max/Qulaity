/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/intelligence/analysis-manager.js
 * ============================================================================
 * Central Analysis Registry for completed and ongoing analytical jobs.
 * Links every analysis to a Project, Dataset, and immutable Dataset Version.
 * Statuses: QUEUED | RUNNING | COMPLETED | FAILED | CANCELLED
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ANALYSIS_STATUSES = Object.freeze({
        QUEUED: 'QUEUED',
        RUNNING: 'RUNNING',
        COMPLETED: 'COMPLETED',
        FAILED: 'FAILED',
        CANCELLED: 'CANCELLED'
    });

    class AnalysisManager {
        constructor() {
            this._repository = null;
        }

        _getRepo() {
            if (!this._repository) {
                const RepoClass = window.UDIP?.Enterprise?.Repository;
                if (RepoClass) {
                    this._repository = new RepoClass('analyses', 'anl');
                }
            }
            return this._repository;
        }

        /**
         * Record a completed or running analysis run
         * @param {Object} params
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        recordAnalysis({
            projectId = 'prj_default',
            datasetId,
            datasetVersionId = null,
            analysisPlan = null,
            executionSummary = {},
            resultReferences = {},
            status = 'COMPLETED'
        }, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) throw new Error('Analysis repository unavailable');

            const analysis = repo.create({
                projectId,
                datasetId,
                datasetVersionId,
                analysisPlan,
                executionSummary,
                resultReferences,
                status: ANALYSIS_STATUSES[status] || ANALYSIS_STATUSES.COMPLETED
            }, actorId);

            this._audit('ANALYSIS_RECORDED', analysis.id, projectId, actorId, {
                datasetId,
                datasetVersionId,
                status: analysis.status
            });

            return analysis;
        }

        /**
         * Get analysis by ID
         * @param {string} id
         * @returns {Object|null}
         */
        getAnalysis(id) {
            const repo = this._getRepo();
            return repo ? repo.findById(id) : null;
        }

        /**
         * Update analysis status
         * @param {string} id
         * @param {string} status
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        updateStatus(id, status, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return null;

            const updated = repo.update(id, {
                status: ANALYSIS_STATUSES[status] || status
            }, actorId);

            if (updated) {
                this._audit('ANALYSIS_STATUS_UPDATED', id, updated.projectId, actorId, { status });
            }
            return updated;
        }

        /**
         * List analyses with optional project/dataset filtering
         * @param {string} [projectId]
         * @param {string} [datasetId]
         * @returns {Array<Object>}
         */
        listAnalyses(projectId = null, datasetId = null) {
            const repo = this._getRepo();
            if (!repo) return [];

            return repo.findAll(a => {
                if (projectId && a.projectId !== projectId) return false;
                if (datasetId && a.datasetId !== datasetId) return false;
                return true;
            });
        }

        _audit(action, analysisId, projectId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'ANALYSIS',
                        resourceId: analysisId,
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

    const instance = new AnalysisManager();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.AnalysisManager = instance;
    window.UDIP.Enterprise.ANALYSIS_STATUSES = ANALYSIS_STATUSES;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
