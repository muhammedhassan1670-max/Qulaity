/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/feature-importance-visualizer.js
 * ============================================================================
 * Renders an interactive Horizontal Ranked Bar Chart for predictive feature importance.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.FeatureImportanceVisualizer = factory(root.UDIP.VisualFormatRegistry);
    }
}(typeof self !== 'undefined' ? self : this, function (Registry) {
    'use strict';

    const Reg = Registry || (typeof window !== 'undefined' && window.UDIP && window.UDIP.VisualFormatRegistry) || {
        safeNum: (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d),
        formatNumber: (v, d = 1) => Number(v || 0).toFixed(d),
        escapeHtml: s => String(s ?? ''),
        PALETTE: { cyan: '#38bdf8', emerald: '#10b981', amber: '#f59e0b', crimson: '#ef4444', textPrimary: '#fff', textSecondary: '#94a3b8' }
    };

    class FeatureImportanceVisualizer {
        static render(item = {}, options = {}) {
            const title = item.title || item.metric || 'Predictive Feature Importance';
            const rawFeatures = Array.isArray(item.features) && item.features.length > 0
                ? item.features
                : [
                    { name: 'Temperature', score: 38 },
                    { name: 'Pressure_Bar', score: 26 },
                    { name: 'Cycle_Speed', score: 19 },
                    { name: 'Moisture_Pct', score: 11 },
                    { name: 'Operator_Exp', score: 6 }
                ];

            const features = rawFeatures.slice(0, 5);
            const topFeature = features[0] || { name: 'None', score: 0 };
            const maxScore = Math.max(...features.map(f => Reg.safeNum(f.score ?? f.importance, 1)), 1);

            return `
            <div class="vi-card vi-importance-card" data-visual-type="featureimportance">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(title)}</span>
                    <span class="vi-delta-pill" style="color:${Reg.PALETTE.cyan}; background:${Reg.PALETTE.cyan}18; border-color:${Reg.PALETTE.cyan}40;">
                        TOP: ${Reg.escapeHtml(topFeature.name)} (${Reg.formatNumber(topFeature.score, 0)}%)
                    </span>
                </div>

                <div class="vi-ranked-bars" style="display:flex; flex-direction:column; gap:9px; margin:14px 0;">
                    ${features.map((f, i) => {
                        const score = Reg.safeNum(f.score ?? f.importance, 0);
                        const pct = Math.round((score / maxScore) * 100);
                        const isTop = i === 0;
                        const barColor = isTop ? 'linear-gradient(90deg, #38bdf8, #818cf8)' : 'linear-gradient(90deg, rgba(56,189,248,0.5), rgba(129,140,248,0.5))';

                        return `
                        <div class="vi-ranked-row">
                            <div style="display:flex; justify-content:space-between; font-size:10.5px; font-family:monospace; margin-bottom:3px;">
                                <span style="color:${isTop ? '#ffffff' : Reg.PALETTE.textSecondary}; font-weight:${isTop ? '700' : '500'};">
                                    #${i + 1} ${Reg.escapeHtml(f.name || `Feature_${i}`)}
                                </span>
                                <span style="color:${isTop ? Reg.PALETTE.cyan : Reg.PALETTE.textSecondary}; font-weight:700;">
                                    ${Reg.formatNumber(score, 1)}%
                                </span>
                            </div>
                            <div style="width:100%; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                                <div style="width:${pct}%; height:100%; background:${barColor}; border-radius:4px; ${isTop ? 'box-shadow:0 0 8px rgba(56,189,248,0.4);' : ''}"></div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">PRIMARY DRIVER</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.cyan};">${Reg.escapeHtml(topFeature.name)}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">TOP CONTRIBUTION</span>
                        <span class="vi-metric-val">${Reg.formatNumber(topFeature.score, 1)}%</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">CUMULATIVE (TOP 2)</span>
                        <span class="vi-metric-val">${Reg.formatNumber(Reg.safeNum(features[0]?.score) + Reg.safeNum(features[1]?.score), 0)}%</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${Reg.PALETTE.cyan};"></span>
                    <span class="vi-summary-text">${Reg.escapeHtml(topFeature.name)} accounts for ${Reg.formatNumber(topFeature.score, 0)}% of model predictive variance.</span>
                </div>
            </div>
            `;
        }
    }

    return FeatureImportanceVisualizer;
}));
