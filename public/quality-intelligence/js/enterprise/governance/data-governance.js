/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/governance/data-governance.js
 * ============================================================================
 * Evaluates enterprise data governance, classification safeguards,
 * sensitive column identification, and data masking guidelines.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DataGovernance = {
        /**
         * Assess governance compliance for a dataset
         * @param {Object} dataset
         * @returns {Object} Governance evaluation report
         */
        assessDataset(dataset) {
            if (!dataset) {
                return { compliant: false, score: 0, issues: ['Dataset not provided'] };
            }

            const issues = [];
            let score = 100;

            // 1. Classification check
            const metaMgr = window.UDIP?.Enterprise?.DatasetMetadata;
            const classification = metaMgr ? metaMgr.getClassification(dataset.id) : { tier: dataset.classification || 'INTERNAL' };

            if (!classification || !classification.tier) {
                issues.push('Dataset lacks formal enterprise data classification');
                score -= 20;
            }

            // 2. Ownership check
            if (!dataset.ownerId) {
                issues.push('Dataset has no identified enterprise owner');
                score -= 15;
            }

            // 3. Schema & Versioning check
            if (!dataset.schema || dataset.schema.length === 0) {
                issues.push('Dataset lacks structured column schema');
                score -= 25;
            }

            if (!dataset.currentVersionId) {
                issues.push('Dataset is missing an active immutable version snapshot');
                score -= 15;
            }

            // 4. Sensitive data scan
            const sensitiveCols = metaMgr ? metaMgr.getSensitiveColumns(dataset.id) : [];
            const hasRestrictedData = classification.tier === 'RESTRICTED';

            return {
                datasetId: dataset.id,
                compliant: score >= 70,
                governanceScore: Math.max(0, score),
                classificationTier: classification.tier,
                sensitiveColumnCount: sensitiveCols.length,
                sensitiveColumns: sensitiveCols,
                requiresElevatedApproval: hasRestrictedData,
                issues
            };
        },

        /**
         * Determine if user has appropriate clearance for a dataset's classification
         * @param {Object} user
         * @param {string} classificationTier
         * @returns {boolean}
         */
        hasClearance(user, classificationTier = 'INTERNAL') {
            if (!user) return false;
            const tier = String(classificationTier).toUpperCase().trim();
            const roles = user.roleIds || [];

            const isOwnerOrAdmin = roles.some(r => r === 'Owner' || r === 'Administrator');
            if (isOwnerOrAdmin) return true;

            switch (tier) {
                case 'PUBLIC':
                case 'INTERNAL':
                    return true;
                case 'CONFIDENTIAL':
                    return roles.includes('Analyst') || roles.includes('Auditor');
                case 'RESTRICTED':
                    // Restricted requires Administrator or Owner clearance
                    return false;
                default:
                    return true;
            }
        }
    };

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.DataGovernance = DataGovernance;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DataGovernance;
    }
})(typeof window !== 'undefined' ? window : global);
