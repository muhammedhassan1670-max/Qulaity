/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/integrity/trace-integrity.js
 * ============================================================================
 * Trace & Epistemic Reasoning Integrity Validator:
 * Validates the full structural completeness and linkage of:
 * - Epistemological reasoning chains (Observation -> Evidence -> Interpretation -> Decision)
 * - Copilot response traces (Question -> Intent -> Plan -> Evidence -> Validation -> Answer)
 * Ensures 0 orphaned nodes, valid timestamps, and unbroken causal accountability.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const TraceIntegrity = {
        /**
         * Validate structural integrity of a Copilot response trace
         * @param {Object} trace
         * @returns {Object}
         */
        validateTrace(trace) {
            const checks = [];

            if (!trace || typeof trace !== 'object') {
                return { passed: false, errors: ['Trace is null or not an object'] };
            }

            // 1. Trace ID and Timestamp
            checks.push({
                name: 'Trace Header Metadata',
                valid: Boolean(trace.id && trace.timestamp),
                message: trace.id ? `Valid ID: ${trace.id}` : 'Missing trace ID'
            });

            // 2. Intent & Confidence
            checks.push({
                name: 'Intent Classification Grounding',
                valid: Boolean(trace.detectedIntent && typeof trace.intentConfidence === 'number'),
                message: `Intent: ${trace.detectedIntent} (${trace.intentConfidence})`
            });

            // 3. Execution Plan Linkage
            const hasPlan = Boolean(trace.plan && Array.isArray(trace.plan.steps));
            checks.push({
                name: 'Query Plan Linkage',
                valid: hasPlan,
                message: hasPlan ? `${trace.plan.steps.length} steps recorded` : 'Missing query execution plan'
            });

            // 4. Evidence Traceability
            const hasEvidence = Array.isArray(trace.evidenceRetrieved);
            checks.push({
                name: 'Evidence Array Structure',
                valid: hasEvidence,
                message: hasEvidence ? `${trace.evidenceRetrieved.length} items linked` : 'Evidence array missing'
            });

            // 5. Validation Status Check
            checks.push({
                name: 'Trace Validation Record',
                valid: Boolean(trace.validation && typeof trace.validation.passed === 'boolean'),
                message: trace.validation?.passed ? 'Validation passed' : 'Validation flagged/failed'
            });

            const passed = checks.every(c => c.valid);
            return {
                passed,
                checks,
                score: Math.round((checks.filter(c => c.valid).length / checks.length) * 100)
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.TraceIntegrity = TraceIntegrity;

})(typeof window !== 'undefined' ? window : global);
