/**
 * UDIP Analysis Knowledge State
 * 
 * Session-level analytical memory and context store for the UDIP platform.
 * Tracks dataset understanding, confirmed variable roles, active objectives,
 * hypotheses, evidence graph, and user feedback.
 * 
 * @module AnalysisKnowledgeState
 */

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.AnalysisKnowledgeState = factory();
        root.UDIPKnowledgeState = root.AnalysisKnowledgeState;
        if (root.UDIP) {
            root.UDIP.AnalysisKnowledgeState = root.AnalysisKnowledgeState;
            root.UDIP.UDIPKnowledgeState = root.AnalysisKnowledgeState;
        }
    }
}(typeof self !== 'undefined' ? self : this, function() {
    'use strict';

    /**
     * Variable Role Enumerations
     */
    const VariableRoles = Object.freeze({
        TARGET: 'TARGET',
        TIME: 'TIME',
        FEATURE: 'FEATURE',
        CATEGORY: 'CATEGORY',
        MEASUREMENT: 'MEASUREMENT',
        EVENT: 'EVENT',
        ID: 'ID',
        GROUP: 'GROUP',
        CONSTANT: 'CONSTANT',
        HIGH_CARDINALITY: 'HIGH_CARDINALITY',
        POTENTIAL_LEAKAGE: 'POTENTIAL_LEAKAGE',
        TEXT: 'TEXT',
        UNKNOWN: 'UNKNOWN'
    });

    /**
     * Analytical Objective Enumerations
     */
    const AnalyticalObjectives = Object.freeze({
        UNDERSTAND_DRIVERS: 'understand_drivers',
        PREDICT_OUTCOME: 'predict_outcome',
        DETECT_ANOMALIES: 'detect_anomalies',
        MONITOR_PROCESS: 'monitor_process',
        OPTIMIZE_PARAMETERS: 'optimize_parameters',
        EXPLORATORY_DISCOVERY: 'exploratory_discovery'
    });

    /**
     * Hypothesis Status Enumerations
     */
    const HypothesisStatus = Object.freeze({
        UNTESTED: 'Untested',
        SUPPORTED: 'Supported',
        WEAK_EVIDENCE: 'Weak Evidence',
        NOT_SUPPORTED: 'Not Supported',
        INSUFFICIENT_DATA: 'Insufficient Data'
    });

    class AnalysisKnowledgeState {
        /**
         * @param {Object} [initialState]
         */
        constructor(initialState = {}) {
            this.id = initialState.id || `ks_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            this.createdAt = initialState.createdAt || new Date().toISOString();
            this.updatedAt = new Date().toISOString();

            // 1. Dataset metadata & structural identity
            this.dataset = {
                name: initialState.dataset?.name || 'unnamed_dataset',
                rowCount: initialState.dataset?.rowCount || 0,
                columnCount: initialState.dataset?.columnCount || 0,
                columns: initialState.dataset?.columns || [],
                grain: initialState.dataset?.grain || '1 observation per row',
                domain: initialState.dataset?.domain || 'General',
                domainConfidence: initialState.dataset?.domainConfidence || 0.5,
                timeRange: initialState.dataset?.timeRange || null,
                samplingInterval: initialState.dataset?.samplingInterval || null,
                isTimeSeries: initialState.dataset?.isTimeSeries || false
            };

            // 2. Variable roles with confidence, evidence & confirmation status
            // Format: { [colName]: { role, confidence, evidence, userConfirmed, userOverridden, alternatives } }
            this.variableRoles = Object.assign({}, initialState.variableRoles || {});

            // 3. Active Analytical Objective
            this.objective = {
                primary: initialState.objective?.primary || AnalyticalObjectives.EXPLORATORY_DISCOVERY,
                confidence: initialState.objective?.confidence || 0.5,
                targetVariable: initialState.objective?.targetVariable || null,
                timeVariable: initialState.objective?.timeVariable || null,
                predictionHorizon: initialState.objective?.predictionHorizon || null,
                userConfirmed: initialState.objective?.userConfirmed || false,
                reasoning: initialState.objective?.reasoning || 'Default initial discovery mode'
            };

            // 4. Data Readiness & Quality Gates (8 concrete dimensions)
            this.readiness = {
                overallScore: 0,
                status: 'PENDING', // 'READY', 'CONDITIONAL', 'BLOCKED'
                dimensions: {
                    completeness: { score: 1.0, details: [] },
                    validity: { score: 1.0, details: [] },
                    consistency: { score: 1.0, details: [] },
                    uniqueness: { score: 1.0, details: [] },
                    temporalIntegrity: { score: 1.0, details: [] },
                    targetQuality: { score: 1.0, details: [] },
                    featureQuality: { score: 1.0, details: [] },
                    sampleSufficiency: { score: 1.0, details: [] }
                },
                blockers: [],
                warnings: []
            };
            if (initialState.readiness) {
                this.readiness = Object.assign(this.readiness, initialState.readiness);
            }

            // 5. Intelligent Questions (asked, answered, pending)
            this.questions = {
                pending: initialState.questions?.pending || [],
                answered: initialState.questions?.answered || [],
                history: initialState.questions?.history || []
            };

            // 6. Scientific Hypotheses
            this.hypotheses = initialState.hypotheses || [];

            // 7. Explainable Analysis Plan
            this.analysisPlan = {
                plannedMethods: initialState.analysisPlan?.plannedMethods || [],
                rejectedMethods: initialState.analysisPlan?.rejectedMethods || [],
                validationStrategy: initialState.analysisPlan?.validationStrategy || 'Standard Train/Test Split',
                rationale: initialState.analysisPlan?.rationale || 'Awaiting initial context confirmation'
            };

            // 8. Predictive Models & Honest Validation Results
            this.predictiveModels = initialState.predictiveModels || [];

            // 9. Evidence-Based Recommendations & Decision Actions
            this.recommendations = initialState.recommendations || [];

            // 10. Closed-Loop Outcome Interventions
            this.outcomeInterventions = initialState.outcomeInterventions || [];

            // 11. Traceable Evidence Graph
            this.evidenceGraph = {
                nodes: initialState.evidenceGraph?.nodes || [],
                edges: initialState.evidenceGraph?.edges || []
            };

            // 12. Active Unknowns & Ambiguities
            this.unknowns = initialState.unknowns || [];
        }

        /**
         * Update dataset structural identity
         * @param {Object} metadata
         */
        setDatasetIdentity(metadata) {
            this.dataset = Object.assign(this.dataset, metadata);
            this.touch();
        }

        /**
         * Set or update a variable role hypothesis
         * @param {string} colName
         * @param {string} role
         * @param {number} confidence
         * @param {string} evidence
         * @param {boolean} [userConfirmed=false]
         */
        setVariableRole(colName, role, confidence, evidence, userConfirmed = false) {
            if (!this.variableRoles[colName]) {
                this.variableRoles[colName] = {
                    role: VariableRoles.UNKNOWN,
                    confidence: 0,
                    evidence: '',
                    userConfirmed: false,
                    userOverridden: false,
                    alternatives: []
                };
            }

            const current = this.variableRoles[colName];
            if (userConfirmed) {
                current.role = role;
                current.confidence = 1.0;
                current.userConfirmed = true;
                current.userOverridden = true;
                current.evidence = `Confirmed by user: ${evidence || 'User explicit specification'}`;
            } else if (!current.userConfirmed) {
                current.role = role;
                current.confidence = Math.max(0, Math.min(1, confidence));
                current.evidence = evidence || '';
            }

            // Sync with objective targets if applicable
            if (role === VariableRoles.TARGET && (userConfirmed || !this.objective.targetVariable)) {
                this.objective.targetVariable = colName;
            }
            if (role === VariableRoles.TIME && (userConfirmed || !this.objective.timeVariable)) {
                this.objective.timeVariable = colName;
                this.dataset.isTimeSeries = true;
            }

            this.touch();
        }

        /**
         * Set active analytical objective
         * @param {string} objective
         * @param {string} [targetVariable]
         * @param {string} [timeVariable]
         * @param {string} [horizon]
         * @param {boolean} [userConfirmed=false]
         */
        setObjective(objective, targetVariable = null, timeVariable = null, horizon = null, userConfirmed = false) {
            this.objective.primary = objective;
            if (targetVariable) this.objective.targetVariable = targetVariable;
            if (timeVariable) this.objective.timeVariable = timeVariable;
            if (horizon) this.objective.predictionHorizon = horizon;
            if (userConfirmed) this.objective.userConfirmed = true;
            this.touch();
        }

        /**
         * Register an intelligent question
         * @param {Object} question
         */
        addQuestion(question) {
            if (!question.id) question.id = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const exists = this.questions.pending.some(q => q.id === question.id || q.question === question.question);
            if (!exists) {
                this.questions.pending.push(question);
                this.touch();
            }
        }

        /**
         * Process user's answer to an intelligent question and mutate knowledge state
         * @param {string} questionId
         * @param {string|Object} answer
         * @returns {Object} mutation summary
         */
        answerQuestion(questionId, answer) {
            let index = this.questions.pending.findIndex(q => q.id === questionId);
            if (index === -1) {
                index = this.questions.pending.findIndex(q => (q.targetColumn && q.targetColumn === questionId) ||
                    (q.category && questionId.includes(q.category)) ||
                    (q.id && (questionId.includes(q.id) || q.id.includes(questionId))));
            }
            if (index === -1 && this.questions.pending.length > 0 && typeof questionId === 'string' && (questionId.includes('target') || questionId.includes('objective'))) {
                index = 0;
            }

            if (index === -1) {
                // Check if already answered
                const existing = this.questions.answered.find(q => q.id === questionId);
                if (existing) {
                    existing.answer = answer;
                    existing.answeredAt = new Date().toISOString();
                    this.touch();
                    return { mutated: true, question: existing };
                }
                return { mutated: false, error: `Question ${questionId} not found` };
            }

            const question = this.questions.pending.splice(index, 1)[0];
            const answeredRecord = {
                ...question,
                answer,
                answeredAt: new Date().toISOString()
            };
            this.questions.answered.push(answeredRecord);
            this.questions.history.push({
                questionId,
                question: question.question,
                answer,
                timestamp: answeredRecord.answeredAt
            });

            // Perform dynamic mutations based on question category and answer
            this._applyAnswerMutation(answeredRecord);
            this.touch();

            return { mutated: true, question: answeredRecord };
        }

        /**
         * Internal rule-based mutation dispatcher upon question answering
         * @private
         */
        _applyAnswerMutation(answeredRecord) {
            const { category, answer, impactType, targetColumn } = answeredRecord;

            // Handle Target Confirmation / Correction
            if (category === 'TARGET_CONFIRMATION' || impactType === 'SET_TARGET') {
                const targetCol = targetColumn || (typeof answer === 'string' ? answer : answer.target);
                const ansStr = String(typeof answer === 'string' ? answer : (answer.value || answer.objective || '')).toLowerCase();

                if (targetCol && targetCol !== 'NONE' && targetCol !== 'NONE_OF_THE_ABOVE' && !ansStr.includes('none')) {
                    this.setVariableRole(targetCol, VariableRoles.TARGET, 1.0, 'Confirmed via Question Engine', true);
                    this.objective.targetVariable = targetCol;
                    
                    if (ansStr.includes('understand') || ansStr.includes('driver') || ansStr.includes('cause') || ansStr.includes('root') || ansStr.includes('why')) {
                        this.objective.primary = AnalyticalObjectives.UNDERSTAND_DRIVERS;
                    } else if (ansStr.includes('predict') || ansStr.includes('forecast')) {
                        this.objective.primary = AnalyticalObjectives.PREDICT_OUTCOME;
                    } else if (ansStr.includes('both')) {
                        this.objective.primary = AnalyticalObjectives.PREDICT_OUTCOME;
                    } else if (this.objective.primary === AnalyticalObjectives.EXPLORATORY_DISCOVERY) {
                        this.objective.primary = AnalyticalObjectives.PREDICT_OUTCOME;
                    }
                    this.objective.userConfirmed = true;
                } else if (targetCol === 'NONE' || ansStr.includes('none')) {
                    if (this.objective.targetVariable) {
                        this.setVariableRole(this.objective.targetVariable, VariableRoles.FEATURE, 1.0, 'Target demoted by user', true);
                        this.objective.targetVariable = null;
                    }
                    this.objective.primary = AnalyticalObjectives.EXPLORATORY_DISCOVERY;
                    this.objective.userConfirmed = true;
                }
            }

            // Handle Objective Confirmation
            if (category === 'OBJECTIVE_SELECTION' || impactType === 'SET_OBJECTIVE') {
                const selectedObj = typeof answer === 'string' ? answer.toLowerCase() : String(answer.objective || answer.value || '').toLowerCase();
                if (selectedObj.includes('predict') || selectedObj.includes('forecast')) {
                    this.objective.primary = AnalyticalObjectives.PREDICT_OUTCOME;
                } else if (selectedObj.includes('why') || selectedObj.includes('cause') || selectedObj.includes('root') || selectedObj.includes('understand') || selectedObj.includes('driver')) {
                    this.objective.primary = AnalyticalObjectives.UNDERSTAND_DRIVERS;
                } else if (selectedObj.includes('anomaly') || selectedObj.includes('outlier')) {
                    this.objective.primary = AnalyticalObjectives.DETECT_ANOMALIES;
                } else if (selectedObj.includes('monitor') || selectedObj.includes('spc') || selectedObj.includes('control') || selectedObj.includes('quality')) {
                    this.objective.primary = AnalyticalObjectives.MONITOR_PROCESS;
                } else if (selectedObj.includes('exploratory') || selectedObj.includes('discover') || selectedObj.includes('pattern')) {
                    this.objective.primary = AnalyticalObjectives.EXPLORATORY_DISCOVERY;
                }
                this.objective.userConfirmed = true;
            }

            // Handle Temporal Cadence & Grain
            if (category === 'TEMPORAL_GRAIN' || impactType === 'SET_GRAIN') {
                if (typeof answer === 'string') {
                    this.dataset.grain = answer;
                } else if (answer && answer.grain) {
                    this.dataset.grain = answer.grain;
                }
            }

            // Handle Prediction Horizon
            if (category === 'PREDICTION_HORIZON' || impactType === 'SET_HORIZON') {
                this.objective.predictionHorizon = typeof answer === 'string' ? answer : answer.horizon;
            }

            // Resolve corresponding unknown item
            if (answeredRecord.resolvesUnknown) {
                this.unknowns = this.unknowns.filter(u => u.id !== answeredRecord.resolvesUnknown);
            }
        }

        /**
         * Add or update a scientific hypothesis
         * @param {Object} hypothesis
         */
        addHypothesis(hypothesis) {
            if (!hypothesis.id) hypothesis.id = `hyp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const existingIndex = this.hypotheses.findIndex(h => h.id === hypothesis.id);
            if (existingIndex >= 0) {
                this.hypotheses[existingIndex] = Object.assign(this.hypotheses[existingIndex], hypothesis);
            } else {
                this.hypotheses.push({
                    id: hypothesis.id,
                    title: hypothesis.title || '',
                    description: hypothesis.description || '',
                    variables: hypothesis.variables || [],
                    expectedRelationship: hypothesis.expectedRelationship || 'association',
                    testMethod: hypothesis.testMethod || 'Statistical Correlation',
                    status: hypothesis.status || HypothesisStatus.UNTESTED,
                    confidence: hypothesis.confidence || 0.5,
                    evidence: hypothesis.evidence || [],
                    counterEvidence: hypothesis.counterEvidence || [],
                    isCausalClaim: false, // Strict non-causal default
                    disclaimer: 'Association detected. Causal inference has not been established.',
                    createdAt: new Date().toISOString()
                });
            }
            this.touch();
        }

        /**
         * Add an element to the evidence graph
         * @param {string} sourceId
         * @param {string} targetId
         * @param {string} relation
         * @param {Object} [metadata]
         */
        addEvidenceEdge(sourceId, targetId, relation, metadata = {}) {
            const exists = this.evidenceGraph.edges.some(e => e.source === sourceId && e.target === targetId && e.relation === relation);
            if (!exists) {
                this.evidenceGraph.edges.push({
                    source: sourceId,
                    target: targetId,
                    relation,
                    weight: metadata.weight || 1.0,
                    evidence: metadata.evidence || '',
                    timestamp: new Date().toISOString()
                });
                this.touch();
            }
        }

        /**
         * Add an unknown item to track
         * @param {Object} unknownItem
         */
        addUnknown(unknownItem) {
            if (!unknownItem.id) unknownItem.id = `unk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const exists = this.unknowns.some(u => u.id === unknownItem.id || u.description === unknownItem.description);
            if (!exists) {
                this.unknowns.push({
                    id: unknownItem.id,
                    description: unknownItem.description,
                    impact: unknownItem.impact || 'MEDIUM',
                    candidateQuestions: unknownItem.candidateQuestions || []
                });
                this.touch();
            }
        }

        /**
         * Update timestamp on mutation
         */
        touch() {
            this.updatedAt = new Date().toISOString();
        }

        /**
         * Serialize state to JSON string or clean POJO
         * @param {boolean} [asString=false]
         */
        toJSON(asString = false) {
            const data = {
                id: this.id,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt,
                dataset: this.dataset,
                variableRoles: this.variableRoles,
                objective: this.objective,
                readiness: this.readiness,
                questions: this.questions,
                hypotheses: this.hypotheses,
                analysisPlan: this.analysisPlan,
                predictiveModels: this.predictiveModels,
                recommendations: this.recommendations,
                outcomeInterventions: this.outcomeInterventions,
                evidenceGraph: this.evidenceGraph,
                unknowns: this.unknowns
            };
            return asString ? JSON.stringify(data, null, 2) : data;
        }

        /**
         * Create an instance from serialized state
         * @param {string|Object} json
         * @returns {AnalysisKnowledgeState}
         */
        static fromJSON(json) {
            const parsed = typeof json === 'string' ? JSON.parse(json) : json;
            return new AnalysisKnowledgeState(parsed);
        }
    }

    AnalysisKnowledgeState.VariableRoles = VariableRoles;
    AnalysisKnowledgeState.AnalyticalObjectives = AnalyticalObjectives;
    AnalysisKnowledgeState.HypothesisStatus = HypothesisStatus;

    return AnalysisKnowledgeState;
}));
