/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/change/change-detector.js
 * ============================================================================
 * Synthesizes volumetric, schema, quality, and distributional changes into a
 * deterministic multi-factor change classification:
 * - No meaningful change (Score: 0–14)
 * - Minor change         (Score: 15–39)
 * - Moderate change      (Score: 40–69)
 * - Major change         (Score: 70–89)
 * - Critical change      (Score: 90–100)
 * 
 * Safeguard: Row count accumulation alone without distributional shift or
 * schema disruption produces minimal change score, avoiding spurious re-triggering.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ChangeDetector = {
        /**
         * Classify composite change across monitoring layers
         * 
         * @param {Object} params
         * @param {Object} params.datasetMonitoring
         * @param {Object} params.schemaMonitoring
         * @param {Object} params.qualityMonitoring
         * @param {Object} params.distributionMonitoring
         * @returns {Object} Deterministic Change Classification Report
         */
        detect({
            datasetMonitoring = {},
            schemaMonitoring = {},
            qualityMonitoring = {},
            distributionMonitoring = {}
        } = {}) {
            let score = 0;
            const factors = [];

            // 1. Schema Disruption Weight (Max 40 points)
            const schemaChanges = schemaMonitoring?.changes || [];
            if (schemaChanges.length > 0) {
                let schemaScore = 0;
                const removed = schemaMonitoring.removedColumns?.length || 0;
                const types = schemaMonitoring.typeChanges?.length || 0;
                const added = schemaMonitoring.addedColumns?.length || 0;
                const targets = schemaMonitoring.targetChanges?.length || 0;

                schemaScore += removed * 25;   // Removed columns heavily disrupt downstream models
                schemaScore += types * 25;     // Type changes break pipelines
                schemaScore += targets * 30;   // Target changes alter entire objective
                schemaScore += added * 15;     // Added columns are notable additions

                const clampedSchema = Math.min(50, schemaScore);
                score += clampedSchema;
                factors.push({
                    dimension: 'schema',
                    contribution: clampedSchema,
                    detail: `${schemaChanges.length} schema change(s) detected (removed: ${removed}, type changes: ${types}, added: ${added}).`
                });
            }

            // 2. Data Quality Degradation Weight (Max 30 points)
            const qualDelta = qualityMonitoring?.scoreDelta || 0;
            if (qualDelta < 0) {
                const absDelta = Math.abs(qualDelta);
                let qualScore = 0;
                if (absDelta >= 20) qualScore = 30;
                else if (absDelta >= 10) qualScore = 20;
                else if (absDelta >= 5) qualScore = 10;
                else qualScore = 5;

                score += qualScore;
                factors.push({
                    dimension: 'quality',
                    contribution: qualScore,
                    detail: `Quality score declined by ${absDelta} points (${qualityMonitoring.previousScore} -> ${qualityMonitoring.currentScore}).`
                });
            }

            // 3. Distribution Shifts (Max 35 points)
            const distSummary = distributionMonitoring?.summary || {};
            const shiftedCols = distSummary.shiftedCount || 0;
            const criticalShifts = distSummary.criticalShifts?.length || 0;

            if (shiftedCols > 0) {
                let distScore = Math.min(35, shiftedCols * 12 + criticalShifts * 15);
                score += distScore;
                factors.push({
                    dimension: 'distribution',
                    contribution: distScore,
                    detail: `Distribution shifts detected in ${shiftedCols} column(s) (${criticalShifts} critical).`
                });
            }

            // 4. Volumetric Change (Row Count) Weight (Max 10 points - Safeguarded!)
            // Data accumulation alone does not justify major alarms
            const rowDelta = datasetMonitoring?.rowDelta || 0;
            const prevRows = datasetMonitoring?.changes?.find(c => c.type === 'row_count')?.previousValue || 1;
            const rowPct = prevRows > 0 ? (Math.abs(rowDelta) / prevRows) * 100 : 0;

            if (rowPct >= 100) {
                score += 10;
                factors.push({ dimension: 'volume', contribution: 10, detail: `Row volume more than doubled (${rowDelta > 0 ? '+' : ''}${rowDelta} rows).` });
            } else if (rowPct >= 50) {
                score += 5;
                factors.push({ dimension: 'volume', contribution: 5, detail: `Substantial row volume growth (${rowDelta > 0 ? '+' : ''}${rowDelta} rows, ${rowPct.toFixed(1)}%).` });
            }

            const boundedScore = Math.min(100, Math.max(0, Math.round(score)));

            // Deterministic classification thresholds
            let classification = 'No meaningful change';
            let priority = 'low';

            if (boundedScore >= 90) {
                classification = 'Critical change';
                priority = 'critical';
            } else if (boundedScore >= 70) {
                classification = 'Major change';
                priority = 'high';
            } else if (boundedScore >= 40) {
                classification = 'Moderate change';
                priority = 'medium';
            } else if (boundedScore >= 15) {
                classification = 'Minor change';
                priority = 'low';
            }

            return {
                status: 'evaluated',
                score: boundedScore,
                classification,
                priority,
                isMeaningfulChange: boundedScore >= 40,
                factors,
                rationale: factors.length > 0
                    ? `Change classified as "${classification}" (score: ${boundedScore}/100) based on ${factors.map(f => f.dimension).join(', ')}.`
                    : 'No meaningful changes detected across volumetric, schema, quality, or distributional dimensions.'
            };
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.ChangeDetector = ChangeDetector;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChangeDetector;
    }
})(typeof window !== 'undefined' ? window : global);
