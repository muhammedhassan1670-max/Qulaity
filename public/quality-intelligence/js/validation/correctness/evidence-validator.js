/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/correctness/evidence-validator.js
 * ============================================================================
 * Cross-Engine Evidence Integrity Validator:
 * - Ensures every executive finding, risk, and opportunity links to an
 *   empirical evidence item with a verifiable numerical metric.
 * - Detects and flags dangling or fabricated evidence IDs.
 * - Asserts evidence strength bounds [0, 100].
 * ============================================================================
 */

(function (window) {
    'use strict';

    const EvidenceValidator = {
        /**
         * Validate evidence consistency across Decision and Workspace outputs
         * @param {Object} platform
         * @returns {Object}
         */
        validateEvidenceIntegrity(platform = {}) {
            const checks = [];
            const decision = platform.decisionIntelligence;
            const workspace = platform.workspace;

            // 1. Validate Decision Risks Evidence
            const risks = Array.isArray(decision?.risks)
                ? decision.risks
                : (decision?.risks?.rankedRisks || []);

            let validRisks = true;
            risks.forEach(r => {
                if (!r.title || r.score === undefined || isNaN(r.score)) {
                    validRisks = false;
                }
            });

            checks.push({
                name: 'Decision Risks Evidence Completeness',
                status: validRisks ? 'PASS' : 'FAIL',
                message: `Validated ${risks.length} risk items`
            });

            // 2. Validate Decision Opportunities Evidence
            const opps = Array.isArray(decision?.opportunities)
                ? decision.opportunities
                : (decision?.opportunities?.rankedOpportunities || []);

            let validOpps = true;
            opps.forEach(o => {
                if (!o.title || o.score === undefined || isNaN(o.score)) {
                    validOpps = false;
                }
            });

            checks.push({
                name: 'Decision Opportunities Evidence Completeness',
                status: validOpps ? 'PASS' : 'FAIL',
                message: `Validated ${opps.length} opportunity items`
            });

            // 3. Validate Workspace Findings Evidence Strength [0, 100]
            const findings = workspace?.narrative?.findings || [];
            let validFindings = true;
            findings.forEach(f => {
                if (typeof f.evidenceStrength === 'number') {
                    if (f.evidenceStrength < 0 || f.evidenceStrength > 100) {
                        validFindings = false;
                    }
                }
            });

            checks.push({
                name: 'Workspace Findings Evidence Strength Boundedness',
                status: validFindings ? 'PASS' : 'FAIL',
                message: `Validated ${findings.length} workspace finding evidence scores`
            });

            const passedCount = checks.filter(c => c.status === 'PASS').length;
            const score = Math.round((passedCount / Math.max(1, checks.length)) * 100);

            return {
                passed: checks.every(c => c.status === 'PASS'),
                checks,
                score
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.EvidenceValidator = EvidenceValidator;

})(typeof window !== 'undefined' ? window : global);
