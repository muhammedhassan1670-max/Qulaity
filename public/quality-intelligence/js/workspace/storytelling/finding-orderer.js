/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: workspace/storytelling/finding-orderer.js
 * ============================================================================
 * Multi-Criteria Finding Ranker & Analytical Diversity Optimizer.
 * 
 * Scores and orders findings according to:
 * - Evidence Strength (30%)
 * - Operational & Analytical Impact (30%)
 * - Statistical Confidence (20%)
 * - Change / Anomaly Magnitude (10%)
 * - Decision Actionability (10%)
 * 
 * Applies categorical diversity interleaving to avoid clustering identical
 * finding types in the top executive sequence.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const FindingOrderer = {
        /**
         * Rank and diversify a collection of synthesized findings
         * 
         * @param {Array<Object>} findings
         * @param {Object} options
         * @param {number} [options.limit]
         * @returns {Array<Object>} Deterministically ranked findings
         */
        rankFindings(findings = [], { limit = null } = {}) {
            if (!Array.isArray(findings) || findings.length === 0) return [];

            // 1. Compute multi-criteria score for each finding
            const scored = findings.map(f => {
                const evidenceStrength = this._evalEvidenceStrength(f);
                const impact = Number.isFinite(f.importance) ? f.importance : 60;
                const confidence = Number.isFinite(f.confidence) ? f.confidence : 70;
                const changeMag = f.category === 'shift' || f.category === 'risk' ? 80 : 40;
                const actionability = f.action ? 85 : 45;

                const score = (evidenceStrength * 0.30) +
                              (impact * 0.30) +
                              (confidence * 0.20) +
                              (changeMag * 0.10) +
                              (actionability * 0.10);

                return {
                    ...f,
                    compositeRankScore: Number(score.toFixed(2)),
                    criteriaScores: {
                        evidenceStrength,
                        impact,
                        confidence,
                        changeMagnitude: changeMag,
                        actionability
                    }
                };
            });

            // 2. Initial Sort by composite score descending
            scored.sort((a, b) => b.compositeRankScore - a.compositeRankScore);

            // 3. Apply Diversity Interleaving
            const diversified = this._applyDiversityInterleaving(scored);

            return limit ? diversified.slice(0, limit) : diversified;
        },

        /**
         * Evaluate quantitative evidence strength of a finding
         * @private
         */
        _evalEvidenceStrength(finding) {
            const sources = finding.evidenceSources || [];
            if (sources.length === 0) return 50;

            let strength = 60 + (sources.length * 10);
            return Math.min(100, strength);
        },

        /**
         * Interleave categories to maintain broad analytical perspective
         * @private
         */
        _applyDiversityInterleaving(sorted) {
            if (sorted.length <= 2) return sorted;

            const categoryBuckets = {};
            sorted.forEach(f => {
                const cat = f.category || 'other';
                if (!categoryBuckets[cat]) categoryBuckets[cat] = [];
                categoryBuckets[cat].push(f);
            });

            const result = [];
            const categories = Object.keys(categoryBuckets);
            let addedCount = 0;

            while (addedCount < sorted.length) {
                let roundAdded = 0;
                categories.forEach(cat => {
                    const bucket = categoryBuckets[cat];
                    if (bucket.length > 0) {
                        result.push(bucket.shift());
                        addedCount++;
                        roundAdded++;
                    }
                });
                if (roundAdded === 0) break;
            }

            return result;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.FindingOrderer = FindingOrderer;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FindingOrderer;
    }
})(typeof window !== 'undefined' ? window : global);
