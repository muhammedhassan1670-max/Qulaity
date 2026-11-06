/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/distributions/distribution-intelligence.js
 * ============================================================================
 * Deep statistical distribution analysis: multimodality, heavy tails,
 * zero inflation, bounded bounds, variance instability, and candidate fits.
 * Reports: "distribution appears consistent with..." rather than blind certainty.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DistributionIntelligence = {
        /**
         * Analyze statistical distributions across numeric columns
         * @param {Object} dataset - Raw dataset
         * @param {Object} profile - Profiler output
         * @returns {Object} Map of column distributions
         */
        analyze(dataset, profile) {
            const rows = Array.isArray(dataset?.rows) ? dataset.rows : [];
            const cols = profile?.columns || [];
            if (rows.length < 10 || cols.length === 0) return {};

            const isNum = (c) => ['integer', 'decimal', 'numeric', 'float'].includes(c.detectedType) || 
                                 ['integer', 'decimal', 'numeric', 'float'].includes(c.inferredType) || 
                                 ['integer', 'decimal', 'numeric', 'float'].includes(c.subType);
            const numCols = cols.filter(isNum);
            const distributionMap = {};

            numCols.forEach(col => {
                const vals = [];
                for (let i = 0; i < rows.length; i++) {
                    const v = Number(rows[i][col.name]);
                    if (Number.isFinite(v)) vals.push(v);
                }

                if (vals.length >= 10) {
                    distributionMap[col.name] = this._analyzeColumnDistribution(col.name, vals, col.stats);
                }
            });

            return distributionMap;
        },

        _analyzeColumnDistribution(colName, vals, stats = {}) {
            const n = vals.length;
            const mean = stats.mean !== undefined ? stats.mean : vals.reduce((a, b) => a + b, 0) / n;
            const std = stats.std !== undefined ? stats.std : Math.sqrt(vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1 || 1));
            const min = stats.min !== undefined ? stats.min : Math.min(...vals);
            const max = stats.max !== undefined ? stats.max : Math.max(...vals);
            const skewness = stats.skewness !== undefined ? stats.skewness : this._computeSkewness(vals, mean, std);
            const kurtosis = stats.kurtosis !== undefined ? stats.kurtosis : this._computeKurtosis(vals, mean, std);

            // 1. Zero-Inflation
            const zeroCount = vals.filter(v => v === 0).length;
            const zeroPct = +( (zeroCount / n * 100).toFixed(1) );
            const isZeroInflated = zeroPct >= 25.0;

            // 2. Multimodality (Histogram density peak count)
            const peaks = this._detectHistogramPeaks(vals, 12);
            const isMultimodal = peaks.length >= 2;

            // 3. Heavy Tails
            const isHeavyTailed = kurtosis >= 4.5 || Math.abs(skewness) >= 2.0;

            // 4. Bounded Range
            const isBoundedUnit = min >= 0 && max <= 1;
            const isStrictlyPositive = min >= 0;

            // 5. Candidate Distribution Consistency
            let candidateFit = 'Empirical Non-Parametric';
            let candidateConfidence = 'Moderate';
            const notes = [];

            if (isZeroInflated) {
                candidateFit = 'Zero-Inflated Mixture Distribution';
                notes.push(`Excessive zeros (${zeroPct}%) indicate two-part mixture process.`);
            } else if (isMultimodal) {
                candidateFit = `Multi-Modal Mixture (${peaks.length} Distinct Peaks)`;
                notes.push(`Detected ${peaks.length} density modes, suggesting hidden heterogeneous subgroups.`);
            } else if (isBoundedUnit) {
                candidateFit = 'Beta / Proportion Distribution';
                notes.push('Strictly bounded within [0, 1] interval.');
            } else if (isStrictlyPositive && skewness >= 1.5) {
                candidateFit = 'Lognormal / Exponential Distribution';
                notes.push('Right-skewed positive distribution consistent with multiplicative growth.');
            } else if (Math.abs(skewness) < 0.4 && Math.abs(kurtosis - 3.0) < 0.8) {
                candidateFit = 'Gaussian (Normal) Distribution';
                candidateConfidence = 'High';
                notes.push('Symmetric bell shape consistent with standard normal variance bounds.');
            } else {
                notes.push(`Asymmetric distribution (Skew: ${skewness.toFixed(2)}, Kurtosis: ${kurtosis.toFixed(2)}).`);
            }

            return {
                column: colName,
                sampleSize: n,
                mean: +(mean.toFixed(3)),
                std: +(std.toFixed(3)),
                skewness: +(skewness.toFixed(3)),
                kurtosis: +(kurtosis.toFixed(3)),
                isZeroInflated,
                zeroPercentage: zeroPct,
                isMultimodal,
                detectedModesCount: peaks.length,
                isHeavyTailed,
                candidateDistribution: candidateFit,
                consistencyAssessment: `Distribution appears consistent with ${candidateFit}`,
                confidenceLevel: candidateConfidence,
                diagnosticNotes: notes
            };
        },

        _computeSkewness(vals, mean, std) {
            const n = vals.length;
            if (n < 3 || std === 0) return 0;
            const m3 = vals.reduce((a, b) => a + Math.pow((b - mean) / std, 3), 0) / n;
            return m3;
        },

        _computeKurtosis(vals, mean, std) {
            const n = vals.length;
            if (n < 4 || std === 0) return 3;
            const m4 = vals.reduce((a, b) => a + Math.pow((b - mean) / std, 4), 0) / n;
            return m4;
        },

        _detectHistogramPeaks(vals, numBins = 12) {
            const min = Math.min(...vals);
            const max = Math.max(...vals);
            const range = max - min || 1;
            const bins = new Array(numBins).fill(0);

            vals.forEach(v => {
                const b = Math.min(numBins - 1, Math.floor(((v - min) / range) * numBins));
                bins[b]++;
            });

            // Local peaks
            const peaks = [];
            const threshold = Math.max(...bins) * 0.25;
            for (let i = 1; i < numBins - 1; i++) {
                if (bins[i] > bins[i - 1] && bins[i] > bins[i + 1] && bins[i] >= threshold) {
                    peaks.push({ binIndex: i, count: bins[i] });
                }
            }
            return peaks;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.DistributionIntelligence = DistributionIntelligence;

})(typeof window !== 'undefined' ? window : global);
