/**
 * UDIP Deep Intelligence Evolution vNext
 * AnalysisPriority - Information-Gain Driven Analysis Prioritization
 * AnalysisValue = (ExpectedInformationGain × Relevance × Reliability) ÷ ComputationalCost
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.AnalysisPriority = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class AnalysisPriority {
        static calculatePriority({ expectedInformationGain = 0.5, relevance = 0.8, reliability = 0.85, costMs = 10 } = {}) {
            const safeGain = Math.max(0.01, expectedInformationGain);
            const safeRel = Math.max(0.01, relevance);
            const safeReliab = Math.max(0.1, reliability);
            const safeCost = Math.max(1, costMs);

            // Normalized score in range [0, 100]
            const rawValue = (safeGain * safeRel * safeReliab * 1000) / Math.sqrt(safeCost);
            const priorityScore = +Math.max(1, Math.min(100, rawValue)).toFixed(1);

            return {
                priorityScore: priorityScore,
                expectedGain: safeGain,
                relevance: safeRel,
                reliability: safeReliab,
                costMs: safeCost,
                tier: priorityScore >= 70 ? 'HIGH' : (priorityScore >= 40 ? 'MEDIUM' : 'LOW')
            };
        }
    }

    return AnalysisPriority;
}));
