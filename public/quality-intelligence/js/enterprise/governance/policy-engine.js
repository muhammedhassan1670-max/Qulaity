/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/governance/policy-engine.js
 * ============================================================================
 * Configuration-driven Enterprise Policy Engine.
 * Evaluates operational barriers across:
 * - Data Retention & Classification Clearance
 * - Dataset Ownership & Scope
 * - Model Approval & Promotion Thresholds
 * - Export Clearance & Sensitive Data Masking
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DEFAULT_POLICIES = Object.freeze({
        DATA_RETENTION: {
            id: 'pol_retention',
            name: 'Data Retention Schedule',
            enabled: true,
            rules: { maxAgeDays: 90, autoArchive: false }
        },
        DATASET_OWNERSHIP: {
            id: 'pol_ownership',
            name: 'Dataset Ownership & Scope Enforcement',
            enabled: true,
            rules: { requireExplicitOwner: true, allowOrphanedDatasets: false }
        },
        MODEL_APPROVAL: {
            id: 'pol_model_approval',
            name: 'ML Model Promotion & Approval Gates',
            enabled: true,
            rules: { minGovernanceScore: 70, requireValidationPass: true, requireAdminApproval: false }
        },
        EXPORT_PERMISSIONS: {
            id: 'pol_export',
            name: 'Export Clearance & Format Restrictions',
            enabled: true,
            rules: { allowedFormats: ['csv', 'json', 'xlsx', 'html', 'md', 'report', 'benchmark'], blockRestrictedExport: true }
        },
        SENSITIVE_DATA_HANDLING: {
            id: 'pol_sensitive_data',
            name: 'Sensitive & Restricted Data Clearance',
            enabled: true,
            rules: { restrictedRequiresAdmin: true, blockPublicRestricted: true }
        },
        PROJECT_ACCESS: {
            id: 'pol_project_access',
            name: 'Project Membership Isolation',
            enabled: true,
            rules: { isolateNonMembers: true, adminsBypassScope: true }
        },
        AUDIT_RETENTION: {
            id: 'pol_audit_retention',
            name: 'Immutable Audit Trail Protection',
            enabled: true,
            rules: { immutable: true, allowDeletion: false }
        }
    });

    let _policies = JSON.parse(JSON.stringify(DEFAULT_POLICIES));

    const PolicyEngine = {
        /**
         * Get all current governance policies
         * @returns {Object}
         */
        getPolicies() {
            return JSON.parse(JSON.stringify(_policies));
        },

        /**
         * Get specific policy by key
         * @param {string} key
         * @returns {Object|null}
         */
        getPolicy(key) {
            if (!key) return null;
            const norm = String(key).toUpperCase().trim();
            return _policies[norm] ? JSON.parse(JSON.stringify(_policies[norm])) : null;
        },

        /**
         * Update policy rules
         * @param {string} key
         * @param {Object} rules
         * @param {string} [actorId='system']
         * @returns {Object|null}
         */
        setPolicy(key, rules = {}, actorId = 'system') {
            if (!key) return null;
            const norm = String(key).toUpperCase().trim();
            if (!_policies[norm]) return null;

            _policies[norm].rules = { ..._policies[norm].rules, ...rules };

            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action: 'POLICY_CHANGED',
                        resourceType: 'POLICY',
                        resourceId: _policies[norm].id,
                        result: 'SUCCESS',
                        metadata: { policyKey: norm, rules }
                    });
                }
            } catch (e) {
                // Non-blocking
            }

            return JSON.parse(JSON.stringify(_policies[norm]));
        },

        /**
         * Evaluate operational access guards for PermissionEngine
         * @param {Object} user
         * @param {string} permission
         * @param {Object} [resource]
         * @param {Object} [context]
         * @returns {Object} { allowed: boolean, details: string }
         */
        evaluateAccess(user, permission, resource = null, context = {}) {
            // Guard 1: Restricted Data Clearance
            const sensitivePolicy = _policies.SENSITIVE_DATA_HANDLING;
            if (sensitivePolicy && sensitivePolicy.enabled && sensitivePolicy.rules.restrictedRequiresAdmin) {
                if (resource && resource.classification === 'RESTRICTED') {
                    const roles = user.roleIds || [];
                    const hasAdminRole = roles.includes('Owner') || roles.includes('Administrator');
                    if (!hasAdminRole) {
                        return {
                            allowed: false,
                            details: 'Access blocked by policy: RESTRICTED data classification requires Administrator or Owner clearance'
                        };
                    }
                }
            }

            // Guard 2: Export policy
            const exportPolicy = _policies.EXPORT_PERMISSIONS;
            if (exportPolicy && exportPolicy.enabled && permission.startsWith('export.')) {
                if (resource && resource.classification === 'RESTRICTED' && exportPolicy.rules.blockRestrictedExport) {
                    const roles = user.roleIds || [];
                    const isOwner = roles.includes('Owner');
                    if (!isOwner) {
                        return {
                            allowed: false,
                            details: 'Export blocked by policy: RESTRICTED resources can only be exported by enterprise Owners'
                        };
                    }
                }
            }

            // Guard 3: Model Approval requirements
            const modelPolicy = _policies.MODEL_APPROVAL;
            if (modelPolicy && modelPolicy.enabled && (permission === 'model.approve' || permission === 'model.activate')) {
                if (resource && resource.governanceScore < modelPolicy.rules.minGovernanceScore) {
                    return {
                        allowed: false,
                        details: `Model operation blocked by policy: Governance score (${resource.governanceScore}) is below required threshold (${modelPolicy.rules.minGovernanceScore})`
                    };
                }
            }

            return { allowed: true, details: 'Allowed by policy evaluation' };
        },

        /**
         * Reset policies to defaults
         */
        resetToDefaults() {
            _policies = JSON.parse(JSON.stringify(DEFAULT_POLICIES));
        }
    };

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.PolicyEngine = PolicyEngine;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PolicyEngine;
    }
})(typeof window !== 'undefined' ? window : global);
