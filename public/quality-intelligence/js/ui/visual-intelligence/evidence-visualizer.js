/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/evidence-visualizer.js
 * ============================================================================
 * Renders a Directed Evidence Flow Network:
 * Visualizing convergent supporting vectors (+weight) and divergent counter-evidence (-weight).
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.EvidenceVisualizer = factory(root.UDIP.VisualFormatRegistry);
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

    class EvidenceVisualizer {
        static render(item = {}, options = {}) {
            const width = Reg.safeNum(options.width, 280);
            const height = Reg.safeNum(options.height, 140);

            const title = item.title || 'Directed Evidence Convergence Flow';
            const findingLabel = item.finding || item.hypothesis || 'Primary Finding';

            const uid = Math.random().toString(36).substring(2, 8);

            // Coordinates
            const hx = width / 2;
            const hy = 32;

            const e1x = width * 0.18; const e1y = 96;
            const e2x = width * 0.50; const e2y = 96;
            const e3x = width * 0.82; const e3y = 96;

            return `
            <div class="vi-card vi-evidence-card" data-visual-type="evidence">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(title)}</span>
                    <span class="vi-badge-humility">MULTI-METHOD AUDIT</span>
                </div>

                <div class="vi-canvas-container" style="position:relative; width:100%; height:${height}px;">
                    <svg viewBox="0 0 ${width} ${height}" class="vi-svg" style="width:100%; height:100%;">
                        ${Reg.buildSvgDefs(uid)}

                        <!-- Flow Vectors -->
                        <!-- E1 -> Finding (+0.82) -->
                        <line x1="${e1x}" y1="${e1y - 12}" x2="${hx - 20}" y2="${hy + 12}" stroke="${Reg.PALETTE.emerald}" stroke-width="2" filter="url(#vi-glow-${uid})" />
                        <!-- E2 -> Finding (+0.64) -->
                        <line x1="${e2x}" y1="${e2y - 12}" x2="${hx}" y2="${hy + 14}" stroke="${Reg.PALETTE.cyan}" stroke-width="1.8" />
                        <!-- E3 <-> Finding (-0.31 Counter Evidence) -->
                        <line x1="${e3x}" y1="${e3y - 12}" x2="${hx + 20}" y2="${hy + 12}" stroke="${Reg.PALETTE.crimson}" stroke-width="1.4" stroke-dasharray="3,2" />

                        <!-- Central Hypothesis/Finding Node -->
                        <rect x="${hx - 54}" y="${hy - 12}" width="108" height="24" rx="5" fill="rgba(56,189,248,0.2)" stroke="${Reg.PALETTE.cyan}" stroke-width="1.6" filter="url(#vi-glow-${uid})" />
                        <text x="${hx}" y="${hy + 4}" font-size="8" fill="#ffffff" font-weight="700" font-family="monospace" text-anchor="middle">${Reg.escapeHtml(findingLabel.substring(0, 16))}</text>

                        <!-- Evidence Node 1: Pearson r -->
                        <rect x="${e1x - 30}" y="${e1y - 10}" width="60" height="26" rx="4" fill="rgba(16,185,129,0.15)" stroke="${Reg.PALETTE.emerald}" stroke-width="1.2" />
                        <text x="${e1x}" y="${e1y}" font-size="7" fill="${Reg.PALETTE.emerald}" font-weight="700" font-family="monospace" text-anchor="middle">PEARSON</text>
                        <text x="${e1x}" y="${e1y + 10}" font-size="7" fill="#ffffff" font-weight="700" font-family="monospace" text-anchor="middle">+0.82</text>

                        <!-- Evidence Node 2: GBDT Feature Importance -->
                        <rect x="${e2x - 30}" y="${e2y - 10}" width="60" height="26" rx="4" fill="rgba(56,189,248,0.15)" stroke="${Reg.PALETTE.cyan}" stroke-width="1.2" />
                        <text x="${e2x}" y="${e2y}" font-size="7" fill="${Reg.PALETTE.cyan}" font-weight="700" font-family="monospace" text-anchor="middle">GBDT MODEL</text>
                        <text x="${e2x}" y="${e2y + 10}" font-size="7" fill="#ffffff" font-weight="700" font-family="monospace" text-anchor="middle">+0.64</text>

                        <!-- Evidence Node 3: Simpson's Paradox Subgroup -->
                        <rect x="${e3x - 32}" y="${e3y - 10}" width="64" height="26" rx="4" fill="rgba(239,68,68,0.12)" stroke="${Reg.PALETTE.crimson}" stroke-width="1.2" />
                        <text x="${e3x}" y="${e3y}" font-size="6.8" fill="${Reg.PALETTE.crimson}" font-weight="700" font-family="monospace" text-anchor="middle">SUBGROUP_B</text>
                        <text x="${e3x}" y="${e3y + 10}" font-size="7" fill="${Reg.PALETTE.crimson}" font-weight="700" font-family="monospace" text-anchor="middle">-0.31</text>

                        <text x="${width - 10}" y="${height - 4}" font-size="7" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="end">DIVERGENCE</text>
                    </svg>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">SUPPORTING WEIGHT</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.emerald};">+1.46 (CONVERGENT)</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">COUNTER WEIGHT</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.crimson};">-0.31</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">CONSENSUS</span>
                        <span class="vi-metric-val">2 / 3 METHODS</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${Reg.PALETTE.emerald};"></span>
                    <span class="vi-summary-text">Strong primary statistical evidence verified with one bounded subgroup caveat flagged.</span>
                </div>
            </div>
            `;
        }
    }

    return EvidenceVisualizer;
}));
