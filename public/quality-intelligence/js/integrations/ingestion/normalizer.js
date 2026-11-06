/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/ingestion/normalizer.js
 * ============================================================================
 * Non-destructive data cleaning and type casting.
 * Preserves source integrity: Never mutates raw source records in place.
 * Enforces deterministic conversions: numeric, boolean, datetime, text.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const NULL_LITERALS = new Set([
        '',
        'null',
        'nil',
        'none',
        'n/a',
        'na',
        'undefined',
        '#n/a',
        'nan'
    ]);

    const Normalizer = {
        /**
         * Normalize a single value safely according to target type
         * @param {*} value
         * @param {string} targetType
         * @param {Object} [options]
         * @returns {{ value: *, success: boolean, original: *, converted: boolean, error?: string }}
         */
        normalizeValue(value, targetType = 'TEXT', options = {}) {
            const trimStrings = options.trimStrings !== false;

            if (value === null || value === undefined) {
                return { value: null, success: true, original: value, converted: false };
            }

            if (typeof value === 'string') {
                const trimmed = trimStrings ? value.trim() : value;
                if (NULL_LITERALS.has(trimmed.toLowerCase())) {
                    return { value: null, success: true, original: value, converted: true };
                }
            }

            const normType = (targetType || 'TEXT').toUpperCase();

            try {
                switch (normType) {
                    case 'NUMBER':
                    case 'FLOAT':
                    case 'DOUBLE':
                    case 'DECIMAL': {
                        if (typeof value === 'number') {
                            if (isNaN(value) || !isFinite(value)) {
                                return { value: null, success: true, original: value, converted: true };
                            }
                            return { value, success: true, original: value, converted: false };
                        }
                        const cleanStr = String(value).replace(/[\$,]/g, '').trim();
                        const num = Number(cleanStr);
                        if (isNaN(num) || !isFinite(num)) {
                            return { value, success: false, original: value, converted: false, error: `Cannot convert "${value}" to NUMBER` };
                        }
                        return { value: num, success: true, original: value, converted: true };
                    }

                    case 'INTEGER':
                    case 'INT':
                    case 'BIGINT': {
                        if (typeof value === 'number') {
                            const intVal = Math.trunc(value);
                            return { value: intVal, success: true, original: value, converted: intVal !== value };
                        }
                        const cleanStr = String(value).replace(/[\$,]/g, '').trim();
                        const intNum = parseInt(cleanStr, 10);
                        if (isNaN(intNum)) {
                            return { value, success: false, original: value, converted: false, error: `Cannot convert "${value}" to INTEGER` };
                        }
                        return { value: intNum, success: true, original: value, converted: true };
                    }

                    case 'BOOLEAN':
                    case 'BOOL': {
                        if (typeof value === 'boolean') {
                            return { value, success: true, original: value, converted: false };
                        }
                        const str = String(value).trim().toLowerCase();
                        if (['true', '1', 'yes', 't', 'y'].includes(str)) {
                            return { value: true, success: true, original: value, converted: true };
                        }
                        if (['false', '0', 'no', 'f', 'n'].includes(str)) {
                            return { value: false, success: true, original: value, converted: true };
                        }
                        return { value, success: false, original: value, converted: false, error: `Cannot convert "${value}" to BOOLEAN` };
                    }

                    case 'DATE':
                    case 'DATETIME':
                    case 'TIMESTAMP': {
                        if (value instanceof Date) {
                            return { value: isNaN(value.getTime()) ? null : value.toISOString(), success: !isNaN(value.getTime()), original: value, converted: true };
                        }
                        const d = new Date(value);
                        if (isNaN(d.getTime())) {
                            return { value, success: false, original: value, converted: false, error: `Invalid date format "${value}"` };
                        }
                        return { value: d.toISOString(), success: true, original: value, converted: true };
                    }

                    case 'JSON':
                    case 'OBJECT': {
                        if (typeof value === 'object') {
                            return { value, success: true, original: value, converted: false };
                        }
                        try {
                            const parsed = JSON.parse(value);
                            return { value: parsed, success: true, original: value, converted: true };
                        } catch (err) {
                            return { value, success: false, original: value, converted: false, error: `Invalid JSON string: ${err.message}` };
                        }
                    }

                    case 'TEXT':
                    case 'STRING':
                    default: {
                        if (typeof value === 'string') {
                            const strVal = trimStrings ? value.trim() : value;
                            return { value: strVal, success: true, original: value, converted: strVal !== value };
                        }
                        return { value: String(value), success: true, original: value, converted: true };
                    }
                }
            } catch (err) {
                return { value, success: false, original: value, converted: false, error: err.message };
            }
        },

        /**
         * Normalize a single record according to schema mappings
         * @param {Object} record - Raw record (never mutated)
         * @param {Array<Object>} [mappings] - Output from SchemaMapper
         * @param {Object} [options]
         * @returns {{ normalized: Object, errors: Array<Object>, conversions: number }}
         */
        normalizeRecord(record, mappings = null, options = {}) {
            if (!record || typeof record !== 'object') {
                return { normalized: {}, errors: [{ message: 'Invalid record format' }], conversions: 0 };
            }

            const normalized = {};
            const errors = [];
            let conversions = 0;

            if (!mappings || mappings.length === 0) {
                for (const key of Object.keys(record)) {
                    const rawVal = record[key];
                    const norm = this.normalizeValue(rawVal, 'TEXT', options);
                    normalized[key] = norm.value;
                    if (norm.converted) conversions++;
                    if (!norm.success && norm.error) {
                        errors.push({ column: key, value: rawVal, error: norm.error });
                    }
                }
                return { normalized, errors, conversions };
            }

            for (const mapItem of mappings) {
                const srcKey = mapItem.sourceColumn;
                const tgtKey = mapItem.targetColumn || srcKey;
                const targetType = mapItem.targetType || 'TEXT';
                const rawVal = record[srcKey];

                const norm = this.normalizeValue(rawVal, targetType, options);
                normalized[tgtKey] = norm.value;
                if (norm.converted) conversions++;
                if (!norm.success && norm.error) {
                    errors.push({ column: tgtKey, sourceColumn: srcKey, value: rawVal, error: norm.error });
                }
            }

            return { normalized, errors, conversions };
        },

        /**
         * Normalize a batch of records non-destructively
         * @param {Array<Object>} records
         * @param {Array<Object>} [mappings]
         * @param {Object} [options]
         * @returns {{ records: Array<Object>, rejected: Array<Object>, stats: Object }}
         */
        normalizeBatch(records = [], mappings = null, options = {}) {
            const normalizedRecords = [];
            const rejected = [];
            let totalConversions = 0;
            const startTime = Date.now();

            const strict = options.strictValidation === true;

            for (let i = 0; i < records.length; i++) {
                const raw = records[i];
                const res = this.normalizeRecord(raw, mappings, options);

                if (strict && res.errors.length > 0) {
                    rejected.push({
                        index: i,
                        record: raw,
                        errors: res.errors
                    });
                } else {
                    normalizedRecords.push(res.normalized);
                    totalConversions += res.conversions;
                }
            }

            return {
                records: normalizedRecords,
                rejected,
                stats: {
                    totalRows: records.length,
                    acceptedRows: normalizedRecords.length,
                    rejectedRows: rejected.length,
                    totalConversions,
                    durationMs: Date.now() - startTime
                }
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.Normalizer = Normalizer;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Normalizer;
    }

})(typeof window !== 'undefined' ? window : global);
