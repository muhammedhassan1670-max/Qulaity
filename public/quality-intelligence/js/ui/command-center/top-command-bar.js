/**
 * ============================================================================
 * UDIP 3D AI ANALYTICAL COMMAND CENTER
 * Module: js/ui/command-center/top-command-bar.js
 * ============================================================================
 * Zone A: Top Command Bar
 * Thin premium top navigation layer providing real-time platform telemetry,
 * dataset selector/metadata, intelligence mode indicator, and quick actions.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.TopCommandBar = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class TopCommandBar {
        static render(datasetOrState = null) {
            const state = datasetOrState;
            const dataset = (state && state.dataset) ? state.dataset : state;
            const hasData = !!dataset;
            const dsName = hasData ? (dataset.filename || 'Production Quality Dataset') : 'NO DATASET LOADED';
            const rowCount = hasData ? (dataset.rowCount != null ? dataset.rowCount.toLocaleString() : (state && state.profile && state.profile.rowCount != null ? state.profile.rowCount.toLocaleString() : '0')) : '--';
            const colCount = hasData ? (dataset.columnCount || (dataset.columns ? dataset.columns.length : (state && state.profile && state.profile.columnCount ? state.profile.columnCount : 0))) : '--';
            
            // Extract Data Quality score
            let qualityScore = 96.4;
            if (state && state.quality && state.quality.overallScore != null) {
                qualityScore = state.quality.overallScore;
            } else if (hasData && dataset.profile && dataset.profile.summary && dataset.profile.summary.qualityScore != null) {
                qualityScore = dataset.profile.summary.qualityScore;
            } else if (hasData && dataset.profile && dataset.profile.quality && dataset.profile.quality.overallScore != null) {
                qualityScore = dataset.profile.quality.overallScore;
            }

            // Extract Knowledge Version
            const km = (state && state.dkm) || (dataset && dataset.knowledgeModel);
            const kmVer = (km && km.version) ? `v${km.version}` : 'v1.4';

            return `
            <header class="udip-cc-topbar" id="udip-cc-topbar">
                <!-- Left: Platform Brand & Operational Status -->
                <div class="udip-cc-topbar-left">
                    <div class="udip-cc-brand">
                        <div class="udip-cc-brand-logo">
                            <i class="fas fa-brain"></i>
                        </div>
                        <div class="udip-cc-brand-text">
                            <h2>UDIP</h2>
                            <p>Universal Data Intelligence</p>
                        </div>
                    </div>
                    <div class="udip-cc-status-pill">
                        <span class="udip-cc-pulse-dot"></span>
                        <span>INTELLIGENCE ONLINE</span>
                    </div>
                </div>

                <!-- Center: Dataset Context & High-Frequency Telemetry -->
                <div class="udip-cc-topbar-center">
                    <div class="udip-cc-dataset-chip">
                        <div class="udip-cc-dataset-title">
                            <i class="fas fa-database" style="color:var(--cc-cyan);"></i>
                            <span>${dsName}</span>
                        </div>
                        <div class="udip-cc-dataset-meta">
                            <span class="udip-cc-meta-item"><strong>${rowCount} rows</strong></span>
                            <span class="udip-cc-meta-item">Cols: <strong>${colCount}</strong></span>
                            <span class="udip-cc-meta-item">Quality: <strong style="color:var(--cc-emerald);">${typeof qualityScore === 'number' ? qualityScore.toFixed(1) : qualityScore}%</strong></span>
                            <span class="udip-cc-meta-item">DKM: <strong>${kmVer}</strong></span>
                        </div>
                    </div>
                </div>

                <!-- Right: Quick Analytical Actions & Modals -->
                <div class="udip-cc-topbar-right">
                    <button type="button" class="udip-cc-btn udip-cc-btn-hero" id="udip-cc-btn-reasoning" title="Activate Cinematic Real-Time Reasoning Engine">
                        <i class="fas fa-wand-magic-sparkles"></i>
                        <span>HOW UDIP THINKS</span>
                    </button>
                    <button type="button" class="udip-cc-btn" id="udip-cc-btn-graph" title="Open 3D Spatial Insight Graph">
                        <i class="fas fa-diagram-project"></i>
                        <span>INSIGHT GRAPH</span>
                    </button>
                    <button type="button" class="udip-cc-btn" id="udip-cc-btn-whatif" title="Open What-If Simulation Lab">
                        <i class="fas fa-sliders"></i>
                        <span>WHAT-IF LAB</span>
                    </button>
                    <button type="button" class="udip-cc-btn" id="udip-cc-btn-trust" title="Open Epistemic Audit & Trust Panel">
                        <i class="fas fa-scale-balanced"></i>
                        <span>EPISTEMIC AUDIT</span>
                    </button>
                    <div class="udip-cc-icon-btn" id="udip-cc-search-btn" title="Search Telemetry & Insights">
                        <i class="fas fa-magnifying-glass"></i>
                    </div>
                    <div class="udip-cc-icon-btn" id="udip-cc-notifications-btn" title="Intelligence Alerts">
                        <i class="fas fa-bell"></i>
                    </div>
                </div>
            </header>
            `;
        }
    }

    return TopCommandBar;
}));
