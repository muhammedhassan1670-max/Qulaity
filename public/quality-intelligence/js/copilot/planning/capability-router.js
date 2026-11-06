/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/planning/capability-router.js
 * ============================================================================
 * Maps user intents and queries strictly to existing UDIP engines (Steps 2–6).
 * Guarantees zero duplication of analytical algorithms.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ROUTE_TABLE = {
        SUMMARY: {
            primaryEngine: 'UDIP.WorkspaceEngine',
            supportingEngines: ['UDIP.ExecutiveSummary', 'UDIP.Profiler'],
            module: 'Workspace Executive Mode'
        },
        EXPLANATION: {
            primaryEngine: 'UDIP.Workspace.AnalystMode',
            supportingEngines: ['UDIP.InsightReasoner', 'UDIP.EvidenceTrace'],
            module: 'Analyst Epistemological Reasoning'
        },
        EVIDENCE_REQUEST: {
            primaryEngine: 'UDIP.Workspace.EvidenceMode',
            supportingEngines: ['UDIP.EvidenceFusion', 'UDIP.EvidenceTrace'],
            module: 'Evidence Matrix & Traceability'
        },
        COMPARISON: {
            primaryEngine: 'UDIP.Workspace.VersionComparator',
            supportingEngines: ['UDIP.DatasetMonitor', 'UDIP.AutonomousEngine'],
            module: '10-Dimensional Version Comparator'
        },
        TREND_ANALYSIS: {
            primaryEngine: 'UDIP.ExploratoryEngine',
            supportingEngines: ['UDIP.ChartSelector'],
            module: 'Exploratory Trend Analysis'
        },
        ANOMALY_ANALYSIS: {
            primaryEngine: 'UDIP.AnomalyEngine',
            supportingEngines: ['UDIP.OutlierAnalysis'],
            module: 'Anomaly & Outlier Engine'
        },
        FORECAST_REQUEST: {
            primaryEngine: 'UDIP.ForecastingEngine',
            supportingEngines: ['UDIP.ForecastMethods'],
            module: 'Forecasting Engine'
        },
        MODEL_COMPARISON: {
            primaryEngine: 'UDIP.MLEngine',
            supportingEngines: ['UDIP.ModelGovernance', 'UDIP.ModelMemory'],
            module: 'Machine Learning Leaderboard'
        },
        MODEL_EXPLANATION: {
            primaryEngine: 'UDIP.MLEngine',
            supportingEngines: ['UDIP.ModelGovernance', 'UDIP.InsightReasoner'],
            module: 'Feature Importance & Governance'
        },
        RISK_ANALYSIS: {
            primaryEngine: 'UDIP.RiskEngine',
            supportingEngines: ['UDIP.DecisionEngine'],
            module: 'Decision Risk Assessment'
        },
        OPPORTUNITY_ANALYSIS: {
            primaryEngine: 'UDIP.OpportunityEngine',
            supportingEngines: ['UDIP.DecisionEngine'],
            module: 'Decision Opportunity Detection'
        },
        ROOT_CAUSE_INVESTIGATION: {
            primaryEngine: 'UDIP.RootCauseEngine',
            supportingEngines: ['UDIP.Workspace.InvestigationEngine'],
            module: 'Root Cause & Investigation Engine'
        },
        WHAT_IF: {
            primaryEngine: 'UDIP.WhatIfEngine',
            supportingEngines: ['UDIP.ScenarioEngine', 'UDIP.MLEngine'],
            module: 'What-If Simulation Engine'
        },
        SCENARIO_ANALYSIS: {
            primaryEngine: 'UDIP.ScenarioEngine',
            supportingEngines: ['UDIP.DecisionEngine'],
            module: 'Scenario Analysis Engine'
        },
        DATA_QUALITY: {
            primaryEngine: 'UDIP.QualityProfile',
            supportingEngines: ['UDIP.QualityMonitor'],
            module: 'Data Hygiene & Quality Profile'
        },
        DRIFT_ANALYSIS: {
            primaryEngine: 'UDIP.ConceptDriftDetector',
            supportingEngines: ['UDIP.DistributionMonitor', 'UDIP.ChangeDetector'],
            module: 'Continuous Drift Detection Engine'
        },
        INSIGHT_HISTORY: {
            primaryEngine: 'UDIP.InsightMemory',
            supportingEngines: ['UDIP.InsightEvolution', 'UDIP.Workspace.AnalyticalTimeline'],
            module: 'Insight Memory & Analytical Timeline'
        },
        DECISION_REQUEST: {
            primaryEngine: 'UDIP.DecisionRanker',
            supportingEngines: ['UDIP.ExecutiveSummary'],
            module: 'Decision Ranking & Briefing'
        },
        REPORT_REQUEST: {
            primaryEngine: 'UDIP.Workspace.ReportGenerator',
            supportingEngines: ['UDIP.Workspace.InsightExporter'],
            module: '1-Click Report & Briefing Generator'
        },
        VISUALIZATION_REQUEST: {
            primaryEngine: 'UDIP.Workspace.ChartSelector',
            supportingEngines: ['UDIP.Workspace.StoryEngine'],
            module: 'Adaptive Chart Recommendation'
        },
        INVESTIGATION_REQUEST: {
            primaryEngine: 'UDIP.Workspace.InvestigationEngine',
            supportingEngines: ['UDIP.Workspace.HypothesisEngine'],
            module: 'Guided Investigation Coordinator'
        },
        GENERAL_DATA_QUESTION: {
            primaryEngine: 'UDIP.WorkspaceEngine',
            supportingEngines: ['UDIP.Profiler'],
            module: 'General Data Synthesis'
        },
        INTEGRATION_QUERY: {
            primaryEngine: 'UDIP.Integrations.IntegrationEngine',
            supportingEngines: ['UDIP.Integrations.ConnectionRegistry', 'UDIP.Integrations.SourceRegistry', 'UDIP.Integrations.LineageManager'],
            module: 'Enterprise Connectivity & Integration Layer'
        }
    };

    const CapabilityRouter = {
        /**
         * Route intent to relevant UDIP engine metadata
         * @param {string} intent
         * @returns {Object}
         */
        route(intent = 'GENERAL_DATA_QUESTION') {
            return ROUTE_TABLE[intent] || ROUTE_TABLE.GENERAL_DATA_QUESTION;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.CapabilityRouter = CapabilityRouter;

})(typeof window !== 'undefined' ? window : global);
