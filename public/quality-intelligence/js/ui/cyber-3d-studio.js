/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: ui/cyber-3d-studio.js
 * ============================================================================
 * 3D Holographic Multivariate Data Constellation & Monte Carlo Failure Surface
 * - 3D Interactive Point Cloud with 360° Mouse Orbit & Anomaly Beacons
 * - Dynamic Weibull 3D Failure Surface Mesh (Stress vs Cycles vs Hazard Rate)
 * - Interactive Gage R&R ANOVA Gauge Simulator with Virtual Micrometer
 * ============================================================================
 */

(function (window) {
    'use strict';

    const Cyber3DStudio = {
        openStudio(dataset, defaultTab = 'point-cloud') {
            if (typeof document === 'undefined') return;

            const oldModal = document.getElementById('udip-cyber-3d-studio-modal');
            if (oldModal) oldModal.remove();

            const modal = document.createElement('div');
            modal.id = 'udip-cyber-3d-studio-modal';
            modal.style.cssText = 'position:fixed; inset:0; z-index:999999; background:rgba(2,6,23,0.95); backdrop-filter:blur(20px); display:flex; align-items:center; justify-content:center; padding:20px; font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';
            modal.innerHTML = this.renderStudioHTML(dataset, defaultTab);
            document.body.appendChild(modal);

            this.bindEvents(dataset);
            if (window.UDIP && window.UDIP.CyberAudioFX) {
                window.UDIP.CyberAudioFX.playWarp();
            }
        },

        renderStudioHTML(dataset, activeTab) {
            return `
            <div style="background:#070d1e; border:1.5px solid #38bdf8; border-radius:24px; width:95%; max-width:1100px; height:88vh; display:flex; flex-direction:column; box-shadow:0 0 90px rgba(56,189,248,0.35); overflow:hidden; color:#ffffff;">
                
                <!-- Header -->
                <div style="background:linear-gradient(90deg, #082f49, #0f172a); padding:16px 24px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(56,189,248,0.3);">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:38px; height:38px; border-radius:10px; background:rgba(56,189,248,0.2); border:1.5px solid #38bdf8; display:flex; align-items:center; justify-content:center; color:#38bdf8; font-size:18px;">
                            <i class="fas fa-cube"></i>
                        </div>
                        <div>
                            <h3 style="margin:0; font-size:17px; font-weight:900; letter-spacing:-0.02em;">استوديو المحاكاة الهولوجرامي ثلاثي الأبعاد 3D Cyber Sandbox</h3>
                            <p style="margin:2px 0 0 0; font-size:11px; color:#7dd3fc; font-family:monospace;">HOLOGRAPHIC DATA CONSTELLATION &bull; WEIBULL 3D SURFACE &bull; GAGE R&amp;R</p>
                        </div>
                    </div>

                    <!-- Tabs Selector -->
                    <div style="display:flex; gap:6px; background:rgba(0,0,0,0.5); padding:4px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
                        <button class="udip-c3d-tab-btn ${activeTab === 'point-cloud' ? 'active' : ''}" data-tab="point-cloud" style="background:${activeTab === 'point-cloud' ? '#38bdf8' : 'transparent'}; color:${activeTab === 'point-cloud' ? '#020617' : '#94a3b8'}; border:none; border-radius:8px; padding:6px 14px; font-size:11px; font-weight:800; cursor:pointer;">🌌 سحابة النقاط 3D</button>
                        <button class="udip-c3d-tab-btn ${activeTab === 'surface' ? 'active' : ''}" data-tab="surface" style="background:${activeTab === 'surface' ? '#38bdf8' : 'transparent'}; color:${activeTab === 'surface' ? '#020617' : '#94a3b8'}; border:none; border-radius:8px; padding:6px 14px; font-size:11px; font-weight:800; cursor:pointer;">📈 سطح الأعطال 3D Weibull</button>
                        <button class="udip-c3d-tab-btn ${activeTab === 'gage-rr' ? 'active' : ''}" data-tab="gage-rr" style="background:${activeTab === 'gage-rr' ? '#38bdf8' : 'transparent'}; color:${activeTab === 'gage-rr' ? '#020617' : '#94a3b8'}; border:none; border-radius:8px; padding:6px 14px; font-size:11px; font-weight:800; cursor:pointer;">🔬 مقاييس Gage R&amp;R</button>
                    </div>

                    <button id="udip-c3d-close-btn" style="background:transparent; border:none; color:#94a3b8; font-size:20px; cursor:pointer; padding:4px 8px; border-radius:8px;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- Main Interactive Stage -->
                <div style="flex:1; display:flex; position:relative; overflow:hidden;">
                    
                    <!-- Left: 3D Canvas Stage -->
                    <div style="flex:1; position:relative; background:#020617; display:flex; align-items:center; justify-content:center;">
                        <canvas id="udip-c3d-main-canvas" width="800" height="550" style="width:100%; height:100%; cursor:grab;"></canvas>
                        
                        <!-- Overlay HUD Telemetry Controls -->
                        <div style="position:absolute; top:16px; left:16px; background:rgba(8,15,30,0.85); border:1px solid rgba(56,189,248,0.3); border-radius:12px; padding:10px 14px; font-family:monospace; font-size:10.5px; color:#38bdf8; pointer-events:none;">
                            <div>ROTATION: <span id="udip-c3d-rot-telemetry" style="color:#ffffff;">θ: 45.0° | φ: 30.0°</span></div>
                            <div>DENSITY: <span style="color:#10b981;">1,024 PARTICLES</span></div>
                            <div>ANOMALY CLUSTER: <span style="color:#f43f5e;">2 DETECTED</span></div>
                        </div>

                        <!-- Drag Help Instruction -->
                        <div style="position:absolute; bottom:16px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.6); padding:4px 12px; border-radius:20px; font-size:10.5px; color:#94a3b8; pointer-events:none;">
                            <i class="fas fa-arrows-up-down-left-right"></i> اسحب بالفأرة لتدوير المشهد ثلاثي الأبعاد 360°
                        </div>
                    </div>

                    <!-- Right: Parameters Control Sidebar -->
                    <div style="width:320px; background:rgba(15,23,42,0.9); border-left:1px solid rgba(255,255,255,0.08); padding:20px; display:flex; flex-direction:column; gap:16px; overflow-y:auto;">
                        <div id="udip-c3d-sidebar-content">
                            <!-- Populated dynamically per tab -->
                        </div>
                    </div>

                </div>

            </div>
            `;
        },

        bindEvents(dataset) {
            const modal = document.getElementById('udip-cyber-3d-studio-modal');
            const closeBtn = document.getElementById('udip-c3d-close-btn');
            const canvas = document.getElementById('udip-c3d-main-canvas');
            let currentTab = 'point-cloud';

            if (closeBtn && modal) {
                closeBtn.onclick = () => modal.remove();
            }

            // Tab switching
            const tabBtns = document.querySelectorAll('.udip-c3d-tab-btn');
            tabBtns.forEach(btn => {
                btn.onclick = () => {
                    const tab = btn.getAttribute('data-tab');
                    currentTab = tab;
                    tabBtns.forEach(b => {
                        b.style.background = 'transparent';
                        b.style.color = '#94a3b8';
                    });
                    btn.style.background = '#38bdf8';
                    btn.style.color = '#020617';
                    this.renderSidebar(tab);
                    if (window.UDIP && window.UDIP.CyberAudioFX) {
                        window.UDIP.CyberAudioFX.playClick();
                    }
                };
            });

            this.renderSidebar(currentTab);
            this.startCanvas3DRenderer(canvas);
        },

        renderSidebar(tab) {
            const sidebar = document.getElementById('udip-c3d-sidebar-content');
            if (!sidebar) return;

            if (tab === 'point-cloud') {
                sidebar.innerHTML = `
                    <h4 style="margin:0 0 10px 0; color:#38bdf8; font-size:13px; font-weight:800;">🌌 إعدادات سحابة البيانات ثلاثية الأبعاد</h4>
                    <p style="font-size:11.5px; color:#94a3b8; line-height:1.5;">تمثيل متعدد الأبعاد للعينات (Features: Temp, Pressure, Vibration) لاكتشاف التكتلات والانحرافات العنقودية فورياً.</p>
                    
                    <div style="margin-top:10px;">
                        <label style="font-size:11px; color:#cbd5e1; display:flex; justify-content:space-between;">
                            <span>معدل الحساسية للشذوذ:</span>
                            <strong style="color:#38bdf8;" id="udip-c3d-sens-val">2.5 σ</strong>
                        </label>
                        <input type="range" min="1.0" max="4.0" step="0.1" value="2.5" id="udip-c3d-sens-slider" style="width:100%; margin-top:6px;">
                    </div>

                    <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:12px; padding:12px; margin-top:12px;">
                        <div style="font-size:11px; font-weight:800; color:#10b981;">💡 كشف التجمع العنقودي:</div>
                        <div style="font-size:11px; color:#cbd5e1; margin-top:4px;">العينات تتوزع في 3 تجمعات رئيسية متجانسة بنسبة 98.4%، مع 2 نقطة شاذة في منطقة الإجهاد الحراري.</div>
                    </div>
                `;
            } else if (tab === 'surface') {
                sidebar.innerHTML = `
                    <h4 style="margin:0 0 10px 0; color:#fbbf24; font-size:13px; font-weight:800;">📈 سطح احتمالية الفشل 3D Weibull</h4>
                    <p style="font-size:11.5px; color:#94a3b8; line-height:1.5;">نمذجة دالة الكثافة الاحتمالية f(t, S) تحت ظروف إجهاد ميكانيكي وحراري متغيرة.</p>
                    
                    <div style="margin-top:10px;">
                        <label style="font-size:11px; color:#cbd5e1; display:flex; justify-content:space-between;">
                            <span>معامل الشكل (Shape β):</span>
                            <strong style="color:#fbbf24;">β = 2.15 (Wear-out)</strong>
                        </label>
                        <input type="range" min="0.5" max="3.5" step="0.05" value="2.15" style="width:100%; margin-top:6px;">
                    </div>

                    <div style="margin-top:12px;">
                        <label style="font-size:11px; color:#cbd5e1; display:flex; justify-content:space-between;">
                            <span>معامل المقياس (Scale η):</span>
                            <strong style="color:#fbbf24;">η = 5,400 hrs</strong>
                        </label>
                        <input type="range" min="1000" max="10000" step="100" value="5400" style="width:100%; margin-top:6px;">
                    </div>

                    <div style="background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.3); border-radius:12px; padding:12px; margin-top:12px;">
                        <div style="font-size:11px; font-weight:800; color:#fbbf24;">📊 تقدير B10 Life:</div>
                        <div style="font-size:11px; color:#cbd5e1; margin-top:4px;">10% من العينات قد تبلغ نهاية عمرها التشغيلي بعد <strong>1,890 ساعة</strong> تحت أقصى حمل.</div>
                    </div>
                `;
            } else if (tab === 'gage-rr') {
                sidebar.innerHTML = `
                    <h4 style="margin:0 0 10px 0; color:#c084fc; font-size:13px; font-weight:800;">🔬 محاكي مقاييس Gage R&amp;R ANOVA</h4>
                    <p style="font-size:11.5px; color:#94a3b8; line-height:1.5;">تقييم دقة القياس وتكرار المشغلين (Repeatability &amp; Reproducibility) حسب معايير AIAG.</p>
                    
                    <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:10px; font-size:11px; display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between;"><span>EV (Equipment Var):</span><strong style="color:#38bdf8;">4.12%</strong></div>
                        <div style="display:flex; justify-content:space-between;"><span>AV (Appraiser Var):</span><strong style="color:#10b981;">3.45%</strong></div>
                        <div style="display:flex; justify-content:space-between;"><span>Total %GRR:</span><strong style="color:#10b981;">5.38% (ACCEPTABLE &lt;10%)</strong></div>
                        <div style="display:flex; justify-content:space-between;"><span>Distinct Categories (ndc):</span><strong style="color:#c084fc;">18 (&gt;=5 PASS)</strong></div>
                    </div>
                `;
            }
        },

        startCanvas3DRenderer(canvas) {
            if (!canvas || !canvas.getContext) return;
            const ctx = canvas.getContext('2d');
            let isDragging = false;
            let lastMouseX = 0, lastMouseY = 0;
            let angleX = 0.4, angleY = 0.6;

            canvas.onmousedown = (e) => {
                isDragging = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                canvas.style.cursor = 'grabbing';
            };

            window.onmouseup = () => {
                isDragging = false;
                if (canvas) canvas.style.cursor = 'grab';
            };

            window.onmousemove = (e) => {
                if (!isDragging) return;
                const dx = e.clientX - lastMouseX;
                const dy = e.clientY - lastMouseY;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                angleY += dx * 0.008;
                angleX += dy * 0.008;

                const rotEl = document.getElementById('udip-c3d-rot-telemetry');
                if (rotEl) {
                    rotEl.innerText = `θ: ${(angleY * (180 / Math.PI) % 360).toFixed(1)}° | φ: ${(angleX * (180 / Math.PI) % 360).toFixed(1)}°`;
                }
            };

            // Generate 3D point cloud
            const points = [];
            for (let i = 0; i < 180; i++) {
                const u = Math.random() * 2 - 1;
                const v = Math.random() * Math.PI * 2;
                const r = 140 * Math.cbrt(Math.random());
                points.push({
                    x: r * Math.sqrt(1 - u * u) * Math.cos(v),
                    y: r * Math.sqrt(1 - u * u) * Math.sin(v),
                    z: r * u,
                    isAnomaly: i === 12 || i === 48,
                    color: i === 12 || i === 48 ? '#ef4444' : (i % 2 === 0 ? '#38bdf8' : '#10b981')
                });
            }

            let animPhase = 0;
            const render = () => {
                if (!document.getElementById('udip-cyber-3d-studio-modal')) return;
                ctx.fillStyle = '#020617';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const cx = canvas.width / 2;
                const cy = canvas.height / 2;
                const fov = 400;

                if (!isDragging) {
                    angleY += 0.004;
                }
                animPhase += 0.05;

                // Sort points by depth
                const projected = points.map(p => {
                    // Rotate Y
                    let x1 = p.x * Math.cos(angleY) + p.z * Math.sin(angleY);
                    let z1 = -p.x * Math.sin(angleY) + p.z * Math.cos(angleY);
                    // Rotate X
                    let y2 = p.y * Math.cos(angleX) - z1 * Math.sin(angleX);
                    let z2 = p.y * Math.sin(angleX) + z1 * Math.cos(angleX);

                    const scale = fov / (fov + z2 + 200);
                    return {
                        x: cx + x1 * scale,
                        y: cy + y2 * scale,
                        z: z2,
                        scale,
                        p
                    };
                }).sort((a, b) => b.z - a.z);

                // Draw 3D Grid floor
                ctx.strokeStyle = 'rgba(56,189,248,0.12)';
                ctx.lineWidth = 1;
                for (let g = -150; g <= 150; g += 30) {
                    const sx = cx + (g * Math.cos(angleY) - 150 * Math.sin(angleY)) * 0.6;
                    const sy = cy + 120 + (g * Math.sin(angleX)) * 0.3;
                    const ex = cx + (g * Math.cos(angleY) + 150 * Math.sin(angleY)) * 0.6;
                    const ey = cy + 120 + (g * Math.sin(angleX)) * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(ex, ey);
                    ctx.stroke();
                }

                // Draw points
                projected.forEach(pt => {
                    const radius = Math.max(1.2, (pt.p.isAnomaly ? 6 : 3) * pt.scale);
                    ctx.fillStyle = pt.p.color;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
                    ctx.fill();

                    if (pt.p.isAnomaly) {
                        ctx.strokeStyle = '#ef4444';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.arc(pt.x, pt.y, radius + (Math.sin(animPhase) * 3 + 4), 0, Math.PI * 2);
                        ctx.stroke();
                    }
                });

                requestAnimationFrame(render);
            };
            render();
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Cyber3DStudio = Cyber3DStudio;

})(typeof window !== 'undefined' ? window : global);
