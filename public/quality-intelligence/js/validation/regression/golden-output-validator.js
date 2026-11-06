/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/regression/golden-output-validator.js
 * ============================================================================
 * Golden Output Regression Validator:
 * Normalizes analytical outputs by filtering out ephemeral attributes:
 * - Timestamps (e.g. loadedAt, createdAt)
 * - Randomly generated IDs (e.g. ds_12345, trc_9876)
 * - Machine-specific memory byte strings
 * Performs deep semantic comparison against established golden reference baselines.
 * ============================================================================
 */

(function (window) {
    'use strict';

    /**
     * Recursively normalize object by stripping variable runtime properties
     */
    function normalizeOutput(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) {
            return obj.map(item => normalizeOutput(item));
        }

        const normalized = {};
        const volatileKeys = ['timestamp', 'loadedAt', 'createdAt', 'updatedAt', 'startTime', 'durationMs', 'executionTimeMs', 'id', 'traceId'];

        for (const [k, v] of Object.entries(obj)) {
            if (volatileKeys.includes(k)) {
                // Replace volatile ID or timestamp with stable token
                normalized[k] = `<NORMALIZED_${k.toUpperCase()}>`;
            } else if (typeof v === 'number' && !isNaN(v)) {
                // Round floating points to 4 decimal places for stable tolerance
                normalized[k] = Number(v.toFixed(4));
            } else if (typeof v === 'object') {
                normalized[k] = normalizeOutput(v);
            } else {
                normalized[k] = v;
            }
        }

        return normalized;
    }

    const GoldenOutputValidator = {
        /**
         * Compare current analytical output against a golden snapshot
         * @param {Object} currentOutput
         * @param {Object} goldenSnapshot
         * @returns {Object} { matches: boolean, diffs: Array }
         */
        compareWithGolden(currentOutput, goldenSnapshot) {
            const normCurrent = normalizeOutput(currentOutput);
            const normGolden = normalizeOutput(goldenSnapshot);

            const strCurrent = JSON.stringify(normCurrent);
            const strGolden = JSON.stringify(normGolden);

            const matches = strCurrent === strGolden;
            const diffs = [];

            if (!matches) {
                // Identify top-level mismatched keys
                const currentKeys = Object.keys(normCurrent || {});
                const goldenKeys = Object.keys(normGolden || {});

                goldenKeys.forEach(k => {
                    if (!(k in normCurrent)) {
                        diffs.push({ key: k, type: 'MISSING_KEY_IN_CURRENT' });
                    } else if (JSON.stringify(normCurrent[k]) !== JSON.stringify(normGolden[k])) {
                        diffs.push({ key: k, type: 'VALUE_MISMATCH' });
                    }
                });

                currentKeys.forEach(k => {
                    if (!(k in normGolden)) {
                        diffs.push({ key: k, type: 'EXTRA_KEY_IN_CURRENT' });
                    }
                });
            }

            return {
                matches,
                diffCount: diffs.length,
                diffs,
                normalizedCurrent: normCurrent,
                normalizedGolden: normGolden
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.GoldenOutputValidator = GoldenOutputValidator;

})(typeof window !== 'undefined' ? window : global);
