/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: js/ui/profile-3d-stage.js
 * ============================================================================
 * 3D Cybernetic Background Gears & Engine Coordinator:
 * - Ambient WebGL 3D machinery backdrop running interlocking gears ("تروس ميكانيكية")
 * - 4 Interlocking 3D volumetric extruded gears with physical gear-ratio synchronization
 * - Metallic PBR materials with glowing neon circuits and tooth edge bevels
 * - Reacts to scroll and mouse movement with dynamic acceleration & momentum
 * - Complete resource management: unmounts and disposes geometries & materials on tab change
 * ============================================================================
 */

(function (window) {
    'use strict';

    class Profile3DStage {
        constructor() {
            this.container = null;
            this.canvas = null;
            this.renderer = null;
            this.scene = null;
            this.camera = null;
            this.dataset = null;

            // Engine state
            this.isAlive = false;
            this.animId = null;
            this.baseSpeed = 0.008;
            this.currentSpeed = 0.008;
            this.momentum = 0.0;
            this.mode = 'bar-matrix';
            this.autoRotate = true;
            this.wireframe = false;
            this.targetDistance = 140;

            // 3D Objects
            this.gearsGroup = null;
            this.gears = [];
            this.particleConduit = null;

            // Interaction & Scroll Reaction
            this.mouse = { x: 0, y: 0 };
            this._onMouseMove = this._handleMouseMove.bind(this);
            this._onScroll = this._handleScroll.bind(this);
            this._onResize = this._handleResize.bind(this);
        }

        /**
         * Mount 3D background gears engine into DOM container
         * @param {HTMLElement} containerEl
         * @param {Object} dataset
         * @returns {boolean} true if WebGL mounted, false on fallback
         */
        mount(containerEl, dataset) {
            this.unmount();
            if (!containerEl) return false;

            const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE) || null;
            if (!THREE) {
                this._renderFallback(containerEl);
                return false;
            }

            // WebGL detection
            try {
                const testCanvas = document.createElement('canvas');
                const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
                if (!gl) {
                    this._renderFallback(containerEl);
                    return false;
                }
            } catch (e) {
                this._renderFallback(containerEl);
                return false;
            }

            this.container = containerEl;
            this.dataset = dataset || {};

            // 1. Create Canvas
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'udip-profile-bg-gears-canvas udip-global-bg-gears-canvas';
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.zIndex = '0';
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.opacity = '0.12';

            this.container.appendChild(this.canvas);

            const rect = this.container.getBoundingClientRect ? this.container.getBoundingClientRect() : {};
            const width = Math.max(320, this.container.clientWidth || rect.width || (typeof window !== 'undefined' ? window.innerWidth : 1200) || 1200);
            const height = Math.max(400, this.container.clientHeight || rect.height || (typeof window !== 'undefined' ? window.innerHeight : 800) || 800);

            // 2. Setup Three.js Scene, Camera, and Renderer
            this.scene = new THREE.Scene();

            this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 1200);
            this.camera.position.set(0, 0, 165);
            this.camera.lookAt(0, 0, 0);

            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
            this.renderer.setClearColor(0x000000, 0);

            // 3. Dynamic Cybernetic Lighting
            const ambient = new THREE.AmbientLight(0xffffff, 0.7);
            this.scene.add(ambient);

            const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.8);
            dirLight1.position.set(80, 100, 100);
            this.scene.add(dirLight1);

            const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.4);
            dirLight2.position.set(-90, -60, 80);
            this.scene.add(dirLight2);

            const pointLight = new THREE.PointLight(0x10b981, 1.2, 200);
            pointLight.position.set(0, 20, 60);
            this.scene.add(pointLight);

            // 4. Build Master Gears Assembly
            this.gearsGroup = new THREE.Group();
            this.gearsGroup.position.set(25, -10, 0);
            this.gearsGroup.rotation.x = 0.25; // Subtle isometric tilt
            this.gearsGroup.rotation.y = -0.15;
            this.scene.add(this.gearsGroup);

            this._buildInterlockingGears();
            this._buildBackgroundEnergyGrid();
            this._buildAmbientQuantumDust();

            // 5. Event Listeners
            if (typeof window !== 'undefined') {
                window.addEventListener('mousemove', this._onMouseMove, { passive: true });
                window.addEventListener('scroll', this._onScroll, { passive: true });
                window.addEventListener('resize', this._onResize);
            }

            // 6. Start Kinetic Loop
            this.isAlive = true;
            this._animate();

            return true;
        }

        /**
         * Create a 3D Volumetric Extruded Gear Mesh
         * @private
         */
        _createGearMesh(teeth, pitchRadius, thickness, colorHex) {
            const THREE = window.THREE;
            const shape = new THREE.Shape();
            const addendum = 3.6;
            const dedendum = 3.2;
            const rOuter = pitchRadius + addendum;
            const rRoot = pitchRadius - dedendum;
            const rHole = pitchRadius * 0.38;

            const numSteps = teeth * 4;
            const angleStep = (Math.PI * 2) / numSteps;

            for (let i = 0; i <= numSteps; i++) {
                const angle = i * angleStep;
                const toothIndex = Math.floor(i / 4);
                const stepInTooth = i % 4;

                let r = rRoot;
                if (stepInTooth === 1 || stepInTooth === 2) {
                    r = rOuter;
                }

                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;

                if (i === 0) {
                    shape.moveTo(x, y);
                } else {
                    shape.lineTo(x, y);
                }
            }

            // Central Axle Hole
            const holePath = new THREE.Path();
            holePath.absarc(0, 0, rHole, 0, Math.PI * 2, true);
            shape.holes.push(holePath);

            // 4 Symmetrical Cutout Windows inside gear body for high-tech clockwork look
            if (pitchRadius > 20) {
                const spokeHoleRadius = pitchRadius * 0.16;
                const spokeDist = (pitchRadius + rHole) * 0.48;
                for (let k = 0; k < 4; k++) {
                    const spkAngle = (k * Math.PI) / 2 + Math.PI / 4;
                    const sx = Math.cos(spkAngle) * spokeDist;
                    const sy = Math.sin(spkAngle) * spokeDist;
                    const spkHole = new THREE.Path();
                    spkHole.absarc(sx, sy, spokeHoleRadius, 0, Math.PI * 2, true);
                    shape.holes.push(spkHole);
                }
            }

            const extrudeSettings = {
                depth: thickness,
                bevelEnabled: true,
                bevelThickness: 1.2,
                bevelSize: 0.8,
                bevelOffset: 0,
                bevelSegments: 3
            };

            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            geometry.center(); // Center origin

            const material = new THREE.MeshStandardMaterial({
                color: colorHex,
                metalness: 0.85,
                roughness: 0.25,
                emissive: colorHex,
                emissiveIntensity: 0.35,
                transparent: true,
                opacity: 0.95
            });

            const mesh = new THREE.Mesh(geometry, material);

            // Add glowing rim wireframe
            const edges = new THREE.EdgesGeometry(geometry, 25);
            const lineMat = new THREE.LineBasicMaterial({
                color: colorHex,
                transparent: true,
                opacity: 0.65
            });
            const edgeLines = new THREE.LineSegments(edges, lineMat);
            mesh.add(edgeLines);

            // Add central metallic axle hub cylinder
            const hubGeo = new THREE.CylinderGeometry(rHole * 0.7, rHole * 0.7, thickness + 4, 16);
            hubGeo.rotateX(Math.PI / 2);
            const hubMat = new THREE.MeshStandardMaterial({
                color: 0x0f172a,
                metalness: 0.9,
                roughness: 0.15,
                emissive: 0x38bdf8,
                emissiveIntensity: 0.5
            });
            const hubMesh = new THREE.Mesh(hubGeo, hubMat);
            mesh.add(hubMesh);

            return mesh;
        }

        /**
         * Build 4 Interlocking, Meshed 3D Cybernetic Gears
         * @private
         */
        _buildInterlockingGears() {
            this.gears = [];

            // 1. Central Drive Sun Gear (Gear 1)
            const g1Teeth = 24;
            const g1Radius = 38;
            const g1Mesh = this._createGearMesh(g1Teeth, g1Radius, 5.5, 0x38bdf8);
            g1Mesh.position.set(0, 0, 0);
            this.gearsGroup.add(g1Mesh);
            this.gears.push({ mesh: g1Mesh, teeth: g1Teeth, ratio: 1.0, dir: 1, baseRot: 0 });

            // 2. Meshed Pinion Gear (Gear 2 - Upper Left)
            // Distance = g1Radius + g2Radius
            const g2Teeth = 16;
            const g2Radius = 25.5;
            const g2Mesh = this._createGearMesh(g2Teeth, g2Radius, 4.8, 0xa855f7);
            const angleG2 = (145 * Math.PI) / 180;
            const dist12 = g1Radius + g2Radius - 0.4;
            g2Mesh.position.set(Math.cos(angleG2) * dist12, Math.sin(angleG2) * dist12, -2);
            this.gearsGroup.add(g2Mesh);
            this.gears.push({ mesh: g2Mesh, teeth: g2Teeth, ratio: -(g1Teeth / g2Teeth), dir: -1, baseRot: 0.15 });

            // 3. Secondary Interlocking Planetary Gear (Gear 3 - Lower Right)
            const g3Teeth = 20;
            const g3Radius = 31.8;
            const g3Mesh = this._createGearMesh(g3Teeth, g3Radius, 5.0, 0x10b981);
            const angleG3 = (-35 * Math.PI) / 180;
            const dist13 = g1Radius + g3Radius - 0.4;
            g3Mesh.position.set(Math.cos(angleG3) * dist13, Math.sin(angleG3) * dist13, 2);
            this.gearsGroup.add(g3Mesh);
            this.gears.push({ mesh: g3Mesh, teeth: g3Teeth, ratio: -(g1Teeth / g3Teeth), dir: -1, baseRot: 0.1 });

            // 4. High-Speed Clockwork Escapement Cog (Gear 4 - Meshes with Gear 3)
            const g4Teeth = 10;
            const g4Radius = 16.0;
            const g4Mesh = this._createGearMesh(g4Teeth, g4Radius, 3.8, 0xf59e0b);
            const angleG4 = (40 * Math.PI) / 180;
            const dist34 = g3Radius + g4Radius - 0.4;
            g4Mesh.position.set(
                g3Mesh.position.x + Math.cos(angleG4) * dist34,
                g3Mesh.position.y + Math.sin(angleG4) * dist34,
                -1
            );
            this.gearsGroup.add(g4Mesh);
            this.gears.push({ mesh: g4Mesh, teeth: g4Teeth, ratio: (g1Teeth / g3Teeth) * (g3Teeth / g4Teeth), dir: 1, baseRot: 0.25 });
        }

        /**
         * Background Subtle Energy Grid
         * @private
         */
        _buildBackgroundEnergyGrid() {
            const THREE = window.THREE;
            const grid = new THREE.GridHelper(260, 26, 0x1e293b, 0x0f172a);
            grid.rotation.x = Math.PI / 2;
            grid.position.set(0, 0, -35);
            grid.material.transparent = true;
            grid.material.opacity = 0.4;
            this.scene.add(grid);
        }

        /**
         * Ambient Floating Quantum Dust
         * @private
         */
        _buildAmbientQuantumDust() {
            const THREE = window.THREE;
            const count = 100;
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);

            for (let i = 0; i < count; i++) {
                pos[i * 3] = (Math.random() - 0.5) * 220;
                pos[i * 3 + 1] = (Math.random() - 0.5) * 160;
                pos[i * 3 + 2] = (Math.random() - 0.5) * 80;

                colors[i * 3] = 0.22; // cyan #38bdf8
                colors[i * 3 + 1] = 0.74;
                colors[i * 3 + 2] = 0.97;
            }

            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const mat = new THREE.PointsMaterial({
                size: 2.0,
                vertexColors: true,
                transparent: true,
                opacity: 0.45,
                blending: THREE.AdditiveBlending
            });

            this.particleConduit = new THREE.Points(geo, mat);
            this.scene.add(this.particleConduit);
        }

        /**
         * Kinetic Animation Loop
         * @private
         */
        _animate() {
            if (!this.isAlive) return;
            this.animId = requestAnimationFrame(() => this._animate());

            // Smooth momentum decay
            this.momentum *= 0.92;
            this.currentSpeed = this.baseSpeed + this.momentum;

            // Rotate interlocking gears according to their gear ratios
            this.gears.forEach(g => {
                g.mesh.rotation.z += this.currentSpeed * g.ratio;
            });

            // Gentle parallax tilt based on mouse position
            if (this.gearsGroup) {
                const targetRotX = 0.25 + this.mouse.y * 0.12;
                const targetRotY = -0.15 + this.mouse.x * 0.15;
                this.gearsGroup.rotation.x += (targetRotX - this.gearsGroup.rotation.x) * 0.05;
                this.gearsGroup.rotation.y += (targetRotY - this.gearsGroup.rotation.y) * 0.05;
            }

            // Particle drift
            if (this.particleConduit) {
                this.particleConduit.rotation.z += 0.0008;
            }

            this.renderer.render(this.scene, this.camera);
        }

        /**
         * Mouse parallax reaction
         * @private
         */
        _handleMouseMove(e) {
            if (typeof window === 'undefined') return;
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            // Subtly inject kinetic momentum on mouse movement
            this.momentum = Math.min(0.04, this.momentum + 0.0005);
        }

        /**
         * Scroll reaction: gear acceleration giving "gears driving the page" feel
         * @private
         */
        _handleScroll() {
            this.momentum = Math.min(0.06, this.momentum + 0.004);
        }

        /**
         * Responsive resize
         * @private
         */
        _handleResize() {
            if (!this.container || !this.renderer || !this.camera) return;
            const rect = this.container.getBoundingClientRect ? this.container.getBoundingClientRect() : {};
            const width = Math.max(320, this.container.clientWidth || rect.width || (typeof window !== 'undefined' ? window.innerWidth : 1200) || 1200);
            const height = Math.max(400, this.container.clientHeight || rect.height || (typeof window !== 'undefined' ? window.innerHeight : 800) || 800);

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }

        /**
         * Graceful fallback
         * @private
         */
        _renderFallback(container) {
            if (!container) return;
            container.innerHTML = `
                <div class="udip-profile-3d-fallback" style="padding: 24px; text-align: center; color: #94a3b8;">
                    <div style="font-weight: 700; color: #38bdf8; margin-bottom: 4px;">
                        <i class="fas fa-cube"></i> 3D Cybernetic Visualizer
                    </div>
                    <div style="font-size: 11px;">Ambient 3D Cybernetic Engine active. WebGL hardware acceleration in standby.</div>
                </div>
            `;
        }

        /**
         * Compatibility helper methods
         */
        setMode(mode) {
            this.mode = mode;
            return this.mode;
        }

        toggleAutoRotate() {
            this.autoRotate = !this.autoRotate;
            return this.autoRotate;
        }

        toggleWireframe() {
            this.wireframe = !this.wireframe;
            return this.wireframe;
        }

        resetCamera() {
            this.targetDistance = 140;
            if (this.camera) {
                this.camera.position.set(0, 0, 165);
                this.camera.lookAt(0, 0, 0);
            }
        }

        /**
         * Cleanly unmount and dispose of all Three.js GPU resources
         */
        unmount() {
            this.isAlive = false;
            if (this.animId) {
                cancelAnimationFrame(this.animId);
                this.animId = null;
            }

            if (typeof window !== 'undefined') {
                if (typeof window.removeEventListener === 'function') {
                    window.removeEventListener('mousemove', this._onMouseMove);
                    window.removeEventListener('scroll', this._onScroll);
                    window.removeEventListener('resize', this._onResize);
                }
            }

            if (this.scene) {
                this.scene.traverse(obj => {
                    if (obj.geometry) {
                        obj.geometry.dispose();
                    }
                    if (obj.material) {
                        if (Array.isArray(obj.material)) {
                            obj.material.forEach(m => m.dispose());
                        } else {
                            obj.material.dispose();
                        }
                    }
                });
            }

            if (this.renderer) {
                this.renderer.dispose();
                if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                    this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                }
                this.renderer = null;
            }

            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
                this.canvas = null;
            }

            this.scene = null;
            this.camera = null;
            this.container = null;
            this.gearsGroup = null;
            this.gears = [];
            this.particleConduit = null;
        }
    }

    window.UDIP = window.UDIP || {};
    window.UDIP.Profile3DStage = new Profile3DStage();

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
