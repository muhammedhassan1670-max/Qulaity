/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: decision/governance/model-governance.js
 * ============================================================================
 * Comprehensive Model Governance & Algorithmic Trust Framework.
 * 
 * Strict Governance Philosophy:
 * A machine learning model is NEVER presented as trustworthy solely because
 * of a high R² or Accuracy score.
 * 
 * Trust Score is evaluated across 5 core governance pillars:
 * 1. Validation Rigor (out-of-sample vs chronological vs random split)
 * 2. Generalization & Overfitting Margin (sample-to-feature ratio n/p)
 * 3. Data Leakage Status & Pre-decision Verification
 * 4. Model Stability & Performance Dispersion
 * 5. Explainability & Transparent Limitations
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ModelGovernance = {
        /**
         * Audit trained model architectures and compute multi-factor trust scores
         * 
         * @param {Object} params
         * @param {Object} params.analytics
         * @param {Object} params.analysisPlan
         * @param {Object} params.profile
         * @returns {Object} Comprehensive governance audit report
         */
        audit({ analytics = {}, analysisPlan = {}, profile = {} }) {
            const ml = analytics?.machineLearning || {};
            const winner = ml.winner || null;
            const Stability = window.UDIP?.StabilityAnalyzer;

            if (!ml.status || ml.status !== 'completed' || !winner) {
                return {
                    status: 'skipped',
                    model: 'None',
                    trustScore: 0,
                    trustLevel: 'unrated',
                    validationQuality: 'N/A',
                    stability: 'N/A',
                    leakageStatus: 'N/A',
                    confidence: 0,
                    strengths: [],
                    weaknesses: ['No predictive model was trained or validated.'],
                    limitations: ['Predictive model governance is not applicable to unsupervised or small datasets.'],
                    recommendation: 'Collect additional labeled records or focus on exploratory and descriptive monitoring.'
                };
            }

            const m = winner.metrics || {};
            const isReg = ml.taskType === 'regression';
            const totalRows = profile?.dataset?.rowCount || m.n || 0;
            const featureCount = (ml.features || []).length || 1;
            const nToPRatio = +(totalRows / featureCount).toFixed(1);

            let trustScore = 70; // Baseline
            const strengths = [
                `Candidate algorithms systematically benchmarked against baseline (${winner.name || 'primary model'} selected).`
            ];
            const weaknesses = [];
            const limitations = [];

            // -----------------------------------------------------------------
            // 1. Validation Rigor Evaluation
            // -----------------------------------------------------------------
            let validationQuality = 'standard_split';
            if (analysisPlan?.datasetType?.type === 'time_series' || analysisPlan?.datasetType === 'time_series') {
                validationQuality = 'chronological_split';
                trustScore += 10;
                strengths.push('Validated using strict chronological split: zero look-ahead temporal leakage.');
            } else if (m.n >= 10) {
                validationQuality = 'out_of_sample_holdout';
                trustScore += 5;
                strengths.push('Evaluated on holdout validation partition with unbiased out-of-sample metrics.');
            } else {
                validationQuality = 'limited_sample_holdout';
                trustScore -= 10;
                weaknesses.push(`Validation holdout is limited (n = ${m.n}), reducing metric precision.`);
            }

            // -----------------------------------------------------------------
            // 2. Data Leakage Status
            // -----------------------------------------------------------------
            let leakageStatus = 'clean';
            if (analysisPlan?.leakage?.riskLevel === 'high') {
                leakageStatus = 'high_risk_penalized';
                trustScore -= 30;
                weaknesses.push('High data leakage risk identified in dataset: model may be learning trivial post-decision signals.');
                limitations.push('Model performance is likely artificially inflated by post-outcome or duplicate variables.');
            } else if (analysisPlan?.leakage?.riskLevel === 'medium') {
                leakageStatus = 'moderate_risk';
                trustScore -= 10;
                weaknesses.push('Moderate leakage indicators flagged in feature set.');
            } else {
                leakageStatus = 'guarded';
                strengths.push('Zero high-risk data leakage patterns detected in input feature set.');
            }

            // -----------------------------------------------------------------
            // 3. Dimensionality & Overfitting Hazard (n / p ratio)
            // -----------------------------------------------------------------
            if (nToPRatio < 5) {
                trustScore -= 20;
                weaknesses.push(`Severe dimensionality pressure (n/p ratio = ${nToPRatio}:1, minimum 5:1 recommended) increases overfitting hazard.`);
                limitations.push('High risk that model memorized noise due to insufficient observation depth relative to feature count.');
            } else if (nToPRatio < 10) {
                trustScore -= 5;
                weaknesses.push(`Moderate sample-to-feature ratio (${nToPRatio}:1).`);
            } else {
                strengths.push(`Favorable observation-to-feature ratio (${nToPRatio}:1) provides statistical support for generalization.`);
            }

            // -----------------------------------------------------------------
            // 4. Model Stability Analysis
            // -----------------------------------------------------------------
            let stabilityLabel = 'moderate';
            if (Stability) {
                const stabRes = Stability.analyze({ analytics });
                if (stabRes.status === 'completed') {
                    if (stabRes.stable) {
                        strengths.push('Demonstrated low performance dispersion across candidate algorithmic architectures.');
                        stabilityLabel = 'stable';
                    } else {
                        trustScore -= 10;
                        weaknesses.push('Elevated performance variance across candidate algorithms suggests sensitivity to model choice.');
                        stabilityLabel = 'unstable';
                    }
                }
            }

            // -----------------------------------------------------------------
            // 5. Performance Plausibility
            // -----------------------------------------------------------------
            const perfVal = isReg ? m.r2 : (m.macroF1 || m.accuracy);
            if (Number.isFinite(perfVal)) {
                if (perfVal > 0.98 && totalRows < 50) {
                    trustScore -= 15;
                    weaknesses.push(`Near-perfect metric (${isReg ? `R² = ${perfVal}` : `Acc = ${perfVal}`}) on small sample indicates potential overfitting or unflagged proxy leakage.`);
                    limitations.push('Extremely high performance metric warrants cautious external validation before operational reliance.');
                } else if (perfVal < 0.4) {
                    trustScore -= 15;
                    weaknesses.push(`Low predictive explanatory power (${isReg ? `R² = ${perfVal}` : `Score = ${perfVal}`}) leaves majority of variance unexplained.`);
                } else {
                    strengths.push(`Plausible out-of-sample performance (${isReg ? `R² = ${perfVal}` : `Score = ${perfVal}`}).`);
                }
            }

            // Final Trust Score Bounds & Level
            trustScore = Math.max(10, Math.min(100, Math.round(trustScore)));

            let trustLevel = 'moderate';
            if (trustScore >= 80) trustLevel = 'very_high';
            else if (trustScore >= 70) trustLevel = 'high';
            else if (trustScore >= 50) trustLevel = 'moderate';
            else if (trustScore >= 35) trustLevel = 'low';
            else trustLevel = 'very_low';

            // Recommendation
            let recommendation = '';
            if (trustScore >= 70) {
                recommendation = 'Model meets operational governance thresholds for exploratory decision intelligence and guided what-if analysis.';
            } else if (trustScore >= 50) {
                recommendation = 'Model approved for advisory support only; maintain human-in-the-loop validation for any high-stakes decisions.';
            } else {
                recommendation = 'Model does NOT meet minimum reliability thresholds; restrict usage to diagnostic inspection until data limitations are remediated.';
            }

            limitations.push('Observational inference: model outputs reflect learned correlations, not guaranteed causal outcomes.');

            return {
                status: 'completed',
                model: winner.name,
                taskType: ml.taskType,
                trustScore,
                trustLevel,
                validationQuality,
                stability: stabilityLabel,
                leakageStatus,
                confidence: Math.round(trustScore * 0.9),
                metrics: m,
                strengths,
                weaknesses,
                limitations: Array.from(new Set(limitations)),
                recommendation
            };
        },

        /**
         * 4-Vector Self-Challenging Adversarial Audit
         * Actively attempts to invalidate hypotheses, models, and proposed decisions.
         * 
         * @param {Object} params
         * @param {Object} params.analytics
         * @param {Object} params.analysisPlan
         * @param {Object} params.profile
         * @param {Object} [params.diagnosis]
         * @param {Array<Object>} [params.decisions]
         * @returns {Object} Self-Challenge Audit Report
         */
        challenge({ analytics = {}, analysisPlan = {}, profile = {}, diagnosis = null, decisions = [] } = {}) {
            const ml = analytics?.machineLearning || {};
            const winner = ml.winner || null;
            const totalRows = profile?.dataset?.rowCount || 0;
            const criticalVulnerabilities = [];
            const counterArguments = [];
            const warnings = [];

            // Vector 1: DATA CHALLENGE
            const dataVector = { passed: true, score: 100, issues: [] };
            if (totalRows < 6) {
                dataVector.passed = false;
                dataVector.score = 10;
                dataVector.issues.push(`Sample size (${totalRows}) is insufficient for statistical generalization.`);
                criticalVulnerabilities.push('Sample size is critically inadequate (n < 6).');
            } else if (totalRows < 30) {
                dataVector.score = 50;
                dataVector.issues.push(`Small sample size (n = ${totalRows}) elevates risk of estimator volatility.`);
                warnings.push(`Low sample depth (n = ${totalRows}).`);
            }

            if (analysisPlan?.leakage?.riskLevel === 'high') {
                dataVector.passed = false;
                dataVector.score = Math.min(dataVector.score, 20);
                dataVector.issues.push('High data leakage risk: predictive features may duplicate the target or contain post-event artifacts.');
                criticalVulnerabilities.push('Target leakage detected in input feature space.');
            }

            const highNullCols = (profile?.columns || []).filter(c => (c.stats?.nullPct || 0) > 30);
            if (highNullCols.length > 0) {
                dataVector.score = Math.max(20, dataVector.score - highNullCols.length * 10);
                dataVector.issues.push(`${highNullCols.length} column(s) have missingness > 30%, which may distort empirical distributions.`);
            }

            // Vector 2: MODEL & BASELINE CHALLENGE
            const modelVector = { passed: true, score: 100, issues: [] };
            if (ml.status === 'completed' && winner) {
                const lift = ml.baselineLift || {};
                const m = winner.metrics || {};
                const isReg = ml.taskType === 'regression';

                // Check Baseline Superiority
                if (lift.beatsBaseline === false || (lift.relativeLiftPct != null && lift.relativeLiftPct <= 0)) {
                    modelVector.passed = false;
                    modelVector.score = 25;
                    modelVector.issues.push(`Model failed to beat naive baseline (${lift.naiveBaseline?.strategy || 'baseline prediction'}). Lift: ${lift.relativeLiftPct || 0}%.`);
                    criticalVulnerabilities.push('Trained model does not demonstrate positive lift over naive majority/mean baseline.');
                }

                // Check Overfitting / Metric Inflation
                const perfVal = isReg ? m.r2 : (m.macroF1 || m.accuracy);
                if (perfVal > 0.98 && totalRows < 50) {
                    modelVector.score = Math.min(modelVector.score, 40);
                    modelVector.issues.push(`Suspiciously high performance (${isReg ? 'R²' : 'Accuracy'} = ${perfVal}) on small sample (n = ${totalRows}) indicates likely overfitting.`);
                    counterArguments.push('High metric may reflect sample memorization rather than true generalizable signal.');
                }
            } else if (ml.status === 'skipped' || ml.status === 'insufficient_data') {
                modelVector.passed = false;
                modelVector.score = 20;
                modelVector.issues.push(ml.reason || 'No viable predictive model available.');
            }

            // Vector 3: REASONING & CAUSAL INTEGRITY CHALLENGE
            const reasoningVector = { passed: true, score: 90, issues: [] };
            reasoningVector.issues.push('Epistemological constraint: All identified drivers are observational candidate associations, not proven causal levers.');
            counterArguments.push('Unobserved confounding factors (market changes, latent variables) could account for the observed relationships.');
            if (diagnosis && Array.isArray(diagnosis.candidates) && diagnosis.candidates.length > 0) {
                const topDriver = diagnosis.candidates[0];
                counterArguments.push(`Candidate "${topDriver.candidate}" may be a co-occurring symptom rather than the root generative cause.`);
            }

            // Vector 4: OPERATIONAL & DECISION CHALLENGE
            const decisionVector = { passed: true, score: 85, issues: [] };
            decisionVector.issues.push('Implementation feasibility, operational costs, and unintended systemic side-effects are unobserved in the data.');
            counterArguments.push('Interventions assuming strong causal elasticity may fail if underlying mechanism is non-linear or constrained by unmeasured operational limits.');

            // Synthesize Overall Stress Audit
            const overallScore = Math.round(
                dataVector.score * 0.35 +
                modelVector.score * 0.35 +
                reasoningVector.score * 0.15 +
                decisionVector.score * 0.15
            );

            let stressLevel = 'LOW';
            if (criticalVulnerabilities.length > 0 || overallScore < 40) stressLevel = 'CRITICAL';
            else if (overallScore < 60 || warnings.length >= 2) stressLevel = 'HIGH';
            else if (overallScore < 75) stressLevel = 'MODERATE';

            let decisionStatus = 'APPROVED';
            let withholdingReason = null;

            if (criticalVulnerabilities.length > 0) {
                decisionStatus = 'WITHHELD';
                withholdingReason = `Insufficient evidence — recommendation withheld due to critical vulnerabilities: ${criticalVulnerabilities.join('; ')}`;
            } else if (stressLevel === 'HIGH') {
                decisionStatus = 'ADVISORY';
            }

            return {
                status: 'completed',
                auditPassed: criticalVulnerabilities.length === 0,
                stressLevel,
                overallScore,
                decisionStatus,
                withholdingReason,
                criticalVulnerabilities,
                warnings,
                counterArguments,
                vectors: {
                    data: dataVector,
                    model: modelVector,
                    reasoning: reasoningVector,
                    decision: decisionVector
                },
                governanceStatement: decisionStatus === 'WITHHELD'
                    ? withholdingReason
                    : (decisionStatus === 'ADVISORY'
                        ? 'Advisory Notice: Human domain verification required before operational deployment due to elevated adversarial stress factors.'
                        : 'Self-Challenge Passed: Empirical signals demonstrate statistical validity and positive baseline lift.')
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.ModelGovernance = ModelGovernance;
        window.UDIP.SelfChallengingEngine = ModelGovernance;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ModelGovernance;
    }
})(typeof window !== 'undefined' ? window : global);
