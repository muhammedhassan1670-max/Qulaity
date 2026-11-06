/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/ingestion/ingestion-validator.js
 * ============================================================================
 * Pre-commit validation and rejected rows tracking.
 * Ensures data integrity before records are committed to DatasetManager.
 * Invariant: Never allow corrupted or incompatible records to silently enter.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const IngestionValidator = {
        /**
         * Validate an array of normalized records against schema and constraints
         * @param {Array<Object>} records
         * @param {Array<Object>} [schema] - Column definitions: [{ name, type, nullable, primaryKey }]
         * @param {Object} [rules] - Validation options: { maxErrorRate: 0.1, primaryKeyField: 'id' }
         * @returns {Object} { valid: boolean, accepted: Array, rejected: Array, summary: Object }
         */
        validate(records = [], schema = [], rules = {}) {
            const accepted = [];
            const rejected = [];
            const violationsSummary = {};
            const seenPrimaryKeys = new Set();

            const maxErrorRate = typeof rules.maxErrorRate === 'number' ? rules.maxErrorRate : 1.0;
            const pkField = rules.primaryKeyField || (schema ? schema.find(s => s.primaryKey)?.name : null);

            // Index schema by column name
            const schemaMap = new Map();
            if (Array.isArray(schema)) {
                schema.forEach(col => {
                    const name = typeof col === 'string' ? col : col.name;
                    schemaMap.set(name, typeof col === 'object' ? col : { name, type: 'TEXT', nullable: true });
                });
            }

            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                const rowViolations = [];

                if (!record || typeof record !== 'object' || Array.isArray(record)) {
                    rowViolations.push({ column: null, rule: 'STRUCTURE', message: 'Record is not a valid object' });
                } else {
                    // Check primary key uniqueness & nullability
                    if (pkField) {
                        const pkVal = record[pkField];
                        if (pkVal === null || pkVal === undefined || pkVal === '') {
                            rowViolations.push({
                                column: pkField,
                                rule: 'PRIMARY_KEY_REQUIRED',
                                message: `Primary key "${pkField}" cannot be null or empty`
                            });
                        } else if (seenPrimaryKeys.has(pkVal)) {
                            rowViolations.push({
                                column: pkField,
                                rule: 'PRIMARY_KEY_DUPLICATE',
                                message: `Duplicate primary key "${pkVal}" on column "${pkField}"`
                            });
                        } else {
                            seenPrimaryKeys.add(pkVal);
                        }
                    }

                    // Check schema constraints (e.g. non-null)
                    schemaMap.forEach((colDef, colName) => {
                        const val = record[colName];
                        if (colDef.nullable === false) {
                            if (val === null || val === undefined || val === '') {
                                rowViolations.push({
                                    column: colName,
                                    rule: 'NOT_NULL',
                                    message: `Column "${colName}" does not allow null or empty values`
                                });
                            }
                        }
                    });
                }

                if (rowViolations.length > 0) {
                    rejected.push({
                        index: i,
                        record,
                        violations: rowViolations
                    });

                    // Update violation summary
                    rowViolations.forEach(v => {
                        const key = `${v.column || 'GENERAL'}:${v.rule}`;
                        violationsSummary[key] = (violationsSummary[key] || 0) + 1;
                    });
                } else {
                    accepted.push(record);
                }
            }

            const total = records.length;
            const errorRate = total > 0 ? rejected.length / total : 0;
            const valid = errorRate <= maxErrorRate && (records.length === 0 || accepted.length > 0);

            return {
                valid,
                accepted,
                rejected,
                summary: {
                    totalReceived: total,
                    rowsAccepted: accepted.length,
                    rowsRejected: rejected.length,
                    errorRate: Number(errorRate.toFixed(4)),
                    maxErrorRate,
                    violationsCount: rejected.length,
                    violationsSummary
                }
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.IngestionValidator = IngestionValidator;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = IngestionValidator;
    }

})(typeof window !== 'undefined' ? window : global);
