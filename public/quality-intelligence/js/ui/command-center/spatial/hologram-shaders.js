/**
 * ============================================================================
 * UDIP 3D AI RESEARCH LABORATORY — SPATIAL SUBSYSTEM
 * Module: js/ui/command-center/spatial/hologram-shaders.js
 * ============================================================================
 * Advanced Holographic Shaders & Cybernetic Surface Synthesizers:
 * - GLSL Fresnel Rim-Light Hologram Material:
 *     • View-angle dependent edge radiance (Fresnel equation)
 *     • Continuous vertical scanline sweeps
 *     • Intermittent chromatic micro-glitch displacement
 * - Interactive Cyber Floor Grid Material:
 *     • Dynamic circular shockwave ripple wave equation
 *     • Exponential radial distance attenuation
 *     • Coordinated grid-line illumination upon analytical events
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.SpatialHologramShaders = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class SpatialHologramShaders {
        /**
         * Creates a custom GLSL holographic Fresnel material
         */
        static createHologramMaterial(options = {}) {
            const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE) || null;
            if (!THREE) return null;

            const baseColor = new THREE.Color(options.color || 0x38bdf8);
            const rimColor = new THREE.Color(options.rimColor || 0x67e8f9);

            const uniforms = {
                uTime: { value: 0.0 },
                uBaseColor: { value: baseColor },
                uRimColor: { value: rimColor },
                uFresnelPower: { value: options.fresnelPower || 2.4 },
                uScanlineFrequency: { value: options.scanlines || 18.0 },
                uOpacity: { value: options.opacity || 0.65 },
                uGlitchIntensity: { value: 0.0 }
            };

            const vertexShader = `
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                varying vec2 vUv;
                varying vec3 vWorldPosition;

                uniform float uTime;
                uniform float uGlitchIntensity;

                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewPosition = -mvPosition.xyz;

                    // Micro glitch jitter when excited
                    vec3 transformed = position;
                    if (uGlitchIntensity > 0.01) {
                        float jitter = sin(transformed.y * 20.0 + uTime * 40.0) * uGlitchIntensity;
                        transformed.x += jitter;
                    }

                    vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
                    vWorldPosition = worldPos.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
                }
            `;

            const fragmentShader = `
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                varying vec2 vUv;
                varying vec3 vWorldPosition;

                uniform float uTime;
                uniform vec3 uBaseColor;
                uniform vec3 uRimColor;
                uniform float uFresnelPower;
                uniform float uScanlineFrequency;
                uniform float uOpacity;

                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(vViewPosition);

                    // 1. Fresnel Edge Glow equation
                    float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
                    fresnel = pow(fresnel, uFresnelPower);

                    // 2. Animated Horizontal Scanlines
                    float scanline = 0.82 + 0.18 * sin(vWorldPosition.y * uScanlineFrequency - uTime * 5.0);

                    // 3. Composite Colors
                    vec3 color = mix(uBaseColor, uRimColor, fresnel * 1.2);
                    float alpha = (fresnel * 0.75 + 0.15) * scanline * uOpacity;

                    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
                }
            `;

            return new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                transparent: true,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
        }

        /**
         * Creates an interactive cyber grid floor with shockwave wave equation
         */
        static createCyberFloor(scene, options = {}) {
            const THREE = (typeof window !== 'undefined' && window.THREE) || (typeof globalThis !== 'undefined' && globalThis.THREE) || null;
            if (!THREE || !scene) return null;

            const size = options.size || 800;
            const divisions = options.divisions || 50;

            const uniforms = {
                uTime: { value: 0.0 },
                uGridColor: { value: new THREE.Color(0x38bdf8) },
                uBaseColor: { value: new THREE.Color(0x050813) },
                uShockwavePos: { value: new THREE.Vector2(0, 0) },
                uShockwaveRadius: { value: -100.0 },
                uShockwaveWidth: { value: 35.0 },
                uShockwaveIntensity: { value: 0.0 }
            };

            const vertexShader = `
                varying vec2 vUv;
                varying vec3 vWorldPos;

                void main() {
                    vUv = uv;
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPos = worldPos.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                }
            `;

            const fragmentShader = `
                varying vec2 vUv;
                varying vec3 vWorldPos;

                uniform float uTime;
                uniform vec3 uGridColor;
                uniform vec3 uBaseColor;
                uniform vec2 uShockwavePos;
                uniform float uShockwaveRadius;
                uniform float uShockwaveWidth;
                uniform float uShockwaveIntensity;

                void main() {
                    // Fine grid lines
                    vec2 grid = abs(fract(vWorldPos.xz / 20.0 - 0.5) - 0.5) / fwidth(vWorldPos.xz / 20.0);
                    float line = 1.0 - min(min(grid.x, grid.y), 1.0);

                    // Radial distance to center
                    float distCenter = length(vWorldPos.xz);
                    float edgeFade = smoothstep(400.0, 50.0, distCenter);

                    // Shockwave circle calculation
                    float distShock = length(vWorldPos.xz - uShockwavePos);
                    float shockRing = smoothstep(uShockwaveWidth, 0.0, abs(distShock - uShockwaveRadius)) * uShockwaveIntensity;

                    vec3 col = mix(uBaseColor, uGridColor, line * 0.35 + shockRing * 0.95);
                    float alpha = (line * 0.45 + shockRing * 0.85) * edgeFade;

                    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.85));
                }
            `;

            const geo = new THREE.PlaneGeometry(size, size, 2, 2);
            geo.rotateX(-Math.PI / 2);

            const mat = new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = -76;
            scene.add(mesh);

            return {
                mesh: mesh,
                material: mat,
                triggerShockwave: (x = 0, z = 0) => {
                    uniforms.uShockwavePos.value.set(x, z);
                    uniforms.uShockwaveRadius.value = 0.0;
                    uniforms.uShockwaveIntensity.value = 1.0;
                },
                update: (dt, now) => {
                    uniforms.uTime.value = now * 0.001;
                    if (uniforms.uShockwaveIntensity.value > 0.01) {
                        uniforms.uShockwaveRadius.value += dt * 380.0;
                        uniforms.uShockwaveIntensity.value *= 0.965;
                    } else {
                        uniforms.uShockwaveIntensity.value = 0.0;
                    }
                },
                destroy: () => {
                    scene.remove(mesh);
                    geo.dispose();
                    mat.dispose();
                }
            };
        }
    }

    return SpatialHologramShaders;
}));
