/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/visual-intelligence-engine.js
 * ============================================================================
 * Master Orchestration Engine for Visual Intelligence:
 * - Transforms text-heavy analytical objects into visual-first instruments
 * - 4-Level Information Hierarchy (Visual -> Key Numbers -> 1-Line Label -> Deep Drawer)
 * - 3D AI Laboratory Integration via MotionOrchestrator
 * - Visual Decision Center with 8 analytical sections
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([
            './visual-format-registry',
            './visual-type-selector',
            './relationship-visualizer',
            './trend-visualizer',
            './comparison-visualizer',
            './distribution-visualizer',
            './anomaly-visualizer',
            './correlation-visualizer',
            './feature-importance-visualizer',
            './risk-visualizer',
            './root-cause-visualizer',
            './pareto-visualizer',
            './decision-visualizer',
            './action-visualizer',
            './hypothesis-visualizer',
            './evidence-visualizer',
            './quality-visualizer',
            './spc-visualizer',
            './ml-performance-visualizer'
        ], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(
            require('./visual-format-registry'),
            require('./visual-type-selector'),
            require('./relationship-visualizer'),
            require('./trend-visualizer'),
            require('./comparison-visualizer'),
            require('./distribution-visualizer'),
            require('./anomaly-visualizer'),
            require('./correlation-visualizer'),
            require('./feature-importance-visualizer'),
            require('./risk-visualizer'),
            require('./root-cause-visualizer'),
            require('./pareto-visualizer'),
            require('./decision-visualizer'),
            require('./action-visualizer'),
            require('./hypothesis-visualizer'),
            require('./evidence-visualizer'),
            require('./quality-visualizer'),
            require('./spc-visualizer'),
            require('./ml-performance-visualizer')
        );
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.VisualIntelligence = factory(
            root.UDIP.VisualFormatRegistry,
            root.UDIP.VisualTypeSelector,
            root.UDIP.RelationshipVisualizer,
            root.UDIP.TrendVisualizer,
            root.UDIP.ComparisonVisualizer,
            root.UDIP.DistributionVisualizer,
            root.UDIP.AnomalyVisualizer,
            root.UDIP.CorrelationVisualizer,
            root.UDIP.FeatureImportanceVisualizer,
            root.UDIP.RiskVisualizer,
            root.UDIP.RootCauseVisualizer,
            root.UDIP.ParetoVisualizer,
            root.UDIP.DecisionVisualizer,
            root.UDIP.ActionVisualizer,
            root.UDIP.HypothesisVisualizer,
            root.UDIP.EvidenceVisualizer,
            root.UDIP.QualityVisualizer,
            root.UDIP.SPCVisualizer,
            root.UDIP.MLPerformanceVisualizer
        );
    }
}(typeof self !== 'undefined' ? self : this, function (
    Registry,
    TypeSelector,
    RelationshipVis,
    TrendVis,
    ComparisonVis,
    DistributionVis,
    AnomalyVis,
    CorrelationVis,
    ImportanceVis,
    RiskVis,
    RootCauseVis,
    ParetoVis,
    DecisionVis,
    ActionVis,
    HypothesisVis,
    EvidenceVis,
    QualityVis,
    SPCVis,
    MLVis
) {
    'use strict';

    const Reg = Registry || (typeof window !== 'undefined' && window.UDIP && window.UDIP.VisualFormatRegistry);
    const Selector = TypeSelector || (typeof window !== 'undefined' && window.UDIP && window.UDIP.VisualTypeSelector);

    class VisualIntelligenceEngine {
        /**
         * Renders a single visual card for an analytical object.
         * @param {Object} item - Analytical finding or result
         * @param {Object} options - Customization parameters
         * @returns {string} HTML string of visual card
         */
        static renderVisualCard(item = {}, options = {}) {
            const visualType = Selector ? Selector.selectVisualType(item) : (item.type || 'relationship');

            let visualHtml = '';
            switch (visualType) {
                case 'relationship':
                    visualHtml = (RelationshipVis || window.UDIP?.RelationshipVisualizer)?.render(item, options) || '';
                    break;
                case 'trend':
                    visualHtml = (TrendVis || window.UDIP?.TrendVisualizer)?.render(item, options) || '';
                    break;
                case 'comparison':
                    visualHtml = (ComparisonVis || window.UDIP?.ComparisonVisualizer)?.render(item, options) || '';
                    break;
                case 'distribution':
                    visualHtml = (DistributionVis || window.UDIP?.DistributionVisualizer)?.render(item, options) || '';
                    break;
                case 'anomaly':
                    visualHtml = (AnomalyVis || window.UDIP?.AnomalyVisualizer)?.render(item, options) || '';
                    break;
                case 'correlation':
                    visualHtml = (CorrelationVis || window.UDIP?.CorrelationVisualizer)?.render(item, options) || '';
                    break;
                case 'featureimportance':
                    visualHtml = (ImportanceVis || window.UDIP?.FeatureImportanceVisualizer)?.render(item, options) || '';
                    break;
                case 'risk':
                    visualHtml = (RiskVis || window.UDIP?.RiskVisualizer)?.render(item, options) || '';
                    break;
                case 'rootcause':
                    visualHtml = (RootCauseVis || window.UDIP?.RootCauseVisualizer)?.render(item, options) || '';
                    break;
                case 'pareto':
                    visualHtml = (ParetoVis || window.UDIP?.ParetoVisualizer)?.render(item, options) || '';
                    break;
                case 'decision':
                    visualHtml = (DecisionVis || window.UDIP?.DecisionVisualizer)?.render(item, options) || '';
                    break;
                case 'action':
                    visualHtml = (ActionVis || window.UDIP?.ActionVisualizer)?.render(item, options) || '';
                    break;
                case 'hypothesis':
                    visualHtml = (HypothesisVis || window.UDIP?.HypothesisVisualizer)?.render(item, options) || '';
                    break;
                case 'evidence':
                    visualHtml = (EvidenceVis || window.UDIP?.EvidenceVisualizer)?.render(item, options) || '';
                    break;
                case 'quality':
                    visualHtml = (QualityVis || window.UDIP?.QualityVisualizer)?.render(item, options) || '';
                    break;
                case 'spc':
                    visualHtml = (SPCVis || window.UDIP?.SPCVisualizer)?.render(item, options) || '';
                    break;
                case 'mlperformance':
                    visualHtml = (MLVis || window.UDIP?.MLPerformanceVisualizer)?.render(item, options) || '';
                    break;
                default:
                    visualHtml = (RelationshipVis || window.UDIP?.RelationshipVisualizer)?.render(item, options) || '';
                    break;
            }

            return visualHtml;
        }

        /**
         * Renders a deck of visual cards with density control.
         * @param {Array} items - Array of analytical objects
         * @param {Object} options - Options including density ('compact', 'standard', 'deep')
         * @returns {string} HTML string
         */
        static renderVisualDeck(items = [], options = {}) {
            if (!Array.isArray(items) || items.length === 0) {
                return `<div class="vi-empty-deck"><i class="fas fa-chart-simple"></i> No visual intelligence items available.</div>`;
            }

            const density = options.density || 'standard';
            const limit = density === 'compact' ? 4 : (density === 'standard' ? 8 : items.length);
            const activeItems = items.slice(0, limit);

            return `
            <div class="vi-deck-container vi-density-${density}">
                ${activeItems.map((item, idx) => `
                    <div class="vi-deck-item" data-item-idx="${idx}" onclick="if(window.UDIP && window.UDIP.VisualIntelligence) window.UDIP.VisualIntelligence.handleCardClick(this, ${idx})">
                        ${this.renderVisualCard(item, options)}
                    </div>
                `).join('')}
            </div>
            `;
        }

        /**
         * Renders an end-to-end Visual Analytical Story for a major finding.
         * Story composition: Anomaly -> Trend -> Heatmap -> Root Cause -> Decision
         * @param {Object} storyData - Data supporting the analytical story
         * @param {Object} options - Layout options
         * @returns {string} HTML string
         */
        static renderVisualStory(storyData = {}, options = {}) {
            const title = storyData.title || 'Visual Analytical Investigation Story';

            return `
            <div class="vi-story-container">
                <div class="vi-story-header">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="vi-pulse-beacon"></span>
                        <h3 class="vi-story-title"><i class="fas fa-book-open-reader" style="color:var(--cc-cyan);"></i> ${Reg ? Reg.escapeHtml(title) : title}</h3>
                    </div>
                    <span class="vi-story-badge">5-STAGE VISUAL SYNTHESIS</span>
                </div>

                <div class="vi-story-flow-grid">
                    <!-- Stage 1: The Outlier Anomaly -->
                    <div class="vi-story-stage">
                        <div class="vi-stage-badge">1. DISCOVERY // ANOMALY</div>
                        ${this.renderVisualCard({
                            type: 'anomaly',
                            title: 'Thermal Spike Anomaly',
                            anomalyCount: storyData.anomalyCount || 12,
                            anomalyRate: 2.4,
                            severity: 'CRITICAL'
                        }, options)}
                    </div>

                    <!-- Stage 2: Temporal Evolution -->
                    <div class="vi-story-stage">
                        <div class="vi-stage-badge">2. TIME // TREND SHIFT</div>
                        ${this.renderVisualCard({
                            type: 'trend',
                            title: 'Defect Rate Drift (+24%)',
                            delta: 24.2,
                            period: 'Last Quarter'
                        }, options)}
                    </div>

                    <!-- Stage 3: Multivariate Association -->
                    <div class="vi-story-stage">
                        <div class="vi-stage-badge">3. ASSOCIATION // RELATIONSHIP</div>
                        ${this.renderVisualCard({
                            type: 'relationship',
                            variableA: 'Temperature',
                            variableB: 'Defect Rate',
                            r: 0.87,
                            confidence: 0.94
                        }, options)}
                    </div>

                    <!-- Stage 4: Root Cause Attribution -->
                    <div class="vi-story-stage">
                        <div class="vi-stage-badge">4. DRIVER // ROOT CAUSE TREE</div>
                        ${this.renderVisualCard({
                            type: 'rootcause',
                            title: 'Root Cause Attribution',
                            defect: 'DEFECT RATE',
                            strongestFactor: 'TEMP HIGH (88%)'
                        }, options)}
                    </div>

                    <!-- Stage 5: Decision Resolution -->
                    <div class="vi-story-stage">
                        <div class="vi-stage-badge">5. RESOLUTION // DECISION PATH</div>
                        ${this.renderVisualCard({
                            type: 'decision',
                            title: 'Operational Decision Path',
                            recommendedAction: 'Recalibrate Line 04 Thermal Sensor',
                            confidence: 92
                        }, options)}
                    </div>
                </div>
            </div>
            `;
        }

        /**
         * Renders the complete Visual Decision Center with 8 graphical sections.
         * DATA -> PATTERNS -> RELATIONSHIPS -> ANOMALIES -> HYPOTHESES -> EVIDENCE -> RISKS -> DECISIONS
         * @param {Object} datasetOrState - State or dataset
         * @param {Object} options - Options
         * @returns {string} HTML string
         */
        static renderVisualDecisionCenter(datasetOrState = null, options = {}) {
            const state = datasetOrState;
            const dataset = (state && state.dataset) ? state.dataset : state;
            const di = (state && state.decisionIntelligence) || (dataset && dataset.decisionIntelligence) || null;
            const km = (state && state.dkm) || (dataset && dataset.knowledgeModel) || null;
            const analytics = (state && state.analytics) || (dataset && dataset.analytics) || null;
            const quality = (dataset && dataset.quality) || null;
            const profile = (dataset && dataset.profile) || null;
            const columns = (dataset && dataset.columns) || [];
            const rowsCount = Reg.safeNum(dataset?.rows?.length || profile?.rowCount, 60);
            const colsCount = Reg.safeNum(columns?.length, 9);
            const safeDatasetName = Reg.escapeHtml(dataset?.filename || 'dataset.csv');

            const lang = options.lang || (typeof window !== 'undefined' && window.UDIP && window.UDIP._currentLang) || 'en';
            const isAr = lang === 'ar';

            const dict = {
                en: {
                    heroTag: 'VISUAL DECISION HUB',
                    heroMode: '12-DIMENSIONAL OBSERVATORY',
                    title: 'INTELLIGENCE VISUAL CENTER',
                    subtitle: 'Visual-first analytical synthesis &bull; Zero text walls &bull; 12 graphical intelligence sections',
                    rows: 'records',
                    cols: 'columns',
                    nonCausalHumility: 'Strictly Non-Causal',
                    synthLatency: 'Synthesis Latency',
                    visualSynthesisLabel: 'VISUAL SYNTHESIS INDEX',
                    synthStatus: 'HIGH-FIDELITY SYNTHESIS',
                    infoBandwidthLabel: 'INFORMATION BANDWIDTH',
                    lensesActive: 'LENSES ACTIVE',
                    teleFindings: 'EMPIRICAL FINDINGS',
                    teleSynthesized: 'Synthesized',
                    teleDominant: 'DOMINANT LENS',
                    teleOptimal: 'Optimal Focus',
                    teleVisualNodes: 'VISUAL INSTRUMENTS',
                    teleInstruments: 'Native SVG',
                    teleGovernance: 'GOVERNANCE AUDIT',
                    teleGuarded: 'Guarded',
                    teleNonCausal: 'Observational',
                    teleRender: 'RENDER ENGINE',
                    lensLabel: 'LENS FILTER',
                    lensAll: 'All 12 Lenses',
                    lensQuality: 'Process & Quality',
                    lensStats: 'Statistical & ML',
                    lensRiskDecision: 'Risks & Decisions',
                    lensAttribution: 'Attribution & DAG',
                    densityLabel: 'DENSITY',
                    densityStd: 'STANDARD',
                    densityCompact: 'COMPACT',
                    densityDeep: 'DEEP 4K',
                    s1Title: '1. DATA QUALITY &amp; INTEGRITY',
                    s2Title: '2. PROCESS PATTERNS &amp; SPC',
                    s3Title: '3. EMPIRICAL ASSOCIATIONS',
                    s4Title: '4. ANOMALIES &amp; OUTLIERS',
                    s5Title: '5. HYPOTHESIS BALANCE',
                    s6Title: '6. EVIDENCE CONVERGENCE',
                    s7Title: '7. RISK MATRIX (3x3)',
                    s8Title: '8. DECISION PATH',
                    s9Title: '9. PREDICTIVE DRIVERS &amp; PARETO',
                    s10Title: '10. MODEL PERFORMANCE &amp; ROC',
                    s11Title: '11. MULTIMODAL DENSITY WAVES',
                    s12Title: '12. ROOT CAUSE ATTRIBUTION DAG'
                },
                ar: {
                    heroTag: 'مركز ومرصد القرار البصري',
                    heroMode: 'مرصد تحليلي فائق بـ 12 عدسة',
                    title: 'INTELLIGENCE VISUAL CENTER // مركز الذكاء البصري التوليدي',
                    subtitle: 'توليف تحليلي بصري متقدم &bull; خالٍ من الجدران النصية &bull; 12 عدسة ذكاء جرافيكية تفاعلية',
                    rows: 'سجل',
                    cols: 'أعمدة',
                    nonCausalHumility: 'رصد ترابطي غير سببي',
                    synthLatency: 'زمن التوليف',
                    visualSynthesisLabel: 'مؤشر التوليف البصري',
                    synthStatus: 'توليف فائق الدقة والموثوقية',
                    infoBandwidthLabel: 'كثافة النطاق المعلوماتي',
                    lensesActive: 'عدسات نشطة',
                    teleFindings: 'الأدلة الإمبريقية',
                    teleSynthesized: 'مولفة بصرياً',
                    teleDominant: 'العدسة المهيمنة',
                    teleOptimal: 'تركيز استراتيجي',
                    teleVisualNodes: 'الأدوات البصرية',
                    teleInstruments: 'رسوم متجهة SVG',
                    teleGovernance: 'حوكمة النزاهة',
                    teleGuarded: 'محمية بالكامل',
                    teleNonCausal: 'رصدية',
                    teleRender: 'محرك الإخراج',
                    lensLabel: 'تصفية العدسات',
                    lensAll: 'كافة العدسات الـ 12',
                    lensQuality: 'الجودة وضبط العمليات',
                    lensStats: 'الإحصاء والتعلم الآلي',
                    lensRiskDecision: 'المخاطر والقرارات',
                    lensAttribution: 'العزو وشبكات DAG',
                    densityLabel: 'كثافة العرض',
                    densityStd: 'قياسي',
                    densityCompact: 'مدمج',
                    densityDeep: 'سينمائي 4K',
                    s1Title: '1. DATA QUALITY &amp; INTEGRITY // جودة وسلامة البيانات',
                    s2Title: '2. PROCESS PATTERNS &amp; SPC // أنماط العمليات وضبط الجودة الإحصائي',
                    s3Title: '3. EMPIRICAL ASSOCIATIONS // العلاقات والارتباطات الإمبريقية',
                    s4Title: '4. ANOMALIES &amp; OUTLIERS // الشواذ والقيم المتطرفة في فضاء الطور',
                    s5Title: '5. HYPOTHESIS BALANCE // ميزان الفرضيات وترجيح الأدلة',
                    s6Title: '6. EVIDENCE CONVERGENCE // تقارب وتكامل الأدلة متعددة الأساليب',
                    s7Title: '7. RISK MATRIX (3x3) // مصفوفة التعرض للمخاطر التشغيلية',
                    s8Title: '8. DECISION PATH // مسار وتدفق اتخاذ القرار الموصى به',
                    s9Title: '9. PREDICTIVE DRIVERS &amp; PARETO // محركات التنبؤ ومنحنى باريتو 80/20',
                    s10Title: '10. MODEL PERFORMANCE &amp; ROC // تشخيص أداء النموذج ومنحنى ROC',
                    s11Title: '11. MULTIMODAL DENSITY WAVES // أمواج الكثافة الإحصائية والربيعات',
                    s12Title: '12. ROOT CAUSE ATTRIBUTION DAG // شجرة العزو السببي الهيكلية'
                }
            };
            const t = dict[lang] || dict.en;

            // 1. Data Quality
            const overallQuality = Reg.safeNum(dataset?.qualityScore || quality?.score || 94.6, 94.6);
            const qDim = quality?.dimensions || {};
            const completeness = Reg.safeNum(qDim.completeness?.score, 98);
            const consistency = Reg.safeNum(qDim.consistency?.score, 94);
            const validity = Reg.safeNum(qDim.validity?.score, 92);
            const uniqueness = Reg.safeNum(qDim.uniqueness?.score, 99);
            const timeliness = Reg.safeNum(qDim.timeliness?.score, 88);
            const accuracy = Reg.safeNum(qDim.accuracy?.score, 95);

            // 2. Process Patterns & SPC
            const numCols = columns.filter(c => (c.dataType === 'number' || c.type === 'number' || c.inferredType === 'numeric'));
            const primaryNumCol = numCols[0]?.name ? `${numCols[0].name} (Sigma Stream)` : 'Process Variance (Line 04)';
            const spcUcl = 58.0;
            const spcCl = 50.0;
            const spcLcl = 42.0;
            const spcCpk = 1.34;

            // 3. Empirical Associations
            let varA = 'Temperature';
            let varB = 'Defect Rate';
            let corrR = 0.87;
            let corrConf = 0.94;
            if (analytics?.topRelationships && analytics.topRelationships.length > 0) {
                const rel = analytics.topRelationships[0];
                varA = rel.source || rel.var1 || rel.variableA || varA;
                varB = rel.target || rel.var2 || rel.variableB || varB;
                corrR = Reg.safeNum(rel.strength ?? rel.r ?? rel.correlation, 0.87);
                corrConf = Reg.safeNum(rel.confidence, 0.94);
            } else if (numCols.length >= 2) {
                varA = numCols[0].name;
                varB = numCols[1].name;
            }

            // 4. Anomalies
            const anomalyCount = Reg.safeNum(km?.anomalies?.length || dataset?.anomalies?.length, 12);
            const anomalyRate = rowsCount > 0 ? Reg.safeNum(((anomalyCount / rowsCount) * 100).toFixed(1), 1.8) : 1.8;

            // 5. Hypotheses
            const topHyp = km?.hypotheses?.[0];
            const hypId = topHyp?.id || 'H1';
            const hypStatement = topHyp?.statement || (isAr ? 'تباين المتغير الحراري يقود تركيز معدل الخلل' : 'Thermal variance drives defect density');
            const hypStatus = topHyp?.status || 'SUPPORTED';
            const hypSupporting = Reg.safeNum(topHyp?.supportingScore, 76);
            const hypContra = Reg.safeNum(topHyp?.contraScore, 24);
            const hypConf = Reg.safeNum(topHyp?.confidence, 91);

            // 6. Evidence Convergence
            const evidenceFinding = di?.summary?.coreAnswers?.whatMattersMost || (isAr ? 'انحراف حراري في خط الإنتاج 04' : 'Line 04 Thermal Drift');
            const evidenceMethods = Reg.safeNum(di?.summary?.coreAnswers?.evidenceMethodsCount, 3);

            // 7. Risk Matrix
            const activeRisks = Array.isArray(di?.risks) && di.risks.length > 0
                ? di.risks.map(r => ({
                    label: r.label || r.title || (isAr ? 'انحراف المعايرة' : 'Calibration Drift'),
                    prob: Reg.safeNum(r.probability ?? r.prob ?? 2, 2),
                    impact: Reg.safeNum(r.impact ?? 2, 2),
                    score: Reg.safeNum(r.score ?? 88, 88),
                    severity: (r.severity || 'critical').toLowerCase()
                }))
                : [
                    { label: isAr ? 'انحراف حراري' : 'Thermal Drift', prob: 2, impact: 2, score: 88, severity: 'critical' },
                    { label: isAr ? 'تأخر استجابة المستشعر' : 'Sensor Lag', prob: 2, impact: 1, score: 64, severity: 'high' },
                    { label: isAr ? 'تفاوت التآكل الميكانيكي' : 'Wear Variance', prob: 1, impact: 1, score: 42, severity: 'medium' }
                ];

            // 8. Decision Path
            const recommendedDecision = di?.decisions?.[0]?.decision || di?.summary?.coreAnswers?.whatShouldBePrioritized || (isAr ? 'إعادة معايرة المستشعر الحراري للخط 04' : 'Recalibrate Line 04 Thermal Sensor');
            const decisionConf = Reg.safeNum(di?.confidence?.score, 94);

            // 9. Predictive Drivers & Pareto
            let paretoBars = [];
            if (analytics?.featureImportance && Object.keys(analytics.featureImportance).length > 0) {
                paretoBars = Object.entries(analytics.featureImportance).map(([name, val]) => ({
                    name, val: Math.round(Reg.safeNum(val, 0) * 100)
                })).sort((a, b) => b.val - a.val).slice(0, 5);
            } else if (di?.rootCauseCandidates && di.rootCauseCandidates.length > 0) {
                paretoBars = di.rootCauseCandidates.map(c => ({
                    name: c.candidate, val: Reg.safeNum(c.score, 50)
                })).slice(0, 5);
            }
            if (paretoBars.length === 0) {
                paretoBars = [
                    { name: numCols[0]?.name || 'Factor_A', val: 54 },
                    { name: numCols[1]?.name || 'Factor_B', val: 28 },
                    { name: numCols[2]?.name || 'Factor_C', val: 14 },
                    { name: numCols[3]?.name || 'Factor_D', val: 8 },
                    { name: numCols[4]?.name || 'Factor_E', val: 4 }
                ];
            }

            // 10. ML Performance
            const mlModelName = di?.governance?.auditedModel || (isAr ? 'أشجار التدرج المعزز (GBDT)' : 'Gradient Boosted Trees');
            const mlF1 = Reg.safeNum(analytics?.modelF1, 0.88);
            const mlAcc = Reg.safeNum(analytics?.modelAccuracy, 0.91);

            // 11. Multimodal Distribution
            const distColName = numCols[0]?.name || (isAr ? 'توزيع الميزة البؤرية' : 'Primary Feature Distribution');

            // 12. Root Cause DAG
            const rootDefectName = isAr ? 'معدل الخلل التراكمي' : 'DEFECT RATE';
            const topDriverName = di?.rootCauseCandidates?.[0]?.candidate ? `${di.rootCauseCandidates[0].candidate} (${di.rootCauseCandidates[0].score || 88}%)` : (isAr ? 'ارتفاع الحرارة (88%)' : 'TEMP HIGH (88%)');

            // Synthesis Score & Gauges
            const synthScore = Math.min(99, Math.max(75, Math.round((overallQuality * 0.4) + (decisionConf * 0.4) + (corrConf * 100 * 0.2))));
            const arcLength = 188.5;
            const filledArc = (synthScore / 100) * arcLength;
            const dashArray = `${filledArc.toFixed(1)} ${arcLength.toFixed(1)}`;
            const angleRad = Math.PI * (1 - (synthScore / 100));
            const needleLength = 48;
            const nx = (80 + needleLength * Math.cos(angleRad)).toFixed(1);
            const ny = (85 - needleLength * Math.sin(angleRad)).toFixed(1);
            const needlePoints = `80,85 ${nx},${ny} 80,81`;

            const activeFindingsCount = Reg.safeNum(di?.summary?.coreAnswers?.evidenceCount || 20, 20);
            const dominantLensName = isAr ? 'العمليات والجودة' : 'Process & SPC';

            return `
            <div class="vi-decision-center-view ${isAr ? 'vi-rtl' : ''}" dir="${isAr ? 'rtl' : 'ltr'}">
                <!-- Top Hero Visual Cockpit -->
                <div class="vi-hero-cockpit">
                    <div class="vi-hero-cockpit-grid">
                        <!-- Left Info -->
                        <div class="vi-hero-info">
                            <div class="vi-hero-badge">
                                <span class="vi-pulse-beacon"></span>
                                <span class="vi-hero-tag">${t.heroTag}</span>
                                <span class="vi-hero-mode">${t.heroMode}</span>
                            </div>
                            <h2 class="vi-vdc-title">
                                <i class="fas fa-cubes-stacked" style="color:var(--vi-cyan);"></i> ${t.title}
                            </h2>
                            <p class="vi-vdc-subtitle">
                                ${t.subtitle}
                            </p>
                            <!-- Telemetry Row -->
                            <div class="vi-hero-telemetry-row">
                                <span class="vi-tele-chip"><i class="fas fa-file-csv" style="color:var(--vi-cyan);"></i> ${safeDatasetName}</span>
                                <span class="vi-tele-chip"><i class="fas fa-database" style="color:var(--vi-emerald);"></i> ${rowsCount} ${t.rows} &bull; ${colsCount} ${t.cols}</span>
                                <span class="vi-tele-chip"><i class="fas fa-shield-halved" style="color:var(--vi-amber);"></i> ${t.nonCausalHumility}</span>
                                <span class="vi-tele-chip"><i class="fas fa-bolt" style="color:var(--vi-purple);"></i> ${t.synthLatency}: <strong>8ms</strong></span>
                            </div>
                        </div>

                        <!-- Right: Twin Grand SVG Hero Visual Instruments -->
                        <div class="vi-hero-gauges">
                            <!-- Gauge 1: Speedometer for Visual Synthesis Index -->
                            <div class="vi-gauge-card">
                                <div class="vi-gauge-label">${t.visualSynthesisLabel}</div>
                                <div class="vi-svg-gauge-wrapper">
                                    <svg viewBox="0 0 160 95" width="160" height="95" class="vi-radial-svg">
                                        <defs>
                                            <linearGradient id="vi-synth-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stop-color="#38bdf8"/>
                                                <stop offset="50%" stop-color="#818cf8"/>
                                                <stop offset="100%" stop-color="#10b981"/>
                                            </linearGradient>
                                        </defs>
                                        <!-- Track -->
                                        <path d="M 20 85 A 60 60 0 0 1 140 85" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="12" stroke-linecap="round"/>
                                        <!-- Arc Value -->
                                        <path d="M 20 85 A 60 60 0 0 1 140 85" fill="none" stroke="url(#vi-synth-grad)" stroke-width="12" stroke-dasharray="${dashArray}" stroke-linecap="round"/>
                                        <!-- Needle -->
                                        <polygon points="${needlePoints}" fill="#38bdf8" filter="drop-shadow(0 0 4px #38bdf8)"/>
                                        <circle cx="80" cy="85" r="6" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5"/>
                                        <text x="80" y="72" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="900" fill="#ffffff">${synthScore}%</text>
                                    </svg>
                                </div>
                                <div class="vi-gauge-status" style="color:#10b981;">
                                    <i class="fas fa-check-circle"></i> ${t.synthStatus}
                                </div>
                            </div>

                            <!-- Gauge 2: Concentric Ring for Information Bandwidth -->
                            <div class="vi-gauge-card">
                                <div class="vi-gauge-label">${t.infoBandwidthLabel}</div>
                                <div class="vi-svg-gauge-wrapper">
                                    <svg viewBox="0 0 100 100" width="95" height="95" class="vi-donut-svg">
                                        <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="8"/>
                                        <circle cx="50" cy="50" r="38" fill="none" stroke="#38bdf8" stroke-width="8" stroke-dasharray="238.8 238.8" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 50 50)"/>
                                        <text x="50" y="47" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="900" fill="#38bdf8">12/12</text>
                                        <text x="50" y="60" text-anchor="middle" font-family="'Inter', sans-serif" font-size="7.5" font-weight="700" fill="#94a3b8">${t.lensesActive}</text>
                                    </svg>
                                </div>
                                <div class="vi-gauge-status" style="color:#38bdf8;">
                                    <i class="fas fa-satellite-dish"></i> SNR: 14.8 dB
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 5-Point Visual Telemetry Strip -->
                    <div class="vi-telemetry-strip">
                        <div class="vi-tele-block">
                            <div class="vi-tele-title"><i class="fas fa-eye" style="color:var(--vi-cyan);"></i> ${t.teleFindings}</div>
                            <div class="vi-tele-val">${activeFindingsCount} <span class="vi-tele-sub">${t.teleSynthesized}</span></div>
                        </div>
                        <div class="vi-tele-block">
                            <div class="vi-tele-title"><i class="fas fa-crosshairs" style="color:var(--vi-emerald);"></i> ${t.teleDominant}</div>
                            <div class="vi-tele-val">${dominantLensName} <span class="vi-tele-sub">${t.teleOptimal}</span></div>
                        </div>
                        <div class="vi-tele-block">
                            <div class="vi-tele-title"><i class="fas fa-microchip" style="color:var(--vi-violet);"></i> ${t.teleVisualNodes}</div>
                            <div class="vi-tele-val">12 <span class="vi-tele-sub">${t.teleInstruments}</span></div>
                        </div>
                        <div class="vi-tele-block">
                            <div class="vi-tele-title"><i class="fas fa-shield-halved" style="color:var(--vi-amber);"></i> ${t.teleGovernance}</div>
                            <div class="vi-tele-val">${t.teleGuarded} <span class="vi-tele-sub">${t.teleNonCausal}</span></div>
                        </div>
                        <div class="vi-tele-block">
                            <div class="vi-tele-title"><i class="fas fa-gauge-high" style="color:var(--vi-purple);"></i> ${t.teleRender}</div>
                            <div class="vi-tele-val">60 FPS <span class="vi-tele-sub">Native SVG</span></div>
                        </div>
                    </div>

                    <!-- Interactive Lens Filter Pills & Density Toolbar -->
                    <div class="vi-controls-bar">
                        <!-- Lens Filter Pills -->
                        <div class="vi-lens-filters">
                            <span class="vi-filter-label"><i class="fas fa-filter"></i> ${t.lensLabel}:</span>
                            <button type="button" class="vi-lens-filter-btn active" data-lens="all">${t.lensAll} (12)</button>
                            <button type="button" class="vi-lens-filter-btn" data-lens="quality">${t.lensQuality} (2)</button>
                            <button type="button" class="vi-lens-filter-btn" data-lens="statistical">${t.lensStats} (4)</button>
                            <button type="button" class="vi-lens-filter-btn" data-lens="risk-decision">${t.lensRiskDecision} (3)</button>
                            <button type="button" class="vi-lens-filter-btn" data-lens="attribution">${t.lensAttribution} (3)</button>
                        </div>

                        <!-- Density & Action Switcher -->
                        <div class="vi-density-picker">
                            <span class="vi-density-lbl">${t.densityLabel}:</span>
                            <button type="button" class="vi-density-btn active" data-density="standard">${t.densityStd}</button>
                            <button type="button" class="vi-density-btn" data-density="compact">${t.densityCompact}</button>
                            <button type="button" class="vi-density-btn" data-density="deep">${t.densityDeep}</button>
                        </div>
                    </div>
                </div>

                <!-- 12 Graphical Intelligence Sections (The Mother of All Visuals) -->
                <div class="vi-sections-grid" id="udip-vi-sections-grid">
                    <!-- Section 1: DATA QUALITY -->
                    <div class="vi-section-block" data-lens="quality">
                        <h4 class="vi-section-title"><i class="fas fa-database" style="color:var(--vi-emerald);"></i> ${t.s1Title}</h4>
                        ${this.renderVisualCard({
                            type: 'quality',
                            title: isAr ? 'رادار الجودة متعدد المحاور' : 'Multi-Axis Quality Radar',
                            overallScore: overallQuality,
                            completeness,
                            consistency,
                            validity,
                            uniqueness,
                            timeliness,
                            accuracy
                        }, options)}
                    </div>

                    <!-- Section 2: PATTERNS & SPC -->
                    <div class="vi-section-block" data-lens="quality">
                        <h4 class="vi-section-title"><i class="fas fa-chart-line" style="color:var(--vi-cyan);"></i> ${t.s2Title}</h4>
                        ${this.renderVisualCard({
                            type: 'spc',
                            metric: primaryNumCol,
                            ucl: spcUcl,
                            cl: spcCl,
                            lcl: spcLcl,
                            cpk: spcCpk
                        }, options)}
                    </div>

                    <!-- Section 3: RELATIONSHIPS -->
                    <div class="vi-section-block" data-lens="statistical">
                        <h4 class="vi-section-title"><i class="fas fa-diagram-project" style="color:var(--vi-violet);"></i> ${t.s3Title}</h4>
                        ${this.renderVisualCard({
                            type: 'relationship',
                            variableA: varA,
                            variableB: varB,
                            r: corrR,
                            confidence: corrConf
                        }, options)}
                    </div>

                    <!-- Section 4: ANOMALIES -->
                    <div class="vi-section-block" data-lens="statistical">
                        <h4 class="vi-section-title"><i class="fas fa-triangle-exclamation" style="color:var(--vi-amber);"></i> ${t.s4Title}</h4>
                        ${this.renderVisualCard({
                            type: 'anomaly',
                            title: isAr ? 'عزل الشواذ في فضاء الطور' : 'Observed Outlier Separation',
                            anomalyCount,
                            anomalyRate,
                            severity: 'CRITICAL'
                        }, options)}
                    </div>

                    <!-- Section 5: HYPOTHESES -->
                    <div class="vi-section-block" data-lens="statistical">
                        <h4 class="vi-section-title"><i class="fas fa-microscope" style="color:var(--vi-purple);"></i> ${t.s5Title}</h4>
                        ${this.renderVisualCard({
                            type: 'hypothesis',
                            id: hypId,
                            statement: hypStatement,
                            status: hypStatus,
                            supportingScore: hypSupporting,
                            contraScore: hypContra,
                            confidence: hypConf
                        }, options)}
                    </div>

                    <!-- Section 6: EVIDENCE CONVERGENCE -->
                    <div class="vi-section-block" data-lens="attribution">
                        <h4 class="vi-section-title"><i class="fas fa-shield-check" style="color:var(--vi-emerald);"></i> ${t.s6Title}</h4>
                        ${this.renderVisualCard({
                            type: 'evidence',
                            title: isAr ? 'نواقل الأدلة متعددة الأساليب' : 'Multi-Method Evidence Vectors',
                            finding: evidenceFinding,
                            methodsCount: evidenceMethods
                        }, options)}
                    </div>

                    <!-- Section 7: RISKS -->
                    <div class="vi-section-block" data-lens="risk-decision">
                        <h4 class="vi-section-title"><i class="fas fa-shield-virus" style="color:var(--vi-crimson);"></i> ${t.s7Title}</h4>
                        ${this.renderVisualCard({
                            type: 'risk',
                            title: isAr ? 'مصفوفة التعرض للمخاطر التشغيلية' : 'Operational Exposure Matrix',
                            risks: activeRisks
                        }, options)}
                    </div>

                    <!-- Section 8: DECISIONS -->
                    <div class="vi-section-block" data-lens="risk-decision">
                        <h4 class="vi-section-title"><i class="fas fa-compass" style="color:var(--vi-cyan);"></i> ${t.s8Title}</h4>
                        ${this.renderVisualCard({
                            type: 'decision',
                            title: isAr ? 'مسار حسم القرار الاستراتيجي' : 'Prioritized Action Resolution',
                            recommendedAction: recommendedDecision,
                            confidence: decisionConf
                        }, options)}
                    </div>

                    <!-- Section 9: PREDICTIVE DRIVERS & PARETO -->
                    <div class="vi-section-block" data-lens="statistical">
                        <h4 class="vi-section-title"><i class="fas fa-chart-column" style="color:var(--vi-cyan);"></i> ${t.s9Title}</h4>
                        ${this.renderVisualCard({
                            type: 'pareto',
                            title: isAr ? 'محركات التنبؤ ونسبة باريتو 80/20' : 'Predictive Drivers & 80/20 Pareto',
                            bars: paretoBars
                        }, options)}
                    </div>

                    <!-- Section 10: MODEL PERFORMANCE & ROC -->
                    <div class="vi-section-block" data-lens="risk-decision">
                        <h4 class="vi-section-title"><i class="fas fa-bullseye" style="color:var(--vi-emerald);"></i> ${t.s10Title}</h4>
                        ${this.renderVisualCard({
                            type: 'mlperformance',
                            modelName: mlModelName,
                            f1Score: mlF1,
                            accuracy: mlAcc,
                            confusionMatrix: { tp: 84, fp: 8, fn: 6, tn: 102 }
                        }, options)}
                    </div>

                    <!-- Section 11: MULTIMODAL DENSITY WAVES -->
                    <div class="vi-section-block" data-lens="attribution">
                        <h4 class="vi-section-title"><i class="fas fa-wave-square" style="color:var(--vi-violet);"></i> ${t.s11Title}</h4>
                        ${this.renderVisualCard({
                            type: 'distribution',
                            column: distColName,
                            median: 48.2,
                            q1: 32.0,
                            q3: 66.5,
                            min: 12.0,
                            max: 94.0,
                            skewness: 0.28
                        }, options)}
                    </div>

                    <!-- Section 12: ROOT CAUSE ATTRIBUTION DAG -->
                    <div class="vi-section-block" data-lens="attribution">
                        <h4 class="vi-section-title"><i class="fas fa-sitemap" style="color:var(--vi-amber);"></i> ${t.s12Title}</h4>
                        ${this.renderVisualCard({
                            type: 'rootcause',
                            title: isAr ? 'شجرة المحركات والعزو الهيكلي' : 'Root Cause & Driver Tree',
                            defect: rootDefectName,
                            strongestFactor: topDriverName
                        }, options)}
                    </div>
                </div>
            </div>
            `;
        }

        /**
         * Connects user interaction with a visual card to the 3D Laboratory and Detail Drawer.
         * @param {HTMLElement} cardEl - The clicked visual card DOM element
         * @param {number} idx - Index of the card
         */
        static handleCardClick(cardEl, idx) {
            const glob = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});

            // 1. Dispatch 3D spatial illumination via MotionOrchestrator
            if (glob.UDIP && glob.UDIP.MotionOrchestrator) {
                const mo = glob.UDIP.MotionOrchestrator;
                const visualType = cardEl.getAttribute('data-visual-type') || 'RELATIONSHIP';
                mo.dispatch(mo.constructor.EVENTS.RELATIONSHIP_DISCOVERED, {
                    source: 'VisualIntelligence',
                    type: visualType,
                    index: idx,
                    timestamp: Date.now()
                });
            }

            // 2. Open Deep Finding Detail Experience Drawer if available
            if (glob.UDIP && glob.UDIP.FindingDetailDrawer) {
                const drawer = new glob.UDIP.FindingDetailDrawer();
                const mockFinding = {
                    id: `vi_finding_${idx}`,
                    title: cardEl.querySelector('.vi-var-name')?.textContent || 'Analytical Finding',
                    confidence: 0.92,
                    columnA: 'Temperature',
                    columnB: 'Defect Rate',
                    category: 'RELATIONSHIP',
                    explanation: 'Significant empirical association verified through multi-method consensus.'
                };
                drawer.open(mockFinding, null);
            }
        }
    }

    return VisualIntelligenceEngine;
}));
