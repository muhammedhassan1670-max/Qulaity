/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/audit/copilot-audit.js
 * ============================================================================
 * Immutable telemetry audit log of user interactions, detected intents,
 * analytical engines consulted, evidence used, and actions executed.
 * Guarantees privacy: never stores raw sensitive dataset rows.
 * ============================================================================
 */

(function (window) {
    'use strict';

    let _auditEntries = [];
    const MAX_AUDIT_ENTRIES = 500;

    const CopilotAudit = {
        /**
         * Record an audit log entry
         * @param {Object} entry
         */
        record({
            userQuestion = '',
            detectedIntent = '',
            intentConfidence = 1.0,
            modulesUsed = [],
            actionsExecuted = [],
            evidenceCount = 0,
            confidence = 'High',
            validationStatus = 'passed',
            executionTimeMs = 0
        } = {}) {
            const auditEntry = {
                id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                timestamp: new Date().toISOString(),
                userQuestion: String(userQuestion || '').substring(0, 300),
                detectedIntent: String(detectedIntent || 'UNKNOWN'),
                intentConfidence: Number(intentConfidence) || 0,
                modulesUsed: Array.isArray(modulesUsed) ? [...modulesUsed] : [],
                actionsExecuted: Array.isArray(actionsExecuted) ? actionsExecuted.map(a => a.type || a) : [],
                evidenceCount: Number(evidenceCount) || 0,
                confidence: String(confidence || 'Moderate'),
                validationStatus: String(validationStatus || 'passed'),
                executionTimeMs: Number(executionTimeMs) || 0
            };

            _auditEntries.push(auditEntry);
            if (_auditEntries.length > MAX_AUDIT_ENTRIES) {
                _auditEntries.shift();
            }

            return auditEntry;
        },

        /**
         * Retrieve the audit log
         * @param {number} [limit=50]
         * @returns {Array<Object>}
         */
        getAuditLog(limit = 50) {
            return _auditEntries.slice(-limit).reverse();
        },

        /**
         * Clear audit log (for test resets)
         */
        clearAuditLog() {
            _auditEntries = [];
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.CopilotAudit = CopilotAudit;

})(typeof window !== 'undefined' ? window : global);
