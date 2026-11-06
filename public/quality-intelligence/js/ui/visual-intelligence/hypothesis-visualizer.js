/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/hypothesis-visualizer.js
 * ============================================================================
 * Renders a visual Hypothesis Balance Scale:
 * Supporting Evidence % vs Contradicting Evidence % with validation status stamp.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.HypothesisVisualizer = factory(root.UDIP.VisualFormatRegistry);
    }
}(typeof self !== 'undefined' ? self : this, function (Registry) {
    'use strict';

    const Reg = Registry || (typeof window !== 'undefined' && window.UDIP && window.UDIP.VisualFormatRegistry) || {
        safeNum: (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d),
        formatNumber: (v, d = 1) => Number(v || 0).toFixed(d),
        escapeHtml: s => String(s ?? ''),
        PALETTE: { cyan: '#38bdf8', emerald: '#10b981', amber: '#f59e0b', crimson: '#ef4444', textPrimary: '#fff', textSecondary: '#94a3b8' }
    };

    class HypothesisVisualizer {
        static render(item = {}, options = {}) {
            const hid = item.id || 'H1';
            const statement = item.statement || item.title || 'Temperature directly correlates with defect density';
            const status = String(item.status || 'SUPPORTED').toUpperCase();
            const suppScore = Reg.safeNum(item.supportingScore ?? item.supportPct ?? 76, 50);
            const contraScore = Reg.safeNum(item.contraScore ?? item.contraPct ?? (100 - suppScore), 24);
            const conf = Reg.safeNum(item.confidence ?? 86, 0);

            const sColor = status === 'SUPPORTED' ? Reg.PALETTE.emerald : (status === 'CHALLENGED' ? Reg.PALETTE.crimson : Reg.PALETTE.amber);

            return `
            <div class="vi-card vi-hypothesis-card" data-visual-type="hypothesis">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(hid)}: ${Reg.escapeHtml(statement)}</span>
                    <span class="vi-delta-pill" style="color:${sColor}; background:${sColor}18; border-color:${sColor}40;">
                        ${status}
                    </span>
                </div>

                <!-- Visual Evidence Balance Scale -->
                <div class="vi-balance-scale" style="margin:14px 0;">
                    <div style="display:flex; justify-content:space-between; font-size:10.5px; font-family:monospace; margin-bottom:4px;">
                        <span style="color:${Reg.PALETTE.emerald}; font-weight:700;">SUPPORTING (${suppScore}%)</span>
                        <span style="color:${Reg.PALETTE.crimson}; font-weight:700;">CONTRADICTING (${contraScore}%)</span>
                    </div>

                    <!-- Dual Split Balance Bar -->
                    <div style="display:flex; width:100%; height:14px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden; gap:2px;">
                        <div style="width:${suppScore}%; height:100%; background:linear-gradient(90deg, #10b981, #38bdf8); border-radius:3px 0 0 3px;"></div>
                        <div style="width:${contraScore}%; height:100%; background:linear-gradient(90deg, #f59e0b, #ef4444); border-radius:0 3px 3px 0;"></div>
                    </div>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">CONFIDENCE</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.emerald};">${conf}%</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">EVIDENCE RATIO</span>
                        <span class="vi-metric-val">${(suppScore / (contraScore || 1)).toFixed(1)} : 1</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">STATUS</span>
                        <span class="vi-metric-val" style="color:${sColor};">${status}</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${sColor};"></span>
                    <span class="vi-summary-text">${status === 'SUPPORTED' ? 'Robust empirical evidence confirms hypothesis with minimal counter-evidence.' : 'Hypothesis actively challenged by contradictory observations.'}</span>
                </div>
            </div>
            `;
        }
    }

    return HypothesisVisualizer;
}));
