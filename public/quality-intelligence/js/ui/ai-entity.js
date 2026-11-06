/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: ui/ai-entity.js
 * ============================================================================
 * UDIP Synthetic Intelligence Avatar (AI Entity):
 * An enterprise-grade, non-cartoon synthetic intelligence silhouette
 * constructed from translucent materials, geometric contours, and soft light.
 *
 * Primary uses:
 *   - UDIP Copilot thinking & conversation states
 *   - Autonomous Intelligence continuous learning monitors
 *   - System Overview / Intelligence Core ambient entity
 *   - Background calculation & processing indicator
 *
 * Micro-animations:
 *   - Idle: subtle 4-second sinusoidal luminance breathing
 *   - Scanning: optical wave oscillation across ocular matrix
 *   - Processing: synaptic node pulse
 * ============================================================================
 */

(function (window) {
    'use strict';

    window.UDIP = window.UDIP || {};

    class AIEntitySystem {
        constructor() {
            this.currentState = 'idle'; // 'idle' | 'scanning' | 'processing' | 'alert'
        }

        /**
         * Render SVG vector avatar with precision geometric synthetic silhouette
         * @param {number} size
         * @param {string} state
         * @returns {string} SVG HTML string
         */
        renderAvatarSvg(size = 56, state = 'idle') {
            const uid = 'ai_ent_' + Math.random().toString(36).substr(2, 6);
            return `
            <div class="udip-ai-entity-wrapper udip-ai-state-${state}" data-ai-entity style="width:${size}px; height:${size}px;">
                <svg class="udip-ai-entity-svg" viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <!-- Dark Precision Volumetric Core -->
                        <linearGradient id="grad_core_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#0e1d3d" stop-opacity="0.95" />
                            <stop offset="60%" stop-color="#080e1c" stop-opacity="0.9" />
                            <stop offset="100%" stop-color="#030610" stop-opacity="0.98" />
                        </linearGradient>

                        <!-- Precision Facet Rim -->
                        <linearGradient id="grad_hull_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.75" />
                            <stop offset="50%" stop-color="#1d4ed8" stop-opacity="0.3" />
                            <stop offset="100%" stop-color="#64748b" stop-opacity="0.2" />
                        </linearGradient>

                        <!-- Subtle Soft Glow -->
                        <filter id="glow_${uid}" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    <!-- Coordinate Orientation Reticle -->
                    <circle class="ai-ambient-halo" cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="1 5" />
                    <line x1="50" y1="2" x2="50" y2="7" stroke="rgba(56,189,248,0.4)" stroke-width="1" />
                    <line x1="50" y1="93" x2="50" y2="98" stroke="rgba(56,189,248,0.4)" stroke-width="1" />
                    <line x1="2" y1="50" x2="7" y2="50" stroke="rgba(56,189,248,0.4)" stroke-width="1" />
                    <line x1="93" y1="50" x2="98" y2="50" stroke="rgba(56,189,248,0.4)" stroke-width="1" />

                    <!-- Volumetric Faceted Cranial Shell -->
                    <path class="ai-cranial-shell" d="M32,24 L68,24 L78,40 L72,66 L50,86 L28,66 L22,40 Z"
                          fill="url(#grad_core_${uid})" stroke="url(#grad_hull_${uid})" stroke-width="1.4" />

                    <!-- Internal Facet Edge Contours -->
                    <path class="ai-contour-lines" d="M32,24 L50,42 L68,24 M22,40 L50,42 L78,40 M50,42 L50,86 M28,66 L50,60 L72,66" 
                          fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="0.9" />

                    <!-- Internal Synaptic Neural Lattice -->
                    <g class="ai-neural-lattice" opacity="0.6">
                        <polygon points="50,32 57,36 57,44 50,48 43,44 43,36" fill="none" stroke="rgba(56, 189, 248, 0.5)" stroke-width="1" />
                        <circle cx="50" cy="32" r="1.2" fill="#38bdf8" />
                        <circle cx="57" cy="36" r="1.2" fill="#38bdf8" />
                        <circle cx="57" cy="44" r="1.2" fill="#38bdf8" />
                        <circle cx="50" cy="48" r="1.2" fill="#38bdf8" />
                        <circle cx="43" cy="44" r="1.2" fill="#38bdf8" />
                        <circle cx="43" cy="36" r="1.2" fill="#38bdf8" />
                    </g>

                    <!-- Horizontal Optical Scanning Beam (Visor Band) -->
                    <line class="ai-ocular-band" x1="26" y1="46" x2="74" y2="46" stroke="rgba(56, 189, 248, 0.7)" stroke-width="1.6" stroke-linecap="round" filter="url(#glow_${uid})" />
                    <circle class="ai-synaptic-pulse" cx="50" cy="46" r="2.2" fill="#38bdf8" />
                    <circle cx="50" cy="46" r="1" fill="#ffffff" />
                </svg>
            </div>
            `;
        }

        /**
         * Render a full intelligence agent status panel for Copilot or Autonomous view
         */
        renderAgentHeader(title = 'UDIP Synthetic Intelligence', statusText = 'ONLINE // AUTONOMOUS MATRIX READY') {
            return `
            <div class="udip-ai-entity-card">
                <div class="udip-ai-entity-avatar-box">
                    ${this.renderAvatarSvg(64, this.currentState)}
                    <div class="udip-ai-status-ring"></div>
                </div>
                <div class="udip-ai-entity-info">
                    <div class="udip-ai-entity-badge">
                        <span class="udip-ai-status-dot"></span>
                        <span class="udip-ai-system-label">ENTERPRISE AGENTIC CORE</span>
                    </div>
                    <h3 class="udip-ai-entity-title">${title}</h3>
                    <p class="udip-ai-entity-status">${statusText}</p>
                </div>
                <div class="udip-ai-telemetry">
                    <div class="udip-ai-telemetry-chip">
                        <span class="lbl">LATENCY</span>
                        <span class="val">1.2ms</span>
                    </div>
                    <div class="udip-ai-telemetry-chip">
                        <span class="lbl">GROUNDING</span>
                        <span class="val" style="color:#10b981;">100%</span>
                    </div>
                    <div class="udip-ai-telemetry-chip">
                        <span class="lbl">MODE</span>
                        <span class="val" style="color:#38bdf8;">ACTIVE</span>
                    </div>
                </div>
            </div>
            `;
        }

        /**
         * Render a compact, sophisticated Synthetic AI Observer Widget for the Command Center Hero
         */
        renderObserverWidget(title = 'Synthetic Intelligence Observer', statusDetail = 'Continuous data observation // Zero ungrounded claims') {
            return `
            <div class="udip-observer-sidebar">
                <div class="udip-observer-hero-card">
                    <div class="udip-observer-top-row">
                        <div class="udip-observer-avatar-container">
                            ${this.renderAvatarSvg(58, this.currentState)}
                        </div>
                        <div class="udip-observer-meta">
                            <div class="udip-observer-badge">
                                <span class="udip-ai-status-dot"></span>
                                <span>AI OBSERVER // ONLINE</span>
                            </div>
                            <h4 class="udip-observer-title">${title}</h4>
                            <p class="udip-observer-status">${statusDetail}</p>
                        </div>
                    </div>

                    <div class="udip-observer-metrics-grid">
                        <div class="udip-obs-metric">
                            <span class="lbl">GROUNDING</span>
                            <span class="val" style="color:#10b981;"><i class="fas fa-shield-check"></i> 100%</span>
                        </div>
                        <div class="udip-obs-metric">
                            <span class="lbl">UNCERTAINTY</span>
                            <span class="val" style="color:#38bdf8;">CALIBRATED</span>
                        </div>
                        <div class="udip-obs-metric">
                            <span class="lbl">SURVEILLANCE</span>
                            <span class="val" style="color:#a855f7;">ACTIVE</span>
                        </div>
                    </div>

                    <div class="udip-observer-action-bar">
                        <button type="button" class="udip-btn udip-btn-secondary udip-btn-xs" id="udip-hero-launch-copilot" style="width:100%; gap:8px;">
                            <i class="fas fa-sparkles" style="color:#38bdf8;"></i> Inquire Copilot About Current State
                        </button>
                    </div>
                </div>
            </div>
            `;
        }

        /**
         * Dynamically update active entity avatars in the DOM
         */
        setState(state) {
            this.currentState = state;
            const entities = document.querySelectorAll('[data-ai-entity]');
            entities.forEach(el => {
                el.classList.remove('udip-ai-state-idle', 'udip-ai-state-scanning', 'udip-ai-state-processing', 'udip-ai-state-alert');
                el.classList.add(`udip-ai-state-${state}`);
            });
        }
    }

    window.UDIP.AIEntity = new AIEntitySystem();

})(typeof window !== 'undefined' ? window : global);
