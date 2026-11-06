/**
 * UDIP Deep Intelligence Evolution vNext
 * HierarchyDiscoverer - Discovers candidate parent-child hierarchies
 * Detects relationships such as:
 * Customer -> Orders, Device -> Measurements, Product -> Events, Category -> Subcategory
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.HierarchyDiscoverer = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class HierarchyDiscoverer {
        static discover(dataset, profile) {
            if (!dataset || !dataset.columns || !dataset.rows || dataset.rows.length < 5) {
                return [];
            }

            const hierarchies = [];
            const colProfiles = {};
            if (profile && profile.columns) {
                if (Array.isArray(profile.columns)) {
                    profile.columns.forEach(c => { if (c && c.name) colProfiles[c.name] = c; });
                } else if (typeof profile.columns === 'object') {
                    Object.assign(colProfiles, profile.columns);
                }
            }
            const columns = dataset.columns;
            const rows = dataset.rows;

            // Search for pairs of categorical/identifier columns where Parent strictly groups Child (1-to-many)
            for (let i = 0; i < columns.length; i++) {
                for (let j = 0; j < columns.length; j++) {
                    if (i === j) continue;
                    const parentCol = columns[i];
                    const childCol = columns[j];

                    const p1 = colProfiles[parentCol] || {};
                    const p2 = colProfiles[childCol] || {};

                    const u1 = (p1.stats && (p1.stats.uniqueCount || p1.stats.distinctCount)) || 0;
                    const u2 = (p2.stats && (p2.stats.uniqueCount || p2.stats.distinctCount)) || 0;

                    // Parent must have fewer distinct keys than Child, but both > 1
                    if (u1 > 1 && u2 > u1 && u1 <= rows.length * 0.5) {
                        // Check if each child value maps to exactly one parent value (functional determinism: Child -> Parent)
                        const childToParents = new Map();
                        let isStrictHierarchy = true;

                        for (let r = 0; r < Math.min(rows.length, 200); r++) {
                            const cVal = rows[r][childCol];
                            const pVal = rows[r][parentCol];
                            if (cVal === undefined || cVal === null || pVal === undefined || pVal === null) continue;

                            if (childToParents.has(cVal)) {
                                if (childToParents.get(cVal) !== pVal) {
                                    isStrictHierarchy = false;
                                    break;
                                }
                            } else {
                                childToParents.set(cVal, pVal);
                            }
                        }

                        if (isStrictHierarchy && childToParents.size >= 3) {
                            const ratio = +(u2 / u1).toFixed(2);
                            hierarchies.push({
                                parent: parentCol,
                                child: childCol,
                                parentKeys: u1,
                                childKeys: u2,
                                fanOutRatio: ratio,
                                confidence: 0.88,
                                status: 'LIKELY',
                                evidence: [`Each distinct ${childCol} maps to a single ${parentCol} (branching factor ~${ratio}x).`]
                            });
                        }
                    }
                }
            }

            return hierarchies;
        }
    }

    return HierarchyDiscoverer;
}));
