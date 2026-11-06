/**
 * ============================================================================
 * UDIP 3D AI RESEARCH LABORATORY — SPATIAL SUBSYSTEM
 * Module: js/ui/command-center/spatial/lighting-system.js
 * ============================================================================
 * Cinematic Scientific Lighting Rig:
 * - Ambient deep-space tone (0x070c18)
 * - Directional laboratory rim and fill lights
 * - Brain volumetric core PointLight (breathing multi-harmonic flux)
 * - 5 Brain regional illumination nodes (Data, Pattern, Anomaly, Prediction, Validation)
 * - Dual agent focal lights (Agent-01 Cyan / Agent-02 Amber)
 * - Dynamic anomaly alert strobing and counter-evidence flare
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.SpatialLightingSystem = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class SpatialLightingSystem {
        constructor() {
            this.scene = null;
            this.ambientLight = null;
            this.dirLight1 = null;
            this.dirLight2 = null;
            this.brainLight = null;
            this.agent1Light = null;
            this.agent2Light = null;
            this.anomalyLight = null;
            this.regionLights = {};
            this.anomalyActive = false;
            this.anomalyTimer = 0;
        }

        init(scene) {
            this.scene = scene;
            const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE) || null;
            if (!THREE || !this.scene) return this;

            // 1. Deep Space Ambient
            this.ambientLight = new THREE.AmbientLight(0x0a1428, 0.7);
            this.scene.add(this.ambientLight);

            // 2. High-Precision Rim / Laboratory Key Light
            this.dirLight1 = new THREE.DirectionalLight(0x38bdf8, 0.85);
            this.dirLight1.position.set(-150, 250, 180);
            this.scene.add(this.dirLight1);

            // 3. Warm Counter-Fill
            this.dirLight2 = new THREE.DirectionalLight(0x818cf8, 0.45);
            this.dirLight2.position.set(180, -100, -120);
            this.scene.add(this.dirLight2);

            // 4. Central Holographic AI Brain Core PointLight
            this.brainLight = new THREE.PointLight(0x38bdf8, 2.8, 550);
            this.brainLight.position.set(0, 15, 0);
            this.scene.add(this.brainLight);

            // 5. Agent-01 (Data Scientist) Cyan Illumination
            this.agent1Light = new THREE.PointLight(0x06b6d4, 1.6, 320);
            this.agent1Light.position.set(-210, 40, 60);
            this.scene.add(this.agent1Light);

            // 6. Agent-02 (Validator) Amber Illumination
            this.agent2Light = new THREE.PointLight(0xf59e0b, 1.5, 320);
            this.agent2Light.position.set(210, 40, 60);
            this.scene.add(this.agent2Light);

            // 7. Dynamic Anomaly Warning Spotlight
            this.anomalyLight = new THREE.PointLight(0xef4444, 0.0, 400);
            this.anomalyLight.position.set(0, 120, 80);
            this.scene.add(this.anomalyLight);

            // 8. Specialized Brain Regional Processing Lights
            const regions = [
                { name: 'DATA_PROCESSING', color: 0x38bdf8, pos: [-25, 45, 20] },
                { name: 'PATTERN_DISCOVERY', color: 0x818cf8, pos: [25, 35, 25] },
                { name: 'ANOMALY_DETECTION', color: 0xef4444, pos: [0, 50, -25] },
                { name: 'PREDICTION', color: 0xc084fc, pos: [-30, -20, 15] },
                { name: 'VALIDATION', color: 0x10b981, pos: [30, -20, 15] }
            ];

            regions.forEach(r => {
                const pl = new THREE.PointLight(r.color, 0.2, 160);
                pl.position.set(r.pos[0], r.pos[1], r.pos[2]);
                this.scene.add(pl);
                this.regionLights[r.name] = {
                    light: pl,
                    baseIntensity: 0.2,
                    targetIntensity: 0.2,
                    currentIntensity: 0.2
                };
            });

            return this;
        }

        update(dt, now, brainPulse = 1.0, analyticalExcitement = 0.0) {
            if (!this.brainLight) return;

            // Breathing flux on the brain pointlight
            const breath = 2.4 * brainPulse + analyticalExcitement * 1.5;
            this.brainLight.intensity = breath;

            // Anomaly warning pulse
            if (this.anomalyActive && this.anomalyLight) {
                const pulse = 0.8 + Math.sin(now * 0.012) * 0.7;
                this.anomalyLight.intensity = Math.max(0, pulse * 2.2);
            } else if (this.anomalyLight && this.anomalyLight.intensity > 0.02) {
                this.anomalyLight.intensity *= 0.92;
            }

            // Update region lights smoothly
            Object.keys(this.regionLights).forEach(key => {
                const r = this.regionLights[key];
                r.currentIntensity += (r.targetIntensity - r.currentIntensity) * 0.1;
                r.light.intensity = r.currentIntensity;
                if (r.targetIntensity > r.baseIntensity) {
                    r.targetIntensity *= 0.985;
                    if (r.targetIntensity < r.baseIntensity + 0.05) {
                        r.targetIntensity = r.baseIntensity;
                    }
                }
            });
        }

        activateRegion(name, intensity = 2.4) {
            if (this.regionLights[name]) {
                this.regionLights[name].targetIntensity = intensity;
            }
        }

        setAnomalyAlert(active) {
            this.anomalyActive = !!active;
            if (!active && this.anomalyLight) {
                this.anomalyLight.intensity = 0;
            }
        }

        destroy() {
            if (this.scene) {
                if (this.ambientLight) this.scene.remove(this.ambientLight);
                if (this.dirLight1) this.scene.remove(this.dirLight1);
                if (this.dirLight2) this.scene.remove(this.dirLight2);
                if (this.brainLight) this.scene.remove(this.brainLight);
                if (this.agent1Light) this.scene.remove(this.agent1Light);
                if (this.agent2Light) this.scene.remove(this.agent2Light);
                if (this.anomalyLight) this.scene.remove(this.anomalyLight);
                Object.keys(this.regionLights).forEach(k => {
                    if (this.regionLights[k].light) this.scene.remove(this.regionLights[k].light);
                });
            }
            this.regionLights = {};
            this.scene = null;
        }
    }

    return SpatialLightingSystem;
}));
