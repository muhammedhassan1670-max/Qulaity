/**
 * UDIP Deep Intelligence Evolution vNext
 * RankAnalysis - Spearman Rank & Kendall Tau Monotonic Association
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.RankAnalysis = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class RankAnalysis {
        static compute(xVals, yVals) {
            if (!xVals || !yVals || xVals.length < 3 || xVals.length !== yVals.length) {
                return { spearmanRho: 0, kendallTau: 0, n: 0, isMonotonic: false };
            }

            const n = xVals.length;

            // 1. Spearman Rank Correlation
            const xRanks = this._getRanks(xVals);
            const yRanks = this._getRanks(yVals);

            let d2Sum = 0;
            for (let i = 0; i < n; i++) {
                const diff = xRanks[i] - yRanks[i];
                d2Sum += diff * diff;
            }
            let rho = 1 - (6 * d2Sum) / (n * (n * n - 1));
            rho = Math.max(-1, Math.min(1, rho));

            // 2. Kendall Tau-b (Sampled if N is large to avoid O(N²) bottleneck)
            const maxK = Math.min(n, 200);
            let concordant = 0;
            let discordant = 0;
            let tiesX = 0;
            let tiesY = 0;

            for (let i = 0; i < maxK; i++) {
                for (let j = i + 1; j < maxK; j++) {
                    const dx = xVals[i] - xVals[j];
                    const dy = yVals[i] - yVals[j];

                    if (dx === 0 && dy === 0) {
                        // tie in both
                    } else if (dx === 0) {
                        tiesX++;
                    } else if (dy === 0) {
                        tiesY++;
                    } else if ((dx > 0 && dy > 0) || (dx < 0 && dy < 0)) {
                        concordant++;
                    } else {
                        discordant++;
                    }
                }
            }

            const totalPairs = (maxK * (maxK - 1)) / 2;
            const tauDenom = Math.sqrt((totalPairs - tiesX) * (totalPairs - tiesY)) || 1;
            const tau = (concordant - discordant) / tauDenom;

            return {
                spearmanRho: +rho.toFixed(4),
                kendallTau: +Math.max(-1, Math.min(1, tau)).toFixed(4),
                n: n,
                isMonotonic: Math.abs(rho) >= 0.70
            };
        }

        static _getRanks(arr) {
            const indexed = arr.map((val, idx) => ({ val, idx }));
            indexed.sort((a, b) => a.val - b.val);
            const ranks = new Array(arr.length);

            let i = 0;
            while (i < indexed.length) {
                let j = i;
                while (j < indexed.length && indexed[j].val === indexed[i].val) {
                    j++;
                }
                const avgRank = (i + 1 + j) / 2;
                for (let k = i; k < j; k++) {
                    ranks[indexed[k].idx] = avgRank;
                }
                i = j;
            }
            return ranks;
        }
    }

    return RankAnalysis;
}));
