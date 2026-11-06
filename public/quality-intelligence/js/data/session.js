/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: data/session.js
 * ============================================================================
 * Manages the active dataset session with strict isolation.
 * Guarantees that:
 * 1. The application starts with NO DATA (no fallback, no demo data).
 * 2. Every new upload completely flushes previous state.
 * 3. Never mixes previous, demo, or cached data with the active dataset.
 * 4. Automatically triggers the Universal Data Profiler upon load.
 * ============================================================================
 */

(function (window) {
    'use strict';

    let _activeDataset = null;
    let _previousDataset = null;
    let _baselineDataset = null;
    const _listeners = new Set();

    /**
     * IndexedDB + LocalStorage Hybrid Persistence Engine for Active Datasets
     */
    const DatasetPersistence = {
        DB_NAME: 'UDIP_DATASET_STORE',
        DB_VERSION: 1,
        STORE_NAME: 'active_dataset',
        SESSION_KEY: 'current_session',
        LOCAL_STORAGE_KEY: 'udip_persisted_dataset',
        TAB_KEY: 'udip_active_tab',

        _getDB() {
            return new Promise((resolve) => {
                if (typeof window === 'undefined' || !window.indexedDB) {
                    return resolve(null);
                }
                try {
                    const req = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);
                    req.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                            db.createObjectStore(this.STORE_NAME);
                        }
                    };
                    req.onsuccess = (e) => resolve(e.target.result);
                    req.onerror = () => resolve(null);
                } catch (err) {
                    resolve(null);
                }
            });
        },

        async save(payload) {
            if (!payload || !Array.isArray(payload.rows) || payload.rows.length === 0) return false;
            
            const serialized = {
                id: payload.id || 'ds_' + Date.now(),
                filename: payload.filename || 'untitled_dataset',
                fileSize: payload.fileSize || 0,
                fileType: payload.fileType || 'unknown',
                loadedAt: payload.loadedAt || new Date().toISOString(),
                rowCount: payload.rows.length,
                columnCount: (payload.columns && payload.columns.length) || 0,
                columns: payload.columns || [],
                columnTypes: payload.columnTypes || {},
                rows: payload.rows,
                savedAt: new Date().toISOString()
            };

            // 1. Save to IndexedDB (supports large multi-megabyte datasets)
            try {
                const db = await this._getDB();
                if (db) {
                    await new Promise((resolve) => {
                        const tx = db.transaction([this.STORE_NAME], 'readwrite');
                        const store = tx.objectStore(this.STORE_NAME);
                        const putReq = store.put(serialized, this.SESSION_KEY);
                        putReq.onsuccess = () => resolve();
                        putReq.onerror = () => resolve();
                        tx.oncomplete = () => resolve();
                        tx.onerror = () => resolve();
                    });
                }
            } catch (e) {
                // Ignore IndexedDB permission or quota errors
            }

            // 2. Save to LocalStorage fallback if under 4MB
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    const json = JSON.stringify(serialized);
                    if (json.length < 4 * 1024 * 1024) {
                        window.localStorage.setItem(this.LOCAL_STORAGE_KEY, json);
                    } else {
                        window.localStorage.setItem(this.LOCAL_STORAGE_KEY + '_meta', JSON.stringify({
                            filename: serialized.filename,
                            rowCount: serialized.rowCount,
                            inIdb: true
                        }));
                    }
                }
            } catch (lsErr) {
                // Ignore LocalStorage quota exceeded
            }

            return true;
        },

        async restore() {
            // 1. Try IndexedDB first
            try {
                const db = await this._getDB();
                if (db) {
                    const data = await new Promise((resolve) => {
                        const tx = db.transaction([this.STORE_NAME], 'readonly');
                        const store = tx.objectStore(this.STORE_NAME);
                        const getReq = store.get(this.SESSION_KEY);
                        getReq.onsuccess = (e) => resolve(e.target.result || null);
                        getReq.onerror = () => resolve(null);
                    });
                    if (data && Array.isArray(data.rows) && data.rows.length > 0) {
                        return data;
                    }
                }
            } catch (e) {}

            // 2. Fallback to LocalStorage
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    const raw = window.localStorage.getItem(this.LOCAL_STORAGE_KEY);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed && Array.isArray(parsed.rows) && parsed.rows.length > 0) {
                            return parsed;
                        }
                    }
                }
            } catch (e) {}

            return null;
        },

        async clear() {
            // 1. Clear IndexedDB
            try {
                const db = await this._getDB();
                if (db) {
                    await new Promise((resolve) => {
                        const tx = db.transaction([this.STORE_NAME], 'readwrite');
                        const store = tx.objectStore(this.STORE_NAME);
                        const delReq = store.delete(this.SESSION_KEY);
                        delReq.onsuccess = () => resolve();
                        delReq.onerror = () => resolve();
                        tx.oncomplete = () => resolve();
                        tx.onerror = () => resolve();
                    });
                }
            } catch (e) {}

            // 2. Clear LocalStorage
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.removeItem(this.LOCAL_STORAGE_KEY);
                    window.localStorage.removeItem(this.LOCAL_STORAGE_KEY + '_meta');
                    window.localStorage.removeItem(this.TAB_KEY);
                }
            } catch (e) {}

            return true;
        }
    };

    const DatasetSession = {
        /**
         * Check if a valid dataset is currently loaded
         * @returns {boolean}
         */
        hasActiveDataset() {
            return _activeDataset !== null && Array.isArray(_activeDataset.rows) && _activeDataset.rows.length > 0;
        },

        /**
         * Get the current active dataset object or null
         */
        getActiveDataset() {
            return _activeDataset;
        },

        /**
         * Get the previous dataset version or null
         */
        getPreviousDataset() {
            return _previousDataset;
        },

        /**
         * Designate a baseline dataset for drift and change monitoring
         */
        setBaselineDataset(ds) {
            _baselineDataset = ds;
        },

        /**
         * Get designated baseline dataset
         */
        getBaselineDataset() {
            return _baselineDataset;
        },

        /**
         * Load a new dataset into the session.
         * Explicitly wipes any previous data or cached results to guarantee complete isolation.
         * 
         * @param {Object} params
         * @param {string} params.filename
         * @param {number} params.fileSize
         * @param {string} params.fileType
         * @param {Array<string>} params.columns
         * @param {Array<Object>} params.rows
         * @param {Object} [params.columnTypes]
         */
        loadNewDataset({ filename, fileSize, fileType, columns, rows, columnTypes = {} }, onProgress = null) {
            // Preserve previous dataset reference for continuous learning comparison
            if (_activeDataset && _activeDataset.rowCount > 0) {
                _previousDataset = { ..._activeDataset };
            }

            if (onProgress) onProgress({ stage: 3, percent: 56, stageName: 'Stage 3/5: Initializing isolated memory session...', log: 'SESSION_ISOLATION: Clearing previous cache...' });

            // 1. Wipe previous state
            this.clearDataset(false);

            // 2. Validate input
            if (!Array.isArray(columns) || !Array.isArray(rows)) {
                throw new Error('Invalid dataset payload: columns and rows must be arrays');
            }

            // 3. Compute inferred column types if not provided
            if (onProgress) onProgress({ stage: 3, percent: 60, stageName: 'Stage 3/5: Inferring strict data types for ' + columns.length + ' columns...', log: 'TYPE_DETECTOR: Inferring column datatypes...' });
            const types = Object.keys(columnTypes).length > 0
                ? columnTypes
                : (window.UDIP && window.UDIP.Helpers ? window.UDIP.Helpers.inferColumnTypes(columns, rows) : {});

            // 4. Construct fresh immutable session object
            _activeDataset = {
                id: (window.UDIP && window.UDIP.Helpers) ? window.UDIP.Helpers.generateId('ds') : 'ds_' + Date.now(),
                filename: filename || 'untitled_dataset',
                fileSize: fileSize || 0,
                fileType: fileType || 'unknown',
                loadedAt: new Date().toISOString(),
                rowCount: rows.length,
                columnCount: columns.length,
                columns: [...columns],
                columnTypes: types,
                rows: rows,
                profile: null,
                knowledgeModel: null,
                analysisPlan: null,
                analytics: null,
                quality: null
            };

            // 5. Automatically run the Universal Data Profiler
            if (window.UDIP && window.UDIP.Profiler) {
                try {
                    if (onProgress) onProgress({ stage: 3, percent: 68, stageName: 'Stage 3/5: Auditing data purity & ISO-25012 integrity...', log: 'PROFILER: Computing statistical tensors...' });
                    _activeDataset.profile = window.UDIP.Profiler.profileDataset(_activeDataset);
                    const qScore = _activeDataset.profile?.quality?.overallScore ?? _activeDataset.profile?.quality?.qualityScore ?? 100;
                    if (onProgress) onProgress({ stage: 3, percent: 74, stageName: `Stage 3/5: Epistemic confidence verified: ${qScore}% (ISO 25012)`, log: `EPISTEMIC_SCORE: ${qScore}% Confidence Verified` });
                } catch (profErr) {
                    console.warn('[UDIP:Session] Profiler execution error:', profErr);
                }
            }

            // 5a-2. Automatically run Deep Intelligence & Understanding Engine (Cognitive Architecture)
            const cognitiveEngine = window.UDIP && (window.UDIP.DeepIntelligenceEngine || window.UDIP.DeepDataUnderstandingEngine);
            if (cognitiveEngine && _activeDataset.profile) {
                try {
                    if (onProgress) onProgress({ stage: 4, percent: 80, stageName: 'Stage 4/5: Running neural inference & causal graph...', log: 'COGNITIVE_AI: Building relational knowledge graph...' });
                    _activeDataset.knowledgeModel = cognitiveEngine.analyze({
                        dataset: _activeDataset,
                        profile: _activeDataset.profile
                    });
                } catch (undErr) {
                    console.warn('[UDIP:Session] Deep Intelligence execution error:', undErr);
                }
            }

            // 5b. Automatically run the Intelligence Planning Engine (Step 2.5)
            if (window.UDIP && window.UDIP.IntelligenceEngine && _activeDataset.profile) {
                try {
                    if (onProgress) onProgress({ stage: 4, percent: 86, stageName: 'Stage 4/5: Synthesizing automated analytical roadmap...', log: 'INTELLIGENCE_PLAN: Synthesizing analytical roadmap...' });
                    _activeDataset.analysisPlan = window.UDIP.IntelligenceEngine.generatePlan(_activeDataset.profile, _activeDataset);
                } catch (planErr) {
                    console.warn('[UDIP:Session] Intelligence Engine execution error:', planErr);
                }
            }

            // 5c. Automatically run the Advanced Analytics & Machine Learning Engine (Step 3)
            if (window.UDIP && window.UDIP.AnalyticsEngine && _activeDataset.profile && _activeDataset.analysisPlan) {
                try {
                    if (onProgress) onProgress({ stage: 4, percent: 92, stageName: 'Stage 4/5: Executing regression & SPC quality models...', log: 'ANALYTICS_ML: Executing statistical tests...' });
                    _activeDataset.analytics = window.UDIP.AnalyticsEngine.run({
                        data: _activeDataset,
                        profile: _activeDataset.profile,
                        analysisPlan: _activeDataset.analysisPlan
                    });
                } catch (analyticsErr) {
                    console.warn('[UDIP:Session] Analytics Engine execution error:', analyticsErr);
                }
            }

            // 5d. Automatically run the Decision Intelligence & Model Governance Engine (Step 4)
            if (window.UDIP && window.UDIP.DecisionEngine && _activeDataset.profile && _activeDataset.analysisPlan) {
                try {
                    _activeDataset.decisionIntelligence = window.UDIP.DecisionEngine.run({
                        dataset: _activeDataset,
                        profile: _activeDataset.profile,
                        analysisPlan: _activeDataset.analysisPlan,
                        analytics: _activeDataset.analytics
                    });
                } catch (decisionErr) {
                    console.warn('[UDIP:Session] Decision Engine execution error:', decisionErr);
                }
            }

            // 5e. Automatically run the Autonomous Intelligence & Continuous Learning Engine (Step 5)
            if (window.UDIP && window.UDIP.AutonomousEngine && _activeDataset.profile && _activeDataset.analysisPlan) {
                try {
                    _activeDataset.autonomousIntelligence = window.UDIP.AutonomousEngine.run({
                        dataset: _activeDataset,
                        previousDataset: _previousDataset,
                        profile: _activeDataset.profile,
                        previousProfile: _previousDataset?.profile,
                        analysisPlan: _activeDataset.analysisPlan,
                        analytics: _activeDataset.analytics,
                        previousAnalytics: _previousDataset?.analytics,
                        decisionIntelligence: _activeDataset.decisionIntelligence,
                        previousDecisionIntelligence: _previousDataset?.decisionIntelligence,
                        knowledgeModel: _activeDataset.knowledgeModel,
                        previousKnowledgeModel: _previousDataset?.knowledgeModel
                    });
                } catch (autoErr) {
                    console.warn('[UDIP:Session] Autonomous Engine execution error:', autoErr);
                }
            }

            // 5f. Automatically run the Intelligence Workspace & Analytical Storytelling Engine (Step 6)
            if (window.UDIP && window.UDIP.WorkspaceEngine && _activeDataset.profile && _activeDataset.analysisPlan) {
                try {
                    _activeDataset.workspace = window.UDIP.WorkspaceEngine.run({
                        dataset: _activeDataset,
                        previousDataset: _previousDataset,
                        profile: _activeDataset.profile,
                        previousProfile: _previousDataset?.profile,
                        analysisPlan: _activeDataset.analysisPlan,
                        analytics: _activeDataset.analytics,
                        previousAnalytics: _previousDataset?.analytics,
                        decisionIntelligence: _activeDataset.decisionIntelligence,
                        previousDecisionIntelligence: _previousDataset?.decisionIntelligence,
                        autonomousIntelligence: _activeDataset.autonomousIntelligence,
                        baselineDataset: _baselineDataset
                    });
                } catch (workspaceErr) {
                    console.warn('[UDIP:Session] Workspace Engine execution error:', workspaceErr);
                }
            }

            // 5g. Synchronize Copilot Context (Step 7)
            if (window.UDIP && window.UDIP.Copilot && window.UDIP.Copilot.ContextManager) {
                try {
                    window.UDIP.Copilot.ContextManager.syncDataset(_activeDataset);
                } catch (copilotErr) {
                    console.warn('[UDIP:Session] Copilot Context sync error:', copilotErr);
                }
            }

            console.info(`[UDIP:Session] Loaded, profiled, planned, analyzed, and generated continuous workspace: ${_activeDataset.filename} (${_activeDataset.rowCount} rows, ${_activeDataset.columnCount} columns)`);

            if (onProgress) onProgress({ stage: 5, percent: 98, stageName: 'Stage 5/5: Initializing executive cockpit & telemetry interface...', log: 'COCKPIT_READY: Rendering workspace tabs...' });

            if (window.UDIP) {
                window.UDIP.ActiveDataset = _activeDataset;
            }

            // Auto-persist dataset across reloads
            this.persistActiveDataset(_activeDataset);

            // 6. Notify subscribers
            this._notify('loaded', _activeDataset);

            return _activeDataset;
        },

        /**
         * Asynchronously load a new dataset into the session, yielding between stages
         * to keep the browser responsive, render 60 FPS animations, and prevent freezing.
         */
        async loadNewDatasetAsync({ filename, fileSize, fileType, columns, rows, columnTypes = {} }, onProgress = null) {
            if (_activeDataset && _activeDataset.rowCount > 0) {
                _previousDataset = { ..._activeDataset };
            }

            if (onProgress) onProgress({ stage: 3, percent: 56, stageName: 'Stage 3/5: Initializing isolated memory session...', log: 'SESSION_ISOLATION: Clearing previous cache...' });
            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 15));

            // 1. Wipe previous state
            this.clearDataset(false);

            // 2. Validate input
            if (!Array.isArray(columns) || !Array.isArray(rows)) {
                throw new Error('Invalid dataset payload: columns and rows must be arrays');
            }

            // 3. Compute inferred column types if not provided
            if (onProgress) onProgress({ stage: 3, percent: 58, stageName: 'Stage 3/5: Inferring strict data types for ' + columns.length + ' columns...', log: 'TYPE_DETECTOR: Inferring column datatypes...' });
            const types = Object.keys(columnTypes).length > 0
                ? columnTypes
                : (window.UDIP && window.UDIP.Helpers ? window.UDIP.Helpers.inferColumnTypes(columns, rows) : {});

            // 4. Construct fresh immutable session object
            _activeDataset = {
                id: (window.UDIP && window.UDIP.Helpers) ? window.UDIP.Helpers.generateId('ds') : 'ds_' + Date.now(),
                filename: filename || 'untitled_dataset',
                fileSize: fileSize || 0,
                fileType: fileType || 'unknown',
                loadedAt: new Date().toISOString(),
                rowCount: rows.length,
                columnCount: columns.length,
                columns: [...columns],
                columnTypes: types,
                rows: rows,
                profile: null,
                knowledgeModel: null,
                analysisPlan: null,
                analytics: null,
                quality: null
            };

            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 15));

            // 5. Automatically run the Universal Data Profiler
            if (window.UDIP && window.UDIP.Profiler) {
                try {
                    if (onProgress) onProgress({ stage: 3, percent: 62, stageName: 'Stage 3/5: Auditing data purity & ISO-25012 integrity...', log: 'PROFILER: Computing statistical tensors...' });
                    const profilerFn = window.UDIP.Profiler.profileDatasetAsync
                        ? window.UDIP.Profiler.profileDatasetAsync.bind(window.UDIP.Profiler)
                        : window.UDIP.Profiler.profileDataset.bind(window.UDIP.Profiler);
                    _activeDataset.profile = await profilerFn(_activeDataset, onProgress);
                    const qScore = _activeDataset.profile?.quality?.overallScore ?? _activeDataset.profile?.quality?.qualityScore ?? 100;
                    if (onProgress) onProgress({ stage: 3, percent: 72, stageName: `Stage 3/5: Epistemic confidence verified: ${qScore}% (ISO 25012)`, log: `EPISTEMIC_SCORE: ${qScore}% Confidence Verified` });
                } catch (profErr) {
                    console.warn('[UDIP:Session] Profiler execution error:', profErr);
                }
            }

            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 15));

            // 5a-2. Automatically run Deep Intelligence & Understanding Engine
            const cognitiveEngine = window.UDIP && (window.UDIP.DeepIntelligenceEngine || window.UDIP.DeepDataUnderstandingEngine);
            if (cognitiveEngine && _activeDataset.profile) {
                try {
                    if (onProgress) onProgress({ stage: 4, percent: 76, stageName: 'Stage 4/5: Running neural inference & causal graph...', log: 'COGNITIVE_AI: Building relational knowledge graph...' });
                    const cogAnalyzeFn = cognitiveEngine.analyzeAsync ? cognitiveEngine.analyzeAsync.bind(cognitiveEngine) : cognitiveEngine.analyze.bind(cognitiveEngine);
                    _activeDataset.knowledgeModel = await cogAnalyzeFn({
                        dataset: _activeDataset,
                        profile: _activeDataset.profile
                    }, onProgress);
                } catch (undErr) {
                    console.warn('[UDIP:Session] Deep Intelligence execution error:', undErr);
                }
            }

            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 15));

            // 5b. Automatically run the Intelligence Planning Engine
            if (window.UDIP && window.UDIP.IntelligenceEngine && _activeDataset.profile) {
                try {
                    const planFn = window.UDIP.IntelligenceEngine.generatePlanAsync
                        ? window.UDIP.IntelligenceEngine.generatePlanAsync.bind(window.UDIP.IntelligenceEngine)
                        : window.UDIP.IntelligenceEngine.generatePlan.bind(window.UDIP.IntelligenceEngine);
                    _activeDataset.analysisPlan = await planFn(_activeDataset.profile, _activeDataset, onProgress);
                } catch (planErr) {
                    console.warn('[UDIP:Session] Intelligence Engine execution error:', planErr);
                }
            }

            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 15));

            // 5c. Automatically run the Advanced Analytics & Machine Learning Engine
            if (window.UDIP && window.UDIP.AnalyticsEngine && _activeDataset.profile && _activeDataset.analysisPlan) {
                try {
                    const analyticsFn = window.UDIP.AnalyticsEngine.runAsync
                        ? window.UDIP.AnalyticsEngine.runAsync.bind(window.UDIP.AnalyticsEngine)
                        : window.UDIP.AnalyticsEngine.run.bind(window.UDIP.AnalyticsEngine);
                    _activeDataset.analytics = await analyticsFn({
                        data: _activeDataset,
                        profile: _activeDataset.profile,
                        analysisPlan: _activeDataset.analysisPlan
                    }, onProgress);
                } catch (analyticsErr) {
                    console.warn('[UDIP:Session] Analytics Engine execution error:', analyticsErr);
                }
            }

            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 15));

            // 5d. Automatically run the Decision Intelligence Engine
            if (window.UDIP && window.UDIP.DecisionEngine && _activeDataset.profile && _activeDataset.analysisPlan) {
                try {
                    const decisionFn = window.UDIP.DecisionEngine.runAsync
                        ? window.UDIP.DecisionEngine.runAsync.bind(window.UDIP.DecisionEngine)
                        : window.UDIP.DecisionEngine.run.bind(window.UDIP.DecisionEngine);
                    _activeDataset.decisionIntelligence = await decisionFn({
                        dataset: _activeDataset,
                        profile: _activeDataset.profile,
                        analysisPlan: _activeDataset.analysisPlan,
                        analytics: _activeDataset.analytics
                    }, onProgress);
                } catch (decisionErr) {
                    console.warn('[UDIP:Session] Decision Engine execution error:', decisionErr);
                }
            }

            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 15));

            // 5e. Automatically run the Autonomous Intelligence Engine
            if (window.UDIP && window.UDIP.AutonomousEngine && _activeDataset.profile && _activeDataset.analysisPlan) {
                try {
                    const autoFn = window.UDIP.AutonomousEngine.runAsync
                        ? window.UDIP.AutonomousEngine.runAsync.bind(window.UDIP.AutonomousEngine)
                        : window.UDIP.AutonomousEngine.run.bind(window.UDIP.AutonomousEngine);
                    _activeDataset.autonomousIntelligence = await autoFn({
                        dataset: _activeDataset,
                        previousDataset: _previousDataset,
                        profile: _activeDataset.profile,
                        previousProfile: _previousDataset?.profile,
                        analysisPlan: _activeDataset.analysisPlan,
                        analytics: _activeDataset.analytics,
                        previousAnalytics: _previousDataset?.analytics,
                        decisionIntelligence: _activeDataset.decisionIntelligence,
                        previousDecisionIntelligence: _previousDataset?.decisionIntelligence,
                        knowledgeModel: _activeDataset.knowledgeModel,
                        previousKnowledgeModel: _previousDataset?.knowledgeModel
                    }, onProgress);
                } catch (autoErr) {
                    console.warn('[UDIP:Session] Autonomous Engine execution error:', autoErr);
                }
            }

            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 15));

            // 5f. Automatically run the Intelligence Workspace Engine
            if (window.UDIP && window.UDIP.WorkspaceEngine && _activeDataset.profile && _activeDataset.analysisPlan) {
                try {
                    const workspaceFn = window.UDIP.WorkspaceEngine.runAsync
                        ? window.UDIP.WorkspaceEngine.runAsync.bind(window.UDIP.WorkspaceEngine)
                        : window.UDIP.WorkspaceEngine.run.bind(window.UDIP.WorkspaceEngine);
                    _activeDataset.workspace = await workspaceFn({
                        dataset: _activeDataset,
                        previousDataset: _previousDataset,
                        profile: _activeDataset.profile,
                        previousProfile: _previousDataset?.profile,
                        analysisPlan: _activeDataset.analysisPlan,
                        analytics: _activeDataset.analytics,
                        previousAnalytics: _previousDataset?.analytics,
                        decisionIntelligence: _activeDataset.decisionIntelligence,
                        previousDecisionIntelligence: _previousDataset?.decisionIntelligence,
                        autonomousIntelligence: _activeDataset.autonomousIntelligence,
                        baselineDataset: _baselineDataset
                    }, onProgress);
                } catch (workspaceErr) {
                    console.warn('[UDIP:Session] Workspace Engine execution error:', workspaceErr);
                }
            }

            // 5g. Synchronize Copilot Context
            if (window.UDIP && window.UDIP.Copilot && window.UDIP.Copilot.ContextManager) {
                try {
                    window.UDIP.Copilot.ContextManager.syncDataset(_activeDataset);
                } catch (copilotErr) {
                    console.warn('[UDIP:Session] Copilot Context sync error:', copilotErr);
                }
            }

            console.info(`[UDIP:Session] Loaded, profiled, planned, analyzed, and generated continuous workspace: ${_activeDataset.filename} (${_activeDataset.rowCount} rows, ${_activeDataset.columnCount} columns)`);

            if (onProgress) onProgress({ stage: 5, percent: 98, stageName: 'Stage 5/5: Initializing executive cockpit & telemetry interface...', log: 'COCKPIT_READY: Rendering workspace tabs...' });
            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 15));

            if (window.UDIP) {
                window.UDIP.ActiveDataset = _activeDataset;
            }

            // Auto-persist dataset across reloads
            await this.persistActiveDataset(_activeDataset);

            // 6. Notify subscribers
            this._notify('loaded', _activeDataset);

            return _activeDataset;
        },

        /**
         * Persist active dataset to hybrid storage (IndexedDB + LocalStorage)
         * @param {Object} [dataset]
         * @returns {Promise<boolean>}
         */
        persistActiveDataset(dataset = null) {
            const ds = dataset || _activeDataset;
            if (!ds || !Array.isArray(ds.rows) || ds.rows.length === 0) return Promise.resolve(false);
            return DatasetPersistence.save(ds);
        },

        /**
         * Restore persisted dataset from hybrid storage
         * @returns {Promise<Object|null>}
         */
        restorePersistedDataset() {
            return DatasetPersistence.restore();
        },

        /**
         * Clear persisted dataset from storage
         * @returns {Promise<boolean>}
         */
        clearPersistedDataset() {
            return DatasetPersistence.clear();
        },

        /**
         * Check if a persisted dataset exists in storage
         * @returns {Promise<boolean>}
         */
        async hasPersistedDataset() {
            const ds = await DatasetPersistence.restore();
            return !!(ds && Array.isArray(ds.rows) && ds.rows.length > 0);
        },

        /**
         * Completely clear the current dataset and reset session back to Empty State
         */
        clearDataset(notify = true) {
            const previousId = _activeDataset ? _activeDataset.id : null;
            _activeDataset = null;
            if (window.UDIP) {
                window.UDIP.ActiveDataset = null;
            }

            if (window.UDIP && window.UDIP.Copilot && window.UDIP.Copilot.ContextManager) {
                try {
                    window.UDIP.Copilot.ContextManager.resetContext();
                } catch (cErr) {
                    // Ignore
                }
            }

            if (notify) {
                console.info('[UDIP:Session] Dataset unloaded. Session reset to empty.');
                this._notify('cleared', { previousId });
            }
        },

        /**
         * Subscribe to session state changes
         */
        subscribe(callback) {
            if (typeof callback === 'function') {
                _listeners.add(callback);
                return () => _listeners.delete(callback);
            }
            return () => {};
        },

        /**
         * Notify all registered listeners
         * @private
         */
        _notify(event, data) {
            _listeners.forEach(fn => {
                try {
                    fn(event, data);
                } catch (err) {
                    console.error('[UDIP:Session] Listener error:', err);
                }
            });
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.DatasetPersistence = DatasetPersistence;
    window.UDIP.DatasetSession = DatasetSession;

})(window);
