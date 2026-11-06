/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/root-cause-visualizer.js
 * ============================================================================
 * Renders an interactive Hierarchical Root Cause Tree:
 * Root Defect -> Category -> Specific Factor with strongest path illumination.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.RootCauseVisualizer = factory(root.UDIP.VisualFormatRegistry);
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

    class RootCauseVisualizer {
        static render(item = {}, options = {}) {
            const width = Reg.safeNum(options.width, 280);
            const height = Reg.safeNum(options.height, 145);

            const title = item.title || 'Root Cause & Driver Tree';
            const rootLabel = item.defect || item.root || 'DEFECT RATE';
            const strongestFactor = item.strongestFactor || item.topDriver || 'TEMP HIGH (88%)';

            const uid = Math.random().toString(36).substring(2, 8);

            // Coordinates
            const rx = width / 2;
            const ry = 18;

            const c1x = width * 0.20;
            const c2x = width * 0.50;
            const c3x = width * 0.80;
            const cy = 60;

            const f1x = width * 0.20;
            const f2x = width * 0.50; // Strongest path factor
            const f3x = width * 0.80;
            const fy = 106;

            return `
            <div class="vi-card vi-rootcause-card" data-visual-type="rootcause">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(title)}</span>
                    <span class="vi-badge-humility" style="color:${Reg.PALETTE.cyan}; border-color:rgba(56,189,248,0.3);">
                        STRONGEST PATH: ${Reg.escapeHtml(strongestFactor)}
                    </span>
                </div>

                <div class="vi-canvas-container" style="position:relative; width:100%; height:${height}px;">
                    <svg viewBox="0 0 ${width} ${height}" class="vi-svg" style="width:100%; height:100%;">
                        ${Reg.buildSvgDefs(uid)}

                        <!-- Branches: Root to Categories -->
                        <line x1="${rx}" y1="${ry + 10}" x2="${c1x}" y2="${cy - 8}" stroke="rgba(255,255,255,0.18)" stroke-width="1.2" />
                        <line x1="${rx}" y1="${ry + 10}" x2="${c2x}" y2="${cy - 8}" stroke="${Reg.PALETTE.cyan}" stroke-width="2" filter="url(#vi-glow-${uid})" />
                        <line x1="${rx}" y1="${ry + 10}" x2="${c3x}" y2="${cy - 8}" stroke="rgba(255,255,255,0.18)" stroke-width="1.2" />

                        <!-- Branches: Categories to Factors -->
                        <line x1="${c1x}" y1="${cy + 8}" x2="${f1x}" y2="${fy - 8}" stroke="rgba(255,255,255,0.15)" stroke-width="1.2" stroke-dasharray="2,2" />
                        <line x1="${c2x}" y1="${cy + 8}" x2="${f2x}" y2="${fy - 8}" stroke="${Reg.PALETTE.cyan}" stroke-width="2.2" filter="url(#vi-glow-${uid})" />
                        <line x1="${c3x}" y1="${cy + 8}" x2="${f3x}" y2="${fy - 8}" stroke="rgba(255,255,255,0.15)" stroke-width="1.2" stroke-dasharray="2,2" />

                        <!-- Root Node -->
                        <rect x="${rx - 48}" y="${ry - 9}" width="96" height="18" rx="4" fill="rgba(239,68,68,0.2)" stroke="${Reg.PALETTE.crimson}" stroke-width="1.2" />
                        <text x="${rx}" y="${ry + 3}" font-size="8" fill="#ffffff" font-weight="700" font-family="monospace" text-anchor="middle">${Reg.escapeHtml(rootLabel.substring(0, 14))}</text>

                        <!-- Category Nodes -->
                        <rect x="${c1x - 28}" y="${cy - 7}" width="56" height="15" rx="3" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
                        <text x="${c1x}" y="${cy + 3}" font-size="7.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">MACHINE</text>

                        <rect x="${c2x - 30}" y="${cy - 7}" width="60" height="15" rx="3" fill="rgba(56,189,248,0.18)" stroke="${Reg.PALETTE.cyan}" stroke-width="1.4" />
                        <text x="${c2x}" y="${cy + 3}" font-size="7.5" fill="#ffffff" font-weight="700" font-family="monospace" text-anchor="middle">PROCESS</text>

                        <rect x="${c3x - 28}" y="${cy - 7}" width="56" height="15" rx="3" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
                        <text x="${c3x}" y="${cy + 3}" font-size="7.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">MATERIAL</text>

                        <!-- Factor Leaves -->
                        <text x="${f1x}" y="${fy}" font-size="7" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">Vibration</text>
                        <text x="${f1x}" y="${fy + 10}" font-size="7" fill="#64748b" font-family="monospace" text-anchor="middle">Score: 24</text>

                        <!-- Primary Root Cause Factor Leaf (Highlighted) -->
                        <rect x="${f2x - 34}" y="${fy - 7}" width="68" height="24" rx="4" fill="rgba(56,189,248,0.25)" stroke="${Reg.PALETTE.cyan}" stroke-width="1.6" filter="url(#vi-glow-${uid})" />
                        <text x="${f2x}" y="${fy + 2}" font-size="7.5" fill="#ffffff" font-weight="800" font-family="monospace" text-anchor="middle">TEMP HIGH</text>
                        <text x="${f2x}" y="${fy + 11}" font-size="7" fill="${Reg.PALETTE.cyan}" font-weight="700" font-family="monospace" text-anchor="middle">Weight: 0.88</text>

                        <text x="${f3x}" y="${fy}" font-size="7" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">Moisture</text>
                        <text x="${f3x}" y="${fy + 10}" font-size="7" fill="#64748b" font-family="monospace" text-anchor="middle">Score: 31</text>
                    </svg>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">PRIMARY DRIVER</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.cyan};">Temperature</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">PATH WEIGHT</span>
                        <span class="vi-metric-val">0.88 (HIGH)</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">BRANCH</span>
                        <span class="vi-metric-val">PROCESS</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${Reg.PALETTE.cyan};"></span>
                    <span class="vi-summary-text">Process &rarr; Temperature divergence represents the highest empirical association path.</span>
                </div>
            </div>
            `;
        }
    }

    return RootCauseVisualizer;
}));
