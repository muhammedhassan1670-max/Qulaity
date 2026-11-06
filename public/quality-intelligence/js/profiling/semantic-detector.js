/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: profiling/semantic-detector.js
 * ============================================================================
 * Determines semantic roles, Target Suitability, and Feature Suitability
 * with 100% transparent reasoning based on heuristics.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const SemanticDetector = {
        TARGET_KEYWORDS: /^(target|label|outcome|class|churn|converted|revenue|sales|income|price|profit|salary|status|approved|default|is_|has_)|[_-]?(target|label|outcome|churn|class|income|revenue|sales|status|approved)$/i,
        ID_KEYWORDS: /^(id|uuid|guid|code|key|no|num|ref|hash|serial|account|sku|order|cust|emp|trans|batch|patient|sample|record|row|item|index|barcode|entity)[_-]?|[_-]?(id|code|key|no|num|guid|ref|serial|idx|pk)$/i,

        /**
         * Determine the semantic role and reasoning for a column
         */
        inferSemanticRole(colName, typeInfo, stats, totalRows, colIndex, totalCols) {
            const detectedType = typeInfo.detectedType;
            const uniquePct = stats.uniquePct || 0;
            const nullPct = stats.nullPct || 0;
            const uniqueCount = stats.uniqueCount || 0;
            const isIdKeyword = this.ID_KEYWORDS.test(colName);
            const isTargetKeyword = this.TARGET_KEYWORDS.test(colName);

            // 1. Empty
            if (detectedType === 'empty' || nullPct === 100) {
                return {
                    role: 'unknown',
                    reason: 'Column contains 100% missing values'
                };
            }

            // 2. Identifier
            if (detectedType === 'identifier' || isIdKeyword) {
                return {
                    role: 'identifier',
                    reason: isIdKeyword
                        ? `Matches identifier naming convention ("${colName}") with ${uniquePct}% unique values`
                        : `Column classified as identifier (${uniquePct}% unique values)`
                };
            }

            // 3. Temporal Dimension
            if (detectedType === 'date' || detectedType === 'datetime' || detectedType === 'time') {
                return {
                    role: 'time_dimension',
                    reason: `Temporal index representing sequential timestamps (${stats.granularity || 'datetime'})`
                };
            }

            // 4. Binary Flag
            if (detectedType === 'boolean' || (uniqueCount === 2 && nullPct < 50)) {
                return {
                    role: 'binary_flag',
                    reason: `Binary indicator with exactly 2 distinct states`
                };
            }

            // 5. Numerical Measure (Metric)
            if (detectedType === 'integer' || detectedType === 'decimal' || detectedType === 'numeric') {
                if (isTargetKeyword) {
                    return {
                        role: 'potential_target',
                        reason: `Continuous quantitative outcome candidate matching target semantics ("${colName}")`
                    };
                }
                return {
                    role: 'measure',
                    reason: `Quantitative continuous metric with range [${stats.min ?? 0}, ${stats.max ?? 0}]`
                };
            }

            // 6. Unstructured Text
            if (detectedType === 'text') {
                return {
                    role: 'unstructured_text',
                    reason: `Long-form text with average length of ${stats.avgLength || 0} characters`
                };
            }

            // 7. Categorical Dimension
            if (detectedType === 'categorical') {
                if (isTargetKeyword && uniqueCount <= 20) {
                    return {
                        role: 'potential_target',
                        reason: `Discrete categorical outcome candidate with ${uniqueCount} classes`
                    };
                }
                return {
                    role: 'category_dimension',
                    reason: `Discrete qualitative dimension with ${uniqueCount} categories`
                };
            }

            return {
                role: 'unknown',
                reason: 'Ambiguous statistical distribution'
            };
        },

        /**
         * Calculate Target Suitability Score (0-100) with transparent reasoning
         */
        calculateTargetSuitability(colName, typeInfo, stats, colIndex, totalCols) {
            const detectedType = typeInfo.detectedType;
            const uniqueCount = stats.uniqueCount || 0;
            const uniquePct = stats.uniquePct || 0;
            const nullPct = stats.nullPct || 0;
            let score = 0;
            const reasons = [];

            // Disqualification checks
            if (detectedType === 'empty' || nullPct > 40) {
                return { score: 0, taskHint: 'unsuitable', reasons: ['Exceeds 40% missing values'] };
            }
            if (detectedType === 'identifier' || ((detectedType === 'categorical' || detectedType === 'text') && uniquePct > 95 && !this.TARGET_KEYWORDS.test(colName))) {
                return { score: 0, taskHint: 'unsuitable', reasons: ['Appears to be a unique identifier (not a target)'] };
            }
            if (stats.isConstant) {
                return { score: 0, taskHint: 'unsuitable', reasons: ['Constant column with zero variance'] };
            }
            if (detectedType === 'date' || detectedType === 'datetime' || detectedType === 'time') {
                return { score: 10, taskHint: 'temporal_index', reasons: ['Date/Time columns serve primarily as temporal indices'] };
            }
            if (detectedType === 'text') {
                return { score: 15, taskHint: 'unstructured_text', reasons: ['Unstructured text requires NLP transformation before targeting'] };
            }

            // Explicit target / outcome override
            const lowerName = colName.toLowerCase();
            const isExplicitTarget = lowerName === 'target' || lowerName === 'label' || lowerName === 'y';

            // 1. Data Type Suitability
            let taskHint = 'unknown';
            if (detectedType === 'decimal' || detectedType === 'numeric' || (detectedType === 'integer' && (uniqueCount > 10 || (stats.range && stats.range > 50) || (stats.variance && stats.variance > 100)))) {
                score += 35;
                taskHint = 'regression';
                reasons.push('Continuous numeric distribution suitable for Regression');
            } else if (detectedType === 'boolean' || (uniqueCount >= 2 && uniqueCount <= 15)) {
                score += 35;
                taskHint = uniqueCount === 2 ? 'binary_classification' : 'multiclass_classification';
                reasons.push(`Discrete distribution with ${uniqueCount} classes suitable for Classification`);
            } else {
                score += 10;
                reasons.push('Categorical values with moderate cardinality');
            }

            // 2. Completeness bonus
            if (nullPct === 0) {
                score += 20;
                reasons.push('100% complete with zero missing values');
            } else if (nullPct <= 5) {
                score += 15;
                reasons.push('Low missingness (< 5%)');
            } else {
                score += 5;
            }

            // 3. Name Relevance bonus
            if (isExplicitTarget) {
                score += 35;
                reasons.push(`Column is explicitly designated as the predictive target ("${colName}")`);
            } else if (this.TARGET_KEYWORDS.test(colName)) {
                score += 25;
                reasons.push(`Column name contains strong predictive outcome keyword ("${colName}")`);
            }

            // 4. Position bias (in tabular datasets, the target is often the last column)
            if (colIndex === totalCols - 1 && totalCols > 1) {
                score += 10;
                reasons.push('Located in final column position (typical in tabular machine learning)');
            }

            // 5. Variance / Variation check
            if (stats.variance > 0 || uniqueCount >= 2) {
                score += 10;
                reasons.push('Healthy variation across observations');
            }

            const finalScore = Math.max(0, Math.min(100, score));
            return {
                score: finalScore,
                taskHint,
                reasons
            };
        },

        /**
         * Calculate Feature Suitability Score (0-100) with transparent reasoning
         */
        calculateFeatureSuitability(colName, typeInfo, stats, targetScore) {
            const detectedType = typeInfo.detectedType;
            const uniquePct = stats.uniquePct || 0;
            const nullPct = stats.nullPct || 0;
            let score = 50;
            const reasons = [];

            if (detectedType === 'empty' || nullPct > 60) {
                return { score: 0, reasons: ['Excessive missingness (> 60%)'] };
            }
            if (detectedType === 'identifier' || ((detectedType === 'categorical' || detectedType === 'text') && uniquePct > 98)) {
                return { score: 10, reasons: ['High uniqueness / identifier risk (would cause overfitting)'] };
            }
            if (stats.isConstant) {
                return { score: 0, reasons: ['Constant column with zero information value'] };
            }

            // Completeness
            if (nullPct <= 10) {
                score += 20;
                reasons.push('High data completeness (> 90%)');
            }

            // Type utility
            if (detectedType === 'integer' || detectedType === 'decimal' || detectedType === 'numeric') {
                score += 20;
                reasons.push('Numerical feature directly usable in statistical/ML models');
            } else if (detectedType === 'boolean' || (stats.uniqueCount >= 2 && stats.uniqueCount <= 30)) {
                score += 15;
                reasons.push(`Clean categorical dimension with manageable cardinality (${stats.uniqueCount})`);
            } else if (detectedType === 'date' || detectedType === 'datetime') {
                score += 15;
                reasons.push('Temporal feature suitable for feature engineering (lags, seasonality)');
            }

            // Penalize if it's already an obvious single target candidate
            if (targetScore >= 85) {
                score -= 15;
                reasons.push('High probability of being the target rather than a feature');
            }

            const finalScore = Math.max(0, Math.min(100, score));
            return {
                score: finalScore,
                reasons
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.SemanticDetector = SemanticDetector;

})(window);
