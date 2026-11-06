/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/intelligence/investigation-manager.js
 * ============================================================================
 * Enterprise Investigation Registry.
 * Persists guided and autonomous investigation sessions with questions,
 * hypotheses, evidence trees, decisions, timelines, and conclusions.
 * Fully supports resuming and reopening historical investigations.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const INVESTIGATION_STATUSES = Object.freeze({
        OPEN: 'OPEN',
        IN_PROGRESS: 'IN_PROGRESS',
        RESOLVED: 'RESOLVED',
        ARCHIVED: 'ARCHIVED'
    });

    class InvestigationManager {
        constructor() {
            this._repository = null;
        }

        _getRepo() {
            if (!this._repository) {
                const RepoClass = window.UDIP?.Enterprise?.Repository;
                if (RepoClass) {
                    this._repository = new RepoClass('investigations', 'inv');
                }
            }
            return this._repository;
        }

        /**
         * Create a new investigation
         * @param {Object} data
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        createInvestigation({
            projectId = 'prj_default',
            datasetVersionId = null,
            question = '',
            hypotheses = [],
            evidence = [],
            findings = [],
            decisions = [],
            timeline = [],
            conclusion = ''
        }, actorId = 'system') {
            if (!question) throw new Error('Investigation requires a primary question or inquiry');
            const repo = this._getRepo();
            if (!repo) throw new Error('Investigation repository unavailable');

            const now = new Date().toISOString();
            const inv = repo.create({
                projectId,
                datasetVersionId,
                question,
                hypotheses: Array.isArray(hypotheses) ? hypotheses : [],
                evidence: Array.isArray(evidence) ? evidence : [],
                findings: Array.isArray(findings) ? findings : [],
                decisions: Array.isArray(decisions) ? decisions : [],
                timeline: Array.isArray(timeline) && timeline.length > 0 ? timeline : [{ event: 'Investigation opened', timestamp: now, actorId }],
                conclusion,
                status: INVESTIGATION_STATUSES.OPEN
            }, actorId);

            this._audit('INVESTIGATION_CREATED', inv.id, projectId, actorId, { question });
            return inv;
        }

        /**
         * Update an investigation session
         * @param {string} id
         * @param {Object} updates
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        updateInvestigation(id, updates = {}, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return null;

            const existing = repo.findById(id);
            if (!existing) return null;

            const updatedTimeline = existing.timeline || [];
            if (updates.timelineEvent) {
                updatedTimeline.push({
                    event: updates.timelineEvent,
                    timestamp: new Date().toISOString(),
                    actorId
                });
            }

            const payload = { ...updates, timeline: updatedTimeline };
            delete payload.timelineEvent;

            const updated = repo.update(id, payload, actorId);
            if (updated) {
                this._audit('INVESTIGATION_UPDATED', id, updated.projectId, actorId, {});
            }
            return updated;
        }

        /**
         * Mark investigation as resolved with conclusion
         * @param {string} id
         * @param {string} conclusion
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        resolveInvestigation(id, conclusion = '', actorId = 'system') {
            return this.updateInvestigation(id, {
                status: INVESTIGATION_STATUSES.RESOLVED,
                conclusion,
                resolvedAt: new Date().toISOString(),
                resolvedBy: actorId,
                timelineEvent: `Investigation resolved with conclusion: ${conclusion.substring(0, 80)}...`
            }, actorId);
        }

        /**
         * Reopen a previously resolved or archived investigation
         * @param {string} id
         * @param {string} [reason='Reopened for further inquiry']
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        reopenInvestigation(id, reason = 'Reopened for further inquiry', actorId = 'system') {
            return this.updateInvestigation(id, {
                status: INVESTIGATION_STATUSES.IN_PROGRESS,
                reopenedAt: new Date().toISOString(),
                reopenedBy: actorId,
                timelineEvent: `Investigation reopened: ${reason}`
            }, actorId);
        }

        /**
         * Get investigation by ID
         * @param {string} id
         * @returns {Object|null}
         */
        getInvestigation(id) {
            const repo = this._getRepo();
            return repo ? repo.findById(id) : null;
        }

        /**
         * List investigations with optional project filtering
         * @param {string} [projectId]
         * @returns {Array<Object>}
         */
        listInvestigations(projectId = null) {
            const repo = this._getRepo();
            if (!repo) return [];

            return repo.findAll(inv => {
                if (projectId && inv.projectId !== projectId) return false;
                return true;
            });
        }

        _audit(action, investigationId, projectId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'INVESTIGATION',
                        resourceId: investigationId,
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

    const instance = new InvestigationManager();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.InvestigationManager = instance;
    window.UDIP.Enterprise.INVESTIGATION_STATUSES = INVESTIGATION_STATUSES;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
