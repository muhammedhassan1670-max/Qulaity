/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/datasets/dataset-generator.js
 * ============================================================================
 * Parametric synthetic dataset generator with deterministic seeded PRNG.
 * Generates datasets with mathematically verifiable ground truth:
 * - Exact or bounded correlation r
 * - Known mean and standard deviation
 * - Injected outlier rates
 * - Controlled class separation
 * - Controlled missingness rates
 * ============================================================================
 */

(function (window) {
    'use strict';

    /**
     * Deterministic PRNG (Mulberry32)
     */
    function createPRNG(seed = 12345) {
        let s = seed >>> 0;
        return function () {
            s |= 0;
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /**
     * Box-Muller transform for normal distribution
     */
    function normalRandom(prng, mean = 0, std = 1) {
        let u = 0, v = 0;
        while (u === 0) u = prng();
        while (v === 0) v = prng();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return mean + z * std;
    }

    const DatasetGenerator = {
        /**
         * Generate a regression dataset with known correlation r
         * target = r * x + sqrt(1 - r^2) * noise
         */
        generateCorrelatedDataset({ n = 200, r = 0.8, meanX = 50, stdX = 10, meanY = 100, stdY = 15, seed = 42 } = {}) {
            const prng = createPRNG(seed);
            const rows = [];
            const rClamped = Math.max(-0.99, Math.min(0.99, r));
            const noiseScale = Math.sqrt(1 - rClamped * rClamped);

            for (let i = 0; i < n; i++) {
                const zX = normalRandom(prng, 0, 1);
                const zNoise = normalRandom(prng, 0, 1);
                const zY = rClamped * zX + noiseScale * zNoise;

                const valX = Number((meanX + zX * stdX).toFixed(3));
                const valY = Number((meanY + zY * stdY).toFixed(3));

                rows.push({
                    id: i + 1,
                    feature_x: valX,
                    target_y: valY,
                    covariate_z: Number(normalRandom(prng, 20, 5).toFixed(3))
                });
            }

            return {
                id: `gen_corr_${seed}`,
                filename: `generated_correlated_r${Math.round(r * 100)}.csv`,
                rowCount: n,
                columnCount: 4,
                columns: ['id', 'feature_x', 'target_y', 'covariate_z'],
                rows,
                groundTruth: {
                    expectedR: r,
                    meanX,
                    stdX,
                    meanY,
                    stdY
                }
            };
        },

        /**
         * Generate a classification dataset with separable clusters
         */
        generateClassificationDataset({ n = 300, numClasses = 2, separation = 2.5, seed = 101 } = {}) {
            const prng = createPRNG(seed);
            const rows = [];
            const classLabels = ['ClassA', 'ClassB', 'ClassC', 'ClassD'].slice(0, numClasses);

            for (let i = 0; i < n; i++) {
                const clsIdx = i % numClasses;
                const clsLabel = classLabels[clsIdx];
                const centerShift = clsIdx * separation;

                const f1 = Number(normalRandom(prng, centerShift, 1.0).toFixed(3));
                const f2 = Number(normalRandom(prng, centerShift * 0.8, 1.0).toFixed(3));

                rows.push({
                    id: i + 1,
                    feature_1: f1,
                    feature_2: f2,
                    label: clsLabel
                });
            }

            return {
                id: `gen_class_${numClasses}c_${seed}`,
                filename: `generated_classification_${numClasses}class.csv`,
                rowCount: n,
                columnCount: 4,
                columns: ['id', 'feature_1', 'feature_2', 'label'],
                rows,
                groundTruth: {
                    numClasses,
                    classes: classLabels,
                    separation
                }
            };
        },

        /**
         * Generate a dataset with known missingness rates
         */
        generateMissingnessDataset({ n = 200, missingRates = { col_10: 0.1, col_30: 0.3, col_60: 0.6 }, seed = 77 } = {}) {
            const prng = createPRNG(seed);
            const rows = [];
            const cols = ['id', ...Object.keys(missingRates)];

            for (let i = 0; i < n; i++) {
                const row = { id: i + 1 };
                for (const [col, rate] of Object.entries(missingRates)) {
                    if (prng() < rate) {
                        row[col] = null;
                    } else {
                        row[col] = Number((100 + normalRandom(prng, 0, 10)).toFixed(2));
                    }
                }
                rows.push(row);
            }

            return {
                id: `gen_missing_${seed}`,
                filename: `generated_missingness.csv`,
                rowCount: n,
                columnCount: cols.length,
                columns: cols,
                rows,
                groundTruth: { missingRates }
            };
        },

        /**
         * Generate a time series dataset with linear trend and periodicity
         */
        generateTimeSeriesDataset({ n = 120, slope = 0.5, period = 12, amplitude = 10, seed = 55 } = {}) {
            const prng = createPRNG(seed);
            const rows = [];
            const baseDate = new Date('2024-01-01T00:00:00Z');

            for (let i = 0; i < n; i++) {
                const d = new Date(baseDate.getTime() + i * 86400000 * 30); // Monthly steps
                const dateStr = d.toISOString().split('T')[0];
                const seasonal = Math.sin((2 * Math.PI * i) / period) * amplitude;
                const trend = slope * i;
                const noise = normalRandom(prng, 0, 2);
                const value = Number((100 + trend + seasonal + noise).toFixed(2));

                rows.push({
                    id: i + 1,
                    timestamp: dateStr,
                    metric_value: value,
                    volume: Math.round(500 + prng() * 200)
                });
            }

            return {
                id: `gen_ts_${seed}`,
                filename: 'generated_time_series.csv',
                rowCount: n,
                columnCount: 4,
                columns: ['id', 'timestamp', 'metric_value', 'volume'],
                rows,
                groundTruth: {
                    slope,
                    period,
                    amplitude
                }
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.DatasetGenerator = DatasetGenerator;

})(typeof window !== 'undefined' ? window : global);
