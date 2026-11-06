/**
 * UDIP Deep Intelligence Evolution vNext
 * Multimodality - Peak Detection & Mixture Subgroup Separation
 * Identifies multimodal distributions indicating heterogeneous underlying sub-populations.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.Multimodality = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class Multimodality {
        static detect(vals, numBins = 15) {
            if (!vals || vals.length < 20) {
                return { isMultimodal: false, peakCount: 1, peaks: [] };
            }

            const clean = vals.filter(v => typeof v === 'number' && !isNaN(v));
            if (clean.length < 20) return { isMultimodal: false, peakCount: 1, peaks: [] };

            const min = Math.min(...clean);
            const max = Math.max(...clean);
            if (min === max) return { isMultimodal: false, peakCount: 1, peaks: [min] };

            const binWidth = (max - min) / numBins;
            const hist = new Array(numBins).fill(0);
            for (let i = 0; i < clean.length; i++) {
                const b = Math.min(numBins - 1, Math.floor((clean[i] - min) / binWidth));
                hist[b]++;
            }

            // Smooth histogram with 3-point moving average
            const smoothed = new Array(numBins);
            for (let i = 0; i < numBins; i++) {
                const prev = i > 0 ? hist[i - 1] : hist[i];
                const curr = hist[i];
                const next = i < numBins - 1 ? hist[i + 1] : hist[i];
                smoothed[i] = (prev + 2 * curr + next) / 4;
            }

            // Find local peaks
            const peaks = [];
            const threshold = clean.length * 0.08; // Peak must hold at least 8% of data

            // Boundary check for first bin
            if (numBins >= 2 && smoothed[0] > smoothed[1] && smoothed[0] >= threshold) {
                const peakValue = min + 0.5 * binWidth;
                peaks.push({ binIndex: 0, value: +peakValue.toFixed(2), density: +(smoothed[0] / clean.length).toFixed(3) });
            }

            for (let i = 1; i < numBins - 1; i++) {
                if (smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1] && smoothed[i] >= threshold) {
                    const peakValue = min + (i + 0.5) * binWidth;
                    peaks.push({ binIndex: i, value: +peakValue.toFixed(2), density: +(smoothed[i] / clean.length).toFixed(3) });
                }
            }

            // Boundary check for last bin
            if (numBins >= 2 && smoothed[numBins - 1] > smoothed[numBins - 2] && smoothed[numBins - 1] >= threshold) {
                const peakValue = min + (numBins - 0.5) * binWidth;
                peaks.push({ binIndex: numBins - 1, value: +peakValue.toFixed(2), density: +(smoothed[numBins - 1] / clean.length).toFixed(3) });
            }

            const isMultimodal = peaks.length >= 2;

            return {
                isMultimodal: isMultimodal,
                peakCount: peaks.length,
                peaks: peaks,
                status: isMultimodal ? 'OBSERVED' : 'UNKNOWN',
                evidence: isMultimodal
                    ? [`Detected ${peaks.length} distinct distributional modes at values [${peaks.map(p => p.value).join(', ')}].`]
                    : ['Unimodal empirical distribution profile.']
            };
        }
    }

    return Multimodality;
}));
