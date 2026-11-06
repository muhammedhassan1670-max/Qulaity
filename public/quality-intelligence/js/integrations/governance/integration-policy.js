/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/governance/integration-policy.js
 * ============================================================================
 * Pre-execution authorization and clearance barrier.
 * Evaluates actor permissions, project scope isolation, and classification
 * clearance before allowing any connector, sync, or credential operation.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class IntegrationPolicy {
        constructor() {
            this._customRules = [];
        }

        /**
         * Evaluate whether an actor can execute an action on a connection or source
         * @param {string} actorId
         * @param {string} connectionId
         * @param {string} action - 'CONNECT' | 'INGEST' | 'SYNC' | 'DELETE' | 'VIEW'
         * @param {string} [projectId='prj_default']
         * @returns {{ allowed: boolean, reason: string|null }}
         */
        evaluateAccess(actorId = 'system', connectionId = null, action = 'VIEW', projectId = 'prj_default') {
            // System and admin actors are always authorized
            if (actorId === 'system' || actorId === 'admin') {
                return { allowed: true, reason: 'Superuser / system clearance granted' };
            }

            // Check Step 10 RBAC PermissionEngine if present
            const permEngine = window.UDIP?.Enterprise?.PermissionEngine;
            if (permEngine && typeof permEngine.checkPermission === 'function') {
                const requiredPerm = this._mapActionToPermission(action);
                const hasPerm = permEngine.checkPermission(actorId, requiredPerm, projectId);
                if (!hasPerm) {
                    return {
                        allowed: false,
                        reason: `Actor "${actorId}" lacks required permission "${requiredPerm}" in project "${projectId}"`
                    };
                }
            }

            // Check Connection status and project scope if connectionId provided
            if (connectionId) {
                const connReg = window.UDIP?.Integrations?.ConnectionRegistry;
                if (connReg) {
                    const conn = connReg.getConnection(connectionId);
                    if (conn) {
                        if (conn.status === 'DISABLED') {
                            return {
                                allowed: false,
                                reason: `Connection "${connectionId}" is disabled`
                            };
                        }
                        if (conn.projectId && projectId && conn.projectId !== projectId) {
                            return {
                                allowed: false,
                                reason: `Cross-project access forbidden: connection belongs to "${conn.projectId}", request from "${projectId}"`
                            };
                        }
                    }
                }
            }

            // Run any registered custom policies
            for (const rule of this._customRules) {
                const res = rule(actorId, connectionId, action, projectId);
                if (res && res.allowed === false) {
                    return res;
                }
            }

            return { allowed: true, reason: null };
        }

        _mapActionToPermission(action) {
            switch ((action || '').toUpperCase()) {
                case 'VIEW':
                    return 'DATASET_VIEW';
                case 'INGEST':
                case 'SYNC':
                    return 'DATASET_CREATE';
                case 'CONNECT':
                case 'DELETE':
                case 'CONFIGURE':
                    return 'PROJECT_SETTINGS';
                default:
                    return 'DATASET_VIEW';
            }
        }

        /**
         * Register a custom policy validator function
         * @param {Function} ruleFn - (actorId, connectionId, action, projectId) => { allowed: boolean, reason?: string }
         */
        registerCustomRule(ruleFn) {
            if (typeof ruleFn === 'function') {
                this._customRules.push(ruleFn);
            }
        }

        /**
         * Clear custom rules
         */
        reset() {
            this._customRules = [];
        }
    }

    const instance = new IntegrationPolicy();

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.IntegrationPolicy = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            IntegrationPolicy,
            instance
        };
    }

})(typeof window !== 'undefined' ? window : global);
