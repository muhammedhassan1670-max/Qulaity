/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: enterprise/intelligence/model-manager.js
 * ============================================================================
 * Enterprise Model Registry.
 * Enforces rigorous machine learning model governance & lifecycle:
 * CANDIDATE -> VALIDATED -> APPROVED -> ACTIVE -> DEGRADED -> STALE -> REVIEW_REQUIRED -> RETIRED
 * Invariant: Never allow a model to transition to ACTIVE without passing
 * validation requirements and meeting governance thresholds.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const MODEL_STATUSES = Object.freeze({
        CANDIDATE: 'CANDIDATE',
        VALIDATED: 'VALIDATED',
        APPROVED: 'APPROVED',
        ACTIVE: 'ACTIVE',
        DEGRADED: 'DEGRADED',
        STALE: 'STALE',
        REVIEW_REQUIRED: 'REVIEW_REQUIRED',
        RETIRED: 'RETIRED'
    });

    class ModelManager {
        constructor() {
            this._repository = null;
        }

        _getRepo() {
            if (!this._repository) {
                const RepoClass = window.UDIP?.Enterprise?.Repository;
                if (RepoClass) {
                    this._repository = new RepoClass('models', 'mdl');
                }
            }
            return this._repository;
        }

        /**
         * Register a model in the Enterprise Registry
         * @param {Object} modelData
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        registerModel({
            projectId = 'prj_default',
            datasetVersionId = null,
            name = 'Predictive Model',
            target = '',
            features = [],
            algorithm = 'Random Forest / Gradient Boosted',
            metrics = {},
            validation = { passed: false, score: 0 },
            governanceScore = 0
        }, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) throw new Error('Model repository unavailable');

            // Default initial state: CANDIDATE, or VALIDATED if validation explicitly passed
            const initialStatus = (validation && validation.passed) ? MODEL_STATUSES.VALIDATED : MODEL_STATUSES.CANDIDATE;

            const model = repo.create({
                projectId,
                datasetVersionId,
                name,
                target,
                features: Array.isArray(features) ? features : [],
                algorithm,
                metrics: { ...metrics },
                validation: { ...validation },
                governanceScore: Number(governanceScore) || 0,
                status: initialStatus
            }, actorId);

            this._audit('MODEL_REGISTERED', model.id, projectId, actorId, {
                target,
                algorithm,
                status: model.status
            });

            return model;
        }

        /**
         * Approve a validated model for enterprise promotion
         * @param {string} modelId
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        approveModel(modelId, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) throw new Error('Model repository unavailable');

            const model = repo.findById(modelId);
            if (!model) throw new Error(`Model ${modelId} not found`);

            if (model.status === MODEL_STATUSES.RETIRED) {
                throw new Error('Cannot approve a retired model');
            }

            if (!model.validation || !model.validation.passed) {
                throw new Error('Model cannot be approved without passing analytical validation');
            }

            const updated = repo.update(modelId, {
                status: MODEL_STATUSES.APPROVED,
                approvedBy: actorId,
                approvedAt: new Date().toISOString()
            }, actorId);

            this._audit('MODEL_APPROVED', modelId, model.projectId, actorId, {
                governanceScore: model.governanceScore
            });

            return updated;
        }

        /**
         * Activate a model into active operational production
         * Enforces strict validation & governance safety threshold
         * @param {string} modelId
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        activateModel(modelId, actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) throw new Error('Model repository unavailable');

            const model = repo.findById(modelId);
            if (!model) throw new Error(`Model ${modelId} not found`);

            // Invariant: Validation must have passed and governance score must be >= 70
            if (!model.validation || !model.validation.passed) {
                throw new Error('Model activation failed: Model did not pass statistical/analytical validation');
            }

            if (model.governanceScore < 70) {
                throw new Error(`Model activation failed: Governance score (${model.governanceScore}) is below required minimum threshold (70)`);
            }

            const updated = repo.update(modelId, {
                status: MODEL_STATUSES.ACTIVE,
                activatedBy: actorId,
                activatedAt: new Date().toISOString()
            }, actorId);

            this._audit('MODEL_ACTIVATED', modelId, model.projectId, actorId, {
                governanceScore: model.governanceScore
            });

            return updated;
        }

        /**
         * Request review for a degraded or stale model
         * @param {string} modelId
         * @param {string} reason
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        requestReview(modelId, reason = 'Performance drift detected', actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return null;

            const model = repo.findById(modelId);
            if (!model) return null;

            const updated = repo.update(modelId, {
                status: MODEL_STATUSES.REVIEW_REQUIRED,
                reviewReason: reason
            }, actorId);

            this._audit('MODEL_REVIEW_REQUESTED', modelId, model.projectId, actorId, { reason });
            return updated;
        }

        /**
         * Retire a model
         * @param {string} modelId
         * @param {string} reason
         * @param {string} [actorId='system']
         * @returns {Object}
         */
        retireModel(modelId, reason = 'Model superseded or obsolete', actorId = 'system') {
            const repo = this._getRepo();
            if (!repo) return null;

            const model = repo.findById(modelId);
            if (!model) return null;

            const updated = repo.update(modelId, {
                status: MODEL_STATUSES.RETIRED,
                retiredBy: actorId,
                retiredAt: new Date().toISOString(),
                retirementReason: reason
            }, actorId);

            this._audit('MODEL_RETIRED', modelId, model.projectId, actorId, { reason });
            return updated;
        }

        /**
         * Get model by ID
         * @param {string} id
         * @returns {Object|null}
         */
        getModel(id) {
            const repo = this._getRepo();
            return repo ? repo.findById(id) : null;
        }

        /**
         * List models with optional project filtering
         * @param {string} [projectId]
         * @returns {Array<Object>}
         */
        listModels(projectId = null) {
            const repo = this._getRepo();
            if (!repo) return [];

            return repo.findAll(m => {
                if (projectId && m.projectId !== projectId) return false;
                return true;
            });
        }

        _audit(action, modelId, projectId, actorId, metadata) {
            try {
                const auditMgr = window.UDIP?.Enterprise?.AuditManager;
                if (auditMgr && typeof auditMgr.logEvent === 'function') {
                    auditMgr.logEvent({
                        actorId,
                        action,
                        resourceType: 'MODEL',
                        resourceId: modelId,
                        projectId,
                        result: 'SUCCESS',
                        metadata
                    });
                }
            } catch (e) {
                // Non-blocking
            }
        }
    }

    const instance = new ModelManager();

    // Export
    window.UDIP = window.UDIP || {};
    window.UDIP.Enterprise = window.UDIP.Enterprise || {};
    window.UDIP.Enterprise.ModelManager = instance;
    window.UDIP.Enterprise.MODEL_STATUSES = MODEL_STATUSES;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);
