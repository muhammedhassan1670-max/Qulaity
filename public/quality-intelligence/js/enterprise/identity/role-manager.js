/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/identity/role-manager.js
 * ============================================================================
 * Role-Based Access Control (RBAC) definitions, role hierarchy, and granular
 * permission checks with hierarchical wildcard expansion.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const CORE_ROLES = Object.freeze({
        Owner: {
            id: 'role_owner',
            name: 'Owner',
            description: 'Full sovereign enterprise authority across all organizations, projects, and resources.',
            permissions: ['*']
        },
        Administrator: {
            id: 'role_admin',
            name: 'Administrator',
            description: 'Platform administration, security, user management, and enterprise governance.',
            permissions: [
                'dataset.*',
                'analysis.*',
                'model.*',
                'insight.*',
                'investigation.*',
                'report.*',
                'project.*',
                'workspace.*',
                'user.*',
                'role.*',
                'audit.*',
                'governance.*',
                'export.*',
                'search.*',
                'copilot.*',
                'benchmark.*'
            ]
        },
        Analyst: {
            id: 'role_analyst',
            name: 'Analyst',
            description: 'Conducts analytics, trains models, explores insights, runs investigations, and exports results.',
            permissions: [
                'dataset.read',
                'dataset.create',
                'dataset.update',
                'dataset.version',
                'analysis.run',
                'analysis.read',
                'analysis.export',
                'model.read',
                'model.create',
                'model.validate',
                'insight.read',
                'insight.create',
                'insight.export',
                'investigation.create',
                'investigation.read',
                'investigation.update',
                'report.create',
                'report.read',
                'report.export',
                'project.read',
                'workspace.read',
                'workspace.create',
                'export.execute',
                'search.execute',
                'copilot.query',
                'copilot.read',
                'benchmark.run',
                'benchmark.read'
            ]
        },
        Viewer: {
            id: 'role_viewer',
            name: 'Viewer',
            description: 'Read-only access to datasets, dashboards, insights, reports, and copilot summaries.',
            permissions: [
                'dataset.read',
                'analysis.read',
                'model.read',
                'insight.read',
                'investigation.read',
                'report.read',
                'project.read',
                'workspace.read',
                'search.execute',
                'copilot.read',
                'benchmark.read'
            ]
        },
        Auditor: {
            id: 'role_auditor',
            name: 'Auditor',
            description: 'Specialized read-only audit inspection across audit logs, governance policies, and historical trails.',
            permissions: [
                'audit.read',
                'governance.read',
                'dataset.read',
                'analysis.read',
                'model.read',
                'insight.read',
                'investigation.read',
                'report.read',
                'project.read',
                'workspace.read',
                'search.execute',
                'copilot.read',
                'benchmark.read'
            ]
        }
    });

    let _customRoles = new Map();

    const RoleManager = {
        /**
         * Get all available roles (core + custom)
         * @returns {Array<Object>}
         */
        getRoles() {
            const list = Object.values(CORE_ROLES).map(r => ({ ...r, isCore: true }));
            for (const r of _customRoles.values()) {
                list.push({ ...r, isCore: false });
            }
            return list;
        },

        /**
         * Get role by ID or Name
         * @param {string} roleIdOrName
         * @returns {Object|null}
         */
        getRole(roleIdOrName) {
            if (!roleIdOrName) return null;
            const norm = String(roleIdOrName).trim();
            // Match core roles
            for (const r of Object.values(CORE_ROLES)) {
                if (r.id === norm || r.name.toLowerCase() === norm.toLowerCase()) {
                    return { ...r, isCore: true };
                }
            }
            // Match custom
            if (_customRoles.has(norm)) {
                return { ..._customRoles.get(norm), isCore: false };
            }
            for (const r of _customRoles.values()) {
                if (r.name.toLowerCase() === norm.toLowerCase()) {
                    return { ...r, isCore: false };
                }
            }
            return null;
        },

        /**
         * Create a custom role
         * @param {Object} roleData
         * @returns {Object}
         */
        createRole({ name, description = '', permissions = [] }) {
            if (!name) throw new Error('Role name is required');
            const id = 'role_' + name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
            const role = {
                id,
                name,
                description,
                permissions: Array.from(new Set(permissions))
            };
            _customRoles.set(id, role);
            return { ...role, isCore: false };
        },

        /**
         * Check if a role possesses a specific permission
         * @param {string|Object} role
         * @param {string} targetPermission
         * @returns {boolean}
         */
        hasPermission(role, targetPermission) {
            const roleObj = typeof role === 'string' ? this.getRole(role) : role;
            if (!roleObj || !roleObj.permissions) return false;
            if (!targetPermission) return false;

            const target = String(targetPermission).trim().toLowerCase();

            return roleObj.permissions.some(perm => {
                const p = String(perm).trim().toLowerCase();
                if (p === '*') return true;
                if (p === target) return true;
                if (p.endsWith('.*')) {
                    const prefix = p.slice(0, -2);
                    return target.startsWith(prefix + '.') || target === prefix;
                }
                return false;
            });
        },

        /**
         * Get aggregated permissions for a list of roles
         * @param {Array<string>} roleIds
         * @returns {Array<string>}
         */
        getPermissionsForRoles(roleIds = []) {
            const perms = new Set();
            for (const rid of roleIds) {
                const r = this.getRole(rid);
                if (r && Array.isArray(r.permissions)) {
                    r.permissions.forEach(p => perms.add(p));
                }
            }
            return Array.from(perms);
        },

        /**
         * Reset custom roles to initial state
         */
        reset() {
            _customRoles.clear();
        }
    };

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.RoleManager = RoleManager;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RoleManager;
    }
})(typeof window !== 'undefined' ? window : global);
