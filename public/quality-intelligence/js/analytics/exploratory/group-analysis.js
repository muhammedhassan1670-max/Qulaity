/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/exploratory/group-analysis.js
 * ============================================================================
 * Performs Categorical -> Numeric comparative analysis across categories:
 * - Group counts, means, medians, standard deviations, relative differences
 * - Strictly non-causal language ("associated with", "shows a difference")
 * Completely domain-agnostic and robust to empty/single categories.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const GroupAnalysis = {
        /**
         * Analyze numeric metric across categories of a grouping column
         * 
         * @param {Array<Object>} rows Raw dataset rows
         * @param {string} catCol Categorical grouping column
         * @param {string} numCol Numeric metric column
         * @returns {Object} Group comparison results
         */
        compareGroups(rows, catCol, numCol) {
            const emptyResult = {
                categoryColumn: catCol,
                numericColumn: numCol,
                groups: [],
                groupCount: 0,
                maxMeanGroup: null,
                minMeanGroup: null,
                relativeDifferencePct: 0,
                interpretation: 'Insufficient data for group comparison'
            };

            if (!Array.isArray(rows) || rows.length === 0 || !catCol || !numCol) {
                return emptyResult;
            }

            const PUtils = window.UDIP && window.UDIP.ProfilerUtils;
            const groupsMap = {};

            rows.forEach(r => {
                if (!r) return;
                const catVal = String(r[catCol] !== null && r[catCol] !== undefined ? r[catCol] : '').trim();
                const numVal = Number(r[numCol]);

                if (catVal !== '' && Number.isFinite(numVal)) {
                    if (!groupsMap[catVal]) groupsMap[catVal] = [];
                    groupsMap[catVal].push(numVal);
                }
            });

            const catKeys = Object.keys(groupsMap);
            if (catKeys.length < 2) {
                return {
                    ...emptyResult,
                    groupCount: catKeys.length,
                    interpretation: 'At least 2 distinct categories are required for comparison'
                };
            }

            const groups = catKeys.map(cat => {
                const vals = groupsMap[cat].sort((a, b) => a - b);
                const n = vals.length;
                const mean = PUtils ? PUtils.mean(vals) : vals.reduce((a, b) => a + b, 0) / n;
                const stdDev = PUtils ? PUtils.stdDev(vals, mean) : 0;
                const median = PUtils ? PUtils.quartiles(vals).median : vals[Math.floor(n / 2)];

                return {
                    category: cat,
                    count: n,
                    mean: Number(mean.toFixed(4)),
                    median: Number(median.toFixed(4)),
                    stdDev: Number(stdDev.toFixed(4))
                };
            }).sort((a, b) => b.mean - a.mean);

            const maxGroup = groups[0];
            const minGroup = groups[groups.length - 1];

            let relativeDiffPct = 0;
            if (Math.abs(minGroup.mean) > 1e-6) {
                relativeDiffPct = Number((((maxGroup.mean - minGroup.mean) / Math.abs(minGroup.mean)) * 100).toFixed(1));
            } else if (maxGroup.mean !== minGroup.mean) {
                relativeDiffPct = 100.0;
            }

            const interpretation = `Categories in "${catCol}" show variation in average "${numCol}". Group "${maxGroup.category}" exhibits the highest average (${maxGroup.mean}), while "${minGroup.category}" exhibits the lowest average (${minGroup.mean}), representing an observational difference of ${relativeDiffPct}%.`;

            return {
                categoryColumn: catCol,
                numericColumn: numCol,
                groups,
                groupCount: groups.length,
                maxMeanGroup: maxGroup.category,
                minMeanGroup: minGroup.category,
                relativeDifferencePct: relativeDiffPct,
                interpretation
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.GroupAnalysis = GroupAnalysis;

})(typeof window !== 'undefined' ? window : global);
