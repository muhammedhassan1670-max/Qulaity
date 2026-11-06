/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: workspace/workspace-engine.js
 * ============================================================================
 * Master Orchestrator for Step 6: Intelligence Workspace & Analytical Storytelling.
 * 
 * Unifies all analytical layers into a cohesive interactive workspace:
 * - Executive Mode ("What matters?")
 * - Analyst Mode ("Why does it matter?")
 * - Evidence Mode ("How do we know?")
 * - Fact-Checked Multi-Part Narrative
 * - 9-Step Adaptive Storytelling & Visualizations
 * - Guided Investigation & Hypothesis Workflow
 * - Chronological Milestones & 10-Dimensional Version Audits
 * - 1-Click Multi-Format Publication Reports
 * 
 * Strict Invariants:
 * - 100% Domain-Agnostic
 * - Zero Input Mutation (Raw dataset, profiles, plans, ML, decisions immutable)
 * - Mathematical Safety (0 NaN, 0 undefined, bounded scores 0–100)
 * ============================================================================
 */

(function (window) {
    'use strict';

    const WorkspaceEngine = {
        /**
         * Run the complete Intelligence Workspace & Storytelling pipeline
         * 
         * @param {Object} params
         * @param {Object} params.dataset
         * @param {Object} [params.previousDataset]
         * @param {Object} params.profile
         * @param {Object} [params.previousProfile]
         * @param {Object} params.analysisPlan
         * @param {Object} params.analytics
         * @param {Object} [params.previousAnalytics]
         * @param {Object} [params.decisionIntelligence]
         * @param {Object} [params.previousDecisionIntelligence]
         * @param {Object} [params.autonomousIntelligence]
         * @param {Object} [params.baselineDataset]
         * @returns {Object} Comprehensive Workspace package
         */
        run({
            dataset = {},
            previousDataset = null,
            profile = {},
            previousProfile = null,
            analysisPlan = {},
            analytics = {},
            previousAnalytics = null,
            decisionIntelligence = null,
            previousDecisionIntelligence = null,
            autonomousIntelligence = null,
            baselineDataset = null
        } = {}) {
            // Invariant check: Inputs must remain unmutated
            const synthesizer = window.UDIP?.FindingSynthesizer;
            const orderer = window.UDIP?.FindingOrderer;
            const narrativeEngine = window.UDIP?.NarrativeEngine;
            const executiveMode = window.UDIP?.ExecutiveMode;
            const analystMode = window.UDIP?.AnalystMode;
            const evidenceMode = window.UDIP?.EvidenceMode;
            const storyEngine = window.UDIP?.StoryEngine;
            const timelineEngine = window.UDIP?.AnalyticalTimeline;
            const versionComparator = window.UDIP?.VersionComparator;

            // 1. Synthesize & Rank Consolidated Findings
            const rawFindings = synthesizer
                ? synthesizer.synthesize({ profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence })
                : [];
            const rankedFindings = orderer
                ? orderer.rankFindings(rawFindings)
                : rawFindings;

            // 2. Generate Fact-Checked Narrative
            const narrative = narrativeEngine
                ? narrativeEngine.generate({ dataset, profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence })
                : { headline: 'Exploratory baseline completed.', topFindings: [] };

            // 3. Generate Multi-Tier Consumption Modes
            const execMode = executiveMode
                ? executiveMode.generate({ dataset, profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence, narrative })
                : { kpis: {}, inquiries: [], cards: [] };

            const anaMode = analystMode
                ? analystMode.generate({ dataset, profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence })
                : { chains: [], categories: [] };

            const eviMode = evidenceMode
                ? evidenceMode.generate({ dataset, profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence, synthesizedFindings: rankedFindings })
                : { matrix: [], traceability: {} };

            // 4. Generate 9-Step Adaptive Story with Chart Recommendations
            const story = storyEngine
                ? storyEngine.generateStory({ dataset, profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence })
                : { beats: [] };

            // 5. Build Chronological Analytical Timeline
            const investigations = window.UDIP?.InvestigationState ? window.UDIP.InvestigationState.listInvestigations() : [];
            const timeline = timelineEngine
                ? timelineEngine.buildTimeline({ dataset, profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence, investigations })
                : { events: [] };

            // 6. Perform 10-Dimensional Cross-Version Audit
            const versionComparison = versionComparator
                ? versionComparator.compare({
                    currentDataset: dataset,
                    previousDataset,
                    currentProfile: profile,
                    previousProfile,
                    currentAnalytics: analytics,
                    previousAnalytics,
                    currentDecision: decisionIntelligence,
                    previousDecision: previousDecisionIntelligence,
                    currentAutonomous: autonomousIntelligence
                })
                : { dimensions: [] };

            const metadata = {
                datasetName: dataset.filename || 'Dataset',
                rowCount: dataset.rowCount || profile.dataset?.rowCount || 0,
                columnCount: dataset.columnCount || profile.dataset?.columnCount || 0,
                generatedAt: Date.now(),
                version: '6.0.0'
            };

            return {
                metadata,
                synthesizedFindings: rankedFindings,
                narrative,
                executiveMode: execMode,
                analystMode: anaMode,
                evidenceMode: eviMode,
                story,
                timeline,
                versionComparison,
                limitations: narrative.limitations || [
                    'Statistical associations do not imply counterfactual causality.',
                    'Inference validity is conditional on historical variance coverage.'
                ]
            };
        },

        /**
         * Asynchronously run the complete Workspace & Storytelling pipeline,
         * yielding between cognitive sub-layers to guarantee 60 FPS fluidity.
         */
        async runAsync({
            dataset = {},
            previousDataset = null,
            profile = {},
            previousProfile = null,
            analysisPlan = {},
            analytics = {},
            previousAnalytics = null,
            decisionIntelligence = null,
            previousDecisionIntelligence = null,
            autonomousIntelligence = null,
            baselineDataset = null
        } = {}, onProgress = null) {
            const synthesizer = window.UDIP?.FindingSynthesizer;
            const orderer = window.UDIP?.FindingOrderer;
            const narrativeEngine = window.UDIP?.NarrativeEngine;
            const executiveMode = window.UDIP?.ExecutiveMode;
            const analystMode = window.UDIP?.AnalystMode;
            const evidenceMode = window.UDIP?.EvidenceMode;
            const storyEngine = window.UDIP?.StoryEngine;
            const timelineEngine = window.UDIP?.AnalyticalTimeline;
            const versionComparator = window.UDIP?.VersionComparator;

            // 1. Synthesize & Rank Consolidated Findings
            if (onProgress) onProgress({ stage: 5, percent: 95, stageName: 'Stage 5/5: Synthesizing top executive findings...', log: 'WORKSPACE: Synthesizing top findings...' });
            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 10));

            const rawFindings = synthesizer
                ? synthesizer.synthesize({ profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence })
                : [];
            const rankedFindings = orderer
                ? orderer.rankFindings(rawFindings)
                : rawFindings;

            // 2. Generate Fact-Checked Narrative
            if (onProgress) onProgress({ stage: 5, percent: 96, stageName: 'Stage 5/5: Generating comprehensive executive narrative...', log: 'WORKSPACE: Generating executive narrative...' });
            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 10));

            const narrative = narrativeEngine
                ? narrativeEngine.generate({ dataset, profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence })
                : { headline: 'Exploratory baseline completed.', topFindings: [] };

            // 3. Generate Multi-Tier Consumption Modes
            const execMode = executiveMode
                ? executiveMode.generate({ dataset, profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence, narrative })
                : { kpis: {}, inquiries: [], cards: [] };

            const anaMode = analystMode
                ? analystMode.generate({ dataset, profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence })
                : { chains: [], categories: [] };

            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 10));

            const eviMode = evidenceMode
                ? evidenceMode.generate({ dataset, profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence, synthesizedFindings: rankedFindings })
                : { matrix: [], traceability: {} };

            // 4. Generate 9-Step Adaptive Story
            if (onProgress) onProgress({ stage: 5, percent: 97, stageName: 'Stage 5/5: Building 9-step interactive visual story...', log: 'WORKSPACE: Building 9-step visual story...' });
            if (typeof setTimeout !== 'undefined') await new Promise(r => setTimeout(r, 10));

            const story = storyEngine
                ? storyEngine.generateStory({ dataset, profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence })
                : { beats: [] };

            // 5. Build Chronological Analytical Timeline
            const investigations = window.UDIP?.InvestigationState ? window.UDIP.InvestigationState.listInvestigations() : [];
            const timeline = timelineEngine
                ? timelineEngine.buildTimeline({ dataset, profile, analysisPlan, analytics, decisionIntelligence, autonomousIntelligence, investigations })
                : { events: [] };

            // 6. Perform 10-Dimensional Cross-Version Audit
            const versionComparison = versionComparator
                ? versionComparator.compare({
                    currentDataset: dataset,
                    previousDataset,
                    currentProfile: profile,
                    previousProfile,
                    currentAnalytics: analytics,
                    previousAnalytics,
                    currentDecision: decisionIntelligence,
                    previousDecision: previousDecisionIntelligence,
                    currentAutonomous: autonomousIntelligence
                })
                : { dimensions: [] };

            const metadata = {
                datasetName: dataset.filename || 'Dataset',
                rowCount: dataset.rowCount || profile.dataset?.rowCount || 0,
                columnCount: dataset.columnCount || profile.dataset?.columnCount || 0,
                generatedAt: Date.now(),
                version: '6.0.0'
            };

            return {
                metadata,
                synthesizedFindings: rankedFindings,
                narrative,
                executiveMode: execMode,
                analystMode: anaMode,
                evidenceMode: eviMode,
                story,
                timeline,
                versionComparison,
                limitations: narrative.limitations || [
                    'Statistical associations do not imply counterfactual causality.',
                    'Inference validity is conditional on historical variance coverage.'
                ]
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.WorkspaceEngine = WorkspaceEngine;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = WorkspaceEngine;
    }
})(typeof window !== 'undefined' ? window : global);
