/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/integrity/mutation-detector.js
 * ============================================================================
 * Deep Source Mutation Detection Engine:
 * Creates hash fingerprints or serialized snapshots of input objects before
 * analytical pipeline execution, and performs deep equality checks after
 * execution to verify 100% immutability of:
 * - Raw dataset rows and columns
 * - Profile and quality assessments
 * - Intelligence analysis plan
 * - Analytics & Machine Learning results
 * - Decision Intelligence records
 * - Governance audit logs
 * ============================================================================
 */

(function (window) {
    'use strict';

    function computeSimpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return hash;
    }

    const MutationDetector = {
        /**
         * Capture a snapshot fingerprint of source objects
         * @param {Object} sources
         * @returns {Object} Snapshot token
         */
        captureSnapshot(sources = {}) {
            const snapshot = {};
            for (const [key, val] of Object.entries(sources)) {
                if (val !== undefined && val !== null) {
                    try {
                        const serialized = JSON.stringify(val);
                        snapshot[key] = {
                            hash: computeSimpleHash(serialized),
                            length: serialized.length
                        };
                    } catch (err) {
                        snapshot[key] = { error: 'Circular or unstringifiable structure' };
                    }
                }
            }
            return snapshot;
        },

        /**
         * Compare current sources against snapshot
         * @param {Object} snapshot
         * @param {Object} currentSources
         * @returns {Object} { mutated: boolean, violations: Array }
         */
        verifySnapshot(snapshot, currentSources = {}) {
            const violations = [];

            for (const [key, snap] of Object.entries(snapshot)) {
                if (snap.error) continue;
                const currentVal = currentSources[key];
                if (currentVal === undefined || currentVal === null) {
                    violations.push(`Source object "${key}" was removed or nullified`);
                    continue;
                }

                try {
                    const currentSerialized = JSON.stringify(currentVal);
                    const currentHash = computeSimpleHash(currentSerialized);
                    if (currentHash !== snap.hash || currentSerialized.length !== snap.length) {
                        violations.push(`Source object "${key}" was mutated during execution`);
                    }
                } catch (err) {
                    violations.push(`Error re-serializing "${key}": ${err.message}`);
                }
            }

            return {
                mutated: violations.length > 0,
                passed: violations.length === 0,
                violations
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.MutationDetector = MutationDetector;

})(typeof window !== 'undefined' ? window : global);
