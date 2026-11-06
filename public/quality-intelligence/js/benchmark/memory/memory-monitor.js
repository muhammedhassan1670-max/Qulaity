/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: benchmark/memory/memory-monitor.js
 * ============================================================================
 * Memory Footprint & Heap Monitor:
 * Inspects real memory usage where browser APIs allow (performance.memory)
 * Computes payload object memory estimations based on serialized length.
 *
 * Core Invariant:
 * Never fabricate memory values! If the runtime does not support memory APIs,
 * explicitly returns 'NOT MEASURED'.
 * ============================================================================
 */

(function (window) {
    'use strict';

    function formatBytes(bytes) {
        if (typeof bytes !== 'number' || isNaN(bytes)) return 'NOT MEASURED';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }

    const MemoryMonitor = {
        /**
         * Check if real heap inspection is available in current environment
         * @returns {boolean}
         */
        isHeapMeasurementAvailable() {
            return typeof performance !== 'undefined' && Boolean(performance.memory);
        },

        /**
         * Capture current memory snapshot
         * @returns {Object}
         */
        getMemorySnapshot() {
            if (this.isHeapMeasurementAvailable()) {
                const mem = performance.memory;
                return {
                    measured: true,
                    usedJSHeapSizeBytes: mem.usedJSHeapSize,
                    totalJSHeapSizeBytes: mem.totalJSHeapSize,
                    jsHeapSizeLimitBytes: mem.jsHeapSizeLimit,
                    formattedUsed: formatBytes(mem.usedJSHeapSize),
                    formattedTotal: formatBytes(mem.totalJSHeapSize)
                };
            }

            return {
                measured: false,
                usedJSHeapSizeBytes: null,
                totalJSHeapSizeBytes: null,
                jsHeapSizeLimitBytes: null,
                formattedUsed: 'NOT MEASURED',
                formattedTotal: 'NOT MEASURED',
                note: 'performance.memory API unavailable in current environment'
            };
        },

        /**
         * Estimate memory footprint of a JavaScript object graph (in bytes)
         * @param {any} obj
         * @returns {number|string} Bytes or 'NOT MEASURED'
         */
        estimateObjectSize(obj) {
            if (obj === null || obj === undefined) return 0;
            try {
                const str = JSON.stringify(obj);
                // Approx 2 bytes per char in UTF-16
                return str.length * 2;
            } catch (err) {
                return 'NOT MEASURED';
            }
        },

        /**
         * Format raw bytes into human-readable string
         */
        formatBytes
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Benchmark = window.UDIP.Benchmark || {};
    window.UDIP.Benchmark.MemoryMonitor = MemoryMonitor;

})(typeof window !== 'undefined' ? window : global);
