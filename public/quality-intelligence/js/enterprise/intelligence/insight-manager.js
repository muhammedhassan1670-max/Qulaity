/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/intelligence/insight-manager.js
 * ============================================================================
 * Enterprise Insight Registry.
 * Persists and tracks findings across their lifecycle:
 * NEW -> VALIDATED -> ACTIVE -> OUTDATED -> SUPERSEDED -> RETIRED
 * Invariant: Never silently modify historical insights. Updates create explicit
 * superseding relationships with full traceability.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const INSIGHT_STATUSES = Object.freeze({
        NEW: 'NEW',
        VALIDATED: 'VALIDATED',
        ACTIVE: 'ACTIVE',
        OUTDATED: 'OUTDATED',
        SUPERSEDED: 'SUPERSEDED',
        RETIRED: 'RETIRED'
    });

    class InsightManager {
        constructor() {
            this._repository = null;
        }

        _getRepo() {
            if (!this._repository) {
                const RepoClass = window.UDIP?.Enterprise?.Repository;
                if (RepoClass) {
                    this._repository = new RepoClass('insights', 'ins');
                }
            }
            return this._repository;
        }

        /**
         * Register a new analytical insight
         * @param {Object} insightData
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        registerInsight({
            projectId = 'prj_default',
            datasetVersionId = null,
            analysisId = null,
            finding = '',
            category = 'General',
            evidenceReferences = [],
            confidence = 'High',
            uncertainty = 'Calibrated',
            status = 'ACTIVE'
        }, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) throw new Error('Insight repository unavailable');

            const insight = repo.create({
                projectId,
                datasetVersionId,
                analysisId,
                finding,
                category,
                evidenceReferences: Array.isArray(evidenceReferences) ? evidenceReferences : [],
                confidence,
                uncertainty,
                supersededBy: null,
                status: INSIGHT_STATUSES[status] || INSIGHT_STATUSES.ACTIVE
            }, actorId);

            this._audit('INSIGHT_REGISTERED', insight.id, projectId, actorId, {
                category,
                confidence
            });

            return insight;
        }

        /**
         * Validate an insight
         * @param {string} id
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        validateInsight(id, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return null;

            const updated = repo.update(id, {
                status: INSIGHT_STATUSES.VALIDATED,
                validatedBy: actorId,
                validatedAt: new Date().toISOString()
            }, actorId);

            if (updated) {
                this._audit('INSIGHT_VALIDATED', id, updated.projectId, actorId, {});
            }
            return updated;
        }

        /**
         * Supersede an old insight with a new insight
         * Invariant: Never overwrite the old insight, link them explicitly
         * @param {string} oldInsightId
         * @param {string} newInsightId
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        supersedeInsight(oldInsightId, newInsightId, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return null;

            const old = repo.findById(oldInsightId);
            if (!old) return null;

            const updated = repo.update(oldInsightId, {
                status: INSIGHT_STATUSES.SUPERSEDED,
                supersededBy: newInsightId,
                supersededAt: new Date().toISOString()
            }, actorId);

            this._audit('INSIGHT_SUPERSEDED', oldInsightId, old.projectId, actorId, {
                supersededBy: newInsightId
            });

            return updated;
        }

        /**
         * Retire an insight
         * @param {string} id
         * @param {string} reason
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        retireInsight(id, reason = 'No longer valid under current data', actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return null;

            const ins = repo.findById(id);
            if (!ins) return null;

            const updated = repo.update(id, {
                status: INSIGHT_STATUSES.RETIRED,
                retirementReason: reason,
                retiredAt: new Date().toISOString()
            }, actorId);

            this._audit('INSIGHT_RETIRED', id, ins.projectId, actorId, { reason });
            return updated;
        }

        /**
         * Get insight by ID
         * @param {string} id
         * @returns {Object|null}
         */
        getInsight(id) {
            const repo = this._getRepo();
            return repo ? repo.findById(id) : null;
        }

        /**
         * List insights with optional project/dataset filtering
         * @param {string} [projectId]
         * @param {string} [status]
         * @returns {Array<Object>}
         */
        listInsights(projectId = null, status = null) {
            const repo = this._getRepo();
            if (!repo) return [];

            return repo.findAll(i => {
                if (projectId && i.projectId !== projectId) return false;
                if (status && i.status !== status) return false;
                return true;
            });
        }

        _audit(action, insightId, projectId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'INSIGHT',
                        resourceId: insightId,
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

    const instance = new InsightManager();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.InsightManager = instance;
    window.UDIP.Enterprise.INSIGHT_STATUSES = INSIGHT_STATUSES;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
