/**
 * UDIP Deep Intelligence Evolution vNext
 * RelationshipConsensus - Multi-Method Consensus Synthesis
 * Combines Linear, Monotonic Rank, Mutual Information, and Non-linear patterns.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.RelationshipConsensus = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    function normalCdf(z) {
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        const sign = z < 0 ? -1 : 1;
        const absX = Math.abs(z) / Math.SQRT2;
        const t = 1.0 / (1.0 + p * absX);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
        return 0.5 * (1 + sign * y);
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

    class RelationshipConsensus {
        static evaluate({ linearResult, rankResult, miValue, nonlinearResult, colA, colB, n } = {}) {
            const r = (linearResult && linearResult.r) || 0;
            const rho = (rankResult && rankResult.spearmanRho) || 0;
            const tau = (rankResult && rankResult.kendallTau) || 0;
            const mi = typeof miValue === 'number' ? miValue : 0;
            const pattern = (nonlinearResult && nonlinearResult.pattern) || 'LINEAR';
            const isNonLinear = (nonlinearResult && nonlinearResult.isNonLinear) || false;
            const sampleN = n || 0;

            // Statistical Significance Verification (Student's t, df = n - 2)
            const df = Math.max(1, sampleN - 2);
            const maxCorr = Math.max(Math.abs(r), Math.abs(rho));
            let tStat = 0;
            if (maxCorr < 0.9999 && df > 0) {
                tStat = maxCorr * Math.sqrt(df / Math.max(1e-9, 1 - maxCorr * maxCorr));
            } else if (maxCorr >= 0.9999) {
                tStat = 999;
            }
            const pValue = Number(studentTPValue(tStat, df).toFixed(5));
            const isSignificant = (pValue < 0.05 && sampleN >= 8) || (mi >= 0.50 && sampleN >= 10);

            let strength = 'NONE';
            if (isSignificant) {
                if (maxCorr >= 0.70 || mi >= 0.60) {
                    strength = 'STRONG';
                } else if (maxCorr >= 0.40 || mi >= 0.30) {
                    strength = 'MODERATE';
                } else if (maxCorr >= 0.20 || mi >= 0.15) {
                    strength = 'WEAK';
                }
            } else if (maxCorr >= 0.30 && sampleN < 8) {
                strength = 'UNVERIFIED_SMALL_SAMPLE';
            }

            // Consensus pattern determination
            let consensusShape = 'LINEAR';
            if (isNonLinear || pattern === 'U_SHAPED' || pattern === 'INVERTED_U') {
                consensusShape = pattern;
            } else if (Math.abs(rho) - Math.abs(r) >= 0.15 && Math.abs(rho) >= 0.40) {
                consensusShape = 'MONOTONIC_NON_LINEAR';
            } else if (Math.abs(r) >= 0.40) {
                consensusShape = 'LINEAR';
            } else if (mi >= 0.35 && Math.abs(r) < 0.20) {
                consensusShape = 'COMPLEX_NON_LINEAR';
            }

            // 95% Confidence Interval for Pearson r
            let rCiLow = -1, rCiHigh = 1;
            if (sampleN > 3 && Math.abs(r) < 0.999) {
                const z = 0.5 * Math.log((1 + r) / (1 - r));
                const seZ = 1 / Math.sqrt(sampleN - 3);
                rCiLow = +(Math.tanh(z - 1.96 * seZ).toFixed(3));
                rCiHigh = +(Math.tanh(z + 1.96 * seZ).toFixed(3));
            }

            const evidence = [
                `Pearson r: ${r.toFixed(3)} (p = ${pValue < 0.001 ? '<0.001' : pValue.toFixed(3)})`,
                `Spearman ρ: ${rho.toFixed(3)}`,
                `Kendall τ: ${tau.toFixed(3)}`,
                `Mutual Information: ${mi.toFixed(3)} nats`,
                `95% Confidence Interval: [${rCiLow}, ${rCiHigh}]`,
                `Detected Topology: ${consensusShape}`
            ];

            const counterEvidence = [];
            if (!isSignificant) {
                counterEvidence.push(`Empirical association lacks statistical significance (p = ${pValue.toFixed(3)} >= 0.05). Risk of spurious correlation.`);
            }
            if (sampleN < 10) {
                counterEvidence.push(`Limited sample size (n=${sampleN}) restricts generalization.`);
            }
            if (nonlinearResult && nonlinearResult.heteroscedastic) {
                counterEvidence.push('Heteroscedastic variance detected across feature domain.');
            }
            if (Math.abs(r) < 0.20 && mi > 0.40) {
                counterEvidence.push('Linear model fails to capture underlying manifold dependency.');
            }

            return {
                colA: colA,
                colB: colB,
                strength: strength,
                shape: consensusShape,
                isNonLinear: isNonLinear || consensusShape !== 'LINEAR',
                pearson: r,
                spearman: rho,
                kendall: tau,
                mutualInformationNats: mi,
                pValue: pValue,
                isSignificant: isSignificant,
                confidenceInterval: [rCiLow, rCiHigh],
                n: sampleN,
                status: (isSignificant && strength !== 'NONE') ? 'OBSERVED' : 'SPURIOUS_OR_UNVERIFIED',
                confidence: strength === 'STRONG' ? 0.92 : (strength === 'MODERATE' ? 0.82 : 0.60),
                evidence: evidence,
                counterEvidence: counterEvidence,
                limitations: ['Observational correlation does not establish causal direction.']
            };
        }
    }

    return RelationshipConsensus;
}));
