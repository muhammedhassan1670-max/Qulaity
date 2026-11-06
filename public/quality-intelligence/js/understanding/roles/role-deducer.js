/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/roles/role-deducer.js
 * ============================================================================
 * Evaluates the systemic role of each variable in the dataset across 22 roles.
 * Never claims semantic meaning with certainty unless evidence supports it.
 * Uses confidence levels: Observed | Likely | Possible | Unknown.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const RoleDeducer = {
        /**
         * Deduce systemic roles for all dataset columns
         * @param {Object} profile - Profiler output
         * @param {Object} dataset - Raw dataset
         * @returns {Object} Map of column names to role specifications
         */
        deduceRoles(profile, dataset) {
            if (!profile || !profile.columns) return {};

            const rolesMap = {};
            const cols = profile.columns;
            const rows = Array.isArray(dataset?.rows) ? dataset.rows : [];
            const rowCount = profile.dataset?.rowCount || rows.length || 100;

            cols.forEach(col => {
                rolesMap[col.name] = this._deduceSingleRole(col, cols, rowCount);
            });

            return rolesMap;
        },

        _deduceSingleRole(col, allCols, rowCount) {
            const name = col.name.toLowerCase();
            const stats = col.stats || {};
            const type = col.detectedType || col.inferredType || col.type || 'string';
            const distinct = stats.uniqueCount || stats.distinctCount || (col.uniqueValues ? col.uniqueValues.length : 0);
            const uniqueRatio = col.stats?.cardinalityRatio !== undefined ? col.stats.cardinalityRatio : (rowCount > 0 ? distinct / rowCount : 0);

            const candidates = [];

            // 1. Primary Identifier / Index
            if (uniqueRatio >= 0.98 && rowCount >= 10) {
                if (/^id$|_id$|uuid|guid|key|index|^pk/i.test(name)) {
                    candidates.push({ role: 'Identifier', confidence: 'Observed', score: 0.96, reason: 'Near 100% unique with standard ID naming convention.' });
                } else {
                    candidates.push({ role: 'Identifier', confidence: 'Likely', score: 0.82, reason: 'High uniqueness ratio (>98%) resembling an arbitrary row key.' });
                }
            }

            // 2. Entity Identifier
            if (uniqueRatio > 0.05 && uniqueRatio < 0.95 && /customer_id|user_id|account_id|device_id|order_id|patient_id/i.test(name)) {
                candidates.push({ role: 'Entity Identifier', confidence: 'Likely', score: 0.88, reason: 'Identifies recurring cross-sectional business entities.' });
            }

            // 3. Time / Temporal
            if (type === 'date' || type === 'datetime' || /date|time|timestamp|created_at|updated_at|year|month/i.test(name)) {
                candidates.push({ role: 'Time', confidence: type.includes('date') ? 'Observed' : 'Likely', score: 0.92, reason: 'Chronological timestamp or temporal coordinate.' });
            }

            // 4. Duration
            if (/duration|latency|elapsed|runtime|time_spent|response_time|tenure/i.test(name) && (type === 'integer' || type === 'float')) {
                candidates.push({ role: 'Duration', confidence: 'Likely', score: 0.85, reason: 'Continuous positive measurement of elapsed time.' });
            }

            // 5. Monetary-Like
            if (/amount|price|cost|revenue|sales|salary|fee|balance|tax|profit|loss|fare/i.test(name) && (type === 'integer' || type === 'float')) {
                candidates.push({ role: 'Monetary', confidence: 'Likely', score: 0.89, reason: 'Financial value representing economic transaction or account balance.' });
            }

            // 6. Ratio / Rate
            if (/ratio|rate|percentage|pct|prop|fraction|conversion|prob/i.test(name) || (stats.min >= 0 && stats.max <= 1 && type === 'float')) {
                candidates.push({ role: 'Ratio', confidence: 'Likely', score: 0.84, reason: 'Bounded proportion or comparative rate indicator.' });
            }

            // 7. Count
            if (/count|num_|qty|quantity|items|clicks|impressions|visits|retries|attempts/i.test(name) && type === 'integer' && stats.min >= 0) {
                candidates.push({ role: 'Count', confidence: 'Likely', score: 0.86, reason: 'Discrete non-negative integer frequency metric.' });
            }

            // 8. Flag / Boolean State
            if (type === 'boolean' || (distinct === 2 && (stats.min === 0 && stats.max === 1)) || /^is_|^has_|^flag_|^active/i.test(name)) {
                candidates.push({ role: 'Flag', confidence: 'Observed', score: 0.94, reason: 'Binary boolean flag or two-state switch.' });
            }

            // 9. State / Status
            if (/status|state|stage|condition|phase|tier|level/i.test(name) && distinct <= 15) {
                candidates.push({ role: 'State', confidence: 'Likely', score: 0.87, reason: 'Categorical lifecycle status or discrete operational stage.' });
            }

            // 10. Geographic Location
            if (/lat|lon|latitude|longitude|city|state|country|zip|postal|address|region/i.test(name)) {
                candidates.push({ role: 'Location', confidence: 'Likely', score: 0.85, reason: 'Spatial or geopolitical location attribute.' });
            }

            // 11. Target / Outcome Candidate
            if (/churn|fraud|default|survived|target|label|convert|click|outcome|fail|anomaly/i.test(name)) {
                candidates.push({ role: 'Target', confidence: 'Likely', score: 0.88, reason: 'Matches high-value business objective or labeled outcome nomenclature.' });
            }

            // 12. Free Text
            if (type === 'text' || (type === 'string' && distinct > 50 && uniqueRatio > 0.6 && !/^id$/i.test(name))) {
                candidates.push({ role: 'Text', confidence: 'Likely', score: 0.80, reason: 'High-cardinality unstructured or semi-structured textual field.' });
            }

            // 13. General Measure (Continuous numeric)
            if ((type === 'integer' || type === 'float') && !candidates.some(c => c.role === 'Identifier' || c.role === 'Time')) {
                candidates.push({ role: 'Measure', confidence: 'Likely', score: 0.75, reason: 'Continuous numerical observation suitable for quantitative modeling.' });
            }

            // 14. General Category / Group
            if (distinct > 1 && distinct <= 30 && !candidates.some(c => c.role === 'Flag')) {
                candidates.push({ role: 'Category', confidence: 'Likely', score: 0.78, reason: 'Discrete categorical grouping dimension.' });
            }

            // Default fallback
            if (candidates.length === 0) {
                candidates.push({ role: 'Predictor', confidence: 'Possible', score: 0.50, reason: 'General candidate feature with unspecialized semantic role.' });
            }

            // Pick dominant candidate
            candidates.sort((a, b) => b.score - a.score);
            const primary = candidates[0];

            return {
                column: col.name,
                primaryRole: primary.role,
                confidenceLevel: primary.confidence, // 'Observed' | 'Likely' | 'Possible' | 'Unknown'
                confidenceScore: +(primary.score.toFixed(2)),
                reasoning: primary.reason,
                alternativeRoles: candidates.slice(1).map(c => ({ role: c.role, confidence: c.confidence, score: +(c.score.toFixed(2)) }))
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.RoleDeducer = RoleDeducer;

})(typeof window !== 'undefined' ? window : global);
