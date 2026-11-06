/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/evaluation/classification-metrics.js
 * ============================================================================
 * Computes comprehensive classification performance metrics:
 * Accuracy, Precision, Recall, F1, Balanced Accuracy, Confusion Matrix,
 * Macro F1, and Weighted F1.
 * Supports both Binary and Multiclass targets with zero-division safety.
 * Guarantees NO NaN, NO Infinity, and NO undefined outputs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ClassificationMetrics = {
        /**
         * Compute classification metrics
         * 
         * @param {Array<string|number>} actual 
         * @param {Array<string|number>} predicted 
         * @param {Array<string|number>} [knownClasses] Optional known class labels across dataset
         * @returns {Object} Comprehensive evaluation metrics
         */
        calculate(actual, predicted, knownClasses = null) {
            const emptyResult = {
                accuracy: 0,
                precision: 0,
                recall: 0,
                f1: 0,
                balancedAccuracy: 0,
                macroF1: 0,
                weightedF1: 0,
                classes: [],
                classDistribution: {},
                confusionMatrix: { labels: [], matrix: [] },
                isBinary: false,
                n: 0
            };

            if (!Array.isArray(actual) || !Array.isArray(predicted) || actual.length === 0 || predicted.length === 0) {
                return emptyResult;
            }

            const n = Math.min(actual.length, predicted.length);
            const validPairs = [];
            const classCounts = {};

            for (let i = 0; i < n; i++) {
                const a = String(actual[i] !== null && actual[i] !== undefined ? actual[i] : '').trim();
                const p = String(predicted[i] !== null && predicted[i] !== undefined ? predicted[i] : '').trim();
                if (a !== '') {
                    validPairs.push({ a, p });
                    classCounts[a] = (classCounts[a] || 0) + 1;
                }
            }

            const count = validPairs.length;
            if (count === 0) return emptyResult;

            // Collect all unique labels (from actual, predicted, and knownClasses)
            const labelSet = new Set(Object.keys(classCounts));
            validPairs.forEach(pair => { if (pair.p !== '') labelSet.add(pair.p); });
            if (Array.isArray(knownClasses)) {
                knownClasses.forEach(c => {
                    const str = String(c !== null && c !== undefined ? c : '').trim();
                    if (str !== '') labelSet.add(str);
                });
            }
            const labels = Array.from(labelSet).sort();
            const labelIndices = {};
            labels.forEach((l, idx) => { labelIndices[l] = idx; });

            const K = labels.length;
            const matrix = Array.from({ length: K }, () => Array(K).fill(0));

            let correctTotal = 0;
            validPairs.forEach(pair => {
                const row = labelIndices[pair.a];
                const col = labelIndices[pair.p];
                if (row !== undefined && col !== undefined) {
                    matrix[row][col]++;
                    if (row === col) correctTotal++;
                }
            });

            const overallAccuracy = count > 0 ? correctTotal / count : 0;
            const isBinary = K === 2;

            // Per-class metrics
            const perClass = {};
            let sumRecall = 0;
            let sumF1 = 0;
            let weightedSumF1 = 0;

            labels.forEach((label, i) => {
                const tp = matrix[i][i];
                let rowSum = 0; // actual instances of label i
                let colSum = 0; // predicted instances of label i

                for (let c = 0; c < K; c++) rowSum += matrix[i][c];
                for (let r = 0; r < K; r++) colSum += matrix[r][i];

                const prec = colSum > 0 ? tp / colSum : 0;
                const rec = rowSum > 0 ? tp / rowSum : 0;
                const f1 = (prec + rec) > 0 ? (2 * prec * rec) / (prec + rec) : 0;

                perClass[label] = {
                    count: rowSum,
                    precision: Number(prec.toFixed(4)),
                    recall: Number(rec.toFixed(4)),
                    f1: Number(f1.toFixed(4))
                };

                sumRecall += rec;
                sumF1 += f1;
                weightedSumF1 += f1 * rowSum;
            });

            const balancedAccuracy = K > 0 ? sumRecall / K : 0;
            const macroF1 = K > 0 ? sumF1 / K : 0;
            const weightedF1 = count > 0 ? weightedSumF1 / count : 0;

            // For binary classification, use the positive class (or 2nd label) for single precision/recall/f1
            let primaryPrecision = 0;
            let primaryRecall = 0;
            let primaryF1 = 0;

            if (isBinary) {
                // Determine positive class (prefer "1", "true", "yes", or label[1])
                const posLabel = labels.find(l => ['1', 'true', 'yes', 'positive'].includes(l.toLowerCase())) || labels[1];
                const posMetrics = perClass[posLabel] || perClass[labels[0]];
                primaryPrecision = posMetrics ? posMetrics.precision : 0;
                primaryRecall = posMetrics ? posMetrics.recall : 0;
                primaryF1 = posMetrics ? posMetrics.f1 : 0;
            } else {
                primaryPrecision = Number(macroF1.toFixed(4));
                primaryRecall = Number(balancedAccuracy.toFixed(4));
                primaryF1 = Number(macroF1.toFixed(4));
            }

            return {
                accuracy: Number(overallAccuracy.toFixed(4)),
                precision: Number(primaryPrecision.toFixed(4)),
                recall: Number(primaryRecall.toFixed(4)),
                f1: Number(primaryF1.toFixed(4)),
                balancedAccuracy: Number(balancedAccuracy.toFixed(4)),
                macroF1: Number(macroF1.toFixed(4)),
                weightedF1: Number(weightedF1.toFixed(4)),
                perClass,
                classes: labels,
                classDistribution: classCounts,
                confusionMatrix: {
                    labels,
                    matrix
                },
                isBinary,
                n: count
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.ClassificationMetrics = ClassificationMetrics;

})(typeof window !== 'undefined' ? window : global);
