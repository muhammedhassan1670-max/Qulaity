/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/analytics-engine.js
 * ============================================================================
 * Master Orchestrator for Advanced Analytics & Machine Learning Engine (Step 3):
 * 1. Validates inputs and constructs evidence-based execution plan from Step 2.5 Analysis Plan.
 * 2. Coordinates EDA, Statistical Hypothesis Testing, Anomaly Detection, Forecasting, and ML.
 * 3. Evaluates models on validation splits and ranks candidate architectures.
 * 4. Synthesizes explainable insights and prioritized recommendations.
 * 5. Guarantees 100% domain-agnosticity, raw data immutability, and zero unhandled errors.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const AnalyticsEngine = {
        version: '1.0.0-universal',

        /**
         * Run the complete Advanced Analytics and Machine Learning pipeline
         * 
         * @param {Object} params
         * @param {Object} params.data Active dataset object ({ columns, rows, filename, ... })
         * @param {Object} params.profile Step 2 profiler result
         * @param {Object} params.analysisPlan Step 2.5 intelligence plan
         * @returns {Object} Unified Analytics & ML Result
         */
        run({ data, profile, analysisPlan }) {
            const startTime = Date.now();
            const rows = (data && Array.isArray(data.rows)) ? data.rows : [];
            const cols = (data && Array.isArray(data.columns)) ? data.columns : [];

            // Handle empty dataset safely
            if (rows.length === 0 || cols.length === 0) {
                return {
                    version: this.version,
                    status: 'completed',
                    executionPlan: {
                        exploratory: { enabled: false, reason: 'Empty dataset' },
                        statistics: { enabled: false, reason: 'Empty dataset' },
                        anomalyDetection: { enabled: false, reason: 'Empty dataset' },
                        forecasting: { enabled: false, reason: 'Empty dataset' },
                        machineLearning: { enabled: false, reason: 'Empty dataset' },
                        tasks: []
                    },
                    exploratory: { status: 'skipped', reason: 'Empty dataset', distributions: [], relationships: [], groups: [], trends: [], seasonality: [], outliers: [] },
                    statistics: { status: 'skipped', reason: 'Empty dataset', tests: [] },
                    anomalies: { status: 'skipped', reason: 'Empty dataset', columns: [], totalAnomalies: 0, datasetAnomalyPercentage: 0 },
                    forecasting: { status: 'skipped', reason: 'Empty dataset', models: [], forecasts: [], futurePoints: [] },
                    machineLearning: { status: 'skipped', reason: 'Empty dataset', winner: null, leaderboard: [], featureImportance: [] },
                    evaluation: {},
                    insights: [],
                    recommendations: [],
                    warnings: ['Empty dataset provided; advanced analytics cannot execute'],
                    limitations: ['No observations available for empirical modeling'],
                    confidence: { score: 0, level: 'very_low' },
                    runtimeMs: Date.now() - startTime
                };
            }

            // 1. Build Internal Execution Plan based on Step 2.5 Analysis Plan
            const executionPlan = this._buildExecutionPlan({ data, profile, analysisPlan });

            // 2. Run Exploratory Data Analysis (EDA)
            let exploratory = { status: 'skipped', distributions: [], relationships: [], groups: [], trends: [], seasonality: [], outliers: [] };
            if (executionPlan.exploratory.enabled && window.UDIP?.ExploratoryEngine) {
                try {
                    exploratory = window.UDIP.ExploratoryEngine.run({ data, profile, analysisPlan });
                } catch (edaErr) {
                    console.warn('[UDIP:AnalyticsEngine] EDA Error:', edaErr);
                    exploratory = { status: 'error', reason: edaErr.message, distributions: [], relationships: [], groups: [], trends: [], seasonality: [], outliers: [] };
                }
            }

            // 3. Run Statistical Hypothesis Testing
            let statistics = { status: 'skipped', tests: [] };
            if (executionPlan.statistics.enabled && window.UDIP?.StatisticalEngine) {
                try {
                    statistics = window.UDIP.StatisticalEngine.run({ data, profile, analysisPlan });
                } catch (statErr) {
                    console.warn('[UDIP:AnalyticsEngine] Statistics Error:', statErr);
                    statistics = { status: 'error', reason: statErr.message, tests: [] };
                }
            }

            // 4. Run Anomaly Detection
            let anomalies = { status: 'skipped', columns: [], totalAnomalies: 0, datasetAnomalyPercentage: 0 };
            if (executionPlan.anomalyDetection.enabled && window.UDIP?.AnomalyEngine) {
                try {
                    anomalies = window.UDIP.AnomalyEngine.run({ data, profile, analysisPlan });
                } catch (anomErr) {
                    console.warn('[UDIP:AnalyticsEngine] Anomaly Error:', anomErr);
                    anomalies = { status: 'error', reason: anomErr.message, columns: [], totalAnomalies: 0, datasetAnomalyPercentage: 0 };
                }
            }

            // 5. Run Time-Series Forecasting
            let forecasting = { status: 'skipped', models: [], forecasts: [], futurePoints: [] };
            if (executionPlan.forecasting.enabled && window.UDIP?.ForecastingEngine) {
                try {
                    forecasting = window.UDIP.ForecastingEngine.run({ data, profile, analysisPlan });
                } catch (fcErr) {
                    console.warn('[UDIP:AnalyticsEngine] Forecasting Error:', fcErr);
                    forecasting = { status: 'error', reason: fcErr.message, models: [], forecasts: [], futurePoints: [] };
                }
            }

            // 6. Run Machine Learning Engine
            let machineLearning = { status: 'skipped', winner: null, leaderboard: [], featureImportance: [] };
            if (executionPlan.machineLearning.enabled && window.UDIP?.MLEngine) {
                try {
                    machineLearning = window.UDIP.MLEngine.run({ data, profile, analysisPlan });
                } catch (mlErr) {
                    console.warn('[UDIP:AnalyticsEngine] ML Error:', mlErr);
                    machineLearning = { status: 'error', reason: mlErr.message, winner: null, leaderboard: [], featureImportance: [] };
                }
            }

            // 7. Synthesize Insights & Recommendations
            let insights = [];
            if (window.UDIP?.InsightEngine) {
                try {
                    insights = window.UDIP.InsightEngine.synthesize({
                        exploratory,
                        statistics,
                        anomalies,
                        forecasting,
                        machineLearning,
                        analysisPlan
                    });
                } catch (insErr) {
                    console.warn('[UDIP:AnalyticsEngine] Insight Synthesis Error:', insErr);
                }
            }

            let recommendations = [];
            if (window.UDIP?.RecommendationGenerator) {
                try {
                    recommendations = window.UDIP.RecommendationGenerator.generate({
                        exploratory,
                        statistics,
                        anomalies,
                        forecasting,
                        machineLearning,
                        analysisPlan,
                        profile
                    });
                } catch (recErr) {
                    console.warn('[UDIP:AnalyticsEngine] Recommendation Generator Error:', recErr);
                }
            }

            // 8. Aggregate Warnings & Limitations
            const warnings = [];
            const limitations = [];

            if (analysisPlan?.leakage?.riskLevel === 'high') {
                warnings.push('High data leakage risk identified in features; leakage columns were isolated from modeling');
            }
            if (rows.length < 30) {
                limitations.push(`Sample size (n = ${rows.length}) is modest; statistical estimates have broader confidence bounds`);
            }
            if (machineLearning?.limitations?.length) {
                limitations.push(...machineLearning.limitations);
            }

            // 9. Compute Overall Analytics Confidence
            let confScore = 80;
            if (machineLearning?.status === 'completed' && machineLearning.confidence) {
                confScore = Math.round((confScore + machineLearning.confidence) / 2);
            } else if (forecasting?.status === 'completed' && forecasting.confidence) {
                confScore = Math.round((confScore + forecasting.confidence) / 2);
            }
            if (rows.length < 20) confScore -= 10;
            if (analysisPlan?.confidence?.score) {
                confScore = Math.round((confScore * 0.7) + (analysisPlan.confidence.score * 0.3));
            }
            confScore = Math.max(20, Math.min(98, confScore));

            let confLevel = 'moderate';
            if (confScore >= 85) confLevel = 'very_high';
            else if (confScore >= 70) confLevel = 'high';
            else if (confScore >= 50) confLevel = 'moderate';
            else if (confScore >= 35) confLevel = 'low';
            else confLevel = 'very_low';

            const result = {
                version: this.version,
                status: 'completed',
                executionPlan,
                exploratory,
                statistics,
                anomalies,
                forecasting,
                machineLearning,
                evaluation: machineLearning?.winner?.metrics || {},
                insights,
                recommendations,
                warnings,
                limitations: Array.from(new Set(limitations)),
                confidence: {
                    score: confScore,
                    level: confLevel
                },
                runtimeMs: Date.now() - startTime
            };

            console.info(`[UDIP:AnalyticsEngine] Analytics & ML pipeline completed in ${result.runtimeMs}ms (Confidence: ${confScore}% [${confLevel}])`);
            return result;
        },

        /**
         * Build internal execution plan
         * @private
         */
        _buildExecutionPlan({ data, profile, analysisPlan }) {
            const rows = data?.rows || [];
            const planTasks = analysisPlan?.recommendedTasks || [];
            const hasTask = taskName => planTasks.some(t => t.task === taskName && t.suitabilityScore >= 50);
            const isTimeSeries = analysisPlan?.datasetType?.type === 'time_series' || analysisPlan?.datasetType === 'time_series' || hasTask('time_series_analysis') || hasTask('forecasting');
            const hasTarget = !!analysisPlan?.primaryTarget?.column;
            const hasNumeric = (profile?.structure?.numeric > 0) || (profile?.structure?.numericColumnCount > 0) || (Array.isArray(profile?.columns) && profile.columns.some(c => ['integer', 'decimal', 'numeric'].includes(c.detectedType)));

            const plan = {
                exploratory: {
                    enabled: rows.length >= 2,
                    priority: 'high',
                    confidence: 95,
                    reasoning: ['Sufficient records available for exploratory distributions and pairwise correlations']
                },
                statistics: {
                    enabled: rows.length >= 4,
                    priority: rows.length >= 20 ? 'high' : 'medium',
                    confidence: rows.length >= 20 ? 90 : 75,
                    reasoning: [rows.length >= 4 ? `Inferential testing justified (n = ${rows.length})` : 'Sample size too small']
                },
                anomalyDetection: {
                    enabled: rows.length >= 5 && hasNumeric,
                    priority: 'medium',
                    confidence: 85,
                    reasoning: [hasNumeric ? 'Continuous numeric features available for multi-method anomaly scoring' : 'No numeric features']
                },
                forecasting: {
                    enabled: isTimeSeries && hasNumeric && rows.length >= 6,
                    priority: isTimeSeries ? 'high' : 'low',
                    confidence: isTimeSeries ? 88 : 30,
                    reasoning: isTimeSeries
                        ? ['Chronological time dimension and numeric series detected']
                        : ['No valid time series structure detected']
                },
                machineLearning: {
                    enabled: hasTarget && rows.length >= 6,
                    priority: hasTarget ? 'high' : 'low',
                    confidence: hasTarget ? 88 : 40,
                    reasoning: hasTarget
                        ? [`Primary target "${analysisPlan.primaryTarget.column}" identified for predictive modeling`]
                        : ['No primary supervised target; clustering will be evaluated as fallback']
                },
                tasks: planTasks.filter(t => t.suitabilityScore >= 60).map(t => t.task)
            };

            return plan;
        },

        /**
         * Asynchronously run the complete Advanced Analytics & ML pipeline,
         * yielding between computationally heavy sub-tasks to keep the UI at 60 FPS.
         */
        async runAsync({ data, profile, analysisPlan }, onProgress = null) {
            const startTime = Date.now();
            const rows = (data && Array.isArray(data.rows)) ? data.rows : [];
            const cols = (data && Array.isArray(data.columns)) ? data.columns : [];

            if (rows.length === 0 || cols.length === 0) {
                return this.run({ data, profile, analysisPlan });
            }

            // 1. Build Internal Execution Plan
            const executionPlan = this._buildExecutionPlan({ data, profile, analysisPlan });
            if (onProgress) onProgress({ stage: 4, percent: 88, stageName: 'Stage 4/5: Scheduling exploratory & statistical analytics...', log: 'ANALYTICS_PLAN: Sub-modules scheduled' });
            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 10));

            // 2. Run Exploratory Data Analysis (EDA)
            let exploratory = { status: 'skipped', distributions: [], relationships: [], groups: [], trends: [], seasonality: [], outliers: [] };
            if (executionPlan.exploratory.enabled && window.UDIP?.ExploratoryEngine) {
                try {
                    if (onProgress) onProgress({ stage: 4, percent: 89, stageName: 'Stage 4/5: Evaluating bivariate distributions & EDA...', log: 'EDA_ENGINE: Computing cross-correlations...' });
                    exploratory = window.UDIP.ExploratoryEngine.run({ data, profile, analysisPlan });
                } catch (edaErr) {
                    console.warn('[UDIP:AnalyticsEngine] EDA Error:', edaErr);
                    exploratory = { status: 'error', reason: edaErr.message, distributions: [], relationships: [], groups: [], trends: [], seasonality: [], outliers: [] };
                }
            }
            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 10));

            // 3. Run Statistical Hypothesis Testing
            let statistics = { status: 'skipped', tests: [] };
            if (executionPlan.statistics.enabled && window.UDIP?.StatisticalEngine) {
                try {
                    if (onProgress) onProgress({ stage: 4, percent: 90, stageName: 'Stage 4/5: Computing statistical hypotheses (T-Test, ANOVA)...', log: 'STAT_ENGINE: Inferring p-values & F-stats...' });
                    statistics = window.UDIP.StatisticalEngine.run({ data, profile, analysisPlan });
                } catch (statErr) {
                    console.warn('[UDIP:AnalyticsEngine] Statistics Error:', statErr);
                    statistics = { status: 'error', reason: statErr.message, tests: [] };
                }
            }
            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 10));

            // 4. Run Anomaly Detection
            let anomalies = { status: 'skipped', columns: [], totalAnomalies: 0, datasetAnomalyPercentage: 0 };
            if (executionPlan.anomalyDetection.enabled && window.UDIP?.AnomalyEngine) {
                try {
                    if (onProgress) onProgress({ stage: 4, percent: 91, stageName: 'Stage 4/5: Multivariate anomaly detection & IQR scoring...', log: 'ANOMALY_ENGINE: Isolation forest & IQR scoring...' });
                    anomalies = window.UDIP.AnomalyEngine.run({ data, profile, analysisPlan });
                } catch (anomErr) {
                    console.warn('[UDIP:AnalyticsEngine] Anomaly Error:', anomErr);
                    anomalies = { status: 'error', reason: anomErr.message, columns: [], totalAnomalies: 0, datasetAnomalyPercentage: 0 };
                }
            }
            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 10));

            // 5. Run Time-Series Forecasting
            let forecasting = { status: 'skipped', models: [], forecasts: [], futurePoints: [] };
            if (executionPlan.forecasting.enabled && window.UDIP?.ForecastingEngine) {
                try {
                    if (onProgress) onProgress({ stage: 4, percent: 92, stageName: 'Stage 4/5: Generating time-series forecasting & trends...', log: 'FORECAST_ENGINE: ARIMA / Exponential smoothing...' });
                    forecasting = window.UDIP.ForecastingEngine.run({ data, profile, analysisPlan });
                } catch (fcErr) {
                    console.warn('[UDIP:AnalyticsEngine] Forecasting Error:', fcErr);
                    forecasting = { status: 'error', reason: fcErr.message, models: [], forecasts: [], futurePoints: [] };
                }
            }
            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 10));

            // 6. Run Machine Learning Engine
            let machineLearning = { status: 'skipped', winner: null, leaderboard: [], featureImportance: [] };
            if (executionPlan.machineLearning.enabled && window.UDIP?.MLEngine) {
                try {
                    if (onProgress) onProgress({ stage: 4, percent: 93, stageName: 'Stage 4/5: Training ML estimators & ranking best model...', log: 'ML_ENGINE: Training candidate estimators...' });
                    machineLearning = window.UDIP.MLEngine.run({ data, profile, analysisPlan });
                } catch (mlErr) {
                    console.warn('[UDIP:AnalyticsEngine] ML Error:', mlErr);
                    machineLearning = { status: 'error', reason: mlErr.message, winner: null, leaderboard: [], featureImportance: [] };
                }
            }
            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 10));

            // 7. Synthesize Insights & Recommendations
            let insights = [];
            if (window.UDIP?.InsightEngine) {
                try {
                    insights = window.UDIP.InsightEngine.synthesize({
                        exploratory,
                        statistics,
                        anomalies,
                        forecasting,
                        machineLearning,
                        analysisPlan
                    });
                } catch (insErr) {
                    console.warn('[UDIP:AnalyticsEngine] Insight Synthesis Error:', insErr);
                }
            }

            let recommendations = [];
            if (window.UDIP?.RecommendationGenerator) {
                try {
                    recommendations = window.UDIP.RecommendationGenerator.generate({
                        exploratory,
                        statistics,
                        anomalies,
                        forecasting,
                        machineLearning,
                        analysisPlan,
                        profile
                    });
                } catch (recErr) {
                    console.warn('[UDIP:AnalyticsEngine] Recommendation Generator Error:', recErr);
                }
            }

            // 8. Aggregate Warnings & Limitations
            const warnings = [];
            const limitations = [];

            if (analysisPlan?.leakage?.riskLevel === 'high') {
                warnings.push('High data leakage risk identified in features; leakage columns were isolated from modeling');
            }
            if (rows.length < 30) {
                limitations.push(`Sample size (n = ${rows.length}) is modest; statistical estimates have broader confidence bounds`);
            }
            if (machineLearning?.limitations?.length) {
                limitations.push(...machineLearning.limitations);
            }

            // 9. Compute Overall Analytics Confidence
            let confScore = 80;
            if (machineLearning?.status === 'completed' && machineLearning.confidence) {
                confScore = Math.round((confScore + machineLearning.confidence) / 2);
            } else if (forecasting?.status === 'completed' && forecasting.confidence) {
                confScore = Math.round((confScore + forecasting.confidence) / 2);
            }
            if (rows.length < 20) confScore -= 10;
            if (analysisPlan?.confidence?.score) {
                confScore = Math.round((confScore * 0.7) + (analysisPlan.confidence.score * 0.3));
            }
            confScore = Math.max(20, Math.min(98, confScore));

            let confLevel = 'moderate';
            if (confScore >= 85) confLevel = 'very_high';
            else if (confScore >= 70) confLevel = 'high';
            else if (confScore >= 50) confLevel = 'moderate';
            else if (confScore >= 35) confLevel = 'low';
            else confLevel = 'very_low';

            const result = {
                version: this.version,
                status: 'completed',
                executionPlan,
                exploratory,
                statistics,
                anomalies,
                forecasting,
                machineLearning,
                evaluation: machineLearning?.winner?.metrics || {},
                insights,
                recommendations,
                warnings,
                limitations: Array.from(new Set(limitations)),
                confidence: {
                    score: confScore,
                    level: confLevel
                },
                runtimeMs: Date.now() - startTime
            };

            console.info(`[UDIP:AnalyticsEngine] Async Analytics & ML pipeline completed in ${result.runtimeMs}ms (Confidence: ${confScore}% [${confLevel}])`);
            return result;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.AnalyticsEngine = AnalyticsEngine;

})(typeof window !== 'undefined' ? window : global);
