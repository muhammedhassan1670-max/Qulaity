/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/ml-performance-visualizer.js
 * ============================================================================
 * Renders interactive Machine Learning Performance instruments:
 * Classification Confusion Matrix & Metrics Dials / Regression Parity Scatter.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.MLPerformanceVisualizer = factory(root.UDIP.VisualFormatRegistry);
    }
}(typeof self !== 'undefined' ? self : this, function (Registry) {
    'use strict';

    const Reg = Registry || (typeof window !== 'undefined' && window.UDIP && window.UDIP.VisualFormatRegistry) || {
        safeNum: (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d),
        formatNumber: (v, d = 2) => Number(v || 0).toFixed(d),
        escapeHtml: s => String(s ?? ''),
        buildSvgDefs: () => '',
        PALETTE: { cyan: '#38bdf8', emerald: '#10b981', amber: '#f59e0b', crimson: '#ef4444', textPrimary: '#fff', textSecondary: '#94a3b8' }
    };

    class MLPerformanceVisualizer {
        static render(item = {}, options = {}) {
            const width = Reg.safeNum(options.width, 280);
            const height = Reg.safeNum(options.height, 140);

            const modelName = item.modelName || item.model || 'Gradient Boosted Trees';
            const task = (item.task || 'classification').toLowerCase();

            if (task === 'regression') {
                return this._renderRegression(item, width, height, modelName);
            }
            return this._renderClassification(item, width, height, modelName);
        }

        static _renderClassification(item, width, height, modelName) {
            const f1 = Reg.safeNum(item.f1Score ?? item.f1 ?? 0.88, 0.85);
            const accuracy = Reg.safeNum(item.accuracy ?? 0.91, 0.9);
            const cm = item.confusionMatrix || { tp: 84, fp: 8, fn: 6, tn: 102 };

            const cellW = 54;
            const cellH = 34;
            const startX = width * 0.16;
            const startY = 32;

            return `
            <div class="vi-card vi-ml-card" data-visual-type="mlperformance">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(modelName)}</span>
                    <span class="vi-delta-pill" style="color:${Reg.PALETTE.emerald}; background:${Reg.PALETTE.emerald}18; border-color:${Reg.PALETTE.emerald}40;">
                        F1: ${Reg.formatNumber(f1, 2)}
                    </span>
                </div>

                <div class="vi-canvas-container" style="position:relative; width:100%; height:${height}px;">
                    <svg viewBox="0 0 ${width} ${height}" class="vi-svg" style="width:100%; height:100%;">
                        <!-- Axis Labels -->
                        <text x="${startX + cellW}" y="${startY - 8}" font-size="7.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="middle">PREDICTED</text>
                        <text x="${startX - 10}" y="${startY + cellH}" font-size="7.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="end">ACTUAL</text>

                        <!-- True Positive (TP) -->
                        <rect x="${startX}" y="${startY}" width="${cellW - 2}" height="${cellH - 2}" rx="4" fill="rgba(16,185,129,0.25)" stroke="${Reg.PALETTE.emerald}" stroke-width="1.2" />
                        <text x="${startX + cellW / 2}" y="${startY + 14}" font-size="6.8" fill="${Reg.PALETTE.emerald}" font-family="monospace" text-anchor="middle">TP</text>
                        <text x="${startX + cellW / 2}" y="${startY + 26}" font-size="9" fill="#ffffff" font-weight="700" font-family="monospace" text-anchor="middle">${cm.tp}</text>

                        <!-- False Positive (FP) -->
                        <rect x="${startX + cellW}" y="${startY}" width="${cellW - 2}" height="${cellH - 2}" rx="4" fill="rgba(239,68,68,0.18)" stroke="${Reg.PALETTE.crimson}" stroke-width="1" />
                        <text x="${startX + cellW * 1.5}" y="${startY + 14}" font-size="6.8" fill="${Reg.PALETTE.crimson}" font-family="monospace" text-anchor="middle">FP</text>
                        <text x="${startX + cellW * 1.5}" y="${startY + 26}" font-size="9" fill="#ffffff" font-weight="700" font-family="monospace" text-anchor="middle">${cm.fp}</text>

                        <!-- False Negative (FN) -->
                        <rect x="${startX}" y="${startY + cellH}" width="${cellW - 2}" height="${cellH - 2}" rx="4" fill="rgba(239,68,68,0.18)" stroke="${Reg.PALETTE.crimson}" stroke-width="1" />
                        <text x="${startX + cellW / 2}" y="${startY + cellH + 14}" font-size="6.8" fill="${Reg.PALETTE.crimson}" font-family="monospace" text-anchor="middle">FN</text>
                        <text x="${startX + cellW / 2}" y="${startY + cellH + 26}" font-size="9" fill="#ffffff" font-weight="700" font-family="monospace" text-anchor="middle">${cm.fn}</text>

                        <!-- True Negative (TN) -->
                        <rect x="${startX + cellW}" y="${startY + cellH}" width="${cellW - 2}" height="${cellH - 2}" rx="4" fill="rgba(16,185,129,0.25)" stroke="${Reg.PALETTE.emerald}" stroke-width="1.2" />
                        <text x="${startX + cellW * 1.5}" y="${startY + cellH + 14}" font-size="6.8" fill="${Reg.PALETTE.emerald}" font-family="monospace" text-anchor="middle">TN</text>
                        <text x="${startX + cellW * 1.5}" y="${startY + cellH + 26}" font-size="9" fill="#ffffff" font-weight="700" font-family="monospace" text-anchor="middle">${cm.tn}</text>

                        <!-- Metric Summary Text on Right -->
                        <text x="${width * 0.72}" y="${startY + 20}" font-size="8.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace">Accuracy: <tspan fill="#fff" font-weight="700">${Math.round(accuracy * 100)}%</tspan></text>
                        <text x="${width * 0.72}" y="${startY + 38}" font-size="8.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace">Precision: <tspan fill="${Reg.PALETTE.cyan}" font-weight="700">${Math.round((cm.tp / ((cm.tp + cm.fp) || 1)) * 100)}%</tspan></text>
                        <text x="${width * 0.72}" y="${startY + 56}" font-size="8.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace">Recall: <tspan fill="${Reg.PALETTE.emerald}" font-weight="700">${Math.round((cm.tp / ((cm.tp + cm.fn) || 1)) * 100)}%</tspan></text>
                    </svg>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">F1-SCORE</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.emerald};">${Reg.formatNumber(f1, 2)}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">ACCURACY</span>
                        <span class="vi-metric-val">${Reg.formatNumber(accuracy * 100, 1)}%</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">MISCLASSIFICATION</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.crimson};">${cm.fp + cm.fn} ERRORS</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${Reg.PALETTE.emerald};"></span>
                    <span class="vi-summary-text">Model delivers ${Math.round(accuracy * 100)}% predictive fidelity with low False Positive rate.</span>
                </div>
            </div>
            `;
        }

        static _renderRegression(item, width, height, modelName) {
            const r2 = Reg.safeNum(item.r2 ?? 0.84, 0.8);
            const rmse = Reg.safeNum(item.rmse ?? 2.14, 2.0);
            const pad = 24;

            // Diagonal parity line
            return `
            <div class="vi-card vi-ml-card" data-visual-type="mlperformance">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(modelName)} (Regression)</span>
                    <span class="vi-delta-pill" style="color:${Reg.PALETTE.cyan}; background:${Reg.PALETTE.cyan}18; border-color:${Reg.PALETTE.cyan}40;">
                        R² = ${Reg.formatNumber(r2, 2)}
                    </span>
                </div>

                <div class="vi-canvas-container" style="position:relative; width:100%; height:${height}px;">
                    <svg viewBox="0 0 ${width} ${height}" class="vi-svg" style="width:100%; height:100%;">
                        <!-- 45-degree Perfect Fit Reference Line -->
                        <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${pad}" stroke="rgba(255,255,255,0.25)" stroke-dasharray="3,2" stroke-width="1.2" />
                        
                        <!-- Actual vs Predicted Points -->
                        ${Array.from({ length: 16 }, (_, i) => {
                            const prog = i / 15;
                            const x = pad + prog * (width - pad * 2);
                            const trueY = height - pad - prog * (height - pad * 2);
                            const noise = (Math.sin(i * 991) * 8) * (1 - r2 * 0.5);
                            return `<circle cx="${x.toFixed(1)}" cy="${(trueY + noise).toFixed(1)}" r="2.8" fill="${Reg.PALETTE.cyan}" opacity="0.8" />`;
                        }).join('')}

                        <text x="${pad}" y="${height - 6}" font-size="7.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace">ACTUAL</text>
                        <text x="${width - pad}" y="${height - 6}" font-size="7.5" fill="${Reg.PALETTE.textSecondary}" font-family="monospace" text-anchor="end">PREDICTED</text>
                    </svg>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">R² SCORE</span>
                        <span class="vi-metric-val" style="color:${Reg.PALETTE.cyan};">${Reg.formatNumber(r2, 2)}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">RMSE</span>
                        <span class="vi-metric-val">${Reg.formatNumber(rmse, 2)}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">EXPLAINED VAR</span>
                        <span class="vi-metric-val">${Math.round(r2 * 100)}%</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${Reg.PALETTE.cyan};"></span>
                    <span class="vi-summary-text">Regression manifold tightly tracks parity with RMSE of ${Reg.formatNumber(rmse, 2)}.</span>
                </div>
            </div>
            `;
        }
    }

    return MLPerformanceVisualizer;
}));
