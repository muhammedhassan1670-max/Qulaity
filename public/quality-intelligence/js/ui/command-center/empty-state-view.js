/**
 * UDIP — Universal Data Intelligence Platform
 * Command Center: Empty State Experience (Section 20)
 *
 * Displays a cinematic waiting state when no dataset is loaded:
 * - Dormant 3D nucleus with gentle glowing particle orbits
 * - Philosophy headline: "UDIP does not start with a chart. It starts by understanding the structure of your data."
 * - Primary Action: "LOAD DATASET" file picker
 * - Secondary Action: 3 benchmark dataset cards with topology archetypes & analytical highlights
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        const glob = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
        if (!glob.UDIP) glob.UDIP = {};
        glob.UDIP.EmptyStateView = factory();
    }
}(this, function () {
    'use strict';

    const DEMO_DATASETS = [
        {
            id: 'demo-churn',
            title: 'Customer Churn & Lifetime Value',
            archetype: 'Customer Profile / Behavioral Panel',
            shape: '1,250 rows × 18 columns',
            icon: '👥',
            highlights: [
                'Nonlinear churn propensity manifold',
                'Tenure vs. Monthly charges interaction',
                'Simpsons paradox checked across contract tiers'
            ]
        },
        {
            id: 'demo-retail',
            title: 'Multi-Store Retail Demand',
            archetype: 'Temporal Multi-Entity Hierarchy',
            shape: '2,400 rows × 14 columns',
            icon: '📈',
            highlights: [
                'Weekly seasonality & promotional elasticity',
                'Store cluster topology segmentation',
                'Lasso regularized demand forecasting'
            ]
        },
        {
            id: 'demo-biomarker',
            title: 'Healthcare Outcomes & Biomarkers',
            archetype: 'High-Dimensional Observational Study',
            shape: '850 rows × 22 columns',
            icon: '🧬',
            highlights: [
                'Strict observational humility calibration',
                'Mutual information gene expression networks',
                'Confounder vulnerability matrix & bootstrap CI'
            ]
        }
    ];

    class EmptyStateView {
        constructor() {
            this.animFrameId = null;
        }

        render(container, callbacks = {}) {
            if (!container) return;

            container.innerHTML = `
                <div class="command-center-empty-state">
                    <!-- Background Ambient Spatial Grid -->
                    <div class="empty-state-grid-bg"></div>

                    <!-- Dormant 3D Intelligence Core Canvas -->
                    <div class="empty-nucleus-wrapper">
                        <canvas id="udip-dormant-nucleus-canvas" width="420" height="340"></canvas>
                        <div class="empty-nucleus-status">
                            <span class="status-pulse-dot dormant"></span>
                            <span class="status-text">INTELLIGENCE NUCLEUS — DORMANT / AWAITING DATA</span>
                        </div>
                    </div>

                    <!-- Hero Messaging -->
                    <div class="empty-hero-content">
                        <h1 class="empty-hero-title">Ready to Understand Your Data</h1>
                        <p class="empty-hero-philosophy">
                            "UDIP does not start with a chart. It starts by understanding the structure of your data."
                        </p>
                        <div class="empty-cta-row">
                            <button class="empty-btn-primary" id="udip-empty-load-btn">
                                <span class="btn-icon">📁</span>
                                <span>LOAD DATASET (CSV, JSON, PARQUET)</span>
                            </button>
                        </div>
                    </div>

                    <!-- Benchmark Demo Datasets Grid -->
                    <div class="empty-demos-section">
                        <div class="demos-header-tag">OR INITIALIZE WITH A PRE-CONFIGURED BENCHMARK DATASET:</div>
                        <div class="demo-cards-grid">
                            ${DEMO_DATASETS.map(d => `
                                <div class="demo-dataset-card glassmorphic-panel" data-demo-id="${d.id}">
                                    <div class="demo-card-top">
                                        <span class="demo-card-icon">${d.icon}</span>
                                        <div class="demo-card-title-wrap">
                                            <h3 class="demo-card-title">${d.title}</h3>
                                            <span class="demo-card-archetype">${d.archetype}</span>
                                        </div>
                                    </div>
                                    <div class="demo-card-shape">📐 ${d.shape}</div>
                                    <ul class="demo-highlights-list">
                                        ${d.highlights.map(h => `<li><span class="bullet-dot"></span>${h}</li>`).join('')}
                                    </ul>
                                    <button class="demo-launch-btn" data-demo-id="${d.id}">
                                        <span>EXECUTE AUTONOMOUS ANALYSIS</span>
                                        <span class="btn-arrow">→</span>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            this.initDormantCanvas(container);
            this.bindEvents(container, callbacks);
        }

        initDormantCanvas(container) {
            const canvas = container.querySelector('#udip-dormant-nucleus-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            let angle = 0;
            const particles = [];
            for (let i = 0; i < 60; i++) {
                particles.push({
                    theta: Math.random() * Math.PI * 2,
                    phi: Math.acos((Math.random() * 2) - 1),
                    radius: 70 + Math.random() * 45,
                    speed: 0.003 + Math.random() * 0.005,
                    size: 1.5 + Math.random() * 2
                });
            }

            const renderFrame = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const cx = canvas.width / 2;
                const cy = canvas.height / 2;

                angle += 0.008;

                // Central dormant glow
                const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 90);
                grad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
                grad.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
                grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 90, 0, Math.PI * 2);
                ctx.fill();

                // Orbiting particles
                particles.forEach(p => {
                    p.theta += p.speed;
                    const x = cx + p.radius * Math.sin(p.phi) * Math.cos(p.theta + angle);
                    const y = cy + p.radius * Math.sin(p.phi) * Math.sin(p.theta + angle) * 0.4 + (p.radius * Math.cos(p.phi) * 0.3);
                    const z = p.radius * Math.cos(p.phi);
                    const alpha = Math.max(0.2, (z + 100) / 200);

                    ctx.fillStyle = `rgba(125, 211, 252, ${alpha * 0.7})`;
                    ctx.beginPath();
                    ctx.arc(x, y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Elliptical ring
                ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.ellipse(cx, cy, 110, 45, angle * 0.5, 0, Math.PI * 2);
                ctx.stroke();

                this.animFrameId = requestAnimationFrame(renderFrame);
            };

            renderFrame();
        }

        bindEvents(container, callbacks) {
            const loadBtn = container.querySelector('#udip-empty-load-btn');
            if (loadBtn && callbacks.onUploadClick) {
                loadBtn.addEventListener('click', callbacks.onUploadClick);
            }

            const demoBtns = container.querySelectorAll('.demo-launch-btn');
            demoBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const demoId = btn.getAttribute('data-demo-id');
                    if (callbacks.onLoadDemoClick) {
                        callbacks.onLoadDemoClick(demoId);
                    }
                });
            });

            const demoCards = container.querySelectorAll('.demo-dataset-card');
            demoCards.forEach(card => {
                card.addEventListener('click', () => {
                    const demoId = card.getAttribute('data-demo-id');
                    if (callbacks.onLoadDemoClick) {
                        callbacks.onLoadDemoClick(demoId);
                    }
                });
            });
        }

        destroy() {
            if (this.animFrameId) {
                cancelAnimationFrame(this.animFrameId);
                this.animFrameId = null;
            }
        }
    }

    return new EmptyStateView();
}));
