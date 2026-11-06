/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/actions/investigation-actions.js
 * ============================================================================
 * Investigation action coordinators:
 * - startInvestigation()
 * - selectFinding()
 * - formulateHypothesis()
 * - testHypothesis()
 * - recordConclusion()
 * ============================================================================
 */

(function (window) {
    'use strict';

    const InvestigationActions = {
        /**
         * Initialize a guided investigation session from a copilot conversation
         * @param {Object} options
         */
        startInvestigation({ findingId = null, focusColumn = null, triggerReason = 'Copilot conversational inquiry' } = {}) {
            const invEngine = window.UDIP?.Workspace?.InvestigationEngine;
            const invState = window.UDIP?.Workspace?.InvestigationState;

            let session = null;
            if (invEngine?.startInvestigation) {
                session = invEngine.startInvestigation({
                    triggerReason,
                    findingId,
                    focusColumn
                });
            } else if (invState?.startSession) {
                session = invState.startSession({
                    findingId,
                    focusColumn,
                    notes: triggerReason
                });
            }

            return {
                status: 'INVESTIGATION_INITIALIZED',
                session: session || { id: 'inv_' + Date.now(), findingId, focusColumn },
                message: focusColumn 
                    ? `تم بدء تحقيق تحليلي مركز حول المتغير "${focusColumn}".`
                    : 'تم فتح جلسة تحقيق جديدة في مساحة العمل الاستقصائية.'
            };
        },

        /**
         * Formulate and test a hypothesis through Step 6 HypothesisEngine
         */
        testHypothesis({ dataset, hypothesisType = 'CORRELATION', varA, varB, condition } = {}) {
            const hypEngine = window.UDIP?.Workspace?.HypothesisEngine;
            if (hypEngine?.testHypothesis && dataset) {
                const testResult = hypEngine.testHypothesis({
                    dataset,
                    type: hypothesisType,
                    varA,
                    varB,
                    condition
                });
                return {
                    status: 'HYPOTHESIS_TESTED',
                    result: testResult,
                    supportLevel: testResult.status, // e.g. SUPPORTED, WEAKENED, REJECTED
                    supportScore: testResult.supportScore
                };
            }

            return {
                status: 'HYPOTHESIS_NOT_EXECUTED',
                message: 'Hypothesis engine unavailable or missing dataset.'
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.InvestigationActions = InvestigationActions;

})(typeof window !== 'undefined' ? window : global);
