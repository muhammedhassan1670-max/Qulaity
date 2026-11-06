/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/machine-learning/preprocessing.js
 * ============================================================================
 * Non-mutating feature engineering and preprocessing engine:
 * 1. Strictly NEVER mutates raw dataset rows (derives independent numerical matrix).
 * 2. Honors Step 2.5 Analysis Plan feature exclusions, leakage flags, and recommendations.
 * 3. Handles missing values (median for numeric, mode for categorical).
 * 4. Categorical encoding (one-hot for cardinality <= 8, label encoding for higher).
 * 5. Feature scaling (StandardScaler with zero-division guards).
 * 6. Date feature extraction (month, day_of_week, day).
 * ============================================================================
 */

(function (window) {
    'use strict';

    const Preprocessing = {
        /**
         * Preprocess dataset into numerical modeling matrices without mutating raw data
         * 
         * @param {Object} params
         * @param {Array<Object>} params.rows Original raw rows
         * @param {Object} params.analysisPlan Step 2.5 Intelligence Plan
         * @param {string} [params.targetCol] Optional explicit target override
         * @param {boolean} [params.scaleFeatures=true] Whether to apply standard scaling
         * @param {Array<string>} [params.selectedFeatures] Optional subset of features to include
         * @returns {Object} Derived modeling representation
         */
        buildModelingData({ rows, analysisPlan, targetCol = null, scaleFeatures = true, selectedFeatures = null }) {
            const emptyResult = {
                valid: false,
                reason: 'No rows provided',
                X: [],
                y: [],
                featureNames: [],
                targetColumn: null,
                rowCount: 0,
                featureCount: 0,
                excludedColumns: []
            };

            if (!Array.isArray(rows) || rows.length === 0) return emptyResult;

            const targetName = targetCol || analysisPlan?.primaryTarget?.column || null;

            // Determine feature exclusions from analysisPlan
            const excludedCols = new Set();
            if (analysisPlan) {
                if (analysisPlan.features?.excluded) {
                    analysisPlan.features.excluded.forEach(f => excludedCols.add(f.column));
                }
                // Exclude high risk leakage columns
                if (analysisPlan.leakage?.findings) {
                    analysisPlan.leakage.findings.forEach(f => {
                        if (f.risk === 'high') excludedCols.add(f.column);
                    });
                }
            }

            // Also exclude target from input features
            if (targetName) excludedCols.add(targetName);

            // Determine all available candidate columns from the first row
            const allCols = Object.keys(rows[0] || {});
            const candidateFeatures = allCols.filter(c => {
                if (excludedCols.has(c)) return false;
                if (Array.isArray(selectedFeatures) && selectedFeatures.length > 0) {
                    return selectedFeatures.includes(c);
                }
                return true;
            });

            if (candidateFeatures.length === 0) {
                return {
                    ...emptyResult,
                    reason: 'Zero usable features after exclusions and target separation',
                    targetColumn: targetName,
                    excludedColumns: Array.from(excludedCols)
                };
            }

            // Inspect feature types and compute imputations on candidate features
            const colTypes = {};
            const imputations = {};
            const categoryEncodings = {};

            candidateFeatures.forEach(col => {
                const nonNullVals = rows.map(r => r[col]).filter(v => v !== null && v !== undefined && String(v).trim() !== '');
                const numVals = nonNullVals.map(v => Number(v)).filter(v => Number.isFinite(v));

                if (numVals.length >= nonNullVals.length * 0.8 && numVals.length > 0) {
                    colTypes[col] = 'numeric';
                    // Compute median for imputation
                    const sorted = [...numVals].sort((a, b) => a - b);
                    imputations[col] = sorted[Math.floor(sorted.length / 2)] || 0;
                } else {
                    // Check if date
                    const dateVals = nonNullVals.map(v => Date.parse(v)).filter(t => !isNaN(t));
                    if (dateVals.length >= nonNullVals.length * 0.8 && dateVals.length > 0) {
                        colTypes[col] = 'date';
                    } else {
                        colTypes[col] = 'categorical';
                        // Mode for categorical imputation
                        const freq = {};
                        nonNullVals.forEach(v => { const s = String(v).trim(); freq[s] = (freq[s] || 0) + 1; });
                        const modeEntry = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
                        imputations[col] = modeEntry ? modeEntry[0] : 'missing';

                        // Check cardinality for encoding
                        const uniqueCats = Object.keys(freq).sort();
                        if (uniqueCats.length <= 8) {
                            categoryEncodings[col] = { type: 'one_hot', categories: uniqueCats };
                        } else {
                            const labelMap = {};
                            uniqueCats.forEach((cat, idx) => { labelMap[cat] = idx; });
                            categoryEncodings[col] = { type: 'label', labelMap };
                        }
                    }
                }
            });

            // Build feature columns schema
            const featureNames = [];
            candidateFeatures.forEach(col => {
                const type = colTypes[col];
                if (type === 'numeric') {
                    featureNames.push(col);
                } else if (type === 'date') {
                    featureNames.push(`${col}_month`);
                    featureNames.push(`${col}_day`);
                    featureNames.push(`${col}_dayOfWeek`);
                } else if (type === 'categorical') {
                    const enc = categoryEncodings[col];
                    if (enc.type === 'one_hot') {
                        enc.categories.forEach(cat => {
                            featureNames.push(`${col}_${cat}`);
                        });
                    } else {
                        featureNames.push(`${col}_encoded`);
                    }
                }
            });

            // Derive non-mutated X and y matrices
            const X = [];
            const y = [];

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (!row) continue;

                // Extract target if exists
                if (targetName) {
                    const rawY = row[targetName];
                    y.push(rawY !== null && rawY !== undefined ? rawY : null);
                }

                // Extract numerical feature row
                const xRow = [];
                candidateFeatures.forEach(col => {
                    const type = colTypes[col];
                    const rawVal = row[col];

                    if (type === 'numeric') {
                        let num = Number(rawVal);
                        if (!Number.isFinite(num)) num = imputations[col];
                        xRow.push(num);
                    } else if (type === 'date') {
                        const parsed = Date.parse(rawVal);
                        if (!isNaN(parsed)) {
                            const d = new Date(parsed);
                            xRow.push(d.getMonth() + 1);
                            xRow.push(d.getDate());
                            xRow.push(d.getDay());
                        } else {
                            xRow.push(1);
                            xRow.push(1);
                            xRow.push(0);
                        }
                    } else if (type === 'categorical') {
                        const strVal = String(rawVal !== null && rawVal !== undefined ? rawVal : '').trim() || imputations[col];
                        const enc = categoryEncodings[col];
                        if (enc.type === 'one_hot') {
                            enc.categories.forEach(cat => {
                                xRow.push(strVal === cat ? 1 : 0);
                            });
                        } else {
                            const labelIdx = enc.labelMap[strVal] !== undefined ? enc.labelMap[strVal] : -1;
                            xRow.push(labelIdx);
                        }
                    }
                });

                X.push(xRow);
            }

            // Feature Scaling (StandardScaler)
            const featureScalers = [];
            if (scaleFeatures && X.length > 0 && featureNames.length > 0) {
                const p = featureNames.length;
                const means = Array(p).fill(0);
                const stds = Array(p).fill(1);

                // Compute means
                for (let j = 0; j < p; j++) {
                    let sum = 0;
                    for (let i = 0; i < X.length; i++) sum += X[i][j];
                    means[j] = sum / X.length;
                }

                // Compute standard deviations
                for (let j = 0; j < p; j++) {
                    let ss = 0;
                    for (let i = 0; i < X.length; i++) {
                        const diff = X[i][j] - means[j];
                        ss += diff * diff;
                    }
                    const variance = X.length > 1 ? ss / (X.length - 1) : 0;
                    stds[j] = Math.sqrt(variance);
                    if (stds[j] <= 1e-9) stds[j] = 1; // Prevent zero division
                }

                // Apply standardization in place on the derived matrix X
                for (let i = 0; i < X.length; i++) {
                    for (let j = 0; j < p; j++) {
                        X[i][j] = Number(((X[i][j] - means[j]) / stds[j]).toFixed(5));
                    }
                }

                for (let j = 0; j < p; j++) {
                    featureScalers.push({
                        feature: featureNames[j],
                        mean: Number(means[j].toFixed(4)),
                        stdDev: Number(stds[j].toFixed(4))
                    });
                }
            }

            return {
                valid: true,
                X,
                y,
                featureNames,
                targetColumn: targetName,
                rowCount: X.length,
                featureCount: featureNames.length,
                imputations,
                categoryEncodings,
                featureScalers,
                excludedColumns: Array.from(excludedCols)
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Preprocessing = Preprocessing;

})(typeof window !== 'undefined' ? window : global);
