/**
 * ============================================================================
 * UDIP 3D AI RESEARCH LABORATORY — SPATIAL SUBSYSTEM
 * Module: js/ui/command-center/spatial/ai-brain.js
 * ============================================================================
 * Cinematic Holographic AI Brain:
 * - Dual anatomical cerebral hemispheres (Left & Right lobes)
 * - Procedural gyri and sulci (cerebral folds) with volumetric depth
 * - Semi-transparent biological-computational holographic membrane
 * - Internal neural pathways with 350+ synaptic bezier filaments
 * - 1,400+ micro-particles (dendritic clusters & surface charges)
 * - 45 active traveling neural impulses with radiant synaptic terminus discharge
 * - 5 dynamic functional processing lobes:
 *     1. Data Processing (Frontal)
 *     2. Pattern Discovery (Temporal)
 *     3. Anomaly Detection (Parietal)
 *     4. Predictive Modeling (Occipital)
 *     5. Epistemic Validation (Cerebellum)
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.SpatialAIBrain = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class SpatialAIBrain {
        constructor() {
            this.scene = null;
            this.group = null;

            // Hemispheres
            this.leftLobe = null;
            this.rightLobe = null;
            this.lobeMaterials = [];

            // Internal Fibers & Particles
            this.fiberLines = null;
            this.fiberGeo = null;
            this.dendritePoints = null;
            this.dendriteGeo = null;

            // Impulses
            this.impulses = [];
            this.impulsePoints = null;
            this.impulseGeo = null;

            // Regions
            this.regions = {};
            this.activeRegions = {};

            // Gyroscopic Astrolabe Rings
            this.astrolabeRings = [];

            // Internal Nucleus Core
            this.innerCore = null;
            this.outerHalo = null;

            // Dynamics
            this.pulse = 1.0;
            this.excitement = 0.0;
            this.baseRadius = 68;
        }

        init(scene, dataset = null) {
            this.scene = scene;
            const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE) || null;
            if (!THREE || !this.scene) return this;

            this.group = new THREE.Group();
            this.group.position.set(0, 15, 0);

            const colCount = (dataset && dataset.columns) ? dataset.columns.length : 10;
            this.baseRadius = Math.max(62, Math.min(88, 62 + colCount * 1.5));

            // -------------------------------------------------------------
            // 1. DUAL ANATOMICAL CEREBRAL HEMISPHERES WITH FOLDS
            // -------------------------------------------------------------
            const makeHemisphereGeo = (isRight = false) => {
                // Sphere deformed to anatomical cerebral proportions
                const geo = new THREE.SphereGeometry(this.baseRadius, 36, 32);
                const pos = geo.attributes.position;
                const v = new THREE.Vector3();

                for (let i = 0; i < pos.count; i++) {
                    v.fromBufferAttribute(pos, i);

                    // Normalize
                    const len = v.length();
                    const nx = v.x / len;
                    const ny = v.y / len;
                    const nz = v.z / len;

                    // Fold frequency: Gyri and Sulci harmonics
                    const fold1 = Math.sin(nx * 9.0 + ny * 6.0) * Math.cos(nz * 8.0);
                    const fold2 = Math.sin(ny * 12.0 + nz * 10.0) * 0.45;
                    const foldDisp = (fold1 + fold2) * (this.baseRadius * 0.09);

                    // Anatomical brain shaping: elongated front-to-back, compressed laterally
                    let sx = 0.88;
                    let sy = 0.95;
                    let sz = 1.22;

                    // Hemisphere separation (interhemispheric fissure)
                    const sideShift = isRight ? 6.5 : -6.5;
                    if (isRight && nx < 0) sx *= 0.82;
                    if (!isRight && nx > 0) sx *= 0.82;

                    v.x = (v.x * sx) + (nx * foldDisp) + sideShift;
                    v.y = (v.y * sy) + (ny * foldDisp);
                    v.z = (v.z * sz) + (nz * foldDisp);

                    pos.setXYZ(i, v.x, v.y, v.z);
                }

                geo.computeVertexNormals();
                return geo;
            };

            const lobeMatLeft = new THREE.MeshStandardMaterial({
                color: 0x38bdf8,
                emissive: 0x075985,
                emissiveIntensity: 0.4,
                roughness: 0.25,
                metalness: 0.15,
                transparent: true,
                opacity: 0.32,
                wireframe: false,
                side: THREE.DoubleSide,
                depthWrite: false
            });

            const lobeMatRight = lobeMatLeft.clone();
            lobeMatRight.emissive.setHex(0x1e40af);

            this.lobeMaterials = [lobeMatLeft, lobeMatRight];

            this.leftLobe = new THREE.Mesh(makeHemisphereGeo(false), lobeMatLeft);
            this.rightLobe = new THREE.Mesh(makeHemisphereGeo(true), lobeMatRight);

            this.group.add(this.leftLobe);
            this.group.add(this.rightLobe);

            // -------------------------------------------------------------
            // 2. INNER DENSE COMPUTATIONAL NUCLEUS CORE
            // -------------------------------------------------------------
            const coreGeo = new THREE.SphereGeometry(this.baseRadius * 0.35, 24, 20);
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.65,
                wireframe: true
            });
            this.innerCore = new THREE.Mesh(coreGeo, coreMat);
            this.group.add(this.innerCore);

            const haloGeo = new THREE.SphereGeometry(this.baseRadius * 1.15, 24, 20);
            const haloMat = new THREE.MeshBasicMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.12,
                wireframe: true,
                depthWrite: false
            });
            this.outerHalo = new THREE.Mesh(haloGeo, haloMat);
            this.group.add(this.outerHalo);

            // -------------------------------------------------------------
            // 3. SYNAPTIC NEURAL FIBER PATHWAYS
            // -------------------------------------------------------------
            const fiberCount = 180;
            const fiberPoints = [];
            this.fiberCurves = [];

            for (let i = 0; i < fiberCount; i++) {
                // Random pairs on internal surface
                const theta1 = Math.random() * Math.PI * 2;
                const phi1 = Math.acos(2 * Math.random() - 1);
                const r1 = this.baseRadius * 0.75;
                const p1 = new THREE.Vector3(
                    r1 * Math.sin(phi1) * Math.cos(theta1),
                    r1 * Math.sin(phi1) * Math.sin(theta1) * 0.9,
                    r1 * Math.cos(phi1) * 1.1
                );

                const theta2 = theta1 + (Math.random() - 0.5) * 1.8;
                const phi2 = phi1 + (Math.random() - 0.5) * 1.4;
                const r2 = this.baseRadius * 0.75;
                const p2 = new THREE.Vector3(
                    r2 * Math.sin(phi2) * Math.cos(theta2),
                    r2 * Math.sin(phi2) * Math.sin(theta2) * 0.9,
                    r2 * Math.cos(phi2) * 1.1
                );

                // Control point pulls toward computational core
                const mid = p1.clone().add(p2).multiplyScalar(0.42);

                const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
                this.fiberCurves.push(curve);

                // Sample points for line buffer
                const pts = curve.getPoints(12);
                for (let k = 0; k < pts.length - 1; k++) {
                    fiberPoints.push(pts[k].x, pts[k].y, pts[k].z);
                    fiberPoints.push(pts[k+1].x, pts[k+1].y, pts[k+1].z);
                }
            }

            this.fiberGeo = new THREE.BufferGeometry();
            this.fiberGeo.setAttribute('position', new THREE.Float32BufferAttribute(fiberPoints, 3));

            const fiberMat = new THREE.LineBasicMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.35,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            this.fiberLines = new THREE.LineSegments(this.fiberGeo, fiberMat);
            this.group.add(this.fiberLines);

            // -------------------------------------------------------------
            // 4. DENDRITE SURFACE PARTICLES (1,200 micro charges)
            // -------------------------------------------------------------
            const dendriteCount = 1200;
            const dendritePos = new Float32Array(dendriteCount * 3);
            const dendriteCol = new Float32Array(dendriteCount * 3);

            for (let i = 0; i < dendriteCount; i++) {
                const u = Math.random() * Math.PI * 2;
                const v = Math.acos(2 * Math.random() - 1);
                const r = this.baseRadius * (0.82 + Math.random() * 0.28);

                dendritePos[i * 3] = r * Math.sin(v) * Math.cos(u) * 0.88;
                dendritePos[i * 3 + 1] = r * Math.sin(v) * Math.sin(u) * 0.95;
                dendritePos[i * 3 + 2] = r * Math.cos(v) * 1.18;

                // Color palette: Cyan / Violet / Emerald / White
                const cPick = Math.random();
                if (cPick > 0.6) {
                    dendriteCol[i * 3] = 0.22; dendriteCol[i * 3 + 1] = 0.74; dendriteCol[i * 3 + 2] = 0.97;
                } else if (cPick > 0.3) {
                    dendriteCol[i * 3] = 0.51; dendriteCol[i * 3 + 1] = 0.55; dendriteCol[i * 3 + 2] = 0.98;
                } else if (cPick > 0.1) {
                    dendriteCol[i * 3] = 0.06; dendriteCol[i * 3 + 1] = 0.72; dendriteCol[i * 3 + 2] = 0.51;
                } else {
                    dendriteCol[i * 3] = 0.95; dendriteCol[i * 3 + 1] = 0.98; dendriteCol[i * 3 + 2] = 1.00;
                }
            }

            this.dendriteGeo = new THREE.BufferGeometry();
            this.dendriteGeo.setAttribute('position', new THREE.BufferAttribute(dendritePos, 3));
            this.dendriteGeo.setAttribute('color', new THREE.BufferAttribute(dendriteCol, 3));

            const dendriteMat = new THREE.PointsMaterial({
                size: 2.4,
                vertexColors: true,
                transparent: true,
                opacity: 0.75,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            this.dendritePoints = new THREE.Points(this.dendriteGeo, dendriteMat);
            this.group.add(this.dendritePoints);

            // -------------------------------------------------------------
            // 5. TRAVELING NEURAL IMPULSES (Parametric fiber traversers)
            // -------------------------------------------------------------
            const impulseCount = 50;
            this.impulses = [];
            const impulsePos = new Float32Array(impulseCount * 3);

            for (let i = 0; i < impulseCount; i++) {
                const curveIdx = Math.floor(Math.random() * this.fiberCurves.length);
                this.impulses.push({
                    curveIdx: curveIdx,
                    t: Math.random(),
                    speed: 0.012 + Math.random() * 0.018,
                    index: i
                });
            }

            this.impulseGeo = new THREE.BufferGeometry();
            this.impulseGeo.setAttribute('position', new THREE.BufferAttribute(impulsePos, 3));

            const impulseMat = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 4.8,
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            this.impulsePoints = new THREE.Points(this.impulseGeo, impulseMat);
            this.group.add(this.impulsePoints);

            // -------------------------------------------------------------
            // 6. 5 FUNCTIONAL REGIONAL BRAIN NODES
            // -------------------------------------------------------------
            const regionDefs = [
                { id: 'DATA_PROCESSING', label: 'FRONTAL: INGESTION', color: 0x38bdf8, pos: [-22, 38, 38] },
                { id: 'PATTERN_DISCOVERY', label: 'TEMPORAL: PATTERNS', color: 0x818cf8, pos: [38, 12, 10] },
                { id: 'ANOMALY_DETECTION', label: 'PARIETAL: ANOMALIES', color: 0xef4444, pos: [0, 48, -35] },
                { id: 'PREDICTION', label: 'OCCIPITAL: PREDICTION', color: 0xc084fc, pos: [-28, -25, -30] },
                { id: 'VALIDATION', label: 'CEREBELLUM: VALIDATION', color: 0x10b981, pos: [28, -32, -25] }
            ];

            regionDefs.forEach(r => {
                const markerGeo = new THREE.SphereGeometry(6.5, 16, 16);
                const markerMat = new THREE.MeshBasicMaterial({
                    color: r.color,
                    transparent: true,
                    opacity: 0.45,
                    wireframe: true
                });
                const mesh = new THREE.Mesh(markerGeo, markerMat);
                mesh.position.set(r.pos[0], r.pos[1], r.pos[2]);

                const halo = new THREE.Mesh(
                    new THREE.SphereGeometry(12, 12, 12),
                    new THREE.MeshBasicMaterial({ color: r.color, transparent: true, opacity: 0.15, wireframe: true })
                );
                mesh.add(halo);

                this.group.add(mesh);
                this.regions[r.id] = {
                    mesh: mesh,
                    halo: halo,
                    baseColor: r.color,
                    glow: 0.45
                };
            });

            // -------------------------------------------------------------
            // 7. GYROSCOPIC ASTROLABE MULTI-AXIS DATA RINGS
            // -------------------------------------------------------------
            this.astrolabeRings = [];
            const ringConfigs = [
                { r: this.baseRadius * 1.25, thick: 1.4, color: 0x38bdf8, speedX: 0.007, speedY: 0.004, speedZ: 0.002 },
                { r: this.baseRadius * 1.42, thick: 1.2, color: 0x818cf8, speedX: -0.003, speedY: 0.008, speedZ: -0.004 },
                { r: this.baseRadius * 1.58, thick: 1.5, color: 0x10b981, speedX: 0.005, speedY: -0.005, speedZ: 0.009 }
            ];

            ringConfigs.forEach((rc, rIdx) => {
                const ringGroup = new THREE.Group();
                const ringGeo = new THREE.RingGeometry(rc.r, rc.r + rc.thick, 64);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: rc.color,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.55,
                    blending: THREE.AdditiveBlending
                });
                const ringMesh = new THREE.Mesh(ringGeo, ringMat);
                ringGroup.add(ringMesh);

                // 12 laser telemetry tick nodules per ring
                const tickCount = 12;
                for (let k = 0; k < tickCount; k++) {
                    const ang = (k / tickCount) * Math.PI * 2;
                    const tx = Math.cos(ang) * rc.r;
                    const ty = Math.sin(ang) * rc.r;
                    const dot = new THREE.Mesh(
                        new THREE.SphereGeometry(1.6, 8, 8),
                        new THREE.MeshBasicMaterial({ color: 0xffffff })
                    );
                    dot.position.set(tx, ty, 0);
                    ringGroup.add(dot);
                }

                // Distinct gimbal plane inclinations
                if (rIdx === 0) ringGroup.rotation.x = Math.PI / 4;
                if (rIdx === 1) ringGroup.rotation.y = Math.PI / 3;
                if (rIdx === 2) ringGroup.rotation.z = Math.PI / 6;

                this.group.add(ringGroup);
                this.astrolabeRings.push({
                    group: ringGroup,
                    speedX: rc.speedX,
                    speedY: rc.speedY,
                    speedZ: rc.speedZ
                });
            });

            this.scene.add(this.group);
            return this;
        }

        activateRegion(regionName, durationMs = 2500) {
            const reg = this.regions[regionName];
            if (reg) {
                reg.glow = 1.0;
                reg.mesh.material.opacity = 0.95;
                reg.halo.material.opacity = 0.55;
                reg.mesh.scale.set(1.4, 1.4, 1.4);
                this.activeRegions[regionName] = Date.now() + durationMs;
            }
        }

        setExcitement(level = 1.0) {
            this.excitement = Math.max(0.0, Math.min(1.0, level));
        }

        update(dt = 0.016, now = Date.now()) {
            if (!this.group) return;

            // 1. Biological Respiration (f1 = 0.0018Hz, f2 = 0.0042Hz)
            const resp1 = Math.sin(now * 0.0018) * 0.028;
            const resp2 = Math.cos(now * 0.0042) * 0.014;
            const excitePulse = this.excitement * Math.sin(now * 0.009) * 0.055;
            this.pulse = 1.0 + resp1 + resp2 + excitePulse;

            this.group.scale.set(this.pulse, this.pulse, this.pulse);

            // Subtle computational idle yaw & pitch drift
            this.group.rotation.y = Math.sin(now * 0.0004) * 0.15;
            this.group.rotation.x = Math.cos(now * 0.0006) * 0.06;

            // Inner core counter-rotation
            if (this.innerCore) {
                this.innerCore.rotation.y += 0.015;
                this.innerCore.rotation.x += 0.008;
            }
            if (this.outerHalo) {
                this.outerHalo.rotation.y -= 0.004;
            }

            // Excitement decay
            if (this.excitement > 0.01) {
                this.excitement *= 0.985;
            } else {
                this.excitement = 0.0;
            }

            // 2. Animate Traveling Neural Impulses
            if (this.impulseGeo && this.fiberCurves.length > 0) {
                const posAttr = this.impulseGeo.getAttribute('position');
                const pArr = posAttr.array;
                const speedBoost = 1.0 + this.excitement * 2.0;

                for (let i = 0; i < this.impulses.length; i++) {
                    const imp = this.impulses[i];
                    imp.t += imp.speed * speedBoost;

                    if (imp.t >= 1.0) {
                        imp.t = 0.0;
                        imp.curveIdx = Math.floor(Math.random() * this.fiberCurves.length);
                    }

                    const curve = this.fiberCurves[imp.curveIdx];
                    if (curve) {
                        const pt = curve.getPoint(imp.t);
                        pArr[i * 3] = pt.x;
                        pArr[i * 3 + 1] = pt.y;
                        pArr[i * 3 + 2] = pt.z;
                    }
                }
                posAttr.needsUpdate = true;
            }

            // 3. Update Functional Regions
            Object.keys(this.regions).forEach(key => {
                const reg = this.regions[key];
                const activeUntil = this.activeRegions[key];

                if (activeUntil && now < activeUntil) {
                    // Pulsing active region
                    const p = 1.0 + Math.sin(now * 0.015) * 0.25;
                    reg.mesh.scale.set(p, p, p);
                } else {
                    if (reg.glow > 0.45) {
                        reg.glow *= 0.96;
                        reg.mesh.material.opacity = reg.glow;
                        reg.halo.material.opacity = reg.glow * 0.35;
                        reg.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05);
                    }
                }
            });

            // 4. Rotate Gyroscopic Astrolabe Data Rings
            const ringAccel = 1.0 + this.excitement * 3.0;
            this.astrolabeRings.forEach(ring => {
                ring.group.rotation.x += ring.speedX * ringAccel;
                ring.group.rotation.y += ring.speedY * ringAccel;
                ring.group.rotation.z += ring.speedZ * ringAccel;
            });
        }

        destroy() {
            if (this.scene && this.group) {
                this.scene.remove(this.group);
                if (this.leftLobe) {
                    this.leftLobe.geometry.dispose();
                    this.leftLobe.material.dispose();
                }
                if (this.rightLobe) {
                    this.rightLobe.geometry.dispose();
                    this.rightLobe.material.dispose();
                }
                if (this.fiberGeo) this.fiberGeo.dispose();
                if (this.dendriteGeo) this.dendriteGeo.dispose();
                if (this.impulseGeo) this.impulseGeo.dispose();
            }
            this.regions = {};
            this.impulses = [];
            this.fiberCurves = [];
            this.group = null;
            this.scene = null;
        }
    }

    return SpatialAIBrain;
}));
