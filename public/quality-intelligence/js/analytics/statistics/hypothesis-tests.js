/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/statistics/hypothesis-tests.js
 * ============================================================================
 * Implementations of core statistical hypothesis tests with exact/approximate p-values:
 * 1. Independent Two-Sample Welch's t-test
 * 2. Mann-Whitney U Test (Non-parametric two-group)
 * 3. One-Way ANOVA (F-test for k >= 3 groups)
 * 4. Kruskal-Wallis Test (Non-parametric k >= 3 groups)
 * 5. Pearson Correlation Test
 * 6. Spearman Rank Correlation Test
 * 7. Chi-Square Test of Independence
 * Completely browser-native, pure JavaScript, zero external dependencies.
 * ============================================================================
 */

(function (window) {
    'use strict';

    // -------------------------------------------------------------------------
    // Statistical Distribution Helpers (Normal, Student's t, Chi-square, F)
    // -------------------------------------------------------------------------

    function erf(x) {
        // Abramowitz and Stegun formula 7.1.26
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        const sign = x < 0 ? -1 : 1;
        const absX = Math.abs(x);
        const t = 1.0 / (1.0 + p * absX);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
        return sign * y;
    }

    function normalCdf(z) {
        return 0.5 * (1 + erf(z / Math.SQRT2));
    }

    function normalPValue(z) {
        return Math.max(0, Math.min(1, 2 * (1 - normalCdf(Math.abs(z)))));
    }

    function logGamma(x) {
        // Lanczos approximation
        const p = [
            676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059,
            12.507343278686905, -0.13857109583115812,
            9.9843695780195716e-6, 1.5056327351493116e-7
        ];
        let y = x;
        if (y < 0.5) return Math.PI / (Math.sin(Math.PI * y) * Math.exp(logGamma(1 - y)));
        y -= 1;
        let a = 0.99999999999980993;
        for (let i = 0; i < p.length; i++) {
            a += p[i] / (y + i + 1);
        }
        const t = y + p.length - 0.5;
        return 0.5 * Math.log(2 * Math.PI) + (y + 0.5) * Math.log(t) - t + Math.log(a);
    }

    function incompleteGamma(s, x) {
        if (x <= 0) return 0;
        let sum = 1.0 / s;
        let term = 1.0 / s;
        for (let n = 1; n < 100; n++) {
            term *= x / (s + n);
            sum += term;
            if (term < 1e-12) break;
        }
        return Math.pow(x, s) * Math.exp(-x) * sum;
    }

    function chiSquarePValue(chiSq, df) {
        if (chiSq <= 0 || df <= 0) return 1.0;
        const s = df / 2;
        const x = chiSq / 2;
        const regularizedLower = incompleteGamma(s, x) / Math.exp(logGamma(s));
        const p = 1.0 - Math.max(0, Math.min(1, regularizedLower));
        return Number(Math.max(0, Math.min(1, p)).toFixed(5));
    }

    function studentTPValue(t, df) {
        if (df <= 0) return 1.0;
        const absT = Math.abs(t);
        // For df >= 30, standard normal approximation is accurate within 0.005
        if (df >= 30) {
            return Number(normalPValue(absT).toFixed(5));
        }
        // Cornish-Fisher expansion / transformation to normal for small df
        const z = absT * (1 - 1 / (4 * df)) / Math.sqrt(1 + (absT * absT) / (2 * df));
        return Number(normalPValue(z).toFixed(5));
    }

    function fDistPValue(f, df1, df2) {
        if (f <= 0 || df1 <= 0 || df2 <= 0) return 1.0;
        // Paulson-approx for F distribution to standard normal
        const a = 2 / (9 * df1);
        const b = 2 / (9 * df2);
        const y = Math.pow(f, 1 / 3);
        const num = (1 - b) * y - (1 - a);
        const denom = Math.sqrt(b * y * y + a);
        if (denom <= 0) return 0.5;
        const z = num / denom;
        return Number(Math.max(0, Math.min(1, 1 - normalCdf(z))).toFixed(5));
    }

    // -------------------------------------------------------------------------
    // Hypothesis Tests
    // -------------------------------------------------------------------------

    const HypothesisTests = {
        /**
         * Welch's t-test for two independent samples (unequal variances)
         */
        welchTTest(g1, g2) {
            if (!Array.isArray(g1) || !Array.isArray(g2) || g1.length < 2 || g2.length < 2) {
                return { statistic: 0, pValue: 1.0, df: 0, valid: false, reason: 'Insufficient group sample sizes' };
            }

            const n1 = g1.length;
            const n2 = g2.length;
            const m1 = g1.reduce((a, b) => a + b, 0) / n1;
            const m2 = g2.reduce((a, b) => a + b, 0) / n2;

            let ss1 = 0, ss2 = 0;
            g1.forEach(v => { ss1 += (v - m1) * (v - m1); });
            g2.forEach(v => { ss2 += (v - m2) * (v - m2); });

            const s1Sq = ss1 / (n1 - 1);
            const s2Sq = ss2 / (n2 - 1);

            const v1 = s1Sq / n1;
            const v2 = s2Sq / n2;
            const se = Math.sqrt(v1 + v2);

            if (se <= 1e-12) {
                return { statistic: 0, pValue: 1.0, df: n1 + n2 - 2, valid: true };
            }

            const t = (m1 - m2) / se;
            // Welch-Satterthwaite df
            const dfNum = Math.pow(v1 + v2, 2);
            const dfDenom = (Math.pow(v1, 2) / (n1 - 1)) + (Math.pow(v2, 2) / (n2 - 1));
            const df = dfDenom > 0 ? Math.round(dfNum / dfDenom) : n1 + n2 - 2;

            const pValue = studentTPValue(t, df);

            return {
                test: "Welch's t-test",
                statistic: Number(t.toFixed(4)),
                pValue,
                df,
                valid: true
            };
        },

        /**
         * Mann-Whitney U test (Rank-sum test for 2 independent groups)
         */
        mannWhitneyU(g1, g2) {
            if (!Array.isArray(g1) || !Array.isArray(g2) || g1.length === 0 || g2.length === 0) {
                return { statistic: 0, pValue: 1.0, valid: false, reason: 'Empty group in Mann-Whitney test' };
            }

            const n1 = g1.length;
            const n2 = g2.length;

            // Combine and rank
            const combined = [];
            g1.forEach(v => combined.push({ val: v, group: 1 }));
            g2.forEach(v => combined.push({ val: v, group: 2 }));
            combined.sort((a, b) => a.val - b.val);

            // Assign fractional ranks for ties
            let i = 0;
            const N = combined.length;
            while (i < N) {
                let j = i;
                while (j < N - 1 && combined[j + 1].val === combined[j].val) {
                    j++;
                }
                const avgRank = (i + 1 + j + 1) / 2;
                for (let k = i; k <= j; k++) {
                    combined[k].rank = avgRank;
                }
                i = j + 1;
            }

            let rankSum1 = 0;
            combined.forEach(item => {
                if (item.group === 1) rankSum1 += item.rank;
            });

            const u1 = rankSum1 - (n1 * (n1 + 1)) / 2;
            const u2 = n1 * n2 - u1;
            const u = Math.min(u1, u2);

            // Normal approximation for p-value (standard when n1, n2 >= 5)
            const meanU = (n1 * n2) / 2;
            const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
            let z = 0;
            if (stdU > 0) {
                z = (u - meanU) / stdU;
            }

            const pValue = Number(normalPValue(z).toFixed(5));

            return {
                test: 'Mann-Whitney U',
                statistic: Number(u.toFixed(1)),
                zScore: Number(z.toFixed(4)),
                pValue,
                valid: true
            };
        },

        /**
         * One-Way ANOVA (k >= 3 groups)
         */
        oneWayAnova(groups) {
            if (!Array.isArray(groups) || groups.length < 2) {
                return { statistic: 0, pValue: 1.0, valid: false, reason: 'At least 2 groups required for ANOVA' };
            }

            const k = groups.length;
            let N = 0;
            let grandSum = 0;

            const groupStats = groups.map(g => {
                const n = g.length;
                N += n;
                const sum = g.reduce((a, b) => a + b, 0);
                grandSum += sum;
                return { n, sum, mean: n > 0 ? sum / n : 0 };
            });

            if (N <= k || k < 2) {
                return { statistic: 0, pValue: 1.0, valid: false, reason: 'Insufficient sample size for ANOVA' };
            }

            const grandMean = grandSum / N;

            let ssBetween = 0;
            let ssWithin = 0;

            groups.forEach((g, idx) => {
                const stat = groupStats[idx];
                ssBetween += stat.n * Math.pow(stat.mean - grandMean, 2);
                g.forEach(v => {
                    ssWithin += Math.pow(v - stat.mean, 2);
                });
            });

            const dfBetween = k - 1;
            const dfWithin = N - k;

            const msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0;
            const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;

            const f = msWithin > 1e-12 ? msBetween / msWithin : 0;
            const pValue = fDistPValue(f, dfBetween, dfWithin);

            return {
                test: 'One-Way ANOVA',
                statistic: Number(f.toFixed(4)),
                pValue,
                df1: dfBetween,
                df2: dfWithin,
                ssBetween: Number(ssBetween.toFixed(4)),
                ssTotal: Number((ssBetween + ssWithin).toFixed(4)),
                valid: true
            };
        },

        /**
         * Kruskal-Wallis non-parametric test for k >= 3 groups
         */
        kruskalWallis(groups) {
            if (!Array.isArray(groups) || groups.length < 2) {
                return { statistic: 0, pValue: 1.0, valid: false, reason: 'At least 2 groups required' };
            }

            const k = groups.length;
            const combined = [];
            let N = 0;

            groups.forEach((g, gIdx) => {
                g.forEach(v => {
                    combined.push({ val: v, group: gIdx });
                    N++;
                });
            });

            if (N <= k) {
                return { statistic: 0, pValue: 1.0, valid: false, reason: 'Insufficient sample size' };
            }

            combined.sort((a, b) => a.val - b.val);

            // Assign fractional ranks for ties
            let i = 0;
            while (i < N) {
                let j = i;
                while (j < N - 1 && combined[j + 1].val === combined[j].val) j++;
                const avgRank = (i + 1 + j + 1) / 2;
                for (let m = i; m <= j; m++) combined[m].rank = avgRank;
                i = j + 1;
            }

            const rankSums = Array(k).fill(0);
            const groupCounts = Array(k).fill(0);

            combined.forEach(item => {
                rankSums[item.group] += item.rank;
                groupCounts[item.group]++;
            });

            let sumRsqOverN = 0;
            for (let g = 0; g < k; g++) {
                if (groupCounts[g] > 0) {
                    sumRsqOverN += (rankSums[g] * rankSums[g]) / groupCounts[g];
                }
            }

            const H = (12 / (N * (N + 1))) * sumRsqOverN - 3 * (N + 1);
            const df = k - 1;
            const pValue = chiSquarePValue(Math.max(0, H), df);

            return {
                test: 'Kruskal-Wallis Test',
                statistic: Number(Math.max(0, H).toFixed(4)),
                pValue,
                df,
                valid: true
            };
        },

        /**
         * Pearson Correlation significance test
         */
        pearsonCorrelation(x, y) {
            if (!Array.isArray(x) || !Array.isArray(y) || x.length < 3 || y.length < 3) {
                return { correlation: 0, pValue: 1.0, valid: false };
            }

            const n = Math.min(x.length, y.length);
            const PUtils = window.UDIP && window.UDIP.ProfilerUtils;
            const r = PUtils ? PUtils.pearsonCorrelation(x.slice(0, n), y.slice(0, n)) : 0;

            const df = n - 2;
            let t = 0;
            if (Math.abs(r) < 0.99999 && df > 0) {
                t = r * Math.sqrt(df / (1 - r * r));
            } else {
                t = 999;
            }

            const pValue = studentTPValue(t, df);

            return {
                test: 'Pearson Correlation',
                correlation: Number(r.toFixed(4)),
                statistic: Number(t.toFixed(4)),
                pValue,
                df,
                valid: true
            };
        },

        /**
         * Spearman Rank Correlation
         */
        spearmanCorrelation(x, y) {
            if (!Array.isArray(x) || !Array.isArray(y) || x.length < 3 || y.length < 3) {
                return { correlation: 0, pValue: 1.0, valid: false };
            }

            const n = Math.min(x.length, y.length);
            const rank = arr => {
                const indexed = arr.map((v, idx) => ({ v, idx })).sort((a, b) => a.v - b.v);
                const ranks = Array(arr.length);
                let i = 0;
                while (i < indexed.length) {
                    let j = i;
                    while (j < indexed.length - 1 && indexed[j + 1].v === indexed[j].v) j++;
                    const avgRank = (i + 1 + j + 1) / 2;
                    for (let k = i; k <= j; k++) ranks[indexed[k].idx] = avgRank;
                    i = j + 1;
                }
                return ranks;
            };

            const rx = rank(x.slice(0, n));
            const ry = rank(y.slice(0, n));

            return this.pearsonCorrelation(rx, ry);
        },

        /**
         * Chi-Square Test of Independence on a 2D contingency table
         */
        chiSquareTest(contingencyTable) {
            if (!Array.isArray(contingencyTable) || contingencyTable.length < 2 || !Array.isArray(contingencyTable[0]) || contingencyTable[0].length < 2) {
                return { statistic: 0, pValue: 1.0, df: 0, valid: false, reason: 'At least 2x2 contingency table required' };
            }

            const r = contingencyTable.length;
            const c = contingencyTable[0].length;

            const rowSums = Array(r).fill(0);
            const colSums = Array(c).fill(0);
            let grandTotal = 0;

            for (let i = 0; i < r; i++) {
                for (let j = 0; j < c; j++) {
                    const count = contingencyTable[i][j] || 0;
                    rowSums[i] += count;
                    colSums[j] += count;
                    grandTotal += count;
                }
            }

            if (grandTotal === 0) {
                return { statistic: 0, pValue: 1.0, df: (r - 1) * (c - 1), valid: false, reason: 'Empty contingency table' };
            }

            let chiSq = 0;
            for (let i = 0; i < r; i++) {
                for (let j = 0; j < c; j++) {
                    const expected = (rowSums[i] * colSums[j]) / grandTotal;
                    if (expected > 0) {
                        const observed = contingencyTable[i][j] || 0;
                        chiSq += Math.pow(observed - expected, 2) / expected;
                    }
                }
            }

            const df = (r - 1) * (c - 1);
            const pValue = chiSquarePValue(chiSq, df);

            return {
                test: 'Chi-Square Test of Independence',
                statistic: Number(chiSq.toFixed(4)),
                pValue,
                df,
                grandTotal,
                valid: true
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.HypothesisTests = HypothesisTests;

})(typeof window !== 'undefined' ? window : global);
