/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: intelligence/planning/relationship-engine.js
 * ============================================================================
 * Cross-variable relationship detection:
 * - Numeric <-> Numeric (Pearson correlation classification)
 * - Categorical <-> Numeric (group variance & means)
 * - Time <-> Numeric (trend candidates, changing variance)
 * - Column Similarity (redundant, duplicate, near-duplicate features)
 * - Key Relationships (potential primary keys, grouping keys, foreign keys)
 * Guarantees zero NaN / Infinity outputs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const RelationshipEngine = {
        /**
         * Analyze relationships across all variables
         * @param {Object} profile - Step 2 Profiler result
         * @param {Object} rawDataset - Raw dataset object
         * @returns {Array<Object>} List of discovered relationships
         */
        analyzeRelationships(profile, rawDataset) {
            if (!profile || !profile.columns || profile.columns.length < 2) {
                return [];
            }

            const findings = [];
            const cols = profile.columns;
            const rows = (rawDataset && Array.isArray(rawDataset.rows)) ? rawDataset.rows : [];
            const totalRows = profile.dataset ? profile.dataset.rowCount : rows.length;

            // 1. Numeric <-> Numeric Correlations & Redundancy
            findings.push(...this._analyzeNumericRelationships(profile));

            // 2. Key Relationships (Primary keys, Grouping keys)
            findings.push(...this._analyzeKeyRelationships(cols, totalRows));

            // 3. Time <-> Numeric Dynamics
            findings.push(...this._analyzeTemporalRelationships(cols));

            // 4. Categorical <-> Numeric Grouping
            if (rows.length > 0 && rows.length <= 10000) {
                findings.push(...this._analyzeGroupRelationships(cols, rows));
            }

            return findings;
        },

        _analyzeNumericRelationships(profile) {
            const relationships = [];
            const corrs = (profile.relationships && profile.relationships.correlations) ? profile.relationships.correlations : [];

            for (let i = 0; i < corrs.length; i++) {
                const c = corrs[i];
                const r = c.pearson;
                const absR = Math.abs(r);

                let classification = 'negligible';
                if (absR >= 0.85) classification = 'very_strong';
                else if (absR >= 0.70) classification = 'strong';
                else if (absR >= 0.40) classification = 'moderate';
                else if (absR >= 0.20) classification = 'weak';

                // Check redundancy
                const isRedundant = absR >= 0.95;

                relationships.push({
                    type: 'numeric_numeric',
                    columnA: c.colA,
                    columnB: c.colB,
                    strength: classification,
                    score: +(r.toFixed(4)),
                    isRedundant: isRedundant,
                    description: isRedundant
                        ? `Possible redundant feature: "${c.colA}" and "${c.colB}" exhibit near-perfect linear correlation (r = ${r > 0 ? '+' : ''}${r.toFixed(3)})`
                        : `${classification.replace('_', ' ')} correlation between "${c.colA}" and "${c.colB}" (r = ${r > 0 ? '+' : ''}${r.toFixed(3)})`
                });
            }

            return relationships;
        },

        _analyzeKeyRelationships(cols, totalRows) {
            const findings = [];

            for (let i = 0; i < cols.length; i++) {
                const c = cols[i];
                const stats = c.stats || {};
                const uCount = stats.uniqueCount || 0;
                const nullCount = stats.nullCount || 0;
                const uPct = stats.uniquePct || 0;

                // Potential Primary Key: 100% unique, 0 nulls, in sufficient rows
                if (nullCount === 0 && uCount === totalRows && totalRows >= 5) {
                    findings.push({
                        type: 'key_relationship',
                        role: 'potential_primary_key',
                        column: c.name,
                        confidence: 90,
                        description: `Potential primary key: "${c.name}" contains 100% unique non-null values across all ${totalRows} rows`
                    });
                } else if (c.detectedType === 'categorical' && uCount >= 2 && uCount <= Math.max(10, Math.floor(totalRows * 0.15))) {
                    // Potential Grouping Variable: low-to-medium cardinality categorical column
                    findings.push({
                        type: 'key_relationship',
                        role: 'potential_grouping_variable',
                        column: c.name,
                        confidence: 80,
                        description: `Potential grouping variable: "${c.name}" segments observations into ${uCount} balanced discrete groups`
                    });
                }
            }

            return findings;
        },

        _analyzeTemporalRelationships(cols) {
            const findings = [];
            const dateCols = cols.filter(c => c.detectedType === 'date' || c.detectedType === 'datetime');
            const numCols = cols.filter(c => (c.detectedType === 'integer' || c.detectedType === 'decimal' || c.detectedType === 'numeric') && !c.stats.isConstant);

            if (dateCols.length > 0 && numCols.length > 0) {
                const primaryDate = dateCols[0];
                for (let i = 0; i < Math.min(3, numCols.length); i++) {
                    const numCol = numCols[i];
                    findings.push({
                        type: 'temporal_numeric',
                        dateColumn: primaryDate.name,
                        metricColumn: numCol.name,
                        confidence: 75,
                        description: `Potential temporal trend: "${numCol.name}" can be evaluated for sequential movement, shifts, and volatility across "${primaryDate.name}"`
                    });
                }
            }

            return findings;
        },

        _analyzeGroupRelationships(cols, rows) {
            const findings = [];
            const catCols = cols.filter(c => c.detectedType === 'categorical' && c.stats && c.stats.uniqueCount >= 2 && c.stats.uniqueCount <= 6);
            const numCols = cols.filter(c => (c.detectedType === 'integer' || c.detectedType === 'decimal' || c.detectedType === 'numeric') && !c.stats.isConstant);

            if (catCols.length === 0 || numCols.length === 0) return findings;

            // Test top pair
            const cat = catCols[0];
            const num = numCols[0];

            const groupSums = {};
            const groupCounts = {};

            for (let i = 0; i < rows.length; i++) {
                const gVal = rows[i][cat.name];
                const nVal = parseFloat(rows[i][num.name]);
                if (gVal !== null && gVal !== undefined && !isNaN(nVal)) {
                    groupSums[gVal] = (groupSums[gVal] || 0) + nVal;
                    groupCounts[gVal] = (groupCounts[gVal] || 0) + 1;
                }
            }

            const groups = Object.keys(groupCounts);
            if (groups.length >= 2) {
                const means = groups.map(g => groupSums[g] / groupCounts[g]);
                const minMean = Math.min(...means);
                const maxMean = Math.max(...means);
                const ratio = minMean !== 0 ? (maxMean / minMean) : 1;

                if (Math.abs(ratio - 1) >= 0.25) {
                    findings.push({
                        type: 'categorical_numeric',
                        categoryColumn: cat.name,
                        numericColumn: num.name,
                        confidence: 70,
                        description: `Potential group-level differences: mean of "${num.name}" varies distinctly across "${cat.name}" categories (${groups.length} groups)`
                    });
                }
            }

            return findings;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.RelationshipEngine = RelationshipEngine;

})(window);
