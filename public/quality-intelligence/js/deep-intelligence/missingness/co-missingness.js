/**
 * UDIP Deep Intelligence Evolution vNext
 * CoMissingness - Pairwise Phi Correlation of Missingness Indicators
 * Evaluates whether missingness in feature A systematically co-occurs with missingness in feature B.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.CoMissingness = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class CoMissingness {
        static analyze(dataset) {
            if (!dataset || !dataset.columns || !dataset.rows || dataset.rows.length === 0) {
                return [];
            }

            const rows = dataset.rows;
            const columns = dataset.columns;
            const pairs = [];

            // Binary missingness indicator: 1 if missing, 0 if present
            const isMissing = (val) => val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val));

            for (let i = 0; i < columns.length; i++) {
                for (let j = i + 1; j < columns.length; j++) {
                    const colA = columns[i];
                    const colB = columns[j];

                    let n11 = 0, n10 = 0, n01 = 0, n00 = 0;

                    for (let r = 0; r < rows.length; r++) {
                        const mA = isMissing(rows[r][colA]) ? 1 : 0;
                        const mB = isMissing(rows[r][colB]) ? 1 : 0;

                        if (mA === 1 && mB === 1) n11++;
                        else if (mA === 1 && mB === 0) n10++;
                        else if (mA === 0 && mB === 1) n01++;
                        else n00++;
                    }

                    // Only analyze pairs where missingness exists in at least one column
                    if (n11 + n10 + n01 > 0) {
                        const denom = Math.sqrt((n11 + n10) * (n01 + n00) * (n11 + n01) * (n10 + n00));
                        const phi = denom > 0 ? (n11 * n00 - n10 * n01) / denom : 0;

                        if (Math.abs(phi) >= 0.30) {
                            pairs.push({
                                colA: colA,
                                colB: colB,
                                phiCorrelation: +phi.toFixed(4),
                                bothMissingCount: n11,
                                status: 'OBSERVED',
                                interpretation: phi > 0.5
                                    ? `Strong co-missingness (Phi=${phi.toFixed(2)}): ${colA} and ${colB} frequently drop out together.`
                                    : `Systematic missingness pattern detected between ${colA} and ${colB} (Phi=${phi.toFixed(2)}).`
                            });
                        }
                    }
                }
            }

            return pairs;
        }
    }

    return CoMissingness;
}));
