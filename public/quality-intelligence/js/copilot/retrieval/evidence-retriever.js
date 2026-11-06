/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/retrieval/evidence-retriever.js
 * ============================================================================
 * Multi-engine evidence retrieval and ranking engine.
 * Searches across Steps 2 through 6 analytical outputs:
 * - Findings, Columns, Metrics, Models, Drifts, Risks, Opportunities
 * Ranks evidence using: Relevance, Evidence Strength, Confidence, and Directness.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const EvidenceRetriever = {
        /**
         * Retrieve and rank relevant evidence items across platform engines
         * @param {Object} queryContext
         * @param {string} queryContext.intent
         * @param {Array} queryContext.entities
         * @param {Object} queryContext.platform
         * @returns {Array<Object>} Ranked evidence items
         */
        retrieve({ intent = '', entities = [], platform = {} } = {}) {
            const rawEvidence = [];
            const colEntities = entities.filter(e => e.type === 'column').map(e => e.value.toLowerCase());
            const modelEntities = entities.filter(e => e.type === 'model').map(e => e.value.toLowerCase());

            const profile = platform.profile;
            const analytics = platform.analytics;
            const decisionIntelligence = platform.decisionIntelligence;
            const autonomousIntelligence = platform.autonomousIntelligence;
            const workspace = platform.workspace;

            // 1. Evidence from Workspace Findings & Evidence Mode
            const wsFindings = workspace?.narrative?.findings || [];
            wsFindings.forEach(f => {
                const relevance = computeTextRelevance(f.title + ' ' + (f.observation || ''), colEntities);
                const matchedCol = colEntities.find(c => (f.title + ' ' + (f.observation || '')).toLowerCase().includes(c));
                rawEvidence.push({
                    id: f.id || 'fnd_' + Math.random().toString(36).substring(2, 6),
                    type: 'finding',
                    title: f.title || 'Workspace Finding',
                    metric: f.importanceCategory || 'analytical_finding',
                    value: f.impact || f.confidenceScore || 'Valid',
                    strength: typeof f.evidenceStrength === 'number' ? f.evidenceStrength : 85,
                    confidence: f.confidenceScore || 85,
                    source: 'Workspace Narrative',
                    column: matchedCol || f.column,
                    relevance: relevance,
                    directness: relevance > 0.5 ? 0.9 : 0.6
                });
            });

            // 2. Evidence from Feature Importance & ML Leaderboard
            const featureImportances = analytics?.machineLearning?.featureImportance || 
                                       analytics?.interpretation?.featureImportances || [];
            featureImportances.forEach(fi => {
                const colName = fi.feature || fi.name || fi.column || '';
                const isTargetCol = colEntities.includes(colName.toLowerCase());
                rawEvidence.push({
                    id: 'fi_' + colName,
                    type: 'feature_importance',
                    title: `Feature Importance: ${colName}`,
                    metric: 'Relative Importance',
                    value: typeof fi.importance === 'number' ? Number((fi.importance * 100).toFixed(1)) + '%' : fi.importance,
                    strength: 90,
                    confidence: 90,
                    source: 'Machine Learning Engine',
                    column: colName,
                    relevance: isTargetCol ? 1.0 : (colEntities.length === 0 ? 0.7 : 0.2),
                    directness: isTargetCol ? 1.0 : 0.5
                });
            });

            const leaderboard = analytics?.machineLearning?.leaderboard || analytics?.leaderboard || [];
            leaderboard.forEach((m, idx) => {
                const mName = m.name || m.modelName || 'Model ' + (idx + 1);
                const isTargetModel = modelEntities.includes(mName.toLowerCase()) || idx === 0;
                rawEvidence.push({
                    id: 'mdl_' + idx,
                    type: 'model_metric',
                    title: `Model Evaluation: ${mName}`,
                    metric: m.taskType === 'classification' ? 'Accuracy / F1' : 'R² Score / RMSE',
                    value: m.scoreFormatted || (m.metrics ? `Score: ${Number(m.metrics.r2 || m.metrics.accuracy || 0).toFixed(3)}` : 'Trained'),
                    strength: 95,
                    confidence: typeof m.trustScore === 'number' ? m.trustScore : 88,
                    source: 'Machine Learning Leaderboard',
                    model: mName,
                    relevance: isTargetModel ? 1.0 : 0.4,
                    directness: isTargetModel ? 1.0 : 0.6
                });
            });

            // 3. Evidence from Decision Intelligence (Risks & Opportunities)
            const risks = Array.isArray(decisionIntelligence?.risks)
                ? decisionIntelligence.risks
                : (decisionIntelligence?.risks?.rankedRisks || []);
            risks.slice(0, 5).forEach(r => {
                rawEvidence.push({
                    id: r.id || 'risk_' + Math.random().toString(36).substring(2, 6),
                    type: 'risk',
                    title: r.title || 'Identified Risk',
                    metric: 'Severity & Likelihood',
                    value: `Score: ${r.score || 0} (${r.severity || 'Medium'})`,
                    strength: 85,
                    confidence: 85,
                    source: 'Decision Risk Engine',
                    relevance: intent === 'RISK_ANALYSIS' ? 1.0 : 0.5,
                    directness: 0.8
                });
            });

            const opportunities = Array.isArray(decisionIntelligence?.opportunities)
                ? decisionIntelligence.opportunities
                : (decisionIntelligence?.opportunities?.rankedOpportunities || []);
            opportunities.slice(0, 5).forEach(o => {
                rawEvidence.push({
                    id: o.id || 'opp_' + Math.random().toString(36).substring(2, 6),
                    type: 'opportunity',
                    title: o.title || 'Identified Opportunity',
                    metric: 'Potential Gain',
                    value: `Score: ${o.score || 0} (${o.potentialGain || 'High'})`,
                    strength: 85,
                    confidence: 85,
                    source: 'Decision Opportunity Engine',
                    relevance: intent === 'OPPORTUNITY_ANALYSIS' ? 1.0 : 0.5,
                    directness: 0.8
                });
            });

            // 4. Evidence from Autonomous Intelligence (Drift & Monitoring)
            const shifts = autonomousIntelligence?.changeDetection?.shiftedFeatures || 
                           autonomousIntelligence?.drift?.featureDrifts || [];
            shifts.forEach(s => {
                const fName = s.feature || s.column || '';
                const isTargetCol = colEntities.includes(fName.toLowerCase());
                rawEvidence.push({
                    id: 'shift_' + fName,
                    type: 'drift',
                    title: `Distribution Shift: ${fName}`,
                    metric: 'Standardized Drift Magnitude',
                    value: `Shift: ${typeof s.shiftMagnitude === 'number' ? s.shiftMagnitude.toFixed(2) : (s.p_value ? 'p=' + s.p_value.toFixed(3) : 'Observed')}`,
                    strength: 88,
                    confidence: 88,
                    source: 'Autonomous Drift Engine',
                    column: fName,
                    relevance: intent === 'DRIFT_ANALYSIS' || intent === 'COMPARISON' ? 1.0 : (isTargetCol ? 0.9 : 0.3),
                    directness: 0.9
                });
            });

            // 5. Evidence from Profiler (Quality & Schema)
            if (profile?.quality) {
                rawEvidence.push({
                    id: 'qual_overall',
                    type: 'quality',
                    title: 'Overall Data Health Score',
                    metric: 'Health Score',
                    value: `${Math.round(profile.quality.overallHealthScore || 100)} / 100`,
                    strength: 95,
                    confidence: 95,
                    source: 'Data Profiler',
                    relevance: intent === 'DATA_QUALITY' ? 1.0 : 0.4,
                    directness: 0.9
                });
            }

            // 6. Evidence from Deep Data Understanding & Cognitive Knowledge Model
            const km = platform.knowledgeModel || platform.dataset?.knowledgeModel;
            if (km) {
                // Discovered Entities & Topology
                const topologiesList = km.topology || km.topologies || [];
                if (topologiesList.length > 0) {
                    const topTopo = topologiesList[0];
                    const topoName = topTopo.topology || topTopo.label || topTopo.type || 'TABULAR';
                    const topoConf = topTopo.confidence || topTopo.score || topTopo.likelihood || 0.9;
                    rawEvidence.push({
                        id: 'km_topology',
                        type: 'topology',
                        title: `Discovered Dataset Topology: ${topoName}`,
                        metric: 'Topology Confidence',
                        value: `${Math.round(topoConf * 100)}% confidence`,
                        strength: 92,
                        confidence: Math.round(topoConf * 100),
                        source: 'Deep Data Understanding Engine',
                        relevance: 0.8,
                        directness: 0.9
                    });
                }
                // Non-linear relationships
                if (km.relationships) {
                    const nonLinear = km.relationships.filter(r => r.isNonlinear || r.isNonLinear || (r.shape && r.shape !== 'LINEAR'));
                    nonLinear.forEach((nl, idx) => {
                        const isTargetRel = colEntities.includes((nl.colA || '').toLowerCase()) || colEntities.includes((nl.colB || '').toLowerCase());
                        rawEvidence.push({
                            id: `km_nl_${idx}`,
                            type: 'nonlinear_relationship',
                            title: `Non-linear Dynamic: ${nl.colA} ↔ ${nl.colB}`,
                            metric: 'Spearman / MI Gap',
                            value: `Mutual Info: ${nl.mutualInfo || nl.mutualInformationNats || 0} nats | Spearman: ${nl.spearman || nl.spearmanRho || 0} vs Pearson: ${nl.pearson || 0}`,
                            strength: 88,
                            confidence: 85,
                            source: 'Cognitive Non-linear Analyzer',
                            relevance: isTargetRel ? 1.0 : 0.6,
                            directness: isTargetRel ? 1.0 : 0.7
                        });
                    });
                }
                // Derived Variables
                if (km.derivedVariables) {
                    km.derivedVariables.forEach((dv, idx) => {
                        const targetColName = dv.targetColumn || dv.derivedCol || 'Derived';
                        const errVal = dv.errorTolerance !== undefined ? dv.errorTolerance : (dv.error || 0);
                        rawEvidence.push({
                            id: `km_dv_${idx}`,
                            type: 'derived_variable',
                            title: `Mathematical Redundancy: ${targetColName}`,
                            metric: 'Formula Equation',
                            value: `${dv.formula} (error: ${errVal})`,
                            strength: 95,
                            confidence: 90,
                            source: 'Derived Variable Detector',
                            relevance: 0.7,
                            directness: 0.85
                        });
                    });
                }
                // Critic Audit
                if (km.criticAudit) {
                    rawEvidence.push({
                        id: 'km_critic_audit',
                        type: 'critic_audit',
                        title: `Adversarial Quality Gate: ${km.criticAudit.verdict}`,
                        metric: 'Critic Score',
                        value: `Score: ${km.criticAudit.score || 85}/100 (${km.criticAudit.warningCount || 0} warnings, ${km.criticAudit.failureCount || 0} failures)`,
                        strength: 90,
                        confidence: 90,
                        source: 'Analytical Critic 2.0',
                        relevance: 0.8,
                        directness: 0.9
                    });
                }
                // Hypotheses
                if (km.hypotheses) {
                    km.hypotheses.forEach((hyp, idx) => {
                        rawEvidence.push({
                            id: `km_hyp_${idx}`,
                            type: 'hypothesis',
                            title: `Analytical Hypothesis: ${hyp.statement}`,
                            metric: 'Status & Counter-Evidence',
                            value: `${hyp.status} (Counter-evidence items: ${(hyp.counterEvidence || []).length})`,
                            strength: 85,
                            confidence: Math.round((hyp.confidence || 0.8) * 100),
                            source: 'Hypothesis Generator',
                            relevance: 0.75,
                            directness: 0.8
                        });
                    });
                }
                // Causal Warnings
                if (km.causalWarnings && km.causalWarnings.length > 0) {
                    rawEvidence.push({
                        id: 'km_causal_humility',
                        type: 'causal_warning',
                        title: 'Causal Inference Caution',
                        metric: 'Confounder & Humility Alert',
                        value: 'Association detected, causal inference not established',
                        strength: 90,
                        confidence: 90,
                        source: 'Causal Reasoner',
                        relevance: 0.85,
                        directness: 0.9
                    });
                }
            }

            // 7. Evidence from Industrial Quality & Six Sigma Analytics
            const dataset = platform.dataset;
            if (dataset && Array.isArray(dataset.rows) && dataset.rows.length > 0) {
                const totalRows = dataset.rowCount || dataset.rows.length;
                const cols = (Array.isArray(dataset.columns) ? dataset.columns : Object.keys(dataset.rows[0] || {}))
                    .map(c => typeof c === 'string' ? c : (c?.name || ''));

                // Comprehensive Industrial Defect & Non-conformance Analyzer
                const numericDefectRegex = /^(defects?|defect_count|total_defects?|num_defects?|num_of_defects?|عدد_العيوب|عدد العيوب|قطع_معيبة|القطع_المعيبة|تالف|العيوب|المرفوض|الهالك|كمية_العيوب|كمية_الهالك|rejected_count|scrap_qty|defect_qty|rework_qty|nc_qty)$/i;
                const defectHeaderRegex = /كود.?العيب|اسم.?العيب|نوع.?العيب|وصف.?العيب|تصنيف.?العيب|سبب.?العيب|السبب.?الجذري|الإجراء.?التصحيحي|منطقة.?الاكتشاف|حالة.?التصرف|defect.?type|defect.?code|defect.?name|defect.?desc|defect.?category|defect.?reason|failure.?mode|root.?cause|corrective.?action|non.?conformance|scrap.?reason|discrepancy/i;
                const statusColRegex = /^(status|qc_status|quality_status|inspection_result|test_result|pass_fail|disposition|decision|result|target|outcome|label|class|حالة_?الفحص|حالة_?القطعة|حالة_?الجودة|النتيجة|القرار|المطابقة|حالة_?التصرف)$/i;
                const prodQtyRegex = /^(production_qty|total_units|total_production|inspected_qty|sample_size|batch_size|كمية_الانتاج|حجم_الانتاج|حجم_العينة|اجمالي_الفحص|عدد_العينات)$/i;

                const numericDefectCol = cols.find(c => numericDefectRegex.test(c.trim()));
                const defectTypeCol = cols.find(c => defectHeaderRegex.test(c.trim()));
                const statusCol = cols.find(c => statusColRegex.test(c.trim()));
                const prodQtyCol = cols.find(c => prodQtyRegex.test(c.trim()));

                const cleanRegex = /^(pass|ok|good|none|n\/?a|0|false|no|سليم|مطابق|مقبول|ناجح|بدون عيوب|خالي من العيوب|لا يوجد|لا)$/i;
                const defectStatusRegex = /fail|failed|failure|nok|ng|bad|defect|defective|scrap|reject|rejected|critical|warning|error|rework|hold|nc|non.?conforming|مرفوض|تالف|معيب|خردة|خلل|خطأ|عطل|غير مطابق|راسب|إعادة تشغيل|حجز|مشكلة/i;

                const isDatasetNameDefectLog = /defect|scrap|nc|incident|rejection|issues|non_conformance|عيوب|هوالك|مرفوضات|عدم_مطابقة/i.test(dataset.name || dataset.title || '');
                const hasDefectTypeHeaders = Boolean(defectTypeCol) || cols.some(c => defectHeaderRegex.test(c));

                let hasExplicitNumericDefects = false;
                if (numericDefectCol) {
                    let numCount = 0;
                    for (let i = 0; i < Math.min(50, dataset.rows.length); i++) {
                        const v = dataset.rows[i][numericDefectCol];
                        if (v !== undefined && v !== null && v !== '' && !isNaN(Number(v))) {
                            numCount++;
                        }
                    }
                    if (numCount > 0) hasExplicitNumericDefects = true;
                }

                const getRowDefects = (row) => {
                    if (!row) return 0;
                    if (hasExplicitNumericDefects && numericDefectCol) {
                        const n = Number(row[numericDefectCol]);
                        return Number.isFinite(n) ? Math.max(0, n) : 0;
                    }
                    if (statusCol) {
                        const val = row[statusCol];
                        if (typeof val === 'boolean') return !val ? 1 : 0;
                        if (typeof val === 'number') return val > 0 ? 1 : 0;
                        const s = String(val ?? '').trim().toLowerCase();
                        if (s === '1' || s === 'true' || s === 'yes') return 1;
                        if (s === '0' || s === 'false' || s === 'no' || cleanRegex.test(s)) return 0;
                        if (defectStatusRegex.test(s)) return 1;
                    }
                    if (defectTypeCol) {
                        const val = row[defectTypeCol];
                        if (val !== null && val !== undefined) {
                            const s = String(val).trim().toLowerCase();
                            if (s !== '' && !cleanRegex.test(s)) return 1;
                        }
                        return 0;
                    }
                    if (isDatasetNameDefectLog || hasDefectTypeHeaders) {
                        return 1;
                    }
                    for (const col of cols) {
                        const val = row[col];
                        if (val !== null && val !== undefined) {
                            const s = String(val).trim();
                            if (defectStatusRegex.test(s) && !cleanRegex.test(s)) {
                                return 1;
                            }
                        }
                    }
                    return 0;
                };

                // Check if table is pure Defect / Incident Log
                let sampleDefects = 0;
                const sampleN = Math.min(100, dataset.rows.length);
                for (let i = 0; i < sampleN; i++) {
                    if (getRowDefects(dataset.rows[i]) > 0) sampleDefects++;
                }
                const isDefectLog = isDatasetNameDefectLog || (hasDefectTypeHeaders && !statusCol) || (sampleDefects === sampleN && !statusCol && !prodQtyCol);

                let defectCount = 0;
                let totalProduction = 0;
                const overallDefectTypeCounts = {};

                dataset.rows.forEach(r => {
                    const rowDef = getRowDefects(r);
                    defectCount += rowDef;
                    if (prodQtyCol && Number.isFinite(Number(r[prodQtyCol]))) {
                        totalProduction += Number(r[prodQtyCol]);
                    }
                    if (defectTypeCol && r[defectTypeCol]) {
                        const t = String(r[defectTypeCol]).trim();
                        if (t && !cleanRegex.test(t)) {
                            overallDefectTypeCounts[t] = (overallDefectTypeCounts[t] || 0) + 1;
                        }
                    }
                });

                if (totalProduction === 0) {
                    totalProduction = totalRows;
                }

                // If no defects found and no defect indicator, fallback to platform baseline
                let defectRate = 0;
                let ppm = 0;
                if (defectCount > 0) {
                    defectRate = totalProduction > 0 ? (defectCount / totalProduction) * 100 : 0;
                    ppm = Math.round(defectRate * 10000);
                } else if (!hasDefectTypeHeaders && !numericDefectCol && !statusCol) {
                    ppm = decisionIntelligence?.baselinePpm || 12500;
                    defectRate = ppm / 10000;
                    defectCount = Math.round(totalRows * (defectRate / 100));
                }

                const sigmaLevel = Number(Math.max(1.0, Math.min(6.0, 1.5 + (ppm > 0 ? Math.sqrt(Math.max(0, -2 * Math.log(Math.max(1e-7, ppm / 1000000)))) : (isDefectLog ? 2.5 : 5.0))))).toFixed(2);
                const unitScrapCost = 50;
                const totalScrapCost = defectCount * unitScrapCost;
                const tenPctSaving = Math.round(totalScrapCost * 0.10);
                const twentyPctSaving = Math.round(totalScrapCost * 0.20);

                const topOverallDefectTypes = Object.entries(overallDefectTypeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([type, count]) => ({ type, count }));

                // Check for Temporal (Month) or Segment (Shift) Filters
                const temporalEntity = entities.find(e => e.type === 'temporal_filter');
                const segmentEntity = entities.find(e => e.type === 'segment_filter');

                if (temporalEntity && temporalEntity.filterType === 'month') {
                    const targetMonth = temporalEntity.month;
                    let monthTotalRows = 0;
                    let monthDefectCount = 0;
                    let monthProduction = 0;
                    const monthDefectTypeCounts = {};

                    dataset.rows.forEach(r => {
                        const rowM = extractRowMonth(r, cols);
                        if (rowM === targetMonth) {
                            monthTotalRows++;
                            const rDef = getRowDefects(r);
                            monthDefectCount += rDef;
                            if (prodQtyCol && Number.isFinite(Number(r[prodQtyCol]))) {
                                monthProduction += Number(r[prodQtyCol]);
                            }
                            if (defectTypeCol && r[defectTypeCol]) {
                                const t = String(r[defectTypeCol]).trim();
                                if (t && !cleanRegex.test(t)) {
                                    monthDefectTypeCounts[t] = (monthDefectTypeCounts[t] || 0) + 1;
                                }
                            }
                        }
                    });

                    if (monthProduction === 0) {
                        monthProduction = monthTotalRows;
                    }

                    const monthTopDefectTypes = Object.entries(monthDefectTypeCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([type, count]) => ({ type, count }));

                    const monthDefectRate = monthProduction > 0 ? (monthDefectCount / monthProduction) * 100 : 0;
                    const monthPpm = Math.round(monthDefectRate * 10000);
                    const monthSigma = Number(Math.max(1.0, Math.min(6.0, 1.5 + (monthPpm > 0 ? Math.sqrt(Math.max(0, -2 * Math.log(Math.max(1e-7, monthPpm / 1000000)))) : 5.0)))).toFixed(2);
                    const monthScrapCost = monthDefectCount * unitScrapCost;

                    rawEvidence.push({
                        id: 'qual_ppm_month_' + targetMonth,
                        type: 'quality_metric',
                        title: `Defects in ${temporalEntity.labelEn || ('Month ' + targetMonth)}`,
                        metric: 'Filtered Month Defect Rate & Count',
                        value: isDefectLog 
                            ? `${monthDefectCount.toLocaleString()} defect incidents in ${temporalEntity.labelEn || ('Month ' + targetMonth)} (${((monthDefectCount / Math.max(1, defectCount)) * 100).toFixed(1)}% of total defects)`
                            : `${monthDefectCount.toLocaleString()} defective out of ${monthTotalRows.toLocaleString()} units (${monthDefectRate.toFixed(2)}% | ${monthPpm.toLocaleString()} PPM)`,
                        strength: 98,
                        confidence: 98,
                        source: 'Temporal Defect Filter Engine',
                        relevance: 1.0,
                        directness: 1.0,
                        details: {
                            defectCount: monthDefectCount,
                            totalRows: monthTotalRows,
                            totalProduction: monthProduction,
                            defectRate: monthDefectRate,
                            ppm: monthPpm,
                            sigmaLevel: monthSigma,
                            isFiltered: true,
                            filterType: 'month',
                            filterValue: targetMonth,
                            filterLabelAr: temporalEntity.labelAr || `شهر ${targetMonth}`,
                            filterLabelEn: temporalEntity.labelEn || `Month ${targetMonth}`,
                            overallDefectCount: defectCount,
                            overallTotalRows: totalRows,
                            overallTotalProduction: totalProduction,
                            overallDefectRate: defectRate,
                            scrapCost: monthScrapCost,
                            isDefectLog: isDefectLog,
                            topDefectTypes: monthTopDefectTypes
                        }
                    });
                } else if (segmentEntity && segmentEntity.filterType === 'shift') {
                    const shiftKeywords = ['shift', 'وردية', 'machine', 'ماكينة', 'line', 'خط'];
                    const sCol = cols.find(c => shiftKeywords.some(k => c.toLowerCase().includes(k))) || cols[0];
                    const targetVal = String(segmentEntity.value).toLowerCase();
                    let segTotalRows = 0;
                    let segDefectCount = 0;
                    let segProduction = 0;

                    dataset.rows.forEach(r => {
                        const val = String(r[sCol] || '').toLowerCase();
                        if (val.includes(targetVal) || targetVal.includes(val)) {
                            segTotalRows++;
                            const rDef = getRowDefects(r);
                            segDefectCount += rDef;
                            if (prodQtyCol && Number.isFinite(Number(r[prodQtyCol]))) {
                                segProduction += Number(r[prodQtyCol]);
                            }
                        }
                    });

                    if (segProduction === 0) segProduction = segTotalRows;
                    const segDefectRate = segProduction > 0 ? (segDefectCount / segProduction) * 100 : 0;
                    const segPpm = Math.round(segDefectRate * 10000);
                    const segSigma = Number(Math.max(1.0, Math.min(6.0, 1.5 + (segPpm > 0 ? Math.sqrt(Math.max(0, -2 * Math.log(Math.max(1e-7, segPpm / 1000000)))) : 5.0)))).toFixed(2);

                    rawEvidence.push({
                        id: 'qual_ppm_segment_' + targetVal,
                        type: 'quality_metric',
                        title: `Defects in ${segmentEntity.labelEn || targetVal}`,
                        metric: 'Filtered Segment Defect Rate & Count',
                        value: isDefectLog
                            ? `${segDefectCount.toLocaleString()} defect incidents in ${segmentEntity.labelEn || targetVal}`
                            : `${segDefectCount.toLocaleString()} defective out of ${segTotalRows.toLocaleString()} units (${segDefectRate.toFixed(2)}%)`,
                        strength: 98,
                        confidence: 98,
                        source: 'Segment Defect Filter Engine',
                        relevance: 1.0,
                        directness: 1.0,
                        details: {
                            defectCount: segDefectCount,
                            totalRows: segTotalRows,
                            totalProduction: segProduction,
                            defectRate: segDefectRate,
                            ppm: segPpm,
                            sigmaLevel: segSigma,
                            isFiltered: true,
                            filterType: 'shift',
                            filterValue: targetVal,
                            filterLabelAr: segmentEntity.labelAr || `وردية ${targetVal}`,
                            filterLabelEn: segmentEntity.labelEn || `Shift ${targetVal}`,
                            overallDefectCount: defectCount,
                            overallTotalRows: totalRows,
                            overallTotalProduction: totalProduction,
                            overallDefectRate: defectRate,
                            isDefectLog: isDefectLog
                        }
                    });
                }

                rawEvidence.push({
                    id: 'qual_ppm',
                    type: 'quality_metric',
                    title: 'Defect Rate & PPM Capability',
                    metric: 'PPM / Defect %',
                    value: isDefectLog
                        ? `${defectCount.toLocaleString()} logged defect incidents across dataset`
                        : `${defectRate.toFixed(2)}% (${ppm.toLocaleString()} PPM, ${defectCount.toLocaleString()} defective / ${totalRows.toLocaleString()} total)`,
                    strength: 95,
                    confidence: 95,
                    source: 'Six Sigma Quality Engine',
                    relevance: (temporalEntity || segmentEntity) ? 0.4 : (intent === 'QUALITY_METRICS' ? 1.0 : 0.6),
                    directness: (temporalEntity || segmentEntity) ? 0.6 : 0.95,
                    details: { 
                        defectCount, 
                        totalRows, 
                        totalProduction, 
                        defectRate, 
                        ppm, 
                        sigmaLevel, 
                        isFiltered: false, 
                        isDefectLog,
                        topDefectTypes: topOverallDefectTypes
                    }
                });

                rawEvidence.push({
                    id: 'qual_sigma',
                    type: 'quality_metric',
                    title: 'Six Sigma Capability Level',
                    metric: 'Sigma Level',
                    value: `${sigmaLevel}σ (${ppm.toLocaleString()} DPMO)`,
                    strength: 92,
                    confidence: 90,
                    source: 'Statistical Quality Control',
                    relevance: (temporalEntity || segmentEntity) ? 0.3 : (intent === 'QUALITY_METRICS' || intent === 'PROCESS_CAPABILITY' ? 1.0 : 0.5),
                    directness: 0.9,
                    details: { sigmaLevel, ppm }
                });

                rawEvidence.push({
                    id: 'qual_scrap_cost',
                    type: 'financial_metric',
                    title: 'Scrap & Waste Cost of Quality',
                    metric: 'Total Scrap Loss',
                    value: `$${totalScrapCost.toLocaleString()} ($${unitScrapCost}/unit | 20% Reduction Savings: $${twentyPctSaving.toLocaleString()})`,
                    strength: 92,
                    confidence: 90,
                    source: 'Cost of Quality (COQ) Engine',
                    relevance: intent === 'SCRAP_COST' ? 1.0 : 0.6,
                    directness: 0.95,
                    details: { totalScrapCost, unitScrapCost, defectCount, tenPctSaving, twentyPctSaving }
                });

                // Continuous measurements Process Capability (Cpk)
                const numCols = cols.filter(c => {
                    const sampleVal = dataset.rows[0] ? dataset.rows[0][c] : null;
                    return typeof sampleVal === 'number' || (!isNaN(parseFloat(sampleVal)) && c !== numericDefectCol && c !== statusCol);
                });

                if (numCols.length > 0) {
                    const idKeywords = ['id', 'sample_id', 'row_id', 'index', 'seq', 'uuid', 'part_id'];
                    const matchedRequestedCol = colEntities.find(ce => numCols.some(nc => nc.toLowerCase() === ce.toLowerCase()));
                    const primeCol = matchedRequestedCol 
                        ? (numCols.find(nc => nc.toLowerCase() === matchedRequestedCol.toLowerCase()) || matchedRequestedCol)
                        : (numCols.find(c => !idKeywords.some(k => c.toLowerCase() === k || c.toLowerCase().endsWith('_id'))) || numCols[0]);

                    const vals = dataset.rows.map(r => parseFloat(r[primeCol])).filter(v => !isNaN(v));
                    if (vals.length > 1) {
                        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
                        const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length - 1);
                        const std = Math.sqrt(variance) || 1;
                        const usl = mean + 3.5 * std;
                        const lsl = mean - 3.5 * std;
                        const cp = Number(((usl - lsl) / (6 * std)).toFixed(2));
                        const cpk = Number(Math.min((usl - mean) / (3 * std), (mean - lsl) / (3 * std)).toFixed(2));

                        rawEvidence.push({
                            id: 'qual_cpk',
                            type: 'process_capability',
                            title: `Process Capability Cpk (${primeCol})`,
                            metric: 'Cpk / Cp',
                            value: `Cpk = ${cpk} (Cp = ${cp}, μ = ${mean.toFixed(2)}, σ = ${std.toFixed(2)})`,
                            strength: 92,
                            confidence: 90,
                            source: 'SPC Capability Analyzer',
                            column: primeCol,
                            relevance: intent === 'PROCESS_CAPABILITY' ? 1.0 : (colEntities.includes(primeCol.toLowerCase()) ? 0.8 : 0.4),
                            directness: 0.9,
                            details: { cpk, cp, mean, std, usl, lsl, column: primeCol }
                        });
                    }
                }

                // Categorical Group / Shift Comparison
                const shiftKeywords = ['shift', 'وردية', 'machine', 'ماكينة', 'line', 'خط', 'operator', 'factor'];
                const shiftCol = cols.find(c => {
                    const lc = c.toLowerCase();
                    return shiftKeywords.some(k => lc.includes(k));
                });

                if (shiftCol) {
                    const groups = {};
                    dataset.rows.forEach(r => {
                        const g = String(r[shiftCol] || 'Other');
                        if (!groups[g]) groups[g] = { total: 0, defects: 0 };
                        groups[g].total++;
                        const rowDef = getRowDefects(r);
                        groups[g].defects += rowDef;
                    });

                    const groupList = Object.keys(groups).map(g => {
                        const t = groups[g].total;
                        const d = groups[g].defects;
                        const r = t > 0 ? (d / t) * 100 : 0;
                        return { group: g, total: t, defects: d, rate: Number(r.toFixed(2)) };
                    }).sort((a, b) => b.rate - a.rate);

                    if (groupList.length > 1) {
                        const worst = groupList[0];
                        const best = groupList[groupList.length - 1];
                        rawEvidence.push({
                            id: 'qual_shift_comp',
                            type: 'shift_comparison',
                            title: `Shift Defect Breakdown (${shiftCol})`,
                            metric: 'Group Defect Variation',
                            value: `Highest: ${worst.group} (${worst.rate}%) | Lowest: ${best.group} (${best.rate}%) across ${groupList.length} groups`,
                            strength: 90,
                            confidence: 88,
                            source: 'Categorical Variance Engine',
                            column: shiftCol,
                            relevance: intent === 'SHIFT_COMPARISON' ? 1.0 : 0.5,
                            directness: 0.9,
                            details: { groups: groupList, shiftCol, worst, best }
                        });
                    }
                }

                // Arbitrary Column Math & Statistics Engine
                if (colEntities.length > 0 || intent === 'COLUMN_STATISTICS') {
                    const targetColName = colEntities[0] || (cols[0]);
                    const matchedActualCol = cols.find(c => c.toLowerCase() === (targetColName || '').toLowerCase()) || targetColName;
                    
                    if (matchedActualCol) {
                        const allVals = dataset.rows.map(r => r[matchedActualCol]);
                        const numVals = allVals.map(v => parseFloat(v)).filter(v => !isNaN(v));
                        const nullCount = allVals.filter(v => v === null || v === undefined || v === '').length;
                        
                        if (numVals.length > 0) {
                            numVals.sort((a, b) => a - b);
                            const min = numVals[0];
                            const max = numVals[numVals.length - 1];
                            const sum = numVals.reduce((a, b) => a + b, 0);
                            const mean = sum / numVals.length;
                            const median = numVals.length % 2 === 0 
                                ? (numVals[numVals.length / 2 - 1] + numVals[numVals.length / 2]) / 2 
                                : numVals[Math.floor(numVals.length / 2)];
                            const variance = numVals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / Math.max(1, numVals.length - 1);
                            const std = Math.sqrt(variance);

                            rawEvidence.push({
                                id: `col_stat_${matchedActualCol}`,
                                type: 'column_stat',
                                title: `Column Metrics: ${matchedActualCol}`,
                                metric: 'Calculated Summary',
                                value: `Mean: ${mean.toFixed(2)}, Min: ${min.toFixed(2)}, Max: ${max.toFixed(2)}, Std: ${std.toFixed(2)}, Median: ${median.toFixed(2)}`,
                                strength: 95,
                                confidence: 95,
                                source: 'Dynamic Column Engine',
                                column: matchedActualCol,
                                relevance: intent === 'COLUMN_STATISTICS' ? 1.0 : 0.8,
                                directness: 0.95,
                                details: { column: matchedActualCol, min, max, mean, median, std, sum, nullCount, validCount: numVals.length }
                            });
                        }
                    }
                }
            }

            // Rank Evidence:
            // Score = 0.4 * Relevance + 0.3 * Strength + 0.2 * Confidence + 0.1 * Directness
            rawEvidence.forEach(item => {
                const normStrength = (item.strength || 80) / 100;
                const normConfidence = (item.confidence || 80) / 100;
                const rel = item.relevance !== undefined ? item.relevance : 0.5;
                const dir = item.directness !== undefined ? item.directness : 0.7;

                item.rankScore = Number((0.45 * rel + 0.25 * normStrength + 0.2 * normConfidence + 0.1 * dir).toFixed(3));
            });

            // Sort descending by rank score
            rawEvidence.sort((a, b) => b.rankScore - a.rankScore);

            return rawEvidence.slice(0, 8);
        }
    };

    function extractRowMonth(row, cols) {
        if (!row) return null;
        
        // 1. Check explicit month columns
        const monthCols = cols.filter(c => /^(?:month|month_num|month_no|month_id|شهر|الشهر)$/i.test(c.trim()));
        for (const mc of monthCols) {
            const val = row[mc];
            if (val !== undefined && val !== null && val !== '') {
                const num = parseInt(val, 10);
                if (!isNaN(num) && num >= 1 && num <= 12) return num;
                const str = String(val).toLowerCase().trim();
                const monthMap = {
                    'jan': 1, 'january': 1, 'يناير': 1, '1': 1, '01': 1,
                    'feb': 2, 'february': 2, 'فبراير': 2, '2': 2, '02': 2,
                    'mar': 3, 'march': 3, 'مارس': 3, '3': 3, '03': 3,
                    'apr': 4, 'april': 4, 'أبريل': 4, 'ابريل': 4, '4': 4, '04': 4,
                    'may': 5, 'مايو': 5, '5': 5, '05': 5,
                    'jun': 6, 'june': 6, 'يونيو': 6, '6': 6, '06': 6,
                    'jul': 7, 'july': 7, 'يوليو': 7, '7': 7, '07': 7,
                    'aug': 8, 'august': 8, 'أغسطس': 8, 'اغسطس': 8, '8': 8, '08': 8,
                    'sep': 9, 'sept': 9, 'september': 9, 'سبتمبر': 9, '9': 9, '09': 9,
                    'oct': 10, 'october': 10, 'أكتوبر': 10, 'اكتوبر': 10, '10': 10,
                    'nov': 11, 'november': 11, 'نوفمبر': 11, '11': 11,
                    'dec': 12, 'december': 12, 'ديسمبر': 12, '12': 12
                };
                if (monthMap[str]) return monthMap[str];
            }
        }

        // 2. Check date / timestamp columns
        const dateCols = cols.filter(c => /date|time|timestamp|created_at|production_date|تاريخ|وقت|يوم/i.test(c.trim()));
        for (const dc of dateCols) {
            const val = row[dc];
            if (val !== undefined && val !== null && val !== '') {
                const str = String(val).trim();
                
                // Format YYYY-MM-DD or YYYY/MM/DD
                const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
                if (isoMatch) {
                    const m = parseInt(isoMatch[2], 10);
                    if (m >= 1 && m <= 12) return m;
                }

                // Format DD-MM-YYYY or DD/MM/YYYY or MM-DD-YYYY or MM/DD/YYYY
                const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
                if (dmyMatch) {
                    const p1 = parseInt(dmyMatch[1], 10);
                    const p2 = parseInt(dmyMatch[2], 10);
                    if (p1 > 12 && p2 >= 1 && p2 <= 12) return p2;
                    if (p2 > 12 && p1 >= 1 && p1 <= 12) return p1;
                    const d = new Date(str);
                    if (!isNaN(d.getTime())) return d.getMonth() + 1;
                    if (p2 >= 1 && p2 <= 12) return p2;
                }

                // Check standard JS Date
                const d = new Date(str);
                if (!isNaN(d.getTime())) {
                    return d.getMonth() + 1;
                }

                // Check string contains month names
                const strLower = str.toLowerCase();
                if (strLower.includes('jan') || strLower.includes('يناير')) return 1;
                if (strLower.includes('feb') || strLower.includes('فبراير')) return 2;
                if (strLower.includes('mar') || strLower.includes('مارس')) return 3;
                if (strLower.includes('apr') || strLower.includes('ابريل') || strLower.includes('أبريل')) return 4;
                if (strLower.includes('may') || strLower.includes('مايو')) return 5;
                if (strLower.includes('jun') || strLower.includes('يونيو')) return 6;
                if (strLower.includes('jul') || strLower.includes('يوليو')) return 7;
                if (strLower.includes('aug') || strLower.includes('اغسطس') || strLower.includes('أغسطس')) return 8;
                if (strLower.includes('sep') || strLower.includes('سبتمبر')) return 9;
                if (strLower.includes('oct') || strLower.includes('اكتوبر') || strLower.includes('أكتوبر')) return 10;
                if (strLower.includes('nov') || strLower.includes('نوفمبر')) return 11;
                if (strLower.includes('dec') || strLower.includes('ديسمبر')) return 12;
            }
        }

        // 3. Fallback: check all other columns for dates, Excel timestamps, or ISO patterns
        for (const col of cols) {
            const val = row[col];
            if (val !== undefined && val !== null && val !== '') {
                if (typeof val === 'number' && val > 35000 && val < 60000) {
                    const excelDate = new Date((val - (25567 + 2)) * 86400 * 1000);
                    if (!isNaN(excelDate.getTime())) {
                        return excelDate.getMonth() + 1;
                    }
                }
                if (typeof val === 'string') {
                    const s = val.trim();
                    const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
                    if (isoMatch) {
                        const m = parseInt(isoMatch[2], 10);
                        if (m >= 1 && m <= 12) return m;
                    }
                    const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
                    if (dmyMatch) {
                        const p1 = parseInt(dmyMatch[1], 10);
                        const p2 = parseInt(dmyMatch[2], 10);
                        if (p1 > 12 && p2 >= 1 && p2 <= 12) return p2;
                        if (p2 > 12 && p1 >= 1 && p1 <= 12) return p1;
                        if (p2 >= 1 && p2 <= 12) return p2;
                    }
                }
            }
        }

        return null;
    }

    function computeTextRelevance(text, terms) {
        if (!terms || terms.length === 0) return 0.5;
        const lower = String(text || '').toLowerCase();
        let hits = 0;
        terms.forEach(t => {
            if (lower.includes(t)) hits++;
        });
        return Math.min(1.0, hits / terms.length);
    }

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.EvidenceRetriever = EvidenceRetriever;

})(typeof window !== 'undefined' ? window : global);
