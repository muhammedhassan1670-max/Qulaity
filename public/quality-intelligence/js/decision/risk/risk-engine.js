/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: decision/risk/risk-engine.js
 * ============================================================================
 * Evaluates empirical risk across 7 operational and analytical dimensions:
 * 1. Data Quality & Hygiene Risk
 * 2. Model Performance & Overfitting Risk
 * 3. Data Leakage & Causality Risk
 * 4. Sample Size & Statistical Power Risk
 * 5. Extreme Outliers & Anomaly Concentration Risk
 * 6. Predictive Uncertainty & Horizon Risk
 * 7. Conflicting Analytical Evidence Risk
 * 
 * Enforces a transparent, deterministic scoring formula:
 *    Risk Score = Probability Weight × Impact Weight × Severity Multiplier
 * ============================================================================
 */

(function (window) {
    'use strict';

    const RiskEngine = {
        /**
         * Identify and score risks across the analytical ecosystem
         * 
         * @param {Object} params
         * @param {Object} params.profile
         * @param {Object} params.analysisPlan
         * @param {Object} params.analytics
         * @param {Array<Object>} [params.evidenceItems]
         * @param {Object} [params.traceRegistry]
         * @returns {Array<Object>} List of evaluated risks
         */
        evaluate({ profile = {}, analysisPlan = {}, analytics = {}, evidenceItems = [], traceRegistry = null }) {
            const risks = [];
            let counter = 1;

            const nextId = () => `RSK-${String(counter++).padStart(3, '0')}`;

            // Explainable scoring function: P (1-3) * I (1-3) scaled to 0-100
            const calcScore = (prob, imp, sev) => {
                const pWeight = prob === 'high' ? 3 : (prob === 'medium' ? 2 : 1);
                const iWeight = imp === 'high' ? 3 : (imp === 'medium' ? 2 : 1);
                const sMult = sev === 'critical' ? 1.2 : (sev === 'high' ? 1.0 : (sev === 'medium' ? 0.8 : 0.6));
                const raw = (pWeight * iWeight / 9) * 100 * sMult;
                return Math.max(10, Math.min(100, Math.round(raw)));
            };

            const addRisk = (r, supportingEv = []) => {
                r.score = calcScore(r.probability, r.impact, r.severity);
                risks.push(r);
                if (traceRegistry && typeof traceRegistry.addTrace === 'function') {
                    traceRegistry.addTrace(r.id, 'risk', supportingEv, `Risk [${r.severity.toUpperCase()}]: ${r.title} (Score: ${r.score}/100)`);
                }
            };

            const totalRows = profile?.dataset?.rowCount || 0;

            // -----------------------------------------------------------------
            // 1. Data Leakage Risk
            // -----------------------------------------------------------------
            if (analysisPlan?.leakage?.riskLevel === 'high') {
                const leaked = analysisPlan.leakage.findings?.map(f => f.column) || [];
                const leakEv = evidenceItems.filter(e => e.source === 'intelligence_plan' || (e.supportingColumns && e.supportingColumns.some(c => leaked.includes(c))));

                addRisk({
                    id: nextId(),
                    title: `Severe Data Leakage Risk (${leaked.join(', ')})`,
                    type: 'leakage_risk',
                    severity: 'critical',
                    probability: 'high',
                    impact: 'high',
                    rationale: 'Post-outcome or duplicated columns are present in features, artificially inflating validation metrics.',
                    mitigation: 'Strictly isolate and exclude flagged post-decision columns from modeling datasets.',
                    confidence: 95,
                    evidence: leakEv.map(e => ({ id: e.id, source: e.source, metric: e.metric, value: e.value }))
                }, leakEv);
            }

            // -----------------------------------------------------------------
            // 2. Small Sample Size & Statistical Power Risk
            // -----------------------------------------------------------------
            if (totalRows > 0 && totalRows < 30) {
                const ev = evidenceItems.find(e => e.source === 'data_profiler');
                addRisk({
                    id: nextId(),
                    title: `Low Statistical Power (Small Sample Size n = ${totalRows})`,
                    type: 'sample_size_risk',
                    severity: totalRows < 15 ? 'high' : 'medium',
                    probability: 'high',
                    impact: 'high',
                    rationale: `Sample size of ${totalRows} observations is insufficient for high-confidence model generalization and hypothesis testing power.`,
                    mitigation: 'Treat all inferences as provisional; acquire additional representative samples before committing high-cost decisions.',
                    confidence: 90,
                    evidence: ev ? [ev] : []
                }, ev ? [ev] : []);
            }

            // -----------------------------------------------------------------
            // 3. High Missingness / Data Hygiene Risk
            // -----------------------------------------------------------------
            const missingEv = evidenceItems.filter(e => e.type === 'missingness');
            if (missingEv.length > 0) {
                const cols = missingEv.map(e => e.supportingColumns[0]).filter(Boolean);
                addRisk({
                    id: nextId(),
                    title: `High Missing Data Concentration (${cols.join(', ')})`,
                    type: 'data_quality_risk',
                    severity: 'medium',
                    probability: 'medium',
                    impact: 'medium',
                    rationale: `Elevated missingness (${missingEv[0].value}%) in critical columns forces reliance on imputation assumptions.`,
                    mitigation: 'Audit upstream data capture mechanisms to reduce drop-off at collection.',
                    confidence: 85,
                    evidence: missingEv.map(e => ({ id: e.id, source: e.source, metric: e.metric, value: e.value }))
                }, missingEv);
            }

            // -----------------------------------------------------------------
            // 4. Model Performance & Validation Risk
            // -----------------------------------------------------------------
            const ml = analytics?.machineLearning || {};
            if (ml.status === 'completed' && ml.winner) {
                const m = ml.winner.metrics || {};
                const isReg = ml.taskType === 'regression';
                const perf = isReg ? m.r2 : (m.macroF1 || m.accuracy);

                if (Number.isFinite(perf) && perf < 0.4) {
                    const mlEv = evidenceItems.find(e => e.type === 'model_benchmark');
                    addRisk({
                        id: nextId(),
                        title: `Low Model Predictive Explanatory Power (${ml.taskType})`,
                        type: 'model_risk',
                        severity: 'high',
                        probability: 'high',
                        impact: 'high',
                        rationale: `Winning model achieved modest validation score (${isReg ? `R² = ${perf}` : `F1 = ${perf}`}), indicating substantial unmodeled variance.`,
                        mitigation: 'Do not automate decisions based on current model predictions; incorporate additional diagnostic feature variables.',
                        confidence: 85,
                        evidence: mlEv ? [mlEv] : []
                    }, mlEv ? [mlEv] : []);
                }
            }

            // -----------------------------------------------------------------
            // 5. Extreme Anomaly Concentration Risk
            // -----------------------------------------------------------------
            const anomEv = evidenceItems.find(e => e.type === 'anomaly_rate' && e.value > 5.0);
            if (anomEv) {
                addRisk({
                    id: nextId(),
                    title: `Elevated Anomaly Frequency in "${anomEv.supportingColumns[0]}"`,
                    type: 'anomaly_risk',
                    severity: 'medium',
                    probability: 'medium',
                    impact: 'medium',
                    rationale: `Anomaly rate of ${anomEv.value}% exceeds standard tolerance thresholds and could indicate process instability or data corruption.`,
                    mitigation: 'Implement automated alerts and investigate root drivers of extreme tail occurrences.',
                    confidence: 80,
                    evidence: [anomEv]
                }, [anomEv]);
            }

            // -----------------------------------------------------------------
            // 6. Conflicting Analytical Evidence Risk
            // -----------------------------------------------------------------
            const eda = analytics?.exploratory || {};
            const statsTests = analytics?.statistics?.tests || [];
            if (Array.isArray(eda.relationships) && Array.isArray(statsTests)) {
                // Check if any relationship has high correlation but non-significant p-value
                eda.relationships.forEach(rel => {
                    const matchedTest = statsTests.find(t => t.variables && t.variables.includes(rel.col1) && t.variables.includes(rel.col2));
                    if (Math.abs(rel.correlation) >= 0.5 && matchedTest && matchedTest.pValue >= 0.05) {
                        addRisk({
                            id: nextId(),
                            title: `Conflicting Statistical Evidence (${rel.col1} ↔ ${rel.col2})`,
                            type: 'conflict_risk',
                            severity: 'medium',
                            probability: 'medium',
                            impact: 'high',
                            rationale: `High sample correlation (r = ${rel.correlation}) conflicts with non-significant hypothesis test (p = ${matchedTest.pValue}), likely due to small sample size.`,
                            mitigation: 'Do not extrapolate relationship without larger validation dataset.',
                            confidence: 85,
                            evidence: []
                        }, []);
                    }
                });
            }

            // Sort descending by risk score
            risks.sort((a, b) => b.score - a.score);

            return risks;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.RiskEngine = RiskEngine;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RiskEngine;
    }
})(typeof window !== 'undefined' ? window : global);
