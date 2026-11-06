/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/learning/insight-memory.js
 * ============================================================================
 * Manages an immutable, append-only historical memory of analytical insights
 * across dataset versions, tied directly to dataset fingerprints and timestamps.
 * 
 * Preserves historical evidence permanently for full epistemological auditability.
 * ============================================================================
 */

(function (window) {
    'use strict';

    // In-memory persistent registry of historical insight versions
    const _insightStore = [];

    const InsightMemory = {
        /**
         * Store current insights associated with a dataset fingerprint
         * 
         * @param {Array<Object>} insights
         * @param {string} datasetFingerprint
         * @returns {Array<Object>} Stored insight records
         */
        recordInsights(insights = [], datasetFingerprint = 'fp_initial') {
            if (!Array.isArray(insights)) return [];

            const timestamp = new Date().toISOString();
            const stored = [];

            insights.forEach((ins, idx) => {
                const insightId = ins.id || `INS-${String(idx + 1).padStart(3, '0')}`;
                
                // Find previous versions of this insight
                const previousVersions = _insightStore.filter(i => i.insightId === insightId || i.title === ins.title);
                const version = previousVersions.length + 1;

                const record = {
                    insightId,
                    version,
                    createdAt: timestamp,
                    datasetFingerprint,
                    title: ins.title || ins.observation || `Insight ${insightId}`,
                    category: ins.category || 'analytical',
                    finding: ins.finding || ins.observation || '',
                    interpretation: ins.interpretation || '',
                    implication: ins.implication || '',
                    evidence: ins.evidence || [],
                    confidence: ins.confidence != null ? ins.confidence : 75,
                    status: version === 1 ? 'NEW' : 'ACTIVE'
                };

                _insightStore.push(record);
                stored.push(record);
            });

            return stored;
        },

        /**
         * Retrieve all versions of a specific insight
         */
        getHistory(insightId) {
            return _insightStore.filter(i => i.insightId === insightId);
        },

        /**
         * Get latest versions across all distinct insights
         */
        getAllCurrent() {
            const latestMap = new Map();
            _insightStore.forEach(rec => {
                const existing = latestMap.get(rec.insightId);
                if (!existing || rec.version > existing.version) {
                    latestMap.set(rec.insightId, rec);
                }
            });
            return Array.from(latestMap.values());
        },

        /**
         * Return complete un-truncated historical log
         */
        getAllHistorical() {
            return [..._insightStore];
        },

        /**
         * Clear memory (for testing or complete workspace reset)
         */
        clear() {
            _insightStore.length = 0;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.InsightMemory = InsightMemory;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = InsightMemory;
    }
})(typeof window !== 'undefined' ? window : global);
