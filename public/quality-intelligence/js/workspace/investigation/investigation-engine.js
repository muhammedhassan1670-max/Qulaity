/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: workspace/investigation/investigation-engine.js
 * ============================================================================
 * Guided 7-Step Investigation Workflow Coordinator.
 * 
 * Manages the interactive investigation journey:
 * 1. Select Finding / Anomaly / Risk
 * 2. Review Supporting Evidence
 * 3. Formulate Hypothesis
 * 4. Explore Candidate Drivers
 * 5. Simulate Scenarios / What-If
 * 6. Evaluate Alternative Explanations
 * 7. Record Conclusion & Decision Action
 * ============================================================================
 */

(function (window) {
    'use strict';

    const STEP_NAMES = [
        'Select Investigation Target',
        'Review Empirical Evidence',
        'Formulate & Test Hypothesis',
        'Explore Candidate Drivers',
        'Simulate What-If Scenarios',
        'Evaluate Confounders & Alternatives',
        'Record Conclusion & Decision Action'
    ];

    const InvestigationEngine = {
        /**
         * Initialize an investigation for a finding or variable
         * 
         * @param {Object} params
         * @param {string} [params.findingId]
         * @param {string} [params.variable]
         * @param {string} [params.title]
         * @param {Object} context - Dataset context
         * @returns {Object} Active investigation session
         */
        startInvestigation({ findingId = null, variable = null, title = null } = {}, context = {}) {
            const state = window.UDIP?.InvestigationState;
            const explorer = window.UDIP?.EvidenceExplorer;

            const targetVar = variable || (context.analytics?.targetColumn || context.analysisPlan?.target?.column || null);
            const invTitle = title || (targetVar ? `Investigation: Dynamics of ${targetVar}` : 'Exploratory Investigation');

            let inv = state ? state.createInvestigation({
                title: invTitle,
                findingId,
                targetVariable: targetVar
            }) : { id: `inv_${Date.now()}`, title: invTitle, currentStep: 1, hypotheses: [] };

            // Step 2 Pre-load evidence
            if (targetVar && explorer) {
                const varData = explorer.exploreVariable(targetVar, context);
                if (state && inv.id) {
                    state.updateInvestigation(inv.id, { variableEvidence: varData });
                }
            }

            return inv;
        },

        /**
         * Execute a step transition or action in the investigation
         * 
         * @param {string} investigationId
         * @param {number} targetStep (1-7)
         * @param {Object} payload
         * @param {Object} context
         * @returns {Object} Updated investigation state
         */
        processStep(investigationId, targetStep, payload = {}, context = {}) {
            const state = window.UDIP?.InvestigationState;
            const hypEngine = window.UDIP?.HypothesisEngine;
            if (!state) return null;

            const inv = state.getActiveInvestigation();
            if (!inv) return null;

            // Handle step actions
            if (targetStep === 3 && payload.hypothesis) {
                // Formulate & Test hypothesis
                const testResult = hypEngine ? hypEngine.testHypothesis(payload.hypothesis, context) : null;
                if (testResult) {
                    state.addHypothesis(investigationId, testResult);
                }
            } else if (targetStep === 5 && payload.simulation) {
                // What-If Simulation
                state.addSimulation(investigationId, payload.simulation);
            } else if (targetStep === 7 && payload.conclusion) {
                // Final Conclusion
                state.addConclusion(investigationId, payload.conclusion);
            }

            // Update step
            state.updateInvestigation(investigationId, { currentStep: Math.min(7, Math.max(1, targetStep)) });
            return state.getActiveInvestigation();
        },

        /**
         * Get step metadata
         */
        getStepsInfo() {
            return STEP_NAMES.map((name, idx) => ({
                stepNumber: idx + 1,
                name,
                isFinal: idx === 6
            }));
        },

        /**
         * Generate a summary brief of the investigation
         * @param {string} investigationId
         * @returns {Object}
         */
        generateInvestigationBrief(investigationId) {
            const state = window.UDIP?.InvestigationState;
            const inv = state ? state.getActiveInvestigation() : null;
            if (!inv) return null;

            const supportedHypotheses = (inv.hypotheses || []).filter(h => h.status === 'SUPPORTED');
            const rejectedHypotheses = (inv.hypotheses || []).filter(h => h.status === 'REJECTED');

            return {
                investigationId: inv.id,
                title: inv.title,
                targetVariable: inv.targetVariable,
                status: inv.status,
                totalHypothesesTested: (inv.hypotheses || []).length,
                supportedCount: supportedHypotheses.length,
                rejectedCount: rejectedHypotheses.length,
                simulationsRun: (inv.simulations || []).length,
                latestConclusion: (inv.conclusions || [])[inv.conclusions?.length - 1] || null,
                createdAt: inv.createdAt,
                updatedAt: inv.updatedAt
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.InvestigationEngine = InvestigationEngine;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = InvestigationEngine;
    }
})(typeof window !== 'undefined' ? window : global);
