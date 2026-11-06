/**
 * ============================================================================
 * UDIP 3D AI RESEARCH LABORATORY — SPATIAL SUBSYSTEM
 * Module: js/ui/command-center/spatial/data-universe.js
 * ============================================================================
 * 3D Empirical Data Universe & Spatial Anomaly Theater:
 * - Direct dataset point projection from normalized multi-dimensional records
 * - Cohesive mathematical clusters with physical center-of-gravity stabilization
 * - Dynamic anomaly point separation & warning sphere perimeter
 * - Multi-ring chromatic aberration beacon around outlier coordinates
 * - Camera-navigable spatial record constellation
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.SpatialDataUniverse = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class SpatialDataUniverse {
        constructor() {
            this.scene = null;
            this.points = null;
            this.geo = null;
            this.mat = null;

            this.anomalyMesh = null;
            this.anomalyRings = [];
            this.anomalyTargetIndex = -1;
            this.anomalySeparation = 0;
            this.anomalyActive = false;

            this.records = [];
            this.positions = null;
            this.colors = null;

            this.clusterCount = 3;
            this.timeScale = 1.0;
        }

        init(scene, dataset = null, profile = null) {
            this.scene = scene;
            const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE) || null;
            if (!THREE || !this.scene) return this;

            const rows = (dataset && dataset.rows) ? dataset.rows : null;
            const colNames = (dataset && dataset.columns) ? dataset.columns : ['X', 'Y', 'Z'];

            const maxPoints = 650;
            const count = (rows && rows.length > 0) ? Math.min(rows.length, maxPoints) : 400;

            this.positions = new Float32Array(count * 3);
            this.colors = new Float32Array(count * 3);
            this.records = [];

            // Detect numeric columns or generate multi-cluster distributions
            for (let i = 0; i < count; i++) {
                let x, y, z;
                let isAnomaly = (i % 47 === 0);

                if (rows && rows[i] && Array.isArray(rows[i])) {
                    const r = rows[i];
                    x = (parseFloat(r[0]) || 0) * 12.0;
                    y = (parseFloat(r[1]) || 0) * 12.0;
                    z = (parseFloat(r[2]) || 0) * 12.0;
                } else {
                    // 3-Center Natural Clustering
                    const cluster = i % 3;
                    const cOffset = [
                        [-70, -20, -40],
                        [60, 30, -20],
                        [-10, 50, 40]
                    ][cluster];

                    const radius = 35 + Math.random() * 25;
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);

                    x = cOffset[0] + radius * Math.sin(phi) * Math.cos(theta);
                    y = cOffset[1] + radius * Math.sin(phi) * Math.sin(theta);
                    z = cOffset[2] + radius * Math.cos(phi);
                }

                if (isAnomaly) {
                    x += (Math.random() - 0.5) * 60;
                    y += 50 + Math.random() * 30;
                    z += (Math.random() - 0.5) * 60;
                }

                this.positions[i * 3] = x;
                this.positions[i * 3 + 1] = y;
                this.positions[i * 3 + 2] = z;

                // Color assignments: Cyan/Blue cluster, Violet cluster, Red anomaly
                if (isAnomaly) {
                    this.colors[i * 3] = 0.94;
                    this.colors[i * 3 + 1] = 0.25;
                    this.colors[i * 3 + 2] = 0.37;
                    if (this.anomalyTargetIndex === -1) this.anomalyTargetIndex = i;
                } else {
                    const c = i % 3;
                    if (c === 0) {
                        this.colors[i * 3] = 0.22; this.colors[i * 3 + 1] = 0.74; this.colors[i * 3 + 2] = 0.97;
                    } else if (c === 1) {
                        this.colors[i * 3] = 0.51; this.colors[i * 3 + 1] = 0.55; this.colors[i * 3 + 2] = 0.98;
                    } else {
                        this.colors[i * 3] = 0.06; this.colors[i * 3 + 1] = 0.72; this.colors[i * 3 + 2] = 0.51;
                    }
                }

                this.records.push({
                    baseX: x, baseY: y, baseZ: z,
                    isAnomaly: isAnomaly,
                    driftSpeed: 0.002 + Math.random() * 0.003,
                    driftPhase: Math.random() * Math.PI * 2
                });
            }

            this.geo = new THREE.BufferGeometry();
            this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
            this.geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

            this.mat = new THREE.PointsMaterial({
                size: 3.8,
                vertexColors: true,
                transparent: true,
                opacity: 0.82,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            this.points = new THREE.Points(this.geo, this.mat);
            this.scene.add(this.points);

            // -------------------------------------------------------------
            // ANOMALY VISUALIZATION THEATER OBJECTS
            // -------------------------------------------------------------
            this.anomalyGroup = new THREE.Group();
            this.anomalyGroup.visible = false;

            const ringGeo = new THREE.RingGeometry(8, 9.5, 32);
            for (let r = 0; r < 3; r++) {
                const ringMat = new THREE.MeshBasicMaterial({
                    color: 0xef4444,
                    transparent: true,
                    opacity: 0.75 - r * 0.2,
                    side: THREE.DoubleSide
                });
                const ringMesh = new THREE.Mesh(ringGeo, ringMat);
                ringMesh.rotation.x = Math.PI / 2;
                this.anomalyGroup.add(ringMesh);
                this.anomalyRings.push(ringMesh);
            }

            const coreMarker = new THREE.Mesh(
                new THREE.SphereGeometry(3.5, 12, 12),
                new THREE.MeshBasicMaterial({ color: 0xffffff })
            );
            this.anomalyGroup.add(coreMarker);

            this.scene.add(this.anomalyGroup);

            return this;
        }

        triggerAnomalyEvent(details = null) {
            this.anomalyActive = true;
            this.anomalySeparation = 0;
            this.anomalyStartTime = Date.now();
            if (this.anomalyGroup) this.anomalyGroup.visible = true;
        }

        update(dt = 0.016, now = Date.now()) {
            if (!this.geo) return;

            const posAttr = this.geo.getAttribute('position');
            const pos = posAttr.array;

            // Slow down cloud motion when anomaly is being investigated
            const timeMul = this.anomalyActive ? 0.35 : 1.0;

            for (let i = 0; i < this.records.length; i++) {
                const r = this.records[i];
                const idx = i * 3;

                // Subtle organic cluster hovering
                const drift = Math.sin(now * r.driftSpeed * timeMul + r.driftPhase) * 2.2;
                pos[idx] = r.baseX + drift;
                pos[idx + 2] = r.baseZ + Math.cos(now * r.driftSpeed * timeMul + r.driftPhase) * 2.2;

                // Dynamic anomaly physical separation
                if (r.isAnomaly && this.anomalyActive && i === this.anomalyTargetIndex) {
                    if (this.anomalySeparation < 45) {
                        this.anomalySeparation += 0.85;
                    }
                    pos[idx + 1] = r.baseY + this.anomalySeparation;

                    // Sync anomaly theater beacon
                    if (this.anomalyGroup) {
                        this.anomalyGroup.position.set(pos[idx], pos[idx + 1], pos[idx + 2]);
                        this.anomalyRings.forEach((ring, ri) => {
                            const scale = 1.0 + Math.sin(now * 0.008 + ri * 0.8) * 0.45 + ri * 0.4;
                            ring.scale.set(scale, scale, scale);
                        });
                    }
                } else {
                    pos[idx + 1] = r.baseY + drift;
                }
            }

            posAttr.needsUpdate = true;
        }

        destroy() {
            if (this.scene) {
                if (this.points) {
                    this.scene.remove(this.points);
                    if (this.geo) this.geo.dispose();
                    if (this.mat) this.mat.dispose();
                }
                if (this.anomalyGroup) {
                    this.scene.remove(this.anomalyGroup);
                }
            }
            this.records = [];
            this.scene = null;
        }
    }

    return SpatialDataUniverse;
}));
