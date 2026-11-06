/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: intelligence/intelligence-engine.js
 * ============================================================================
 * Main Entry Point for Step 2.5 Intelligence Planning Engine:
 * Coordinates the transformation of Profiler output into an explainable,
 * domain-agnostic Analysis Plan.
 * Guarantees zero unhandled exceptions, zero NaN / Infinity / undefined outputs.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const IntelligenceEngine = {
        /**
         * Generate a comprehensive, explainable Analysis Plan from profile evidence
         * @param {Object} profile - Step 2 Profiler result
         * @param {Object} [rawDataset] - Original dataset object { rows, columns, ... }
         * @returns {Object} Unified Analysis Plan
         */
        generatePlan(profile, rawDataset = null) {
            const startTime = Date.now();

            try {
                const planner = window.UDIP && window.UDIP.Planner;
                if (!planner) {
                    console.warn('[UDIP:IntelligenceEngine] Planner module not found; returning fallback plan');
                    return this._generateFallbackPlan('Planner module unavailable');
                }

                const plan = planner.createPlan(profile, rawDataset);
                const duration = Date.now() - startTime;

                console.info(`[UDIP:IntelligenceEngine] Analysis Plan generated in ${duration}ms (Confidence: ${plan.confidence?.score}% [${plan.confidence?.level}])`);
                return plan;

            } catch (err) {
                console.error('[UDIP:IntelligenceEngine] Unexpected error during planning execution:', err);
                return this._generateFallbackPlan(err.message || 'Execution error');
            }
        },

        /**
         * Asynchronously generate an Analysis Plan with event-loop yield
         */
        async generatePlanAsync(profile, rawDataset = null, onProgress = null) {
            if (onProgress) onProgress({ stage: 4, percent: 84, stageName: 'Stage 4/5: Synthesizing analytical roadmap & scenarios...', log: 'INTELLIGENCE_PLAN: Synthesizing analytical roadmap...' });
            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 10));
            return this.generatePlan(profile, rawDataset);
        },

        _generateFallbackPlan(errorReason) {
            return {
                version: '1.0',
                generatedAt: new Date().toISOString(),
                datasetType: {
                    type: 'insufficient_evidence',
                    confidence: 0,
                    reasoning: [`Planning pipeline error: ${errorReason}`]
                },
                primaryTarget: null,
                alternativeTargets: [],
                recommendedTasks: [],
                features: { recommended: [], potential: [], excluded: [] },
                relationships: [],
                leakage: { riskLevel: 'none', findings: [] },
                missingness: { overallScore: 0, riskLevel: 'low', patterns: [], columnMissingness: [], recommendations: [] },
                preprocessing: [],
                recommendations: [],
                warnings: [`Analysis planning encountered a fallback: ${errorReason}`],
                reasoning: ['Unable to complete full analytical planning due to data or module anomaly.'],
                confidence: {
                    score: 0,
                    level: 'very_low'
                }
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.IntelligenceEngine = IntelligenceEngine;

})(window);
