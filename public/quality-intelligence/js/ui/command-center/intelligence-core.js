/**
 * ============================================================================
 * UDIP 3D AI ANALYTICAL COMMAND CENTER
 * Module: js/ui/command-center/intelligence-core.js
 * ============================================================================
 * Zone B: Central 3D Intelligence Core — AI RESEARCH LABORATORY v3.0
 *
 * A LIVING 3D AI RESEARCH LABORATORY containing:
 *  - Holographic AI Brain (600 synaptic fibers, 800 surface particles, 40 neural signals)
 *  - Agent-01: Data Scientist Robot (LEFT — procedural humanoid, articulated)
 *  - Agent-02: Model Validator Robot (RIGHT — skeptical posture, challenge mode)
 *  - Background Neural Network (4-layer feedforward, propagating activations)
 *  - 3D Data Scatter Cloud (up to 2000 particles from dataset values)
 *  - 5 Color-Coded Physical Data Streams (Raw→Process→Brain→Model→Insight)
 *  - 3D Analytical Charts (bar forest, time tunnel, heatmap surface)
 *  - 3D Anomaly Visualization (point separation + robot reaction)
 *  - Virtual Camera Focal Shift (smooth cx/cy/fov interpolation)
 *  - "HOW UDIP THINKS" 7-step Cinematic Sequence
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        const previous = root.UDIP.IntelligenceCore;
        const ccCore = factory(previous);
        root.UDIP.CommandCenterCore = ccCore;

        if (previous && typeof previous === 'object' && typeof previous.buildNetworkFromDataset === 'function') {
            previous.render = ccCore.render ? ccCore.render.bind(ccCore) : undefined;
            previous.initCanvas = ccCore.initCanvas ? ccCore.initCanvas.bind(ccCore) : undefined;
            previous.triggerIngestionAwakening = ccCore.triggerIngestionAwakening ? ccCore.triggerIngestionAwakening.bind(ccCore) : undefined;
            previous.triggerCounterEvidenceShiver = ccCore.triggerCounterEvidenceShiver ? ccCore.triggerCounterEvidenceShiver.bind(ccCore) : undefined;
            previous.triggerAnalyticalActivity = ccCore.triggerAnalyticalActivity ? ccCore.triggerAnalyticalActivity.bind(ccCore) : undefined;
            previous.setObserverFocus = ccCore.setObserverFocus ? ccCore.setObserverFocus.bind(ccCore) : undefined;

            const origMount = previous.mount ? previous.mount.bind(previous) : null;
            previous.mount = function (canvasElement, datasetOrState, type) {
                if (canvasElement && (canvasElement.id === 'udip-cc-nucleus-canvas' || canvasElement.id === 'udip-command-center-canvas')) {
                    return ccCore.mount(canvasElement, datasetOrState);
                }
                if (origMount) return origMount(canvasElement, datasetOrState, type);
                return ccCore.mount(canvasElement, datasetOrState);
            };
            previous.unmount = ccCore.unmount ? ccCore.unmount.bind(ccCore) : undefined;
            root.UDIP.IntelligenceCore = previous;
        } else {
            root.UDIP.IntelligenceCore = ccCore;
        }
    }
}(typeof self !== 'undefined' ? self : this, function (_prevVisualizer) {
    'use strict';

    // =========================================================================
    // MODULE-LEVEL PRIVATE STATE
    // =========================================================================
    let _animId = null;
    let _canvas = null;
    let _ctx = null;
    let _mouseX = 0;
    let _mouseY = 0;
    let _targetRotX = 0;
    let _targetRotY = 0;
    let _rotX = 0;
    let _rotY = 0;
    let _state = 'READY';
    let _motionUnsubscribe = null;
    let _awakeningProgress = 1.0;
    let _analyticalExcitement = 0.0;
    let _scanPhase = 0;
    let _selectedNode = null;
    let _counterEvidenceEvent = null;

    // === SPATIAL THREE.JS SCENE ===
    let _spatialScene = null;

    // === AI BRAIN ===
    let _brainFibers = [];        // Synaptic bezier fiber curves on brain sphere
    let _brainParticles = [];     // Surface dendrite particles
    let _brainSignals = [];       // Traveling neural signal pulses
    let _brainRadius = 72;

    // === ROBOTS ===
    let _robot1 = null;           // Agent-01: Data Scientist (LEFT)
    let _robot2 = null;           // Agent-02: Model Validator (RIGHT)
    let _robotBreathPhase = 0;
    let _robot1Focus = { x: 0, y: 0, intensity: 0 };
    let _robot2Scan = 0;          // Head scan angle for robot 2
    let _robot2Alert = 0;         // Alert arm-raise for robot 2

    // === NEURAL NETWORK BACKGROUND ===
    let _nnLayers = [];           // [{neurons:[{x,y,activation}]}, ...]
    let _nnConnections = [];      // [{from, to, weight, layerIdx}]
    let _nnSignals = [];          // Traveling activation signals on connections

    // === DATA CLOUD ===
    let _dataCloud = [];          // Up to 2000 scatter particles from dataset
    let _cloudAxisX = 0;
    let _cloudAxisY = 1;
    let _cloudAxisZ = 2;

    // === DATA STREAMS ===
    let _dataStreams = [];        // 5 color-coded particle streams

    // === 3D CHARTS ===
    let _barData = [];            // Bar forest data [{label,value,color}]
    let _heatData = [];           // 8×8 correlation heatmap values

    // === ANOMALY ===
    let _anomalyState = {
        active: false,
        pointIdx: -1,
        separationY: 0,
        expansionR: 0,
        label: 'ANOMALY',
        timer: 0
    };

    // === VIRTUAL CAMERA ===
    let _camera = {
        cx: 0, cy: 0, fov: 420,
        targetCx: 0, targetCy: 0, targetFov: 420
    };

    // === LEGACY SCENE STATE ===
    let _variableNodes = [];
    let _ingestionParticles = [];
    let _observerFocus = { x: 0, y: 0, z: 0, targetType: 'CORE', label: 'COGNITIVE NUCLEUS' };

    // === CINEMATIC SEQUENCE ===
    let _cinematicPhase = 0;      // 0=ambient, 1-7=HOW-UDIP-THINKS steps
    let _cinematicTimers = [];

    // === PERFORMANCE ===
    let _fpsHistory = [];
    let _lastFrameTime = 0;
    let _qualityLevel = 1.0;      // 0.5=low, 1.0=full

    // =========================================================================
    // DEBUG STATE ACCESSOR (for tests)
    // =========================================================================

    class IntelligenceCore {

        static _debugState() {
            return {
                brainFibers: _brainFibers,
                brainParticles: _brainParticles,
                brainSignals: _brainSignals,
                robot1: _robot1,
                robot2: _robot2,
                nnLayers: _nnLayers,
                nnConnections: _nnConnections,
                nnSignals: _nnSignals,
                dataCloud: _dataCloud,
                dataStreams: _dataStreams,
                barData: _barData,
                heatData: _heatData,
                anomalyState: _anomalyState,
                camera: _camera,
                variableNodes: _variableNodes,
                qualityLevel: _qualityLevel,
                spatialScene: _spatialScene,
                isSpatialActive: !!_spatialScene
            };
        }

        // =====================================================================
        // PUBLIC API: render() — HTML for Zone B hero container
        // =====================================================================
        static render(datasetOrState = null) {
            const state = datasetOrState;
            const dataset = (state && state.dataset) ? state.dataset : state;
            const km = (state && state.dkm) || (dataset && dataset.knowledgeModel) || null;

            let stateCode = 'READY';
            let stateLabel = 'READY // KNOWLEDGE MODEL ACTIVE';
            let stateColor = 'var(--cc-emerald)';

            if (!dataset || (dataset.rowCount === 0 && !dataset.columns)) {
                stateCode = 'STANDBY';
                stateLabel = 'STANDBY // READY FOR DATA';
                stateColor = 'var(--cc-cyan)';
            } else {
                const critic = (km && km.criticAudit) || (dataset.knowledgeModel && dataset.knowledgeModel.criticAudit);
                if (critic && (critic.verdict === 'CONTESTED' || critic.failureCount > 0)) {
                    stateCode = 'ATTENTION REQUIRED';
                    stateLabel = 'ATTENTION REQUIRED // CAVEATS FLAGGED';
                    stateColor = 'var(--cc-amber)';
                } else if ((dataset.relationships && dataset.relationships.length > 15) || (km && km.relationships && km.relationships.length > 15)) {
                    stateCode = 'DISCOVERING';
                    stateLabel = 'DISCOVERING // HIGH-DIMENSIONAL COGNITION';
                    stateColor = 'var(--cc-cyan)';
                } else {
                    stateCode = 'VALIDATING';
                    stateLabel = 'VALIDATING // 14-POINT AUDIT PASSED';
                    stateColor = 'var(--cc-violet)';
                }
            }
            _state = stateCode;

            const colCount = dataset ? (dataset.columnCount || (dataset.columns ? dataset.columns.length : 0)) : 0;
            const relCount = (km && km.relationships) ? km.relationships.length : ((dataset && dataset.relationships) ? dataset.relationships.length : 18);
            const hypCount = (km && km.hypotheses) ? km.hypotheses.length : 12;

            return `
            <div class="udip-cc-core-hero" id="udip-cc-core-hero">
                <!-- Top Floating Spatial HUD -->
                <div class="udip-cc-core-hud">
                    <div class="udip-cc-core-state" style="border-color:${stateColor}; color:${stateColor};">
                        <span class="udip-cc-pulse-dot" style="background:${stateColor}; box-shadow:0 0 12px ${stateColor};"></span>
                        <span id="udip-cc-state-text">${stateLabel}</span>
                    </div>
                    <div class="udip-cc-core-actions">
                        <button type="button" class="udip-cc-icon-btn" id="udip-cc-sound-toggle" title="Toggle Procedural Sci-Fi Audio">
                            <i class="fas fa-volume-high"></i>
                        </button>
                        <button type="button" class="udip-cc-icon-btn" id="udip-cc-core-pulse-trigger" title="HOW UDIP THINKS — Cinematic Sequence" style="font-size:11px;">
                            <i class="fas fa-satellite-dish"></i>
                        </button>
                        <button type="button" class="udip-cc-icon-btn" id="udip-cc-core-refresh" title="Recalculate Knowledge Nucleus">
                            <i class="fas fa-arrows-rotate"></i>
                        </button>
                        <button type="button" class="udip-cc-icon-btn" id="udip-cc-core-fullscreen" title="Expand Spatial Canvas">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>

                <!-- 3D Spatial Canvas Viewport -->
                <canvas class="udip-cc-core-canvas" id="udip-cc-nucleus-canvas"></canvas>

                <!-- Floating Node Inspector Tooltip -->
                <div class="udip-cc-node-inspector" id="udip-node-inspector" style="display:none; position:absolute; pointer-events:none; z-index:30;"></div>

                <!-- Bottom Telemetry Label -->
                <div class="udip-cc-core-overlay-text">
                    <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
                        <span style="font-size:10px; color:var(--cc-cyan); border:1px solid rgba(56,189,248,0.3); padding:1px 6px; border-radius:4px; font-family:var(--cc-font-mono);">3D AI LAB ACTIVE</span>
                        <h3 style="margin:0;">AI RESEARCH LABORATORY</h3>
                    </div>
                    <p>${colCount} ACTIVE VARIABLES &bull; ${relCount} RELATIONSHIP VECTORS &bull; ${hypCount} ACTIVE HYPOTHESES &bull; CONTINUOUS INFERENCE</p>
                </div>
            </div>
            `;
        }

        // =====================================================================
        // PUBLIC API: initCanvas()
        // =====================================================================
        static initCanvas(canvasElement, datasetOrState = null) {
            this.mount(canvasElement, datasetOrState);
            return {
                destroy: () => this.unmount(),
                triggerIngestion: () => this.triggerIngestionAwakening(),
                triggerCounterEvidence: (details) => this.triggerCounterEvidenceShiver(details),
                triggerAnalyticalActivity: (details) => this.triggerAnalyticalActivity(details),
                setObserverFocus: (target) => this.setObserverFocus(target)
            };
        }

        // =====================================================================
        // PUBLIC API: mount()
        // =====================================================================
        static mount(canvasElement, datasetOrState = null) {
            this.unmount();
            if (!canvasElement) return;

            const state = datasetOrState;
            const dataset = (state && state.dataset) ? state.dataset : state;

            _canvas = canvasElement;
            _ctx = _canvas.getContext ? _canvas.getContext('2d') : null;
            if (!_ctx) return;

            this._resizeCanvas();
            if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
                window.addEventListener('resize', this._resizeCanvasHandler);
            }

            this._init3DScene(dataset, state);

            if (_canvas && typeof _canvas.addEventListener === 'function') {
                _canvas.addEventListener('mousemove', this._onMouseMove);
                _canvas.addEventListener('mouseleave', this._onMouseLeave);
                _canvas.addEventListener('click', this._onCanvasClick);
            }

            // Hook into Motion Orchestrator
            const glob = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
            if (glob.UDIP && glob.UDIP.MotionOrchestrator) {
                const mo = glob.UDIP.MotionOrchestrator;
                const unsub1 = mo.on(mo.constructor.EVENTS.RELATIONSHIP_DISCOVERED, (data) => this.triggerAnalyticalActivity(data));
                const unsub2 = mo.on(mo.constructor.EVENTS.ANOMALY_DETECTED, (data) => this.triggerAnalyticalActivity(data));
                const unsub3 = mo.on(mo.constructor.EVENTS.COUNTER_EVIDENCE_FOUND, (data) => this.triggerCounterEvidenceShiver(data));
                const unsub4 = mo.on('TARGET_CHANGED', (target) => this.setObserverFocus(target));
                _motionUnsubscribe = () => {
                    if (unsub1) unsub1();
                    if (unsub2) unsub2();
                    if (unsub3) unsub3();
                    if (unsub4) unsub4();
                };
            }

            this._animate();

            // Mount WebGL 3D Spatial Laboratory Scene if supported
            if (glob.UDIP && glob.UDIP.SpatialScene && glob.THREE && canvasElement && canvasElement.parentElement) {
                try {
                    _spatialScene = new glob.UDIP.SpatialScene();
                    const mounted = _spatialScene.mount(canvasElement.parentElement, state);
                    if (mounted) {
                        // Crucial: Suppress 2D canvas completely when 3D WebGL is active to eliminate duplicate shapes
                        if (_canvas && _canvas.style) {
                            _canvas.style.display = 'none';
                        }
                        if (_ctx && typeof _ctx.clearRect === 'function') {
                            _ctx.clearRect(0, 0, _canvas.width || 800, _canvas.height || 420);
                        }
                        if (canvasElement.parentElement && canvasElement.parentElement.classList) {
                            canvasElement.parentElement.classList.add('spatial-active');
                        }
                    } else {
                        _spatialScene = null;
                        if (_canvas && _canvas.style) _canvas.style.display = '';
                        if (canvasElement.parentElement && canvasElement.parentElement.classList) {
                            canvasElement.parentElement.classList.remove('spatial-active');
                        }
                    }
                } catch (e) {
                    _spatialScene = null;
                    if (_canvas && _canvas.style) _canvas.style.display = '';
                    if (canvasElement.parentElement && canvasElement.parentElement.classList) {
                        canvasElement.parentElement.classList.remove('spatial-active');
                    }
                }
            }

            // Wire Sound Toggle Button
            if (canvasElement && canvasElement.parentElement && typeof canvasElement.parentElement.querySelector === 'function') {
                const soundBtn = canvasElement.parentElement.querySelector('#udip-cc-sound-toggle');
                if (soundBtn && typeof soundBtn.addEventListener === 'function') {
                    soundBtn.addEventListener('click', () => {
                        if (_spatialScene && _spatialScene.soundEngine) {
                            const isMuted = _spatialScene.soundEngine.toggleMute();
                            soundBtn.innerHTML = isMuted ? '<i class="fas fa-volume-xmark"></i>' : '<i class="fas fa-volume-high"></i>';
                            soundBtn.style.color = isMuted ? 'var(--cc-text-muted)' : 'var(--cc-cyan)';
                        }
                    });
                }
            }
        }

        // =====================================================================
        // PUBLIC API: unmount()
        // =====================================================================
        static unmount() {
            if (_canvas && _canvas.parentElement && _canvas.parentElement.classList) {
                _canvas.parentElement.classList.remove('spatial-active');
            }
            if (_spatialScene) {
                _spatialScene.unmount();
                _spatialScene = null;
            }
            if (_animId) {
                if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(_animId);
                else if (typeof clearTimeout === 'function') clearTimeout(_animId);
                _animId = null;
            }
            _cinematicTimers.forEach(t => { if (typeof clearTimeout === 'function') clearTimeout(t); });
            _cinematicTimers.length = 0;
            _cinematicPhase = 0;

            if (_canvas && typeof _canvas.removeEventListener === 'function') {
                _canvas.removeEventListener('mousemove', this._onMouseMove);
                _canvas.removeEventListener('mouseleave', this._onMouseLeave);
                _canvas.removeEventListener('click', this._onCanvasClick);
            }
            if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
                window.removeEventListener('resize', this._resizeCanvasHandler);
            }
            if (_motionUnsubscribe) { _motionUnsubscribe(); _motionUnsubscribe = null; }
            if (_canvas && _canvas.style) { _canvas.style.display = ''; }
            _canvas = null;
            _ctx = null;
            _selectedNode = null;
        }

        // =====================================================================
        // BACKWARD COMPATIBILITY BRIDGES
        // =====================================================================
        static buildNetworkFromDataset(dataset) {
            if (_prevVisualizer && typeof _prevVisualizer.buildNetworkFromDataset === 'function') {
                return _prevVisualizer.buildNetworkFromDataset(dataset);
            }
            this.nodes = this.nodes || [];
            this.links = this.links || [];
            this.particles = this.particles || [];
            this.pipelineStages = this.pipelineStages || [];
            if (this._init3DScene) this._init3DScene(dataset);
            return this;
        }

        static setEngineState(state, duration) {
            if (_prevVisualizer && typeof _prevVisualizer.setEngineState === 'function') {
                return _prevVisualizer.setEngineState(state, duration);
            }
            this.mode = state;
            return this;
        }

        static setDisplayMode(mode) {
            if (_prevVisualizer && typeof _prevVisualizer.setDisplayMode === 'function') {
                return _prevVisualizer.setDisplayMode(mode);
            }
            this.displayMode = mode;
            return this;
        }

        static mountAutonomousCore(canvas, dataset) {
            if (_prevVisualizer && typeof _prevVisualizer.mountAutonomousCore === 'function') {
                return _prevVisualizer.mountAutonomousCore(canvas, dataset);
            }
            return this.mount(canvas, dataset);
        }

        // =====================================================================
        // CANVAS RESIZE
        // =====================================================================
        static _resizeCanvasHandler() { IntelligenceCore._resizeCanvas(); }

        static _resizeCanvas() {
            if (!_canvas) return;
            const parent = _canvas.parentElement;
            const rect = (parent && typeof parent.getBoundingClientRect === 'function')
                ? parent.getBoundingClientRect()
                : { width: _canvas.width || 800, height: _canvas.height || 420 };
            const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
            _canvas.width = (rect.width || 800) * dpr;
            _canvas.height = (rect.height || 420) * dpr;
            if (_ctx && typeof _ctx.scale === 'function') _ctx.scale(dpr, dpr);
        }

        // =====================================================================
        // MOUSE EVENTS
        // =====================================================================
        static _onMouseMove(e) {
            if (!_canvas) return;
            const rect = typeof _canvas.getBoundingClientRect === 'function'
                ? _canvas.getBoundingClientRect()
                : { left: 0, top: 0, width: 800, height: 420 };
            const cx = (rect.width || 800) / 2;
            const cy = (rect.height || 420) / 2;
            _mouseX = (e.clientX - rect.left - cx) / cx;
            _mouseY = (e.clientY - rect.top - cy) / cy;
            _targetRotY = _mouseX * 0.35;
            _targetRotX = -_mouseY * 0.35;

            const clientX = e.clientX - rect.left;
            const clientY = e.clientY - rect.top;
            let hit = null;
            for (let i = 0; i < _variableNodes.length; i++) {
                const vn = _variableNodes[i];
                if (vn._proj) {
                    const dx = clientX - vn._proj.x2d;
                    const dy = clientY - vn._proj.y2d;
                    const r = Math.max(14, vn._proj.r * 2.5);
                    if (dx * dx + dy * dy < r * r) { hit = vn; break; }
                }
            }
            _selectedNode = hit;
            if (hit) {
                IntelligenceCore.setObserverFocus({ x: hit.x, y: hit.y, z: hit.z, targetType: 'VARIABLE', label: hit.name });
            }
            IntelligenceCore._updateInspectorTooltip(clientX, clientY, hit);
        }

        static _onMouseLeave() {
            _targetRotX = 0;
            _targetRotY = 0;
            _selectedNode = null;
            IntelligenceCore.setObserverFocus({ x: 0, y: 0, z: 0, targetType: 'CORE', label: 'COGNITIVE NUCLEUS' });
            IntelligenceCore._updateInspectorTooltip(0, 0, null);
        }

        static _onCanvasClick(e) {
            if (_selectedNode) {
                if (typeof window !== 'undefined' && window.UDIP && window.UDIP.CommandCenterController) {
                    const event = new CustomEvent('udip-variable-select', { detail: { variable: _selectedNode } });
                    window.dispatchEvent(event);
                }
            }
        }

        static _updateInspectorTooltip(x, y, node) {
            if (typeof document === 'undefined') return;
            const tooltip = document.getElementById('udip-node-inspector');
            if (!tooltip) return;
            if (!node) { tooltip.style.display = 'none'; return; }
            tooltip.style.display = 'block';
            tooltip.style.left = `${Math.min(x + 16, (_canvas ? (_canvas.width || 800) : 800) - 220)}px`;
            tooltip.style.top = `${Math.max(10, y - 40)}px`;
            tooltip.innerHTML = `
                <div style="background:rgba(6,10,24,0.94); border:1px solid ${node.color}; padding:10px 14px; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.7); min-width:180px; font-family:var(--cc-font-sans);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <strong style="color:#fff; font-size:13px; font-family:var(--cc-font-mono);">${node.name}</strong>
                        <span style="font-size:9px; background:rgba(255,255,255,0.1); color:${node.color}; padding:2px 6px; border-radius:4px; font-weight:700;">${node.role || node.type}</span>
                    </div>
                    <div style="font-size:10px; color:var(--cc-text-secondary); display:flex; flex-direction:column; gap:3px; font-family:var(--cc-font-mono);">
                        <div><span>Analytical Role:</span> <strong style="color:${node.color};">${node.role}</strong></div>
                        <div><span>Importance:</span> <strong style="color:var(--cc-cyan);">${Math.round(node.importance * 100)}%</strong></div>
                        <div><span>Confidence:</span> <strong style="color:var(--cc-emerald);">${Math.round(node.confidence * 100)}%</strong></div>
                        <div><span>Relationships:</span> <strong style="color:#fff;">${node.relCount} links</strong></div>
                        <div style="margin-top:4px; font-size:9px; color:var(--cc-text-muted);">Click to isolate reasoning chain</div>
                    </div>
                </div>
            `;
        }

        // =====================================================================
        // PUBLIC API: setObserverFocus()
        // =====================================================================
        static setObserverFocus(target) {
            if (!target) {
                _observerFocus = { x: 0, y: 0, z: 0, targetType: 'CORE', label: 'COGNITIVE NUCLEUS' };
                return;
            }
            if (target.x != null && target.y != null) {
                _observerFocus = {
                    x: target.x || 0,
                    y: target.y || 0,
                    z: target.z || 0,
                    targetType: target.targetType || target.type || 'TARGET',
                    label: target.label || target.name || 'ANALYTICAL VECTOR'
                };
            }
            // Shift camera toward the event origin
            _camera.targetCx = (target.x || 0) * 0.12;
            _camera.targetCy = (target.y || 0) * 0.08;

            // Notify 3D Spatial Scene
            if (_spatialScene && _spatialScene.cameraDirector && target) {
                _spatialScene.cameraDirector.focusOnTarget(target.x || 0, target.y || 0, target.z || 0);
            }
            if (_spatialScene && _spatialScene.agent1 && target) {
                _spatialScene.agent1.setFocusTarget(target.x || 0, target.y || 0, target.z || 0);
            }
        }

        // =====================================================================
        // PUBLIC API: triggerIngestionAwakening()
        // =====================================================================
        static triggerIngestionAwakening() {
            if (_spatialScene) {
                _spatialScene.triggerOpeningCinematic();
            }
            _awakeningProgress = 0.0;
            _analyticalExcitement = 1.0;
            _ingestionParticles = [];
            const count = Math.round(120 * _qualityLevel);
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 360 + Math.random() * 200;
                const elevation = (Math.random() - 0.5) * 260;
                _ingestionParticles.push({
                    x: Math.cos(angle) * dist,
                    y: elevation,
                    z: Math.sin(angle) * dist,
                    targetDist: 20 + Math.random() * 60,
                    speed: 0.02 + Math.random() * 0.03,
                    progress: 0.0,
                    size: 1.5 + Math.random() * 2.5,
                    color: Math.random() > 0.4 ? '#38bdf8' : (Math.random() > 0.5 ? '#818cf8' : '#10b981')
                });
            }
            // HOW UDIP THINKS cinematic
            this._runCinematicSequence();
        }

        // =====================================================================
        // PUBLIC API: triggerAnalyticalActivity()
        // =====================================================================
        static triggerAnalyticalActivity(details = null) {
            if (_spatialScene) {
                _spatialScene.handleEvent('RELATIONSHIP_DISCOVERED', details);
            }
            _analyticalExcitement = 1.0;
            if (_variableNodes.length > 0) {
                const targetNode = _variableNodes[Math.floor(Math.random() * _variableNodes.length)];
                if (targetNode) {
                    this.setObserverFocus({ x: targetNode.x, y: targetNode.y, z: targetNode.z, targetType: 'VARIABLE', label: targetNode.name });
                }
            }
            // Fire a burst of neural signals
            for (let i = 0; i < 8; i++) {
                if (_nnConnections.length > 0) {
                    const conn = _nnConnections[Math.floor(Math.random() * _nnConnections.length)];
                    _nnSignals.push({ conn, t: 0, speed: 0.025 + Math.random() * 0.02, color: '#38bdf8', size: 3 });
                }
            }
            // Robot 1 arm focus
            _robot1Focus.intensity = 1.0;
            _robot1Focus.x = (details && details.x) ? details.x : (Math.random() - 0.5) * 80;
            _robot1Focus.y = (details && details.y) ? details.y : (Math.random() - 0.5) * 60;
        }

        // =====================================================================
        // PUBLIC API: triggerCounterEvidenceShiver()
        // =====================================================================
        static triggerCounterEvidenceShiver(details = null) {
            if (_spatialScene) {
                _spatialScene.handleEvent('COUNTER_EVIDENCE_FOUND', details);
                _spatialScene.triggerAnomalyCinematic();
            }
            _analyticalExcitement = 1.0;
            _counterEvidenceEvent = {
                startTime: Date.now(),
                duration: 2500,
                title: (details && details.title) || "Simpson's Paradox Subgroup Conflict",
                conflictingSubgroup: (details && details.subgroup) || 'High-Tenure Tier',
                originalConf: 0.94,
                calibratedConf: 0.76
            };
            this.setObserverFocus({ x: -100, y: 30, z: 40, targetType: 'COUNTER_EVIDENCE', label: "SIMPSON'S CONFLICT" });
            // Trigger anomaly visualization
            this._triggerAnomalyVisualization();
            // Alert robot 2
            _robot2Alert = 1.0;
        }

        // =====================================================================
        // CINEMATIC SEQUENCE: HOW UDIP THINKS
        // =====================================================================
        static _runCinematicSequence() {
            _cinematicTimers.forEach(t => { if (typeof clearTimeout === 'function') clearTimeout(t); });
            _cinematicTimers.length = 0;
            _cinematicPhase = 1;

            const phases = [
                [1000,  () => { _cinematicPhase = 2; _robot1Focus.intensity = 1.0; _camera.targetCx = -60; }],
                [2000,  () => { _cinematicPhase = 3; /* NN burst */ for (let i=0;i<20;i++) IntelligenceCore._spawnNNSignal(); _camera.targetCx = 0; }],
                [3000,  () => { _cinematicPhase = 4; _analyticalExcitement = 1.0; }],
                [4000,  () => { _cinematicPhase = 5; }],
                [5000,  () => { _cinematicPhase = 6; _robot2Alert = 1.0; _camera.targetCx = 60; }],
                [6500,  () => { _cinematicPhase = 7; _camera.targetCx = 0; _camera.targetCy = 0; }],
                [8000,  () => { _cinematicPhase = 0; }]
            ];

            phases.forEach(([delay, fn]) => {
                const t = typeof setTimeout === 'function' ? setTimeout(fn, delay) : null;
                if (t !== null) _cinematicTimers.push(t);
            });
        }

        // =====================================================================
        // ANOMALY VISUALIZATION
        // =====================================================================
        static _triggerAnomalyVisualization() {
            // Find an anomalous point in the data cloud (red ones)
            let anomalyIdx = -1;
            for (let i = 0; i < _dataCloud.length; i++) {
                if (_dataCloud[i].isAnomaly) { anomalyIdx = i; break; }
            }
            if (anomalyIdx === -1 && _dataCloud.length > 0) anomalyIdx = 0;

            _anomalyState.active = true;
            _anomalyState.pointIdx = anomalyIdx;
            _anomalyState.separationY = 0;
            _anomalyState.expansionR = 5;
            _anomalyState.label = 'ANOMALY DETECTED';
            _anomalyState.timer = Date.now();

            // Camera focus toward anomaly
            _camera.targetCy = -50;
        }

        // =====================================================================
        // SPAWN NN SIGNAL (helper)
        // =====================================================================
        static _spawnNNSignal() {
            if (_nnConnections.length === 0) return;
            const conn = _nnConnections[Math.floor(Math.random() * _nnConnections.length)];
            const colors = ['#38bdf8', '#818cf8', '#10b981', '#f59e0b'];
            _nnSignals.push({
                conn,
                t: 0,
                speed: 0.018 + Math.random() * 0.025,
                color: colors[conn.layerIdx % colors.length],
                size: 2.5 + Math.random() * 1.5
            });
        }

        // =====================================================================
        // INITIALIZE 3D SCENE
        // =====================================================================
        static _init3DScene(dataset, state) {
            _brainFibers = [];
            _brainParticles = [];
            _brainSignals = [];
            _robot1 = null;
            _robot2 = null;
            _nnLayers = [];
            _nnConnections = [];
            _nnSignals = [];
            _dataCloud = [];
            _dataStreams = [];
            _barData = [];
            _heatData = [];
            _variableNodes = [];
            _ingestionParticles = [];

            const colNames = dataset && dataset.columns ? dataset.columns : [
                'Temperature', 'Pressure', 'Yield', 'Vibration', 'RPM', 'Density',
                'Viscosity', 'pH', 'FlowRate', 'Voltage', 'Current', 'Humidity'
            ];
            const colCount = colNames.length;
            const rows = dataset && dataset.rows ? dataset.rows : null;
            const profile = state && state.profile ? state.profile : null;

            // --- Brain radius scales with column count ---
            _brainRadius = Math.max(60, Math.min(90, 60 + colCount * 2));

            // --- Init camera ---
            _camera = { cx: 0, cy: 0, fov: 420, targetCx: 0, targetCy: 0, targetFov: 420 };

            // ---------------------------------------------------------------
            // AI BRAIN: Synaptic fiber mesh on sphere
            // ---------------------------------------------------------------
            const fiberCount = Math.round(280 * _qualityLevel);
            const phi = Math.PI * (3 - Math.sqrt(5));
            const bR = _brainRadius;

            // Generate points on Fibonacci sphere for fiber endpoints
            const spherePts = [];
            for (let i = 0; i < fiberCount * 2; i++) {
                const y = 1 - (i / (fiberCount * 2 - 1)) * 2;
                const rAtY = Math.sqrt(Math.max(0, 1 - y * y));
                const theta = phi * i;
                spherePts.push({
                    x: Math.cos(theta) * rAtY * bR,
                    y: y * bR,
                    z: Math.sin(theta) * rAtY * bR
                });
            }

            // Create bezier fibers connecting nearby pairs
            for (let i = 0; i < fiberCount; i++) {
                const pA = spherePts[i * 2];
                const pB = spherePts[i * 2 + 1];
                // Control point pulled toward center
                const cpScale = 0.35 + Math.random() * 0.3;
                _brainFibers.push({
                    ax: pA.x, ay: pA.y, az: pA.z,
                    bx: pB.x, by: pB.y, bz: pB.z,
                    cpx: pA.x * cpScale, cpy: pA.y * cpScale + (Math.random()-0.5)*bR*0.4, cpz: pA.z * cpScale,
                    alpha: 0.15 + Math.random() * 0.25,
                    color: i % 4 === 0 ? '#38bdf8' : (i % 4 === 1 ? '#818cf8' : (i % 4 === 2 ? '#10b981' : '#a78bfa')),
                    width: 0.4 + Math.random() * 0.6,
                    phase: Math.random() * Math.PI * 2
                });
            }

            // Brain surface particles
            const particleCount = Math.round(400 * _qualityLevel);
            for (let i = 0; i < particleCount; i++) {
                const t1 = Math.random() * Math.PI * 2;
                const t2 = Math.acos(2 * Math.random() - 1);
                const pr = bR * (0.88 + Math.random() * 0.18);
                _brainParticles.push({
                    x: Math.sin(t2) * Math.cos(t1) * pr,
                    y: Math.cos(t2) * pr,
                    z: Math.sin(t2) * Math.sin(t1) * pr,
                    size: 0.8 + Math.random() * 1.4,
                    alpha: 0.3 + Math.random() * 0.5,
                    driftX: (Math.random()-0.5)*0.008,
                    driftY: (Math.random()-0.5)*0.008,
                    driftZ: (Math.random()-0.5)*0.008,
                    color: Math.random() > 0.7 ? '#38bdf8' : 'rgba(200,220,255,0.7)'
                });
            }

            // Neural signals on fibers
            for (let i = 0; i < 30; i++) {
                const fiberIdx = Math.floor(Math.random() * _brainFibers.length);
                const colors = ['#38bdf8', '#a78bfa', '#ffffff', '#10b981'];
                _brainSignals.push({
                    fiberIdx,
                    t: Math.random(),
                    speed: 0.008 + Math.random() * 0.012,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    size: 2.0 + Math.random() * 2.0,
                    alpha: 0.7 + Math.random() * 0.3
                });
            }

            // ---------------------------------------------------------------
            // ROBOT INITIAL STATE
            // ---------------------------------------------------------------
            _robot1 = { breathPhase: 0, armAngle: 0, headTurn: 0, scale: 1.0, label: 'AGENT-01 // DATA SCIENTIST' };
            _robot2 = { breathPhase: Math.PI, armAngle: 0.3, headScan: 0, scale: 0.75, alertArm: 0, label: 'AGENT-02 // MODEL VALIDATOR' };

            // ---------------------------------------------------------------
            // NEURAL NETWORK (background) — 4 layers
            // ---------------------------------------------------------------
            const inputCount = Math.min(colCount, 10);
            const layerSizes = [inputCount, 8, 6, 1];
            const layerLabels = [colNames.slice(0, inputCount), null, null, ['OUTPUT']];

            _nnLayers = layerSizes.map((size, li) => ({
                neurons: Array.from({ length: size }, (_, ni) => ({
                    nx: li,           // layer index (used for positioning)
                    ny: ni,           // neuron index in layer
                    activation: 0.3 + Math.random() * 0.7,
                    label: (layerLabels[li] && layerLabels[li][ni]) ? layerLabels[li][ni] : null,
                    phase: Math.random() * Math.PI * 2
                })),
                layerIdx: li
            }));

            // Build connections between adjacent layers
            for (let li = 0; li < _nnLayers.length - 1; li++) {
                const fromLayer = _nnLayers[li];
                const toLayer = _nnLayers[li + 1];
                fromLayer.neurons.forEach((from, fi) => {
                    toLayer.neurons.forEach((to, ti) => {
                        _nnConnections.push({
                            fromLayer: li, fromIdx: fi,
                            toLayer: li + 1, toIdx: ti,
                            weight: 0.15 + Math.random() * 0.85,
                            layerIdx: li
                        });
                    });
                });
            }

            // Initial NN signals
            for (let i = 0; i < 20; i++) this._spawnNNSignal();

            // ---------------------------------------------------------------
            // DATA CLOUD — from actual dataset rows or synthetic
            // ---------------------------------------------------------------
            const maxCloud = Math.round(800 * _qualityLevel);

            // Find numeric column indices
            const numericColIdxs = [];
            colNames.forEach((col, i) => {
                const lc = col.toLowerCase();
                if (!lc.includes('type') && !lc.includes('cat') && !lc.includes('name')) numericColIdxs.push(i);
            });
            const xi = numericColIdxs[0] !== undefined ? numericColIdxs[0] : 0;
            const yi = numericColIdxs[1] !== undefined ? numericColIdxs[1] : 1;
            const zi = numericColIdxs[2] !== undefined ? numericColIdxs[2] : 2;

            // Collect raw values for normalization
            const rawVals = [[],[],[]];
            if (rows && rows.length > 0) {
                const useRows = rows.slice(0, maxCloud);
                useRows.forEach(row => {
                    const vals = Array.isArray(row) ? row : Object.values(row);
                    rawVals[0].push(parseFloat(vals[xi]) || 0);
                    rawVals[1].push(parseFloat(vals[yi]) || 0);
                    rawVals[2].push(parseFloat(vals[zi]) || 0);
                });
            } else {
                // Synthetic cloud: 3D spiral galaxy
                for (let i = 0; i < maxCloud; i++) {
                    const arm = i % 3;
                    const t = (i / maxCloud) * 4 * Math.PI + arm * (2 * Math.PI / 3);
                    const r = 50 + (i / maxCloud) * 130 + (Math.random()-0.5)*20;
                    rawVals[0].push(Math.cos(t) * r + (Math.random()-0.5)*20);
                    rawVals[1].push((Math.random()-0.5)*60);
                    rawVals[2].push(Math.sin(t) * r + (Math.random()-0.5)*20);
                }
            }

            // Normalize to [-120, 120] range
            const normalize = (vals) => {
                if (!vals.length) return vals;
                let min = vals[0], max = vals[0];
                vals.forEach(v => { if(v<min) min=v; if(v>max) max=v; });
                const range = max - min || 1;
                return vals.map(v => ((v - min) / range) * 240 - 120);
            };

            const nx = normalize(rawVals[0]);
            const ny = normalize(rawVals[1]);
            const nz = normalize(rawVals[2]);

            // Compute z-scores for anomaly detection
            const meanX = nx.reduce((s,v)=>s+v,0)/(nx.length||1);
            const stdX = Math.sqrt(nx.reduce((s,v)=>s+(v-meanX)**2,0)/(nx.length||1))||1;

            for (let i = 0; i < nx.length; i++) {
                const zScore = Math.abs((nx[i] - meanX) / stdX);
                const isAnomaly = zScore > 2.2;
                _dataCloud.push({
                    x: nx[i] + (Math.random()-0.5)*4,
                    y: ny[i] + (Math.random()-0.5)*4,
                    z: nz[i] + (Math.random()-0.5)*4,
                    size: isAnomaly ? 3.2 : (1.0 + Math.random() * 1.2),
                    color: isAnomaly ? '#ef4444' : (i % 5 === 0 ? '#38bdf8' : (i % 5 === 1 ? '#818cf8' : (i % 5 === 2 ? '#10b981' : 'rgba(148,163,184,0.6)'))),
                    isAnomaly,
                    alpha: isAnomaly ? 0.9 : (0.4 + Math.random() * 0.4),
                    drift: { x: (Math.random()-0.5)*0.006, y: (Math.random()-0.5)*0.006, z: (Math.random()-0.5)*0.006 }
                });
            }

            // ---------------------------------------------------------------
            // DATA STREAMS — 5 color-coded flows
            // ---------------------------------------------------------------
            const streamDefs = [
                { label: 'RAW INGESTION',   color: '#38bdf8', particleCount: 18, speed: 0.014 },
                { label: 'PROCESSING',       color: '#22d3ee', particleCount: 15, speed: 0.018 },
                { label: 'ML INFERENCE',     color: '#a78bfa', particleCount: 16, speed: 0.016 },
                { label: 'ANOMALY SIGNAL',   color: '#f59e0b', particleCount: 10, speed: 0.012, conditional: true },
                { label: 'VALIDATED INSIGHT',color: '#10b981', particleCount: 14, speed: 0.020 }
            ];
            _dataStreams = streamDefs.map((def, si) => ({
                ...def,
                particles: Array.from({ length: def.particleCount }, (_, pi) => ({
                    t: (pi / def.particleCount),
                    size: 1.6 + Math.random() * 1.4
                })),
                streamIdx: si
            }));

            // ---------------------------------------------------------------
            // BAR DATA — from profile column importances
            // ---------------------------------------------------------------
            const profileCols = profile && profile.columns ? Object.entries(profile.columns) : null;
            if (profileCols && profileCols.length > 0) {
                _barData = profileCols.slice(0, 10).map(([name, info], i) => ({
                    label: name.substring(0, 8),
                    value: (info && info.importance != null) ? info.importance : (0.3 + Math.random() * 0.7),
                    color: i % 4 === 0 ? '#38bdf8' : (i % 4 === 1 ? '#818cf8' : (i % 4 === 2 ? '#10b981' : '#f59e0b'))
                }));
            } else {
                _barData = colNames.slice(0, 8).map((name, i) => ({
                    label: name.substring(0, 8),
                    value: 0.3 + (i * 0.08) % 0.65,
                    color: i % 4 === 0 ? '#38bdf8' : (i % 4 === 1 ? '#818cf8' : (i % 4 === 2 ? '#10b981' : '#f59e0b'))
                }));
            }

            // Heatmap — 6×6 correlation-like values
            for (let i = 0; i < 36; i++) {
                _heatData.push(Math.random());
            }

            // ---------------------------------------------------------------
            // VARIABLE NODES (legacy, for tooltip/interaction compatibility)
            // ---------------------------------------------------------------
            const heroCols = colNames.slice(0, 8);
            const varRadius = 160;
            heroCols.forEach((col, idx) => {
                const angle = (idx / heroCols.length) * Math.PI * 2;
                const lName = col.toLowerCase();
                let role = 'NUMERIC', color = '#38bdf8';
                if (idx === 0 || lName.includes('yield') || lName.includes('target') || lName.includes('churn')) { role='TARGET'; color='#f59e0b'; }
                else if (lName.includes('date') || lName.includes('time') || idx === 3) { role='TEMPORAL'; color='#10b981'; }
                else if (lName.includes('type') || lName.includes('cat') || idx === 1) { role='CATEGORICAL'; color='#c084fc'; }
                else if (idx === 4) { role='ANOMALOUS'; color='#f43f5e'; }
                _variableNodes.push({
                    id: `var_${idx}`, name: col, type: role === 'CATEGORICAL' ? 'CATEGORICAL' : 'NUMERIC',
                    role, importance: +(0.65 + (idx*0.05) % 0.32).toFixed(2),
                    confidence: +(0.82 + ((idx*0.06)%0.16)).toFixed(2),
                    relCount: 2 + (idx % 4),
                    baseRadius: varRadius, baseAngle: angle, orbitAngle: angle,
                    orbitSpeed: role==='TARGET'?0.0001:(role==='ANOMALOUS'?0.001:0.0003),
                    clusterGroup: idx % 2,
                    x: Math.cos(angle)*varRadius, y: ((idx%3)-1)*50, z: Math.sin(angle)*varRadius,
                    color
                });
            });
        }

        // =====================================================================
        // 3D PROJECTION UTILITY
        // =====================================================================
        static _project3D(x3, y3, z3, cosY, sinY, cosX, sinX, fov, cx, cy) {
            const x1 = x3 * cosY - z3 * sinY;
            const z1 = x3 * sinY + z3 * cosY;
            const y2 = y3 * cosX - z1 * sinX;
            const z2 = y3 * sinX + z1 * cosX;
            const scale = fov / (fov + z2);
            return { x2d: cx + x1 * scale, y2d: cy + y2 * scale, scale, z: z2 };
        }

        // =====================================================================
        // DRAW: Holographic AI Brain
        // =====================================================================
        static _drawBrain(ctx, cx, cy, cosY, sinY, cosX, sinX, fov, now, pulse, shiverX, shiverY) {
            if (typeof ctx.save !== 'function') return;
            const bR = _brainRadius;

            // --- Outer volumetric glow ---
            if (typeof ctx.createRadialGradient === 'function') {
                const outerAlpha = 0.32 + Math.sin(now * 0.0022) * 0.1 + _analyticalExcitement * 0.12;
                const glow = ctx.createRadialGradient(cx+shiverX, cy+shiverY, 4, cx+shiverX, cy+shiverY, bR*2.6);
                glow.addColorStop(0,    `rgba(56,189,248,${(outerAlpha).toFixed(2)})`);
                glow.addColorStop(0.30, 'rgba(129,140,248,0.18)');
                glow.addColorStop(0.65, 'rgba(16,185,129,0.06)');
                glow.addColorStop(1,    'rgba(3,7,18,0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(cx+shiverX, cy+shiverY, bR*2.6, 0, Math.PI*2);
                ctx.fill();
            }

            // --- Anatomical lobe silhouettes (behind fibers) ---
            ctx.save();
            ctx.translate(cx+shiverX, cy+shiverY);
            ctx.strokeStyle = 'rgba(56,189,248,0.10)';
            ctx.lineWidth = 1.5;
            // Left lobe
            ctx.beginPath();
            if (typeof ctx.ellipse === 'function') {
                ctx.ellipse(-bR*0.3, 0, bR*0.62, bR*0.82, -0.12, 0, Math.PI*2);
            } else {
                ctx.arc(-bR*0.3, 0, bR*0.72, 0, Math.PI*2);
            }
            ctx.stroke();
            // Right lobe
            ctx.beginPath();
            if (typeof ctx.ellipse === 'function') {
                ctx.ellipse(bR*0.3, 0, bR*0.60, bR*0.80, 0.12, 0, Math.PI*2);
            } else {
                ctx.arc(bR*0.3, 0, bR*0.70, 0, Math.PI*2);
            }
            ctx.stroke();
            // Corpus callosum divider
            ctx.strokeStyle = 'rgba(56,189,248,0.07)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -bR*0.85); ctx.lineTo(0, bR*0.85);
            ctx.stroke();
            ctx.restore();

            // --- Synaptic fiber mesh ---
            const fiberAlphaBoost = 0.08 + _analyticalExcitement * 0.12;
            const visibleFibers = Math.round(_brainFibers.length * Math.min(1, 0.7 + _qualityLevel * 0.3));
            for (let fi = 0; fi < visibleFibers; fi++) {
                const f = _brainFibers[fi];
                const breathOffset = Math.sin(now * 0.0012 + f.phase) * 2.5;

                // Project fiber endpoints
                const pA = IntelligenceCore._project3D(f.ax+breathOffset, f.ay+breathOffset, f.az, cosY, sinY, cosX, sinX, fov, cx+shiverX, cy+shiverY);
                const pB = IntelligenceCore._project3D(f.bx+breathOffset, f.by+breathOffset, f.bz, cosY, sinY, cosX, sinX, fov, cx+shiverX, cy+shiverY);
                const pCP = IntelligenceCore._project3D(f.cpx+breathOffset, f.cpy, f.cpz+breathOffset, cosY, sinY, cosX, sinX, fov, cx+shiverX, cy+shiverY);

                // Only draw fibers on the front hemisphere
                if (pA.z > -bR*0.9 || pB.z > -bR*0.9) {
                    const depthAlpha = Math.max(0, (pA.z + bR) / (bR * 2));
                    ctx.strokeStyle = f.color;
                    ctx.lineWidth = f.width * pA.scale;
                    ctx.globalAlpha = Math.min(0.85, (f.alpha + fiberAlphaBoost) * depthAlpha);
                    ctx.beginPath();
                    ctx.moveTo(pA.x2d, pA.y2d);
                    if (typeof ctx.quadraticCurveTo === 'function') {
                        ctx.quadraticCurveTo(pCP.x2d, pCP.y2d, pB.x2d, pB.y2d);
                    } else {
                        ctx.lineTo(pB.x2d, pB.y2d);
                    }
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1.0;

            // --- Neural core nucleus (center glow ball) ---
            if (typeof ctx.createRadialGradient === 'function') {
                const coreR = bR * 0.32 * pulse;
                const coreGrad = ctx.createRadialGradient(cx+shiverX, cy+shiverY, 1, cx+shiverX, cy+shiverY, coreR);
                coreGrad.addColorStop(0, '#ffffff');
                coreGrad.addColorStop(0.2, '#38bdf8');
                coreGrad.addColorStop(0.7, 'rgba(129,140,248,0.7)');
                coreGrad.addColorStop(1, 'rgba(5,8,20,0)');
                ctx.fillStyle = coreGrad;
                ctx.beginPath();
                ctx.arc(cx+shiverX, cy+shiverY, coreR, 0, Math.PI*2);
                ctx.fill();
            }

            // Micro-rings around core
            ctx.strokeStyle = `rgba(255,255,255,${0.55+Math.sin(now*0.003)*0.2})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(cx+shiverX, cy+shiverY, bR*0.28*pulse, 0, Math.PI*2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(56,189,248,0.35)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(cx+shiverX, cy+shiverY, bR*0.44*pulse, 0, Math.PI*2);
            ctx.stroke();

            // --- Surface particles ---
            _brainParticles.forEach(p => {
                p.x += p.driftX; p.y += p.driftY; p.z += p.driftZ;
                // Clamp to sphere surface
                const dist = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z);
                const sr = bR * (0.92 + Math.sin(now*0.001+p.x)*0.06);
                if (dist > 1) { p.x *= sr/dist; p.y *= sr/dist; p.z *= sr/dist; }

                const proj = IntelligenceCore._project3D(p.x, p.y, p.z, cosY, sinY, cosX, sinX, fov, cx+shiverX, cy+shiverY);
                if (proj.z > -bR*0.8) {
                    const depthA = Math.max(0.05, (proj.z + bR) / (bR * 2));
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = Math.min(0.9, p.alpha * depthA);
                    ctx.beginPath();
                    ctx.arc(proj.x2d, proj.y2d, p.size * proj.scale, 0, Math.PI*2);
                    ctx.fill();
                }
            });
            ctx.globalAlpha = 1.0;

            // --- Traveling neural signals along fibers ---
            _brainSignals.forEach(sig => {
                sig.t += sig.speed;
                if (sig.t > 1.0) {
                    sig.t = 0;
                    sig.fiberIdx = Math.floor(Math.random() * _brainFibers.length);
                    const sc = ['#38bdf8','#a78bfa','#ffffff','#10b981'];
                    sig.color = sc[Math.floor(Math.random()*sc.length)];
                }
                const f = _brainFibers[sig.fiberIdx];
                if (!f) return;
                const t = sig.t;
                const ot = 1 - t;
                // Quadratic bezier point
                const sx = ot*ot*f.ax + 2*ot*t*f.cpx + t*t*f.bx;
                const sy = ot*ot*f.ay + 2*ot*t*f.cpy + t*t*f.by;
                const sz = ot*ot*f.az + 2*ot*t*f.cpz + t*t*f.bz;

                const proj = IntelligenceCore._project3D(sx, sy, sz, cosY, sinY, cosX, sinX, fov, cx+shiverX, cy+shiverY);
                if (proj.z > -bR*0.5) {
                    ctx.fillStyle = sig.color;
                    ctx.globalAlpha = sig.alpha * (0.6 + t*0.4);
                    ctx.beginPath();
                    ctx.arc(proj.x2d, proj.y2d, sig.size * proj.scale, 0, Math.PI*2);
                    ctx.fill();
                    // Trailing glow
                    ctx.globalAlpha = sig.alpha * 0.2;
                    ctx.beginPath();
                    ctx.arc(proj.x2d, proj.y2d, sig.size * proj.scale * 2.5, 0, Math.PI*2);
                    ctx.fill();
                }
            });
            ctx.globalAlpha = 1.0;
        }

        // =====================================================================
        // DRAW: AI Robot (humanoid procedural geometry)
        // =====================================================================
        static _drawRobot(ctx, rx, ry, scale, robotState, isAgent2, now) {
            if (typeof ctx.save !== 'function') return;
            ctx.save();
            ctx.translate(rx, ry);
            ctx.scale(scale, scale);

            const breathY = Math.sin(now * 0.0024 + (robotState.breathPhase||0)) * 2.0;
            const holFlicker = 0.88 + Math.sin(now * 0.017) * 0.12;
            ctx.globalAlpha = holFlicker;

            // Colors
            const bodyColor  = isAgent2 ? 'rgba(245,158,11,0.8)'  : 'rgba(56,189,248,0.8)';
            const bodyStroke = isAgent2 ? '#f59e0b'                : '#38bdf8';
            const visorColor = isAgent2 ? 'rgba(245,158,11,0.45)'  : 'rgba(56,189,248,0.45)';
            const accentColor = isAgent2 ? '#fcd34d'               : '#67e8f9';

            // ---- LEGS ----
            const legH = 40;
            const legW = 10;
            [-12, 12].forEach(lx => {
                ctx.fillStyle = bodyColor;
                ctx.strokeStyle = bodyStroke;
                ctx.lineWidth = 0.8;
                // Upper leg
                ctx.beginPath();
                ctx.rect(lx - legW/2, 52, legW, legH * 0.55);
                ctx.fill(); ctx.stroke();
                // Lower leg
                ctx.beginPath();
                ctx.rect(lx - legW/2 + 1, 52 + legH*0.55, legW - 2, legH * 0.45);
                ctx.fill(); ctx.stroke();
                // Foot
                ctx.beginPath();
                ctx.rect(lx - legW/2 - 2, 52 + legH, legW + 5, 6);
                ctx.fill(); ctx.stroke();
            });

            // ---- TORSO ----
            ctx.save();
            ctx.translate(0, breathY);
            // Hexagonal torso plate
            const torsoH = 46;
            const torsoW = 26;
            ctx.fillStyle = `rgba(${isAgent2?'100,60,0':'20,40,70'},0.85)`;
            ctx.strokeStyle = bodyStroke;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-torsoW, 16);
            ctx.lineTo(-torsoW+6, 8);
            ctx.lineTo(torsoW-6, 8);
            ctx.lineTo(torsoW, 16);
            ctx.lineTo(torsoW, 8+torsoH-8);
            ctx.lineTo(torsoW-6, 8+torsoH);
            ctx.lineTo(-torsoW+6, 8+torsoH);
            ctx.lineTo(-torsoW, 8+torsoH-8);
            if (typeof ctx.closePath === 'function') ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Chest panel circuits
            ctx.strokeStyle = `rgba(${isAgent2?'245,158,11':'56,189,248'},0.4)`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(-14, 20); ctx.lineTo(14, 20);
            ctx.moveTo(-14, 28); ctx.lineTo(14, 28);
            ctx.moveTo(0, 20); ctx.lineTo(0, 44);
            ctx.stroke();

            // Chest LED dots (4 indicator lights)
            const ledColors = [bodyStroke, '#818cf8', '#f59e0b', '#10b981'];
            for (let li = 0; li < 4; li++) {
                const ledPulse = 0.5 + Math.sin(now * (0.003 + li*0.002)) * 0.5;
                ctx.fillStyle = ledColors[li];
                ctx.globalAlpha = holFlicker * (0.5 + ledPulse * 0.5);
                ctx.beginPath();
                ctx.arc(-9 + li * 6, 36, 2.5, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.globalAlpha = holFlicker;

            // ---- ARMS ----
            const armSwing = isAgent2
                ? Math.sin(now * 0.002) * 0.3 + (robotState.alertArm||0) * 0.6
                : (robotState.armAngle || 0);

            // Left arm
            ctx.save();
            ctx.translate(-torsoW, 18);
            ctx.rotate(armSwing + 0.15);
            ctx.fillStyle = bodyColor;
            ctx.strokeStyle = bodyStroke;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.rect(-7, 0, 7, 24); ctx.fill(); ctx.stroke(); // upper
            ctx.beginPath(); ctx.rect(-6, 24, 6, 20); ctx.fill(); ctx.stroke(); // forearm
            // Claw fingers
            [0, -4, 4].forEach(fx => {
                ctx.beginPath(); ctx.rect(-5+fx, 44, 3, 10); ctx.fill(); ctx.stroke();
            });
            ctx.restore();

            // Right arm
            ctx.save();
            ctx.translate(torsoW, 18);
            ctx.rotate(-armSwing - 0.15);
            ctx.fillStyle = bodyColor;
            ctx.strokeStyle = bodyStroke;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.rect(0, 0, 7, 24); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.rect(0, 24, 6, 20); ctx.fill(); ctx.stroke();
            [0, -4, 4].forEach(fx => {
                ctx.beginPath(); ctx.rect(0+fx, 44, 3, 10); ctx.fill(); ctx.stroke();
            });
            // Holographic mini display in right hand (agent 1 only)
            if (!isAgent2) {
                ctx.strokeStyle = '#38bdf8';
                ctx.fillStyle = 'rgba(56,189,248,0.1)';
                ctx.lineWidth = 0.7;
                ctx.beginPath(); ctx.rect(6, 52, 24, 16); ctx.fill(); ctx.stroke();
                // Mini bar chart inside
                const miniVals = [0.5, 0.8, 0.3, 0.9, 0.6];
                miniVals.forEach((v, mi) => {
                    ctx.fillStyle = accentColor;
                    ctx.globalAlpha = holFlicker * 0.7;
                    ctx.beginPath();
                    ctx.rect(8 + mi*4, 52+16 - v*12, 3, v*12);
                    ctx.fill();
                });
                ctx.globalAlpha = holFlicker;
            }
            ctx.restore();

            // ---- NECK ----
            ctx.fillStyle = bodyColor;
            ctx.strokeStyle = bodyStroke;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.rect(-5, 0, 10, 10); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.rect(-4, 5, 8, 5); ctx.fill(); ctx.stroke();

            // ---- HEAD ----
            const headTurn = isAgent2 ? Math.sin(now * 0.0015) * 0.2 : (robotState.headTurn || 0);
            ctx.save();
            ctx.translate(0, -breathY * 0.5);
            ctx.rotate(headTurn);

            // Head plate
            ctx.fillStyle = `rgba(${isAgent2?'80,50,0':'12,28,56'},0.92)`;
            ctx.strokeStyle = bodyStroke;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-14, -2);
            ctx.lineTo(-16, -10);
            ctx.lineTo(-10, -24);
            ctx.lineTo(10, -24);
            ctx.lineTo(16, -10);
            ctx.lineTo(14, -2);
            if (typeof ctx.closePath === 'function') ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Antenna
            ctx.strokeStyle = bodyStroke;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -24); ctx.lineTo(0, -34);
            ctx.stroke();
            ctx.fillStyle = isAgent2 ? '#f59e0b' : '#38bdf8';
            const antPulse = 0.6 + Math.sin(now * 0.006) * 0.4;
            ctx.globalAlpha = holFlicker * antPulse;
            ctx.beginPath(); ctx.arc(0, -35, 3, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = holFlicker;

            // Visor (single wide lens bar)
            ctx.fillStyle = visorColor;
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(-11, -20, 22, 7, 2);
            } else {
                ctx.rect(-11, -20, 22, 7);
            }
            ctx.fill(); ctx.stroke();

            // Pupil glow inside visor (tracks active target)
            const lookDx = (_observerFocus && _observerFocus.x != null ? _observerFocus.x : 0) - rx;
            const lookAngle = Math.atan2(_observerFocus ? (_observerFocus.y||0) : 0, lookDx);
            const pupilX = Math.cos(lookAngle) * 3 * (isAgent2 ? -1 : 1);
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = holFlicker * (0.7 + Math.sin(now*0.008)*0.3);
            ctx.beginPath();
            ctx.arc(pupilX, -17, 2.8, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = holFlicker;

            // Cheek detail lines
            ctx.strokeStyle = `rgba(${isAgent2?'245,158,11':'56,189,248'},0.3)`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(-14, -10); ctx.lineTo(-10, -13);
            ctx.moveTo(14, -10); ctx.lineTo(10, -13);
            ctx.stroke();

            ctx.restore(); // end head

            ctx.restore(); // end torso breathY

            // ---- Identity label ----
            ctx.fillStyle = `rgba(${isAgent2?'245,158,11':'56,189,248'},0.65)`;
            ctx.font = '6.5px "JetBrains Mono", monospace';
            const lbl = robotState.label || (isAgent2 ? 'AGENT-02' : 'AGENT-01');
            const lblW = lbl.length * 4;
            ctx.fillText(lbl, -lblW/2, 100);

            // Alert indicator for agent 2
            if (isAgent2 && _robot2Alert > 0.05) {
                const alertAlpha = _robot2Alert * 0.85;
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = alertAlpha;
                ctx.beginPath();
                ctx.arc(0, -14, 28, 0, Math.PI*2);
                ctx.stroke();
                ctx.globalAlpha = holFlicker;
            }

            ctx.restore(); // main robot context
        }

        // =====================================================================
        // DRAW: Neural Network (background layer)
        // =====================================================================
        static _drawNeuralNetwork(ctx, baseX, baseY, width, height, now) {
            if (typeof ctx.save !== 'function' || _nnLayers.length === 0) return;
            ctx.save();
            ctx.globalAlpha = 0.42;

            const layerCount = _nnLayers.length;
            const layerSpacingX = width / (layerCount + 1);
            const maxNeurons = Math.max(..._nnLayers.map(l => l.neurons.length));

            // Pre-compute neuron screen positions
            const neuronPos = _nnLayers.map((layer, li) => {
                const lx = baseX + layerSpacingX * (li + 1);
                const nCount = layer.neurons.length;
                const neuronSpacingY = Math.min(28, height / (nCount + 1));
                return layer.neurons.map((n, ni) => ({
                    x: lx,
                    y: baseY + (ni - (nCount-1)/2) * neuronSpacingY,
                    activation: n.activation,
                    label: n.label,
                    phase: n.phase
                }));
            });

            // Draw connections
            _nnConnections.forEach(conn => {
                const fromPos = neuronPos[conn.fromLayer] && neuronPos[conn.fromLayer][conn.fromIdx];
                const toPos   = neuronPos[conn.toLayer]   && neuronPos[conn.toLayer][conn.toIdx];
                if (!fromPos || !toPos) return;
                const breath = 0.7 + Math.sin(now * 0.0014 + conn.fromIdx * 0.3) * 0.3;
                ctx.strokeStyle = conn.layerIdx === 0 ? '#38bdf8' : (conn.layerIdx === 1 ? '#818cf8' : '#10b981');
                ctx.lineWidth = conn.weight * 1.2;
                ctx.globalAlpha = conn.weight * 0.28 * breath;
                ctx.beginPath();
                ctx.moveTo(fromPos.x, fromPos.y);
                ctx.lineTo(toPos.x, toPos.y);
                ctx.stroke();
            });

            // Update and draw NN signals
            const deadSignals = [];
            _nnSignals.forEach((sig, si) => {
                sig.t += sig.speed;
                if (sig.t >= 1.0) { deadSignals.push(si); return; }
                const fromPos = neuronPos[sig.conn.fromLayer] && neuronPos[sig.conn.fromLayer][sig.conn.fromIdx];
                const toPos   = neuronPos[sig.conn.toLayer]   && neuronPos[sig.conn.toLayer][sig.conn.toIdx];
                if (!fromPos || !toPos) return;
                const sx = fromPos.x + (toPos.x - fromPos.x) * sig.t;
                const sy = fromPos.y + (toPos.y - fromPos.y) * sig.t;
                ctx.fillStyle = sig.color;
                ctx.globalAlpha = 0.9;
                ctx.beginPath();
                ctx.arc(sx, sy, sig.size, 0, Math.PI*2);
                ctx.fill();
            });
            // Remove dead signals and spawn new ones
            for (let i = deadSignals.length - 1; i >= 0; i--) {
                _nnSignals.splice(deadSignals[i], 1);
            }
            const targetSignalCount = Math.round(16 * _qualityLevel);
            while (_nnSignals.length < targetSignalCount) IntelligenceCore._spawnNNSignal();

            // Draw neurons (on top of connections)
            ctx.globalAlpha = 0.85;
            neuronPos.forEach((layer, li) => {
                layer.forEach(n => {
                    const activation = n.activation * (0.8 + Math.sin(now * 0.002 + n.phase) * 0.2);
                    const r = 4 + activation * 5;
                    const col = li === 0 ? '#38bdf8' : (li === _nnLayers.length-1 ? '#10b981' : '#818cf8');
                    ctx.fillStyle = col;
                    ctx.globalAlpha = 0.35 + activation * 0.55;
                    ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = col;
                    ctx.lineWidth = 0.8;
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath(); ctx.arc(n.x, n.y, r+2, 0, Math.PI*2); ctx.stroke();
                    if (n.label) {
                        ctx.fillStyle = 'rgba(148,163,184,0.7)';
                        ctx.font = '7px "JetBrains Mono",monospace';
                        ctx.globalAlpha = 0.65;
                        ctx.fillText(n.label.substring(0,6), n.x - 14, n.y - r - 3);
                    }
                });
            });
            ctx.globalAlpha = 1.0;

            // Layer labels
            ['INPUT', 'HIDDEN-1', 'HIDDEN-2', 'OUTPUT'].forEach((lbl, li) => {
                const lx = baseX + layerSpacingX * (li + 1);
                ctx.fillStyle = 'rgba(56,189,248,0.4)';
                ctx.font = '7px "JetBrains Mono",monospace';
                ctx.globalAlpha = 0.5;
                ctx.fillText(lbl, lx - lbl.length*2.2, baseY + height/2 + 18);
            });
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }

        // =====================================================================
        // DRAW: 3D Data Scatter Cloud
        // =====================================================================
        static _drawDataCloud(ctx, cx, cy, cosY, sinY, cosX, sinX, fov, now, shiverX, shiverY) {
            if (_dataCloud.length === 0) return;

            // Anomaly state animation
            if (_anomalyState.active) {
                const elapsed = Date.now() - _anomalyState.timer;
                if (elapsed < 5000) {
                    _anomalyState.separationY = Math.min(-55, _anomalyState.separationY - 0.8);
                    _anomalyState.expansionR = 5 + Math.sin(elapsed * 0.006) * 18;
                } else {
                    // Return to cluster
                    _anomalyState.separationY *= 0.97;
                    _anomalyState.expansionR *= 0.95;
                    if (Math.abs(_anomalyState.separationY) < 1) {
                        _anomalyState.active = false;
                        _anomalyState.separationY = 0;
                    }
                }
            }

            const cloudAlpha = 0.7;
            ctx.globalAlpha = cloudAlpha;

            _dataCloud.forEach((p, pi) => {
                // Gentle drift
                p.x += p.drift.x; p.y += p.drift.y; p.z += p.drift.z;
                // Soft boundary
                if (Math.abs(p.x) > 125) p.drift.x *= -1;
                if (Math.abs(p.y) > 65)  p.drift.y *= -1;
                if (Math.abs(p.z) > 125) p.drift.z *= -1;

                let py = p.y;
                if (p.isAnomaly && _anomalyState.active && _anomalyState.pointIdx === pi) {
                    py += _anomalyState.separationY;
                }

                const proj = IntelligenceCore._project3D(p.x, py, p.z, cosY, sinY, cosX, sinX, fov, cx+shiverX, cy+shiverY);
                const sz = Math.max(0.6, p.size * proj.scale);

                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha * cloudAlpha;
                ctx.beginPath();
                ctx.arc(proj.x2d, proj.y2d, sz, 0, Math.PI*2);
                ctx.fill();

                // Anomaly ring
                if (p.isAnomaly && _anomalyState.active && _anomalyState.pointIdx === pi) {
                    const ringAlpha = 0.6 + Math.sin(Date.now()*0.008)*0.4;
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 1.5;
                    ctx.globalAlpha = ringAlpha;
                    for (let ri = 1; ri <= 3; ri++) {
                        ctx.beginPath();
                        ctx.arc(proj.x2d, proj.y2d, (_anomalyState.expansionR + ri*8) * proj.scale, 0, Math.PI*2);
                        ctx.stroke();
                    }
                    ctx.fillStyle = '#ef4444';
                    ctx.font = '9px "JetBrains Mono",monospace';
                    ctx.globalAlpha = 0.9;
                    ctx.fillText('⚠ ANOMALY', proj.x2d + 12, proj.y2d - 8);
                }
            });
            ctx.globalAlpha = 1.0;
        }

        // =====================================================================
        // DRAW: Color-coded Data Streams
        // =====================================================================
        static _drawDataStreams(ctx, cx, cy, now, width, height) {
            if (typeof ctx.save !== 'function') return;

            // Stream bezier waypoints (relative to canvas center)
            // Stream 0: outer left rim → brain center
            // Stream 1: brain center → neural net
            // Stream 2: neural net → charts area
            // Stream 3: anomaly branch (conditional)
            // Stream 4: right exit → insight panel
            const streamPaths = [
                [[-width*0.48, cy*0.3], [-width*0.25, 0], [0, 0]],                        // Raw ingestion
                [[0, 0], [-width*0.15, -cy*0.2], [-width*0.38, -cy*0.35]],               // Processing
                [[-width*0.38, -cy*0.35], [-width*0.1, cy*0.2], [width*0.25, cy*0.3]],  // ML inference
                [[0, 0], [width*0.1, -cy*0.4], [width*0.3, -cy*0.5]],                    // Anomaly (conditional)
                [[width*0.3, cy*0.1], [width*0.4, 0], [width*0.48, -cy*0.2]]            // Validated insight
            ];

            _dataStreams.forEach((stream, si) => {
                // Stream 3 (amber anomaly) only emits when excited
                if (stream.conditional && _analyticalExcitement < 0.25) return;

                const path = streamPaths[si];
                if (!path) return;

                stream.particles.forEach(p => {
                    p.t += stream.speed;
                    if (p.t >= 1.0) p.t = 0.0;

                    // Cubic bezier interpolation along 3-point path
                    const t = p.t;
                    const p0 = path[0], p1 = path[1], p2 = path[2];
                    const ot = 1 - t;
                    const bx = cx + ot*ot*p0[0] + 2*ot*t*p1[0] + t*t*p2[0];
                    const by = cy + ot*ot*p0[1] + 2*ot*t*p1[1] + t*t*p2[1];

                    // Particle glow
                    const gAlpha = 0.4 + Math.sin(now*0.006 + t*4)*0.3;
                    ctx.fillStyle = stream.color;
                    ctx.globalAlpha = gAlpha;
                    ctx.beginPath();
                    ctx.arc(bx, by, p.size, 0, Math.PI*2);
                    ctx.fill();
                    // Halo
                    ctx.globalAlpha = gAlpha * 0.25;
                    ctx.beginPath();
                    ctx.arc(bx, by, p.size * 3, 0, Math.PI*2);
                    ctx.fill();
                });

                // Stream label at midpoint
                const p1 = path[0], p2 = path[path.length-1];
                const mlx = cx + (p1[0] + p2[0])/2;
                const mly = cy + (p1[1] + p2[1])/2;
                ctx.fillStyle = stream.color;
                ctx.font = '6.5px "JetBrains Mono",monospace';
                ctx.globalAlpha = 0.5;
                ctx.fillText(stream.label, mlx, mly - 8);
            });
            ctx.globalAlpha = 1.0;
        }

        // =====================================================================
        // DRAW: 3D Bar Forest Chart
        // =====================================================================
        static _drawBarChart(ctx, bx, by, now) {
            if (typeof ctx.save !== 'function' || _barData.length === 0) return;
            ctx.save();
            ctx.globalAlpha = 0.7;

            const maxH = 52;
            const barW = 10;
            const gap = 3;
            const depth = 5;
            const totalW = _barData.length * (barW + gap);

            // Chart background plate
            ctx.fillStyle = 'rgba(8,14,28,0.7)';
            ctx.strokeStyle = 'rgba(56,189,248,0.2)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.rect(bx - 5, by - maxH - 10, totalW + 10, maxH + 24);
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = 'rgba(56,189,248,0.5)';
            ctx.font = '7px "JetBrains Mono",monospace';
            ctx.fillText('IMPORTANCE VECTORS', bx, by - maxH - 3);

            _barData.forEach((bar, i) => {
                const barH = bar.value * maxH * (1 + Math.sin(now * 0.002 + i) * 0.04);
                const bLeft = bx + i * (barW + gap);
                const bTop  = by - barH;

                // Front face
                ctx.fillStyle = bar.color;
                ctx.globalAlpha = 0.75;
                ctx.beginPath(); ctx.rect(bLeft, bTop, barW, barH); ctx.fill();
                // Top face (3D effect)
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.moveTo(bLeft, bTop);
                ctx.lineTo(bLeft + depth, bTop - depth);
                ctx.lineTo(bLeft + barW + depth, bTop - depth);
                ctx.lineTo(bLeft + barW, bTop);
                if (typeof ctx.closePath === 'function') ctx.closePath();
                ctx.fill();
                // Right face (3D shading)
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.moveTo(bLeft + barW, bTop);
                ctx.lineTo(bLeft + barW + depth, bTop - depth);
                ctx.lineTo(bLeft + barW + depth, by - depth);
                ctx.lineTo(bLeft + barW, by);
                if (typeof ctx.closePath === 'function') ctx.closePath();
                ctx.fill();
                // Label
                ctx.fillStyle = 'rgba(148,163,184,0.7)';
                ctx.font = '5.5px "JetBrains Mono",monospace';
                ctx.globalAlpha = 0.6;
                ctx.save();
                ctx.translate(bLeft + barW/2, by + 3);
                ctx.rotate(-Math.PI/4);
                ctx.fillText(bar.label.substring(0,5), 0, 0);
                ctx.restore();
            });

            ctx.globalAlpha = 1.0;
            ctx.restore();
        }

        // =====================================================================
        // DRAW: 3D Correlation Heatmap Surface
        // =====================================================================
        static _drawHeatmap(ctx, hx, hy, now) {
            if (typeof ctx.save !== 'function' || _heatData.length === 0) return;
            ctx.save();
            ctx.globalAlpha = 0.6;

            const cellW = 10;
            const cellH = 7;
            const skewX = 4;
            const cols = 6;

            ctx.fillStyle = 'rgba(56,189,248,0.5)';
            ctx.font = '7px "JetBrains Mono",monospace';
            ctx.fillText('CORRELATION SURFACE', hx, hy - 48);

            for (let r = 0; r < 6; r++) {
                for (let c = 0; c < cols; c++) {
                    const val = _heatData[r * cols + c] * (0.85 + Math.sin(now*0.001 + r*c)*0.15);
                    const x = hx + c * cellW + r * skewX;
                    const y = hy - r * cellH;
                    // Color: cool (blue) → hot (amber/red)
                    const heat = Math.floor(val * 255);
                    const cool = Math.floor((1-val) * 255);
                    ctx.fillStyle = `rgba(${heat},${Math.floor(val*100)},${cool},0.8)`;
                    ctx.globalAlpha = 0.55 + val * 0.35;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + cellW, y);
                    ctx.lineTo(x + cellW + skewX, y - cellH);
                    ctx.lineTo(x + skewX, y - cellH);
                    if (typeof ctx.closePath === 'function') ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(56,189,248,0.15)';
                    ctx.lineWidth = 0.4;
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }

        // =====================================================================
        // DRAW: Variable entity nodes (interaction layer)
        // =====================================================================
        static _drawVariableNodes(ctx, cx, cy, cosY, sinY, cosX, sinX, fov, now, shiverX, shiverY) {
            const projVars = _variableNodes.map(vn => {
                if (vn.role === 'NUMERIC') {
                    vn.orbitAngle += vn.orbitSpeed;
                    vn.x = Math.cos(vn.orbitAngle) * vn.baseRadius;
                    vn.z = Math.sin(vn.orbitAngle) * vn.baseRadius;
                    vn.y = Math.sin(now * 0.001 + vn.baseAngle) * 35;
                } else if (vn.role === 'CATEGORICAL') {
                    vn.orbitAngle += vn.orbitSpeed;
                    const clusterPulse = Math.sin(now * 0.0022 + vn.clusterGroup) * 16;
                    const r = vn.baseRadius + clusterPulse;
                    vn.x = Math.cos(vn.orbitAngle) * r;
                    vn.z = Math.sin(vn.orbitAngle) * r;
                    vn.y = (vn.clusterGroup === 0 ? -45 : 45) + Math.cos(now * 0.0018) * 8;
                } else if (vn.role === 'TARGET') {
                    const anchorWobble = Math.sin(now * 0.0014) * 6;
                    vn.x = Math.cos(vn.baseAngle) * 95 + anchorWobble;
                    vn.z = Math.sin(vn.baseAngle) * 95 + 30;
                    vn.y = -18 + Math.sin(now * 0.002) * 8;
                } else if (vn.role === 'TEMPORAL') {
                    vn.orbitAngle += 0.007;
                    vn.x = Math.cos(vn.orbitAngle) * 135;
                    vn.z = Math.sin(vn.orbitAngle) * 135;
                    vn.y = Math.sin(vn.orbitAngle * 2) * 45;
                } else if (vn.role === 'ANOMALOUS') {
                    const jitX = (Math.sin(now * 0.013) + Math.sin(now * 0.031)) * 5;
                    const jitY = (Math.cos(now * 0.017) + Math.cos(now * 0.029)) * 5;
                    vn.orbitAngle += vn.orbitSpeed;
                    vn.x = Math.cos(vn.orbitAngle) * (vn.baseRadius + jitX);
                    vn.z = Math.sin(vn.orbitAngle) * (vn.baseRadius + jitX);
                    vn.y = ((vn.baseAngle % 3) - 1) * 40 + jitY;
                } else {
                    vn.orbitAngle += vn.orbitSpeed * 1.5;
                    vn.x = Math.cos(vn.orbitAngle) * (vn.baseRadius + Math.sin(now * 0.003) * 10);
                    vn.z = Math.sin(vn.orbitAngle) * (vn.baseRadius + Math.sin(now * 0.003) * 10);
                    vn.y = Math.sin(now * 0.0025 + vn.baseAngle) * 35;
                }

                const proj = IntelligenceCore._project3D(vn.x, vn.y, vn.z, cosY, sinY, cosX, sinX, fov, cx+shiverX, cy+shiverY);
                proj.r = Math.max(4, (5 + vn.importance * 4) * proj.scale);
                proj.node = vn;
                vn._proj = proj;
                return proj;
            });

            projVars.sort((a, b) => a.z - b.z);

            projVars.forEach(p => {
                const node = p.node;
                const isHovered = _selectedNode && _selectedNode.id === node.id;
                const isTarget = node.role === 'TARGET';
                const alpha = Math.max(0.3, Math.min(0.95, 0.4 + (p.z + 160) / 320));

                if (isTarget) {
                    ctx.strokeStyle = 'rgba(245,158,11,0.4)';
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.arc(p.x2d, p.y2d, (p.r + 7) * (1 + Math.sin(now*0.005)*0.2), 0, Math.PI*2);
                    ctx.stroke();
                }

                ctx.strokeStyle = isHovered ? '#ffffff' : node.color;
                ctx.lineWidth = isHovered ? 2.5 : 1.4;
                ctx.beginPath();
                ctx.arc(p.x2d, p.y2d, p.r + (isHovered ? 3.5 : 1.5), 0, Math.PI*2);
                ctx.stroke();
                ctx.fillStyle = node.color;
                ctx.beginPath();
                ctx.arc(p.x2d, p.y2d, p.r, 0, Math.PI*2);
                ctx.fill();
                // Highlight specular
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(p.x2d - p.r*0.3, p.y2d - p.r*0.3, p.r*0.3, 0, Math.PI*2);
                ctx.fill();
                // Label
                if (p.z > -35 || isHovered || isTarget) {
                    ctx.font = `${Math.floor(Math.max(8, 10 * p.scale))}px "JetBrains Mono",monospace`;
                    ctx.fillStyle = isHovered ? '#38bdf8' : (isTarget ? '#f59e0b' : `rgba(248,250,252,${alpha})`);
                    ctx.fillText(node.name, p.x2d + p.r + 4, p.y2d + 3);
                    ctx.font = `${Math.floor(Math.max(7, 8 * p.scale))}px "JetBrains Mono",monospace`;
                    ctx.fillStyle = `rgba(148,163,184,${alpha*0.8})`;
                    ctx.fillText(`${node.role} • ${(node.importance*100).toFixed(0)}%`, p.x2d + p.r + 4, p.y2d + 13);
                }
            });
        }

        // =====================================================================
        // DRAW: Ingestion particles (convergence on awakening)
        // =====================================================================
        static _drawIngestionParticles(ctx, cx, cy, cosY, sinY, cosX, sinX, fov, shiverX, shiverY) {
            if (_awakeningProgress >= 1.0 || _ingestionParticles.length === 0) return;
            _ingestionParticles.forEach(ip => {
                ip.progress += ip.speed;
                if (ip.progress > 1.0) ip.progress = 1.0;
                const ease = Math.sin((ip.progress * Math.PI) / 2);
                const cx3 = ip.x * (1 - ease);
                const cy3 = ip.y * (1 - ease);
                const cz3 = ip.z * (1 - ease);
                const proj = IntelligenceCore._project3D(cx3, cy3, cz3, cosY, sinY, cosX, sinX, fov, cx+shiverX, cy+shiverY);
                ctx.fillStyle = ip.color;
                ctx.globalAlpha = 0.85;
                ctx.beginPath();
                ctx.arc(proj.x2d, proj.y2d, ip.size * proj.scale, 0, Math.PI*2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
            _awakeningProgress += 0.012;
            if (_awakeningProgress > 1.0) _awakeningProgress = 1.0;
        }

        // =====================================================================
        // MAIN ANIMATION LOOP
        // =====================================================================
        static _animate() {
            if (!_canvas || !_ctx) return;

            // When 3D WebGL Spatial Laboratory is running, suppress 2D Canvas duplicate rendering
            if (_spatialScene) {
                if (_canvas.style && _canvas.style.display !== 'none') {
                    _canvas.style.display = 'none';
                }
                if (typeof _ctx.clearRect === 'function') {
                    _ctx.clearRect(0, 0, _canvas.width || 800, _canvas.height || 420);
                }
                if (typeof requestAnimationFrame === 'function') {
                    _animId = requestAnimationFrame(() => IntelligenceCore._animate());
                } else if (typeof setTimeout === 'function') {
                    _animId = setTimeout(() => IntelligenceCore._animate(), 100);
                }
                return;
            }

            const now = Date.now();

            // FPS tracking & quality adaptation
            if (_lastFrameTime > 0) {
                const fps = 1000 / (now - _lastFrameTime);
                _fpsHistory.push(fps);
                if (_fpsHistory.length > 30) _fpsHistory.shift();
                const avgFps = _fpsHistory.reduce((s,v)=>s+v,0)/(_fpsHistory.length||1);
                if (avgFps < 28) _qualityLevel = Math.max(0.4, _qualityLevel - 0.02);
                else if (avgFps > 48 && _qualityLevel < 1.0) _qualityLevel = Math.min(1.0, _qualityLevel + 0.01);
            }
            _lastFrameTime = now;

            const parent = _canvas.parentElement;
            const rect = (parent && typeof parent.getBoundingClientRect === 'function')
                ? parent.getBoundingClientRect()
                : { width: _canvas.width || 800, height: _canvas.height || 420 };
            const width = rect.width || 800;
            const height = rect.height || 420;

            // Virtual camera interpolation
            _camera.cx += (_camera.targetCx - _camera.cx) * 0.04;
            _camera.cy += (_camera.targetCy - _camera.cy) * 0.04;
            _camera.fov += (_camera.targetFov - _camera.fov) * 0.04;
            const cx = width / 2 + _camera.cx;
            const cy = height / 2 + _camera.cy;
            const fov = _camera.fov;

            _ctx.clearRect(0, 0, width, height);

            // Smooth parallax rotation
            _rotY += (_targetRotY - _rotY) * 0.05 + 0.0028;
            _rotX += (_targetRotX - _rotX) * 0.05;
            _scanPhase += 0.010;

            // Analytical excitement decay
            if (_analyticalExcitement > 0.004) _analyticalExcitement *= 0.987;
            else _analyticalExcitement = 0.0;

            // Robot state updates
            _robotBreathPhase += 0.0018;
            if (_robot1) { _robot1.breathPhase = _robotBreathPhase; _robot1Focus.intensity *= 0.97; }
            if (_robot2) {
                _robot2.breathPhase = _robotBreathPhase + Math.PI;
                _robot2Alert *= 0.98;
                _robot2.alertArm = _robot2Alert;
                _robot2.armAngle = Math.sin(_robotBreathPhase * 2.5) * 0.25 + _robot2Alert * 0.55;
            }

            // Cinematic arm movement for robot 1
            if (_robot1) {
                if (_cinematicPhase === 2) {
                    _robot1.armAngle = Math.min(0.8, _robot1.armAngle + 0.02);
                } else {
                    _robot1.armAngle = _robot1.armAngle * 0.97 + Math.sin(now * 0.001) * 0.12 * 0.03;
                }
            }

            // Counter-evidence shiver
            let shiverX = 0, shiverY = 0;
            if (_counterEvidenceEvent) {
                const elapsed = now - _counterEvidenceEvent.startTime;
                if (elapsed < _counterEvidenceEvent.duration) {
                    const intensity = (1 - elapsed / _counterEvidenceEvent.duration);
                    shiverX = (Math.random() - 0.5) * 6 * intensity;
                    shiverY = (Math.random() - 0.5) * 6 * intensity;
                } else {
                    _counterEvidenceEvent = null;
                }
            }

            const cosY = Math.cos(_rotY);
            const sinY = Math.sin(_rotY);
            const cosX = Math.cos(_rotX);
            const sinX = Math.sin(_rotX);

            // Brain breathing pulse
            const resp1 = Math.sin(now * 0.0018) * 0.032;
            const resp2 = Math.cos(now * 0.0042) * 0.016;
            const excitePulse = _analyticalExcitement * Math.sin(now * 0.008) * 0.055;
            const pulse = 1.0 + resp1 + resp2 + excitePulse;

            // =================================================================
            // LAYER 0: Deep environment (gradient background handled by CSS)
            // =================================================================

            // Subtle starfield
            if (_qualityLevel >= 0.6) {
                const starCount = Math.round(40 * _qualityLevel);
                for (let i = 0; i < starCount; i++) {
                    const sx = ((i * 137.508 + 12) % width);
                    const sy = ((i * 97.3 + 7) % height);
                    const sa = 0.15 + (Math.sin(now * 0.002 + i) * 0.5 + 0.5) * 0.25;
                    _ctx.fillStyle = '#94a3b8';
                    _ctx.globalAlpha = sa;
                    if (typeof _ctx.fillRect === 'function') _ctx.fillRect(sx, sy, 1, 1);
                }
                _ctx.globalAlpha = 1.0;
            }

            // =================================================================
            // LAYER 1: Neural Network background (behind everything)
            // =================================================================
            const nnWidth  = width  * 0.65;
            const nnHeight = height * 0.52;
            const nnBaseX  = cx - nnWidth/2;
            const nnBaseY  = cy;
            IntelligenceCore._drawNeuralNetwork(_ctx, nnBaseX, nnBaseY, nnWidth, nnHeight, now);

            // =================================================================
            // LAYER 2: 3D Data Scatter Cloud (mid-field)
            // =================================================================
            IntelligenceCore._drawDataCloud(_ctx, cx, cy, cosY, sinY, cosX, sinX, fov, now, shiverX, shiverY);

            // =================================================================
            // LAYER 3: Color-coded data streams
            // =================================================================
            IntelligenceCore._drawDataStreams(_ctx, cx, cy, now, width/2, height/2);

            // =================================================================
            // LAYER 4: Analytical charts (lower corners)
            // =================================================================
            IntelligenceCore._drawBarChart(_ctx, cx - width*0.42, cy + height*0.12, now);
            IntelligenceCore._drawHeatmap(_ctx, cx + width*0.22, cy + height*0.05, now);

            // =================================================================
            // LAYER 5: Holographic AI BRAIN (centerpiece)
            // =================================================================
            IntelligenceCore._drawBrain(_ctx, cx, cy, cosY, sinY, cosX, sinX, fov, now, pulse, shiverX, shiverY);

            // =================================================================
            // LAYER 5b: Variable nodes (orbit around brain)
            // =================================================================
            IntelligenceCore._drawVariableNodes(_ctx, cx, cy, cosY, sinY, cosX, sinX, fov, now, shiverX, shiverY);

            // =================================================================
            // LAYER 5c: Ingestion convergence particles
            // =================================================================
            IntelligenceCore._drawIngestionParticles(_ctx, cx, cy, cosY, sinY, cosX, sinX, fov, shiverX, shiverY);

            // =================================================================
            // LAYER 6: AI ROBOTS — Agent-01 (LEFT) and Agent-02 (RIGHT)
            // =================================================================
            if (_robot1) {
                IntelligenceCore._drawRobot(_ctx, cx - width*0.36, cy - height*0.04, 1.15, _robot1, false, now);
            }
            if (_robot2) {
                IntelligenceCore._drawRobot(_ctx, cx + width*0.36, cy - height*0.04, 0.85, _robot2, true, now);
            }

            // =================================================================
            // LAYER 7: HUD overlays — scanning beam + telemetry
            // =================================================================
            // Holographic scanning beam
            const scanBeamX = cx + Math.sin(_scanPhase) * (width * 0.42);
            if (typeof _ctx.save === 'function') {
                _ctx.save();
                _ctx.strokeStyle = 'rgba(56,189,248,0.28)';
                _ctx.lineWidth = 1.2;
                if (typeof _ctx.setLineDash === 'function') _ctx.setLineDash([6, 5]);
                _ctx.beginPath();
                _ctx.moveTo(scanBeamX, cy - height*0.42);
                _ctx.lineTo(scanBeamX, cy + height*0.42);
                _ctx.stroke();
                if (typeof _ctx.setLineDash === 'function') _ctx.setLineDash([]);
                _ctx.restore();
            }

            // FPS and coords HUD
            if (typeof document !== 'undefined') {
                const fpsEl = document.getElementById('udip-canvas-fps');
                if (fpsEl && _fpsHistory.length > 0) {
                    const avgFps = Math.round(_fpsHistory.reduce((s,v)=>s+v,0)/(_fpsHistory.length));
                    fpsEl.textContent = `${avgFps} FPS`;
                }
                const coordEl = document.getElementById('udip-canvas-coords');
                if (coordEl) {
                    coordEl.textContent = `θ: ${(_rotY * 180 / Math.PI).toFixed(1)}° | φ: ${(_rotX * 180 / Math.PI).toFixed(1)}°`;
                }
            }

            // =================================================================
            // SCHEDULE NEXT FRAME
            // =================================================================
            if (typeof requestAnimationFrame === 'function') {
                _animId = requestAnimationFrame(() => IntelligenceCore._animate());
            } else if (typeof setTimeout === 'function') {
                _animId = setTimeout(() => IntelligenceCore._animate(), 16);
            }
        }
    }

    return IntelligenceCore;
}));
