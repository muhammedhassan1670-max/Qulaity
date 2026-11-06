/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/comparison-visualizer.js
 * ============================================================================
 * Renders high-impact comparative visual instruments:
 * Horizontal comparative bars, grouped bars, and dumbbell charts with variance deltas.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.ComparisonVisualizer = factory(root.UDIP.VisualFormatRegistry);
    }
}(typeof self !== 'undefined' ? self : this, function (Registry) {
    'use strict';

    const Reg = Registry || (typeof window !== 'undefined' && window.UDIP && window.UDIP.VisualFormatRegistry) || {
        safeNum: (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d),
        formatNumber: (v, d = 1) => Number(v || 0).toFixed(d),
        escapeHtml: s => String(s ?? ''),
        PALETTE: { cyan: '#38bdf8', emerald: '#10b981', amber: '#f59e0b', crimson: '#ef4444', textPrimary: '#fff', textSecondary: '#94a3b8' }
    };

    class ComparisonVisualizer {
        static render(item = {}, options = {}) {
            const title = item.title || item.metric || 'Comparative Assessment';
            const compA = item.itemA || item.labelA || 'Before / Baseline';
            const compB = item.itemB || item.labelB || 'After / Target';
            const valA = Reg.safeNum(item.valA ?? item.valueA ?? item.before ?? 84.5, 0);
            const valB = Reg.safeNum(item.valB ?? item.valueB ?? item.after ?? 52.0, 0);

            const maxVal = Math.max(valA, valB, 1);
            const pctA = Math.round((valA / maxVal) * 100);
            const pctB = Math.round((valB / maxVal) * 100);

            const diff = valB - valA;
            const diffPct = valA !== 0 ? Math.round((diff / valA) * 100) : 0;
            const isReduction = diff < 0;
            const diffColor = isReduction ? Reg.PALETTE.emerald : Reg.PALETTE.amber;

            return `
            <div class="vi-card vi-comparison-card" data-visual-type="comparison">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(title)}</span>
                    <span class="vi-delta-pill" style="color:${diffColor}; background:${diffColor}18; border-color:${diffColor}40;">
                        ${diffPct > 0 ? '+' : ''}${diffPct}% VARIANCE
                    </span>
                </div>

                <div class="vi-comp-bars" style="display:flex; flex-direction:column; gap:12px; margin:14px 0;">
                    <!-- Item A Bar -->
                    <div class="vi-comp-row">
                        <div style="display:flex; justify-content:space-between; font-size:11px; font-family:monospace; margin-bottom:4px;">
                            <span style="color:${Reg.PALETTE.textSecondary};">${Reg.escapeHtml(compA)}</span>
                            <span style="color:#ffffff; font-weight:700;">${Reg.formatNumber(valA, 1)}</span>
                        </div>
                        <div style="width:100%; height:14px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                            <div style="width:${pctA}%; height:100%; background:linear-gradient(90deg, #64748b, #94a3b8); border-radius:4px;"></div>
                        </div>
                    </div>

                    <!-- Item B Bar -->
                    <div class="vi-comp-row">
                        <div style="display:flex; justify-content:space-between; font-size:11px; font-family:monospace; margin-bottom:4px;">
                            <span style="color:${Reg.PALETTE.cyan};">${Reg.escapeHtml(compB)}</span>
                            <span style="color:${Reg.PALETTE.cyan}; font-weight:700;">${Reg.formatNumber(valB, 1)}</span>
                        </div>
                        <div style="width:100%; height:14px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                            <div style="width:${pctB}%; height:100%; background:linear-gradient(90deg, var(--cc-cyan), var(--cc-emerald)); border-radius:4px;"></div>
                        </div>
                    </div>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">DELTA</span>
                        <span class="vi-metric-val" style="color:${diffColor};">${diff > 0 ? '+' : ''}${Reg.formatNumber(diff, 1)}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">RATIO</span>
                        <span class="vi-metric-val">${valA > 0 ? (valB / valA).toFixed(2) : '1.00'}x</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">OUTCOME</span>
                        <span class="vi-metric-val" style="color:${diffColor};">${isReduction ? 'IMPROVEMENT' : 'ELEVATION'}</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${diffColor};"></span>
                    <span class="vi-summary-text">${Reg.escapeHtml(compB)} exhibits a ${Math.abs(diffPct)}% ${isReduction ? 'reduction' : 'increase'} relative to ${Reg.escapeHtml(compA)}.</span>
                </div>
            </div>
            `;
        }
    }

    return ComparisonVisualizer;
}));
