/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: ui/executive-summary/summary-state.js
 * ============================================================================
 * Normalized State Definitions & Enums for Executive Intelligence Summary
 * 
 * Strict Invariants:
 * - Pure data schema & enum definitions.
 * - Zero ML metric calculations.
 * - Enforces standard status, causal, urgency, and outcome states.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const SummaryEnums = {
        StatusLevel: {
            STABLE: 'STABLE',
            EARLY_WARNING: 'EARLY_WARNING',
            HIGH_RISK: 'HIGH_RISK',
            CRITICAL: 'CRITICAL',
            RECOVERED: 'RECOVERED'
        },
        Severity: {
            LOW: 'LOW',
            MEDIUM: 'MEDIUM',
            HIGH: 'HIGH',
            CRITICAL: 'CRITICAL'
        },
        ConfidenceLabel: {
            LOW: 'LOW',
            MODERATE: 'MODERATE',
            HIGH: 'HIGH'
        },
        CausalStatus: {
            SUPPORTED: 'SUPPORTED',
            NON_CAUSAL: 'NON_CAUSAL',
            NOT_ESTABLISHED: 'NOT_ESTABLISHED'
        },
        Urgency: {
            MONITOR: 'MONITOR',
            INVESTIGATE: 'INVESTIGATE',
            ACT_NOW: 'ACT_NOW',
            HUMAN_REVIEW: 'HUMAN_REVIEW'
        },
        DecisionStatus: {
            ADVISORY: 'ADVISORY',
            WITHHELD: 'WITHHELD',
            APPROVED: 'APPROVED',
            REJECTED: 'REJECTED'
        },
        EvidenceStrength: {
            WEAK: 'WEAK',
            MODERATE: 'MODERATE',
            STRONG: 'STRONG'
        },
        OutcomeStatus: {
            NOT_OBSERVED: 'NOT_OBSERVED',
            EFFECTIVE: 'EFFECTIVE',
            NOT_EFFECTIVE: 'NOT_EFFECTIVE',
            INCONCLUSIVE: 'INCONCLUSIVE'
        }
    };

    /**
     * Factory to instantiate a normalized summary object structure
     */
    function createEmptySummaryState() {
        return {
            status: {
                level: SummaryEnums.StatusLevel.STABLE,
                headline: 'Operating Within Nominal Bounds',
                severity: SummaryEnums.Severity.LOW,
                badgeClass: 'udip-status-success',
                icon: 'fa-circle-check'
            },
            currentSituation: 'No significant deterioration detected. Current behavior remains within the expected operating range.',
            futureRisk: {
                available: false,
                statement: 'Future risk not sufficiently established from available data.',
                horizon: 'N/A',
                confidenceLabel: SummaryEnums.ConfidenceLabel.LOW,
                horizonMinutes: null,
                calibrated: false
            },
            why: {
                statement: 'All monitored process indicators remain stable.',
                drivers: [],
                covarianceNote: 'No anomalous cross-sensor covariance detected.'
            },
            strongestHypothesis: {
                statement: 'No active degradation hypothesis.',
                confidenceLabel: SummaryEnums.ConfidenceLabel.HIGH,
                confidencePct: 95,
                causalStatus: SummaryEnums.CausalStatus.NOT_ESTABLISHED,
                causalDisclaimer: 'Association detected — causal inference not established.'
            },
            engineeringResponse: {
                statement: 'No immediate action required. Continue normal monitoring.',
                urgency: SummaryEnums.Urgency.MONITOR,
                steps: ['Maintain baseline operating parameters.', 'Continue routine telemetry polling.'],
                counterfactualNote: null
            },
            decision: {
                status: SummaryEnums.DecisionStatus.APPROVED,
                statement: 'Normal operations certified.',
                automatedActuation: 'INACTIVE',
                withheldReason: 'Operating within normal envelope.'
            },
            evidence: {
                strength: SummaryEnums.EvidenceStrength.STRONG,
                statement: 'Evidence: STRONG — Monitored process parameters match expected operating behavior.'
            },
            outcome: {
                status: SummaryEnums.OutcomeStatus.NOT_OBSERVED,
                statement: 'OUTCOME NOT YET OBSERVED — Awaiting post-intervention sensor telemetry.',
                actionTaken: 'Standard monitoring protocol active.',
                expectedEffect: 'Maintain stable continuous baseline operation.',
                actualResult: 'Telemetry streaming within nominal envelope.',
                didActionWork: 'NOMINAL',
                hypothesisUpdate: 'Baseline hypothesis maintained.'
            },
            datasetMeta: {
                filename: 'dataset.csv',
                rowCount: 0,
                columnCount: 0,
                qualityScore: 100
            }
        };
    }

    const SummaryState = {
        Enums: SummaryEnums,
        createEmptySummaryState
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.SummaryState = SummaryState;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SummaryState;
    }
})(typeof window !== 'undefined' ? window : global);
