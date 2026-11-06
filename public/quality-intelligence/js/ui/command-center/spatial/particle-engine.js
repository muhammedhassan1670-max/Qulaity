/**
 * ============================================================================
 * UDIP 3D AI RESEARCH LABORATORY — SPATIAL SUBSYSTEM
 * Module: js/ui/command-center/spatial/particle-engine.js
 * ============================================================================
 * GPU-Accelerated Particle & Volumetric Stream Engine:
 * - 5 Volumetric physical data conduits:
 *     1. Raw Ingestion Stream (Blue #38bdf8): External horizon -> AI Brain
 *     2. Processing Stream (Cyan #06b6d4): AI Brain -> 3D Neural Network
 *     3. Machine Learning Inference Stream (Purple #a855f7): NN -> Model Chamber
 *     4. Anomaly Destabilization Stream (Amber/Red #f59e0b): Branching to Agent-02
 *     5. Validated Insight Stream (Emerald #10b981): Stable consensus output
 * - Volumetric cubic spline path traversal with dynamic acceleration
 * - Atmospheric floating dust/motes in the laboratory volume
 * - Instanced BufferGeometry for maximum 60FPS throughput
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.SpatialParticleEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class SpatialParticleEngine {
        constructor() {
            this.scene = null;
            this.streamPoints = null;
            this.streamGeo = null;
            this.streamMat = null;
            this.streamParticles = [];

            this.dustPoints = null;
            this.dustGeo = null;
            this.dustMat = null;

            this.anomalyActive = false;
            this.excitementLevel = 0.0;
        }

        init(scene) {
            this.scene = scene;
            const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE) || null;
            if (!THREE || !this.scene) return this;

            // -------------------------------------------------------------
            // 1. DATA CONDUIT STREAMS (Volumetric particle splines)
            // -------------------------------------------------------------
            const streamConfigs = [
                // 0: Raw Data -> Brain
                { id: 'RAW', count: 70, color: [0.22, 0.74, 0.97], speed: 0.007,
                  p0: [-320, 80, -100], p1: [-180, 50, -30], p2: [-80, 20, 10], p3: [0, 15, 0] },
                // 1: Brain -> Neural Network
                { id: 'PROC', count: 60, color: [0.02, 0.71, 0.83], speed: 0.009,
                  p0: [0, 15, 0], p1: [40, 60, -60], p2: [120, 80, -120], p3: [190, 70, -160] },
                // 2: Neural Net -> ML Chamber
                { id: 'ML', count: 65, color: [0.66, 0.33, 0.97], speed: 0.011,
                  p0: [190, 70, -160], p1: [140, 10, -100], p2: [60, -40, -40], p3: [0, -50, 40] },
                // 3: Anomaly / Counter-Evidence (Branch to Agent-02)
                { id: 'ANOMALY', count: 45, color: [0.96, 0.62, 0.04], speed: 0.013,
                  p0: [0, 15, 0], p1: [80, 50, 20], p2: [160, 40, 40], p3: [210, 35, 60] },
                // 4: Validated Insight (Agent-02 -> Executive HUD)
                { id: 'INSIGHT', count: 55, color: [0.06, 0.72, 0.51], speed: 0.008,
                  p0: [210, 35, 60], p1: [160, -20, 80], p2: [80, -60, 120], p3: [-20, -70, 160] }
            ];

            let totalStreamParticles = 0;
            streamConfigs.forEach(cfg => totalStreamParticles += cfg.count);

            const streamPositions = new Float32Array(totalStreamParticles * 3);
            const streamColors = new Float32Array(totalStreamParticles * 3);

            let pIndex = 0;
            this.streamParticles = [];

            streamConfigs.forEach(cfg => {
                for (let i = 0; i < cfg.count; i++) {
                    const t = i / cfg.count;
                    this.streamParticles.push({
                        streamId: cfg.id,
                        t: t,
                        baseSpeed: cfg.speed * (0.8 + Math.random() * 0.4),
                        speed: cfg.speed,
                        color: cfg.color,
                        radiusOffset: (Math.random() - 0.5) * 8.0,
                        radialAngle: Math.random() * Math.PI * 2,
                        p0: cfg.p0, p1: cfg.p1, p2: cfg.p2, p3: cfg.p3,
                        index: pIndex
                    });

                    // Initial position
                    streamPositions[pIndex * 3] = 0;
                    streamPositions[pIndex * 3 + 1] = 0;
                    streamPositions[pIndex * 3 + 2] = 0;

                    streamColors[pIndex * 3] = cfg.color[0];
                    streamColors[pIndex * 3 + 1] = cfg.color[1];
                    streamColors[pIndex * 3 + 2] = cfg.color[2];

                    pIndex++;
                }
            });

            this.streamGeo = new THREE.BufferGeometry();
            this.streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
            this.streamGeo.setAttribute('color', new THREE.BufferAttribute(streamColors, 3));

            this.streamMat = new THREE.PointsMaterial({
                size: 4.5,
                vertexColors: true,
                transparent: true,
                opacity: 0.88,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            this.streamPoints = new THREE.Points(this.streamGeo, this.streamMat);
            this.scene.add(this.streamPoints);

            // -------------------------------------------------------------
            // 2. ATMOSPHERIC LABORATORY PARTICLES (Distant dust motes)
            // -------------------------------------------------------------
            const dustCount = 450;
            const dustPositions = new Float32Array(dustCount * 3);
            this.dustVelocities = [];

            for (let i = 0; i < dustCount; i++) {
                dustPositions[i * 3] = (Math.random() - 0.5) * 700;
                dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 450;
                dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 550;

                this.dustVelocities.push({
                    vx: (Math.random() - 0.5) * 0.12,
                    vy: (Math.random() - 0.5) * 0.08,
                    vz: (Math.random() - 0.5) * 0.12
                });
            }

            this.dustGeo = new THREE.BufferGeometry();
            this.dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

            this.dustMat = new THREE.PointsMaterial({
                color: 0x38bdf8,
                size: 2.2,
                transparent: true,
                opacity: 0.35,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            this.dustPoints = new THREE.Points(this.dustGeo, this.dustMat);
            this.scene.add(this.dustPoints);

            return this;
        }

        // Cubic Bézier curve evaluation in 3D
        _bezier(p0, p1, p2, p3, t) {
            const u = 1 - t;
            const tt = t * t;
            const uu = u * u;
            const uuu = uu * u;
            const ttt = tt * t;

            return {
                x: uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0],
                y: uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1],
                z: uuu * p0[2] + 3 * uu * t * p1[2] + 3 * u * tt * p2[2] + ttt * p3[2]
            };
        }

        update(dt = 0.016, now = Date.now(), excitement = 0.0) {
            this.excitementLevel = excitement;

            // 1. Update data streams
            if (this.streamGeo) {
                const posAttr = this.streamGeo.getAttribute('position');
                const colAttr = this.streamGeo.getAttribute('color');
                const positions = posAttr.array;
                const colors = colAttr.array;

                const speedMul = 1.0 + this.excitementLevel * 1.5;

                for (let i = 0; i < this.streamParticles.length; i++) {
                    const sp = this.streamParticles[i];
                    sp.t += sp.baseSpeed * speedMul;
                    if (sp.t > 1.0) sp.t = 0.0;

                    // Evaluate main path point
                    const pt = this._bezier(sp.p0, sp.p1, sp.p2, sp.p3, sp.t);

                    // Add subtle volumetric helical displacement
                    sp.radialAngle += 0.04;
                    const r = sp.radiusOffset * Math.sin(sp.t * Math.PI);
                    const dx = Math.cos(sp.radialAngle) * r;
                    const dy = Math.sin(sp.radialAngle) * r;

                    const idx = sp.index * 3;
                    positions[idx] = pt.x + dx;
                    positions[idx + 1] = pt.y + dy;
                    positions[idx + 2] = pt.z;

                    // Color flares if anomaly stream
                    if (sp.streamId === 'ANOMALY' && this.anomalyActive) {
                        colors[idx] = 0.98;
                        colors[idx + 1] = 0.2;
                        colors[idx + 2] = 0.2;
                    } else {
                        colors[idx] = sp.color[0];
                        colors[idx + 1] = sp.color[1];
                        colors[idx + 2] = sp.color[2];
                    }
                }

                posAttr.needsUpdate = true;
                colAttr.needsUpdate = true;
            }

            // 2. Update atmospheric dust
            if (this.dustGeo) {
                const dPosAttr = this.dustGeo.getAttribute('position');
                const dPos = dPosAttr.array;

                for (let i = 0; i < this.dustVelocities.length; i++) {
                    const v = this.dustVelocities[i];
                    const idx = i * 3;

                    dPos[idx] += v.vx;
                    dPos[idx + 1] += v.vy;
                    dPos[idx + 2] += v.vz;

                    // Soft boundary wrap
                    if (dPos[idx] > 350) dPos[idx] = -350;
                    if (dPos[idx] < -350) dPos[idx] = 350;
                    if (dPos[idx + 1] > 225) dPos[idx + 1] = -225;
                    if (dPos[idx + 1] < -225) dPos[idx + 1] = 225;
                    if (dPos[idx + 2] > 275) dPos[idx + 2] = -275;
                    if (dPos[idx + 2] < -275) dPos[idx + 2] = 275;
                }

                dPosAttr.needsUpdate = true;
            }
        }

        setAnomalyAlert(active) {
            this.anomalyActive = !!active;
        }

        destroy() {
            if (this.scene) {
                if (this.streamPoints) {
                    this.scene.remove(this.streamPoints);
                    if (this.streamGeo) this.streamGeo.dispose();
                    if (this.streamMat) this.streamMat.dispose();
                }
                if (this.dustPoints) {
                    this.scene.remove(this.dustPoints);
                    if (this.dustGeo) this.dustGeo.dispose();
                    if (this.dustMat) this.dustMat.dispose();
                }
            }
            this.streamParticles = [];
            this.dustVelocities = [];
            this.scene = null;
        }
    }

    return SpatialParticleEngine;
}));
