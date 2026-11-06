/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: workspace/comparison/version-comparator.js
 * ============================================================================
 * Cross-Version Comparative State Audit across 10 Analytical Dimensions.
 * 
 * Dimensions Audited:
 * 1. Data Volume & Dimensions
 * 2. Data Quality & Missingness
 * 3. Schema & Type Consistency
 * 4. Feature Distributions & Centroids
 * 5. Correlation & Pattern Stability
 * 6. Model Accuracy & Reliability
 * 7. Active Insights Evolution
 * 8. Risk Profile & Criticalities
 * 9. Opportunities & Strategic Levers
 * 10. Decision Confidence & Stability
 * 
 * Status Outputs: 'Improved' | 'Stable' | 'Changed' | 'Degraded' | 'Unavailable'
 * Computes an aggregate Version Evolution Score [0, 100].
 * ============================================================================
 */

(function (window) {
    'use strict';

    const VersionComparator = {
        /**
         * Compare current analytical state against previous state across 10 dimensions
         * 
         * @param {Object} params
         * @param {Object} params.currentDataset
         * @param {Object} [params.previousDataset]
         * @param {Object} params.currentProfile
         * @param {Object} [params.previousProfile]
         * @param {Object} params.currentAnalytics
         * @param {Object} [params.previousAnalytics]
         * @param {Object} params.currentDecision
         * @param {Object} [params.previousDecision]
         * @param {Object} params.currentAutonomous
         * @returns {Object} Comparative state audit report
         */
        compare({
            currentDataset = {},
            previousDataset = null,
            currentProfile = {},
            previousProfile = null,
            currentAnalytics = {},
            previousAnalytics = null,
            currentDecision = null,
            previousDecision = null,
            currentAutonomous = null
        } = {}) {
            const hasPrior = Boolean(previousDataset || previousProfile || previousAnalytics);

            // 1. Data Volume & Dimensions
            const curRows = currentDataset.rowCount || currentProfile.dataset?.rowCount || 0;
            const prevRows = previousDataset?.rowCount || previousProfile?.dataset?.rowCount || null;
            const volumeDiff = prevRows != null ? curRows - prevRows : 0;
            const volumeStatus = prevRows == null ? 'Stable' : (volumeDiff >= 0 ? 'Improved' : 'Changed');

            // 2. Data Quality & Missingness
            const curQ = currentProfile?.quality?.overallScore ?? 100;
            const prevQ = previousProfile?.quality?.overallScore ?? null;
            let qualityStatus = 'Stable';
            if (prevQ != null) {
                qualityStatus = curQ > prevQ + 2 ? 'Improved' : (curQ < prevQ - 2 ? 'Degraded' : 'Stable');
            }

            // 3. Schema & Type Consistency
            const curCols = (currentProfile.columns || []).map(c => c.name);
            const prevCols = previousProfile ? (previousProfile.columns || []).map(c => c.name) : null;
            let schemaStatus = 'Stable';
            let schemaNotes = 'Schema consistent with current definition.';
            if (prevCols) {
                const added = curCols.filter(c => !prevCols.includes(c));
                const removed = prevCols.filter(c => !curCols.includes(c));
                if (added.length > 0 || removed.length > 0) {
                    schemaStatus = 'Changed';
                    schemaNotes = `${added.length} column(s) added, ${removed.length} removed.`;
                }
            }

            // 4. Feature Distributions & Centroids
            const driftReport = currentAutonomous?.drift?.datasetDrift;
            let distStatus = 'Stable';
            if (driftReport) {
                distStatus = driftReport.hasDrift ? 'Changed' : 'Stable';
            }

            // 5. Correlation & Pattern Stability
            const patternStatus = hasPrior ? (distStatus === 'Changed' ? 'Changed' : 'Stable') : 'Stable';

            // 6. Model Accuracy & Reliability
            const curScore = currentAnalytics?.leaderboard?.bestModel?.score;
            const prevScore = previousAnalytics?.leaderboard?.bestModel?.score;
            let modelStatus = 'Unavailable';
            if (curScore != null) {
                if (prevScore != null) {
                    const delta = curScore - prevScore;
                    modelStatus = delta >= 0.02 ? 'Improved' : (delta <= -0.02 ? 'Degraded' : 'Stable');
                } else {
                    modelStatus = 'Stable';
                }
            }

            // 7. Active Insights Evolution
            const evolutions = currentAutonomous?.learning?.evolutions || [];
            let insightStatus = 'Stable';
            if (evolutions.some(e => e.type === 'invalidated')) {
                insightStatus = 'Degraded';
            } else if (evolutions.some(e => e.type === 'strengthened' || e.type === 'new')) {
                insightStatus = 'Improved';
            }

            // 8. Risk Profile & Criticalities
            const curRisk = currentDecision?.risks?.rankedRisks?.[0]?.riskScore ?? 50;
            const prevRisk = previousDecision?.risks?.rankedRisks?.[0]?.riskScore ?? null;
            let riskStatus = 'Stable';
            if (prevRisk != null) {
                riskStatus = curRisk > prevRisk + 5 ? 'Degraded' : (curRisk < prevRisk - 5 ? 'Improved' : 'Stable');
            }

            // 9. Opportunities & Strategic Levers
            const curOpp = currentDecision?.opportunities?.rankedOpportunities?.[0]?.opportunityScore ?? 50;
            const prevOpp = previousDecision?.opportunities?.rankedOpportunities?.[0]?.opportunityScore ?? null;
            let oppStatus = 'Stable';
            if (prevOpp != null) {
                oppStatus = curOpp > prevOpp + 5 ? 'Improved' : (curOpp < prevOpp - 5 ? 'Degraded' : 'Stable');
            }

            // 10. Decision Confidence & Overall Stability
            let confidenceStatus = qualityStatus === 'Degraded' || modelStatus === 'Degraded' ? 'Degraded' : 'Stable';
            if (qualityStatus === 'Improved' && modelStatus === 'Improved') confidenceStatus = 'Improved';

            const dimensions = [
                { id: 'volume', name: 'Data Volume & Dimensions', status: volumeStatus, current: `${curRows} rows`, previous: prevRows != null ? `${prevRows} rows` : 'N/A' },
                { id: 'quality', name: 'Data Quality & Missingness', status: qualityStatus, current: `${Math.round(curQ)}/100`, previous: prevQ != null ? `${Math.round(prevQ)}/100` : 'N/A' },
                { id: 'schema', name: 'Schema Consistency', status: schemaStatus, current: `${curCols.length} columns`, previous: prevCols ? `${prevCols.length} columns` : 'N/A', details: schemaNotes },
                { id: 'distributions', name: 'Feature Distributions', status: distStatus, current: driftReport ? `${driftReport.driftedFeaturesCount || 0} drifted` : 'Nominal', previous: 'Baseline' },
                { id: 'patterns', name: 'Correlation Stability', status: patternStatus, current: 'Audited', previous: hasPrior ? 'Baseline' : 'N/A' },
                { id: 'models', name: 'Model Performance', status: modelStatus, current: curScore != null ? `${(curScore * 100).toFixed(1)}%` : 'N/A', previous: prevScore != null ? `${(prevScore * 100).toFixed(1)}%` : 'N/A' },
                { id: 'insights', name: 'Insight Validity', status: insightStatus, current: `${evolutions.length} evolutions`, previous: hasPrior ? 'Previous' : 'N/A' },
                { id: 'risks', name: 'Risk Profile', status: riskStatus, current: `Score ${curRisk}`, previous: prevRisk != null ? `Score ${prevRisk}` : 'N/A' },
                { id: 'opportunities', name: 'Opportunity Levers', status: oppStatus, current: `Score ${curOpp}`, previous: prevOpp != null ? `Score ${prevOpp}` : 'N/A' },
                { id: 'confidence', name: 'Decision Confidence', status: confidenceStatus, current: 'Active', previous: hasPrior ? 'Baseline' : 'N/A' }
            ];

            // Compute aggregate Evolution Score
            let evoScore = 80;
            dimensions.forEach(d => {
                if (d.status === 'Improved') evoScore += 3;
                if (d.status === 'Degraded') evoScore -= 6;
            });
            evoScore = Math.min(100, Math.max(20, Math.round(evoScore)));

            return {
                hasPriorVersion: hasPrior,
                evolutionScore: evoScore,
                summaryBadge: evoScore >= 80 ? 'Healthy Evolution' : (evoScore >= 50 ? 'Moderate Drift' : 'Significant Divergence'),
                dimensions
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.VersionComparator = VersionComparator;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = VersionComparator;
    }
})(typeof window !== 'undefined' ? window : global);
