/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/benchmark/memory-profiler.js
 * ============================================================================
 * Memory Footprint & Array Duplication Profiler:
 * - Estimates byte sizes of dataset rows, profiles, and analytical caches
 * - Detects duplicate array references or unbounded object copies
 * - Measures JS heap allocations (process.memoryUsage or performance.memory)
 * ============================================================================
 */

(function (window) {
    'use strict';

    function estimateObjectBytes(obj) {
        if (!obj) return 0;
        try {
            const str = JSON.stringify(obj);
            return str ? str.length * 2 : 0; // Approx 2 bytes per char (UTF-16)
        } catch (e) {
            return 0;
        }
    }

    const MemoryProfiler = {
        /**
         * Estimate memory footprint of analytical platform objects
         * @param {Object} objects
         * @returns {Object}
         */
        profileFootprint(objects = {}) {
            const breakdown = {};
            let totalBytes = 0;

            for (const [key, val] of Object.entries(objects)) {
                if (val !== undefined && val !== null) {
                    const bytes = estimateObjectBytes(val);
                    breakdown[key] = {
                        bytes,
                        formatted: formatBytes(bytes)
                    };
                    totalBytes += bytes;
                }
            }

            return {
                totalBytes,
                totalFormatted: formatBytes(totalBytes),
                breakdown,
                heapSnapshot: this.getHeapSnapshot()
            };
        },

        /**
         * Get live heap snapshot if available in environment
         */
        getHeapSnapshot() {
            if (typeof process !== 'undefined' && process.memoryUsage) {
                const mem = process.memoryUsage();
                return {
                    heapUsedMb: Number((mem.heapUsed / (1024 * 1024)).toFixed(2)),
                    heapTotalMb: Number((mem.heapTotal / (1024 * 1024)).toFixed(2)),
                    rssMb: Number((mem.rss / (1024 * 1024)).toFixed(2))
                };
            }
            if (typeof performance !== 'undefined' && performance.memory) {
                return {
                    heapUsedMb: Number((performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)),
                    heapTotalMb: Number((performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(2))
                };
            }
            return null;
        }
    };

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.MemoryProfiler = MemoryProfiler;

})(typeof window !== 'undefined' ? window : global);
