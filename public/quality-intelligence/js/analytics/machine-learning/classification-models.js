/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/machine-learning/classification-models.js
 * ============================================================================
 * Pure JavaScript classification model implementations:
 * 1. Logistic Regression (Sigmoid + One-vs-Rest for multiclass)
 * 2. Decision Tree Classifier (Gini impurity reduction)
 * 3. Random Forest Classifier (Bootstrap aggregation + Majority voting)
 * Completely browser-native, zero external dependencies, robust and fast.
 * ============================================================================
 */

(function (window) {
    'use strict';

    function sigmoid(z) {
        if (z < -45) return 0;
        if (z > 45) return 1;
        return 1 / (1 + Math.exp(-z));
    }

    const ClassificationModels = {
        /**
         * Train Binary Logistic Regression via Gradient Descent
         */
        _fitBinaryLogistic(X, yBinary, epochs = 100, lr = 0.05, lambda = 0.01) {
            const n = X.length;
            const p = X[0]?.length || 0;
            const weights = Array(p).fill(0);
            let bias = 0;

            for (let epoch = 0; epoch < epochs; epoch++) {
                const gradW = Array(p).fill(0);
                let gradB = 0;

                for (let i = 0; i < n; i++) {
                    let z = bias;
                    for (let j = 0; j < p; j++) z += weights[j] * X[i][j];
                    const pred = sigmoid(z);
                    const err = pred - yBinary[i];

                    gradB += err;
                    for (let j = 0; j < p; j++) {
                        gradW[j] += err * X[i][j];
                    }
                }

                bias -= (lr * gradB) / n;
                for (let j = 0; j < p; j++) {
                    weights[j] -= (lr * (gradW[j] / n + lambda * weights[j]));
                }
            }

            return {
                weights,
                bias,
                predictProb(row) {
                    let z = bias;
                    for (let j = 0; j < Math.min(row.length, weights.length); j++) {
                        z += weights[j] * row[j];
                    }
                    return sigmoid(z);
                }
            };
        },

        /**
         * Train Logistic Regression (Binary or Multiclass via One-vs-Rest)
         * 
         * @param {Array<Array<number>>} X 
         * @param {Array<string|number>} y 
         * @returns {Object} Trained classifier
         */
        fitLogistic(X, y) {
            const n = X.length;
            const p = X[0]?.length || 0;
            const labels = Array.from(new Set(y.map(v => String(v !== null && v !== undefined ? v : '').trim()))).sort();
            const K = labels.length;

            if (K < 2 || n === 0 || p === 0) {
                return {
                    name: 'Logistic Regression',
                    predict: () => Array(n).fill(labels[0] || 'unknown'),
                    featureImportances: Array(p).fill(0)
                };
            }

            if (K === 2) {
                // Binary
                const posLabel = labels[1];
                const yBinary = y.map(v => String(v).trim() === posLabel ? 1 : 0);
                const model = this._fitBinaryLogistic(X, yBinary);

                const absSum = model.weights.reduce((a, b) => a + Math.abs(b), 0) || 1;
                const featureImportances = model.weights.map(w => Number((Math.abs(w) / absSum).toFixed(4)));

                return {
                    name: 'Logistic Regression',
                    type: 'linear',
                    isBinary: true,
                    labels,
                    featureImportances,
                    predict(newX) {
                        if (!Array.isArray(newX)) return [];
                        return newX.map(row => {
                            const prob = model.predictProb(row);
                            return prob >= 0.5 ? labels[1] : labels[0];
                        });
                    }
                };
            } else {
                // One-vs-Rest Multiclass
                const ovrModels = labels.map(targetLabel => {
                    const yBinary = y.map(v => String(v).trim() === targetLabel ? 1 : 0);
                    return this._fitBinaryLogistic(X, yBinary);
                });

                // Aggregate feature importance across binary models
                const totalWeights = Array(p).fill(0);
                ovrModels.forEach(m => {
                    m.weights.forEach((w, j) => { totalWeights[j] += Math.abs(w); });
                });
                const absSum = totalWeights.reduce((a, b) => a + b, 0) || 1;
                const featureImportances = totalWeights.map(w => Number((w / absSum).toFixed(4)));

                return {
                    name: 'Multiclass Logistic Regression (OvR)',
                    type: 'linear',
                    isBinary: false,
                    labels,
                    featureImportances,
                    predict(newX) {
                        if (!Array.isArray(newX)) return [];
                        return newX.map(row => {
                            let maxProb = -1;
                            let bestLabel = labels[0];
                            ovrModels.forEach((m, idx) => {
                                const prob = m.predictProb(row);
                                if (prob > maxProb) {
                                    maxProb = prob;
                                    bestLabel = labels[idx];
                                }
                            });
                            return bestLabel;
                        });
                    }
                };
            }
        },

        /**
         * Train Decision Tree Classifier using Gini impurity
         */
        fitDecisionTree(X, y, maxDepth = 4, minSamplesSplit = 4) {
            const n = X.length;
            const p = X[0]?.length || 0;
            const strY = y.map(v => String(v !== null && v !== undefined ? v : '').trim());
            const labels = Array.from(new Set(strY)).sort();
            const importances = Array(p).fill(0);

            function calcGini(indices) {
                const count = indices.length;
                if (count === 0) return 0;
                const counts = {};
                indices.forEach(i => {
                    const label = strY[i];
                    counts[label] = (counts[label] || 0) + 1;
                });
                let sumSq = 0;
                Object.values(counts).forEach(c => {
                    const p_k = c / count;
                    sumSq += p_k * p_k;
                });
                return 1 - sumSq;
            }

            function majorityClass(indices) {
                const counts = {};
                indices.forEach(i => {
                    const label = strY[i];
                    counts[label] = (counts[label] || 0) + 1;
                });
                let maxC = -1;
                let best = labels[0];
                Object.entries(counts).forEach(([label, c]) => {
                    if (c > maxC) { maxC = c; best = label; }
                });
                return best;
            }

            function buildTree(indices, depth) {
                const count = indices.length;
                if (count === 0) return { isLeaf: true, label: labels[0] };

                const majLabel = majorityClass(indices);
                const currentGini = calcGini(indices);

                if (depth >= maxDepth || count < minSamplesSplit || currentGini <= 1e-6) {
                    return { isLeaf: true, label: majLabel };
                }

                let bestGain = 0;
                let bestFeature = -1;
                let bestThreshold = 0;
                let bestLeft = [];
                let bestRight = [];

                for (let feat = 0; feat < p; feat++) {
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

                        const leftGini = calcGini(left);
                        const rightGini = calcGini(right);
                        const gain = currentGini - ((left.length / count) * leftGini + (right.length / count) * rightGini);

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
                    return { isLeaf: true, label: majLabel };
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

            const impSum = importances.reduce((a, b) => a + b, 0) || 1;
            const normImportances = importances.map(v => Number((v / impSum).toFixed(4)));

            function predictOne(node, row) {
                if (node.isLeaf) return node.label;
                if (row[node.feature] <= node.threshold) {
                    return predictOne(node.left, row);
                } else {
                    return predictOne(node.right, row);
                }
            }

            return {
                name: 'Decision Tree Classifier',
                type: 'tree',
                labels,
                featureImportances: normImportances,
                predict(newX) {
                    if (!Array.isArray(newX)) return [];
                    return newX.map(row => predictOne(root, row));
                }
            };
        },

        /**
         * Train Random Forest Classifier
         */
        fitRandomForest(X, y, numTrees = 10, maxDepth = 4) {
            const n = X.length;
            const p = X[0]?.length || 0;
            const trees = [];
            const aggregateImportances = Array(p).fill(0);

            for (let t = 0; t < numTrees; t++) {
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
                name: 'Random Forest Classifier',
                type: 'forest',
                treeCount: numTrees,
                featureImportances,
                predict(newX) {
                    if (!Array.isArray(newX) || newX.length === 0) return [];
                    const allPreds = trees.map(tree => tree.predict(newX));
                    const nRows = newX.length;
                    const finalPreds = [];

                    for (let r = 0; r < nRows; r++) {
                        const votes = {};
                        for (let t = 0; t < trees.length; t++) {
                            const vote = allPreds[t][r];
                            votes[vote] = (votes[vote] || 0) + 1;
                        }
                        const winner = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
                        finalPreds.push(winner);
                    }
                    return finalPreds;
                }
            };
        },

        /**
         * Train Gradient Boosted Decision Trees Classifier
         */
        fitGradientBoosting(X, y, numTrees = 15, learningRate = 0.1, maxDepth = 3) {
            const n = X.length;
            const p = X[0]?.length || 0;
            const labels = Array.from(new Set(y.map(v => String(v != null ? v : '').trim()))).sort();
            const K = labels.length;

            if (K < 2 || n === 0 || p === 0) {
                return {
                    name: 'Gradient Boosted Trees (GBDT)',
                    type: 'gradient_boosting',
                    treeCount: 0,
                    featureImportances: Array(p).fill(0),
                    predict: () => Array(n).fill(labels[0] || 'unknown'),
                    predictProb: () => [1, 0]
                };
            }

            const sigmoid = (z) => (z < -45 ? 0 : (z > 45 ? 1 : 1 / (1 + Math.exp(-z))));

            // Binary Classification
            if (K === 2) {
                const positiveLabel = labels[1];
                const yBinary = y.map(v => (String(v).trim() === positiveLabel ? 1 : 0));
                const p1Count = yBinary.filter(v => v === 1).length;
                const priorProb = Math.max(1e-4, Math.min(1 - 1e-4, p1Count / (n || 1)));
                const f0 = Math.log(priorProb / (1 - priorProb));
                const F = Array(n).fill(f0);
                const trees = [];
                const aggregateImportances = Array(p).fill(0);

                for (let m = 0; m < numTrees; m++) {
                    const residuals = F.map((fVal, i) => yBinary[i] - sigmoid(fVal));
                    const tree = window.UDIP && window.UDIP.RegressionModels
                        ? window.UDIP.RegressionModels.fitDecisionTree(X, residuals, maxDepth, 3)
                        : null;
                    if (!tree) break;
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
                    name: 'Gradient Boosted Trees (GBDT)',
                    type: 'gradient_boosting',
                    treeCount: trees.length,
                    learningRate,
                    featureImportances,
                    predict(newX) {
                        if (!Array.isArray(newX) || newX.length === 0) return [];
                        return newX.map(row => {
                            let f = f0;
                            trees.forEach(t => {
                                const pred = t.predict([row])[0] || 0;
                                f += learningRate * pred;
                            });
                            return sigmoid(f) >= 0.5 ? labels[1] : labels[0];
                        });
                    },
                    predictProb(row) {
                        let f = f0;
                        trees.forEach(t => {
                            const pred = t.predict([row])[0] || 0;
                            f += learningRate * pred;
                        });
                        const prob1 = sigmoid(f);
                        return [1 - prob1, prob1];
                    }
                };
            }

            // Multiclass Classification via One-vs-Rest
            const binaryClassifiers = {};
            const aggregateImportances = Array(p).fill(0);

            labels.forEach(label => {
                const yBin = y.map(v => (String(v).trim() === label ? label : `not_${label}`));
                const subModel = this.fitGradientBoosting(X, yBin, numTrees, learningRate, maxDepth);
                binaryClassifiers[label] = subModel;
                subModel.featureImportances.forEach((imp, f) => {
                    aggregateImportances[f] += imp;
                });
            });

            const impSum = aggregateImportances.reduce((a, b) => a + b, 0) || 1;
            const featureImportances = aggregateImportances.map(v => Number((v / impSum).toFixed(4)));

            return {
                name: 'Gradient Boosted Trees (GBDT)',
                type: 'gradient_boosting',
                treeCount: numTrees,
                learningRate,
                featureImportances,
                predict(newX) {
                    if (!Array.isArray(newX) || newX.length === 0) return [];
                    return newX.map(row => {
                        let bestLabel = labels[0];
                        let maxProb = -1;
                        labels.forEach(lbl => {
                            const probs = binaryClassifiers[lbl].predictProb(row);
                            const prob = probs[1] || 0;
                            if (prob > maxProb) {
                                maxProb = prob;
                                bestLabel = lbl;
                            }
                        });
                        return bestLabel;
                    });
                },
                predictProb(row) {
                    const rawProbs = labels.map(lbl => {
                        const probs = binaryClassifiers[lbl].predictProb(row);
                        return probs[1] || 0;
                    });
                    const sum = rawProbs.reduce((a, b) => a + b, 0) || 1;
                    return rawProbs.map(p => p / sum);
                }
            };
        },

        /**
         * Train K-Nearest Neighbors (KNN) Classifier
         */
        fitKNN(X, y, k = 5) {
            const n = X.length;
            const p = X[0]?.length || 0;
            const labels = Array.from(new Set(y.map(v => String(v != null ? v : '').trim()))).sort();

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

            const featureImportances = Array(p).fill(Number((1 / (p || 1)).toFixed(4)));

            return {
                name: `K-Nearest Neighbors (k=${Math.min(k, n)})`,
                type: 'knn',
                k: Math.min(k, n),
                featureImportances,
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
                            distances.push({ dist: Math.sqrt(dSq), label: String(y[i]).trim() });
                        }

                        distances.sort((a, b) => a.dist - b.dist);
                        const effectiveK = Math.min(k, n);
                        const votes = {};
                        for (let ki = 0; ki < effectiveK; ki++) {
                            const nb = distances[ki];
                            const weight = 1 / (nb.dist + 1e-5);
                            votes[nb.label] = (votes[nb.label] || 0) + weight;
                        }

                        return Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0] || labels[0];
                    });
                }
            };
        },

        /**
         * Train Multi-Layer Perceptron (Neural Network) Classifier
         */
        fitMLP(X, y, hiddenUnits = 16, epochs = 120, lr = 0.05) {
            const n = X.length;
            const p = X[0]?.length || 0;
            const labels = Array.from(new Set(y.map(v => String(v != null ? v : '').trim()))).sort();
            const K = labels.length;

            if (K < 2 || n === 0 || p === 0) {
                return {
                    name: 'Neural Network (MLP)',
                    type: 'neural_network',
                    featureImportances: Array(p).fill(0),
                    predict: () => Array(n).fill(labels[0] || 'unknown')
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

            const normX = X.map(row => row.map((val, j) => {
                const range = maxs[j] - mins[j];
                return range > 1e-9 ? (Number(val) - mins[j]) / range : 0;
            }));

            const W1 = Array(p).fill(0).map((_, j) => Array(hiddenUnits).fill(0).map((_, h) => ((Math.sin(j * 17 + h * 31) * 0.4))));
            const b1 = Array(hiddenUnits).fill(0);
            const W2 = Array(hiddenUnits).fill(0).map((_, h) => Array(K).fill(0).map((_, k) => ((Math.cos(h * 13 + k * 29) * 0.4))));
            const b2 = Array(K).fill(0);

            const relu = (z) => Math.max(0, z);
            const reluDeriv = (z) => (z > 0 ? 1 : 0);
            const softmax = (arr) => {
                const max = Math.max(...arr);
                const exp = arr.map(v => Math.exp(Math.max(-45, Math.min(45, v - max))));
                const sum = exp.reduce((a, b) => a + b, 0) || 1;
                return exp.map(v => v / sum);
            };

            for (let epoch = 0; epoch < epochs; epoch++) {
                for (let i = 0; i < n; i++) {
                    const xi = normX[i];
                    const targetIdx = labels.indexOf(String(y[i]).trim());

                    const z1 = Array(hiddenUnits).fill(0);
                    const a1 = Array(hiddenUnits).fill(0);
                    for (let h = 0; h < hiddenUnits; h++) {
                        let sum = b1[h];
                        for (let j = 0; j < p; j++) sum += xi[j] * W1[j][h];
                        z1[h] = sum;
                        a1[h] = relu(sum);
                    }

                    const z2 = Array(K).fill(0);
                    for (let k = 0; k < K; k++) {
                        let sum = b2[k];
                        for (let h = 0; h < hiddenUnits; h++) sum += a1[h] * W2[h][k];
                        z2[k] = sum;
                    }
                    const probs = softmax(z2);

                    const dZ2 = Array(K).fill(0);
                    for (let k = 0; k < K; k++) {
                        const y_k = (k === targetIdx) ? 1 : 0;
                        dZ2[k] = probs[k] - y_k;
                    }

                    const dZ1 = Array(hiddenUnits).fill(0);
                    for (let h = 0; h < hiddenUnits; h++) {
                        let sum = 0;
                        for (let k = 0; k < K; k++) sum += dZ2[k] * W2[h][k];
                        dZ1[h] = sum * reluDeriv(z1[h]);
                    }

                    for (let k = 0; k < K; k++) {
                        b2[k] -= lr * dZ2[k];
                        for (let h = 0; h < hiddenUnits; h++) {
                            W2[h][k] -= lr * dZ2[k] * a1[h];
                        }
                    }

                    for (let h = 0; h < hiddenUnits; h++) {
                        b1[h] -= lr * dZ1[h];
                        for (let j = 0; j < p; j++) {
                            W1[j][h] -= lr * dZ1[h] * xi[j];
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
                name: 'Neural Network (MLP)',
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
                        const z2 = Array(K).fill(0);
                        for (let k = 0; k < K; k++) {
                            let sum = b2[k];
                            for (let h = 0; h < hiddenUnits; h++) sum += a1[h] * W2[h][k];
                            z2[k] = sum;
                        }
                        const probs = softmax(z2);
                        let bestK = 0;
                        let maxP = -1;
                        probs.forEach((pr, idx) => {
                            if (pr > maxP) { maxP = pr; bestK = idx; }
                        });
                        return labels[bestK];
                    });
                }
            };
        },

        /**
         * Train Gaussian Naive Bayes Classifier
         */
        fitNaiveBayes(X, y) {
            const n = X.length;
            const p = X[0]?.length || 0;
            const labels = Array.from(new Set(y.map(v => String(v != null ? v : '').trim()))).sort();

            const stats = {};
            labels.forEach(label => {
                const matching = X.filter((_, i) => String(y[i]).trim() === label);
                const prior = matching.length / (n || 1);
                const means = Array(p).fill(0);
                const variances = Array(p).fill(1e-4);

                for (let j = 0; j < p; j++) {
                    const vals = matching.map(r => Number(r[j]) || 0);
                    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
                    means[j] = mean;
                    let varSum = 0;
                    vals.forEach(v => varSum += (v - mean) ** 2);
                    variances[j] = Math.max(1e-4, varSum / (vals.length || 1));
                }

                stats[label] = { prior, means, variances };
            });

            return {
                name: 'Gaussian Naive Bayes',
                type: 'naive_bayes',
                featureImportances: Array(p).fill(Number((1 / (p || 1)).toFixed(4))),
                predict(newX) {
                    if (!Array.isArray(newX) || newX.length === 0) return [];
                    return newX.map(row => {
                        let bestLabel = labels[0];
                        let maxLogPost = -Infinity;

                        labels.forEach(label => {
                            const { prior, means, variances } = stats[label];
                            let logPost = Math.log(prior || 1e-6);

                            for (let j = 0; j < p; j++) {
                                const x = Number(row[j]) || 0;
                                const m = means[j];
                                const v = variances[j];
                                const logLik = -0.5 * Math.log(2 * Math.PI * v) - ((x - m) ** 2) / (2 * v);
                                logPost += logLik;
                            }

                            if (logPost > maxLogPost) {
                                maxLogPost = logPost;
                                bestLabel = label;
                            }
                        });

                        return bestLabel;
                    });
                }
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.ClassificationModels = ClassificationModels;

})(typeof window !== 'undefined' ? window : global);
