/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: profiling/quality-profile.js
 * ============================================================================
 * 1. Dataset Health Assessment & Transparent Quality Score Calculation
 * 2. Dataset Pattern Detection (Time-series, Cross-sectional, Panel, Supervised)
 * 3. Duplicate row detection and column-level warning aggregation
 * ============================================================================
 */

(function (window) {
    'use strict';

    const QualityProfile = {
        /**
         * Detect duplicate rows across the dataset
         */
        detectDuplicateRows(rows, columns, sampleLimit = 25000) {
            if (!Array.isArray(rows) || rows.length === 0) {
                return { count: 0, pct: 0, uniqueRowCount: 0 };
            }

            const total = Math.min(rows.length, sampleLimit);
            const seen = new Set();
            let duplicateCount = 0;

            for (let i = 0; i < total; i++) {
                const r = rows[i];
                // Quick serialized representation
                let key = '';
                for (let c = 0; c < columns.length; c++) {
                    key += String(r[columns[c]]) + '|';
                }

                if (seen.has(key)) {
                    duplicateCount++;
                } else {
                    seen.add(key);
                }
            }

            // Scale to full dataset if sampled
            const scale = rows.length / total;
            const estimatedDuplicates = Math.round(duplicateCount * scale);
            const duplicatePct = rows.length > 0 ? +((estimatedDuplicates / rows.length) * 100).toFixed(2) : 0;

            return {
                count: estimatedDuplicates,
                pct: duplicatePct,
                uniqueRowCount: rows.length - estimatedDuplicates,
                isSampled: rows.length > sampleLimit
            };
        },

        /**
         * Calculate transparent Data Quality Score and health metrics
         */
        assessDatasetHealth(columnsProfile, duplicateInfo, totalRows, totalCols) {
            const totalCells = totalRows * totalCols;
            let totalMissingCells = 0;
            let constantColsCount = 0;
            let nearConstantColsCount = 0;
            let mixedColsCount = 0;
            let highMissingColsCount = 0;
            const issues = [];

            columnsProfile.forEach(col => {
                const nullCount = col.stats.nullCount || 0;
                totalMissingCells += nullCount;

                if (col.stats.isConstant) {
                    constantColsCount++;
                    issues.push({
                        severity: 'warning',
                        column: col.name,
                        message: `Constant column (${col.name}) with zero variance across all rows`
                    });
                } else if (col.stats.isNearConstant) {
                    nearConstantColsCount++;
                    issues.push({
                        severity: 'info',
                        column: col.name,
                        message: `Near-constant column (${col.name}): top value accounts for > 95% of observations`
                    });
                }

                if (col.typeInfo.isMixed) {
                    mixedColsCount++;
                    issues.push({
                        severity: 'warning',
                        column: col.name,
                        message: `Mixed-type values in column "${col.name}": ${col.typeInfo.typeReason}`
                    });
                }

                if (col.stats.nullPct >= 50) {
                    highMissingColsCount++;
                    issues.push({
                        severity: 'danger',
                        column: col.name,
                        message: `High missingness in "${col.name}" (${col.stats.nullPct}% missing)`
                    });
                }
            });

            // Completeness & Missing
            const missingPct = totalCells > 0 ? +((totalMissingCells / totalCells) * 100).toFixed(2) : 0;
            const completenessPct = +(100 - missingPct).toFixed(2);

            // Documented 4-component Data Quality Score (0 - 100)
            // 1. Completeness Score (40 pts)
            const completenessScore = Math.max(0, 40 * (1 - (missingPct / 100)));

            // 2. Uniqueness / Deduplication Score (20 pts)
            const duplicateScore = Math.max(0, 20 * (1 - (duplicateInfo.pct / 100)));

            // 3. Schema Consistency / Non-Mixed Score (20 pts)
            const mixedRatio = totalCols > 0 ? (mixedColsCount / totalCols) : 0;
            const consistencyScore = Math.max(0, 20 * (1 - mixedRatio));

            // 4. Information Entropy / Non-Constant Score (20 pts)
            const constantRatio = totalCols > 0 ? (constantColsCount / totalCols) : 0;
            const varianceScore = Math.max(0, 20 * (1 - constantRatio));

            const totalQualityScore = Math.round(completenessScore + duplicateScore + consistencyScore + varianceScore);

            return {
                qualityScore: totalQualityScore,
                completenessPct,
                missingPct,
                totalMissingCells,
                duplicateRowsCount: duplicateInfo.count,
                duplicateRowsPct: duplicateInfo.pct,
                constantColsCount,
                nearConstantColsCount,
                mixedColsCount,
                highMissingColsCount,
                scoreComponents: {
                    completeness: { points: +completenessScore.toFixed(1), max: 40, label: 'Data Completeness' },
                    deduplication: { points: +duplicateScore.toFixed(1), max: 20, label: 'Row Uniqueness' },
                    consistency: { points: +consistencyScore.toFixed(1), max: 20, label: 'Type Consistency' },
                    variance: { points: +varianceScore.toFixed(1), max: 20, label: 'Column Variance' }
                },
                issues
            };
        },

        /**
         * Detect high-level dataset structural pattern
         */
        detectDatasetPatterns(columnsProfile, totalRows, targetCandidates) {
            const patterns = [];

            const dateCols = columnsProfile.filter(c => c.detectedType === 'date' || c.detectedType === 'datetime');
            const numericCols = columnsProfile.filter(c => c.detectedType === 'integer' || c.detectedType === 'decimal' || c.detectedType === 'numeric');
            const idCols = columnsProfile.filter(c => c.detectedType === 'identifier' || c.semanticRole === 'identifier');
            const categoricalCols = columnsProfile.filter(c => c.detectedType === 'categorical');

            // 1. Time-Series Candidate
            if (dateCols.length >= 1 && numericCols.length >= 1) {
                const primaryDate = dateCols[0];
                const isRegular = primaryDate.stats.isRegular;
                const reasons = [
                    `Detected temporal column "${primaryDate.name}" (${primaryDate.stats.granularity} frequency)`,
                    `Contains ${numericCols.length} quantitative numeric measurements over time`,
                    `Chronological span: ${primaryDate.stats.spanDays || 0} days`
                ];
                if (isRegular) reasons.push('Regular measurement intervals detected');
                else reasons.push('Irregular intervals or potential time gaps detected');

                patterns.push({
                    pattern: 'Time-series candidate',
                    confidence: isRegular ? 90 : 70,
                    primaryColumn: primaryDate.name,
                    granularity: primaryDate.stats.granularity,
                    reasons
                });
            }

            // 2. Panel Data Candidate (Entity ID + Temporal Column + Measures)
            if (idCols.length >= 1 && dateCols.length >= 1 && numericCols.length >= 1) {
                patterns.push({
                    pattern: 'Panel data candidate',
                    confidence: 80,
                    entityColumn: idCols[0].name,
                    temporalColumn: dateCols[0].name,
                    reasons: [
                        `Cross-sectional entity identifier "${idCols[0].name}" combined with temporal tracking "${dateCols[0].name}"`,
                        `Enables longitudinal panel regression and multi-entity forecasting`
                    ]
                });
            }

            // 3. Tabular Supervised Learning Candidate
            const viableTargets = targetCandidates.filter(t => t.score >= 60);
            if (viableTargets.length >= 1 && (numericCols.length + categoricalCols.length) >= 2) {
                const topTarget = viableTargets[0];
                patterns.push({
                    pattern: 'Tabular supervised-learning candidate',
                    confidence: Math.min(95, topTarget.score),
                    topTarget: topTarget.name,
                    taskType: topTarget.taskHint,
                    reasons: [
                        `Strong candidate predictive target identified: "${topTarget.name}" (${topTarget.score}% suitability)`,
                        `Recommended task archetype: ${topTarget.taskHint.replace(/_/g, ' ').toUpperCase()}`,
                        `Features available: ${columnsProfile.length - 1} predictor columns`
                    ]
                });
            }

            // 4. Cross-Sectional Tabular (if no time-series detected)
            if (dateCols.length === 0 && columnsProfile.length >= 2) {
                patterns.push({
                    pattern: 'Cross-sectional',
                    confidence: 85,
                    reasons: [
                        'No temporal/timestamp columns detected',
                        'Observations represent entities measured at a single point in time'
                    ]
                });
            }

            // 5. Unsupervised Analysis Candidate
            if (numericCols.length >= 3 && viableTargets.length === 0) {
                patterns.push({
                    pattern: 'Unsupervised-analysis candidate',
                    confidence: 75,
                    reasons: [
                        `High-dimensional numerical feature space (${numericCols.length} numeric columns)`,
                        'No single dominant target variable identified (ideal for Clustering & PCA)'
                    ]
                });
            }

            // Default fallback if no confident patterns
            if (patterns.length === 0) {
                patterns.push({
                    pattern: 'Mixed / uncertain',
                    confidence: 50,
                    reasons: ['Diverse unstructured or ambiguous column distributions']
                });
            }

            // Sort by confidence descending
            return patterns.sort((a, b) => b.confidence - a.confidence);
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.QualityProfile = QualityProfile;

})(window);
