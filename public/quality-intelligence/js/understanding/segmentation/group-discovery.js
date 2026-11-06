/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/segmentation/group-discovery.js
 * ============================================================================
 * Discovers meaningful population segments and subgroups.
 * Evaluates size, central tendency, dispersion, anomaly concentration,
 * and statistical effect sizes (Cohen's d). Ranks by analytical relevance.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const GroupDiscovery = {
        /**
         * Discover population groups and compare their behavior
         * @param {Object} dataset - Raw dataset { rows }
         * @param {Object} profile - Profiler output
         * @returns {Array<Object>} Ranked list of high-relevance discovered groups
         */
        discoverGroups(dataset, profile) {
            const rows = Array.isArray(dataset?.rows) ? dataset.rows : [];
            const cols = profile?.columns || [];
            if (rows.length < 15 || cols.length < 2) return [];

            const catCols = cols.filter(c => {
                const type = c.detectedType || c.inferredType;
                const d = c.stats?.uniqueCount || c.stats?.distinctCount || 0;
                return (type === 'categorical' || type === 'string' || type === 'boolean') && d >= 2 && d <= 15;
            });

            const isNum = (c) => ['integer', 'decimal', 'numeric', 'float'].includes(c.detectedType) || 
                                 ['integer', 'decimal', 'numeric', 'float'].includes(c.inferredType) || 
                                 ['integer', 'decimal', 'numeric', 'float'].includes(c.subType);
            const numCols = cols.filter(isNum).map(c => c.name);
            if (catCols.length === 0 || numCols.length === 0) return [];

            const discoveredGroups = [];
            const primaryMetric = numCols[0];

            catCols.slice(0, 4).forEach(cat => {
                const groupMap = {};
                for (let i = 0; i < rows.length; i++) {
                    const gKey = String(rows[i][cat.name] || 'Missing');
                    if (!groupMap[gKey]) groupMap[gKey] = [];
                    const val = Number(rows[i][primaryMetric]);
                    if (Number.isFinite(val)) groupMap[gKey].push(val);
                }

                const keys = Object.keys(groupMap).filter(k => groupMap[k].length >= 5);
                if (keys.length >= 2) {
                    const groupStats = keys.map(k => {
                        const vals = groupMap[k];
                        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
                        const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length - 1 || 1);
                        const std = Math.sqrt(variance);
                        return {
                            groupKey: k,
                            count: vals.length,
                            sharePct: +((vals.length / rows.length * 100).toFixed(1)),
                            mean: +(mean.toFixed(2)),
                            std: +(std.toFixed(2))
                        };
                    });

                    // Compute maximum pairwise effect size (Cohen's d)
                    let maxD = 0;
                    for (let a = 0; a < groupStats.length; a++) {
                        for (let b = a + 1; b < groupStats.length; b++) {
                            const g1 = groupStats[a];
                            const g2 = groupStats[b];
                            const pooledStd = Math.sqrt((g1.std * g1.std + g2.std * g2.std) / 2) || 1;
                            const d = Math.abs(g1.mean - g2.mean) / pooledStd;
                            if (d > maxD) maxD = d;
                        }
                    }

                    let significance = 'negligible';
                    if (maxD >= 0.8) significance = 'large_effect';
                    else if (maxD >= 0.5) significance = 'medium_effect';
                    else if (maxD >= 0.2) significance = 'small_effect';

                    discoveredGroups.push({
                        dimension: cat.name,
                        targetMetric: primaryMetric,
                        segmentCount: keys.length,
                        segments: groupStats,
                        maxEffectSizeCohenD: +(maxD.toFixed(3)),
                        effectSignificance: significance,
                        relevanceScore: +(Math.min(1.0, maxD * 0.5 + (keys.length <= 6 ? 0.4 : 0.2)).toFixed(2)),
                        insight: `Population segmentation across "${cat.name}" reveals ${significance.replace('_', ' ')} variation in "${primaryMetric}" (Cohen's d = ${maxD.toFixed(2)}).`
                    });
                }
            });

            // Rank by analytical relevance
            discoveredGroups.sort((a, b) => b.relevanceScore - a.relevanceScore);
            return discoveredGroups;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.GroupDiscovery = GroupDiscovery;

})(typeof window !== 'undefined' ? window : global);
