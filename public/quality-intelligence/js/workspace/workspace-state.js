/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: workspace/workspace-state.js
 * ============================================================================
 * Interactive UI & Session State Manager for Step 6: Intelligence Workspace.
 * 
 * Manages:
 * - Active Consumption Mode ('executive' | 'analyst' | 'evidence')
 * - Selected Finding / Anomaly / Risk item for deep-dive
 * - Reusable Side Drawer / Modal State
 * - Active Investigation Session ID
 * - Filters for Category, Confidence, and Source Engine
 * - Interaction Audit History
 * 
 * Strict Invariants:
 * - 100% Domain-Agnostic
 * - Zero Side-effects on Underlying Data
 * - Safe Default Fallbacks
 * ============================================================================
 */

(function (window) {
    'use strict';

    const VALID_MODES = ['executive', 'analyst', 'evidence'];

    let _state = {
        mode: 'executive',
        selectedFindingId: null,
        activeDrawer: {
            isOpen: false,
            type: null, // 'evidence' | 'investigation' | 'whatif' | 'export'
            title: '',
            data: null
        },
        activeInvestigationId: null,
        filters: {
            category: 'all',
            engine: 'all',
            minConfidence: 0,
            minImportance: 0,
            searchQuery: ''
        },
        actionHistory: []
    };

    const WorkspaceState = {
        /**
         * Get the current active consumption mode
         * @returns {string} 'executive' | 'analyst' | 'evidence'
         */
        getMode() {
            return _state.mode;
        },

        /**
         * Set the active consumption mode
         * @param {string} mode
         * @returns {string} verified mode
         */
        setMode(mode) {
            const normalized = String(mode || '').toLowerCase().trim();
            if (VALID_MODES.includes(normalized)) {
                _state.mode = normalized;
                this.recordAction('MODE_SWITCH', { mode: normalized });
            }
            return _state.mode;
        },

        /**
         * Get the currently selected finding ID
         * @returns {string|null}
         */
        getSelectedFindingId() {
            return _state.selectedFindingId;
        },

        /**
         * Set selected finding ID
         * @param {string|null} id
         */
        setSelectedFindingId(id) {
            _state.selectedFindingId = id ? String(id) : null;
            if (id) {
                this.recordAction('SELECT_FINDING', { findingId: id });
            }
        },

        /**
         * Get active drawer state
         * @returns {Object}
         */
        getDrawer() {
            return { ..._state.activeDrawer };
        },

        /**
         * Open drawer modal
         * @param {string} type 'evidence' | 'investigation' | 'whatif' | 'export'
         * @param {string} title
         * @param {any} data
         */
        openDrawer(type, title = '', data = null) {
            _state.activeDrawer = {
                isOpen: true,
                type: String(type || 'evidence'),
                title: String(title || 'Details'),
                data: data ? JSON.parse(JSON.stringify(data)) : null
            };
            this.recordAction('OPEN_DRAWER', { type, title });
            return this.getDrawer();
        },

        /**
         * Close the active drawer modal
         */
        closeDrawer() {
            _state.activeDrawer = {
                isOpen: false,
                type: null,
                title: '',
                data: null
            };
            this.recordAction('CLOSE_DRAWER', {});
            return this.getDrawer();
        },

        /**
         * Get active investigation ID
         * @returns {string|null}
         */
        getActiveInvestigationId() {
            return _state.activeInvestigationId;
        },

        /**
         * Set active investigation ID
         * @param {string|null} id
         */
        setActiveInvestigationId(id) {
            _state.activeInvestigationId = id ? String(id) : null;
            if (id) {
                this.recordAction('SET_INVESTIGATION', { investigationId: id });
            }
        },

        /**
         * Get current filters
         * @returns {Object}
         */
        getFilters() {
            return { ..._state.filters };
        },

        /**
         * Update a specific filter or set of filters
         * @param {string|Object} keyOrObj
         * @param {any} val
         */
        setFilter(keyOrObj, val) {
            if (typeof keyOrObj === 'object' && keyOrObj !== null) {
                _state.filters = { ..._state.filters, ...keyOrObj };
            } else if (typeof keyOrObj === 'string') {
                _state.filters[keyOrObj] = val;
            }
            return this.getFilters();
        },

        /**
         * Reset filters to default
         */
        resetFilters() {
            _state.filters = {
                category: 'all',
                engine: 'all',
                minConfidence: 0,
                minImportance: 0,
                searchQuery: ''
            };
            return this.getFilters();
        },

        /**
         * Record an interaction in the action history
         * @param {string} actionType
         * @param {Object} details
         */
        recordAction(actionType, details = {}) {
            _state.actionHistory.push({
                timestamp: Date.now(),
                action: actionType,
                details
            });
            if (_state.actionHistory.length > 100) {
                _state.actionHistory.shift();
            }
        },

        /**
         * Get recent action history
         * @param {number} limit
         * @returns {Array}
         */
        getActionHistory(limit = 20) {
            return _state.actionHistory.slice(-limit);
        },

        /**
         * Get a snapshot of full workspace state
         * @returns {Object}
         */
        getState() {
            return JSON.parse(JSON.stringify(_state));
        },

        /**
         * Reset all state to clean initial values
         */
        reset() {
            _state = {
                mode: 'executive',
                selectedFindingId: null,
                activeDrawer: {
                    isOpen: false,
                    type: null,
                    title: '',
                    data: null
                },
                activeInvestigationId: null,
                filters: {
                    category: 'all',
                    engine: 'all',
                    minConfidence: 0,
                    minImportance: 0,
                    searchQuery: ''
                },
                actionHistory: []
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.WorkspaceState = WorkspaceState;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = WorkspaceState;
    }
})(typeof window !== 'undefined' ? window : global);
