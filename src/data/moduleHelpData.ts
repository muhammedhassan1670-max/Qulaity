/**
 * QMS 4.0 — Module Help Data
 * Contains descriptions, creation guides, and recording instructions
 * for each sidebar module, in both Arabic and English.
 */

export interface ModuleHelp {
  descriptionEn: string;
  descriptionAr: string;
  howToCreateEn: string;
  howToCreateAr: string;
  howToRecordEn: string;
  howToRecordAr: string;
}

export const MODULE_HELP: Record<string, ModuleHelp> = {
  // === Section 1: Daily Log & Inspection ===
  'quality-shopfloor': {
    descriptionEn: 'Quick Shopfloor Entry is a simplified mobile-friendly form for production floor operators to log defects, inspection results, and quality events in real-time during their shift.',
    descriptionAr: 'التسجيل السريع من الأرضية هو نموذج مبسّط مناسب للهواتف يسمح لعمال الإنتاج بتسجيل العيوب ونتائج الفحص والأحداث الجودة في الوقت الفعلي أثناء الوردية.',
    howToCreateEn: '1. Open Shopfloor Entry\n2. Select the production line and shift\n3. Choose the part/product from the dropdown\n4. Fill in the defect type, quantity, and severity\n5. Optionally attach a photo as evidence\n6. Click Submit to save',
    howToCreateAr: '1. افتح التسجيل السريع\n2. اختر خط الإنتاج والوردية\n3. اختر القطعة/المنتج من القائمة\n4. حدد نوع العيب والكمية والشدة\n5. اختيارياً أرفق صورة كدليل\n6. اضغط إرسال للحفظ',
    howToRecordEn: 'Records are saved automatically to the local defect log and synced when online. Each entry includes date, time, operator, line, part, defect details, and evidence.',
    howToRecordAr: 'يتم حفظ السجلات تلقائياً في سجل العيوب المحلي ومزامنتها عند الاتصال. كل إدخال يشمل التاريخ والوقت والمشغل والخط والقطعة وتفاصيل العيب والأدلة.',
  },
  'quality-defect-log': {
    descriptionEn: 'The Defect Recorder is the main defect logging workspace. It provides a comprehensive form with full details, batch tracking, cost calculation, and links to master data for accurate defect recording.',
    descriptionAr: 'مسجل العيوب هو مساحة العمل الرئيسية لتسجيل العيوب. يوفر نموذجاً شاملاً بكل التفاصيل وتتبع الدفعات وحساب التكلفة والربط بالبيانات الرئيسية لتسجيل دقيق للعيوب.',
    howToCreateEn: '1. Click "+ New Defect" button\n2. Select Date, Shift, and Production Line\n3. Choose the Part and Model from master data\n4. Select Defect Type and Category\n5. Enter Quantity and Severity level\n6. Add root cause notes and containment actions\n7. Attach evidence photos if available\n8. Click Save to create the record',
    howToCreateAr: '1. اضغط زر "+ عيب جديد"\n2. حدد التاريخ والوردية وخط الإنتاج\n3. اختر القطعة والموديل من البيانات الرئيسية\n4. حدد نوع العيب والفئة\n5. أدخل الكمية ومستوى الشدة\n6. أضف ملاحظات السبب الجذري وإجراءات الاحتواء\n7. أرفق صور الأدلة إن وجدت\n8. اضغط حفظ لإنشاء السجل',
    howToRecordEn: 'All defect records appear in the Records tab with full audit trail. You can filter by date, line, part, status, and export to Excel.',
    howToRecordAr: 'جميع سجلات العيوب تظهر في تبويب السجلات مع مسار تدقيق كامل. يمكنك الفلترة حسب التاريخ والخط والقطعة والحالة والتصدير لإكسل.',
  },
  'quality-execution-board': {
    descriptionEn: 'The Inspection Execution Board tracks the status of all active inspection plans across production lines. It shows which inspections are due, in progress, completed, or overdue.',
    descriptionAr: 'لوحة متابعة تنفيذ الفحص تتابع حالة جميع خطط الفحص النشطة عبر خطوط الإنتاج. تعرض الفحوصات المستحقة والجارية والمكتملة والمتأخرة.',
    howToCreateEn: '1. Inspection plans are created in the Setup section\n2. The board automatically populates based on plan schedules\n3. Click on any inspection card to start recording results\n4. Mark checks as Pass/Fail and enter measurements',
    howToCreateAr: '1. يتم إنشاء خطط الفحص في قسم الإعداد\n2. اللوحة تُملأ تلقائياً بناءً على جداول الخطط\n3. اضغط على أي بطاقة فحص لبدء تسجيل النتائج\n4. حدد الفحوصات كناجحة/فاشلة وأدخل القياسات',
    howToRecordEn: 'Results are recorded per check item. Numeric measurements feed into SPC charts. Failed checks can auto-generate NCR records.',
    howToRecordAr: 'يتم تسجيل النتائج لكل بند فحص. القياسات الرقمية تغذي شارتات SPC. الفحوصات الفاشلة يمكنها إنشاء سجلات NCR تلقائياً.',
  },
  'quality-supplier': {
    descriptionEn: 'Supplier Quality manages the performance tracking, evaluation, and qualification of your material suppliers. Track incoming inspection results, supplier scorecards, and corrective action requests.',
    descriptionAr: 'جودة الموردين تدير تتبع أداء الموردين وتقييمهم وتأهيلهم. تتبع نتائج فحص الاستلام وبطاقات أداء الموردين وطلبات الإجراءات التصحيحية.',
    howToCreateEn: '1. Go to Supplier Quality page\n2. Click "Add Supplier" to register a new supplier\n3. Fill in supplier details (name, code, category, contact)\n4. Set quality requirements and acceptance criteria\n5. Create incoming inspection records for received materials',
    howToCreateAr: '1. اذهب لصفحة جودة الموردين\n2. اضغط "إضافة مورد" لتسجيل مورد جديد\n3. أدخل بيانات المورد (الاسم، الكود، الفئة، جهة الاتصال)\n4. حدد متطلبات الجودة ومعايير القبول\n5. أنشئ سجلات فحص الاستلام للمواد المستلمة',
    howToRecordEn: 'Supplier performance is automatically calculated from inspection results. PPM, rejection rates, and delivery scores are tracked over time.',
    howToRecordAr: 'أداء المورد يُحسب تلقائياً من نتائج الفحص. يتم تتبع PPM ومعدلات الرفض ودرجات التسليم عبر الوقت.',
  },
  'quality-outgoing': {
    descriptionEn: 'Outgoing Quality tracks the final inspection results before products are shipped to customers. Monitor final pass rates, customer returns, and outgoing PPM.',
    descriptionAr: 'جودة المنتج النهائي تتابع نتائج الفحص النهائي قبل شحن المنتجات للعملاء. تراقب معدلات النجاح النهائية وإرجاعات العملاء و PPM الخروج.',
    howToCreateEn: '1. Open Outgoing Quality page\n2. Select the product batch or order\n3. Record final inspection results (pass/fail per item)\n4. Enter any detected defects with details\n5. Approve or reject the batch for shipment',
    howToCreateAr: '1. افتح صفحة جودة المنتج النهائي\n2. حدد دفعة المنتج أو الطلب\n3. سجل نتائج الفحص النهائي (نجاح/فشل لكل عنصر)\n4. أدخل أي عيوب مكتشفة بالتفاصيل\n5. وافق أو ارفض الدفعة للشحن',
    howToRecordEn: 'Final inspection data feeds into outgoing PPM dashboards and customer quality metrics.',
    howToRecordAr: 'بيانات الفحص النهائي تغذي لوحات PPM الخروج ومؤشرات جودة العميل.',
  },

  // === Section 2: Problem Management ===
  'quality-ncr': {
    descriptionEn: 'Non-Conformance Reports (NCR) document any product, process, or material that does not meet specified requirements. NCRs trigger investigation, disposition, and corrective actions.',
    descriptionAr: 'تقارير عدم المطابقة (NCR) توثق أي منتج أو عملية أو مادة لا تستوفي المتطلبات المحددة. تقارير NCR تفعّل التحقيق والتصرف والإجراءات التصحيحية.',
    howToCreateEn: '1. Click "+ New NCR"\n2. Enter NCR title and description\n3. Select source (incoming, in-process, final, customer)\n4. Identify the affected product, batch, and quantity\n5. Classify severity (Critical, Major, Minor)\n6. Assign responsible person for investigation\n7. Define disposition (rework, scrap, accept, return)',
    howToCreateAr: '1. اضغط "+ NCR جديد"\n2. أدخل عنوان ووصف عدم المطابقة\n3. حدد المصدر (استلام، أثناء العملية، نهائي، عميل)\n4. حدد المنتج المتأثر والدفعة والكمية\n5. صنف الشدة (حرجة، رئيسية، ثانوية)\n6. عيّن الشخص المسؤول عن التحقيق\n7. حدد التصرف (إعادة عمل، خردة، قبول، إرجاع)',
    howToRecordEn: 'NCRs follow a workflow: Open → Under Investigation → Disposition → Verification → Closed. All actions are timestamped in the audit trail.',
    howToRecordAr: 'تقارير NCR تتبع مسار عمل: مفتوح ← تحت التحقيق ← التصرف ← التحقق ← مغلق. جميع الإجراءات مؤرخة في مسار التدقيق.',
  },
  'quality-capa': {
    descriptionEn: 'Corrective and Preventive Actions (CAPA) address root causes of quality problems. Corrective actions fix existing issues; preventive actions prevent potential issues from occurring.',
    descriptionAr: 'الإجراءات التصحيحية والوقائية (CAPA) تعالج الأسباب الجذرية لمشاكل الجودة. الإجراءات التصحيحية تصلح المشاكل الحالية؛ الإجراءات الوقائية تمنع حدوث مشاكل محتملة.',
    howToCreateEn: '1. Click "+ New CAPA"\n2. Link to source NCR, complaint, or audit finding\n3. Describe the problem statement\n4. Perform root cause analysis (5-Why, Fishbone)\n5. Define corrective/preventive actions with owners and deadlines\n6. Implement actions and record evidence\n7. Verify effectiveness after implementation',
    howToCreateAr: '1. اضغط "+ CAPA جديد"\n2. اربط بمصدر NCR أو شكوى أو نتيجة تدقيق\n3. صف بيان المشكلة\n4. نفذ تحليل السبب الجذري (5-لماذا، عظمة السمكة)\n5. حدد الإجراءات التصحيحية/الوقائية مع المسؤولين والمواعيد النهائية\n6. نفذ الإجراءات وسجل الأدلة\n7. تحقق من الفعالية بعد التنفيذ',
    howToRecordEn: 'CAPA records track the full lifecycle from identification through verification of effectiveness. Overdue actions are flagged automatically.',
    howToRecordAr: 'سجلات CAPA تتابع دورة الحياة الكاملة من التحديد حتى التحقق من الفعالية. الإجراءات المتأخرة يتم تمييزها تلقائياً.',
  },
  'quality-8d': {
    descriptionEn: '8D Problem Solving is a structured methodology for addressing complex or recurring quality problems through 8 disciplines: Team, Problem, Containment, Root Cause, Corrective Actions, Verification, Prevention, and Congratulation.',
    descriptionAr: 'حل المشكلات 8D هو منهجية منظمة لمعالجة مشاكل الجودة المعقدة أو المتكررة من خلال 8 خطوات: الفريق، المشكلة، الاحتواء، السبب الجذري، الإجراءات التصحيحية، التحقق، المنع، والتهنئة.',
    howToCreateEn: '1. Click "+ New 8D Report"\n2. D1: Form a cross-functional team\n3. D2: Define the problem clearly\n4. D3: Implement interim containment actions\n5. D4: Identify root cause (5-Why, Fishbone, Fault Tree)\n6. D5: Define permanent corrective actions\n7. D6: Implement and verify corrective actions\n8. D7: Prevent recurrence (update procedures, training)\n9. D8: Recognize team contributions',
    howToCreateAr: '1. اضغط "+ تقرير 8D جديد"\n2. D1: شكّل فريق متعدد الوظائف\n3. D2: حدد المشكلة بوضوح\n4. D3: نفذ إجراءات احتواء مؤقتة\n5. D4: حدد السبب الجذري (5-لماذا، عظمة السمكة)\n6. D5: حدد الإجراءات التصحيحية الدائمة\n7. D6: نفذ وتحقق من الإجراءات التصحيحية\n8. D7: امنع التكرار (تحديث الإجراءات، التدريب)\n9. D8: اعترف بإنجازات الفريق',
    howToRecordEn: '8D reports track progress through all 8 disciplines with completion percentages and evidence attachments.',
    howToRecordAr: 'تقارير 8D تتابع التقدم عبر جميع الخطوات الثمانية مع نسب الإنجاز ومرفقات الأدلة.',
  },
  'quality-complaint': {
    descriptionEn: 'Customer Complaints management captures, investigates, and resolves quality complaints received from customers. Track complaint status, response times, and resolution effectiveness.',
    descriptionAr: 'إدارة شكاوى العملاء تلتقط وتحقق وتحل شكاوى الجودة الواردة من العملاء. تتابع حالة الشكوى وأوقات الاستجابة وفعالية الحل.',
    howToCreateEn: '1. Click "+ New Complaint"\n2. Enter customer name and complaint details\n3. Identify affected product, batch, and quantity\n4. Classify complaint type and severity\n5. Assign investigation owner\n6. Link to CAPA or 8D if escalation needed\n7. Record resolution and customer feedback',
    howToCreateAr: '1. اضغط "+ شكوى جديدة"\n2. أدخل اسم العميل وتفاصيل الشكوى\n3. حدد المنتج المتأثر والدفعة والكمية\n4. صنف نوع الشكوى والشدة\n5. عيّن مسؤول التحقيق\n6. اربط بـ CAPA أو 8D إذا احتاج التصعيد\n7. سجل الحل وملاحظات العميل',
    howToRecordEn: 'Complaints are tracked with SLA timers. Response time and resolution time are measured against targets.',
    howToRecordAr: 'الشكاوى تتابع بمؤقتات SLA. وقت الاستجابة ووقت الحل يُقاسان مقابل الأهداف.',
  },
  'quality-deviation': {
    descriptionEn: 'Deviation Management documents and controls any planned or unplanned departure from approved procedures, specifications, or standards.',
    descriptionAr: 'إدارة الانحرافات توثق وتتحكم في أي خروج مخطط أو غير مخطط عن الإجراءات أو المواصفات أو المعايير المعتمدة.',
    howToCreateEn: '1. Click "+ New Deviation"\n2. Describe the deviation from standard\n3. Classify as planned or unplanned\n4. Assess risk impact\n5. Define temporary measures\n6. Get approval from quality authority\n7. Set expiry date for the deviation',
    howToCreateAr: '1. اضغط "+ انحراف جديد"\n2. صف الانحراف عن المعيار\n3. صنف كمخطط أو غير مخطط\n4. قيّم تأثير المخاطر\n5. حدد الإجراءات المؤقتة\n6. احصل على موافقة سلطة الجودة\n7. حدد تاريخ انتهاء الانحراف',
    howToRecordEn: 'Deviations have expiry dates and auto-remind for closure. Recurring deviations trigger CAPA creation.',
    howToRecordAr: 'الانحرافات لها تواريخ انتهاء وتذكير تلقائي للإغلاق. الانحرافات المتكررة تفعّل إنشاء CAPA.',
  },
  'quality-change': {
    descriptionEn: 'Change Control manages formal approval of changes to products, processes, materials, or specifications. Ensures all changes are reviewed, risk-assessed, and approved before implementation.',
    descriptionAr: 'ضبط التغيير يدير الموافقة الرسمية على التغييرات في المنتجات أو العمليات أو المواد أو المواصفات. يضمن مراجعة واعتماد جميع التغييرات قبل التنفيذ.',
    howToCreateEn: '1. Click "+ New Change Request"\n2. Describe the proposed change\n3. Justify the reason for change\n4. Assess impact on quality, safety, and compliance\n5. List affected documents and processes\n6. Route for multi-level approval\n7. Plan implementation and verification steps',
    howToCreateAr: '1. اضغط "+ طلب تغيير جديد"\n2. صف التغيير المقترح\n3. برر سبب التغيير\n4. قيّم التأثير على الجودة والسلامة والامتثال\n5. أدرج الوثائق والعمليات المتأثرة\n6. وجّه للموافقة متعددة المستويات\n7. خطط لخطوات التنفيذ والتحقق',
    howToRecordEn: 'Change requests follow a workflow: Draft → Review → Approval → Implementation → Verification → Closed.',
    howToRecordAr: 'طلبات التغيير تتبع مسار عمل: مسودة ← مراجعة ← موافقة ← تنفيذ ← تحقق ← مغلق.',
  },
  'quality-fmea': {
    descriptionEn: 'Failure Mode and Effects Analysis (FMEA) systematically identifies potential failure modes, their causes and effects, and prioritizes them by Risk Priority Number (RPN = Severity × Occurrence × Detection).',
    descriptionAr: 'تحليل أنماط وتأثيرات الفشل (FMEA) يحدد بشكل منهجي أنماط الفشل المحتملة وأسبابها وتأثيراتها، ويرتبها حسب رقم أولوية المخاطر (RPN = الشدة × الحدوث × الاكتشاف).',
    howToCreateEn: '1. Open FMEA page\n2. Select process step or component\n3. Identify potential failure mode\n4. Describe the effect and cause\n5. Rate Severity (1-10), Occurrence (1-10), Detection (1-10)\n6. RPN is auto-calculated\n7. Define recommended actions for high-RPN items\n8. Re-rate after actions to verify RPN reduction',
    howToCreateAr: '1. افتح صفحة FMEA\n2. حدد خطوة العملية أو المكون\n3. حدد نمط الفشل المحتمل\n4. صف التأثير والسبب\n5. قيّم الشدة (1-10) والحدوث (1-10) والاكتشاف (1-10)\n6. RPN يُحسب تلقائياً\n7. حدد الإجراءات الموصى بها للعناصر عالية RPN\n8. أعد التقييم بعد الإجراءات للتحقق من انخفاض RPN',
    howToRecordEn: 'FMEA worksheets are versioned. High-RPN items are flagged and can link to CAPA for action tracking.',
    howToRecordAr: 'أوراق عمل FMEA مرقمة بالإصدار. العناصر عالية RPN تُميّز ويمكن ربطها بـ CAPA لتتبع الإجراءات.',
  },

  // === Section 3: Audit & Compliance ===
  'quality-layered-audits': {
    descriptionEn: 'Layered Process Audits (LPA) are short, focused audits performed by different management levels to verify that standardized work processes are being followed on the production floor.',
    descriptionAr: 'مراجعات العمليات المتعددة المستويات (LPA) هي مراجعات قصيرة ومركزة يقوم بها مستويات إدارية مختلفة للتحقق من اتباع عمليات العمل الموحدة في أرضية الإنتاج.',
    howToCreateEn: '1. Create an audit checklist template\n2. Assign audit frequency and responsible auditors per level\n3. System auto-schedules audits based on configuration\n4. Auditor opens the scheduled audit and answers each question\n5. Non-conformances trigger follow-up actions',
    howToCreateAr: '1. أنشئ قالب قائمة مراجعة التدقيق\n2. عيّن تكرار التدقيق والمدققين المسؤولين لكل مستوى\n3. النظام يجدول التدقيقات تلقائياً\n4. المدقق يفتح التدقيق المجدول ويجيب على كل سؤال\n5. حالات عدم المطابقة تفعّل إجراءات متابعة',
    howToRecordEn: 'Audit results show compliance percentage per area and level. Trends are tracked over time.',
    howToRecordAr: 'نتائج التدقيق تعرض نسبة الامتثال لكل منطقة ومستوى. الاتجاهات تتابع عبر الوقت.',
  },
  'quality-audit': {
    descriptionEn: 'Audit Management handles the full lifecycle of internal and external quality audits: planning, scheduling, execution, findings, corrective actions, and follow-up.',
    descriptionAr: 'إدارة التدقيق تتعامل مع دورة الحياة الكاملة للتدقيقات الداخلية والخارجية: التخطيط والجدولة والتنفيذ والنتائج والإجراءات التصحيحية والمتابعة.',
    howToCreateEn: '1. Create an audit plan (scope, objectives, criteria)\n2. Schedule audit dates and assign audit team\n3. Conduct the audit and record findings\n4. Classify findings (Major NC, Minor NC, Observation, OFI)\n5. Generate corrective action requests for findings\n6. Follow up and verify closure',
    howToCreateAr: '1. أنشئ خطة تدقيق (النطاق، الأهداف، المعايير)\n2. جدول مواعيد التدقيق وعيّن فريق التدقيق\n3. نفذ التدقيق وسجل النتائج\n4. صنف النتائج (عدم مطابقة رئيسية/ثانوية، ملاحظة، فرصة تحسين)\n5. أنشئ طلبات إجراء تصحيحي للنتائج\n6. تابع وتحقق من الإغلاق',
    howToRecordEn: 'Full audit reports with findings, evidence, and corrective action tracking are stored with version history.',
    howToRecordAr: 'تقارير تدقيق كاملة مع النتائج والأدلة وتتبع الإجراءات التصحيحية تُخزن مع تاريخ الإصدار.',
  },
  'quality-control-plan': {
    descriptionEn: 'Control Plans define the inspection methods, measurement techniques, and reaction plans for each process step to ensure consistent product quality.',
    descriptionAr: 'خطط التحكم تحدد أساليب الفحص وتقنيات القياس وخطط الاستجابة لكل خطوة عملية لضمان جودة منتج متسقة.',
    howToCreateEn: '1. Open Control Plan page\n2. Click "+ New Control Plan"\n3. Define process steps in sequence\n4. For each step: specify characteristics, specifications, measurement method\n5. Set sampling plan (frequency, size)\n6. Define reaction plan for out-of-spec results\n7. Link to inspection plans for execution',
    howToCreateAr: '1. افتح صفحة خطة التحكم\n2. اضغط "+ خطة تحكم جديدة"\n3. حدد خطوات العملية بالتسلسل\n4. لكل خطوة: حدد الخصائص والمواصفات وطريقة القياس\n5. حدد خطة العينات (التكرار، الحجم)\n6. حدد خطة الاستجابة للنتائج خارج المواصفات\n7. اربط بخطط الفحص للتنفيذ',
    howToRecordEn: 'Control plans are versioned documents linked to PFMEA and inspection plans.',
    howToRecordAr: 'خطط التحكم وثائق مرقمة بالإصدار مرتبطة بـ PFMEA وخطط الفحص.',
  },
  'quality-calibration': {
    descriptionEn: 'Calibration Management tracks the calibration status, schedules, and certificates for all measurement instruments and gauges used in quality inspection.',
    descriptionAr: 'إدارة المعايرة تتابع حالة المعايرة والجداول والشهادات لجميع أجهزة القياس والمقاييس المستخدمة في فحص الجودة.',
    howToCreateEn: '1. Register measurement instrument (name, serial, type, location)\n2. Set calibration interval (e.g., every 6 months)\n3. Record calibration results (pass/fail, adjustments made)\n4. Upload calibration certificate\n5. System auto-tracks next calibration due date\n6. Overdue instruments are flagged and blocked from use',
    howToCreateAr: '1. سجل جهاز القياس (الاسم، الرقم التسلسلي، النوع، الموقع)\n2. حدد فترة المعايرة (مثلاً: كل 6 أشهر)\n3. سجل نتائج المعايرة (نجاح/فشل، التعديلات)\n4. ارفع شهادة المعايرة\n5. النظام يتابع تلقائياً تاريخ المعايرة التالي\n6. الأجهزة المتأخرة تُميّز وتُحظر من الاستخدام',
    howToRecordEn: 'Calibration history shows all past calibrations with certificates, results, and adjustments for each instrument.',
    howToRecordAr: 'تاريخ المعايرة يعرض جميع المعايرات السابقة مع الشهادات والنتائج والتعديلات لكل جهاز.',
  },

  // === Section 4: Intelligence & SPC ===
  'quality-command-center': {
    descriptionEn: 'The Command Center is a real-time overview dashboard showing quality KPIs, active issues, SLA status, and action items across all quality modules.',
    descriptionAr: 'مركز القيادة هو لوحة نظرة عامة في الوقت الفعلي تعرض مؤشرات الجودة الرئيسية والمشاكل النشطة وحالة SLA وبنود العمل عبر جميع وحدات الجودة.',
    howToCreateEn: 'The Command Center is auto-populated. No manual creation needed. It aggregates data from all quality modules in real-time.',
    howToCreateAr: 'مركز القيادة يُملأ تلقائياً. لا حاجة لإنشاء يدوي. يجمع البيانات من جميع وحدات الجودة في الوقت الفعلي.',
    howToRecordEn: 'Use it to monitor overall quality health, identify bottlenecks, and prioritize actions.',
    howToRecordAr: 'استخدمه لمراقبة صحة الجودة العامة وتحديد الاختناقات وترتيب أولويات الإجراءات.',
  },
  'quality-defect-prediction': {
    descriptionEn: 'Defect Prediction uses machine learning models to forecast potential quality issues based on historical defect patterns, process parameters, and environmental conditions.',
    descriptionAr: 'توقع العيوب يستخدم نماذج تعلم الآلة للتنبؤ بمشاكل الجودة المحتملة بناءً على أنماط العيوب التاريخية ومعلمات العملية والظروف البيئية.',
    howToCreateEn: '1. The system analyzes historical defect data automatically\n2. Prediction models are trained on your data patterns\n3. View predictions on the dashboard\n4. Set alert thresholds for high-risk predictions\n5. Take preventive actions based on predictions',
    howToCreateAr: '1. النظام يحلل بيانات العيوب التاريخية تلقائياً\n2. نماذج التوقع تُدرب على أنماط بياناتك\n3. اعرض التوقعات على لوحة القيادة\n4. حدد عتبات التنبيه للتوقعات عالية المخاطر\n5. اتخذ إجراءات وقائية بناءً على التوقعات',
    howToRecordEn: 'Prediction accuracy is tracked over time. Models improve as more data is collected.',
    howToRecordAr: 'دقة التوقعات تتابع عبر الوقت. النماذج تتحسن كلما تم جمع مزيد من البيانات.',
  },
  'quality-spc': {
    descriptionEn: 'Statistical Process Control (SPC) uses control charts to monitor process stability and capability. Includes X-bar/R, I-MR, p, np, c, u charts plus Cp/Cpk capability analysis.',
    descriptionAr: 'التحكم الإحصائي بالعمليات (SPC) يستخدم شارتات التحكم لمراقبة استقرار وقدرة العملية. يشمل شارتات X-bar/R و I-MR و p و np و c و u بالإضافة لتحليل القدرة Cp/Cpk.',
    howToCreateEn: '1. Open SPC page\n2. Select chart type (X-bar/R, I-MR, p, np, c, u)\n3. Enter or import measurement data\n4. Or click "Load Demo Data" for sample data\n5. Set specification limits (USL, LSL) for capability analysis\n6. Control limits are calculated automatically\n7. Review out-of-control points and Nelson rule violations',
    howToCreateAr: '1. افتح صفحة SPC\n2. اختر نوع الشارت (X-bar/R, I-MR, p, np, c, u)\n3. أدخل أو استورد بيانات القياسات\n4. أو اضغط "بيانات تجريبية" لبيانات عينة\n5. حدد حدود المواصفات (USL, LSL) لتحليل القدرة\n6. حدود التحكم تُحسب تلقائياً\n7. راجع النقاط خارج التحكم وانتهاكات قواعد Nelson',
    howToRecordEn: 'SPC data feeds from inspection plans, defect logs, or manual entry. Charts are saved and can be printed or exported.',
    howToRecordAr: 'بيانات SPC تتغذى من خطط الفحص وسجلات العيوب أو الإدخال اليدوي. الشارتات تُحفظ ويمكن طباعتها أو تصديرها.',
  },
  'ai-chat': {
    descriptionEn: 'AI Quality Assistant is an intelligent chatbot that can answer quality-related questions, help with root cause analysis, suggest improvements, and provide guidance on standards compliance.',
    descriptionAr: 'مساعد الجودة الذكي هو روبوت محادثة ذكي يمكنه الإجابة على أسئلة الجودة والمساعدة في تحليل السبب الجذري واقتراح التحسينات وتقديم إرشادات الامتثال للمعايير.',
    howToCreateEn: '1. Open AI Chat page\n2. Type your quality question in the chat box\n3. The AI will analyze your question and provide a detailed answer\n4. You can ask follow-up questions for more detail\n5. Export conversation as a report if needed',
    howToCreateAr: '1. افتح صفحة مساعد الجودة\n2. اكتب سؤال الجودة في مربع المحادثة\n3. الذكاء الاصطناعي سيحلل سؤالك ويقدم إجابة مفصلة\n4. يمكنك طرح أسئلة متابعة لمزيد من التفاصيل\n5. صدّر المحادثة كتقرير إذا لزم الأمر',
    howToRecordEn: 'Chat history is saved locally. You can reference past conversations anytime.',
    howToRecordAr: 'تاريخ المحادثة يُحفظ محلياً. يمكنك الرجوع للمحادثات السابقة في أي وقت.',
  },

  // === Section 5: Reports ===
  'quality-dashboard': {
    descriptionEn: 'Quality Dashboard provides visual KPI tracking with charts showing defect trends, PPM rates, COPQ, inspection pass rates, and module status across the organization.',
    descriptionAr: 'لوحة قيادة الجودة توفر تتبع مؤشرات الأداء الرئيسية بصرياً مع شارتات تعرض اتجاهات العيوب ومعدلات PPM وتكلفة الجودة ومعدلات نجاح الفحص وحالة الوحدات.',
    howToCreateEn: 'Dashboard is auto-populated from all quality data. Use filters to focus on specific date ranges, lines, or products.',
    howToCreateAr: 'لوحة القيادة تُملأ تلقائياً من جميع بيانات الجودة. استخدم الفلاتر للتركيز على فترات زمنية أو خطوط أو منتجات محددة.',
    howToRecordEn: 'Data refreshes automatically. Export charts and reports as PDF or images for management review.',
    howToRecordAr: 'البيانات تُحدث تلقائياً. صدّر الشارتات والتقارير كـ PDF أو صور لمراجعة الإدارة.',
  },
  'dashboard': {
    descriptionEn: 'Main Dashboard provides a high-level executive overview of the entire QMS system health, including all module statuses, key metrics, and recent activities.',
    descriptionAr: 'الداشبورد الرئيسية توفر نظرة عامة تنفيذية عالية المستوى لصحة نظام إدارة الجودة بالكامل، بما في ذلك حالات جميع الوحدات والمقاييس الرئيسية والأنشطة الأخيرة.',
    howToCreateEn: 'The main dashboard is pre-configured. It automatically aggregates data from all modules.',
    howToCreateAr: 'الداشبورد الرئيسية مُعدة مسبقاً. تجمع البيانات تلقائياً من جميع الوحدات.',
    howToRecordEn: 'Use this dashboard for daily standup meetings and management reporting.',
    howToRecordAr: 'استخدم هذه الداشبورد للاجتماعات اليومية وتقارير الإدارة.',
  },

  // === Section 6: Setup ===
  'quality-master-data': {
    descriptionEn: 'Master Data is the central repository for all reference data: Parts, Models, Defect Types, Production Lines, Suppliers, Customers, Cost Rules, and Escalation Rules.',
    descriptionAr: 'البيانات الرئيسية هي المستودع المركزي لجميع البيانات المرجعية: القطع والموديلات وأنواع العيوب وخطوط الإنتاج والموردين والعملاء وقواعد التكلفة وقواعد التصعيد.',
    howToCreateEn: '1. Open Master Data page\n2. Select the data table (Parts, Models, Defects, etc.)\n3. Click "+ Add New" to create a record manually\n4. Or use "Import Excel" to bulk import data\n5. Each record has a name, code, and table-specific fields\n6. Activate/deactivate records as needed',
    howToCreateAr: '1. افتح صفحة البيانات الرئيسية\n2. حدد جدول البيانات (القطع، الموديلات، العيوب، إلخ)\n3. اضغط "+ إضافة جديد" لإنشاء سجل يدوياً\n4. أو استخدم "استيراد إكسل" لاستيراد بيانات مجمعة\n5. كل سجل له اسم ورمز وحقول خاصة بالجدول\n6. فعّل/عطّل السجلات حسب الحاجة',
    howToRecordEn: 'Master data feeds all other modules. Keep it updated for accurate defect recording, reporting, and analysis.',
    howToRecordAr: 'البيانات الرئيسية تغذي جميع الوحدات الأخرى. حافظ على تحديثها لتسجيل دقيق للعيوب والتقارير والتحليل.',
  },
  'quality-inspection-plans': {
    descriptionEn: 'Inspection Plans define what to inspect, how to inspect, and how often. Create checklists with visual, dimensional, and functional checks for each product or process.',
    descriptionAr: 'خطط الفحص تحدد ما يجب فحصه وكيف وكم مرة. أنشئ قوائم مراجعة بفحوصات بصرية وأبعاد ووظيفية لكل منتج أو عملية.',
    howToCreateEn: '1. Click "+ New Inspection Plan"\n2. Name the plan and assign to product/process\n3. Add check items (visual, dimensional, functional, numeric)\n4. Set pass/fail criteria for each check\n5. Define inspection frequency and sampling plan\n6. Activate the plan to appear on the Execution Board',
    howToCreateAr: '1. اضغط "+ خطة فحص جديدة"\n2. سمِّ الخطة وعيّنها لمنتج/عملية\n3. أضف بنود الفحص (بصري، أبعاد، وظيفي، رقمي)\n4. حدد معايير النجاح/الفشل لكل بند\n5. حدد تكرار الفحص وخطة العينات\n6. فعّل الخطة لتظهر على لوحة التنفيذ',
    howToRecordEn: 'Inspection plans generate execution tasks that appear on the Execution Board for inspectors to complete.',
    howToRecordAr: 'خطط الفحص تنشئ مهام تنفيذ تظهر على لوحة التنفيذ للمفتشين لإكمالها.',
  },
  'quality-form-designer': {
    descriptionEn: 'Form Designer is a no-code tool for creating custom quality forms, checklists, and data collection templates with drag-and-drop fields.',
    descriptionAr: 'مصمم النماذج هو أداة بدون كود لإنشاء نماذج جودة مخصصة وقوائم مراجعة وقوالب جمع بيانات بالسحب والإفلات.',
    howToCreateEn: '1. Open Form Designer\n2. Click "+ New Form"\n3. Drag fields from the toolbox (text, number, dropdown, checkbox, image, signature)\n4. Configure field properties (label, required, validation)\n5. Set form layout and sections\n6. Preview and publish the form\n7. Forms can be used in inspection plans and audits',
    howToCreateAr: '1. افتح مصمم النماذج\n2. اضغط "+ نموذج جديد"\n3. اسحب الحقول من صندوق الأدوات (نص، رقم، قائمة، مربع اختيار، صورة، توقيع)\n4. هيئ خصائص الحقل (التسمية، مطلوب، التحقق)\n5. حدد تخطيط النموذج والأقسام\n6. عاين وانشر النموذج\n7. النماذج يمكن استخدامها في خطط الفحص والتدقيقات',
    howToRecordEn: 'Published forms are available for data collection across all quality modules.',
    howToRecordAr: 'النماذج المنشورة متاحة لجمع البيانات عبر جميع وحدات الجودة.',
  },
};
