/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: workspace/investigation/investigation-state.js
 * ============================================================================
 * Active Investigation State & Persistent History Management.
 * 
 * Tracks guided investigations through the 7-step lifecycle:
 * Step 1: Select Finding / Anomaly / Risk
 * Step 2: Review Supporting Evidence
 * Step 3: Formulate Hypothesis
 * Step 4: Explore Candidate Drivers
 * Step 5: Simulate Scenarios / What-If
 * Step 6: Evaluate Alternative Explanations
 * Step 7: Record Conclusion & Decision Action
 * ============================================================================
 */

(function (window) {
    'use strict';

    let _investigations = [];
    let _activeId = null;

    const InvestigationState = {
        /**
         * Create a new investigation session
         * @param {Object} params
         * @returns {Object} New investigation object
         */
        createInvestigation({
            title = 'New Investigation',
            findingId = null,
            targetVariable = null,
            relatedVariables = [],
            initialHypothesis = null
        } = {}) {
            const id = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const newInv = {
                id,
                title: String(title),
                findingId,
                targetVariable: targetVariable ? String(targetVariable) : null,
                relatedVariables: Array.isArray(relatedVariables) ? [...relatedVariables] : [],
                currentStep: 1, // 1 to 7
                status: 'OPEN', // 'OPEN' | 'INVESTIGATING' | 'SUPPORTED' | 'INCONCLUSIVE' | 'CLOSED'
                hypotheses: initialHypothesis ? [initialHypothesis] : [],
                evidenceLinks: [],
                simulations: [],
                conclusions: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            _investigations.push(newInv);
            _activeId = id;
            return { ...newInv };
        },

        /**
         * Get active investigation
         * @returns {Object|null}
         */
        getActiveInvestigation() {
            if (!_activeId) {
                // If there are investigations, pick the most recent
                if (_investigations.length > 0) {
                    _activeId = _investigations[_investigations.length - 1].id;
                } else {
                    return null;
                }
            }
            const found = _investigations.find(inv => inv.id === _activeId);
            return found ? { ...found } : null;
        },

        /**
         * Set active investigation by ID
         * @param {string} id
         */
        setActiveInvestigation(id) {
            if (_investigations.some(inv => inv.id === id)) {
                _activeId = id;
                return true;
            }
            return false;
        },

        /**
         * Update investigation fields
         * @param {string} id
         * @param {Object} updates
         */
        updateInvestigation(id, updates = {}) {
            const idx = _investigations.findIndex(inv => inv.id === id);
            if (idx === -1) return null;

            _investigations[idx] = {
                ..._investigations[idx],
                ...updates,
                updatedAt: Date.now()
            };
            return { ..._investigations[idx] };
        },

        /**
         * Advance investigation to the next guided step (1 to 7)
         * @param {string} id
         */
        advanceStep(id) {
            const inv = _investigations.find(i => i.id === id);
            if (!inv) return null;
            if (inv.currentStep < 7) {
                inv.currentStep += 1;
                inv.updatedAt = Date.now();
                if (inv.status === 'OPEN') inv.status = 'INVESTIGATING';
            }
            return { ...inv };
        },

        /**
         * Add a tested hypothesis to an investigation
         * @param {string} id
         * @param {Object} hypothesis
         */
        addHypothesis(id, hypothesis) {
            const inv = _investigations.find(i => i.id === id);
            if (!inv) return null;

            const hypRecord = {
                id: hypothesis.id || `hyp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                statement: hypothesis.statement || '',
                variableA: hypothesis.variableA || null,
                variableB: hypothesis.variableB || null,
                status: hypothesis.status || 'UNTESTED', // 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'WEAKENED' | 'REJECTED' | 'INSUFFICIENT_EVIDENCE'
                confidence: hypothesis.confidence || 50,
                evidenceSummary: hypothesis.evidenceSummary || '',
                createdAt: Date.now()
            };

            inv.hypotheses.push(hypRecord);
            inv.updatedAt = Date.now();
            return hypRecord;
        },

        /**
         * Add a simulation result
         * @param {string} id
         * @param {Object} simulation
         */
        addSimulation(id, simulation) {
            const inv = _investigations.find(i => i.id === id);
            if (!inv) return null;

            inv.simulations.push({
                id: `sim_${Date.now()}`,
                ...simulation,
                createdAt: Date.now()
            });
            inv.updatedAt = Date.now();
            return { ...inv };
        },

        /**
         * Record a final conclusion
         * @param {string} id
         * @param {Object} conclusion
         */
        addConclusion(id, conclusion) {
            const inv = _investigations.find(i => i.id === id);
            if (!inv) return null;

            const conclusionObj = {
                id: `concl_${Date.now()}`,
                summary: conclusion.summary || '',
                decisionAction: conclusion.decisionAction || '',
                evidenceConfidence: conclusion.evidenceConfidence || 80,
                status: conclusion.status || 'CLOSED',
                createdAt: Date.now()
            };

            inv.conclusions.push(conclusionObj);
            inv.status = conclusion.status || 'CLOSED';
            inv.currentStep = 7;
            inv.updatedAt = Date.now();
            return { ...inv };
        },

        /**
         * List all recorded investigations
         * @returns {Array<Object>}
         */
        listInvestigations() {
            return _investigations.map(inv => ({ ...inv }));
        },

        /**
         * Reset investigation store
         */
        reset() {
            _investigations = [];
            _activeId = null;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.InvestigationState = InvestigationState;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = InvestigationState;
    }
})(typeof window !== 'undefined' ? window : global);
