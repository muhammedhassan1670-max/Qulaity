/**
 * QMS 4.0 — Module Help Data
 * Contains highly detailed descriptions, creation guides, recording instructions,
 * best practices, and workflows for each sidebar module, in both Arabic and English.
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
    descriptionEn: 'The Shopfloor Defect Entry is a rapid, mobile-friendly interface specifically designed for production line operators and QC inspectors on the shop floor. It allows for immediate logging of defects, scrap, or rework directly where they occur without navigating complex menus. This ensures real-time quality data capture, enabling supervisors to react instantly to quality spikes.',
    descriptionAr: 'واجهة "تسجيل العيوب من صالة الإنتاج" هي شاشة سريعة ومصممة خصيصاً للعمل على الأجهزة اللوحية والموبايل لتناسب مشغلي خطوط الإنتاج ومفتشي الجودة. تتيح هذه الشاشة التسجيل الفوري للعيوب، الخردة (Scrap)، أو إعادة العمل (Rework) من مكان حدوثها مباشرة وبدون الحاجة للتنقل في قوائم معقدة. هذا يضمن التقاط بيانات الجودة في الوقت الفعلي ويسمح للمشرفين بالتدخل السريع عند حدوث مشاكل.',
    howToCreateEn: `Follow these steps to log a defect:
1. Select the current Date, Shift (Morning/Evening/Night), and your specific Production Line.
2. Choose the Part or Product currently running on the line.
3. Select the Defect Type from the predefined standardized list.
4. Enter the Quantity of defective items.
5. Choose the Severity (Minor, Major, Critical).
6. (Optional) Take and attach a photo of the defect directly from your tablet/mobile device.
7. Click 'Submit Defect' to instantly save the record.`,
    howToCreateAr: `اتبع هذه الخطوات لتسجيل عيب جديد:
1. حدد التاريخ، الوردية الحالية (صباحي/مسائي/ليلي)، وخط الإنتاج الخاص بك.
2. اختر القطعة أو المنتج الجاري تصنيعه حالياً.
3. اختر نوع العيب من القائمة الموحدة المنسدلة.
4. أدخل كمية القطع المعيبة.
5. حدد مستوى الخطورة أو الشدة (بسيط، رئيسي، حرج).
6. (اختياري) التقط وأرفق صورة للعيب مباشرة من الكاميرا أو جهازك اللوحي.
7. اضغط على 'تسجيل العيب' لحفظ البيانات فوراً.`,
    howToRecordEn: 'Upon submission, the data is instantly saved to the Master Defect Log. It automatically updates the real-time Dashboard, adjusts the Daily Scrap Cost metrics, and flags the SPC system if the defect rate exceeds the control limits.',
    howToRecordAr: 'بمجرد الإرسال، تُحفظ البيانات فوراً في "سجل العيوب الرئيسي". وتقوم بتحديث لوحة القياس (Dashboard) اللحظية، وتعديل مؤشرات تكلفة الخردة اليومية، وتنبيه نظام الـ SPC إذا تجاوز معدل العيوب حدود السيطرة.',
  },
  'quality-defect-log': {
    descriptionEn: 'The Defect Recorder is the comprehensive workspace for Quality Engineers and Supervisors. While the Shopfloor entry is for quick logging, this module is for deep investigation, cost analysis, batch tracing, and tracking the complete lifecycle of a defect from identification to final disposition.',
    descriptionAr: 'يعد "مسجل العيوب الرئيسي" مساحة العمل الشاملة لمهندسي ومشرفي الجودة. في حين أن شاشة صالة الإنتاج مخصصة للتسجيل السريع، فإن هذا الموديول مصمم للتحقيق العميق، تحليل التكاليف، تتبع أرقام التشغيل (Batches)، ومتابعة دورة حياة العيب الكاملة من لحظة اكتشافه وحتى اتخاذ القرار النهائي (الكهنة أو إعادة العمل).',
    howToCreateEn: `To create a detailed defect record:
1. Click '+ New Defect'.
2. General Info: Enter Date, Time, Shift, Line, and Inspector name.
3. Product Details: Select Part ID, Batch Number, and Work Order (crucial for traceability).
4. Defect Specifics: Choose Defect Category, Type, Quantity, and calculated Scrap/Rework Cost.
5. Containment: Detail immediate containment actions taken (e.g., "Sorted 500 parts, isolated 20").
6. Disposition: Select the final decision (Scrap, Rework, Use-As-Is).
7. Root Cause: Add preliminary root cause notes before full CAPA generation.
8. Click 'Save Record'.`,
    howToCreateAr: `لإنشاء سجل عيب مفصل:
1. اضغط على '+ عيب جديد'.
2. البيانات العامة: أدخل التاريخ، الوقت، الوردية، الخط، واسم المفتش.
3. تفاصيل المنتج: اختر كود القطعة، رقم التشغيلة (Batch)، وأمر الشغل (مهم جداً للتتبع).
4. تفاصيل العيب: اختر فئة العيب، نوعه، الكمية، والتكلفة المحسوبة للخردة/إعادة العمل.
5. الاحتواء: اذكر إجراءات الاحتواء الفورية (مثال: "تم فرز 500 قطعة وعزل 20").
6. التصرف النهائي: حدد القرار (تخريد، إعادة عمل، قبول استثنائي).
7. السبب الجذري: أضف ملاحظات أولية عن السبب قبل تصعيدها لـ CAPA.
8. اضغط 'حفظ السجل'.`,
    howToRecordEn: 'This module stores data in the `qms_local_defect-logs` database. You can filter historical records, export massive datasets to Excel for Excel-based pivot tables, and generate automatic Pareto charts for the most common defects.',
    howToRecordAr: 'يخزن هذا الموديول البيانات في قاعدة السجلات الرئيسية `qms_local_defect-logs`. يمكنك فلترة السجلات التاريخية، وتصدير قواعد بيانات ضخمة إلى إكسل لعمل تقارير Pivot، وإنشاء مخططات باريتو التلقائية لأكثر العيوب تكراراً.',
  },
  'quality-execution-board': {
    descriptionEn: 'The Inspection Execution Board is a visual Kanban-style board that tracks the real-time status of all scheduled quality checks and inspection plans across the factory. It ensures no mandatory quality check is missed during a shift.',
    descriptionAr: 'لوحة تنفيذ الفحوصات هي شاشة بصرية على طراز Kanban تتبع الحالة اللحظية لجميع الفحوصات المجدولة وخطط الجودة في المصنع. تضمن هذه اللوحة عدم تفويت أي فحص جودة إلزامي خلال الوردية.',
    howToCreateEn: `How to manage inspections:
1. The board automatically populates cards based on Active Inspection Plans (e.g., "Line 1 Hourly Weight Check").
2. Columns represent status: 'To Do', 'In Progress', 'Completed', 'Overdue'.
3. Click a card in 'To Do' to open the Inspection Checklist.
4. Enter precise measurements for numeric checks or Pass/Fail for visual attributes.
5. Submit the checklist to move the card to 'Completed'.
6. If a critical check fails, the system auto-prompts to open an NCR (Non-Conformance Report).`,
    howToCreateAr: `كيفية إدارة الفحوصات:
1. تقوم اللوحة تلقائياً بتوليد بطاقات بناءً على خطط الفحص النشطة (مثل: "فحص الوزن الساعي لخط 1").
2. تمثل الأعمدة الحالات: 'مطلوب إنجازه'، 'جاري العمل'، 'مكتمل'، 'متأخر'.
3. اضغط على بطاقة في عمود 'مطلوب إنجازه' لفتح قائمة الفحص (Checklist).
4. أدخل القياسات الدقيقة للفحوصات الرقمية، أو (ناجح/راسب) للفحوصات الظاهرية.
5. أرسل القائمة لتنتقل البطاقة إلى عمود 'مكتمل'.
6. في حال رسوب فحص حرج، سيقترح النظام تلقائياً فتح تقرير عدم مطابقة (NCR).`,
    howToRecordEn: 'Inspection results are securely time-stamped with the inspector\'s ID to ensure compliance and traceability. Numeric results feed directly into the SPC System to calculate Process Capability (Cpk).',
    howToRecordAr: 'تُختم نتائج الفحص إلكترونياً بالوقت وتاريخ ومعرف المفتش لضمان الامتثال والتتبع. تُرسل النتائج الرقمية مباشرة إلى نظام الـ SPC لحساب قدرة العملية (Cpk).',
  },
  'quality-supplier': {
    descriptionEn: 'Supplier Quality Management handles everything related to external vendors. This includes tracking incoming material inspection results, maintaining supplier scorecards, issuing SCARs (Supplier Corrective Action Requests), and tracking supplier PPM (Parts Per Million).',
    descriptionAr: 'إدارة جودة الموردين تتولى كل ما يخص الموردين الخارجيين. يشمل ذلك تتبع نتائج فحص الخامات الواردة، الحفاظ على بطاقات تقييم أداء الموردين، إصدار طلبات الإجراءات التصحيحية للمورد (SCAR)، وتتبع معدل العيوب بالمليون للمورد (PPM).',
    howToCreateEn: `To manage a supplier and incoming lots:
1. Master Data: Ensure the supplier is registered in Master Data.
2. Incoming Inspection: Go to 'Supplier Receiving', enter the PO number, Lot number, and Supplier.
3. Sample Size: The system calculates the required sample size based on AQL (Acceptable Quality Limit) tables.
4. Record defects found in the sample.
5. If the lot fails, click 'Issue SCAR' to generate a formal corrective action request to the supplier.
6. Review the 'Supplier Scorecard' tab to see their aggregated quality, delivery, and service scores.`,
    howToCreateAr: `لإدارة الموردين ولوطات الاستلام:
1. البيانات الأساسية: تأكد من تسجيل المورد في شاشة البيانات الرئيسية.
2. فحص الاستلام: اذهب إلى 'استلام الموردين'، أدخل رقم أمر الشراء (PO)، رقم اللوط، واسم المورد.
3. حجم العينة: يقوم النظام بحساب حجم العينة المطلوب بناءً على جداول الفحص المعياري (AQL).
4. سجل العيوب المكتشفة في العينة.
5. إذا رسب اللوط، اضغط 'إصدار SCAR' لإنشاء طلب إجراء تصحيحي رسمي وإرساله للمورد.
6. راجع تبويب 'بطاقة أداء المورد' لرؤية درجات الجودة، التسليم، والخدمة المجمعة.`,
    howToRecordEn: 'Supplier scores are dynamically updated based on moving averages. Data here is linked to Master Data and affects Supplier Status (e.g., Approved, Probation, Blocked).',
    howToRecordAr: 'يتم تحديث درجات المورد ديناميكياً بناءً على المتوسطات المتحركة. ترتبط البيانات هنا بالبيانات الرئيسية وتؤثر على حالة المورد (مثال: معتمد، تحت الاختبار، محظور).',
  },
  'quality-outgoing': {
    descriptionEn: 'Outgoing Quality Assurance (OQA) is the final gatekeeper before products leave the facility. It documents the final inspection of finished goods, ensuring they meet all customer specifications and regulatory requirements before shipping.',
    descriptionAr: 'توكيد جودة المنتج النهائي (OQA) هو البوابة الأخيرة قبل خروج المنتجات من المصنع. يقوم بتوثيق الفحص النهائي للمنتجات التامة، لضمان استيفائها لجميع مواصفات العميل والمتطلبات التنظيمية قبل الشحن.',
    howToCreateEn: `To perform a Final Inspection:
1. Select 'New Outgoing Inspection'.
2. Enter the Sales Order (SO), Customer Name, and Finished Goods Batch Number.
3. Conduct visual, functional, and packaging checks as prompted by the checklist.
4. Record any minor, major, or critical defects.
5. Determine the Final Disposition: 'Approved for Shipping', 'Hold', or 'Rework'.
6. Generate a Certificate of Analysis (CoA) or Certificate of Conformance (CoC) if required by the customer.`,
    howToCreateAr: `لإجراء فحص نهائي:
1. اختر 'فحص نهائي جديد'.
2. أدخل رقم أمر البيع (SO)، اسم العميل، ورقم تشغيلة المنتج التام.
3. قم بإجراء الفحوصات الظاهرية، الوظيفية، وفحوصات التغليف كما تطلب قائمة الفحص.
4. سجل أي عيوب (بسيطة، رئيسية، أو حرجة).
5. حدد القرار النهائي: 'معتمد للشحن'، 'إيقاف (Hold)'، أو 'إعادة عمل'.
6. قم بتوليد شهادة تحليل (CoA) أو شهادة مطابقة (CoC) إذا كان العميل يطلب ذلك.`,
    howToRecordEn: 'Approved batches generate clearance certificates. Rejected batches are locked from shipping and automatically linked to the NCR module for investigation.',
    howToRecordAr: 'التشغيلات المعتمدة تصدر لها شهادات إفراج. أما التشغيلات المرفوضة فيتم حظر شحنها وترتبط تلقائياً بموديول عدم المطابقة (NCR) للتحقيق.',
  },

  // === Section 2: Problem Management ===
  'quality-ncr': {
    descriptionEn: 'The Non-Conformance Report (NCR) module manages the formal process of documenting, segregating, and disposing of materials or products that fail to meet quality standards. It is a critical requirement for ISO 9001 compliance.',
    descriptionAr: 'موديول تقرير عدم المطابقة (NCR) يدير العملية الرسمية لتوثيق، وعزل، والتصرف في الخامات أو المنتجات التي تفشل في تلبية معايير الجودة. هذا الموديول يعد متطلباً حرجاً للتوافق مع مواصفة ISO 9001.',
    howToCreateEn: `How to raise and process an NCR:
1. Creation: Click '+ New NCR'. Select the Source (e.g., Incoming Inspection, Production Line, Customer Return).
2. Identification: Detail the Item, Batch, Date, and exactly what the non-conformance is (Expected vs. Actual).
3. Segregation: Document where the non-conforming items are physically quarantined to prevent unintended use.
4. Review & Disposition: A cross-functional team (Quality, Production, Engineering) reviews the NCR.
5. Decision: Select the disposition: 'Rework', 'Scrap', 'Return to Vendor', or 'Accept on Concession (Use-As-Is)'.
6. Closure: Verify the disposition is physically completed and close the NCR. Elevate to CAPA if systemic.`,
    howToCreateAr: `كيفية إنشاء ومعالجة تقرير عدم المطابقة (NCR):
1. الإنشاء: اضغط '+ NCR جديد'. حدد المصدر (مثال: فحص استلام، خط إنتاج، مرتجع عميل).
2. التحديد: فصّل الصنف، التشغيلة، التاريخ، وما هو عدم المطابقة بدقة (المتوقع مقابل الفعلي).
3. العزل: وثّق مكان الحجر (Quarantine) الفعلي للمنتجات المعيبة لمنع استخدامها بالخطأ.
4. المراجعة والتصرف: يقوم فريق مشترك (جودة، إنتاج، هندسة) بمراجعة التقرير.
5. القرار: حدد التصرف: 'إعادة عمل'، 'تخريد'، 'إرجاع للمورد'، أو 'قبول استثنائي (Concession)'.
6. الإغلاق: تحقق من التنفيذ الفعلي للقرار وأغلق الـ NCR. قم بتصعيده إلى CAPA إذا كانت المشكلة متكررة.`,
    howToRecordEn: 'NCR statuses (Open, Review, Quarantined, Closed) are tracked in real-time. Unclosed NCRs trigger escalation emails. All disposition decisions require authorized electronic signatures.',
    howToRecordAr: 'حالات الـ NCR (مفتوح، قيد المراجعة، محجوز، مغلق) تُتبع لحظياً. التقارير غير المغلقة تفعّل إشعارات تصعيد. قرارات التصرف تتطلب توقيعات إلكترونية معتمدة.',
  },
  'quality-capa': {
    descriptionEn: 'The CAPA (Corrective and Preventive Action) module is the engine for continuous improvement. It drives the systematic investigation of discrepancies to identify root causes and implement actions that permanently prevent recurrence.',
    descriptionAr: 'موديول الإجراءات التصحيحية والوقائية (CAPA) هو المحرك الأساسي للتحسين المستمر. يقود عملية التحقيق المنهجي في المشاكل لتحديد الأسباب الجذرية وتطبيق إجراءات تمنع تكرارها بشكل دائم.',
    howToCreateEn: `Steps to execute a CAPA:
1. Initiation: Link the CAPA to an existing NCR, Audit Finding, or Customer Complaint.
2. Problem Statement: Write a clear 5W2H (Who, What, When, Where, Why, How, How Many) description.
3. Containment: Detail immediate risk mitigation steps taken.
4. Root Cause Analysis (RCA): Use built-in tools to document the 5-Whys or Ishikawa (Fishbone) diagram.
5. Action Plan: Create specific Corrective Actions (to fix the root cause) and assign Owners & Due Dates.
6. Implementation: Owners update their tasks with evidence of completion.
7. Effectiveness Review: After 30/60/90 days, Quality verifies if the actions actually prevented the issue from recurring. Only then is the CAPA closed.`,
    howToCreateAr: `خطوات تنفيذ الـ CAPA:
1. البدء: اربط الـ CAPA بتقرير NCR سابق، أو حالة عدم مطابقة في مراجعة، أو شكوى عميل.
2. وصف المشكلة: اكتب وصفاً واضحاً باستخدام منهجية 5W2H.
3. الاحتواء: اذكر الخطوات الفورية التي تم اتخاذها لتقليل المخاطر.
4. تحليل السبب الجذري (RCA): استخدم الأدوات المدمجة لتوثيق (5-لماذا) أو مخطط عظمة السمكة (Ishikawa).
5. خطة العمل: أنشئ إجراءات تصحيحية محددة (للقضاء على السبب الجذري) وعيّن المسؤولين والمواعيد.
6. التنفيذ: يقوم المسؤولون بتحديث مهامهم مع إرفاق أدلة التنفيذ.
7. مراجعة الفعالية: بعد 30/60/90 يوماً، تتحقق الجودة مما إذا كانت الإجراءات منعت التكرار فعلاً. بعدها فقط يُغلق الـ CAPA.`,
    howToRecordEn: 'The CAPA dashboard highlights aging CAPAs, overdue action items, and tracks the average cycle time to close critical issues.',
    howToRecordAr: 'لوحة قياس الـ CAPA تبرز التقارير القديمة، المهام المتأخرة، وتتتبع متوسط وقت الدورة (Cycle Time) لإغلاق المشاكل الحرجة.',
  },
  'quality-8d': {
    descriptionEn: 'The 8D (Eight Disciplines) Problem Solving module is a highly structured framework utilized for critical, complex, or systemic issues, primarily required by automotive (IATF 16949) and aerospace sectors.',
    descriptionAr: 'موديول حل المشكلات بطريقة 8D هو إطار عمل شديد التنظيم يُستخدم للمشاكل الحرجة، المعقدة، أو المتكررة، وهو مطلوب بشكل أساسي في قطاعات السيارات (IATF 16949) والطيران.',
    howToCreateEn: `How to complete an 8D Report:
1. D1 (Team): Assemble a cross-functional expert team.
2. D2 (Problem): Define the problem precisely using quantifiable terms.
3. D3 (Containment): Implement and verify Interim Containment Actions (ICA) within 24 hours.
4. D4 (Root Cause): Analyze and verify both the "Occurrence" root cause and the "Escape" root cause.
5. D5 (Choose Actions): Formulate Permanent Corrective Actions (PCA) and statistically verify their theoretical success.
6. D6 (Implement): Execute the PCAs and remove the temporary containment actions.
7. D7 (Prevent): Update FMEAs, Control Plans, and SOPs to prevent recurrence globally.
8. D8 (Recognize): Document lessons learned and formally close the project, congratulating the team.`,
    howToCreateAr: `كيفية إكمال تقرير 8D:
1. D1 (الفريق): تشكيل فريق خبراء متعدد الوظائف.
2. D2 (المشكلة): تحديد المشكلة بدقة باستخدام مصطلحات قابلة للقياس.
3. D3 (الاحتواء): تنفيذ والتحقق من إجراءات الاحتواء المؤقتة (ICA) خلال 24 ساعة.
4. D4 (السبب الجذري): تحليل وتأكيد سبب "الحدوث" وسبب "التسرب" (لماذا لم نكتشفه؟).
5. D5 (اختيار الإجراءات): صياغة الإجراءات التصحيحية الدائمة (PCA) والتحقق الإحصائي من نجاحها النظري.
6. D6 (التنفيذ): تطبيق الإجراءات الدائمة وإزالة إجراءات الاحتواء المؤقتة.
7. D7 (المنع): تحديث وثائق المخاطر (FMEA) وخطط التحكم (Control Plans) والإجراءات لمنع التكرار في منتجات أخرى.
8. D8 (التكريم): توثيق الدروس المستفادة، إغلاق المشروع رسمياً، وتكريم الفريق.`,
    howToRecordEn: 'The module enforces sequential discipline progression. You cannot move to D4 without completing D3. Generates a formal 8D PDF report for customers.',
    howToRecordAr: 'يجبر الموديول على التدرج المتسلسل. لا يمكنك الانتقال لـ D4 بدون إكمال D3. يقوم بإنشاء تقرير 8D رسمي بصيغة PDF لتقديمه للعملاء.',
  },
  'quality-complaint': {
    descriptionEn: 'The Customer Complaints Management module ensures swift, professional resolution of customer grievances. It tracks the complete investigation timeline, linking the complaint to internal CAPAs and managing customer communication.',
    descriptionAr: 'موديول إدارة شكاوى العملاء يضمن الحل السريع والاحترافي لتظلمات العملاء. يتتبع الجدول الزمني الكامل للتحقيق، ويربط الشكوى بتقارير CAPA الداخلية، ويدير التواصل مع العميل.',
    howToCreateEn: `Complaint Handling Workflow:
1. Intake: Record Customer Name, Complaint Date, Product Batch, and exact failure description.
2. Triage: Classify severity (Safety, Major Quality, Minor). High severity alerts top management instantly.
3. Initial Response: Send a 24-hour acknowledgment and containment plan to the customer.
4. Investigation: Assign to an engineer. Link to NCR or 8D to find how the defect escaped.
5. Resolution: Document the findings and proposed solutions.
6. Customer Approval: Send the final investigation report. Close the complaint upon customer acceptance.`,
    howToCreateAr: `مسار عمل معالجة الشكوى:
1. الاستلام: سجل اسم العميل، تاريخ الشكوى، رقم تشغيلة المنتج، ووصف الفشل الدقيق.
2. التصنيف: صنف الشدة (سلامة، جودة رئيسية، طفيفة). الشدة العالية تنبه الإدارة العليا فوراً.
3. الرد المبدئي: أرسل إقراراً بالاستلام وخطة احتواء للعميل خلال 24 ساعة.
4. التحقيق: قم بالتعيين لمهندس للبحث. اربطها بـ NCR أو 8D لمعرفة كيف تسرب العيب.
5. الحل: وثق النتائج والحلول المقترحة.
6. موافقة العميل: أرسل تقرير التحقيق النهائي. أغلق الشكوى فور قبول العميل للحل.`,
    howToRecordEn: 'Key metrics tracked include Complaint Rate (per million units sold), Average Resolution Time (SLA), and Cost of Poor Quality (COPQ) related to returns and warranty claims.',
    howToRecordAr: 'المؤشرات الرئيسية تشمل: معدل الشكاوى (لكل مليون وحدة مباعة)، متوسط وقت الحل (SLA)، وتكلفة الجودة الرديئة (COPQ) المتعلقة بالمرتجعات ومطالبات الضمان.',
  },
  'quality-deviation': {
    descriptionEn: 'Deviation Management is used to request, review, and approve temporary departures from standard operating procedures (SOPs), BOMs, or specifications. It ensures controlled flexibility without compromising safety or quality.',
    descriptionAr: 'إدارة الانحرافات تُستخدم لطلب، ومراجعة، والموافقة على أي خروج مؤقت عن إجراءات التشغيل القياسية (SOPs)، أو قوائم المواد (BOM)، أو المواصفات. تضمن هذه الشاشة مرونة محكومة دون المساس بالسلامة أو الجودة.',
    howToCreateEn: `How to manage a Deviation:
1. Request: An initiator creates a request describing the needed deviation (e.g., "Use alternative raw material X due to shortage of Y").
2. Type: Select whether this is a Planned Deviation (requested beforehand) or Unplanned (post-event incident).
3. Risk Assessment: Evaluate potential impact on product functionality, safety, and regulatory compliance.
4. Approval: Requires multi-level sign-off (Quality Manager, Plant Manager, sometimes Customer).
5. Expiry: Crucially, set an expiration limit (either a specific Date or a maximum Quantity produced).
6. Expiry Alert: The system locks the deviation and reverts to standard when the expiry limit is reached.`,
    howToCreateAr: `كيفية إدارة انحراف:
1. الطلب: يقوم مقدم الطلب بوصف الانحراف المطلوب (مثال: "استخدام خامة بديلة X بسبب نقص الخامة Y").
2. النوع: حدد ما إذا كان انحرافاً مخططاً (طُلب مسبقاً) أو غير مخطط (حادث وقع بالفعل).
3. تقييم المخاطر: تقييم التأثير المحتمل على وظائف المنتج، السلامة، والامتثال التنظيمي.
4. الاعتماد: يتطلب توقيعات متعددة المستويات (مدير الجودة، مدير المصنع، وأحياناً العميل).
5. الانتهاء: الأهم هو تحديد حد لانتهاء الصلاحية (سواء تاريخ محدد أو كمية إنتاج قصوى).
6. تنبيه الانتهاء: يغلق النظام الانحراف ويعود للوضع القياسي فور الوصول للحد الأقصى.`,
    howToRecordEn: 'Active deviations are visibly flagged in production planning to alert operators. Expired deviations cannot be used for new work orders.',
    howToRecordAr: 'الانحرافات النشطة يتم تمييزها بوضوح في تخطيط الإنتاج لتنبيه المشغلين. الانحرافات المنتهية لا يمكن استخدامها في أوامر الشغل الجديدة.',
  },
  'quality-change': {
    descriptionEn: 'The Change Control (Management of Change - MoC) module governs permanent modifications to processes, equipment, materials, or documents. It prevents unassessed changes from introducing new quality defects.',
    descriptionAr: 'موديول إدارة التغيير (Change Control / MoC) يحكم التعديلات الدائمة على العمليات، المعدات، الخامات، أو الوثائق. يمنع هذا الموديول التغييرات غير المدروسة من التسبب في عيوب جودة جديدة.',
    howToCreateEn: `Change Control Process:
1. Initiation: Propose the change (e.g., "Upgrade packaging machine software").
2. Impact Analysis: Cross-functional review of impacts on QA, HSE, Maintenance, and Production.
3. Pre-Approval: Committee approves moving forward with the change execution.
4. Action Plan: Create tasks for validation, training, and updating documentation (SOPs).
5. Execution: Perform the change in a controlled manner.
6. Post-Approval & Verification: Verify the change achieved its goal without negative side-effects before formally closing.`,
    howToCreateAr: `عملية إدارة التغيير:
1. البدء: اقتراح التغيير (مثال: "تحديث برنامج ماكينة التغليف").
2. تحليل التأثير: مراجعة شاملة لتأثيرات التغيير على الجودة، السلامة، الصيانة، والإنتاج.
3. الاعتماد المبدئي: توافق اللجنة على المضي قدماً في تنفيذ التغيير.
4. خطة العمل: إنشاء مهام للتحقق (Validation)، التدريب، وتحديث الوثائق (SOPs).
5. التنفيذ: إجراء التغيير بطريقة محكومة.
6. الاعتماد النهائي والتحقق: التأكد من أن التغيير حقق هدفه دون آثار جانبية سلبية قبل الإغلاق الرسمي.`,
    howToRecordEn: 'Changes require updating linked master data (like FMEAs or Control Plans). The module maintains a strict version history and approval audit trail.',
    howToRecordAr: 'التغييرات تتطلب تحديث البيانات الرئيسية المرتبطة (مثل FMEA أو خطط التحكم). يحتفظ الموديول بتاريخ إصدارات صارم ومسار تدقيق للموافقات.',
  },

  // === Section 3: System Analytics ===
  'quality-spc': {
    descriptionEn: 'The Statistical Process Control (SPC) System is a high-level analytics tool that monitors production process stability and capability over time, helping predict and prevent defects before they occur.',
    descriptionAr: 'نظام التحكم الإحصائي للعمليات (SPC) هو أداة تحليلات متقدمة تراقب استقرار وقدرة العملية الإنتاجية بمرور الوقت، مما يساعد على التنبؤ بالعيوب ومنعها قبل حدوثها.',
    howToCreateEn: `How to use SPC:
1. Select the Control Chart type based on data: Variables (X-bar/R, X-bar/S, I-MR) or Attributes (p, np, u, c).
2. The system pulls measurement data automatically from the Inspection Execution Board.
3. Control Limits (UCL, LCL) are calculated statistically, distinct from specification limits (USL, LSL).
4. Review the generated Control Charts to identify trends or shifts.
5. The system applies Nelson Rules (e.g., 7 points in a row trending up) to flag "Out of Control" points in red.
6. Switch to the 'Capability Analysis' tab to view Cp, Cpk, Pp, Ppk and the Histogram distribution.`,
    howToCreateAr: `كيفية استخدام الـ SPC:
1. اختر نوع شارت التحكم بناءً على البيانات: متغيرات (X-bar/R, I-MR) أو خصائص (p, u).
2. يسحب النظام بيانات القياسات تلقائياً من لوحة تنفيذ الفحوصات.
3. يتم حساب حدود التحكم الإحصائية (UCL, LCL) تلقائياً، وهي تختلف عن حدود المواصفات الهندسية (USL, LSL).
4. راجع الشارتات لتحديد الاتجاهات أو الانحرافات.
5. يطبق النظام قواعد نيلسون (مثال: 7 نقاط متتالية في اتجاه واحد) لتمييز النقاط "الخارجة عن السيطرة" باللون الأحمر.
6. انتقل لتبويب 'تحليل القدرة' لرؤية مؤشرات Cpk, Ppk وتوزيع الهيستوجرام.`,
    howToRecordEn: 'SPC does not create records directly; it acts as an analytical overlay on top of existing inspection measurements. Out-of-control signals can, however, trigger the creation of automated NCRs.',
    howToRecordAr: 'الـ SPC لا يُنشئ سجلات بشكل مباشر؛ بل يعمل كطبقة تحليلية فوق قياسات الفحص الموجودة. ومع ذلك، يمكن لإشارات "الخروج عن السيطرة" أن تفعّل إنشاء تقارير NCR تلقائية.',
  },

  // === Section 4: Configuration ===
  'quality-master-data': {
    descriptionEn: 'Quality Master Data is the foundational database of the QMS. It stores all predefined standardized catalogs (Parts, Defect Types, Suppliers, Departments) used throughout the system to ensure data consistency and eliminate free-text errors.',
    descriptionAr: 'البيانات الرئيسية للجودة (Master Data) هي قاعدة البيانات التأسيسية للنظام. تقوم بتخزين جميع القوائم الموحدة (القطع، أنواع العيوب، الموردين، الأقسام) المستخدمة في جميع الشاشات لضمان تطابق البيانات ومنع أخطاء الإدخال اليدوي.',
    howToCreateEn: `Managing Master Data:
1. Navigate through the tabs (Parts, Suppliers, Defect Types, Severity Levels).
2. To add a new item, fill out the form on the left pane and click 'Add'.
3. To update, click the 'Edit' icon next to an existing row.
4. Data can be imported/exported via Excel for mass updates.
5. Note: Master Data uses 'Soft Deletes' (Deactivate) instead of hard deletions to preserve historical integrity of old records.
6. Check the 'Recorded Defects' tab to view a read-only list of all transactional defects logged against this master data.`,
    howToCreateAr: `إدارة البيانات الرئيسية:
1. تنقل عبر التبويبات (القطع، الموردين، أنواع العيوب، مستويات الشدة).
2. لإضافة عنصر جديد، املأ النموذج في الجزء الأيسر واضغط 'إضافة'.
3. للتعديل، اضغط على أيقونة 'تعديل' بجوار الصف المطلوب.
4. يمكن استيراد/تصدير البيانات عبر ملفات إكسل للتحديثات الجماعية.
5. ملاحظة: النظام يستخدم 'الحذف الناعم' (إلغاء التنشيط) بدلاً من الحذف النهائي للحفاظ على سلامة السجلات التاريخية القديمة.
6. راجع تبويب 'Recorded Defects' لرؤية قائمة (للقراءة فقط) بجميع العيوب الفعلية التي تم تسجيلها بناءً على هذه البيانات.`,
    howToRecordEn: 'Changes to Master Data immediately update all dropdowns across the application (Shopfloor, NCR, CAPA). Ensure only authorized Admins have edit access.',
    howToRecordAr: 'التغييرات في البيانات الرئيسية تُحدّث فوراً جميع القوائم المنسدلة في التطبيق بالكامل (صالة الإنتاج، NCR، CAPA). تأكد من إعطاء صلاحيات التعديل للمسؤولين المعتمدين فقط.',
  }
};
