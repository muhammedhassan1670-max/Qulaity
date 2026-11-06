/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/intent/entity-extractor.js
 * ============================================================================
 * Extracts analytical entities from user messages:
 * - Columns (dataset schema matching)
 * - Targets (identified targets)
 * - Models (ML leaderboard names)
 * - Findings / Beats (workspace narratives)
 * - Risks & Opportunities (decision intelligence)
 * - Dataset versions (current, previous, baseline)
 * - Scenarios & What-if variables
 * - Numbers / Percentages / Change magnitudes (e.g. "+10%", "5 units")
 * Detects ambiguities and suggests clarification options.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const EntityExtractor = {
        /**
         * Extract entities from a user message given platform analytical context
         * @param {string} text
         * @param {Object} context
         * @returns {Object} { entities: Array, ambiguous: boolean, clarifications: Array }
         */
        extract(text = '', context = {}) {
            const rawText = String(text || '').trim();
            const lowerText = rawText.toLowerCase();
            const entities = [];
            let ambiguous = false;
            const clarifications = [];

            const dataset = context.dataset;
            const profile = context.profile;
            const analysisPlan = context.analysisPlan;
            const analytics = context.analytics;
            const decisionIntelligence = context.decisionIntelligence;
            const workspace = context.workspace;

            // 1. Extract Columns
            const knownColumns = Array.isArray(dataset?.columns)
                ? dataset.columns
                : (Array.isArray(profile?.columns) ? profile.columns.map(c => c.name) : []);

            const matchedCols = [];
            knownColumns.forEach(col => {
                const colLower = col.toLowerCase();
                // Check exact word boundaries or substring in text
                const regex = new RegExp(`\\b${escapeRegExp(colLower)}\\b`, 'i');
                if (regex.test(lowerText) || lowerText.includes(colLower)) {
                    matchedCols.push(col);
                }
            });

            matchedCols.forEach(col => {
                entities.push({
                    type: 'column',
                    value: col,
                    source: 'dataset.columns'
                });
            });

            // 2. Extract Target variable
            const targetCol = analysisPlan?.targetColumn || profile?.targetCandidates?.[0]?.name;
            if (targetCol && (lowerText.includes('target') || lowerText.includes('هدف') || lowerText.includes(targetCol.toLowerCase()))) {
                if (!entities.some(e => e.type === 'target' && e.value === targetCol)) {
                    entities.push({
                        type: 'target',
                        value: targetCol,
                        source: 'analysisPlan.targetColumn'
                    });
                }
            }

            // 3. Extract Models
            const leaderboard = analytics?.machineLearning?.leaderboard || analytics?.leaderboard || [];
            const modelNames = leaderboard.map(m => m.name || m.modelName).filter(Boolean);
            modelNames.forEach(name => {
                const nameLower = name.toLowerCase();
                const baseName = nameLower.replace(/\s+(?:regressor|classifier|regression|model)\b/gi, '').trim();
                if (lowerText.includes(nameLower) || (baseName.length > 2 && lowerText.includes(baseName))) {
                    if (!entities.some(e => e.type === 'model' && e.value === name)) {
                        entities.push({
                            type: 'model',
                            value: name,
                            source: 'analytics.machineLearning'
                        });
                    }
                }
            });

            // Generic model references
            if (entities.filter(e => e.type === 'model').length === 0) {
                if (lowerText.includes('random forest') || lowerText.includes('rf')) {
                    entities.push({ type: 'model', value: 'Random Forest', source: 'generic' });
                } else if (lowerText.includes('ridge')) {
                    entities.push({ type: 'model', value: 'Ridge Regression', source: 'generic' });
                } else if (lowerText.includes('logistic')) {
                    entities.push({ type: 'model', value: 'Logistic Regression', source: 'generic' });
                } else if (lowerText.includes('decision tree') || lowerText.includes('dt')) {
                    entities.push({ type: 'model', value: 'Decision Tree', source: 'generic' });
                } else if (lowerText.includes('best model') || lowerText.includes('الموديل الأفضل') || lowerText.includes('أفضل موديل')) {
                    const best = analytics?.machineLearning?.winner?.name || leaderboard[0]?.name;
                    if (best) {
                        entities.push({ type: 'model', value: best, isBest: true, source: 'leaderboard.winner' });
                    }
                }
            }

            // 4. Extract Risks & Opportunities
            const risks = Array.isArray(decisionIntelligence?.risks)
                ? decisionIntelligence.risks
                : (decisionIntelligence?.risks?.rankedRisks || []);
            risks.forEach(r => {
                const title = r.title || r.name || '';
                if (title && lowerText.includes(title.toLowerCase())) {
                    entities.push({ type: 'risk', value: title, id: r.id, source: 'decisionIntelligence.risks' });
                }
            });

            const opps = Array.isArray(decisionIntelligence?.opportunities)
                ? decisionIntelligence.opportunities
                : (decisionIntelligence?.opportunities?.rankedOpportunities || []);
            opps.forEach(o => {
                const title = o.title || o.name || '';
                if (title && lowerText.includes(title.toLowerCase())) {
                    entities.push({ type: 'opportunity', value: title, id: o.id, source: 'decisionIntelligence.opportunities' });
                }
            });

            // 5. Extract Versions
            if (lowerText.includes('previous') || lowerText.includes('سابقة') || lowerText.includes('قبل كده') || lowerText.includes('قبلها')) {
                entities.push({ type: 'version', value: 'previous' });
            } else if (lowerText.includes('baseline') || lowerText.includes('أساس') || lowerText.includes('خط الأساس')) {
                entities.push({ type: 'version', value: 'baseline' });
            } else if (lowerText.includes('current') || lowerText.includes('حالية') || lowerText.includes('الآن') || lowerText.includes('دلوقتي')) {
                entities.push({ type: 'version', value: 'current' });
            }

            // 6. Extract Magnitudes / Percentages (for What-if simulations)
            // e.g. "10%", "+20%", "زاد 15%", "انخفض 5"
            const percentMatch = lowerText.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
            if (percentMatch) {
                const pct = parseFloat(percentMatch[1]);
                let direction = pct >= 0 ? 'increase' : 'decrease';
                if (lowerText.includes('انخفض') || lowerText.includes('نقص') || lowerText.includes('قل') || lowerText.includes('decrease') || lowerText.includes('drop')) {
                    direction = 'decrease';
                }
                entities.push({
                    type: 'magnitude',
                    percentage: Math.abs(pct),
                    direction: direction,
                    raw: percentMatch[0]
                });
            }

            // 7. Extract Temporal / Month Filters
            // e.g. "شهر 1", "شهر يناير", "month 1", "January", "شهر 12", "شهر 5", etc.
            const ARABIC_DIGIT_MAP = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
            const normalizeArabicDigits = (str) => String(str || '').replace(/[٠-٩]/g, d => ARABIC_DIGIT_MAP[d] !== undefined ? ARABIC_DIGIT_MAP[d] : d);
            const normalizedText = normalizeArabicDigits(lowerText);

            let extractedMonth = null;
            let monthLabelAr = null;
            let monthLabelEn = null;

            const AR_MONTH_ITEMS = [
                { num: 1, names: ['يناير', 'شهر 1', 'شهر 01', 'شهر واحد', 'الشهر الاول', 'الشهر الأول'], ar: 'شهر 1 (يناير)', en: 'Month 1 (January)' },
                { num: 2, names: ['فبراير', 'شهر 2', 'شهر 02', 'شهر اثنين', 'الشهر الثاني'], ar: 'شهر 2 (فبراير)', en: 'Month 2 (February)' },
                { num: 3, names: ['مارس', 'شهر 3', 'شهر 03', 'شهر ثلاثة', 'الشهر الثالث'], ar: 'شهر 3 (مارس)', en: 'Month 3 (March)' },
                { num: 4, names: ['ابريل', 'أبريل', 'شهر 4', 'شهر 04', 'شهر اربعة', 'شهر أربعة', 'الشهر الرابع'], ar: 'شهر 4 (أبريل)', en: 'Month 4 (April)' },
                { num: 5, names: ['مايو', 'شهر 5', 'شهر 05', 'شهر خمسة', 'الشهر الخامس'], ar: 'شهر 5 (مايو)', en: 'Month 5 (May)' },
                { num: 6, names: ['يونيو', 'شهر 6', 'شهر 06', 'شهر ستة', 'الشهر السادس'], ar: 'شهر 6 (يونيو)', en: 'Month 6 (June)' },
                { num: 7, names: ['يوليو', 'شهر 7', 'شهر 07', 'شهر سبعة', 'الشهر السابع'], ar: 'شهر 7 (يوليو)', en: 'Month 7 (July)' },
                { num: 8, names: ['اغسطس', 'أغسطس', 'شهر 8', 'شهر 08', 'شهر ثمانية', 'الشهر الثامن'], ar: 'شهر 8 (أغسطس)', en: 'Month 8 (August)' },
                { num: 9, names: ['سبتمبر', 'شهر 9', 'شهر 09', 'شهر تسعة', 'الشهر التاسع'], ar: 'شهر 9 (سبتمبر)', en: 'Month 9 (September)' },
                { num: 10, names: ['اكتوبر', 'أكتوبر', 'شهر 10', 'شهر عشرة', 'الشهر العاشر'], ar: 'شهر 10 (أكتوبر)', en: 'Month 10 (October)' },
                { num: 11, names: ['نوفمبر', 'شهر 11', 'الشهر الحادي عشر'], ar: 'شهر 11 (نوفمبر)', en: 'Month 11 (November)' },
                { num: 12, names: ['ديسمبر', 'شهر 12', 'الشهر الثاني عشر'], ar: 'شهر 12 (ديسمبر)', en: 'Month 12 (December)' }
            ];

            const EN_MONTH_ITEMS = [
                { num: 1, names: ['january', 'jan', 'month 1', 'month 01'], ar: 'شهر 1 (يناير)', en: 'Month 1 (January)' },
                { num: 2, names: ['february', 'feb', 'month 2', 'month 02'], ar: 'شهر 2 (فبراير)', en: 'Month 2 (February)' },
                { num: 3, names: ['march', 'mar', 'month 3', 'month 03'], ar: 'شهر 3 (مارس)', en: 'Month 3 (March)' },
                { num: 4, names: ['april', 'apr', 'month 4', 'month 04'], ar: 'شهر 4 (أبريل)', en: 'Month 4 (April)' },
                { num: 5, names: ['may', 'month 5', 'month 05'], ar: 'شهر 5 (مايو)', en: 'Month 5 (May)' },
                { num: 6, names: ['june', 'jun', 'month 6', 'month 06'], ar: 'شهر 6 (يونيو)', en: 'Month 6 (June)' },
                { num: 7, names: ['july', 'jul', 'month 7', 'month 07'], ar: 'شهر 7 (يوليو)', en: 'Month 7 (July)' },
                { num: 8, names: ['august', 'aug', 'month 8', 'month 08'], ar: 'شهر 8 (أغسطس)', en: 'Month 8 (August)' },
                { num: 9, names: ['september', 'sep', 'sept', 'month 9', 'month 09'], ar: 'شهر 9 (سبتمبر)', en: 'Month 9 (September)' },
                { num: 10, names: ['october', 'oct', 'month 10'], ar: 'شهر 10 (أكتوبر)', en: 'Month 10 (October)' },
                { num: 11, names: ['november', 'nov', 'month 11'], ar: 'شهر 11 (نوفمبر)', en: 'Month 11 (November)' },
                { num: 12, names: ['december', 'dec', 'month 12'], ar: 'شهر 12 (ديسمبر)', en: 'Month 12 (December)' }
            ];

            for (const item of AR_MONTH_ITEMS) {
                if (item.names.some(n => normalizedText.includes(n))) {
                    extractedMonth = item.num;
                    monthLabelAr = item.ar;
                    monthLabelEn = item.en;
                    break;
                }
            }

            if (!extractedMonth) {
                for (const item of EN_MONTH_ITEMS) {
                    if (item.names.some(n => {
                        const reg = new RegExp(`\\b${escapeRegExp(n)}\\b`, 'i');
                        return reg.test(normalizedText);
                    })) {
                        extractedMonth = item.num;
                        monthLabelAr = item.ar;
                        monthLabelEn = item.en;
                        break;
                    }
                }
            }

            if (!extractedMonth) {
                const monthRegexAr = /(?:شهر|الشهر)\s*([1-9]|1[0-2])\b/i;
                const mMatchAr = normalizedText.match(monthRegexAr);
                if (mMatchAr) {
                    const num = parseInt(mMatchAr[1], 10);
                    if (num >= 1 && num <= 12) {
                        extractedMonth = num;
                        const ref = AR_MONTH_ITEMS.find(m => m.num === num);
                        monthLabelAr = ref?.ar || `شهر ${num}`;
                        monthLabelEn = ref?.en || `Month ${num}`;
                    }
                }
            }

            if (extractedMonth) {
                entities.push({
                    type: 'temporal_filter',
                    filterType: 'month',
                    month: extractedMonth,
                    labelAr: monthLabelAr,
                    labelEn: monthLabelEn,
                    source: 'user_message.temporal_filter'
                });
            }

            // 8. Extract Shift / Segment Filters
            const shiftMatch = normalizedText.match(/(?:وردية|الوردية|shift)\s*([a-zA-Z0-9\u0621-\u064A]+)/i);
            if (shiftMatch) {
                const shiftVal = shiftMatch[1].trim();
                entities.push({
                    type: 'segment_filter',
                    filterType: 'shift',
                    value: shiftVal,
                    labelAr: `وردية ${shiftVal}`,
                    labelEn: `Shift ${shiftVal}`,
                    source: 'user_message.segment_filter'
                });
            }

            // 9. Resolve Implicit Anaphora from ConversationState if zero entities extracted
            if (entities.length === 0 && window.UDIP?.Copilot?.ConversationState) {
                const implicit = window.UDIP.Copilot.ConversationState.resolveImplicitEntity();
                if (implicit) {
                    entities.push({
                        ...implicit,
                        isImplicit: true
                    });
                }
            }

            // 8. Ambiguity Check:
            // e.g. bare "قارن X" or "compare X" where X has multiple interpretations or lacks comparison target
            const isBareComparison = /^قارن\s+[\w\u0600-\u06FF-]+\s*[؟?]?$/i.test(lowerText.trim()) || /^compare\s+[\w-]+\s*[?]?$/i.test(lowerText.trim());
            if (matchedCols.length === 1 && isBareComparison) {
                ambiguous = true;
                clarifications.push({
                    entity: matchedCols[0],
                    question: `تقارن ${matchedCols[0]} من أي ناحية؟`,
                    options: [
                        `الأداء والتوزيع (Distribution)`,
                        `العلاقة مع المتغير الهدف (Target Correlation)`,
                        `النسخة الحالية مقابل السابقة (Historical Comparison)`,
                        `أهمية المتغير في النماذج (Feature Importance)`
                    ]
                });
            }

            return {
                entities,
                ambiguous,
                clarifications
            };
        }
    };

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.EntityExtractor = EntityExtractor;

})(typeof window !== 'undefined' ? window : global);
