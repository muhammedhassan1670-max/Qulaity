/**
 * UDIP Deep Intelligence Evolution vNext
 * DependencyDiscoverer - Functional & Deterministic Dependency Discovery
 * Detects functional dependencies X -> Y where knowing X completely determines Y.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.DependencyDiscoverer = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class DependencyDiscoverer {
        static discover(dataset, profile) {
            if (!dataset || !dataset.columns || !dataset.rows || dataset.rows.length < 5) {
                return [];
            }

            const dependencies = [];
            const columns = dataset.columns;
            const rows = dataset.rows;
            const sampleLimit = Math.min(rows.length, 250);

            for (let i = 0; i < Math.min(columns.length, 12); i++) {
                for (let j = 0; j < Math.min(columns.length, 12); j++) {
                    if (i === j) continue;
                    const determinant = columns[i];
                    const dependent = columns[j];

                    const mapping = new Map();
                    let isFunctional = true;
                    let totalValid = 0;

                    for (let r = 0; r < sampleLimit; r++) {
                        const dVal = rows[r][determinant];
                        const depVal = rows[r][dependent];
                        if (dVal === undefined || dVal === null || depVal === undefined || depVal === null) continue;

                        totalValid++;
                        if (mapping.has(dVal)) {
                            if (mapping.get(dVal) !== depVal) {
                                isFunctional = false;
                                break;
                            }
                        } else {
                            mapping.set(dVal, depVal);
                        }
                    }

                    // Only declare functional dependency if meaningful variation exists (mapping size >= 2)
                    if (isFunctional && mapping.size >= 2 && totalValid >= 5) {
                        dependencies.push({
                            determinant: determinant,
                            dependent: dependent,
                            type: 'FUNCTIONAL_DEPENDENCY',
                            mappingCardinality: mapping.size,
                            confidence: 0.92,
                            status: 'OBSERVED',
                            evidence: [`Each value of "${determinant}" deterministically specifies a single value of "${dependent}" across ${totalValid} samples.`]
                        });
                    }
                }
            }

            return dependencies;
        }
    }

    return DependencyDiscoverer;
}));
