/**
 * UDIP Deep Intelligence Evolution vNext
 * AnalysisCost - Complexity & Resource Estimation
 * Prevents O(n²) and O(p²) combinatorial blowups before execution.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.AnalysisCost = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class AnalysisCost {
        static estimate(dataset, taskType = 'GENERAL_ANALYSIS') {
            const rows = dataset.rowCount || (dataset.rows ? dataset.rows.length : 0);
            const cols = dataset.columnCount || (dataset.columns ? dataset.columns.length : 0);

            const cellCount = rows * cols;
            const pairwiseCount = (cols * (cols - 1)) / 2;

            let estimatedMs = 5;
            let recommendedBackend = 'NATIVE_JS';
            let memoryMb = +(cellCount * 8 / (1024 * 1024)).toFixed(2);

            if (cellCount > 200000 || pairwiseCount > 500) {
                estimatedMs = Math.round(cellCount / 5000);
                recommendedBackend = 'WEB_WORKER';
            } else if (cellCount > 1000000) {
                estimatedMs = Math.round(cellCount / 10000);
                recommendedBackend = 'COLUMNAR_WASM';
            }

            return {
                rows: rows,
                columns: cols,
                cellCount: cellCount,
                pairwiseEvaluations: pairwiseCount,
                estimatedDurationMs: Math.max(2, estimatedMs),
                estimatedMemoryMb: Math.max(0.1, memoryMb),
                recommendedBackend: recommendedBackend,
                status: 'ESTIMATED'
            };
        }
    }

    return AnalysisCost;
}));
