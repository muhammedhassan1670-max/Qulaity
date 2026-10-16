// QMS Enterprise 4.0 - Comprehensive Plant Departments & Real Platform Modules Engine
// Bridges all physical SCADA stations and 3D digital twin zones strictly with the REAL platform stages
// Defined directly in the sidebar tabs: from Inbound IQC to Shopfloor, Resolution, Outgoing, Customer, Lab & Setup.

export type DepartmentZone = 'receiving' | 'assembly' | 'resolution' | 'oqc' | 'shipping' | 'lab' | 'setup';

export interface PlantDepartment {
  id: string;
  code: string;
  number: number;
  nameAr: string;
  nameEn: string;
  shortNameAr: string;
  shortNameEn: string;
  headOfDeptAr: string;
  headOfDeptEn: string;
  headTitleAr: string;
  headTitleEn: string;
  colorName: string;
  accentHex: string;
  borderClass: string;
  bgGradient: string;
  iconName: string;
  zone: DepartmentZone;
  physicalLocationAr: string;
  physicalLocationEn: string;

  // Closed Loop Traceability Flow
  upstreamDeptId?: string;
  downstreamDeptId?: string;
  inputDescriptionAr: string;
  inputDescriptionEn: string;
  outputDescriptionAr: string;
  outputDescriptionEn: string;

  // Physical equipment pods on factory floorplan (Strictly 1:1 with real sidebar tabs)
  stationIds: string[];

  // Linked QMS Modules across entire platform
  linkedModules: {
    id: string;
    labelAr: string;
    labelEn: string;
    path: string;
    icon: string;
    badgeCountKey?: 'ncr' | 'defect' | 'capa' | 'complaint' | 'inspection' | 'spc' | 'audit';
  }[];

  // Target Key Performance Indicators
  primaryKpiAr: string;
  primaryKpiEn: string;
  targetKpiValue: string;
  slaHours: number;
}

