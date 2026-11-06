/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/learning/insight-evolution.js
 * ============================================================================
 * Tracks the temporal evolution of insights across dataset versions.
 * 
 * Classifies insight state transitions into:
 * - CONFIRMED    (Pattern holds with equivalent evidence)
 * - STRENGTHENED (Effect size / confidence / statistical significance increased)
 * - WEAKENED     (Evidence support eroded or shifted toward non-significance)
 * - CHANGED      (Direction or dominant dimension shifted materially)
 * - INVALIDATED  (Evidence explicitly refutes previous claim)
 * - NEW          (Novel pattern discovered in current version)
 * 
 * Generates transparent lineage:
 * Previous Evidence → Current Evidence → What Changed → New Status
 * ============================================================================
 */

(function (window) {
    'use strict';

    const InsightEvolution = {
        /**
         * Compare current insights against historical baseline insights
         * 
         * @param {Object} params
         * @param {Array<Object>} params.currentInsights
         * @param {Array<Object>} params.historicalInsights
         * @param {Object} params.driftAnalysis
         * @param {Object} params.qualityMonitoring
         * @returns {Array<Object>} Evaluated Insight Evolutions
         */
        evolve({
            currentInsights = [],
            historicalInsights = [],
            driftAnalysis = {},
            qualityMonitoring = {}
        } = {}) {
            const evolutions = [];

            // If no historical insights, all current insights are NEW
            if (!Array.isArray(historicalInsights) || historicalInsights.length === 0) {
                return currentInsights.map(ins => ({
                    insightId: ins.id || ins.insightId || 'INS-001',
                    title: ins.title || ins.observation || 'Analytical Insight',
                    status: 'NEW',
                    previousEvidence: 'No previous historical baseline version.',
                    currentEvidence: ins.finding || ins.interpretation || 'Empirical finding established.',
                    whatChanged: 'Novel pattern detected upon initial ingestion.',
                    confidence: ins.confidence || 75,
                    confidenceDelta: 0,
                    lineage: 'Baseline Ingestion → NEW'
                }));
            }

            // Map previous insights by title / key subject for matching
            const prevMap = new Map();
            historicalInsights.forEach(hi => {
                const key = (hi.title || hi.finding || hi.insightId || '').toLowerCase().trim();
                if (key) prevMap.set(key, hi);
            });

            // 1. Evaluate current insights against previous matches
            currentInsights.forEach(curr => {
                const currKey = (curr.title || curr.finding || curr.id || '').toLowerCase().trim();
                const matchedPrev = prevMap.get(currKey) || historicalInsights.find(h => h.insightId === curr.id);

                if (!matchedPrev) {
                    // Novel insight
                    evolutions.push({
                        insightId: curr.id || 'INS-NEW',
                        title: curr.title || curr.observation || 'Analytical Insight',
                        status: 'NEW',
                        previousEvidence: 'Absent in previous dataset version.',
                        currentEvidence: curr.finding || curr.interpretation || 'Empirical observation established.',
                        whatChanged: 'Previously unseen pattern surfaced in current data partition.',
                        confidence: curr.confidence || 75,
                        confidenceDelta: 0,
                        lineage: 'Novel Discovery → NEW'
                    });
                } else {
                    // Match found: evaluate evidence shift
                    const prevConf = matchedPrev.confidence != null ? matchedPrev.confidence : 75;
                    const currConf = curr.confidence != null ? curr.confidence : 75;
                    const confDelta = currConf - prevConf;

                    let status = 'CONFIRMED';
                    let whatChanged = 'Finding remains empirically supported across updates.';

                    // Check if concept drift invalidated this insight's relationship
                    const cd = driftAnalysis?.conceptDrift || {};
                    const isAffectedByDrift = cd.detected && (cd.correlationShifts || []).some(cs => currKey.includes(cs.pair.toLowerCase()));

                    if (isAffectedByDrift) {
                        status = 'INVALIDATED';
                        whatChanged = 'Underlying feature-target correlation shifted significantly; finding is no longer empirically supported.';
                    } else if (confDelta >= 10) {
                        status = 'STRENGTHENED';
                        whatChanged = `Confidence increased by +${confDelta}% with stronger statistical evidence.`;
                    } else if (confDelta <= -15 || qualityMonitoring?.scoreDelta <= -15) {
                        status = 'WEAKENED';
                        whatChanged = `Evidence weakened (confidence delta: ${confDelta}%); data quality degradation increases uncertainty.`;
                    } else if (Math.abs(confDelta) >= 5) {
                        status = 'CHANGED';
                        whatChanged = `Marginal metric shift observed (confidence delta: ${confDelta > 0 ? '+' : ''}${confDelta}%).`;
                    }

                    evolutions.push({
                        insightId: curr.id || matchedPrev.insightId,
                        title: curr.title || matchedPrev.title,
                        status,
                        previousEvidence: matchedPrev.finding || matchedPrev.interpretation || 'Historical finding.',
                        currentEvidence: curr.finding || curr.interpretation || 'Current finding.',
                        whatChanged,
                        confidence: currConf,
                        confidenceDelta: confDelta,
                        lineage: `${matchedPrev.status || 'ACTIVE'} → ${status}`
                    });

                    // Remove from map to track any orphaned previous insights
                    prevMap.delete(currKey);
                }
            });

            // 2. Any remaining previous insights that disappeared in current version are INVALIDATED or SUPERSEDED
            prevMap.forEach((prevItem) => {
                evolutions.push({
                    insightId: prevItem.insightId,
                    title: prevItem.title,
                    status: 'INVALIDATED',
                    previousEvidence: prevItem.finding || prevItem.interpretation || 'Historical finding.',
                    currentEvidence: 'Pattern no longer manifested in current dataset.',
                    whatChanged: 'Hypothesis/pattern failed to replicate in latest data update.',
                    confidence: 20,
                    confidenceDelta: -50,
                    lineage: `${prevItem.status || 'ACTIVE'} → INVALIDATED`
                });
            });

            return evolutions;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.InsightEvolution = InsightEvolution;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = InsightEvolution;
    }
})(typeof window !== 'undefined' ? window : global);
