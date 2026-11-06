/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/actions/workspace-actions.js
 * ============================================================================
 * Generates and executes directives for controlling the Workspace UI:
 * - OPEN_EXECUTIVE_MODE
 * - OPEN_ANALYST_MODE
 * - OPEN_EVIDENCE_MODE
 * - SELECT_FINDING
 * - OPEN_EVIDENCE_DRAWER
 * - OPEN_TIMELINE
 * - OPEN_COMPARISON
 * - OPEN_INVESTIGATION
 * ============================================================================
 */

(function (window) {
    'use strict';

    const WorkspaceActions = {
        /**
         * Create an actionable UI directive object
         * @param {string} type
         * @param {Object} payload
         * @returns {Object}
         */
        createDirective(type, payload = {}) {
            return {
                id: 'dir_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                type: type,
                payload: payload,
                timestamp: new Date().toISOString()
            };
        },

        /**
         * Execute a directive on the active client workspace state
         * @param {Object} directive
         */
        executeDirective(directive) {
            if (!directive || !directive.type) return false;
            const wsState = window.UDIP?.Workspace?.WorkspaceState;

            switch (directive.type) {
                case 'OPEN_EXECUTIVE_MODE':
                    if (wsState?.setMode) wsState.setMode('EXECUTIVE');
                    break;
                case 'OPEN_ANALYST_MODE':
                    if (wsState?.setMode) wsState.setMode('ANALYST');
                    break;
                case 'OPEN_EVIDENCE_MODE':
                    if (wsState?.setMode) wsState.setMode('EVIDENCE');
                    break;
                case 'SELECT_FINDING':
                    if (wsState?.selectFinding && directive.payload?.findingId) {
                        wsState.selectFinding(directive.payload.findingId);
                    }
                    break;
                case 'OPEN_EVIDENCE_DRAWER':
                    if (wsState?.openEvidenceDrawer) {
                        wsState.openEvidenceDrawer(directive.payload?.evidence);
                    }
                    break;
                default:
                    break;
            }

            // Dispatch global event for UI subscribers
            if (typeof document !== 'undefined' && document.dispatchEvent) {
                try {
                    const evt = new CustomEvent('udip:copilot:directive', { detail: directive });
                    document.dispatchEvent(evt);
                } catch (e) {
                    // Ignore in non-browser test environment
                }
            }

            return true;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.WorkspaceActions = WorkspaceActions;

})(typeof window !== 'undefined' ? window : global);
