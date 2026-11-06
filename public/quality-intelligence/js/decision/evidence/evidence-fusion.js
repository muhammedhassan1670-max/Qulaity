/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: decision/evidence/evidence-fusion.js
 * ============================================================================
 * Aggregates, reconciles, and synthesizes empirical evidence across all
 * analytical layers: Profiling, Quality, Relationships, Hypothesis Tests,
 * Effect Sizes, Trends, Seasonality, Outliers, Anomalies, Forecasting,
 * and Machine Learning.
 * 
 * Classifies evidence into Strong, Moderate, Weak, or Insufficient.
 * Strictly guarantees zero mutation of raw data, profiles, and analytics.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const EvidenceFusion = {
        /**
         * Fuse all analytical findings into a normalized, searchable evidence repository
         * 
         * @param {Object} params
         * @param {Object} [params.profile]
         * @param {Object} [params.analysisPlan]
         * @param {Object} [params.analytics]
         * @returns {Object} { items: Array<Object>, summary: Object, byColumn: Object }
         */
        fuse({ profile, analysisPlan, analytics } = {}) {
            const items = [];
            let counter = 1;

            const nextId = () => `EVD-${String(counter++).padStart(3, '0')}`;

            if (!profile && !analysisPlan && !analytics) {
                return {
                    items: [],
                    summary: { total: 0, strong: 0, moderate: 0, weak: 0, insufficient: 0 },
                    byColumn: {}
                };
            }

            // -----------------------------------------------------------------
            // 1. Evidence from Data Quality & Profiling
            // -----------------------------------------------------------------
            if (profile?.quality) {
                const q = profile.quality;
                const score = Number.isFinite(q.qualityScore) ? q.qualityScore : (Number.isFinite(q.score) ? q.score : 0);
                const completeness = Number.isFinite(q.completenessPct) ? q.completenessPct : 0;

                items.push({
                    id: nextId(),
                    source: 'data_profiler',
                    type: 'data_quality',
                    metric: 'quality_score',
                    value: score,
                    direction: score >= 80 ? 'positive' : (score >= 60 ? 'neutral' : 'negative'),
                    strength: score >= 80 ? 'strong' : (score >= 60 ? 'moderate' : 'weak'),
                    confidence: 90,
                    supportingColumns: [],
                    interpretation: `Overall dataset quality is audited at ${score}/100 with ${completeness}% data completeness.`
                });
            }

            // High Missingness or Constant Columns
            if (Array.isArray(profile?.columns)) {
                profile.columns.forEach(col => {
                    if (col.stats?.nullPct >= 20) {
                        items.push({
                            id: nextId(),
                            source: 'data_profiler',
                            type: 'missingness',
                            metric: 'null_percentage',
                            value: col.stats.nullPct,
                            direction: 'negative',
                            strength: col.stats.nullPct >= 50 ? 'strong' : 'moderate',
                            confidence: 95,
                            supportingColumns: [col.name],
                            interpretation: `Column "${col.name}" exhibits high missingness (${col.stats.nullPct}% null values).`
                        });
                    }
                    if (col.stats?.isConstant) {
                        items.push({
                            id: nextId(),
                            source: 'data_profiler',
                            type: 'zero_variance',
                            metric: 'unique_count',
                            value: 1,
                            direction: 'negative',
                            strength: 'strong',
                            confidence: 100,
                            supportingColumns: [col.name],
                            interpretation: `Column "${col.name}" has zero variance (constant single value); excluded from predictive modeling.`
                        });
                    }
                });
            }

            // -----------------------------------------------------------------
            // 2. Evidence from Exploratory Data Analysis (EDA)
            // -----------------------------------------------------------------
            const eda = analytics?.exploratory || {};

            // Pairwise Relationships
            if (Array.isArray(eda.relationships)) {
                eda.relationships.forEach(rel => {
                    const c1 = rel.col1 || rel.colA;
                    const c2 = rel.col2 || rel.colB;
                    const rVal = Number.isFinite(rel.correlation) ? rel.correlation : (Number.isFinite(rel.pearson) ? rel.pearson : 0);
                    const absCorr = Math.abs(rVal);
                    let str = 'weak';
                    if (absCorr >= 0.7) str = 'strong';
                    else if (absCorr >= 0.4) str = 'moderate';

                    items.push({
                        id: nextId(),
                        source: 'exploratory_correlation',
                        type: 'correlation',
                        metric: 'pearson_r',
                        value: rVal,
                        direction: rVal > 0 ? 'positive' : 'negative',
                        strength: str,
                        confidence: 85,
                        supportingColumns: [c1, c2].filter(Boolean),
                        interpretation: `Empirical correlation between "${c1}" and "${c2}" is r = ${rVal} (${rel.strength || str}).`
                    });
                });
            }

            // Trends
            if (Array.isArray(eda.trends)) {
                eda.trends.forEach(tr => {
                    items.push({
                        id: nextId(),
                        source: 'trend_analysis',
                        type: 'temporal_trend',
                        metric: 'slope',
                        value: tr.slope,
                        direction: tr.direction === 'increasing' ? 'increasing' : (tr.direction === 'decreasing' ? 'decreasing' : 'neutral'),
                        strength: tr.strength === 'strong' ? 'strong' : (tr.strength === 'moderate' ? 'moderate' : 'weak'),
                        confidence: 80,
                        supportingColumns: [tr.timeColumn, tr.valueColumn],
                        interpretation: `Temporal sequence displays a ${tr.strength || 'moderate'} ${tr.direction} trend (slope = ${tr.slope}).`
                    });
                });
            }

            // Seasonality
            if (Array.isArray(eda.seasonality)) {
                eda.seasonality.forEach(sn => {
                    if (sn.hasSeasonality) {
                        items.push({
                            id: nextId(),
                            source: 'seasonality_analysis',
                            type: 'periodic_pattern',
                            metric: 'autocorrelation',
                            value: sn.autocorrelation,
                            direction: 'neutral',
                            strength: 'moderate',
                            confidence: 75,
                            supportingColumns: [sn.timeColumn, sn.valueColumn],
                            interpretation: `Periodic cyclical pattern detected at lag interval ${sn.detectedLag} (autocorrelation = ${sn.autocorrelation}).`
                        });
                    }
                });
            }

            // Group Comparisons
            if (Array.isArray(eda.groupComparisons)) {
                eda.groupComparisons.forEach(grp => {
                    if (grp.groups && grp.groups.length >= 2) {
                        const maxDiff = grp.maxDifference || 0;
                        items.push({
                            id: nextId(),
                            source: 'group_comparison',
                            type: 'segment_divergence',
                            metric: 'max_difference',
                            value: maxDiff,
                            direction: 'neutral',
                            strength: Math.abs(maxDiff) > 0.3 ? 'moderate' : 'weak',
                            confidence: 75,
                            supportingColumns: [grp.categoricalColumn, grp.numericColumn],
                            interpretation: `Observed segment difference across "${grp.categoricalColumn}" on "${grp.numericColumn}" (max divergence = ${maxDiff}).`
                        });
                    }
                });
            }

            // -----------------------------------------------------------------
            // 3. Evidence from Statistical Hypothesis Tests
            // -----------------------------------------------------------------
            const stats = analytics?.statistics || {};
            if (Array.isArray(stats.tests)) {
                stats.tests.forEach(t => {
                    const isSig = t.isSignificant === true || (Number.isFinite(t.pValue) && t.pValue < 0.05);
                    const effVal = t.effectSize ? Number(t.effectSize.value) : 0;
                    let str = 'weak';

                    if (isSig && Math.abs(effVal) >= 0.5) str = 'strong';
                    else if (isSig || Math.abs(effVal) >= 0.3) str = 'moderate';

                    items.push({
                        id: nextId(),
                        source: 'hypothesis_testing',
                        type: 'statistical_significance',
                        metric: 'p_value',
                        value: Number.isFinite(t.pValue) ? t.pValue : 1.0,
                        direction: isSig ? 'positive' : 'neutral',
                        strength: str,
                        confidence: isSig ? 90 : 70,
                        supportingColumns: t.variables || [],
                        interpretation: `${t.test} indicates ${isSig ? 'statistically significant difference/association' : 'no statistically significant difference'} (p = ${t.pValue}${t.effectSize ? `, ${t.effectSize.measure} = ${t.effectSize.value}` : ''}).`
                    });
                });
            }

            // -----------------------------------------------------------------
            // 4. Evidence from Anomaly Detection
            // -----------------------------------------------------------------
            const anom = analytics?.anomalies || {};
            if (anom.status === 'completed' && Array.isArray(anom.columns)) {
                anom.columns.forEach(ac => {
                    if (ac.anomalyCount > 0) {
                        const pct = Number.isFinite(ac.anomalyPercentage) ? ac.anomalyPercentage : 0;
                        items.push({
                            id: nextId(),
                            source: 'anomaly_detection',
                            type: 'anomaly_rate',
                            metric: 'anomaly_percentage',
                            value: pct,
                            direction: pct > 5.0 ? 'negative' : 'neutral',
                            strength: pct > 5.0 ? 'strong' : 'moderate',
                            confidence: 85,
                            supportingColumns: [ac.column],
                            interpretation: `Detected ${ac.anomalyCount} anomalies (${pct}%) in "${ac.column}" using distribution-adaptive detector (${ac.method}).`
                        });
                    }
                });
            }

            // -----------------------------------------------------------------
            // 5. Evidence from Time-Series Forecasting
            // -----------------------------------------------------------------
            const fc = analytics?.forecasting || {};
            if (fc.status === 'completed' && fc.selectedModel) {
                const mae = fc.metrics ? fc.metrics.mae : 0;
                items.push({
                    id: nextId(),
                    source: 'forecasting',
                    type: 'predictive_forecast',
                    metric: 'validation_mae',
                    value: mae,
                    direction: 'neutral',
                    strength: 'moderate',
                    confidence: 80,
                    supportingColumns: [fc.timeColumn, fc.valueColumn].filter(Boolean),
                    interpretation: `Winning forecast architecture "${fc.selectedModel}" validated using chronological split (MAE = ${mae}).`
                });
            }

            // -----------------------------------------------------------------
            // 6. Evidence from Machine Learning
            // -----------------------------------------------------------------
            const ml = analytics?.machineLearning || {};
            if (ml.status === 'completed' && ml.winner) {
                const w = ml.winner;
                const m = w.metrics || {};
                const isReg = ml.taskType === 'regression';

                const perfMetric = isReg ? 'r2' : 'macroF1';
                const perfVal = isReg ? (Number.isFinite(m.r2) ? m.r2 : 0) : (Number.isFinite(m.macroF1) ? m.macroF1 : (m.accuracy || 0));
                const isHighPerf = isReg ? perfVal >= 0.7 : perfVal >= 0.75;

                items.push({
                    id: nextId(),
                    source: 'machine_learning',
                    type: 'model_benchmark',
                    metric: perfMetric,
                    value: perfVal,
                    direction: isHighPerf ? 'positive' : 'neutral',
                    strength: isHighPerf ? 'strong' : (perfVal >= 0.4 ? 'moderate' : 'weak'),
                    confidence: 85,
                    supportingColumns: [ml.target].filter(Boolean),
                    interpretation: `Best model "${w.name}" for ${ml.taskType} achieved validation ${perfMetric.toUpperCase()} = ${perfVal}.`
                });

                // Feature Importance Evidence
                if (Array.isArray(ml.featureImportance) && ml.featureImportance.length > 0) {
                    const topFeatures = ml.featureImportance.slice(0, 3);
                    topFeatures.forEach(feat => {
                        items.push({
                            id: nextId(),
                            source: 'machine_learning',
                            type: 'feature_importance',
                            metric: 'relative_importance',
                            value: feat.importance,
                            direction: 'positive',
                            strength: feat.importance >= 30 ? 'strong' : 'moderate',
                            confidence: 80,
                            supportingColumns: [feat.feature, ml.target].filter(Boolean),
                            interpretation: `Feature "${feat.feature}" contributes ${feat.importance}% relative predictive importance to "${ml.target}".`
                        });
                    });
                }
            } else if (ml.clustering) {
                items.push({
                    id: nextId(),
                    source: 'machine_learning',
                    type: 'unsupervised_clustering',
                    metric: 'selected_k',
                    value: ml.clustering.selectedK,
                    direction: 'neutral',
                    strength: 'moderate',
                    confidence: 75,
                    supportingColumns: ml.features || [],
                    interpretation: `K-Means clustering partitioned observations into ${ml.clustering.selectedK} distinct clusters (inertia = ${ml.clustering.bestModel?.inertia || 0}).`
                });
            }

            // -----------------------------------------------------------------
            // Cross-Method Corroboration (Promote to Strong if multi-method)
            // -----------------------------------------------------------------
            // Group evidence by supporting column pairs/single columns
            const colMap = {};
            items.forEach(ev => {
                ev.supportingColumns.forEach(col => {
                    if (!colMap[col]) colMap[col] = [];
                    colMap[col].push(ev);
                });
            });

            // If a column has >= 2 distinct sources supporting its predictive utility
            Object.keys(colMap).forEach(col => {
                const colEvs = colMap[col];
                const distinctSources = new Set(colEvs.map(e => e.source));
                if (distinctSources.size >= 2) {
                    colEvs.forEach(e => {
                        if (e.strength === 'moderate') {
                            e.strength = 'strong';
                            e.corroboratedBy = Array.from(distinctSources).filter(s => s !== e.source);
                        }
                    });
                }
            });

            // Summary Counts
            const summary = {
                total: items.length,
                strong: items.filter(e => e.strength === 'strong').length,
                moderate: items.filter(e => e.strength === 'moderate').length,
                weak: items.filter(e => e.strength === 'weak').length,
                insufficient: items.filter(e => e.strength === 'insufficient').length
            };

            return {
                items,
                summary,
                byColumn: colMap
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.EvidenceFusion = EvidenceFusion;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = EvidenceFusion;
    }
})(typeof window !== 'undefined' ? window : global);
