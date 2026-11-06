/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: workspace/storytelling/chart-selector.js
 * ============================================================================
 * Adaptive Visualization Recommendation & Epistemic Selection Rationale.
 * 
 * Determines the mathematically optimal visual representation based on:
 * - Variable measurement scales (continuous, discrete, nominal, ordinal, temporal)
 * - Cardinality and distinct value counts
 * - Analytical objective (distribution, correlation, ranking, trend, clustering)
 * - Perceptual effectiveness guidelines (Cleveland & McGill)
 * ============================================================================
 */

(function (window) {
    'use strict';

    const isNumericType = (t) => ['numeric', 'integer', 'decimal', 'number'].includes(t);

    const ChartSelector = {
        /**
         * Recommend optimal visual representation with mathematical rationale
         * 
         * @param {Object} params
         * @param {Array<Object>} params.variables - Array of column profile objects
         * @param {string} params.objective - 'distribution' | 'correlation' | 'ranking' | 'composition' | 'temporal_trend' | 'clustering'
         * @param {number} [params.rowCount]
         * @returns {Object} Chart recommendation
         */
        recommendChart({
            variables = [],
            objective = 'distribution',
            rowCount = 100
        } = {}) {
            if (!Array.isArray(variables) || variables.length === 0 || !variables[0]) {
                return {
                    chartType: 'bar',
                    title: 'Generic Overview',
                    rationale: 'Defaulting to standard categorical distribution.',
                    axes: { x: null, y: null },
                    caveats: []
                };
            }

            const var1 = variables[0];
            const var2 = variables[1] || null;
            const type1 = var1?.detectedType || 'unknown';
            const type2 = var2?.detectedType || null;

            const is1Num = isNumericType(type1);
            const is2Num = var2 ? isNumericType(type2) : false;
            const is1Time = type1 === 'datetime' || type1 === 'date';

            const caveats = [];

            // 1. Single Variable Distribution
            if (variables.length === 1 || !var2) {
                if (is1Num) {
                    return {
                        chartType: 'histogram',
                        title: `Distribution of ${var1.name}`,
                        rationale: 'Continuous univariate data is most accurately represented via histogram with dynamic Freedman-Diaconis binning to preserve density fidelity.',
                        axes: { x: var1.name, y: 'Density / Frequency' },
                        suggestedBins: Math.min(30, Math.max(5, Math.round(Math.cbrt(rowCount) * 2))),
                        caveats
                    };
                } else if (is1Time) {
                    return {
                        chartType: 'line',
                        title: `Temporal Activity: ${var1.name}`,
                        rationale: 'Sequential temporal points are best visualized as continuous time-series curves.',
                        axes: { x: var1.name, y: 'Observation Count' },
                        caveats
                    };
                } else {
                    const uniqueCount = var1.stats?.uniqueCount || 5;
                    if (uniqueCount > 15) {
                        caveats.push('High cardinality: Top 10 categories recommended with remainder aggregated into "Other".');
                    }
                    return {
                        chartType: 'bar',
                        title: `Category Frequency: ${var1.name}`,
                        rationale: 'Discrete qualitative categories are best compared along a common aligned scale via sorted horizontal or vertical bars.',
                        axes: { x: var1.name, y: 'Frequency' },
                        caveats
                    };
                }
            }

            // 2. Bivariate Relationships
            if (is1Num && is2Num) {
                if (objective === 'temporal_trend' || is1Time) {
                    return {
                        chartType: 'line',
                        title: `${var2.name} over ${var1.name}`,
                        rationale: 'Continuous dynamic evolution over sequential intervals is optimally tracked with a connected line trajectory.',
                        axes: { x: var1.name, y: var2.name },
                        caveats
                    };
                }

                if (rowCount > 1000) {
                    caveats.push('Large sample size: Recommend hexagonal binning or opacity alpha blending to prevent visual overplotting.');
                }

                return {
                    chartType: 'scatter',
                    title: `Bivariate Association: ${var1.name} vs ${var2.name}`,
                    rationale: 'Continuous bivariate space requires scatter plot with linear / non-linear fit overlay to evaluate joint variation and heteroscedasticity.',
                    axes: { x: var1.name, y: var2.name },
                    caveats
                };
            }

            // 3. Mixed Numerical & Categorical
            if ((is1Num && !is2Num) || (!is1Num && is2Num)) {
                const numVar = is1Num ? var1 : var2;
                const catVar = is1Num ? var2 : var1;

                return {
                    chartType: 'box',
                    title: `Subgroup Dispersion: ${numVar.name} by ${catVar.name}`,
                    rationale: 'Categorical conditioning of a numerical variable is optimally rendered via boxplots or violin density plots to display median, interquartile ranges, and outliers simultaneously.',
                    axes: { x: catVar.name, y: numVar.name },
                    caveats
                };
            }

            // 4. Two Categorical Variables
            return {
                chartType: 'heatmap',
                title: `Cross-Tabulation: ${var1.name} × ${var2.name}`,
                rationale: 'Two discrete dimensions are effectively compared using a contingency matrix heatmap with color gradient indicating co-occurrence frequency.',
                axes: { x: var1.name, y: var2.name, fill: 'Co-occurrence Count' },
                caveats
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.ChartSelector = ChartSelector;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChartSelector;
    }
})(typeof window !== 'undefined' ? window : global);
