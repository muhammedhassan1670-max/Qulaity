/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/planner/adaptive-planner.js
 * ============================================================================
 * Dynamically constructs an Adaptive Analysis Strategy conditioned on the
 * discovered DatasetKnowledgeModel (topology, entities, variable roles,
 * non-linearities, missingness mechanisms, and computational cost budget).
 * ============================================================================
 */

(function (window) {
    'use strict';

    const AdaptivePlanner = {
        /**
         * Construct adaptive analytical strategy
         * @param {Object} knowledgeModel - The DatasetKnowledgeModel
         * @returns {Object} Tailored analytical plan with model suitability reasoning
         */
        plan(knowledgeModel) {
            if (!knowledgeModel) return { strategyType: 'FALLBACK', executionStages: [] };

            const primaryTopology = knowledgeModel.getPrimaryTopology ? knowledgeModel.getPrimaryTopology() : { type: 'TABULAR' };
            const topologies = knowledgeModel.topologies || [];
            const rowCount = knowledgeModel.rowCount || 0;
            const variables = knowledgeModel.variables || {};
            const relationships = knowledgeModel.relationships || [];
            const derived = knowledgeModel.derivedVariables || [];
            const temporal = knowledgeModel.temporal || {};

            const targets = Object.keys(variables).filter(k => 
                variables[k].primaryRole === 'Target' || 
                variables[k].primaryRole === 'Outcome' ||
                variables[k].candidateTarget ||
                /^(y|target|label|outcome|response)$/i.test(k)
            );
            if (targets.length === 0 && knowledgeModel.targetCandidates && knowledgeModel.targetCandidates.length > 0) {
                targets.push(...knowledgeModel.targetCandidates.map(tc => tc.columnName || tc.name));
            }
            if (targets.length === 0 && relationships.length > 0) {
                targets.push(relationships[0].colB);
            }
            const hasTarget = targets.length > 0;
            const hasNonlinear = relationships.some(r => r.isNonlinear);

            const executionStages = [];

            // Stage 1: Ingestion & Structural Cleanliness
            executionStages.push({
                stage: 1,
                name: 'Structural Sanitization & Leakage Isolation',
                action: 'ISOLATE_DERIVED_VARIABLES',
                targetColumns: derived.map(d => d.derivedColumn),
                rationale: derived.length > 0 ? `Excluding ${derived.length} mathematical derivations to prevent circular leakage.` : 'No tautological leakage detected.'
            });

            // Stage 2: Adaptive Analysis conditioned on Topology
            if (topologies.some(t => t.type === 'TIME_SERIES') && temporal.orderingValid) {
                executionStages.push({
                    stage: 2,
                    name: 'Chronological Dynamics & Autoregressive Modeling',
                    action: 'EXECUTE_TEMPORAL_ANALYSIS',
                    parameters: { timeColumn: temporal.timeColumn, intervalHours: temporal.medianIntervalHours },
                    rationale: 'Verified chronological sequence enables autocorrelation and change-point estimation.'
                });
            }

            if (topologies.some(t => t.type === 'CUSTOMER_ENTITY_DATA' || t.type === 'PANEL_DATA')) {
                executionStages.push({
                    stage: 3,
                    name: 'Entity-Level Feature Aggregation',
                    action: 'ENTITY_SUBGROUP_COMPARISON',
                    rationale: 'Cross-sectional entity structure benefits from group-level behavioral aggregation.'
                });
            }

            // Stage 3: Supervised Modeling Strategy (with Model Suitability Reasoning)
            if (hasTarget && rowCount >= 30) {
                const targetName = targets[0];
                const modelSuitability = this._determineModelSuitability(rowCount, hasNonlinear, knowledgeModel.columnCount);

                executionStages.push({
                    stage: 4,
                    name: 'Adaptive Supervised Machine Learning Arena',
                    action: 'RUN_ADAPTIVE_ML_TOURNAMENT',
                    target: targetName,
                    recommendedAlgorithms: modelSuitability.recommended,
                    excludedAlgorithms: modelSuitability.excluded,
                    rationale: modelSuitability.reasoning
                });
            }

            return {
                primaryTopology: primaryTopology.type,
                compoundTopologies: topologies.map(t => t.type),
                executionStages,
                governanceDirectives: [
                    'Adhere to the 10-point analytical critic before promoting claims to validated status.',
                    'Explicitly state: Association detected, causal inference not established.'
                ]
            };
        },

        _determineModelSuitability(rowCount, hasNonlinear, colCount) {
            const recommended = [];
            const excluded = [];
            const reasoning = [];

            // GBDT: SOTA for tabular datasets
            recommended.push({ id: 'gbdt', name: 'Gradient Boosted Trees (GBDT)', reason: 'Strongest generalizer for tabular non-linear interactions.' });

            // Random Forest: Bagging reduces variance
            recommended.push({ id: 'forest', name: 'Random Forest Ensemble', reason: 'High robustness against noisy features and variance.' });

            // Decision Tree: White-box explainability
            recommended.push({ id: 'tree', name: 'Decision Tree (CART)', reason: 'Maximum explainability and interpretable decision paths.' });

            if (hasNonlinear) {
                recommended.push({ id: 'mlp', name: 'Neural Network (MLP)', reason: 'Captures complex non-linear coordinate manifolds.' });
                recommended.push({ id: 'knn', name: 'K-Nearest Neighbors (KNN)', reason: 'Effective local neighborhood clustering for non-linear boundaries.' });
                excluded.push({ id: 'linear', name: 'Linear / Logistic Regressor', reason: 'Excluded as champion candidate due to verified non-linear structure in feature space.' });
                reasoning.push('Non-linear feature associations detected; prioritizing tree ensembles and neural estimators over linear benchmarks.');
            } else {
                recommended.push({ id: 'linear', name: 'Linear / Logistic Regressor', reason: 'Clean convex benchmark for predominantly linear relationships.' });
                reasoning.push('Linear structure predominates; linear estimators retained for maximum parameter transparency.');
            }

            if (rowCount < 50) {
                excluded.push({ id: 'mlp', name: 'Neural Network (MLP)', reason: 'Sample size insufficient to train deep multilayer weights reliably.' });
            }

            return { recommended, excluded, reasoning: reasoning.join(' ') };
        },

        planStrategy(params = {}) {
            if (params && typeof params.getPrimaryTopology === 'function') {
                const res = this.plan(params);
                const suitability = this._determineModelSuitability(params.rowCount || 100, (params.relationships || []).some(r => r.isNonlinear), params.columnCount || 10);
                return {
                    ...res,
                    recommendedAlgorithms: suitability.recommended,
                    excludedAlgorithms: suitability.excluded,
                    reasoning: suitability.reasoning
                };
            }
            const rowCount = params.dataset?.rowCount || (params.dataset?.rows ? params.dataset.rows.length : 100);
            const colCount = params.dataset?.columns?.length || 10;
            const hasNonlinear = (params.relationships || []).some(r => r.isNonlinear);
            const suitability = this._determineModelSuitability(rowCount, hasNonlinear, colCount);
            const planRes = this.plan(params);
            return {
                ...planRes,
                recommendedAlgorithms: suitability.recommended,
                excludedAlgorithms: suitability.excluded,
                reasoning: suitability.reasoning
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.AdaptivePlanner = AdaptivePlanner;

})(typeof window !== 'undefined' ? window : global);
