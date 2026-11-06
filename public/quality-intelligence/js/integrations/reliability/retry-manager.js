/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/reliability/retry-manager.js
 * ============================================================================
 * Production-style exponential backoff with full jitter.
 * Invariant: Only retries transient or network failures; never retries
 * authentication, authorization, schema, or validation errors.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class RetryManager {
        constructor({ maxAttempts = 3, baseDelayMs = 100, maxDelayMs = 3000 } = {}) {
            this.maxAttempts = maxAttempts;
            this.baseDelayMs = baseDelayMs;
            this.maxDelayMs = maxDelayMs;
        }

        /**
         * Calculate delay with exponential backoff and full jitter
         * @param {number} attempt (0-indexed)
         * @returns {number}
         */
        calculateDelay(attempt) {
            const exponential = Math.min(this.maxDelayMs, this.baseDelayMs * Math.pow(2, attempt));
            // Full jitter between 0 and exponential
            return Math.floor(Math.random() * exponential);
        }

        /**
         * Execute an async operation with automated retry for transient failures
         * @param {Function} operationFn
         * @param {Object} [options]
         * @returns {Promise<*>}
         */
        async execute(operationFn, options = {}) {
            const max = options.maxAttempts || this.maxAttempts;
            const failureHandler = window.UDIP?.Integrations?.FailureHandler;

            let lastError = null;

            for (let attempt = 0; attempt < max; attempt++) {
                try {
                    return await operationFn(attempt);
                } catch (err) {
                    lastError = err;
                    const classified = failureHandler ? failureHandler.classify(err, options.stage || 'retry') : { error: { retryable: true } };

                    // Stop immediately if non-retryable error (e.g. Auth, Permission, Validation)
                    if (!classified.error.retryable) {
                        throw err;
                    }

                    // If final attempt, do not wait, break and re-throw
                    if (attempt === max - 1) {
                        break;
                    }

                    const delay = this.calculateDelay(attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }

            throw lastError;
        }

        async executeWithRetry(operationFn, options = {}) {
            return this.execute(operationFn, options);
        }
    }

    const defaultInstance = new RetryManager();
    defaultInstance.RetryManager = RetryManager;
    defaultInstance.executeWithRetry = defaultInstance.execute.bind(defaultInstance);

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.RetryManager = defaultInstance;
    window.UDIP.Integrations.defaultRetryManager = defaultInstance;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = defaultInstance;
    }
})(typeof window !== 'undefined' ? window : global);
