/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: js/ui/landing-3d-scene.js
 * Living 3D Cybernetic Command Center & Spatial Environment Engine
 * ============================================================================
 * Provides:
 * 1. Full-screen 3D Spatial Command Center Holodeck rendered on background canvas:
 *    - Deep infinite 3D perspective cyber-grid floor with forward-racing light pulses
 *    - Inverted 3D cyber-grid ceiling with subtle telemetry nodes
 *    - Lateral quantum server monoliths with pulsating activity LED streams
 *    - Volumetric 3D floating data dust & particle starfield with depth z-buffering
 *    - Horizon laser sweep and dynamic cybernetic sunrise atmosphere
 *    - Smooth 3D mouse parallax tilting the entire command room in real time
 *    - Interactive shockwave energy bursts on file drag/drop or button hover
 * 2. Dual live 60fps harmonic oscilloscopes (Data Quality & Model Confidence)
 * 3. 3D DOM perspective depth for floating hero console and HUD panels
 * 4. Leaves central #udip-intelligence-core-canvas exclusively to IntelligenceCore
 *    for realistic, unhindered 3D Cybernetic Android Robot rendering.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.Landing3DScene = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class Landing3DScene {
        constructor() {
            this._animFrameId = null;
            this._mounted = false;
            this._container = null;

            // Canvases
            this._bgCanvas = null;
            this._bgCtx = null;
            this._qualityCanvas = null;
            this._qualityCtx = null;
            this._confidenceCanvas = null;
            this._confidenceCtx = null;

            // Parallax tracking
            this._mouseTarget = { x: 0, y: 0 };
            this._mouseCurrent = { x: 0, y: 0 };
            this._onMouseMove = this._handleMouseMove.bind(this);
            this._onResize = this._handleResize.bind(this);

            // Simulation state
            this._time = 0;
            this._energyBurst = 0;
            this._particles = [];
            this._serverRacks = [];

            this._initEnvironment3D();
        }

        /**
         * Initialize 3D particles and environment features
         * @private
         */
        _initEnvironment3D() {
            // 1. Volumetric 3D Starfield / Cyber-Dust Particles (Sleek pinpoint cosmic dust)
            this._particles = [];
            const particleCount = 80;
            for (let i = 0; i < particleCount; i++) {
                this._particles.push({
                    x: (Math.random() - 0.5) * 1600,
                    y: (Math.random() - 0.5) * 900,
                    z: Math.random() * 900 + 80,
                    radius: Math.random() * 0.9 + 0.5,
                    speedZ: Math.random() * 0.7 + 0.25,
                    color: Math.random() > 0.35 ? '#38bdf8' : (Math.random() > 0.5 ? '#818cf8' : '#34d399'),
                    alpha: Math.random() * 0.55 + 0.25,
                    pulsePhase: Math.random() * Math.PI * 2
                });
            }

            // 2. Lateral Quantum Server Monoliths (Left & Right)
            this._serverRacks = [
                // Left Monoliths
                { x: -580, y: 40, z: 320, w: 120, h: 360, side: 'left' },
                { x: -440, y: 70, z: 460, w: 100, h: 300, side: 'left' },
                // Right Monoliths
                { x: 440, y: 70, z: 460, w: 100, h: 300, side: 'right' },
                { x: 580, y: 40, z: 320, w: 120, h: 360, side: 'right' }
            ];
        }

        /**
         * Mount the 3D scene inside container
         * @param {HTMLElement|string} container 
         */
        mount(container) {
            if (typeof document === 'undefined') return; // Safe for SSR / tests

            const target = typeof container === 'string' ? document.querySelector(container) : container;
            this._container = target || document.getElementById('app-root') || document.body;

            // Target the 3D background canvas
            this._bgCanvas = document.getElementById('udip-landing-3d-bg-canvas');
            if (this._bgCanvas) {
                this._bgCtx = this._bgCanvas.getContext('2d', { alpha: true });
            }

            // Target HUD oscilloscopes
            this._qualityCanvas = document.getElementById('udip-quality-oscilloscope-canvas');
            this._confidenceCanvas = document.getElementById('udip-confidence-oscilloscope-canvas');

            if (this._qualityCanvas) {
                this._qualityCtx = this._qualityCanvas.getContext('2d');
            }
            if (this._confidenceCanvas) {
                this._confidenceCtx = this._confidenceCanvas.getContext('2d');
            }

            this._resizeCanvases();
            if (typeof window !== 'undefined') {
                window.addEventListener('resize', this._onResize, { passive: true });
                window.addEventListener('mousemove', this._onMouseMove, { passive: true });
            }

            this._mounted = true;
            this._time = 0;
            this._startLoops();
        }

        /**
         * Unmount and clean up resources
         */
        unmount() {
            this._mounted = false;
            if (typeof window !== 'undefined') {
                if (this._animFrameId) {
                    window.cancelAnimationFrame(this._animFrameId);
                    this._animFrameId = null;
                }
                window.removeEventListener('resize', this._onResize);
                window.removeEventListener('mousemove', this._onMouseMove);
            }
        }

        /**
         * Trigger a quantum burst of energy across the 3D floor and room
         */
        triggerEnergyBurst() {
            this._energyBurst = 1.0;
        }

        /**
         * Handle mouse tracking for parallax
         * @private
         */
        _handleMouseMove(e) {
            if (typeof window === 'undefined') return;
            const w = window.innerWidth || 1920;
            const h = window.innerHeight || 1080;
            this._mouseTarget.x = ((e.clientX / w) - 0.5) * 2; // [-1, 1]
            this._mouseTarget.y = ((e.clientY / h) - 0.5) * 2; // [-1, 1]
        }

        /**
         * Handle canvas resize
         * @private
         */
        _handleResize() {
            this._resizeCanvases();
        }

        /**
         * Sync canvases with their client bounding box
         * @private
         */
        _resizeCanvases() {
            const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? Math.min(window.devicePixelRatio, 2) : 1;

            if (this._bgCanvas) {
                const w = window.innerWidth || 1920;
                const h = window.innerHeight || 1080;
                this._bgCanvas.width = w * dpr;
                this._bgCanvas.height = h * dpr;
            }

            if (this._qualityCanvas) {
                const rect = this._qualityCanvas.getBoundingClientRect();
                const w = rect.width || 240;
                const h = rect.height || 48;
                this._qualityCanvas.width = w * dpr;
                this._qualityCanvas.height = h * dpr;
            }

            if (this._confidenceCanvas) {
                const rect = this._confidenceCanvas.getBoundingClientRect();
                const w = rect.width || 240;
                const h = rect.height || 48;
                this._confidenceCanvas.width = w * dpr;
                this._confidenceCanvas.height = h * dpr;
            }
        }

        /**
         * Start the 60fps rendering loops
         * @private
         */
        _startLoops() {
            const render = () => {
                if (!this._mounted) return;
                this._updateAndRender3DBackground();
                this._updateAndRenderOscilloscopes();
                this._updateParallaxDOM();
                this._animFrameId = window.requestAnimationFrame(render);
            };
            if (typeof window !== 'undefined' && window.requestAnimationFrame) {
                this._animFrameId = window.requestAnimationFrame(render);
            }
        }

        /**
         * Render the Full Living 3D Spatial Command Center Environment
         * @private
         */
        _updateAndRender3DBackground() {
            if (!this._bgCanvas || !this._bgCtx) return;
            const ctx = this._bgCtx;
            const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? Math.min(window.devicePixelRatio, 2) : 1;
            const width = this._bgCanvas.width / dpr;
            const height = this._bgCanvas.height / dpr;

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, width, height);

            this._time += 0.016;
            if (this._energyBurst > 0) {
                this._energyBurst = Math.max(0, this._energyBurst - 0.025);
            }

            // Smooth parallax lerp
            this._mouseCurrent.x += (this._mouseTarget.x - this._mouseCurrent.x) * 0.06;
            this._mouseCurrent.y += (this._mouseTarget.y - this._mouseCurrent.y) * 0.06;

            // Vanishing point in 3D perspective
            const cx = width * 0.5 + this._mouseCurrent.x * 55;
            const cy = height * 0.44 + this._mouseCurrent.y * 35;

            // 1. Ambient Volumetric Atmospheric Glow at Horizon
            const horizonGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(width, height) * 0.65);
            horizonGlow.addColorStop(0, 'rgba(14, 165, 233, 0.16)');
            horizonGlow.addColorStop(0.35, 'rgba(99, 102, 241, 0.08)');
            horizonGlow.addColorStop(0.7, 'rgba(3, 7, 18, 0.3)');
            horizonGlow.addColorStop(1, 'rgba(2, 6, 23, 0)');
            ctx.fillStyle = horizonGlow;
            ctx.fillRect(0, 0, width, height);

            // 2. 3D Infinite Perspective Cyber-Grid Floor
            this._draw3DFloorGrid(ctx, width, height, cx, cy);

            // 3. 3D Perspective Cyber-Grid Ceiling
            this._draw3DCeilingGrid(ctx, width, height, cx, cy);

            // 4. Volumetric 3D Data Dust / Particle Starfield
            this._draw3DParticles(ctx, width, height, cx, cy);

            // 5. Lateral Quantum Server Monoliths
            this._drawServerMonoliths(ctx, width, height, cx, cy);

            // 6. Horizon Digital Laser Scan Line
            this._drawHorizonLaser(ctx, width, height, cx, cy);

            // 7. Interactive Floor Energy Shockwave Rings (on drop/hover)
            if (this._energyBurst > 0.01) {
                this._drawEnergyShockwave(ctx, width, height, cx, cy);
            }

            ctx.restore();
        }

        /**
         * Draw 3D Infinite Perspective Cyber-Grid Floor
         * @private
         */
        _draw3DFloorGrid(ctx, width, height, cx, cy) {
            const floorTop = cy + 18;
            const floorBottom = height;
            if (floorBottom <= floorTop) return;

            ctx.save();

            // Longitudinal Perspective Grid Lines (converging to vanishing point cx, cy)
            const numLongLines = 26;
            const fovSpread = width * 1.5;
            for (let i = 0; i <= numLongLines; i++) {
                const frac = (i / numLongLines) - 0.5; // [-0.5, 0.5]
                const bottomX = cx + frac * fovSpread;

                const isRunway = Math.abs(frac) < 0.12;
                const alpha = isRunway ? 0.38 : (Math.max(0.06, 0.22 - Math.abs(frac) * 0.25));

                ctx.strokeStyle = isRunway ? 'rgba(56, 189, 248, ' + alpha + ')' : 'rgba(99, 102, 241, ' + alpha + ')';
                ctx.lineWidth = isRunway ? 1.4 : 0.8;

                ctx.beginPath();
                ctx.moveTo(cx, floorTop);
                ctx.lineTo(bottomX, floorBottom);
                ctx.stroke();

                // High-speed light pulses traveling down runway lines
                if (isRunway) {
                    const pulsePhase = ((this._time * 0.7 + i * 0.18) % 1.0);
                    const pulseT = Math.pow(pulsePhase, 1.8);
                    const px = cx + (bottomX - cx) * pulseT;
                    const py = floorTop + (floorBottom - floorTop) * pulseT;

                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#38bdf8';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(px, py, 1.8 * (0.8 + pulseT * 1.5), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            // Transverse Perspective Cross Lines (moving forward in time toward camera)
            const numTransLines = 18;
            const speed = 0.22 + (this._energyBurst * 0.4);
            const offset = (this._time * speed) % 1.0;

            for (let j = 0; j < numTransLines; j++) {
                const rawProgress = (j + offset) / numTransLines;
                // Non-linear depth curve for perspective compression
                const depthT = Math.pow(rawProgress, 2.4);
                const lineY = floorTop + (floorBottom - floorTop) * depthT;

                const spreadAtY = (width * 0.8) * depthT;
                const x1 = cx - spreadAtY;
                const x2 = cx + spreadAtY;

                const alpha = Math.min(0.42, Math.max(0.03, depthT * 0.45));
                ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
                ctx.lineWidth = 0.8 + depthT * 0.8;

                ctx.beginPath();
                ctx.moveTo(x1, lineY);
                ctx.lineTo(x2, lineY);
                ctx.stroke();
            }

            ctx.restore();
        }

        /**
         * Draw Inverted 3D Perspective Cyber-Grid Ceiling
         * @private
         */
        _draw3DCeilingGrid(ctx, width, height, cx, cy) {
            const ceilBottom = cy - 20;
            const ceilTop = 0;
            if (ceilBottom <= ceilTop) return;

            ctx.save();
            const numLines = 16;
            const fovSpread = width * 1.3;

            for (let i = 0; i <= numLines; i++) {
                const frac = (i / numLines) - 0.5;
                const topX = cx + frac * fovSpread;
                const alpha = Math.max(0.03, 0.14 - Math.abs(frac) * 0.15);

                ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
                ctx.lineWidth = 0.7;

                ctx.beginPath();
                ctx.moveTo(cx, ceilBottom);
                ctx.lineTo(topX, ceilTop);
                ctx.stroke();
            }

            // Transverse ceiling bars
            const numBars = 8;
            for (let k = 1; k <= numBars; k++) {
                const t = Math.pow(k / numBars, 2.0);
                const lineY = ceilBottom - (ceilBottom - ceilTop) * t;
                const span = (width * 0.65) * t;

                ctx.strokeStyle = `rgba(129, 140, 248, ${0.08 * t})`;
                ctx.lineWidth = 0.7;
                ctx.beginPath();
                ctx.moveTo(cx - span, lineY);
                ctx.lineTo(cx + span, lineY);
                ctx.stroke();
            }

            ctx.restore();
        }

        /**
         * Draw Volumetric 3D Floating Data Dust Particles
         * @private
         */
        _draw3DParticles(ctx, width, height, cx, cy) {
            // Disabled unattached floating dust so all particles travel strictly inside network conduits
            return;
            const pxOffset = this._mouseCurrent.x * 25;
            const pyOffset = this._mouseCurrent.y * 20;

            this._particles.forEach(p => {
                // Move particle along Z axis toward camera
                p.z -= p.speedZ + (this._energyBurst * 3.5);
                if (p.z <= 20) {
                    p.z = 900;
                    p.x = (Math.random() - 0.5) * 1600;
                    p.y = (Math.random() - 0.5) * 900;
                }

                const scale = fov / p.z;
                const screenX = cx + (p.x + pxOffset) * scale;
                const screenY = cy + (p.y + pyOffset) * scale;

                if (screenX < -20 || screenX > width + 20 || screenY < -20 || screenY > height + 20) return;

                const pulse = Math.sin(this._time * 2 + p.pulsePhase) * 0.25 + 0.75;
                const currentAlpha = Math.min(0.85, Math.max(0.1, (1 - p.z / 900) * p.alpha * pulse));
                // Clamp radius so particles remain sharp cosmic starlight micro-points, never huge bubbles
                const currentRadius = Math.min(1.8, Math.max(0.6, p.radius * scale * 0.4));

                ctx.fillStyle = p.color;
                ctx.globalAlpha = currentAlpha;
                ctx.beginPath();
                ctx.arc(screenX, screenY, currentRadius, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.globalAlpha = 1.0;
        }

        /**
         * Draw Lateral Quantum Server Monoliths
         * @private
         */
        _drawServerMonoliths(ctx, width, height, cx, cy) {
            const fov = 460;
            const pxOffset = this._mouseCurrent.x * 30;

            this._serverRacks.forEach((rack, idx) => {
                const scale = fov / rack.z;
                const rx = cx + (rack.x + pxOffset) * scale;
                const ry = cy + rack.y * scale;
                const rw = rack.w * scale;
                const rh = rack.h * scale;

                // Wireframe Tower Outline
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
                ctx.lineWidth = 1.0;
                ctx.strokeRect(rx - rw / 2, ry - rh / 2, rw, rh);

                // Server Rack Shelves & Blinking LED Streams
                const shelves = 10;
                const shelfH = rh / shelves;
                for (let s = 0; s < shelves; s++) {
                    const sy = (ry - rh / 2) + s * shelfH;
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                    ctx.beginPath();
                    ctx.moveTo(rx - rw / 2 + 2, sy);
                    ctx.lineTo(rx + rw / 2 - 2, sy);
                    ctx.stroke();

                    // LED indicators
                    const ledPhase = Math.sin(this._time * 4 + idx * 2 + s * 1.3);
                    if (ledPhase > 0.1) {
                        const ledColor = s % 3 === 0 ? '#10b981' : (s % 3 === 1 ? '#38bdf8' : '#f59e0b');
                        ctx.fillStyle = ledColor;
                        ctx.fillRect(rx - rw / 2 + 6, sy + 3, 3 * scale, 2 * scale);
                    }
                }
            });
        }

        /**
         * Draw Digital Horizon Laser Scan
         * @private
         */
        _drawHorizonLaser(ctx, width, height, cx, cy) {
            const scanY = cy + Math.sin(this._time * 1.2) * 6;
            const grad = ctx.createLinearGradient(0, scanY, width, scanY);
            grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
            grad.addColorStop(0.2, 'rgba(56, 189, 248, 0.15)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)');
            grad.addColorStop(0.8, 'rgba(56, 189, 248, 0.15)');
            grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, scanY);
            ctx.lineTo(width, scanY);
            ctx.stroke();
        }

        /**
         * Draw Floor Shockwave Energy Rings
         * @private
         */
        _drawEnergyShockwave(ctx, width, height, cx, cy) {
            const burst = this._energyBurst;
            const ringRadius = (1 - burst) * (width * 0.65);
            const floorTop = cy + 18;

            ctx.save();
            ctx.strokeStyle = `rgba(56, 189, 248, ${burst * 0.7})`;
            ctx.lineWidth = 2.5 * burst;
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 16 * burst;

            // Perspective ellipse on floor
            ctx.beginPath();
            ctx.ellipse(cx, floorTop + (height - floorTop) * 0.45, ringRadius, ringRadius * 0.32, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }

        /**
         * Update and render dual live harmonic oscilloscopes on side panels
         * @private
         */
        _updateAndRenderOscilloscopes() {
            // 1. Data Quality Oscilloscope (Left Panel)
            if (this._qualityCanvas && this._qualityCtx) {
                const ctx = this._qualityCtx;
                const w = this._qualityCanvas.width;
                const h = this._qualityCanvas.height;
                ctx.clearRect(0, 0, w, h);

                const midY = h / 2;
                ctx.beginPath();
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 2.0;
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 8;

                const step = 3;
                for (let x = 0; x <= w; x += step) {
                    const normX = x / w;
                    // Dual harmonic wave + heartbeat ECG spike
                    const wave1 = Math.sin(this._time * 4 + normX * 12) * (h * 0.22);
                    const wave2 = Math.cos(this._time * 2.5 + normX * 24) * (h * 0.1);
                    const ecgDist = Math.abs(normX - ((this._time * 0.4) % 1.0));
                    const ecg = ecgDist < 0.06 ? Math.sin(ecgDist * 50) * (h * 0.38) : 0;
                    const y = midY + wave1 + wave2 + ecg;

                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // 2. Model Confidence Oscilloscope (Right Panel)
            if (this._confidenceCanvas && this._confidenceCtx) {
                const ctx = this._confidenceCtx;
                const w = this._confidenceCanvas.width;
                const h = this._confidenceCanvas.height;
                ctx.clearRect(0, 0, w, h);

                const midY = h / 2;
                ctx.beginPath();
                ctx.strokeStyle = '#c084fc';
                ctx.lineWidth = 2.0;
                ctx.shadowColor = '#c084fc';
                ctx.shadowBlur = 8;

                const step = 3;
                for (let x = 0; x <= w; x += step) {
                    const normX = x / w;
                    const wave1 = Math.sin(this._time * 3.5 - normX * 15) * (h * 0.25);
                    const wave2 = Math.sin(this._time * 6 + normX * 30) * (h * 0.08);
                    const noise = (Math.sin(normX * 100 + this._time * 10) * 0.05) * h;
                    const y = midY + wave1 + wave2 + noise;

                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }

        /**
         * Update DOM parallax layers with smooth LERP
         * @private
         */
        _updateParallaxDOM() {
            const mx = this._mouseCurrent.x;
            const my = this._mouseCurrent.y;

            // Keep console content pinned seamlessly inside the background's drawn holographic terminal
            const consoleCard = document.querySelector('.udip-cc-console');
            if (consoleCard && consoleCard.style.transform !== 'none') {
                consoleCard.style.transform = 'none';
            }

            const leftPanel = document.querySelector('.udip-cc-panel-left');
            if (leftPanel) {
                const rotY = 10 + (mx * 5);
                leftPanel.style.transform = `perspective(1200px) rotateY(${rotY.toFixed(2)}deg) translateZ(8px)`;
            }

            const rightPanel = document.querySelector('.udip-cc-panel-right');
            if (rightPanel) {
                const rotY = -10 + (mx * 5);
                rightPanel.style.transform = `perspective(1200px) rotateY(${rotY.toFixed(2)}deg) translateZ(8px)`;
            }
        }
    }

    return new Landing3DScene();
}));
