/**
 * UDIP Deep Intelligence Evolution vNext
 * DerivedVariableDetector - Discovers exact & approximate arithmetic identities & lags
 * Detects: A + B ≈ C, A - B ≈ C, A * B ≈ C, A / B ≈ C, and temporal lags.
 * Flags derivations to prevent data leakage and unnecessary collinearity.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.DerivedVariableDetector = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class DerivedVariableDetector {
        static detect(dataset, profile) {
            if (!dataset || !dataset.columns || !dataset.rows || dataset.rows.length < 5) {
                return [];
            }

            const derivations = [];
            const colProfiles = {};
            if (profile && profile.columns) {
                if (Array.isArray(profile.columns)) {
                    profile.columns.forEach(c => { if (c && c.name) colProfiles[c.name] = c; });
                } else if (typeof profile.columns === 'object') {
                    Object.assign(colProfiles, profile.columns);
                }
            }
            const numCols = dataset.columns.filter(c => {
                const p = colProfiles[c] || {};
                const t = p.detectedType || p.inferredType || '';
                return t === 'integer' || t === 'decimal';
            });

            if (numCols.length < 2) return [];

            const sampleRows = dataset.rows.slice(0, 150);

            // 1. Identity & Arithmetic equation search: A op B = C
            for (let i = 0; i < numCols.length; i++) {
                for (let j = 0; j < numCols.length; j++) {
                    if (i === j) continue;
                    for (let k = 0; k < numCols.length; k++) {
                        if (k === i || k === j) continue;

                        const colA = numCols[i];
                        const colB = numCols[j];
                        const colC = numCols[k];

                        // Test +
                        this._testEquation(sampleRows, colA, colB, colC, '+', (a, b) => a + b, derivations);
                        // Test -
                        this._testEquation(sampleRows, colA, colB, colC, '-', (a, b) => a - b, derivations);
                        // Test *
                        this._testEquation(sampleRows, colA, colB, colC, '×', (a, b) => a * b, derivations);
                        // Test /
                        this._testEquation(sampleRows, colA, colB, colC, '÷', (a, b) => b !== 0 ? a / b : null, derivations);
                    }
                }
            }

            // 2. Temporal Lag Relationships: X(t) ≈ Y(t - 1)
            for (let i = 0; i < numCols.length; i++) {
                for (let j = 0; j < numCols.length; j++) {
                    if (i === j) continue;
                    const colA = numCols[i];
                    const colB = numCols[j];

                    let matchCount = 0;
                    let validCount = 0;

                    for (let r = 1; r < sampleRows.length; r++) {
                        const valA = +sampleRows[r][colA];
                        const valBLag = +sampleRows[r - 1][colB];
                        if (!isNaN(valA) && !isNaN(valBLag)) {
                            validCount++;
                            if (Math.abs(valA - valBLag) <= 1e-4) {
                                matchCount++;
                            }
                        }
                    }

                    if (validCount >= 10 && (matchCount / validCount) >= 0.95) {
                        derivations.push({
                            targetColumn: colA,
                            sourceColumns: [colB],
                            formula: `${colA}(t) ≈ ${colB}(t - 1)`,
                            type: 'TEMPORAL_DERIVATION',
                            errorTolerance: 0.0,
                            confidence: 0.96,
                            status: 'OBSERVED',
                            warning: 'POSSIBLE_TEMPORAL_LAG_LEAKAGE',
                            explanation: `Column "${colA}" appears to be an exact temporal lag of "${colB}" from the preceding row.`
                        });
                    }
                }
            }

            return this._deduplicate(derivations);
        }

        static _testEquation(rows, colA, colB, colC, opSymbol, opFunc, derivations) {
            let matches = 0;
            let valid = 0;
            let maxAbsDiff = 0;

            for (let r = 0; r < rows.length; r++) {
                const a = +rows[r][colA];
                const b = +rows[r][colB];
                const c = +rows[r][colC];

                if (!isNaN(a) && !isNaN(b) && !isNaN(c)) {
                    const expected = opFunc(a, b);
                    if (expected !== null && !isNaN(expected)) {
                        valid++;
                        const diff = Math.abs(c - expected);
                        const relDiff = Math.abs(c) > 1e-6 ? diff / Math.abs(c) : diff;
                        if (diff <= 1e-3 || relDiff <= 0.01) {
                            matches++;
                            if (diff > maxAbsDiff) maxAbsDiff = diff;
                        }
                    }
                }
            }

            if (valid >= 10 && (matches / valid) >= 0.95) {
                const isExact = maxAbsDiff < 1e-4;
                derivations.push({
                    targetColumn: colC,
                    sourceColumns: [colA, colB],
                    formula: `${colC} ≈ ${colA} ${opSymbol} ${colB}`,
                    type: isExact ? 'EXACT_DERIVATION' : 'APPROXIMATE_DERIVATION',
                    errorTolerance: +maxAbsDiff.toFixed(4),
                    confidence: isExact ? 0.99 : 0.92,
                    status: 'OBSERVED',
                    warning: 'POSSIBLE_DERIVED_VARIABLE',
                    explanation: `Column "${colC}" is an arithmetic derivation (${colA} ${opSymbol} ${colB}) matching ${(matches / valid * 100).toFixed(1)}% of rows.`
                });
            }
        }

        static _deduplicate(list) {
            const seen = new Set();
            return list.filter(item => {
                const key = `${item.targetColumn}|${item.formula}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }
    }

    return DerivedVariableDetector;
}));
