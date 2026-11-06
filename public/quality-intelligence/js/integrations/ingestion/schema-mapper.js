/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/ingestion/schema-mapper.js
 * ============================================================================
 * Automatic and semi-automatic schema mapping.
 * Classifies column mapping fidelity:
 * AUTO_MAPPED | MANUAL_MAPPING_REQUIRED | AMBIGUOUS | INCOMPATIBLE
 * Invariant: Never perform dangerous lossy auto-conversions.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const MAPPING_STATUS = Object.freeze({
        AUTO_MAPPED: 'AUTO_MAPPED',
        MANUAL_MAPPING_REQUIRED: 'MANUAL_MAPPING_REQUIRED',
        AMBIGUOUS: 'AMBIGUOUS',
        INCOMPATIBLE: 'INCOMPATIBLE'
    });

    const SchemaMapper = {
        MAPPING_STATUS,

        /**
         * Map source columns to target schema definitions
         * @param {Array<Object|string>} sourceColumns
         * @param {Array<Object|string>} [targetSchema]
         * @returns {Object} { mappings: Array, overallStatus: string, warnings: Array }
         */
        mapSchema(sourceColumns = [], targetSchema = null) {
            const warnings = [];
            const mappings = [];

            const srcCols = sourceColumns.map(c => typeof c === 'string' ? { name: c, type: 'TEXT' } : c);

            if (!targetSchema || targetSchema.length === 0) {
                // Initial ingestion -> Direct auto-mapping
                srcCols.forEach(col => {
                    mappings.push({
                        sourceColumn: col.name,
                        targetColumn: col.name,
                        sourceType: col.type || 'TEXT',
                        targetType: col.type || 'TEXT',
                        status: MAPPING_STATUS.AUTO_MAPPED,
                        confidence: 1.0
                    });
                });

                return {
                    mappings,
                    overallStatus: MAPPING_STATUS.AUTO_MAPPED,
                    warnings: []
                };
            }

            const tgtCols = targetSchema.map(c => typeof c === 'string' ? { name: c, type: 'TEXT' } : c);
            const tgtMap = new Map(tgtCols.map(t => [t.name.toLowerCase().trim(), t]));

            let hasManual = false;
            let hasIncompatible = false;

            srcCols.forEach(src => {
                const normName = src.name.toLowerCase().trim();
                const matchedTarget = tgtMap.get(normName);

                if (matchedTarget) {
                    const typesMatch = this._areTypesCompatible(src.type, matchedTarget.type);
                    if (typesMatch) {
                        mappings.push({
                            sourceColumn: src.name,
                            targetColumn: matchedTarget.name,
                            sourceType: src.type,
                            targetType: matchedTarget.type,
                            status: MAPPING_STATUS.AUTO_MAPPED,
                            confidence: 0.98
                        });
                    } else {
                        hasIncompatible = true;
                        warnings.push(`Type mismatch on column "${src.name}": source has ${src.type}, target expects ${matchedTarget.type}`);
                        mappings.push({
                            sourceColumn: src.name,
                            targetColumn: matchedTarget.name,
                            sourceType: src.type,
                            targetType: matchedTarget.type,
                            status: MAPPING_STATUS.INCOMPATIBLE,
                            confidence: 0.5
                        });
                    }
                } else {
                    // New column not in target schema
                    mappings.push({
                        sourceColumn: src.name,
                        targetColumn: src.name,
                        sourceType: src.type,
                        targetType: src.type,
                        status: MAPPING_STATUS.AUTO_MAPPED,
                        isNewColumn: true,
                        confidence: 0.85
                    });
                }
            });

            const overallStatus = hasIncompatible ? MAPPING_STATUS.INCOMPATIBLE : (hasManual ? MAPPING_STATUS.MANUAL_MAPPING_REQUIRED : MAPPING_STATUS.AUTO_MAPPED);

            return {
                mappings,
                overallStatus,
                warnings
            };
        },

        _areTypesCompatible(srcType = 'TEXT', tgtType = 'TEXT') {
            const s = String(srcType).toUpperCase();
            const t = String(tgtType).toUpperCase();
            if (s === t) return true;
            if (['TEXT', 'STRING', 'VARCHAR'].includes(t)) return true; // Everything can be cast to text

            const numericGroup = ['INT', 'INTEGER', 'BIGINT', 'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC', 'NUMBER'];
            if (numericGroup.includes(s) && numericGroup.includes(t)) return true;

            const boolGroup = ['BOOL', 'BOOLEAN'];
            if (boolGroup.includes(s) && boolGroup.includes(t)) return true;

            const dateGroup = ['DATE', 'DATETIME', 'TIMESTAMP'];
            if (dateGroup.includes(s) && dateGroup.includes(t)) return true;

            return false;
        }
    };

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.SchemaMapper = SchemaMapper;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SchemaMapper;
    }
})(typeof window !== 'undefined' ? window : global);
