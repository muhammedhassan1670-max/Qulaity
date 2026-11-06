/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/intent/intent-detector.js
 * ============================================================================
 * Detects analytical user intent from natural language input (Arabic & English).
 * Supports 22+ discrete analytical intents using multi-layered pattern matching,
 * linguistic semantics, and contextual entity grounding.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const INTENT_PATTERNS = [
        // 1. WHAT IF / SCENARIO ANALYSIS
        {
            intent: 'WHAT_IF',
            patterns: [
                /what\s+if/i,
                /لو\s+/i,
                /ماذا\s+(?:يحدث|لو)/i,
                /إذا\s+(?:زاد|نقص|تغير|ارتفع|انخفض)/i,
                /(?:زاد|نقص|ارتفع|انخفض|تغير).*(?:\d+%\s*|\d+\s*(?:وحدة|نقطة|درجة))/i,
                /increase.*by/i,
                /decrease.*by/i,
                /simulate/i,
                /محاكاة/i
            ],
            weight: 1.1
        },

        // 2. ROOT CAUSE INVESTIGATION
        {
            intent: 'ROOT_CAUSE_INVESTIGATION',
            patterns: [
                /root\s+cause/i,
                /سبب|أسباب/i,
                /عوامل\s+(?:وراء|مؤدية|محتملة)/i,
                /drivers?\s+of/i,
                /why\s+did.*change/i,
                /ما\s+(?:السبب|الدافع)/i,
                /ليه\s+حصل/i
            ],
            weight: 1.05
        },

        // 3. DRIFT ANALYSIS
        {
            intent: 'DRIFT_ANALYSIS',
            patterns: [
                /\bdrift\b/i,
                /انحراف/i,
                /تغير\s+في\s+التوزيع/i,
                /distribution\s+shift/i,
                /concept\s+drift/i,
                /هل\s+فيه\s+drift/i
            ],
            weight: 1.1
        },

        // 4. MODEL EXPLANATION & FEATURE IMPORTANCE
        {
            intent: 'MODEL_EXPLANATION',
            patterns: [
                /feature\s+importance/i,
                /أهمية\s+المتغير/i,
                /ليه\s+.*أهم\s+من/i,
                /why\s+is\s+.*more\s+important/i,
                /why\s+.*important/i,
                /ليه\s+.*مهم/i,
                /تأثير\s+.*على\s+النموذج/i,
                /how\s+does.*impact\s+the\s+model/i,
                /model\s+trust/i,
                /هل\s+الموديل.*موثوق/i,
                /trustworthy/i
            ],
            weight: 1.05
        },

        // 5. MODEL COMPARISON
        {
            intent: 'MODEL_COMPARISON',
            patterns: [
                /best\s+model/i,
                /(?:أفضل|أحسن)\s+(?:model|موديل|نموذج)/i,
                /(?:أنهي|أي)\s+(?:model|موديل|نموذج)/i,
                /compare\s+models/i,
                /مقارنة\s+(?:النماذج|models)/i,
                /leaderboard/i,
                /لوحة\s+النماذج/i,
                /which\s+model/i
            ],
            weight: 1.15
        },

        // 6. FORECAST REQUEST
        {
            intent: 'FORECAST_REQUEST',
            patterns: [
                /forecast/i,
                /توقع/i,
                /تنبؤ/i,
                /predict(?:ion)?\s+(?:future|next)/i,
                /الفترة\s+القادمة/i,
                /القيمة\s+المستقبلية/i
            ],
            weight: 1.0
        },

        // 7. ANOMALY ANALYSIS
        {
            intent: 'ANOMALY_ANALYSIS',
            patterns: [
                /anomal(?:y|ies)/i,
                /outliers?/i,
                /شذوذ/i,
                /قيم\s+(?:شاذة|غريبة)/i,
                /غير\s+طبيعي/i,
                /abnormal/i
            ],
            weight: 1.0
        },

        // 8. TREND ANALYSIS
        {
            intent: 'TREND_ANALYSIS',
            patterns: [
                /trend/i,
                /اتجاه/i,
                /تصاعدي|تنازلي/i,
                /over\s+time/i,
                /عبر\s+الوقت/i,
                /مسار/i
            ],
            weight: 0.95
        },

        // 9. EVIDENCE REQUEST
        {
            intent: 'EVIDENCE_REQUEST',
            patterns: [
                /evidence/i,
                /دليل|أدلة/i,
                /اثبات|إثبات/i,
                /proof/i,
                /وريني\s+الدليل/i,
                /show\s+(?:me\s+)?(?:the\s+)?evidence/i,
                /how\s+do\s+we\s+know/i,
                /ازاي\s+عرفنا/i,
                /كيف\s+عرفنا/i
            ],
            weight: 1.1
        },

        // 10. RISK ANALYSIS
        {
            intent: 'RISK_ANALYSIS',
            patterns: [
                /risk/i,
                /مخاطر|خطر/i,
                /أخطر\s+حاجة/i,
                /threats?/i,
                /تهديد/i,
                /biggest\s+risk/i
            ],
            weight: 1.05
        },

        // 11. OPPORTUNITY ANALYSIS
        {
            intent: 'OPPORTUNITY_ANALYSIS',
            patterns: [
                /opportunit(?:y|ies)/i,
                /فرص|فرصة/i,
                /أكبر\s+فرصة/i,
                /biggest\s+opportunity/i,
                /potential\s+gain/i
            ],
            weight: 1.05
        },

        // 12. INVESTIGATION REQUEST
        {
            intent: 'INVESTIGATION_REQUEST',
            patterns: [
                /investigat/i,
                /تحقيق|نحقق/i,
                /خلينا\s+نحقق/i,
                /ابدأ\s+تحقيق/i,
                /deep\s+dive/i,
                /تعمق\s+في/i,
                /explore\s+drivers/i
            ],
            weight: 1.05
        },

        // 13. REPORT REQUEST
        {
            intent: 'REPORT_REQUEST',
            patterns: [
                /report/i,
                /تقرير/i,
                /executive\s+brief/i,
                /ملخص\s+تنفيذي/i,
                /اعمل(?:لي)?\s+تقرير/i,
                /تصدير\s+تقرير/i,
                /export\s+report/i
            ],
            weight: 1.1
        },

        // 14. VISUALIZATION REQUEST
        {
            intent: 'VISUALIZATION_REQUEST',
            patterns: [
                /chart/i,
                /plot/i,
                /رسم\s+بياني/i,
                /مخطط/i,
                /visualiz/i,
                /وريني\s+(?:أفضل\s+)?chart/i,
                /show\s+(?:me\s+)?(?:a\s+)?chart/i
            ],
            weight: 1.05
        },

        // 15. INSIGHT HISTORY / CHANGE ORIGIN
        {
            intent: 'INSIGHT_HISTORY',
            patterns: [
                /history/i,
                /تاريخ/i,
                /إمتى|متى/i,
                /when\s+did/i,
                /أول\s+مرة/i,
                /first\s+time/i,
                /هل.*كان\s+موجود\s+قبل/i,
                /did\s+this\s+exist\s+before/i,
                /evolution/i,
                /تطور/i
            ],
            weight: 1.05
        },

        // 16. DATA QUALITY
        {
            intent: 'DATA_QUALITY',
            patterns: [
                /quality/i,
                /جودة/i,
                /missing\s+(?:values|data)/i,
                /قيم\s+مفقودة/i,
                /health\s+score/i,
                /صحة\s+البيانات/i,
                /cleanliness/i,
                /نظافة/i
            ],
            weight: 1.0
        },

        // 17. COMPARISON / WHAT CHANGED
        {
            intent: 'COMPARISON',
            patterns: [
                /what\s+changed/i,
                /إيه\s+اللي\s+اتغير/i,
                /ما\s+الذي\s+تغير/i,
                /قارن/i,
                /compare/i,
                /versus|vs\b/i,
                /مقارنة\s+بين/i,
                /النسخة\s+السابقة/i,
                /previous\s+version/i,
                /أهم\s+3\s+حاجات\s+اتغيرت/i
            ],
            weight: 1.1
        },

        // 18. DECISION REQUEST
        {
            intent: 'DECISION_REQUEST',
            patterns: [
                /decision/i,
                /قرار|قرارات/i,
                /ماذا\s+نفعل/i,
                /what\s+should\s+we\s+do/i,
                /recommendation/i,
                /توصية|توصيات/i,
                /next\s+steps?/i,
                /خطوات\s+قادمة/i
            ],
            weight: 1.05
        },

        // 19. EXPLANATION / WHY
        {
            intent: 'EXPLANATION',
            patterns: [
                /\bwhy\b/i,
                /\bexplain\b/i,
                /ليه/i,
                /لماذا/i,
                /فسر/i,
                /اشرح/i,
                /معنى/i,
                /meaning\s+of/i
            ],
            weight: 0.9
        },

        // 20. SUMMARY / OVERVIEW
        {
            intent: 'SUMMARY',
            patterns: [
                /summar/i,
                /overview/i,
                /لخص/i,
                /ملخص/i,
                /نبذة/i,
                /إيه\s+أهم\s+(?:\d+\s+)?(?:findings|نتائج)/i,
                /what\s+matters\s+most/i,
                /أهم\s+حاجة/i
            ],
            weight: 0.95
        },

        // 21. INTEGRATION / CONNECTIVITY / LINEAGE
        {
            intent: 'INTEGRATION_QUERY',
            patterns: [
                /\b(?:connect\w*|integrat\w*|sync\w*|ingest\w*|lineage|provenance|database\w*|postgres|supabase|webhook\w*)\b/i,
                /\b(?:data\s+source\w*|external\s+source\w*|rest\s+api)\b/i,
                /اتصال\w*|توصيل\w*|تكامل\w*/i,
                /تزامن\w*|استيراد\w*|جلب\s+بيانات/i,
                /مصدر\s*البيانات|مصادر\s*البيانات|سلالة\s*البيانات|قواعد?\s*بيانات/i
            ],
            weight: 1.2
        },

        // 22. QUALITY & SIX SIGMA METRICS
        {
            intent: 'QUALITY_METRICS',
            patterns: [
                /\bppm\b/i,
                /معدل\s+(?:العيوب|الهالك|التالف)/i,
                /نسبة\s+(?:العيوب|الهالك|التالف)/i,
                /defect\s+rate/i,
                /defect\s+count/i,
                /عدد\s+(?:العيوب|القطع\s+المعيبة|القطع\s+التالفة|الهالك)/i,
                /كم\s+(?:عدد\s+)?(?:ال)?(?:عيب|عيوب|قطعة\s+معيبة|قطعة\s+تالفة|هالك)/i,
                /(?:عيوب|defects?)\s+(?:شهر|في\s+شهر|month|in\s+month|in\s+jan|in\s+feb|in\s+mar|in\s+apr|in\s+may|in\s+jun|in\s+jul|in\s+aug|in\s+sep|in\s+oct|in\s+nov|in\s+dec)/i,
                /defects?\b/i,
                /defective\s+(?:parts|units|rate)/i,
                /six\s+sigma/i,
                /مستوى\s+سيجما/i,
                /sigma\s+level/i,
                /\bdpm(?:o)?\b/i,
                /جودة\s+الإنتاج/i,
                /مؤشرات\s+الجودة/i
            ],
            weight: 1.35
        },

        // 23. PROCESS CAPABILITY & SPC
        {
            intent: 'PROCESS_CAPABILITY',
            patterns: [
                /\bcpk\b/i,
                /\bcp\b/i,
                /\bppk\b/i,
                /قدرة\s+العملية/i,
                /مؤشر\s+القدرة/i,
                /process\s+capability/i,
                /حدود\s+المواصفات/i,
                /specification\s+limits/i,
                /\busl\b|\blsl\b/i,
                /\bspc\b/i,
                /مخطط\s+التحكم/i,
                /control\s+charts?/i,
                /استقرار\s+العملية/i
            ],
            weight: 1.3
        },

        // 24. SCRAP COST & FINANCIAL IMPACT
        {
            intent: 'SCRAP_COST',
            patterns: [
                /تكلفة\s+(?:الهالك|الخردة|العيوب|الاسكراب)/i,
                /scrap\s+cost/i,
                /cost\s+of\s+scrap/i,
                /خسائر?\s+(?:الهالك|الخردة|العيوب)/i,
                /وفر\s+مالي/i,
                /cost\s+savings/i,
                /\bcoq\b/i,
                /cost\s+of\s+quality/i,
                /تكاليف\s+الجودة/i,
                /فلوس\s+(?:الهالك|الاسكراب|الخردة)/i
            ],
            weight: 1.3
        },

        // 25. PARAMETER OPTIMIZATION & MACHINE SETPOINTS
        {
            intent: 'PARAMETER_OPTIMIZATION',
            patterns: [
                /(?:إعدادات|اعدادات)\s+(?:الماكينة|مثلى|المثالية|الحرارة|الضغط|السرعة)/i,
                /الضبط\s+الأمثل/i,
                /أفضل\s+(?:إعدادات|قيم|نطاق)/i,
                /optimal\s+(?:parameters|setpoints|operating\s+window)/i,
                /machine\s+settings/i,
                /نطاق\s+التشغيل/i,
                /تحسين\s+المعلمات/i
            ],
            weight: 1.2
        },

        // 26. SHIFT & MACHINE COMPARISONS
        {
            intent: 'SHIFT_COMPARISON',
            patterns: [
                /مقارنة\s+(?:الورديات|الماكينات|خطوط\s+الإنتاج|التصنيفات|المجموعات)/i,
                /قارن\s+بين\s+(?:تصنيفات|ورديات|ماكينات|خطوط|مجموعات|shift)/i,
                /أي\s+(?:وردية|ماكينة|خط\s+إنتاج|مجموعة|تصنيف)/i,
                /أنهي\s+(?:وردية|ماكينة|خط\s+إنتاج|مجموعة|تصنيف)/i,
                /(?:أيها|أيهم|أيهما)\s+(?:أكثر|أقل|أعلى|أفضل)\s+(?:عيوب|هالك|تالف|جودة)/i,
                /الوردية\s+(?:الأولى|الثانية|الثالثة|الأكتر\s+عيوب|الأفضل)/i,
                /shift\s+comparison/i,
                /which\s+(?:shift|machine|line|group|operator)\b/i,
                /compare\s+(?:shifts|machines|lines|groups|categories)/i
            ],
            weight: 1.35
        },

        // 27. PARETO DEFECTS & BREAKDOWN
        {
            intent: 'PARETO_DEFECTS',
            patterns: [
                /باريتو/i,
                /\bpareto\b/i,
                /توزيع\s+أنواع\s+العيوب/i,
                /أهم\s+أنواع\s+العيوب/i,
                /defect\s+(?:types|categories|breakdown)/i,
                /failure\s+modes/i
            ],
            weight: 1.2
        },

        // 28. DYNAMIC COLUMN STATISTICS & AGGREGATIONS
        {
            intent: 'COLUMN_STATISTICS',
            patterns: [
                /(?:متوسط|معدل|أعلى\s+قيمة|اقصى\s+قيمة|أقل\s+قيمة|ادنى\s+قيمة|انحراف\s+معياري|مجموع|تكرار|قيم\s+عمود)/i,
                /\b(?:mean|average|max|maximum|min|minimum|std|standard\s+deviation|median|sum|quantiles?|variance)\b/i,
                /احسب\s+(?:متوسط|مجموع|أعلى|أقل)/i,
                /كم\s+(?:متوسط|مجموع|أعلى|أقل)/i
            ],
            weight: 1.25
        },

        // 29. PLATFORM HOW-TO & NAVIGATION HELP
        {
            intent: 'PLATFORM_HELP',
            patterns: [
                /(?:ازاي|كيف|طريقة|خطوات)\s+(?:أستخدم|استخدم|أعمل|اعمل|أدرب|ادرب|أحاكي|احاكي|أصدر|اصدر|أفتح|افتح|أرفع|ارفع|اوصل|أوصل)/i,
                /(?:فين|أين)\s+(?:شاشة|تبويب|قسم|مكان|زر)/i,
                /how\s+(?:to|do\s+i|can\s+i)\s+(?:use|train|simulate|export|upload|open|run|navigate)/i,
                /where\s+is\s+(?:the\s+)?(?:screen|tab|section|button)/i,
                /شرح\s+المنصة|دليل\s+الاستخدام|مساعدة\s+في\s+المنصة/i
            ],
            weight: 1.3
        },

        // 30. STATISTICAL & ENGINEERING CONCEPT GLOSSARY
        {
            intent: 'CONCEPT_EXPLANATION',
            patterns: [
                /(?:ما\s+هو|ما\s+هي|ماذا\s+يعني|يعني\s+ايه|تعريف|معنى|معادلة|طريقة\s+حساب)\s+(?:cpk|cp|ppm|six\s+sigma|سيجما|p-value|p\s+value|t-test|anova|r2|r-squared|rmse|weibull|ishikawa|إيشيكاوا|باريتو|pareto|confusion\s+matrix|roc|auc|z-score)/i,
                /what\s+is\s+(?:a\s+|the\s+)?(?:cpk|cp|ppm|six\s+sigma|p-value|p\s+value|t-test|anova|r2|r-squared|rmse|weibull|ishikawa|pareto|confusion\s+matrix|roc|auc)/i,
                /define\s+(?:cpk|cp|ppm|six\s+sigma|p-value|t-test|anova|r2|rmse|weibull|ishikawa|pareto)/i
            ],
            weight: 1.35
        }
    ];

    const IntentDetector = {
        /**
         * Detect analytical intent from user message
         * @param {string} message
         * @param {Object} context
         * @returns {Object} { intent: string, confidence: number, matches: Array }
         */
        detect(message = '', context = {}) {
            const text = String(message || '').trim();
            if (!text) {
                return {
                    intent: 'GENERAL_DATA_QUESTION',
                    confidence: 0.5,
                    matches: []
                };
            }

            const scores = {};
            const matches = [];

            for (const rule of INTENT_PATTERNS) {
                for (const pattern of rule.patterns) {
                    if (pattern.test(text)) {
                        const score = rule.weight || 1.0;
                        scores[rule.intent] = (scores[rule.intent] || 0) + score;
                        matches.push({ intent: rule.intent, pattern: pattern.toString(), weight: score });
                    }
                }
            }

            // Check if user input is an explicit single follow-up like "ليه؟" or "why?"
            const trimmed = text.replace(/[؟?!\s]/g, '').toLowerCase();
            if (trimmed === 'ليه' || trimmed === 'why' || trimmed === 'لماذا') {
                scores['EXPLANATION'] = (scores['EXPLANATION'] || 0) + 1.5;
            }

            // Find winning intent
            let bestIntent = 'GENERAL_DATA_QUESTION';
            let maxScore = 0;

            for (const [intent, score] of Object.entries(scores)) {
                if (score > maxScore) {
                    maxScore = score;
                    bestIntent = intent;
                }
            }

            // Compute normalized confidence bounded in [0.4, 0.98]
            const confidence = maxScore > 0 ? Math.min(0.98, Math.max(0.4, 0.55 + maxScore * 0.15)) : 0.45;

            return {
                intent: bestIntent,
                confidence: Number(confidence.toFixed(2)),
                matches
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.IntentDetector = IntentDetector;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = IntentDetector;
    }

})(typeof window !== 'undefined' ? window : global);
