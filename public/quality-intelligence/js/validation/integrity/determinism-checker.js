/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/integrity/determinism-checker.js
 * ============================================================================
 * Determinism & Repeatability Checker:
 * Runs analytical algorithms multiple times over identical inputs to verify
 * exact numerical repeatability or measure stochastic variance.
 * Identifies and flags non-deterministic or seed-dependent operations.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DeterminismChecker = {
        /**
         * Check determinism of an analytical function across multiple runs
         * @param {Function} taskFn (input) => result
         * @param {Object} input
         * @param {number} runs
         * @returns {Object}
         */
        checkDeterminism(taskFn, input, runs = 3) {
            const runResults = [];

            for (let i = 0; i < runs; i++) {
                try {
                    const res = taskFn(input);
                    runResults.push(JSON.stringify(res));
                } catch (err) {
                    return {
                        isDeterministic: false,
                        error: `Run #${i + 1} threw error: ${err.message}`,
                        runsCompleted: i
                    };
                }
            }

            // Compare all runs against run 0
            const base = runResults[0];
            let allMatch = true;
            for (let i = 1; i < runResults.length; i++) {
                if (runResults[i] !== base) {
                    allMatch = false;
                    break;
                }
            }

            return {
                isDeterministic: allMatch,
                classification: allMatch ? 'Fully Deterministic' : 'Non-Deterministic / Stochastic Component',
                runsEvaluated: runs,
                passed: allMatch
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.DeterminismChecker = DeterminismChecker;

})(typeof window !== 'undefined' ? window : global);
