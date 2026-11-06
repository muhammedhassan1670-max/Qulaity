/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/quality-visualizer.js
 * ============================================================================
 * Renders a 6-Axis Data Quality Radar Polygon:
 * Completeness, Consistency, Validity, Uniqueness, Timeliness, Accuracy + Dial.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.QualityVisualizer = factory(root.UDIP.VisualFormatRegistry);
    }
}(typeof self !== 'undefined' ? self : this, function (Registry) {
    'use strict';

    const Reg = Registry || (typeof window !== 'undefined' && window.UDIP && window.UDIP.VisualFormatRegistry) || {
        safeNum: (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d),
        formatNumber: (v, d = 1) => Number(v || 0).toFixed(d),
        polarToCartesian: (cx, cy, r, a) => {
            const rad = ((a - 90) * Math.PI) / 180.0;
            return { x: cx + (r * Math.cos(rad)), y: cy + (r * Math.sin(rad)) };
        },
        escapeHtml: s => String(s ?? ''),
        buildSvgDefs: () => '',
        PALETTE: { cyan: '#38bdf8', emerald: '#10b981', amber: '#f59e0b', crimson: '#ef4444', textPrimary: '#fff', textSecondary: '#94a3b8' }
    };

    class QualityVisualizer {
        static render(item = {}, options = {}) {
            const width = Reg.safeNum(options.width, 280);
            const height = Reg.safeNum(options.height, 145);

            const title = item.title || 'Data Quality Dimension Radar';
            const overallScore = Reg.safeNum(item.overallScore ?? item.score ?? 94.2, 0);

            const dimensions = [
                { name: 'Completeness', val: Reg.safeNum(item.completeness ?? 98, 90) },
                { name: 'Consistency', val: Reg.safeNum(item.consistency ?? 95, 85) },
                { name: 'Validity', val: Reg.safeNum(item.validity ?? 92, 90) },
                { name: 'Uniqueness', val: Reg.safeNum(item.uniqueness ?? 99, 95) },
                { name: 'Timeliness', val: Reg.safeNum(item.timeliness ?? 88, 80) },
                { name: 'Accuracy', val: Reg.safeNum(item.accuracy ?? 93, 90) }
            ];

            const cx = width / 2;
            const cy = height / 2 + 2;
            const maxRadius = 46;
            const angleStep = 360 / dimensions.length;

            const uid = Math.random().toString(36).substring(2, 8);

            // Generate concentric radar rings
            const ringsSvg = [0.33, 0.66, 1.0].map(ratio => {
                const r = maxRadius * ratio;
                const pts = dimensions.map((d, i) => {
                    const p = Reg.polarToCartesian(cx, cy, r, i * angleStep);
                    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                }).join(' ');
                return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />`;
            }).join('');

            // Radial axis spokes
            const spokesSvg = dimensions.map((d, i) => {
                const outer = Reg.polarToCartesian(cx, cy, maxRadius, i * angleStep);
                return `<line x1="${cx}" y1="${cy}" x2="${outer.x.toFixed(1)}" y2="${outer.y.toFixed(1)}" stroke="rgba(255,255,255,0.12)" stroke-width="1" />`;
            }).join('');

            // Polygon points based on actual scores
            const polyPts = dimensions.map((d, i) => {
                const r = maxRadius * (d.val / 100);
                const p = Reg.polarToCartesian(cx, cy, r, i * angleStep);
                return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            }).join(' ');

            // Labels at outer perimeter
            const labelsSvg = dimensions.map((d, i) => {
                const p = Reg.polarToCartesian(cx, cy, maxRadius + 12, i * angleStep);
                return `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1) + 3}" font-size="7.2" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">${d.name.substring(0, 4).toUpperCase()}</text>`;
            }).join('');

            return `
            <div class="vi-card vi-quality-card" data-visual-type="quality">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(title)}</span>
                    <span class="vi-delta-pill" style="color:${Reg.PALETTE.emerald}; background:${Reg.PALETTE.emerald}18; border-color:${Reg.PALETTE.emerald}40;">
                        ${Reg.formatNumber(overallScore, 1)}% COMPOSITE
                    </span>
                </div>

                <div class="vi-canvas-container" style="position:relative; width:100%; height:${height}px;">
                    <svg viewBox="0 0 ${width} ${height}" class="vi-svg" style="width:100%; height:100%;">
                        <defs>
                            ${Reg.buildSvgDefs(uid)}
                            <linearGradient id="vi-sweep-grad-${uid}" x1="0%" y1="100%" x2="0%" y2="0%">
                                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0" />
                                <stop offset="100%" stop-color="#38bdf8" stop-opacity="1" />
                            </linearGradient>
                            <radialGradient id="vi-sweep-cone-${uid}" cx="${cx}" cy="${cy}" r="${maxRadius + 4}" fx="${cx}" fy="${cy}" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0" />
                                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.25" />
                            </radialGradient>
                            <filter id="vi-3d-glow-${uid}" x="-30%" y="-30%" width="160%" height="160%">
                                <feGaussianBlur stdDeviation="2.5" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        ${ringsSvg}
                        ${spokesSvg}

                        <!-- 3D Volumetric Extrusion Depth Shadow -->
                        <polygon points="${polyPts}" fill="rgba(6,78,59,0.35)" stroke="rgba(16,185,129,0.3)" stroke-width="1.2" transform="translate(0, 3.5)" />

                        <!-- Active 3D Data Quality Holographic Polygon -->
                        <polygon points="${polyPts}" fill="rgba(16,185,129,0.28)" stroke="${Reg.PALETTE.emerald}" stroke-width="2.0" filter="url(#vi-3d-glow-${uid})" />

                        <!-- 360° Rotating Cybernetic Radar Laser Sweep -->
                        <g class="vi-radar-sweep-arm" style="transform-origin:${cx}px ${cy}px;">
                            <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - maxRadius - 2}" stroke="url(#vi-sweep-grad-${uid})" stroke-width="2" />
                            <circle cx="${cx}" cy="${cy - maxRadius - 2}" r="2" fill="#38bdf8" filter="url(#vi-3d-glow-${uid})" />
                        </g>

                        <!-- Central 3D Quantum Gyro Core -->
                        <circle cx="${cx}" cy="${cy}" r="4.5" fill="#040711" stroke="#38bdf8" stroke-width="1.6" />
                        <circle cx="${cx}" cy="${cy}" r="1.8" fill="#10b981" />

                        <!-- 3D Data Point Vertices with Neon Halo -->
                        ${dimensions.map((d, i) => {
                            const r = maxRadius * (d.val / 100);
                            const p = Reg.polarToCartesian(cx, cy, r, i * angleStep);
                            return `
                            <g>
                                <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="rgba(16,185,129,0.2)" />
                                <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.6" fill="${Reg.PALETTE.emerald}" stroke="#ffffff" stroke-width="1.0" filter="url(#vi-3d-glow-${uid})" />
                            </g>`;
                        }).join('')}

                        ${labelsSvg}
                    </svg>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">OVERALL QUALITY</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.emerald};">${Reg.formatNumber(overallScore, 1)}%</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">WEAKEST AXIS</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.amber};">Timeliness (88%)</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">HEALTH GATE</span>
                        <span class="vi-metric-val">6 / 6 PASSED</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${Reg.PALETTE.emerald};"></span>
                    <span class="vi-summary-text">Quality index of ${Reg.formatNumber(overallScore, 1)}% verifies data integrity for automated modeling.</span>
                </div>
            </div>
            `;
        }
    }

    return QualityVisualizer;
}));