export const ENTERPRISE_DEPARTMENTS: PlantDepartment[] = [
  // --------------------------------------------------------------------------
  // 1. استلام الخامات والموردين (IQC) - المرحلة الأولى في القائمة الجانبية
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-STAGE-INCOMING',
    code: 'STAGE-01',
    number: 1,
    nameAr: '1. استلام الخامات والموردين (IQC)',
    nameEn: '1. Incoming & Supplier Quality (IQC)',
    shortNameAr: 'استلام الخامات (IQC)',
    shortNameEn: 'Incoming & Supplier',
    headOfDeptAr: 'م. طارق العوضي',
    headOfDeptEn: 'Eng. Tarek El-Awady',
    headTitleAr: 'مدير توكيد جودة سلاسل الإمداد وفحص الاستلام',
    headTitleEn: 'Supplier Quality Assurance Manager',
    colorName: 'amber',
    accentHex: '#f59e0b',
    borderClass: 'border-amber-500/40',
    bgGradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    iconName: 'truck',
    zone: 'receiving',
    physicalLocationAr: 'رصيف استلام الخامات ومحطة فحص الوارد IQC',
    physicalLocationEn: 'Inbound Receiving Dock & IQC Inspection Port',
    downstreamDeptId: 'DEPT-STAGE-INPROCESS',
    inputDescriptionAr: 'شحنات المواد الخام، بوالص الشحن، وشهادات التحليل المخبرية COA من الموردين',
    inputDescriptionEn: 'Raw materials, bill of lading & supplier Certificate of Analysis (COA)',
    outputDescriptionAr: 'خامات مفحوصة ومطابقة 100% أو عزل الشحنات المخالفة لتقرير عدم مطابقة',
    outputDescriptionEn: '100% verified compliant raw lots or quarantined defect batches',
    stationIds: ['STATION-SUPPLIER-QUALITY', 'STATION-INSPECTION-PLANS', 'STATION-IQC-INSPECTION'],
    linkedModules: [
      { id: 'quality-supplier', labelAr: 'جودة وتقييم الموردين', labelEn: 'Supplier Quality & Rating', path: '/supplier-quality', icon: 'Truck' },
      { id: 'quality-inspection-plans', labelAr: 'خطط فحص المواد الخام', labelEn: 'Incoming Inspection Plans', path: '/quality-inspection-plans', icon: 'FileText' },
      { id: 'quality-inspection', labelAr: 'فحص الشحنات الواردة (IQC)', labelEn: 'Incoming Inspection (IQC)', path: '/compliance/hub/inspection', icon: 'ClipboardCheck', badgeCountKey: 'inspection' },
    ],
    primaryKpiAr: 'نسبة قبول شحنات الموردين من أول مرة (SAR)',
    primaryKpiEn: 'Supplier Acceptance Rate (SAR)',
    targetKpiValue: '≥ 98.8%',
    slaHours: 4
  },

  // --------------------------------------------------------------------------
  // 2. جودة التصنيع والعمليات (IPQC) - المرحلة الثانية في القائمة الجانبية
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-STAGE-INPROCESS',
    code: 'STAGE-02',
    number: 2,
    nameAr: '2. جودة التصنيع والعمليات (IPQC)',
    nameEn: '2. In-Process Quality (IPQC)',
    shortNameAr: 'جودة التصنيع (IPQC)',
    shortNameEn: 'In-Process QA',
    headOfDeptAr: 'م. دينا الشربيني',
    headOfDeptEn: 'Eng. Dina El-Sherbini',
    headTitleAr: 'رئيس قسم هندسة الجودة والـ SPC والرقابة أثناء التشغيل',
    headTitleEn: 'Lead In-Process Quality & SPC Engineer',
    colorName: 'cyan',
    accentHex: '#06b6d4',
    borderClass: 'border-cyan-500/40',
    bgGradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    iconName: 'smartphone',
    zone: 'assembly',
    physicalLocationAr: 'صالة الإنتاج والتشغيل وبوابات الفحص المرحلي وكارتات التحكم',
    physicalLocationEn: 'Production Shopfloor, Quality Clearance Gates & SPC Stations',
    upstreamDeptId: 'DEPT-STAGE-INCOMING',
    downstreamDeptId: 'DEPT-STAGE-RESOLUTION',
    inputDescriptionAr: 'الخامات المعتمدة من الاستلام وتعليمات الفحص من خطة التحكم Control Plan',
    inputDescriptionEn: 'Approved raw materials & inspection specs from Control Plan',
    outputDescriptionAr: 'منتجات مرحلية مفحوصة ومطابقة مع كارتات ضبط إحصائي أو رصد عيوب',
    outputDescriptionEn: 'Cleared in-process batches with verified SPC charts or defect logs',
    stationIds: ['STATION-SHOPFLOOR-ENTRY', 'STATION-DEFECT-LOG', 'STATION-SPC-CHARTS', 'STATION-EXECUTION-BOARD'],
    linkedModules: [
      { id: 'quality-shopfloor', labelAr: 'تسجيل سريع من الأرضية', labelEn: 'Fast Shopfloor Entry', path: '/quality-shopfloor', icon: 'Smartphone', badgeCountKey: 'defect' },
      { id: 'quality-defect-log', labelAr: 'مسجل / قائمة العيوب اليومية', labelEn: 'Daily Defect Recorder', path: '/defect-log', icon: 'AlertCircle' },
      { id: 'quality-spc', labelAr: 'كارتات التحكم الإحصائي SPC', labelEn: 'SPC Control Charts', path: '/spc', icon: 'Activity', badgeCountKey: 'spc' },
      { id: 'quality-execution-board', labelAr: 'متابعة تنفيذ محطات الفحص', labelEn: 'Inspection Execution Board', path: '/quality-execution-board', icon: 'BarChart3' },
    ],
    primaryKpiAr: 'مؤشر قدرة العمليات الهندسية (Cpk)',
    primaryKpiEn: 'Process Capability Index (Cpk)',
    targetKpiValue: '≥ 1.33',
    slaHours: 1
  },

  // --------------------------------------------------------------------------
  // 3. عدم المطابقة وحل المشكلات (NCR/8D) - المرحلة الثالثة في القائمة الجانبية
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-STAGE-RESOLUTION',
    code: 'STAGE-03',
    number: 3,
    nameAr: '3. عدم المطابقة وحل المشكلات (NCR/8D)',
    nameEn: '3. Problem Solving (NCR/8D)',
    shortNameAr: 'عدم المطابقة والتحسين',
    shortNameEn: 'NCR & Problem Solving',
    headOfDeptAr: 'د. سارة المنشاوي',
    headOfDeptEn: 'Dr. Sarah El-Menshawy',
    headTitleAr: 'مدير عام توكيد الجودة والحوكمة ولجنة حل المشكلات',
    headTitleEn: 'QA, Governance & Problem Solving Director',
    colorName: 'rose',
    accentHex: '#f43f5e',
    borderClass: 'border-rose-500/40',
    bgGradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    iconName: 'workflow',
    zone: 'resolution',
    physicalLocationAr: 'غرفة عمليات معالجة عدم المطابقة وتحقيقات الـ 8D والحيود',
    physicalLocationEn: 'NCR War Room, 8D Investigation Hub & Concession Center',
    upstreamDeptId: 'DEPT-STAGE-INPROCESS',
    downstreamDeptId: 'DEPT-STAGE-OUTGOING',
    inputDescriptionAr: 'تقارير العيوب الميدانية، حالات عدم المطابقة المحصورة، والانحرافات',
    inputDescriptionEn: 'Logged shift defects, escalated non-conformances & deviations',
    outputDescriptionAr: 'إجراءات تصحيحية مغلقة CAPA، مشاريع 8D مكتملة، وتعديلات هندسية ECN',
    outputDescriptionEn: 'Verified closed CAPAs, solved 8D projects & authorized ECN changes',
    stationIds: ['STATION-NCR-REPORTS', 'STATION-CAPA-ACTIONS', 'STATION-8D-SOLVING', 'STATION-DEVIATION-PERMITS', 'STATION-CHANGE-CONTROL'],
    linkedModules: [
      { id: 'quality-ncr', labelAr: 'تقارير عدم المطابقة NCR', labelEn: 'NCR Non-Conformance', path: '/quality/records/ncr', icon: 'AlertCircle', badgeCountKey: 'ncr' },
      { id: 'quality-capa', labelAr: 'الإجراءات التصحيحية CAPA', labelEn: 'CAPA Corrective Actions', path: '/quality/records/capa', icon: 'ClipboardCheck', badgeCountKey: 'capa' },
      { id: 'quality-8d', labelAr: 'حل المشكلات المنهجي 8D', labelEn: '8D Problem Solving', path: '/quality/records/8d', icon: 'FileText' },
      { id: 'quality-deviation', labelAr: 'الانحرافات وتصاريح الحيود', labelEn: 'Deviations & Concessions', path: '/quality/records/deviation', icon: 'TrendingUp' },
      { id: 'quality-change', labelAr: 'ضبط التغيير الهندسي', labelEn: 'Engineering Change Control', path: '/quality/records/change-control', icon: 'Workflow' },
    ],
    primaryKpiAr: 'نسبة إغلاق الإجراءات التصحيحية CAPA في موعدها',
    primaryKpiEn: 'On-Time CAPA Closure Rate',
    targetKpiValue: '≥ 96.5%',
    slaHours: 24
  },

  // --------------------------------------------------------------------------
  // 4. فحص وخروج المنتج (OQC) - المرحلة الرابعة في القائمة الجانبية
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-STAGE-OUTGOING',
    code: 'STAGE-04',
    number: 4,
    nameAr: '4. فحص وخروج المنتج (OQC)',
    nameEn: '4. Outgoing Quality (OQC)',
    shortNameAr: 'فحص الشحن (OQC)',
    shortNameEn: 'Outgoing Quality',
    headOfDeptAr: 'م. هيثم عبد السلام',
    headOfDeptEn: 'Eng. Haitham Abdelsalam',
    headTitleAr: 'رئيس قسم الفحص النهائي وضمان جودة الشحن والتصدير',
    headTitleEn: 'Outgoing QA & Final Release Lead',
    colorName: 'emerald',
    accentHex: '#10b981',
    borderClass: 'border-emerald-500/40',
    bgGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    iconName: 'package',
    zone: 'oqc',
    physicalLocationAr: 'محطة الفحص النهائي وسحب عينات القبول AQL والإفراج',
    physicalLocationEn: 'Final OQC Inspection Station & AQL Acceptance Gate',
    upstreamDeptId: 'DEPT-STAGE-RESOLUTION',
    downstreamDeptId: 'DEPT-STAGE-CUSTOMER',
    inputDescriptionAr: 'المنتجات تامة الصنع الصادرة من خطوط الإنتاج بعد الإجازة المرحلية',
    inputDescriptionEn: 'Finished goods lots cleared from production stages',
    outputDescriptionAr: 'لوطات معتمدة مختومة بباركود الإفراج النهائي وشهادة المطابقة COC',
    outputDescriptionEn: 'Approved release pallets with final Certificate of Conformance',
    stationIds: ['STATION-OUTGOING-OQC'],
    linkedModules: [
      { id: 'quality-outgoing', labelAr: 'فحص جودة الشحنات الصادرة (OQC)', labelEn: 'Pre-Shipment Inspection (OQC)', path: '/outgoing-quality', icon: 'Truck', badgeCountKey: 'inspection' },
    ],
    primaryKpiAr: 'نسبة اجتياز الفحص النهائي من أول مرة (FPY)',
    primaryKpiEn: 'First Pass Yield (FPY)',
    targetKpiValue: '≥ 99.4%',
    slaHours: 2
  },

  // --------------------------------------------------------------------------
  // 5. شكاوى العملاء والميدان - المرحلة الخامسة في القائمة الجانبية
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-STAGE-CUSTOMER',
    code: 'STAGE-05',
    number: 5,
    nameAr: '5. شكاوى العملاء والميدان',
    nameEn: '5. Customer & Field Quality',
    shortNameAr: 'شكاوى العملاء',
    shortNameEn: 'Customer Complaints',
    headOfDeptAr: 'أ. ريم الشاذلي',
    headOfDeptEn: 'Reem El-Shazly',
    headTitleAr: 'رئيس قسم علاقات العملاء والجودة الميدانية ومرتجعات RMA',
    headTitleEn: 'Customer Complaints & Field QA Lead',
    colorName: 'indigo',
    accentHex: '#6366f1',
    borderClass: 'border-indigo-500/40',
    bgGradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
    iconName: 'user',
    zone: 'shipping',
    physicalLocationAr: 'مركز متابعة شكاوى العملاء واستقبال بلاغات الجودة الميدانية',
    physicalLocationEn: 'Customer Complaints Command Center & Field Support Desk',
    upstreamDeptId: 'DEPT-STAGE-OUTGOING',
    downstreamDeptId: 'DEPT-STAGE-INCOMING', // Completes the closed feedback loop
    inputDescriptionAr: 'استفسارات وملاحظات العملاء، مطالبات الضمان، ومرتجعات RMA الميدانية',
    inputDescriptionEn: 'Customer feedback, warranty claims & RMA return logs',
    outputDescriptionAr: 'إغلاق شكاوى العملاء وتحويل الخلل المتكرر لمشاريع 8D وإجراءات وقائية',
    outputDescriptionEn: 'Customer claim settlements & closed-loop 8D escalation',
    stationIds: ['STATION-CUSTOMER-COMPLAINTS'],
    linkedModules: [
      { id: 'quality-complaint', labelAr: 'سجل شكاوى العملاء', labelEn: 'Customer Complaints Log', path: '/quality/records/complaint', icon: 'AlertCircle', badgeCountKey: 'complaint' },
    ],
    primaryKpiAr: 'معدل شكاوى العملاء بالمليون (Customer PPM)',
    primaryKpiEn: 'Customer Complaints Rate (PPM)',
    targetKpiValue: '< 30 PPM',
    slaHours: 8
  },

  // --------------------------------------------------------------------------
  // 6. المختبر الهندسي والتدقيق - المرحلة السادسة في القائمة الجانبية
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-STAGE-COMPLIANCE',
    code: 'STAGE-06',
    number: 6,
    nameAr: '6. المختبر الهندسي والتدقيق',
    nameEn: '6. Engineering Lab & Audits',
    shortNameAr: 'المختبر والتدقيق',
    shortNameEn: 'Lab & Compliance',
    headOfDeptAr: 'د. أيمن فؤاد',
    headOfDeptEn: 'Dr. Ayman Fouad',
    headTitleAr: 'مدير المختبر المركزي وتوكيد الامتثال ومعايرة أجهزة القياس',
    headTitleEn: 'Metrology Lab, Audits & Calibration Director',
    colorName: 'purple',
    accentHex: '#a855f7',
    borderClass: 'border-purple-500/40',
    bgGradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
    iconName: 'shield',
    zone: 'lab',
    physicalLocationAr: 'مختبر المعايرة الدقيقة وقاعة تخطيط التدقيق وخطط المراقبة',
    physicalLocationEn: 'Precision Calibration Lab, Control Plan Center & Audit Hub',
    upstreamDeptId: 'DEPT-STAGE-SETUP',
    downstreamDeptId: 'DEPT-STAGE-INPROCESS',
    inputDescriptionAr: 'مواصفات المنتجات، شهادات معايرة الأجهزة، وسجلات التدقيق الداخلي',
    inputDescriptionEn: 'Product specs, gage calibration master data & audit schedules',
    outputDescriptionAr: 'خطط تحكم معتمدة، تحليل مخاطر FMEA، أجهزة قياس معايرة، ومراجعات LPA',
    outputDescriptionEn: 'Approved Control Plans, validated FMEAs, calibrated gages & LPA reports',
    stationIds: ['STATION-CONTROL-PLAN', 'STATION-FMEA-RISK', 'STATION-CALIBRATION-MSA', 'STATION-LAYERED-AUDITS', 'STATION-INTERNAL-AUDIT'],
    linkedModules: [
      { id: 'quality-control-plan', labelAr: 'خطط التحكم Control Plan', labelEn: 'Control Plan', path: '/control-plan', icon: 'Barcode' },
      { id: 'quality-fmea', labelAr: 'تحليل المخاطر FMEA', labelEn: 'FMEA Risk Analysis', path: '/fmea', icon: 'Brain' },
      { id: 'quality-calibration', labelAr: 'معايرة الأجهزة والـ MSA', labelEn: 'Equipment Calibration & MSA', path: '/compliance/hub/calibration', icon: 'Activity' },
      { id: 'quality-layered-audits', labelAr: 'مراجعات المشرف LPA', labelEn: 'Layered Process Audits (LPA)', path: '/quality-audits', icon: 'ShieldCheck', badgeCountKey: 'audit' },
      { id: 'quality-audit', labelAr: 'التدقيق الداخلي وإدارته', labelEn: 'Internal Audits (ISO)', path: '/compliance/hub/audit', icon: 'ClipboardCheck' },
    ],
    primaryKpiAr: 'التوافق مع متطلبات خطة المعايرة والتدقيق',
    primaryKpiEn: 'Calibration & Audit Compliance Rate',
    targetKpiValue: '100%',
    slaHours: 2
  },

  // --------------------------------------------------------------------------
  // 7. تهيئة المصنع والبيانات - المرحلة الثامنة في القائمة الجانبية
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-STAGE-SETUP',
    code: 'STAGE-07',
    number: 7,
    nameAr: '7. تهيئة المصنع والبيانات',
    nameEn: '7. Factory Setup & Master Data',
    shortNameAr: 'البيانات والتهيئة',
    shortNameEn: 'Setup & Master Data',
    headOfDeptAr: 'أ. محمود عبد الرحمن',
    headOfDeptEn: 'Mahmoud Abdelrahman',
    headTitleAr: 'رئيس قسم إدارة البيانات الرئيسية ومصمم النماذج والدروس المستفادة',
    headTitleEn: 'Quality Master Data & Configuration Lead',
    colorName: 'blue',
    accentHex: '#3b82f6',
    borderClass: 'border-blue-500/40',
    bgGradient: 'from-blue-500/20 via-sky-500/10 to-transparent',
    iconName: 'settings',
    zone: 'setup',
    physicalLocationAr: 'مركز إدارة تهيئة النظام وقواعد البيانات ونماذج الفحص',
    physicalLocationEn: 'System Configuration, Forms & Knowledge Repository',
    upstreamDeptId: 'DEPT-STAGE-CUSTOMER',
    downstreamDeptId: 'DEPT-STAGE-COMPLIANCE',
    inputDescriptionAr: 'بيانات القطع والموديلات، متطلبات التفتيش، والدروس المستفادة من حل المشكلات',
    inputDescriptionEn: 'Parts/models catalog, inspection requirements & 8D lessons learned',
    outputDescriptionAr: 'كتالوج بيانات موحد، قوالب شيك ليست ديناميكية، وقاعدة معرفة محدثة',
    outputDescriptionEn: 'Unified master data, dynamic inspection forms & active lessons learned',
    stationIds: ['STATION-MASTER-DATA', 'STATION-FORM-DESIGNER', 'STATION-KNOWLEDGE-BASE'],
    linkedModules: [
      { id: 'quality-master-data', labelAr: 'البيانات الرئيسية (قطع/موديلات)', labelEn: 'Quality Master Data', path: '/quality-master-data', icon: 'Database' },
      { id: 'quality-form-designer', labelAr: 'مصمم نماذج الفحص', labelEn: 'Inspection Form Designer', path: '/quality-form-designer', icon: 'Blocks' },
      { id: 'quality-knowledge-base', labelAr: 'قاعدة الدروس المستفادة', labelEn: 'Lessons Learned Knowledge Base', path: '/quality-knowledge-base', icon: 'Library' },
    ],
    primaryKpiAr: 'اكتمال وحداثة البيانات الرئيسية وقوالب الفحص',
    primaryKpiEn: 'Master Data & Form Templates Readiness',
    targetKpiValue: '100%',
    slaHours: 1
  }
];

// Department lookup map by ID
export const ENTERPRISE_DEPT_MAP = ENTERPRISE_DEPARTMENTS.reduce<Record<string, PlantDepartment>>((acc, dept) => {
  acc[dept.id] = dept;
  return acc;
}, {});

// Station to Department Reverse Lookup
export function getDepartmentForStation(stationId: string): PlantDepartment | null {
  for (const dept of ENTERPRISE_DEPARTMENTS) {
    if (dept.stationIds.includes(stationId)) {
      return dept;
    }
  }
  return null;
}
