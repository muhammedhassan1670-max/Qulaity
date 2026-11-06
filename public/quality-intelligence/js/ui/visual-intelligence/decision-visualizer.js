/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/decision-visualizer.js
 * ============================================================================
 * Renders an interactive visual Decision Path:
 * State -> Risk -> Evidence -> Options (A, B, C) -> Recommended Action endpoint.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.DecisionVisualizer = factory(root.UDIP.VisualFormatRegistry);
    }
}(typeof self !== 'undefined' ? self : this, function (Registry) {
    'use strict';

    const Reg = Registry || (typeof window !== 'undefined' && window.UDIP && window.UDIP.VisualFormatRegistry) || {
        safeNum: (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d),
        formatNumber: (v, d = 1) => Number(v || 0).toFixed(d),
        escapeHtml: s => String(s ?? ''),
        buildSvgDefs: () => '',
        PALETTE: { cyan: '#38bdf8', emerald: '#10b981', amber: '#f59e0b', crimson: '#ef4444', textPrimary: '#fff', textSecondary: '#94a3b8' }
    };

    class DecisionVisualizer {
        static render(item = {}, options = {}) {
            const width = Reg.safeNum(options.width, 300);
            const height = Reg.safeNum(options.height, 145);

            const title = item.title || item.decision || 'Evidence-Backed Decision Path';
            const action = item.action || item.recommendedAction || 'Recalibrate Line 04 Thermal Sensor';
            const urgency = item.urgency || 'HIGH';
            const conf = Reg.safeNum(item.confidence ?? 91, 0);

            const uid = Math.random().toString(36).substring(2, 8);

            // Flow node coordinates
            const n1x = width * 0.12; const n1y = 40;
            const n2x = width * 0.38; const n2y = 40;
            const n3x = width * 0.65; const n3y = 40;

            const opt1x = width * 0.22; const opt1y = 100;
            const opt2x = width * 0.58; const opt2y = 100; // Recommended Option
            const opt3x = width * 0.88; const opt3y = 100;

            return `
            <div class="vi-card vi-decision-card" data-visual-type="decision">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(title)}</span>
                    <span class="vi-delta-pill" style="color:${Reg.PALETTE.emerald}; background:${Reg.PALETTE.emerald}18; border-color:${Reg.PALETTE.emerald}40;">
                        <i class="fas fa-check-circle"></i> RECOMMENDED PATH
                    </span>
                </div>

                <div class="vi-canvas-container" style="position:relative; width:100%; height:${height}px;">
                    <svg viewBox="0 0 ${width} ${height}" class="vi-svg" style="width:100%; height:100%;">
                        ${Reg.buildSvgDefs(uid)}

                        <!-- Flow Path Lines: Upper Sequence -->
                        <line x1="${n1x + 24}" y1="${n1y}" x2="${n2x - 24}" y2="${n2y}" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
                        <line x1="${n2x + 24}" y1="${n2y}" x2="${n3x - 24}" y2="${n3y}" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />

                        <!-- Flow Down to Options -->
                        <line x1="${n3x}" y1="${n3y + 12}" x2="${opt1x}" y2="${opt1y - 12}" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="2,2" />
                        <line x1="${n3x}" y1="${n3y + 12}" x2="${opt2x}" y2="${opt2y - 12}" stroke="${Reg.PALETTE.emerald}" stroke-width="2" filter="url(#vi-glow-${uid})" />
                        <line x1="${n3x}" y1="${n3y + 12}" x2="${opt3x}" y2="${opt3y - 12}" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="2,2" />

                        <!-- Step 1: State -->
                        <rect x="${n1x - 26}" y="${n1y - 10}" width="52" height="20" rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
                        <text x="${n1x}" y="${n1y + 3}" font-size="7" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">STATE</text>

                        <!-- Step 2: Risk -->
                        <rect x="${n2x - 26}" y="${n2y - 10}" width="52" height="20" rx="4" fill="rgba(245,158,11,0.15)" stroke="${Reg.PALETTE.amber}" stroke-width="1" />
                        <text x="${n2x}" y="${n2y + 3}" font-size="7" fill="${Reg.PALETTE.amber}" font-weight="700" font-family="monospace" text-anchor="middle">RISK</text>

                        <!-- Step 3: Evidence -->
                        <rect x="${n3x - 30}" y="${n3y - 10}" width="60" height="20" rx="4" fill="rgba(56,189,248,0.15)" stroke="${Reg.PALETTE.cyan}" stroke-width="1.2" />
                        <text x="${n3x}" y="${n3y + 3}" font-size="7" fill="${Reg.PALETTE.cyan}" font-weight="700" font-family="monospace" text-anchor="middle">EVIDENCE</text>

                        <!-- Options Row -->
                        <rect x="${opt1x - 28}" y="${opt1y - 10}" width="56" height="24" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
                        <text x="${opt1x}" y="${opt1y}" font-size="7" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">Opt A: Wait</text>
                        <text x="${opt1x}" y="${opt1y + 9}" font-size="6.5" fill="${Reg.PALETTE.crimson}" font-family="monospace" text-anchor="middle">HIGH RISK</text>

                        <!-- Recommended Option B (Highlighted) -->
                        <rect x="${opt2x - 48}" y="${opt2y - 12}" width="96" height="28" rx="4" fill="rgba(16,185,129,0.22)" stroke="${Reg.PALETTE.emerald}" stroke-width="1.8" filter="url(#vi-glow-${uid})" />
                        <text x="${opt2x}" y="${opt2y - 1}" font-size="7.5" fill="#ffffff" font-weight="800" font-family="monospace" text-anchor="middle">&#9733; OPT B: ACTION</text>
                        <text x="${opt2x}" y="${opt2y + 9}" font-size="6.8" fill="${Reg.PALETTE.emerald}" font-weight="700" font-family="monospace" text-anchor="middle">LOW RISK &bull; HIGH IMPACT</text>

                        <rect x="${opt3x - 28}" y="${opt3y - 10}" width="56" height="24" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
                        <text x="${opt3x}" y="${opt3y}" font-size="7" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">Opt C: Halt</text>
                        <text x="${opt3x}" y="${opt3y + 9}" font-size="6.5" fill="${Reg.PALETTE.amber}" font-family="monospace" text-anchor="middle">MED RISK</text>
                    </svg>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">RECOMMENDATION</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.emerald};">${Reg.escapeHtml(action)}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">CONFIDENCE</span>
                        <span class="vi-metric-val">${conf}%</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">URGENCY</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.amber};">${urgency}</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${Reg.PALETTE.emerald};"></span>
                    <span class="vi-summary-text">Option B optimizes outcome while minimizing operational disruption risk.</span>
                </div>
            </div>
            `;
        }
    }

    return DecisionVisualizer;
}));
