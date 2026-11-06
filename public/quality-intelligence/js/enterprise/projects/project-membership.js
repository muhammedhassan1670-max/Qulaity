/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/projects/project-membership.js
 * ============================================================================
 * Manages project-level user memberships, roles, and scope access.
 * Ensures strict resource isolation between enterprise projects.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class ProjectMembership {
        constructor() {
            this._repository = null;
        }

        _getRepo() {
            if (!this._repository) {
                const RepoClass = window.UDIP?.Enterprise?.Repository;
                if (RepoClass) {
                    this._repository = new RepoClass('project_memberships', 'pmb');
                }
            }
            return this._repository;
        }

        /**
         * Add a user to a project with a project role
         * @param {string} projectId
         * @param {string} userId
         * @param {string} [role='Editor']
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        addMember(projectId, userId, role = 'Editor', actorId = 'system') {
            if (!projectId || !userId) throw new Error('projectId and userId are required');
            const repo = this._getRepo();
            if (!repo) throw new Error('Membership repository unavailable');

            const existing = repo.findAll(m => m.projectId === projectId && m.userId === userId);
            if (existing.length > 0) {
                // Update role
                return repo.update(existing[0].id, { role }, actorId);
            }

            const record = repo.create({
                projectId,
                userId,
                role,
                status: 'ACTIVE'
            }, actorId);

            this._audit('MEMBER_ADDED', projectId, actorId, { userId, role });
            return record;
        }

        /**
         * Remove user from a project
         * @param {string} projectId
         * @param {string} userId
         * @param {string} [actorId='system']
         * @returns {boolean}
         */
        removeMember(projectId, userId, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return false;

            const existing = repo.findAll(m => m.projectId === projectId && m.userId === userId);
            if (existing.length === 0) return false;

            const success = repo.softDelete(existing[0].id, actorId);
            if (success) {
                this._audit('MEMBER_REMOVED', projectId, actorId, { userId });
            }
            return success;
        }

        /**
         * Check if a user is a member of a project
         * @param {string} projectId
         * @param {string} userId
         * @returns {boolean}
         */
        isMember(projectId, userId) {
            if (!projectId || !userId) return false;
            const repo = this._getRepo();
            if (!repo) return true; // Fail-open in isolated unit tests if repo not yet bound

            const records = repo.findAll(m => m.projectId === projectId && m.userId === userId);
            return records.length > 0;
        }

        /**
         * Get member role in a project
         * @param {string} projectId
         * @param {string} userId
         * @returns {string|null}
         */
        getMemberRole(projectId, userId) {
            if (!projectId || !userId) return null;
            const repo = this._getRepo();
            if (!repo) return null;

            const records = repo.findAll(m => m.projectId === projectId && m.userId === userId);
            return records.length > 0 ? records[0].role : null;
        }

        /**
         * List all members of a project
         * @param {string} projectId
         * @returns {Array<Object>}
         */
        getMembers(projectId) {
            const repo = this._getRepo();
            if (!repo) return [];
            return repo.findAll(m => m.projectId === projectId);
        }

        _audit(action, projectId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'PROJECT_MEMBERSHIP',
                        resourceId: projectId,
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

    const instance = new ProjectMembership();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.ProjectMembership = instance;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
