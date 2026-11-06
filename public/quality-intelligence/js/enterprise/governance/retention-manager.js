/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/governance/retention-manager.js
 * ============================================================================
 * Evaluates enterprise data retention schedules and identifies stale or
 * expired datasets, versions, and audit logs according to retention policies.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class RetentionManager {
        /**
         * Get default retention days from configuration
         * @returns {number}
         */
        getRetentionDays() {
            const cfg = window.UDIP?.Enterprise?.EnterpriseConfig;
            return cfg ? cfg.get('retentionDays') || 90 : 90;
        }

        /**
         * Evaluate resource age against retention threshold
         * @param {Object} resource
         * @param {number} [customRetentionDays]
         * @returns {Object}
         */
        evaluateResource(resource, customRetentionDays = null) {
            if (!resource) return { expired: false, ageDays: 0 };
            const retentionDays = customRetentionDays || this.getRetentionDays();

            const createdAt = new Date(resource.createdAt || resource.timestamp || Date.now());
            const now = new Date();
            const ageMs = now - createdAt;
            const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

            return {
                resourceId: resource.id || resource.eventId,
                ageDays,
                retentionThresholdDays: retentionDays,
                expired: ageDays > retentionDays,
                status: resource.status || 'ACTIVE'
            };
        }

        /**
         * Scan repository for expired resources
         * @param {string} repositoryName ('datasets'|'dataset_versions'|'analyses'|'audit_events')
         * @param {number} [customRetentionDays]
         * @returns {Array<Object>}
         */
        findExpired(repositoryName, customRetentionDays = null) {
            const storageReg = window.UDIP?.Enterprise?.StorageAdapter;
            const adapter = storageReg?.getActiveAdapter();
            if (!adapter) return [];

            const items = adapter.list(repositoryName);
            const retentionDays = customRetentionDays || this.getRetentionDays();

            return items
                .map(it => this.evaluateResource(it, retentionDays))
                .filter(res => res.expired);
        }

        /**
         * Archive expired resources by marking them ARCHIVED
         * @param {string} repositoryName
         * @param {string} [actorId='system']
         * @returns {number} Count of archived resources
         */
        archiveExpired(repositoryName, actorId = 'system') {
            const storageReg = window.UDIP?.Enterprise?.StorageAdapter;
            const adapter = storageReg?.getActiveAdapter();
            if (!adapter) return 0;

            const items = adapter.list(repositoryName);
            const retentionDays = this.getRetentionDays();
            let archivedCount = 0;

            for (const item of items) {
                if (item.status === 'ACTIVE') {
                    const evalResult = this.evaluateResource(item, retentionDays);
                    if (evalResult.expired) {
                        adapter.update(repositoryName, item.id, {
                            status: 'ARCHIVED',
                            archivedAt: new Date().toISOString(),
                            archivedBy: actorId,
                            archivedReason: 'Retention policy expiration'
                        });
                        archivedCount++;
                    }
                }
            }

            return archivedCount;
        }
    }

    const instance = new RetentionManager();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.RetentionManager = instance;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
