/**
 * UDIP Deep Intelligence Evolution vNext
 * StatisticalCritic - Multiple-Testing Awareness & p-value Corrections
 * Implements Benjamini-Hochberg False Discovery Rate (FDR) and Bonferroni adjustments.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.StatisticalCritic = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class StatisticalCritic {
        /**
         * Benjamini-Hochberg False Discovery Rate (FDR) correction
         * @param {Array<number>} pValues Raw p-values
         * @param {number} q Target FDR rate (e.g. 0.05)
         */
        static adjustBenjaminiHochberg(pValues, q = 0.05) {
            if (!pValues || pValues.length === 0) return [];
            const m = pValues.length;
            const indexed = pValues.map((p, idx) => ({ p: Math.max(0, Math.min(1, p)), idx }));
            indexed.sort((a, b) => a.p - b.p);

            const adjusted = new Array(m);
            let prevAdj = 1.0;

            for (let i = m - 1; i >= 0; i--) {
                const rank = i + 1;
                const rawAdj = (indexed[i].p * m) / rank;
                const curAdj = Math.min(prevAdj, Math.min(1.0, rawAdj));
                adjusted[indexed[i].idx] = {
                    rawP: +indexed[i].p.toFixed(5),
                    adjustedP: +curAdj.toFixed(5),
                    significantAfterFdr: curAdj <= q,
                    rank: rank
                };
                prevAdj = curAdj;
            }

            return adjusted;
        }

        /**
         * Bonferroni Family-Wise Error Rate (FWER) correction
         */
        static adjustBonferroni(pValues, alpha = 0.05) {
            if (!pValues || pValues.length === 0) return [];
            const m = pValues.length;
            return pValues.map(p => {
                const adj = Math.min(1.0, p * m);
                return {
                    rawP: +p.toFixed(5),
                    adjustedP: +adj.toFixed(5),
                    significantAfterBonferroni: adj <= alpha
                };
            });
        }
    }

    return StatisticalCritic;
}));
