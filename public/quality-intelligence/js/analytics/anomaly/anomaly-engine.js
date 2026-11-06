/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/anomaly/anomaly-engine.js
 * ============================================================================
 * Anomaly Detection Engine:
 * - Dynamically matches detection algorithms to column distribution characteristics
 * - Aggregates column-level anomalies and reports dataset-wide anomaly impact
 * - Never deletes data automatically; marks indices for contextual inspection
 * ============================================================================
 */

(function (window) {
    'use strict';

    const AnomalyEngine = {
        /**
         * Run anomaly detection across numeric columns
         * 
         * @param {Object} params
         * @param {Object} params.data Active dataset object
         * @param {Object} params.profile Step 2 profiler result
         * @param {Object} params.analysisPlan Step 2.5 intelligence plan
         * @returns {Object} Unified anomaly detection result
         */
        run({ data, profile, analysisPlan }) {
            const rows = (data && Array.isArray(data.rows)) ? data.rows : [];
            const result = {
                status: 'completed',
                columns: [],
                totalAnomalies: 0,
                datasetAnomalyPercentage: 0
            };

            if (rows.length < 5) {
                result.status = 'skipped';
                result.reason = 'Insufficient sample size for statistical anomaly detection (requires n >= 5)';
                return result;
            }

            const Detectors = window.UDIP && window.UDIP.AnomalyDetectors;
            if (!Detectors) {
                result.status = 'error';
                result.reason = 'Anomaly detectors module not loaded';
                return result;
            }

            // Find continuous numeric columns
            const numCols = [];
            const colList = Array.isArray(profile?.columns)
                ? profile.columns
                : (profile?.columns ? Object.entries(profile.columns).map(([k, v]) => ({ name: k, ...v })) : []);

            colList.forEach(p => {
                const col = p.name;
                const detectedType = p.detectedType || (p.type ? p.type.detectedType : 'unknown');
                if (['integer', 'decimal', 'numeric'].includes(detectedType)) {
                    numCols.push(col);
                }
            });

            const targetCol = analysisPlan?.primaryTarget?.column;
            // Prioritize target column and first few numeric features
            const priorityCols = targetCol && numCols.includes(targetCol)
                ? [targetCol, ...numCols.filter(c => c !== targetCol).slice(0, 4)]
                : numCols.slice(0, 5);

            let allFlaggedIndices = new Set();

            priorityCols.forEach(col => {
                const values = rows.map(r => Number(r[col])).filter(v => Number.isFinite(v));
                if (values.length < 5) return;

                // Check skewness from profile if available
                const colProf = colList.find(c => c.name === col);
                const skew = Math.abs(colProf?.stats?.skewness || colProf?.skewness || 0);

                let detection;
                let methodUsed;
                let confidence = 85;

                if (skew > 1.0) {
                    // Skewed data -> Modified Z-Score (MAD) is far more robust
                    detection = Detectors.detectModifiedZScore(values, 3.5);
                    methodUsed = 'modified_zscore';
                    confidence = 90;
                } else if (values.length >= 30) {
                    // Symmetric large data -> Standard Z-score
                    detection = Detectors.detectZScore(values, 3.0);
                    methodUsed = 'z_score';
                    confidence = 88;
                } else {
                    // Smaller sample -> IQR
                    detection = Detectors.detectIqr(values, 1.5);
                    methodUsed = 'iqr';
                    confidence = 82;
                }

                if (detection && detection.anomalies) {
                    detection.anomalies.forEach(a => allFlaggedIndices.add(a.index));

                    result.columns.push({
                        column: col,
                        method: methodUsed,
                        anomalyCount: detection.count,
                        anomalyPercentage: detection.percentage,
                        threshold: detection.threshold,
                        confidence,
                        sampleAnomalies: detection.anomalies.slice(0, 5)
                    });
                }
            });

            result.totalAnomalies = allFlaggedIndices.size;
            result.datasetAnomalyPercentage = Number(((allFlaggedIndices.size / rows.length) * 100).toFixed(2));

            return result;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.AnomalyEngine = AnomalyEngine;

})(typeof window !== 'undefined' ? window : global);
