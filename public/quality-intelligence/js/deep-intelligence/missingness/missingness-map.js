/**
 * UDIP Deep Intelligence Evolution vNext
 * MissingnessMap - Variable, Group & Temporal Missingness Mapping
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.MissingnessMap = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class MissingnessMap {
        static map(dataset) {
            if (!dataset || !dataset.columns || !dataset.rows) {
                return { columnRates: {}, overallRate: 0, totalMissingCells: 0 };
            }

            const rowCount = dataset.rows.length;
            const columnRates = {};
            let totalMissing = 0;

            dataset.columns.forEach(col => {
                let missing = 0;
                for (let r = 0; r < rowCount; r++) {
                    const v = dataset.rows[r][col];
                    if (v === null || v === undefined || v === '' || (typeof v === 'number' && isNaN(v))) {
                        missing++;
                    }
                }
                const rate = rowCount > 0 ? +(missing / rowCount).toFixed(4) : 0;
                columnRates[col] = { missingCount: missing, rate: rate, percentage: +(rate * 100).toFixed(1) };
                totalMissing += missing;
            });

            const totalCells = rowCount * dataset.columns.length;
            const overallRate = totalCells > 0 ? +(totalMissing / totalCells).toFixed(4) : 0;

            return {
                columnRates: columnRates,
                totalMissingCells: totalMissing,
                overallRate: overallRate,
                overallPercentage: +(overallRate * 100).toFixed(1),
                hasMissingness: totalMissing > 0
            };
        }
    }

    return MissingnessMap;
}));
