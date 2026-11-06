/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/datasets/golden-datasets.js
 * ============================================================================
 * Standardized Golden Validation Datasets Registry:
 * Contains 12 reference datasets covering distinct topologies and analytical
 * paradigms with explicit expected characteristics and ground truth values.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const GoldenDatasets = {
        /**
         * Get all 12 standardized golden datasets
         * @returns {Array<Object>}
         */
        getAll() {
            const gen = window.UDIP?.Validation?.DatasetGenerator;

            return [
                // 1. GOLDEN_REGRESSION
                {
                    id: 'GOLDEN_REGRESSION',
                    name: 'Continuous Multi-Feature Regression Benchmark',
                    expectedTopology: 'cross_sectional',
                    expectedTargetType: 'numeric',
                    expectedTasks: ['regression', 'exploratory_analysis'],
                    dataset: gen ? gen.generateCorrelatedDataset({ n: 250, r: 0.85, seed: 101 }) : {
                        id: 'GOLDEN_REGRESSION',
                        filename: 'golden_regression.csv',
                        rowCount: 200,
                        columnCount: 4,
                        columns: ['id', 'feature_x', 'target_y', 'covariate_z'],
                        rows: Array.from({ length: 200 }, (_, i) => ({
                            id: i + 1,
                            feature_x: 20 + i * 0.5,
                            target_y: 50 + (20 + i * 0.5) * 1.8 + (i % 5),
                            covariate_z: 10 + (i % 10)
                        }))
                    }
                },

                // 2. GOLDEN_TIME_SERIES
                {
                    id: 'GOLDEN_TIME_SERIES',
                    name: 'Temporal Trend & Seasonality Benchmark',
                    expectedTopology: 'time_series',
                    expectedTargetType: 'numeric',
                    expectedTasks: ['forecasting', 'trend_analysis'],
                    dataset: gen ? gen.generateTimeSeriesDataset({ n: 120, slope: 0.6, period: 12, seed: 202 }) : {
                        id: 'GOLDEN_TIME_SERIES',
                        filename: 'golden_time_series.csv',
                        rowCount: 60,
                        columnCount: 3,
                        columns: ['id', 'timestamp', 'metric_value'],
                        rows: Array.from({ length: 60 }, (_, i) => ({
                            id: i + 1,
                            timestamp: `2024-${String((i % 12) + 1).padStart(2, '0')}-01`,
                            metric_value: 100 + i * 2 + Math.sin(i) * 10
                        }))
                    }
                },

                // 3. GOLDEN_BINARY_CLASSIFICATION
                {
                    id: 'GOLDEN_BINARY_CLASSIFICATION',
                    name: 'Binary Classification Benchmark',
                    expectedTopology: 'cross_sectional',
                    expectedTargetType: 'binary',
                    expectedTasks: ['binary_classification', 'group_analysis'],
                    dataset: gen ? gen.generateClassificationDataset({ n: 240, numClasses: 2, separation: 3.0, seed: 303 }) : {
                        id: 'GOLDEN_BINARY_CLASSIFICATION',
                        filename: 'golden_binary.csv',
                        rowCount: 200,
                        columnCount: 4,
                        columns: ['id', 'feature_1', 'feature_2', 'label'],
                        rows: Array.from({ length: 200 }, (_, i) => ({
                            id: i + 1,
                            feature_1: i < 100 ? 10 + (i % 5) : 30 + (i % 5),
                            feature_2: i < 100 ? 5 + (i % 3) : 25 + (i % 3),
                            label: i < 100 ? 'ClassA' : 'ClassB'
                        }))
                    }
                },

                // 4. GOLDEN_MULTICLASS_CLASSIFICATION
                {
                    id: 'GOLDEN_MULTICLASS_CLASSIFICATION',
                    name: 'Multiclass (4 Classes) Benchmark',
                    expectedTopology: 'cross_sectional',
                    expectedTargetType: 'multiclass',
                    expectedTasks: ['multiclass_classification'],
                    dataset: gen ? gen.generateClassificationDataset({ n: 320, numClasses: 4, separation: 2.8, seed: 404 }) : {
                        id: 'GOLDEN_MULTICLASS_CLASSIFICATION',
                        filename: 'golden_multiclass.csv',
                        rowCount: 200,
                        columnCount: 4,
                        columns: ['id', 'feature_1', 'feature_2', 'label'],
                        rows: Array.from({ length: 200 }, (_, i) => ({
                            id: i + 1,
                            feature_1: (i % 4) * 15 + Math.random(),
                            feature_2: (i % 4) * 10 + Math.random(),
                            label: `Tier_${(i % 4) + 1}`
                        }))
                    }
                },

                // 5. GOLDEN_CLUSTERING
                {
                    id: 'GOLDEN_CLUSTERING',
                    name: 'Unsupervised Natural Clustering Benchmark',
                    expectedTopology: 'multivariate_continuous',
                    expectedTargetType: 'none',
                    expectedTasks: ['clustering', 'outlier_analysis'],
                    dataset: {
                        id: 'GOLDEN_CLUSTERING',
                        filename: 'golden_clustering.csv',
                        rowCount: 180,
                        columnCount: 4,
                        columns: ['id', 'dim_x', 'dim_y', 'dim_z'],
                        rows: Array.from({ length: 180 }, (_, i) => {
                            const cluster = i % 3;
                            return {
                                id: i + 1,
                                dim_x: cluster * 50 + ((i * 7) % 15),
                                dim_y: cluster * 40 + ((i * 11) % 15),
                                dim_z: cluster * 30 + ((i * 13) % 15)
                            };
                        })
                    }
                },

                // 6. GOLDEN_MIXED_DATA
                {
                    id: 'GOLDEN_MIXED_DATA',
                    name: 'Heterogeneous Mixed Types Benchmark',
                    expectedTopology: 'mixed_heterogeneous',
                    expectedTargetType: 'numeric',
                    expectedTasks: ['exploratory_analysis', 'regression'],
                    dataset: {
                        id: 'GOLDEN_MIXED_DATA',
                        filename: 'golden_mixed.csv',
                        rowCount: 150,
                        columnCount: 6,
                        columns: ['id', 'active_flag', 'category_code', 'recorded_date', 'temperature', 'performance_score'],
                        rows: Array.from({ length: 150 }, (_, i) => ({
                            id: i + 1,
                            active_flag: i % 2 === 0,
                            category_code: ['Alpha', 'Beta', 'Gamma'][i % 3],
                            recorded_date: `2025-06-${String((i % 28) + 1).padStart(2, '0')}`,
                            temperature: 20.5 + (i % 15),
                            performance_score: 100 + i * 1.2
                        }))
                    }
                },

                // 7. GOLDEN_HIGH_MISSINGNESS
                {
                    id: 'GOLDEN_HIGH_MISSINGNESS',
                    name: 'Extreme Missingness Stress Benchmark',
                    expectedTopology: 'sparse_missing',
                    expectedTargetType: 'sparse',
                    expectedTasks: ['data_cleaning', 'missingness_handling'],
                    dataset: gen ? gen.generateMissingnessDataset({ n: 150, seed: 707 }) : {
                        id: 'GOLDEN_HIGH_MISSINGNESS',
                        filename: 'golden_missingness.csv',
                        rowCount: 100,
                        columnCount: 4,
                        columns: ['id', 'sparse_30', 'sparse_60', 'sparse_90'],
                        rows: Array.from({ length: 100 }, (_, i) => ({
                            id: i + 1,
                            sparse_30: i % 3 === 0 ? null : 100 + i,
                            sparse_60: i % 5 === 0 ? 100 + i : null,
                            sparse_90: i % 10 === 0 ? 100 + i : null
                        }))
                    }
                },

                // 8. GOLDEN_HIGH_CARDINALITY
                {
                    id: 'GOLDEN_HIGH_CARDINALITY',
                    name: 'High Cardinality Categorical Benchmark',
                    expectedTopology: 'high_cardinality',
                    expectedTargetType: 'numeric',
                    expectedTasks: ['exploratory_analysis'],
                    dataset: {
                        id: 'GOLDEN_HIGH_CARDINALITY',
                        filename: 'golden_high_cardinality.csv',
                        rowCount: 200,
                        columnCount: 3,
                        columns: ['id', 'user_token_id', 'metric_value'],
                        rows: Array.from({ length: 200 }, (_, i) => ({
                            id: i + 1,
                            user_token_id: `USR_${i + 1000}_TOKEN`,
                            metric_value: 50 + (i % 20)
                        }))
                    }
                },

                // 9. GOLDEN_NO_TARGET
                {
                    id: 'GOLDEN_NO_TARGET',
                    name: 'Unsupervised No Explicit Target Benchmark',
                    expectedTopology: 'unsupervised',
                    expectedTargetType: 'none',
                    expectedTasks: ['exploratory_analysis', 'anomaly_detection'],
                    dataset: {
                        id: 'GOLDEN_NO_TARGET',
                        filename: 'golden_no_target.csv',
                        rowCount: 120,
                        columnCount: 4,
                        columns: ['id', 'sensor_reading_1', 'sensor_reading_2', 'sensor_reading_3'],
                        rows: Array.from({ length: 120 }, (_, i) => ({
                            id: i + 1,
                            sensor_reading_1: 10 + (i % 8),
                            sensor_reading_2: 20 + (i % 12),
                            sensor_reading_3: 30 + (i % 16)
                        }))
                    }
                },

                // 10. GOLDEN_SMALL_DATASET
                {
                    id: 'GOLDEN_SMALL_DATASET',
                    name: 'Ultra Small Sample Benchmark (n=8)',
                    expectedTopology: 'low_sample',
                    expectedTargetType: 'numeric',
                    expectedTasks: ['exploratory_only_safeguarded'],
                    dataset: {
                        id: 'GOLDEN_SMALL_DATASET',
                        filename: 'golden_small_sample.csv',
                        rowCount: 8,
                        columnCount: 3,
                        columns: ['id', 'val_x', 'val_y'],
                        rows: [
                            { id: 1, val_x: 10, val_y: 20 },
                            { id: 2, val_x: 12, val_y: 24 },
                            { id: 3, val_x: 14, val_y: 28 },
                            { id: 4, val_x: 16, val_y: 32 },
                            { id: 5, val_x: 18, val_y: 36 },
                            { id: 6, val_x: 20, val_y: 40 },
                            { id: 7, val_x: 22, val_y: 44 },
                            { id: 8, val_x: 24, val_y: 48 }
                        ]
                    }
                },

                // 11. GOLDEN_LARGE_DATASET
                {
                    id: 'GOLDEN_LARGE_DATASET',
                    name: 'Scaled Volume Benchmark (n=1500)',
                    expectedTopology: 'large_volume',
                    expectedTargetType: 'numeric',
                    expectedTasks: ['regression', 'benchmarking'],
                    dataset: {
                        id: 'GOLDEN_LARGE_DATASET',
                        filename: 'golden_large.csv',
                        rowCount: 1500,
                        columnCount: 4,
                        columns: ['id', 'feature_1', 'feature_2', 'target'],
                        rows: Array.from({ length: 1500 }, (_, i) => ({
                            id: i + 1,
                            feature_1: 10 + (i % 100) * 0.5,
                            feature_2: 50 + (i % 50) * 0.8,
                            target: 100 + (i % 100) * 1.5 + (i % 10)
                        }))
                    }
                },

                // 12. GOLDEN_ARABIC_ENGLISH
                {
                    id: 'GOLDEN_ARABIC_ENGLISH',
                    name: 'Bilingual RTL/LTR Schema Benchmark',
                    expectedTopology: 'bilingual_unicode',
                    expectedTargetType: 'numeric',
                    expectedTasks: ['exploratory_analysis', 'regression'],
                    dataset: {
                        id: 'GOLDEN_ARABIC_ENGLISH',
                        filename: 'golden_arabic_english.csv',
                        rowCount: 160,
                        columnCount: 5,
                        columns: ['رقم_الطلب', 'المبيعات', 'المنطقة', 'product_cost', 'صافي_الربح'],
                        rows: Array.from({ length: 160 }, (_, i) => ({
                            'رقم_الطلب': i + 1,
                            'المبيعات': 1000 + i * 15,
                            'المنطقة': i % 2 === 0 ? 'القاهرة' : 'الإسكندرية',
                            'product_cost': 400 + i * 5,
                            'صافي_الربح': 600 + i * 10
                        }))
                    }
                }
            ];
        },

        /**
         * Get a single golden dataset by its standard ID
         * @param {string} id
         * @returns {Object|null}
         */
        getById(id) {
            return this.getAll().find(g => g.id === id) || null;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.GoldenDatasets = GoldenDatasets;

})(typeof window !== 'undefined' ? window : global);
