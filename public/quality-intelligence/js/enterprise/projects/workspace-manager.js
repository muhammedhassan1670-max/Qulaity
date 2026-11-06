/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/projects/workspace-manager.js
 * ============================================================================
 * Manages multiple analytical workspaces per project:
 * - Executive Workspace
 * - Analyst Workspace
 * - Investigation Workspace
 * - Model Workspace
 * - Benchmark Workspace
 * Stores lightweight references to intelligence objects without duplicating data.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const WORKSPACE_TYPES = Object.freeze({
        EXECUTIVE: 'Executive Workspace',
        ANALYST: 'Analyst Workspace',
        INVESTIGATION: 'Investigation Workspace',
        MODEL: 'Model Workspace',
        BENCHMARK: 'Benchmark Workspace'
    });

    class WorkspaceManager {
        constructor() {
            this._repository = null;
        }

        _getRepo() {
            if (!this._repository) {
                const RepoClass = window.UDIP?.Enterprise?.Repository;
                if (RepoClass) {
                    this._repository = new RepoClass('workspaces', 'ws');
                }
            }
            return this._repository;
        }

        /**
         * Initialize default workspaces for a given project
         * @param {string} projectId
         * @param {string} [actorId='system']
         * @returns {Array<Object>}
         */
        initDefaultWorkspaces(projectId, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return [];

            const created = [];
            for (const [key, name] of Object.entries(WORKSPACE_TYPES)) {
                const ws = repo.create({
                    projectId,
                    name,
                    type: key,
                    description: `Dedicated ${name} for project ${projectId}`,
                    objectReferences: {
                        datasets: [],
                        analyses: [],
                        models: [],
                        insights: [],
                        investigations: [],
                        reports: []
                    },
                    status: 'ACTIVE'
                }, actorId);
                created.push(ws);
            }
            return created;
        }

        /**
         * Create a workspace
         * @param {Object} wsData
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        createWorkspace({ projectId, name, type = 'ANALYST', description = '' }, actorId = 'system') {
            if (!projectId || !name) throw new Error('projectId and name are required');
            const repo = this._getRepo();
            if (!repo) throw new Error('Workspace repository unavailable');

            const ws = repo.create({
                projectId,
                name,
                type,
                description,
                objectReferences: {
                    datasets: [],
                    analyses: [],
                    models: [],
                    insights: [],
                    investigations: [],
                    reports: []
                },
                status: 'ACTIVE'
            }, actorId);

            this._audit('WORKSPACE_CREATED', ws.id, projectId, actorId, { name, type });
            return ws;
        }

        /**
         * Get workspace by ID
         * @param {string} id
         * @returns {Object|null}
         */
        getWorkspace(id) {
            const repo = this._getRepo();
            return repo ? repo.findById(id) : null;
        }

        /**
         * List workspaces for a project
         * @param {string} projectId
         * @returns {Array<Object>}
         */
        listWorkspaces(projectId) {
            const repo = this._getRepo();
            if (!repo) return [];
            return repo.findAll(w => w.projectId === projectId);
        }

        /**
         * Add a reference to an intelligence object into a workspace
         * @param {string} workspaceId
         * @param {string} refType ('datasets'|'analyses'|'models'|'insights'|'investigations'|'reports')
         * @param {string} refId
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        addReference(workspaceId, refType, refId, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return null;

            const ws = repo.findById(workspaceId);
            if (!ws) return null;

            const refs = ws.objectReferences || {};
            refs[refType] = refs[refType] || [];

            if (!refs[refType].includes(refId)) {
                refs[refType].push(refId);
                return repo.update(workspaceId, { objectReferences: refs }, actorId);
            }
            return ws;
        }

        /**
         * Remove an intelligence reference from a workspace
         * @param {string} workspaceId
         * @param {string} refType
         * @param {string} refId
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        removeReference(workspaceId, refType, refId, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return null;

            const ws = repo.findById(workspaceId);
            if (!ws) return null;

            const refs = ws.objectReferences || {};
            if (Array.isArray(refs[refType])) {
                refs[refType] = refs[refType].filter(id => id !== refId);
                return repo.update(workspaceId, { objectReferences: refs }, actorId);
            }
            return ws;
        }

        /**
         * Soft delete workspace
         * @param {string} id
         * @param {string} [actorId='system']
         * @returns {boolean}
         */
        deleteWorkspace(id, actorId = 'system') {
            const repo = this._getRepo();
            return repo ? repo.softDelete(id, actorId) : false;
        }

        _audit(action, resourceId, projectId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'WORKSPACE',
                        resourceId,
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

    const instance = new WorkspaceManager();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.WorkspaceManager = instance;
    window.UDIP.Enterprise.WORKSPACE_TYPES = WORKSPACE_TYPES;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
