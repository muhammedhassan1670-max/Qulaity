/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/planning/action-planner.js
 * ============================================================================
 * Plans and generates safe, contextual, user-facing action chips:
 * [Show Evidence], [Investigate], [What-If], [Compare], [Open Chart],
 * [Generate Report], [View Model], [View Risk], [View Drift].
 * Guarantees zero silent mutation of source data or analytical results.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ActionPlanner = {
        /**
         * Determine relevant actions for a given intent and analytical context
         * @param {string} intent
         * @param {Array} entities
         * @param {Object} context
         * @returns {Array<Object>}
         */
        planActions(intent = '', entities = [], context = {}) {
            const actions = [];
            const colEntity = entities.find(e => e.type === 'column')?.value;
            const modelEntity = entities.find(e => e.type === 'model')?.value;

            switch (intent) {
                case 'SUMMARY':
                    actions.push({
                        type: 'OPEN_EXECUTIVE_MODE',
                        label: 'View Executive Briefing',
                        icon: 'fa-briefcase',
                        payload: { mode: 'EXECUTIVE' }
                    });
                    actions.push({
                        type: 'GENERATE_REPORT',
                        label: 'Generate Full Report',
                        icon: 'fa-file-invoice',
                        payload: { type: 'publication' }
                    });
                    actions.push({
                        type: 'OPEN_INVESTIGATION',
                        label: 'Explore Findings',
                        icon: 'fa-magnifying-glass-chart',
                        payload: {}
                    });
                    break;

                case 'EXPLANATION':
                case 'MODEL_EXPLANATION':
                    actions.push({
                        type: 'VIEW_EVIDENCE',
                        label: 'View Reasoning Chain',
                        icon: 'fa-diagram-project',
                        payload: { column: colEntity, mode: 'ANALYST' }
                    });
                    if (colEntity) {
                        actions.push({
                            type: 'RUN_WHAT_IF',
                            label: `Simulate ${colEntity} Change`,
                            icon: 'fa-sliders',
                            payload: { feature: colEntity }
                        });
                        actions.push({
                            type: 'OPEN_INVESTIGATION',
                            label: `Investigate ${colEntity}`,
                            icon: 'fa-flask-vial',
                            payload: { feature: colEntity }
                        });
                    }
                    break;

                case 'WHAT_IF':
                    actions.push({
                        type: 'RUN_WHAT_IF',
                        label: 'Adjust Simulation Parameters',
                        icon: 'fa-sliders',
                        payload: { feature: colEntity }
                    });
                    actions.push({
                        type: 'VIEW_EVIDENCE',
                        label: 'Model Sensitivity Evidence',
                        icon: 'fa-chart-area',
                        payload: { mode: 'EVIDENCE' }
                    });
                    break;

                case 'MODEL_COMPARISON':
                    actions.push({
                        type: 'VIEW_MODEL',
                        label: 'Open ML Leaderboard',
                        icon: 'fa-award',
                        payload: { model: modelEntity }
                    });
                    actions.push({
                        type: 'VIEW_EVIDENCE',
                        label: 'Governance & Stability Matrix',
                        icon: 'fa-shield-halved',
                        payload: { tab: 'decision' }
                    });
                    break;

                case 'ROOT_CAUSE_INVESTIGATION':
                case 'INVESTIGATION_REQUEST':
                    actions.push({
                        type: 'OPEN_INVESTIGATION',
                        label: 'Open Investigation Sandbox',
                        icon: 'fa-flask-vial',
                        payload: { initialColumn: colEntity }
                    });
                    actions.push({
                        type: 'VIEW_EVIDENCE',
                        label: 'Show Driver Correlations',
                        icon: 'fa-table-cells',
                        payload: { mode: 'EVIDENCE' }
                    });
                    break;

                case 'COMPARISON':
                case 'DRIFT_ANALYSIS':
                    actions.push({
                        type: 'COMPARE_VERSIONS',
                        label: 'Open 10D Version Comparator',
                        icon: 'fa-code-compare',
                        payload: { version: 'previous' }
                    });
                    actions.push({
                        type: 'VIEW_DRIFT',
                        label: 'View Drift Telemetry',
                        icon: 'fa-gauge-high',
                        payload: { tab: 'autonomous' }
                    });
                    break;

                case 'RISK_ANALYSIS':
                    actions.push({
                        type: 'VIEW_RISK',
                        label: 'Inspect Risk Registry',
                        icon: 'fa-triangle-exclamation',
                        payload: { tab: 'decision' }
                    });
                    actions.push({
                        type: 'RUN_WHAT_IF',
                        label: 'Stress-Test Scenarios',
                        icon: 'fa-shield-virus',
                        payload: {}
                    });
                    break;

                case 'OPPORTUNITY_ANALYSIS':
                    actions.push({
                        type: 'VIEW_OPPORTUNITY',
                        label: 'Inspect Opportunity Matrix',
                        icon: 'fa-bullseye',
                        payload: { tab: 'decision' }
                    });
                    break;

                case 'VISUALIZATION_REQUEST':
                case 'TREND_ANALYSIS':
                case 'ANOMALY_ANALYSIS':
                    actions.push({
                        type: 'OPEN_CHART',
                        label: 'Open Recommended Visual',
                        icon: 'fa-chart-pie',
                        payload: { column: colEntity }
                    });
                    actions.push({
                        type: 'VIEW_EVIDENCE',
                        label: 'View Underlying Distribution',
                        icon: 'fa-table',
                        payload: { column: colEntity }
                    });
                    break;

                case 'REPORT_REQUEST':
                    actions.push({
                        type: 'GENERATE_REPORT',
                        label: 'Export Markdown Report',
                        icon: 'fa-file-lines',
                        payload: { format: 'markdown' }
                    });
                    actions.push({
                        type: 'GENERATE_REPORT',
                        label: 'Export Styled HTML Report',
                        icon: 'fa-file-code',
                        payload: { format: 'html' }
                    });
                    break;

                case 'QUALITY_METRICS':
                    actions.push({
                        type: 'OPEN_SPC_MODAL',
                        label: 'View SPC & Cpk Analysis',
                        icon: 'fa-chart-line',
                        payload: { mode: 'spc' }
                    });
                    actions.push({
                        type: 'RUN_WHAT_IF',
                        label: 'Simulate Defect Reduction',
                        icon: 'fa-sliders',
                        payload: { tab: 'decision' }
                    });
                    actions.push({
                        type: 'OPEN_ISHIKAWA_MODAL',
                        label: 'Root Cause Fishbone',
                        icon: 'fa-sitemap',
                        payload: { mode: 'ishikawa' }
                    });
                    break;

                case 'PROCESS_CAPABILITY':
                    actions.push({
                        type: 'OPEN_SPC_MODAL',
                        label: 'Open SPC Control Charts',
                        icon: 'fa-chart-area',
                        payload: { mode: 'spc' }
                    });
                    actions.push({
                        type: 'VIEW_EVIDENCE',
                        label: 'Capability Distribution Bounds',
                        icon: 'fa-chart-column',
                        payload: { mode: 'EVIDENCE' }
                    });
                    break;

                case 'SCRAP_COST':
                    actions.push({
                        type: 'OPEN_SCRAP_SIM_MODAL',
                        label: 'Monte Carlo Scrap Simulator',
                        icon: 'fa-coins',
                        payload: { mode: 'coq' }
                    });
                    actions.push({
                        type: 'RUN_WHAT_IF',
                        label: 'Simulate Financial Savings',
                        icon: 'fa-sliders',
                        payload: { tab: 'decision' }
                    });
                    break;

                case 'PARAMETER_OPTIMIZATION':
                    actions.push({
                        type: 'NAVIGATE_TAB',
                        label: 'Decision & Parameter Studio',
                        icon: 'fa-sliders',
                        payload: { tab: 'decision' }
                    });
                    actions.push({
                        type: 'OPEN_3D_STUDIO',
                        label: 'Open 3D Cyber Studio',
                        icon: 'fa-cube',
                        payload: { mode: '3d' }
                    });
                    break;

                case 'SHIFT_COMPARISON':
                    actions.push({
                        type: 'OPEN_ISHIKAWA_MODAL',
                        label: 'Investigate Shift Variance',
                        icon: 'fa-sitemap',
                        payload: { mode: 'ishikawa' }
                    });
                    actions.push({
                        type: 'NAVIGATE_TAB',
                        label: 'Visual Decision Matrix',
                        icon: 'fa-cubes-stacked',
                        payload: { tab: 'visual-decision' }
                    });
                    break;

                case 'PARETO_DEFECTS':
                    actions.push({
                        type: 'OPEN_ISHIKAWA_MODAL',
                        label: 'Open Ishikawa Fishbone',
                        icon: 'fa-sitemap',
                        payload: { mode: 'ishikawa' }
                    });
                    actions.push({
                        type: 'OPEN_SCRAP_SIM_MODAL',
                        label: 'Scrap & Pareto Cost Impact',
                        icon: 'fa-coins',
                        payload: { mode: 'coq' }
                    });
                    break;

                default:
                    actions.push({
                        type: 'VIEW_EVIDENCE',
                        label: 'Show Underlying Evidence',
                        icon: 'fa-database',
                        payload: { mode: 'EVIDENCE' }
                    });
                    actions.push({
                        type: 'OPEN_INVESTIGATION',
                        label: 'Investigate in Workspace',
                        icon: 'fa-flask-vial',
                        payload: {}
                    });
                    break;
            }

            // Always guarantee isSafe flag
            return actions.map(a => ({
                ...a,
                isSafe: true,
                id: 'act_' + Math.random().toString(36).substring(2, 6)
            }));
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.ActionPlanner = ActionPlanner;

})(typeof window !== 'undefined' ? window : global);
