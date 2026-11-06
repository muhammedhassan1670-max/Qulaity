/**
 * UDIP Deep Intelligence Evolution vNext
 * KeyDiscoverer - Candidate Primary Key & Composite Key Discovery
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.KeyDiscoverer = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class KeyDiscoverer {
        static discover(dataset, profile) {
            if (!dataset || !dataset.columns || !dataset.rows || dataset.rows.length === 0) {
                return { primaryKeyCandidates: [], compositeKeyCandidates: [] };
            }

            const rowCount = dataset.rows.length;
            const columns = dataset.columns;
            const colProfiles = {};
            if (profile && profile.columns) {
                if (Array.isArray(profile.columns)) {
                    profile.columns.forEach(c => { if (c && c.name) colProfiles[c.name] = c; });
                } else if (typeof profile.columns === 'object') {
                    Object.assign(colProfiles, profile.columns);
                }
            }
            const primaryKeyCandidates = [];
            const compositeKeyCandidates = [];

            // 1. Single Column Candidate Keys (uniqueness = 100%, zero nulls)
            columns.forEach(col => {
                const p = colProfiles[col] || {};
                let uCount = (p.stats && (p.stats.uniqueCount || p.stats.distinctCount)) || 0;
                let nullCount = (p.stats && (p.stats.missingCount || p.stats.nullCount)) || 0;

                if (!uCount && dataset.rows.length > 0) {
                    const set = new Set();
                    let nulls = 0;
                    for (let r = 0; r < dataset.rows.length; r++) {
                        const val = dataset.rows[r][col];
                        if (val === null || val === undefined || val === '') nulls++;
                        set.add(val);
                    }
                    uCount = set.size;
                    nullCount = nulls;
                }

                if (uCount === rowCount && nullCount === 0) {
                    primaryKeyCandidates.push({
                        columns: [col],
                        uniqueness: 1.0,
                        nullCount: 0,
                        confidence: 0.98,
                        status: 'OBSERVED',
                        isSyntheticIndex: col.toLowerCase() === 'id' || col.toLowerCase() === 'index'
                    });
                }
            });

            // 2. Composite Key Candidates (if no single primary key exists or for entity-time panel datasets)
            if (primaryKeyCandidates.length === 0 && columns.length >= 2) {
                // Test top candidate pairs (e.g. Entity + Timestamp)
                for (let i = 0; i < Math.min(columns.length, 6); i++) {
                    for (let j = i + 1; j < Math.min(columns.length, 6); j++) {
                        const colA = columns[i];
                        const colB = columns[j];
                        const set = new Set();
                        let isUnique = true;

                        for (let r = 0; r < Math.min(rowCount, 300); r++) {
                            const key = `${dataset.rows[r][colA]}|${dataset.rows[r][colB]}`;
                            if (set.has(key)) {
                                isUnique = false;
                                break;
                            }
                            set.add(key);
                        }

                        if (isUnique && set.size === Math.min(rowCount, 300)) {
                            compositeKeyCandidates.push({
                                columns: [colA, colB],
                                uniqueness: 1.0,
                                confidence: 0.85,
                                status: 'LIKELY',
                                description: `Composite key candidate formed by [${colA}, ${colB}] uniquely identifies sampled records.`
                            });
                        }
                    }
                }
            }

            return { primaryKeyCandidates, compositeKeyCandidates };
        }
    }

    return KeyDiscoverer;
}));
