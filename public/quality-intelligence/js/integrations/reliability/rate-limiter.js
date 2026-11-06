/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/reliability/rate-limiter.js
 * ============================================================================
 * Token bucket and sliding-window rate limiter.
 * Enforces request limits per minute/second and respects Retry-After headers.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class RateLimiter {
        constructor({ maxRequests = 60, defaultRpm = 60, windowMs = 60000, burstLimit = 10 } = {}) {
            this.maxRequests = maxRequests || defaultRpm;
            this.defaultRpm = this.maxRequests;
            this.windowMs = windowMs;
            this.burstLimit = burstLimit;
            this._windows = new Map(); // key -> Array of timestamps
            this._coolOffUntil = new Map(); // key -> timestamp ms
        }

        /**
         * Check if key is currently blocked by Retry-After or rate limit
         * @param {string} [key='global']
         * @returns {boolean}
         */
        isThrottled(key = 'global') {
            const now = Date.now();
            const coolOff = this._coolOffUntil.get(key);
            if (coolOff && coolOff > now) return true;

            const timestamps = this._getValidTimestamps(key, now);
            return timestamps.length >= this.maxRequests;
        }

        /**
         * Try to acquire an execution slot
         * @param {string} [key='global']
         * @returns {Object} { allowed: boolean, waitMs: number, retryAfterMs: number }
         */
        acquire(key = 'global') {
            const now = Date.now();
            const coolOff = this._coolOffUntil.get(key);
            if (coolOff && coolOff > now) {
                const waitMs = coolOff - now;
                return { allowed: false, waitMs, retryAfterMs: waitMs, reason: 'COOL_OFF' };
            }

            const timestamps = this._getValidTimestamps(key, now);
            if (timestamps.length >= this.maxRequests) {
                const oldest = timestamps[0];
                const waitMs = Math.max(0, this.windowMs - (now - oldest));
                return { allowed: false, waitMs, retryAfterMs: waitMs, reason: 'RPM_EXCEEDED' };
            }

            // Allowed: Record invocation
            timestamps.push(now);
            this._windows.set(key, timestamps);
            return { allowed: true, waitMs: 0, retryAfterMs: 0 };
        }

        /**
         * Record a source-signaled rate limit (e.g. HTTP 429 Retry-After)
         * @param {string} key
         * @param {number} retryAfterSeconds
         */
        recordRateLimitHit(key = 'global', retryAfterSeconds = 5) {
            const now = Date.now();
            const coolOffTime = now + (Math.max(1, retryAfterSeconds) * 1000);
            this._coolOffUntil.set(key, coolOffTime);
        }

        _getValidTimestamps(key, now) {
            const existing = this._windows.get(key) || [];
            const valid = existing.filter(t => now - t < this.windowMs);
            this._windows.set(key, valid);
            return valid;
        }

        reset(key = null) {
            if (key) {
                this._windows.delete(key);
                this._coolOffUntil.delete(key);
            } else {
                this._windows.clear();
                this._coolOffUntil.clear();
            }
        }
    }

    RateLimiter.RateLimiter = RateLimiter;
    const defaultLimiter = new RateLimiter();
    defaultLimiter.RateLimiter = RateLimiter;

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Integrations = window.UDIP.Integrations || {};
    window.UDIP.Integrations.RateLimiter = RateLimiter;
    window.UDIP.Integrations.defaultRateLimiter = defaultLimiter;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RateLimiter;
    }
})(typeof window !== 'undefined' ? window : global);
