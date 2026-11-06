/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/governance/audit-manager.js
 * ============================================================================
 * Immutable Enterprise Audit Trail.
 * Captures every security, administrative, analytical, and operational event.
 * Invariant: Audit events are append-only and strictly immutable.
 * Never allow modification or deletion of historical audit records.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class AuditManager {
        constructor() {
            this._repository = null;
        }

        _getRepo() {
            if (!this._repository) {
                const RepoClass = window.UDIP?.Enterprise?.Repository;
                if (RepoClass) {
                    this._repository = new RepoClass('audit_events', 'evt');
                }
            }
            return this._repository;
        }

        /**
         * Log an immutable audit event
         * @param {Object} eventData
         * @returns {Object}
         */
        logEvent({
            actorId = 'system',
            action,
            resourceType = 'GENERAL',
            resourceId = null,
            projectId = 'prj_default',
            result = 'SUCCESS',
            metadata = {}
        }) {
            if (!action) throw new Error('Audit action is required');
            const repo = this._getRepo();
            if (!repo) return null;

            const now = new Date().toISOString();
            const eventId = 'evt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);

            const event = repo.create({
                eventId,
                actorId,
                action: String(action).toUpperCase().trim(),
                resourceType: String(resourceType).toUpperCase().trim(),
                resourceId,
                projectId,
                result: String(result).toUpperCase().trim(),
                metadata: { ...metadata },
                timestamp: now,
                status: 'ACTIVE'
            }, actorId);

            return event;
        }

        /**
         * Query audit events with rich filtering
         * @param {Object} [filter]
         * @returns {Array<Object>}
         */
        queryEvents({
            actorId = null,
            action = null,
            resourceType = null,
            resourceId = null,
            projectId = null,
            result = null,
            limit = 100
        } = {}) {
            const repo = this._getRepo();
            if (!repo) return [];

            const list = repo.findAll(evt => {
                if (actorId && evt.actorId !== actorId) return false;
                if (action && evt.action !== String(action).toUpperCase().trim()) return false;
                if (resourceType && evt.resourceType !== String(resourceType).toUpperCase().trim()) return false;
                if (resourceId && evt.resourceId !== resourceId) return false;
                if (projectId && evt.projectId !== projectId) return false;
                if (result && evt.result !== String(result).toUpperCase().trim()) return false;
                return true;
            });

            // Sort newest first
            list.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));

            return list.slice(0, limit);
        }

        /**
         * List recent audit events for a project
         * @param {string} [projectId]
         * @param {number} [limit=50]
         * @returns {Array<Object>}
         */
        listEvents(projectId = null, limit = 50) {
            return this.queryEvents({ projectId, limit });
        }

        /**
         * Get total audit event count
         * @returns {number}
         */
        count() {
            const repo = this._getRepo();
            return repo ? repo.count() : 0;
        }
    }

    const instance = new AuditManager();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.AuditManager = instance;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
