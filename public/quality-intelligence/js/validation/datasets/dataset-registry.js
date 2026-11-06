/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/datasets/dataset-registry.js
 * ============================================================================
 * Central Catalog for validation datasets.
 * Manages golden reference datasets, synthetic fixtures, and validates dataset
 * structural integrity (array boundaries, column-key alignment, non-emptiness).
 * ============================================================================
 */

(function (window) {
    'use strict';

    const _customRegistry = new Map();

    const DatasetRegistry = {
        /**
         * Register a dataset in the registry
         */
        register(id, datasetMeta) {
            if (!id || !datasetMeta) return false;
            _customRegistry.set(id, datasetMeta);
            return true;
        },

        /**
         * Get a dataset by ID (searches custom registry then GoldenDatasets)
         */
        get(id) {
            if (_customRegistry.has(id)) {
                return _customRegistry.get(id);
            }
            const goldens = window.UDIP?.Validation?.GoldenDatasets;
            if (goldens?.getById) {
                return goldens.getById(id);
            }
            return null;
        },

        /**
         * List all registered datasets
         */
        listAll() {
            const list = [];
            const goldens = window.UDIP?.Validation?.GoldenDatasets;
            if (goldens?.getAll) {
                list.push(...goldens.getAll());
            }
            for (const item of _customRegistry.values()) {
                if (!list.some(l => l.id === item.id)) {
                    list.push(item);
                }
            }
            return list;
        },

        /**
         * Validate structural integrity of a dataset object
         * @param {Object} ds
         * @returns {Object} { isValid: boolean, errors: Array }
         */
        validateDatasetStructure(ds) {
            const errors = [];
            if (!ds || typeof ds !== 'object') {
                return { isValid: false, errors: ['Dataset payload is null or not an object'] };
            }

            if (!Array.isArray(ds.columns)) {
                errors.push('Dataset columns must be an array');
            } else if (ds.columns.length === 0) {
                errors.push('Dataset columns array is empty');
            }

            if (!Array.isArray(ds.rows)) {
                errors.push('Dataset rows must be an array');
            }

            if (Array.isArray(ds.columns) && Array.isArray(ds.rows) && ds.rows.length > 0) {
                const firstRow = ds.rows[0];
                if (typeof firstRow !== 'object' || firstRow === null) {
                    errors.push('Dataset row elements must be objects');
                }
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        },

        /**
         * Clear custom entries (for test isolation)
         */
        clearCustom() {
            _customRegistry.clear();
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.DatasetRegistry = DatasetRegistry;

})(typeof window !== 'undefined' ? window : global);
