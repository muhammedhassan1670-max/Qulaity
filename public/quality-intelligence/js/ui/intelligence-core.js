/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: ui/intelligence-core.js
 * ============================================================================
 * UDIP Living Intelligence Core:
 * High-performance 3D spatial computation visualizer.
 * Renders an interactive, living neural-data cosmos representing the full
 * enterprise intelligence lifecycle:
 *   DATA -> PROFILING -> ANALYTICS -> ML -> DECISION -> AUTONOMOUS LEARNING
 *
 * Implements:
 *   - 3D coordinate transformations with depth perspective projection
 *   - Directional particle stream physics along inter-stage neural pathways
 *   - Multi-stage pipeline topology linked to central computational nucleus
 *   - Real platform reactive state engine (IDLE, ANALYZING, MODEL_RUNNING,
 *     ANOMALY_DETECTED, COPILOT_ACTIVE, AUTONOMOUS_MONITORING, ERROR)
 *   - WebGL / Canvas2D with CSS-animated fallback and reduced-motion support
 * ============================================================================
 */

(function (window) {
    'use strict';

    window.UDIP = window.UDIP || {};

    class IntelligenceCoreVisualizer {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.animId = null;
            this.nodes = [];
            this.links = [];
            this.particles = [];
            this.pipelineStages = [];
            this.camera = {
                x: 0,
                y: -10,
                z: -420,
                rotX: 0.22,
                rotY: 0,
                rotZ: 0,
                targetRotX: 0.22,
                targetRotY: 0,
                zoom: 1
            };
            this.displayMode = 'hybrid'; // 'hybrid' | 'robot' | 'network'
            this.robotGeometry = this._initRobotGeometry();
            this.auraParticles = this._initAuraParticles(60);
            this.holoGlyphs = this._initHoloGlyphs();
            this.eyeTracking = { x: 0, y: 0, currentX: 0, currentY: 0 };
            this.robotImg = null;
            if (typeof Image !== 'undefined') {
                this.robotImg = new Image();
                this.robotImg.src = 'assets/udip_realistic_robot.jpg';
            }

            // High-End Three.js WebGL Subsystems
            this.webglRenderer = null;
            this.webglScene = null;
            this.webglCamera = null;
            this.webglCanvas = null;
            this.robot3DGroup = null;
            this.robotHeadGroup = null;
            this.robotTorsoGroup = null;
            this.robotPupils = [];
            this.robotLeds = [];
            this.robotLights = {};
            this.gyroRing1 = null;
            this.gyroRing2 = null;
            this.innerReactorRing = null;
            this.robotLaserBeam = null;
            this.robotMaterials = {};
            this.lightCones = [];

            this.mode = 'IDLE'; // 'IDLE' | 'ANALYZING' | 'MODEL_RUNNING' | 'ANOMALY_DETECTED' | 'COPILOT_ACTIVE' | 'AUTONOMOUS_MONITORING' | 'ERROR'
            this.modeTimer = 0;
            this.width = 0;
            this.height = 0;
            this.dpr = 1;
            this.isRunning = false;
            this.isLowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) || false;
            this.prefersReducedMotion = false;
            this.mouse = { x: 0, y: 0, isDown: false, lastX: 0, lastY: 0 };
            this.lastFrameTime = performance.now();

            this._checkReducedMotion();
            this._handleVisibility = this._handleVisibility.bind(this);
        }

        _checkReducedMotion() {
            if (typeof window !== 'undefined' && window.matchMedia) {
                const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
                this.prefersReducedMotion = mq.matches;
                mq.addEventListener('change', (e) => {
                    this.prefersReducedMotion = e.matches;
                });
            }
        }

        /**
         * Attach to a canvas element and initialize the living core
         * @param {HTMLCanvasElement} canvasElement
         * @param {Object} dataset
         * @param {string} type - 'pipeline' | 'knowledge'
         */
        mount(canvasElement, dataset = null, type = 'pipeline') {
            if (!canvasElement) return;
            this.destroy();

            this.canvas = canvasElement;
            this.ctx = this.canvas.getContext('2d', { alpha: true });
            if (!this.ctx) return;

            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this._resize();

            // Mount Top-Tier WebGL Three.js 3D Robot Scene if supported in browser environment
            if (typeof window !== 'undefined' && window.THREE && canvasElement && canvasElement.parentElement) {
                this._initWebGLRobot(canvasElement.parentElement);
            }

            if (type === 'knowledge' || canvasElement.id === 'udip-autonomous-core-canvas') {
                this.buildAutonomousKnowledgeGraph(dataset);
            } else {
                this.buildNetworkFromDataset(dataset);
            }
            this._bindEvents();

            this.isRunning = true;
            document.addEventListener('visibilitychange', this._handleVisibility);
            this._loop();
        }

        mountAutonomousCore(canvasElement, dataset = null) {
            return this.mount(canvasElement, dataset, 'knowledge');
        }

        _resize() {
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();
            const isFullViewport = (this.canvas.parentElement && this.canvas.parentElement.classList && this.canvas.parentElement.classList.contains('udip-cc-brain-stage')) ||
                                   (this.canvas.classList && this.canvas.classList.contains('udip-cc-brain-canvas'));
            this.width = Math.max(100, isFullViewport ? ((typeof window !== 'undefined' && window.innerWidth) || rect.width || 1920) : (rect.width || 800));
            this.height = Math.max(100, isFullViewport ? ((typeof window !== 'undefined' && window.innerHeight) || rect.height || 1080) : (rect.height || 420));
            this.canvas.width = this.width * this.dpr;
            this.canvas.height = this.height * this.dpr;
            if (this.ctx) {
                this.ctx.scale(this.dpr, this.dpr);
            }
            if (this.webglRenderer && this.webglCamera) {
                this.webglCamera.aspect = this.width / Math.max(1, this.height);
                this.webglCamera.updateProjectionMatrix();
                this.webglRenderer.setSize(this.width, this.height, false);
            }
        }

        _bindEvents() {
            if (typeof window !== 'undefined' && window.addEventListener) {
                window.addEventListener('resize', () => this._resize(), { passive: true });
            }

            if (typeof ResizeObserver !== 'undefined' && this.container) {
                try {
                    this._resizeObserver = new ResizeObserver(() => this._resize());
                    this._resizeObserver.observe(this.container);
                } catch (e) {}
            }

            if (!this.canvas) return;

            this.canvas.addEventListener('mousedown', (e) => {
                this.mouse.isDown = true;
                this.mouse.lastX = e.clientX;
                this.mouse.lastY = e.clientY;
            });

            if (typeof window !== 'undefined' && window.addEventListener) {
                window.addEventListener('mousemove', (e) => {
                    // Update interactive 3D robot eye tracking gaze coordinates
                    if (this.canvas) {
                        const rect = this.canvas.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const faceCenterY = rect.top + rect.height * 0.32;
                        const winW = window.innerWidth || document.documentElement.clientWidth || 1920;
                        const winH = window.innerHeight || document.documentElement.clientHeight || 1080;
                        this.eyeTracking.x = Math.max(-1.5, Math.min(1.5, (e.clientX - centerX) / (winW * 0.35)));
                        this.eyeTracking.y = Math.max(-1.5, Math.min(1.5, (e.clientY - faceCenterY) / (winH * 0.35)));
                    }

                    if (!this.mouse.isDown) return;
                    const dx = e.clientX - this.mouse.lastX;
                    const dy = e.clientY - this.mouse.lastY;
                    // Frontal viewport interactive motion only (strictly clamped, no 360 spin)
                    const maxFrontalAngleY = 0.35;
                    const maxFrontalAngleX = 0.25;
                    this.camera.targetRotY = Math.max(-maxFrontalAngleY, Math.min(maxFrontalAngleY, this.camera.targetRotY + dx * 0.003));
                    this.camera.targetRotX = Math.max(-maxFrontalAngleX, Math.min(maxFrontalAngleX, this.camera.targetRotX + dy * 0.003));
                    this.mouse.lastX = e.clientX;
                    this.mouse.lastY = e.clientY;
                });

                window.addEventListener('mouseup', () => {
                    this.mouse.isDown = false;
                });
            }
        }

        _handleVisibility() {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        }

        pause() {
            this.isRunning = false;
            if (this.animId) {
                cancelAnimationFrame(this.animId);
                this.animId = null;
            }
        }

        resume() {
            if (!this.isRunning && this.canvas) {
                this.isRunning = true;
                this.lastFrameTime = performance.now();
                this._loop();
            }
        }

        destroy() {
            this.pause();
            this._destroyWebGLRobot();
            document.removeEventListener('visibilitychange', this._handleVisibility);
            this.nodes = [];
            this.links = [];
            this.particles = [];
            this.pipelineStages = [];
            this.canvas = null;
            this.ctx = null;
        }

        /**
         * Construct 3D Autonomous Knowledge Environment:
         * Central AI Intelligence Core surrounded by 9 connected knowledge layers:
         * DATASETS, OBSERVATIONS, PATTERNS, MODELS, FINDINGS, EVIDENCE, DECISIONS, FEEDBACK, LEARNED KNOWLEDGE
         * Connected via the 9-stage continuous Learning Loop:
         * OBSERVE -> DETECT -> UNDERSTAND -> ANALYZE -> REASON -> DECIDE -> MONITOR -> LEARN -> RE-EVALUATE
         * Plus real emerging Knowledge Nodes (Evidence -> Validation -> Insight -> Knowledge Node)
         */
        buildAutonomousKnowledgeGraph(dataset) {
            this.nodes = [];
            this.links = [];
            this.particles = [];
            this.pipelineStages = [];

            // 1. Central AI Intelligence Core
            const centralCore = {
                id: 'ai_core_central',
                label: 'AI CORE',
                x: 0,
                y: 0,
                z: 0,
                baseRadius: 12,
                color: '#38bdf8',
                glow: '#0284c7',
                pulse: 1.2,
                role: 'nucleus'
            };
            this.nodes.push(centralCore);

            // 2. Surrounding 9 Knowledge Layers
            const knowledgeCategories = [
                { id: 'kn_datasets', label: 'DATASETS', role: 'category', color: '#38bdf8', glow: '#0284c7', baseRadius: 7.5, angle: 0 },
                { id: 'kn_observations', label: 'OBSERVATIONS', role: 'category', color: '#06b6d4', glow: '#0891b2', baseRadius: 7, angle: (Math.PI * 2) / 9 },
                { id: 'kn_patterns', label: 'PATTERNS', role: 'category', color: '#2dd4bf', glow: '#0d9488', baseRadius: 7, angle: (Math.PI * 4) / 9 },
                { id: 'kn_models', label: 'MODELS', role: 'category', color: '#a855f7', glow: '#9333ea', baseRadius: 8, angle: (Math.PI * 6) / 9 },
                { id: 'kn_findings', label: 'FINDINGS', role: 'category', color: '#60a5fa', glow: '#2563eb', baseRadius: 7.5, angle: (Math.PI * 8) / 9 },
                { id: 'kn_evidence', label: 'EVIDENCE', role: 'category', color: '#6366f1', glow: '#4f46e5', baseRadius: 8, angle: (Math.PI * 10) / 9 },
                { id: 'kn_decisions', label: 'DECISIONS', role: 'category', color: '#10b981', glow: '#059669', baseRadius: 8, angle: (Math.PI * 12) / 9 },
                { id: 'kn_feedback', label: 'FEEDBACK', role: 'category', color: '#f59e0b', glow: '#d97706', baseRadius: 7, angle: (Math.PI * 14) / 9 },
                { id: 'kn_learned', label: 'LEARNED KNOWLEDGE', role: 'category', color: '#c084fc', glow: '#9333ea', baseRadius: 8.5, angle: (Math.PI * 16) / 9 }
            ];

            const categoryRadius = 210;
            const categoryNodes = [];

            knowledgeCategories.forEach((cat) => {
                const x = Math.cos(cat.angle) * categoryRadius;
                const y = 70 + Math.sin(cat.angle * 2) * 16;
                const z = Math.sin(cat.angle) * categoryRadius;

                const node = {
                    id: cat.id,
                    label: cat.label,
                    x,
                    y,
                    z,
                    baseRadius: cat.baseRadius,
                    color: cat.color,
                    glow: cat.glow,
                    pulse: 1,
                    role: 'category',
                    categoryKey: cat.id
                };
                this.nodes.push(node);
                categoryNodes.push(node);

                // Spoke from Central Core to Knowledge Layer Node
                this.links.push({
                    from: centralCore,
                    to: node,
                    color: 'rgba(56, 189, 248, 0.2)',
                    activity: 0.5,
                    isSpoke: true
                });
            });

            // 3. Continuous 9-Stage Learning Loop Neural Ring
            // OBSERVE -> DETECT -> UNDERSTAND -> ANALYZE -> REASON -> DECIDE -> MONITOR -> LEARN -> RE-EVALUATE
            for (let i = 0; i < categoryNodes.length; i++) {
                const nextIdx = (i + 1) % categoryNodes.length;
                this.links.push({
                    from: categoryNodes[i],
                    to: categoryNodes[nextIdx],
                    color: 'rgba(99, 102, 241, 0.42)',
                    activity: 0.95,
                    isPipeline: true
                });
            }

            // 4. Grounded Knowledge Formation Nodes (Evidence -> Validation -> Insight -> Knowledge Node)
            const ai = dataset && dataset.autonomousIntelligence;
            const activeInsightsCount = (ai && ai.learning && ai.learning.activeInsights) || 4;
            const maxKn = Math.min(activeInsightsCount, 5);

            for (let i = 0; i < maxKn; i++) {
                const angle = (i / maxKn) * Math.PI * 2 + 0.5;
                const r = 85;
                const x = Math.cos(angle) * r;
                const y = (i % 2 === 0 ? 35 : -35);
                const z = Math.sin(angle) * r;

                const knNode = {
                    id: `formed_knowledge_${i}`,
                    label: `KNOWLEDGE_0${i + 1}`,
                    x,
                    y,
                    z,
                    baseRadius: 5.5,
                    color: '#c084fc',
                    glow: '#a855f7',
                    pulse: 1.1,
                    role: 'knowledge_formed'
                };
                this.nodes.push(knNode);

                // Link from Evidence node to formed Knowledge node (Validation step)
                this.links.push({
                    from: categoryNodes[5], // EVIDENCE
                    to: knNode,
                    color: 'rgba(168, 85, 247, 0.35)',
                    activity: 0.8
                });

                // Link from Knowledge node to Learned Knowledge category
                this.links.push({
                    from: knNode,
                    to: categoryNodes[8], // LEARNED KNOWLEDGE
                    color: 'rgba(192, 132, 252, 0.45)',
                    activity: 0.9
                });
            }

            // 5. Spawn ambient continuous learning data particles along links
            const particleCount = this.isLowPower ? 26 : 70;
            for (let i = 0; i < particleCount; i++) {
                if (this.links.length > 0) {
                    const link = this.links[Math.floor(Math.random() * this.links.length)];
                    this.particles.push({
                        link,
                        progress: Math.random(),
                        speed: link.isPipeline ? (0.005 + Math.random() * 0.006) : (0.003 + Math.random() * 0.005),
                        size: link.isPipeline ? (2.2 + Math.random() * 1.5) : (1.6 + Math.random() * 1.4),
                        color: link.to.color || '#c084fc'
                    });
                }
            }
        }

        /**
         * Construct 3D node topology:
         * Central Nucleus Hub surrounded by:
         * DATA -> PROFILING -> ANALYTICS -> ML -> DECISION -> AUTONOMOUS LEARNING
         */
        buildNetworkFromDataset(dataset) {
            this.nodes = [];
            this.links = [];
            this.particles = [];
            this.pipelineStages = [];

            // 1. Central Core Nucleus Hub
            const coreHub = {
                id: 'core_nucleus',
                label: 'UDIP HUB',
                x: 0,
                y: 0,
                z: 0,
                baseRadius: 11,
                color: '#38bdf8',
                glow: '#0284c7',
                pulse: 1,
                role: 'nucleus'
            };
            this.nodes.push(coreHub);

            // 2. Canonical 6 Spatial Pipeline Stages (Connected in Ring Loop)
            const stageConfigs = [
                { id: 'stage_data', label: 'DATA', color: '#38bdf8', glow: '#0284c7', baseRadius: 8, angle: 0 },
                { id: 'stage_profiling', label: 'PROFILING', color: '#06b6d4', glow: '#0891b2', baseRadius: 7.5, angle: (Math.PI * 2) / 6 },
                { id: 'stage_analytics', label: 'ANALYTICS', color: '#6366f1', glow: '#4f46e5', baseRadius: 7.5, angle: (Math.PI * 4) / 6 },
                { id: 'stage_ml', label: 'ML ENGINE', color: '#a855f7', glow: '#9333ea', baseRadius: 8.5, angle: Math.PI },
                { id: 'stage_decision', label: 'DECISION GOV', color: '#10b981', glow: '#059669', baseRadius: 8, angle: (Math.PI * 8) / 6 },
                { id: 'stage_autonomous', label: 'AUTONOMOUS', color: '#f59e0b', glow: '#d97706', baseRadius: 8, angle: (Math.PI * 10) / 6 }
            ];

            const pipelineRadius = 215;
            const stageNodes = [];

            stageConfigs.forEach((cfg) => {
                const x = Math.cos(cfg.angle) * pipelineRadius;
                const y = 75 + Math.sin(cfg.angle * 2) * 16;
                const z = Math.sin(cfg.angle) * pipelineRadius;

                const node = {
                    id: cfg.id,
                    label: cfg.label,
                    x,
                    y,
                    z,
                    baseRadius: cfg.baseRadius,
                    color: cfg.color,
                    glow: cfg.glow,
                    pulse: 1,
                    role: 'stage',
                    stageKey: cfg.id
                };
                this.nodes.push(node);
                stageNodes.push(node);
                this.pipelineStages.push(node);

                // Central Hub to Stage Link
                this.links.push({
                    from: coreHub,
                    to: node,
                    color: 'rgba(56, 189, 248, 0.22)',
                    activity: 0.6,
                    isSpoke: true
                });
            });

            // 3. Sequential Inter-Stage Neural Connections (Flow Loop)
            // DATA -> PROFILING -> ANALYTICS -> ML -> DECISION -> AUTONOMOUS -> DATA
            for (let i = 0; i < stageNodes.length; i++) {
                const nextIdx = (i + 1) % stageNodes.length;
                this.links.push({
                    from: stageNodes[i],
                    to: stageNodes[nextIdx],
                    color: 'rgba(99, 102, 241, 0.38)',
                    activity: 0.9,
                    isPipeline: true
                });
            }

            // 4. Grounded Dataset Column Telemetry Nodes (if dataset present)
            if (dataset && dataset.profile && Array.isArray(dataset.profile.columns)) {
                const cols = dataset.profile.columns.slice(0, 14);
                const colRadius = 100;
                cols.forEach((col, idx) => {
                    const angle = (idx / cols.length) * Math.PI * 2 + 0.3;
                    const x = Math.cos(angle) * colRadius;
                    const y = (idx % 2 === 0 ? 32 : -32);
                    const z = Math.sin(angle) * colRadius;

                    let color = '#38bdf8';
                    let glow = '#0284c7';
                    if (col.type === 'categorical') { color = '#c084fc'; glow = '#9333ea'; }
                    else if (col.type === 'date' || col.type === 'datetime') { color = '#fbbf24'; glow = '#d97706'; }
                    else if (col.type === 'boolean') { color = '#34d399'; glow = '#059669'; }

                    const colNode = {
                        id: `col_${col.name}`,
                        label: col.name.length > 11 ? col.name.slice(0, 9) + '..' : col.name,
                        x,
                        y,
                        z,
                        baseRadius: 4,
                        color,
                        glow,
                        pulse: 0.8,
                        role: 'column'
                    };
                    this.nodes.push(colNode);

                    // Connect column to DATA stage and PROFILING stage
                    this.links.push({
                        from: stageNodes[0], // DATA
                        to: colNode,
                        color: 'rgba(56, 189, 248, 0.16)',
                        activity: 0.4
                    });
                });
            }

            // 5. Spawn directional data packet particles along links
            const particleCount = this.isLowPower ? 24 : 65;
            for (let i = 0; i < particleCount; i++) {
                if (this.links.length > 0) {
                    const link = this.links[Math.floor(Math.random() * this.links.length)];
                    this.particles.push({
                        link,
                        progress: Math.random(),
                        speed: link.isPipeline ? (0.005 + Math.random() * 0.006) : (0.003 + Math.random() * 0.004),
                        size: link.isPipeline ? (2.2 + Math.random() * 1.5) : (1.5 + Math.random() * 1.5),
                        color: link.to.color || '#38bdf8'
                    });
                }
            }
        }

        /**
         * Set operational visual state based on real platform state
         * @param {string} state - 'IDLE' | 'ANALYZING' | 'MODEL_RUNNING' | 'ANOMALY_DETECTED' | 'COPILOT_ACTIVE' | 'AUTONOMOUS_MONITORING' | 'ERROR'
         * @param {number} durationMs - optional auto-reset timeout
         */
        setMode(state, durationMs = 0) {
            const normalized = String(state || 'IDLE').toUpperCase();
            this.mode = normalized;
            this.modeTimer = durationMs > 0 ? performance.now() + durationMs : 0;
        }

        setEngineState(stateName, durationMs = 0) {
            this.setMode(stateName, durationMs);
        }

        setDisplayMode(mode) {
            const valid = ['hybrid', 'robot', 'network'];
            if (valid.includes(mode)) {
                this.displayMode = mode;
                if (this.webglCanvas) {
                    if (mode === 'network') {
                        this.webglCanvas.style.opacity = '0';
                    } else {
                        this.webglCanvas.style.opacity = '1';
                    }
                }
            }
        }

        _initRobotGeometry() {
            // High-precision Cybernetic Android 3D Geometry
            // Coordinates in local model space centered around cranial core (0, -20, 0)
            const vertices = [
                // Cranium & Crown Apex (0-7)
                { x: 0, y: -110, z: 15 },    // 0: Crown Apex
                { x: -40, y: -98, z: 12 },   // 1: Cranium Left Top
                { x: 40, y: -98, z: 12 },    // 2: Cranium Right Top
                { x: -48, y: -72, z: 28 },   // 3: Cranium Left Mid
                { x: 48, y: -72, z: 28 },    // 4: Cranium Right Mid
                { x: 0, y: -78, z: 52 },     // 5: Forehead Top Center
                { x: -30, y: -62, z: 56 },   // 6: Forehead Left
                { x: 30, y: -62, z: 56 },    // 7: Forehead Right

                // Visor & Ocular Band (8-13)
                { x: -38, y: -45, z: 62 },   // 8: Visor Top Left
                { x: 38, y: -45, z: 62 },    // 9: Visor Top Right
                { x: 0, y: -43, z: 68 },     // 10: Visor Top Center
                { x: -36, y: -28, z: 63 },   // 11: Visor Bottom Left
                { x: 36, y: -28, z: 63 },    // 12: Visor Bottom Right
                { x: 0, y: -26, z: 69 },     // 13: Visor Bottom Center

                // Temporal Plates & Cheeks (14-17)
                { x: -52, y: -38, z: 24 },   // 14: Temporal Left
                { x: 52, y: -38, z: 24 },    // 15: Temporal Right
                { x: -42, y: -10, z: 46 },   // 16: Cheekbone Left
                { x: 42, y: -10, z: 46 },    // 17: Cheekbone Right

                // Nose / Optical Sensor Core (18)
                { x: 0, y: -14, z: 66 },     // 18: Nose / Sensor Core

                // Mouth, Mandible & Jaw (19-26)
                { x: -24, y: 10, z: 54 },    // 19: Mouth Left
                { x: 24, y: 10, z: 54 },     // 20: Mouth Right
                { x: 0, y: 14, z: 57 },      // 21: Mouth Center
                { x: -36, y: 14, z: 32 },    // 22: Jaw Corner Left
                { x: 36, y: 14, z: 32 },     // 23: Jaw Corner Right
                { x: -16, y: 40, z: 46 },    // 24: Chin Plate Left
                { x: 16, y: 40, z: 46 },     // 25: Chin Plate Right
                { x: 0, y: 44, z: 50 },      // 26: Chin Apex Tip

                // Skull Back & Occipital Base (27-30)
                { x: 0, y: -95, z: -40 },    // 27: Skull Back Top
                { x: -42, y: -58, z: -36 },  // 28: Occipital Left
                { x: 42, y: -58, z: -36 },   // 29: Occipital Right
                { x: 0, y: -16, z: -44 },    // 30: Skull Base Center

                // Cervical Spine & Neck Chassis (31-36)
                { x: -16, y: 64, z: 12 },    // 31: Neck Left
                { x: 16, y: 64, z: 12 },     // 32: Neck Right
                { x: 0, y: 70, z: 24 },      // 33: Throat Hydraulic Joint
                { x: -56, y: 96, z: 2 },     // 34: Shoulder Plate Left
                { x: 56, y: 96, z: 2 },      // 35: Shoulder Plate Right
                { x: 0, y: 94, z: 36 }       // 36: Sternum Core Nexus
            ];

            const faces = [
                // Cranium Crown Plates (Titanium Armor)
                { indices: [0, 1, 3], type: 'armor' },
                { indices: [0, 3, 5], type: 'armor' },
                { indices: [0, 5, 4], type: 'armor' },
                { indices: [0, 4, 2], type: 'armor' },
                { indices: [1, 27, 28], type: 'chassis' },
                { indices: [2, 29, 27], type: 'chassis' },
                { indices: [0, 27, 1], type: 'chassis' },
                { indices: [0, 2, 27], type: 'chassis' },

                // Forehead Plate with Gold / Cyan Accents
                { indices: [3, 6, 5], type: 'accent' },
                { indices: [5, 7, 4], type: 'accent' },
                { indices: [3, 14, 6], type: 'armor' },
                { indices: [4, 7, 15], type: 'armor' },

                // Visor - Holographic Ocular Lens Glass
                { indices: [6, 8, 10, 5], type: 'visor' },
                { indices: [5, 10, 9, 7], type: 'visor' },
                { indices: [8, 11, 13, 10], type: 'visor' },
                { indices: [10, 13, 12, 9], type: 'visor' },

                // Mid Cheek & Sensor Core
                { indices: [11, 16, 18, 13], type: 'armor' },
                { indices: [13, 18, 17, 12], type: 'armor' },
                { indices: [14, 22, 16], type: 'chassis' },
                { indices: [15, 17, 23], type: 'chassis' },

                // Sub-nasal and Mandible Jaw (Dubai Luxury Gold Inlays)
                { indices: [18, 16, 19, 21], type: 'gold' },
                { indices: [18, 21, 20, 17], type: 'gold' },
                { indices: [19, 22, 24, 21], type: 'armor' },
                { indices: [20, 21, 25, 23], type: 'armor' },
                { indices: [21, 24, 26, 25], type: 'accent' },

                // Cervical Collar & Hydraulic Sternum
                { indices: [24, 31, 33, 26], type: 'chassis' },
                { indices: [25, 26, 33, 32], type: 'chassis' },
                { indices: [31, 34, 36, 33], type: 'gold' },
                { indices: [32, 33, 36, 35], type: 'gold' },
                { indices: [22, 28, 31], type: 'chassis' },
                { indices: [23, 32, 29], type: 'chassis' }
            ];

            return { vertices, faces };
        }

        _initAuraParticles(count = 60) {
            const particles = [];
            for (let i = 0; i < count; i++) {
                const radius = 70 + Math.random() * 110;
                const theta = Math.random() * Math.PI * 2;
                const phi = (Math.random() - 0.5) * Math.PI * 0.9;
                const speed = (0.0006 + Math.random() * 0.0014) * (Math.random() > 0.5 ? 1 : -1);
                const size = 1.0 + Math.random() * 2.4;
                const colorType = Math.random() > 0.45 ? 'cyan' : (Math.random() > 0.5 ? 'gold' : 'white');
                particles.push({ radius, theta, phi, speed, size, colorType, seed: Math.random() * 100 });
            }
            return particles;
        }

        _initHoloGlyphs() {
            const glyphChars = ['0x7E', 'λ', '∇', 'Σ', 'Ψ', '0x1F', 'd/dx', '∫', 'κ', 'Ω', 'μ', 'φ'];
            const glyphs = [];
            for (let i = 0; i < glyphChars.length; i++) {
                const theta = (i / glyphChars.length) * Math.PI * 2;
                const dist = 135 + (i % 3) * 22;
                const height = -85 + (i % 4) * 38;
                glyphs.push({
                    char: glyphChars[i],
                    angle: theta,
                    dist: dist,
                    y: height,
                    rotSpeed: (0.0004 + (i % 3) * 0.0003) * (i % 2 === 0 ? 1 : -1),
                    color: (i % 3 === 0) ? '#d4af37' : ((i % 3 === 1) ? '#38bdf8' : '#34d399'),
                    scale: 0.85 + (i % 3) * 0.15
                });
            }
            return glyphs;
        }

        // =====================================================================
        // THREE.JS HIGH-END 3D WEBGL CYBERNETIC ROBOT ANDROID SUBSYSTEM
        // =====================================================================
        _initWebGLRobot(container) {
            const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE) || null;
            if (!THREE || !container) return false;

            this._destroyWebGLRobot();

            try {
                // Verify WebGL support in current environment
                const testCanvas = document.createElement('canvas');
                const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
                if (!gl) return false;

                this.webglCanvas = document.createElement('canvas');
                this.webglCanvas.className = 'udip-robot-webgl-canvas';
                this.webglCanvas.style.position = 'absolute';
                this.webglCanvas.style.inset = '0';
                this.webglCanvas.style.width = '100%';
                this.webglCanvas.style.height = '100%';
                this.webglCanvas.style.zIndex = '0';
                this.webglCanvas.style.pointerEvents = 'none';
                this.webglCanvas.style.transition = 'opacity 0.4s ease';

                const isFullViewport = (container.classList && container.classList.contains('udip-cc-brain-stage')) ||
                                       (this.canvas && this.canvas.classList && this.canvas.classList.contains('udip-cc-brain-canvas'));

                if (!isFullViewport && container.style.position !== 'relative' && container.style.position !== 'absolute' && container.style.position !== 'fixed') {
                    container.style.position = 'relative';
                }

                if (this.canvas && this.canvas.parentElement === container) {
                    container.insertBefore(this.webglCanvas, this.canvas);
                    this.canvas.style.position = isFullViewport ? 'absolute' : 'relative';
                    this.canvas.style.inset = '0';
                    this.canvas.style.width = '100%';
                    this.canvas.style.height = '100%';
                    this.canvas.style.zIndex = '1';
                } else {
                    container.appendChild(this.webglCanvas);
                }

                const rect = container.getBoundingClientRect ? container.getBoundingClientRect() : { width: 800, height: 420 };
                const w = Math.max(100, isFullViewport ? ((typeof window !== 'undefined' && window.innerWidth) || rect.width || 1920) : (rect.width || this.width || 800));
                const h = Math.max(100, isFullViewport ? ((typeof window !== 'undefined' && window.innerHeight) || rect.height || 1080) : (rect.height || this.height || 420));

                // 1. WebGL Renderer with High-Performance Tone Mapping
                this.webglRenderer = new THREE.WebGLRenderer({
                    canvas: this.webglCanvas,
                    alpha: true,
                    antialias: true,
                    powerPreference: 'high-performance'
                });
                if (THREE.ACESFilmicToneMapping) {
                    this.webglRenderer.toneMapping = THREE.ACESFilmicToneMapping;
                    this.webglRenderer.toneMappingExposure = 1.35;
                }
                this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                this.webglRenderer.setSize(w, h, false);
                this.webglRenderer.setClearColor(0x000000, 0);

                // 2. Camera & Scene
                this.webglScene = new THREE.Scene();
                this.webglCamera = new THREE.PerspectiveCamera(46, w / h, 1, 2000);
                this.webglCamera.position.set(0, 15, 120);
                this.webglCamera.lookAt(0, 13.5, 0);

                // 3. Cinematic Alien Gladiator Studio Lighting Rig (Vibrant, high-contrast, specular highlights)
                const ambient = new THREE.AmbientLight(0x1e293b, 3.2);
                this.webglScene.add(ambient);

                const keyLight = new THREE.DirectionalLight(0xffffff, 4.6);
                keyLight.position.set(45, 65, 75);
                this.webglScene.add(keyLight);

                const rimLight = new THREE.DirectionalLight(0xf59e0b, 5.2);
                rimLight.position.set(-55, 45, -40);
                this.webglScene.add(rimLight);

                const fillLight = new THREE.DirectionalLight(0x06b6d4, 3.4);
                fillLight.position.set(-40, 20, 55);
                this.webglScene.add(fillLight);

                const faceLight = new THREE.DirectionalLight(0x34d399, 2.8);
                faceLight.position.set(0, 16, 75);
                this.webglScene.add(faceLight);

                const reactorLight = new THREE.PointLight(0x10b981, 5.0, 140);
                reactorLight.position.set(0, 4.2, 18);
                this.webglScene.add(reactorLight);

                const chromaMagentaLight = new THREE.PointLight(0xf43f5e, 4.5, 110);
                chromaMagentaLight.position.set(-45, 18, 30);
                this.webglScene.add(chromaMagentaLight);

                const chromaCyanLight = new THREE.PointLight(0x00f0ff, 4.5, 110);
                chromaCyanLight.position.set(45, 18, 30);
                this.webglScene.add(chromaCyanLight);

                const chromaGoldLight = new THREE.PointLight(0xfbbf24, 4.0, 100);
                chromaGoldLight.position.set(0, 45, -25);
                this.webglScene.add(chromaGoldLight);

                this.robotLights = {
                    ambient, key: keyLight, rim: rimLight, fill: fillLight, face: faceLight, reactor: reactorLight,
                    magenta: chromaMagentaLight, cyan: chromaCyanLight, gold: chromaGoldLight
                };

                // 4. Build Procedural High-Definition Three.js Robot Assembly
                this._buildThreeJSRobot(THREE);

                return true;
            } catch (err) {
                console.warn('[UDIP:IntelligenceCore] WebGL Robot setup fallback:', err);
                this._destroyWebGLRobot();
                return false;
            }
        }

        _buildThreeJSRobot(THREE) {
            this.robot3DGroup = new THREE.Group();
            this.robot3DGroup.position.set(0, -3, 0);

            // =================================================================
            // 1. HYPER-CHROMATIC SCI-FI QUANTUM & SPECTRAL OPTICAL MATERIALS
            // =================================================================
            const isPhysical = typeof THREE.MeshPhysicalMaterial === 'function';

            // High-refraction hyper-dimensional iridescent quantum crystal
            const coreCrystalMat = isPhysical ? new THREE.MeshPhysicalMaterial({
                color: 0x0284c7,
                emissive: 0x0369a1,
                emissiveIntensity: 0.90,
                metalness: 0.12,
                roughness: 0.05,
                transmission: 0.84,
                transparent: true,
                opacity: 0.92
            }) : new THREE.MeshStandardMaterial({
                color: 0x0284c7,
                emissive: 0x0369a1,
                emissiveIntensity: 0.95,
                metalness: 0.35,
                roughness: 0.10,
                transparent: true,
                opacity: 0.88
            });

            // Chromatic Wireframe Matrix Shells
            const wireEmeraldMat = new THREE.MeshBasicMaterial({
                color: 0x10b981,
                wireframe: true,
                transparent: true,
                opacity: 0.85,
                blending: THREE.AdditiveBlending
            });

            const wireMagentaMat = new THREE.MeshBasicMaterial({
                color: 0xec4899,
                wireframe: true,
                transparent: true,
                opacity: 0.80,
                blending: THREE.AdditiveBlending
            });

            const wireGoldMat = new THREE.MeshBasicMaterial({
                color: 0xfbbf24,
                wireframe: true,
                transparent: true,
                opacity: 0.85,
                blending: THREE.AdditiveBlending
            });

            const wireCyanMat = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                wireframe: true,
                transparent: true,
                opacity: 0.85,
                blending: THREE.AdditiveBlending
            });

            const wireVioletMat = new THREE.MeshBasicMaterial({
                color: 0x8b5cf6,
                wireframe: true,
                transparent: true,
                opacity: 0.75,
                blending: THREE.AdditiveBlending
            });

            // Central Pulsar Singularity (Event Horizon) - Live HSL shifting
            const nucleusMat = new THREE.MeshStandardMaterial({
                color: 0x080e1a,
                emissive: 0x00f0ff,
                emissiveIntensity: 4.8,
                metalness: 0.96,
                roughness: 0.04
            });

            // Multi-Layer Coronas (Inner Fuchsia-Magenta / Outer Cyan-Azure)
            const coronaMagentaMat = new THREE.MeshBasicMaterial({
                color: 0xf43f5e,
                transparent: true,
                opacity: 0.52,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide
            });

            const coronaCyanMat = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.42,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide
            });

            // Aerospace 24K Cybernetic Gold Framing
            const goldFrameMat = new THREE.MeshStandardMaterial({
                color: 0xf59e0b,
                emissive: 0x92400e,
                emissiveIntensity: 0.35,
                metalness: 0.98,
                roughness: 0.12
            });

            // Carbon-Titanium Heavy Structural Exoskeleton
            const titaniumMat = new THREE.MeshStandardMaterial({
                color: 0x1e293b,
                emissive: 0x0f172a,
                emissiveIntensity: 0.20,
                metalness: 0.92,
                roughness: 0.22
            });

            // Multi-Tone Glowing Plasma Materials
            const glowCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.95 });
            const glowMagentaMat = new THREE.MeshBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.95 });
            const glowEmeraldMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.95 });
            const glowGoldMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.95 });
            const glowAzureMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.95 });

            // Dual-Color Aurora Holographic Ingestion Tractor Beam
            const beamCyanMat = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.32,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            });

            const beamVioletMat = new THREE.MeshBasicMaterial({
                color: 0xa855f7,
                transparent: true,
                opacity: 0.20,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            });

            // High-Energy Laser Beams
            const laserLineMat = new THREE.MeshBasicMaterial({
                color: 0xff007f,
                transparent: true,
                opacity: 0.94,
                blending: THREE.AdditiveBlending
            });

            // Multi-Tone Holographic 3D HUD Reticle Lines
            const hudCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
            const hudGoldMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.70, side: THREE.DoubleSide });
            const hudMagentaMat = new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
            const hudLimeMat = new THREE.MeshBasicMaterial({ color: 0x84cc16, transparent: true, opacity: 0.90 });

            this.robotMaterials = {
                crystal: coreCrystalMat,
                lattice: wireEmeraldMat,
                hypercube: wireMagentaMat,
                wireGold: wireGoldMat,
                wireCyan: wireCyanMat,
                wireViolet: wireVioletMat,
                nucleus: nucleusMat,
                corona: coronaMagentaMat,
                corona2: coronaCyanMat,
                visor: nucleusMat,
                reactor: nucleusMat,
                gold: goldFrameMat,
                titanium: titaniumMat,
                dataBlock: goldFrameMat,
                glow: glowCyanMat,
                glowMagenta: glowMagentaMat,
                glowEmerald: glowEmeraldMat,
                glowGold: glowGoldMat,
                glowAzure: glowAzureMat,
                beam: beamCyanMat,
                beamViolet: beamVioletMat,
                laser: laserLineMat,
                hud: hudCyanMat
            };

            // =================================================================
            // 2. SUBTLE PANORAMIC BACKGROUND CONSTELLATION & CYBERNETIC WEB
            // High-aesthetic, lightweight neural topology spanning deep 3D background space.
            // All heavy foreground obstructions (heart, thick conduits, dark rings)
            // are cleared to give a pure, luminous, uncluttered command center experience.
            // =================================================================
            this.robotTorsoGroup = null;
            this.cyberHeartGroup = null;
            this.robotHeadGroup = null;
            this.innerHeartCore = null;
            this.outerHeartCrystal = null;
            this.wireHeartLattice = null;
            this.sinoatrialNode = null;
            this.sinoatrialHalo = null;
            this.aorticTrunks = [];
            this.shockwaveRings = [];
            this.branchConduits = [];
            this.branchNodes = [];
            this.branchParticleData = [];
            this.branchParticlesMesh = null;
            this.streamPoints = null;
            this.streamParticleData = [];
            this.dataBlocks = [];
            this.robotLeds = [];
            this.lightCones = [];
            this.floorRing1 = null;

            this.branchNetworkGroup = new THREE.Group();
            this.branchNetworkGroup.position.set(0, 0, 0);

            // Accurate Frustum Calibration for Full-Screen Edge-to-Edge Boundaries
            const aspect = (this.width && this.height) ? (this.width / Math.max(1, this.height)) : (16 / 9);
            const H_edge = 60.0;
            const W_edge = H_edge * Math.max(1.75, aspect);

            // 1. Procedural High-Definition Soft Circular Glow Texture
            // Eliminates all square pixel / billboard confetti artifacts!
            let glowTexture = null;
            if (typeof document !== 'undefined') {
                const glowCanvas = document.createElement('canvas');
                glowCanvas.width = 64;
                glowCanvas.height = 64;
                const gCtx = glowCanvas.getContext('2d');
                if (gCtx) {
                    const grad = gCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
                    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
                    grad.addColorStop(0.18, 'rgba(255, 255, 255, 0.92)');
                    grad.addColorStop(0.42, 'rgba(56, 189, 248, 0.65)');
                    grad.addColorStop(0.72, 'rgba(56, 189, 248, 0.20)');
                    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
                    gCtx.fillStyle = grad;
                    gCtx.fillRect(0, 0, 64, 64);
                    glowTexture = new THREE.CanvasTexture(glowCanvas);
                }
            }

            // 2. High-Density Quantum Laser Matrix with Spatial Separation (توزيع متفرق ومتباعد بنفس الكثافة)
            // 520 3D Organic nodes with minimum distance separation (no clustering) and 3,500+ distinctly spaced laser lines
            const constPoints = [];
            const pointColors = [];
            const webLinePositions = [];
            const webEdges = [];
            const edgeKeySet = new Set();
            
            const addEdge = (idxA, idxB) => {
                if (idxA === idxB || idxA < 0 || idxB < 0 || idxA >= constPoints.length || idxB >= constPoints.length) return;
                const edgeKey = idxA < idxB ? `${idxA}_${idxB}` : `${idxB}_${idxA}`;
                if (!edgeKeySet.has(edgeKey)) {
                    edgeKeySet.add(edgeKey);
                    const pA = constPoints[idxA];
                    const pB = constPoints[idxB];
                    webLinePositions.push(pA.x, pA.y, pA.z, pB.x, pB.y, pB.z);
                    webEdges.push({ a: idxA, b: idxB });
                }
            };

            const starPalette = [
                new THREE.Color(0x00f0ff), // Electric Cyan Laser
                new THREE.Color(0x38bdf8), // Sky Blue Data Node
                new THREE.Color(0xa855f7), // Quantum Violet Singularity
                new THREE.Color(0x34d399), // Emerald Matrix Node
                new THREE.Color(0xfbbf24), // Cyber Gold Telemetry Node
                new THREE.Color(0x60a5fa), // Azure Blue
                new THREE.Color(0xffffff)  // Radiant White Star
            ];

            // Deterministic pseudo-random generator
            let seed = 4096;
            const pseudoRandom = () => {
                seed = (seed * 9301 + 49297) % 233280;
                return seed / 233280;
            };

            const tryAddNode = (candidateVec, minDist = 11.5, colorIdx = 0) => {
                for (let i = 0; i < constPoints.length; i++) {
                    if (constPoints[i].distanceTo(candidateVec) < minDist) {
                        return -1; // Too close to existing node, reject to prevent bunching
                    }
                }
                const idx = constPoints.length;
                constPoints.push(candidateVec);
                const c = starPalette[colorIdx % starPalette.length];
                pointColors.push(c.r, c.g, c.b);
                return idx;
            };

            const targetTotalNodes = 520;
            const W_span = W_edge * 1.75;
            const H_span = H_edge * 1.55;

            // Region 1: Central Portal Framing Ring (Nodes frame around the center console, $r \in [36, 68]$)
            let attempts = 0;
            while (constPoints.length < 80 && attempts < 1500) {
                attempts++;
                const r = 36.0 + pseudoRandom() * 32.0;
                const theta = pseudoRandom() * Math.PI * 2;
                const x = Math.cos(theta) * r + (pseudoRandom() - 0.5) * 8;
                const y = Math.sin(theta) * (r * 0.78) + (pseudoRandom() - 0.5) * 8;
                const z = -34.0 + (pseudoRandom() - 0.5) * 16.0;
                tryAddNode(new THREE.Vector3(x, y, z), 11.0, constPoints.length % 5);
            }

            // Region 2: Mid-Field Orbital Constellation (Target: 200 spaced nodes)
            attempts = 0;
            while (constPoints.length < 200 && attempts < 2500) {
                attempts++;
                const r = 58.0 + pseudoRandom() * 50.0;
                const theta = pseudoRandom() * Math.PI * 2;
                const x = Math.cos(theta) * r + (pseudoRandom() - 0.5) * 16;
                const y = Math.sin(theta) * (r * 0.80) + (pseudoRandom() - 0.5) * 14;
                const z = -36.0 + (pseudoRandom() - 0.5) * 24.0;
                tryAddNode(new THREE.Vector3(x, y, z), 11.5, (constPoints.length + 1) % 6);
            }

            // Region 3: Left & Right Panoramic Wings (Target: 370 spaced nodes)
            attempts = 0;
            while (constPoints.length < 370 && attempts < 3500) {
                attempts++;
                const isLeft = (pseudoRandom() > 0.5);
                const xBase = isLeft ? (-52.0 - pseudoRandom() * (W_span - 52.0)) : (52.0 + pseudoRandom() * (W_span - 52.0));
                const yBase = (pseudoRandom() - 0.5) * (H_span * 1.95);
                const zBase = -36.0 + (pseudoRandom() - 0.5) * 28.0;
                tryAddNode(new THREE.Vector3(xBase, yBase, zBase), 12.0, (constPoints.length + 2) % 7);
            }

            // Region 4: Top Sky & Deep Floor Constellations (Target: 475 spaced nodes)
            attempts = 0;
            while (constPoints.length < 475 && attempts < 3500) {
                attempts++;
                const isTop = (pseudoRandom() > 0.5);
                const xBase = (pseudoRandom() - 0.5) * (W_span * 2.2);
                const yBase = isTop ? (42.0 + pseudoRandom() * (H_span - 42.0)) : (-42.0 - pseudoRandom() * (H_span - 42.0));
                const zBase = -35.0 + (pseudoRandom() - 0.5) * 28.0;
                tryAddNode(new THREE.Vector3(xBase, yBase, zBase), 12.0, (constPoints.length + 3) % 7);
            }

            // Region 5: Perimeter & Extreme Corner Anchors (Target: 520 spaced nodes)
            attempts = 0;
            while (constPoints.length < targetTotalNodes && attempts < 2500) {
                attempts++;
                const xBase = (pseudoRandom() - 0.5) * (W_span * 2.3);
                const yBase = (pseudoRandom() - 0.5) * (H_span * 2.1);
                const zBase = -38.0 + (pseudoRandom() - 0.5) * 24.0;
                tryAddNode(new THREE.Vector3(xBase, yBase, zBase), 11.0, constPoints.length % 7);
            }

            // 3. Spaced-Out Laser Mesh Connectivity (Separated Lines with Minimum & Maximum Distance Bounds)
            // Eliminates overlapping/bunched parallel lines while preserving rich 3,500+ line volume
            const numTotalNodes = constPoints.length;
            const minEdgeDist = 16.0; // Do not connect nodes that are too close (prevents clumped lines)
            const maxEdgeDist = 72.0; // Natural span length

            for (let i = 0; i < numTotalNodes; i++) {
                const distList = [];
                for (let j = 0; j < numTotalNodes; j++) {
                    if (i === j) continue;
                    const d = constPoints[i].distanceTo(constPoints[j]);
                    if (d >= minEdgeDist && d <= maxEdgeDist) {
                        distList.push({ idx: j, dist: d });
                    }
                }
                distList.sort((a, b) => a.dist - b.dist);

                // Connect to 6-11 well-spaced distinct neighbors
                const kCount = 6 + (i % 6);
                const connectedDirs = [];

                for (let k = 0; k < distList.length && connectedDirs.length < kCount; k++) {
                    const item = distList[k];
                    const pA = constPoints[i];
                    const pB = constPoints[item.idx];
                    
                    // Direction vector for angular separation check
                    const dirX = (pB.x - pA.x) / item.dist;
                    const dirY = (pB.y - pA.y) / item.dist;
                    const dirZ = (pB.z - pA.z) / item.dist;

                    // Ensure this line doesn't run almost parallel / glued to an existing line from this node
                    let isSeparated = true;
                    for (let d = 0; d < connectedDirs.length; d++) {
                        const prev = connectedDirs[d];
                        const dot = dirX * prev.x + dirY * prev.y + dirZ * prev.z;
                        if (dot > 0.88) { // Angle < ~28 degrees -> too close, skip to keep lines distinct
                            isSeparated = false;
                            break;
                        }
                    }

                    if (isSeparated) {
                        addEdge(i, item.idx);
                        connectedDirs.push({ x: dirX, y: dirY, z: dirZ });
                    }
                }
            }

            // Add Long-Range Quantum Laser Warp Beams with distinct diagonal trajectory
            for (let i = 0; i < 180; i++) {
                const idxA = Math.floor(pseudoRandom() * numTotalNodes);
                const idxB = Math.floor(pseudoRandom() * numTotalNodes);
                if (idxA !== idxB) {
                    const dist = constPoints[idxA].distanceTo(constPoints[idxB]);
                    if (dist > 35.0 && dist < 145.0) {
                        addEdge(idxA, idxB);
                    }
                }
            }

            const nodeAdjacency = Array.from({ length: constPoints.length }, () => []);
            webEdges.forEach(e => {
                nodeAdjacency[e.a].push(e.b);
                nodeAdjacency[e.b].push(e.a);
            });

            // High-Energy Luminous Laser Web Lines Geometry
            const webLineGeo = new THREE.BufferGeometry();
            webLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(webLinePositions, 3));
            this.constellationWebMat = new THREE.LineBasicMaterial({
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.74,
                blending: THREE.AdditiveBlending
            });
            this.constellationWeb = new THREE.LineSegments(webLineGeo, this.constellationWebMat);
            this.branchNetworkGroup.add(this.constellationWeb);

            // Synaptic Junction Glowing Stars (Multi-tone Glowing Dewdrop Beads)
            const vertexGeo = new THREE.BufferGeometry();
            const vertexPos = new Float32Array(constPoints.length * 3);
            for (let i = 0; i < constPoints.length; i++) {
                vertexPos[i * 3] = constPoints[i].x;
                vertexPos[i * 3 + 1] = constPoints[i].y;
                vertexPos[i * 3 + 2] = constPoints[i].z;
            }
            vertexGeo.setAttribute('position', new THREE.BufferAttribute(vertexPos, 3));
            vertexGeo.setAttribute('color', new THREE.Float32BufferAttribute(pointColors, 3));
            
            const vertexMat = new THREE.PointsMaterial({
                size: 5.8,
                map: glowTexture,
                vertexColors: true,
                transparent: true,
                opacity: 0.94,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            this.backgroundStars = new THREE.Points(vertexGeo, vertexMat);
            this.branchNetworkGroup.add(this.backgroundStars);

            // 5. In-Line Photonic Pulses: Highly active laser pulses traversing organic pathways in all directions
            const totalSmall = 500; // 500 Micro-photons racing through cosmic laser matrix
            const totalLarge = 200; // 200 Major luminous quantum energy packets
            
            this.webSmallPacketData = [];
            this.webLargePacketData = [];

            const smallPositions = new Float32Array(totalSmall * 3);
            const smallColors = new Float32Array(totalSmall * 3);
            const largePositions = new Float32Array(totalLarge * 3);
            const largeColors = new Float32Array(totalLarge * 3);

            const palette = [
                new THREE.Color(0x00f0ff), // Electric Cyan Laser
                new THREE.Color(0x38bdf8), // Sky Blue Data Photon
                new THREE.Color(0xa855f7), // Quantum Violet Flux
                new THREE.Color(0x34d399), // Emerald Neural Pulse
                new THREE.Color(0xfbbf24), // Cyber Gold Telemetry Spark
                new THREE.Color(0x60a5fa), // Blue Stream
                new THREE.Color(0xffffff)  // Pure White Core Spark
            ];

            // Initialize Small Micro-Photons
            for (let i = 0; i < totalSmall; i++) {
                const edgeIdx = (i * 7 + 1) % Math.max(1, webEdges.length);
                const edge = webEdges[edgeIdx] || { a: 0, b: 1 };
                const forward = (i % 2 === 0);
                const startIdx = forward ? edge.a : edge.b;
                const endIdx = forward ? edge.b : edge.a;
                const color = palette[i % palette.length];
                const speed = 0.007 + (i % 6) * 0.0028;

                this.webSmallPacketData.push({
                    startIdx,
                    endIdx,
                    progress: (i * 0.13) % 1.0,
                    speed,
                    color
                });

                smallColors[i * 3] = color.r;
                smallColors[i * 3 + 1] = color.g;
                smallColors[i * 3 + 2] = color.b;
            }

            // Initialize Major Data Packets
            for (let i = 0; i < totalLarge; i++) {
                const edgeIdx = (i * 11 + 3) % Math.max(1, webEdges.length);
                const edge = webEdges[edgeIdx] || { a: 0, b: 1 };
                const forward = (i % 2 === 1);
                const startIdx = forward ? edge.a : edge.b;
                const endIdx = forward ? edge.b : edge.a;
                const color = palette[(i + 2) % palette.length];
                const speed = 0.005 + (i % 5) * 0.0022;

                this.webLargePacketData.push({
                    startIdx,
                    endIdx,
                    progress: (i * 0.23) % 1.0,
                    speed,
                    color
                });

                largeColors[i * 3] = color.r;
                largeColors[i * 3 + 1] = color.g;
                largeColors[i * 3 + 2] = color.b;
            }

            // Small Micro-Photons Mesh (size: 4.4)
            const smallGeo = new THREE.BufferGeometry();
            smallGeo.setAttribute('position', new THREE.BufferAttribute(smallPositions, 3));
            smallGeo.setAttribute('color', new THREE.BufferAttribute(smallColors, 3));
            this.webSmallPacketMat = new THREE.PointsMaterial({
                size: 4.4,
                map: glowTexture,
                vertexColors: true,
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            this.webPacketsSmallMesh = new THREE.Points(smallGeo, this.webSmallPacketMat);
            this.branchNetworkGroup.add(this.webPacketsSmallMesh);

            // Large Luminous Packets Mesh (size: 9.2)
            const largeGeo = new THREE.BufferGeometry();
            largeGeo.setAttribute('position', new THREE.BufferAttribute(largePositions, 3));
            largeGeo.setAttribute('color', new THREE.BufferAttribute(largeColors, 3));
            this.webLargePacketMat = new THREE.PointsMaterial({
                size: 9.2,
                map: glowTexture,
                vertexColors: true,
                transparent: true,
                opacity: 0.98,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            this.webPacketsLargeMesh = new THREE.Points(largeGeo, this.webLargePacketMat);
            this.branchNetworkGroup.add(this.webPacketsLargeMesh);

            // Maintain reference for backwards compatibility
            this.webPacketsMesh = this.webPacketsLargeMesh;
            this.webPacketData = this.webLargePacketData;

            this.constPoints = constPoints;
            this.webEdges = webEdges;
            this.nodeAdjacency = nodeAdjacency;

            this.robot3DGroup.add(this.branchNetworkGroup);
            if (this.webglScene) {
                this.webglScene.add(this.robot3DGroup);
            }
        }

        _renderWebGLRobot(delta, time) {
            if (!this.webglRenderer || !this.webglScene || !this.webglCamera || !this.robot3DGroup) return;

            if (this.displayMode === 'network') {
                this.robot3DGroup.visible = false;
                this.webglRenderer.render(this.webglScene, this.webglCamera);
                return;
            }

            this.robot3DGroup.visible = true;

            // Subtle, calm background parallax tracking with mouse gaze
            const tSec = time * 0.001;
            if (this.branchNetworkGroup) {
                this.branchNetworkGroup.rotation.y = Math.sin(tSec * 0.08) * 0.03 + (this.eyeTracking ? this.eyeTracking.currentX * 0.04 : 0);
                this.branchNetworkGroup.rotation.x = Math.cos(tSec * 0.06) * 0.02 + (this.eyeTracking ? this.eyeTracking.currentY * 0.02 : 0);
            }

            // Note: backgroundStars is permanently locked inside branchNetworkGroup with ZERO differential rotation.
            // This guarantees junction nodes remain 100% welded to line endpoints!

            if (this.constellationWebMat) {
                this.constellationWebMat.opacity = 0.65 + Math.sin(tSec * 0.8) * 0.10;
            }

            // Update 3D In-Line Data Packets: strictly traverse line segments from node to node
            const updatePacketSet = (packetMesh, packetData) => {
                if (!packetMesh || !packetData || !this.constPoints) return;
                const posAttr = packetMesh.geometry.attributes.position;
                const positions = posAttr.array;
                const pts = this.constPoints;
                const adj = this.nodeAdjacency;

                for (let i = 0; i < packetData.length; i++) {
                    const pkt = packetData[i];
                    pkt.progress += pkt.speed;

                    if (pkt.progress >= 1.0) {
                        pkt.progress = 0;
                        const currEnd = pkt.endIdx;
                        const neighbors = adj ? adj[currEnd] : null;
                        if (neighbors && neighbors.length > 0) {
                            const candidates = neighbors.length > 1 ? neighbors.filter(n => n !== pkt.startIdx) : neighbors;
                            pkt.startIdx = currEnd;
                            pkt.endIdx = candidates[Math.floor(Math.random() * candidates.length)] || neighbors[0];
                        } else {
                            const tmp = pkt.startIdx;
                            pkt.startIdx = pkt.endIdx;
                            pkt.endIdx = tmp;
                        }
                    }

                    // Linear interpolation strictly on the line segment between start and end nodes:
                    // P(t) = P_A + (P_B - P_A) * t  -> 100% bound inside the conduit wire!
                    const pA = pts[pkt.startIdx];
                    const pB = pts[pkt.endIdx];
                    if (pA && pB) {
                        positions[i * 3] = pA.x + (pB.x - pA.x) * pkt.progress;
                        positions[i * 3 + 1] = pA.y + (pB.y - pA.y) * pkt.progress;
                        positions[i * 3 + 2] = pA.z + (pB.z - pA.z) * pkt.progress;
                    }
                }
                posAttr.needsUpdate = true;
            };

            updatePacketSet(this.webPacketsSmallMesh, this.webSmallPacketData);
            updatePacketSet(this.webPacketsLargeMesh, this.webLargePacketData);

            this.webglRenderer.render(this.webglScene, this.webglCamera);
        }

        _destroyWebGLRobot() {
            if (this.webglRenderer) {
                try {
                    this.webglRenderer.dispose();
                } catch (e) {}
            }
            if (this.webglScene) {
                try {
                    this.webglScene.traverse(obj => {
                        if (obj.geometry) obj.geometry.dispose();
                        if (obj.material) {
                            if (Array.isArray(obj.material)) {
                                obj.material.forEach(m => m.dispose());
                            } else {
                                obj.material.dispose();
                            }
                        }
                    });
                } catch (e) {}
            }
            if (this.webglCanvas && this.webglCanvas.parentElement) {
                this.webglCanvas.parentElement.removeChild(this.webglCanvas);
            }
            this.webglRenderer = null;
            this.webglScene = null;
            this.webglCamera = null;
            this.webglCanvas = null;
            this.robot3DGroup = null;
            this.robotHeadGroup = null;
            this.robotTorsoGroup = null;
            this.cyberHeartGroup = null;
            this.heartChassis = null;
            this.lvGroup = null;
            this.lvCoreMesh = null;
            this.lvQuartzMesh = null;
            this.lvTurbine = null;
            this.rvGroup = null;
            this.rvCoreMesh = null;
            this.rvQuartzMesh = null;
            this.rvTurbine = null;
            this.laMesh = null;
            this.raMesh = null;
            this.aortaMesh = null;
            this.supraMeshes = [];
            this.pulmonicMesh = null;
            this.lpaMesh = null;
            this.rpaMesh = null;
            this.svcMesh = null;
            this.aorticDisc = null;
            this.pulmonicDisc = null;
            this.apexPistonGroup = null;
            this.innerHeartCore = null;
            this.outerHeartCrystal = null;
            this.wireHeartLattice = null;
            this.sinoatrialNode = null;
            this.sinoatrialHalo = null;
            this.aorticTrunks = [];
            this.shockwaveRings = [];
            this.dataBlocks = [];
            this.robotLeds = [];
            this.robotLights = {};
            this.branchConduits = [];
            this.branchNodes = [];
            this.branchParticleData = [];
            this.branchParticlesMesh = null;
            this.streamPoints = null;
            this.streamParticleData = [];
            this.lightCones = [];
            this.tractorBeam = null;
            this.tractorBeam2 = null;
            this.robotMaterials = {};
            this.floorRing1 = null;
            this.floorRing2 = null;
            this.floorRing3 = null;
            this.constellationWeb = null;
            this.constellationWebMat = null;
        }

        _renderRobot3D(ctx) {
            if (!this.robotGeometry) return;

            const time = performance.now();
            const { vertices, faces } = this.robotGeometry;

            // Semantic Color Profiles based on operational status
            let primaryGlow = '#38bdf8';
            let visorFill = 'rgba(8, 28, 48, 0.88)';
            let visorStroke = 'rgba(56, 189, 248, 0.85)';
            let coreColor = '#38bdf8';

            if (this.mode === 'ANOMALY_DETECTED' || this.mode === 'ALERT' || this.mode === 'ERROR') {
                primaryGlow = '#ef4444';
                visorFill = 'rgba(58, 12, 18, 0.9)';
                visorStroke = 'rgba(239, 68, 68, 0.9)';
                coreColor = '#ef4444';
            } else if (this.mode === 'MODEL_RUNNING') {
                primaryGlow = '#c084fc';
                visorFill = 'rgba(38, 14, 60, 0.9)';
                visorStroke = 'rgba(192, 132, 252, 0.9)';
                coreColor = '#c084fc';
            } else if (this.mode === 'AUTONOMOUS_MONITORING' || this.mode === 'VALIDATING') {
                primaryGlow = '#34d399';
                visorFill = 'rgba(8, 42, 30, 0.9)';
                visorStroke = 'rgba(52, 211, 153, 0.9)';
                coreColor = '#34d399';
            } else if (this.mode === 'LEARNING') {
                primaryGlow = '#e879f9';
                visorFill = 'rgba(50, 14, 55, 0.9)';
                visorStroke = 'rgba(232, 121, 249, 0.9)';
                coreColor = '#e879f9';
            } else if (this.mode === 'UNCERTAINTY') {
                primaryGlow = '#fbbf24';
                visorFill = 'rgba(48, 32, 10, 0.9)';
                visorStroke = 'rgba(251, 191, 36, 0.9)';
                coreColor = '#fbbf24';
            }

            // 1. Top-Tier Three.js 3D WebGL Cybernetic Android Render Path
            if (this.webglRenderer && this.webglCanvas && this.webglCanvas.parentElement) {
                if (this.robot3DGroup) {
                    this.robot3DGroup.visible = (this.displayMode !== 'network');
                }
                if (this.displayMode === 'robot' || this.displayMode === 'hybrid') {
                    this._renderRobotTelemetryOverlay(ctx, primaryGlow);
                }
                return;
            }

            // 2. Photorealistic Fallback (when WebGL is not available)
            if (this.robotImg && this.robotImg.complete && this.robotImg.naturalWidth > 0) {
                this._renderRealisticRobotEntity(ctx, time, primaryGlow);
                return;
            }

            // Organic idle kinematics (natural breathing + micro-sway)
            const idleBreath = Math.sin(time * 0.0022) * 3.5;
            const idleSway = Math.sin(time * 0.0012) * 0.035;

            // Head tracking angles (smooth interpolation + lifelike presence)
            const headLookY = this.eyeTracking.currentX * 0.42 + idleSway;
            const headLookX = this.eyeTracking.currentY * 0.28 + Math.cos(time * 0.0015) * 0.02;
            const cosY = Math.cos(headLookY), sinY = Math.sin(headLookY);
            const cosX = Math.cos(headLookX), sinX = Math.sin(headLookX);

            const scaleFactor = this.displayMode === 'robot' ? 1.48 : 1.15;
            const offsetY = (this.displayMode === 'robot' ? -10 : -18) + idleBreath;

            // 1. Transform all vertices into world coordinates with head orientation
            const worldVertices = vertices.map(v => {
                const vy = v.y - 10;
                const rx = v.x * cosY + v.z * sinY;
                const rz = -v.x * sinY + v.z * cosY;
                const ry = vy * cosX - rz * sinX + 10;
                const finalZ = vy * sinX + rz * cosX;

                return {
                    x: rx * scaleFactor,
                    y: (ry + offsetY) * scaleFactor,
                    z: finalZ * scaleFactor
                };
            });

            // 2. Project world vertices to screen space
            const projectedVertices = worldVertices.map(wv => this._project(wv.x, wv.y, wv.z));

            // 3. Render 3D Gyroscopic Holographic Orbital Rings, Energy Aura, and Hologram Runes
            this._renderGyroscopicHud(ctx, time, primaryGlow);
            this._renderOrbitalAura(ctx, time, primaryGlow);
            this._renderFloatingHologramRunes(ctx, time, primaryGlow);

            // 4. Compute normals, lighting, and sort faces by depth
            const preparedFaces = [];
            for (let i = 0; i < faces.length; i++) {
                const face = faces[i];
                const idx = face.indices;
                const v0 = worldVertices[idx[0]];
                const v1 = worldVertices[idx[1]];
                const v2 = worldVertices[idx[2]];
                if (!v0 || !v1 || !v2) continue;

                // Edge vectors
                const ax = v1.x - v0.x, ay = v1.y - v0.y, az = v1.z - v0.z;
                const bx = v2.x - v0.x, by = v2.y - v0.y, bz = v2.z - v0.z;

                // Normal vector
                let nx = ay * bz - az * by;
                let ny = az * bx - ax * bz;
                let nz = ax * by - ay * bx;
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                nx /= len; ny /= len; nz /= len;

                // Depth calculation (average projected depth)
                let avgDepth = 0;
                let valid = true;
                for (let k = 0; k < idx.length; k++) {
                    const p = projectedVertices[idx[k]];
                    if (!p) { valid = false; break; }
                    avgDepth += p.depth;
                }
                if (!valid) continue;
                avgDepth /= idx.length;

                // Directional light [0.35, -0.65, 0.67]
                const dot = nx * 0.35 + ny * (-0.65) + nz * 0.67;
                const intensity = Math.max(0.22, Math.min(1.0, dot * 0.52 + 0.48));

                // Blinn-Phong half-vector specular highlight [0.192, -0.357, 0.914]
                const specDot = Math.max(0, nx * 0.192 + ny * (-0.357) + nz * 0.914);
                const spec = Math.pow(specDot, 16);

                preparedFaces.push({
                    face,
                    avgDepth,
                    intensity,
                    spec,
                    nx, ny, nz
                });
            }

            // Painter's algorithm: sort back to front
            preparedFaces.sort((a, b) => a.avgDepth - b.avgDepth);

            // 5. Draw Shaded Polygon Plates with Realistic Specular Luster
            preparedFaces.forEach(({ face, intensity, spec }) => {
                const idx = face.indices;
                const pts = idx.map(index => projectedVertices[index]);
                if (pts.some(p => !p)) return;

                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let k = 1; k < pts.length; k++) {
                    ctx.lineTo(pts[k].x, pts[k].y);
                }
                ctx.closePath();

                if (face.type === 'visor') {
                    ctx.fillStyle = visorFill;
                    ctx.fill();
                    ctx.lineWidth = 2.0;
                    ctx.strokeStyle = visorStroke;
                    ctx.shadowColor = primaryGlow;
                    ctx.shadowBlur = 12;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                } else if (face.type === 'armor') {
                    // Cybernetic Obsidian Metallic Armor Plates with Specular Highlights
                    const baseR = Math.round(14 + intensity * 28);
                    const baseG = Math.round(22 + intensity * 38);
                    const baseB = Math.round(38 + intensity * 62);
                    const specAdd = Math.round((spec || 0) * 110);
                    const r = Math.min(255, baseR + specAdd);
                    const g = Math.min(255, baseG + Math.round(specAdd * 1.08));
                    const b = Math.min(255, baseB + Math.round(specAdd * 1.3));
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    ctx.fill();
                    ctx.lineWidth = 0.95;
                    ctx.strokeStyle = (spec || 0) > 0.35 ? 'rgba(186, 230, 253, 0.85)' : `rgba(56, 189, 248, ${0.2 + intensity * 0.35})`;
                    ctx.stroke();
                } else if (face.type === 'accent') {
                    const baseR = Math.round(12 + intensity * 22);
                    const baseG = Math.round(90 + intensity * 115);
                    const baseB = Math.round(155 + intensity * 110);
                    const specAdd = Math.round((spec || 0) * 85);
                    const r = Math.min(255, baseR + specAdd);
                    const g = Math.min(255, baseG + specAdd);
                    const b = Math.min(255, baseB + specAdd);
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    ctx.fill();
                    ctx.lineWidth = 1.2;
                    ctx.strokeStyle = primaryGlow;
                    ctx.stroke();
                } else if (face.type === 'gold') {
                    // Dubai Luxury 24k Specular Gold Leaf Inlays
                    const baseR = Math.round(195 + intensity * 55);
                    const baseG = Math.round(145 + intensity * 45);
                    const baseB = Math.round(35 + intensity * 25);
                    const specAdd = Math.round((spec || 0) * 130);
                    const r = Math.min(255, baseR + specAdd);
                    const g = Math.min(255, baseG + Math.round(specAdd * 0.94));
                    const b = Math.min(255, baseB + Math.round(specAdd * 0.6));
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    ctx.fill();
                    ctx.lineWidth = 1.1;
                    ctx.strokeStyle = (spec || 0) > 0.3 ? 'rgba(255, 250, 185, 0.95)' : 'rgba(234, 179, 8, 0.75)';
                    ctx.stroke();
                } else {
                    // chassis
                    const r = Math.round(10 + intensity * 16);
                    const g = Math.round(14 + intensity * 18);
                    const b = Math.round(24 + intensity * 28);
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    ctx.fill();
                    ctx.lineWidth = 0.7;
                    ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
                    ctx.stroke();
                }
            });

            // 6. Draw Internal Synaptic AI Diamond (Brain Core)
            this._renderSynapticBrainCore(ctx, time, coreColor);

            // 7. Draw Visor Laser Scan & Cybernetic Ocular Pupils
            this._renderVisorOcularArray(ctx, projectedVertices, time, primaryGlow);

            // 8. Draw Audio Equalizer Vocoder Waves (Mouth Area)
            this._renderVocoderMouthWaves(ctx, projectedVertices, time, primaryGlow);

            // 9. Draw Luxury Cybernetic Telemetry Labels
            if (this.displayMode === 'robot' || this.displayMode === 'hybrid') {
                this._renderRobotTelemetryOverlay(ctx, primaryGlow);
            }
        }

        /**
         * Render Photorealistic 2026 AI Robot Android with interactive gaze tracking,
         * cyan visor laser scanner, ocular projector beams, and gyroscopic HUD rings.
         */
        _renderRealisticRobotEntity(ctx, time, primaryGlow) {
            const width = this.width || 800;
            const height = this.height || 420;

            const isRobotMode = this.displayMode === 'robot';
            const size = Math.min(width, height) * (isRobotMode ? 0.94 : 0.78);

            // Gaze tracking & organic kinematics (smooth, responsive, front-facing locked)
            const idleBreath = Math.sin(time * 0.0022) * 3.8;
            const idleSway = Math.sin(time * 0.0012) * 0.028;
            const targetYaw = Math.max(-0.65, Math.min(0.65, this.eyeTracking.currentX));
            const targetPitch = Math.max(-0.45, Math.min(0.45, this.eyeTracking.currentY));

            const gazeShiftX = targetYaw * 28 + (idleSway * 60);
            const gazeShiftY = targetPitch * 18 + idleBreath;
            const headTilt = targetYaw * 0.06;

            const posX = width / 2 + gazeShiftX;
            const posY = (height / 2 - 14) + gazeShiftY;
            const radius = size * 0.48;

            // 1. Subtle Ambient Backing Glow (Smooth borderless fade into stage)
            const auraGrad = ctx.createRadialGradient(posX, posY, radius * 0.08, posX, posY, radius * 0.95);
            auraGrad.addColorStop(0, primaryGlow === '#ef4444' ? 'rgba(239, 68, 68, 0.16)' : (primaryGlow === '#c084fc' ? 'rgba(192, 132, 252, 0.15)' : 'rgba(56, 189, 248, 0.14)'));
            auraGrad.addColorStop(0.55, 'rgba(14, 165, 233, 0.03)');
            auraGrad.addColorStop(1, 'rgba(3, 7, 18, 0)');
            ctx.fillStyle = auraGrad;
            ctx.fillRect(posX - radius, posY - radius, radius * 2, radius * 2);

            // 2. Render 3D Gyroscopic HUD Rings in background
            this._renderGyroscopicHud(ctx, time, primaryGlow);

            // 3. Draw Photorealistic 2026 Android Entity with Seamless 4-Edge Edge Feathering
            ctx.save();
            ctx.translate(posX, posY);
            ctx.rotate(headTilt);

            // Draw robot image directly
            ctx.drawImage(this.robotImg, -size / 2, -size / 2, size, size);

            // A. Bottom boundary fade (melts seamlessly into the dark command center console)
            const btmFadeH = size * 0.24;
            const btmFade = ctx.createLinearGradient(0, size / 2 - btmFadeH, 0, size / 2);
            btmFade.addColorStop(0, 'rgba(3, 7, 18, 0)');
            btmFade.addColorStop(0.65, 'rgba(3, 7, 18, 0.78)');
            btmFade.addColorStop(1, 'rgba(3, 7, 18, 1)');
            ctx.fillStyle = btmFade;
            ctx.fillRect(-size / 2 - 10, size / 2 - btmFadeH, size + 20, btmFadeH + 10);

            // B. Top boundary fade (softens above the cranium)
            const topFadeH = size * 0.10;
            const topFade = ctx.createLinearGradient(0, -size / 2, 0, -size / 2 + topFadeH);
            topFade.addColorStop(0, 'rgba(3, 7, 18, 0.98)');
            topFade.addColorStop(0.7, 'rgba(3, 7, 18, 0.45)');
            topFade.addColorStop(1, 'rgba(3, 7, 18, 0)');
            ctx.fillStyle = topFade;
            ctx.fillRect(-size / 2 - 10, -size / 2 - 10, size + 20, topFadeH + 10);

            // C. Left lateral vignette (softens left shoulder edge)
            const sideFadeW = size * 0.14;
            const leftFade = ctx.createLinearGradient(-size / 2, 0, -size / 2 + sideFadeW, 0);
            leftFade.addColorStop(0, 'rgba(3, 7, 18, 0.95)');
            leftFade.addColorStop(0.7, 'rgba(3, 7, 18, 0.40)');
            leftFade.addColorStop(1, 'rgba(3, 7, 18, 0)');
            ctx.fillStyle = leftFade;
            ctx.fillRect(-size / 2 - 10, -size / 2 - 10, sideFadeW + 10, size + 20);

            // D. Right lateral vignette (softens right shoulder edge)
            const rightFade = ctx.createLinearGradient(size / 2 - sideFadeW, 0, size / 2, 0);
            rightFade.addColorStop(0, 'rgba(3, 7, 18, 0)');
            rightFade.addColorStop(0.7, 'rgba(3, 7, 18, 0.40)');
            rightFade.addColorStop(1, 'rgba(3, 7, 18, 0.95)');
            ctx.fillStyle = rightFade;
            ctx.fillRect(size / 2 - sideFadeW, -size / 2 - 10, sideFadeW + 10, size + 20);

            ctx.restore();

            // 4. Subtle Internal Quantum Arc Reactor Core Pulse (Chest area)
            const reactorY = posY + (size * 0.22) + (targetPitch * 10);
            const reactorX = posX + (targetYaw * 12);
            const reactorPulse = 0.8 + Math.sin(time * 0.0035) * 0.25;
            const rGrad = ctx.createRadialGradient(reactorX, reactorY, 2, reactorX, reactorY, size * 0.12);
            rGrad.addColorStop(0, primaryGlow === '#ef4444' ? 'rgba(239, 68, 68, 0.45)' : (primaryGlow === '#c084fc' ? 'rgba(192, 132, 252, 0.45)' : 'rgba(56, 189, 248, 0.42)'));
            rGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
            rGrad.addColorStop(1, 'rgba(3, 7, 18, 0)');
            ctx.save();
            ctx.fillStyle = rGrad;
            ctx.beginPath();
            ctx.arc(reactorX, reactorY, size * 0.12 * reactorPulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 5. Active Holographic Visor Laser Scan (Sweeping across cyan visor band)
            const visorY = posY - (size * 0.146) + (targetPitch * 6);
            const visorLeft = posX - (size * 0.08) + (targetYaw * 5);
            const visorRight = posX + (size * 0.23) + (targetYaw * 5);
            const scanPhase = (Math.sin(time * 0.0035) + 1) * 0.5;
            const scanX = visorLeft + (visorRight - visorLeft) * scanPhase;

            ctx.save();
            ctx.lineWidth = 2.2;
            ctx.strokeStyle = '#ffffff';
            ctx.shadowColor = primaryGlow;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(scanX, visorY - 11);
            ctx.lineTo(scanX, visorY + 11);
            ctx.stroke();

            // Laser flare focal point
            ctx.fillStyle = primaryGlow;
            ctx.beginPath();
            ctx.arc(scanX, visorY, 3.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 6. Volumetric Gaze Laser Projector Cones & Bionic Optical Pupils (Tracking Cursor)
            // Exact eye locations measured from the 2026 humanoid asset (3/4 perspective)
            const leftEyeX = posX + (size * 0.032) + (targetYaw * 7.5);
            const rightEyeX = posX + (size * 0.178) + (targetYaw * 7.5);
            const eyeY = visorY + (targetPitch * 3);

            [leftEyeX, rightEyeX].forEach((eyeX, eIdx) => {
                const beamLen = 105;
                const dirX = targetYaw * 1.6 + (eIdx === 0 ? -0.04 : 0.04);
                const dirY = targetPitch * 1.4 + 0.35;
                const endX = eyeX + dirX * beamLen;
                const endY = eyeY + dirY * beamLen;

                // Volumetric Projection Light Cone
                const grad = ctx.createLinearGradient(eyeX, eyeY, endX, endY);
                grad.addColorStop(0, primaryGlow === '#ef4444' ? 'rgba(239, 68, 68, 0.42)' : 'rgba(56, 189, 248, 0.42)');
                grad.addColorStop(0.45, primaryGlow === '#ef4444' ? 'rgba(239, 68, 68, 0.10)' : 'rgba(56, 189, 248, 0.10)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(eyeX, eyeY);
                ctx.lineTo(endX + 18, endY + 18);
                ctx.lineTo(endX - 18, endY - 18);
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.fill();

                // Luminous Bionic Pupil (Glowing Iris tracking mouse coordinates)
                ctx.shadowColor = primaryGlow;
                ctx.shadowBlur = 12;

                // Outer cyan/primary glow iris ring
                ctx.fillStyle = primaryGlow;
                ctx.beginPath();
                ctx.arc(eyeX, eyeY, 3.8, 0, Math.PI * 2);
                ctx.fill();

                // Inner radiant white photon focal core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(eyeX, eyeY, 1.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // 7. Floating Hologram Runes & Orbital Aura
            this._renderOrbitalAura(ctx, time, primaryGlow);
            this._renderFloatingHologramRunes(ctx, time, primaryGlow);

            // 8. Cybernetic Telemetry HUD Overlay
            if (this.displayMode === 'robot' || this.displayMode === 'hybrid') {
                this._renderRobotTelemetryOverlay(ctx, primaryGlow);
            }
        }

        _renderGyroscopicHud(ctx, time, glowColor) {
            const centerY = this.displayMode === 'robot' ? -6 : -16;
            const tilt1 = 0.42;
            const tilt2 = -0.32;
            const rot1 = time * 0.0008;
            const rot2 = -time * 0.0006;

            // Outer Gyroscope Ring
            const outerR = this.displayMode === 'robot' ? 145 : 115;
            const steps = 36;
            ctx.beginPath();
            let firstPoint = null;
            for (let i = 0; i <= steps; i++) {
                const theta = (i / steps) * Math.PI * 2 + rot1;
                const rx = Math.cos(theta) * outerR;
                const rz = Math.sin(theta) * outerR;
                const ry = centerY + rz * Math.sin(tilt1);
                const finalZ = rz * Math.cos(tilt1);
                const p = this._project(rx, ry, finalZ);
                if (p) {
                    if (!firstPoint) {
                        firstPoint = p;
                        ctx.moveTo(p.x, p.y);
                    } else {
                        ctx.lineTo(p.x, p.y);
                    }
                }
            }
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
            ctx.lineWidth = 1.0;
            ctx.stroke();

            // Inner Counter-Rotating Ring with Ticks
            const innerR = this.displayMode === 'robot' ? 110 : 85;
            ctx.beginPath();
            firstPoint = null;
            for (let i = 0; i <= steps; i++) {
                const theta = (i / steps) * Math.PI * 2 + rot2;
                const rx = Math.cos(theta) * innerR;
                const rz = Math.sin(theta) * innerR;
                const ry = centerY + rx * Math.sin(tilt2);
                const finalX = rx * Math.cos(tilt2);
                const p = this._project(finalX, ry, rz);
                if (p) {
                    if (!firstPoint) {
                        firstPoint = p;
                        ctx.moveTo(p.x, p.y);
                    } else {
                        ctx.lineTo(p.x, p.y);
                    }
                }
            }
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Cardinal Azimuth Ticks on Outer Ring
            const cardinalAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
            cardinalAngles.forEach(ang => {
                const theta = ang + rot1;
                const rx = Math.cos(theta) * outerR;
                const rz = Math.sin(theta) * outerR;
                const ry = centerY + rz * Math.sin(tilt1);
                const finalZ = rz * Math.cos(tilt1);
                const p = this._project(rx, ry, finalZ);
                if (p) {
                    ctx.fillStyle = glowColor;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }

        _renderOrbitalAura(ctx, time, primaryGlow) {
            if (!this.auraParticles || this.auraParticles.length === 0) return;
            const headLookY = this.eyeTracking.currentX * 0.38;
            const headLookX = this.eyeTracking.currentY * 0.24;
            const cosY = Math.cos(headLookY), sinY = Math.sin(headLookY);
            const cosX = Math.cos(headLookX), sinX = Math.sin(headLookX);
            const scaleFactor = this.displayMode === 'robot' ? 1.28 : 0.90;
            const offsetY = this.displayMode === 'robot' ? -6 : -16;

            const centerY = -30;

            ctx.save();
            this.auraParticles.forEach(p => {
                const currentTheta = p.theta + time * p.speed;
                const r = p.radius;
                const lx = r * Math.cos(currentTheta) * Math.cos(p.phi);
                const ly = centerY + r * Math.sin(p.phi);
                const lz = r * Math.sin(currentTheta) * Math.cos(p.phi);

                // Transform with head rotation
                const rx = lx * cosY + lz * sinY;
                const rz = -lx * sinY + lz * cosY;
                const ry = (ly - 10) * cosX - rz * sinX + 10;
                const finalZ = (ly - 10) * sinX + rz * cosX;

                const proj = this._project(rx * scaleFactor, (ry + offsetY) * scaleFactor, finalZ * scaleFactor);
                if (!proj || proj.depth <= 0) return;

                const alpha = Math.min(0.85, Math.max(0.12, (proj.depth - 0.3) * 0.9));
                let fill = `rgba(56, 189, 248, ${alpha})`;
                if (p.colorType === 'gold') {
                    fill = `rgba(212, 175, 55, ${alpha})`;
                } else if (p.colorType === 'white') {
                    fill = `rgba(255, 255, 255, ${alpha})`;
                }

                ctx.fillStyle = fill;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, Math.max(0.5, p.size * (0.6 + proj.depth * 0.5)), 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        _renderFloatingHologramRunes(ctx, time, primaryGlow) {
            if (!this.holoGlyphs || this.holoGlyphs.length === 0) return;
            const scaleFactor = this.displayMode === 'robot' ? 1.28 : 0.90;
            const offsetY = this.displayMode === 'robot' ? -6 : -16;

            ctx.save();
            ctx.font = '700 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            this.holoGlyphs.forEach((g, idx) => {
                const currentAngle = g.angle + time * g.rotSpeed;
                const bobbing = Math.sin(time * 0.002 + idx) * 8;
                const lx = Math.cos(currentAngle) * g.dist;
                const ly = g.y + bobbing;
                const lz = Math.sin(currentAngle) * g.dist;

                const proj = this._project(lx * scaleFactor, (ly + offsetY) * scaleFactor, lz * scaleFactor);
                if (!proj || proj.depth <= 0) return;

                const alpha = Math.min(0.85, Math.max(0.18, proj.depth * 0.8));
                ctx.fillStyle = g.color === '#d4af37' ? `rgba(212, 175, 55, ${alpha})` : `rgba(56, 189, 248, ${alpha})`;
                ctx.shadowColor = g.color;
                ctx.shadowBlur = 6;
                ctx.fillText(g.char, proj.x, proj.y);
            });
            ctx.restore();
        }

        _renderSynapticBrainCore(ctx, time, coreColor) {
            const headLookY = this.eyeTracking.currentX * 0.38;
            const headLookX = this.eyeTracking.currentY * 0.24;
            const cosY = Math.cos(headLookY), sinY = Math.sin(headLookY);
            const cosX = Math.cos(headLookX), sinX = Math.sin(headLookX);
            const scaleFactor = this.displayMode === 'robot' ? 1.28 : 0.90;
            const offsetY = this.displayMode === 'robot' ? -6 : -16;

            // Diamond Core local vertices around forehead interior (0, -70, 48)
            const coreCenter = { x: 0, y: -70, z: 48 };
            const r = 9;
            const coreRot = time * 0.0025;
            const cCos = Math.cos(coreRot), cSin = Math.sin(coreRot);

            const diamondLocal = [
                { x: 0, y: -r * 1.3, z: 0 },
                { x: 0, y: r * 1.3, z: 0 },
                { x: -r * cCos, y: 0, z: r * cSin },
                { x: r * cCos, y: 0, z: -r * cSin },
                { x: r * cSin, y: 0, z: r * cCos },
                { x: -r * cSin, y: 0, z: -r * cCos }
            ];

            const diamondProjected = diamondLocal.map(dl => {
                const vx = coreCenter.x + dl.x;
                const vy = coreCenter.y + dl.y - 10;
                const vz = coreCenter.z + dl.z;

                const rx = vx * cosY + vz * sinY;
                const rz = -vx * sinY + vz * cosY;
                const ry = vy * cosX - rz * sinX + 10;
                const finalZ = vy * sinX + rz * cosX;

                return this._project(rx * scaleFactor, (ry + offsetY) * scaleFactor, finalZ * scaleFactor);
            });

            if (diamondProjected.some(p => !p)) return;

            // Wireframe Octahedron Edges
            const edges = [
                [0, 2], [0, 3], [0, 4], [0, 5],
                [1, 2], [1, 3], [1, 4], [1, 5],
                [2, 4], [4, 3], [3, 5], [5, 2]
            ];

            ctx.lineWidth = 1.2;
            ctx.strokeStyle = coreColor;
            ctx.shadowColor = coreColor;
            ctx.shadowBlur = 10;
            edges.forEach(([i, j]) => {
                ctx.beginPath();
                ctx.moveTo(diamondProjected[i].x, diamondProjected[i].y);
                ctx.lineTo(diamondProjected[j].x, diamondProjected[j].y);
                ctx.stroke();
            });

            // Center synaptic nucleus spark
            const centerPt = this._project(
                (coreCenter.x * cosY + coreCenter.z * sinY) * scaleFactor,
                ((coreCenter.y - 10) * cosX - (coreCenter.z) * sinX + 10 + offsetY) * scaleFactor,
                ((coreCenter.y - 10) * sinX + coreCenter.z * cosX) * scaleFactor
            );
            if (centerPt) {
                const pulse = (Math.sin(time * 0.005) + 1) * 2 + 2;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(centerPt.x, centerPt.y, pulse, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        }

        _renderVisorOcularArray(ctx, proj, time, glowColor) {
            // Visor corner projected indices: 8: TL, 9: TR, 11: BL, 12: BR
            const pTL = proj[8], pTR = proj[9], pBL = proj[11], pBR = proj[12];
            if (!pTL || !pTR || !pBL || !pBR) return;

            // 1. Horizontal Laser Scanning Beam
            const scanPhase = (Math.sin(time * 0.0035) + 1) * 0.5;
            const topBeamX = pTL.x + (pTR.x - pTL.x) * scanPhase;
            const topBeamY = pTL.y + (pTR.y - pTL.y) * scanPhase;
            const btmBeamX = pBL.x + (pBR.x - pBL.x) * scanPhase;
            const btmBeamY = pBL.y + (pBR.y - pBL.y) * scanPhase;

            ctx.save();
            ctx.lineWidth = 2.4;
            ctx.strokeStyle = '#ffffff';
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(topBeamX, topBeamY);
            ctx.lineTo(btmBeamX, btmBeamY);
            ctx.stroke();

            // Laser scan flare
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.arc((topBeamX + btmBeamX) * 0.5, (topBeamY + btmBeamY) * 0.5, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 2. Dual Cybernetic Holographic Pupils (Eyes)
            const eyeGazeShiftX = this.eyeTracking.currentX * 4.5;
            const eyeGazeShiftY = this.eyeTracking.currentY * 3.0;

            const leftEyeX = pTL.x * 0.65 + pTR.x * 0.35 + (pBL.x * 0.65 + pBR.x * 0.35 - (pTL.x * 0.65 + pTR.x * 0.35)) * 0.5 + eyeGazeShiftX;
            const leftEyeY = pTL.y * 0.65 + pTR.y * 0.35 + (pBL.y * 0.65 + pBR.y * 0.35 - (pTL.y * 0.65 + pTR.y * 0.35)) * 0.5 + eyeGazeShiftY;

            const rightEyeX = pTL.x * 0.35 + pTR.x * 0.65 + (pBL.x * 0.35 + pBR.x * 0.65 - (pTL.x * 0.35 + pTR.x * 0.65)) * 0.5 + eyeGazeShiftX;
            const rightEyeY = pTL.y * 0.35 + pTR.y * 0.65 + (pBL.y * 0.35 + pBR.y * 0.65 - (pTL.y * 0.35 + pTR.y * 0.65)) * 0.5 + eyeGazeShiftY;
            // 2. Volumetric Ocular Projector Beams (Laser Light Cones Tracking Gaze)
            [ { x: leftEyeX, y: leftEyeY, angle: -0.06 }, { x: rightEyeX, y: rightEyeY, angle: 0.06 } ].forEach(eye => {
                const beamLength = 85;
                const gazeDirX = (this.eyeTracking.currentX * 1.8 + eye.angle);
                const gazeDirY = (this.eyeTracking.currentY * 1.2 + 0.35);
                const endX = eye.x + gazeDirX * beamLength;
                const endY = eye.y + gazeDirY * beamLength;
                const spread = 18;

                const perpX = -gazeDirY;
                const perpY = gazeDirX;
                const perpLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
                const nx = (perpX / perpLen) * spread;
                const ny = (perpY / perpLen) * spread;

                const grad = ctx.createLinearGradient(eye.x, eye.y, endX, endY);
                const beamColor = glowColor === '#ef4444' ? '239, 68, 68' : (glowColor === '#c084fc' ? '192, 132, 252' : '56, 189, 248');
                grad.addColorStop(0, `rgba(${beamColor}, 0.38)`);
                grad.addColorStop(0.35, `rgba(${beamColor}, 0.12)`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(eye.x, eye.y);
                ctx.lineTo(endX + nx, endY + ny);
                ctx.lineTo(endX - nx, endY - ny);
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.restore();
            });

            // 3. Dual Cybernetic Holographic Pupils (Eyes)
            [ { x: leftEyeX, y: leftEyeY }, { x: rightEyeX, y: rightEyeY } ].forEach(eye => {
                // Outer targeting ring
                ctx.strokeStyle = glowColor;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(eye.x, eye.y, 5.5, 0, Math.PI * 2);
                ctx.stroke();

                // Inner aperture
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(eye.x, eye.y, 2.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Targeting crosshair ticks
                ctx.strokeStyle = glowColor;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(eye.x - 7, eye.y); ctx.lineTo(eye.x - 4, eye.y);
                ctx.moveTo(eye.x + 4, eye.y); ctx.lineTo(eye.x + 7, eye.y);
                ctx.moveTo(eye.x, eye.y - 7); ctx.lineTo(eye.x, eye.y - 4);
                ctx.moveTo(eye.x, eye.y + 4); ctx.lineTo(eye.x, eye.y + 7);
                ctx.stroke();
            });
        }

        _renderVocoderMouthWaves(ctx, proj, time, glowColor) {
            const pMouth = proj[21];
            if (!pMouth) return;

            const isHighActivity = this.mode === 'ANALYZING' || this.mode === 'MODEL_RUNNING' || this.mode === 'LEARNING' || this.mode === 'COPILOT_ACTIVE';
            const speed = isHighActivity ? 0.012 : 0.005;
            const heightMultiplier = isHighActivity ? 8 : 4.5;

            const barCount = 5;
            const barWidth = 2.2;
            const barGap = 3.2;
            const startX = pMouth.x - ((barCount * (barWidth + barGap) - barGap) / 2);

            ctx.fillStyle = glowColor;
            for (let i = 0; i < barCount; i++) {
                const h = Math.abs(Math.sin(time * speed + i * 1.3)) * heightMultiplier + 2;
                const bx = startX + i * (barWidth + barGap);
                const by = pMouth.y - h * 0.5;
                ctx.fillRect(bx, by, barWidth, h);
            }
        }

        _renderRobotTelemetryOverlay(ctx, glowColor) {
            // Disabled: keep scene clean without extra corner boxes or text overlays
            return;
        }


        _project(x, y, z) {
            const radX = this.camera.rotX;
            const radY = this.camera.rotY;

            // Rotate around Y axis
            let x1 = x * Math.cos(radY) + z * Math.sin(radY);
            let z1 = -x * Math.sin(radY) + z * Math.cos(radY);

            // Rotate around X axis
            let y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
            let z2 = y * Math.sin(radX) + z1 * Math.cos(radX);

            const fov = 420;
            const distance = fov - z2;
            if (distance <= 10) return null;

            const scale = fov / distance;
            const projX = (x1 * scale) + (this.width / 2);
            const projY = (y2 * scale) + (this.height / 2);

            return {
                x: projX,
                y: projY,
                scale,
                depth: z2
            };
        }

        _loop() {
            if (!this.isRunning) return;

            const now = performance.now();
            const delta = Math.min((now - this.lastFrameTime) / 1000, 0.1);
            this.lastFrameTime = now;

            if (this.modeTimer > 0 && now > this.modeTimer) {
                this.mode = 'IDLE';
                this.modeTimer = 0;
            }

            this._update(delta);
            if (!this.webglRenderer && typeof window !== 'undefined' && window.THREE && this.canvas && this.canvas.parentElement) {
                this._initWebGLRobot(this.canvas.parentElement);
            }
            if (this.webglRenderer && this.webglScene && this.webglCamera) {
                this._renderWebGLRobot(delta, now);
            }
            this._render();

            this.animId = requestAnimationFrame(() => this._loop());
        }

        _update(delta) {
            if (this.prefersReducedMotion) return;

            // Head and Eye Tracking Smooth Interpolation towards cursor gaze (responsive & lifelike)
            this.eyeTracking.currentX += (this.eyeTracking.x - this.eyeTracking.currentX) * 0.18;
            this.eyeTracking.currentY += (this.eyeTracking.y - this.eyeTracking.currentY) * 0.18;

            // Inertial rotation
            this.camera.rotX += (this.camera.targetRotX - this.camera.rotX) * 0.08;
            this.camera.rotY += (this.camera.targetRotY - this.camera.rotY) * 0.08;

            // Frontal Viewport Lock: No 360-degree spinning. Movements remain strictly facing forward.
            if (!this.mouse.isDown) {
                // Return smoothly to center forward-facing orientation with subtle organic breathing sway
                const frontalBreathingSway = Math.sin(performance.now() * 0.0012) * 0.025;
                this.camera.targetRotY += (frontalBreathingSway - this.camera.targetRotY) * 0.06;
                this.camera.targetRotX += (0.12 - this.camera.targetRotX) * 0.06;
            }

            // Particle movement speed modulation
            const speedMultiplier = (this.mode === 'ANALYZING' || this.mode === 'MODEL_RUNNING' || this.mode === 'LEARNING') ? 1.4 : 0.85;

            this.particles.forEach(p => {
                p.progress += p.speed * speedMultiplier;
                if (p.progress >= 1) {
                    p.progress = 0;
                    if (this.links.length > 0) {
                        p.link = this.links[Math.floor(Math.random() * this.links.length)];
                    }
                }
            });
        }

        _render() {
            const ctx = this.ctx;
            if (!ctx) return;

            ctx.clearRect(0, 0, this.width, this.height);

            // Check if landing empty state with upload dropzone is active
            const isLandingDropzone = typeof document !== 'undefined' && !!document.getElementById('udip-dropzone');

            // 1. Draw Links & Data Stream Particles (if in hybrid or network mode, and not on landing dropzone)
            if (this.displayMode !== 'robot' && !isLandingDropzone) {
                this.links.forEach(link => {
                    const pFrom = this._project(link.from.x, link.from.y, link.from.z);
                    const pTo = this._project(link.to.x, link.to.y, link.to.z);
                    if (!pFrom || !pTo) return;

                    // Emphasize pipeline ring links vs spokes
                    if (link.isPipeline) {
                        ctx.lineWidth = 1.2;
                        if (this.mode === 'ANALYZING' || this.mode === 'LEARNING') ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
                        else if (this.mode === 'ANOMALY_DETECTED' || this.mode === 'ALERT') ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
                        else if (this.mode === 'UNCERTAINTY') ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
                        else ctx.strokeStyle = link.color;
                    } else {
                        ctx.lineWidth = 0.8;
                        ctx.strokeStyle = link.color;
                    }

                    ctx.beginPath();
                    ctx.moveTo(pFrom.x, pFrom.y);
                    ctx.lineTo(pTo.x, pTo.y);
                    ctx.stroke();
                });

                // Draw Data Stream Particles (Ultra-sleek in-line laser pulses strictly along the line conduits)
                this.particles.forEach(p => {
                    if (!p.link) return;
                    const pFrom = this._project(p.link.from.x, p.link.from.y, p.link.from.z);
                    const pTo = this._project(p.link.to.x, p.link.to.y, p.link.to.z);
                    if (!pFrom || !pTo) return;

                    const curX = pFrom.x + (pTo.x - pFrom.x) * p.progress;
                    const curY = pFrom.y + (pTo.y - pFrom.y) * p.progress;

                    // Compute trailing laser tail strictly along the line segment
                    const tailProgress = Math.max(0, p.progress - 0.08);
                    const tailX = pFrom.x + (pTo.x - pFrom.x) * tailProgress;
                    const tailY = pFrom.y + (pTo.y - pFrom.y) * tailProgress;

                    ctx.strokeStyle = p.color || '#38bdf8';
                    ctx.lineWidth = 1.8;
                    ctx.beginPath();
                    ctx.moveTo(tailX, tailY);
                    ctx.lineTo(curX, curY);
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(curX, curY, 1.8, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            // 2. Render 3D Cybernetic AI Robot (in hybrid and robot modes)
            if (this.displayMode !== 'network') {
                this._renderRobot3D(ctx);
            }

            // 3. Draw Nodes (if in hybrid or network mode, and not on landing dropzone)
            if (this.displayMode !== 'robot' && !isLandingDropzone) {
                const projectedNodes = this.nodes.map(node => {
                    const proj = this._project(node.x, node.y, node.z);
                    return { node, proj };
                }).filter(item => item.proj !== null);

                // Sort back to front for depth realism
                projectedNodes.sort((a, b) => a.proj.depth - b.proj.depth);

                projectedNodes.forEach(({ node, proj }) => {
                    // Suppress center nucleus node in hybrid mode to keep focus on 3D robot
                    if (this.displayMode === 'hybrid' && (node.role === 'nucleus' || node.id === 'ai_core_central' || node.id === 'core_nucleus')) {
                        return;
                    }

                    // Sleek precision micro-dot radius (1.2px - 2.0px max, never balloons into large bubbles)
                    const radius = Math.min(2.0, Math.max(1.2, (node.baseRadius || 6) * proj.scale * 0.20));
                    const alpha = Math.min(1, Math.max(0.35, (proj.scale * 0.85)));

                    // Reactive node highlight
                    let nodeColor = node.color;
                    let isHighlighted = false;

                    if (this.mode === 'MODEL_RUNNING' && node.id === 'stage_ml') {
                        isHighlighted = true;
                        nodeColor = '#c084fc';
                    } else if ((this.mode === 'ANOMALY_DETECTED' || this.mode === 'ALERT') && (node.id === 'stage_profiling' || node.id === 'stage_autonomous' || node.id === 'kn_feedback')) {
                        isHighlighted = true;
                        nodeColor = '#f87171';
                    } else if (this.mode === 'COPILOT_ACTIVE' && (node.id === 'core_nucleus' || node.id === 'ai_core_central' || node.id === 'stage_decision')) {
                        isHighlighted = true;
                        nodeColor = '#38bdf8';
                    } else if (this.mode === 'LEARNING' && (node.role === 'knowledge_formed' || node.id === 'kn_learned' || node.id === 'stage_autonomous')) {
                        isHighlighted = true;
                        nodeColor = '#e879f9';
                    } else if (this.mode === 'VALIDATING' && (node.id === 'kn_evidence' || node.role === 'knowledge_formed')) {
                        isHighlighted = true;
                        nodeColor = '#34d399';
                    } else if (this.mode === 'UNCERTAINTY' && (node.role === 'knowledge_formed' || node.id === 'kn_models' || node.id === 'kn_findings' || node.id === 'stage_ml')) {
                        isHighlighted = true;
                        nodeColor = '#fbbf24';
                    }

                    // Sharp Micro Point (Zero blurry glow halos)
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = nodeColor;
                    ctx.fill();

                    // Clean micro-point without outer bubble rings

                    // Node Labels
                    if (proj.scale > 0.65 && node.role !== 'nucleus') {
                        // In hybrid mode, suppress labels if the node is right in front of the robot's face
                        if (this.displayMode === 'hybrid' && Math.abs(proj.x - this.width / 2) < 65 && Math.abs(proj.y - (this.height / 2 - 25)) < 60) {
                            return;
                        }
                        const isStage = node.role === 'stage' || node.role === 'knowledge_layer';
                        ctx.font = isStage 
                            ? `800 ${Math.round(11.5 * proj.scale)}px "JetBrains Mono", monospace`
                            : `600 ${Math.round(9.5 * proj.scale)}px "JetBrains Mono", monospace`;
                        ctx.fillStyle = isStage 
                            ? (isHighlighted ? '#ffffff' : `rgba(241, 245, 249, ${alpha * 0.95})`)
                            : `rgba(203, 213, 225, ${alpha * 0.8})`;
                        ctx.textAlign = 'center';
                        ctx.fillText(node.label, proj.x, proj.y + radius + (isStage ? 13 : 10));
                    }
                });

                // Center Nucleus Atmospheric Ring (network mode)
                if (this.displayMode === 'network') {
                    const nucleus = projectedNodes.find(n => n.node.role === 'nucleus');
                    if (nucleus) {
                        const pulseTime = performance.now() * 0.002;
                        const pulseRad = (nucleus.node.baseRadius * 2.6 + Math.sin(pulseTime) * 3.5) * nucleus.proj.scale;
                        ctx.strokeStyle = (this.mode === 'ANOMALY_DETECTED' || this.mode === 'ALERT' || this.mode === 'ERROR')
                            ? 'rgba(239, 68, 68, 0.7)'
                            : (this.mode === 'MODEL_RUNNING' ? 'rgba(168, 85, 247, 0.7)' : (this.mode === 'UNCERTAINTY' ? 'rgba(245, 158, 11, 0.7)' : 'rgba(56, 189, 248, 0.6)'));
                        ctx.lineWidth = 1.6;
                        ctx.beginPath();
                        ctx.arc(nucleus.proj.x, nucleus.proj.y, Math.max(5, pulseRad), 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
            }
        }
    }

    window.UDIP.IntelligenceCore = new IntelligenceCoreVisualizer();
    window.UDIP.IntelligenceCoreVisualizer = IntelligenceCoreVisualizer;

})(typeof window !== 'undefined' ? window : global);
