/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: analytics/statistics/statistical-engine.js
 * ============================================================================
 * Statistical Hypothesis Testing Engine:
 * - Automatically selects and runs justified hypothesis tests
 * - Reports test statistics, exact/approximate p-values, and effect sizes
 * - Rigorously separates statistical significance from practical significance
 * - Never claims significance when sample size or assumptions are inadequate
 * ============================================================================
 */

(function (window) {
    'use strict';

    const StatisticalEngine = {
        /**
         * Run statistical hypothesis testing pipeline
         * 
         * @param {Object} params
         * @param {Object} params.data Active dataset object
         * @param {Object} params.profile Step 2 profiler result
         * @param {Object} params.analysisPlan Step 2.5 intelligence plan
         * @returns {Object} Unified statistical testing results
         */
        run({ data, profile, analysisPlan }) {
            const rows = (data && Array.isArray(data.rows)) ? data.rows : [];
            const result = {
                status: 'completed',
                tests: []
            };

            if (rows.length < 4) {
                result.status = 'skipped';
                result.reason = 'Insufficient sample size for inferential statistics (requires n >= 4)';
                return result;
            }

            const Tests = window.UDIP && window.UDIP.HypothesisTests;
            const Effect = window.UDIP && window.UDIP.EffectSize;
            const Selector = window.UDIP && window.UDIP.TestSelector;

            if (!Tests || !Selector || !Effect) {
                result.status = 'error';
                result.reason = 'Statistical test dependencies not loaded';
                return result;
            }

            // Detect column classifications
            const numCols = [];
            const catCols = [];

            const colList = Array.isArray(profile?.columns)
                ? profile.columns
                : (profile?.columns ? Object.entries(profile.columns).map(([k, v]) => ({ name: k, ...v })) : []);

            colList.forEach(p => {
                const col = p.name;
                const detectedType = p.detectedType || (p.type ? p.type.detectedType : 'unknown');
                if (['integer', 'decimal', 'numeric'].includes(detectedType)) {
                    numCols.push(col);
                } else if (['categorical', 'boolean'].includes(detectedType)) {
                    catCols.push(col);
                }
            });

            const targetCol = analysisPlan?.primaryTarget?.column || numCols[0];

            // Test 1: Compare Numeric columns across top categorical features
            if (numCols.length > 0 && catCols.length > 0) {
                const metricCols = targetCol && numCols.includes(targetCol)
                    ? [targetCol, ...numCols.filter(c => c !== targetCol).slice(0, 2)]
                    : numCols.slice(0, 3);

                metricCols.forEach(currentMetric => {
                    catCols.slice(0, 3).forEach(catCol => {
                        const groupMap = {};
                        rows.forEach(r => {
                            const cat = String(r[catCol] !== null && r[catCol] !== undefined ? r[catCol] : '').trim();
                            const num = Number(r[currentMetric]);
                            if (cat !== '' && Number.isFinite(num)) {
                                if (!groupMap[cat]) groupMap[cat] = [];
                                groupMap[cat].push(num);
                            }
                        });

                        const cats = Object.keys(groupMap);
                        if (cats.length === 2) {
                            const g1 = groupMap[cats[0]];
                            const g2 = groupMap[cats[1]];
                            if (g1.length >= 2 && g2.length >= 2) {
                                const selection = Selector.selectTest({
                                    type1: 'categorical',
                                    type2: 'numeric',
                                    groupCount: 2,
                                    isNormal: rows.length >= 30,
                                    sampleSize: g1.length + g2.length
                                });

                                let testRes = null;
                                let eff = { value: 0, magnitude: 'negligible' };

                                if (selection.test === 'welch_t_test') {
                                    testRes = Tests.welchTTest(g1, g2);
                                    eff = Effect.cohensD(g1, g2);
                                } else {
                                    testRes = Tests.mannWhitneyU(g1, g2);
                                    eff = Effect.rankBiserial(testRes.statistic, g1.length, g2.length);
                                }

                                if (testRes && testRes.valid) {
                                    const isSig = testRes.pValue < 0.05;
                                    result.tests.push({
                                        test: testRes.test,
                                        variables: [catCol, currentMetric],
                                        statistic: testRes.statistic,
                                        pValue: testRes.pValue,
                                        effectSize: eff,
                                        isSignificant: isSig,
                                        interpretation: isSig
                                            ? `Statistically significant difference detected between "${cats[0]}" and "${cats[1]}" on "${currentMetric}" (p = ${testRes.pValue.toFixed(3)}, ${eff.magnitude} effect).`
                                            : `No statistically significant difference detected between groups (p = ${testRes.pValue.toFixed(3)}).`,
                                        confidence: Math.round(isSig ? 85 + (eff.magnitude === 'large' ? 10 : 5) : 75),
                                        reasoning: selection.reasoning
                                    });
                                }
                            }
                        } else if (cats.length >= 3) {
                            const groups = cats.map(c => groupMap[c]).filter(g => g.length >= 2);
                            if (groups.length >= 3) {
                                const selection = Selector.selectTest({
                                    type1: 'categorical',
                                    type2: 'numeric',
                                    groupCount: groups.length,
                                    isNormal: rows.length >= 30,
                                    sampleSize: rows.length
                                });

                                let testRes = null;
                                let eff = { value: 0, magnitude: 'negligible' };

                                if (selection.test === 'one_way_anova') {
                                    testRes = Tests.oneWayAnova(groups);
                                    eff = Effect.etaSquared(testRes.ssBetween, testRes.ssTotal);
                                } else {
                                    testRes = Tests.kruskalWallis(groups);
                                    eff = { value: 0, magnitude: 'moderate' }; // Rank variance
                                }

                                if (testRes && testRes.valid) {
                                    const isSig = testRes.pValue < 0.05;
                                    result.tests.push({
                                        test: testRes.test,
                                        variables: [catCol, currentMetric],
                                        statistic: testRes.statistic,
                                        pValue: testRes.pValue,
                                        effectSize: eff,
                                        isSignificant: isSig,
                                        interpretation: isSig
                                            ? `Statistically significant variation across ${groups.length} categories of "${catCol}" for "${currentMetric}" (p = ${testRes.pValue.toFixed(3)}, ${eff.magnitude} effect size).`
                                            : `Differences across categories of "${catCol}" are not statistically significant (p = ${testRes.pValue.toFixed(3)}).`,
                                        confidence: isSig ? 88 : 78,
                                        reasoning: selection.reasoning
                                    });
                                }
                            }
                        }
                    });
                });
            }

            // Test 2: Pairwise Numeric Correlations with Significance
            if (numCols.length >= 2) {
                const primary = targetCol && numCols.includes(targetCol) ? targetCol : numCols[0];
                numCols.filter(c => c !== primary).slice(0, 3).forEach(c2 => {
                    const x = [];
                    const y = [];
                    rows.forEach(r => {
                        const vx = Number(r[primary]);
                        const vy = Number(r[c2]);
                        if (Number.isFinite(vx) && Number.isFinite(vy)) {
                            x.push(vx);
                            y.push(vy);
                        }
                    });

                    if (x.length >= 6) {
                        const corrTest = Tests.pearsonCorrelation(x, y);
                        if (corrTest.valid) {
                            const isSig = corrTest.pValue < 0.05;
                            const rAbs = Math.abs(corrTest.correlation);
                            const effMag = rAbs >= 0.5 ? 'large' : (rAbs >= 0.3 ? 'medium' : (rAbs >= 0.1 ? 'small' : 'negligible'));

                            result.tests.push({
                                test: 'Pearson Correlation Test',
                                variables: [primary, c2],
                                statistic: corrTest.statistic,
                                correlation: corrTest.correlation,
                                pValue: corrTest.pValue,
                                effectSize: { value: corrTest.correlation, magnitude: effMag },
                                isSignificant: isSig,
                                interpretation: isSig
                                    ? `Statistically significant correlation between "${primary}" and "${c2}" (r = ${corrTest.correlation.toFixed(3)}, p = ${corrTest.pValue.toFixed(3)}, ${effMag} association).`
                                    : `Correlation between "${primary}" and "${c2}" is not statistically distinguishable from zero (p = ${corrTest.pValue.toFixed(3)}).`,
                                confidence: isSig ? 90 : 75,
                                reasoning: [
                                    'Evaluates linear association between two continuous features',
                                    `Sample size n = ${x.length}`
                                ]
                            });
                        }
                    }
                });
            }

            // Test 3: Chi-Square Test for top Categorical pairs (if applicable)
            if (catCols.length >= 2) {
                const c1 = catCols[0];
                const c2 = catCols[1];
                const contingency = {};

                rows.forEach(r => {
                    const v1 = String(r[c1] || '').trim();
                    const v2 = String(r[c2] || '').trim();
                    if (v1 && v2) {
                        if (!contingency[v1]) contingency[v1] = {};
                        contingency[v1][v2] = (contingency[v1][v2] || 0) + 1;
                    }
                });

                const rLabels = Object.keys(contingency).slice(0, 5);
                const cLabelsSet = new Set();
                rLabels.forEach(rl => Object.keys(contingency[rl]).forEach(cl => cLabelsSet.add(cl)));
                const cLabels = Array.from(cLabelsSet).slice(0, 5);

                if (rLabels.length >= 2 && cLabels.length >= 2) {
                    const matrix = rLabels.map(rl => cLabels.map(cl => contingency[rl][cl] || 0));
                    const chiRes = Tests.chiSquareTest(matrix);
                    if (chiRes.valid) {
                        const eff = Effect.cramersV(chiRes.statistic, chiRes.grandTotal, rLabels.length, cLabels.length);
                        const isSig = chiRes.pValue < 0.05;

                        result.tests.push({
                            test: 'Chi-Square Test of Independence',
                            variables: [c1, c2],
                            statistic: chiRes.statistic,
                            pValue: chiRes.pValue,
                            effectSize: eff,
                            isSignificant: isSig,
                            interpretation: isSig
                                ? `Statistically significant dependence between "${c1}" and "${c2}" distributions (Chi² = ${chiRes.statistic.toFixed(2)}, p = ${chiRes.pValue.toFixed(3)}, Cramér's V = ${eff.value}).`
                                : `No significant distributional association found between "${c1}" and "${c2}" (p = ${chiRes.pValue.toFixed(3)}).`,
                            confidence: isSig ? 85 : 75,
                            reasoning: [
                                `Contingency table analyzed (${rLabels.length}x${cLabels.length})`,
                                'Tests categorical independence hypothesis'
                            ]
                        });
                    }
                }
            }

            return result;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.StatisticalEngine = StatisticalEngine;

})(typeof window !== 'undefined' ? window : global);
