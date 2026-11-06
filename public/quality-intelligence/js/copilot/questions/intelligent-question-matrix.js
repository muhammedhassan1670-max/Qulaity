/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/questions/intelligent-question-matrix.js
 * ============================================================================
 * Intelligent Question Matrix & Proactive Discovery Engine.
 * Dynamically synthesizes, categorizes, searches, and ranks smart analytical
 * questions across 8 specialized industrial quality & Six Sigma dimensions:
 * 1. QUALITY_SIX_SIGMA: Defect counts, PPM, DPMO, Sigma Level, Yield.
 * 2. PROCESS_CAPABILITY: Cpk, Cp, μ, σ, USL, LSL, Centering & Stability.
 * 3. ROOT_CAUSE_PARETO: Vital few defect modes, driver rankings, 80/20 rule.
 * 4. FINANCIAL_SCRAP: Scrap loss valuation, 10%/20%/30% reduction savings, ROI.
 * 5. WHAT_IF_TUNING: Sensitivity perturbations (±10%, ±20%), optimal setpoints.
 * 6. SHIFT_BENCHMARKING: Variance across shifts, machines, lines, and operators.
 * 7. COLUMN_ANALYTICS: On-the-fly 5-number summary (Min, Q1, Median, Mean, Max, Std).
 * 8. PLATFORM_GLOSSARY: Interactive platform guidance & engineering concept glossary.
 *
 * Guarantees zero mutation of the underlying dataset.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const DIMENSIONS = [
        {
            id: 'ALL',
            labelAr: '🌐 كافة الأسئلة الاستكشافية',
            labelEn: '🌐 All Inquiries',
            icon: 'fa-layer-group',
            badge: 'Matrix'
        },
        {
            id: 'QUALITY_SIX_SIGMA',
            labelAr: '🔬 الجودة و Six Sigma (PPM)',
            labelEn: '🔬 Quality & Six Sigma (PPM)',
            icon: 'fa-shield-halved',
            badge: 'Quality'
        },
        {
            id: 'PROCESS_CAPABILITY',
            labelAr: '📐 قدرة العملية (Cpk / Cp)',
            labelEn: '📐 Process Capability (Cpk)',
            icon: 'fa-chart-area',
            badge: 'SPC'
        },
        {
            id: 'ROOT_CAUSE_PARETO',
            labelAr: '🎯 الأسباب الجذرية وباريتو (80/20)',
            labelEn: '🎯 Root Causes & Pareto',
            icon: 'fa-sitemap',
            badge: 'Drivers'
        },
        {
            id: 'FINANCIAL_SCRAP',
            labelAr: '💰 تكلفة الهالك والوفر المالي',
            labelEn: '💰 Scrap Cost & Savings',
            icon: 'fa-coins',
            badge: 'Financial'
        },
        {
            id: 'WHAT_IF_TUNING',
            labelAr: '⚙️ المحاكاة والضبط الأمثل',
            labelEn: '⚙️ What-If & Setpoints',
            icon: 'fa-sliders',
            badge: 'Simulation'
        },
        {
            id: 'SHIFT_BENCHMARKING',
            labelAr: '🏭 مقارنة الورديات والماكينات',
            labelEn: '🏭 Shift & Line Comparison',
            icon: 'fa-code-compare',
            badge: 'Variance'
        },
        {
            id: 'COLUMN_ANALYTICS',
            labelAr: '📊 استعلامات الإحصاء للأعمدة',
            labelEn: '📊 Column Deep Stats',
            icon: 'fa-calculator',
            badge: 'Metrics'
        },
        {
            id: 'PLATFORM_GLOSSARY',
            labelAr: '🎓 دليل المنصة والقاموس الهندسي',
            labelEn: '🎓 Platform Guide & Glossary',
            icon: 'fa-book-open',
            badge: 'Guide'
        }
    ];

    const IntelligentQuestionMatrix = {
        DIMENSIONS,

        inspectDataset(dataset) {
            if (!dataset || !Array.isArray(dataset.rows) || dataset.rows.length === 0) {
                return {
                    hasData: false,
                    filename: 'No dataset',
                    rowCount: 0,
                    columnCount: 0,
                    columns: [],
                    defectCol: null,
                    shiftCol: null,
                    continuousCols: [],
                    categoricalCols: [],
                    primaryContinuous: 'Parameter_A',
                    secondaryContinuous: 'Parameter_B',
                    primaryCategorical: 'Shift_Line'
                };
            }

            const rowCount = dataset.rowCount || dataset.rows.length;
            const cols = Array.isArray(dataset.columns) ? dataset.columns : Object.keys(dataset.rows[0] || {});
            const sampleRow = dataset.rows[0] || {};

            const defectKeywords = ['defect', 'defective', 'معيب', 'تالف', 'quality_status', 'status', 'reject', 'is_defect', 'target', 'error', 'fail', 'ng'];
            const defectCol = cols.find(c => {
                const lc = c.toLowerCase();
                return defectKeywords.some(k => lc.includes(k));
            }) || null;

            const shiftKeywords = ['shift', 'وردية', 'machine', 'ماكينة', 'line', 'خط', 'operator', 'factor', 'station', 'محطة'];
            const shiftCol = cols.find(c => {
                const lc = c.toLowerCase();
                return shiftKeywords.some(k => lc.includes(k));
            }) || null;

            const continuousCols = [];
            const categoricalCols = [];

            const idKeywords = ['id', 'sample_id', 'row_id', 'index', 'seq', 'uuid', 'part_id', 'serial', 'batch_id'];
            cols.forEach(c => {
                if (c === defectCol || c === shiftCol) return;
                const lc = c.toLowerCase();
                if (idKeywords.some(k => lc === k || lc.endsWith('_id') || lc.startsWith('id_'))) return;

                const val = sampleRow[c];
                const isNum = typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(val));
                if (isNum) {
                    continuousCols.push(c);
                } else {
                    categoricalCols.push(c);
                }
            });

            const primaryContinuous = continuousCols[0] || cols.find(c => c !== defectCol && c !== shiftCol) || cols[0] || 'Temperature';
            const secondaryContinuous = continuousCols[1] || continuousCols[0] || (cols[1] || 'Pressure');
            const primaryCategorical = shiftCol || categoricalCols[0] || 'Shift';

            return {
                hasData: true,
                filename: dataset.filename || 'active_dataset.csv',
                rowCount,
                columnCount: cols.length,
                columns: cols,
                defectCol,
                shiftCol,
                continuousCols,
                categoricalCols,
                primaryContinuous,
                secondaryContinuous,
                primaryCategorical
            };
        },

        generateMatrix(dataset, preferredLang = 'ar') {
            const isAr = preferredLang === 'ar';
            const info = this.inspectDataset(dataset);
            const { filename, primaryContinuous, secondaryContinuous, primaryCategorical } = info;

            const matrix = {};

            // 1. QUALITY & SIX SIGMA
            matrix['QUALITY_SIX_SIGMA'] = isAr ? [
                {
                    id: 'q_six_1',
                    category: 'QUALITY_SIX_SIGMA',
                    text: `كم عدد العيوب ومعدل الـ PPM المحسوب في ${filename}؟`,
                    intent: 'QUALITY_METRICS',
                    icon: 'fa-shield-halved',
                    priority: 1
                },
                {
                    id: 'q_six_2',
                    category: 'QUALITY_SIX_SIGMA',
                    text: 'ما هو مستوى سيجما (Sigma Level) المحقق لخط الإنتاج؟',
                    intent: 'QUALITY_METRICS',
                    icon: 'fa-gauge-high',
                    priority: 2
                },
                {
                    id: 'q_six_3',
                    category: 'QUALITY_SIX_SIGMA',
                    text: 'ما هي نسبة القطع المطابقة للمواصفات مقابل التالف في عيناتك؟',
                    intent: 'QUALITY_METRICS',
                    icon: 'fa-check-double',
                    priority: 3
                },
                {
                    id: 'q_six_4',
                    category: 'QUALITY_SIX_SIGMA',
                    text: 'كيف يمكن رفع مستوى الجودة إلى 6 Sigma وتقليل الـ DPMO؟',
                    intent: 'CONCEPT_EXPLANATION',
                    icon: 'fa-arrow-trend-up',
                    priority: 4
                }
            ] : [
                {
                    id: 'q_six_1',
                    category: 'QUALITY_SIX_SIGMA',
                    text: `What is the defect count and computed PPM rate in ${filename}?`,
                    intent: 'QUALITY_METRICS',
                    icon: 'fa-shield-halved',
                    priority: 1
                },
                {
                    id: 'q_six_2',
                    category: 'QUALITY_SIX_SIGMA',
                    text: 'What is the achieved Six Sigma capability level for production?',
                    intent: 'QUALITY_METRICS',
                    icon: 'fa-gauge-high',
                    priority: 2
                },
                {
                    id: 'q_six_3',
                    category: 'QUALITY_SIX_SIGMA',
                    text: 'What is the yield rate of conforming vs defective parts?',
                    intent: 'QUALITY_METRICS',
                    icon: 'fa-check-double',
                    priority: 3
                },
                {
                    id: 'q_six_4',
                    category: 'QUALITY_SIX_SIGMA',
                    text: 'How can we elevate quality to Six Sigma and minimize DPMO?',
                    intent: 'CONCEPT_EXPLANATION',
                    icon: 'fa-arrow-trend-up',
                    priority: 4
                }
            ];

            // 2. PROCESS CAPABILITY (Cpk / Cp)
            matrix['PROCESS_CAPABILITY'] = isAr ? [
                {
                    id: 'q_cpk_1',
                    category: 'PROCESS_CAPABILITY',
                    text: `هل قياسات ${primaryContinuous} مستقرة وقادرة إحصائياً (Cpk / Cp)؟`,
                    intent: 'PROCESS_CAPABILITY',
                    icon: 'fa-chart-area',
                    priority: 1
                },
                {
                    id: 'q_cpk_2',
                    category: 'PROCESS_CAPABILITY',
                    text: `ما هي حدود المواصفات الفنية (USL و LSL) وتمركز المتوسط لـ ${primaryContinuous}؟`,
                    intent: 'PROCESS_CAPABILITY',
                    icon: 'fa-arrows-left-right',
                    priority: 2
                },
                {
                    id: 'q_cpk_3',
                    category: 'PROCESS_CAPABILITY',
                    text: 'هل مؤشر Cpk أعلى من الحد الصناعي المستهدف 1.33؟',
                    intent: 'PROCESS_CAPABILITY',
                    icon: 'fa-certificate',
                    priority: 3
                },
                {
                    id: 'q_cpk_4',
                    category: 'PROCESS_CAPABILITY',
                    text: 'ما الفرق الإحصائي بين مؤشر Cp ومؤشر Cpk؟',
                    intent: 'CONCEPT_EXPLANATION',
                    icon: 'fa-scale-balanced',
                    priority: 4
                }
            ] : [
                {
                    id: 'q_cpk_1',
                    category: 'PROCESS_CAPABILITY',
                    text: `Is ${primaryContinuous} statistically capable and centered (Cpk / Cp)?`,
                    intent: 'PROCESS_CAPABILITY',
                    icon: 'fa-chart-area',
                    priority: 1
                },
                {
                    id: 'q_cpk_2',
                    category: 'PROCESS_CAPABILITY',
                    text: `What are the tolerance limits (USL/LSL) and mean for ${primaryContinuous}?`,
                    intent: 'PROCESS_CAPABILITY',
                    icon: 'fa-arrows-left-right',
                    priority: 2
                },
                {
                    id: 'q_cpk_3',
                    category: 'PROCESS_CAPABILITY',
                    text: 'Is the Cpk index exceeding the industrial benchmark threshold of 1.33?',
                    intent: 'PROCESS_CAPABILITY',
                    icon: 'fa-certificate',
                    priority: 3
                },
                {
                    id: 'q_cpk_4',
                    category: 'PROCESS_CAPABILITY',
                    text: 'What is the engineering difference between Cp and Cpk?',
                    intent: 'CONCEPT_EXPLANATION',
                    icon: 'fa-scale-balanced',
                    priority: 4
                }
            ];

            // 3. ROOT CAUSE & PARETO (80/20)
            matrix['ROOT_CAUSE_PARETO'] = isAr ? [
                {
                    id: 'q_root_1',
                    category: 'ROOT_CAUSE_PARETO',
                    text: `ما هو تأثير متغير ${primaryContinuous} على الجودة وظهور العيوب؟`,
                    intent: 'MODEL_EXPLANATION',
                    icon: 'fa-chart-line',
                    priority: 1
                },
                {
                    id: 'q_root_2',
                    category: 'ROOT_CAUSE_PARETO',
                    text: 'ما هي الأسباب الجذرية للعيوب حسب قاعدة باريتو 80/20؟',
                    intent: 'PARETO_DEFECTS',
                    icon: 'fa-sitemap',
                    priority: 2
                },
                {
                    id: 'q_root_3',
                    category: 'ROOT_CAUSE_PARETO',
                    text: 'ما هي المتغيرات الأكثر ارتباطاً بمعدل الهالك في خط الإنتاج؟',
                    intent: 'ROOT_CAUSE_INVESTIGATION',
                    icon: 'fa-diagram-project',
                    priority: 3
                },
                {
                    id: 'q_root_4',
                    category: 'ROOT_CAUSE_PARETO',
                    text: 'كيف نستخدم مخطط إيشيكاوا (Fishbone) لعزل مسببات العيوب؟',
                    intent: 'CONCEPT_EXPLANATION',
                    icon: 'fa-network-wired',
                    priority: 4
                }
            ] : [
                {
                    id: 'q_root_1',
                    category: 'ROOT_CAUSE_PARETO',
                    text: `How does ${primaryContinuous} impact quality and defect occurrence?`,
                    intent: 'MODEL_EXPLANATION',
                    icon: 'fa-chart-line',
                    priority: 1
                },
                {
                    id: 'q_root_2',
                    category: 'ROOT_CAUSE_PARETO',
                    text: 'What are the vital few root causes according to Pareto 80/20?',
                    intent: 'PARETO_DEFECTS',
                    icon: 'fa-sitemap',
                    priority: 2
                },
                {
                    id: 'q_root_3',
                    category: 'ROOT_CAUSE_PARETO',
                    text: 'Which process variables correlate most heavily with scrap generation?',
                    intent: 'ROOT_CAUSE_INVESTIGATION',
                    icon: 'fa-diagram-project',
                    priority: 3
                },
                {
                    id: 'q_root_4',
                    category: 'ROOT_CAUSE_PARETO',
                    text: 'How to utilize Ishikawa fishbone diagram to isolate defect drivers?',
                    intent: 'CONCEPT_EXPLANATION',
                    icon: 'fa-network-wired',
                    priority: 4
                }
            ];

            // 4. FINANCIAL SCRAP & SAVINGS
            matrix['FINANCIAL_SCRAP'] = isAr ? [
                {
                    id: 'q_scrap_1',
                    category: 'FINANCIAL_SCRAP',
                    text: 'ما هي تكلفة الهالك والوفر المالي عند خفض العيوب 20%؟',
                    intent: 'SCRAP_COST',
                    icon: 'fa-coins',
                    priority: 1
                },
                {
                    id: 'q_scrap_2',
                    category: 'FINANCIAL_SCRAP',
                    text: 'كم سنحقق من الوفر المالي السنوي إذا خفضنا الـ PPM بنسبة 10%؟',
                    intent: 'SCRAP_COST',
                    icon: 'fa-piggy-bank',
                    priority: 2
                },
                {
                    id: 'q_scrap_3',
                    category: 'FINANCIAL_SCRAP',
                    text: 'ما هي التكلفة الإجمالية للخردة بناءً على عينات الإنتاج الحالية؟',
                    intent: 'SCRAP_COST',
                    icon: 'fa-sack-dollar',
                    priority: 3
                },
                {
                    id: 'q_scrap_4',
                    category: 'FINANCIAL_SCRAP',
                    text: 'ما هو مفهوم تكلفة الجودة (Cost of Quality - COQ)؟',
                    intent: 'CONCEPT_EXPLANATION',
                    icon: 'fa-landmark',
                    priority: 4
                }
            ] : [
                {
                    id: 'q_scrap_1',
                    category: 'FINANCIAL_SCRAP',
                    text: 'What is the scrap cost and projected savings from 20% defect reduction?',
                    intent: 'SCRAP_COST',
                    icon: 'fa-coins',
                    priority: 1
                },
                {
                    id: 'q_scrap_2',
                    category: 'FINANCIAL_SCRAP',
                    text: 'How much annual financial savings if we reduce PPM by 10%?',
                    intent: 'SCRAP_COST',
                    icon: 'fa-piggy-bank',
                    priority: 2
                },
                {
                    id: 'q_scrap_3',
                    category: 'FINANCIAL_SCRAP',
                    text: 'What is the total financial scrap loss evaluated on active samples?',
                    intent: 'SCRAP_COST',
                    icon: 'fa-sack-dollar',
                    priority: 3
                },
                {
                    id: 'q_scrap_4',
                    category: 'FINANCIAL_SCRAP',
                    text: 'What is the Cost of Quality (COQ) framework?',
                    intent: 'CONCEPT_EXPLANATION',
                    icon: 'fa-landmark',
                    priority: 4
                }
            ];

            // 5. WHAT-IF & PARAMETER SETPOINTS
            matrix['WHAT_IF_TUNING'] = isAr ? [
                {
                    id: 'q_sim_1',
                    category: 'WHAT_IF_TUNING',
                    text: `ماذا يحدث لو قمنا بضبط ${primaryContinuous} بنسبة 10%؟`,
                    intent: 'WHAT_IF',
                    icon: 'fa-sliders',
                    priority: 1
                },
                {
                    id: 'q_sim_2',
                    category: 'WHAT_IF_TUNING',
                    text: 'ما هي نافذة التشغيل الآمنة (Operating Window) لتقليل الهالك؟',
                    intent: 'PARAMETER_OPTIMIZATION',
                    icon: 'fa-bullseye',
                    priority: 2
                },
                {
                    id: 'q_sim_3',
                    category: 'WHAT_IF_TUNING',
                    text: 'ما هي أفضل إعدادات المعلمات التشغيلية لضمان ثبات الجودة؟',
                    intent: 'PARAMETER_OPTIMIZATION',
                    icon: 'fa-gears',
                    priority: 3
                },
                {
                    id: 'q_sim_4',
                    category: 'WHAT_IF_TUNING',
                    text: `ماذا يحدث لمعدل العيوب لو ارتفع ${secondaryContinuous} بمقدار 15%؟`,
                    intent: 'WHAT_IF',
                    icon: 'fa-wave-square',
                    priority: 4
                }
            ] : [
                {
                    id: 'q_sim_1',
                    category: 'WHAT_IF_TUNING',
                    text: `What if we adjust ${primaryContinuous} by 10%?`,
                    intent: 'WHAT_IF',
                    icon: 'fa-sliders',
                    priority: 1
                },
                {
                    id: 'q_sim_2',
                    category: 'WHAT_IF_TUNING',
                    text: 'What is the certified safe operating window to avoid defects?',
                    intent: 'PARAMETER_OPTIMIZATION',
                    icon: 'fa-bullseye',
                    priority: 2
                },
                {
                    id: 'q_sim_3',
                    category: 'WHAT_IF_TUNING',
                    text: 'What are optimal parameter setpoints for maximum process stability?',
                    intent: 'PARAMETER_OPTIMIZATION',
                    icon: 'fa-gears',
                    priority: 3
                },
                {
                    id: 'q_sim_4',
                    category: 'WHAT_IF_TUNING',
                    text: `How would defect rate react if ${secondaryContinuous} increases by 15%?`,
                    intent: 'WHAT_IF',
                    icon: 'fa-wave-square',
                    priority: 4
                }
            ];

            // 6. SHIFT & MACHINE COMPARISONS
            matrix['SHIFT_BENCHMARKING'] = isAr ? [
                {
                    id: 'q_shift_1',
                    category: 'SHIFT_BENCHMARKING',
                    text: `قارن بين تصنيفات ${primaryCategorical} وأيها أكثر عيوباً وهالكاً؟`,
                    intent: 'SHIFT_COMPARISON',
                    icon: 'fa-code-compare',
                    priority: 1
                },
                {
                    id: 'q_shift_2',
                    category: 'SHIFT_BENCHMARKING',
                    text: 'أي وردية أو ماكينة تسجل أفضل أداء جودة وأقل نسبة هالك؟',
                    intent: 'SHIFT_COMPARISON',
                    icon: 'fa-award',
                    priority: 2
                },
                {
                    id: 'q_shift_3',
                    category: 'SHIFT_BENCHMARKING',
                    text: 'هل التباين بين الورديات ذو دلالة إحصائية (P-value) تستوجب التدخل؟',
                    intent: 'SHIFT_COMPARISON',
                    icon: 'fa-chart-column',
                    priority: 3
                },
                {
                    id: 'q_shift_4',
                    category: 'SHIFT_BENCHMARKING',
                    text: `قارن بين متوسط قياسات ${primaryContinuous} عبر مختلف الورديات`,
                    intent: 'SHIFT_COMPARISON',
                    icon: 'fa-arrows-split-up-and-left',
                    priority: 4
                }
            ] : [
                {
                    id: 'q_shift_1',
                    category: 'SHIFT_BENCHMARKING',
                    text: `Compare ${primaryCategorical} groups for defect and scrap disparity?`,
                    intent: 'SHIFT_COMPARISON',
                    icon: 'fa-code-compare',
                    priority: 1
                },
                {
                    id: 'q_shift_2',
                    category: 'SHIFT_BENCHMARKING',
                    text: 'Which shift or machine delivers highest quality and minimal scrap?',
                    intent: 'SHIFT_COMPARISON',
                    icon: 'fa-award',
                    priority: 2
                },
                {
                    id: 'q_shift_3',
                    category: 'SHIFT_BENCHMARKING',
                    text: 'Is inter-shift variation statistically significant (P-value)?',
                    intent: 'SHIFT_COMPARISON',
                    icon: 'fa-chart-column',
                    priority: 3
                },
                {
                    id: 'q_shift_4',
                    category: 'SHIFT_BENCHMARKING',
                    text: `Compare mean values of ${primaryContinuous} across different shifts`,
                    intent: 'SHIFT_COMPARISON',
                    icon: 'fa-arrows-split-up-and-left',
                    priority: 4
                }
            ];

            // 7. DYNAMIC COLUMN STATISTICS
            matrix['COLUMN_ANALYTICS'] = isAr ? [
                {
                    id: 'q_col_1',
                    category: 'COLUMN_ANALYTICS',
                    text: `احسبلي متوسط وأعلى وأدنى قيمة في عمود ${primaryContinuous}`,
                    intent: 'COLUMN_STATISTICS',
                    icon: 'fa-calculator',
                    priority: 1
                },
                {
                    id: 'q_col_2',
                    category: 'COLUMN_ANALYTICS',
                    text: `ما هو الانحراف المعياري والوسيط الإحصائي لـ ${secondaryContinuous}؟`,
                    intent: 'COLUMN_STATISTICS',
                    icon: 'fa-square-root-variable',
                    priority: 2
                },
                {
                    id: 'q_col_3',
                    category: 'COLUMN_ANALYTICS',
                    text: 'هل توجد قيم شاذة (Outliers) أو بيانات مفقودة في أعمدة البيانات؟',
                    intent: 'ANOMALY_ANALYSIS',
                    icon: 'fa-circle-exclamation',
                    priority: 3
                },
                {
                    id: 'q_col_4',
                    category: 'COLUMN_ANALYTICS',
                    text: `ما هو المدى والتوزيع الإحصائي لعمود ${primaryContinuous}؟`,
                    intent: 'COLUMN_STATISTICS',
                    icon: 'fa-chart-simple',
                    priority: 4
                }
            ] : [
                {
                    id: 'q_col_1',
                    category: 'COLUMN_ANALYTICS',
                    text: `Calculate mean, min, and max for column ${primaryContinuous}`,
                    intent: 'COLUMN_STATISTICS',
                    icon: 'fa-calculator',
                    priority: 1
                },
                {
                    id: 'q_col_2',
                    category: 'COLUMN_ANALYTICS',
                    text: `What is the standard deviation and median for ${secondaryContinuous}?`,
                    intent: 'COLUMN_STATISTICS',
                    icon: 'fa-square-root-variable',
                    priority: 2
                },
                {
                    id: 'q_col_3',
                    category: 'COLUMN_ANALYTICS',
                    text: 'Are there statistical outliers or missing values in dataset columns?',
                    intent: 'ANOMALY_ANALYSIS',
                    icon: 'fa-circle-exclamation',
                    priority: 3
                },
                {
                    id: 'q_col_4',
                    category: 'COLUMN_ANALYTICS',
                    text: `What is the statistical range and spread of column ${primaryContinuous}?`,
                    intent: 'COLUMN_STATISTICS',
                    icon: 'fa-chart-simple',
                    priority: 4
                }
            ];

            // 8. PLATFORM HELP & ENGINEERING GLOSSARY
            matrix['PLATFORM_GLOSSARY'] = isAr ? [
                {
                    id: 'q_guide_1',
                    category: 'PLATFORM_GLOSSARY',
                    text: 'كيف أستخدم استوديو محاكاة القرارات والهالك في المنصة؟',
                    intent: 'PLATFORM_HELP',
                    icon: 'fa-compass',
                    priority: 1
                },
                {
                    id: 'q_guide_2',
                    category: 'PLATFORM_GLOSSARY',
                    text: 'ما هو تعريف ومعادلة Cpk وكيف يفسر استقرار العملية؟',
                    intent: 'CONCEPT_EXPLANATION',
                    icon: 'fa-book-bookmark',
                    priority: 2
                },
                {
                    id: 'q_guide_3',
                    category: 'PLATFORM_GLOSSARY',
                    text: 'كيف أدرب وأقارن نماذج الذكاء الاصطناعي في Model Studio؟',
                    intent: 'PLATFORM_HELP',
                    icon: 'fa-brain',
                    priority: 3
                },
                {
                    id: 'q_guide_4',
                    category: 'PLATFORM_GLOSSARY',
                    text: 'ماذا تعني القيمة الاحتمالية P-value ومتى نعتبر النتيجة مؤكدة؟',
                    intent: 'CONCEPT_EXPLANATION',
                    icon: 'fa-spell-check',
                    priority: 4
                }
            ] : [
                {
                    id: 'q_guide_1',
                    category: 'PLATFORM_GLOSSARY',
                    text: 'How do I use Decision Intelligence & Scrap Simulation studio?',
                    intent: 'PLATFORM_HELP',
                    icon: 'fa-compass',
                    priority: 1
                },
                {
                    id: 'q_guide_2',
                    category: 'PLATFORM_GLOSSARY',
                    text: 'What is the definition and formula for Cpk capability index?',
                    intent: 'CONCEPT_EXPLANATION',
                    icon: 'fa-book-bookmark',
                    priority: 2
                },
                {
                    id: 'q_guide_3',
                    category: 'PLATFORM_GLOSSARY',
                    text: 'How to train and benchmark models in Model Studio?',
                    intent: 'PLATFORM_HELP',
                    icon: 'fa-brain',
                    priority: 3
                },
                {
                    id: 'q_guide_4',
                    category: 'PLATFORM_GLOSSARY',
                    text: 'What does P-value mean in statistical quality hypothesis testing?',
                    intent: 'CONCEPT_EXPLANATION',
                    icon: 'fa-spell-check',
                    priority: 4
                }
            ];

            const flatList = [];
            Object.keys(matrix).forEach(catId => {
                flatList.push(...matrix[catId]);
            });

            return {
                dimensions: DIMENSIONS,
                matrix,
                flatList,
                datasetInfo: info
            };
        },

        discoverQuestions(dataset, categoryId = 'ALL', preferredLang = 'ar') {
            const matrixObj = this.generateMatrix(dataset, preferredLang);
            if (!categoryId || categoryId === 'ALL') {
                return matrixObj.flatList;
            }
            return matrixObj.matrix[categoryId] || matrixObj.flatList;
        },

        sampleCuratedQuestions(dataset, count = 8, preferredLang = 'ar') {
            const matrixObj = this.generateMatrix(dataset, preferredLang);
            const sampled = [];
            const cats = ['QUALITY_SIX_SIGMA', 'ROOT_CAUSE_PARETO', 'PROCESS_CAPABILITY', 'SHIFT_BENCHMARKING', 'FINANCIAL_SCRAP', 'WHAT_IF_TUNING', 'COLUMN_ANALYTICS', 'PLATFORM_GLOSSARY'];

            cats.forEach(c => {
                const list = matrixObj.matrix[c] || [];
                if (list.length > 0) {
                    sampled.push(list[0]);
                }
            });

            if (sampled.length < count) {
                cats.forEach(c => {
                    const list = matrixObj.matrix[c] || [];
                    if (list.length > 1 && sampled.length < count) {
                        sampled.push(list[1]);
                    }
                });
            }

            return sampled.slice(0, count);
        },

        searchQuestions(dataset, query = '', preferredLang = 'ar') {
            const matrixObj = this.generateMatrix(dataset, preferredLang);
            const q = String(query || '').trim().toLowerCase();
            if (!q) return matrixObj.flatList;

            return matrixObj.flatList.filter(item => {
                return item.text.toLowerCase().includes(q) ||
                       (item.category && item.category.toLowerCase().includes(q)) ||
                       (item.intent && item.intent.toLowerCase().includes(q));
            });
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.IntelligentQuestionMatrix = IntelligentQuestionMatrix;
    window.UDIP.IntelligentQuestionMatrix = IntelligentQuestionMatrix;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = IntelligentQuestionMatrix;
    }

})(typeof window !== 'undefined' ? window : global);
