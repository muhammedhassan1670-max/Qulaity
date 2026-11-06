/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: workspace/investigation/evidence-explorer.js
 * ============================================================================
 * Deep-Dive Variable Explorer & Evidence Aggregator.
 * 
 * Provides instant mathematical introspection for any designated variable:
 * - Descriptive parameter moments (mean, median, variance, quantiles)
 * - Bivariate correlation spectrum across all numerical features
 * - Tukey IQR anomaly & extreme value bounds
 * - Predictive importance contribution across trained models
 * - Drift and stability history from continuous monitoring
 * ============================================================================
 */

(function (window) {
    'use strict';

    const EvidenceExplorer = {
        /**
         * Explore all empirical evidence relating to a specific variable
         * 
         * @param {string} variableName
         * @param {Object} context
         * @param {Object} context.profile
         * @param {Object} context.dataset
         * @param {Object} context.analytics
         * @param {Object} context.autonomousIntelligence
         * @returns {Object} Comprehensive variable profile & evidence package
         */
        exploreVariable(variableName, context = {}) {
            if (!variableName) return null;

            const profile = context.profile || {};
            const dataset = context.dataset || {};
            const analytics = context.analytics || {};
            const autoInt = context.autonomousIntelligence || null;

            // 1. Find column profile
            const col = (profile.columns || []).find(c => c.name === variableName);
            if (!col) return null;

            const stats = col.stats || {};
            const detectedType = col.detectedType || 'unknown';

            // 2. Compute bivariate correlations with other numeric columns
            const correlations = this._computeCorrelations(variableName, profile, dataset);

            // 3. Compute Tukey IQR Anomaly Bounds
            const anomalyBounds = this._calculateIQRBounds(stats);

            // 4. Extract Feature Importance contribution
            const featureImportance = this._extractFeatureImportance(variableName, analytics);

            // 5. Extract Drift Status
            const driftStatus = this._extractDriftStatus(variableName, autoInt);

            return {
                variable: variableName,
                detectedType,
                semanticType: col.semanticType || 'general',
                stats: {
                    count: stats.count || dataset.rowCount || 0,
                    missingCount: stats.missingCount || 0,
                    missingPercentage: stats.missingPercentage || 0,
                    uniqueCount: stats.uniqueCount || 'N/A',
                    mean: stats.mean != null ? Number(stats.mean.toFixed(3)) : null,
                    median: stats.median != null ? Number(stats.median.toFixed(3)) : null,
                    std: stats.std != null ? Number(stats.std.toFixed(3)) : null,
                    min: stats.min != null ? stats.min : null,
                    max: stats.max != null ? stats.max : null,
                    skewness: stats.skewness != null ? Number(stats.skewness.toFixed(3)) : null
                },
                correlations,
                anomalyBounds,
                featureImportance,
                driftStatus
            };
        },

        /**
         * Extract or compute bivariate correlations with all numeric features
         * @private
         */
        _computeCorrelations(targetVar, profile, dataset) {
            const results = [];
            const isNumericType = (t) => ['numeric', 'integer', 'decimal', 'number'].includes(t);

            const thisCol = (profile.columns || []).find(c => c.name === targetVar);
            if (!thisCol || !isNumericType(thisCol.detectedType)) return results;

            // Check if relationships already computed in profile
            if (profile.relationships?.correlations) {
                const corrMatrix = profile.relationships.correlations;
                if (corrMatrix[targetVar]) {
                    Object.entries(corrMatrix[targetVar]).forEach(([otherVar, rVal]) => {
                        if (otherVar !== targetVar && typeof rVal === 'number' && Number.isFinite(rVal)) {
                            results.push({
                                variable: otherVar,
                                r: Number(rVal.toFixed(3)),
                                absR: Math.abs(rVal),
                                strength: Math.abs(rVal) >= 0.7 ? 'Strong' : (Math.abs(rVal) >= 0.3 ? 'Moderate' : 'Weak'),
                                direction: rVal >= 0 ? 'Positive' : 'Negative'
                            });
                        }
                    });
                }
            }

            // Fallback calculation from raw dataset rows if correlations matrix missing
            if (results.length === 0 && Array.isArray(dataset.rows) && dataset.rows.length > 2) {
                const numericCols = (profile.columns || []).filter(c => isNumericType(c.detectedType) && c.name !== targetVar);
                const rows = dataset.rows;

                numericCols.forEach(otherCol => {
                    const r = this._pearsonCorrelation(rows, targetVar, otherCol.name);
                    if (Number.isFinite(r)) {
                        results.push({
                            variable: otherCol.name,
                            r: Number(r.toFixed(3)),
                            absR: Math.abs(r),
                            strength: Math.abs(r) >= 0.7 ? 'Strong' : (Math.abs(r) >= 0.3 ? 'Moderate' : 'Weak'),
                            direction: r >= 0 ? 'Positive' : 'Negative'
                        });
                    }
                });
            }

            // Sort by absolute correlation descending
            return results.sort((a, b) => b.absR - a.absR);
        },

        /**
         * Quick Pearson Correlation helper
         * @private
         */
        _pearsonCorrelation(rows, colA, colB) {
            let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;
            let n = 0;

            for (let i = 0; i < rows.length; i++) {
                const valA = parseFloat(rows[i][colA]);
                const valB = parseFloat(rows[i][colB]);
                if (Number.isFinite(valA) && Number.isFinite(valB)) {
                    sumA += valA;
                    sumB += valB;
                    sumAB += valA * valB;
                    sumA2 += valA * valA;
                    sumB2 += valB * valB;
                    n++;
                }
            }

            if (n < 3) return 0;
            const numerator = (n * sumAB) - (sumA * sumB);
            const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
            if (!denominator || denominator === 0) return 0;
            return Math.max(-1, Math.min(1, numerator / denominator));
        },

        /**
         * Calculate Tukey IQR Outlier Bounds
         * @private
         */
        _calculateIQRBounds(stats) {
            if (stats.q1 == null || stats.q3 == null) {
                if (stats.mean != null && stats.std != null) {
                    // Fallback to 3-sigma bounds
                    return {
                        lowerBound: Number((stats.mean - (3 * stats.std)).toFixed(2)),
                        upperBound: Number((stats.mean + (3 * stats.std)).toFixed(2)),
                        method: '3-Sigma Gaussian Bounds'
                    };
                }
                return null;
            }

            const iqr = stats.q3 - stats.q1;
            const lowerBound = stats.q1 - (1.5 * iqr);
            const upperBound = stats.q3 + (1.5 * iqr);

            return {
                lowerBound: Number(lowerBound.toFixed(2)),
                upperBound: Number(upperBound.toFixed(2)),
                iqr: Number(iqr.toFixed(2)),
                method: 'Tukey 1.5x IQR Rule'
            };
        },

        /**
         * Extract feature importance for this variable from model interpretation
         * @private
         */
        _extractFeatureImportance(variableName, analytics) {
            const fiList = (analytics?.machineLearning?.featureImportance ||
                            analytics?.interpretation?.featureImportances ||
                            []).map(f => ({
                                variable: f.variable || f.feature || f.name,
                                importance: Number.isFinite(f.importance) ? f.importance : 0.1
                            }));
            const found = fiList.find(f => f.variable === variableName);
            if (!found) return null;

            return {
                importanceScore: Number((found.importance * 100).toFixed(2)),
                rank: fiList.indexOf(found) + 1,
                totalFeatures: fiList.length
            };
        },

        /**
         * Extract drift status for this variable from Step 5 Autonomous Monitoring
         * @private
         */
        _extractDriftStatus(variableName, autoInt) {
            if (!autoInt) return { status: 'Stationary / No Prior Version', hasDrift: false };

            const featureDrifts = autoInt.drift?.datasetDrift?.featureDrifts || [];
            const found = featureDrifts.find(d => d.feature === variableName);
            if (!found) return { status: 'Stable', hasDrift: false };

            return {
                status: found.hasDrift ? 'Significant Distribution Drift' : 'Stable',
                hasDrift: Boolean(found.hasDrift),
                pVal: found.pValue != null ? Number(found.pValue.toFixed(4)) : null,
                distance: found.distance != null ? Number(found.distance.toFixed(4)) : null
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.EvidenceExplorer = EvidenceExplorer;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = EvidenceExplorer;
    }
})(typeof window !== 'undefined' ? window : global);
