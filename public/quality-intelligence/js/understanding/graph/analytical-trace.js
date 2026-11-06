/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/graph/analytical-trace.js
 * ============================================================================
 * Generates auditable provenance chains from raw data to final findings.
 * Trace: Dataset -> Understanding -> Observation -> Method -> Evidence -> Validation -> Finding -> Decision
 * ============================================================================
 */

(function (window) {
    'use strict';

    function AnalyticalTrace(datasetId) {
        this.datasetId = datasetId || 'ds_default';
        this.events = [];
    }

    AnalyticalTrace.prototype.record = function(type, payload) {
        const ev = { timestamp: new Date().toISOString(), type, payload };
        this.events.push(ev);
        return ev;
    };

    AnalyticalTrace.prototype.getTraceChain = function() {
        return this.events;
    };

    /**
     * Construct traces for all hypotheses and primary findings
     * @param {Object} dataset - Dataset object
     * @param {Array} hypotheses - Evaluated hypotheses
     * @param {Object} criticAudit - Critic audit report
     * @returns {Array<Object>} List of full analytical trace objects
     */
    AnalyticalTrace.buildTraces = function(dataset, hypotheses = [], criticAudit = {}) {
        const filename = dataset?.filename || 'Active Dataset';

        return hypotheses.map(h => {
            return {
                traceId: `TRACE_${h.id}`,
                targetHypothesis: h.id,
                claim: h.statement,
                status: h.status,
                confidence: h.confidence,
                chain: [
                    { step: 'Dataset Source', detail: `Observed in source table "${filename}".` },
                    { step: 'Observation', detail: h.statement },
                    { step: 'Method Deployed', detail: h.test || h.testType || 'Statistical Verification' },
                    { step: 'Statistical Evidence', detail: h.observedResult || (h.supportingEvidence || []).join(' ') },
                    { step: 'Counter-Evidence Audit', detail: (h.counterEvidence || []).join(' ') || 'No conflicting signals detected.' },
                    { step: 'Critic Verification', detail: `Passed ${criticAudit.passedChecks || 0}/10 adversarial quality gate checks.` },
                    { step: 'Epistemic Status', detail: `Promoted to "${h.status}" with calibrated confidence ${Math.round((h.confidence || 0) * 100)}%.` }
                ]
            };
        });
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.AnalyticalTrace = AnalyticalTrace;

})(typeof window !== 'undefined' ? window : global);
