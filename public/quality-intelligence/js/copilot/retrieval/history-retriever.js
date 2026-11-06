/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/retrieval/history-retriever.js
 * ============================================================================
 * Historical & evolutionary analytical retrieval:
 * Interrogates Step 5 Insight/Model Memory, Evolution tracking, and
 * Step 6 Analytical Timeline.
 * Strictly avoids fabricating historical records.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const HistoryRetriever = {
        /**
         * Query historical evolution and prior states
         * @param {Object} queryParams
         * @param {string} queryParams.userMessage
         * @param {Array} queryParams.entities
         * @param {Object} queryParams.platform
         * @returns {Object}
         */
        retrieveHistory({ userMessage = '', entities = [], platform = {} } = {}) {
            const autonomous = platform.autonomousIntelligence;
            const workspace = platform.workspace;

            const insightMemory = autonomous?.insightMemory;
            const modelMemory = autonomous?.modelMemory;
            const insightEvolution = autonomous?.insightEvolution;
            const timeline = workspace?.timeline?.events || [];

            // Check if multiple versions or timeline history exist
            const hasTimeline = Array.isArray(timeline) && timeline.length > 0;
            const hasInsightHistory = Boolean(insightMemory && insightMemory.count > 0);
            const hasModelHistory = Boolean(modelMemory && modelMemory.count > 0);

            if (!hasTimeline && !hasInsightHistory && !hasModelHistory) {
                return {
                    hasHistory: false,
                    timelineEvents: [],
                    insightEvolution: null,
                    modelHistory: null,
                    message: 'هذه هي النسخة الأولى للبيانات؛ لا توجد نسخ سابقة مسجلة في الذاكرة حتى الآن.'
                };
            }

            // Look for specific column or model in history
            const colEntity = entities.find(e => e.type === 'column')?.value;
            const modelEntity = entities.find(e => e.type === 'model')?.value;

            let specificEvolution = null;
            if (colEntity && insightEvolution?.trackedInsights) {
                specificEvolution = insightEvolution.trackedInsights.find(t => 
                    (t.currentFinding?.title || '').toLowerCase().includes(colEntity.toLowerCase()) ||
                    (t.currentFinding?.observation || '').toLowerCase().includes(colEntity.toLowerCase())
                );
            }

            let specificModelHistory = null;
            if (modelEntity && modelMemory?.getHistory) {
                specificModelHistory = modelMemory.getHistory(modelEntity);
            }

            return {
                hasHistory: true,
                timelineEvents: timeline.slice(-5),
                insightEvolution: specificEvolution || insightEvolution?.summary || null,
                modelHistory: specificModelHistory || null,
                totalRecordedEvents: timeline.length,
                message: 'تم العثور على سجلات تطور تاريخية مسجلة.'
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.HistoryRetriever = HistoryRetriever;

})(typeof window !== 'undefined' ? window : global);
