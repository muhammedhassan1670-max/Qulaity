/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: ui/executive-summary/summary-formatters.js
 * ============================================================================
 * Presentation Formatters for Executive Intelligence Summary
 * 
 * Strict Invariants:
 * - Pure formatting and localization helpers.
 * - Zero calculation of new ML or statistical metrics.
 * - Enforces non-causal caveats and honest telemetry labels.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const SummaryFormatters = {
        /**
         * Format status level badge class and icon
         */
        getStatusBadgeConfig(level) {
            switch (level) {
                case 'CRITICAL':
                case 'HIGH_RISK':
                    return {
                        badgeClass: 'udip-status-danger',
                        icon: 'fa-triangle-exclamation',
                        color: '#f43f5e'
                    };
                case 'EARLY_WARNING':
                    return {
                        badgeClass: 'udip-status-warning',
                        icon: 'fa-circle-exclamation',
                        color: '#f59e0b'
                    };
                case 'RECOVERED':
                case 'STABLE':
                default:
                    return {
                        badgeClass: 'udip-status-success',
                        icon: 'fa-circle-check',
                        color: '#10b981'
                    };
            }
        },

        /**
         * Format driver trend symbol into clean arrow representation
         */
        formatTrendSymbol(direction) {
            if (direction === 'increasing' || direction === 'up') return '↑';
            if (direction === 'decreasing' || direction === 'down') return '↓';
            return '→';
        },

        /**
         * Format drivers list into human-readable compact string
         * Example: "Vibration ↑ (Delta: +1.075 mm/s) • Temperature ↑ (Delta: +17.5 °C) • Oil Pressure ↓ (Delta: -0.85 bar)"
         */
        formatDriversSummary(drivers = []) {
            if (!Array.isArray(drivers) || drivers.length === 0) {
                return 'Monitored parameters operating within nominal variance.';
            }
            return drivers.map(d => {
                const arrow = d.trendSymbol || this.formatTrendSymbol(d.direction);
                const deltaStr = d.delta ? ` (${d.delta})` : '';
                return `${d.name} ${arrow}${deltaStr}`;
            }).join(' • ');
        },

        /**
         * Format evidence strength with mandatory causal disclaimer
         */
        formatEvidenceStatement(evidenceStrength, causalStatus, customStatement = null) {
            if (customStatement) return customStatement;

            const strengthLabel = evidenceStrength || 'MODERATE';
            if (causalStatus === 'SUPPORTED') {
                return `Evidence: ${strengthLabel} — Supported by controlled experimental / cross-validated evidence.`;
            }
            return `Evidence: ${strengthLabel} — Multiple signals support the hypothesis; causal confirmation not established.`;
        },

        /**
         * Format counterfactual disclaimer banner
         */
        formatCounterfactualBanner(counterfactualNote) {
            if (!counterfactualNote) return '';
            return `
                <div class="udip-counterfactual-disclaimer" style="margin-top:10px; padding:8px 12px; background:rgba(56, 189, 248, 0.08); border-left:3px solid #38bdf8; border-radius:4px; font-size:12px; color:#bae6fd;">
                    <i class="fas fa-flask" style="color:#38bdf8; margin-right:6px;"></i>
                    <strong>Model Counterfactual Available:</strong> A simulated intervention scenario exists. Intervention effectiveness has not been experimentally validated.
                </div>
            `;
        },

        /**
         * Format decision status badge configuration
         */
        getDecisionBadgeConfig(status) {
            switch (status) {
                case 'APPROVED':
                    return {
                        label: 'APPROVED',
                        color: '#10b981',
                        badgeClass: 'udip-decision-approved',
                        icon: 'fa-circle-check'
                    };
                case 'REJECTED':
                    return {
                        label: 'REJECTED',
                        color: '#f43f5e',
                        badgeClass: 'udip-decision-rejected',
                        icon: 'fa-circle-xmark'
                    };
                case 'WITHHELD':
                    return {
                        label: 'WITHHELD — AUTOMATED ACTION BLOCKED',
                        color: '#f59e0b',
                        badgeClass: 'udip-decision-withheld',
                        icon: 'fa-lock'
                    };
                case 'ADVISORY':
                default:
                    return {
                        label: 'ADVISORY — HUMAN REVIEW REQUIRED',
                        color: '#f59e0b',
                        badgeClass: 'udip-decision-advisory',
                        icon: 'fa-user-gear'
                    };
            }
        },

        /**
         * Format outcome status label & badge
         */
        getOutcomeBadgeConfig(status) {
            switch (status) {
                case 'EFFECTIVE':
                    return {
                        label: 'ACTION APPEARS EFFECTIVE',
                        badgeClass: 'udip-status-success',
                        icon: 'fa-circle-check',
                        color: '#10b981'
                    };
                case 'NOT_EFFECTIVE':
                    return {
                        label: 'ACTION DID NOT PRODUCE EXPECTED EFFECT',
                        badgeClass: 'udip-status-danger',
                        icon: 'fa-circle-xmark',
                        color: '#f43f5e'
                    };
                case 'INCONCLUSIVE':
                    return {
                        label: 'INCONCLUSIVE TELEMETRY',
                        badgeClass: 'udip-status-warning',
                        icon: 'fa-circle-question',
                        color: '#f59e0b'
                    };
                case 'NOT_OBSERVED':
                default:
                    return {
                        label: 'OUTCOME NOT YET OBSERVED',
                        badgeClass: 'udip-status-neutral',
                        icon: 'fa-hourglass-half',
                        color: '#94a3b8'
                    };
            }
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.SummaryFormatters = SummaryFormatters;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SummaryFormatters;
    }
})(typeof window !== 'undefined' ? window : global);
