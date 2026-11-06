/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/spc-visualizer.js
 * ============================================================================
 * Renders an interactive Statistical Process Control (SPC) Chart:
 * UCL, CL, LCL limits with highlighted special-cause rule violations.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.SPCVisualizer = factory(root.UDIP.VisualFormatRegistry);
    }
}(typeof self !== 'undefined' ? self : this, function (Registry) {
    'use strict';

    const Reg = Registry || (typeof window !== 'undefined' && window.UDIP && window.UDIP.VisualFormatRegistry) || {
        safeNum: (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d),
        formatNumber: (v, d = 1) => Number(v || 0).toFixed(d),
        escapeHtml: s => String(s ?? ''),
        buildSvgDefs: () => '',
        buildGrid: (w, h) => '',
        pointsToSmoothPath: () => '',
        PALETTE: { cyan: '#38bdf8', emerald: '#10b981', amber: '#f59e0b', crimson: '#ef4444', textPrimary: '#fff', textSecondary: '#94a3b8' }
    };

    class SPCVisualizer {
        static render(item = {}, options = {}) {
            const width = Reg.safeNum(options.width, 280);
            const height = Reg.safeNum(options.height, 140);
            const pad = 24;

            const metric = item.metric || item.parameter || 'Process Variance Control';
            const ucl = Reg.safeNum(item.ucl ?? 58.0, 60);
            const cl = Reg.safeNum(item.cl ?? item.mean ?? 50.0, 50);
            const lcl = Reg.safeNum(item.lcl ?? 42.0, 40);
            const cpk = Reg.safeNum(item.cpk ?? 1.24, 1.2);

            const uid = Math.random().toString(36).substring(2, 8);

            const innerW = width - pad * 2;
            const innerH = height - pad * 2;

            // Simulated control observations
            const values = [49, 51, 48, 53, 52, 60, 50, 48, 44, 49, 51, 52];
            const maxVal = ucl + 4;
            const minVal = lcl - 4;
            const range = (maxVal - minVal) || 1;

            const scaleY = v => pad + innerH - ((v - minVal) / range) * innerH;
            const uclY = scaleY(ucl);
            const clY = scaleY(cl);
            const lclY = scaleY(lcl);

            const pts = values.map((val, i) => ({
                x: pad + (i / (values.length - 1)) * innerW,
                y: scaleY(val),
                val: val,
                isViolation: val >= ucl || val <= lcl
            }));

            const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
            const violations = pts.filter(p => p.isViolation).length;

            return `
            <div class="vi-card vi-spc-card" data-visual-type="spc">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(metric)}</span>
                    <span class="vi-delta-pill" style="color:${violations > 0 ? Reg.PALETTE.crimson : Reg.PALETTE.emerald}; background:${violations > 0 ? Reg.PALETTE.crimson : Reg.PALETTE.emerald}18; border-color:${violations > 0 ? Reg.PALETTE.crimson : Reg.PALETTE.emerald}40;">
                        ${violations > 0 ? `${violations} SPECIAL CAUSE DETECTED` : 'PROCESS IN CONTROL'}
                    </span>
                </div>

                <div class="vi-canvas-container" style="position:relative; width:100%; height:${height}px;">
                    <svg viewBox="0 0 ${width} ${height}" class="vi-svg" style="width:100%; height:100%;">
                        ${Reg.buildSvgDefs(uid)}

                        <!-- Upper Control Limit (UCL) -->
                        <line x1="${pad}" y1="${uclY.toFixed(1)}" x2="${width - pad}" y2="${uclY.toFixed(1)}" stroke="${Reg.PALETTE.crimson}" stroke-dasharray="4,2" stroke-width="1.2" />
                        <text x="${width - pad}" y="${uclY - 3}" font-size="7" fill="${Reg.PALETTE.crimson}" font-family="monospace" text-anchor="end">UCL (${Reg.formatNumber(ucl, 1)})</text>

                        <!-- Center Line (CL) -->
                        <line x1="${pad}" y1="${clY.toFixed(1)}" x2="${width - pad}" y2="${clY.toFixed(1)}" stroke="rgba(255,255,255,0.3)" stroke-width="1" />
                        <text x="${width - pad}" y="${clY - 3}" font-size="7" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="end">CL (${Reg.formatNumber(cl, 1)})</text>

                        <!-- Lower Control Limit (LCL) -->
                        <line x1="${pad}" y1="${lclY.toFixed(1)}" x2="${width - pad}" y2="${lclY.toFixed(1)}" stroke="${Reg.PALETTE.crimson}" stroke-dasharray="4,2" stroke-width="1.2" />
                        <text x="${width - pad}" y="${lclY + 8}" font-size="7" fill="${Reg.PALETTE.crimson}" font-family="monospace" text-anchor="end">LCL (${Reg.formatNumber(lcl, 1)})</text>

                        <!-- Process Path -->
                        <path d="${pathD}" fill="none" stroke="${Reg.PALETTE.cyan}" stroke-width="1.8" />

                        <!-- Data Points & Violations -->
                        ${pts.map(p => {
                            if (p.isViolation) {
                                return `
                                    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="7" fill="none" stroke="${Reg.PALETTE.crimson}" stroke-width="1.5" />
                                    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="${Reg.PALETTE.crimson}" filter="url(#vi-glow-${uid})" />
                                `;
                            }
                            return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" fill="${Reg.PALETTE.cyan}" />`;
                        }).join('')}
                    </svg>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">Cpk INDEX</span>
                        <span class="vi-metric-val" style="color:${cpk >= 1.33 ? Reg.PALETTE.emerald : Reg.PALETTE.amber};">${Reg.formatNumber(cpk, 2)}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">VIOLATIONS</span>
                        <span class="vi-metric-val" style="color:${violations > 0 ? Reg.PALETTE.crimson : Reg.PALETTE.emerald};">${violations} POINTS</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">STABILITY</span>
                        <span class="vi-metric-val">${violations > 0 ? 'INVESTIGATE' : 'STABLE'}</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${violations > 0 ? Reg.PALETTE.crimson : Reg.PALETTE.emerald};"></span>
                    <span class="vi-summary-text">${violations > 0 ? 'Point excursion beyond UCL detected; inspect upstream calibration.' : 'Process is operating within statistical control boundaries.'}</span>
                </div>
            </div>
            `;
        }
    }

    return SPCVisualizer;
}));
