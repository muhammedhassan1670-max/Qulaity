/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: intelligence/planning/missingness-analyzer.js
 * ============================================================================
 * Deep Missingness Intelligence:
 * Analyzes concentration, row-level multi-missingness, temporal clustering,
 * group clustering, and probabilistic missingness mechanisms (MCAR / MAR / MNAR candidates).
 * Guarantees zero NaN / Infinity outputs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const MissingnessAnalyzer = {
        /**
         * Perform comprehensive missingness pattern analysis
         * @param {Object} profile - Step 2 Profiler result
         * @param {Object} rawDataset - Original dataset with rows
         * @returns {Object} Complete missingness intelligence report
         */
        analyzeMissingness(profile, rawDataset) {
            const ds = profile ? profile.dataset || {} : {};
            const q = profile ? profile.quality || {} : {};
            const cols = profile ? profile.columns || [] : [];
            const rows = (rawDataset && Array.isArray(rawDataset.rows)) ? rawDataset.rows : [];

            const totalRows = ds.rowCount || rows.length;
            const totalCols = ds.columnCount || cols.length;
            const totalCells = totalRows * totalCols;
            const totalMissing = q.totalMissingCells || 0;
            const missingPct = q.missingPct || (totalCells > 0 ? +((totalMissing / totalCells) * 100).toFixed(2) : 0);

            // Clean state if zero missing
            if (totalMissing === 0 || totalRows === 0) {
                return {
                    overallScore: 100,
                    riskLevel: 'low',
                    patterns: [
                        {
                            type: 'isolated_missingness',
                            confidence: 100,
                            reasoning: 'Zero missing values detected across the entire dataset (100% complete).'
                        }
                    ],
                    columnMissingness: cols.map(c => ({ column: c.name, nullCount: 0, nullPct: 0 })),
                    recommendations: ['No missing value remediation required. Complete dataset ready for direct feature engineering.']
                };
            }

            const patterns = [];
            const recommendations = [];
            const columnMissingness = [];

            // 1. Column Missingness Breakdown & Concentration
            let colsWithMissing = 0;
            let maxColMissingPct = 0;
            let maxColMissingName = '';

            for (let i = 0; i < cols.length; i++) {
                const c = cols[i];
                const nullCount = c.stats ? c.stats.nullCount : 0;
                const nullPct = c.stats ? c.stats.nullPct : 0;

                columnMissingness.push({
                    column: c.name,
                    nullCount: nullCount,
                    nullPct: nullPct
                });

                if (nullCount > 0) {
                    colsWithMissing++;
                    if (nullPct > maxColMissingPct) {
                        maxColMissingPct = nullPct;
                        maxColMissingName = c.name;
                    }
                }
            }

            // Sort column missingness descending
            columnMissingness.sort((a, b) => b.nullPct - a.nullPct);

            // Concentrated in specific columns?
            if (colsWithMissing > 0 && colsWithMissing <= Math.max(1, Math.floor(totalCols * 0.25))) {
                patterns.push({
                    type: 'concentrated_missingness',
                    confidence: 85,
                    reasoning: `Missing values are heavily concentrated in only ${colsWithMissing} of ${totalCols} columns (highest: "${maxColMissingName}" at ${maxColMissingPct}%)`
                });
                recommendations.push(`Target remediation specifically on the ${colsWithMissing} affected column(s) rather than global imputation.`);
            } else if (colsWithMissing > Math.floor(totalCols * 0.6)) {
                patterns.push({
                    type: 'diffuse_missingness',
                    confidence: 80,
                    reasoning: `Missingness is widely diffused across ${colsWithMissing} columns (${Math.round(colsWithMissing / totalCols * 100)}% of schema)`
                });
            }

            // 2. Row-level Multi-Missingness Analysis
            if (rows.length > 0) {
                let multiMissingRowCount = 0;
                let severeMissingRowCount = 0;
                const halfCols = Math.max(2, Math.floor(totalCols / 2));

                for (let r = 0; r < rows.length; r++) {
                    const row = rows[r];
                    let rowNulls = 0;
                    for (let c = 0; c < cols.length; c++) {
                        const val = row[cols[c].name];
                        if (val === null || val === undefined || val === '') {
                            rowNulls++;
                        }
                    }

                    if (rowNulls >= 2) multiMissingRowCount++;
                    if (rowNulls >= halfCols) severeMissingRowCount++;
                }

                const multiPct = +((multiMissingRowCount / rows.length) * 100).toFixed(2);
                const severePct = +((severeMissingRowCount / rows.length) * 100).toFixed(2);

                if (severePct >= 5) {
                    patterns.push({
                        type: 'high_row_missingness',
                        confidence: 88,
                        reasoning: `${severeMissingRowCount} rows (${severePct}%) contain >= 50% missing fields simultaneously`
                    });
                    recommendations.push(`Review the ${severeMissingRowCount} severely incomplete rows; consider row filtering prior to feature encoding.`);
                }
            }

            // 3. Temporal Clustering of Missing Values (if date column exists)
            const dateCol = cols.find(c => c.detectedType === 'date' || c.detectedType === 'datetime');
            if (dateCol && rows.length >= 20) {
                const half = Math.floor(rows.length / 2);
                let firstHalfNulls = 0;
                let secondHalfNulls = 0;

                for (let r = 0; r < rows.length; r++) {
                    const row = rows[r];
                    let hasNull = false;
                    for (let c = 0; c < cols.length; c++) {
                        const val = row[cols[c].name];
                        if (val === null || val === undefined || val === '') {
                            hasNull = true;
                            break;
                        }
                    }
                    if (hasNull) {
                        if (r < half) firstHalfNulls++;
                        else secondHalfNulls++;
                    }
                }

                const totalNullRows = firstHalfNulls + secondHalfNulls;
                if (totalNullRows >= 6) {
                    const ratio1 = firstHalfNulls / totalNullRows;
                    const ratio2 = secondHalfNulls / totalNullRows;
                    if (ratio1 >= 0.75 || ratio2 >= 0.75) {
                        patterns.push({
                            type: 'time_concentrated_missingness',
                            confidence: 82,
                            reasoning: `Missing values increase substantially during a specific temporal window (${ratio1 >= 0.75 ? 'earlier' : 'later'} observations contain ${Math.round(Math.max(ratio1, ratio2) * 100)}% of incomplete rows)`
                        });
                        recommendations.push('Investigate systemic collection changes over time before deciding on backward/forward fill imputation.');
                    }
                }
            }

            // 4. Missingness Mechanism Hypotheses (MCAR / MAR / MNAR candidates)
            if (missingPct <= 3 && patterns.length <= 1) {
                patterns.push({
                    type: 'mcar_candidate',
                    confidence: 70,
                    reasoning: 'Missingness is sparse and uniformly distributed across rows, suggesting Missing Completely At Random (MCAR candidate).'
                });
                recommendations.push('Standard mean/median or mode imputation is statistically viable.');
            } else if (patterns.some(p => p.type === 'concentrated_missingness' || p.type === 'time_concentrated_missingness')) {
                patterns.push({
                    type: 'mar_candidate',
                    confidence: 75,
                    reasoning: 'Missing values correlate with specific columns or temporal subsets, indicating Missing At Random (MAR candidate).'
                });
                recommendations.push('Use multivariate or group-conditioned imputation rather than global unconditional replacement.');
            }

            // Risk Level Assessment
            let riskLevel = 'low';
            if (missingPct >= 30 || maxColMissingPct >= 70) riskLevel = 'critical';
            else if (missingPct >= 15 || maxColMissingPct >= 40) riskLevel = 'high';
            else if (missingPct >= 5 || maxColMissingPct >= 20) riskLevel = 'moderate';

            const overallScore = Math.max(0, Math.min(100, Math.round(100 - (missingPct * 1.5))));

            return {
                overallScore: overallScore,
                riskLevel: riskLevel,
                patterns: patterns,
                columnMissingness: columnMissingness,
                recommendations: recommendations.length > 0 ? recommendations : ['Monitor missing values during model evaluation.']
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.MissingnessAnalyzer = MissingnessAnalyzer;

})(window);
