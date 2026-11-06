/**
 * UDIP Deep Intelligence Evolution vNext
 * DatasetKnowledgeModel (DKM vNext)
 * Central representation of empirical understanding, topology, structure, and uncertainty.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.DatasetKnowledgeModel = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class DatasetKnowledgeModel {
        constructor(config = {}) {
            this.version = config.version || '2.0.0';
            this.datasetId = config.datasetId || `dkm_${Date.now()}`;
            this.createdAt = config.createdAt || new Date().toISOString();
            this.updatedAt = this.createdAt;

            // Dimensions of Structured Inferences
            this.topology = config.topology || [];
            this.entities = config.entities || [];
            this.hierarchies = config.hierarchies || [];
            this.keys = config.keys || [];
            this.dependencies = config.dependencies || [];
            this.variables = config.variables || {};
            this.relationships = config.relationships || [];
            this.interactions = config.interactions || [];
            this.conditionalRelationships = config.conditionalRelationships || [];
            this.derivedVariables = config.derivedVariables || [];
            this.temporalStructure = config.temporalStructure || null;
            this.distributions = config.distributions || {};
            this.missingness = config.missingness || null;
            this.segments = config.segments || [];
            this.anomalies = config.anomalies || [];
            this.drift = config.drift || null;
            this.hypotheses = config.hypotheses || [];
            this.counterEvidence = config.counterEvidence || [];
            this.modelReasoning = config.modelReasoning || null;
            this.criticAudit = config.criticAudit || null;
            this.insightGraph = config.insightGraph || null;
            this.analyticalTraces = config.analyticalTraces || [];
            this.groundedQuestions = config.groundedQuestions || [];
            this.adaptiveStrategy = config.adaptiveStrategy || null;
            this.reliabilityProfile = config.reliabilityProfile || null;
            this.executionCost = config.executionCost || null;
            this.metadata = config.metadata || {};
        }

        /**
         * Standard helper to create a calibrated empirical inference object
         */
        static createInference({ status = 'POSSIBLE', confidence = 0.5, evidence = [], method = 'HEURISTIC', sampleSize = 0, limitations = [] } = {}) {
            const validStatuses = ['OBSERVED', 'LIKELY', 'POSSIBLE', 'UNKNOWN'];
            const safeStatus = validStatuses.includes(status) ? status : 'POSSIBLE';
            const safeConf = typeof confidence === 'number' && !isNaN(confidence) ? Math.max(0, Math.min(1, +confidence.toFixed(4))) : 0.5;

            return {
                status: safeStatus,
                confidence: safeConf,
                evidence: Array.isArray(evidence) ? evidence : [String(evidence)],
                method: String(method || 'HEURISTIC'),
                sampleSize: typeof sampleSize === 'number' && !isNaN(sampleSize) ? sampleSize : 0,
                limitations: Array.isArray(limitations) ? limitations : (limitations ? [String(limitations)] : [])
            };
        }

        // Getters for quick platform interoperability
        get primaryTopology() {
            if (!this.topology || this.topology.length === 0) return 'TABULAR';
            const sorted = [...this.topology].sort((a, b) => (b.score || b.likelihood || 0) - (a.score || a.likelihood || 0));
            return sorted[0].topology || sorted[0].name || 'TABULAR';
        }

        get targetCandidates() {
            const targets = [];
            for (const [col, info] of Object.entries(this.variables || {})) {
                if (info.role === 'TARGET' || info.role === 'OUTCOME' || (info.roles && info.roles.includes('TARGET'))) {
                    targets.push({ column: col, confidence: info.confidence || 0.8, role: info.role });
                }
            }
            return targets;
        }

        get nonLinearRelationships() {
            return (this.relationships || []).filter(r => r.isNonLinear || r.pattern === 'U_SHAPED' || r.pattern === 'INVERTED_U' || r.pattern === 'POLYNOMIAL');
        }

        isNonLinear(colA, colB) {
            return (this.relationships || []).some(r =>
                ((r.colA === colA && r.colB === colB) || (r.colA === colB && r.colB === colA)) &&
                (r.isNonLinear || r.pattern === 'U_SHAPED' || r.pattern === 'INVERTED_U')
            );
        }

        get causalWarnings() {
            return (this.relationships || [])
                .filter(r => r.causalWarning || r.hasConfounder)
                .map(r => r.causalWarning || `Confounding risk between ${r.colA} and ${r.colB}`);
        }

        toJSON() {
            return {
                version: this.version,
                datasetId: this.datasetId,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt,
                topology: this.topology,
                entities: this.entities,
                hierarchies: this.hierarchies,
                keys: this.keys,
                dependencies: this.dependencies,
                variables: this.variables,
                relationships: this.relationships,
                interactions: this.interactions,
                conditionalRelationships: this.conditionalRelationships,
                derivedVariables: this.derivedVariables,
                temporalStructure: this.temporalStructure,
                distributions: this.distributions,
                missingness: this.missingness,
                segments: this.segments,
                anomalies: this.anomalies,
                drift: this.drift,
                hypotheses: this.hypotheses,
                counterEvidence: this.counterEvidence,
                modelReasoning: this.modelReasoning,
                criticAudit: this.criticAudit,
                insightGraph: this.insightGraph,
                analyticalTraces: this.analyticalTraces,
                groundedQuestions: this.groundedQuestions,
                adaptiveStrategy: this.adaptiveStrategy,
                reliabilityProfile: this.reliabilityProfile,
                executionCost: this.executionCost,
                metadata: this.metadata
            };
        }
    }

    return DatasetKnowledgeModel;
}));
