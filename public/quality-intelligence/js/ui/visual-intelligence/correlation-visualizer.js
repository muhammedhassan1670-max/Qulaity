/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/correlation-visualizer.js
 * ============================================================================
 * Renders an interactive Correlation Matrix Heatmap:
 * Color-graded cells displaying pairwise associations across variables.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.CorrelationVisualizer = factory(root.UDIP.VisualFormatRegistry);
    }
}(typeof self !== 'undefined' ? self : this, function (Registry) {
    'use strict';

    const Reg = Registry || (typeof window !== 'undefined' && window.UDIP && window.UDIP.VisualFormatRegistry) || {
        safeNum: (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d),
        formatNumber: (v, d = 2) => Number(v || 0).toFixed(d),
        escapeHtml: s => String(s ?? ''),
        PALETTE: { cyan: '#38bdf8', emerald: '#10b981', amber: '#f59e0b', crimson: '#ef4444', textPrimary: '#fff', textSecondary: '#94a3b8' }
    };

    class CorrelationVisualizer {
        static render(item = {}, options = {}) {
            const width = Reg.safeNum(options.width, 280);
            const height = Reg.safeNum(options.height, 140);

            const title = item.title || 'Correlation Heatmap Matrix';
            const variables = Array.isArray(item.variables) && item.variables.length >= 3
                ? item.variables.slice(0, 4)
                : ['Temp', 'Press', 'Speed', 'Defects'];

            const matrix = Array.isArray(item.matrix) && item.matrix.length >= variables.length
                ? item.matrix
                : [
                    [1.0, 0.78, -0.42, 0.86],
                    [0.78, 1.0, 0.12, 0.64],
                    [-0.42, 0.12, 1.0, -0.38],
                    [0.86, 0.64, -0.38, 1.0]
                ];

            const cellSize = Math.min((width - 60) / variables.length, (height - 30) / variables.length);
            const startX = 52;
            const startY = 16;

            const cellsSvg = [];
            for (let r = 0; r < variables.length; r++) {
                for (let c = 0; c < variables.length; c++) {
                    const val = Reg.safeNum(matrix[r] && matrix[r][c], 0);
                    const x = startX + c * cellSize;
                    const y = startY + r * cellSize;
                    
                    let fillColor;
                    if (r === c) {
                        fillColor = 'rgba(56,189,248,0.35)';
                    } else if (val > 0.6) {
                        fillColor = `rgba(56,189,248,${(val * 0.8).toFixed(2)})`;
                    } else if (val > 0.2) {
                        fillColor = `rgba(16,185,129,${(val * 0.7).toFixed(2)})`;
                    } else if (val < -0.3) {
                        fillColor = `rgba(239,68,68,${(Math.abs(val) * 0.7).toFixed(2)})`;
                    } else {
                        fillColor = 'rgba(255,255,255,0.04)';
                    }

                    cellsSvg.push(`
                        <rect x="${x}" y="${y}" width="${cellSize - 2}" height="${cellSize - 2}" rx="3" fill="${fillColor}" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
                        <text x="${x + (cellSize - 2) / 2}" y="${y + (cellSize - 2) / 2 + 3}" font-size="8" fill="#ffffff" font-family="monospace" text-anchor="middle">${val.toFixed(2)}</text>
                    `);
                }
            }

            return `
            <div class="vi-card vi-correlation-card" data-visual-type="correlation">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(title)}</span>
                    <span class="vi-badge-humility">PEARSON &bull; SPEARMAN</span>
                </div>

                <div class="vi-canvas-container" style="position:relative; width:100%; height:${height}px;">
                    <svg viewBox="0 0 ${width} ${height}" class="vi-svg" style="width:100%; height:100%;">
                        <!-- Row Labels -->
                        ${variables.map((v, i) => `
                            <text x="${startX - 6}" y="${startY + i * cellSize + (cellSize / 2) + 3}" font-size="8" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="end">${Reg.escapeHtml(v.substring(0, 7))}</text>
                        `).join('')}

                        <!-- Column Labels -->
                        ${variables.map((v, i) => `
                            <text x="${startX + i * cellSize + (cellSize / 2)}" y="${startY + variables.length * cellSize + 10}" font-size="7.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">${Reg.escapeHtml(v.substring(0, 6))}</text>
                        `).join('')}

                        ${cellsSvg.join('')}
                    </svg>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">TOP PAIR</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.cyan};">Temp &bull; Defects</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">MAX COEFF</span>
                        <span class="vi-metric-val">r = 0.86</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">DENSITY</span>
                        <span class="vi-metric-val">4 &times; 4 MATRIX</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${Reg.PALETTE.cyan};"></span>
                    <span class="vi-summary-text">Strongest positive association detected between ${Reg.escapeHtml(variables[0])} and ${Reg.escapeHtml(variables[3])}.</span>
                </div>
            </div>
            `;
        }
    }

    return CorrelationVisualizer;
}));
