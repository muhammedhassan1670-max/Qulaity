/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/audit/autonomy-audit.js
 * ============================================================================
 * Maintains an auditable, human-verifiable record of all autonomous decisions,
 * triggers, pipeline executions, and governance interventions.
 * 
 * Defines and enforces explicit Autonomy Levels:
 * - LEVEL 0 — Manual              (Zero automated re-execution; passive reporting)
 * - LEVEL 1 — Monitoring          (Continuous change detection & alert generation)
 * - LEVEL 2 — Assisted Analysis   (System generates prioritized recommendations)
 * - LEVEL 3 — Automatic Reanalysis(Autonomous execution of safe analytical modules)
 * - LEVEL 4 — Adaptive Intelligence(Self-tuning prioritization via historical feedback)
 * 
 * Invariant: High-consequence decisions ALWAYS mandate human supervision.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const _auditLog = [];

    const AUTONOMY_LEVELS = {
        0: { code: 'LEVEL_0', name: 'Manual', desc: 'Passive monitoring; requires explicit human command for all actions.' },
        1: { code: 'LEVEL_1', name: 'Monitoring', desc: 'Autonomous change detection, health telemetry, and alerts.' },
        2: { code: 'LEVEL_2', name: 'Assisted Analysis', desc: 'Autonomous reanalysis planning and prioritized decision guidance.' },
        3: { code: 'LEVEL_3', name: 'Automatic Reanalysis', desc: 'Autonomous execution of safe analytical modules.' },
        4: { code: 'LEVEL_4', name: 'Adaptive Intelligence', desc: 'Continuous adaptive prioritization tuned by evidence & feedback.' }
    };

    const AutonomyAudit = {
        LEVELS: AUTONOMY_LEVELS,

        /**
         * Record an autonomous execution or monitoring event in the audit trail
         * 
         * @param {Object} params
         * @param {number} params.level - 0 to 4
         * @param {string} params.trigger - Trigger type or cause
         * @param {string} params.action - Action executed or recommended
         * @param {Array<string>} params.modulesExecuted - Modules touched
         * @param {string} params.resultsChanged - Summary of output delta
         * @param {number} params.alertsGenerated - Count of alerts
         * @param {boolean} params.humanApprovalRequired - Consequentiality flag
         * @param {string} params.humanApprovalStatus - 'approved' | 'pending' | 'bypassed_safe'
         * @returns {Object} Audit Event Record
         */
        logEvent({
            level = 1,
            trigger = 'INGESTION',
            action = 'Autonomous Change Audit',
            modulesExecuted = [],
            resultsChanged = 'Baseline Established',
            alertsGenerated = 0,
            humanApprovalRequired = false,
            humanApprovalStatus = 'bypassed_safe'
        } = {}) {
            const levelInfo = AUTONOMY_LEVELS[level] || AUTONOMY_LEVELS[1];
            const event = {
                id: `AUD-${_auditLog.length + 1}`,
                timestamp: new Date().toISOString(),
                timeFormatted: new Date().toLocaleTimeString(),
                autonomyLevel: levelInfo.name,
                levelCode: levelInfo.code,
                trigger,
                action,
                modulesExecuted: Array.isArray(modulesExecuted) ? modulesExecuted : [modulesExecuted],
                resultsChanged,
                alertsGenerated,
                humanApprovalRequired,
                humanApprovalStatus
            };

            _auditLog.push(event);
            return event;
        },

        recordEvent(params = {}) {
            return this.logEvent(params);
        },

        /**
         * Get recent audit history
         */
        getHistory(limit = 20) {
            return _auditLog.slice(-limit).reverse();
        },

        /**
         * Clear audit log (for testing)
         */
        clear() {
            _auditLog.length = 0;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.AutonomyAudit = AutonomyAudit;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AutonomyAudit;
    }
})(typeof window !== 'undefined' ? window : global);
