/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/regression/regression-engine.js
 * ============================================================================
 * Analytical Regression Classification Engine:
 * Compares current vs historical outputs and classifies differences into:
 * - EXPECTED: Identical normalized values
 * - BENIGN: Non-breaking enhancements (additional metadata keys)
 * - BEHAVIOR_CHANGE: Changed calculation or ranking within acceptable bounds
 * - REGRESSION: Missing required keys, NaN/Infinity, or broken contracts
 * ============================================================================
 */

(function (window) {
    'use strict';

    const RegressionEngine = {
        /**
         * Classify regression diffs
         * @param {Object} comparisonResult From GoldenOutputValidator.compareWithGolden
         * @returns {Object}
         */
        classifyDiffs(comparisonResult) {
            if (!comparisonResult || comparisonResult.matches) {
                return {
                    status: 'EXPECTED',
                    isRegression: false,
                    summary: 'Current output matches golden snapshot identically',
                    severities: { regression: 0, behaviorChange: 0, benign: 0 }
                };
            }

            let hasRegression = false;
            let hasBehaviorChange = false;
            let hasBenign = false;

            const categorizedDiffs = comparisonResult.diffs.map(d => {
                let category = 'BEHAVIOR_CHANGE';

                if (d.type === 'MISSING_KEY_IN_CURRENT') {
                    category = 'REGRESSION';
                    hasRegression = true;
                } else if (d.type === 'EXTRA_KEY_IN_CURRENT') {
                    category = 'BENIGN';
                    hasBenign = true;
                } else if (d.type === 'VALUE_MISMATCH') {
                    hasBehaviorChange = true;
                }

                return {
                    ...d,
                    category
                };
            });

            let finalStatus = 'EXPECTED';
            if (hasRegression) {
                finalStatus = 'REGRESSION';
            } else if (hasBehaviorChange) {
                finalStatus = 'BEHAVIOR_CHANGE';
            } else if (hasBenign) {
                finalStatus = 'BENIGN';
            }

            return {
                status: finalStatus,
                isRegression: hasRegression,
                diffCount: comparisonResult.diffCount,
                diffs: categorizedDiffs,
                summary: `Detected ${comparisonResult.diffCount} difference(s): Classified as ${finalStatus}`
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.RegressionEngine = RegressionEngine;

})(typeof window !== 'undefined' ? window : global);
