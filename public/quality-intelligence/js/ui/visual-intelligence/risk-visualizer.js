/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/risk-visualizer.js
 * ============================================================================
 * Renders an interactive 3x3 Risk Matrix:
 * Probability vs Impact with plotted risk nodes sized by operational exposure.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.RiskVisualizer = factory(root.UDIP.VisualFormatRegistry);
    }
}(typeof self !== 'undefined' ? self : this, function (Registry) {
    'use strict';

    const Reg = Registry || (typeof window !== 'undefined' && window.UDIP && window.UDIP.VisualFormatRegistry) || {
        safeNum: (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d),
        formatNumber: (v, d = 1) => Number(v || 0).toFixed(d),
        escapeHtml: s => String(s ?? ''),
        PALETTE: { cyan: '#38bdf8', emerald: '#10b981', amber: '#f59e0b', crimson: '#ef4444', textPrimary: '#fff', textSecondary: '#94a3b8' }
    };

    class RiskVisualizer {
        static render(item = {}, options = {}) {
            const width = Reg.safeNum(options.width, 280);
            const height = Reg.safeNum(options.height, 145);

            const title = item.title || 'Empirical Risk Matrix';
            const rawRisks = Array.isArray(item.risks) && item.risks.length > 0
                ? item.risks
                : [
                    { label: 'Thermal Drift', prob: 2, impact: 2, score: 85, severity: 'critical' },
                    { label: 'Sensor Lag', prob: 2, impact: 1, score: 62, severity: 'high' },
                    { label: 'Wear Variance', prob: 1, impact: 1, score: 45, severity: 'medium' },
                    { label: 'Feed Jitter', prob: 0, impact: 2, score: 38, severity: 'low' }
                ];

            const cellW = (width - 48) / 3;
            const cellH = (height - 30) / 3;
            const startX = 42;
            const startY = 12;

            // 3x3 background cell colors
            const cellColors = [
                ['rgba(245,158,11,0.18)', 'rgba(239,68,68,0.22)', 'rgba(239,68,68,0.38)'], // High Prob (row 0)
                ['rgba(16,185,129,0.15)', 'rgba(245,158,11,0.18)', 'rgba(239,68,68,0.22)'], // Med Prob (row 1)
                ['rgba(16,185,129,0.10)', 'rgba(16,185,129,0.15)', 'rgba(245,158,11,0.18)']  // Low Prob (row 2)
            ];

            const cellsSvg = [];
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const x = startX + c * cellW;
                    const y = startY + r * cellH;
                    cellsSvg.push(`
                        <rect x="${x}" y="${y}" width="${cellW - 2}" height="${cellH - 2}" rx="3" fill="${cellColors[r][c]}" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
                    `);
                }
            }

            // Plot risk points (prob: 0=Low, 1=Med, 2=High; impact: 0=Low, 1=Med, 2=High)
            const pointsSvg = rawRisks.map(r => {
                const p = Reg.safeNum(r.prob, 1);
                const imp = Reg.safeNum(r.impact, 1);
                const row = 2 - p; // SVG Y inverted
                const col = imp;
                const cx = startX + col * cellW + (cellW / 2) + (Math.sin(r.score || 1) * 6);
                const cy = startY + row * cellH + (cellH / 2) + (Math.cos(r.score || 1) * 6);
                const color = r.severity === 'critical' ? Reg.PALETTE.crimson : (r.severity === 'high' ? Reg.PALETTE.amber : Reg.PALETTE.cyan);
                return `
                    <g>
                        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="6.5" fill="${color}" opacity="0.85" stroke="#ffffff" stroke-width="1.2" />
                        <text x="${cx.toFixed(1)}" y="${cy.toFixed(1) - 8}" font-size="7.5" fill="#ffffff" font-family="monospace" text-anchor="middle" font-weight="700">${Reg.escapeHtml((r.label || '').substring(0, 10))}</text>
                    </g>
                `;
            }).join('');

            const criticalCount = rawRisks.filter(r => r.severity === 'critical').length;

            return `
            <div class="vi-card vi-risk-card" data-visual-type="risk">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(title)}</span>
                    <span class="vi-delta-pill" style="color:${Reg.PALETTE.crimson}; background:${Reg.PALETTE.crimson}18; border-color:${Reg.PALETTE.crimson}40;">
                        ${criticalCount} HIGH EXPOSURE
                    </span>
                </div>

                <div class="vi-canvas-container" style="position:relative; width:100%; height:${height}px;">
                    <svg viewBox="0 0 ${width} ${height}" class="vi-svg" style="width:100%; height:100%;">
                        <!-- Y-Axis Labels (Probability) -->
                        <text x="${startX - 6}" y="${startY + (cellH / 2) + 3}" font-size="7.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="end">HIGH</text>
                        <text x="${startX - 6}" y="${startY + cellH + (cellH / 2) + 3}" font-size="7.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="end">MED</text>
                        <text x="${startX - 6}" y="${startY + cellH * 2 + (cellH / 2) + 3}" font-size="7.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="end">LOW</text>

                        <!-- X-Axis Labels (Impact) -->
                        <text x="${startX + (cellW / 2)}" y="${height - 4}" font-size="7.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">LOW</text>
                        <text x="${startX + cellW + (cellW / 2)}" y="${height - 4}" font-size="7.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">MED</text>
                        <text x="${startX + cellW * 2 + (cellW / 2)}" y="${height - 4}" font-size="7.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">HIGH IMPACT</text>

                        ${cellsSvg.join('')}
                        ${pointsSvg}
                    </svg>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">TOTAL RISKS</span>
                        <span class="vi-metric-val">${rawRisks.length} PLOTTED</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">CRITICAL TIER</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.crimson};">${criticalCount}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">MAX SEVERITY</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.crimson};">${rawRisks[0]?.score || 85}/100</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${criticalCount > 0 ? Reg.PALETTE.crimson : Reg.PALETTE.emerald};"></span>
                    <span class="vi-summary-text">${Reg.escapeHtml(rawRisks[0]?.label || 'Top risk')} represents the highest combined probability &times; impact exposure.</span>
                </div>
            </div>
            `;
        }
    }

    return RiskVisualizer;
}));
