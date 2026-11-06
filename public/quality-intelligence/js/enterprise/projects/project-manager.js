/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/projects/project-manager.js
 * ============================================================================
 * Primary container management for enterprise analytical projects.
 * Organizes datasets, analyses, models, insights, investigations, and reports.
 * Supports DRAFT, ACTIVE, ARCHIVED, and DELETED (soft deletion) lifecycles.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const PROJECT_STATUSES = Object.freeze({
        DRAFT: 'DRAFT',
        ACTIVE: 'ACTIVE',
        ARCHIVED: 'ARCHIVED',
        DELETED: 'DELETED'
    });

    const DEFAULT_PROJECT = {
        id: 'prj_default',
        name: 'Default Enterprise Intelligence Project',
        description: 'Primary default container for enterprise datasets, analyses, and models.',
        organizationId: 'org_default',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z'
    };

    class ProjectManager {
        constructor() {
            this._repository = null;
            this._currentProjectId = 'prj_default';
        }

        _getRepo() {
            if (!this._repository) {
                const RepoClass = window.UDIP?.Enterprise?.Repository;
                if (RepoClass) {
                    this._repository = new RepoClass('projects', 'prj');
                }
            }
            return this._repository;
        }

        /**
         * Initialize Project Manager and seed default project
         */
        init() {
            const repo = this._getRepo();
            if (!repo) return;

            if (repo.count(null, true) === 0) {
                repo.create(DEFAULT_PROJECT, 'system_bootstrap');

                // Seed default membership for admin & analyst
                const mem = window.UDIP?.Enterprise?.ProjectMembership;
                if (mem) {
                    mem.addMember('prj_default', 'usr_admin', 'Owner', 'system_bootstrap');
                    mem.addMember('prj_default', 'usr_analyst', 'Editor', 'system_bootstrap');
                    mem.addMember('prj_default', 'usr_viewer', 'Viewer', 'system_bootstrap');
                    mem.addMember('prj_default', 'usr_auditor', 'Viewer', 'system_bootstrap');
                }

                // Seed default workspaces
                const wsMgr = window.UDIP?.Enterprise?.WorkspaceManager;
                if (wsMgr) {
                    wsMgr.initDefaultWorkspaces('prj_default', 'system_bootstrap');
                }
            }
        }

        /**
         * Create a new project
         * @param {Object} projectData
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        createProject({ name, description = '', organizationId = 'org_default', status = 'ACTIVE' }, actorId = 'system') {
            if (!name) throw new Error('Project name is required');
            const repo = this._getRepo();
            if (!repo) throw new Error('Project repository unavailable');

            const project = repo.create({
                name,
                description,
                organizationId,
                status: PROJECT_STATUSES[status] || PROJECT_STATUSES.ACTIVE
            }, actorId);

            // Assign creator as Owner in membership
            const mem = window.UDIP?.Enterprise?.ProjectMembership;
            if (mem && actorId !== 'system') {
                mem.addMember(project.id, actorId, 'Owner', actorId);
            }

            // Create default workspaces
            const wsMgr = window.UDIP?.Enterprise?.WorkspaceManager;
            if (wsMgr) {
                wsMgr.initDefaultWorkspaces(project.id, actorId);
            }

            this._audit('PROJECT_CREATED', project.id, actorId, { name, organizationId });
            return project;
        }

        /**
         * Get project by ID
         * @param {string} id
         * @param {boolean} [includeDeleted=false]
         * @returns {Object|null}
         */
        getProject(id, includeDeleted = false) {
            const repo = this._getRepo();
            if (!repo) return id === DEFAULT_PROJECT.id ? DEFAULT_PROJECT : null;
            return repo.findById(id, includeDeleted);
        }

        /**
         * Update project details
         * @param {string} id
         * @param {Object} updates
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        updateProject(id, updates = {}, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return null;

            const updated = repo.update(id, updates, actorId);
            if (updated) {
                this._audit('PROJECT_UPDATED', id, actorId, updates);
            }
            return updated;
        }

        /**
         * Archive project
         * @param {string} id
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        archiveProject(id, actorId = 'system') {
            return this.updateProject(id, { status: PROJECT_STATUSES.ARCHIVED }, actorId);
        }

        /**
         * Soft delete project
         * @param {string} id
         * @param {string} [actorId='system']
         * @returns {boolean}
         */
        softDeleteProject(id, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return false;

            const success = repo.softDelete(id, actorId);
            if (success) {
                this._audit('PROJECT_DELETED', id, actorId, { softDelete: true });
            }
            return success;
        }

        /**
         * List projects with optional permission/user filtering
         * @param {Function} [filterFn]
         * @param {Object} [user] If provided, only returns projects user has access to
         * @returns {Array<Object>}
         */
        listProjects(filterFn = null, user = null) {
            const repo = this._getRepo();
            if (!repo) return [DEFAULT_PROJECT];

            const all = repo.findAll(filterFn);
            if (!user) return all;

            const isGlobalAdmin = (user.roleIds || []).some(r => 
                r === 'Owner' || r === 'Administrator' || r === 'role_owner' || r === 'role_admin'
            );
            if (isGlobalAdmin) return all;

            const mem = window.UDIP?.Enterprise?.ProjectMembership;
            if (!mem) return all;

            return all.filter(p => mem.isMember(p.id, user.id));
        }

        /**
         * Get current active project ID
         * @returns {string}
         */
        getActiveProjectId() {
            return this._currentProjectId;
        }

        /**
         * Set current active project ID
         * @param {string} projectId
         */
        setActiveProjectId(projectId) {
            if (projectId) {
                this._currentProjectId = projectId;
            }
        }

        _audit(action, projectId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'PROJECT',
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

    const instance = new ProjectManager();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.ProjectManager = instance;
    window.UDIP.Enterprise.PROJECT_STATUSES = PROJECT_STATUSES;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
