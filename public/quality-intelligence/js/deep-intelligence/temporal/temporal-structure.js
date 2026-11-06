/**
 * UDIP Deep Intelligence Evolution vNext
 * TemporalStructure - Timestamp Parsing, Chronology & Regularity
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.TemporalStructure = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class TemporalStructure {
        static inspect(dataset, profile) {
            if (!dataset || !dataset.columns || !dataset.rows || dataset.rows.length < 3) {
                return { hasTemporal: false, timeColumn: null };
            }

            const colProfiles = {};
            if (profile && profile.columns) {
                if (Array.isArray(profile.columns)) {
                    profile.columns.forEach(c => { if (c && c.name) colProfiles[c.name] = c; });
                } else if (typeof profile.columns === 'object') {
                    Object.assign(colProfiles, profile.columns);
                }
            }
            const dateCols = dataset.columns.filter(c => {
                const p = colProfiles[c] || {};
                const t = p.detectedType || p.inferredType || '';
                return t === 'date' || t === 'timestamp' || c.toLowerCase().includes('date') || c.toLowerCase().includes('time');
            });

            if (dateCols.length === 0) {
                return { hasTemporal: false, timeColumn: null };
            }

            const timeCol = dateCols[0];
            const timestamps = [];
            for (let i = 0; i < dataset.rows.length; i++) {
                const ts = new Date(dataset.rows[i][timeCol]).getTime();
                if (!isNaN(ts)) timestamps.push({ ts, index: i });
            }

            if (timestamps.length < 3) {
                return { hasTemporal: false, timeColumn: timeCol };
            }

            let isChronological = true;
            for (let i = 1; i < timestamps.length; i++) {
                if (timestamps[i].ts < timestamps[i - 1].ts) {
                    isChronological = false;
                    break;
                }
            }

            // Estimate sampling interval regularity
            const diffs = [];
            for (let i = 1; i < Math.min(timestamps.length, 50); i++) {
                diffs.push(timestamps[i].ts - timestamps[i - 1].ts);
            }
            const meanDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
            const varDiff = diffs.reduce((a, b) => a + Math.pow(b - meanDiff, 2), 0) / diffs.length;
            const cvInterval = meanDiff > 0 ? Math.sqrt(varDiff) / meanDiff : 1;

            let cadence = 'IRREGULAR';
            if (cvInterval < 0.1) {
                const oneHour = 3600000;
                const oneDay = 86400000;
                if (Math.abs(meanDiff - oneHour) < 60000) cadence = 'HOURLY';
                else if (Math.abs(meanDiff - oneDay) < 3600000) cadence = 'DAILY';
                else cadence = 'REGULAR_INTERVAL';
            }

            return {
                hasTemporal: true,
                timeColumn: timeCol,
                isChronological: isChronological,
                cadence: cadence,
                samplingIntervalMs: Math.round(meanDiff),
                intervalRegularityCv: +cvInterval.toFixed(3),
                sampleCount: timestamps.length
            };
        }
    }

    return TemporalStructure;
}));
