/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: profiling/profiler.js
 * ============================================================================
 * Central Profiling Orchestrator.
 * Executes deep, transparent, single-pass inspection of the active dataset:
 * - Dataset identity, structure, and memory footprint
 * - Advanced type classification & semantic role determination
 * - Deep statistical metrics & outlier detection
 * - Pairwise Pearson correlations (excluding identifiers)
 * - Candidate target & feature ranking
 * - High-level dataset pattern classification
 * STRICTLY READ-ONLY: Never alters or drops original data.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const Profiler = {
        version: '2.0.0-profiler',

        /**
         * Profile a complete dataset object { filename, fileSize, fileType, columns, rows }
         * @returns {Object} Complete Profile Result Schema
         */
        profileDataset(dataset) {
            if (!dataset || !Array.isArray(dataset.columns) || !Array.isArray(dataset.rows)) {
                throw new Error('[UDIP:Profiler] Invalid dataset payload provided for profiling');
            }

            const startTime = Date.now();
            const { columns, rows, filename, fileSize, fileType } = dataset;
            const totalRows = rows.length;
            const totalCols = columns.length;

            const utils = window.UDIP.ProfilerUtils;
            const typeDetector = window.UDIP.TypeDetector;
            const statistics = window.UDIP.Statistics;
            const semanticDetector = window.UDIP.SemanticDetector;
            const qualityProfile = window.UDIP.QualityProfile;
            const helpers = window.UDIP.Helpers;

            // 1. Performance Sampling for large datasets
            const sampleInfo = utils ? utils.sampleDataset(rows, 25000) : { isSampled: false, rows: rows, sampleSize: totalRows };
            const workingRows = sampleInfo.rows;

            // 2. Estimate Memory Footprint
            let approxBytes = fileSize || 0;
            if (approxBytes === 0 && workingRows.length > 0) {
                // Rough in-memory estimation
                approxBytes = JSON.stringify(workingRows.slice(0, 100)).length * (totalRows / 100);
            }
            const memoryFormatted = helpers ? helpers.formatBytes(approxBytes) : `${Math.round(approxBytes / 1024)} KB`;

            // 3. Detect Empty Rows
            let emptyRowCount = 0;
            for (let i = 0; i < totalRows; i++) {
                const r = rows[i];
                let allEmpty = true;
                for (let c = 0; c < totalCols; c++) {
                    const v = r[columns[c]];
                    if (v !== null && v !== undefined && String(v).trim() !== '') {
                        allEmpty = false;
                        break;
                    }
                }
                if (allEmpty) emptyRowCount++;
            }

            // 4. Detect Duplicate Rows
            const duplicateInfo = qualityProfile
                ? qualityProfile.detectDuplicateRows(rows, columns)
                : { count: 0, pct: 0, uniqueRowCount: totalRows };

            // 5. Deep Column Profiling
            const columnsProfile = [];
            const structureCounts = {
                numeric: 0,
                categorical: 0,
                dateTime: 0,
                boolean: 0,
                text: 0,
                identifier: 0,
                mixed: 0,
                empty: 0
            };

            const numericVectors = {}; // For Pearson correlations

            for (let cIdx = 0; cIdx < totalCols; cIdx++) {
                const colName = columns[cIdx];

                // Type detection
                const typeInfo = typeDetector
                    ? typeDetector.detectColumnType(colName, workingRows)
                    : { detectedType: 'string', subType: 'string', typeReason: 'Default string' };

                // Statistics
                const stats = statistics
                    ? statistics.profileColumn(colName, workingRows, typeInfo)
                    : { totalCount: totalRows, nullCount: 0, nullPct: 0 };

                // Semantic role & reasoning
                const semanticInfo = semanticDetector
                    ? semanticDetector.inferSemanticRole(colName, typeInfo, stats, totalRows, cIdx, totalCols)
                    : { role: 'unknown', reason: 'Basic inference' };

                // Target & Feature suitability
                const targetSuitability = semanticDetector
                    ? semanticDetector.calculateTargetSuitability(colName, typeInfo, stats, cIdx, totalCols)
                    : { score: 0, taskHint: 'unknown', reasons: [] };

                const featureSuitability = semanticDetector
                    ? semanticDetector.calculateFeatureSuitability(colName, typeInfo, stats, targetSuitability.score)
                    : { score: 50, reasons: [] };

                // Count structure aggregates
                const dType = typeInfo.detectedType;
                if (dType === 'integer' || dType === 'decimal' || dType === 'numeric') structureCounts.numeric++;
                else if (dType === 'categorical') structureCounts.categorical++;
                else if (dType === 'date' || dType === 'datetime' || dType === 'time') structureCounts.dateTime++;
                else if (dType === 'boolean') structureCounts.boolean++;
                else if (dType === 'text') structureCounts.text++;
                else if (dType === 'identifier') structureCounts.identifier++;
                else if (dType === 'mixed') structureCounts.mixed++;
                else if (dType === 'empty') structureCounts.empty++;

                // Column warnings
                const colWarnings = [];
                if (stats.nullPct >= 30) colWarnings.push(`High missingness (${stats.nullPct}%)`);
                if (stats.isConstant) colWarnings.push('Zero variance / Constant column');
                if (stats.isNearConstant) colWarnings.push('Near-constant (>95% single value)');
                if (typeInfo.isMixed) colWarnings.push('Contains mixed inconsistent types');
                if (stats.outliers && stats.outliers.pct > 5) colWarnings.push(`${stats.outliers.pct}% potential IQR outliers`);

                // Prepare numeric vectors for correlation (excluding identifiers)
                if ((dType === 'integer' || dType === 'decimal' || dType === 'numeric') && semanticInfo.role !== 'identifier') {
                    numericVectors[colName] = [];
                    for (let r = 0; r < workingRows.length; r++) {
                        numericVectors[colName].push(utils.toNumber(workingRows[r][colName]));
                    }
                }

                columnsProfile.push({
                    name: colName,
                    index: cIdx + 1,
                    detectedType: dType,
                    subType: typeInfo.subType,
                    typeReason: typeInfo.typeReason,
                    semanticRole: semanticInfo.role,
                    semanticReason: semanticInfo.reason,
                    targetSuitability,
                    featureSuitability,
                    stats,
                    typeInfo,
                    warnings: colWarnings
                });
            }

            // 6. Candidate Targets & Features Ranking
            const targetCandidates = columnsProfile
                .filter(c => c.targetSuitability.score > 25)
                .map(c => ({
                    name: c.name,
                    score: c.targetSuitability.score,
                    taskHint: c.targetSuitability.taskHint,
                    type: c.detectedType,
                    reasons: c.targetSuitability.reasons
                }))
                .sort((a, b) => b.score - a.score);

            const featureCandidates = columnsProfile
                .filter(c => c.featureSuitability.score > 30)
                .map(c => ({
                    name: c.name,
                    score: c.featureSuitability.score,
                    type: c.detectedType,
                    reasons: c.featureSuitability.reasons
                }))
                .sort((a, b) => b.score - a.score);

            // 7. Dataset Health & Transparent Quality Score
            const healthProfile = qualityProfile
                ? qualityProfile.assessDatasetHealth(columnsProfile, duplicateInfo, totalRows, totalCols)
                : { qualityScore: 100, completenessPct: 100, missingPct: 0, issues: [] };

            // 8. High-Level Dataset Pattern Detection
            const datasetPatterns = qualityProfile
                ? qualityProfile.detectDatasetPatterns(columnsProfile, totalRows, targetCandidates)
                : [{ pattern: 'Cross-sectional', confidence: 80, reasons: ['Tabular data'] }];

            // 9. Pairwise Pearson Correlations (for eligible numeric columns)
            const correlations = [];
            const numKeys = Object.keys(numericVectors);
            if (numKeys.length >= 2 && utils) {
                for (let i = 0; i < numKeys.length; i++) {
                    for (let j = i + 1; j < numKeys.length; j++) {
                        const colA = numKeys[i];
                        const colB = numKeys[j];
                        const r = utils.pearsonCorrelation(numericVectors[colA], numericVectors[colB]);
                        const absR = Math.abs(r);

                        let strength = 'negligible';
                        if (absR >= 0.8) strength = 'very_strong';
                        else if (absR >= 0.6) strength = 'strong';
                        else if (absR >= 0.4) strength = 'moderate';
                        else if (absR >= 0.2) strength = 'weak';

                        if (absR >= 0.2) {
                            correlations.push({
                                colA,
                                colB,
                                pearson: +r.toFixed(4),
                                absPearson: +absR.toFixed(4),
                                strength,
                                direction: r >= 0 ? 'positive' : 'negative'
                            });
                        }
                    }
                }
                correlations.sort((a, b) => b.absPearson - a.absPearson);
            }

            // 10. Construct Final Profile Schema
            const profile = {
                dataset: {
                    filename: filename || 'dataset',
                    fileSize,
                    fileType,
                    rowCount: totalRows,
                    columnCount: totalCols,
                    emptyRowCount,
                    memoryBytes: approxBytes,
                    memoryFormatted,
                    duplicateRowCount: duplicateInfo.count,
                    duplicateRowPct: duplicateInfo.pct,
                    isSampled: sampleInfo.isSampled,
                    sampleSize: sampleInfo.sampleSize
                },
                quality: healthProfile,
                structure: structureCounts,
                columns: columnsProfile,
                relationships: {
                    correlations
                },
                targetCandidates,
                featureCandidates,
                datasetPatterns,
                warnings: healthProfile.issues || [],
                profileDurationMs: Date.now() - startTime,
                generatedAt: new Date().toISOString()
            };

            console.info(`[UDIP:Profiler] Dataset profiling complete for "${profile.dataset.filename}" in ${profile.profileDurationMs}ms (Quality Score: ${profile.quality.qualityScore}/100)`);

            // Cache profile inside active dataset object
            dataset.profile = profile;

            return profile;
        },

        /**
         * Asynchronously profile dataset yielding control back to the event loop
         * between heavy statistical operations to ensure smooth 60 FPS UI animations.
         */
        async profileDatasetAsync(dataset, onProgress = null) {
            if (!dataset || !Array.isArray(dataset.columns) || !Array.isArray(dataset.rows)) {
                throw new Error('[UDIP:Profiler] Invalid dataset payload provided for profiling');
            }

            const startTime = Date.now();
            const { columns, rows, filename, fileSize, fileType } = dataset;
            const totalRows = rows.length;
            const totalCols = columns.length;

            const utils = window.UDIP.ProfilerUtils;
            const typeDetector = window.UDIP.TypeDetector;
            const statistics = window.UDIP.Statistics;
            const semanticDetector = window.UDIP.SemanticDetector;
            const qualityProfile = window.UDIP.QualityProfile;
            const helpers = window.UDIP.Helpers;

            // 1. Performance Sampling
            const sampleInfo = utils ? utils.sampleDataset(rows, 25000) : { isSampled: false, rows: rows, sampleSize: totalRows };
            const workingRows = sampleInfo.rows;

            // 2. Estimate Memory Footprint
            let approxBytes = fileSize || 0;
            if (approxBytes === 0 && workingRows.length > 0) {
                approxBytes = JSON.stringify(workingRows.slice(0, 100)).length * (totalRows / 100);
            }
            const memoryFormatted = helpers ? helpers.formatBytes(approxBytes) : `${Math.round(approxBytes / 1024)} KB`;

            await new Promise(r => setTimeout(r, 10));

            // 3. Detect Empty Rows
            let emptyRowCount = 0;
            for (let i = 0; i < totalRows; i++) {
                const r = rows[i];
                let allEmpty = true;
                for (let c = 0; c < totalCols; c++) {
                    const v = r[columns[c]];
                    if (v !== null && v !== undefined && String(v).trim() !== '') {
                        allEmpty = false;
                        break;
                    }
                }
                if (allEmpty) emptyRowCount++;
            }

            await new Promise(r => setTimeout(r, 10));

            // 4. Detect Duplicate Rows
            const duplicateInfo = qualityProfile
                ? qualityProfile.detectDuplicateRows(rows, columns)
                : { count: 0, pct: 0, uniqueRowCount: totalRows };

            // 5. Deep Column Profiling with batch yielding
            const columnsProfile = [];
            const structureCounts = {
                numeric: 0,
                categorical: 0,
                dateTime: 0,
                boolean: 0,
                text: 0,
                identifier: 0,
                mixed: 0,
                empty: 0
            };

            const numericVectors = {};

            for (let cIdx = 0; cIdx < totalCols; cIdx++) {
                const colName = columns[cIdx];

                const typeInfo = typeDetector
                    ? typeDetector.detectColumnType(colName, workingRows)
                    : { detectedType: 'string', subType: 'string', typeReason: 'Default string' };

                const stats = statistics
                    ? statistics.profileColumn(colName, workingRows, typeInfo)
                    : { totalCount: totalRows, nullCount: 0, nullPct: 0 };

                const semanticInfo = semanticDetector
                    ? semanticDetector.inferSemanticRole(colName, typeInfo, stats, totalRows, cIdx, totalCols)
                    : { role: 'unknown', reason: 'Basic inference' };

                const targetSuitability = semanticDetector
                    ? semanticDetector.calculateTargetSuitability(colName, typeInfo, stats, cIdx, totalCols)
                    : { score: 0, taskHint: 'unknown', reasons: [] };

                const featureSuitability = semanticDetector
                    ? semanticDetector.calculateFeatureSuitability(colName, typeInfo, stats, targetSuitability.score)
                    : { score: 50, reasons: [] };

                const dType = typeInfo.detectedType;
                if (dType === 'integer' || dType === 'decimal' || dType === 'numeric') structureCounts.numeric++;
                else if (dType === 'categorical') structureCounts.categorical++;
                else if (dType === 'date' || dType === 'datetime' || dType === 'time') structureCounts.dateTime++;
                else if (dType === 'boolean') structureCounts.boolean++;
                else if (dType === 'text') structureCounts.text++;
                else if (dType === 'identifier') structureCounts.identifier++;
                else if (dType === 'mixed') structureCounts.mixed++;
                else if (dType === 'empty') structureCounts.empty++;

                const colWarnings = [];
                if (stats.nullPct >= 30) colWarnings.push(`High missingness (${stats.nullPct}%)`);
                if (stats.isConstant) colWarnings.push('Zero variance / Constant column');
                if (stats.isNearConstant) colWarnings.push('Near-constant (>95% single value)');
                if (typeInfo.isMixed) colWarnings.push('Contains mixed inconsistent types');
                if (stats.outliers && stats.outliers.pct > 5) colWarnings.push(`${stats.outliers.pct}% potential IQR outliers`);

                if ((dType === 'integer' || dType === 'decimal' || dType === 'numeric') && semanticInfo.role !== 'identifier') {
                    numericVectors[colName] = [];
                    for (let r = 0; r < workingRows.length; r++) {
                        numericVectors[colName].push(utils.toNumber(workingRows[r][colName]));
                    }
                }

                columnsProfile.push({
                    name: colName,
                    index: cIdx + 1,
                    detectedType: dType,
                    subType: typeInfo.subType,
                    typeReason: typeInfo.typeReason,
                    semanticRole: semanticInfo.role,
                    semanticReason: semanticInfo.reason,
                    targetSuitability,
                    featureSuitability,
                    stats,
                    typeInfo,
                    warnings: colWarnings
                });

                if (cIdx % 4 === 0 || cIdx === totalCols - 1) {
                    if (onProgress) {
                        const pct = 58 + Math.round(((cIdx + 1) / totalCols) * 14);
                        onProgress({ stage: 3, percent: pct, stageName: `Stage 3/5: Auditing column [${colName}] (${cIdx + 1}/${totalCols})...`, log: `COL_PROFILE: ${colName} (${dType}) verified` });
                    }
                    await new Promise(r => setTimeout(r, 10));
                }
            }

            // 6. Ranking
            const targetCandidates = columnsProfile
                .filter(c => c.targetSuitability.score > 25)
                .map(c => ({
                    name: c.name,
                    score: c.targetSuitability.score,
                    taskHint: c.targetSuitability.taskHint,
                    type: c.detectedType,
                    reasons: c.targetSuitability.reasons
                }))
                .sort((a, b) => b.score - a.score);

            const featureCandidates = columnsProfile
                .filter(c => c.featureSuitability.score > 30)
                .map(c => ({
                    name: c.name,
                    score: c.featureSuitability.score,
                    type: c.detectedType,
                    reasons: c.featureSuitability.reasons
                }))
                .sort((a, b) => b.score - a.score);

            await new Promise(r => setTimeout(r, 10));

            // 7. Dataset Health
            const healthProfile = qualityProfile
                ? qualityProfile.assessDatasetHealth(columnsProfile, duplicateInfo, totalRows, totalCols)
                : { qualityScore: 100, completenessPct: 100, missingPct: 0, issues: [] };

            // 8. Pattern Detection
            const datasetPatterns = qualityProfile
                ? qualityProfile.detectDatasetPatterns(columnsProfile, totalRows, targetCandidates)
                : [{ pattern: 'Cross-sectional', confidence: 80, reasons: ['Tabular data'] }];

            // 9. Pairwise Pearson Correlations with chunked yielding
            const correlations = [];
            const numKeys = Object.keys(numericVectors);
            if (numKeys.length >= 2 && utils) {
                let pairCount = 0;
                for (let i = 0; i < numKeys.length; i++) {
                    for (let j = i + 1; j < numKeys.length; j++) {
                        pairCount++;
                        const colA = numKeys[i];
                        const colB = numKeys[j];
                        const r = utils.pearsonCorrelation(numericVectors[colA], numericVectors[colB]);
                        const absR = Math.abs(r);

                        let strength = 'negligible';
                        if (absR >= 0.8) strength = 'very_strong';
                        else if (absR >= 0.6) strength = 'strong';
                        else if (absR >= 0.4) strength = 'moderate';
                        else if (absR >= 0.2) strength = 'weak';

                        if (absR >= 0.2) {
                            correlations.push({
                                colA,
                                colB,
                                pearson: +r.toFixed(4),
                                absPearson: +absR.toFixed(4),
                                strength,
                                direction: r >= 0 ? 'positive' : 'negative'
                            });
                        }

                        if (pairCount % 20 === 0) {
                            await new Promise(r => setTimeout(r, 8));
                        }
                    }
                }
                correlations.sort((a, b) => b.absPearson - a.absPearson);
            }

            // 10. Construct Final Profile Schema
            const profile = {
                dataset: {
                    filename: filename || 'dataset',
                    fileSize,
                    fileType,
                    rowCount: totalRows,
                    columnCount: totalCols,
                    emptyRowCount,
                    memoryBytes: approxBytes,
                    memoryFormatted,
                    duplicateRowCount: duplicateInfo.count,
                    duplicateRowPct: duplicateInfo.pct,
                    isSampled: sampleInfo.isSampled,
                    sampleSize: sampleInfo.sampleSize
                },
                quality: healthProfile,
                structure: structureCounts,
                columns: columnsProfile,
                relationships: {
                    correlations
                },
                targetCandidates,
                featureCandidates,
                datasetPatterns,
                warnings: healthProfile.issues || [],
                profileDurationMs: Date.now() - startTime,
                generatedAt: new Date().toISOString()
            };

            console.info(`[UDIP:Profiler] Dataset profiling complete for "${profile.dataset.filename}" in ${profile.profileDurationMs}ms (Quality Score: ${profile.quality.qualityScore}/100)`);
            dataset.profile = profile;
            return profile;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Profiler = Profiler;

})(window);
