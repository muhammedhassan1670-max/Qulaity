/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/datasets/dataset-lifecycle.js
 * ============================================================================
 * Enforces dataset state machine transitions:
 * UPLOADED -> PROFILED -> READY -> ANALYZING -> ANALYZED -> ARCHIVED
 * Prevents illegal state skips and requires verifiable transition evidence.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ALLOWED_TRANSITIONS = Object.freeze({
        UPLOADED: ['PROFILED', 'DELETED'],
        PROFILED: ['READY', 'UPLOADED', 'DELETED'],
        READY: ['ANALYZING', 'ARCHIVED', 'DELETED'],
        ANALYZING: ['ANALYZED', 'READY', 'FAILED'],
        ANALYZED: ['READY', 'ARCHIVED', 'DELETED'],
        ARCHIVED: ['READY', 'DELETED'],
        FAILED: ['READY', 'DELETED'],
        DELETED: ['READY'] // Restore
    });

    const DatasetLifecycle = {
        /**
         * Check if a state transition is permitted
         * @param {string} fromStatus
         * @param {string} toStatus
         * @returns {boolean}
         */
        canTransition(fromStatus, toStatus) {
            if (!fromStatus || !toStatus) return false;
            const from = String(fromStatus).toUpperCase().trim();
            const to = String(toStatus).toUpperCase().trim();

            if (from === to) return true; // Idempotent
            const allowed = ALLOWED_TRANSITIONS[from];
            return Array.isArray(allowed) && allowed.includes(to);
        },

        /**
         * Execute a validated lifecycle transition for a dataset
         * @param {string} datasetId
         * @param {string} toStatus
         * @param {string} [actorId='system']
         * @param {Object} [evidence={}]
         * @returns {Object}
         */
        transition(datasetId, toStatus, actorId = 'system', evidence = {}) {
            if (!datasetId || !toStatus) {
                throw new Error('datasetId and target toStatus are required');
            }

            const dsMgr = window.UDIP?.Enterprise?.DatasetManager;
            if (!dsMgr) throw new Error('DatasetManager unavailable');

            const dataset = dsMgr.getDataset(datasetId);
            if (!dataset) throw new Error(`Dataset ${datasetId} not found`);

            const currentStatus = dataset.status || 'UPLOADED';
            const targetStatus = String(toStatus).toUpperCase().trim();

            if (!this.canTransition(currentStatus, targetStatus)) {
                throw new Error(`Illegal lifecycle transition: Cannot move dataset from ${currentStatus} to ${targetStatus}`);
            }

            // Evidence validation guards
            if (targetStatus === 'PROFILED' && (!dataset.schema || dataset.schema.length === 0)) {
                if (!evidence.schema) {
                    throw new Error('Transition to PROFILED requires schema evidence');
                }
            }

            const updated = dsMgr.updateStatus(datasetId, targetStatus, actorId);

            this._audit('LIFECYCLE_TRANSITION', datasetId, dataset.projectId, actorId, {
                fromStatus: currentStatus,
                toStatus: targetStatus,
                evidenceSummary: Object.keys(evidence)
            });

            return {
                datasetId,
                previousStatus: currentStatus,
                currentStatus: targetStatus,
                timestamp: new Date().toISOString()
            };
        },

        _audit(action, datasetId, projectId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'DATASET_LIFECYCLE',
                        resourceId: datasetId,
                        projectId,
                        result: 'SUCCESS',
                        metadata
                    });
                }
            } catch (e) {
                // Non-blocking
            }
        }
    };

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.DatasetLifecycle = DatasetLifecycle;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DatasetLifecycle;
    }
})(typeof window !== 'undefined' ? window : global);
