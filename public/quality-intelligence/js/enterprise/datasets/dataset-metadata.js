/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/datasets/dataset-metadata.js
 * ============================================================================
 * Metadata classification and column sensitivity tagging.
 * Supports classification tiers:
 * PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED
 * Important: This provides operational metadata classification, not legal
 * or regulatory compliance certification.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const CLASSIFICATION_TIERS = Object.freeze({
        PUBLIC: {
            tier: 'PUBLIC',
            label: 'Public',
            description: 'Freely shareable data without operational or commercial sensitivity.',
            riskLevel: 'LOW'
        },
        INTERNAL: {
            tier: 'INTERNAL',
            label: 'Internal',
            description: 'Standard enterprise business data accessible to all verified members.',
            riskLevel: 'MEDIUM'
        },
        CONFIDENTIAL: {
            tier: 'CONFIDENTIAL',
            label: 'Confidential',
            description: 'Proprietary, commercial, or sensitive operational data requiring project authorization.',
            riskLevel: 'HIGH'
        },
        RESTRICTED: {
            tier: 'RESTRICTED',
            label: 'Restricted',
            description: 'Highly sensitive personal, financial, or security data requiring elevated clearance.',
            riskLevel: 'CRITICAL'
        }
    });

    const SENSITIVITY_TAGS = Object.freeze({
        PII: 'PII',
        FINANCIAL: 'FINANCIAL',
        HEALTH: 'HEALTH',
        SECURITY: 'SECURITY',
        IDENTIFIER: 'IDENTIFIER',
        METRIC: 'METRIC'
    });

    class DatasetMetadata {
        constructor() {
            this._datasetClassifications = new Map();
            this._columnTags = new Map(); // datasetId -> Map(colName -> Set)
        }

        /**
         * Set classification tier for a dataset
         * @param {string} datasetId
         * @param {string} tier (PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED)
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        setClassification(datasetId, tier = 'INTERNAL', actorId = 'system') {
            if (!datasetId) throw new Error('datasetId is required');
            const normalized = String(tier).toUpperCase().trim();
            const config = CLASSIFICATION_TIERS[normalized] || CLASSIFICATION_TIERS.INTERNAL;

            this._datasetClassifications.set(datasetId, config);

            // Update in dataset repository if dataset exists
            const dsMgr = window.UDIP?.Enterprise?.DatasetManager;
            if (dsMgr) {
                dsMgr.updateStatus(datasetId, dsMgr.getDataset(datasetId)?.status || 'READY', actorId);
                dsMgr._getRepo()?.update(datasetId, { classification: config.tier }, actorId);
            }

            this._audit('CLASSIFICATION_SET', datasetId, actorId, { tier: config.tier });
            return config;
        }

        /**
         * Get classification tier for a dataset
         * @param {string} datasetId
         * @returns {Object}
         */
        getClassification(datasetId) {
            if (this._datasetClassifications.has(datasetId)) {
                return this._datasetClassifications.get(datasetId);
            }
            const dsMgr = window.UDIP?.Enterprise?.DatasetManager;
            const ds = dsMgr?.getDataset(datasetId);
            if (ds && ds.classification && CLASSIFICATION_TIERS[ds.classification]) {
                return CLASSIFICATION_TIERS[ds.classification];
            }
            return CLASSIFICATION_TIERS.INTERNAL;
        }

        /**
         * Tag a column with sensitivity or semantic labels
         * @param {string} datasetId
         * @param {string} columnName
         * @param {string} tag
         * @param {string} [actorId='system']
         */
        tagColumn(datasetId, columnName, tag, actorId = 'system') {
            if (!datasetId || !columnName || !tag) return;
            if (!this._columnTags.has(datasetId)) {
                this._columnTags.set(datasetId, new Map());
            }
            const colMap = this._columnTags.get(datasetId);
            if (!colMap.has(columnName)) {
                colMap.set(columnName, new Set());
            }
            colMap.get(columnName).add(String(tag).toUpperCase().trim());
        }

        /**
         * Get tags for a specific column
         * @param {string} datasetId
         * @param {string} columnName
         * @returns {Array<string>}
         */
        getColumnTags(datasetId, columnName) {
            const colMap = this._columnTags.get(datasetId);
            if (!colMap || !colMap.has(columnName)) return [];
            return Array.from(colMap.get(columnName));
        }

        /**
         * Get all sensitive columns (e.g. tagged PII, FINANCIAL, HEALTH, SECURITY)
         * @param {string} datasetId
         * @returns {Array<Object>}
         */
        getSensitiveColumns(datasetId) {
            const colMap = this._columnTags.get(datasetId);
            if (!colMap) return [];
            const result = [];
            for (const [col, tags] of colMap.entries()) {
                const isSensitive = Array.from(tags).some(t => 
                    t === SENSITIVITY_TAGS.PII || 
                    t === SENSITIVITY_TAGS.FINANCIAL || 
                    t === SENSITIVITY_TAGS.HEALTH || 
                    t === SENSITIVITY_TAGS.SECURITY
                );
                if (isSensitive) {
                    result.push({ column: col, tags: Array.from(tags) });
                }
            }
            return result;
        }

        _audit(action, datasetId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'METADATA_CLASSIFICATION',
                        resourceId: datasetId,
                        result: 'SUCCESS',
                        metadata
                    });
                }
            } catch (e) {
                // Non-blocking
            }
        }
    }

    const instance = new DatasetMetadata();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.DatasetMetadata = instance;
    window.UDIP.Enterprise.CLASSIFICATION_TIERS = CLASSIFICATION_TIERS;
    window.UDIP.Enterprise.SENSITIVITY_TAGS = SENSITIVITY_TAGS;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
