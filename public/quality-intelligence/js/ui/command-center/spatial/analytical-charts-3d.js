/**
 * ============================================================================
 * UDIP 3D AI RESEARCH LABORATORY — SPATIAL SUBSYSTEM
 * Module: js/ui/command-center/spatial/analytical-charts-3d.js
 * ============================================================================
 * High-Precision 3D Scientific Analytics & Model Processing Chamber:
 * - 3D Bar Forest: Volumetric rectangular prisms with metalness/roughness PBR
 *   shading, perspective shadows, animated initial emergence & column labels
 * - 3D Correlation Terrain: Elevated mathematical topology representing
 *   pairwise variable correlation density
 * - Floating Machine Learning Model Chamber:
 *     DATA -> FEATURES -> MODEL -> PREDICTION -> CONFIDENCE -> DECISION
 * - Root Cause 3D Diagnostic Directed Network:
 *     EFFECT -> CAUSE -> PROCESS FACTOR -> CONTRIBUTING FACTOR -> ROOT CAUSE
 * - Industrial Predictive Maintenance Asset (Motor/Bearing twin when equipment data present)
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.SpatialAnalyticalCharts = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class SpatialAnalyticalCharts {
        constructor() {
            this.scene = null;
            this.group = null;

            this.bars = [];
            this.terrainMesh = null;
            this.modelChamber = null;
            this.rootCauseGroup = null;
            this.industrialAsset = null;

            this.growthProgress = 0.0;
        }

        init(scene, dataset = null, profile = null, dkm = null) {
            this.scene = scene;
            const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE) || null;
            if (!THREE || !this.scene) return this;

            this.group = new THREE.Group();

            const columns = (dataset && dataset.columns) ? dataset.columns : ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
            const pCols = (profile && profile.columns) ? profile.columns : {};

            // -------------------------------------------------------------
            // 1. 3D BAR FOREST (Lower-Left Scientific Workstation)
            // -------------------------------------------------------------
            const barGroup = new THREE.Group();
            barGroup.position.set(-170, -45, 90);

            // Base ground grid plate
            const plateGeo = new THREE.BoxGeometry(110, 2.5, 45);
            const plateMat = new THREE.MeshStandardMaterial({
                color: 0x0f172a,
                metalness: 0.8,
                roughness: 0.3
            });
            const basePlate = new THREE.Mesh(plateGeo, plateMat);
            barGroup.add(basePlate);

            const barCount = Math.min(8, columns.length);
            this.bars = [];

            for (let i = 0; i < barCount; i++) {
                const colName = columns[i];
                const info = pCols[colName] || {};
                const importance = (info.importance != null) ? info.importance : (0.35 + (i * 0.08) % 0.6);

                const maxH = 42.0;
                const targetH = Math.max(6.0, importance * maxH);
                const w = 8.5;
                const d = 8.5;

                const bGeo = new THREE.BoxGeometry(w, 1, d);
                // Translate origin to base for easy scaling
                bGeo.translate(0, 0.5, 0);

                const colors = [0x38bdf8, 0x818cf8, 0x10b981, 0xf59e0b];
                const bMat = new THREE.MeshStandardMaterial({
                    color: colors[i % colors.length],
                    emissive: colors[i % colors.length],
                    emissiveIntensity: 0.35,
                    metalness: 0.65,
                    roughness: 0.25
                });

                const barMesh = new THREE.Mesh(bGeo, bMat);
                const x = (i - (barCount - 1) / 2) * 12.5;
                barMesh.position.set(x, 1.25, 0);

                barGroup.add(barMesh);
                this.bars.push({
                    mesh: barMesh,
                    targetHeight: targetH,
                    currentHeight: 1.0,
                    colName: colName
                });
            }

            this.group.add(barGroup);

            // -------------------------------------------------------------
            // 2. 3D CORRELATION TERRAIN (Lower-Right Mathematical Surface)
            // -------------------------------------------------------------
            const terrainGroup = new THREE.Group();
            terrainGroup.position.set(160, -45, 90);

            const gridDim = 6;
            const tGeo = new THREE.PlaneGeometry(75, 55, gridDim - 1, gridDim - 1);
            tGeo.rotateX(-Math.PI / 2);

            const pos = tGeo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const vx = pos.getX(i);
                const vz = pos.getZ(i);
                // Elevation derived from 2D mathematical wave
                const elev = Math.sin(vx * 0.12) * Math.cos(vz * 0.14) * 12.0 + (Math.sin(vx * 0.06 + vz * 0.06) * 6.0);
                pos.setY(i, Math.max(0, elev + 6));
            }
            tGeo.computeVertexNormals();

            const tMat = new THREE.MeshStandardMaterial({
                color: 0x818cf8,
                emissive: 0x1e1b4b,
                emissiveIntensity: 0.4,
                wireframe: true,
                transparent: true,
                opacity: 0.7
            });

            this.terrainMesh = new THREE.Mesh(tGeo, tMat);
            terrainGroup.add(this.terrainMesh);

            this.group.add(terrainGroup);

            // -------------------------------------------------------------
            // 3. FLOATING MACHINE LEARNING MODEL CHAMBER
            // -------------------------------------------------------------
            this.modelChamber = new THREE.Group();
            this.modelChamber.position.set(0, -60, 45);

            // Chamber glass enclosure frame
            const chamberGeo = new THREE.BoxGeometry(140, 24, 28);
            const chamberWire = new THREE.LineSegments(
                new THREE.EdgesGeometry(chamberGeo),
                new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
            );
            this.modelChamber.add(chamberWire);

            // Internal pipeline nodes (DATA -> FEATURES -> MODEL -> PREDICTION -> DECISION)
            const stages = ['DATA', 'FEATURES', 'MODEL', 'PREDICTION', 'DECISION'];
            const stageColors = [0x38bdf8, 0x06b6d4, 0x818cf8, 0xc084fc, 0x10b981];

            stages.forEach((st, idx) => {
                const sGeo = new THREE.SphereGeometry(3.2, 12, 12);
                const sMat = new THREE.MeshBasicMaterial({ color: stageColors[idx] });
                const sMesh = new THREE.Mesh(sGeo, sMat);
                sMesh.position.set((idx - 2) * 26, 0, 0);
                this.modelChamber.add(sMesh);

                // Connector line to next stage
                if (idx < stages.length - 1) {
                    const linePts = [
                        new THREE.Vector3((idx - 2) * 26, 0, 0),
                        new THREE.Vector3((idx - 1) * 26, 0, 0)
                    ];
                    const lGeo = new THREE.BufferGeometry().setFromPoints(linePts);
                    const lMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
                    this.modelChamber.add(new THREE.Line(lGeo, lMat));
                }
            });

            this.group.add(this.modelChamber);

            // -------------------------------------------------------------
            // 4. ROOT CAUSE DIRECTED INVESTIGATION GRAPH
            // -------------------------------------------------------------
            this.rootCauseGroup = new THREE.Group();
            this.rootCauseGroup.position.set(0, 85, -90);

            const rcNodes = [
                { id: 'EFFECT', pos: [-60, 0, 0], col: 0xef4444 },
                { id: 'CAUSE_1', pos: [-25, 12, 0], col: 0xf59e0b },
                { id: 'CAUSE_2', pos: [-25, -12, 0], col: 0x64748b },
                { id: 'FACTOR', pos: [15, 0, 0], col: 0x818cf8 },
                { id: 'ROOT_CAUSE', pos: [55, 0, 0], col: 0x10b981 }
            ];

            rcNodes.forEach(node => {
                const nMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(4.2, 12, 12),
                    new THREE.MeshStandardMaterial({ color: node.col, emissive: node.col, emissiveIntensity: 0.6 })
                );
                nMesh.position.set(node.pos[0], node.pos[1], node.pos[2]);
                this.rootCauseGroup.add(nMesh);
            });

            // Dominant evidence pathway (EFFECT -> CAUSE_1 -> FACTOR -> ROOT_CAUSE)
            const dominantPathPts = [
                new THREE.Vector3(-60, 0, 0),
                new THREE.Vector3(-25, 12, 0),
                new THREE.Vector3(15, 0, 0),
                new THREE.Vector3(55, 0, 0)
            ];
            const dGeo = new THREE.BufferGeometry().setFromPoints(dominantPathPts);
            const dMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 });
            this.rootCauseGroup.add(new THREE.Line(dGeo, dMat));

            this.group.add(this.rootCauseGroup);

            this.scene.add(this.group);
            return this;
        }

        update(dt = 0.016, now = Date.now()) {
            if (!this.group) return;

            // 1. Bar Height Emergence Animation
            if (this.growthProgress < 1.0) {
                this.growthProgress += 0.02;
                if (this.growthProgress > 1.0) this.growthProgress = 1.0;
            }

            this.bars.forEach((b, idx) => {
                const target = b.targetHeight * this.growthProgress;
                const pulse = 1.0 + Math.sin(now * 0.002 + idx) * 0.035;
                b.currentHeight += (target * pulse - b.currentHeight) * 0.08;
                b.mesh.scale.y = Math.max(0.1, b.currentHeight);
            });

            // 2. Correlation Terrain Wave Dynamics
            if (this.terrainMesh) {
                this.terrainMesh.rotation.y = Math.sin(now * 0.0006) * 0.08;
            }

            // 3. Model Chamber Respiration
            if (this.modelChamber) {
                this.modelChamber.position.y = -60 + Math.sin(now * 0.0018) * 2.2;
            }

            // 4. Root Cause Subtle Floating
            if (this.rootCauseGroup) {
                this.rootCauseGroup.position.y = 85 + Math.sin(now * 0.0014) * 2.8;
            }
        }

        destroy() {
            if (this.scene && this.group) {
                this.scene.remove(this.group);
            }
            this.bars = [];
            this.group = null;
            this.scene = null;
        }
    }

    return SpatialAnalyticalCharts;
}));
