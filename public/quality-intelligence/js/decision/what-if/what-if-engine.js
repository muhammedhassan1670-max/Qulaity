/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: decision/what-if/what-if-engine.js
 * ============================================================================
 * Performs automated marginal sensitivity analysis across key model features.
 * Evaluates standard perturbations (±5%, ±10%, ±20%) to quantify feature
 * elasticities and responsiveness.
 * 
 * Ranks features by sensitivity magnitude to uncover the most effective
 * candidate levers for decision consideration.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const WhatIfEngine = {
        /**
         * Perform automated sensitivity analysis on key model features
         * 
         * @param {Object} params
         * @param {Object} params.analytics
         * @param {Object} params.profile
         * @param {Object} params.analysisPlan
         * @returns {Object} { sensitivities: Array<Object>, rankedFeatures: Array<Object>, summary: Object }
         */
        analyzeSensitivity({ analytics = {}, profile = {}, analysisPlan = {} }) {
            const ml = analytics?.machineLearning || {};
            const winner = ml.winner;
            const ScenarioEngine = window.UDIP?.ScenarioEngine;

            if (!ml.status || ml.status !== 'completed' || !winner || !ScenarioEngine) {
                return {
                    status: 'skipped',
                    reason: 'Sensitivity analysis requires a trained, validated machine learning model.',
                    sensitivities: [],
                    rankedFeatures: []
                };
            }

            const features = ml.features || [];
            const colProfiles = Array.isArray(profile?.columns) ? profile.columns : [];
            const perturbations = [
                { label: '+5%', factor: 1.05 },
                { label: '+10%', factor: 1.10 },
                { label: '+20%', factor: 1.20 },
                { label: '-5%', factor: 0.95 },
                { label: '-10%', factor: 0.90 },
                { label: '-20%', factor: 0.80 }
            ];

            const sensitivities = [];
            const featureMaxDelta = {};

            features.forEach(featName => {
                const cp = colProfiles.find(c => c.name === featName);
                if (!cp) return;

                // Numeric sensitivity evaluation
                if (['integer', 'decimal', 'numeric'].includes(cp.detectedType)) {
                    const baseVal = Number.isFinite(cp.stats?.median) ? cp.stats.median : (cp.stats?.mean || 10);
                    if (baseVal === 0) return; // Skip zero base to avoid division by zero

                    const featureRuns = [];

                    perturbations.forEach(p => {
                        const scenarioVal = +(baseVal * p.factor).toFixed(4);
                        const scenRes = ScenarioEngine.evaluateScenario({
                            changes: [{ feature: featName, value: scenarioVal }],
                            analytics,
                            profile,
                            analysisPlan
                        });

                        if (scenRes.valid) {
                            const elasticity = (p.factor !== 1 && scenRes.relativeChange !== 0)
                                ? +(scenRes.relativeChange / ((p.factor - 1) * 100)).toFixed(3)
                                : 0;

                            const item = {
                                feature: featName,
                                perturbation: p.label,
                                baselineValue: baseVal,
                                scenarioValue: scenarioVal,
                                baselinePrediction: scenRes.baselinePrediction,
                                scenarioPrediction: scenRes.scenarioPrediction,
                                delta: scenRes.delta,
                                relativeChange: scenRes.relativeChange,
                                elasticity: Number.isFinite(elasticity) ? elasticity : 0
                            };

                            sensitivities.push(item);
                            featureRuns.push(item);

                            const absDelta = Math.abs(scenRes.delta || 0);
                            if (!featureMaxDelta[featName] || absDelta > featureMaxDelta[featName]) {
                                featureMaxDelta[featName] = absDelta;
                            }
                        }
                    });
                }
            });

            // Rank features by max responsive sensitivity
            const rankedFeatures = Object.keys(featureMaxDelta)
                .map(feat => {
                    const featRuns = sensitivities.filter(s => s.feature === feat);
                    const avgElasticity = featRuns.length > 0
                        ? +(featRuns.reduce((acc, r) => acc + Math.abs(r.elasticity), 0) / featRuns.length).toFixed(3)
                        : 0;

                    return {
                        feature: feat,
                        maxAbsoluteDelta: +featureMaxDelta[feat].toFixed(4),
                        averageElasticity: avgElasticity,
                        sensitivityLevel: avgElasticity >= 1.0 ? 'high' : (avgElasticity >= 0.3 ? 'moderate' : 'low')
                    };
                })
                .sort((a, b) => b.maxAbsoluteDelta - a.maxAbsoluteDelta);

            return {
                status: 'completed',
                target: ml.target,
                sensitivities,
                rankedFeatures,
                summary: {
                    testedFeatures: Object.keys(featureMaxDelta).length,
                    totalPerturbations: sensitivities.length,
                    topSensitiveFeature: rankedFeatures[0]?.feature || null
                }
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.WhatIfEngine = WhatIfEngine;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = WhatIfEngine;
    }
})(typeof window !== 'undefined' ? window : global);
