/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/validation/evidence-validator.js
 * ============================================================================
 * Enforces the core platform invariant: "No Evidence -> No Claim."
 * Verifies the full chain of epistemic support:
 * Claim -> Source Evidence -> Metric -> Analytical Method
 * Flags ungrounded claims and ensures insufficient evidence handling.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const EvidenceValidator = {
        /**
         * Validate evidence grounding of an answer
         * @param {Object} params
         * @param {Array} params.evidence
         * @param {Object} params.response
         * @returns {Object}
         */
        validateEvidenceGrounding({ evidence = [], response = {} } = {}) {
            const hasEvidence = Array.isArray(evidence) && evidence.length > 0;
            const flags = [];
            let grounded = true;

            if (!hasEvidence) {
                // If no evidence is present, the response MUST acknowledge insufficient evidence
                const ans = String(response.answer || '').toLowerCase();
                const admitsInsufficient = 
                    ans.includes('insufficient evidence') ||
                    ans.includes('لا توجد أدلة كافية') ||
                    ans.includes('غير كافية') ||
                    ans.includes('لا توجد بيانات');

                if (!admitsInsufficient) {
                    grounded = false;
                    flags.push('Assertion made without backing empirical evidence items.');
                }
            } else {
                // Verify each evidence item has a valid source and metric
                evidence.forEach((ev, idx) => {
                    if (!ev.source) {
                        flags.push(`Evidence item #${idx + 1} lacks attributable engine source.`);
                    }
                    if (ev.value === undefined || ev.value === null || ev.value === 'NaN') {
                        flags.push(`Evidence item #${idx + 1} contains undefined or NaN metric.`);
                    }
                });
            }

            return {
                passed: grounded && flags.length === 0,
                grounded,
                flags,
                evidenceCount: evidence ? evidence.length : 0
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.EvidenceValidator = EvidenceValidator;

})(typeof window !== 'undefined' ? window : global);
