/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: intelligence/planning/recommendation-engine.js
 * ============================================================================
 * Generates evidence-driven preprocessing actions and strategic analytical recommendations.
 * Groups advice into:
 * - Preprocessing Pipeline: imputation, encoding, scaling, temporal extraction, outlier handling...
 * - Strategic Recommendations: immediate, recommended, optional, warnings.
 * Guarantees zero NaN / Infinity outputs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const RecommendationEngine = {
        /**
         * Generate preprocessing actions and strategic recommendations
         * @param {Object} profile - Step 2 Profiler result
         * @param {Object} planningContext - Intermediate planning outputs { target, features, tasks, leakage, missingness }
         * @returns {Object} { preprocessing: Array, recommendations: Array }
         */
        generateRecommendations(profile, planningContext = {}) {
            if (!profile || !profile.columns) {
                return { preprocessing: [], recommendations: [] };
            }

            const preprocessing = [];
            const recommendations = [];

            const cols = profile.columns || [];
            const ds = profile.dataset || {};
            const q = profile.quality || {};
            const { target, features, tasks, leakage, missingness } = planningContext;

            // ================================================================
            // 1. PREPROCESSING ACTIONS
            // ================================================================

            // A. Constant Column Removal
            const constantCols = cols.filter(c => c.stats && c.stats.isConstant).map(c => c.name);
            if (constantCols.length > 0) {
                preprocessing.push({
                    action: 'constant_column_removal',
                    priority: 'high',
                    columns: constantCols,
                    reasoning: `Columns contain zero variance across all rows and contribute zero discriminative information.`
                });
            }

            // B. Near-Constant Column Review
            const nearConstantCols = cols.filter(c => c.stats && c.stats.isNearConstant && !c.stats.isConstant).map(c => c.name);
            if (nearConstantCols.length > 0) {
                preprocessing.push({
                    action: 'near_constant_column_review',
                    priority: 'medium',
                    columns: nearConstantCols,
                    reasoning: `Top value accounts for > 95% of observations. Review for low-variance filtering or imbalance correction.`
                });
            }

            // C. Identifier Exclusion
            const idCols = cols.filter(c => c.semanticRole === 'identifier' || c.detectedType === 'identifier' || (features && features.excluded && features.excluded.some(f => f.column === c.name && f.reasons.some(r => r.toLowerCase().includes('identifier'))))).map(c => c.name);
            if (idCols.length > 0) {
                preprocessing.push({
                    action: 'identifier_exclusion',
                    priority: 'high',
                    columns: idCols,
                    reasoning: `Exclude high-cardinality row keys from direct input to avoid model overfitting and spurious memorization.`
                });
            }

            // D. Missing Value Imputation & Complete Missing Removal
            const allNullCols = cols.filter(c => c.stats && c.stats.nullPct >= 95).map(c => c.name);
            if (allNullCols.length > 0) {
                preprocessing.push({
                    action: 'missing_column_removal',
                    priority: 'high',
                    columns: allNullCols,
                    reasoning: `Columns contain >= 95% missing values and should be removed prior to imputation and modeling.`
                });
            }

            const missingCols = cols.filter(c => c.stats && c.stats.nullCount > 0 && c.stats.nullPct < 95).map(c => c.name);
            if (missingCols.length > 0) {
                const isMAR = missingness && missingness.patterns && missingness.patterns.some(p => p.type === 'mar_candidate');
                preprocessing.push({
                    action: 'missing_value_imputation',
                    priority: missingCols.some(col => {
                        const colObj = cols.find(c => c.name === col);
                        return colObj && colObj.stats.nullPct >= 20;
                    }) ? 'high' : 'medium',
                    columns: missingCols,
                    reasoning: isMAR
                        ? `Missing values present in ${missingCols.length} column(s). Conditioned/multivariate imputation recommended due to structured missingness.`
                        : `Missing values present in ${missingCols.length} column(s). Standard median/mode or iterative imputation suitable before modeling.`
                });
            }

            // E. Categorical Encoding
            const catCols = cols.filter(c => (c.detectedType === 'categorical' || c.detectedType === 'boolean') && (!c.stats || !c.stats.isConstant)).map(c => c.name);
            if (catCols.length > 0) {
                preprocessing.push({
                    action: 'categorical_encoding',
                    priority: 'high',
                    columns: catCols,
                    reasoning: `Discrete variables require numerical encoding (One-Hot, Ordinal, or Target Encoding) for mathematical modeling estimators.`
                });
            }

            // F. Rare Category Handling
            const rareCols = cols.filter(c => c.stats && c.stats.rareCategoryCount > 0).map(c => c.name);
            if (rareCols.length > 0) {
                preprocessing.push({
                    action: 'rare_category_handling',
                    priority: 'low',
                    columns: rareCols,
                    reasoning: `Contains infrequent categories (< 1% frequency). Group rare categories into an "Other" bucket to reduce dimensionality.`
                });
            }

            // G. Feature Scaling & Normalization
            const numCols = cols.filter(c => (c.detectedType === 'integer' || c.detectedType === 'decimal' || c.detectedType === 'numeric') && (!c.stats || !c.stats.isConstant)).map(c => c.name);
            if (numCols.length > 1) {
                const ranges = numCols.map(col => {
                    const colObj = cols.find(c => c.name === col);
                    return colObj && colObj.stats ? (colObj.stats.max - colObj.stats.min) : 0;
                });
                const maxRange = Math.max(...ranges, 1);
                const minRange = Math.min(...ranges.filter(r => r > 0), 1);
                const largeScaleDiff = (maxRange / minRange) >= 50;

                preprocessing.push({
                    action: 'scaling',
                    priority: largeScaleDiff ? 'high' : 'medium',
                    columns: numCols,
                    reasoning: largeScaleDiff
                        ? `Numerical features exhibit vastly different scales (ratio > 50x). Standardize (Z-score) or Normalize (MinMax) to prevent large-magnitude dominance.`
                        : `Apply standard scaling to numerical variables to ensure gradient-based and distance-based model convergence.`
                });
            }

            // H. Outlier Review
            const outlierCols = cols.filter(c => c.stats && c.stats.outliers && c.stats.outliers.count > 0).map(c => c.name);
            if (outlierCols.length > 0) {
                preprocessing.push({
                    action: 'outlier_review',
                    priority: 'medium',
                    columns: outlierCols,
                    reasoning: `Statistical outliers identified via Tukey IQR method (1.5 * IQR). Inspect for data entry anomalies or apply robust clipping/winsorization.`
                });
            }

            // I. Date Feature Extraction
            const dateCols = cols.filter(c => c.detectedType === 'date' || c.detectedType === 'datetime').map(c => c.name);
            if (dateCols.length > 0) {
                preprocessing.push({
                    action: 'date_feature_extraction',
                    priority: 'high',
                    columns: dateCols,
                    reasoning: `Extract calendar features (year, month, day of week, hour, cyclical sine/cosine transforms) to supply time context to models.`
                });
            }

            // J. Duplicate Row Review
            if (ds.duplicateRowCount > 0) {
                preprocessing.push({
                    action: 'duplicate_review',
                    priority: ds.duplicateRowPct >= 5 ? 'high' : 'medium',
                    columns: ['[Entire Dataset]'],
                    reasoning: `Identified ${ds.duplicateRowCount} duplicate rows (${ds.duplicateRowPct}% of dataset). Review for deduplication to prevent data leakage during train/test splits.`
                });
            }

            // ================================================================
            // 2. STRATEGIC RECOMMENDATIONS (immediate, recommended, optional, warnings)
            // ================================================================

            // Warnings / Immediate: Data Leakage
            if (leakage && leakage.riskLevel === 'high') {
                const topLeak = leakage.findings[0];
                recommendations.push({
                    category: 'immediate',
                    priority: 'high',
                    recommendation: 'Resolve High Data Leakage Risk Before Any Model Training',
                    reasoning: `Column "${topLeak.column}" shows near-deterministic association with the target (${topLeak.reason}). Exclude or verify historical availability.`
                });
            }

            // Warnings: Critical Missingness
            if (missingness && missingness.riskLevel === 'critical') {
                recommendations.push({
                    category: 'warnings',
                    priority: 'high',
                    recommendation: 'Severe Missingness May Distort Downstream Statistical Validity',
                    reasoning: `Over 30% of cell values are missing. Analyze systemic collection failures prior to aggressive imputation.`
                });
            }

            // Recommended: Target & Primary Task
            if (target) {
                recommendations.push({
                    category: 'recommended',
                    priority: 'high',
                    recommendation: `Target Variable Selected: Focus Analysis on "${target.column}"`,
                    reasoning: `Optimal candidate (${target.suitability} suitability: ${target.score}/100) supporting ${target.taskHints.join(', ')} workflows.`
                });
            } else {
                recommendations.push({
                    category: 'recommended',
                    priority: 'medium',
                    recommendation: 'No Obvious Supervised Target: Proceed with Unsupervised Exploratory Workflows',
                    reasoning: 'Dataset does not exhibit a dominant single outcome variable. Prioritize clustering, PCA, and correlation matrix analysis.'
                });
            }

            // Recommended: Primary Analytical Task
            if (tasks && tasks.length > 0 && tasks[0].priority === 'high') {
                const topTask = tasks[0];
                recommendations.push({
                    category: 'recommended',
                    priority: 'high',
                    recommendation: `Prioritize ${topTask.task.replace(/_/g, ' ').toUpperCase()} Pipeline`,
                    reasoning: topTask.reasoning.join('. ')
                });
            }

            // Optional: Feature Engineering Opportunities
            if (dateCols.length > 0 && numCols.length > 0) {
                recommendations.push({
                    category: 'optional',
                    priority: 'low',
                    recommendation: 'Engineer Rolling Window & Lag Features',
                    reasoning: 'Presence of temporal and numerical metrics enables lag calculation, moving averages, and volatility tracking.'
                });
            }

            if (catCols.length >= 2) {
                recommendations.push({
                    category: 'optional',
                    priority: 'low',
                    recommendation: 'Evaluate Feature Interactions Across Categorical Dimensions',
                    reasoning: 'Interaction terms between discrete factors can reveal multi-dimensional subgroup synergies.'
                });
            }

            return { preprocessing, recommendations };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.RecommendationEngine = RecommendationEngine;

})(window);
