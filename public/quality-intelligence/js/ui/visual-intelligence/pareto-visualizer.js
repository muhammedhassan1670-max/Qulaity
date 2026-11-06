/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/pareto-visualizer.js
 * ============================================================================
 * Renders an interactive Pareto Chart:
 * Ranked categorical bars + 80% cumulative threshold curve.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.ParetoVisualizer = factory(root.UDIP.VisualFormatRegistry);
    }
}(typeof self !== 'undefined' ? self : this, function (Registry) {
    'use strict';

    const Reg = Registry || (typeof window !== 'undefined' && window.UDIP && window.UDIP.VisualFormatRegistry) || {
        safeNum: (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d),
        formatNumber: (v, d = 1) => Number(v || 0).toFixed(d),
        escapeHtml: s => String(s ?? ''),
        buildSvgDefs: () => '',
        buildGrid: (w, h) => '',
        PALETTE: { cyan: '#38bdf8', emerald: '#10b981', amber: '#f59e0b', crimson: '#ef4444', textPrimary: '#fff', textSecondary: '#94a3b8' }
    };

    class ParetoVisualizer {
        static render(item = {}, options = {}) {
            const width = Reg.safeNum(options.width, 280);
            const height = Reg.safeNum(options.height, 140);
            const padL = 22;   // left pad
            const padR = 22;   // right pad — enough so last bar label never clips
            const padT = 8;
            const padB = 22;   // bottom pad for labels

            const title = item.title || 'Pareto 80/20 Distribution';
            const rawBars = Array.isArray(item.bars) && item.bars.length > 0
                ? item.bars
                : [
                    { name: 'Machine_04', val: 54 },
                    { name: 'Machine_02', val: 28 },
                    { name: 'Machine_07', val: 14 },
                    { name: 'Machine_01', val: 8 },
                    { name: 'Machine_09', val: 4 }
                ];

            const total = rawBars.reduce((s, b) => s + Reg.safeNum(b.val, 0), 0) || 1;
            const maxVal = Math.max(...rawBars.map(b => Reg.safeNum(b.val, 0)), 1);

            const innerW = width - padL - padR;
            const innerH = height - padT - padB;
            const barW = Math.max(4, (innerW / rawBars.length) * 0.6);
            const stepX = innerW / rawBars.length;

            let runningSum = 0;
            const cumulativePts = [];

            const barsSvg = rawBars.map((b, i) => {
                const val = Reg.safeNum(b.val, 0);
                runningSum += val;
                const cumPct = runningSum / total;

                const bx = padL + i * stepX + (stepX - barW) / 2;
                const bh = Math.max(2, (val / maxVal) * (innerH - 6));
                const by = padT + innerH - bh;

                const cx = bx + barW / 2;
                const cy = padT + innerH - cumPct * innerH;
                cumulativePts.push({ x: cx, y: cy });

                const isVital = cumPct <= 0.82;
                const fillColor = isVital ? Reg.PALETTE.cyan : 'rgba(148, 163, 184, 0.4)';

                // Clamp label x so it never clips left or right edge
                const rawLabelX = bx + barW / 2;
                const labelX = Math.min(Math.max(rawLabelX, padL + 8), width - padR - 8);

                return `
                    <rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="${fillColor}" />
                    <text x="${labelX.toFixed(1)}" y="${height - 6}" font-size="7" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">${Reg.escapeHtml((b.name || '').substring(0, 6))}</text>
                `;
            }).join('');

            // Cumulative line path
            let cumLineD = '';
            cumulativePts.forEach((pt, i) => {
                cumLineD += `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} `;
            });

            // 80% threshold line
            const y80 = padT + innerH - 0.80 * innerH;

            const topCount = Math.min(2, rawBars.length);
            const topVal = rawBars.slice(0, topCount).reduce((s, b) => s + Reg.safeNum(b.val, 0), 0);
            const topPct = Math.round((topVal / total) * 100);

            return `
            <div class="vi-card vi-pareto-card" data-visual-type="pareto">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(title)}</span>
                    <span class="vi-delta-pill" style="color:${Reg.PALETTE.amber}; background:${Reg.PALETTE.amber}18; border-color:${Reg.PALETTE.amber}40;">
                        80/20 VITAL FEW
                    </span>
                </div>

                <div class="vi-canvas-container" style="position:relative; width:100%; height:${height}px; overflow:hidden;">
                    <svg viewBox="0 0 ${width} ${height}" class="vi-svg" style="width:100%; height:100%; display:block;">
                        ${Reg.buildGrid(width, height, 4, 3)}

                        <!-- 80% Cutoff Line -->
                        <line x1="${padL}" y1="${y80.toFixed(1)}" x2="${width - padR}" y2="${y80.toFixed(1)}" stroke="${Reg.PALETTE.amber}" stroke-dasharray="3,2" stroke-width="1.2" />
                        <text x="${width - padR - 2}" y="${y80 - 3}" font-size="7" fill="${Reg.PALETTE.amber}" font-family="monospace" text-anchor="end">80%</text>

                        <!-- Bars -->
                        ${barsSvg}

                        <!-- Cumulative 80% Curve -->
                        <path d="${cumLineD}" fill="none" stroke="${Reg.PALETTE.amber}" stroke-width="2" />
                        ${cumulativePts.map(pt => `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="2.5" fill="${Reg.PALETTE.amber}" stroke="#ffffff" stroke-width="1" />`).join('')}
                    </svg>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">TOP CONTRIBUTOR</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.cyan};">${Reg.escapeHtml(rawBars[0]?.name || '')} (${Math.round((rawBars[0]?.val / total) * 100)}%)</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">80% CONCENTRATION</span>
                        <span class="vi-metric-val">TOP ${topCount} OF ${rawBars.length}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">TOTAL VOLUME</span>
                        <span class="vi-metric-val">${total} OBS</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${Reg.PALETTE.cyan};"></span>
                    <span class="vi-summary-text">The top ${topCount} ${topCount === 1 ? 'column accounts' : 'columns account'} for ${topPct}% of total cumulative variance.</span>
                </div>
            </div>
            `;
        }
    }

    return ParetoVisualizer;
}));
