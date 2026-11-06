/**
 * UDIP Deep Intelligence Evolution vNext
 * GroupDiscovery - Population Segmentation & Cohen's d Effect Sizes
 * Prevents segment explosion via controlled top-K ranking by effect size and sample adequacy.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.GroupDiscovery = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class GroupDiscovery {
        static discover(dataset, profile, maxSegments = 8) {
            if (!dataset || !dataset.columns || !dataset.rows || dataset.rows.length < 10) {
                return [];
            }

            const segments = [];
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

            const catCols = columns.filter(c => {
                const p = colProfiles[c] || {};
                const t = p.detectedType || p.inferredType || '';
                const u = (p.stats && (p.stats.uniqueCount || p.stats.distinctCount)) || 0;
                return (t === 'categorical' || t === 'boolean' || u <= 10) && u >= 2;
            });

            const numCols = columns.filter(c => {
                const p = colProfiles[c] || {};
                const t = p.detectedType || p.inferredType || '';
                return t === 'integer' || t === 'decimal';
            });

            if (catCols.length === 0 || numCols.length === 0) return [];

            for (const cat of catCols.slice(0, 4)) {
                for (const num of numCols.slice(0, 4)) {
                    const groups = new Map();

                    for (let r = 0; r < rows.length; r++) {
                        const gVal = String(rows[r][cat]);
                        const nVal = +rows[r][num];
                        if (gVal !== undefined && gVal !== null && !isNaN(nVal)) {
                            if (!groups.has(gVal)) groups.set(gVal, []);
                            groups.get(gVal).push(nVal);
                        }
                    }

                    // Compare groups with adequate sample size (N >= 5)
                    const validGroups = Array.from(groups.entries()).filter(([_, vals]) => vals.length >= 5);
                    if (validGroups.length >= 2) {
                        for (let i = 0; i < validGroups.length; i++) {
                            for (let j = i + 1; j < validGroups.length; j++) {
                                const [nameA, valsA] = validGroups[i];
                                const [nameB, valsB] = validGroups[j];

                                const mA = valsA.reduce((a, b) => a + b, 0) / valsA.length;
                                const mB = valsB.reduce((a, b) => a + b, 0) / valsB.length;
                                const sA = Math.sqrt(valsA.reduce((a, b) => a + Math.pow(b - mA, 2), 0) / valsA.length) || 1e-4;
                                const sB = Math.sqrt(valsB.reduce((a, b) => a + Math.pow(b - mB, 2), 0) / valsB.length) || 1e-4;

                                const pooledStd = Math.sqrt(((valsA.length - 1) * sA * sA + (valsB.length - 1) * sB * sB) / (valsA.length + valsB.length - 2)) || 1e-4;
                                const cohensD = Math.abs(mA - mB) / pooledStd;

                                if (cohensD >= 0.35) {
                                    segments.push({
                                        groupingColumn: cat,
                                        metricColumn: num,
                                        subgroupA: nameA,
                                        subgroupB: nameB,
                                        sizeA: valsA.length,
                                        sizeB: valsB.length,
                                        meanA: +mA.toFixed(2),
                                        meanB: +mB.toFixed(2),
                                        cohensD: +cohensD.toFixed(3),
                                        effectSizeLevel: cohensD >= 0.8 ? 'LARGE' : (cohensD >= 0.5 ? 'MEDIUM' : 'SMALL'),
                                        status: 'OBSERVED',
                                        evidence: [`Significant difference in "${num}" between "${cat}=${nameA}" (mean ${mA.toFixed(1)}) and "${cat}=${nameB}" (mean ${mB.toFixed(1)}), Cohen's d = ${cohensD.toFixed(2)}.`]
                                    });
                                }
                            }
                        }
                    }
                }
            }

            // Rank by Cohen's d and slice top-K
            return segments.sort((a, b) => b.cohensD - a.cohensD).slice(0, maxSegments);
        }
    }

    return GroupDiscovery;
}));
