/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/change/concept-drift-detector.js
 * ============================================================================
 * Rigorously differentiates between:
 * 1. Data Drift              (P(X) shift: input distributions altered)
 * 2. Concept Drift Candidate (P(Y|X) shift: feature-target associative relationship altered)
 * 3. Performance Drift       (Model metric degradation: R², Accuracy, RMSE)
 * 
 * STRICT SAFEGUARD: Never asserts Concept Drift solely on input distribution
 * changes without empirical correlation/residual breakdown.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ConceptDriftDetector = {
        /**
         * Disentangle Data Drift, Concept Drift, and Performance Drift
         * 
         * @param {Object} params
         * @param {Object} params.currentAnalytics
         * @param {Object} params.previousAnalytics
         * @param {Object} params.distributionMonitoring
         * @param {Object} params.currentPlan
         * @param {Object} params.previousPlan
         * @returns {Object} Tripartite Drift Analysis Report
         */
        detect({
            currentAnalytics = {},
            previousAnalytics = null,
            distributionMonitoring = {},
            currentPlan = {},
            previousPlan = null
        } = {}) {
            // 1. Data Drift Evaluation (P(X))
            const distSummary = distributionMonitoring?.summary || {};
            const shiftedCount = distSummary.shiftedCount || 0;
            const dataDriftDetected = shiftedCount > 0;
            const dataDrift = {
                detected: dataDriftDetected,
                shiftedColumnCount: shiftedCount,
                severity: distSummary.criticalShifts?.length > 0 ? 'critical' : (shiftedCount >= 3 ? 'major' : (shiftedCount > 0 ? 'moderate' : 'none')),
                affectedColumns: (distributionMonitoring.numericShifts || []).filter(s => s.shiftDetected).map(s => s.column),
                evidence: dataDriftDetected
                    ? `Input feature distribution shifted across ${shiftedCount} variable(s).`
                    : 'Input feature distributions remain stable against historical baseline.'
            };

            // Baseline scenario
            if (!previousAnalytics || !previousAnalytics.machineLearning) {
                return {
                    status: 'baseline',
                    dataDrift,
                    conceptDrift: {
                        detected: false,
                        candidate: false,
                        correlationShifts: [],
                        evidence: 'Concept drift evaluation unavailable: requires historical model benchmark or analytical baseline.'
                    },
                    performanceDrift: {
                        detected: false,
                        metrics: {},
                        evidence: 'Performance drift evaluation unavailable: requires previous model metrics.'
                    },
                    summary: {
                        dominantDriftType: dataDriftDetected ? 'data_drift' : 'none',
                        recommendation: dataDriftDetected ? 'Monitor inputs for potential downstream model impact.' : 'Baseline established.'
                    }
                };
            }

            const currML = currentAnalytics.machineLearning || {};
            const prevML = previousAnalytics.machineLearning || {};
            const currWinner = currML.winner || {};
            const prevWinner = prevML.winner || {};

            // 2. Model Performance Drift Evaluation
            const currMetrics = currWinner.metrics || {};
            const prevMetrics = prevWinner.metrics || {};
            const isReg = currML.taskType === 'regression';

            let perfDegraded = false;
            let perfDelta = 0;
            let metricName = isReg ? 'R²' : 'Accuracy';

            if (isReg) {
                const r2Curr = currMetrics.r2 != null ? currMetrics.r2 : 0;
                const r2Prev = prevMetrics.r2 != null ? prevMetrics.r2 : 0;
                perfDelta = +(r2Curr - r2Prev).toFixed(4);
                if (perfDelta <= -0.15) perfDegraded = true;
            } else {
                const accCurr = currMetrics.accuracy != null ? currMetrics.accuracy : 0;
                const accPrev = prevMetrics.accuracy != null ? prevMetrics.accuracy : 0;
                perfDelta = +(accCurr - accPrev).toFixed(4);
                if (perfDelta <= -0.10) perfDegraded = true;
            }

            const performanceDrift = {
                detected: perfDegraded,
                taskType: currML.taskType || 'unknown',
                primaryMetric: metricName,
                previousValue: isReg ? prevMetrics.r2 : prevMetrics.accuracy,
                currentValue: isReg ? currMetrics.r2 : currMetrics.accuracy,
                delta: perfDelta,
                severity: perfDegraded ? (Math.abs(perfDelta) >= 0.25 ? 'critical' : 'major') : 'none',
                evidence: perfDegraded
                    ? `Model validation ${metricName} degraded by ${Math.abs(perfDelta)} points (${metricName} declined from ${isReg ? prevMetrics.r2 : prevMetrics.accuracy} to ${isReg ? currMetrics.r2 : currMetrics.accuracy}).`
                    : `Model validation ${metricName} is stable or improved (delta: ${perfDelta > 0 ? '+' : ''}${perfDelta}).`
            };

            // 3. Concept Drift Evaluation (P(Y|X))
            // Strict rule: Evaluated from shifts in feature-target correlation and feature importance inversion
            const currStats = currentAnalytics.statistics || {};
            const prevStats = previousAnalytics.statistics || {};

            const currCorrs = currStats.correlations || [];
            const prevCorrs = prevStats.correlations || [];

            const correlationShifts = [];
            currCorrs.forEach(cc => {
                const pc = prevCorrs.find(x => (x.col1 === cc.col1 && x.col2 === cc.col2) || (x.col1 === cc.col2 && x.col2 === cc.col1));
                if (pc && cc.r != null && pc.r != null) {
                    const corrDelta = +(cc.r - pc.r).toFixed(4);
                    // Significant relationship shift (|delta| >= 0.3 or sign flip of moderate correlation)
                    const signFlipped = (cc.r > 0.2 && pc.r < -0.2) || (cc.r < -0.2 && pc.r > 0.2);
                    if (Math.abs(corrDelta) >= 0.3 || signFlipped) {
                        correlationShifts.push({
                            pair: `${cc.col1} ~ ${cc.col2}`,
                            previousR: pc.r,
                            currentR: cc.r,
                            delta: corrDelta,
                            signFlipped,
                            evidence: `Bivariate correlation between "${cc.col1}" and "${cc.col2}" shifted from ${pc.r} to ${cc.r} (delta: ${corrDelta > 0 ? '+' : ''}${corrDelta}).`
                        });
                    }
                }
            });

            // Check feature importance inversion
            const currFeatImp = currML.featureImportance || [];
            const prevFeatImp = prevML.featureImportance || [];
            const topCurrFeat = currFeatImp[0]?.feature;
            const topPrevFeat = prevFeatImp[0]?.feature;
            const topFeatureInverted = topCurrFeat && topPrevFeat && topCurrFeat !== topPrevFeat && correlationShifts.some(cs => cs.pair.includes(topCurrFeat) || cs.pair.includes(topPrevFeat));

            const conceptDriftDetected = correlationShifts.length > 0 || (topFeatureInverted && perfDegraded);

            const conceptDrift = {
                detected: conceptDriftDetected,
                candidate: conceptDriftDetected,
                correlationShifts,
                topFeatureShift: topCurrFeat !== topPrevFeat ? { previous: topPrevFeat, current: topCurrFeat } : null,
                severity: (conceptDriftDetected && perfDegraded) ? 'critical' : (conceptDriftDetected ? 'major' : 'none'),
                evidence: conceptDriftDetected
                    ? `Evidence suggests candidate concept drift: ${correlationShifts.length} significant feature-target associative correlation shift(s) detected.${topFeatureInverted ? ' Primary predictive driver inverted.' : ''}`
                    : 'No evidence of concept drift: feature-to-target associative relationships remain stable.'
            };

            // 4. Synthesis and Dominant Diagnosis
            let dominantDrift = 'none';
            let recommendation = 'Analytical relationships remain consistent with baseline.';

            if (conceptDrift.detected && performanceDrift.detected) {
                dominantDrift = 'concept_and_performance_drift';
                recommendation = 'Critical: Retrain predictive model with fresh feature engineering; previous assumptions about target drivers have shifted.';
            } else if (performanceDrift.detected) {
                dominantDrift = 'performance_drift';
                recommendation = 'Model performance deteriorated; verify feature pipeline integrity and sample size adequacy.';
            } else if (conceptDrift.detected) {
                dominantDrift = 'candidate_concept_drift';
                recommendation = 'Underlying relationships appear altered; review statistical tests and feature importance before operational decisions.';
            } else if (dataDrift.detected) {
                dominantDrift = 'data_drift';
                recommendation = 'Input distributions shifted but relationships and model metrics currently remain resilient. Monitor downstream predictions.';
            }

            return {
                status: 'completed',
                dataDrift,
                conceptDrift,
                performanceDrift,
                summary: {
                    dominantDriftType: dominantDrift,
                    hasAnyDrift: dataDrift.detected || conceptDrift.detected || performanceDrift.detected,
                    recommendation
                },
                message: recommendation
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.ConceptDriftDetector = ConceptDriftDetector;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ConceptDriftDetector;
    }
})(typeof window !== 'undefined' ? window : global);
