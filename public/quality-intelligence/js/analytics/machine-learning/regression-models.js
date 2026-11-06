/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/machine-learning/regression-models.js
 * ============================================================================
 * Pure JavaScript regression model implementations:
 * 1. Ordinary Least Squares (Linear Regression)
 * 2. Ridge Regression (L2 regularized)
 * 3. Decision Tree Regressor (variance reduction)
 * 4. Random Forest Regressor (bootstrap ensemble)
 * Completely browser-native, zero dependencies, numerical stability guaranteed.
 * ============================================================================
 */

(function (window) {
    'use strict';

    // -------------------------------------------------------------------------
    // Matrix Math Helper (Gaussian elimination with partial pivoting)
    // -------------------------------------------------------------------------
    function solveLinearSystem(A, b) {
        const n = A.length;
        // Augmented matrix
        const M = A.map((row, i) => [...row, b[i]]);

        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
                    maxRow = k;
                }
            }

            const temp = M[i];
            M[i] = M[maxRow];
            M[maxRow] = temp;

            if (Math.abs(M[i][i]) < 1e-12) continue; // Singular or near-singular

            // Eliminate lower rows
            for (let k = i + 1; k < n; k++) {
                const factor = M[k][i] / M[i][i];
                for (let j = i; j <= n; j++) {
                    M[k][j] -= factor * M[i][j];
                }
            }
        }

        // Back substitution
        const x = Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let sum = M[i][n];
            for (let j = i + 1; j < n; j++) {
                sum -= M[i][j] * x[j];
            }
            if (Math.abs(M[i][i]) > 1e-12) {
                x[i] = sum / M[i][i];
            } else {
                x[i] = 0;
            }
        }
        return x;
    }

    // -------------------------------------------------------------------------
    // Regression Models
    // -------------------------------------------------------------------------

    const RegressionModels = {
        /**
         * Train Linear / Ridge Regression model
         * 
         * @param {Array<Array<number>>} X 
         * @param {Array<number>} y 
         * @param {number} [lambda=1e-4] Regularization strength (0 for pure OLS, >0 for Ridge)
         * @returns {Object} Trained linear model
         */
        fitLinear(X, y, lambda = 1e-4) {
            const n = X.length;
            const p = X[0]?.length || 0;

            if (n === 0 || p === 0 || n !== y.length) {
                return { predict: () => [] };
            }

            // Augment X with bias column of 1s: X_aug = [1, x_1, ..., x_p]
            const dim = p + 1;
            const XtX = Array.from({ length: dim }, () => Array(dim).fill(0));
            const Xty = Array(dim).fill(0);

            for (let i = 0; i < n; i++) {
                const xi = [1, ...X[i]];
                const yi = y[i];

                for (let r = 0; r < dim; r++) {
                    Xty[r] += xi[r] * yi;
                    for (let c = 0; c < dim; c++) {
                        XtX[r][c] += xi[r] * xi[c];
                    }
                }
            }

            // Apply ridge regularization on weights (not intercept)
            for (let j = 1; j < dim; j++) {
                XtX[j][j] += lambda;
            }

            const beta = solveLinearSystem(XtX, Xty);
            const intercept = beta[0] || 0;
            const weights = beta.slice(1);

            // Compute feature importances as absolute weight magnitudes
            const absSum = weights.reduce((a, b) => a + Math.abs(b), 0) || 1;
            const featureImportances = weights.map(w => Number((Math.abs(w) / absSum).toFixed(4)));

            return {
                name: lambda > 0.01 ? 'Ridge Regression' : 'Linear Regression',
                type: 'linear',
                intercept: Number(intercept.toFixed(4)),
                weights: weights.map(w => Number(w.toFixed(4))),
                featureImportances,
                predict(newX) {
                    if (!Array.isArray(newX)) return [];
                    return newX.map(row => {
                        let pred = intercept;
                        for (let j = 0; j < Math.min(row.length, weights.length); j++) {
                            pred += row[j] * weights[j];
                        }
                        return Number.isFinite(pred) ? Number(pred.toFixed(4)) : 0;
                    });
                }
            };
        },

        /**
         * Train Decision Tree Regressor
         */
        fitDecisionTree(X, y, maxDepth = 4, minSamplesSplit = 4) {
            const n = X.length;
            const p = X[0]?.length || 0;
            const importances = Array(p).fill(0);

            function calcVar(indices) {
                if (indices.length <= 1) return 0;
                let sum = 0;
                indices.forEach(i => { sum += y[i]; });
                const mean = sum / indices.length;
                let ss = 0;
                indices.forEach(i => { const d = y[i] - mean; ss += d * d; });
                return ss;
            }

            function buildTree(indices, depth) {
                const count = indices.length;
                if (count === 0) return { isLeaf: true, value: 0 };

                let sum = 0;
                indices.forEach(i => { sum += y[i]; });
                const meanVal = sum / count;

                if (depth >= maxDepth || count < minSamplesSplit) {
                    return { isLeaf: true, value: meanVal };
                }

                const currentVar = calcVar(indices);
                let bestGain = 0;
                let bestFeature = -1;
                let bestThreshold = 0;
                let bestLeft = [];
                let bestRight = [];

                for (let feat = 0; feat < p; feat++) {
                    // Sample thresholds from unique values
                    const vals = Array.from(new Set(indices.map(i => X[i][feat]))).sort((a, b) => a - b);
                    for (let v = 0; v < vals.length - 1; v++) {
                        const thresh = (vals[v] + vals[v + 1]) / 2;
                        const left = [];
                        const right = [];

                        indices.forEach(i => {
                            if (X[i][feat] <= thresh) left.push(i);
                            else right.push(i);
                        });

                        if (left.length === 0 || right.length === 0) continue;

                        const leftVar = calcVar(left);
                        const rightVar = calcVar(right);
                        const gain = currentVar - (leftVar + rightVar);

                        if (gain > bestGain) {
                            bestGain = gain;
                            bestFeature = feat;
                            bestThreshold = thresh;
                            bestLeft = left;
                            bestRight = right;
                        }
                    }
                }

                if (bestGain <= 1e-6 || bestFeature === -1) {
                    return { isLeaf: true, value: meanVal };
                }

                importances[bestFeature] += bestGain;

                return {
                    isLeaf: false,
                    feature: bestFeature,
                    threshold: bestThreshold,
                    left: buildTree(bestLeft, depth + 1),
                    right: buildTree(bestRight, depth + 1)
                };
            }

            const allIndices = Array.from({ length: n }, (_, i) => i);
            const root = buildTree(allIndices, 0);

            // Normalize importances
            const impSum = importances.reduce((a, b) => a + b, 0) || 1;
            const normImportances = importances.map(v => Number((v / impSum).toFixed(4)));

            function predictOne(node, row) {
                if (node.isLeaf) return node.value;
                if (row[node.feature] <= node.threshold) {
                    return predictOne(node.left, row);
                } else {
                    return predictOne(node.right, row);
                }
            }

            return {
                name: 'Decision Tree Regressor',
                type: 'tree',
                featureImportances: normImportances,
                predict(newX) {
                    if (!Array.isArray(newX)) return [];
                    return newX.map(row => Number(predictOne(root, row).toFixed(4)));
                }
            };
        },

        /**
         * Train Random Forest Regressor (Ensemble of trees)
         */
        fitRandomForest(X, y, numTrees = 10, maxDepth = 4) {
            const n = X.length;
            const p = X[0]?.length || 0;
            const trees = [];
            const aggregateImportances = Array(p).fill(0);

            for (let t = 0; t < numTrees; t++) {
                // Bootstrap sampling with replacement
                const bootIndices = [];
                for (let i = 0; i < n; i++) {
                    bootIndices.push(Math.floor(Math.random() * n));
                }
                const bootX = bootIndices.map(i => X[i]);
                const bootY = bootIndices.map(i => y[i]);

                const tree = this.fitDecisionTree(bootX, bootY, maxDepth, 4);
                trees.push(tree);

                tree.featureImportances.forEach((imp, f) => {
                    aggregateImportances[f] += imp;
                });
            }

            const impSum = aggregateImportances.reduce((a, b) => a + b, 0) || 1;
            const featureImportances = aggregateImportances.map(v => Number((v / impSum).toFixed(4)));

            return {
                name: 'Random Forest Regressor',
                type: 'forest',
                treeCount: numTrees,
                featureImportances,
                predict(newX) {
                    if (!Array.isArray(newX) || newX.length === 0) return [];
                    const allPreds = trees.map(tree => tree.predict(newX));
                    const nRows = newX.length;
                    const finalPreds = [];

                    for (let r = 0; r < nRows; r++) {
                        let sum = 0;
                        for (let t = 0; t < trees.length; t++) {
                            sum += allPreds[t][r];
                        }
                        finalPreds.push(Number((sum / trees.length).toFixed(4)));
                    }
                    return finalPreds;
                }
            };
        },

        /**
         * Train Gradient Boosted Decision Trees Regressor
         */
        fitGradientBoosting(X, y, numTrees = 15, learningRate = 0.1, maxDepth = 3) {
            const n = X.length;
            const p = X[0]?.length || 0;
            const numY = y.map(v => Number(v) || 0);

            if (n === 0 || p === 0) {
                return {
                    name: 'Gradient Boosted Regressor (GBDT)',
                    type: 'gradient_boosting',
                    treeCount: 0,
                    featureImportances: Array(p).fill(0),
                    predict: () => Array(n).fill(0)
                };
            }

            const f0 = numY.reduce((a, b) => a + b, 0) / n;
            const F = Array(n).fill(f0);
            const trees = [];
            const aggregateImportances = Array(p).fill(0);

            for (let m = 0; m < numTrees; m++) {
                const residuals = numY.map((yVal, i) => yVal - F[i]);
                const tree = this.fitDecisionTree(X, residuals, maxDepth, 3);
                trees.push(tree);

                if (tree.featureImportances) {
                    tree.featureImportances.forEach((imp, j) => {
                        aggregateImportances[j] += imp;
                    });
                }

                for (let i = 0; i < n; i++) {
                    F[i] += learningRate * (tree.predict([X[i]])[0] || 0);
                }
            }

            const impSum = aggregateImportances.reduce((a, b) => a + b, 0) || 1;
            const featureImportances = aggregateImportances.map(v => Number((v / impSum).toFixed(4)));

            return {
                name: 'Gradient Boosted Regressor (GBDT)',
                type: 'gradient_boosting',
                treeCount: numTrees,
                learningRate,
                featureImportances,
                predict(newX) {
                    if (!Array.isArray(newX) || newX.length === 0) return [];
                    return newX.map(row => {
                        let f = f0;
                        trees.forEach(t => {
                            f += learningRate * (t.predict([row])[0] || 0);
                        });
                        return Number(f.toFixed(4));
                    });
                }
            };
        },

        /**
         * Train K-Nearest Neighbors (KNN) Regressor
         */
        fitKNN(X, y, k = 5) {
            const n = X.length;
            const p = X[0]?.length || 0;
            const numY = y.map(v => Number(v) || 0);

            const mins = Array(p).fill(Infinity);
            const maxs = Array(p).fill(-Infinity);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < p; j++) {
                    const val = Number(X[i][j]) || 0;
                    if (val < mins[j]) mins[j] = val;
                    if (val > maxs[j]) maxs[j] = val;
                }
            }

            const normX = X.map(row => row.map((val, j) => {
                const range = maxs[j] - mins[j];
                return range > 1e-9 ? (Number(val) - mins[j]) / range : 0;
            }));

            return {
                name: `K-Nearest Neighbors Regressor (k=${Math.min(k, n)})`,
                type: 'knn',
                k: Math.min(k, n),
                featureImportances: Array(p).fill(Number((1 / (p || 1)).toFixed(4))),
                predict(newX) {
                    if (!Array.isArray(newX) || newX.length === 0) return [];
                    return newX.map(row => {
                        const normRow = row.map((val, j) => {
                            const range = maxs[j] - mins[j];
                            return range > 1e-9 ? (Number(val) - mins[j]) / range : 0;
                        });

                        const distances = [];
                        for (let i = 0; i < n; i++) {
                            let dSq = 0;
                            for (let j = 0; j < p; j++) {
                                const diff = normRow[j] - normX[i][j];
                                dSq += diff * diff;
                            }
                            distances.push({ dist: Math.sqrt(dSq), target: numY[i] });
                        }

                        distances.sort((a, b) => a.dist - b.dist);
                        const effectiveK = Math.min(k, n);
                        let sumWeights = 0;
                        let weightedSum = 0;
                        for (let ki = 0; ki < effectiveK; ki++) {
                            const w = 1 / (distances[ki].dist + 1e-5);
                            weightedSum += w * distances[ki].target;
                            sumWeights += w;
                        }

                        return Number((weightedSum / (sumWeights || 1)).toFixed(4));
                    });
                }
            };
        },

        /**
         * Train Multi-Layer Perceptron (Neural Network) Regressor
         */
        fitMLP(X, y, hiddenUnits = 16, epochs = 120, lr = 0.02) {
            const n = X.length;
            const p = X[0]?.length || 0;
            const numY = y.map(v => Number(v) || 0);

            if (n === 0 || p === 0) {
                return {
                    name: 'Neural Network Regressor (MLP)',
                    type: 'neural_network',
                    featureImportances: Array(p).fill(0),
                    predict: () => Array(n).fill(0)
                };
            }

            const mins = Array(p).fill(Infinity);
            const maxs = Array(p).fill(-Infinity);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < p; j++) {
                    const val = Number(X[i][j]) || 0;
                    if (val < mins[j]) mins[j] = val;
                    if (val > maxs[j]) maxs[j] = val;
                }
            }

            const minY = Math.min(...numY);
            const maxY = Math.max(...numY);
            const rangeY = (maxY - minY) > 1e-9 ? (maxY - minY) : 1;
            const normY = numY.map(v => (v - minY) / rangeY);

            const normX = X.map(row => row.map((val, j) => {
                const range = maxs[j] - mins[j];
                return range > 1e-9 ? (Number(val) - mins[j]) / range : 0;
            }));

            const W1 = Array(p).fill(0).map((_, j) => Array(hiddenUnits).fill(0).map((_, h) => (Math.sin(j * 19 + h * 23) * 0.3)));
            const b1 = Array(hiddenUnits).fill(0);
            const W2 = Array(hiddenUnits).fill(0).map((_, h) => (Math.cos(h * 17) * 0.3));
            let b2 = 0.5;

            const relu = (z) => Math.max(0, z);
            const reluDeriv = (z) => (z > 0 ? 1 : 0);

            for (let epoch = 0; epoch < epochs; epoch++) {
                for (let i = 0; i < n; i++) {
                    const xi = normX[i];
                    const yi = normY[i];

                    const a1 = Array(hiddenUnits).fill(0);
                    const z1 = Array(hiddenUnits).fill(0);
                    for (let h = 0; h < hiddenUnits; h++) {
                        let sum = b1[h];
                        for (let j = 0; j < p; j++) sum += xi[j] * W1[j][h];
                        z1[h] = sum;
                        a1[h] = relu(sum);
                    }

                    let predNorm = b2;
                    for (let h = 0; h < hiddenUnits; h++) predNorm += a1[h] * W2[h];

                    const err = predNorm - yi;

                    b2 -= lr * err;
                    for (let h = 0; h < hiddenUnits; h++) {
                        W2[h] -= lr * err * a1[h];
                    }

                    for (let h = 0; h < hiddenUnits; h++) {
                        const dH = err * W2[h] * reluDeriv(z1[h]);
                        b1[h] -= lr * dH;
                        for (let j = 0; j < p; j++) {
                            W1[j][h] -= lr * dH * xi[j];
                        }
                    }
                }
            }

            const rawImp = Array(p).fill(0);
            for (let j = 0; j < p; j++) {
                for (let h = 0; h < hiddenUnits; h++) {
                    rawImp[j] += Math.abs(W1[j][h]);
                }
            }
            const sumImp = rawImp.reduce((a, b) => a + b, 0) || 1;
            const featureImportances = rawImp.map(v => Number((v / sumImp).toFixed(4)));

            return {
                name: 'Neural Network Regressor (MLP)',
                type: 'neural_network',
                hiddenUnits,
                featureImportances,
                predict(newX) {
                    if (!Array.isArray(newX) || newX.length === 0) return [];
                    return newX.map(row => {
                        const normRow = row.map((val, j) => {
                            const range = maxs[j] - mins[j];
                            return range > 1e-9 ? (Number(val) - mins[j]) / range : 0;
                        });
                        const a1 = Array(hiddenUnits).fill(0);
                        for (let h = 0; h < hiddenUnits; h++) {
                            let sum = b1[h];
                            for (let j = 0; j < p; j++) sum += normRow[j] * W1[j][h];
                            a1[h] = relu(sum);
                        }
                        let predNorm = b2;
                        for (let h = 0; h < hiddenUnits; h++) predNorm += a1[h] * W2[h];
                        const denorm = predNorm * rangeY + minY;
                        return Number(denorm.toFixed(4));
                    });
                }
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.RegressionModels = RegressionModels;

})(typeof window !== 'undefined' ? window : global);
