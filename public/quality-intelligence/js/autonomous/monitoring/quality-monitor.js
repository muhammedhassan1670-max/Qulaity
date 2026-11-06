/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/monitoring/quality-monitor.js
 * ============================================================================
 * Continuously tracks data hygiene, completeness, uniqueness, and integrity
 * deltas across dataset versions.
 * 
 * Compares Previous Quality Score vs Current Quality Score and flags
 * degradations with calibrated severity levels.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const QualityMonitor = {
        /**
         * Compare data quality profiles across versions
         * 
         * @param {Object} params
         * @param {Object} params.currentProfile
         * @param {Object} params.previousProfile
         * @returns {Object} Quality Monitoring Report
         */
        monitor({
            currentProfile = {},
            previousProfile = null
        } = {}) {
            const currQual = currentProfile?.quality || {};
            const prevQual = previousProfile?.quality || null;

            const currScore = currQual.score != null ? currQual.score : 80;

            if (!previousProfile || !prevQual) {
                return {
                    status: 'baseline',
                    previousScore: null,
                    currentScore: currScore,
                    scoreDelta: 0,
                    severity: 'none',
                    metrics: [],
                    degradedMetrics: [],
                    message: `Initial quality baseline established at score ${currScore}/100.`
                };
            }

            const prevScore = prevQual.score != null ? prevQual.score : 80;
            const scoreDelta = +(currScore - prevScore).toFixed(1);

            let severity = 'none';
            if (scoreDelta <= -20) severity = 'severe';
            else if (scoreDelta <= -10) severity = 'moderate';
            else if (scoreDelta <= -5) severity = 'minor';

            const metrics = [];
            const degradedMetrics = [];

            // 1. Overall Score Metric
            metrics.push({
                metric: 'overall_quality_score',
                previous: prevScore,
                current: currScore,
                delta: scoreDelta,
                severity: severity,
                interpretation: scoreDelta < 0
                    ? `Overall data quality deteriorated by ${Math.abs(scoreDelta)} points (${prevScore} -> ${currScore}).`
                    : (scoreDelta > 0 ? `Overall data quality improved by ${scoreDelta} points (${prevScore} -> ${currScore}).` : 'Data quality score is unchanged.')
            });

            // 2. Completeness / Missingness
            const currMiss = currQual.metrics?.completeness != null ? currQual.metrics.completeness : (100 - (currQual.missingRate || 0));
            const prevMiss = prevQual.metrics?.completeness != null ? prevQual.metrics.completeness : (100 - (prevQual.missingRate || 0));
            const missDelta = +(currMiss - prevMiss).toFixed(2);
            let missSev = 'none';
            if (missDelta <= -15) missSev = 'severe';
            else if (missDelta <= -5) missSev = 'moderate';
            else if (missDelta < 0) missSev = 'minor';

            const missItem = {
                metric: 'completeness',
                previous: prevMiss,
                current: currMiss,
                delta: missDelta,
                severity: missSev,
                interpretation: `Dataset completeness shifted by ${missDelta > 0 ? '+' : ''}${missDelta}% (${prevMiss}% -> ${currMiss}%).`
            };
            metrics.push(missItem);
            if (missSev !== 'none') degradedMetrics.push(missItem);

            // 3. Uniqueness / Duplication
            const currDup = currQual.duplicateRows || 0;
            const prevDup = prevQual.duplicateRows || 0;
            const dupDelta = currDup - prevDup;
            let dupSev = 'none';
            if (dupDelta > 20) dupSev = 'severe';
            else if (dupDelta > 5) dupSev = 'moderate';
            else if (dupDelta > 0) dupSev = 'minor';

            const dupItem = {
                metric: 'duplicate_rows',
                previous: prevDup,
                current: currDup,
                delta: dupDelta,
                severity: dupSev,
                interpretation: `Duplicate rows shifted by ${dupDelta > 0 ? '+' : ''}${dupDelta} records (${prevDup} -> ${currDup}).`
            };
            metrics.push(dupItem);
            if (dupSev !== 'none') degradedMetrics.push(dupItem);

            // 4. Information Variance (Zero variance / constant columns)
            const currConst = (currentProfile.columns || []).filter(c => c.stats?.isConstant).length;
            const prevConst = (previousProfile.columns || []).filter(c => c.stats?.isConstant).length;
            const constDelta = currConst - prevConst;
            let constSev = constDelta > 1 ? 'severe' : (constDelta === 1 ? 'moderate' : 'none');

            const constItem = {
                metric: 'information_variance',
                previous: prevConst,
                current: currConst,
                delta: constDelta,
                severity: constSev,
                interpretation: constDelta > 0
                    ? `${constDelta} additional column(s) collapsed into zero-variance constant state.`
                    : 'Information variance remains stable.'
            };
            metrics.push(constItem);
            if (constSev !== 'none') degradedMetrics.push(constItem);

            // 5. Outlier Rate
            const currOutliers = currQual.outlierCells || 0;
            const prevOutliers = prevQual.outlierCells || 0;
            const outDelta = currOutliers - prevOutliers;
            let outSev = outDelta > 50 ? 'moderate' : (outDelta > 10 ? 'minor' : 'none');

            const outItem = {
                metric: 'outlier_count',
                previous: prevOutliers,
                current: currOutliers,
                delta: outDelta,
                severity: outSev,
                interpretation: `Tukey outlier cells shifted by ${outDelta > 0 ? '+' : ''}${outDelta} instances.`
            };
            metrics.push(outItem);
            if (outSev !== 'none') degradedMetrics.push(outItem);

            return {
                status: 'monitored',
                previousScore: prevScore,
                currentScore: currScore,
                scoreDelta: scoreDelta,
                severity: severity,
                hasDegradation: degradedMetrics.length > 0 || scoreDelta < -5,
                metrics,
                degradedMetrics,
                message: scoreDelta < 0
                    ? `Data quality score declined by ${Math.abs(scoreDelta)} points (severity: ${severity}).`
                    : (scoreDelta > 0 ? `Data quality score improved by +${scoreDelta} points.` : 'Data quality remained stable across versions.')
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.QualityMonitor = QualityMonitor;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = QualityMonitor;
    }
})(typeof window !== 'undefined' ? window : global);
