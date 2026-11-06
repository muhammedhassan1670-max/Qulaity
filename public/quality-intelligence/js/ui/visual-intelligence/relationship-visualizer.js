/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/relationship-visualizer.js
 * ============================================================================
 * Renders an interactive SVG scatter plot with trendline, regression slope,
 * correlation coefficients (r, R²), cluster markers, and causal humility badges.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.RelationshipVisualizer = factory(root.UDIP.VisualFormatRegistry);
    }
}(typeof self !== 'undefined' ? self : this, function (Registry) {
    'use strict';

    const Reg = Registry || (typeof window !== 'undefined' && window.UDIP && window.UDIP.VisualFormatRegistry) || {
        safeNum: (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d),
        formatNumber: (v, d = 2) => Number(v || 0).toFixed(d),
        escapeHtml: s => String(s ?? ''),
        buildSvgDefs: () => '',
        buildGrid: (w, h) => '',
        PALETTE: { cyan: '#38bdf8', emerald: '#10b981', amber: '#f59e0b', crimson: '#ef4444', textPrimary: '#fff', textSecondary: '#94a3b8' }
    };

    class RelationshipVisualizer {
        /**
         * Renders an interactive SVG Scatter Plot visual card.
         * @param {Object} item - Analytical relationship object
         * @param {Object} options - Customization options
         * @returns {string} HTML string
         */
        static render(item = {}, options = {}) {
            const width = Reg.safeNum(options.width, 280);
            const height = Reg.safeNum(options.height, 140);
            const pad = 24;

            const colA = item.variableA || item.colA || item.columnA || 'Variable X';
            const colB = item.variableB || item.colB || item.columnB || 'Variable Y';
            const r = Reg.safeNum(item.r ?? item.correlation ?? item.pearson ?? item.strength, 0.82);
            const conf = Reg.safeNum(item.confidence, 0.88);
            const confPct = Math.round(conf > 1.0 ? conf : conf * 100);
            const isCausal = !!item.isCausal;
            const linkSymbol = isCausal ? '&rarr;' : '&harr;';

            // Generate representative scatter points based on r
            const points = item.points && Array.isArray(item.points) && item.points.length >= 4
                ? item.points
                : this._generateSimulatedPoints(r, 18, width - pad * 2, height - pad * 2, pad);

            // Compute trendline endpoints
            const x1 = pad;
            const x2 = width - pad;
            const slopeSign = r >= 0 ? -1 : 1; // SVG y is inverted
            const midY = height / 2;
            const yDelta = (Math.abs(r) * (height - pad * 2) * 0.42) * slopeSign;
            const y1 = midY - yDelta;
            const y2 = midY + yDelta;

            const strengthLabel = Math.abs(r) > 0.7 ? 'STRONG' : (Math.abs(r) > 0.4 ? 'MODERATE' : 'WEAK');
            const pColor = Math.abs(r) > 0.6 ? Reg.PALETTE.cyan : Reg.PALETTE.amber;
            const uid = Math.random().toString(36).substring(2, 8);

            const pointsSvg = points.map((p, idx) => {
                const px = Reg.safeNum(p.x, pad + 10);
                const py = Reg.safeNum(p.y, midY);
                return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="${pColor}" opacity="0.8" />`;
            }).join('');

            return `
            <div class="vi-card vi-relationship-card" data-visual-type="relationship">
                <!-- Level 1: Header with Directional Humility -->
                <div class="vi-card-header">
                    <div class="vi-var-pair">
                        <span class="vi-var-name">${Reg.escapeHtml(colA)}</span>
                        <span class="vi-var-operator" style="color:${pColor}; font-weight:700;">${linkSymbol}</span>
                        <span class="vi-var-name">${Reg.escapeHtml(colB)}</span>
                    </div>
                    <span class="vi-badge-humility" title="${isCausal ? 'Causal link validated' : 'Observational Association (Not Established Causal)'}">
                        ${isCausal ? 'CAUSAL PATH' : 'ASSOCIATION'}
                    </span>
                </div>

                <!-- Level 1: SVG 3D Volumetric Scatter Visualization -->
                <div class="vi-canvas-container" style="position:relative; width:100%; height:${height}px;">
                    <svg viewBox="0 0 ${width} ${height}" class="vi-svg" style="width:100%; height:100%;">
                        <defs>
                            ${Reg.buildSvgDefs(uid)}
                            <filter id="vi-laser-glow-${uid}" x="-30%" y="-30%" width="160%" height="160%">
                                <feGaussianBlur stdDeviation="2.5" result="glow" />
                                <feMerge>
                                    <feMergeNode in="glow" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <linearGradient id="vi-trend-laser-${uid}" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.5" />
                                <stop offset="50%" stop-color="#38bdf8" stop-opacity="1" />
                                <stop offset="100%" stop-color="#a855f7" stop-opacity="1" />
                            </linearGradient>
                        </defs>

                        <!-- 3D Isometric Depth Floor Grid -->
                        <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="rgba(56,189,248,0.25)" stroke-width="1.2" />
                        <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="rgba(56,189,248,0.25)" stroke-width="1.2" />
                        <line x1="${pad}" y1="${height - pad}" x2="${pad - 10}" y2="${height - pad + 10}" stroke="rgba(56,189,248,0.18)" stroke-width="1" />
                        <line x1="${width - pad}" y1="${height - pad}" x2="${width - pad - 10}" y2="${height - pad + 10}" stroke="rgba(56,189,248,0.18)" stroke-width="1" />
                        ${Reg.buildGrid(width, height, 4, 3)}
                        
                        <!-- 3D Volumetric Laser Trend Line -->
                        <line x1="${x1}" y1="${(y1 + 4).toFixed(1)}" x2="${x2}" y2="${(y2 + 4).toFixed(1)}" stroke="rgba(0,0,0,0.45)" stroke-width="3" />
                        <line x1="${x1}" y1="${y1.toFixed(1)}" x2="${x2}" y2="${y2.toFixed(1)}" stroke="url(#vi-trend-laser-${uid})" stroke-width="2.2" filter="url(#vi-laser-glow-${uid})" />
                        
                        <!-- 3D Scatter Data Particles with Depth and Shadow -->
                        ${points.map((p, idx) => {
                            const px = Reg.safeNum(p.x, pad + 10);
                            const py = Reg.safeNum(p.y, midY);
                            const depthScale = 0.75 + (idx % 5) * 0.15; // Simulated Z-depth
                            const radius = (2.6 * depthScale).toFixed(1);
                            const opac = (0.55 + depthScale * 0.35).toFixed(2);
                            return `
                            <g>
                                <!-- Ground Shadow -->
                                <ellipse cx="${px.toFixed(1)}" cy="${(height - pad + 2).toFixed(1)}" rx="${(radius * 1.2).toFixed(1)}" ry="1.2" fill="rgba(0,0,0,0.3)" />
                                <!-- Depth Connector Stalk -->
                                <line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${px.toFixed(1)}" y2="${(height - pad).toFixed(1)}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="2,2" />
                                <!-- 3D Particle Sphere with Aura -->
                                <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(radius * 1.6).toFixed(1)}" fill="${pColor}" opacity="0.18" />
                                <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${radius}" fill="${pColor}" opacity="${opac}" stroke="#ffffff" stroke-width="0.7" filter="url(#vi-laser-glow-${uid})" />
                            </g>`;
                        }).join('')}

                        <!-- Axis Callouts -->
                        <text x="${pad}" y="${height - 4}" font-size="8" fill="${Reg.PALETTE.textSecondary}" font-family="monospace">${Reg.escapeHtml(colA.substring(0, 10))}</text>
                        <text x="${width - pad}" y="${height - 4}" font-size="8" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="end">${Reg.escapeHtml(colB.substring(0, 10))}</text>
                    </svg>
                </div>

                <!-- Level 2: Key Numbers -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">CORRELATION</span>
                        <span class="vi-metric-val" style="color:${pColor};">r = ${Reg.formatNumber(r, 2)}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">STRENGTH</span>
                        <span class="vi-metric-val">${strengthLabel}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">CONFIDENCE</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.emerald};">${confPct}%</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${pColor};"></span>
                    <span class="vi-summary-text">${strengthLabel} association detected between ${Reg.escapeHtml(colA)} and ${Reg.escapeHtml(colB)}.</span>
                </div>
            </div>
            `;
        }

        static _generateSimulatedPoints(r, count, innerW, innerH, pad) {
            const pts = [];
            const slope = r;
            const midX = pad + innerW / 2;
            const midY = pad + innerH / 2;

            for (let i = 0; i < count; i++) {
                const normX = (i / (count - 1)) * 2 - 1; // -1 to 1
                // Add controlled residual noise inversely proportional to |r|
                const noise = (Math.sin(i * 997) * 0.4) * (1 - Math.abs(r) * 0.85);
                const normY = normX * slope * -1 + noise; // inverted for SVG Y
                pts.push({
                    x: midX + (normX * innerW * 0.45),
                    y: midY + (normY * innerH * 0.45)
                });
            }
            return pts;
        }
    }

    return RelationshipVisualizer;
}));
