import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../utils/translations';
import {
  BookOpen, Award, Target,
  Shield, BarChart3, AlertTriangle, Workflow, 
  TrendingUp, GraduationCap, Briefcase, Network,
  CheckCircle, Menu, ArrowRight, ArrowLeft, Library
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { qualityDefinitions, qualityStandards, qualityTools, qualityBooks } from './QualityLibrary';

interface AcademicPhase {
  name: string;
  nameAr: string;
  desc: string;
  descAr: string;
}

interface Slide {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  libraryKeywords: string[];
  content: {
    overview: string;
    overviewAr: string;
    objectives: string[];
    objectivesAr: string[];
    phases: AcademicPhase[];
    academicContext: string;
    academicContextAr: string;
    caseStudy: string;
    caseStudyAr: string;
  };
}

const slides: Slide[] = [
  {
    id: 'fundamentals',
    title: 'Precision & Metrology Fundamentals',
    titleAr: 'أصول الدقة والقياس للفنيين (Metrology)',
    subtitle: 'Geometric Dimensioning & Production Tolerances',
    subtitleAr: 'التفاوتات الهندسية وحدود التجاوز في الإنتاج',
    icon: Award,
    color: '#0077ff',
    gradient: 'from-[#0077ff] to-[#00d2ff]',
    libraryKeywords: ['MSA', 'measure', 'quality', 'inspection'],
    content: {
      overview: 'Quality on the shop floor begins with absolute precision. A technician’s primary duty is to safeguard product integrity by mastering tools like Vernier calipers, micrometers, and CMMs. Understanding Geometric Dimensioning and Tolerancing (GD&T) ensures that parts are machined precisely according to the engineering blueprint, minimizing allowable variation without compromising functionality.',
      overviewAr: 'الجودة في صالة الإنتاج أو المختبر تبدأ من الدقة المطلقة. الواجب الأساسي للفني أو المفتش هو حماية نزاهة المنتج من خلال إتقان أدوات القياس مثل القدمة ذات الورنية (Vernier)، الميكرومتر، وأجهزة CMM. الفهم العميق للرموز الهندسية وحدود التفاوت (GD&T) يضمن تشغيل وتشكيل الأجزاء بدقة تُطابق المخطط الهندسي (Blueprint)، وتقليل التباين المسموح به دون المساس بوظيفة المنتج النهائي.',
      objectives: [
        'Master reading strict engineering blueprints and GD&T symbols.',
        'Calibrate and handle delicate metrology tools to avoid measurement drift.',
        'Distinguish between Random Errors vs. Systematic Errors on machines.',
        'Execute immediate First-Piece Approval procedures before volume production.'
      ],
      objectivesAr: [
        'الإتقان التام لقراءة المخططات الهندسية المعقدة ورموز الأبعاد الهندسية (GD&T).',
        'معايرة والتعامل مع أدوات القياس الحساسة لمنع الانحراف التدريجي للقياسات.',
        'التفريق القطعي بين "الأخطاء العشوائية" و"الأخطاء النظامية" الناتجة عن تآكل قطع الآلة.',
        'تنفيذ إجراءات "اعتماد القطعة الأولى" (First-Piece Approval) بصرامة قبل إطلاق خط الإنتاج الكمي.'
      ],
      phases: [
        { name: 'Blueprint Verification', nameAr: 'التحقق من المخططات', desc: 'Confirming the latest revision of the drawing is actively used.', descAr: 'التأكد من استخدام النسخة المُحدثة والمعتمدة للمخطط (Revision Control) قبل بدء أي وظيفة.' },
        { name: 'Gage R&R Prep', nameAr: 'تجهيز أجهزة القياس', desc: 'Zeroing instruments and checking current calibration tags.', descAr: 'تصفير أدوات القياس والتأكد من تواريخ ملصقات المعايرة الدورية (Calibration Tags).' },
        { name: 'In-Process Inspection', nameAr: 'تفتيش أثناء التشغيل', desc: 'Taking periodic samples to verify tool wear hasn’t drifted tolerance.', descAr: 'سحب عينات فحص دورية (Patrol) للتأكد من أن تآكل الشفرات بالآلة لم يتعدَ التفاوتات المسموحة.' },
        { name: 'Quarantine Protocol', nameAr: 'بروتوكول العزل', desc: 'Applying red tags instantly on non-conforming batches to halt progress.', descAr: 'استخدام "البطاقات الحمراء" فوراً لعزل أي شحنة مشتبه بها لمنع تقدمها للخطوات التالية.' }
      ],
      academicContext: 'Metrology dictates that Measurement System Analysis (MSA) evaluates not just the part, but the measuring instrument itself. The "Rule of Ten" states the measuring instrument should be ten times more precise than the tolerance being measured. If a technician measures a tolerance of 0.1mm, the caliper must read up to 0.01mm resolution. Otherwise, the measurement variance hides the actual process variance.',
      academicContextAr: 'أكاديمياً وفنياً، ينص علم القياس (Metrology) في دراسة أنظمة القياس (MSA) على تقييم الأداة نفسها وليس فقط القطعة. بموجب "قاعدة العَشَرَة" (Rule of Ten)، يجب أن تكون دقة أداة القياس أكبر 10 مرات من التفاوت المطلوب لتلك القطعة. فإذا كان التفاوت المسموح للقطعة هو 0.1mm، فيجب أن يُقرأ جهاز القياس بدقة 0.01mm. عدا ذلك، سيختفي الخطأ الحقيقي للقطعة في ظل الخطأ الخاص بأداة القياس نفسها (Measurement Variance).',
      caseStudy: 'CNC Tolerance Drift: A junior operator ignored the calibration expiry of a digital micrometer. Due to a 0.05mm internal drift in the gage, 500 aerospace parts were machined progressively smaller than the acceptable lower specification limit (LSL). Implementing strict Daily Gauge Zeroing checks rescued future batches from thousands of dollars in scrap.',
      caseStudyAr: 'تآكل التفاوت في تشغيل CNC: تجاهل فني مبتدئ انتهاء صلاحية معايرة الميكرومتر الرقمي. وبسبب انحراف داخلي في الأداة بمقدار 0.05mm، تم التصنيع المستمر لـ 500 قطعة فضائية بأبعاد أصغر من "الحد الأدنى للمواصفة" (LSL). بتنفيذ فحوصات "التصفير اليومي" الصارمة وتسليم أجهزة القياس بنهاية الوردية، تم إنقاذ الشحنات اللاحقة من خردة بآلاف الدولارات.'
    }
  },
  {
    id: 'iso-shopfloor',
    title: 'ISO Control on the Shop Floor',
    titleAr: 'ضبط الـ ISO في صالة الإنتاج',
    subtitle: 'SOPs, Traceability & Work Instructions',
    subtitleAr: 'أدلة العمل وإجراءات التشغيل والتتبع',
    icon: Shield,
    color: '#00C853',
    gradient: 'from-[#00C853] to-[#64DD17]',
    libraryKeywords: ['iso', 'control', 'document'],
    content: {
      overview: 'For technicians, ISO 9001 isn’t an abstract binder in the office; it translates to "Say what you do, do what you say, and prove it with records." It governs Document Control—meaning using only officially stamped Work Instructions (WIs) and Standard Operating Procedures (SOPs). It mandates perfect material traceability so any defect can be traced back to the exact machine, batch, and time of creation.',
      overviewAr: 'بالنسبة للفني، فإن الـ ISO 9001 ليس مجرد ملفات في مكاتب الإدارة العليا، بل يُترجم حرفياً إلى: "اكتب ما تفعل، وافعل ما كتبت، وأثبت ذلك بالسجلات اليومية." هو يحكم ضبط الوثائق — مما يعني منع استخدام مسودات ورقية قديمة والاعتماد حصرياً على تعليمات العمل (WIs) وأدلة التشغيل القياسية (SOPs) المختومة والمعتمدة. كما يفرض تتبعاً دقيقاً جداً للمواد ليتم إرجاع أي عيب لاحقاً إلى الماكينة والساعة المحددة التي أُنتج فيها.',
      objectives: [
        'Adhere strictly to authorized Work Instructions—never rely on memory.',
        'Maintain impeccable batch Traceability and Lot Labeling at your station.',
        'Identify unauthorized, expired, or red-lined engineering documents.',
        'Properly route and record Non-Conforming Materials (NCM).'
      ],
      objectivesAr: [
        'الالتزام الحرفي بتعليمات العمل المعتمدة وعدم الاعتماد على الذاكرة الشخصية في الخطوات الحرجة.',
        'الحفاظ التام على تسلسل الأرقام المرجعية (Lot/Batch Tracking) لضمان تتبع المواد بمحطتك.',
        'التمييز السريع للرسومات أو المستندات الهندسية منتهية الصلاحية أو غير المصرح بها.',
        'معالجة وتسجيل وعزل "المواد غير المطابقة" (NCM) حسب الإجراء الرسمي دون الاجتهاد بالإخفاء.'
      ],
      phases: [
        { name: 'Document Validation', nameAr: 'التحقق الوثائقي', desc: 'Checking revision codes on the terminal before hitting Start.', descAr: 'فحص أكواد الإصدارات للمستندات على الشاشة أو الورق قبل ضغط زر "بدء التشغيل".' },
        { name: 'Material ID', nameAr: 'هوية المواد', desc: 'Verifying raw materials carry valid supplier Certificates of Analysis (CoA).', descAr: 'التثبت من أن المواد الخام الواردة للماكينة تحمل شهادات تحليل (CoA) معتمدة.' },
        { name: 'Process Logs', nameAr: 'سجلات العمل', desc: 'Signing off step-by-step traveler forms to signify operational completion.', descAr: 'التوقيع شخصياً على بطاقات "تتبع المسار" خطوة بخطوة كدليل على التمام دون تجاوز.' },
        { name: 'NCM Tagging', nameAr: 'بطاقات عدم المطابقة', desc: 'Logging defective items into the digital/physical quarantine system.', descAr: 'تدوين القطع التالفة فوراً في السجل، ووضعها في الحيز الشبكي أو المادي المعزول المخصص للإتلاف/الفرز.' }
      ],
      academicContext: 'ISO’s primary defense against human error is Configuration Management and Traceability Mapping. If an external auditor asks a technician "How long to bake this coating?", the answer must not be "I think 20 minutes." The correct technician response is: "According to SOP-402 Rev C hanging on this wall, it is 20 minutes." The auditor judges the system’s robustness, not just the operator’s memory.',
      academicContextAr: 'الخط الدفاعي الأساسي في عُرف الـ ISO لمواجهة الخطأ البشري هو ما يُعرف بـ (Configuration Management). إذا سأل مدقق خارجي الفني: "ما درجة حرارة لحام هذه القطعة؟"، فيجب ألا يرد الفني بـ "أعتقد أنها 180" أو "هكذا فعلناها سابقاً." الجواب المعتمد والوحيد للفني هو: "أقوم بالضبط على 180 وفقاً لدليل التشغيل SOP-402 الإصدار الخامس المعلق فوق الماكينة هنا." المدقق يقيّم متانة صمود النظام، وليس قوة ذاكرتك كفني.',
      caseStudy: 'The Counterfeit Raw Material Alert: A technician noticed a pallet of resins had undocumented lot numbers. Instead of loading the hopper to meet production targets, they paused the line and escalated to QA. Investigation revealed it was a counterfeit mixed batch that would have caused massive engine failures down the line. Following the WIP (Work In Progress) tracing SOP saved the company from a massive recall.',
      caseStudyAr: 'إنذار المواد الخام الخاطئة: لاحظ فني خلط مواد أن إحدى البليتات الواردة من الراتينج لا تحمل تصنيف "رقم الدفعة" (Lot Number). بدلاً من تفريغها في ماكينة الخلط لتحقيق مستهدف الإنتاج اليومي، أثبتت كفاءة الفني بإيقاف الخط وتصعيد الأمر لإدارة الجودة. كشف الفحص أنه كان مسحوقاً كيميائياً غير مطابق سيتسبب في انكسارات لاحقة للقطعة. الالتزام المطلق للفني بتعليمات "التتبع" أنقذ الشركة من كارثة استدعاء مُنتجات هائلة.'
    }
  },
  {
    id: 'lean-smka',
    title: 'Lean Manufacturing & 5S Workspaces',
    titleAr: 'اللين والتصنيع الرشيق ومنهجية 5S',
    subtitle: 'Value Stream, Waste Hunting (TIMWOODS) & Kaizen',
    subtitleAr: 'خريطة القيمة، اصطياد الهدر (TIMWOODS) والكايزن',
    icon: TrendingUp,
    color: '#6200EA',
    gradient: 'from-[#6200EA] to-[#B388FF]',
    libraryKeywords: ['lean', '5s', 'kaizen', 'improvement', 'toyota'],
    content: {
      overview: 'Lean Manufacturing is the technician’s best weapon against chaotic environments. It focuses on relentlessly hunting down the 8 Wastes (TIMWOODS). A true “Lean” technician maps every physical motion—if a tool requires walking 10 steps, that’s considered "Motion Waste." Through 5S (Sort, Set in order, Shine, Standardize, Sustain), workstations are organized meticulously using shadow boards to eliminate hunting for equipment.',
      overviewAr: 'منهجية الرشاقة أو (اللين) تعتبر أقوى سلاح في يد الفني للقضاء على بيئة العمل الفوضوية والمرهقة. المنهج يعتمد على اصطياد والتخلص من الفواقد الثمانية للهدر (والمجموعة في كلمة TIMWOODS). الفني الـ(Lean) يُقيّم كل حركة جسدية يقوم بها؛ فمجرد السير 10 خطوات لإحضار مفتاح ربط يُعتبر "هدر الحركة" (Motion Waste). وعبر تنفيذ منهج 5S يتم ترتيب الأدوات في لوحات ظل (Shadow Boards) تقضي تماماً على تشتت الفني أثناء العمل.',
      objectives: [
        'Identify and eliminate the 8 deadly wastes (TIMWOODS) daily.',
        'Implement SMED (Single Minute Exchange of Die) to slash setup times.',
        'Execute strict 5S principles at shift start and end.',
        'Provide Kaizen (small, continuous improvement) ideas constantly.'
      ],
      objectivesAr: [
        'التعرّف والتقاط الفواقد المهلكة الثمانية (TIMWOODS) يومياً في محطة عملك.',
        'تطبيق مفاهيم تغيير القوالب والأدوات السريع (SMED) لخفض وقت تهيئة الماكينة بين الطلبيات.',
        'التنفيذ الصارم لانضباط الـ 5S في ترتيب الأدوات، اللمعان والنظافة، في بداية ونهاية ورديتك.',
        'طرح وتجربة أفكار (كايزن) يومية بسيطة تخفف الجهد البدني وتُسرع الجودة.'
      ],
      phases: [
        { name: 'Sort (Seiri)', nameAr: 'الفرز - Seiri', desc: 'Removing all unnecessary items from the immediate workstation.', descAr: 'التخلص وإبعاد كل ما هو غير ضروري عن محطتك فوراً لمنع التكدس.' },
        { name: 'Set in Order (Seiton)', nameAr: 'الترتيب - Seiton', desc: 'A place for everything, and everything strictly in its place.', descAr: 'تخصيص "مكان لكل شيء، ووضع كل شيء في مكانه فقط" باستخدام لوحات مرئية.' },
        { name: 'Shine (Seiso)', nameAr: 'التلميع فحصاً - Seiso', desc: 'Cleaning as a form of deep inspection for machine leaks or cracks.', descAr: 'النظافة لا تعني إزالة الغبار فقط، بل هي أسلوب لـ "الفحص بصرياً" لكشف تسريب الزيت أو تشققات الماكينة.' },
        { name: 'Standardize/Sustain', nameAr: 'التقييس والتثبيت - Shitsuke', desc: 'Creating visual color-coded standards to cement the new habits.', descAr: 'تلوين المناطق الحيوية وبناء قواعد بصرية تضمن عدم التراجع للوضع السيء ثانيةً.' }
      ],
      academicContext: 'The 8 Wastes (TIMWOODS) translate to: Transport, Inventory, Motion, Waiting, Over-production, Over-processing, Defects, and Skills underutilized. In cycle-time mathematics, Lean asserts that Value-Added time is roughly 5% of total time. A technician spending 15 minutes wrestling with a faulty air-hose is generating 100% Non-Value-Added (NVA) work. Lean equips the technician to flag these NVA activities to supervisors as systematic process failures, not personal failures.',
      academicContextAr: 'اختصار (TIMWOODS) المريع يشمل: النقل العشوائي، المخزون المتراكم، الحركة المتكررة بلا داعي، الانتظار بلا عمل، الإنتاج الزائد، العيوب، والمهارات المهدورة. رياضياً، تؤكد مدارس (اللين) أن وقت الإضافة الحقيقية لقيمة القطعة غالباً يمثل 5٪ فقط من إجمالي وقت بقائها في المصنع. فمثلاً، فني يصارع خرطوم ضغط هواء معطوب لمدة 15 دقيقة يُنتج 100٪ (عمل غير مُضيف للقيمة NVA). منهج اللين يُمكّن الفني من الإبلاغ عن هذا الهدر بجرأة للمشرفين كفشل نظامي وليس عبئاً يتحمله كفشل شخصي.',
      caseStudy: 'The Shadow Board Effect: A maintenance technician team frequently lost critical Allen Keys, causing line setup to take 45 mins. By painting a physical outline for each tool on a board (Shadow Board), missing tools were instantly visible to the naked eye. Setup times dropped to 17 mins, recovering 1 hour of operational uptime daily.',
      caseStudyAr: 'تأثير لوحة الظل (Shadow Board): فريق فنيي صيانة كانوا يعانون ببطء من ضياع مفاتيح "الآلانكيه" الحرجة، مما جعل إعداد خط الإنتاج المعطل يستغرق 45 دقيقة. بمجرد قيامهم بطلاء ورسم شكل خارجي لكل أداة ولونها الخاص على لوح خشبي واضح فوقهم، أصبح غياب إحدى القطع "يصرخ" للرؤية بالعين المجردة! تقلص وقت إعداد الخط إلى 17 دقيقة، ما استرد ساعة كاملة من إنتاج آلة تتخطى قيمتها مئات الآلاف كل يوم.'
    }
  },
  {
    id: 'spc-technicians',
    title: 'SPC Charts for Machinists',
    titleAr: 'خرائط الجودة الإحصائية SPC للماكينات',
    subtitle: 'Reading the Voice of the Process & Nelson Rules',
    subtitleAr: 'قراءة صوت الماكينة وقواعد الكشف المبكر',
    icon: BarChart3,
    color: '#00BCD4',
    gradient: 'from-[#00BCD4] to-[#00E5FF]',
    libraryKeywords: ['spc', 'control-charts', 'statistics', 'six sigma', 'histogram'],
    content: {
      overview: 'Statistical Process Control (SPC) allows technicians to hear the "Voice of the Process." By logging measurements of 5 sequential parts every hour into an X-Bar & R chart, you are tracking the machine’s heartbeat. You don’t wait for a part to be rejected out of tolerance (Specs limits); you take action the moment the data points wildly jump over the statistical Control Limits (UCL/LCL).',
      overviewAr: 'في أرض المصنع، يسمح "الضبط الإحصائي للعمليات (SPC)" للفنيين بالاستماع بدقة لـ "صوت الماكينة الداخلي". عندما تقوم بتسجيل مقاسات 5 قطع متتالية كل ساعة على خرائط (X-Bar & R)، فأنت فعلياً تقرأ تخطيط قلب للآلة. لا تنتظر كفني حتى تخرج القطعة مرفوضة من حدود التفاوت الهندسي (Tolerance)، بل ستتحرك وتتخذ الإجراء الاحترازي في الثانية التي تلاحظ فيها القراءات تقفز بغرابة خارج "حدود السيطرة الإحصائية الوهمية" (UCL/LCL).',
      objectives: [
        'Log data accurately into Variable (X-Bar/R) or Attribute (p-chart) sheets.',
        'Distinguish instantly between Specification Tolerances vs. Control Limits.',
        'Detect 7-point trends and massive spikes using Nelson Rules.',
        'Adjust feeds, speeds, or stop the machine before scrap is generated.'
      ],
      objectivesAr: [
        'التسجيل العالي الدقة للبيانات في أوراق رسوم المتغيرات (مثل X-Bar) أو الصفات المباشرة.',
        'أهمية التفريق بلحظتها بين "حدود التفاوت الهندسي" المسموحة وبين "حدود السيطرة للمكينة".',
        'اكتشاف التدهور باستخدام (قواعد نيلسون)، مثل وجود 7 نقاط متتالية تنزل للأسفل دون صعود.',
        'ضبط معايير التشغيل (التغذية، السرعة، تعويض التآكل) أو إيقاف الماكينة قبل بدء إنتاج كوارث ومرفوضات.'
      ],
      phases: [
        { name: 'Data Logging', nameAr: 'تعبئة القراءات', desc: 'Properly capturing random subgroup arrays of measurement data.', descAr: 'إدخال مقاسات العينة الفرعية المأخوذة بشكل عشوائي تماماً ومن نفس الماكينة بدون تحيز.' },
        { name: 'X-Bar (Average)', nameAr: 'مؤشر اكس-بار (X-Bar)', desc: 'Plotting the average length/weight of the subgroup.', descAr: 'مؤشر يرسم متوسط (طول أو وزن) الخمس قطع مجتمعة لمعرفة تمركز الإنتاج.' },
        { name: 'R-Chart (Range)', nameAr: 'مؤشر نطاق التباين (R-Chart)', desc: 'Plotting the difference between the max and min points inside the sample.', descAr: 'رسم الفارق بين أكبر نقطة وأقل نقطة في العينة لمعرفة (التباين وعشوائية القطع داخل العينة).' },
        { name: 'Out-Of-Control Alerts', nameAr: 'إنذار الانحراف', desc: 'Calling supervisors when rule triggers (e.g. 7 points ascending).', descAr: 'استدعاء الصيانة أو المشرف عند تحفيز قاعدة إحصائية (كالنقاط السبع المتصاعدة تدريجياً للهاوية).' }
      ],
      academicContext: 'To a technician, "Machine Variation" comes in two flavors: Common Cause (natural variation, like microscopic vibration) which you leave alone, and Special Cause (a broken tool tip, temperature spike) which you must aggressively fix. The SPC chart specifically separates the two mathematical realities. If a technician adjusts a machine for Common Cause variation, they are engaging in "Over-compensation/Tampering," which actually creates infinitely worse defects.',
      academicContextAr: 'بالنسبة للمُشغل، التباين (Variation) له نوعان: "سبب طبيعي-شائع" (مثل الاهتزاز الميكروي العادي للمحرك) وهنا كفني إياك والمساس بالماكينة. والثاني هو "سبب مستجد-خاص" (כانكسار حافة القاطع، قفزة هائلة في الحرارة) وهنا يجب التدخل بشراسة وتقويمها. الرسوم البيانية لـ SPC تشرح لك أيهما يحدث رياضياً. إذا قام الفني الجاهل بتعديل الماكينة على الخطأ الطبيعي الشائع، فهو يرتكب جريمة تُسمى بـ "العبث أو التعديل المفرط (Tampering)"، مما يزيد الخلل أضعافاً وبشكل مدمر.',
      caseStudy: 'Plastic Injection Molding: An operator plotting an R-Chart (which tracks the difference between the largest and smallest part per sample cluster) noticed the range line suddenly widening, even though the overall dimensions were within spec. The charts proved the mold’s internal cooling water lines were partially blocked. Stopping to flush the lines saved hours of upcoming microscopic shrink defects.',
      caseStudyAr: 'فنيي حقن البلاستيك (Injection Molding): لاحظ مفتش جودة يقوم برسم مخطط التباين R-Chart (والذي يتتبع الاختلاف بين أكبر وأصغر قطعة مسحوبة) أن خط الرئة يتسع فجأة للأعلى بشدة، بالرغم من أن أبعاد القطعة الظاهرية لا تزال ضمن التفاوت المسموح للعميل! الرسوم أثبتت وجود خلل تبريد حراري. بتوقيف الماكينة تبيّن أن خطوط تبريد القالب مسدودة جزئياً بترسبات. غسيل الخطوط وتصحيحها بناءً على رصد الـ SPC البصري أنقذ آلاف القطع من عيوب الانكماش (Shrinkage) اللاحقة المكلفة للغاية.'
    }
  },
  {
    id: 'fmea-poka',
    title: 'FMEA & Poka-Yoke Mistake Proofing',
    titleAr: 'FMEA ومانع الأخطاء البشري Poka-Yoke',
    subtitle: 'Failure Mode Prevention at the Machine Tool',
    subtitleAr: 'منع كوارث الماكينة عبر تقييم الخطر والتجهيز',
    icon: AlertTriangle,
    color: '#FF1744',
    gradient: 'from-[#FF1744] to-[#FF5252]',
    libraryKeywords: ['fmea', 'poka-yoke', 'error-proofing', 'risk', 'prevention'],
    content: {
      overview: 'FMEA (Failure Mode and Effects Analysis) isn’t just for engineers; technicians are the ultimate source of its real-world data. When a technician explains how a part could be accidentally loaded upside-down, that feeds the FMEA. The ultimate goal on the shop floor is deploying Poka-Yoke (Mistake Proofing)—installing pins, sensors, or jigs that physically stop the technician from making an error, regardless of fatigue.',
      overviewAr: 'ملف الموثوقية وتقييم الأعطال (FMEA) لا يُكتب مهندسياً بمعزل؛ فالفنيون هم مصدر البيانات الحياتية والموثوقة الوحيد له. عندما يُحذّر الفني من سهولة تركيب قطعة معدنية بالغلط مقلوبة، فهذه شرارة الـ FMEA الأساسية! الهدف الأسمى داخل ورشة العمل هو بناء نظام Poka-Yoke (مانع للأخطاء الأحمق/البشري) — وهو تركيب مسامير عزل، حساسات ضوء، أو قوالب صلبة هندسية تجعل من "المستحيل فيزيائياً" على الفني تركيبها بالخطأ مهما بلغ به الإعياء أو الإرهاق.',
      objectives: [
        'Identify precisely the specific Failure Modes in the operational setup.',
        'Understand the RPN (Severity x Occurrence x Detection) rating mechanism.',
        'Report “Near Misses” to permanently enhance the facility Control Plan.',
        'Suggest mechanical or electronic Poka-Yoke safeguards directly.'
      ],
      objectivesAr: [
        'التحديد الدقيق لـ "أنماط وآليات حدوث الفشل والأعطال" في التجهيزات ومعدات الماكينة.',
        'فهم آلية التصنيف الموضعي للمخاطر وفق (شدة النتيجة x تكرار الحدوث x صعوبة الاكتشاف).',
        'الإبلاغ عن "الأخطاء الوشيكة أو حوادث كادت تقع" (Near Misses) لدمجها بدفتر العقول وتحسين "خطط الضبط".',
        'تقديم مقترحات هندسية ملموسة لتركيب موانع Poka-Yoke (كهربية، ميكانيكية، إنذارات ضوئية) للماكينات.'
      ],
      phases: [
        { name: 'Mode Identification', nameAr: 'تحديد النمط', desc: 'Noticing how a fixture could be clamped misaligned.', descAr: 'ملاحظة الطريقة المُحتملة والتي قد يُغلق بها المشبك الميكانيكي بوضعية مائلة.' },
        { name: 'Effect Tracking', nameAr: 'تتبع التأثير الكارثي', desc: 'Understanding what happens downstream if the misaligned part passes.', descAr: 'الوعي الكامل بما سيحدث للعميل النهائي ولآلة التجميع اللاحقة في حال مرور القطعة المعيبة وتجاوزك.' },
        { name: 'Cause Correlation', nameAr: 'ربط الجذور', desc: 'Linking the misalignment back to metal chips stuck under the jig base.', descAr: 'ربط سبب الميل الميكانيكي بتراكم نشارة معدنية وأوساخ متراكمة أسفل قاعدة القالب.' },
        { name: 'Mistake Proofing', nameAr: 'الحصن الواقي (Poka-Yoke)', desc: 'Installing an air pressure sensor to ensure base is perfectly flat.', descAr: 'تركيب حساس استشعار لضغط الهواء ينبه ويُوقف الماكينة إلا إذا كانت القاعدة مسطحة وخالية من النشارة تماماً!' }
      ],
      academicContext: 'In reliability methodology, the "Detection" metric relies intensely on the technician. If checking a torque specification requires stopping a line and grabbing a specialized hidden wrench, the probability of a technician actually checking it drops massively (High Detection Risk). A great shop floor shifts focus from administrative controls (warning signs) to engineered controls (auto-torque electric drills).',
      academicContextAr: 'في منهجيات الاعتمادية، يعتمد مقياس (الاكتشاف: Detection) بقوة على راحة وعقلية الفني. إذا كان التحقق من "درجة عزم الرباط" يتطلب إيقاف الخط بأكمله والسير لجلب مفتاح عزم مُعقّد بعيداً في درج مغلق، فإن احتمال أن يقوم الفني الفعلي باستخدامه يتقلص جداً (تصنيف خطر كشف عالي جداً للمؤسسة). خطوط الإنتاج المتفوقة تنتقل من استخدام "الروادع الإدارية" (כلافتات التحذير والورق المزعج) إلى "الروادع الهندسية" الصمّاء (مثل توزيع مفكات كهربائية قاطعة تتوقف تلقائياً عند وصول العزم للرقم الهندسي الدقيق).',
      caseStudy: 'Automotive Assmebly Poka-Yoke: A brake-pad installation operator occasionally missed installing one of the 4 tiny securing clips due to repetition fatigue. Standard QA audits didn’t solve it. The solution was a cheap mechanical Poka-Yoke: a small custom-drilled plastic tray. Every cycle, exactly 4 clips were dispensed. If the operator finished the brake pad and one clip remained in the tray, it became an instant visual failure trigger.',
      caseStudyAr: 'مانع الخطأ في تجميع السيارات: كان عامل تجميع الفرامل ينسى ببعض الأحيان تركيب واحد من المشابك المعدنية الصغيرة الـ4 بسبب التعب المتكرر للوردية الممتدة. تحذيرات المراقبين واللوائح لم تُجدي نفعاً قاطعاً! الحل كان (Poka-Yoke) ميكانيكي عبقري ورخيص: صينية بلاستيكية مثقوبة برمجت لتسقط من علبتها مشابك 4 بالعدد لكل عجلة تحديداً.. بمجرد أن ينتهي العامل، إذا نظر للصينية ووجد مقطعاً واحداً متبقياً، فإنه يُدرك على الفور بشكل بصري وقاطع أنه ارتكب هفوة، وأن العجلة ناقصة. توقفت الشكاوى عالمياً عند الصفر!'
    }
  },
  {
    id: '8d-technician',
    title: '8D Root Cause & The 5 Whys',
    titleAr: 'المنهجية 8D وأداة الـ 5 لماذا',
    subtitle: 'Containment actions and Ishikawa Fishbone tracking',
    subtitleAr: 'إجراءات الحجر العاجل ومخطط عظمة السمكة',
    icon: Network,
    color: '#D500F9',
    gradient: 'from-[#D500F9] to-[#E040FB]',
    libraryKeywords: ['8d', 'root-cause', '5 whys', 'ishikawa', 'problem-solving', 'correction', 'action'],
    content: {
      overview: 'When a critical failure occurs, the 8 Disciplines (8D) protocol is triggered. A technician is vital in the first 4 steps. Your first duty is containment—stopping the bleeding by segregating stock perfectly. Then, you use tools like the Ishikawa (Fishbone) diagram and "5 Whys" methodology on the physical machine to drill down past superficial excuses down to the core systemic failure.',
      overviewAr: 'حين تنفجر أزمة عيوب معقدة أو كارثية في الخط، تُفّعل منصة "الانضباطات الثمانية" (8D). يُعتبر الفني هو الفارس الأول في إنجاز الخطوات الـ 4 الأولى. واجبك الأسمى فوراً هو (العزل والاحتواء) — نزيف المشكلة يجب أن يتوقف بعزل المخزون المشبوه بأقفال. ثم يأتي التحدي التحليلي باستخدام مخطط إيشيكاوا (عظمة السمكة لتصنيف الأسباب) وأداة "أسئلة الاستجواب: لماذا خمس مرات متتالية؟" على الماكينة الفيزيائية لاختراق الأعذار السطحية الساذجة والوصول للخلل الصميمي الميكانيكي.',
      objectives: [
        'Build 100% rigid containment barriers physically in the workspace.',
        'Actively sketch Fishbone diagrams detailing Machine, Man, Method, Material.',
        'Perform the 5 Whys technique without shifting blame exclusively to "Operator Error".',
        'Implement the resulting Corrective Actions (change gear, alter SOP) correctly.'
      ],
      objectivesAr: [
        'بناء حواجز وبوابات حجر صحي مادي لـ 100٪ من الشحنات المتضررة لمنع خلطها مطلقاً مع المنتجات الجديدة.',
        'الرسم الفعّال لمخطط "عظمة السمكة" لتقسيم المشكلة لـ (منطقة الآلة، المادة، الطريقة التشغيلية، والإنسان).',
        'ممارسة تمرين الاستجواب الذاتي (5 لماذا؟) بقسوة دون إلقاء اللوم الجبان وبشكل حصري على عبارة "خطأ تشغيلي لعامل آخر".',
        'تطبيق "الإجراءات التصحيحية" الناتجة بدقة متناهية (تغيير ترس، تزييت كثيف، تحويل مسار الماكينة) في الوردية القادمة.'
      ],
      phases: [
        { name: 'D3 Containment', nameAr: 'D3 حجر واحتواء', desc: 'Isolating the symptom immediately to protect downstream customers.', descAr: 'عزل الأعراض واحتجاز وتأشير جميع البالات المعيبة بشكل مقطوع ومرئي لحماية عميلنا الداخلي/الخارجي فوراً.' },
        { name: 'D4 Root Cause (RCA)', nameAr: 'D4 تحديد الجذور RCA', desc: 'Conducting intense interrogative 5 Whys on the actual line.', descAr: 'إجراء تحقيقات استجوابية كثيفة متعمقة ومبنية على الدليل أمام عجلات وخطوط الإنتاج المادية وعدم الجلوس في مكاتب مغلقة.' },
        { name: 'Is/Is Not Logic', nameAr: 'مقارنة (يكون / لا يكون)', desc: 'Proving the defect happens on line 1 but NOT on line 2, leading to major clues.', descAr: 'إثبات هندسي مقارن للظاهرة: (لماذا تحدث هذه المشكلة على خط 1 تحديداً في الليل؟ ولكنها "لا تحدث" أبداً على خط 2 نهاراً؟) كدلائل مفصلية.' },
        { name: 'D6 Implementation', nameAr: 'D6 تنفيذ التصحيح الدائم', desc: 'Executing the precise mechanical fix determined by the strike team.', descAr: 'التثبيت التشغيلي الحازم للحل والمصدات الوقائية الميكانيكية التي ابتكرها فريق العمل والهندسة.' }
      ],
      academicContext: 'In professional Root Cause Analysis, stating "The operator forgot" is never an acceptable root cause; it is a superficial symptom of a broken system. The 5 Whys pushes you further: Why did they forget? (The documentation was confusing). Why was it confusing? (It was printed in 1999 and the font is blurry). Why hasn’t it been updated? (No document control cycle exists for peripheral stations). The technician transforms a human error into an auditable process correction.',
      academicContextAr: 'في مدرسة التحليل الجذري المتقدم، قول المشرف السريع "لقد تغافل العامل / العامل مهمل" هو عذر مرفوض، لأنه مجرد "أثر سطحي لنظام إداري وفني متكسّر". المنهجية (الخمس لماذا) تدفعك كفني للاختراق أعمق. لماذا نسى؟ (كان دليل التشغيل المعلق معقداً وغير مفهوم). لماذا معقد؟ (مطبوع بخط متداخل وممزق منذ 1999 ولا يوضح هذه القطعة بالذات). لماذا لم يتم تغييره للمشغل؟ (لا توجد آلية صيانة دورية للوثائق الإرشادية بجوار المكائن). هكذا يحول الفني المتمرس خطأ العنصر البشري المكسور إلى إصلاح جذري يمكن للمفتش قياسه وضبطه للأبد.',
      caseStudy: 'The 5 Whys of the Leaking Machine: 1. Why was there a puddle of oil? (The hydraulic seal broke). 2. Why did it break? (The pressure spiked past the safety valve). 3. Why did the pressure spike? (The bypass tube was hopelessly clogged with steel chips). 4. Why were chips present inside hydraulic bypasses? (The filter wasn’t changed). 5. Why wasn’t it changed? (The PM / Preventive Maintenance schedule for filter cleaning neglected bypass systems entirely). Root Cause resolved forever.',
      caseStudyAr: 'تطبيق أداة الـ(5 لماذا؟) على ماكينة تفيض بالزيت: 1. لماذا توجد بركة زيت على أرض المصنع؟ (لأن مانع التسريب -Seal- في مضخة الهيدروليك انكسر بالداخل). 2. ولماذا انكسر؟ (لأن ضغط الزيت الداخلي قفز بقوة وتجاوز حاجز الصمام الآمن). 3. لماذا قفز الضغط للجنون؟ (لأن أنبوب "تخفيف الضغط الراجع" היה مسدوداً تماماً برواسب حديدية ثقيلة). 4. كيف دخلت النفايا والبرادة الحديدية لأعماق الهيدروليكيات بالذات!؟ (لأن الفلتر الرئيسي لم يتم تغييره). 5. ولماذا لم يستبدل في موعده؟ (لأن خطة جدول الصيانة الوقائية السنوية للمصنع -PM- أهملت وأسقطت ذكر خطوط ضغط الزيت الجانبية تماماً من جداول التنظيف!). هذا هو الجذر الدفين للمشكلة.. الذي لم ولن يتم حله بمجرد صبغ بقعة الزيت وتغيير طوق الختم وانصراف الفني!'
    }
  }
];

export default function QualitySlides() {
  const { language } = useTranslation();
  const [searchParams] = useSearchParams();
  const slideFromUrl = searchParams.get('slide');
  
  const initialIndex = slideFromUrl 
    ? Math.max(0, slides.findIndex(s => s.id === slideFromUrl))
    : 0;

  const [slideIndex, setSlideIndex] = useState(initialIndex);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'steps' | 'deepdive'>('overview');

  // Auto-jump if deep-linked
  useEffect(() => {
    if (slideFromUrl) {
      const idx = slides.findIndex(s => s.id === slideFromUrl);
      if (idx !== -1 && idx !== slideIndex) {
        setSlideIndex(idx);
      }
    }
  }, [slideFromUrl]);

  // Reset tab when changing slide
  useEffect(() => {
    setActiveTab('overview');
  }, [slideIndex]);

  const isRTL = language === 'ar';
  const slide = slides[slideIndex];
  const Icon = slide.icon;

  const handleNext = () => {
    if (slideIndex < slides.length - 1) setSlideIndex(slideIndex + 1);
  };

  const handlePrev = () => {
    if (slideIndex > 0) setSlideIndex(slideIndex - 1);
  };

  const getRelatedLibraryItems = (keywords: string[]) => {
    const allLibraryItems = [
      ...qualityDefinitions,
      ...qualityStandards,
      ...qualityTools,
      ...qualityBooks
    ];
    
    // Process items & sort by relevance
    const scoredItems = allLibraryItems.map(item => {
      let score = 0;
      const searchableText = `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase();
      
      keywords.forEach(kw => {
        if (searchableText.includes(kw.toLowerCase())) {
           score += 1;
        }
      });
      return { item, score };
    });
    
    return scoredItems
      .filter(i => i.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(i => i.item)
      .slice(0, 4); // Take top 4 most relevant
  };

  const relatedLibraryItems = getRelatedLibraryItems(slide.libraryKeywords);

  const tabs = [
    { id: 'overview', label: isRTL ? 'نظرة عامة' : 'Overview', icon: BookOpen },
    { id: 'steps', label: isRTL ? 'الخطوات التنفيذية' : 'Execution Steps', icon: Target },
    { id: 'deepdive', label: isRTL ? 'حالات ودراسات' : 'Deep Dive', icon: Briefcase }
  ] as const;

  return (
    <div className={`flex h-screen bg-[#050508] overflow-hidden ${isRTL ? 'font-arabic' : ''}`}>
      
      {/* Sidebar: Course Syllabus */}
      <div className={`
        ${isSidebarOpen ? 'w-80' : 'w-0'} 
        transition-all duration-300 ease-in-out shrink-0 bg-[#0a0a10] border-r border-white/5 flex flex-col z-20 overflow-hidden
        ${isRTL ? 'border-r-0 border-l' : ''}
      `}>
        <div className="p-6 border-b border-white/5 shrink-0">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-[#00A3E0]" />
            {isRTL ? 'أكاديمية المستندات' : 'Technical Academy'}
          </h2>
          <p className="text-xs text-white/40 mt-2 font-bold uppercase tracking-wider">
            {isRTL ? 'المهارات الميدانية والمكتبة' : 'Field Skills & Knowledge'}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto scroller-hide p-4 space-y-2">
          {slides.map((s, idx) => {
            const SIcon = s.icon;
            const isActive = idx === slideIndex;
            return (
              <button
                key={s.id}
                onClick={() => setSlideIndex(idx)}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex flex-col gap-3 group
                  ${isActive 
                    ? `bg-white/10 border border-white/10 shadow-lg` 
                    : 'hover:bg-white/5 border border-transparent cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${isActive ? `bg-gradient-to-br ${s.gradient}` : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <SIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/40 group-hover:text-[#00A3E0]'}`} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className={`font-bold truncate text-sm transition-colors ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                      {isRTL ? s.titleAr : s.title}
                    </h3>
                  </div>
                </div>
                {isActive && (
                  <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.8 }} className={`h-full bg-gradient-to-r ${s.gradient}`} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen relative overflow-hidden bg-[#0a0a0f]">
        
        {/* Aesthetic Grid Background */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
        />

        {/* Animated Ambient Background Glow (Fixed behind content) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            key={`${slide.id}-top`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
            className={`absolute -top-40 -right-40 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-gradient-to-br ${slide.gradient} rounded-full blur-[120px] mix-blend-screen opacity-30`} 
          />
          <motion.div 
            key={`${slide.id}-bottom`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}
            className={`absolute -bottom-40 -left-40 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-gradient-to-tr ${slide.gradient} rounded-full blur-[120px] mix-blend-screen opacity-20`} 
          />
        </div>

        {/* Top Navbar */}
        <div className="absolute top-0 left-0 right-0 p-4 lg:p-6 z-30 flex items-center justify-between pointer-events-none">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 rounded-xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 text-white/50 hover:text-white pointer-events-auto transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="px-4 py-2 rounded-xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 text-[10px] font-bold text-white/40 tracking-widest uppercase pointer-events-auto">
            {slideIndex + 1} / {slides.length}
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="flex-1 overflow-y-auto scroller-hide scroll-smooth relative z-10" id="lesson-scroll-container">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-5xl mx-auto px-6 lg:px-12 pt-32 pb-40 relative z-10"
            >
              
              {/* Hero Header Section */}
              <div className="mb-12 text-center md:text-start flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className={`w-24 h-24 shrink-0 rounded-[2rem] bg-gradient-to-br ${slide.gradient} p-6 shadow-2xl shadow-black/50 border border-white/20`}>
                  <Icon className="w-full h-full text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-4 drop-shadow-lg">
                    {isRTL ? slide.titleAr : slide.title}
                  </h1>
                  <h2 className="text-xl md:text-2xl text-[#00A3E0] font-bold tracking-wide">
                    {isRTL ? slide.subtitleAr : slide.subtitle}
                  </h2>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex flex-wrap items-center gap-2 mb-12 p-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 w-fit">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all
                        ${isActive 
                          ? `bg-gradient-to-r ${slide.gradient} text-white shadow-lg` 
                          : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                    >
                      <TabIcon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Content Area based on Tab */}
              <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                  
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Overview Block */}
                      <div className="p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 mb-12 shadow-2xl">
                        <p className="text-white/90 leading-relaxed font-bold text-xl md:text-2xl tracking-wide">
                          {isRTL ? slide.content.overviewAr : slide.content.overview}
                        </p>
                      </div>

                      {/* Related Library Resources Grid */}
                      {relatedLibraryItems.length > 0 && (
                        <div className="p-8 rounded-[2rem] bg-gradient-to-t from-white/5 to-transparent border border-[#00A3E0]/20 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00A3E0]/10 rounded-full blur-[80px]" />
                          <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
                            <Library className="w-6 h-6 text-[#00A3E0]" />
                            {isRTL ? 'موارد مرتبطة من مكتبة الجودة' : 'Verified Library Resources'}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                            {relatedLibraryItems.map((item, idx) => (
                              <div key={idx} className="p-5 bg-[#050508]/80 border border-white/5 rounded-2xl flex gap-4 pr-6 group relative overflow-hidden shrink-0 hover:bg-white/5 transition-colors">
                                <div className={`absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b ${slide.gradient} opacity-0 group-hover:opacity-100 transition-opacity disabled:rtl`} />
                                <div className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b ${slide.gradient} opacity-0 group-hover:opacity-100 transition-opacity hidden rtl:block`} />
                                
                                <div className="p-3 bg-white/5 rounded-xl h-fit w-fit shrink-0">
                                  <BookOpen className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0 pb-2">
                                  <h4 className="font-bold text-white mb-2 leading-relaxed text-lg">{isRTL && item.titleAr ? item.titleAr : item.title}</h4>
                                  <p className="text-sm text-white/70 leading-relaxed mb-4 font-medium">
                                    {isRTL && item.descriptionAr ? item.descriptionAr : item.description}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <span className="text-[11px] font-bold px-3 py-1 bg-white/5 text-[#00A3E0] rounded-lg border border-[#00A3E0]/20">
                                      {item.category}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'steps' && (
                    <motion.div
                      key="steps"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-12"
                    >
                      {/* Core Objectives Section */}
                      <div>
                        <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                          <Target className="w-7 h-7 text-[#00A3E0]" />
                          {isRTL ? 'الخطوات التشغيلية الحتمية' : 'Critical Field Execution Steps'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {(isRTL ? slide.content.objectivesAr : slide.content.objectives).map((obj, i) => (
                            <div key={i} className="flex gap-4 p-6 rounded-[2rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/5 hover:border-white/20 transition-all group shadow-xl">
                              <div className="mt-1">
                                <CheckCircle className={`w-6 h-6 text-white/20 group-hover:text-[#00A3E0] transition-colors`} />
                              </div>
                              <p className="text-white/90 font-bold leading-relaxed text-lg tracking-wide">{obj}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Methodology Phases Section */}
                      <div>
                        <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                          <Workflow className="w-7 h-7 text-[#00A3E0]" />
                          {isRTL ? 'هيكل الإجراءات الميدانية' : 'Field Methodology Blueprint'}
                        </h3>
                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[3.5rem] rtl:before:mr-[3.5rem] rtl:before:ml-0 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                          {slide.content.phases.map((phase, i) => (
                            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-[#0a0a0f] bg-gradient-to-br text-white font-black text-xl shadow-xl shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" style={{ backgroundImage: `linear-gradient(to bottom right, ${slide.color}, #000)` }}>
                                {i + 1}
                              </div>
                              
                              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 group-hover:bg-white/[0.06] transition-colors shadow-2xl">
                                <h4 className="text-xl font-black text-white uppercase tracking-wider mb-3">
                                  {isRTL ? phase.nameAr : phase.name}
                                </h4>
                                <p className="text-white/70 font-bold text-lg leading-relaxed tracking-wide">
                                  {isRTL ? phase.descAr : phase.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'deepdive' && (
                    <motion.div
                      key="deepdive"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 xl:grid-cols-2 gap-8"
                    >
                      {/* Academic Context Card */}
                      <div className="p-8 pb-12 rounded-[2.5rem] bg-gradient-to-b from-[#00A3E0]/10 to-[#0a0a10] border border-[#00A3E0]/20 relative overflow-hidden group shadow-2xl">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00A3E0]/20 rounded-full blur-3xl group-hover:bg-[#00A3E0]/30 transition-colors" />
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                          <div className="p-4 bg-[#00A3E0]/20 rounded-2xl">
                            <BookOpen className="w-8 h-8 text-[#00A3E0]" />
                          </div>
                          <h3 className="text-3xl font-black text-white">{isRTL ? 'سر الميكانيكا والأرقام' : 'The Mechanics & Data'}</h3>
                        </div>
                        <p className="text-white/90 font-bold leading-[2.2rem] relative z-10 text-xl">
                          {isRTL ? slide.content.academicContextAr : slide.content.academicContext}
                        </p>
                      </div>

                      {/* Case Study Card */}
                      <div className="p-8 pb-12 rounded-[2.5rem] bg-gradient-to-b from-green-500/10 to-[#0a0a10] border border-green-500/20 relative overflow-hidden group shadow-2xl">
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-green-500/20 rounded-full blur-3xl group-hover:bg-green-500/30 transition-colors" />
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                          <div className="p-4 bg-green-500/20 rounded-2xl">
                            <Briefcase className="w-8 h-8 text-green-400" />
                          </div>
                          <h3 className="text-3xl font-black text-white">{isRTL ? 'كارثة صالة الإنتاج' : 'Shop-Floor Case Study'}</h3>
                        </div>
                        <p className="text-white/90 font-bold leading-[2.2rem] relative z-10 text-xl border-l-[6px] border-green-500/50 pl-6 rtl:border-l-0 rtl:border-r-[6px] rtl:pl-0 rtl:pr-6 rounded-sm">
                          {isRTL ? slide.content.caseStudyAr : slide.content.caseStudy}
                        </p>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex items-center justify-between pt-10 mt-16 border-t border-white/10">
                <button 
                  onClick={() => {
                    handlePrev();
                    document.getElementById('lesson-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={slideIndex === 0}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all
                    ${slideIndex === 0 ? 'opacity-30 cursor-not-allowed text-white/40' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}
                  `}
                >
                  <ArrowLeft className={`w-5 h-5 ${isRTL ? 'order-last rotate-180' : ''}`} />
                  <span className={isRTL ? 'order-first' : ''}>{isRTL ? 'الوحدة السابقة' : 'Previous Module'}</span>
                </button>

                <button 
                  onClick={() => {
                    handleNext();
                    document.getElementById('lesson-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={slideIndex === slides.length - 1}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all
                    ${slideIndex === slides.length - 1 ? 'opacity-30 cursor-not-allowed text-white/40 bg-white/5' : `bg-gradient-to-r ${slide.gradient} text-white shadow-[0_0_30px_rgba(0,163,224,0.3)] hover:scale-105 border border-white/20`}
                  `}
                >
                  <span className={isRTL ? 'order-last' : 'order-first'}>{isRTL ? 'الوحدة القادمة' : 'Next Module'}</span>
                  <ArrowRight className={`w-5 h-5 ${isRTL ? 'order-first rotate-180' : ''}`} />
                </button>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
