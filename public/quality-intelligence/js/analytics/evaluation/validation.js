/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/evaluation/validation.js
 * ============================================================================
 * Provides dataset splitting strategies:
 * 1. Standard train/test and train/val/test splits (randomized or seeded).
 * 2. Chronological splits for time-series datasets (strict temporal order, NO shuffling).
 * Completely domain-agnostic and safe against empty/small inputs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const Validation = {
        /**
         * Perform chronological train/test split preserving temporal order
         * Mandatory for time-series data to avoid future data leakage.
         * 
         * @param {Array} data Array of items
         * @param {number} trainRatio Ratio for train set (e.g. 0.8)
         * @returns {{ train: Array, test: Array, strategy: string, splitIndex: number, trainSize: number, testSize: number }}
         */
        chronologicalSplit(data, trainRatio = 0.8) {
            if (!Array.isArray(data) || data.length === 0) {
                return { train: [], test: [], strategy: 'chronological', splitIndex: 0, trainSize: 0, testSize: 0 };
            }
            if (data.length === 1) {
                return { train: [...data], test: [], strategy: 'chronological', splitIndex: 1, trainSize: 1, testSize: 0 };
            }

            const ratio = Math.max(0.1, Math.min(0.9, trainRatio));
            const splitIndex = Math.max(1, Math.floor(data.length * ratio));

            return {
                train: data.slice(0, splitIndex),
                test: data.slice(splitIndex),
                strategy: 'chronological',
                splitIndex,
                trainSize: splitIndex,
                testSize: data.length - splitIndex
            };
        },

        /**
         * Standard train/test split with deterministic or random shuffling
         * 
         * @param {Array} data Array of items
         * @param {number} testRatio Ratio for test set (default 0.2)
         * @param {number} [seed] Optional seed for reproducible pseudo-randomness
         * @returns {{ train: Array, test: Array, strategy: string, trainSize: number, testSize: number }}
         */
        trainTestSplit(data, testRatio = 0.2, seed = null) {
            if (!Array.isArray(data) || data.length === 0) {
                return { train: [], test: [], strategy: 'random', splitIndex: 0, trainSize: 0, testSize: 0 };
            }
            if (data.length <= 2) {
                return {
                    train: [data[0]],
                    test: data.length > 1 ? [data[1]] : [],
                    strategy: 'random',
                    splitIndex: 1,
                    trainSize: 1,
                    testSize: data.length > 1 ? 1 : 0
                };
            }

            const indices = data.map((_, i) => i);
            this._shuffle(indices, seed);

            const testCount = Math.max(1, Math.floor(data.length * Math.max(0.05, Math.min(0.5, testRatio))));
            const trainCount = data.length - testCount;

            const trainIndices = indices.slice(0, trainCount);
            const testIndices = indices.slice(trainCount);

            return {
                train: trainIndices.map(i => data[i]),
                test: testIndices.map(i => data[i]),
                trainIndices,
                testIndices,
                strategy: 'random',
                trainSize: trainCount,
                testSize: testCount
            };
        },

        /**
         * Standard train/val/test split
         * 
         * @param {Array} data
         * @param {number} trainRatio default 0.7
         * @param {number} valRatio default 0.15
         * @param {number} [seed]
         */
        trainValTestSplit(data, trainRatio = 0.7, valRatio = 0.15, seed = null) {
            if (!Array.isArray(data) || data.length === 0) {
                return { train: [], val: [], test: [], strategy: 'train_val_test', trainSize: 0, valSize: 0, testSize: 0 };
            }

            const indices = data.map((_, i) => i);
            this._shuffle(indices, seed);

            const n = data.length;
            const nTrain = Math.max(1, Math.floor(n * trainRatio));
            const nVal = Math.max(1, Math.floor(n * valRatio));

            const train = indices.slice(0, nTrain).map(i => data[i]);
            const val = indices.slice(nTrain, nTrain + nVal).map(i => data[i]);
            const test = indices.slice(nTrain + nVal).map(i => data[i]);

            return {
                train,
                val,
                test,
                strategy: 'train_val_test',
                trainSize: train.length,
                valSize: val.length,
                testSize: test.length
            };
        },

        /**
         * Pseudo-random shuffle using linear congruential generator if seed provided
         * @private
         */
        _shuffle(arr, seed) {
            let s = seed !== null && seed !== undefined ? seed : Date.now();
            const rng = () => {
                s = (s * 9301 + 49297) % 233280;
                return s / 233280;
            };

            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor((seed !== null ? rng() : Math.random()) * (i + 1));
                const temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = Validation;

})(typeof window !== 'undefined' ? window : global);
