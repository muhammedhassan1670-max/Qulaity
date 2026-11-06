/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: benchmark/datasets/workload-generator.js
 * ============================================================================
 * Parametric Workload & Imperfection Generator:
 * Generates progressive benchmark workloads across two fundamental axes:
 * 1. Dataset Size Ladder (1K, 5K, 10K, 25K, 50K, 100K, 250K rows)
 * 2. Column Dimension Ladder (5, 10, 25, 50, 100, 250, 500 columns)
 *
 * Injects realistic data quality imperfections:
 * - Controlled missingness rates (1%, 5%, 10%, 30%, 60%)
 * - Duplicate records (1% - 15%)
 * - Extreme numerical outliers
 * - High-cardinality categorical explosion
 * - Date format irregularities
 * - High skewness and near-constant distributions
 * ============================================================================
 */

(function (window) {
    'use strict';

    /**
     * Deterministic Mulberry32 PRNG
     */
    function createPRNG(seed = 98765) {
        let s = seed >>> 0;
        return function () {
            s |= 0;
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    const SIZE_LADDER = [1000, 5000, 10000, 25000, 50000, 100000, 250000];
    const DIMENSION_LADDER = [5, 10, 25, 50, 100, 250, 500];

    const WorkloadGenerator = {
        SIZE_LADDER,
        DIMENSION_LADDER,

        /**
         * Generate a dataset of specific row size
         * @param {number} n Row count
         * @param {number} seed
         * @returns {Object} Dataset object
         */
        generateSizeWorkload(n = 1000, seed = 101) {
            const prng = createPRNG(seed);
            const rows = [];
            const cols = ['id', 'feature_a', 'feature_b', 'category', 'target'];

            for (let i = 0; i < n; i++) {
                const a = Number((prng() * 100).toFixed(2));
                const b = Number((a * 1.5 + prng() * 10).toFixed(2));
                const cat = ['Urban', 'Suburban', 'Rural'][Math.floor(prng() * 3)];
                const target = Number((a * 0.8 + b * 0.4 + prng() * 5).toFixed(2));

                rows.push({
                    id: i + 1,
                    feature_a: a,
                    feature_b: b,
                    category: cat,
                    target
                });
            }

            return {
                id: `wl_size_${n}_s${seed}`,
                filename: `workload_size_${n}.csv`,
                sourceType: 'SYNTHETIC',
                rowCount: n,
                columnCount: cols.length,
                columns: cols,
                rows,
                metadata: {
                    testedScale: n,
                    generationSeed: seed
                }
            };
        },

        /**
         * Generate a dataset of specific column count
         * @param {number} numCols Column count
         * @param {number} n Row count, default 500
         * @param {number} seed
         * @returns {Object} Dataset object
         */
        generateDimensionWorkload(numCols = 10, n = 500, seed = 202) {
            const prng = createPRNG(seed);
            const cols = ['id'];
            for (let c = 1; c < numCols; c++) {
                cols.push(`col_${c}`);
            }

            const rows = [];
            for (let i = 0; i < n; i++) {
                const row = { id: i + 1 };
                for (let c = 1; c < numCols; c++) {
                    if (c % 5 === 0) {
                        row[`col_${c}`] = `Cat_${Math.floor(prng() * 5)}`;
                    } else {
                        row[`col_${c}`] = Number((prng() * 50 + c).toFixed(2));
                    }
                }
                rows.push(row);
            }

            return {
                id: `wl_dim_${numCols}_s${seed}`,
                filename: `workload_dim_${numCols}.csv`,
                sourceType: 'SYNTHETIC',
                rowCount: n,
                columnCount: numCols,
                columns: cols,
                rows,
                metadata: {
                    testedDimensions: numCols,
                    rowCount: n,
                    generationSeed: seed
                }
            };
        },

        /**
         * Generate a dataset with controlled real-world quality imperfections
         * @param {Object} options
         * @returns {Object}
         */
        generateStressWorkload({
            n = 1000,
            missingRate = 0.10,
            duplicateRate = 0.05,
            outlierRate = 0.03,
            highCardinality = true,
            seed = 303
        } = {}) {
            const prng = createPRNG(seed);
            const cols = ['id', 'numeric_val', 'skewed_val', 'cardinal_cat', 'date_str', 'target_y'];
            const baseRows = [];

            for (let i = 0; i < n; i++) {
                let numVal = Number((50 + prng() * 50).toFixed(2));
                // Outlier injection
                if (prng() < outlierRate) {
                    numVal = numVal * 100; // Extreme outlier
                }

                // Skewed log-normal-like distribution
                const skewedVal = Number((Math.exp(prng() * 3)).toFixed(2));

                // High cardinality: each row might have unique or near-unique token
                const catVal = highCardinality 
                    ? `CARD_${Math.floor(prng() * (n * 0.4))}`
                    : `GROUP_${Math.floor(prng() * 4)}`;

                // Date strings with occasional irregularities
                let dateStr = '2026-03-01';
                if (i % 20 === 0) {
                    dateStr = '03/01/2026'; // Alternate date format
                } else if (i % 50 === 0) {
                    dateStr = 'not_a_date'; // Corrupt date token
                }

                baseRows.push({
                    id: i + 1,
                    numeric_val: numVal,
                    skewed_val: skewedVal,
                    cardinal_cat: catVal,
                    date_str: dateStr,
                    target_y: Number((numVal * 1.2 + prng() * 5).toFixed(2))
                });
            }

            // Inject Missingness
            baseRows.forEach(row => {
                cols.forEach(c => {
                    if (c !== 'id' && prng() < missingRate) {
                        row[c] = null;
                    }
                });
            });

            // Inject Duplicates
            const duplicateCount = Math.round(n * duplicateRate);
            for (let d = 0; d < duplicateCount; d++) {
                const sourceIdx = Math.floor(prng() * baseRows.length);
                const clone = { ...baseRows[sourceIdx], id: n + d + 1 };
                baseRows.push(clone);
            }

            return {
                id: `wl_stress_m${Math.round(missingRate * 100)}_s${seed}`,
                filename: `workload_stress_imperfections.csv`,
                sourceType: 'STRESS',
                rowCount: baseRows.length,
                columnCount: cols.length,
                columns: cols,
                rows: baseRows,
                imperfectionStats: {
                    injectedMissingRate: missingRate,
                    injectedDuplicateRate: duplicateRate,
                    injectedOutlierRate: outlierRate,
                    highCardinality
                }
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Benchmark = window.UDIP.Benchmark || {};
    window.UDIP.Benchmark.WorkloadGenerator = WorkloadGenerator;

})(typeof window !== 'undefined' ? window : global);
