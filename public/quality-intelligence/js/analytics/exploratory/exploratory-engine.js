/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/exploratory/exploratory-engine.js
 * ============================================================================
 * Master coordinator for Exploratory Data Analysis (EDA):
 * - Numeric and Categorical distributions
 * - Pairwise correlations and redundancy
 * - Categorical -> Numeric group comparisons
 * - Temporal trend and seasonality analysis
 * - Multi-method outlier analysis
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ExploratoryEngine = {
        /**
         * Run full exploratory analysis pipeline
         * 
         * @param {Object} params
         * @param {Object} params.data Active dataset object ({ columns, rows })
         * @param {Object} params.profile Step 2 profiler result
         * @param {Object} params.analysisPlan Step 2.5 intelligence plan
         * @returns {Object} Unified EDA result
         */
        run({ data, profile, analysisPlan }) {
            const rows = (data && Array.isArray(data.rows)) ? data.rows : [];
            const cols = (data && Array.isArray(data.columns)) ? data.columns : [];

            const result = {
                status: 'completed',
                distributions: [],
                relationships: [],
                groups: [],
                trends: [],
                seasonality: [],
                outliers: []
            };

            if (rows.length === 0 || cols.length === 0) {
                result.status = 'skipped';
                result.reason = 'Empty dataset provided';
                return result;
            }

            const Dist = window.UDIP && window.UDIP.DistributionAnalysis;
            const Group = window.UDIP && window.UDIP.GroupAnalysis;
            const Trend = window.UDIP && window.UDIP.TrendAnalysis;
            const Season = window.UDIP && window.UDIP.SeasonalityAnalysis;
            const Outlier = window.UDIP && window.UDIP.OutlierAnalysis;

            // Identify column types
            const numCols = [];
            const catCols = [];
            let timeCol = null;

            const colList = Array.isArray(profile?.columns)
                ? profile.columns
                : (profile?.columns ? Object.entries(profile.columns).map(([k, v]) => ({ name: k, ...v })) : []);

            const ID_REGEX = /^(id|uuid|guid|code|key|no|num|ref|hash|serial|account|sku|order|cust|emp|trans|batch|patient|sample|record|row|item|index|barcode|entity)[_-]?|[_-]?(id|code|key|no|num|guid|ref|serial|idx|pk)$/i;

            if (colList.length > 0) {
                colList.forEach(p => {
                    const col = p.name;
                    const role = p.semanticRole || p.role || '';
                    const isId = role === 'identifier' || ID_REGEX.test(col);
                    const detectedType = p.detectedType || (p.type ? p.type.detectedType : 'unknown');
                    if (['integer', 'decimal', 'numeric', 'float'].includes(detectedType) && !isId) {
                        numCols.push(col);
                    } else if (['categorical', 'boolean'].includes(detectedType) && !isId) {
                        catCols.push(col);
                    } else if (['date', 'datetime', 'time'].includes(detectedType) || role === 'time_dimension' || (/date|time|timestamp|تاريخ|وقت/i.test(col))) {
                        if (!timeCol) timeCol = col;
                    }
                });
            } else {
                // Fallback inference
                cols.forEach(c => {
                    if (ID_REGEX.test(c)) return;
                    const val = rows.find(r => r && r[c] !== null && r[c] !== undefined)?.[c];
                    if (Number.isFinite(Number(val))) numCols.push(c);
                    else catCols.push(c);
                });
            }

            // 1. Distributions & Outliers
            numCols.forEach(col => {
                const vals = rows.map(r => Number(r[col])).filter(v => Number.isFinite(v));
                const colProf = colList.find(c => c.name === col);
                if (Dist) {
                    result.distributions.push(Dist.analyzeNumeric(col, vals, colProf));
                }
                if (Outlier) {
                    result.outliers.push(Outlier.analyze(col, vals));
                }
            });

            catCols.forEach(col => {
                const vals = rows.map(r => r[col]);
                if (Dist) {
                    result.distributions.push(Dist.analyzeCategorical(col, vals));
                }
            });

            // 2. Pairwise Relationships (reuse Step 2 / 2.5 relationships)
            if (profile && profile.relationships && Array.isArray(profile.relationships.correlations) && profile.relationships.correlations.length > 0) {
                result.relationships = profile.relationships.correlations.map(corr => {
                    const c1 = corr.colA || corr.col1;
                    const c2 = corr.colB || corr.col2;
                    const rVal = Number.isFinite(corr.pearson) ? corr.pearson : (Number.isFinite(corr.correlation) ? corr.correlation : 0);
                    return {
                        col1: c1,
                        col2: c2,
                        correlation: rVal,
                        strength: corr.strength || 'moderate',
                        isRedundant: Math.abs(rVal) >= 0.95
                    };
                });
            } else if (numCols.length >= 2) {
                // Compute pairwise correlations if not present
                const PUtils = (window.UDIP && window.UDIP.ProfilerUtils) || (typeof ProfilerUtils !== 'undefined' ? ProfilerUtils : null);
                for (let i = 0; i < numCols.length; i++) {
                    for (let j = i + 1; j < numCols.length; j++) {
                        const c1 = numCols[i];
                        const c2 = numCols[j];
                        const pairs = [];
                        rows.forEach(r => {
                            const v1 = Number(r[c1]);
                            const v2 = Number(r[c2]);
                            if (Number.isFinite(v1) && Number.isFinite(v2)) {
                                pairs.push([v1, v2]);
                            }
                        });
                        if (pairs.length >= 5 && PUtils) {
                            const rVal = PUtils.pearsonCorrelation(pairs.map(p => p[0]), pairs.map(p => p[1]));
                            if (Number.isFinite(rVal)) {
                                result.relationships.push({
                                    col1: c1,
                                    col2: c2,
                                    correlation: Number(rVal.toFixed(4)),
                                    strength: Math.abs(rVal) >= 0.7 ? 'strong' : (Math.abs(rVal) >= 0.4 ? 'moderate' : 'weak'),
                                    isRedundant: Math.abs(rVal) >= 0.95
                                });
                            }
                        }
                    }
                }
            }

            // 3. Group Comparisons (Top categorical columns against numeric targets or primary metrics)
            const targetCol = analysisPlan?.primaryTarget?.column || numCols[0];
            if (Group && targetCol && numCols.includes(targetCol)) {
                catCols.slice(0, 3).forEach(catCol => {
                    const groupRes = Group.compareGroups(rows, catCol, targetCol);
                    if (groupRes.groupCount >= 2) {
                        result.groups.push(groupRes);
                    }
                });
            }

            // 4. Temporal Trends & Sequential Trajectories
            let detectedSeqCol = timeCol;
            if (!detectedSeqCol) {
                // Discover sequence, tenure, year, month, or temporal progression candidate
                const seqCandidate = numCols.find(c => /tenure|month|year|period|step|time|age|day|week|quarter|cohort|sequence/i.test(c));
                if (seqCandidate) {
                    detectedSeqCol = seqCandidate;
                }
            }

            if (detectedSeqCol && numCols.length > 0) {
                const targetMetrics = numCols.filter(c => c !== detectedSeqCol);
                targetMetrics.forEach(metricCol => {
                    if (Trend) {
                        const trendRes = Trend.analyze(rows, detectedSeqCol, metricCol);
                        if (trendRes && trendRes.observations >= 3) {
                            result.trends.push(trendRes);
                        }
                    }
                });

                if (Season && timeCol) {
                    const metricCol = targetCol && numCols.includes(targetCol) && targetCol !== timeCol ? targetCol : targetMetrics[0];
                    if (metricCol) {
                        const seasonRes = Season.analyze(rows, timeCol, metricCol);
                        result.seasonality.push(seasonRes);
                    }
                }
            }

            return result;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.ExploratoryEngine = ExploratoryEngine;

})(typeof window !== 'undefined' ? window : global);
