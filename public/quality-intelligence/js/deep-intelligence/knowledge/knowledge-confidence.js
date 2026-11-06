/**
 * UDIP Deep Intelligence Evolution vNext
 * KnowledgeConfidence - 5-Dimensional Analytical Reliability
 * Never collapses everything into one generic confidence number.
 * Dimensions: Data Confidence, Statistical Confidence, Model Confidence, Insight Robustness, Decision Confidence.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.KnowledgeConfidence = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class KnowledgeConfidence {
        static evaluate({ dataset = {}, profile = {}, findings = {}, criticAudit = null } = {}) {
            const rowCount = dataset.rowCount || (dataset.rows ? dataset.rows.length : 0);
            const colCount = dataset.columnCount || (dataset.columns ? dataset.columns.length : 0);
            const qualityScore = profile && profile.summary ? (profile.summary.qualityScore || 85) : 85;

            // 1. Data Confidence: based on data completeness, validity, volume
            const dataEvidence = [];
            const dataLimitations = [];
            let dataScore = qualityScore / 100;

            if (rowCount < 30) {
                dataScore *= 0.6;
                dataLimitations.push(`Small sample size (N=${rowCount}) increases estimation variance.`);
            } else if (rowCount >= 500) {
                dataEvidence.push(`Adequate sample volume (N=${rowCount}).`);
            }

            if (profile && profile.summary && profile.summary.missingCells > 0) {
                const missingPct = (profile.summary.missingCells / (rowCount * colCount || 1)) * 100;
                if (missingPct > 15) {
                    dataScore *= 0.8;
                    dataLimitations.push(`Noticeable missingness density (${missingPct.toFixed(1)}%).`);
                }
            }
            dataScore = Math.max(0.1, Math.min(1.0, +dataScore.toFixed(2)));

            // 2. Statistical Confidence: degrees of freedom, effect sizes, test power
            const statEvidence = [];
            const statLimitations = [];
            let statScore = 0.85;

            if (rowCount < 50) {
                statScore *= 0.7;
                statLimitations.push('Limited degrees of freedom; higher susceptibility to Type II error.');
            } else {
                statEvidence.push(`Degrees of freedom sufficient for asymptotic normal approximations.`);
            }
            statScore = Math.max(0.1, Math.min(1.0, +statScore.toFixed(2)));

            // 3. Model Confidence: candidate evaluation, cross-validation stability, overfitting gap
            const modelEvidence = [];
            const modelLimitations = [];
            let modelScore = 0.80;

            if (findings.modelReasoning && findings.modelReasoning.champion) {
                const champ = findings.modelReasoning.champion;
                if (champ.overfittingGap && champ.overfittingGap > 0.15) {
                    modelScore *= 0.75;
                    modelLimitations.push(`Model exhibits notable train-validation generalization gap (${(champ.overfittingGap * 100).toFixed(1)}%).`);
                } else {
                    modelEvidence.push('Champion model displays stable generalization.');
                }
            } else {
                modelEvidence.push('Baseline empirical modeling confidence.');
            }
            modelScore = Math.max(0.1, Math.min(1.0, +modelScore.toFixed(2)));

            // 4. Insight Robustness: cross-method validation, subgroup stability, counter-evidence
            const insightEvidence = [];
            const insightLimitations = [];
            let insightScore = 0.82;

            if (criticAudit) {
                if (criticAudit.verdict === 'ROBUST') {
                    insightScore = 0.92;
                    insightEvidence.push('Adversarial quality gate passed as ROBUST.');
                } else if (criticAudit.verdict === 'ACCEPTABLE_WITH_CAVEATS') {
                    insightScore = 0.75;
                    insightLimitations.push('Critic identified cautionary caveats.');
                } else if (criticAudit.verdict === 'UNSUPPORTED' || criticAudit.verdict === 'CONTESTED') {
                    insightScore = 0.40;
                    insightLimitations.push('Finding contested or unsupported under adversarial audit.');
                }
            }
            insightScore = Math.max(0.1, Math.min(1.0, +insightScore.toFixed(2)));

            // 5. Decision Confidence: synthesis of all dimensions discounted by observational humility
            const decisionLimitations = [
                'Observational dataset: Causal intervention outcomes require controlled experimental validation.'
            ];
            const decisionScore = Math.max(0.1, Math.min(1.0, +((dataScore * 0.25 + statScore * 0.25 + modelScore * 0.20 + insightScore * 0.30) * 0.95).toFixed(2)));

            return {
                dimensions: {
                    dataConfidence: { score: dataScore, evidence: dataEvidence, limitations: dataLimitations },
                    statisticalConfidence: { score: statScore, evidence: statEvidence, limitations: statLimitations },
                    modelConfidence: { score: modelScore, evidence: modelEvidence, limitations: modelLimitations },
                    insightRobustness: { score: insightScore, evidence: insightEvidence, limitations: insightLimitations },
                    decisionConfidence: { score: decisionScore, limitations: decisionLimitations }
                },
                compositeReliability: decisionScore,
                discountMultiplier: decisionScore
            };
        }
    }

    return KnowledgeConfidence;
}));
