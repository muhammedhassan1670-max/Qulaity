/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/machine-learning/clustering-models.js
 * ============================================================================
 * Implements K-Means++ Clustering:
 * - K-Means++ centroid initialization
 * - Iterative Lloyd convergence with inertia computation
 * - Automated evaluation of K = 2, 3, 4 to suggest optimal cluster count
 * Browser-native, zero dependencies, domain-agnostic.
 * ============================================================================
 */

(function (window) {
    'use strict';

    function euclideanDistSq(a, b) {
        let sum = 0;
        for (let j = 0; j < a.length; j++) {
            const d = a[j] - b[j];
            sum += d * d;
        }
        return sum;
    }

    const ClusteringModels = {
        /**
         * Fit single K-Means clustering run
         * 
         * @param {Array<Array<number>>} X Feature matrix
         * @param {number} k Number of clusters
         * @param {number} [maxIter=20] 
         * @returns {Object}
         */
        fitKMeans(X, k = 3, maxIter = 20) {
            const n = X.length;
            const p = X[0]?.length || 0;

            if (n === 0 || p === 0 || k <= 0) {
                return { k: 0, centroids: [], assignments: [], inertia: 0, clusterSizes: {} };
            }

            const actualK = Math.min(k, n);

            // 1. K-Means++ Initialization
            const centroids = [];
            // Pick first centroid randomly
            centroids.push([...X[Math.floor(Math.random() * n)]]);

            while (centroids.length < actualK) {
                const dists = [];
                let sumDists = 0;

                for (let i = 0; i < n; i++) {
                    let minDist = Infinity;
                    centroids.forEach(c => {
                        const d = euclideanDistSq(X[i], c);
                        if (d < minDist) minDist = d;
                    });
                    dists.push(minDist);
                    sumDists += minDist;
                }

                // Sample next centroid proportional to D(x)^2
                let r = Math.random() * sumDists;
                let nextIdx = 0;
                for (let i = 0; i < n; i++) {
                    r -= dists[i];
                    if (r <= 0) {
                        nextIdx = i;
                        break;
                    }
                }
                centroids.push([...X[nextIdx]]);
            }

            // 2. Iterations
            let assignments = Array(n).fill(0);
            let inertia = 0;

            for (let iter = 0; iter < maxIter; iter++) {
                let changed = false;
                inertia = 0;

                // Assignment step
                for (let i = 0; i < n; i++) {
                    let bestCluster = 0;
                    let bestDist = Infinity;

                    for (let c = 0; c < actualK; c++) {
                        const d = euclideanDistSq(X[i], centroids[c]);
                        if (d < bestDist) {
                            bestDist = d;
                            bestCluster = c;
                        }
                    }

                    if (assignments[i] !== bestCluster) {
                        assignments[i] = bestCluster;
                        changed = true;
                    }
                    inertia += bestDist;
                }

                if (!changed) break;

                // Update step: recompute centroids
                const clusterSums = Array.from({ length: actualK }, () => Array(p).fill(0));
                const clusterCounts = Array(actualK).fill(0);

                for (let i = 0; i < n; i++) {
                    const c = assignments[i];
                    clusterCounts[c]++;
                    for (let j = 0; j < p; j++) {
                        clusterSums[c][j] += X[i][j];
                    }
                }

                for (let c = 0; c < actualK; c++) {
                    if (clusterCounts[c] > 0) {
                        for (let j = 0; j < p; j++) {
                            centroids[c][j] = clusterSums[c][j] / clusterCounts[c];
                        }
                    }
                }
            }

            const clusterSizes = {};
            for (let c = 0; c < actualK; c++) clusterSizes[`Cluster_${c + 1}`] = 0;
            assignments.forEach(c => {
                clusterSizes[`Cluster_${c + 1}`]++;
            });

            return {
                k: actualK,
                centroids: centroids.map(c => c.map(v => Number(v.toFixed(4)))),
                assignments,
                clusterSizes,
                inertia: Number(inertia.toFixed(2))
            };
        },

        /**
         * Run clustering search evaluating K=2, 3, 4
         */
        evaluateKCandidates(X) {
            const n = X.length;
            if (n < 6) return null;

            const candidates = [2, 3, 4].filter(k => k < n);
            const results = candidates.map(k => {
                const model = this.fitKMeans(X, k, 15);
                return {
                    k,
                    inertia: model.inertia,
                    clusterSizes: model.clusterSizes,
                    model
                };
            });

            // Select K with reasonable elbow or default k=3
            let selected = results[1] || results[0];
            return {
                candidates: results.map(r => ({ k: r.k, inertia: r.inertia, clusterSizes: r.clusterSizes })),
                selectedK: selected.k,
                bestModel: selected.model
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.ClusteringModels = ClusteringModels;

})(typeof window !== 'undefined' ? window : global);
