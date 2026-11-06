/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/reliability/timeout-manager.js
 * ============================================================================
 * Enforces execution time bounds on external network, connector, and I/O tasks.
 * Prevents hanging promises and unhandled resource leaks.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const TimeoutManager = {
        /**
         * Wrap an asynchronous operation with an execution deadline
         * @param {Promise|Function} promiseOrFn
         * @param {number} [timeoutMs=15000]
         * @param {string} [operationName='Operation']
         * @returns {Promise<*>}
         */
        async withTimeout(promiseOrFn, timeoutMs = 15000, operationName = 'Operation') {
            const promise = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;

            let timer = null;
            const timeoutPromise = new Promise((_, reject) => {
                timer = setTimeout(() => {
                    const err = new Error(`${operationName} timed out after ${timeoutMs}ms`);
                    err.code = 'ETIMEDOUT';
                    err.status = 408;
                    reject(err);
                }, timeoutMs);
            });

            try {
                const result = await Promise.race([promise, timeoutPromise]);
                clearTimeout(timer);
                return result;
            } catch (err) {
                clearTimeout(timer);
                throw err;
            }
        }
    };

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.TimeoutManager = TimeoutManager;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TimeoutManager;
    }
})(typeof window !== 'undefined' ? window : global);
