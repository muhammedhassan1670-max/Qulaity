/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/anomaly-visualizer.js
 * ============================================================================
 * Renders an interactive Anomaly Outlier Scatter Plot:
 * Visual boundary separating the normal population cluster from isolated anomaly points.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./visual-format-registry'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./visual-format-registry'));
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.AnomalyVisualizer = factory(root.UDIP.VisualFormatRegistry);
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

    class AnomalyVisualizer {
        static render(item = {}, options = {}) {
            const width = Reg.safeNum(options.width, 280);
            const height = Reg.safeNum(options.height, 140);

            const title = item.title || item.variable || 'Anomaly Distribution';
            const count = Reg.safeNum(item.anomalyCount ?? item.count ?? 7, 0);
            const rate = Reg.safeNum(item.anomalyRate ?? item.rate ?? 1.8, 0);
            const severity = item.severity || 'CRITICAL';
            const sColor = severity === 'CRITICAL' ? Reg.PALETTE.crimson : Reg.PALETTE.amber;

            const uid = Math.random().toString(36).substring(2, 8);

            // Generate normal cluster points around center-left
            const normalPts = [];
            const nCenterX = width * 0.42;
            const nCenterY = height * 0.52;
            for (let i = 0; i < 28; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.sqrt(Math.random()) * 32;
                normalPts.push({
                    x: nCenterX + Math.cos(angle) * r,
                    y: nCenterY + Math.sin(angle) * r
                });
            }

            // Generate isolated anomaly points far out on the right/top
            const anomalyPts = [
                { x: width * 0.82, y: height * 0.25 },
                { x: width * 0.88, y: height * 0.38 },
                { x: width * 0.78, y: height * 0.78 }
            ];

            return `
            <div class="vi-card vi-anomaly-card" data-visual-type="anomaly">
                <div class="vi-card-header">
                    <span class="vi-var-name">${Reg.escapeHtml(title)}</span>
                    <span class="vi-delta-pill" style="color:${sColor}; background:${sColor}18; border-color:${sColor}40;">
                        <i class="fas fa-triangle-exclamation"></i> ${severity}
                    </span>
                </div>

                <div class="vi-canvas-container" style="position:relative; width:100%; height:${height}px;">
                    <svg viewBox="0 0 ${width} ${height}" class="vi-svg" style="width:100%; height:100%;">
                        ${Reg.buildSvgDefs(uid)}
                        ${Reg.buildGrid(width, height, 4, 3)}

                        <!-- Normal Cluster Confidence Hull Ellipse -->
                        <ellipse cx="${nCenterX}" cy="${nCenterY}" rx="46" ry="38" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.3)" stroke-dasharray="3,2" />
                        <text x="${nCenterX}" y="${nCenterY + 44}" font-size="7.5" fill="${Reg.PALETTE.cyan}" font-family="monospace" text-anchor="middle">NORMAL (98.2%)</text>

                        <!-- Normal Data Points -->
                        ${normalPts.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" fill="${Reg.PALETTE.cyan}" opacity="0.65" />`).join('')}

                        <!-- Anomaly Boundary Line -->
                        <line x1="${width * 0.68}" y1="12" x2="${width * 0.68}" y2="${height - 12}" stroke="rgba(239,68,68,0.4)" stroke-dasharray="4,3" stroke-width="1.2" />

                        <!-- Outlier Anomaly Points -->
                        ${anomalyPts.map((p, i) => `
                            <g>
                                <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="8" fill="none" stroke="${sColor}" stroke-width="0.8" opacity="0.5" />
                                <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${sColor}" filter="url(#vi-glow-${uid})" />
                            </g>
                        `).join('')}

                        <text x="${width * 0.84}" y="${height - 10}" font-size="8" fill="${sColor}" font-weight="700" font-family="monospace" text-anchor="middle">ISOLATED OUTLIERS</text>
                    </svg>
                </div>

                <!-- Level 2: Metric Strip -->
                <div class="vi-metric-strip">
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">ANOMALY COUNT</span>
                        <span class="vi-metric-val" style="color:${sColor};">${count}</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">OCCURRENCE RATE</span>
                        <span class="vi-metric-val">${Reg.formatNumber(rate, 2)}%</span>
                    </div>
                    <div class="vi-metric-pill">
                        <span class="vi-metric-lbl">SEPARATION</span>
                        <span class="vi-metric-val">&gt; 3.2&sigma;</span>
                    </div>
                </div>

                <!-- Level 3: Short Interpretation -->
                <div class="vi-summary-line">
                    <span class="vi-status-dot" style="background:${sColor};"></span>
                    <span class="vi-summary-text">${count} observations deviate significantly beyond the nominal confidence boundary.</span>
                </div>
            </div>
            `;
        }
    }

    return AnomalyVisualizer;
}));
