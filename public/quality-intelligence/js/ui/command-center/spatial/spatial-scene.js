/**
 * ============================================================================
 * UDIP 3D AI RESEARCH LABORATORY — MASTER SPATIAL SCENE
 * Module: js/ui/command-center/spatial/spatial-scene.js
 * ============================================================================
 * Master WebGL Spatial Scene Coordinator:
 * - Directs Three.js WebGLRenderer, PerspectiveCamera & Cinematic Lighting
 * - Harmonizes all 9 Spatial Subsystems:
 *     1. SpatialLightingSystem (Dynamic multi-harmonic lighting rig)
 *     2. SpatialCameraDirector (Cinematic focal shifts & parallax)
 *     3. SpatialAIBrain (Dual-hemisphere folded neural nucleus)
 *     4. SpatialAIAgent [Agent-01] (Data Scientist Robot)
 *     5. SpatialAIAgent [Agent-02] (Model Validator Robot)
 *     6. SpatialNeuralNetwork (5-layer 3D deep ML representation)
 *     7. SpatialDataUniverse (Empirical record scatter & anomaly separation)
 *     8. SpatialParticleEngine (5 volumetric conduits & atmosphere)
 *     9. SpatialAnalyticalCharts (3D Bar Forest, Correlation Terrain & Model Chamber)
 *    10. SpatialHolographicUI (3D floating anchored telemetry)
 * - Intelligence Event Bus: Reactive coordinated choreography to all UDIP events
 * - 7-Second "UDIP Awakens" opening laboratory sequence
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.SpatialScene = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class SpatialScene {
        constructor() {
            this.container = null;
            this.canvas = null;
            this.renderer = null;
            this.scene = null;
            this.camera = null;

            // Subsystems
            this.lighting = null;
            this.cameraDirector = null;
            this.brain = null;
            this.agent1 = null;
            this.agent2 = null;
            this.neuralNetwork = null;
            this.dataUniverse = null;
            this.particleEngine = null;
            this.analyticalCharts = null;
            this.holographicUI = null;
            this.soundEngine = null;
            this.cyberFloor = null;

            // Communication beam between agents
            this.interAgentBeam = null;

            // Free Orbit Drag & Raycasting state
            this.isDragging = false;
            this.previousMousePosition = { x: 0, y: 0 };
            this.orbitRotation = { x: 0, y: 0 };
            this.orbitVelocity = { x: 0, y: 0 };
            this._onMouseDownHandler = this._onMouseDown.bind(this);
            this._onMouseMoveHandler = this._onMouseMove.bind(this);
            this._onMouseUpHandler = this._onMouseUp.bind(this);
            this._onClickHandler = this._onClick.bind(this);

            // Loop state
            this.animId = null;
            this.isAlive = false;
            this.isPaused = false;
            this.lastTime = 0;
            this.excitement = 0.0;

            // Event bindings
            this._onResizeHandler = this._onResize.bind(this);
            this._onVisibilityHandler = this._onVisibilityChange.bind(this);
            this._motionUnsubscribe = null;
        }

        mount(containerElement, state = null) {
            this.unmount();
            if (!containerElement) return false;

            const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE) || null;
            if (!THREE) return false;

            // Verify WebGL availability
            try {
                const testCanvas = document.createElement('canvas');
                const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
                if (!gl) return false;
            } catch (e) {
                return false;
            }

            this.container = containerElement;

            // 1. Create WebGL Canvas
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'udip-spatial-webgl-canvas';
            this.canvas.style.position = 'absolute';
            this.canvas.style.inset = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.zIndex = '1';
            this.canvas.style.pointerEvents = 'auto';

            this.container.appendChild(this.canvas);

            const rect = this.container.getBoundingClientRect ? this.container.getBoundingClientRect() : { width: 800, height: 420 };
            const width = rect.width || 800;
            const height = rect.height || 420;

            // 2. Three.js Renderer Setup
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                alpha: true,
                antialias: true,
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min((typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1, 2));
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.2;

            // 3. Scene & Camera
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.FogExp2(0x050813, 0.0016);

            this.camera = new THREE.PerspectiveCamera(52, width / height, 1, 2000);
            this.camera.position.set(0, 25, 420);

            const dataset = (state && state.dataset) ? state.dataset : state;
            const profile = state && state.profile ? state.profile : null;
            const dkm = state && state.dkm ? state.dkm : null;

            // 4. Initialize All 9 Subsystems
            const S = (typeof window !== 'undefined' && window.UDIP) || (typeof globalThis !== 'undefined' && globalThis.UDIP) || {};

            if (S.SpatialLightingSystem) {
                this.lighting = new S.SpatialLightingSystem().init(this.scene);
            }
            if (S.SpatialCameraDirector) {
                this.cameraDirector = new S.SpatialCameraDirector().init(this.camera, this.canvas);
            }
            if (S.SpatialAIBrain) {
                this.brain = new S.SpatialAIBrain().init(this.scene, dataset);
            }
            if (S.SpatialAIAgent) {
                this.agent1 = new S.SpatialAIAgent({
                    id: 'AGENT_01',
                    name: 'AGENT-01 // DATA SCIENTIST',
                    role: 'DATA_SCIENTIST',
                    position: [-210, 10, 30]
                }).init(this.scene);

                this.agent2 = new S.SpatialAIAgent({
                    id: 'AGENT_02',
                    name: 'AGENT-02 // MODEL VALIDATOR',
                    role: 'MODEL_VALIDATOR',
                    position: [210, 10, 30]
                }).init(this.scene);
            }
            if (S.SpatialNeuralNetwork) {
                this.neuralNetwork = new S.SpatialNeuralNetwork().init(this.scene, dataset, profile);
            }
            if (S.SpatialDataUniverse) {
                this.dataUniverse = new S.SpatialDataUniverse().init(this.scene, dataset, profile);
            }
            if (S.SpatialParticleEngine) {
                this.particleEngine = new S.SpatialParticleEngine().init(this.scene);
            }
            if (S.SpatialAnalyticalCharts) {
                this.analyticalCharts = new S.SpatialAnalyticalCharts().init(this.scene, dataset, profile, dkm);
            }
            if (S.SpatialHolographicUI) {
                this.holographicUI = new S.SpatialHolographicUI().init(this.scene, state);
            }
            if (S.SpatialSoundEngine) {
                this.soundEngine = new S.SpatialSoundEngine().init();
            }
            if (S.SpatialHologramShaders && typeof S.SpatialHologramShaders.createCyberFloor === 'function') {
                this.cyberFloor = S.SpatialHologramShaders.createCyberFloor(this.scene);
            }

            // Interactive Orbit & Raycasting Listeners
            if (this.canvas && typeof this.canvas.addEventListener === 'function') {
                this.canvas.addEventListener('mousedown', this._onMouseDownHandler);
                this.canvas.addEventListener('mousemove', this._onMouseMoveHandler);
                this.canvas.addEventListener('mouseup', this._onMouseUpHandler);
                this.canvas.addEventListener('mouseleave', this._onMouseUpHandler);
                this.canvas.addEventListener('click', this._onClickHandler);
            }

            // 5. Inter-Agent Analytical Communication Conduit
            const beamGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-190, 20, 30),
                new THREE.Vector3(0, 15, 0),
                new THREE.Vector3(190, 20, 30)
            ]);
            const beamMat = new THREE.LineBasicMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.0,
                blending: THREE.AdditiveBlending
            });
            this.interAgentBeam = new THREE.Line(beamGeo, beamMat);
            this.scene.add(this.interAgentBeam);

            // 6. Connect to UDIP Motion Orchestrator
            const glob = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
            if (glob.UDIP && glob.UDIP.MotionOrchestrator) {
                const mo = glob.UDIP.MotionOrchestrator;
                const EV = mo.constructor.EVENTS;

                const u1 = mo.on(EV.DATA_PROFILED, () => this.handleEvent('DATA_PROFILED'));
                const u2 = mo.on(EV.RELATIONSHIP_DISCOVERED, (d) => this.handleEvent('RELATIONSHIP_DISCOVERED', d));
                const u3 = mo.on(EV.ANOMALY_DETECTED, (d) => this.handleEvent('ANOMALY_DETECTED', d));
                const u4 = mo.on(EV.HYPOTHESIS_CREATED, (d) => this.handleEvent('HYPOTHESIS_CREATED', d));
                const u5 = mo.on(EV.HYPOTHESIS_TESTED, (d) => this.handleEvent('HYPOTHESIS_TESTED', d));
                const u6 = mo.on(EV.COUNTER_EVIDENCE_FOUND, (d) => this.handleEvent('COUNTER_EVIDENCE_FOUND', d));
                const u7 = mo.on(EV.WHAT_IF_PERTURBED, (d) => this.handleEvent('WHAT_IF_PERTURBED', d));
                const u8 = mo.on(EV.CONCLUSION_REACHED, (d) => this.handleEvent('CONCLUSION_REACHED', d));

                this._motionUnsubscribe = () => {
                    [u1, u2, u3, u4, u5, u6, u7, u8].forEach(u => { if (u) u(); });
                };
            }

            // 7. Event Listeners
            if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
                window.addEventListener('resize', this._onResizeHandler);
            }
            if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
                document.addEventListener('visibilitychange', this._onVisibilityHandler);
            }

            // 8. Start Rendering Loop
            this.isAlive = true;
            this.lastTime = Date.now();
            this._animate();

            // Trigger awakening sequence
            this.triggerOpeningCinematic();

            return true;
        }

        _onMouseDown(e) {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
            if (this.soundEngine) {
                this.soundEngine.startAmbientHum();
            }
        }

        _onMouseMove(e) {
            if (!this.isDragging) return;
            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;

            this.orbitVelocity.y = deltaX * 0.0035;
            this.orbitVelocity.x = deltaY * 0.0025;

            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        }

        _onMouseUp() {
            this.isDragging = false;
        }

        _onClick(e) {
            if (!this.camera || !this.scene || !this.cameraDirector || !this.canvas) return;
            const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE) || null;
            if (!THREE) return;

            const rect = this.canvas.getBoundingClientRect ? this.canvas.getBoundingClientRect() : { left: 0, top: 0, width: 800, height: 420 };
            const mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / (rect.width || 800)) * 2 - 1,
                -((e.clientY - rect.top) / (rect.height || 420)) * 2 + 1
            );

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);

            const targets = [];
            if (this.brain && this.brain.group) targets.push(this.brain.group);
            if (this.agent1 && this.agent1.group) targets.push(this.agent1.group);
            if (this.agent2 && this.agent2.group) targets.push(this.agent2.group);

            const intersects = raycaster.intersectObjects(targets, true);
            if (intersects.length > 0) {
                const hit = intersects[0];
                if (this.soundEngine) this.soundEngine.playCameraSwoosh();
                this.cameraDirector.focusOnTarget(hit.point.x, hit.point.y, hit.point.z, 160, 0.07);
            }
        }

        handleEvent(eventName, payload = null) {
            this.excitement = 1.0;

            // Trigger procedural soundscape
            if (this.soundEngine) {
                if (eventName === 'DATA_PROFILED') this.soundEngine.playCameraSwoosh();
                else if (eventName === 'RELATIONSHIP_DISCOVERED') this.soundEngine.playSynapticClick();
                else if (eventName === 'ANOMALY_DETECTED' || eventName === 'COUNTER_EVIDENCE_FOUND') this.soundEngine.playAnomalyAlert();
                else if (eventName === 'HYPOTHESIS_CREATED') this.soundEngine.playHypothesisBeam();
                else if (eventName === 'HYPOTHESIS_TESTED') this.soundEngine.playSynapticClick();
                else if (eventName === 'CONCLUSION_REACHED') this.soundEngine.playValidationChime();
            }

            // Trigger Cyber Floor Shockwave
            if (this.cyberFloor && (eventName === 'ANOMALY_DETECTED' || eventName === 'CONCLUSION_REACHED' || eventName === 'COUNTER_EVIDENCE_FOUND')) {
                this.cyberFloor.triggerShockwave(0, 0);
            }

            if (eventName === 'DATA_PROFILED') {
                if (this.brain) this.brain.activateRegion('DATA_PROCESSING');
                if (this.lighting) this.lighting.activateRegion('DATA_PROCESSING');
                if (this.cameraDirector) this.cameraDirector.setShot('WIDE_LAB');
            } else if (eventName === 'RELATIONSHIP_DISCOVERED') {
                if (this.brain) this.brain.activateRegion('PATTERN_DISCOVERY');
                if (this.lighting) this.lighting.activateRegion('PATTERN_DISCOVERY');
                if (this.agent1) this.agent1.setFocusTarget(payload && payload.x ? payload.x : 0, 15, 0);
                if (this.cameraDirector) this.cameraDirector.setShot('AGENT1_WORKSTATION');
            } else if (eventName === 'ANOMALY_DETECTED') {
                this.triggerAnomalyCinematic();
            } else if (eventName === 'HYPOTHESIS_CREATED') {
                this.triggerInterAgentCommunication();
            } else if (eventName === 'HYPOTHESIS_TESTED') {
                if (this.brain) this.brain.activateRegion('PREDICTION');
                if (this.lighting) this.lighting.activateRegion('PREDICTION');
                if (this.neuralNetwork) this.neuralNetwork.fireActivationBurst();
            } else if (eventName === 'COUNTER_EVIDENCE_FOUND') {
                if (this.agent2) this.agent2.setAlert(1.0);
                if (this.lighting) this.lighting.setAnomalyAlert(true);
                if (this.cameraDirector) this.cameraDirector.setShot('AGENT2_VALIDATION');
                setTimeout(() => { if (this.lighting) this.lighting.setAnomalyAlert(false); }, 2200);
            } else if (eventName === 'CONCLUSION_REACHED') {
                if (this.brain) this.brain.activateRegion('VALIDATION');
                if (this.lighting) this.lighting.activateRegion('VALIDATION');
                if (this.cameraDirector) this.cameraDirector.setShot('WIDE_LAB');
            }
        }

        triggerInterAgentCommunication() {
            if (!this.interAgentBeam) return;
            this.interAgentBeam.material.opacity = 0.9;
            if (this.agent1) this.agent1.setFocusTarget(210, 20, 30);
            if (this.agent2) this.agent2.setFocusTarget(-210, 20, 30);

            setTimeout(() => {
                if (this.interAgentBeam) {
                    this.interAgentBeam.material.opacity = 0.0;
                }
            }, 1800);
        }

        triggerAnomalyCinematic() {
            if (this.dataUniverse) this.dataUniverse.triggerAnomalyEvent();
            if (this.brain) this.brain.activateRegion('ANOMALY_DETECTION');
            if (this.lighting) {
                this.lighting.activateRegion('ANOMALY_DETECTION');
                this.lighting.setAnomalyAlert(true);
            }
            if (this.agent2) this.agent2.setAlert(1.0);
            if (this.particleEngine) this.particleEngine.setAnomalyAlert(true);

            if (this.cameraDirector) {
                this.cameraDirector.setShot('ANOMALY_INVESTIGATION');
                setTimeout(() => {
                    if (this.cameraDirector) this.cameraDirector.setShot('WIDE_LAB');
                    if (this.lighting) this.lighting.setAnomalyAlert(false);
                    if (this.particleEngine) this.particleEngine.setAnomalyAlert(false);
                }, 4500);
            }
        }

        triggerOpeningCinematic() {
            if (!this.cameraDirector) return;

            // 0.0s: Dark lab overview
            this.cameraDirector.setShot('WIDE_LAB', 0.02);

            // 1.5s: Push into Brain
            setTimeout(() => {
                if (this.cameraDirector) this.cameraDirector.setShot('BRAIN_FOCUS', 0.04);
                if (this.brain) this.brain.activateRegion('DATA_PROCESSING');
            }, 1500);

            // 3.0s: Sweep to Agent-01 Workstation
            setTimeout(() => {
                if (this.cameraDirector) this.cameraDirector.setShot('AGENT1_WORKSTATION', 0.045);
            }, 3000);

            // 4.5s: Sweep to Agent-02 Validation
            setTimeout(() => {
                if (this.cameraDirector) this.cameraDirector.setShot('AGENT2_VALIDATION', 0.045);
            }, 4500);

            // 6.0s: Stable Laboratory Wide View
            setTimeout(() => {
                if (this.cameraDirector) this.cameraDirector.setShot('WIDE_LAB', 0.035);
                if (this.brain) this.brain.activateRegion('VALIDATION');
            }, 6000);
        }

        _onResize() {
            if (!this.container || !this.renderer || !this.camera) return;
            const rect = this.container.getBoundingClientRect ? this.container.getBoundingClientRect() : { width: 800, height: 420 };
            const width = rect.width || 800;
            const height = rect.height || 420;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }

        _onVisibilityChange() {
            if (typeof document === 'undefined') return;
            this.isPaused = !!document.hidden;
        }

        _animate() {
            if (!this.isAlive) return;

            if (!this.isPaused && this.renderer && this.scene && this.camera) {
                const now = Date.now();
                const dt = Math.min(0.05, (now - this.lastTime) / 1000);
                this.lastTime = now;

                // Decay excitement
                if (this.excitement > 0.01) {
                    this.excitement *= 0.985;
                } else {
                    this.excitement = 0.0;
                }

                // 1. Update Camera
                if (this.cameraDirector) this.cameraDirector.update(dt, now);

                // 2. Update Brain
                if (this.brain) {
                    this.brain.update(dt, now);
                }

                // 3. Update Lighting
                if (this.lighting) {
                    const brainPulse = this.brain ? this.brain.pulse : 1.0;
                    this.lighting.update(dt, now, brainPulse, this.excitement);
                }

                // 4. Update Agents
                if (this.agent1) this.agent1.update(dt, now);
                if (this.agent2) this.agent2.update(dt, now);

                // 5. Update Neural Network
                if (this.neuralNetwork) this.neuralNetwork.update(dt, now);

                // 6. Update Data Universe
                if (this.dataUniverse) this.dataUniverse.update(dt, now);

                // 7. Update Particle Engine
                if (this.particleEngine) this.particleEngine.update(dt, now, this.excitement);

                // 8. Update Analytical Charts
                if (this.analyticalCharts) this.analyticalCharts.update(dt, now);

                // 9. Update Holographic UI
                if (this.holographicUI) this.holographicUI.update(dt, now);

                // 10. Damped Interactive Orbit Rotation
                this.orbitRotation.y += this.orbitVelocity.y;
                this.orbitRotation.x += this.orbitVelocity.x;
                this.orbitVelocity.x *= 0.92;
                this.orbitVelocity.y *= 0.92;
                this.scene.rotation.y = this.orbitRotation.y;
                this.scene.rotation.x = Math.max(-0.25, Math.min(0.25, this.orbitRotation.x));

                // 11. Update Interactive Cyber Floor Grid & Shockwaves
                if (this.cyberFloor) {
                    this.cyberFloor.update(dt, now);
                }

                // Render Three.js Scene
                this.renderer.render(this.scene, this.camera);
            }

            if (typeof requestAnimationFrame === 'function') {
                this.animId = requestAnimationFrame(() => this._animate());
            } else if (typeof setTimeout === 'function') {
                this.animId = setTimeout(() => this._animate(), 16);
            }
        }

        unmount() {
            this.isAlive = false;
            if (this.animId) {
                if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.animId);
                else if (typeof clearTimeout === 'function') clearTimeout(this.animId);
                this.animId = null;
            }

            if (this._motionUnsubscribe) {
                this._motionUnsubscribe();
                this._motionUnsubscribe = null;
            }

            if (this.soundEngine) {
                this.soundEngine.destroy();
                this.soundEngine = null;
            }
            if (this.cyberFloor) {
                this.cyberFloor.destroy();
                this.cyberFloor = null;
            }
            if (this.canvas && typeof this.canvas.removeEventListener === 'function') {
                this.canvas.removeEventListener('mousedown', this._onMouseDownHandler);
                this.canvas.removeEventListener('mousemove', this._onMouseMoveHandler);
                this.canvas.removeEventListener('mouseup', this._onMouseUpHandler);
                this.canvas.removeEventListener('mouseleave', this._onMouseUpHandler);
                this.canvas.removeEventListener('click', this._onClickHandler);
            }

            if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
                window.removeEventListener('resize', this._onResizeHandler);
            }
            if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
                document.removeEventListener('visibilitychange', this._onVisibilityHandler);
            }

            // Destroy all subsystems
            if (this.lighting) { this.lighting.destroy(); this.lighting = null; }
            if (this.cameraDirector) { this.cameraDirector.destroy(); this.cameraDirector = null; }
            if (this.brain) { this.brain.destroy(); this.brain = null; }
            if (this.agent1) { this.agent1.destroy(); this.agent1 = null; }
            if (this.agent2) { this.agent2.destroy(); this.agent2 = null; }
            if (this.neuralNetwork) { this.neuralNetwork.destroy(); this.neuralNetwork = null; }
            if (this.dataUniverse) { this.dataUniverse.destroy(); this.dataUniverse = null; }
            if (this.particleEngine) { this.particleEngine.destroy(); this.particleEngine = null; }
            if (this.analyticalCharts) { this.analyticalCharts.destroy(); this.analyticalCharts = null; }
            if (this.holographicUI) { this.holographicUI.destroy(); this.holographicUI = null; }

            if (this.renderer) {
                this.renderer.dispose();
                this.renderer = null;
            }

            if (this.canvas && this.canvas.parentElement) {
                this.canvas.parentElement.removeChild(this.canvas);
            }
            this.canvas = null;
            this.scene = null;
            this.camera = null;
            this.container = null;
        }
    }

    return SpatialScene;
}));
