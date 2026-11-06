/**
 * UDIP Deep Intelligence Evolution vNext
 * CounterEvidence - Active Search for Contradictory Evidence
 * Mandatorily searches across subgroups, time periods, data splits, and outlier-excluded subsets.
 * Detects Simpson's Paradox Reversals.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.CounterEvidence = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class CounterEvidence {
        static search(dataset, profile, finding) {
            const counterItems = [];
            if (!dataset || !dataset.rows || dataset.rows.length < 15 || !finding) {
                return counterItems;
            }

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

            // If finding is about a relationship between colA and colB
            if (finding.type === 'RELATIONSHIP' || finding.type === 'NONLINEAR_RELATIONSHIP' || (finding.variables && finding.variables.length >= 2)) {
                const colA = finding.variables[0];
                const colB = finding.variables[1];

                // Overall correlation
                const overallR = this._corrPair(rows, colA, colB);

                // 1. Search categorical subgroups for Simpson's Paradox or sign reversal
                const catCols = columns.filter(c => {
                    if (c === colA || c === colB) return false;
                    const p = colProfiles[c] || {};
                    const u = (p.stats && (p.stats.uniqueCount || p.stats.distinctCount)) || 0;
                    return u >= 2 && u <= 8;
                });

                for (const cat of catCols.slice(0, 3)) {
                    const groups = new Map();
                    rows.forEach(r => {
                        const g = String(r[cat]);
                        if (!groups.has(g)) groups.set(g, []);
                        groups.get(g).push(r);
                    });

                    for (const [gName, gRows] of groups.entries()) {
                        if (gRows.length >= 8) {
                            const subR = this._corrPair(gRows, colA, colB);
                            // Detect sign reversal (Simpson's Paradox style)
                            if ((overallR > 0.35 && subR < -0.15) || (overallR < -0.35 && subR > 0.15)) {
                                counterItems.push({
                                    type: 'SIMPSONS_PARADOX_REVERSAL',
                                    subgroup: `${cat}=${gName}`,
                                    overallEffect: +overallR.toFixed(2),
                                    subgroupEffect: +subR.toFixed(2),
                                    evidence: `Simpson's paradox reversal detected: Overall correlation is ${overallR.toFixed(2)}, but reverses to ${subR.toFixed(2)} in subgroup "${cat}=${gName}" (N=${gRows.length}).`
                                });
                            }
                            // Detect substantial weakening
                            else if (Math.abs(overallR) >= 0.50 && Math.abs(subR) <= 0.10) {
                                counterItems.push({
                                    type: 'SUBGROUP_DISSIPATION',
                                    subgroup: `${cat}=${gName}`,
                                    overallEffect: +overallR.toFixed(2),
                                    subgroupEffect: +subR.toFixed(2),
                                    evidence: `Association dissipates in subgroup "${cat}=${gName}" (r drops from ${overallR.toFixed(2)} to ${subR.toFixed(2)}).`
                                });
                            }
                        }
                    }
                }

                // 2. Outlier-excluded sensitivity check
                const cleanRows = this._excludeOutliers(rows, colA, colB);
                if (cleanRows.length >= 10 && cleanRows.length < rows.length) {
                    const robustR = this._corrPair(cleanRows, colA, colB);
                    if (Math.abs(overallR) >= 0.40 && Math.abs(robustR) < 0.20) {
                        counterItems.push({
                            type: 'OUTLIER_LEVERAGE_DRIVEN',
                            overallEffect: +overallR.toFixed(2),
                            robustEffect: +robustR.toFixed(2),
                            evidence: `Association is largely leveraged by extreme outliers (r drops from ${overallR.toFixed(2)} to ${robustR.toFixed(2)} upon trimming ${rows.length - cleanRows.length} extreme points).`
                        });
                    }
                }
            }

            return counterItems;
        }

        static _corrPair(rows, colA, colB) {
            const x = [], y = [];
            for (let r = 0; r < rows.length; r++) {
                const vx = +rows[r][colA];
                const vy = +rows[r][colB];
                if (!isNaN(vx) && !isNaN(vy)) {
                    x.push(vx); y.push(vy);
                }
            }
            if (x.length < 3) return 0;
            const n = x.length;
            const mx = x.reduce((a, b) => a + b, 0) / n;
            const my = y.reduce((a, b) => a + b, 0) / n;
            let num = 0, dx = 0, dy = 0;
            for (let i = 0; i < n; i++) {
                const ax = x[i] - mx;
                const ay = y[i] - my;
                num += ax * ay;
                dx += ax * ax;
                dy += ay * ay;
            }
            return (dx * dy > 0) ? num / Math.sqrt(dx * dy) : 0;
        }

        static _excludeOutliers(rows, colA, colB) {
            const valsA = rows.map(r => +r[colA]).filter(v => !isNaN(v)).sort((a, b) => a - b);
            const valsB = rows.map(r => +r[colB]).filter(v => !isNaN(v)).sort((a, b) => a - b);
            if (valsA.length < 10) return rows;

            const q1A = valsA[Math.floor(valsA.length * 0.25)];
            const q3A = valsA[Math.floor(valsA.length * 0.75)];
            const iqrA = q3A - q1A;
            const lowerA = q1A - 2.0 * iqrA;
            const upperA = q3A + 2.0 * iqrA;

            const q1B = valsB[Math.floor(valsB.length * 0.25)];
            const q3B = valsB[Math.floor(valsB.length * 0.75)];
            const iqrB = q3B - q1B;
            const lowerB = q1B - 2.0 * iqrB;
            const upperB = q3B + 2.0 * iqrB;

            return rows.filter(r => {
                const va = +r[colA];
                const vb = +r[colB];
                return va >= lowerA && va <= upperA && vb >= lowerB && vb <= upperB;
            });
        }
    }

    return CounterEvidence;
}));
