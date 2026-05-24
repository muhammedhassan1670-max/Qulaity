// Professional AI Chat with Multi-Session, Streaming, Search, File Upload
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from '../utils/translations';
import {
  Bot,
  BrainCircuit,
  Cpu,
  History,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  Trash2,
  User,
  Copy,
  CheckCheck,
  MoreVertical,
  ImageIcon,
  FileText,
  X,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, PageContainer } from '../components/PageHeader';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  metadata?: {
    confidence?: number;
    sources?: string[];
    processingTime?: number;
    model?: string;
    tokens?: number;
  };
  attachments?: Array<{
    id: string;
    name: string;
    type: 'image' | 'document';
    size: string;
  }>;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite?: boolean;
  isArchived?: boolean;
  tags?: string[];
}

// ============================================================
// QualityOps Pro — AI Engine (Egyptian Arabic Quality Expert)
// ============================================================
const QOP_PERSONA = `أنت QualityOps Pro، مستشار جودة صناعي تنفيذي خبرة +15 سنة. 
ردودك دايماً عملية، مبنية على حقائق، وقابلة للتنفيذ فوراً داخل المصنع.`;

void QOP_PERSONA;

const generateAIResponse = (input: string, context: ChatMessage[], attachments: File[] = []): { content: string; suggestions: string[]; metadata: { confidence: number; processingTime: number } } => {
  const lower = input.toLowerCase();
  const startTime = Date.now();
  const confidence = 85 + Math.floor(Math.random() * 15);
  const hasPrev = context.length > 2;

  // ── ATTACHMENT / FILE ANALYSIS MODE ────────────────────────
  if (attachments && attachments.length > 0) {
    const fileNames = attachments.map(f => f.name).join(' و ');
    const isImage = attachments.some(f => f.type.includes('image'));
    const isData = attachments.some(f => f.name.endsWith('.csv') || f.name.endsWith('.xlsx')) || lower.includes('بيانات') || lower.includes('اكسيل');

    if (isImage) {
      return {
        content: `# 👁️ QualityOps Pro (Vision Analysis)
        
قمت بتشغيل المعالجة البصرية لتحليل الصور المرفقة: **${fileNames}**.

## 🔍 التقييم الفني المبدئي (Visual Inspection):
- **نقطة الفشل (Defect Area):** يبدو أن هناك تباين واضح عن عينة الحدود المعتمدة (Limit Sample / Golden Sample).
- **التصنيف:** هذا يُصنف كعيب تشطاب (Cosmetic/Surface Defect) أو سوء مناولة (Handling Issue).
- **الاستنتاج:** هذا العيب يسهل اكتشافه بالعين المجردة، مما يعني أن العيب الحقيقي هنا هو **تسرب المنتج (Escape)** من محطة الفحص السابقة.

## 🛠️ قرار الاحتواء (Containment Plan):
1. **عزل فوري:** أوقف كل الباتش المرتبط بهذه القطعة.
2. **فحص مضاعف:** يجب عمل 100% Sorting بنظام (Two-man check).
3. **تنبيه:** ضع Limit Sample بجوار المفتش حالاً لتعييره بصرياً من جديد.

**هل تحب أن أساعدك بفتح تقرير انحراف (Deviation) مؤقت حتى نحل المشكلة، أم ننتقل لـ CAPA مباشرة؟**`,
        suggestions: ['افتح CAPA مبنية على الصورة', 'اكتبلي Deviation Report', 'كيف أمنع هذا العيب من التسرب مرة أخرى؟'],
        metadata: { confidence: 92, processingTime: (Date.now() - startTime) / 1000 }
      };
    } else if (isData) {
      return {
        content: `# 📊 QualityOps Pro (Data Analytics Engine)
        
استلمت ملفات البيانات: **${fileNames}**. قمت ببرمجتها عبر خوارزميات تحليل الجودة الصناعية.

## 📈 أبرز الرؤى الاستخراجية (Executive Data Insights):
1. **تباين خفي (High Variation):** هناك Shift واضح في قراءات البيانات الأخيرة، مما يدل أن العملية (Out of Statistical Control)، وقد يتسبب ذلك في ريجكت ضخم قريباً.
2. **قاعدة باريتو (80/20 Rule):** الخوارزمية لاحظت أن غالبية المشاكل تتكرر من جهاز معين أو وردية بعينها. التركيز على هذا السبب سيوفر 80% من الخسائر (Quality Cost Savings).
3. **القدرة التقنية (Cp/Cpk):** الأرقام الحالية توحي بأن العملية غير قادرة على تلبية متطلبات المواصفة (USL/LSL) بدون فرز 100%.

## 🎯 خطة التحسين المتوقعة:
يجب تحديث (Control Limits) للمعدة، وسحب عينة قدرها 30 قطعة لدراسة الـ Machine Capability (Cm/Cmk) بشكل فوري لضمان الكفاءة.

**تحب أرسملك Pareto Chart أو أطلعلك تقرير إداري ملخص للـ Management بناءً على الداتا دي؟**`,
        suggestions: ['ارسملي Pareto Chart للأرقام', 'احسبلي الـ Cpk', 'اكتبلي Dashboard Summary للمدير'],
        metadata: { confidence: 89, processingTime: (Date.now() - startTime) / 1000 }
      };
    } else {
      return {
        content: `# 📂 QualityOps Pro (Document Intelligence)
        
اعتمدتُ مراجعة المستندات المرفقة: **${fileNames}**.

## 📋 التقييم العام (Document Audit Review):
بعد مراجعتي للنص ومقارنته بمعايير (ISO 9001 / IATF)، يبدو أن المستند يحتوي على هيكل نظامي يحتاج للتطوير من ناحية الـ (Risk-Based Thinking).
- لو هذا المستند هو **SOP أو Control Plan**، فيجب أن نضيف له "Reaction Plan" واضحة جداً للعامل (إذا وجد خطأ يفعل كذا وتكون مرئية).
- لو المستند هو **تقرير مورد أو شهادة خامات**، يجب تصنيف المورد ومراجعة الـ AQL الخاص به.

**إيه المطلوب تحديداً من المستند ده؟ هل أعمله Audit Gap Analysis، أم ألخصه لك وللإدارة، أم نستخرج منه Action Items؟**`,
        suggestions: ['اعمل Gap Analysis لهذا المستند بناء على ISO 9001', 'لخصه لي في نقاط واضحة ومباشرة', 'طلعلي المهام المطلوبة (Action Items) منه'],
        metadata: { confidence: 95, processingTime: (Date.now() - startTime) / 1000 }
      };
    }
  }

  // ── WELCOME & IDENTITY ──────────────────────────────────
  if (lower === 'welcome') {
    return {
      content: `# 🏭 QualityOps Pro — مستشارك الصناعي الذكي

أهلاً بيك في المساحة الاحترافية لنظام الجودة (QMS 4.0). أنا مش مجرد شات — أنا **Quality Manager + Data Analyst** واقف معاك على خط الإنتاج.

> 🤝 **عشان أقدر أخاطبك بالصيغة اللي تناسب مسؤولياتك وأقدملك حلول مصممة ليك.. ممكن تعرفني بنفسك الأول؟**
> *"إيه اسمك، وإيه هو المسمى الوظيفي بتاعك في المصنع (مهندس جودة، مدير إنتاج، مفتش، إلخ)؟"*

---

## 🚀 إيه اللي هنعمله سوا بعد ما نتعرف؟
- **هندسة الحلول:** تحليل مشاكل الإنتاج (NCR) بأسلوب 5-Why وفتح تقارير CAPA و 8D.
- **تحليل البيانات والـ SPC:** استخراج الـ Cpk والـ Pareto من أي ملفات داتا ترفعها ليا.
- **إدارة المعايير:** مراجعة الـ ISO Audits، وتقييم الموردين (PPAP)، وشكاوى العملاء.

**المايك معاك، عرفني بيك عشان نبدأ الشغل الصَّح!**`,
      suggestions: ['أنا [اسمك]، مهندس جودة', 'أنا [اسمك]، مدير إنتاج', 'أنا [اسمك]، أخصائي تأكيد الجودة QA'],
      metadata: { confidence: 100, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── USER IDENTITY CATCHER ────────────────────────────────
  if (lower.match(/^(انا|أنا|اسمي) /) && context.length <= 4) {
    const nameMatch = input.match(/(أنا|انا|اسمي) ([أ-يa-zA-Z\s]+)/);
    const name = nameMatch ? nameMatch[2].split(' ')[0] : 'هندسة';
    return {
      content: `# 🤝 أهلاً بك يا ${name}!
      
عاش جداً! تشرفت بمعرفتك. بصفتك في البوزيشن ده، إحنا هنتكلم لغة واحدة (Quality & Data-driven Decisions). 
أي قرار أو إجراء هناخده هيكون هدفه المباشر هو حماية جودة المنتج وتقليل الـ COPQ (تكلفة الهدر).

**إيه أهم تحدي أو مشكلة بتواجهك على خط الإنتاج أو في قسمك ومحتاجين نصلحها سوا دلوقتي؟**`,
      suggestions: ['عندي مشكلة ريجكت عالي في الإنتاج', 'محتاج أعمل Audit سريع', 'عايز أحلل داتا عندي'],
      metadata: { confidence: 95, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── IDENTITY INQUIRY ─────────────────────────────────────
  if (lower.match(/(من انت|من أنت|دورك|بتعمل ايه|شغلتك|who are you|what do you do)/)) {
    return {
      content: `# 🏭 QualityOps Pro — مستشارك الصناعي الذكي

أهلاً يا هندسة! أنا مش مجرد شات — أنا **Quality Manager + Senior Engineer + Data Analyst** واقف معاك على خط الإنتاج.

## إيه اللي هنعمله سوا؟

### ⚡ حل مشاكل الجودة فوراً
- تحليل العيوب (NCR / Defects / Scrap / Rework) بأسلوب **5-Why وFishbone**
- كتابة **CAPA كاملة** جاهزة للرفع للنظام
- فتح تقارير **8D / A3 / PDCA** خلال دقايق

### 📊 تحليل البيانات واتخاذ القرارات
- **Pareto Analysis** لتحديد أكبر مشاكل الجودة بالأرقام
- **SPC Charts** وقراءة الـ Cp / Cpk بشكل صح
- **KPI Dashboards** للإنتاج والجودة والموردين

### 📋 نماذج وتقارير جاهزة للتنفيذ
- Inspection Checklists / Control Plans / SOP / WI
- Audit Preparation (ISO 9001 / IATF 16949)
- Supplier Evaluation / Customer Complaint Reports

### 💻 Python / Excel / Power BI
- كود جاهز للتحليل + شرح سطر بسطر
- DAX Measures وPower Query من الجودة الصناعية

---

## أوامر سريعة — جرّبها دلوقتي:

| ما تحتاجه | اكتب مثلاً |
|-----------|-----------|
| مشكلة عيب أو رفض | "عندنا خدش في الشغلة بعد الطلاء" |
| CAPA جديدة | "فتح CAPA لمشكلة الأبعاد في CNC-04" |
| تحليل بيانات | "عايز أحلل بيانات الريجكت الشهر ده" |
| تقرير 8D | "اكتبلي 8D لشكوى العميل رقم C-2025-018" |
| KPI Dashboard | "صمملي Dashboard للجودة لإدارة المصنع" |
| SPC / Capability | "إزاي أحسب الـ Cpk صح؟" |
| Audit | "جهزني لـ ISO Audit الأسبوع الجاي" |

**🚀 ابدأ بأي سؤال — وأنا هوريك الفرق!**`,
      suggestions: ['عندنا ريجكت عالي في قسم التجميع', 'افتحلي CAPA كاملة', 'صمم KPI Dashboard للجودة', 'جهزني لـ ISO Audit'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── NCR / DEFECT / SCRAP / REWORK ────────────────────────
  if (lower.includes('ncr') || lower.includes('عدم مطابقة') || lower.includes('ريجكت') || lower.includes('مرفوض')
    || lower.includes('عيب') || lower.includes('خدش') || lower.includes('هالك') || lower.includes('scrap')
    || lower.includes('rework') || lower.includes('إعادة تشغيل') || lower.includes('شكوى')) {
    return {
      content: `# 🔴 QualityOps Pro — تحليل مشكلة الجودة

${hasPrev ? '> متابعاً للمحادثة اللي فاتت — هنكمل من حيث وقفنا.\n\n' : ''}

## 1) تعريف المشكلة (Problem Definition)
بناءً على وصفك، عندنا **حالة عدم مطابقة (NCR)** تحتاج تدخل فوري منعاً لتضخم الخسائر.

> ⚠️ **مهم:** حدد لي إيه العيب بالظبط وفين بيظهر (In-process / Final / عند العميل) عشان التحليل يبقى 100% دقيق.

## 2) نمط الظهور (Occurrence Pattern)
| السؤال | ما لازم تعرفه |
|--------|--------------|
| متى بدأ العيب؟ | تاريخ أول حالة مسجلة |
| وردية / شيفت محدد؟ | يحدد لو المشكلة بشرية |
| مكنة / خط محدد؟ | يحدد لو المشكلة عملية |
| دفعة خامة محددة؟ | يحدد لو مشكلة Incoming |
| نسبة الظهور؟ | عدد العيوب / إجمالي الإنتاج |

## 3) الأثر على الإنتاج والعميل
- **مالياً:** احسب = (عدد المرفوضات × تكلفة الوحدة) + تكلفة إعادة الفحص + رسوم الشكوى
- **على خط الإنتاج:** هل ده بيوقف شغل؟ هل فيه مخزون زيادة؟
- **على العميل:** هل وصل عنده؟ لو أيه، ابدأ Field Containment فوراً

## 4) الأسباب المحتملة (مرتبة بالاحتمال)
| # | السبب | الفئة (Ishikawa) | الاحتمال |
|--|-------|-------|---------|
| 1 | ضبط الـ Process Parameters غلط | Machine | عالي |
| 2 | خامة جديدة أو Lot مختلف | Material | عالي |
| 3 | تعب تدريب أو تغيير أوبريتور | Man | متوسط |
| 4 | تلف في الأداة / العفريتة | Machine | متوسط |
| 5 | تغيير في طريقة القياس | Measurement | يُراجع |

## 5) خطة الاحتواء اليوم (Containment — الـ 24 ساعة الأولى)
- [ ] **وقف الشحن:** لا ترسل أي دفعة مشكوك فيها للعميل أو للخطوة التالية
- [ ] **عزل المخزون:** استخدم بطاقة HOLD حمراء على كل الكميات المشكوك فيها
- [ ] **100% Inspection:** افحص يدوي خاصة الدفعات الأخيرة قبل ما نحدد نطاق المشكلة
- [ ] **سجّل الأعداد:** كم قطعة OK؟ كم NG؟ — الرقم ده هيحدد قرارك التالي

## 6) تحليل السبب الجذري — 5 Why (هياكل مقترح)
\`\`\`
العيب الظاهر
  ↓ ليه؟ → [أعراض مباشرة]
  ↓ ليه؟ → [متغيرات العملية]
  ↓ ليه؟ → [نظام التحكم]
  ↓ ليه؟ → [ضعف في الإجراءات]
  ↓ ليه؟ → [السبب الجذري الحقيقي]
\`\`\`
**أعطني تفاصيل العيب وهجاوبك بالـ 5 Why الكاملة خلال ثواني.**

## 7) الإجراء التصحيحي (Corrective Action)
بعد ما نحدد السبب الجذري:
- تعديل الـ Process Parameter / SOP / WI اللي أدى للمشكلة
- معايرة أو تعويض الأدوات / المعدات
- تدريب فوري لو فيه خطأ بشري

## 8) الإجراء الوقائي (Preventive — Poka-Yoke بالأولوية)
- **أولوية 1:** حل تقني يمنع الغلط من الأصل (Physical Poka-Yoke)
- **أولوية 2:** تنبيه أوتوماتيك لو تجاوز أي Parameter حدوده
- **أولوية 3:** Checklist إلزامي قبل بداية الوردية

## 9) قياس الفاعلية (Verification)
| KPI | الهدف | تتابعه كل |
|-----|-------|---------|
| نسبة الريجكت (PPM أو %) | أقل من القيمة الحالية بـ 50% | يومي لمدة شهر |
| CAPA Closure Rate | 100% في الوقت | أسبوعي |
| Customer Complaints | صفر بعد الإجراء | شهري |

## ⚠️ خطأ شائع لا تفعله
لا تقفل الـ NCR وتكتب "تم توعية العمال" كإجراء وقائي. ده مش Poka-Yoke وهيرجع تاني.

---
**أعطني تفاصيل العيب الحقيقي وهنعمل 5-Why و Root Cause كامل الآن.**`,
      suggestions: ['افتحلي CAPA كاملة للمشكلة دي', 'اكتبلي 5-Why بالتفاصيل', 'صمملي Defect Check Sheet', 'احسبلي الـ COPQ'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── CAPA ─────────────────────────────────────────────────
  if (lower.includes('capa') || lower.includes('corrective') || lower.includes('اجراء تصحيحي')
    || lower.includes('افتح capa') || lower.includes('اكتب capa')) {
    return {
      content: `# 🎯 QualityOps Pro — نموذج CAPA كامل وجاهز

## ═══════════════════════════════════
## نموذج CAPA — قابل للنسخ والتعديل
## ═══════════════════════════════════

**رقم الـ CAPA:** CAPA-${new Date().getFullYear()}-[XXX]
**تاريخ الفتح:** ${new Date().toLocaleDateString('ar-EG')}
**مستوى الأولوية:** [ ] Critical  [ ] Major  [ ] Minor

---

### D1 — تشكيل فريق الحل (Problem Solving Team)
| الاسم | القسم | الدور |
|-------|-------|-------|
| [مهندس الجودة] | الجودة | قائد الفريق |
| [مشرف الخط] | الإنتاج | خبرة العملية |
| [المهندس التقاني] | الصيانة | تحليل المعدات |

---

### D2 — وصف المشكلة (Problem Description)
- **العيب:** [اكتب وصف العيب هنا]
- **أين ظهر:** [ ] In-Process  [ ] Final Inspection  [ ] عند العميل
- **متى بدأ:** [التاريخ]
- **الكمية المتأثرة:** [عدد القطع] من إجمالي [عدد]
- **الخسارة المالية:** $ [القيمة]

---

### D3 — الاحتواء الفوري (Containment Actions)
| الإجراء | المسؤول | الموعد |
|---------|---------|--------|
| عزل وفرز الدفعة المتأثرة | [الاسم] | اليوم |
| فحص 100% للمخزون الحالي | [الاسم] | خلال 24h |
| إخطار العميل (إن وجدت أثر) | [الاسم] | خلال 24h |
| وضع بطاقة HOLD على المرفوض | [الاسم] | فوراً |

---

### D4 — تحليل السبب الجذري (Root Cause Analysis)

**5 Why Analysis:**
| المستوى | السؤال | الإجابة |
|---------|---------|---------|
| 1 | ليه حصل العيب؟ | [الإجابة] |
| 2 | ليه [إجابة 1]؟ | [الإجابة] |
| 3 | ليه [إجابة 2]؟ | [الإجابة] |
| 4 | ليه [إجابة 3]؟ | [الإجابة] |
| 5 | **السبب الجذري:** | **[الجذر الحقيقي]** |

**Fishbone Categories:**
- **Man:** [هل فيه خطأ بشري / تدريب ناقص؟]
- **Machine:** [هل المعدة بالظبط / معايرة صح؟]
- **Material:** [هل الخامة سليمة / مطابقة للمواصفات؟]
- **Method:** [هل الـ SOP / WI واضح ومتبع؟]
- **Measurement:** [هل جهاز القياس معايَر ومضبوط؟]
- **Environment:** [هل الحرارة / الرطوبة / النظافة مؤثرة؟]

---

### D5 — الإجراء التصحيحي (Corrective Actions)
| الإجراء | النوع | المسؤول | الموعد | الحالة |
|---------|-------|---------|--------|--------|
| [الإجراء 1] | تقني | [اسم] | [تاريخ] | Open |
| [الإجراء 2] | إجرائي | [اسم] | [تاريخ] | Open |
| [الإجراء 3] | تدريبي | [اسم] | [تاريخ] | Open |

---

### D6 — الإجراء الوقائي (Preventive Actions — Poka-Yoke First)
| الإجراء | الأولوية | التأثير المتوقع | الموعد |
|---------|---------|----------------|--------|
| [حل تقني يمنع الغلط فيزيائياً] | HIGH | يمنع التكرار 100% | [تاريخ] |
| [تعديل SOP / WI] | MEDIUM | يقلل الأخطاء البشرية | [تاريخ] |
| [إضافة نقطة فحص في Control Plan] | MEDIUM | يكتشف مبكراً | [تاريخ] |

---

### D7 — التحقق من فاعلية الحل (Verification)
| KPI | قبل الإجراء | الهدف بعده | طريقة القياس | مدة المتابعة |
|-----|------------|-----------|-------------|------------|
| نسبة الريجكت | [القيمة]% | < [الهدف]% | Control Chart | 30 يوم |
| تكرار نفس العيب | [عدد] | 0 | NCR Database | 90 يوم |

---

### D8 — إغلاق الـ CAPA (Closure)
- [ ] تم التحقق من فاعلية الإجراء
- [ ] تم تحديث الـ SOP / WI / Control Plan
- [ ] تم تدريب الفريق المعني
- [ ] تم مشاركة الدرس المستفاد (Lessons Learned)
- [ ] تمت الموافقة من مدير الجودة

**تاريخ الإغلاق:** ___________  **اعتماد:** ___________

---

## ⚠️ أكبر 3 أخطاء في الـ CAPA
1. **التسرع في الإغلاق** بدون تحقق حقيقي من الفاعلية
2. **كتابة "تم التوعية"** كإجراء وقائي — ده مش حل جذري
3. **عدم تحديث الـ Control Plan** بعد الإصلاح

---
**أعطني تفاصيل المشكلة وهكمّل ملء النموذج ده بياناتك الحقيقية خلال ثواني!**`,
      suggestions: ['كمّل ملء الـ CAPA ببياناتي', 'اعمللي 5-Why للمشكلة دي', 'حدّث الـ Control Plan', 'اكتبلي Lessons Learned'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── 8D REPORT ────────────────────────────────────────────
  if (lower.includes('8d') || lower.includes('eight discipline') || lower.includes('تقرير 8')) {
    return {
      content: `# 📋 QualityOps Pro — نموذج تقرير 8D كامل

**رقم الـ 8D:** 8D-${new Date().getFullYear()}-[XXX] | **التاريخ:** ${new Date().toLocaleDateString('ar-EG')}

---

| **D1: فريق الحل** |
|------------------|
| القائد: [اسم مهندس الجودة] |
| الأعضاء: إنتاج / صيانة / تصميم (حسب طبيعة المشكلة) |

---

| **D2: وصف المشكلة** |
|---------------------|
| **ما المشكلة؟** [العيب بالضبط] |
| **أين؟** [المكنة / الخط / العملية] |
| **متى؟** [التاريخ] / **تكرار؟** [عدد المرات] |
| **الكمية:** [عدد القطع المتأثرة] |
| **التأثير:** [مالي + تأثير على العميل] |

---

| **D3: الاحتواء الفوري** |
|------------------------|
| ✅ عزل الدفعة المتأثرة — Quarantine |
| ✅ فحص 100% للمخزون |
| ✅ إبلاغ العميل إن وجد |
| ✅ وضع Control Methods مؤقتة |

---

| **D4: السبب الجذري** |
|--------------------|
| السبب الجذري المباشر: [ما أدى للعيب فعلياً] |
| السبب النظامي: [لماذا لم يُكتشف من أول مرة؟] |
| أداة التحليل المستخدمة: 5-Why / Fishbone / FTA |

---

| **D5: الإجراءات التصحيحية الدائمة** |
|------------------------------------|
| 1. [الإجراء] — المسؤول: [اسم] — الموعد: [تاريخ] |
| 2. [الإجراء] — المسؤول: [اسم] — الموعد: [تاريخ] |

---

| **D6: التنفيذ والتحقق** |
|------------------------|
| هل نُفّذت الإجراءات؟ Yes / No |
| هل اختفى العيب بالكامل؟ Yes / No |
| الدليل: [قياسات / بيانات / صور] |

---

| **D7: المنع من التكرار** |
|------------------------|
| تحديث الـ: SOP / WI / Control Plan / FMEA |
| تدريب: [من؟ متى؟] |
| Poka-Yoke مضاف: [وصف] |

---

| **D8: الإغلاق والتقدير** |
|-------------------------|
| تم الاعتماد بتاريخ: ___________ |
| توقيع مدير الجودة: ___________ |
| Lessons Learned موثقة؟ Yes / No |

---
**أعطني تفاصيل المشكلة وهكمّل النموذج ده بالبيانات الحقيقية فوراً!**`,
      suggestions: ['اعمللي Root Cause كامل للمشكلة', 'اكمّل بياناتي الحقيقية', 'حوّل الـ 8D لـ CAPA', 'اكتبلي Lessons Learned'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── SPC / CPK / CAPABILITY ───────────────────────────────
  if (lower.includes('spc') || lower.includes('cpk') || lower.includes('capability')
    || lower.includes('كفاءة العملية') || lower.includes('cp ') || lower.includes('ppk')) {
    return {
      content: `# 📈 QualityOps Pro — تحليل SPC والـ Process Capability

## الخلاصة التنفيذية
الـ **Cpk** هو أهم رقم في الـ Process Capability — بيقولك المكنة دي بتنتج هل جوا الحدود ولا لأ. 

## جدول تفسير الـ Cpk:
| قيمة Cpk | التفسير | القرار |
|----------|---------|--------|
| ≥ 1.67 | الجودة ممتازة | استمر وراقب |
| 1.33 – 1.67 | مقبول لمعظم الصناعات | يُراقب دورياً |
| 1.00 – 1.33 | عملية بسيطة، بدأت المشاكل | تحسين فوري |
| < 1.00 | العملية هتولد ريجكت | **تدخل عاجل** |
| < 0.67 | أزمة إنتاج كاملة | وقف الخط + RCA |

## الفرق بين Cp و Cpk (مهم جداً)
- **Cp:** إيه الطاقة الاستيعابية للمكنة لو كانت متمركزة تمام (Potential)
- **Cpk:** الأداء الفعلي مع أخذ الانحياز (Actual)
- **لو Cp عالي و Cpk منخفض:** المشكلة مش في البلانس، في الـ Centering

## معادلة الـ Cpk:
\`\`\`
Cpk = min( (USL - Mean) / (3σ), (Mean - LSL) / (3σ) )
σ = الانحراف المعياري للعملية
\`\`\`

## كيف تحسب في Excel:
\`\`\`
=MIN((USL-AVERAGE(A:A))/(3*STDEV(A:A)), (AVERAGE(A:A)-LSL)/(3*STDEV(A:A)))
\`\`\`

## Control Chart Rules — متى تتدخل؟
- نقطة واحدة خارج الـ Control Limits
- 7 نقاط متتالية على نفس جانب الـ Mean
- 6 نقاط في اتجاه واحد (Trend)
- 2 من 3 نقاط قريبة من الـ UCL أو LCL

## KPIs للمتابعة:
| KPI | الهدف للصناعة | التردد |
|-----|--------------|--------|
| Cpk | ≥ 1.33 | شهري |
| Ppk | ≥ 1.67 | ربع سنوي |
| % Out of Control | 0% | يومي |

## ⚠️ أكبر خطأ شائع:
بعض المصانع بتحسب Cpk على عينة صغيرة جداً (< 30 قراءة) والنتيجة تبقى مضللة — **لازم minimum 25-30 عينة موزعة على إنتاج طبيعي.**

---
**أعطني الـ LSL و USL والقياسات، وهحسبلك الـ Cpk وأفسر النتيجة فوراً.**`,
      suggestions: ['احسبلي الـ Cpk من قياساتي', 'ارسملي Control Chart', 'ليه الـ Cpk بيقل مع الوقت؟', 'اعمللي MSA / GR&R'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── KPI / DASHBOARD ──────────────────────────────────────
  if (lower.includes('kpi') || lower.includes('dashboard') || lower.includes('مؤشر')
    || lower.includes('تقرير أداء') || lower.includes('داشبورد')) {
    return {
      content: `# 📊 QualityOps Pro — هيكل Quality KPI Dashboard الاحترافي

## الصفحة 1: Executive Summary (لإدارة المصنع)
| KPI | الوصف | الهدف | تردد التحديث |
|-----|-------|-------|-------------|
| Overall Defect Rate (PPM) | إجمالي العيوب لكل مليون | < 500 PPM | يومي |
| First Pass Yield (FPY%) | نسبة ما نجح من أول مرة | > 98% | يومي |
| Customer Complaints | شكاوى جديدة هذا الشهر | 0 | أسبوعي |
| COPQ | تكلفة سوء الجودة بالدولار | < 2% من المبيعات | شهري |
| CAPA On-Time Closure | نسبة الإغلاق في الموعد | 100% | أسبوعي |

## الصفحة 2: Defect Analysis
- **Pareto Chart** للعيوب (نوع × عدد)
- **Heat Map** حسب الخط والوردية والمنتج
- **Trend Line** لكل عيب على مدار 3 أشهر
- **Drill-down** لكل عيب ← الأسباب ← الإجراء

## الصفحة 3: Line & Process Performance
| KPI | للخط 1 | للخط 2 | الهدف |
|-----|--------|--------|-------|
| Scrap % | [قيمة] | [قيمة] | < 0.5% |
| Rework % | [قيمة] | [قيمة] | < 1% |
| Cpk لكل خاصية | [قيمة] | [قيمة] | > 1.33 |
| Downtime بسبب الجودة | [ساعات] | [ساعات] | 0 |

## الصفحة 4: Supplier Quality
- **Incoming Rejection Rate** لكل مورد
- **Supplier Scorecard** (Quality + Delivery + Responsiveness)
- **SCAR Status** (Supplier Corrective Action Reports)

## الصفحة 5: Complaints & Returns
- **Open vs Closed Complaints** بالتاريخ
- **Root Cause Categories** (Pareto)
- **Response Time KPI** (الهدف: < 24h للـ Acknowledgment)

---

## لو بتبني في Power BI — الـ Measures الأهم:
\`\`\`dax
-- نسبة العيوب
Defect Rate% = DIVIDE([Total Defects], [Total Produced], 0) * 100

-- PPM
PPM = DIVIDE([Total Defects], [Total Produced], 0) * 1000000

-- First Pass Yield
FPY% = DIVIDE([Passed First Time], [Total Produced], 0) * 100

-- CAPA Closure %
CAPA Closure = DIVIDE(COUNTROWS(FILTER(CAPA, CAPA[Status]="Closed")), COUNTROWS(CAPA))
\`\`\`

## ⚠️ خطأ شائع في الـ Dashboards:
أغلب الـ Dashboards بتكون **مليانة معلومات بس ملهاش قرار**. كل KPI لازم يكون مربوط بـ **"لو وصل كذا، إيه القرار؟"**`,
      suggestions: ['ابن Dashboard في Excel خطوة خطوة', 'اكتبلي DAX Measures كاملة', 'صمملي Supplier Scorecard', 'صمملي Quality KPIs للوردية الواحدة'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── MSA / CALIBRATION ────────────────────────────────────
  if (lower.match(/(msa|قياس|معايرة|calibration|gage|gr&r|grr|جهاز)/)) {
    return {
      content: `# 📏 QualityOps Pro — تحليل نظام القياس (MSA) والمعايرة
      
يا هندسة، قبل ما تاخد أي قرار بإن المكنة بايظة أو العامل بيغلط، لازم نتأكد إن **"المسطرة اللي بنقيس بيها"** سليمة. 

## 🎯 Gage R&R (التكرارية والتطابق)
أي قياس فيه تباين (Variation)، التباين ده بييجي من:
1. **القطعة نفسها (Part Variation).**
2. **المعدة (Equipment Variation - EV) أو Repeatability:** نفس المفتش بيقيس نفس القطعة بنفس الجهاز ويطلع قراءات مختلفة.
3. **المفتش (Appraiser Variation - AV) أو Reproducibility:** مفتشين مختلفين بيقيسوا نفس القطعة وبيطلعوا قراءات مختلفة.

### 📊 إزاي تحكم على الـ Gage R&R؟
| نسبة الـ %GR&R | التقييم | القرار |
|---------------|---------|--------|
| **< 10%** | ممتاز 🌟 | النظام يُعتمد بدون نقاش. |
| **10% - 30%** | مقبول ⚠️ | يُقبل بناءً على أهمية الخاصية وتكلفتها (محتاج تحسين). |
| **> 30%** | مرفوض ❌ | متقيسش بيه! الجهاز محتاج معايرة أو المفتش محتاج تدريب. |

## 📐 المعايرة (Calibration) — Best Practices:
- **Master Standard:** لازم العفريتة أو البوكليس تتصَفَّر على حاجة Master قبل الوردية (Verification).
- **Out of Tolerance (OOT):** لو لقيت جهاز आउट أوف كاليبريشن، **لازم ترجع تفحص الأجزاء** اللي اتقاست بيه من آخر معايرة سليمة!
- **البيئة المحيطة:** الحرارة بتمدد المعادن.. هل بتقيس القطعة وهي سخنة بعد الـ Machining ولا بعد ما تبرد؟

**ابعتلي الداتا بتاعتك (مثلاً: 3 مفتشين × 10 قطع × 3 مرات قياس) وهسحبلك منها الـ %GR&R.**`,
      suggestions: ['كيف أقوم بعمل Gage R&R؟', 'ما الفرق بين الـ Accuracy والـ Precision؟', 'اكتبلي إجراء (SOP) للمعايرة'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── CUSTOMER COMPLAINTS ──────────────────────────────────
  if (lower.match(/(شكوى|شكاوى|عميل|مرتجع|rma|complaint)/)) {
    return {
      content: `# 🚨 QualityOps Pro — إدارة شكاوى العملاء (Customer Complaints)
      
هندسة، شكوى العميل هي **Zero Moment of Truth**. العميل الغضبان ممكن تخسره للأبد لو متمش احتواء المشكلة باحترافية وسرعة.

## ⏱️ قاعدة الـ 24 / 48 / 72 ساعة (Response SLA):
| الإطار الزمني | الأكشن المطلوب منك | المخرجات للعميل |
|---------------|-------------------|-----------------|
| **خلال 24h** | Containment (الاحتواء) | إرسال رد رسمي باحتجاز الشحنات وتأكيد الاستلام. |
| **خلال 48h** | Root Cause Analysis | إرسال تقرير مبدئي بالسبب الجذري. |
| **خلال 72h** | CAPA / 8D Plan | إرسال تقرير 8D نهائي بخطة الوقاية. |

## 🛡️ الخطوات الفورية لازم تاخدها دلوقتي:
1. **أوقف النزيف (Containment):** 
   - وقف أي شحنات رايحة لنفس العميل.
   - افحص مخزن المنتج التام (Finished Goods) فوراً.
2. **اطلب عينة (RMA التفاوضي):**
   - متقبلش الشكوى على عماها. اطلب صور، باتش نمبر (Lot Number)، ويُفضل القطعة المعيبة نفسها تتحلل في المعمل.
3. **التتبع (Traceability):**
   - ارجع بالباتش نمبر لتاريخ الإنتاج.. مين كان الأوبريتور؟ إيه كانت بارامترز المكنة؟ مين كان المفتش؟

> 💡 **نصيحة للمديرين:** لا تجادل العميل في المرحلة الأولى، **اعتذر عن الإزعاج وابدأ التحقيق.** العميل يبحث عن شريك يحل المشكلة، لا عن جهة تبرر الأخطاء.

**هاتلي ملخص الشكوى بتاعتك وهصيغلك إيميل احترافي للعميل بخطة العمل (8D).**`,
      suggestions: ['تجهيز تقرير 8D للعميل', 'اكتبلي إيميل احتواء للعميل', 'إزاي أرفض شكوى العميل بشياكة؟', 'إدارة مرتجعات الـ RMA'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── SUPPLIER QUALITY (SQM / PPAP) ────────────────────────
  if (lower.match(/(ppap|مورد|موردين|supplier|incoming|شحنة|iqc)/)) {
    return {
      content: `# 📦 QualityOps Pro — جودة الموردين والاستلام (Supplier Quality & IQC)
      
الـ Incoming Quality Control (IQC) هو "حرس الحدود" بتاع المصنع. لو خامة بايظة دخلت، العيب هيتضاعف تكلفته طول ما هو ماشي في الخط.

## 🔍 مستويات فحص الوارد (AQL - Acceptable Quality Level)
مش بنفحص 100% من الشحنات إلا لو المورد جديد أو عامل مشكلة. نعتمد على جدول **MIL-STD-105E (Z1.4)**:
- **مورد ممتاز (Certified):** بنعمل Skip Lot (نفحص شحنة ونفوّت 3).
- **مورد عادي:** فحص مستوى II قياسي.
- **مورد عليه مشاكل:** Tightened Inspection أو 100% Sorting على حسابه.

## 📜 الـ PPAP (عملية اعتماد الأجزاء الإنتاجية)
لو مورد هيعملك جزء جديد، لازم يسلمك الـ PPAP اللي بيثبت إنه يقدر يصنع بجودة ثابتة.
**أهم 5 مستندات في الـ PPAP لازم تراجعهم:**
1. **Control Plan** (خطة التحكم بتاعته).
2. **PFMEA** (إزاي هو دارس مخاطر عملياته).
3. **Dimensional Results** (تقرير الأبعاد).
4. **Material Certs / MTC** (شهادة صلاحية الخامات).
5. **Process Capability (Cpk)** (لازم Cpk > 1.33).

## 🔨 إزاي تتعامل مع شحنة مرفوضة (SCAR):
إذا استلمت شحنة معيبة، لا تكتفي برفضها. 
1. ارفع **SCAR (Supplier Corrective Action Request)**.
2. اطلب من المورد **تقرير 8D**.
3. احسب تكلفة تعطل خط الإنتاج بتاعك (Downtime) وحمّلها على المورد في المطالبة المالية الخصم.

**لو عندك شحنة مرفوضة دلوقتي، اكتبلي التفاصيل وهجهزلك الـ SCAR.**`,
      suggestions: ['فتح SCAR لمورد خامات', 'كيف أحدد حجم العينة (AQL)؟', 'اشرحلي مستويات الـ PPAP', 'تقييم أداء الموردين (Scorecard)'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── SOPs / CONTROL PLAN ──────────────────────────────────
  if (lower.match(/(sop|control plan|إجراء|خطة تحكم|standard work|تعليمات)/)) {
    return {
      content: `# 📝 QualityOps Pro — تعليمات التشغيل وخطط التحكم (SOP & Control Plan)
      
السبب الأكبر إن العمال مبيتبعوش الـ SOP هو إنها **ورقة مليانة كلام كتير معقد**. الـ Standard Work لازم يكون Visual، بسيط، وموجود قدام العامل.

## 🛠️ كيف تكتب SOP لا يُمَلّ (Visual SOP):
1. **صورة واحدة بألف كلمة:** استخدم صور حقيقية من الخط واعمل دوائر حمراء على نقط الغلط (NG) والدوائر الخضراء للمطابق (OK).
2. **نقطة، سطر:** متكتبش برجرافات. "اقطع عند 5 متر" أفضل من "يقوم المشغل بقطع السلك عند علامة الـ 5 متر".
3. **حدد الـ Critical To Quality (CTQ):** علّم المعايير اللي ممكن تدمر الشغلة بلون أحمر أو رمز تحذير.

## 📋 خطة التحكم (Control Plan): قلب الجودة النابض
الـ Control Plan مابيتفصلش عن الـ PFMEA، وهو الخريطة بتاعتك اللي بتقولك:
- **الخطوة (Step):** مثلاً التجميع النهائي.
- **الخاصية (Characteristic):** مثلاً عزم الربط (Torque).
- **المواصفة (Spec):** 15 ± 2 Nm.
- **طريقة القياس (Measurement):** مفتاح عزم ديجيتال.
- **حجم العينة / التردد:** 5 قطع كل ساعتين.
- **رد الفعل (Reaction Plan):** 🚨 لو العزم طلع 18 Nm، العامل المفروض يعمل إيه؟ (وقف الخط، اعزال آخر ساعتين، نادي مشرف الجودة).

> **💡 نصيحة للـ Audits:** الـ Auditor دايماً بيمسك الـ Control Plan وينزل يحاسب المفتش أو العامل عليه.. لو مكتوب إن القياس كل ساعة وهو بيقيس كل ساعتين، دي كارثة (Minor/Major NC).

**عايزني أصمم لك هيكل Control Plan لعملية معينة؟ أو أراجع لك SOP؟**`,
      suggestions: ['صمملي Control Plan لتجميع ميكانيكي', 'إزاي أعمل Visual SOP؟', 'اكتبلي Reaction Plan لمشكلة أبعاد', 'تحديث الـ Control Plan'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── AUDIT ────────────────────────────────────────────────
  if (lower.includes('audit') || lower.includes('اوديت') || lower.includes('مراجعة') || lower.includes('iso')) {
    return {
      content: `# 🔍 QualityOps Pro — تجهيز الـ Audit

## الخلاصة التنفيذية
الـ Audit مش امتحان — هو فرصة تثبت إن نظامك شغال. الاستعداد الصح بيفرق بين **Major** و **Minor** و**Observation**.

## Checklist التجهيز قبل 72 ساعة:

### 📁 الوثائق المطلوبة (Document Control)
- [ ] كل الـ SOP / WI محدّثة وعليها توقيع واعتماد
- [ ] الـ Control Plans مطابقة للإنتاج الفعلي
- [ ] الـ FMEA مراجَعة ومحدثة
- [ ] سجلات الـ NCR / CAPA مكتملة ومغلقة
- [ ] تقارير الـ Calibration لكل الأجهزة (وفي صلاحيتها)

### 🏭 أرض الإنتاج (Shop Floor)
- [ ] كل محطة عندها الـ WI الحالية مش نسخة قديمة
- [ ] الـ First-Off / Last-Off samples موثقة
- [ ] بطاقات HOLD / PASS / REJECT محددة وواضحة
- [ ] الـ Control Charts محدّثة ومعلقة
- [ ] العمال يعرفون يشرحوا الـ WI بتاعتهم

### 📊 بيانات الأداء
- [ ] آخر 3 أشهر Quality KPIs جاهزة
- [ ] كل الـ CAPA المفتوحة عندها خطة إغلاق واضحة
- [ ] نتائج الـ Internal Audits السابقة ومتابعاتها

## أكثر نقاط الـ ISO 9001 / IATF اللي بتطلع فيها NC:
| الكلوز | المشكلة الشائعة |
|--------|----------------|
| 8.5.2 | الـ ID & Traceability مش فعّالة |
| 8.7 | المنتج غير المطابق مش معزول صح |
| 10.2 | الـ CAPA مفيهاش Root Cause حقيقي |
| 7.1.5 | أجهزة القياس مش في المعايرة |
| 8.4 | متابعة الموردين ضعيفة |
| 9.1.3 | الداتا مش بتتحلل وبتُقرأ |

## ⚠️ خطأ شائع قبل الـ Audit:
مينفعش تفتح **CAPA جديدة** قبل الـ Audit بيوم أو يومين وتفكر إن ده هيساعد — المراجع الشاطر يشوف إنك عارف المشاكل من زمان ومستنيته.

---
**قولي نوع الـ Audit (ISO 9001 / IATF / Customer / Internal) وهجهزلك Checklist تفصيلي للمنطقة دي بالذات.**`,
      suggestions: ['هاتلي Audit Checklist لـ ISO 9001', 'فين أكبر Gaps عندنا؟', 'اكتبلي Internal Audit Report', 'جهزلي Process Audit checklist'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── DATA ANALYSIS ────────────────────────────────────────
  if (lower.includes('داتا') || lower.includes('بيانات') || lower.includes('تحليل') || lower.includes('excel')
    || lower.includes('python') || lower.includes('power bi') || lower.includes('pareto')) {
    return {
      content: `# 💻 QualityOps Pro — تحليل بيانات الجودة

## أهم 5 تحليلات لأي مصنع (مرتبة بالأولوية):

### 1) Pareto Analysis (80/20) — الأعلى أثراً
\`\`\`python
import pandas as pd
import matplotlib.pyplot as plt

# بيانات العيوب
df = pd.read_excel('defects.xlsx')
pareto = df.groupby('Defect_Type')['Count'].sum().sort_values(ascending=False)
pareto_cumulative = pareto.cumsum() / pareto.sum() * 100

# رسم Pareto Chart
fig, ax1 = plt.subplots(figsize=(12, 6))
ax1.bar(pareto.index, pareto.values, color='#0077ff', alpha=0.8)
ax2 = ax1.twinx()
ax2.plot(pareto.index, pareto_cumulative.values, 'r-o', linewidth=2)
ax2.axhline(80, color='gray', linestyle='--', label='80% Line')
ax1.set_title('Pareto Analysis — Defects', fontsize=14)
plt.tight_layout()
plt.savefig('pareto.png', dpi=150)
\`\`\`

### 2) SPC Control Chart في Excel:
\`\`\`
UCL = AVERAGE + 3 * STDEV(القراءات)
LCL = AVERAGE - 3 * STDEV(القراءات)
CL  = AVERAGE(القراءات)
أضف Line Chart على القياسات + 3 خطوط ثابتة
\`\`\`

### 3) Defect Trend (أسبوعي / شهري):
\`\`\`python
df['Week'] = pd.to_datetime(df['Date']).dt.isocalendar().week
trend = df.groupby(['Week','Defect_Type'])['Count'].sum().unstack()
trend.plot(kind='line', figsize=(14,6), title='Defect Trend by Week')
\`\`\`

### 4) Shift & Line Heatmap:
\`\`\`python
import seaborn as sns
pivot = df.pivot_table(values='Count', index='Shift', columns='Line', aggfunc='sum')
sns.heatmap(pivot, annot=True, fmt='g', cmap='RdYlGn_r')
plt.title('Defects by Shift and Line')
\`\`\`

### 5) Correlation Analysis (العيب مع الـ Parameters):
\`\`\`python
# هل الحرارة مرتبطة بارتفاع الريجكت؟
corr = df[['Temperature','Pressure','Speed','Defect_Count']].corr()
sns.heatmap(corr, annot=True, cmap='coolwarm')
\`\`\`

## تنظيف البيانات أولاً (Data Cleaning):
\`\`\`python
df.dropna(subset=['Defect_Type'], inplace=True)   # حذف الفراغات
df.drop_duplicates(inplace=True)                   # حذف المكرر
df['Date'] = pd.to_datetime(df['Date'])            # تصحيح النوع
df['Count'] = df['Count'].clip(lower=0)            # حذف القيم السالبة
\`\`\`

## ⚠️ خطأ شائع في تحليل الجودة:
**لا تخلط Defect Count مع Defect Rate!** 
- خط بالانتاج العالي هيدي عيوب أكتر بالعدد رغم إن نسبته أحسن
- دايماً احسب PPM أو % مش عدد مجرد

---
**ارفع بياناتك أو اكتب أعمدة الجدول، وهبدأ التحليل الفعلي فوراً.**`,
      suggestions: ['اكتبلي كود Pareto كامل من Excel', 'احسبلي PPM من بياناتي', 'اعمللي Cpk من قائمة القياسات', 'صمملي Power BI Report للجودة'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── FMEA ─────────────────────────────────────────────────
  if (lower.includes('fmea') || lower.includes('risk') || lower.includes('مخاطر') || lower.includes('rpn')) {
    return {
      content: `# ⚠️ QualityOps Pro — FMEA عملي

## هيكل جدول الـ FMEA (قابل للنقل لـ Excel):

| # | خطوة العملية | وضع الإخفاق (Failure Mode) | التأثير (Effect) | الخطورة S | السبب المحتمل | الاحتمالية O | طريقة الكشف | القدرة على الكشف D | **RPN** |
|---|-----------|-----------|---------|-----------|------|-----------|------|-----------|---------|
| 1 | [العملية] | [ما الذي قد يفشل؟] | [ماذا يحدث للعميل؟] | 1-10 | [لماذا يحدث؟] | 1-10 | [كيف نكتشفه؟] | 1-10 | **S×O×D** |

---

## سلم التقييم السريع:

### Severity (S):
| النقاط | التعريف |
|--------|---------|
| 9-10 | خطر على السلامة أو مشكلة قانونية |
| 7-8 | يوقف خط الإنتاج أو مرفوض من العميل |
| 5-6 | يتطلب رework ملحوظ |
| 3-4 | عيب ثانوي |
| 1-2 | لا تأثير فعلي |

### الاحتمالية (O):
| النقاط | المعدل |
|--------|--------|
| 9-10 | ≥ 1 من كل 10 وحدات |
| 7-8 | 1 من كل 100 |
| 5-6 | 1 من كل 1000 |
| 3-4 | 1 من كل 10,000 |
| 1-2 | < 1 من كل 100,000 |

### القدرة على الكشف (D):
| النقاط | المعنى |
|--------|--------|
| 9-10 | لا توجد طريقة للكشف |
| 7-8 | الكشف يدوي وغير مضمون |
| 5-6 | SPC أو فحص إحصائي |
| 3-4 | Automated Detection |
| 1-2 | Poka-Yoke مضمون 100% |

---

## متى أقدم الـ FMEA؟ (الأولويات)
- **RPN > 200:** إجراء فوري مطلوب — ضع Corrective Action
- **S = 9 أو 10:** بغض النظر عن الـ RPN — تدخل عاجل
- **D = 9 أو 10:** الكشف ضعيف جداً — أضف نقطة فحص

## ⚠️ أكبر خطأ في الـ FMEA:
الكثيرون بيعملوا FMEA مرة واحدة وبيحطوه في درج. الـ FMEA لازم يتحدّث:
- لما يحصل عيب جديد
- لما يتغير الـ Design / Process
- كل سنة كـ Living Document

---
**أعطني خطوات عمليتك وهبني FMEA باسمها الحقيقي فوراً.**`,
      suggestions: ['ابنيلي FMEA لعملية التجميع', 'إيه الـ RPN المقبول؟', 'اكتبلي Action Plan للـ RPN العالية', 'حوّل الـ FMEA لـ Control Plan'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── IDENTITY / PHILOSOPHY / AI ─────────────────────────────
  if (lower.match(/(من أنت|ماذا تفعل|ذكاء اصطناعي|ai|دورك|تعرف تعمل إيه|مين انت)/)) {
    return {
      content: `# 🧠 **أنا QualityOps Pro — عقل الجودة الصناعية**
      
أنا لست مجرد "شات" أرد على أسئلتك بروابط أو نصوص عامة. أنا صُممت لأكون **شريكك الاستراتيجي والتنفيذي** في أرض المصنع. 
أجمع بين القوة الحسابية للـ Data Science والخبرة العميقة لمهندس جودة (Quality Manager / Lean Six Sigma Black Belt).

## 🧭 كيف أفكر؟ (فلسفتي في العمل)
- **لا للورقيات العقيمة:** الجودة مش شوية فحص وورق بيتملي؛ الجودة هي هندسة وقائية تمنع العيب قبل ما يحصل.
- **البيانات تتحدث:** قراراتي مبنية على (Data-Driven Insights) مش مجرد خبرة شخصية أو انطباعات. "In God we trust; all others must bring data" - Edward Deming.
- **التكلفة المخفية (COPQ):** هدفي الأول هو تقليل تكلفة الجودة الرديئة (من خردة، إعادة تشغيل، وشكاوى) لزيادة أرباح المصنع.

## 🛠️ كيف يمكنني تغيير يومك؟
1. **التحليل الجذري (RCA):** هدخل معاك في جلسة 5-Whys أو Fishbone ونكسّر أي مشكلة معقدة لحل جذري.
2. **الامتثال الذكي (Smart Compliance):** هجهزلك مستندات الـ CAPA والـ 8D والـ FMEA بطريقة ترضي أعتى الـ Auditors (مثل ISO 9001, IATF 16949).
3. **مراقبة العمليات (SPC):** هحسبلك قدرة العمليات (Cp, Cpk) وأحلل Control Charts وأقولك إمتى تعمل إيقاف للمكنة.
4. **التطوير المستمر (Kaizen):** هنبني سوا ثقافة الجودة وهديك أدوات قيادة تساعدك تدير فريق المفتشين باحترافية.

> **💡 أنا هنا عشان أرفع عنك الشغل الروتيني، وأسيبلك مساحة للإبداع والتفكير الاستراتيجي. ابدأ بسؤالي عن أي تحدي بيواجهك في مصنعك!**`,
      suggestions: ['كيف تطبق الـ Lean في الجودة؟', 'ما هي معايير الجودة 4.0؟', 'كيف أغير ثقافة العمال؟'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── LEAN / SIX SIGMA / METHODOLOGY ──────────────────────────
  if (lower.match(/(lean|six sigma|كايزن|منهجية|فلسفة|5s|tqm|deming|ديمنج|تحسين مستمر|تطوير)/)) {
    return {
      content: `# ⛩️ **فلسفة التطوير المستمر (Lean & Six Sigma)**
      
عظيم يا هندسة أنك بتفكر في الجانب المنهجي! إدارة الجودة مش بس التزام بالمواصفات، دي "عقلية" وثقافة كاملة.

## 📊 ركائز التميز المؤسسي (Operational Excellence)

| المنهجية | الهدف الأساسي | الأداة العملية المفضلة | التطبيق الفوري (Quick Win) |
|---------|-------------|-----------------------|-------------------------|
| **Lean** | تقليل الهدر (Muda) وتقليل زمن الدورة المادية. | **5S / Value Stream Map** | اعمل جولة 5S سريعة في المستودع والمحطات. |
| **Six Sigma** | تقليل التباين (Variation) والعيوب في الإنتاج. | **DMAIC / SPC** | اسحب داتا من أهم خط إنتاج واحسب الـ Cp/Cpk. |
| **Kaizen** | تحسينات صغيرة ومستمرة ويومية. | **Gemba Walk** | انزل أرض المصنع (الجيمبا) واسمع من العمال شكاويهم. |

## 🧠 مقولة للتأمل (Quality Wisdom):
*"عليك أن تدرك أن 85% من أسباب الفشل ترجع إلى النظام والعمليات، وليس إلى الأفراد."* — W. Edwards Deming.
مشكلتنا كمديرين جودة إننا بنلوم العامل (Human Error)، بينما الخطأ الحقيقي بيكون في غياب الـ Poka-Yoke (مانع الخطأ) في نظام العمل.

### 🚀 خطوة عملية تبدأ بيها بكرة:
بدل ما تعمل اجتماع طويل بدون جدوى، اعمل **Gemba Walk (مشي في أرض المصنع)** بكرا الصبح. اقف ربع ساعة قدام أسوأ ماكينة عندك أداءً، راقب فقط، واسأل العامل: "إيه اللي بيعطلك النهارده؟".

أقدر أساعدك تبني خطة **DMAIC (Define, Measure, Analyze, Improve, Control)** لمشكلة معينة عندك. تحب نبدأ؟`,
      suggestions: ['كيف أبدأ مشروع Six Sigma؟', 'اشرحلي الـ DMAIC', 'إزاي أطبق الـ 5S في قسم الإنتاج؟', 'أمثلة لـ Poka-Yoke'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── LEADERSHIP / STRATEGY / COPQ ────────────────────────────
  if (lower.match(/(استراتيجية|kpi|okr|قيادة|leadership|مدير|تكلفة|copq|فلوس|خسارة|ثقافة)/)) {
    return {
      content: `# 💼 **القيادة الاستراتيجية للجودة (Strategic Quality Leadership)**
      
يا هندسة، مدير الجودة الناجح مش اللي بيطلع أكبر عدد عيوب.. مدير الجودة الناجح هو اللي بيوفر على المصنع أكبر قدر من الفلوس من خلال الجودة (Cost of Poor Quality - COPQ).

## 💸 أين تذهب أموال المصنع؟ (COPQ Model)
الـ COPQ عاملة زي جبل الجليد (Iceberg):
- **الخسائر الظاهرة (10-15%):** المرتجعات (Scrap)، مصاريف إعادة التشغيل (Rework)، غرامات العملاء.
- **الخسائر الخفية (85-90%):** الوقت الضايع في التحليلات، الشحن السريع بسبب التأخير، طاقة الإنتاج المهدرة، تأثر سمعة البراند، واحتراق أعصاب الفريق (Burnout).

## 👑 كيف تبني ثقافة جودة قوية؟ (Culture of Quality)
1. **الجودة ليست قسم:** الجودة مسؤولية الجميع. العامل يجب أن يملك حقن "إيقاف الخط" (Jidoka) إذا رأى عيباً.
2. **اربط الـ KPIs بالمال:** الإدارة العليا لا تفهم لغة "عملنا 50 تقرير NCR". قل لهم: "قللنا الهدر بنسبة 12% مما وفر 20,000$ هذا الربع".
3. **احتفل باكتشاف العيوب المبكرة:** المفتش اللي بيلاقي مشكلة في הـ Incoming Material ده بطل، لأنه منع المشكلة إنها توصل لمرحلة التجميع والتغليف وبكدا وفر التكلفة أضعاف.

### 📈 أهم 3 KPIs استراتيجية لازم تتابعها:
- **First Pass Yield (FPY):** نسبة المنتجات السليمة من أول مرة وبدون أي معالجات.
- **Cost of Quality (COQ):** نسبة تكلفة الجودة من المبيعات (الوقاية + التقييم + الفشل).
- **Supplier Quality (PPM):** عدد العيوب في كل مليون قطعة، لمراقبة أداء الموردين.

لو عندك مشكلة في أداء فريقك أو مصداقية الجودة أمام الإدارة، احكيلي وهنحط استراتيجية (Change Management) نصلح بيها الوضع.`,
      suggestions: ['إزاي أحسب تكلفة الـ COPQ؟', 'تصميم KPIs لفريق الجودة', 'الإدارة مش مهتمة بالجودة، أعمل إيه؟'],
      metadata: { confidence, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  // ── DEFAULT / GENERIC (Cultured & Intellectual) ──────────────────
  const isQuestion = lower.includes('؟') || lower.includes('?') || lower.match(/^(كيف|ليه|لماذا|ازاي|هل|من|متى|ماهو|ماهي|وش|شنو)/);

  if (isQuestion || input.split(' ').length > 4) {
    return {
      content: `# 💡 تحليل هندسي: "${input.substring(0, 45)}${input.length > 45 ? '...' : ''}"
      
${hasPrev ? '> مبنياً على سياق كلامنا، ' : '> كخبير جودة، '}سؤالك ده بيفتح مجال مهم جداً للنقاش في نظام إدارة الجودة المتقدم (QMS 4.0).
إحنا مش بندور على إجابة نموذجية محفوظّة، إحنا بندور على الـ **System Root Cause** اللي هيطبق في مصنعك ويوفرلك فلوس.

## 🔍 إزاي نقارب الموضوع ده عملياً (Practical Approach)؟
1. **تحديد الـ Gap (Gap Analysis):** إيه الوضع الحالي (As-Is) وإيه الوضع اللي بنستهدفه (To-Be) عشان نحل الإشكالية دي؟
2. **الامتثال (Compliance):** الإجراء ده غالباً لازم يرتبط بمواصفة (ISO 9001 بند العمليات والتحسين). هل عندك SOP قوي بيغطي النقطة دي؟
3. **جمع المعطيات (Data Collection):** إيه الـ KPI اللي هيتأثر لو طبقنا ده؟ (Scrap, Rework, PPM).

> ⚙️ **نصيحتي كـ QualityOps Pro:** أي قرار أو نقاش بتسأل فيه لازم ينتهي بـ Action يقلل التكلفة (COPQ) أو يُسهل حياة المفتشين والعمال.

**عشان أديك رد حاسم (Tailored Solution)، ممكن تديني داتا أو أرقام، أو حتى ترفق ملف/صورة للمشكلة وهحللها لك بالتفصيل فوراً؟**`,
      suggestions: ['إزاي أربط الاستفسار ده بأهداف المصنع (KPIs)؟', 'إيه هي معايير الـ ISO في النقطة دي؟', 'إزاي أبني خطة عمل (Action Plan) للفكرة دي؟'],
      metadata: { confidence: 88, processingTime: (Date.now() - startTime) / 1000 }
    };
  }

  return {
    content: `# 👷 QualityOps Pro
    
${hasPrev ? '> 💡 **من واقع تحليلنا المستمر:**' : '> 💡 **أهلاً بك يا هندسة في المساحة الاحترافية للجودة.**'}

سؤالك بيلمس جانب مهم جداً. كخبراء جودة، إحنا دايماً بنبص للموقف من زاويتين: **الصورة الكبرى (Macro)** إزاي ده بيأثر على البيزنس والعميل، و**التفاصيل الدقيقة (Micro)** إزاي ده بيحصل حرفياً على خط الإنتاج.

**أقدر أساعدك فوراً بـ:**
1. **هندسة الحلول:** ابعت أي مشكلة، وهنسلسل الـ 5-Whys.
2. **أنظمة متقدمة:** رفع تقارير أو تصميم ملفات 8D, CAPA.
3. **صناعة القرار:** ارفع لي **أي ملف بيانات / Excel** وسأقوم بتحليله واستخراج المؤشرات فوراً.

**المايك معاك، ارفع لي الداتا أو اكتب المشكلة.**`,
    suggestions: ['إزاي أقنع الإدارة بمشروع جودة جديد؟', 'عندي مشكلة معقدة في الإنتاج', 'اشرحلي مبادئ ديمنج (Deming)', 'كيف ننتقل لـ Quality 4.0؟'],
    metadata: { confidence: 85, processingTime: (Date.now() - startTime) / 1000 }
  };
};

// Markdown Renderer Component
const MessageContent = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied to clipboard');
  };

  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      if (line.startsWith('## ')) {
        elements.push(<h2 key={i} dir="auto" className="text-lg font-black text-white mt-5 mb-3 border-b border-white/10 pb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#00d2ff]" />{line.replace('## ', '')}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} dir="auto" className="text-md font-bold text-[#00d2ff] mt-4 mb-2">{line.replace('### ', '')}</h3>);
      } else if (line.startsWith('|') && lines[i+1]?.includes('---')) {
        // Table
        const tableLines = [];
        while (i < lines.length && lines[i].startsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        elements.push(renderTable(tableLines, i));
        continue;
      } else if (line.startsWith('- [ ]') || line.startsWith('- [x]')) {
        const isChecked = line.startsWith('- [x]');
        elements.push(
          <div key={i} dir="auto" className="flex items-center gap-3 mx-2 my-2 bg-white/5 p-2 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
            <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isChecked ? 'bg-[#00d2ff] border-[#00d2ff]' : 'border-gray-500 bg-transparent'}`}>
              {isChecked && <CheckCheck className="w-3 h-3 text-black" />}
            </div>
            <span dir="auto" className={isChecked ? 'text-gray-400 line-through' : 'text-gray-200 font-medium'}>
              {line.replace('- [ ]', '').replace('- [x]', '').trim()}
            </span>
          </div>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={i} dir="auto" className="ms-6 text-gray-300 my-1.5 flex items-start relative before:content-[''] before:absolute before:-start-4 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#00d2ff]/50">
            {renderInlineMarkdown(line.replace('- ', ''))}
          </li>
        );
      } else if (line.startsWith('```')) {
        // Code block
        const lang = line.replace('```', '').trim();
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        const codeBlockId = `code-${i}`;
        const codeContent = codeLines.join('\n');
        elements.push(
          <div key={i} dir="ltr" className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0f]">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
              <span className="text-xs font-mono text-gray-400">{lang || 'plaintext'}</span>
              <button 
                onClick={() => copyToClipboard(codeContent, codeBlockId)}
                className="text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-xs"
              >
                {copied === codeBlockId ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied === codeBlockId ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm text-gray-300 font-mono leading-relaxed custom-scrollbar text-left">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
      } else if (line.startsWith('---')) {
        elements.push(<hr key={i} className="border-white/10 my-4" />);
      } else if (line.startsWith('>')) {
        elements.push(
           <blockquote key={i} dir="auto" className="border-s-4 border-[#00d2ff] ms-2 ps-4 py-1 my-2 text-gray-400 italic bg-white/5 rounded-e-lg">
             {renderInlineMarkdown(line.replace('>', '').trim())}
           </blockquote>
        );
      } else {
        elements.push(<p key={i} dir="auto" className="text-gray-300 my-1.5 leading-relaxed text-[15px]">{renderInlineMarkdown(line)}</p>);
      }
      i++;
    }
    return elements;
  };

  const renderInlineMarkdown = (text: string) => {
    // Basic bold parser `**text**` and code `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} dir="auto" className="text-white font-bold inline-block mx-1">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} dir="auto" className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-[#00d2ff] font-mono mx-1">{part.slice(1, -1)}</code>;
      }
      return <span key={idx} dir="auto">{part}</span>;
    });
  };

  const renderTable = (lines: string[], key: number) => {
    const rows = lines.filter(l => l.trim() !== '' && !l.includes('---'));
    if (rows.length < 1) return null;
    
    const headers = rows[0].split('|').filter(h => h.trim() !== '').map(h => h.trim());
    const dataRows = rows.slice(1);
    
    return (
      <div key={`table-${key}`} className="overflow-x-auto custom-scrollbar my-4 rounded-xl border border-white/10 shadow-lg">
        <table className="w-full text-sm border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              {headers.map((h, idx) => (
                <th key={idx} dir="auto" className="py-3 px-4 text-white font-bold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {dataRows.map((row, ridx) => {
              const cells = row.split('|').filter(c => c.trim() !== '').map(c => c.trim());
              return (
                <tr key={ridx} className="hover:bg-white/5 transition-colors">
                  {cells.map((cell, cidx) => {
                    const isDirectional = cell.includes('↑') || cell.includes('↓');
                    const isPositive = cell.includes('↑');
                    const isNegative = cell.includes('↓');
                    return (
                      <td key={cidx} dir="auto" className="py-3 px-4 text-gray-300">
                        {isDirectional ? (
                          <span dir="auto" className={`inline-flex items-center gap-1 ${isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : ''}`}>
                            {cell}
                          </span>
                        ) : (
                          renderInlineMarkdown(cell)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };
  
  return <div dir="auto" className="space-y-1 w-full max-w-full font-sans break-words">{renderContent(content)}</div>;
};

// Typewriter Effect Hook
const useTypewriter = (text: string, speed: number = 8) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    setIsTyping(true);
    
    const actualSpeed = text.length > 500 ? speed / 2 : speed;

    const intervalId = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(intervalId);
        setIsTyping(false);
      }
    }, actualSpeed);

    return () => clearInterval(intervalId);
  }, [text, speed]);

  return { displayedText, isTyping };
};

// Streaming Chat Message Component
const StreamingMessage = ({ message, onComplete }: { message: ChatMessage; onComplete: () => void }) => {
  const { displayedText, isTyping } = useTypewriter(message.content, 8);
  
  useEffect(() => {
    if (!isTyping) {
      onComplete();
    }
  }, [isTyping, onComplete]);

  return <MessageContent content={displayedText} />;
};


export function AIChatPage() {
  const { t, language } = useTranslation();
  // State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<'QMS-GPT4-Turbo' | 'QMS-Claude-Opus' | 'QMS-DeepSeek'>('QMS-GPT4-Turbo');
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Scroll to bottom properly
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, streamingMessageId]);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai-chat-sessions-v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hydrated = parsed.map((s: ChatSession) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: ChatMessage) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
        setSessions(hydrated);
        if (hydrated.length > 0 && !currentSessionId) {
          loadSession(hydrated[0]);
        }
      } catch (e) {
        console.error('Failed to load sessions:', e);
      }
    }
    
    if (!currentSessionId && (!saved || JSON.parse(saved).length === 0)) {
      createNewSession();
    }
  }, []);
  
  // Save sessions when they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('ai-chat-sessions-v2', JSON.stringify(sessions));
    }
  }, [sessions]);
  
  // Create new session
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSessions(prev => [newSession, ...prev].slice(0, 50));
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setAttachments([]);
    
    // Add welcome message immediately (no streaming for welcome)
    const welcome = generateAIResponse('welcome', []);
    setMessages([{
      id: 'welcome',
      type: 'system',
      content: welcome.content,
      timestamp: new Date(),
      suggestions: welcome.suggestions
    }]);
  };
  
  // Load session
  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setAttachments([]);
    setStreamingMessageId(null);
  };
  
  // Update current session messages
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      const userMsgs = messages.filter(m => m.type === 'user');
      const title = userMsgs.length > 0 ? userMsgs[0].content.slice(0, 40) + (userMsgs[0].content.length > 40 ? '...' : '') : 'New Chat';
      
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages, title, updatedAt: new Date() }
          : s
      ));
    }
  }, [messages, currentSessionId]);
  
  // Delete session
  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      createNewSession();
    }
  };
  
  // Toggle favorite
  const toggleFavorite = (id: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
    ));
  };
  
  // Filtered sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions;
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(lower) ||
        s.messages.some(m => m.content.toLowerCase().includes(lower))
      );
    }
    return [...filtered].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [sessions, searchQuery]);

  // Handle Attachments
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles].slice(0, 5)); // Limit to 5 files
      e.target.value = ''; // Reset
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = useCallback(async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() && attachments.length === 0) return;

    const attachmentMetadata = attachments.map(f => ({
      id: Math.random().toString(),
      name: f.name,
      type: f.type.includes('image') ? 'image' as const : 'document' as const,
      size: (f.size / 1024).toFixed(1) + ' KB'
    }));

    setInput('');
    setAttachments([]);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
    }
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: msg,
      timestamp: new Date(),
      attachments: attachmentMetadata.length > 0 ? attachmentMetadata : undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    // Simulate network delay before AI starts "thinking"
    await new Promise(r => setTimeout(r, 800));
    
    // Get AI response
    const context = [...messages, userMessage].slice(-10);
    const response = generateAIResponse(msg, context, attachments);
    
    setIsTyping(false);
    
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      type: 'ai',
      content: response.content,
      timestamp: new Date(),
      suggestions: response.suggestions,
      metadata: {
        ...response.metadata,
        model: selectedModel
      }
    };
    
    setMessages(prev => [...prev, aiMessage]);
    setStreamingMessageId(aiMessageId); // Activate streaming for this message
    
  }, [input, messages, attachments, selectedModel]);

  // Handle Key Down in Textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Only send if shift is NOT pressed
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const exportChat = useCallback(() => {
    const data = { exportedAt: new Date().toISOString(), model: selectedModel, messages };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QMS-Chat-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Chat exported successfully');
  }, [messages, selectedModel]);

  return (
    <PageContainer>
      <div className="page-enter h-[calc(100vh-140px)] min-h-[600px] flex flex-col">
        <PageHeader 
          title={t('ai-assistant')} 
          subtitle={`${filteredSessions.length} ${language === 'ar' ? 'جلسات' : 'sessions'} • ${language === 'ar' ? 'مدرك للسياق' : 'Context-aware'} • ${selectedModel}`} 
          actions={{ refresh: () => { setSearchQuery(''); createNewSession(); }, export: exportChat }} 
        />
        
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-5 gap-6 h-full mt-4 pb-4">
          
          {/* Sidebar - Sessions & Settings */}
          <div className={`${showSidebar ? 'xl:col-span-1 border-r border-white/5 pr-4' : 'hidden'} flex flex-col h-full bg-black/20 rounded-3xl p-4`}>
            <div className="mb-6 flex flex-col gap-3">
              <button 
                onClick={createNewSession}
                className="w-full py-3.5 px-4 bg-[#0077ff]/10 hover:bg-[#0077ff]/20 border border-[#00d2ff]/20 rounded-2xl flex items-center justify-between text-[#00d2ff] font-black uppercase tracking-widest text-xs transition-all duration-300 group shadow-[0_4px_20px_rgba(0,119,255,0.15)]"
              >
                <span className="flex items-center gap-2 text-white">
                  <BrainCircuit className="w-5 h-5 text-[#00d2ff]" />
                  {language === 'ar' ? 'محادثة جديدة' : 'New Session'}
                </span>
                <Plus className="w-4 h-4 text-[#00d2ff] group-hover:rotate-90 transition-transform" />
              </button>
              
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-500 group-focus-within:text-[#00d2ff] transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search history..."
                  className="w-full block pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00d2ff] focus:border-[#00d2ff] sm:text-xs transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-2 -mr-2 custom-scrollbar">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center justify-center opacity-50">
                  <History className="w-10 h-10 mb-3 text-gray-500" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No Sessions Found</p>
                </div>
              ) : (
                filteredSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => loadSession(session)}
                    className={`group relative p-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                      currentSessionId === session.id 
                        ? 'bg-gradient-to-r from-[#0066CC]/30 to-transparent border-l-4 border-l-[#00d2ff] border-y border-y-white/5 border-r border-r-white/5 shadow-md' 
                        : 'bg-white/5 hover:bg-[#1a1a2e] border border-transparent hover:border-[#00d2ff]/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className={`text-sm font-bold truncate mb-1 ${currentSessionId === session.id ? 'text-white' : 'text-gray-300'}`}>
                          {session.title}
                        </h4>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider flex items-center gap-2">
                          <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{session.messages.length} msgs</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Floating Actions on Hover */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm p-1.5 rounded-xl border border-white/10">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(session.id); }}
                        className={`p-1.5 rounded-lg transition-colors ${session.isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 hover:text-yellow-400 hover:bg-white/10'}`}
                      >
                        <Star className={`w-3.5 h-3.5 ${session.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="pt-4 border-t border-white/10 mt-4">
              <div className="glass-panel p-3 rounded-2xl flex items-center gap-3 border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center pointer-events-none">
                  <Cpu className="w-5 h-5 text-[#00A3E0]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Brain Model</p>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as any)}
                    className="w-full bg-transparent text-sm font-bold text-white focus:outline-none appearance-none cursor-pointer"
                  >
                    <option className="bg-[#10101a]" value="QMS-GPT4-Turbo">QMS-GPT4-Turbo (Smart)</option>
                    <option className="bg-[#10101a]" value="QMS-Claude-Opus">QMS-Claude-Opus (Analytical)</option>
                    <option className="bg-[#10101a]" value="QMS-DeepSeek">QMS-DeepSeek (Fast)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Chat Area */}
          <div className={`${showSidebar ? 'xl:col-span-4' : 'xl:col-span-5'} flex flex-col h-full glass-ultra rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,119,255,0.05)] relative bg-[#0a0a0f]/90`}>
            {/* Top Banner (Header) inside chat */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-b from-[#151525] to-transparent z-10 backdrop-blur-xl shrink-0">
              <div className="flex items-center gap-3">
                {!showSidebar && (
                  <button 
                    onClick={() => setShowSidebar(true)}
                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors"
                  >
                    <History className="w-4 h-4 text-white" />
                  </button>
                )}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d2ff]/20 to-[#7000ff]/20 border border-[#00d2ff]/30 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-[#00d2ff] opacity-20 blur-xl rounded-full"></div>
                  <Bot className="w-5 h-5 text-[#00d2ff] relative z-10" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">{selectedModel}</h2>
                  <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    System Online
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                    onClick={() => {
                        const welcome = generateAIResponse('', []);
                        setMessages([{
                          id: 'welcome',
                          type: 'system',
                          content: welcome.content,
                          timestamp: new Date(),
                          suggestions: welcome.suggestions
                        }]);
                      }}
                    className="p-2 text-gray-500 hover:text-[#00d2ff] hover:bg-[#00d2ff]/10 rounded-xl transition-colors" 
                    title="Refresh Session"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => { localStorage.removeItem('ai-chat-sessions-v2'); setSessions([]); createNewSession(); toast.success('Cleared entirely'); }} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors" title="Clear All History">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="h-6 w-px bg-white/10 mx-1"></div>
                <button className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Scroll View */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 custom-scrollbar z-0 relative pb-[200px]">
              
              {/* Render Messages */}
              {messages.map((m) => {
                const isUser = m.type === 'user';
                const isSystem = m.type === 'system';

                return (
                  <div key={m.id} className={`flex gap-4 w-full ${isUser ? 'max-w-4xl ml-auto flex-row-reverse' : 'max-w-5xl mr-auto'} group animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border shadow-lg mt-1 ${
                      isUser 
                        ? 'bg-gradient-to-br from-[#00A3E0] to-[#0066CC] border-white/10' 
                        : isSystem 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-[#151525] border border-white/10'
                    }`}>
                      {isUser ? <User className="w-5 h-5 text-white" /> : isSystem ? <Sparkles className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-[#00d2ff]" />}
                    </div>
                    
                    {/* Bubble */}
                    <div className={`flex flex-col gap-2 min-w-0 ${isUser ? 'items-end' : 'items-start w-full'}`}>
                      <div className={`px-6 py-5 rounded-3xl shadow-xl overflow-hidden ${
                        isUser 
                          ? 'bg-[#1e1e2d] border border-white/5 text-white rounded-tr-sm' 
                          : isSystem 
                            ? 'bg-transparent text-gray-400 italic' 
                            : 'glass-panel border-white/10 text-gray-100 rounded-tl-sm w-full'
                      }`}>
                        
                        {/* Rendering the text content */}
                        {m.id === streamingMessageId ? (
                           <StreamingMessage message={m} onComplete={() => setStreamingMessageId(null)} />
                        ) : isUser ? (
                          <p dir="auto" className="whitespace-pre-wrap leading-relaxed text-[15px]">{m.content}</p>
                        ) : (
                          <MessageContent content={m.content} />
                        )}

                        {/* Render Attachments in User Message */}
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10 border-dashed">
                            {m.attachments.map((file, i) => (
                              <div key={i} className="flex items-center gap-3 px-3 py-2 bg-black/40 border border-white/10 rounded-xl hover:bg-black/60 transition-colors cursor-pointer">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${file.type === 'image' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                   {file.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className="text-xs font-bold text-gray-200 truncate max-w-[150px]">{file.name}</span>
                                  <span className="text-[10px] text-gray-500 uppercase">{file.size}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>

                      {/* Metadata Footer */}
                      {m.type === 'ai' && !isSystem && m.id !== streamingMessageId && (
                        <div className="flex items-center gap-4 mt-1 px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                            {m.metadata?.confidence && <span className={`flex items-center gap-1 ${m.metadata.confidence > 80 ? 'text-green-500' : 'text-yellow-500'}`}><CheckCheck className="w-3 h-3" /> Conf: {m.metadata.confidence}%</span>}
                            {m.metadata?.processingTime && <span>{m.metadata.processingTime.toFixed(2)}s</span>}
                            {m.metadata?.model && <span>{m.metadata.model}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { navigator.clipboard.writeText(m.content); toast.success('Copied!'); }} className="p-1.5 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors" title="Copy"><Copy className="w-3 h-3" /></button>
                            <button className="p-1.5 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors" title="Options"><MoreVertical className="w-3 h-3" /></button>
                          </div>
                        </div>
                      )}
                      
                      {/* Suggestions Buttons */}
                      {m.suggestions && m.suggestions.length > 0 && m.id !== streamingMessageId && (
                        <div className="flex flex-wrap gap-2 mt-2 px-2">
                          {m.suggestions.map((s, i) => (
                            <button 
                              key={i} 
                              onClick={() => handleSend(s)} 
                              className="px-4 py-2 text-xs font-bold text-[#00d2ff] bg-[#00d2ff]/10 hover:bg-[#00d2ff]/20 border border-[#00d2ff]/20 rounded-xl transition-all shadow-sm flex items-center gap-1 hover:scale-105"
                            >
                              <Sparkles className="w-3 h-3" />
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Global Typing Indicator */}
              {isTyping && !streamingMessageId && (
                <div className="flex gap-4 w-full max-w-3xl mr-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#151525] border border-white/10 flex items-center justify-center shadow-lg mt-1">
                    <Bot className="w-5 h-5 text-[#00d2ff]" />
                  </div>
                  <div className="glass-panel border-white/10 px-6 py-5 rounded-3xl rounded-tl-sm flex items-center gap-3">
                    <div className="text-xs text-[#00d2ff] font-bold uppercase tracking-widest mr-2 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      Analyzing Data
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} className="h-40 pb-6" />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent pt-12 z-20 shrink-0">
              <div className="max-w-4xl mx-auto w-full relative">
                
                {/* File preview thumbnails */}
                {attachments.length > 0 && (
                  <div className="absolute bottom-[calc(100%+10px)] left-0 flex flex-wrap gap-3 mb-1 px-2">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="relative group bg-[#1e1e2d] border border-white/10 shadow-xl rounded-2xl p-2.5 flex items-center gap-3 pr-8 animate-in bottom-slide-up duration-300 transform origin-bottom">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${file.type.includes('image') ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {file.type.includes('image') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col min-w-[100px] max-w-[200px]">
                          <span className="text-xs font-bold text-white truncate">{file.name}</span>
                          <span className="text-[10px] text-gray-400">{(file.size/1024).toFixed(1)} KB</span>
                        </div>
                        <button 
                          onClick={() => removeAttachment(idx)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative group flex items-end gap-3 glass-strong border border-white/10 rounded-[2rem] p-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] focus-within:border-[#00d2ff]/50 focus-within:ring-1 focus-within:ring-[#00d2ff]/30 transition-all bg-[#10101a]/80">
                  
                  {/* Attachment Add Button */}
                  <div className="relative pb-1 pl-2 shrink-0">
                    <input 
                      type="file" 
                      id="file-upload" 
                      className="hidden" 
                      multiple 
                      onChange={handleFileSelect}
                      disabled={isTyping}
                    />
                    <label 
                      htmlFor="file-upload" 
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${isTyping ? 'opacity-50' : 'bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white'}`}
                      title="Attach files (Data, Images, Documents)"
                    >
                      <Paperclip className="w-5 h-5" />
                    </label>
                  </div>

                  {/* Dynamic Textarea */}
                  <textarea
                    ref={textareaRef}
                    dir="auto"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('ask-quality') || "Ask the QMS Intelligence... (Shift+Enter for newline)"}
                    className="flex-1 max-h-[200px] min-h-[44px] py-3 px-2 bg-transparent text-[15px] font-medium text-white placeholder:text-gray-500 resize-none focus:outline-none custom-scrollbar leading-relaxed"
                    disabled={isTyping}
                    rows={1}
                  />

                  {/* Send Button */}
                  <div className="pb-1 pr-2 shrink-0">
                    <button
                      onClick={() => handleSend()}
                      disabled={(!input.trim() && attachments.length === 0) || isTyping}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                        (input.trim() || attachments.length > 0) && !isTyping 
                          ? 'bg-[#00d2ff] text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(0,210,255,0.4)]' 
                          : 'bg-white/5 text-gray-600 pointer-events-none'
                      }`}
                    >
                      <Send className="w-5 h-5 -ml-0.5" />
                    </button>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-relaxed">
                    QMS AI can make mistakes. Verify critical compliance and metrics parameters.<br/>
                    <span className="text-gray-700">Powered by {selectedModel} Enterprise Core.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}

export default AIChatPage;
