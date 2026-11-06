/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/relationships/derived-variable-detector.js
 * ============================================================================
 * Scans numeric and temporal columns to discover mathematical equations:
 * A + B ≈ C, A - B ≈ C, A * B ≈ C, A / B ≈ C, Lag(A, 1) ≈ B.
 * Marks POSSIBLE_DERIVED_VARIABLE to prevent data leakage and redundancy.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DerivedVariableDetector = {
        /**
         * Detect derived variable relationships
         * @param {Object} dataset - Raw dataset { rows, columns }
         * @param {Object} profile - Profiler output
         * @returns {Array<Object>} Discovered arithmetic and temporal derivation formulas
         */
        detectDerived(dataset, profile) {
            const rows = Array.isArray(dataset?.rows) ? dataset.rows : [];
            const cols = profile?.columns || [];
            if (rows.length < 5 || cols.length < 2) return [];

            const isNum = (c) => ['integer', 'decimal', 'numeric', 'float'].includes(c.detectedType) || 
                                 ['integer', 'decimal', 'numeric', 'float'].includes(c.inferredType) || 
                                 ['integer', 'decimal', 'numeric', 'float'].includes(c.subType);
            const numCols = cols.filter(isNum).map(c => c.name);
            const derived = [];
            const limitCols = Math.min(numCols.length, 10);
            const sample = rows.slice(0, 100);

            // 1. Two-variable derivations: C = A + B, C = A - B, C = A * B, C = A / B
            for (let i = 0; i < limitCols; i++) {
                for (let j = i + 1; j < limitCols; j++) {
                    for (let k = 0; k < limitCols; k++) {
                        if (k === i || k === j) continue;
                        const colA = numCols[i];
                        const colB = numCols[j];
                        const colC = numCols[k];

                        const check = this._testArithmeticFormula(colA, colB, colC, sample);
                        if (check && check.confidence >= 0.92) {
                            // Avoid redundant duplicates
                            if (!derived.some(d => (d.derivedColumn === colC || d.derivedCol === colC) && d.formula === check.formula)) {
                                derived.push({
                                    derivedColumn: colC,
                                    derivedCol: colC,
                                    sourceColumns: [colA, colB],
                                    sourceCols: [colA, colB],
                                    formula: check.formula,
                                    operation: check.operation,
                                    matchRate: +(check.matchRate.toFixed(3)),
                                    confidence: +(check.confidence.toFixed(2)),
                                    maxRelativeError: +(check.maxRelativeError.toFixed(5)),
                                    error: +(check.maxRelativeError.toFixed(5)),
                                    status: 'POSSIBLE_DERIVED_VARIABLE',
                                    implications: [
                                        `"${colC}" appears mathematically computed from "${colA}" and "${colB}".`,
                                        'Using both in predictive models causes multicollinearity or data leakage.'
                                    ]
                                });
                            }
                        }
                    }
                }
            }

            // 2. Temporal Lag derivation: B(t) ≈ A(t-1)
            for (let i = 0; i < limitCols; i++) {
                for (let j = 0; j < limitCols; j++) {
                    if (i === j) continue;
                    const colA = numCols[i];
                    const colB = numCols[j];
                    const lagCheck = this._testTemporalLag(colA, colB, sample);
                    if (lagCheck && lagCheck.confidence >= 0.95) {
                        derived.push({
                            derivedColumn: colB,
                            sourceColumns: [colA],
                            formula: `${colB} ≈ Lag(${colA}, 1)`,
                            operation: 'lag',
                            matchRate: +(lagCheck.matchRate.toFixed(3)),
                            confidence: +(lagCheck.confidence.toFixed(2)),
                            status: 'POSSIBLE_DERIVED_VARIABLE',
                            implications: [
                                `"${colB}" represents a 1-step temporal lag of "${colA}".`,
                                'Useful as a temporal feature; verify directionality.'
                            ]
                        });
                    }
                }
            }

            return derived;
        },

        _testArithmeticFormula(colA, colB, colC, rows) {
            let addMatches = 0, subMatches = 0, mulMatches = 0, divMatches = 0;
            let validRows = 0;
            let maxErr = 0;

            for (let r = 0; r < rows.length; r++) {
                const a = Number(rows[r][colA]);
                const b = Number(rows[r][colB]);
                const c = Number(rows[r][colC]);
                if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) continue;
                validRows++;

                // A + B ≈ C
                const errAdd = Math.abs((a + b) - c);
                if (errAdd < 0.001 || (Math.abs(c) > 0 && errAdd / Math.abs(c) < 0.005)) addMatches++;

                // A - B ≈ C
                const errSub = Math.abs((a - b) - c);
                if (errSub < 0.001 || (Math.abs(c) > 0 && errSub / Math.abs(c) < 0.005)) subMatches++;

                // A * B ≈ C
                const errMul = Math.abs((a * b) - c);
                if (errMul < 0.001 || (Math.abs(c) > 0 && errMul / Math.abs(c) < 0.005)) mulMatches++;

                // A / B ≈ C
                if (Math.abs(b) > 0.0001) {
                    const errDiv = Math.abs((a / b) - c);
                    if (errDiv < 0.001 || (Math.abs(c) > 0 && errDiv / Math.abs(c) < 0.005)) divMatches++;
                }
            }

            if (validRows < 5) return null;

            if (addMatches / validRows >= 0.94) {
                return { formula: `${colC} ≈ ${colA} + ${colB}`, operation: 'addition', matchRate: addMatches / validRows, confidence: 0.96, maxRelativeError: 0.005 };
            }
            if (subMatches / validRows >= 0.94) {
                return { formula: `${colC} ≈ ${colA} - ${colB}`, operation: 'subtraction', matchRate: subMatches / validRows, confidence: 0.96, maxRelativeError: 0.005 };
            }
            if (mulMatches / validRows >= 0.94) {
                return { formula: `${colC} ≈ ${colA} × ${colB}`, operation: 'multiplication', matchRate: mulMatches / validRows, confidence: 0.94, maxRelativeError: 0.005 };
            }
            if (divMatches / validRows >= 0.94) {
                return { formula: `${colC} ≈ ${colA} / ${colB}`, operation: 'division', matchRate: divMatches / validRows, confidence: 0.94, maxRelativeError: 0.005 };
            }

            return null;
        },

        _testTemporalLag(colA, colB, rows) {
            let matches = 0;
            let valid = 0;
            for (let r = 1; r < rows.length; r++) {
                const prevA = Number(rows[r - 1][colA]);
                const currB = Number(rows[r][colB]);
                if (Number.isFinite(prevA) && Number.isFinite(currB)) {
                    valid++;
                    if (Math.abs(prevA - currB) < 0.0001) matches++;
                }
            }
            if (valid < 8) return null;
            const rate = matches / valid;
            if (rate >= 0.95) {
                return { matchRate: rate, confidence: 0.96 };
            }
            return null;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.DerivedVariableDetector = DerivedVariableDetector;

})(typeof window !== 'undefined' ? window : global);
