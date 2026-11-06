/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/visual-format-registry.js
 * ============================================================================
 * Central registry of visual formatting standards, high-contrast Sci-Fi palettes,
 * SVG geometric generators, and mathematical safety sanitizers.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.VisualFormatRegistry = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const PALETTE = {
        cyan: '#38bdf8',
        cyanGlow: 'rgba(56, 189, 248, 0.35)',
        cyanBg: 'rgba(56, 189, 248, 0.12)',
        emerald: '#10b981',
        emeraldGlow: 'rgba(16, 185, 129, 0.35)',
        emeraldBg: 'rgba(16, 185, 129, 0.12)',
        amber: '#f59e0b',
        amberGlow: 'rgba(245, 158, 11, 0.35)',
        amberBg: 'rgba(245, 158, 11, 0.12)',
        crimson: '#ef4444',
        crimsonGlow: 'rgba(239, 68, 68, 0.35)',
        crimsonBg: 'rgba(239, 68, 68, 0.12)',
        violet: '#818cf8',
        violetGlow: 'rgba(129, 140, 248, 0.35)',
        violetBg: 'rgba(129, 140, 248, 0.12)',
        purple: '#a855f7',
        purpleGlow: 'rgba(168, 85, 247, 0.35)',
        purpleBg: 'rgba(168, 85, 247, 0.12)',
        darkBg: 'rgba(8, 14, 28, 0.85)',
        cardBg: 'rgba(10, 18, 36, 0.78)',
        gridLine: 'rgba(255, 255, 255, 0.07)',
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8',
        textMuted: '#64748b'
    };

    class VisualFormatRegistry {
        static get PALETTE() {
            return PALETTE;
        }

        // --- MATH SAFETY & NUMBER SANITIZATION ---

        static safeNum(val, defaultVal = 0) {
            if (val == null) return defaultVal;
            const num = Number(val);
            return Number.isFinite(num) ? num : defaultVal;
        }

        static clamp(val, min = 0, max = 100) {
            const num = this.safeNum(val, min);
            return Math.max(min, Math.min(max, num));
        }

        static formatNumber(val, decimals = 2) {
            const num = this.safeNum(val, 0);
            return num.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        }

        static formatPercent(val, decimals = 1) {
            const num = this.safeNum(val, 0);
            const pct = num > 1.0 ? num : num * 100;
            return `${this.formatNumber(pct, decimals)}%`;
        }

        static escapeHtml(str) {
            if (str == null) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // --- SVG DEFS & GLOW FILTERS ---

        static buildSvgDefs(uniqueId) {
            return `
            <defs>
                <!-- Glow Filter -->
                <filter id="vi-glow-${uniqueId}" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <!-- Neon Gradients -->
                <linearGradient id="vi-grad-cyan-${uniqueId}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${PALETTE.cyan}" stop-opacity="0.45" />
                    <stop offset="100%" stop-color="${PALETTE.cyan}" stop-opacity="0.0" />
                </linearGradient>
                <linearGradient id="vi-grad-emerald-${uniqueId}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${PALETTE.emerald}" stop-opacity="0.45" />
                    <stop offset="100%" stop-color="${PALETTE.emerald}" stop-opacity="0.0" />
                </linearGradient>
                <linearGradient id="vi-grad-amber-${uniqueId}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${PALETTE.amber}" stop-opacity="0.45" />
                    <stop offset="100%" stop-color="${PALETTE.amber}" stop-opacity="0.0" />
                </linearGradient>
                <linearGradient id="vi-grad-crimson-${uniqueId}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${PALETTE.crimson}" stop-opacity="0.45" />
                    <stop offset="100%" stop-color="${PALETTE.crimson}" stop-opacity="0.0" />
                </linearGradient>
            </defs>
            `;
        }

        // --- COORDINATE GRID HELPER ---

        static buildGrid(width, height, cols = 4, rows = 3) {
            let lines = '';
            for (let i = 1; i < cols; i++) {
                const x = (width / cols) * i;
                lines += `<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${height}" stroke="${PALETTE.gridLine}" stroke-width="1" stroke-dasharray="3,3"/>`;
            }
            for (let j = 1; j < rows; j++) {
                const y = (height / rows) * j;
                lines += `<line x1="0" y1="${y.toFixed(1)}" x2="${width}" y2="${y.toFixed(1)}" stroke="${PALETTE.gridLine}" stroke-width="1" stroke-dasharray="3,3"/>`;
            }
            return lines;
        }

        // --- SMOOTH CATMULL-ROM / CUBIC CURVE GENERATOR ---

        static pointsToSmoothPath(points) {
            if (!Array.isArray(points) || points.length === 0) return '';
            if (points.length === 1) return `M ${this.safeNum(points[0].x)} ${this.safeNum(points[0].y)}`;

            const safePts = points.map(p => ({
                x: this.safeNum(p.x),
                y: this.safeNum(p.y)
            }));

            let d = `M ${safePts[0].x.toFixed(1)} ${safePts[0].y.toFixed(1)}`;
            for (let i = 0; i < safePts.length - 1; i++) {
                const p0 = i > 0 ? safePts[i - 1] : safePts[0];
                const p1 = safePts[i];
                const p2 = safePts[i + 1];
                const p3 = i != safePts.length - 2 ? safePts[i + 2] : p2;

                const cp1x = p1.x + (p2.x - p0.x) / 6;
                const cp1y = p1.y + (p2.y - p0.y) / 6;
                const cp2x = p2.x - (p3.x - p1.x) / 6;
                const cp2y = p2.y - (p3.y - p1.y) / 6;

                d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
            }
            return d;
        }

        static pointsToAreaPath(points, baselineY) {
            const linePath = this.pointsToSmoothPath(points);
            if (!linePath || points.length === 0) return '';
            const last = points[points.length - 1];
            const first = points[0];
            const base = this.safeNum(baselineY, 120);
            return `${linePath} L ${this.safeNum(last.x).toFixed(1)} ${base} L ${this.safeNum(first.x).toFixed(1)} ${base} Z`;
        }

        // --- RADIAL & ARC CALCULATORS ---

        static polarToCartesian(centerX, centerY, radius, angleInDegrees) {
            const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
            return {
                x: centerX + (radius * Math.cos(angleInRadians)),
                y: centerY + (radius * Math.sin(angleInRadians))
            };
        }

        static describeArc(x, y, radius, startAngle, endAngle) {
            const start = this.polarToCartesian(x, y, radius, endAngle);
            const end = this.polarToCartesian(x, y, radius, startAngle);
            const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
            return [
                'M', start.x.toFixed(1), start.y.toFixed(1),
                'A', radius.toFixed(1), radius.toFixed(1), 0, largeArcFlag, 0, end.x.toFixed(1), end.y.toFixed(1)
            ].join(' ');
        }
    }

    return VisualFormatRegistry;
}));
