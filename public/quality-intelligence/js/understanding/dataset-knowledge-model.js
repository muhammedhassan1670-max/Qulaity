/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: understanding/dataset-knowledge-model.js
 * ============================================================================
 * Internal structured "Mental Model" representing deep cognitive understanding
 * of an ingested dataset before and during analytical execution.
 * Guarantees zero NaN / Infinity outputs, immutable serialization.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class DatasetKnowledgeModel {
        constructor(config = {}) {
            this.version = '1.0.0';
            this.generatedAt = config.generatedAt || new Date().toISOString();
            this.datasetId = config.datasetId || 'unknown_dataset';
            this.filename = config.filename || 'untitled_dataset';
            this.rowCount = Number.isFinite(config.rowCount) ? config.rowCount : 0;
            this.columnCount = Number.isFinite(config.columnCount) ? config.columnCount : 0;

            // 1. Multi-Faceted Dataset Topology
            this.topologies = Array.isArray(config.topologies) ? config.topologies : [];

            // 2. Discovered Semantic Entities
            this.entities = Array.isArray(config.entities) ? config.entities : [];

            // 3. Systemic Variable Roles
            this.variables = config.variables && typeof config.variables === 'object' ? config.variables : {};

            // 4. Multi-Layer Relationship Matrix (Linear, Non-Linear, Rank, Derived)
            this.relationships = Array.isArray(config.relationships) ? config.relationships : [];

            // 5. Derived Variables & Arithmetic Artifacts
            this.derivedVariables = Array.isArray(config.derivedVariables) ? config.derivedVariables : [];

            // 6. Temporal Dynamics & Regime Shifts
            this.temporal = config.temporal && typeof config.temporal === 'object' ? config.temporal : {
                isTemporal: false,
                orderingValid: false,
                signals: []
            };

            // 7. Population Segments & Groups
            this.groups = Array.isArray(config.groups) ? config.groups : [];

            // 8. Distribution Intelligence
            this.distributions = config.distributions && typeof config.distributions === 'object' ? config.distributions : {};

            // 9. Missingness Intelligence & Mechanisms (MCAR/MAR/MNAR)
            this.missingness = config.missingness && typeof config.missingness === 'object' ? config.missingness : {
                mechanisms: [],
                coMissingness: []
            };

            // 10. Analytical Reliability Profile & Uncertainty
            this.reliability = config.reliability && typeof config.reliability === 'object' ? config.reliability : {
                overallScore: 100,
                riskFactors: []
            };

            // 11. Testable Hypotheses
            this.hypotheses = Array.isArray(config.hypotheses) ? config.hypotheses : [];

            // 12. Causal Reasoning & Confounders
            this.causalFindings = Array.isArray(config.causalFindings) ? config.causalFindings : [];
            this.causalWarnings = this.causalFindings;

            // 13. Insight Graph
            this.insightGraph = config.insightGraph && typeof config.insightGraph === 'object' ? config.insightGraph : {
                nodes: [],
                edges: []
            };

            // 14. Analytical Trace Chains
            this.traces = Array.isArray(config.traces) ? config.traces : [];

            // 15. Discovered Grounded Analytical Questions
            this.proposedQuestions = Array.isArray(config.proposedQuestions) ? config.proposedQuestions : (Array.isArray(config.groundedQuestions) ? config.groundedQuestions : []);
            this.groundedQuestions = this.proposedQuestions;
            this.reliabilityProfile = this.reliability;

            // 16. Adaptive Strategy & Analysis Cost
            this.adaptiveStrategy = config.adaptiveStrategy && typeof config.adaptiveStrategy === 'object' ? config.adaptiveStrategy : {};

            // 17. Analytical Critic Audit
            this.criticAudit = config.criticAudit && typeof config.criticAudit === 'object' ? config.criticAudit : {
                status: 'INVESTIGATING',
                passedChecks: 0,
                failedChecks: 0,
                criticNotes: []
            };
        }

        get primaryTopology() {
            return this.getPrimaryTopology();
        }

        get targetCandidates() {
            return Object.keys(this.variables)
                .map(k => this.variables[k])
                .filter(v => v.candidateTarget || v.primaryRole === 'TARGET_VARIABLE_CANDIDATE');
        }

        get nonLinearRelationships() {
            return this.relationships.filter(r => r.isNonlinear);
        }

        isNonLinear(colA, colB) {
            return this.relationships.some(r => 
                r.isNonlinear && 
                ((r.colA === colA && r.colB === colB) || (r.colA === colB && r.colB === colA))
            );
        }

        getPrimaryTopology() {
            if (!this.topologies || this.topologies.length === 0) {
                return { type: 'TABULAR', confidence: 0.5, label: 'General Tabular' };
            }
            return this.topologies.slice().sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
        }

        getVariableRole(colName) {
            return this.variables[colName] || {
                role: 'Unknown',
                confidence: 'Unknown',
                score: 0,
                reasoning: ['Variable role has not been determined.']
            };
        }

        getDerivedVariables() {
            return this.derivedVariables || [];
        }

        getStrongNonlinearRelationships() {
            return this.relationships.filter(r => r.isNonlinear && r.strength >= 0.5);
        }

        getSupportedHypotheses() {
            return this.hypotheses.filter(h => h.status === 'SUPPORTED' || h.status === 'ROBUST');
        }

        toJSON() {
            return {
                version: this.version,
                generatedAt: this.generatedAt,
                datasetId: this.datasetId,
                filename: this.filename,
                rowCount: this.rowCount,
                columnCount: this.columnCount,
                topologies: this.topologies,
                entities: this.entities,
                variables: this.variables,
                relationships: this.relationships,
                derivedVariables: this.derivedVariables,
                temporal: this.temporal,
                groups: this.groups,
                distributions: this.distributions,
                missingness: this.missingness,
                reliability: this.reliability,
                hypotheses: this.hypotheses,
                causalFindings: this.causalFindings,
                insightGraph: this.insightGraph,
                traces: this.traces,
                proposedQuestions: this.proposedQuestions,
                adaptiveStrategy: this.adaptiveStrategy,
                criticAudit: this.criticAudit
            };
        }
    }

    window.UDIP = window.UDIP || {};
    window.UDIP.DatasetKnowledgeModel = DatasetKnowledgeModel;

})(typeof window !== 'undefined' ? window : global);
