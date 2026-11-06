/**
 * UDIP Deep Intelligence Evolution vNext
 * MutualInformation - Shannon Mutual Information in nats
 * Uses adaptive quantile binning to capture non-linear and non-monotonic dependencies.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.MutualInformation = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class MutualInformation {
        static compute(xVals, yVals, numBins = 10) {
            if (!xVals || !yVals || xVals.length < 5 || xVals.length !== yVals.length) {
                return 0.0;
            }

            const n = xVals.length;
            const k = Math.max(3, Math.min(numBins, Math.floor(Math.sqrt(n / 5))));

            const xBins = this._quantileBin(xVals, k);
            const yBins = this._quantileBin(yVals, k);

            // Joint contingency frequency table
            const joint = Array.from({ length: k }, () => new Array(k).fill(0));
            const pX = new Array(k).fill(0);
            const pY = new Array(k).fill(0);

            for (let i = 0; i < n; i++) {
                const bx = xBins[i];
                const by = yBins[i];
                joint[bx][by]++;
                pX[bx]++;
                pY[by]++;
            }

            let mi = 0;
            const eps = 1e-12;

            for (let i = 0; i < k; i++) {
                for (let j = 0; j < k; j++) {
                    if (joint[i][j] > 0) {
                        const pxy = joint[i][j] / n;
                        const px = pX[i] / n;
                        const py = pY[j] / n;
                        if (px > 0 && py > 0) {
                            mi += pxy * Math.log(pxy / (px * py) + eps);
                        }
                    }
                }
            }

            return +Math.max(0, mi).toFixed(4);
        }

        static _quantileBin(arr, k) {
            const indexed = arr.map((val, idx) => ({ val, idx }));
            indexed.sort((a, b) => a.val - b.val);
            const bins = new Array(arr.length);
            const binSize = arr.length / k;

            for (let i = 0; i < indexed.length; i++) {
                const b = Math.min(k - 1, Math.floor(i / binSize));
                bins[indexed[i].idx] = b;
            }
            return bins;
        }
    }

    return MutualInformation;
}));
