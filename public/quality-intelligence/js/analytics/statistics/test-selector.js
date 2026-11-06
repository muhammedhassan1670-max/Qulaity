/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/statistics/test-selector.js
 * ============================================================================
 * Intelligently selects appropriate statistical hypothesis tests based on:
 * - Variable types (Numeric, Categorical)
 * - Group count (2 groups vs k >= 3 groups)
 * - Sample sizes and distribution symmetry (parametric vs non-parametric)
 * Provides transparent reasoning for test selection.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const TestSelector = {
        /**
         * Select appropriate test for pair of variables
         * 
         * @param {Object} params
         * @param {string} params.type1 'numeric' | 'categorical'
         * @param {string} params.type2 'numeric' | 'categorical'
         * @param {number} [params.groupCount] Number of distinct categories
         * @param {boolean} [params.isNormal] Whether numeric variable is approximately normal
         * @param {number} [params.sampleSize] Total observation count
         * @returns {Object} Test recommendation with reasoning
         */
        selectTest({ type1, type2, groupCount = 2, isNormal = true, sampleSize = 30 }) {
            // Case 1: Numeric <-> Numeric
            if (type1 === 'numeric' && type2 === 'numeric') {
                if (isNormal && sampleSize >= 15) {
                    return {
                        test: 'pearson_correlation',
                        name: 'Pearson Correlation Test',
                        type: 'parametric',
                        reasoning: [
                            'Both variables are continuous numeric',
                            'Sample distribution satisfies linear symmetry assumptions',
                            'Sample size is sufficient (n >= 15)'
                        ]
                    };
                } else {
                    return {
                        test: 'spearman_correlation',
                        name: 'Spearman Rank Correlation Test',
                        type: 'non_parametric',
                        reasoning: [
                            'Both variables are numeric',
                            'Non-parametric test selected due to skewness or moderate sample size',
                            'Evaluates monotonic relationship without assuming bivariate normality'
                        ]
                    };
                }
            }

            // Case 2: Categorical <-> Numeric
            const isCatNum = (type1 === 'categorical' && type2 === 'numeric') || (type1 === 'numeric' && type2 === 'categorical');
            if (isCatNum) {
                if (groupCount === 2) {
                    if (isNormal && sampleSize >= 20) {
                        return {
                            test: 'welch_t_test',
                            name: "Welch's Two-Sample t-Test",
                            type: 'parametric',
                            reasoning: [
                                'Comparing numeric metric across exactly 2 categories',
                                'Robust to unequal group variances',
                                'Approximately normal distribution'
                            ]
                        };
                    } else {
                        return {
                            test: 'mann_whitney_u',
                            name: 'Mann-Whitney U Test',
                            type: 'non_parametric',
                            reasoning: [
                                'Comparing numeric metric across 2 categories',
                                'Non-parametric rank test selected to handle potential skewness/outliers safely',
                                'Does not require normal distribution assumption'
                            ]
                        };
                    }
                } else if (groupCount >= 3) {
                    if (isNormal && sampleSize >= 30) {
                        return {
                            test: 'one_way_anova',
                            name: 'One-Way ANOVA',
                            type: 'parametric',
                            reasoning: [
                                `Comparing numeric metric across ${groupCount} independent categories`,
                                'Evaluates between-group vs within-group variance',
                                'Sample size and distribution satisfy ANOVA assumptions'
                            ]
                        };
                    } else {
                        return {
                            test: 'kruskal_wallis',
                            name: 'Kruskal-Wallis H Test',
                            type: 'non_parametric',
                            reasoning: [
                                `Comparing numeric metric across ${groupCount} categories`,
                                'Non-parametric ANOVA alternative chosen due to distributional skewness or small sample size',
                                'Evaluates differences in rank distributions'
                            ]
                        };
                    }
                }
            }

            // Case 3: Categorical <-> Categorical
            if (type1 === 'categorical' && type2 === 'categorical') {
                return {
                    test: 'chi_square',
                    name: 'Chi-Square Test of Independence',
                    type: 'non_parametric',
                    reasoning: [
                        'Both variables are discrete categorical',
                        'Tests for statistical independence between categorical distributions in contingency table'
                    ]
                };
            }

            return {
                test: 'none',
                name: 'No Suitable Test',
                type: 'none',
                reasoning: ['Variable types are unsupported for hypothesis testing']
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.TestSelector = TestSelector;

})(typeof window !== 'undefined' ? window : global);
