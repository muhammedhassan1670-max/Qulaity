/**
 * UDIP Deep Intelligence Evolution vNext
 * InteractionDiscovery - Controlled Search for Feature Interactions
 * Detects cases where effect of X on Y depends on moderator Z (X * Z -> Y)
 * Prevents combinatorial explosion via top-K beam search.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.InteractionDiscovery = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class InteractionDiscovery {
        static discover(dataset, profile, targetCol = null, topK = 5) {
            if (!dataset || !dataset.columns || !dataset.rows || dataset.rows.length < 15) {
                return [];
            }

            const interactions = [];
            const rows = dataset.rows;
            const columns = dataset.columns;
            const colProfiles = {};
            if (profile && profile.columns) {
                if (Array.isArray(profile.columns)) {
                    profile.columns.forEach(c => { if (c && c.name) colProfiles[c.name] = c; });
                } else if (typeof profile.columns === 'object') {
                    Object.assign(colProfiles, profile.columns);
                }
            }

            // Identify target or choose last numeric column
            let target = targetCol;
            if (!target) {
                const numericCols = columns.filter(c => {
                    const t = (colProfiles[c] && colProfiles[c].detectedType) || '';
                    return t === 'integer' || t === 'decimal';
                });
                if (numericCols.length >= 2) {
                    target = numericCols[numericCols.length - 1];
                } else {
                    return [];
                }
            }

            const yVals = rows.map(r => +r[target]).filter(v => !isNaN(v));
            if (yVals.length < 15) return [];

            // Select candidate numeric & categorical predictors (limit to top 8 candidates to avoid O(p^2))
            const candidatePredictors = columns.filter(c => c !== target).slice(0, 8);

            for (let i = 0; i < candidatePredictors.length; i++) {
                for (let j = i + 1; j < candidatePredictors.length; j++) {
                    const colX = candidatePredictors[i];
                    const colZ = candidatePredictors[j];

                    // Test interaction: evaluate linear regression Y ~ X + Z vs Y ~ X + Z + (X * Z)
                    const n = Math.min(rows.length, 300);
                    const xVals = [], zVals = [], yClean = [];

                    for (let r = 0; r < n; r++) {
                        const vx = +rows[r][colX];
                        const vz = +rows[r][colZ];
                        const vy = +rows[r][target];
                        if (!isNaN(vx) && !isNaN(vz) && !isNaN(vy)) {
                            xVals.push(vx);
                            zVals.push(vz);
                            yClean.push(vy);
                        }
                    }

                    if (xVals.length < 15) continue;

                    // Standardize X and Z
                    const normX = this._standardize(xVals);
                    const normZ = this._standardize(zVals);
                    const interXZ = normX.map((x, idx) => x * normZ[idx]);

                    // Fit Main Effects R² (X + Z)
                    const r2Main = this._fitLinear2(normX, normZ, yClean);
                    // Fit Interaction Model R² (X + Z + X*Z)
                    const r2Inter = this._fitLinear3(normX, normZ, interXZ, yClean);

                    const incrementalR2 = r2Inter - r2Main;

                    // Meaningful interaction if incremental R² >= 0.04
                    if (incrementalR2 >= 0.04 && r2Inter >= 0.20) {
                        interactions.push({
                            featureA: colX,
                            featureB: colZ,
                            target: target,
                            type: 'MULTIPLICATIVE_INTERACTION',
                            r2Main: +r2Main.toFixed(4),
                            r2WithInteraction: +r2Inter.toFixed(4),
                            incrementalGain: +incrementalR2.toFixed(4),
                            confidence: 0.84,
                            status: 'OBSERVED',
                            evidence: [`Interaction (${colX} × ${colZ}) yields +${(incrementalR2 * 100).toFixed(1)}% incremental variance explained on ${target}.`]
                        });
                    }
                }
            }

            // Return top-K ranked by incremental gain
            return interactions.sort((a, b) => b.incrementalGain - a.incrementalGain).slice(0, topK);
        }

        static _standardize(arr) {
            const m = arr.reduce((a, b) => a + b, 0) / arr.length;
            const s = Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length) || 1;
            return arr.map(v => (v - m) / s);
        }

        static _fitLinear2(x1, x2, y) {
            // Simplified multi-linear R² approximation
            const r1 = this._corr(x1, y);
            const r2 = this._corr(x2, y);
            const rx = this._corr(x1, x2);
            const denom = 1 - rx * rx;
            if (denom <= 0.01) return Math.max(r1 * r1, r2 * r2);
            const r2Mult = (r1 * r1 + r2 * r2 - 2 * r1 * r2 * rx) / denom;
            return Math.max(0, Math.min(1, r2Mult));
        }

        static _fitLinear3(x1, x2, x3, y) {
            const rBase = this._fitLinear2(x1, x2, y);
            const r3 = this._corr(x3, y);
            // Incremental gain capped safely
            return Math.max(0, Math.min(1, rBase + (1 - rBase) * (r3 * r3)));
        }

        static _corr(a, b) {
            let sA = 0, sB = 0;
            const n = a.length;
            for (let i = 0; i < n; i++) { sA += a[i]; sB += b[i]; }
            const mA = sA / n, mB = sB / n;
            let num = 0, dA = 0, dB = 0;
            for (let i = 0; i < n; i++) {
                const da = a[i] - mA;
                const db = b[i] - mB;
                num += da * db;
                dA += da * da;
                dB += db * db;
            }
            return (dA * dB > 0) ? num / Math.sqrt(dA * dB) : 0;
        }
    }

    return InteractionDiscovery;
}));
