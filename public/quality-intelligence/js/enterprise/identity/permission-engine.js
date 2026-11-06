/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/identity/permission-engine.js
 * ============================================================================
 * Centralized Permission Evaluation Engine.
 * Evaluates authorization requests using:
 * - Least privilege & Deny-by-Default
 * - Explicit explainable evaluation reasons
 * - Resource scope, status, and governance policy barriers
 * ============================================================================
 */

(function (window) {
    'use strict';

    const REASONS = Object.freeze({
        ALLOWED_BY_ROLE: 'ALLOWED_BY_ROLE',
        DENIED_MISSING_PERMISSION: 'DENIED_MISSING_PERMISSION',
        DENIED_RESOURCE_SCOPE: 'DENIED_RESOURCE_SCOPE',
        DENIED_POLICY: 'DENIED_POLICY',
        DENIED_RESOURCE_STATE: 'DENIED_RESOURCE_STATE',
        DENIED_UNAUTHENTICATED: 'DENIED_UNAUTHENTICATED'
    });

    const PermissionEngine = {
        REASONS,

        /**
         * Evaluate whether a user is authorized to perform a permission on a resource
         * @param {Object} user User profile object
         * @param {string} permission Target permission string (e.g. 'dataset.read')
         * @param {Object} [resource] Target resource entity
         * @param {Object} [context] Additional contextual metadata
         * @returns {Object} Evaluation verdict
         */
        can(user, permission, resource = null, context = {}) {
            const actorId = user ? user.id : null;
            const resourceId = resource ? resource.id : null;

            // 1. Authenticated & Active State Validation
            if (!user) {
                return {
                    allowed: false,
                    reason: REASONS.DENIED_UNAUTHENTICATED,
                    permission,
                    resourceId,
                    actorId: null
                };
            }

            if (user.status && user.status !== 'ACTIVE') {
                return {
                    allowed: false,
                    reason: REASONS.DENIED_RESOURCE_STATE,
                    permission,
                    resourceId,
                    actorId
                };
            }

            // 2. Resource Lifecycle State Verification
            if (resource && resource.status === 'DELETED') {
                const isAdmin = (user.roleIds || []).some(r => r === 'Owner' || r === 'Administrator');
                const isRestoreOp = permission === 'resource.restore' || permission.endsWith('.restore');
                if (!isAdmin && !isRestoreOp) {
                    return {
                        allowed: false,
                        reason: REASONS.DENIED_RESOURCE_STATE,
                        permission,
                        resourceId,
                        actorId
                    };
                }
            }

            // 3. Project / Resource Scope Isolation
            const isOwnerOrAdmin = (user.roleIds || []).some(r => 
                r === 'Owner' || r === 'Administrator' || r === 'role_owner' || r === 'role_admin'
            );

            if (resource && resource.projectId && !isOwnerOrAdmin) {
                const membershipMgr = window.UDIP?.Enterprise?.ProjectMembership;
                if (membershipMgr && typeof membershipMgr.isMember === 'function') {
                    const isMember = membershipMgr.isMember(resource.projectId, user.id);
                    if (!isMember) {
                        return {
                            allowed: false,
                            reason: REASONS.DENIED_RESOURCE_SCOPE,
                            permission,
                            resourceId,
                            actorId
                        };
                    }
                }
            }

            // 4. Role Permission Check
            const roleMgr = window.UDIP?.Enterprise?.RoleManager;
            let rolePermitted = false;

            if (roleMgr && Array.isArray(user.roleIds)) {
                for (const rid of user.roleIds) {
                    if (roleMgr.hasPermission(rid, permission)) {
                        rolePermitted = true;
                        break;
                    }
                }
            }

            if (!rolePermitted) {
                return {
                    allowed: false,
                    reason: REASONS.DENIED_MISSING_PERMISSION,
                    permission,
                    resourceId,
                    actorId
                };
            }

            // 5. Governance Policy Checks (e.g. RESTRICTED classification)
            const policyEngine = window.UDIP?.Enterprise?.PolicyEngine;
            if (policyEngine && typeof policyEngine.evaluateAccess === 'function') {
                const policyVerdict = policyEngine.evaluateAccess(user, permission, resource, context);
                if (policyVerdict && !policyVerdict.allowed) {
                    return {
                        allowed: false,
                        reason: REASONS.DENIED_POLICY,
                        permission,
                        resourceId,
                        actorId,
                        policyDetails: policyVerdict.details
                    };
                }
            }

            // All guards passed
            return {
                allowed: true,
                reason: REASONS.ALLOWED_BY_ROLE,
                permission,
                resourceId,
                actorId
            };
        },

        /**
         * Convenience assertion helper: throws if forbidden
         * @param {Object} user
         * @param {string} permission
         * @param {Object} [resource]
         */
        assert(user, permission, resource = null) {
            const verdict = this.can(user, permission, resource);
            if (!verdict.allowed) {
                const err = new Error(`Access Denied: ${verdict.reason} for permission "${permission}" on resource "${resource?.id || 'general'}"`);
                err.verdict = verdict;
                throw err;
            }
            return verdict;
        }
    };

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.PermissionEngine = PermissionEngine;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PermissionEngine;
    }
})(typeof window !== 'undefined' ? window : global);
