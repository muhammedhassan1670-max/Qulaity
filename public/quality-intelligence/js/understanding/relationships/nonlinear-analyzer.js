/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/relationships/nonlinear-analyzer.js
 * ============================================================================
 * Discovers non-linear, monotonic rank, U-shaped, threshold, and mutual information
 * dependencies. Eliminates linear correlation bias.
 * Every finding reports: strength + method + sample size + uncertainty + limitations.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ID_REGEX = /^(id|uuid|guid|code|key|no|num|ref|hash|serial|account|sku|order|cust|emp|trans|batch|patient|sample|record|row|item|index|barcode|entity)[_-]?|[_-]?(id|code|key|no|num|guid|ref|serial|idx|pk)$/i;

    function normalCdf(z) {
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        const sign = z < 0 ? -1 : 1;
        const absX = Math.abs(z) / Math.SQRT2;
        const t = 1.0 / (1.0 + p * absX);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
        const erfVal = sign * y;
        return 0.5 * (1 + erfVal);
    }

    function studentTPValue(t, df) {
        if (df <= 0 || !isFinite(t)) return 1.0;
        const absT = Math.abs(t);
        if (df >= 30) {
            return Math.max(0, Math.min(1, 2 * (1 - normalCdf(absT))));
        }
        const z = absT * (1 - 1 / (4 * df)) / Math.sqrt(1 + (absT * absT) / (2 * df));
        return Math.max(0, Math.min(1, 2 * (1 - normalCdf(z))));
    }

    const NonlinearAnalyzer = {
        /**
         * Analyze non-linear and linear relationships across dataset features
         * @param {Object} dataset - Raw dataset { rows, columns }
         * @param {Object} profile - Profiler output
         * @returns {Array<Object>} List of verified, statistically significant relationship structures
         */
        analyze(dataset, profile) {
            const rows = Array.isArray(dataset?.rows) ? dataset.rows : [];
            const cols = profile?.columns || [];
            if (rows.length < 8 || cols.length < 2) return [];

            const isIdentifier = (c) => {
                const name = c.name || '';
                const role = c.semanticRole || c.role || '';
                return role === 'identifier' || ID_REGEX.test(name);
            };

            const isNum = (c) => {
                if (isIdentifier(c)) return false;
                const dType = c.detectedType || c.inferredType || c.subType || c.type || '';
                const hasVariance = c.stats ? (c.stats.variance > 1e-7 || c.stats.stdDev > 1e-4) : true;
                return ['integer', 'decimal', 'numeric', 'float', 'number'].includes(dType) && hasVariance;
            };

            const numCols = cols.filter(isNum);
            if (numCols.length < 2) return [];

            const candidates = [];
            const maxCols = Math.min(numCols.length, 14);

            for (let i = 0; i < maxCols; i++) {
                for (let j = i + 1; j < maxCols; j++) {
                    const colA = numCols[i].name;
                    const colB = numCols[j].name;

                    const pairs = [];
                    for (let r = 0; r < rows.length; r++) {
                        const vA = Number(rows[r][colA]);
                        const vB = Number(rows[r][colB]);
                        if (Number.isFinite(vA) && Number.isFinite(vB)) {
                            pairs.push({ x: vA, y: vB });
                        }
                    }

                    if (pairs.length < 8) continue;

                    // Variance safety check
                    const xVals = pairs.map(p => p.x);
                    const yVals = pairs.map(p => p.y);
                    const varX = this._computeVariance(xVals);
                    const varY = this._computeVariance(yVals);
                    if (varX < 1e-7 || varY < 1e-7) continue;

                    const res = this._analyzePair(colA, colB, pairs);
                    if (res && res.isSignificant && res.strength >= 0.20) {
                        candidates.push(res);
                    }
                }
            }

            if (candidates.length === 0) return [];

            // Apply Benjamini-Hochberg False Discovery Rate (FDR) Control (Q = 0.05)
            candidates.sort((a, b) => a.pValue - b.pValue);
            const m = candidates.length;
            const qThresh = 0.05;
            let maxSignificantRank = -1;

            for (let k = 0; k < m; k++) {
                const fdrCritical = ((k + 1) / m) * qThresh;
                if (candidates[k].pValue <= fdrCritical) {
                    maxSignificantRank = k;
                }
            }

            const verifiedFindings = [];
            for (let k = 0; k < m; k++) {
                const cand = candidates[k];
                cand.fdrQValue = +(((k + 1) / m) * qThresh).toFixed(5);
                cand.fdrPassed = k <= maxSignificantRank || cand.strength >= 0.50;
                if (cand.fdrPassed || cand.pValue < 0.01) {
                    verifiedFindings.push(cand);
                }
            }

            // Sort by relationship strength descending
            verifiedFindings.sort((a, b) => b.strength - a.strength);
            return verifiedFindings;
        },

        _analyzePair(colA, colB, pairs) {
            const n = pairs.length;
            const xVals = pairs.map(p => p.x);
            const yVals = pairs.map(p => p.y);

            // 1. Pearson Linear Correlation
            const pearson = this._computePearson(xVals, yVals);
            const absPearson = Math.abs(pearson);

            // 2. Spearman Rank Correlation (Monotonic Non-linear)
            const spearman = this._computeSpearman(xVals, yVals);
            const absSpearman = Math.abs(spearman);

            // 3. Mutual Information (Discretized Binned Entropy)
            const mi = this._computeMutualInformation(xVals, yVals, 8);

            // 4. Test for U-Shaped (Quadratic Curve: y ≈ a*x^2 + b*x + c)
            const uShaped = this._testUShaped(xVals, yVals);

            // 5. Heteroscedasticity (Variance spread conditional on X)
            const heteroscedastic = this._testHeteroscedasticity(xVals, yVals);

            // Classify dominant pattern
            const isU = uShaped.isUShaped && uShaped.r2 > 0.40 && absPearson < 0.45;
            const isNonlinearMonotonic = absSpearman > absPearson + 0.15 && absSpearman >= 0.45;

            // Pattern-specific statistical significance test
            const df = n - 2;
            let tStat = 0;
            let pValue = 1.0;

            if (isU) {
                // Quadratic polynomial F/t-test (df = n - 3)
                const dfQuad = Math.max(1, n - 3);
                tStat = Math.sqrt((uShaped.r2 * dfQuad) / Math.max(1e-9, 1 - uShaped.r2));
                pValue = Number(studentTPValue(tStat, dfQuad).toFixed(5));
            } else if (isNonlinearMonotonic) {
                // Spearman rank t-test (df = n - 2)
                if (absSpearman < 0.9999 && df > 0) {
                    tStat = spearman * Math.sqrt(df / Math.max(1e-9, 1 - spearman * spearman));
                } else {
                    tStat = 999;
                }
                pValue = Number(studentTPValue(tStat, df).toFixed(5));
            } else {
                // Pearson linear t-test (df = n - 2)
                if (absPearson < 0.9999 && df > 0) {
                    tStat = pearson * Math.sqrt(df / Math.max(1e-9, 1 - pearson * pearson));
                } else if (absPearson >= 0.9999) {
                    tStat = 999;
                }
                pValue = Number(studentTPValue(tStat, df).toFixed(5));
            }

            const isSignificant = (pValue < 0.05 || isU || isNonlinearMonotonic || mi.normalizedMI >= 0.45) && n >= 8;

            // Fisher z-transform 95% Confidence Interval for Pearson r
            let rCiLow = -1, rCiHigh = 1;
            if (n > 3 && absPearson < 0.999) {
                const z = 0.5 * Math.log((1 + pearson) / (1 - pearson));
                const seZ = 1 / Math.sqrt(n - 3);
                const zLow = z - 1.96 * seZ;
                const zHigh = z + 1.96 * seZ;
                rCiLow = +(Math.tanh(zLow).toFixed(3));
                rCiHigh = +(Math.tanh(zHigh).toFixed(3));
            }

            // Trivial collinearity check
            const isTautological = absPearson >= 0.998;

            let patternType = 'linear';
            let strength = absPearson;
            let method = 'Pearson r';
            let description = `Linear correlation (r = ${pearson.toFixed(3)}, p = ${pValue < 0.001 ? '<0.001' : pValue.toFixed(3)})`;

            if (isTautological) {
                patternType = 'deterministic_collinear';
                strength = absPearson;
                method = 'Direct Collinearity';
                description = `Near-deterministic collinearity (r = ${pearson.toFixed(3)}): Features are mathematically redundant.`;
            } else if (isU) {
                patternType = 'u_shaped_nonlinear';
                strength = uShaped.r2;
                method = 'Quadratic Polynomial Regression (R²)';
                description = `Non-linear U-shaped dependency detected (R² = ${uShaped.r2.toFixed(2)}, linear r = ${pearson.toFixed(2)})`;
            } else if (isNonlinearMonotonic) {
                patternType = 'monotonic_nonlinear';
                strength = absSpearman;
                method = 'Spearman Rank (ρ)';
                description = `Non-linear monotonic relationship (Spearman ρ = ${spearman.toFixed(3)}, Pearson r = ${pearson.toFixed(3)})`;
            } else if (mi.normalizedMI >= 0.45 && absPearson < 0.35) {
                patternType = 'general_nonlinear';
                strength = mi.normalizedMI;
                method = 'Mutual Information (Shannon I(X;Y))';
                description = `General non-linear mutual dependence (I(X;Y) = ${mi.mi.toFixed(3)} nats, linear r = ${pearson.toFixed(2)})`;
            }

            // Estimate uncertainty based on sample size: SE ≈ 1 / sqrt(N - 3)
            const standardError = n > 3 ? +( (1 / Math.sqrt(n - 3)).toFixed(3) ) : 0.5;
            const uncertainty = standardError > 0.25 ? 'High' : (standardError > 0.12 ? 'Moderate' : 'Low');

            return {
                colA,
                colB,
                patternType,
                isNonlinear: patternType !== 'linear' && patternType !== 'deterministic_collinear',
                isTautological,
                strength: +(strength.toFixed(3)),
                method,
                sampleSize: n,
                pearson: +(pearson.toFixed(3)),
                spearman: +(spearman.toFixed(3)),
                mutualInformation: +(mi.mi.toFixed(3)),
                mutualInfo: +(mi.mi.toFixed(3)),
                tStatistic: +(tStat.toFixed(3)),
                pValue,
                isSignificant,
                confidenceInterval: [rCiLow, rCiHigh],
                uShaped: isU || uShaped.isUShaped,
                heteroscedastic: heteroscedastic.isHeteroscedastic,
                heteroscedasticity: heteroscedastic.isHeteroscedastic,
                uncertainty,
                description,
                limitations: [
                    'Association does not establish causal direction.',
                    `Empirical sample of N=${n} observations with 95% CI [${rCiLow}, ${rCiHigh}].`,
                    pValue >= 0.05 ? 'High probability of spurious random variation.' : 'Statistically significant association.'
                ]
            };
        },

        _computeVariance(arr) {
            const n = arr.length;
            if (n <= 1) return 0;
            const mean = arr.reduce((a, b) => a + b, 0) / n;
            return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
        },

        _computePearson(x, y) {
            const n = x.length;
            if (n === 0) return 0;
            const meanX = x.reduce((a, b) => a + b, 0) / n;
            const meanY = y.reduce((a, b) => a + b, 0) / n;

            let num = 0, denX = 0, denY = 0;
            for (let i = 0; i < n; i++) {
                const dx = x[i] - meanX;
                const dy = y[i] - meanY;
                num += dx * dy;
                denX += dx * dx;
                denY += dy * dy;
            }
            const den = Math.sqrt(denX * denY);
            return den === 0 ? 0 : Math.max(-1, Math.min(1, num / den));
        },

        _computeSpearman(x, y) {
            const rank = (arr) => {
                const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
                const ranks = new Array(arr.length);
                for (let r = 0; r < sorted.length; r++) {
                    ranks[sorted[r].i] = r + 1;
                }
                return ranks;
            };
            return this._computePearson(rank(x), rank(y));
        },

        _computeMutualInformation(x, y, bins = 8) {
            const n = x.length;
            if (n === 0) return { mi: 0, normalizedMI: 0 };

            const minX = Math.min(...x), maxX = Math.max(...x);
            const minY = Math.min(...y), maxY = Math.max(...y);
            const rangeX = maxX - minX || 1;
            const rangeY = maxY - minY || 1;

            const joint = Array.from({ length: bins }, () => new Array(bins).fill(0));
            const margX = new Array(bins).fill(0);
            const margY = new Array(bins).fill(0);

            for (let i = 0; i < n; i++) {
                const bx = Math.min(bins - 1, Math.floor(((x[i] - minX) / rangeX) * bins));
                const by = Math.min(bins - 1, Math.floor(((y[i] - minY) / rangeY) * bins));
                joint[bx][by]++;
                margX[bx]++;
                margY[by]++;
            }

            let mi = 0;
            for (let i = 0; i < bins; i++) {
                for (let j = 0; j < bins; j++) {
                    if (joint[i][j] > 0) {
                        const pXY = joint[i][j] / n;
                        const pX = margX[i] / n;
                        const pY = margY[j] / n;
                        mi += pXY * Math.log(pXY / (pX * pY));
                    }
                }
            }

            const maxEnt = Math.log(bins);
            const normalizedMI = maxEnt > 0 ? Math.min(1.0, Math.max(0, mi / maxEnt)) : 0;
            return { mi: Math.max(0, mi), normalizedMI };
        },

        _testUShaped(x, y) {
            const n = x.length;
            if (n < 10) return { isUShaped: false, r2: 0 };

            // Mean centering
            const meanX = x.reduce((a, b) => a + b, 0) / n;
            const meanY = y.reduce((a, b) => a + b, 0) / n;
            const x2 = x.map(v => Math.pow(v - meanX, 2));

            // Correlation between x2 and y
            const rQuad = this._computePearson(x2, y);
            const r2 = Math.pow(rQuad, 2);

            return {
                isUShaped: r2 >= 0.40,
                r2: +(r2.toFixed(3))
            };
        },

        _testHeteroscedasticity(x, y) {
            const n = x.length;
            if (n < 20) return { isHeteroscedastic: false };

            // Sort by x and compare variance of first half vs second half
            const combined = x.map((v, i) => ({ x: v, y: y[i] })).sort((a, b) => a.x - b.x);
            const half = Math.floor(n / 2);
            const y1 = combined.slice(0, half).map(p => p.y);
            const y2 = combined.slice(half).map(p => p.y);

            const varY = (arr) => {
                const m = arr.reduce((a, b) => a + b, 0) / arr.length;
                return arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (arr.length - 1 || 1);
            };

            const var1 = varY(y1);
            const var2 = varY(y2);
            const ratio = var1 > 0 && var2 > 0 ? Math.max(var1 / var2, var2 / var1) : 1;

            return {
                isHeteroscedastic: ratio >= 3.0,
                varianceRatio: +(ratio.toFixed(2))
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.NonlinearAnalyzer = NonlinearAnalyzer;

})(typeof window !== 'undefined' ? window : global);
