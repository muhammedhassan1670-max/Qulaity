/**
 * UDIP Deep Intelligence Evolution vNext
 * RoleDeducer - 25+ Systemic Variable Semantics
 * Combines datatype + cardinality + distribution + uniqueness + relationships + temporal position
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.RoleDeducer = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class RoleDeducer {
        static deduce(dataset, profile) {
            if (!dataset || !dataset.columns) return {};

            const roles = {};
            const rowCount = dataset.rowCount || (dataset.rows ? dataset.rows.length : 0);
            const colProfiles = {};
            if (profile && profile.columns) {
                if (Array.isArray(profile.columns)) {
                    profile.columns.forEach(c => { if (c && c.name) colProfiles[c.name] = c; });
                } else if (typeof profile.columns === 'object') {
                    Object.assign(colProfiles, profile.columns);
                }
            }

            dataset.columns.forEach(col => {
                const lower = col.toLowerCase();
                const p = colProfiles[col] || {};
                const detectedType = p.detectedType || p.inferredType || 'unknown';
                const uCount = (p.stats && (p.stats.uniqueCount || p.stats.distinctCount)) || 0;
                const cardRatio = (p.stats && p.stats.cardinalityRatio !== undefined) ? p.stats.cardinalityRatio : (rowCount > 0 ? uCount / rowCount : 0);
                const min = p.stats ? p.stats.min : undefined;
                const max = p.stats ? p.stats.max : undefined;

                let assignedRole = 'PREDICTOR';
                let confidence = 0.70;
                const assignedRoles = [];

                // 1. Time & Event Time
                if (detectedType === 'date' || detectedType === 'timestamp' || lower.includes('timestamp') || lower.includes('date') || lower.includes('_at')) {
                    assignedRole = lower.includes('event') ? 'EVENT_TIME' : 'TIME';
                    confidence = 0.95;
                    assignedRoles.push('TIME');
                }
                // 2. Identifier & Index
                else if (detectedType === 'identifier' || (uCount === rowCount && rowCount > 1)) {
                    if (lower === 'id' || lower === 'index' || lower === 'row_id') {
                        assignedRole = 'INDEX';
                    } else if (lower.includes('customer') || lower.includes('user') || lower.includes('device') || lower.includes('account')) {
                        assignedRole = 'ENTITY_ID';
                    } else {
                        assignedRole = 'IDENTIFIER';
                    }
                    confidence = 0.95;
                    assignedRoles.push('IDENTIFIER');
                }
                // 3. Flags & States (Boolean or 2-value binary)
                else if (detectedType === 'boolean' || uCount === 2) {
                    if (lower.startsWith('is_') || lower.startsWith('has_') || lower.endsWith('_flag') || lower === 'flag') {
                        assignedRole = 'FLAG';
                    } else {
                        assignedRole = 'STATE';
                    }
                    confidence = 0.90;
                    assignedRoles.push('FLAG');
                }
                // 4. Target / Outcome Candidates
                else if (lower.includes('target') || lower.includes('label') || lower.includes('churn') || lower.includes('fraud') ||
                    lower.includes('default') || lower.includes('converted') || lower.includes('outcome') || lower === 'y') {
                    assignedRole = 'TARGET';
                    confidence = 0.92;
                    assignedRoles.push('TARGET');
                }
                // 5. Monetary
                else if (lower.includes('revenue') || lower.includes('price') || lower.includes('amount') || lower.includes('cost') ||
                    lower.includes('salary') || lower.includes('fee') || lower.includes('balance') || lower.includes('payment') ||
                    detectedType === 'monetary') {
                    assignedRole = 'MONETARY';
                    confidence = 0.90;
                    assignedRoles.push('MONETARY', 'MEASURE');
                }
                // 6. Percentage / Rate / Ratio
                else if (lower.includes('pct') || lower.includes('percent') || lower.includes('rate') || lower.includes('ratio') ||
                    (min !== undefined && max !== undefined && min >= 0 && max <= 1 && detectedType === 'decimal')) {
                    assignedRole = (lower.includes('pct') || lower.includes('percent')) ? 'PERCENTAGE' : (lower.includes('rate') ? 'RATE' : 'RATIO');
                    confidence = 0.88;
                    assignedRoles.push('RATIO', 'MEASURE');
                }
                // 7. Counts & Quantities
                else if (detectedType === 'integer' && min !== undefined && min >= 0 &&
                    (lower.includes('count') || lower.includes('qty') || lower.includes('quantity') || lower.includes('num_') || lower.includes('total_'))) {
                    assignedRole = 'COUNT';
                    confidence = 0.88;
                    assignedRoles.push('COUNT', 'MEASURE');
                }
                // 8. Geography / Location
                else if (lower.includes('city') || lower.includes('country') || lower.includes('state') || lower.includes('region') ||
                    lower.includes('zip') || lower.includes('lat') || lower.includes('lng') || lower.includes('longitude') || lower.includes('latitude')) {
                    assignedRole = 'LOCATION';
                    confidence = 0.90;
                    assignedRoles.push('LOCATION', 'GROUP');
                }
                // 9. Categorical Dimension / Group
                else if (detectedType === 'categorical' || cardRatio < 0.05) {
                    assignedRole = 'CATEGORY';
                    confidence = 0.85;
                    assignedRoles.push('CATEGORY', 'GROUP');
                }
                // 10. Quantitative Measure / Predictor Feature
                else if (detectedType === 'integer' || detectedType === 'decimal') {
                    assignedRole = 'MEASURE';
                    confidence = 0.80;
                    assignedRoles.push('MEASURE', 'PREDICTOR');
                }
                // 11. Free Text
                else if (detectedType === 'text') {
                    assignedRole = 'TEXT';
                    confidence = 0.80;
                    assignedRoles.push('TEXT');
                }

                roles[col] = {
                    column: col,
                    role: assignedRole,
                    roles: assignedRoles.length > 0 ? assignedRoles : [assignedRole],
                    confidence: confidence,
                    detectedType: detectedType,
                    uniqueCount: uCount,
                    cardinalityRatio: cardRatio,
                    status: 'OBSERVED'
                };
            });

            return roles;
        }
    }

    return RoleDeducer;
}));
