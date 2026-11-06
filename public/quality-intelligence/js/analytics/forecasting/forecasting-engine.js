/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/forecasting/forecasting-engine.js
 * ============================================================================
 * Time-Series Forecasting Engine:
 * - Employs strict chronological validation splits (no future data leakage)
 * - Benchmarks candidate models (Naive, Moving Average, Exp Smoothing, Linear Trend)
 * - Automatically selects the best model based on out-of-sample validation RMSE
 * - Provides explainable model selection reasoning & future forecast points
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ForecastingEngine = {
        /**
         * Run time-series forecasting pipeline
         * 
         * @param {Object} params
         * @param {Object} params.data Active dataset object
         * @param {Object} params.profile Step 2 profiler result
         * @param {Object} params.analysisPlan Step 2.5 intelligence plan
         * @returns {Object} Forecasting result
         */
        run({ data, profile, analysisPlan }) {
            const rows = (data && Array.isArray(data.rows)) ? data.rows : [];
            const result = {
                status: 'completed',
                target: null,
                timeColumn: null,
                horizon: 5,
                models: [],
                selectedModel: null,
                forecasts: [],
                futurePoints: [],
                reasoning: [],
                confidence: 0
            };

            // Detect time column and target numeric column
            let timeCol = null;
            let numTarget = analysisPlan?.primaryTarget?.column;

            const colList = Array.isArray(profile?.columns)
                ? profile.columns
                : (profile?.columns ? Object.entries(profile.columns).map(([k, v]) => ({ name: k, ...v })) : []);

            colList.forEach(p => {
                const col = p.name;
                const type = p.detectedType || (p.type ? p.type.detectedType : 'unknown');
                if (['date', 'datetime', 'time'].includes(type) && !timeCol) {
                    timeCol = col;
                }
            });

            // If no time dimension, check if dataset pattern has timeseries or progression candidate
            if (!timeCol) {
                const seqCand = colList.find(c => /tenure|month|year|period|step|time|age|day|week|quarter|cohort|sequence/i.test(c.name));
                if (seqCand) timeCol = seqCand.name;
            }

            if (!timeCol) {
                result.status = 'skipped';
                result.reason = 'No valid time/date dimension detected in dataset';
                return result;
            }

            // Find valid numeric target
            const targetProf = colList.find(c => c.name === numTarget);
            const targetType = targetProf?.detectedType || (targetProf?.type?.detectedType);

            if (!numTarget || !['integer', 'decimal', 'numeric'].includes(targetType)) {
                // Find first numeric column
                const firstNum = colList.find(c => {
                    const t = c.detectedType || c.type?.detectedType;
                    return ['integer', 'decimal', 'numeric'].includes(t) && c.name !== timeCol;
                });
                if (firstNum) numTarget = firstNum.name;
            }

            if (!numTarget) {
                result.status = 'skipped';
                result.reason = 'No numeric target column available for time-series forecasting';
                return result;
            }

            // Extract sorted chronological pairs
            const pairs = [];
            rows.forEach(r => {
                if (!r) return;
                const rawT = r[timeCol];
                let t = Date.parse(rawT);
                if (isNaN(t) && Number.isFinite(Number(rawT))) {
                    t = Number(rawT);
                }
                const v = Number(r[numTarget]);
                if (Number.isFinite(t) && Number.isFinite(v)) {
                    pairs.push({ t, originalDate: rawT, v });
                }
            });

            if (pairs.length < 6) {
                result.status = 'skipped';
                result.reason = `Insufficient chronological observations (found ${pairs.length}, minimum 6 required for train/validation split)`;
                return result;
            }

            pairs.sort((a, b) => a.t - b.t);

            const Validation = window.UDIP && window.UDIP.Validation;
            const Methods = window.UDIP && window.UDIP.ForecastMethods;
            const RegMetrics = window.UDIP && window.UDIP.RegressionMetrics;

            if (!Validation || !Methods || !RegMetrics) {
                result.status = 'error';
                result.reason = 'Forecasting dependencies not loaded';
                return result;
            }

            // Chronological Split: 80% train, 20% validation
            const split = Validation.chronologicalSplit(pairs, 0.8);
            const trainValues = split.train.map(p => p.v);
            const valValues = split.test.map(p => p.v);
            const valHorizon = valValues.length;

            if (trainValues.length < 3 || valHorizon < 1) {
                result.status = 'skipped';
                result.reason = 'Chronological split yielded insufficient training or validation data';
                return result;
            }

            // Candidate 1: Naive
            const naiveValPred = Methods.naive(trainValues, valHorizon);
            const naiveMetrics = RegMetrics.calculate(valValues, naiveValPred);

            // Candidate 2: Moving Average
            const maValPred = Methods.movingAverage(trainValues, valHorizon);
            const maMetrics = RegMetrics.calculate(valValues, maValPred);

            // Candidate 3: Exponential Smoothing
            const sesRes = Methods.exponentialSmoothing(trainValues, valHorizon);
            const sesMetrics = RegMetrics.calculate(valValues, sesRes.forecasts);

            // Candidate 4: Linear Trend
            const trendRes = Methods.linearTrend(trainValues, valHorizon);
            const trendMetrics = RegMetrics.calculate(valValues, trendRes.forecasts);

            const candidates = [
                { name: 'Naive Benchmark', metrics: naiveMetrics, details: 'Latest observation persistence' },
                { name: 'Moving Average', metrics: maMetrics, details: 'Uniform rolling historical mean' },
                { name: 'Exponential Smoothing', metrics: sesMetrics, details: `SES (alpha = ${sesRes.alpha.toFixed(2)})` },
                { name: 'Linear Trend', metrics: trendMetrics, details: `OLS (slope = ${trendRes.slope.toFixed(2)})` }
            ];

            // Rank candidates by validation RMSE
            candidates.sort((a, b) => a.metrics.rmse - b.metrics.rmse);

            const winner = candidates[0];
            const allValues = pairs.map(p => p.v);
            const forecastHorizon = Math.min(10, Math.max(3, Math.floor(allValues.length * 0.2)));

            // Generate future predictions on full dataset using winning method
            let futurePreds = [];
            if (winner.name === 'Exponential Smoothing') {
                futurePreds = Methods.exponentialSmoothing(allValues, forecastHorizon, sesRes.alpha).forecasts;
            } else if (winner.name === 'Moving Average') {
                futurePreds = Methods.movingAverage(allValues, forecastHorizon);
            } else if (winner.name === 'Linear Trend') {
                futurePreds = Methods.linearTrend(allValues, forecastHorizon).forecasts;
            } else {
                futurePreds = Methods.naive(allValues, forecastHorizon);
            }

            // Estimate future timestamps or sequential steps
            const lastTime = pairs[pairs.length - 1].t;
            const prevTime = pairs[pairs.length - 2].t;
            const isEpoch = lastTime > 100000000;
            const approxInterval = isEpoch ? Math.max(86400000, lastTime - prevTime) : Math.max(1, lastTime - prevTime);

            const futurePoints = futurePreds.map((val, idx) => {
                let timeStr = `+${idx + 1} step`;
                if (isEpoch) {
                    const futureDate = new Date(lastTime + approxInterval * (idx + 1));
                    timeStr = futureDate.toISOString().split('T')[0];
                } else {
                    timeStr = `${Math.round(lastTime + approxInterval * (idx + 1))}`;
                }
                return {
                    step: idx + 1,
                    timestamp: timeStr,
                    predictedValue: val
                };
            });

            result.target = numTarget;
            result.timeColumn = timeCol;
            result.horizon = forecastHorizon;
            result.models = candidates.map(c => ({
                name: c.name,
                rmse: c.metrics.rmse,
                mae: c.metrics.mae,
                mape: c.metrics.mape,
                details: c.details
            }));
            result.selectedModel = winner.name;
            result.forecasts = futurePreds;
            result.futurePoints = futurePoints;
            result.reasoning = [
                `Model "${winner.name}" selected based on lowest out-of-sample validation RMSE (${winner.metrics.rmse.toFixed(2)}) on chronological test set (${valHorizon} observations).`,
                `Chronological split strictly prevented future data leakage during evaluation.`,
                `Out-of-sample validation MAE: ${winner.metrics.mae.toFixed(2)}, MAPE: ${winner.metrics.mape.toFixed(1)}%.`
            ];
            result.confidence = Math.min(92, Math.max(50, Math.round(85 - winner.metrics.mape * 0.3)));

            return result;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.ForecastingEngine = ForecastingEngine;

})(typeof window !== 'undefined' ? window : global);
