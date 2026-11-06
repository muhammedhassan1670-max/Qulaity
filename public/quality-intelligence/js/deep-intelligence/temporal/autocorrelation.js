/**
 * UDIP Deep Intelligence Evolution vNext
 * Autocorrelation - Sample Autocorrelation Function (ACF)
 * Evaluates autocorrelation across lags 1 through 5.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.Autocorrelation = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class Autocorrelation {
        static compute(series, maxLag = 5) {
            if (!series || series.length < maxLag + 5) {
                return [];
            }

            const n = series.length;
            const mean = series.reduce((a, b) => a + b, 0) / n;
            let var0 = 0;
            for (let i = 0; i < n; i++) {
                var0 += Math.pow(series[i] - mean, 2);
            }
            if (var0 === 0) return [];

            const acf = [];
            for (let lag = 1; lag <= maxLag; lag++) {
                let cov = 0;
                for (let i = lag; i < n; i++) {
                    cov += (series[i] - mean) * (series[i - lag] - mean);
                }
                const rLag = cov / var0;
                // Bartlett 95% confidence bounds ~ +/- 1.96 / sqrt(N)
                const bound = 1.96 / Math.sqrt(n);

                acf.push({
                    lag: lag,
                    correlation: +rLag.toFixed(4),
                    significant: Math.abs(rLag) > bound,
                    confidenceThreshold: +bound.toFixed(4)
                });
            }

            return acf;
        }
    }

    return Autocorrelation;
}));
