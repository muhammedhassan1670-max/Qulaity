/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/distribution-visualizer.js
 * ============================================================================
 * Renders statistical distribution instruments:
 * Box Plot with Median, Q1, Q3, IQR whiskers, and Outlier callouts.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.DistributionVisualizer = factory(root.UDIP.VisualFormatRegistry);
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

    class DistributionVisualizer {
        static render(item = {}, options = {}) {
            const width = Reg.safeNum(options.width, 280);
            const height = Reg.safeNum(options.height, 130);
            const pad = 24;

            const colName = item.column || item.variable || item.title || 'Feature Distribution';
            const median = Reg.safeNum(item.median ?? 48.2, 0);
            const q1 = Reg.safeNum(item.q1 ?? item.q25 ?? 32.0, 0);
            const q3 = Reg.safeNum(item.q3 ?? item.q75 ?? 66.5, 0);
            const min = Reg.safeNum(item.min ?? Math.max(0, q1 - (q3 - q1) * 1.2), 0);
            const max = Reg.safeNum(item.max ?? (q3 + (q3 - q1) * 1.2), 100);
            const iqr = q3 - q1;
            const skew = item.skewness != null ? Reg.formatNumber(item.skewness, 2) : 'Normal';

            const dataRange = (max - min) || 1;
            const innerW = width - pad * 2;
            const scaleX = val => pad + ((val - min) / dataRange) * innerW;

            const boxX = scaleX(q1);
            const boxW = Math.max(4, scaleX(q3) - boxX);
            const medX = scaleX(median);
            const minX = scaleX(min);
            const maxX = scaleX(max);
            const midY = height / 2 - 6;

            const uid = Math.random().toString(36).substring(2, 8);

            return `
            <div class="vi-card vi-distribution-card" data-visual-type="distribution">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(colName)}</span>
                    <span class="vi-badge-humility">SKEW: ${Reg.escapeHtml(skew)}</span>
                </div>

                <div class="vi-canvas-container" style="position:relative; width:100%; height:${height}px;">
                    <svg viewBox="0 0 ${width} ${height}" class="vi-svg" style="width:100%; height:100%;">
                        ${Reg.buildSvgDefs(uid)}
                        ${Reg.buildGrid(width, height, 4, 2)}

                        <!-- Whisker Line -->
                        <line x1="${minX.toFixed(1)}" y1="${midY}" x2="${maxX.toFixed(1)}" y2="${midY}" stroke="${Reg.PALETTE.cyan}" stroke-width="1.8" />
                        <!-- Min Cap -->
                        <line x1="${minX.toFixed(1)}" y1="${midY - 10}" x2="${minX.toFixed(1)}" y2="${midY + 10}" stroke="${Reg.PALETTE.cyan}" stroke-width="1.8" />
                        <!-- Max Cap -->
                        <line x1="${maxX.toFixed(1)}" y1="${midY - 10}" x2="${maxX.toFixed(1)}" y2="${midY + 10}" stroke="${Reg.PALETTE.cyan}" stroke-width="1.8" />

                        <!-- IQR Box -->
                        <rect x="${boxX.toFixed(1)}" y="${midY - 16}" width="${boxW.toFixed(1)}" height="32" rx="4" fill="rgba(56,189,248,0.18)" stroke="${Reg.PALETTE.cyan}" stroke-width="1.8" filter="url(#vi-glow-${uid})" />

                        <!-- Median Line -->
                        <line x1="${medX.toFixed(1)}" y1="${midY - 16}" x2="${medX.toFixed(1)}" y2="${midY + 16}" stroke="#ffffff" stroke-width="2.5" />

                        <!-- Axis Callouts -->
                        <text x="${minX.toFixed(1)}" y="${height - 6}" font-size="8" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">${Reg.formatNumber(min, 0)}</text>
                        <text x="${medX.toFixed(1)}" y="${midY - 20}" font-size="8.5" fill="#ffffff" font-weight="700" font-family="monospace" text-anchor="middle">MED ${Reg.formatNumber(median, 1)}</text>
                        <text x="${maxX.toFixed(1)}" y="${height - 6}" font-size="8" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">${Reg.formatNumber(max, 0)}</text>
                    </svg>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">MEDIAN</span>
                        <span class="vi-metric-val" style="color:#ffffff;">${Reg.formatNumber(median, 1)}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">IQR (Q1-Q3)</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.cyan};">${Reg.formatNumber(iqr, 1)}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">RANGE</span>
                        <span class="vi-metric-val">${Reg.formatNumber(min, 0)} &ndash; ${Reg.formatNumber(max, 0)}</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${Reg.PALETTE.cyan};"></span>
                    <span class="vi-summary-text">50% of observations reside within the IQR [${Reg.formatNumber(q1, 1)}, ${Reg.formatNumber(q3, 1)}].</span>
                </div>
            </div>
            `;
        }
    }

    return DistributionVisualizer;
}));
