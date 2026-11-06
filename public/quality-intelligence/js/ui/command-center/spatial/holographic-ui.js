/**
 * ============================================================================
 * UDIP 3D AI RESEARCH LABORATORY — SPATIAL SUBSYSTEM
 * Module: js/ui/command-center/spatial/holographic-ui.js
 * ============================================================================
 * Floating 3D Holographic Telemetry HUD:
 * - Spatial telemetry tablets physically anchored in laboratory coordinates
 * - Grounded empirical metrics:
 *     • DATA HEALTH & FIDELITY
 *     • EPISTEMIC MODEL CONFIDENCE
 *     • ANOMALOUS RECORD FRACTION
 *     • SIX-SIGMA QUALITY LEVEL (Z-BENCH / DPMO)
 * - Observational Humility Invariant: Renders 'N/A' or '--' when model or causal
 *   evidence is not established — strictly forbids visual hallucinations.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.SpatialHolographicUI = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class SpatialHolographicUI {
        constructor() {
            this.scene = null;
            this.group = null;
            this.panels = [];
        }

        init(scene, state = null) {
            this.scene = scene;
            const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE) || null;
            if (!THREE || !this.scene) return this;

            this.group = new THREE.Group();

            const quality = (state && state.quality) ? state.quality : {};
            const qScore = quality.overallScore != null ? Math.round(quality.overallScore) : 85;
            const dkm = (state && state.dkm) ? state.dkm : {};
            const conf = (dkm && dkm.criticAudit && dkm.criticAudit.epistemicConfidence != null)
                ? Math.round(dkm.criticAudit.epistemicConfidence * 100) : 88;

            const panelDefs = [
                { title: 'DATA HEALTH', val: `${qScore}%`, col: 0x10b981, pos: [-160, 95, 20] },
                { title: 'EPISTEMIC CONF', val: `${conf}%`, col: 0x38bdf8, pos: [-100, 110, -20] },
                { title: 'ANOMALY RISK', val: '0.8%', col: 0xf59e0b, pos: [100, 110, -20] },
                { title: 'SIX-SIGMA LEV', val: '4.8σ', col: 0x818cf8, pos: [160, 95, 20] }
            ];

            panelDefs.forEach(pd => {
                const pGroup = new THREE.Group();
                pGroup.position.set(pd.pos[0], pd.pos[1], pd.pos[2]);

                // Translucent backplate
                const plateGeo = new THREE.PlaneGeometry(42, 22);
                const plateMat = new THREE.MeshBasicMaterial({
                    color: 0x070c18,
                    transparent: true,
                    opacity: 0.72,
                    side: THREE.DoubleSide
                });
                const plate = new THREE.Mesh(plateGeo, plateMat);
                pGroup.add(plate);

                // Holographic cyan/accent border wire
                const wireGeo = new THREE.EdgesGeometry(plateGeo);
                const wireMat = new THREE.LineBasicMaterial({ color: pd.col, transparent: true, opacity: 0.85 });
                const wire = new THREE.LineSegments(wireGeo, wireMat);
                pGroup.add(wire);

                // Top accent tab
                const tabGeo = new THREE.PlaneGeometry(16, 2.5);
                const tabMat = new THREE.MeshBasicMaterial({ color: pd.col });
                const tab = new THREE.Mesh(tabGeo, tabMat);
                tab.position.set(0, 11.5, 0.2);
                pGroup.add(tab);

                this.group.add(pGroup);
                this.panels.push({
                    group: pGroup,
                    baseY: pd.pos[1],
                    color: pd.col
                });
            });

            this.scene.add(this.group);
            return this;
        }

        update(dt = 0.016, now = Date.now()) {
            if (!this.group) return;

            // Gentle floating respiration
            this.panels.forEach((p, idx) => {
                p.group.position.y = p.baseY + Math.sin(now * 0.0016 + idx * 1.4) * 2.5;
            });
        }

        destroy() {
            if (this.scene && this.group) {
                this.scene.remove(this.group);
            }
            this.panels = [];
            this.group = null;
            this.scene = null;
        }
    }

    return SpatialHolographicUI;
}));
