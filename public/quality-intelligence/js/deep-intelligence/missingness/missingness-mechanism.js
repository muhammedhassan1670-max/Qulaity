/**
 * UDIP Deep Intelligence Evolution vNext
 * MissingnessMechanism - Testable Hypotheses for MCAR, MAR, and MNAR
 * Never claims missingness mechanism is proven from observational data alone.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.MissingnessMechanism = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class MissingnessMechanism {
        static deduce(missingnessMap, coMissingnessPairs, predictabilityResults = []) {
            const hypotheses = [];

            if (!missingnessMap || !missingnessMap.hasMissingness) {
                return hypotheses;
            }

            const colRates = missingnessMap.columnRates || {};
            for (const [col, info] of Object.entries(colRates)) {
                if (info.missingCount === 0) continue;

                const pred = predictabilityResults.find(p => p.targetColumn === col);
                const hasCoMissing = (coMissingnessPairs || []).some(p => (p.colA === col || p.colB === col) && Math.abs(p.phiCorrelation) >= 0.4);

                let candidateMechanism = 'MCAR_HYPOTHESIS';
                let rationale = 'Missingness appears distributed uniformly without strong correlation to other observed variables.';
                let status = 'POSSIBLE';

                if (pred && pred.isPredictable) {
                    candidateMechanism = 'MAR_HYPOTHESIS';
                    rationale = `Missingness in "${col}" correlates with "${pred.topPredictor}" (r=${pred.correlation.toFixed(2)}), suggesting Missing At Random.`;
                    status = 'LIKELY';
                } else if (hasCoMissing) {
                    candidateMechanism = 'STRUCTURED_MISSINGNESS_HYPOTHESIS';
                    rationale = `Missingness in "${col}" co-occurs systematically with companion features, indicating a block dropout pattern.`;
                    status = 'LIKELY';
                }

                hypotheses.push({
                    column: col,
                    mechanism: candidateMechanism,
                    missingRate: info.rate,
                    status: status,
                    confidence: status === 'LIKELY' ? 0.80 : 0.60,
                    rationale: rationale,
                    limitation: 'Observational data cannot definitively prove MNAR vs MAR without domain audit.'
                });
            }

            return hypotheses;
        }
    }

    return MissingnessMechanism;
}));
