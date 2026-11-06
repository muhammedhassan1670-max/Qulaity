/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/sync/change-detector.js
 * ============================================================================
 * Schema drift and structural evolution detector.
 * Classifies schema evolution:
 * NO_CHANGE | ADDITIVE | TYPE_CHANGE | REMOVAL | BREAKING
 * Invariant: Breaking changes must be explicitly identified to protect downstream analytics.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DRIFT_TYPES = Object.freeze({
        NO_CHANGE: 'NO_CHANGE',
        ADDITIVE: 'ADDITIVE',
        TYPE_CHANGE: 'TYPE_CHANGE',
        REMOVAL: 'REMOVAL',
        BREAKING: 'BREAKING'
    });

    const ChangeDetector = {
        DRIFT_TYPES,

        /**
         * Detect schema drift between previous and incoming schema definitions
         * @param {Array<Object|string>} previousSchema
         * @param {Array<Object|string>} incomingSchema
         * @param {Object} [options] - e.g. { requiredColumns: ['id'], strictTypes: false }
         * @returns {Object} { status: string, isBreaking: boolean, changes: Array, summary: string }
         */
        detectDrift(previousSchema = [], incomingSchema = [], options = {}) {
            const prev = this._normalizeSchema(previousSchema);
            const incoming = this._normalizeSchema(incomingSchema);
            const requiredCols = new Set(options.requiredColumns || []);

            if (prev.length === 0) {
                // Initial schema capture
                return {
                    status: DRIFT_TYPES.NO_CHANGE,
                    isBreaking: false,
                    changes: [],
                    summary: 'Initial schema baseline established.'
                };
            }

            const prevMap = new Map(prev.map(c => [c.name.toLowerCase().trim(), c]));
            const incMap = new Map(incoming.map(c => [c.name.toLowerCase().trim(), c]));

            const changes = [];
            let hasAdditive = false;
            let hasRemoval = false;
            let hasTypeChange = false;
            let isBreaking = false;

            // 1. Check for removed or changed columns
            for (const [colName, prevCol] of prevMap.entries()) {
                const incCol = incMap.get(colName);
                if (!incCol) {
                    hasRemoval = true;
                    const breaking = requiredCols.has(prevCol.name) || prevCol.primaryKey === true;
                    if (breaking) isBreaking = true;

                    changes.push({
                        type: 'REMOVED',
                        column: prevCol.name,
                        oldType: prevCol.type,
                        newType: null,
                        breaking,
                        message: `Column "${prevCol.name}" was removed from source.`
                    });
                } else {
                    // Check type compatibility
                    const normPrevType = (prevCol.type || 'TEXT').toUpperCase();
                    const normIncType = (incCol.type || 'TEXT').toUpperCase();

                    if (normPrevType !== normIncType) {
                        hasTypeChange = true;
                        const breaking = this._isTypeChangeBreaking(normPrevType, normIncType);
                        if (breaking) isBreaking = true;

                        changes.push({
                            type: 'TYPE_CHANGED',
                            column: incCol.name,
                            oldType: normPrevType,
                            newType: normIncType,
                            breaking,
                            message: `Column "${incCol.name}" changed type from ${normPrevType} to ${normIncType}.`
                        });
                    }
                }
            }

            // 2. Check for added columns
            for (const [colName, incCol] of incMap.entries()) {
                if (!prevMap.has(colName)) {
                    hasAdditive = true;
                    changes.push({
                        type: 'ADDED',
                        column: incCol.name,
                        oldType: null,
                        newType: incCol.type || 'TEXT',
                        breaking: false,
                        message: `New column "${incCol.name}" added to source.`
                    });
                }
            }

            // Determine overall drift status
            let status = DRIFT_TYPES.NO_CHANGE;
            if (isBreaking) {
                status = DRIFT_TYPES.BREAKING;
            } else if (hasRemoval) {
                status = DRIFT_TYPES.REMOVAL;
            } else if (hasTypeChange) {
                status = DRIFT_TYPES.TYPE_CHANGE;
            } else if (hasAdditive) {
                status = DRIFT_TYPES.ADDITIVE;
            }

            const summary = changes.length === 0
                ? 'No schema changes detected.'
                : `Detected ${changes.length} schema change(s) (${status}): ${changes.map(c => c.message).join(' ')}`;

            return {
                status,
                isBreaking,
                changes,
                summary
            };
        },

        _isTypeChangeBreaking(oldType, newType) {
            // Safe widening: INT -> NUMBER / FLOAT / DOUBLE / TEXT
            if (['INT', 'INTEGER'].includes(oldType) && ['NUMBER', 'FLOAT', 'DOUBLE', 'DECIMAL', 'TEXT', 'STRING'].includes(newType)) {
                return false;
            }
            // Number to Text is generally safe
            if (['NUMBER', 'FLOAT', 'DOUBLE', 'DECIMAL'].includes(oldType) && ['TEXT', 'STRING'].includes(newType)) {
                return false;
            }
            // Any text to number or date conversion might be breaking if source data contains non-conforming values
            if (['TEXT', 'STRING'].includes(oldType) && !['TEXT', 'STRING'].includes(newType)) {
                return true;
            }
            return true;
        },

        _normalizeSchema(schema) {
            if (!Array.isArray(schema)) return [];
            return schema.map(col => {
                if (typeof col === 'string') return { name: col, type: 'TEXT' };
                return {
                    name: col.name || col.column || 'unknown',
                    type: col.type || 'TEXT',
                    nullable: col.nullable !== false,
                    primaryKey: col.primaryKey === true
                };
            });
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.ChangeDetector = ChangeDetector;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChangeDetector;
    }

})(typeof window !== 'undefined' ? window : global);
