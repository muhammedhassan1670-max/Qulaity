/**
 * ============================================================================
 * UDIP 3D AI RESEARCH LABORATORY — SPATIAL SUBSYSTEM
 * Module: js/ui/command-center/spatial/scene-camera.js
 * ============================================================================
 * Cinematic Camera Director:
 * - Smooth lerp-based transitions between laboratory viewpoints
 * - Programmatic shot presets: WIDE_LAB, BRAIN_FOCUS, AGENT1_WORKSTATION,
 *   AGENT2_VALIDATION, ANOMALY_INVESTIGATION, MODEL_CHAMBER, EVIDENCE_PATH
 * - Subtle interactive mouse parallax without disorienting wobble
 * - Choreographed opening sequence camera transitions
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.SpatialCameraDirector = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class SpatialCameraDirector {
        constructor() {
            this.camera = null;
            this.domElement = null;

            // Camera coordinates
            this.currentPos = { x: 0, y: 25, z: 420 };
            this.targetPos = { x: 0, y: 25, z: 420 };
            this.currentLookAt = { x: 0, y: 10, z: 0 };
            this.targetLookAt = { x: 0, y: 10, z: 0 };

            // Parallax offsets
            this.mouseX = 0;
            this.mouseY = 0;
            this.parallaxX = 0;
            this.parallaxY = 0;

            // Movement tuning
            this.lerpSpeed = 0.045;
            this.lookAtLerpSpeed = 0.055;

            // Shot presets
            this.shots = {
                WIDE_LAB: { pos: [0, 25, 420], lookAt: [0, 10, 0], lerp: 0.04 },
                BRAIN_FOCUS: { pos: [0, 15, 230], lookAt: [0, 15, 0], lerp: 0.05 },
                AGENT1_WORKSTATION: { pos: [-160, 35, 260], lookAt: [-190, 25, 20], lerp: 0.045 },
                AGENT2_VALIDATION: { pos: [160, 35, 260], lookAt: [190, 25, 20], lerp: 0.045 },
                ANOMALY_INVESTIGATION: { pos: [20, 85, 240], lookAt: [0, 60, 20], lerp: 0.08 },
                MODEL_CHAMBER: { pos: [0, -40, 280], lookAt: [0, -35, 0], lerp: 0.05 },
                EVIDENCE_PATH: { pos: [-80, 40, 300], lookAt: [40, 20, 0], lerp: 0.05 },
                COLLABORATION: { pos: [0, 50, 340], lookAt: [0, 20, 0], lerp: 0.04 }
            };

            this.activeShot = 'WIDE_LAB';
            this._onMouseMoveHandler = this._onMouseMove.bind(this);
        }

        init(camera, domElement) {
            this.camera = camera;
            this.domElement = domElement;

            if (this.camera) {
                this.camera.position.set(this.currentPos.x, this.currentPos.y, this.currentPos.z);
                this.camera.lookAt(this.currentLookAt.x, this.currentLookAt.y, this.currentLookAt.z);
            }

            if (this.domElement && typeof this.domElement.addEventListener === 'function') {
                this.domElement.addEventListener('mousemove', this._onMouseMoveHandler);
            }

            return this;
        }

        _onMouseMove(e) {
            if (!this.domElement) return;
            const rect = this.domElement.getBoundingClientRect ? this.domElement.getBoundingClientRect() : { left: 0, top: 0, width: 800, height: 420 };
            const cx = (rect.width || 800) / 2;
            const cy = (rect.height || 420) / 2;
            this.mouseX = (e.clientX - rect.left - cx) / cx;
            this.mouseY = (e.clientY - rect.top - cy) / cy;
        }

        setShot(shotName, overrideLerp = null) {
            const shot = this.shots[shotName];
            if (!shot) return;

            this.activeShot = shotName;
            this.targetPos.x = shot.pos[0];
            this.targetPos.y = shot.pos[1];
            this.targetPos.z = shot.pos[2];

            this.targetLookAt.x = shot.lookAt[0];
            this.targetLookAt.y = shot.lookAt[1];
            this.targetLookAt.z = shot.lookAt[2];

            if (overrideLerp != null) {
                this.lerpSpeed = overrideLerp;
            } else {
                this.lerpSpeed = shot.lerp || 0.045;
            }
        }

        focusOnTarget(x, y, z, distance = 200, speed = 0.06) {
            this.targetLookAt.x = x;
            this.targetLookAt.y = y;
            this.targetLookAt.z = z;

            this.targetPos.x = x * 0.6;
            this.targetPos.y = y * 0.6 + 25;
            this.targetPos.z = Math.max(160, z + distance);
            this.lerpSpeed = speed;
        }

        update(dt = 0.016, now = Date.now()) {
            if (!this.camera) return;

            // Controlled parallax (clamps to gentle arc)
            this.parallaxX += (this.mouseX * 25 - this.parallaxX) * 0.05;
            this.parallaxY += (-this.mouseY * 18 - this.parallaxY) * 0.05;

            // Lerp current coordinates toward targets
            this.currentPos.x += (this.targetPos.x + this.parallaxX - this.currentPos.x) * this.lerpSpeed;
            this.currentPos.y += (this.targetPos.y + this.parallaxY - this.currentPos.y) * this.lerpSpeed;
            this.currentPos.z += (this.targetPos.z - this.currentPos.z) * this.lerpSpeed;

            this.currentLookAt.x += (this.targetLookAt.x - this.currentLookAt.x) * this.lookAtLerpSpeed;
            this.currentLookAt.y += (this.targetLookAt.y - this.currentLookAt.y) * this.lookAtLerpSpeed;
            this.currentLookAt.z += (this.targetLookAt.z - this.currentLookAt.z) * this.lookAtLerpSpeed;

            this.camera.position.set(this.currentPos.x, this.currentPos.y, this.currentPos.z);
            this.camera.lookAt(this.currentLookAt.x, this.currentLookAt.y, this.currentLookAt.z);
        }

        destroy() {
            if (this.domElement && typeof this.domElement.removeEventListener === 'function') {
                this.domElement.removeEventListener('mousemove', this._onMouseMoveHandler);
            }
            this.camera = null;
            this.domElement = null;
        }
    }

    return SpatialCameraDirector;
}));
