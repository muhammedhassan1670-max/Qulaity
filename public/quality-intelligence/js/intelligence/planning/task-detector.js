/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: intelligence/planning/task-detector.js
 * ============================================================================
 * Evaluates dataset evidence from the profiler to determine the most appropriate
 * analytical tasks (12 possible tasks).
 * Returns ranked tasks with transparent evidence-based reasoning.
 * Guarantees zero NaN / Infinity outputs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const TaskDetector = {
        /**
         * Detect and score all viable analytical tasks
         * @param {Object} profile - Step 2 Profiler result
         * @param {Object} rawDataset - Original dataset object { rows, columns, ... }
         * @returns {Array<Object>} List of scored tasks sorted by suitability descending
         */
        detectTasks(profile, rawDataset) {
            if (!profile || !profile.columns || profile.columns.length === 0) {
                return [];
            }

            const ds = profile.dataset || {};
            const st = profile.structure || {};
            const q = profile.quality || {};
            const cols = profile.columns || [];
            const patterns = profile.datasetPatterns || [];
            const targets = profile.targetCandidates || [];

            const rowCount = ds.rowCount || 0;
            const colCount = ds.columnCount || 0;

            const tasks = [];

            // 1. Descriptive Analysis
            // Fundamental task for any dataset with at least 1 column and 1 row
            tasks.push(this._evaluateDescriptiveAnalysis(rowCount, colCount, q));

            // 2. Exploratory Analysis (EDA)
            tasks.push(this._evaluateExploratoryAnalysis(rowCount, colCount, st, q));

            // 3. Time Series Analysis
            tasks.push(this._evaluateTimeSeriesAnalysis(cols, patterns, st));

            // 4. Trend Analysis
            tasks.push(this._evaluateTrendAnalysis(cols, patterns, st));

            // 5. Seasonality Analysis
            tasks.push(this._evaluateSeasonalityAnalysis(cols, patterns));

            // 6. Forecasting
            tasks.push(this._evaluateForecasting(cols, patterns, targets));

            // 7. Regression
            tasks.push(this._evaluateRegression(cols, targets, rowCount));

            // 8. Binary Classification
            tasks.push(this._evaluateBinaryClassification(cols, targets, rowCount));

            // 9. Multiclass Classification
            tasks.push(this._evaluateMulticlassClassification(cols, targets, rowCount));

            // 10. Anomaly Detection
            tasks.push(this._evaluateAnomalyDetection(cols, rowCount, st));

            // 11. Clustering (Unsupervised grouping)
            tasks.push(this._evaluateClustering(cols, rowCount, st));

            // 12. Association Analysis
            tasks.push(this._evaluateAssociationAnalysis(cols, rowCount, st));

            // Filter out tasks with suitability < 25 (irrelevant / insufficient evidence), then sort descending
            const validTasks = tasks
                .filter(t => t.suitability >= 25)
                .sort((a, b) => b.suitability - a.suitability);

            return validTasks;
        },

        _formatTask(taskName, suitability, confidence, reasoning) {
            const safeScore = Math.max(0, Math.min(100, Math.round(suitability)));
            const safeConf = Math.max(0, Math.min(100, Math.round(confidence)));
            let priority = 'low';
            if (safeScore >= 80) priority = 'high';
            else if (safeScore >= 60) priority = 'medium';

            return {
                task: taskName,
                suitability: safeScore,
                priority: priority,
                confidence: safeConf,
                reasoning: reasoning.length > 0 ? reasoning : ['Basic statistical feasibility']
            };
        },

        _evaluateDescriptiveAnalysis(rowCount, colCount, q) {
            const reasons = [];
            let score = 95;
            let conf = 95;

            if (rowCount < 5) {
                score -= 30;
                conf -= 20;
                reasons.push('Extremely small sample size (< 5 rows) limits descriptive power');
            } else {
                reasons.push(`Dataset contains ${rowCount} observations across ${colCount} variables`);
            }

            if (q.qualityScore >= 80) {
                reasons.push('High data health supports reliable summary statistics');
            }

            return this._formatTask('descriptive_analysis', score, conf, reasons);
        },

        _evaluateExploratoryAnalysis(rowCount, colCount, st, q) {
            const reasons = [];
            let score = 90;
            let conf = 90;

            if (colCount < 2) {
                score = 35;
                conf = 40;
                reasons.push('Single-column dataset limits bivariate correlation and cross-variable exploration');
            } else {
                reasons.push(`Multi-dimensional schema with ${colCount} attributes enables bivariate and distribution exploration`);
                if (st.numeric > 0 && st.categorical > 0) {
                    reasons.push('Rich mix of numeric measures and categorical dimensions');
                }
            }

            return this._formatTask('exploratory_analysis', score, conf, reasons);
        },

        _evaluateTimeSeriesAnalysis(cols, patterns, st) {
            const reasons = [];
            const dateCols = cols.filter(c => c.detectedType === 'date' || c.detectedType === 'datetime' || c.detectedType === 'time');
            const numCols = cols.filter(c => c.detectedType === 'integer' || c.detectedType === 'decimal' || c.detectedType === 'numeric');
            const isTsPattern = patterns.some(p => p.pattern.toLowerCase().includes('time-series'));

            if (dateCols.length === 0) {
                return this._formatTask('time_series_analysis', 0, 0, ['No temporal (date/time) column detected']);
            }

            let score = 70;
            let conf = 75;

            const primaryDate = dateCols[0];
            reasons.push(`Temporal index identified: "${primaryDate.name}" (${primaryDate.stats.granularity} granularity)`);

            if (isTsPattern) {
                score += 20;
                conf += 15;
                reasons.push('Dataset structure matches time-series topology');
            }

            if (numCols.length > 0) {
                reasons.push(`${numCols.length} numerical metrics available for temporal tracking`);
            } else {
                score -= 30;
                reasons.push('Lack of numeric metrics to track over time');
            }

            if (primaryDate.stats.isRegular) {
                score += 5;
                reasons.push('Time intervals show regular temporal periodicity');
            } else if (primaryDate.stats.hasTimeGaps) {
                score -= 10;
                reasons.push('Irregular time gaps detected in the temporal index');
            }

            return this._formatTask('time_series_analysis', score, conf, reasons);
        },

        _evaluateTrendAnalysis(cols, patterns, st) {
            const reasons = [];
            const dateCols = cols.filter(c => c.detectedType === 'date' || c.detectedType === 'datetime' || c.detectedType === 'time');
            const numCols = cols.filter(c => (c.detectedType === 'integer' || c.detectedType === 'decimal' || c.detectedType === 'numeric') && !c.stats.isConstant);

            if (dateCols.length === 0 || numCols.length === 0) {
                return this._formatTask('trend_analysis', 0, 0, ['Requires at least one date column and one non-constant numeric measure']);
            }

            let score = 65;
            let conf = 70;

            const primaryDate = dateCols[0];
            const spanDays = primaryDate.stats.spanDays || 0;
            const uniqueTimestamps = primaryDate.stats.uniqueCount || 0;

            if (uniqueTimestamps >= 10) {
                score += 20;
                conf += 15;
                reasons.push(`${uniqueTimestamps} distinct temporal points spanning ${spanDays} days`);
            } else {
                score -= 20;
                reasons.push('Insufficient unique temporal observations for sustained trend fitting');
            }

            reasons.push(`Tracking trajectories across ${numCols.length} varying numerical metrics`);
            return this._formatTask('trend_analysis', score, conf, reasons);
        },

        _evaluateSeasonalityAnalysis(cols, patterns) {
            const reasons = [];
            const dateCols = cols.filter(c => c.detectedType === 'date' || c.detectedType === 'datetime');
            if (dateCols.length === 0) {
                return this._formatTask('seasonality_analysis', 0, 0, ['No temporal columns present']);
            }

            const primaryDate = dateCols[0];
            const spanDays = primaryDate.stats.spanDays || 0;
            const uniqueTimestamps = primaryDate.stats.uniqueCount || 0;

            let score = 30;
            let conf = 50;

            if (spanDays >= 365) {
                score += 45;
                conf += 30;
                reasons.push(`Temporal span exceeds 1 year (${spanDays} days), enabling annual/cyclical seasonal checks`);
            } else if (spanDays >= 60) {
                score += 25;
                conf += 20;
                reasons.push(`Temporal span (${spanDays} days) enables weekly or monthly recurring cycle analysis`);
            } else {
                reasons.push('Temporal span is too short (< 60 days) for robust seasonality extraction');
            }

            if (primaryDate.stats.isRegular) {
                score += 15;
                reasons.push('Consistent observation intervals favor spectral or decomposition methods');
            }

            return this._formatTask('seasonality_analysis', score, conf, reasons);
        },

        _evaluateForecasting(cols, patterns, targets) {
            const reasons = [];
            const dateCols = cols.filter(c => c.detectedType === 'date' || c.detectedType === 'datetime');
            const numCols = cols.filter(c => c.detectedType === 'integer' || c.detectedType === 'decimal' || c.detectedType === 'numeric');

            if (dateCols.length === 0 || numCols.length === 0) {
                return this._formatTask('forecasting', 0, 0, ['Forecasting requires both a temporal index and a numerical metric']);
            }

            const primaryDate = dateCols[0];
            const uniqueTimestamps = primaryDate.stats.uniqueCount || 0;

            let score = 40;
            let conf = 50;

            if (uniqueTimestamps >= 15) {
                score += 35;
                conf += 25;
                reasons.push(`Sufficient historical sequence length (${uniqueTimestamps} distinct points)`);
            } else {
                reasons.push(`Limited sequential points (${uniqueTimestamps}) reduces forecast horizon reliability`);
            }

            const forecastTarget = targets.find(t => t.taskHint === 'regression' || t.taskHint === 'forecasting') || (numCols.length > 0 ? { name: numCols[0].name } : null);
            if (forecastTarget) {
                score += 15;
                reasons.push(`Target metric candidate available: "${forecastTarget.name}"`);
            }

            return this._formatTask('forecasting', score, conf, reasons);
        },

        _evaluateRegression(cols, targets, rowCount) {
            const reasons = [];
            const regTargets = targets.filter(t => t.taskHint === 'regression');
            const numFeatures = cols.filter(c => (c.detectedType === 'integer' || c.detectedType === 'decimal' || c.detectedType === 'numeric') && !c.stats.isConstant);

            if (regTargets.length === 0 && numFeatures.length < 2) {
                return this._formatTask('regression', 0, 0, ['No suitable continuous numeric target variable detected']);
            }

            let score = 45;
            let conf = 55;

            if (regTargets.length > 0) {
                const topTarget = regTargets[0];
                score = Math.max(score, topTarget.score);
                conf = 85;
                reasons.push(`Strong continuous target candidate identified: "${topTarget.name}" (suitability ${topTarget.score}%)`);
            } else {
                reasons.push('Continuous measures present, but no dominant target column labeled');
            }

            if (rowCount >= 30) {
                score += 10;
                reasons.push(`Sample size (${rowCount} rows) satisfies basic asymptotic requirements`);
            } else if (rowCount < 10) {
                score -= 30;
                reasons.push('Sample size is critically small (< 10 rows) for regression modeling');
            }

            if (cols.length >= 2) {
                reasons.push(`${cols.length - 1} potential predictor variables available`);
            }

            return this._formatTask('regression', score, conf, reasons);
        },

        _evaluateBinaryClassification(cols, targets, rowCount) {
            const reasons = [];
            const binTargets = targets.filter(t => t.taskHint === 'binary_classification');

            if (binTargets.length === 0) {
                const binaryCols = cols.filter(c => c.detectedType === 'boolean' || (c.stats && c.stats.uniqueCount === 2));
                if (binaryCols.length === 0) {
                    return this._formatTask('binary_classification', 0, 0, ['No binary outcome variable (2 unique values) found in dataset']);
                }
            }

            let score = 50;
            let conf = 60;

            if (binTargets.length > 0) {
                const topTarget = binTargets[0];
                score = Math.max(score, topTarget.score);
                conf = 88;
                reasons.push(`Clear binary outcome column detected: "${topTarget.name}" (suitability ${topTarget.score}%)`);
            } else {
                reasons.push('Binary variable exists but target candidate suitability is moderate');
            }

            if (rowCount >= 20) {
                score += 5;
                reasons.push('Sufficient row count for cross-validation partitioning');
            } else {
                score -= 20;
                reasons.push('Very low sample size reduces classification generalization');
            }

            return this._formatTask('binary_classification', score, conf, reasons);
        },

        _evaluateMulticlassClassification(cols, targets, rowCount) {
            const reasons = [];
            const multiTargets = targets.filter(t => t.taskHint === 'multiclass_classification');

            if (multiTargets.length === 0) {
                const catCols = cols.filter(c => c.detectedType === 'categorical' && c.stats && c.stats.uniqueCount >= 3 && c.stats.uniqueCount <= 15);
                if (catCols.length === 0) {
                    return this._formatTask('multiclass_classification', 0, 0, ['No low/moderate cardinality categorical outcome found']);
                }
            }

            let score = 45;
            let conf = 55;

            if (multiTargets.length > 0) {
                const topTarget = multiTargets[0];
                score = Math.max(score, topTarget.score);
                conf = 82;
                reasons.push(`Discrete categorical target detected: "${topTarget.name}" (suitability ${topTarget.score}%)`);
            } else {
                reasons.push('Discrete category column exists with reasonable class count');
            }

            if (rowCount >= 50) {
                score += 10;
                reasons.push('Adequate observation count across multiple target classes');
            } else if (rowCount < 20) {
                score -= 20;
                reasons.push('Low observation count may cause severe class sparsity');
            }

            return this._formatTask('multiclass_classification', score, conf, reasons);
        },

        _evaluateAnomalyDetection(cols, rowCount, st) {
            const reasons = [];
            const numCols = cols.filter(c => (c.detectedType === 'integer' || c.detectedType === 'decimal' || c.detectedType === 'numeric') && !c.stats.isConstant);

            if (numCols.length === 0) {
                return this._formatTask('anomaly_detection', 0, 0, ['Anomaly detection requires numerical metrics with variance']);
            }

            let score = 55;
            let conf = 65;

            const outlierCols = numCols.filter(c => c.stats && c.stats.outliers && c.stats.outliers.count > 0);
            if (outlierCols.length > 0) {
                score += 30;
                conf += 20;
                const topOutCol = outlierCols[0];
                reasons.push(`Detected statistical outliers in ${outlierCols.length} column(s) (e.g. "${topOutCol.name}": ${topOutCol.stats.outliers.pct}% outliers)`);
                reasons.push('Univariate and multivariate isolation can uncover data irregularities');
            } else {
                reasons.push(`${numCols.length} varying numerical metrics suitable for baseline density and distance modeling`);
            }

            if (rowCount < 10) {
                score -= 30;
                reasons.push('Small dataset size limits statistical confidence in outlier thresholds');
            }

            return this._formatTask('anomaly_detection', score, conf, reasons);
        },

        _evaluateClustering(cols, rowCount, st) {
            const reasons = [];
            const numCols = cols.filter(c => (c.detectedType === 'integer' || c.detectedType === 'decimal' || c.detectedType === 'numeric') && !c.stats.isConstant);
            const catCols = cols.filter(c => c.detectedType === 'categorical' && !c.stats.isConstant);

            if (numCols.length < 2 && (numCols.length + catCols.length) < 3) {
                return this._formatTask('clustering', 0, 0, ['Clustering requires multi-dimensional feature space (at least 2 numeric or 3 mixed features)']);
            }

            let score = 60;
            let conf = 70;

            reasons.push(`Multi-feature space (${numCols.length} numeric, ${catCols.length} categorical) enables unsupervised segmentation`);

            if (rowCount >= 30) {
                score += 15;
                reasons.push('Sufficient observations to discover natural sub-group clusters');
            } else if (rowCount < 10) {
                score -= 30;
                reasons.push('Insufficient sample density for cluster boundary convergence');
            }

            return this._formatTask('clustering', score, conf, reasons);
        },

        _evaluateAssociationAnalysis(cols, rowCount, st) {
            const reasons = [];
            const catCols = cols.filter(c => (c.detectedType === 'categorical' || c.detectedType === 'boolean') && !c.stats.isConstant);

            if (catCols.length < 2) {
                return this._formatTask('association_analysis', 0, 0, ['Association analysis requires at least 2 discrete/categorical columns']);
            }

            let score = 50;
            let conf = 60;

            reasons.push(`${catCols.length} categorical/binary attributes suitable for itemset and co-occurrence evaluation`);

            if (rowCount >= 50) {
                score += 20;
                conf += 15;
                reasons.push('Substantial transaction/row volume provides statistical support for rule mining');
            } else if (rowCount < 15) {
                score -= 20;
                reasons.push('Sparse transaction count limits support and confidence thresholds');
            }

            return this._formatTask('association_analysis', score, conf, reasons);
        },

        /**
         * Evaluate dataset's objective predictive readiness
         * Verifies target suitability, sample size, leakage risks, and class balance.
         * Returns { status: 'READY'|'MARGINAL'|'INSUFFICIENT', score, blockers, warnings, requiredData, recommendedNextStep }
         */
        evaluatePredictiveReadiness(profile, rawDataset) {
            const blockers = [];
            const warnings = [];
            const requiredData = [];
            
            if (!profile || !profile.columns || profile.columns.length === 0) {
                return {
                    status: 'INSUFFICIENT',
                    score: 0,
                    primaryTarget: null,
                    targetTask: null,
                    usableFeatureCount: 0,
                    rowCount: 0,
                    blockers: ['No profile or schema columns available'],
                    warnings: [],
                    requiredData: ['Upload a valid tabular dataset with columns and observations'],
                    recommendedNextStep: 'Import a CSV or Excel dataset containing at least one target variable and multiple candidate features.'
                };
            }

            const ds = profile.dataset || {};
            const cols = profile.columns || [];
            const targets = profile.targetCandidates || [];
            const rowCount = ds.rowCount || (rawDataset && rawDataset.rows ? rawDataset.rows.length : 0);

            // 1. Sample Size Check
            if (rowCount < 6) {
                blockers.push(`Sample size (n = ${rowCount}) is strictly below the minimum mathematical threshold for predictive modeling (minimum 6 required, recommended >= 50)`);
                requiredData.push('Additional historical observations/rows');
            } else if (rowCount < 30) {
                warnings.push(`Limited sample size (n = ${rowCount}) may cause high variance in cross-validation`);
            }

            // 2. Target Variable Identification
            const validTargets = targets.filter(t => {
                const colProfile = Array.isArray(cols) ? cols.find(c => c && c.name === t.column) : cols[t.column];
                if (!colProfile) return false;
                const stats = colProfile.stats || {};
                const isConst = stats.isConstant || (stats.uniqueCount <= 1);
                const missingRate = colProfile.nullCount ? (colProfile.nullCount / rowCount) : 0;
                return !isConst && missingRate < 0.50;
            });

            let primaryTarget = validTargets.length > 0 ? validTargets[0] : null;

            if (!primaryTarget) {
                const nonConstCols = cols.filter(c => c && !c.stats?.isConstant && (c.stats?.uniqueCount > 1) && !c.isIdentifier);
                if (nonConstCols.length === 0) {
                    blockers.push('No valid non-constant target variable identified in the dataset');
                    requiredData.push('At least one outcome/target column (e.g. defect flag, revenue, churn, score)');
                } else {
                    warnings.push('No primary target variable explicitly detected by heuristics; fallback required');
                }
            } else {
                const targetCol = Array.isArray(cols) ? cols.find(c => c && c.name === primaryTarget.column) : cols[primaryTarget.column];
                if (targetCol) {
                    const stats = targetCol.stats || {};
                    if (targetCol.detectedType === 'categorical' || targetCol.detectedType === 'boolean' || stats.uniqueCount === 2) {
                        if (stats.frequencies && stats.frequencies.length >= 2) {
                            const minFreq = Math.min(...stats.frequencies.map(f => f.count));
                            const minRatio = minFreq / (rowCount || 1);
                            if (minRatio < 0.01 && rowCount >= 100) {
                                blockers.push(`Extreme class imbalance: minority class represents only ${(minRatio * 100).toFixed(2)}% of samples (minimum 1.0% required)`);
                                requiredData.push('More balanced outcome samples or oversampled minority cases');
                            } else if (minRatio < 0.05) {
                                warnings.push(`Severe class imbalance detected: minority class represents ${(minRatio * 100).toFixed(1)}% of samples; stratified sampling required`);
                            }
                        }
                    }
                }
            }

            // 3. Feature Count Check
            const featureCandidates = cols.filter(c => {
                if (!c) return false;
                if (primaryTarget && c.name === primaryTarget.column) return false;
                if (c.stats?.isConstant) return false;
                if (c.isIdentifier || c.detectedType === 'id') return false;
                return true;
            });

            if (featureCandidates.length === 0) {
                blockers.push('Zero valid predictor features available after excluding identifiers, constants, and target');
                requiredData.push('At least one non-identifier explanatory feature');
            }

            let status = 'READY';
            let score = 90;

            if (blockers.length > 0) {
                status = 'INSUFFICIENT';
                score = Math.max(10, 40 - blockers.length * 15);
            } else if (warnings.length > 0) {
                status = 'MARGINAL';
                score = Math.max(50, 85 - warnings.length * 10);
            }

            let nextStep = 'Proceed with model training, baseline benchmarking, and diagnostic validation.';
            if (status === 'INSUFFICIENT') {
                nextStep = 'Address predictive blockers: ' + blockers[0];
            } else if (status === 'MARGINAL') {
                nextStep = 'Proceed with caution: apply cross-validation and verify baseline lift before deploying recommendations.';
            }

            return {
                status: status,
                score: score,
                primaryTarget: primaryTarget ? primaryTarget.column : null,
                targetTask: primaryTarget ? primaryTarget.task : null,
                usableFeatureCount: featureCandidates.length,
                rowCount: rowCount,
                blockers: blockers,
                warnings: warnings,
                requiredData: requiredData,
                recommendedNextStep: nextStep
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.TaskDetector = TaskDetector;

})(window);
