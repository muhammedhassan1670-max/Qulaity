/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/sharing/sharing-manager.js
 * ============================================================================
 * Controlled Resource Sharing.
 * Manages explicit access grants across datasets, reports, workspaces, and models.
 * Invariant: Deny by default; no public links or anonymous sharing by default.
 * Every share and revocation creates an auditable record.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ACCESS_LEVELS = Object.freeze({
        VIEW: 'VIEW',
        EDIT: 'EDIT',
        ADMIN: 'ADMIN'
    });

    class SharingManager {
        constructor() {
            this._repository = null;
        }

        _getRepo() {
            if (!this._repository) {
                const RepoClass = window.UDIP?.Enterprise?.Repository;
                if (RepoClass) {
                    this._repository = new RepoClass('shares', 'shr');
                }
            }
            return this._repository;
        }

        /**
         * Grant explicit access to a resource
         * @param {Object} shareData
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        shareResource({
            resourceType,
            resourceId,
            granteeId,
            accessLevel = 'VIEW',
            expiresAt = null
        }, actorId = 'system') {
            if (!resourceType || !resourceId || !granteeId) {
                throw new Error('resourceType, resourceId, and granteeId are required for sharing');
            }

            const repo = this._getRepo();
            if (!repo) throw new Error('Sharing repository unavailable');

            const level = ACCESS_LEVELS[accessLevel] || ACCESS_LEVELS.VIEW;

            // Check if share already exists
            const existing = repo.findAll(s => 
                s.resourceType === resourceType && 
                s.resourceId === resourceId && 
                s.granteeId === granteeId
            );

            if (existing.length > 0) {
                return repo.update(existing[0].id, { accessLevel: level, expiresAt }, actorId);
            }

            const share = repo.create({
                resourceType: String(resourceType).toUpperCase(),
                resourceId,
                granteeId,
                accessLevel: level,
                expiresAt,
                status: 'ACTIVE'
            }, actorId);

            this._audit('RESOURCE_SHARED', resourceId, actorId, {
                resourceType,
                granteeId,
                accessLevel: level
            });

            return share;
        }

        /**
         * Revoke shared access
         * @param {string} shareId
         * @param {string} [actorId='system']
         * @returns {boolean}
         */
        revokeShare(shareId, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return false;

            const existing = repo.findById(shareId);
            if (!existing) return false;

            const success = repo.softDelete(shareId, actorId);
            if (success) {
                this._audit('RESOURCE_SHARE_REVOKED', existing.resourceId, actorId, {
                    granteeId: existing.granteeId
                });
            }
            return success;
        }

        /**
         * Check if a grantee has explicit shared access
         * @param {string} resourceType
         * @param {string} resourceId
         * @param {string} granteeId
         * @returns {Object|null}
         */
        checkShareAccess(resourceType, resourceId, granteeId) {
            const repo = this._getRepo();
            if (!repo) return null;

            const shares = repo.findAll(s =>
                s.resourceType === String(resourceType).toUpperCase() &&
                s.resourceId === resourceId &&
                s.granteeId === granteeId &&
                s.status === 'ACTIVE'
            );

            if (shares.length === 0) return null;

            const share = shares[0];
            // Check expiry
            if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
                return null;
            }

            return share;
        }

        /**
         * List shares for a resource
         * @param {string} resourceType
         * @param {string} resourceId
         * @returns {Array<Object>}
         */
        listShares(resourceType, resourceId) {
            const repo = this._getRepo();
            if (!repo) return [];

            return repo.findAll(s =>
                s.resourceType === String(resourceType).toUpperCase() &&
                s.resourceId === resourceId &&
                s.status === 'ACTIVE'
            );
        }

        _audit(action, resourceId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'RESOURCE_SHARE',
                        resourceId,
                        result: 'SUCCESS',
                        metadata
                    });
                }
            } catch (e) {
                // Non-blocking
            }
        }
    }

    const instance = new SharingManager();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.SharingManager = instance;
    window.UDIP.Enterprise.ACCESS_LEVELS = ACCESS_LEVELS;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
