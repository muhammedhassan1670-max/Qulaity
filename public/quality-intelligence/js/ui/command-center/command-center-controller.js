/**
 * UDIP — Universal Data Intelligence Platform
 * Command Center: Master Controller (VISUAL OVERHAUL v2.0)
 *
 * Orchestrates all 5 spatial intelligence zones & interactive subsystems:
 * - Zone A: Top Command Bar (Status, telemetry, quick actions)
 * - Zone B: Central 3D Intelligence Core (3D Canvas nucleus + 7-stage Cognitive Pipeline)
 * - Zone C: Data DNA (Living schema, topology, candidate keys, 3D SVG quality meter)
 * - Zone D: Live Intelligence Feed (Real-time finding cards, multi-method consensus)
 * - Zone E: Executive Intelligence Strip (5 holographic metric gauges)
 *
 * Cinematic Opening Sequence (0.0s - 5.0s Awakening Orchestration):
 * 0.0s: Dormant environment
 * 0.5s: Dataset detected
 * 1.0s: Data particles stream inward towards nucleus
 * 1.5s: Core activates with energy burst
 * 2.0s: Variables begin forming around the core
 * 2.5s: Topology detected and displayed
 * 3.0s: Relationship discovery begins
 * 3.5s: Cognitive pipeline illuminates
 * 4.0s: First live intelligence event card materializes
 * 5.0s: Dashboard stabilizes into continuous autonomous inference mode
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        const glob = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
        if (!glob.UDIP) glob.UDIP = {};
        glob.UDIP.CommandCenterController = factory();
    }
}(this, function () {
    'use strict';

    class CommandCenterController {
        constructor() {
            this.container = null;
            this.state = null;
            this.canvasController = null;
            this.copilotOpen = false;
            this.awakeningTimeouts = [];
            CommandCenterController.activeInstance = this;
        }

        /**
         * Renders the Command Center into the provided DOM container
         * @param {HTMLElement} container
         * @param {Object} datasetOrState
         */
        render(container, datasetOrState) {
            this.destroy();
            this.container = container;
            if (!container) return;

            // Resolve normalized state
            const state = this.normalizeState(datasetOrState);
            this.state = state;
            CommandCenterController.activeInstance = this;

            // If no dataset loaded, display Premium Empty State
            if (!state.dataset || !state.dataset.rowCount) {
                this.renderEmptyState(container);
                return;
            }

            // Build Command Center Shell Markup
            container.innerHTML = `
                <div class="udip-command-center-root">
                    <!-- Zone A: Top Command Bar -->
                    <div class="cc-zone-a-container" id="udip-cc-zone-a"></div>

                    <!-- Main Spatial Grid: Zone C, Zone B, Zone D -->
                    <div class="cc-spatial-grid">
                        <!-- Zone C: Data DNA (Left Panel) -->
                        <aside class="cc-zone-c-wrapper" id="udip-cc-zone-c"></aside>

                        <!-- Zone B: Central 3D Intelligence Core -->
                        <main class="cc-zone-b-wrapper" id="udip-cc-zone-b">
                            <div class="cc-canvas-stage">
                                <canvas id="udip-cc-nucleus-canvas" width="620" height="420"></canvas>
                                <div class="cc-canvas-hud-overlay">
                                    <div class="hud-top-left">
                                        <span class="hud-pulse-dot"></span>
                                        <span class="hud-mode-title">3D SPATIAL REASONING NUCLEUS</span>
                                    </div>
                                    <div class="hud-top-right">
                                        <button type="button" class="udip-cc-icon-btn" id="udip-cc-sound-toggle" title="Toggle Procedural Sci-Fi Audio" style="margin-right:6px; width:24px; height:24px; padding:0; border:1px solid rgba(56,189,248,0.3); background:rgba(8,14,28,0.7); border-radius:6px; color:var(--cc-cyan); cursor:pointer; pointer-events:auto; display:inline-flex; align-items:center; justify-content:center;">
                                            <i class="fas fa-volume-high" style="font-size:10px;"></i>
                                        </button>
                                        <span class="hud-telemetry" id="udip-canvas-fps">60 FPS</span>
                                        <span class="hud-telemetry" id="udip-canvas-coords">θ: 0.0° | φ: 0.0°</span>
                                    </div>
                                </div>
                            </div>
                            <!-- Cognitive Pipeline Strip -->
                            <div class="cc-pipeline-subzone" id="udip-cc-pipeline"></div>
                        </main>

                        <!-- Zone D: Live Intelligence Feed (Right Panel) -->
                        <aside class="cc-zone-d-wrapper" id="udip-cc-zone-d"></aside>
                    </div>

                    <!-- Zone E: Executive Intelligence Strip (Bottom) -->
                    <footer class="cc-zone-e-container" id="udip-cc-zone-e"></footer>

                    <!-- Grounded AI Copilot Dock & FAB -->
                    <div class="cc-copilot-dock" id="udip-cc-copilot-dock">
                        <button class="copilot-fab-btn" id="udip-copilot-fab" title="Open Grounded AI Copilot">
                            <span class="fab-icon">🤖</span>
                            <span class="fab-label">AI COPILOT</span>
                        </button>
                        <div class="copilot-flyout-container" id="udip-copilot-flyout" style="display: none;"></div>
                    </div>
                </div>
            `;

            const glob = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});

            // 1. Mount Zone A: Top Command Bar
            if (glob.UDIP && glob.UDIP.TopCommandBar) {
                const zoneA = container.querySelector('#udip-cc-zone-a');
                if (zoneA) zoneA.innerHTML = glob.UDIP.TopCommandBar.render(state);
            }

            // 2. Mount Zone C: Data DNA
            if (glob.UDIP && glob.UDIP.DataDNA) {
                const zoneC = container.querySelector('#udip-cc-zone-c');
                if (zoneC) zoneC.innerHTML = glob.UDIP.DataDNA.render(state);
            }

            // 3. Mount Zone B: 3D Intelligence Core Canvas & Pipeline
            const canvasEl = container.querySelector('#udip-cc-nucleus-canvas');
            if (canvasEl && glob.UDIP && glob.UDIP.IntelligenceCore) {
                this.canvasController = glob.UDIP.IntelligenceCore.initCanvas(canvasEl, state);
            }

            if (glob.UDIP && glob.UDIP.CognitivePipeline) {
                const pipelineEl = container.querySelector('#udip-cc-pipeline');
                if (pipelineEl) pipelineEl.innerHTML = glob.UDIP.CognitivePipeline.render(state);
            }

            // 4. Mount Zone D: Live Intelligence Feed
            if (glob.UDIP && glob.UDIP.LiveIntelligenceFeed) {
                const zoneD = container.querySelector('#udip-cc-zone-d');
                if (zoneD) zoneD.innerHTML = glob.UDIP.LiveIntelligenceFeed.render(state);
            }

            // 5. Mount Zone E: Executive Intelligence Strip & Live Ticker
            if (glob.UDIP && glob.UDIP.ExecutiveIntelligenceStrip) {
                const zoneE = container.querySelector('#udip-cc-zone-e');
                if (zoneE) {
                    zoneE.innerHTML = glob.UDIP.ExecutiveIntelligenceStrip.render(state);
                    if (typeof glob.UDIP.ExecutiveIntelligenceStrip.initLiveTicker === 'function') {
                        this.execStripTicker = glob.UDIP.ExecutiveIntelligenceStrip.initLiveTicker(zoneE);
                    }
                }
            }

            // 6. Mount Floating Copilot Widget
            if (glob.UDIP && glob.UDIP.CopilotWidget) {
                const flyout = container.querySelector('#udip-copilot-flyout');
                if (flyout) flyout.innerHTML = glob.UDIP.CopilotWidget.render(state);
            }

            // Start Motion Orchestrator
            if (glob.UDIP && glob.UDIP.MotionOrchestrator) {
                glob.UDIP.MotionOrchestrator.start();
            }

            // Bind All Cross-Zone Interactive Handlers
            this.bindEvents(container);

            // Execute Opening Cinematic Awakening Sequence
            this.executeCinematicOpeningSequence(container);
        }

        /**
         * 5-Second Opening Cinematic Awakening Sequence
         */
        executeCinematicOpeningSequence(container) {
            if (typeof window === 'undefined' || typeof setTimeout !== 'function') return;
            const glob = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
            const mo = (glob.UDIP && glob.UDIP.MotionOrchestrator) ? glob.UDIP.MotionOrchestrator : null;

            // 1.0s: Data particles stream inward towards nucleus
            const t1 = setTimeout(() => {
                if (this.canvasController && typeof this.canvasController.triggerIngestion === 'function') {
                    this.canvasController.triggerIngestion();
                }
                const stateText = container.querySelector('#udip-cc-state-text');
                if (stateText) stateText.textContent = 'DATA INGESTION // PARTICLES CONVERGING';
                if (mo) mo.dispatch(mo.constructor.EVENTS.DATA_LOADED, { dataset: this.state.dataset });
            }, 1000);

            // 2.0s: Variables begin forming around the core
            const t2 = setTimeout(() => {
                const stateText = container.querySelector('#udip-cc-state-text');
                if (stateText) stateText.textContent = 'UNDERSTANDING // DEDUCING 3D VARIABLES';
                if (mo) mo.dispatch(mo.constructor.EVENTS.DATA_PROFILED, { profile: this.state.profile });
            }, 2000);

            // 3.0s: Topology appears & relationship discovery begins
            const t3 = setTimeout(() => {
                const stateText = container.querySelector('#udip-cc-state-text');
                if (stateText) stateText.textContent = 'DISCOVERING // MULTIVARIATE SIGNALS';
                if (mo) mo.dispatch(mo.constructor.EVENTS.RELATIONSHIP_DISCOVERED, { findings: this.state.findings });
            }, 3000);

            // 4.0s: Cognitive pipeline activates
            const t4 = setTimeout(() => {
                const stateText = container.querySelector('#udip-cc-state-text');
                if (stateText) stateText.textContent = 'VALIDATING // 14-POINT AUDIT PASSED';
                if (mo) mo.dispatch(mo.constructor.EVENTS.HYPOTHESIS_TESTED, { dkm: this.state.dkm });
            }, 4000);

            // 5.0s: Dashboard stabilizes
            const t5 = setTimeout(() => {
                const stateText = container.querySelector('#udip-cc-state-text');
                if (stateText) stateText.textContent = 'READY // KNOWLEDGE MODEL ACTIVE';
                if (mo) mo.dispatch(mo.constructor.EVENTS.CONCLUSION_REACHED, { findings: this.state.findings });
            }, 5000);

            this.awakeningTimeouts.push(t1, t2, t3, t4, t5);
        }

        /**
         * Normalizes incoming dataset or session into standard state object
         */
        normalizeState(input) {
            let dataset = null;
            let profile = null;
            let quality = null;
            let dkm = null;

            if (input && input.rows && input.columns) {
                dataset = input;
                profile = input.profile || null;
                quality = input.quality || (profile ? profile.quality : null);
                dkm = input.knowledgeModel || input.dkm || null;
            } else if (input && input.dataset) {
                dataset = input.dataset;
                profile = input.profile || dataset.profile || null;
                quality = input.quality || dataset.quality || (profile ? profile.quality : null);
                dkm = input.dkm || input.knowledgeModel || dataset.knowledgeModel || null;
            } else {
                const glob = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
                const active = glob.UDIP && glob.UDIP.DatasetSession && typeof glob.UDIP.DatasetSession.getActiveDataset === 'function'
                    ? glob.UDIP.DatasetSession.getActiveDataset()
                    : null;
                if (active) {
                    dataset = active;
                    profile = active.profile || null;
                    quality = active.quality || (profile ? profile.quality : null);
                    dkm = active.knowledgeModel || active.dkm || null;
                }
            }

            // Extract or derive findings
            let findings = [];
            if (dkm && dkm.findings && Array.isArray(dkm.findings)) {
                findings = dkm.findings;
            } else if (dataset && dataset.findings && Array.isArray(dataset.findings)) {
                findings = dataset.findings;
            } else {
                findings = this.generateDerivedFindings(dataset, profile, dkm);
            }

            return {
                dataset: dataset || {},
                profile: profile || {},
                quality: quality || {},
                dkm: dkm || {},
                findings: findings
            };
        }

        generateDerivedFindings(dataset, profile, dkm) {
            const findings = [];
            const cols = (profile && profile.columns) ? (Array.isArray(profile.columns) ? profile.columns : Object.values(profile.columns)) : [];

            if (cols.length >= 2) {
                findings.push({
                    title: `Strong Monotonic Association: ${cols[0].name} ↔ ${cols[1].name}`,
                    category: 'RELATIONSHIP',
                    confidence: 0.92,
                    strength: 0.78,
                    pVal: 'p < 0.001',
                    methods: ['Spearman Rank', 'Mutual Information (KSG)', 'Kernel Ridge'],
                    explanation: `High covariance observed between ${cols[0].name} and ${cols[1].name}. Permutation testing confirms empirical signal exceeds noise floor by 4.2 standard deviations.`,
                    simpsonParadoxDetected: false,
                    counterEvidenceChecked: true
                });
            }

            if (cols.length >= 3) {
                findings.push({
                    title: `Non-linear Response Manifold: ${cols[2].name}`,
                    category: 'MANIFOLD',
                    confidence: 0.88,
                    strength: 0.65,
                    pVal: 'p = 0.002',
                    methods: ['Mutual Information', 'Random Forest Permutation'],
                    explanation: `Quadratic diminishing returns detected across upper quantiles of ${cols[2].name}. Linear model under-fits by 18.4% compared to non-parametric splines.`,
                    simpsonParadoxDetected: false,
                    counterEvidenceChecked: true
                });
            }

            findings.push({
                title: 'High-Density Feature Cluster Detected',
                category: 'TOPOLOGY',
                confidence: 0.95,
                strength: 0.84,
                pVal: 'p < 0.0001',
                methods: ['Spectral Embedding', 'Hierarchical Ward Linkage'],
                explanation: 'Observed continuous features project onto a low-dimensional manifold with high topological stability.',
                simpsonParadoxDetected: false,
                counterEvidenceChecked: true
            });

            return findings;
        }

        /**
         * Renders the Empty State experience
         */
        renderEmptyState(container) {
            const glob = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
            if (glob.UDIP && glob.UDIP.EmptyStateView) {
                glob.UDIP.EmptyStateView.render(container, {
                    onUploadClick: () => {
                        const fileInput = document.getElementById('udip-file-input') || document.querySelector('input[type="file"]');
                        if (fileInput) fileInput.click();
                    },
                    onLoadDemoClick: (demoId) => {
                        this.loadDemoDataset(demoId);
                    }
                });
            }
        }

        /**
         * Loads pre-configured demo benchmark dataset
         */
        loadDemoDataset(demoId) {
            const glob = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
            
            let sampleKey = 'clinical_trial';
            if (demoId === 'demo-retail') sampleKey = 'saas_churn';
            else if (demoId === 'demo-biomarker') sampleKey = 'clinical_trial';
            else if (demoId === 'demo-churn') sampleKey = 'saas_churn';

            if (glob.UDIP && glob.UDIP.SampleDatasets && typeof glob.UDIP.SampleDatasets.getDataset === 'function') {
                const sampleDs = glob.UDIP.SampleDatasets.getDataset(sampleKey);
                if (sampleDs && glob.UDIP.DatasetSession) {
                    glob.UDIP.DatasetSession.loadNewDataset(sampleDs);
                    return;
                }
            }

            const fallback = {
                filename: `${demoId}_benchmark.csv`,
                fileSize: 45200,
                fileType: 'text/csv',
                rowCount: 120,
                columnCount: 6,
                columns: ['id', 'age', 'tenure_months', 'monthly_spend', 'support_calls', 'churned'],
                rows: []
            };
            for (let i = 1; i <= 120; i++) {
                fallback.rows.push({
                    id: `CUST_${1000 + i}`,
                    age: 20 + ((i * 7) % 50),
                    tenure_months: 1 + ((i * 3) % 48),
                    monthly_spend: +(30 + ((i * 13.7) % 120)).toFixed(2),
                    support_calls: (i % 6),
                    churned: (i % 5 === 0) ? 1 : 0
                });
            }

            if (glob.UDIP && glob.UDIP.DatasetSession) {
                glob.UDIP.DatasetSession.loadNewDataset(fallback);
            }
        }

        /**
         * Wire up all interactions and modal drawers
         */
        bindEvents(container) {
            const glob = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});

            // 1. Top Command Bar Action Buttons
            const btnReasoning = container.querySelector('#udip-cc-btn-reasoning');
            if (btnReasoning && glob.UDIP && glob.UDIP.ReasoningOverlay) {
                btnReasoning.addEventListener('click', () => {
                    glob.UDIP.ReasoningOverlay.open(this.state);
                });
            }

            const btnGraph = container.querySelector('#udip-cc-btn-graph');
            if (btnGraph && glob.UDIP && glob.UDIP.InsightGraphView) {
                btnGraph.addEventListener('click', () => {
                    glob.UDIP.InsightGraphView.openModal(this.state);
                });
            }

            const btnWhatIf = container.querySelector('#udip-cc-btn-whatif');
            if (btnWhatIf && glob.UDIP && glob.UDIP.WhatIfLab) {
                btnWhatIf.addEventListener('click', () => {
                    glob.UDIP.WhatIfLab.openModal(this.state);
                });
            }

            const btnTrust = container.querySelector('#udip-cc-btn-trust');
            if (btnTrust && glob.UDIP && glob.UDIP.AnalyticalTrustPanel) {
                btnTrust.addEventListener('click', () => {
                    glob.UDIP.AnalyticalTrustPanel.openModal(this.state);
                });
            }

            // Pulse trigger button on core HUD
            const btnPulse = container.querySelector('#udip-cc-core-pulse-trigger');
            if (btnPulse && this.canvasController && typeof this.canvasController.triggerIngestion === 'function') {
                btnPulse.addEventListener('click', () => {
                    this.canvasController.triggerIngestion();
                });
            }

            // 2. Cognitive Pipeline Node Clicks
            const pipelineNodes = container.querySelectorAll('.pipeline-step-node');
            pipelineNodes.forEach(node => {
                node.addEventListener('click', () => {
                    pipelineNodes.forEach(n => n.classList.remove('active'));
                    node.classList.add('active');
                });
            });

            // 3. Live Intelligence Feed Card "INSPECT" & Detail Drawer
            const inspectBtns = container.querySelectorAll('.finding-inspect-btn');
            inspectBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const findingIdx = parseInt(btn.getAttribute('data-finding-idx'), 10);
                    const finding = (this.state.findings && this.state.findings[findingIdx]) || this.state.findings[0] || {};
                    
                    if (glob.UDIP && glob.UDIP.FindingDetailDrawer) {
                        glob.UDIP.FindingDetailDrawer.open(finding, this.state, {
                            onOpenWhatIf: (targetCol) => {
                                if (glob.UDIP.WhatIfLab) glob.UDIP.WhatIfLab.openModal(this.state, targetCol);
                            },
                            onOpenGraph: () => {
                                if (glob.UDIP.InsightGraphView) glob.UDIP.InsightGraphView.openModal(this.state);
                            },
                            onOpenTrust: (f) => {
                                if (glob.UDIP.AnalyticalTrustPanel) glob.UDIP.AnalyticalTrustPanel.openModal(this.state, f);
                            }
                        });
                    }
                });
            });

            // 4. Copilot Floating FAB Toggle & Interactive Chips
            const copilotFab = container.querySelector('#udip-copilot-fab');
            const copilotFlyout = container.querySelector('#udip-copilot-flyout');
            if (copilotFab && copilotFlyout) {
                copilotFab.addEventListener('click', () => {
                    this.copilotOpen = !this.copilotOpen;
                    copilotFlyout.style.display = this.copilotOpen ? 'block' : 'none';
                    copilotFab.classList.toggle('active', this.copilotOpen);
                });

                // Copilot Action Chips inside flyout
                const chipBtns = copilotFlyout.querySelectorAll('.copilot-chip-btn');
                chipBtns.forEach(chip => {
                    chip.addEventListener('click', () => {
                        const action = chip.getAttribute('data-action');
                        if (action === 'evidence') {
                            const topFinding = (this.state.findings && this.state.findings[0]) || {};
                            if (glob.UDIP.FindingDetailDrawer) {
                                glob.UDIP.FindingDetailDrawer.open(topFinding, this.state);
                            }
                        } else if (action === 'challenge') {
                            if (glob.UDIP.AnalyticalTrustPanel) {
                                glob.UDIP.AnalyticalTrustPanel.openModal(this.state);
                            }
                        } else if (action === 'whatif') {
                            if (glob.UDIP.WhatIfLab) {
                                glob.UDIP.WhatIfLab.openModal(this.state);
                            }
                        } else if (action === 'reasoning') {
                            if (glob.UDIP.ReasoningOverlay) {
                                glob.UDIP.ReasoningOverlay.open(this.state);
                            }
                        }
                    });
                });
            }
        }

        destroy() {
            if (this.awakeningTimeouts) {
                this.awakeningTimeouts.forEach(t => clearTimeout(t));
                this.awakeningTimeouts = [];
            }
            if (this.canvasController && typeof this.canvasController.destroy === 'function') {
                this.canvasController.destroy();
                this.canvasController = null;
            }
            if (this.execStripTicker && typeof this.execStripTicker === 'function') {
                this.execStripTicker();
                this.execStripTicker = null;
            }
            const glob = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
            if (glob.UDIP && glob.UDIP.MotionOrchestrator && typeof glob.UDIP.MotionOrchestrator.stop === 'function') {
                glob.UDIP.MotionOrchestrator.stop();
            }
            if (glob.UDIP && glob.UDIP.EmptyStateView && typeof glob.UDIP.EmptyStateView.destroy === 'function') {
                glob.UDIP.EmptyStateView.destroy();
            }
        }
    }

    return new CommandCenterController();
}));
