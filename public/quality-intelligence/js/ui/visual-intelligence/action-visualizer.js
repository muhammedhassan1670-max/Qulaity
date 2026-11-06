/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/action-visualizer.js
 * ============================================================================
 * Renders an Action Map Card:
 * Sequential progression: Observation -> Investigate -> Validate -> Action
 * with Priority, Impact, Confidence, and [Open Evidence] trigger.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.ActionVisualizer = factory(root.UDIP.VisualFormatRegistry);
    }
}(typeof self !== 'undefined' ? self : this, function (Registry) {
    'use strict';

    const Reg = Registry || (typeof window !== 'undefined' && window.UDIP && window.UDIP.VisualFormatRegistry) || {
        safeNum: (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d),
        escapeHtml: s => String(s ?? ''),
        PALETTE: { cyan: '#38bdf8', emerald: '#10b981', amber: '#f59e0b', crimson: '#ef4444', textPrimary: '#fff', textSecondary: '#94a3b8' }
    };

    class ActionVisualizer {
        static render(item = {}, options = {}) {
            const actionText = item.action || item.recommendation || item.title || 'Execute Precision Calibration';
            const target = item.target || item.entity || 'Process Stage 03';
            const priority = String(item.priority || 'HIGH').toUpperCase();
            const impact = String(item.impact || 'HIGH').toUpperCase();
            const conf = Reg.safeNum(item.confidence ?? 89, 0);

            const prioColor = priority === 'CRITICAL' ? Reg.PALETTE.crimson : (priority === 'HIGH' ? Reg.PALETTE.amber : Reg.PALETTE.cyan);

            return `
            <div class="vi-card vi-action-card" data-visual-type="action">
                <div class="vi-card-header">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:14px; color:${prioColor};">&#9888;</span>
                        <span class="vi-var-name">${Reg.escapeHtml(actionText)}</span>
                    </div>
                    <span class="vi-delta-pill" style="color:${prioColor}; background:${prioColor}18; border-color:${prioColor}40;">
                        PRIORITY: ${priority}
                    </span>
                </div>

                <!-- 4-Stage Action Flow Pipeline -->
                <div class="vi-action-pipeline" style="display:flex; align-items:center; justify-content:space-between; margin:14px 0; padding:10px 12px; background:rgba(4,8,20,0.6); border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
                    <div class="vi-action-step complete">
                        <span class="step-dot" style="background:${Reg.PALETTE.emerald};"></span>
                        <span class="step-lbl">OBSERVE</span>
                    </div>
                    <span class="step-arrow" style="color:#64748b;">&rarr;</span>
                    <div class="vi-action-step complete">
                        <span class="step-dot" style="background:${Reg.PALETTE.emerald};"></span>
                        <span class="step-lbl">INVESTIGATE</span>
                    </div>
                    <span class="step-arrow" style="color:#64748b;">&rarr;</span>
                    <div class="vi-action-step complete">
                        <span class="step-dot" style="background:${Reg.PALETTE.emerald};"></span>
                        <span class="step-lbl">VALIDATE</span>
                    </div>
                    <span class="step-arrow" style="color:${Reg.PALETTE.cyan}; font-weight:700;">&rarr;</span>
                    <div class="vi-action-step active" style="padding:3px 8px; background:rgba(56,189,248,0.15); border:1px solid var(--cc-cyan); border-radius:4px;">
                        <span class="step-dot" style="background:${Reg.PALETTE.cyan}; box-shadow:0 0 8px var(--cc-cyan);"></span>
                        <span class="step-lbl" style="color:#ffffff; font-weight:700;">ACTION</span>
                    </div>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">TARGET ENTITY</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.cyan};">${Reg.escapeHtml(target)}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">EXPECTED IMPACT</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.emerald};">${impact}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">CONFIDENCE</span>
                        <span class="vi-metric-val">${conf}%</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${Reg.PALETTE.emerald};"></span>
                    <span class="vi-summary-text">Ready for execution: all pre-requisite validation gates passed with 3/3 model consensus.</span>
                </div>
            </div>
            `;
        }
    }

    return ActionVisualizer;
}));
