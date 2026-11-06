/**
 * UDIP Deep Intelligence Evolution vNext
 * HypothesisLifecycle - Hypothesis State Machine & Status Governance
 * Transitions: GENERATED -> INVESTIGATING -> SUPPORTED -> PARTIALLY_SUPPORTED -> WEAKENED -> REJECTED -> INSUFFICIENT_EVIDENCE
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.HypothesisLifecycle = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class HypothesisLifecycle {
        static resolveStatus(hypothesis = {}, observedEvidence = null, counterEvidence = null) {
            const obs = Array.isArray(observedEvidence) ? observedEvidence : (hypothesis.observedEvidence || []);
            const cnt = Array.isArray(counterEvidence) ? counterEvidence : (hypothesis.counterEvidence || []);
            const hasSupport = obs.length > 0;
            const hasCounter = cnt.length > 0;

            if (hasSupport && !hasCounter) {
                return 'SUPPORTED';
            } else if (hasSupport && hasCounter) {
                return 'PARTIALLY_SUPPORTED';
            } else if (!hasSupport && hasCounter) {
                return 'REJECTED';
            } else {
                return 'INSUFFICIENT_EVIDENCE';
            }
        }

        static updateAll(hypotheses, counterEvidenceFinder, dataset, profile) {
            return (hypotheses || []).map(h => {
                const counter = counterEvidenceFinder ? counterEvidenceFinder.search(dataset, profile, h) : (h.counterEvidence || []);
                const resolved = this.resolveStatus(h, h.observedEvidence, counter);
                return {
                    ...h,
                    counterEvidence: counter,
                    status: resolved,
                    isRobust: resolved === 'SUPPORTED'
                };
            });
        }
    }

    return HypothesisLifecycle;
}));
