/**
 * ============================================================================
 * UDIP 3D AI RESEARCH LABORATORY — SPATIAL SUBSYSTEM
 * Module: js/ui/command-center/spatial/neural-network-3d.js
 * ============================================================================
 * 3D Machine Learning Deep Neural Network:
 * - 5 Structured spatial analytical layers:
 *     1. INPUT: Raw dimensional features (Dataset column bindings)
 *     2. FEATURE EXTRACTION: Non-linear kernel projections
 *     3. HIDDEN REPRESENTATION: Latent semantic manifolds
 *     4. PATTERN MODEL: Statistical correlation & hypothesis weights
 *     5. PREDICTION: Target inference & uncertainty bounds
 * - Volumetric depth layer bounding volumes with translucent glassmorphic frames
 * - 3D Spherical neurons with dynamic activation glow
 * - Synaptic weight connections with propagating forward-pass activation photons
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.SpatialNeuralNetwork = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class SpatialNeuralNetwork {
        constructor() {
            this.scene = null;
            this.group = null;

            this.layers = [];
            this.neurons = [];
            this.synapses = null;
            this.synapseGeo = null;

            this.signals = [];
            this.signalPoints = null;
            this.signalGeo = null;

            this.layerVolumes = [];
            this.anchorPos = [0, 65, -180];
        }

        init(scene, dataset = null, profile = null) {
            this.scene = scene;
            const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE) || null;
            if (!THREE || !this.scene) return this;

            this.group = new THREE.Group();
            this.group.position.set(this.anchorPos[0], this.anchorPos[1], this.anchorPos[2]);

            // Layer topologies: [Input, Feature, Latent, Pattern, Output]
            const colNames = (dataset && dataset.columns) ? dataset.columns : ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'];
            const inputCount = Math.min(8, colNames.length);

            const layerSizes = [inputCount, 7, 5, 4, 1];
            const layerZOffsets = [-80, -40, 0, 40, 80];
            const layerColors = [0x38bdf8, 0x06b6d4, 0x818cf8, 0xc084fc, 0x10b981];
            const layerLabels = ['INPUT', 'EXTRACTION', 'LATENT', 'PATTERN', 'PREDICTION'];

            const neuronMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.95
            });

            // -------------------------------------------------------------
            // 1. NEURON NODES & LAYER VOLUMES
            // -------------------------------------------------------------
            this.neuronsByLayer = [];

            layerSizes.forEach((size, li) => {
                const z = layerZOffsets[li];
                const col = layerColors[li];
                const layerNodes = [];

                // Layer bounding volume frame
                const volGeo = new THREE.BoxGeometry(size * 18 + 20, 65, 14);
                const volMat = new THREE.MeshBasicMaterial({
                    color: col,
                    transparent: true,
                    opacity: 0.08,
                    wireframe: true
                });
                const volMesh = new THREE.Mesh(volGeo, volMat);
                volMesh.position.set(0, 0, z);
                this.group.add(volMesh);
                this.layerVolumes.push(volMesh);

                // Neurons within layer
                for (let ni = 0; ni < size; ni++) {
                    const x = (ni - (size - 1) / 2) * 18;
                    const y = (Math.sin(ni * 1.5) * 6);

                    const nGeo = new THREE.SphereGeometry(3.5, 14, 14);
                    const nMat = new THREE.MeshStandardMaterial({
                        color: col,
                        emissive: col,
                        emissiveIntensity: 0.65,
                        roughness: 0.2,
                        metalness: 0.8
                    });

                    const nodeMesh = new THREE.Mesh(nGeo, nMat);
                    nodeMesh.position.set(x, y, z);
                    this.group.add(nodeMesh);

                    const neuronData = {
                        mesh: nodeMesh,
                        layerIndex: li,
                        neuronIndex: ni,
                        pos: new THREE.Vector3(x, y, z),
                        color: col,
                        baseActivation: 0.35 + Math.random() * 0.65,
                        activation: 0.5
                    };

                    this.neurons.push(neuronData);
                    layerNodes.push(neuronData);
                }

                this.neuronsByLayer.push(layerNodes);
            });

            // -------------------------------------------------------------
            // 2. SYNAPTIC CONNECTIONS (Inter-layer weighted lines)
            // -------------------------------------------------------------
            const synapsePts = [];
            this.connections = [];

            for (let li = 0; li < this.neuronsByLayer.length - 1; li++) {
                const currentL = this.neuronsByLayer[li];
                const nextL = this.neuronsByLayer[li + 1];

                currentL.forEach(nFrom => {
                    nextL.forEach(nTo => {
                        synapsePts.push(nFrom.pos.x, nFrom.pos.y, nFrom.pos.z);
                        synapsePts.push(nTo.pos.x, nTo.pos.y, nTo.pos.z);

                        this.connections.push({
                            p0: nFrom.pos,
                            p1: nTo.pos,
                            weight: 0.2 + Math.random() * 0.8,
                            color: nFrom.color
                        });
                    });
                });
            }

            this.synapseGeo = new THREE.BufferGeometry();
            this.synapseGeo.setAttribute('position', new THREE.Float32BufferAttribute(synapsePts, 3));

            const synapseMat = new THREE.LineBasicMaterial({
                color: 0x818cf8,
                transparent: true,
                opacity: 0.2,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            this.synapses = new THREE.LineSegments(this.synapseGeo, synapseMat);
            this.group.add(this.synapses);

            // -------------------------------------------------------------
            // 3. PROPAGATING ACTIVATION PHOTONS
            // -------------------------------------------------------------
            const signalCount = 55;
            const sigPos = new Float32Array(signalCount * 3);
            this.signals = [];

            for (let i = 0; i < signalCount; i++) {
                const connIdx = Math.floor(Math.random() * this.connections.length);
                this.signals.push({
                    conn: this.connections[connIdx],
                    t: Math.random(),
                    speed: 0.015 + Math.random() * 0.02,
                    index: i
                });
            }

            this.signalGeo = new THREE.BufferGeometry();
            this.signalGeo.setAttribute('position', new THREE.BufferAttribute(sigPos, 3));

            const sigMat = new THREE.PointsMaterial({
                color: 0x38bdf8,
                size: 4.2,
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            this.signalPoints = new THREE.Points(this.signalGeo, sigMat);
            this.group.add(this.signalPoints);

            this.scene.add(this.group);
            return this;
        }

        fireActivationBurst() {
            for (let i = 0; i < this.signals.length; i++) {
                this.signals[i].t = 0;
                this.signals[i].speed = 0.035 + Math.random() * 0.03;
            }
            this.neurons.forEach(n => {
                n.mesh.scale.set(1.6, 1.6, 1.6);
            });
        }

        update(dt = 0.016, now = Date.now()) {
            if (!this.group) return;

            // 1. Advance Signals
            if (this.signalGeo && this.connections.length > 0) {
                const posAttr = this.signalGeo.getAttribute('position');
                const pArr = posAttr.array;

                for (let i = 0; i < this.signals.length; i++) {
                    const sig = this.signals[i];
                    sig.t += sig.speed;

                    if (sig.t >= 1.0) {
                        sig.t = 0.0;
                        sig.conn = this.connections[Math.floor(Math.random() * this.connections.length)];
                        sig.speed = 0.015 + Math.random() * 0.02;
                    }

                    if (sig.conn) {
                        const idx = i * 3;
                        pArr[idx] = sig.conn.p0.x + (sig.conn.p1.x - sig.conn.p0.x) * sig.t;
                        pArr[idx + 1] = sig.conn.p0.y + (sig.conn.p1.y - sig.conn.p0.y) * sig.t;
                        pArr[idx + 2] = sig.conn.p0.z + (sig.conn.p1.z - sig.conn.p0.z) * sig.t;
                    }
                }

                posAttr.needsUpdate = true;
            }

            // 2. Pulsate Neurons
            this.neurons.forEach((n, idx) => {
                const act = n.baseActivation + Math.sin(now * 0.003 + idx) * 0.2;
                n.mesh.material.emissiveIntensity = 0.4 + act * 0.6;
                if (n.mesh.scale.x > 1.02) {
                    n.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.08);
                }
            });

            // 3. Subtle background orbit drift
            this.group.rotation.y = Math.sin(now * 0.0003) * 0.08;
        }

        destroy() {
            if (this.scene && this.group) {
                this.scene.remove(this.group);
                if (this.synapseGeo) this.synapseGeo.dispose();
                if (this.signalGeo) this.signalGeo.dispose();
            }
            this.neurons = [];
            this.signals = [];
            this.connections = [];
            this.group = null;
            this.scene = null;
        }
    }

    return SpatialNeuralNetwork;
}));
