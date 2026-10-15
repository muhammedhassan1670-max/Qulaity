// QMS Enterprise 4.0 - Comprehensive Plant Departments & End-to-End Enterprise Flow Engine
// Bridges all physical SCADA stations and 3D digital twin zones with the 10 real enterprise departments
// Linking raw material arrival at dock all the way to customer delivery and field warranty feedback.

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
  zone: 'receiving' | 'assembly' | 'lab' | 'oqc' | 'shipping';
  physicalLocationAr: string;
  physicalLocationEn: string;

  // Closed Loop Traceability Flow
  upstreamDeptId?: string;
  downstreamDeptId?: string;
  inputDescriptionAr: string;
  inputDescriptionEn: string;
  outputDescriptionAr: string;
  outputDescriptionEn: string;

  // Physical equipment pods on factory floorplan
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
  // 1. إدارة سلاسل الإمداد ومراقبة جودة الموردين
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-SUPPLY-CHAIN',
    code: 'SQA-01',
    number: 1,
    nameAr: 'إدارة سلاسل الإمداد وجودة الموردين',
    nameEn: 'Supply Chain & Supplier Quality (SQA)',
    shortNameAr: 'جودة الموردين والاستلام',
    shortNameEn: 'Supplier QA & Inbound',
    headOfDeptAr: 'م. طارق العوضي',
    headOfDeptEn: 'Eng. Tarek El-Awady',
    headTitleAr: 'مدير توكيد جودة سلاسل الإمداد والموردين',
    headTitleEn: 'Supplier Quality Assurance Manager',
    colorName: 'amber',
    accentHex: '#f59e0b',
    borderClass: 'border-amber-500/40',
    bgGradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    iconName: 'truck',
    zone: 'receiving',
    physicalLocationAr: 'رصيف الشاحنات الغربي A + بوابة الفحص IQC-01',
    physicalLocationEn: 'West Inbound Gate A & IQC Inspection Port',
    downstreamDeptId: 'DEPT-WAREHOUSE-INVENTORY',
    inputDescriptionAr: 'شحنات المواد الخام، بوالص الشحن، وشهادات التحليل المخبرية COA من الموردين',
    inputDescriptionEn: 'Raw materials, bill of lading & supplier Certificate of Analysis (COA)',
    outputDescriptionAr: 'خامات مفحوصة ومطابقة 100% أو عزل الشحنات المخالفة في قفص الحجر',
    outputDescriptionEn: '100% verified compliant raw lots or quarantined defect batches',
    stationIds: ['DOCK-RECEIVING-01', 'STATION-IQC-INSPECT', 'QUARANTINE-CAGE'],
    linkedModules: [
      { id: 'supplier-quality', labelAr: 'ملفات وتقييم الموردين', labelEn: 'Supplier Quality Audits', path: '/supplier-quality', icon: 'Truck' },
      { id: 'iqc-plans', labelAr: 'خطط فحص المواد الخام', labelEn: 'Incoming Inspection Plans', path: '/quality-inspection-plans', icon: 'ClipboardList' },
      { id: 'iqc-inspect', labelAr: 'تسجيل فحص الاستلام IQC', labelEn: 'Log Inbound Inspection', path: '/compliance/hub/inspection', icon: 'CheckSquare', badgeCountKey: 'inspection' },
      { id: 'quarantine-ncr', labelAr: 'تقارير عزل الموردين (NCR)', labelEn: 'Supplier NCRs & Holds', path: '/quality/records/ncr', icon: 'AlertTriangle', badgeCountKey: 'ncr' },
    ],
    primaryKpiAr: 'نسبة قبول شحنات الموردين من أول مرة (SAR)',
    primaryKpiEn: 'Supplier Acceptance Rate (SAR)',
    targetKpiValue: '≥ 98.8%',
    slaHours: 4
  },

  // --------------------------------------------------------------------------
  // 2. إدارة المستودعات ومراقبة المخزون والخامات
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-WAREHOUSE-INVENTORY',
    code: 'WMS-02',
    number: 2,
    nameAr: 'إدارة المستودعات ومراقبة المخزون وتتبع اللوطات',
    nameEn: 'Warehouse & Raw Materials Inventory (WMS)',
    shortNameAr: 'المستودعات والخامات',
    shortNameEn: 'Warehouse & Staging',
    headOfDeptAr: 'أ. محمود عبد الرحمن',
    headOfDeptEn: 'Mahmoud Abdelrahman',
    headTitleAr: 'رئيس قسم تخطيط ومراقبة المخزون',
    headTitleEn: 'Inventory & Materials Staging Head',
    colorName: 'blue',
    accentHex: '#3b82f6',
    borderClass: 'border-blue-500/40',
    bgGradient: 'from-blue-500/20 via-sky-500/10 to-transparent',
    iconName: 'pallet',
    zone: 'receiving',
    physicalLocationAr: 'مستودع الخامات المركزي وعنابر الباليتات BUF-01',
    physicalLocationEn: 'Raw Material High-Bay Storage BUF-01',
    upstreamDeptId: 'DEPT-SUPPLY-CHAIN',
    downstreamDeptId: 'DEPT-PRODUCTION-OPERATIONS',
    inputDescriptionAr: 'شحنات معتمدة مختومة بباركود الفحص من إدارة فحص الاستلام',
    inputDescriptionEn: 'Approved raw materials passed by Inbound QA with verified barcodes',
    outputDescriptionAr: 'إمداد خطوط الإنتاج بالخامات وفق نظام FIFO ورقم التشغيلة Lot No',
    outputDescriptionEn: 'FIFO-controlled material feed to production lines with Lot Traceability',
    stationIds: ['WAREHOUSE-RAW-STAGING'],
    linkedModules: [
      { id: 'master-data', labelAr: 'البيانات الأساسية للمنتجات والخامات', labelEn: 'Master Parts & Materials', path: '/quality-master-data', icon: 'Layers' },
      { id: 'barcode-trace', labelAr: 'تتبع باركود الشحنات واللوطات', labelEn: 'Barcode & Lot Traceability', path: '/quality-search', icon: 'Search' },
      { id: 'sync-manager', labelAr: 'مزامنة أذونات التخزين والمخزون', labelEn: 'Offline Warehouse Sync', path: '/quality-sync-manager', icon: 'RefreshCw' },
    ],
    primaryKpiAr: 'دقة تتبع اللوطات وصرف المخزون FIFO',
    primaryKpiEn: 'Lot Traceability & FIFO Compliance',
    targetKpiValue: '100%',
    slaHours: 2
  },

  // --------------------------------------------------------------------------
  // 3. إدارة العمليات والإنتاج والتشغيل الميداني
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-PRODUCTION-OPERATIONS',
    code: 'PRD-03',
    number: 3,
    nameAr: 'إدارة العمليات والإنتاج والتشغيل الميداني',
    nameEn: 'Manufacturing & Shopfloor Production Operations',
    shortNameAr: 'الإنتاج والتشغيل',
    shortNameEn: 'Shopfloor Production',
    headOfDeptAr: 'م. حسام الدين نبيل',
    headOfDeptEn: 'Eng. Hossam Nabil',
    headTitleAr: 'مدير عمليات التصنيع والإنتاج',
    headTitleEn: 'Production Operations Director',
    colorName: 'cyan',
    accentHex: '#06b6d4',
    borderClass: 'border-cyan-500/40',
    bgGradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    iconName: 'machine',
    zone: 'assembly',
    physicalLocationAr: 'صالة الإنتاج والتجميع الآلي Bay B (ماكينات CNC وخط التجميع 01)',
    physicalLocationEn: 'Bay B Automated Machining & Assembly Line 01',
    upstreamDeptId: 'DEPT-WAREHOUSE-INVENTORY',
    downstreamDeptId: 'DEPT-IPQC-QUALITY-ENG',
    inputDescriptionAr: 'الخامات المصروفة من المستودع وأوامر العمل ERP وفق جدول الوردية',
    inputDescriptionEn: 'Raw materials from warehouse staging & ERP shift production orders',
    outputDescriptionAr: 'منتجات نصف مصنعة WIP مخرطة ومجمعة وفق زمن الدورة التاكت',
    outputDescriptionEn: 'Machined and fitted WIP assemblies synchronized with Takt cycle time',
    stationIds: ['STATION-CNC-MILLING', 'STATION-SUB-ASSEMBLY'],
    linkedModules: [
      { id: 'shopfloor-entry', labelAr: 'تسجيل العيوب والأندون الميداني', labelEn: 'Shopfloor Defect & Andon Entry', path: '/quality-shopfloor', icon: 'Zap', badgeCountKey: 'defect' },
      { id: 'daily-defects', labelAr: 'سجل عيوب الوردية اليومي', labelEn: 'Shift Defect Logbook', path: '/defect-log', icon: 'ClipboardList' },
      { id: 'execution-board', labelAr: 'لوحة قيادة الخطوط والمشغلين', labelEn: 'Line Clearance & Execution Board', path: '/quality-execution-board', icon: 'Activity' },
      { id: 'spc-charts', labelAr: 'مراقبة أبعاد التشغيل الميداني', labelEn: 'Process Measurements View', path: '/spc', icon: 'BarChart3' },
    ],
    primaryKpiAr: 'كفاءة المعدات الشاملة (OEE)',
    primaryKpiEn: 'Overall Equipment Effectiveness (OEE)',
    targetKpiValue: '≥ 88.5%',
    slaHours: 1
  },

  // --------------------------------------------------------------------------
  // 4. إدارة هندسة الجودة والرقابة أثناء التشغيل (IPQC)
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-IPQC-QUALITY-ENG',
    code: 'IPQC-04',
    number: 4,
    nameAr: 'إدارة هندسة الجودة والرقابة أثناء التشغيل والـ SPC',
    nameEn: 'In-Process Quality Control & Quality Engineering (IPQC)',
    shortNameAr: 'الجودة أثناء التشغيل',
    shortNameEn: 'In-Process QA (IPQC)',
    headOfDeptAr: 'م. دينا الشربيني',
    headOfDeptEn: 'Eng. Dina El-Sherbini',
    headTitleAr: 'رئيس قسم هندسة الجودة والـ SPC',
    headTitleEn: 'Lead Quality & Statistical Process Engineer',
    colorName: 'emerald',
    accentHex: '#10b981',
    borderClass: 'border-emerald-500/40',
    bgGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    iconName: 'wrench',
    zone: 'assembly',
    physicalLocationAr: 'بوابات فحص العزم والضغط وبوابة الإفراج المرحلي IPQC-GATE',
    physicalLocationEn: 'Torque, Pressure & In-Line Quality Gates TRQ/PRS/IPQC',
    upstreamDeptId: 'DEPT-PRODUCTION-OPERATIONS',
    downstreamDeptId: 'DEPT-METROLOGY-LAB',
    inputDescriptionAr: 'منتجات التجميع الميكانيكي للخضوع لاختبارات العزم Poka-Yoke وضغط الهيدروليك',
    inputDescriptionEn: 'Assembled components for torque validation, leakage & pressure testing',
    outputDescriptionAr: 'منتجات مجازة مرحلياً مع كارتات ضبط إحصائي SPC أو تحويل عدم المطابقة',
    outputDescriptionEn: 'Passed intermediate parts with verified SPC charts or routed NCRs',
    stationIds: ['STATION-TORQUE-BENCH', 'STATION-PRESSURE-TEST', 'STATION-IPQC-GATE'],
    linkedModules: [
      { id: 'spc-system', labelAr: 'التحكم الإحصائي في العمليات (SPC)', labelEn: 'SPC Control Charts (X-bar, R, Cpk)', path: '/spc', icon: 'Activity', badgeCountKey: 'spc' },
      { id: 'control-plan', labelAr: 'خطط المراقبة الهندسية (Control Plans)', labelEn: 'Dynamic Control Plans', path: '/control-plan', icon: 'CheckSquare' },
      { id: 'ncr-create', labelAr: 'إصدار تقرير عدم مطابقة (NCR)', labelEn: 'Raise Process Non-Conformance', path: '/quality/records/ncr', icon: 'AlertTriangle', badgeCountKey: 'ncr' },
      { id: 'process-ppm', labelAr: 'معدل العيوب بالمليون (Process PPM)', labelEn: 'Defect Rate (PPM Metric)', path: '/process-ppm', icon: 'BarChart3' },
    ],
    primaryKpiAr: 'مؤشر قدرة العمليات الهندسية (Cpk)',
    primaryKpiEn: 'Process Capability Index (Cpk)',
    targetKpiValue: '≥ 1.33',
    slaHours: 1
  },

  // --------------------------------------------------------------------------
  // 5. إدارة المختبرات المترولوجية والمعايرة الدقيقة
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-METROLOGY-LAB',
    code: 'MET-05',
    number: 5,
    nameAr: 'إدارة المختبرات المترولوجية والقياس الدقيق CMM والمعايرة',
    nameEn: 'Metrology Lab, CMM Testing & Calibration',
    shortNameAr: 'مختبر المترولوجيا CMM',
    shortNameEn: 'Metrology & Testing Lab',
    headOfDeptAr: 'د. أيمن فؤاد',
    headOfDeptEn: 'Dr. Ayman Fouad',
    headTitleAr: 'مدير المختبر المركزي ومعايرة أجهزة القياس',
    headTitleEn: 'Metrology Lab & Calibration Director',
    colorName: 'purple',
    accentHex: '#a855f7',
    borderClass: 'border-purple-500/40',
    bgGradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
    iconName: 'lab',
    zone: 'lab',
    physicalLocationAr: 'مختبر الغرف النظيفة CMM Cleanroom Hub C',
    physicalLocationEn: 'Hub C High-Precision Cleanroom Metrology Lab',
    upstreamDeptId: 'DEPT-IPQC-QUALITY-ENG',
    downstreamDeptId: 'DEPT-QA-MRB-GOVERNANCE',
    inputDescriptionAr: 'عينات فحص هندسية دقيقة منقولة عبر أنبوب الكبسولة الهوائي السريع',
    inputDescriptionEn: 'Sample parts transferred via High-Speed Pneumatic Sample Shuttle Tube',
    outputDescriptionAr: 'تقارير أبعاد ثلاثية الأبعاد CMM معتمدة وشهادات معايرة دولية',
    outputDescriptionEn: 'Certified 3D CMM metrology inspection reports & calibration certs',
    stationIds: ['LAB-METROLOGY-CMM'],
    linkedModules: [
      { id: 'calibration', labelAr: 'سجل معايرة أجهزة القياس والفحص', labelEn: 'Calibration Management & MSA', path: '/calibration', icon: 'Gauge' },
      { id: 'lab-inspection', labelAr: 'فحص العينات المخبرية الدقيقة', labelEn: 'Metrology Lab Inspections', path: '/compliance/hub/inspection', icon: 'CheckSquare' },
      { id: 'quality-library', labelAr: 'مكتبة المواصفات والرسومات الهندسية', labelEn: 'CAD Specs & Blueprints Library', path: '/quality-library', icon: 'FileText' },
    ],
    primaryKpiAr: 'مطابقة خطة معايرة الأجهزة السنوية',
    primaryKpiEn: 'Gage Calibration Compliance Rate',
    targetKpiValue: '100%',
    slaHours: 2
  },

  // --------------------------------------------------------------------------
  // 6. إدارة هندسة الصيانة والاعتمادية ومجسات IoT
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-MAINTENANCE-IOT',
    code: 'MNT-06',
    number: 6,
    nameAr: 'إدارة هندسة الصيانة والاعتمادية ومجسات IoT',
    nameEn: 'Maintenance, Reliability & Industrial IoT Engineering',
    shortNameAr: 'الصيانة والـ IoT',
    shortNameEn: 'Maintenance & Reliability',
    headOfDeptAr: 'م. كريم بدر الدين',
    headOfDeptEn: 'Eng. Karim Badr',
    headTitleAr: 'رئيس قسم الصيانة الوقائية والاعتمادية',
    headTitleEn: 'Plant Maintenance & Reliability Lead',
    colorName: 'yellow',
    accentHex: '#eab308',
    borderClass: 'border-yellow-500/40',
    bgGradient: 'from-yellow-500/20 via-amber-500/10 to-transparent',
    iconName: 'wrench',
    zone: 'assembly',
    physicalLocationAr: 'ورشة الصيانة الميكانيكية ووحدات التحكم الهيدروليكي والمحركات',
    physicalLocationEn: 'Central Machine Maintenance Shop & Motor VFD Panels',
    upstreamDeptId: 'DEPT-PRODUCTION-OPERATIONS',
    downstreamDeptId: 'DEPT-PRODUCTION-OPERATIONS',
    inputDescriptionAr: 'إشارات مجسات الاهتزاز والحرارة وقراءات تذبذب المحركات والـ VFD',
    inputDescriptionEn: 'Telemetry streams from vibration, thermographic & current IoT probes',
    outputDescriptionAr: 'ماكينات معايرة وجاهزة للعمل بأعلى اعتمادية وصفر توقفات حرجة',
    outputDescriptionEn: 'Zero-downtime tuned machinery with predictive maintenance clearance',
    stationIds: ['STATION-CNC-MILLING', 'STATION-PRESSURE-TEST'],
    linkedModules: [
      { id: 'iot-telemetry', labelAr: 'مراقبة مجسات وإنترنت الأشياء (IoT)', labelEn: 'Live IoT Sensor Oscilloscope', path: '/iot', icon: 'Cpu' },
      { id: 'equipment-config', labelAr: 'تكوين وضبط الماكينات والمحطات', labelEn: 'SCADA Machine Specifications', path: '/quality-master-data', icon: 'Settings' },
      { id: 'twin-diagnostics', labelAr: 'التشخيص الحي للماكينات', labelEn: '3D Plant Diagnostics', path: '/digital-twin', icon: 'Activity' },
    ],
    primaryKpiAr: 'متوسط الوقت بين الأعطال (MTBF)',
    primaryKpiEn: 'Mean Time Between Failures (MTBF)',
    targetKpiValue: '≥ 720 Hours',
    slaHours: 0.5
  },

  // --------------------------------------------------------------------------
  // 7. إدارة توكيد الجودة والحوكمة ولجنة MRB
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-QA-MRB-GOVERNANCE',
    code: 'QAG-07',
    number: 7,
    nameAr: 'إدارة توكيد الجودة والحوكمة ولجنة المواد المعزولة MRB',
    nameEn: 'Quality Assurance, MRB Governance & Continual Improvement',
    shortNameAr: 'توكيد الجودة و MRB',
    shortNameEn: 'QA, MRB & CAPA Governance',
    headOfDeptAr: 'د. سارة المنشاوي',
    headOfDeptEn: 'Dr. Sarah El-Menshawy',
    headTitleAr: 'مدير عام توكيد الجودة والحوكمة المؤسسية',
    headTitleEn: 'Global QA & Governance Director',
    colorName: 'rose',
    accentHex: '#f43f5e',
    borderClass: 'border-rose-500/40',
    bgGradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    iconName: 'gauge',
    zone: 'lab',
    physicalLocationAr: 'قاعة لجنة مراجعة المواد MRB ومكتب استراتيجية الجودة Hub C',
    physicalLocationEn: 'Hub C Material Review Board (MRB) Command Chamber',
    upstreamDeptId: 'DEPT-METROLOGY-LAB',
    downstreamDeptId: 'DEPT-FINAL-OQC-PACKAGING',
    inputDescriptionAr: 'تقارير عدم المطابقة المرفوعة، حالات الحيود، ونتائج التدقيق الداخلي',
    inputDescriptionEn: 'Escalated process NCRs, deviation requests & internal audit non-conformances',
    outputDescriptionAr: 'قرارات لجنة MRB (إصلاح / خردة / استخدام كما هو)، مشاريع 8D، وإجراءات CAPA',
    outputDescriptionEn: 'MRB Dispositions (Scrap/Rework/UAI), closed 8D actions & verified CAPAs',
    stationIds: ['ROOM-MRB-CAPA'],
    linkedModules: [
      { id: 'mrb-ncr', labelAr: 'إدارة حالات عدم المطابقة ولجنة MRB', labelEn: 'NCR & Material Review Board', path: '/quality/records/ncr', icon: 'AlertTriangle', badgeCountKey: 'ncr' },
      { id: 'capa-hub', labelAr: 'الإجراءات التصحيحية والوقائية (CAPA)', labelEn: 'CAPA Closed-Loop Actions', path: '/capa', icon: 'CheckSquare', badgeCountKey: 'capa' },
      { id: 'eight-d', labelAr: 'منهجية حل المشكلات بفرق العمل (8D)', labelEn: '8D Root Cause Problem Solving', path: '/8d', icon: 'HelpCircle' },
      { id: 'deviations', labelAr: 'إدارة تصاريح الحيود الهندسي', labelEn: 'Engineering Deviations', path: '/deviation', icon: 'GitFork' },
      { id: 'change-control', labelAr: 'إدارة وتوثيق التغيير الهندسي (ECN)', labelEn: 'Engineering Change Control', path: '/change-control', icon: 'Workflow' },
      { id: 'layered-audits', labelAr: 'التدقيق الطبقي الدوري (LPA Audits)', labelEn: 'Layered Process Audits (LPA)', path: '/quality-audits', icon: 'ClipboardList', badgeCountKey: 'audit' },
    ],
    primaryKpiAr: 'نسبة إغلاق الإجراءات التصحيحية CAPA في موعدها',
    primaryKpiEn: 'On-Time CAPA Closure Rate',
    targetKpiValue: '≥ 96.5%',
    slaHours: 24
  },

  // --------------------------------------------------------------------------
  // 8. إدارة الفحص النهائي وضمان الجودة الصادرة
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-FINAL-OQC-PACKAGING',
    code: 'OQC-08',
    number: 8,
    nameAr: 'إدارة الفحص النهائي والتعبئة وضمان الجودة الصادرة (OQC)',
    nameEn: 'Outgoing Quality Control & Final Packaging Assurance (OQC)',
    shortNameAr: 'الفحص النهائي والتعبئة',
    shortNameEn: 'Final OQC & Packaging',
    headOfDeptAr: 'م. هيثم عبد السلام',
    headOfDeptEn: 'Eng. Haitham Abdelsalam',
    headTitleAr: 'رئيس قسم الفحص النهائي وضمان المنتج التام',
    headTitleEn: 'Final Release & Outgoing QA Manager',
    colorName: 'emerald',
    accentHex: '#059669',
    borderClass: 'border-emerald-600/40',
    bgGradient: 'from-emerald-600/20 via-teal-600/10 to-transparent',
    iconName: 'package',
    zone: 'oqc',
    physicalLocationAr: 'عنبر الفحص النهائي وإفراج الجودة ومحطة التعبئة Bay D',
    physicalLocationEn: 'Bay D Final OQC Inspection & Pallet Boxing Cells',
    upstreamDeptId: 'DEPT-QA-MRB-GOVERNANCE',
    downstreamDeptId: 'DEPT-SHIPPING-LOGISTICS',
    inputDescriptionAr: 'المنتجات تامة الصنع المنقولة عبر جسر النقل العلوي من صالة الإنتاج',
    inputDescriptionEn: 'Fully finished valves & parts via Overhead Plant Bridge Conveyor',
    outputDescriptionAr: 'باليتات معتمدة ومختومة بباركود الإفراج النهائي وشهادة الجودة COC',
    outputDescriptionEn: 'Certified wrapped pallets with final Certificate of Conformance (COC)',
    stationIds: ['BENCH-OQC-RELEASE', 'STATION-PACKAGING'],
    linkedModules: [
      { id: 'outgoing-qa', labelAr: 'فحص عينات القبول النهائي (AQL / OQC)', labelEn: 'Final Outgoing QA & AQL Sampling', path: '/outgoing-quality', icon: 'CheckSquare', badgeCountKey: 'inspection' },
      { id: 'release-board', labelAr: 'شهادات الإفراج النهائي للمنتجات', labelEn: 'Final Product Release Certificates', path: '/compliance/hub/inspection', icon: 'FileText' },
      { id: 'defect-cost', labelAr: 'متابعة تكلفة الجودة الرديئة (COPQ)', labelEn: 'Cost of Poor Quality (COPQ)', path: '/defect-cost', icon: 'BarChart3' },
    ],
    primaryKpiAr: 'نسبة الإفراج من أول مرة (First Pass Yield - FPY)',
    primaryKpiEn: 'First Pass Yield (FPY)',
    targetKpiValue: '≥ 99.4%',
    slaHours: 2
  },

  // --------------------------------------------------------------------------
  // 9. إدارة اللوجستيات والشحن والتوزيع
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-SHIPPING-LOGISTICS',
    code: 'LOG-09',
    number: 9,
    nameAr: 'إدارة اللوجستيات والشحن والتوزيع وأسطول النقل',
    nameEn: 'Shipping, Fleet Logistics & Dispatch Operations',
    shortNameAr: 'الشحن والتوزيع',
    shortNameEn: 'Shipping & Logistics',
    headOfDeptAr: 'أ. علاء الزيات',
    headOfDeptEn: 'Alaa El-Zayat',
    headTitleAr: 'مدير عمليات اللوجستيات والشحن والتصدير',
    headTitleEn: 'Outbound Logistics & Dispatch Director',
    colorName: 'sky',
    accentHex: '#0284c7',
    borderClass: 'border-sky-500/40',
    bgGradient: 'from-sky-500/20 via-blue-500/10 to-transparent',
    iconName: 'truck',
    zone: 'shipping',
    physicalLocationAr: 'رصيف الشحن الشرقي Gate 03 وموازين الباليتات ورامب الشاحنات',
    physicalLocationEn: 'East Freight Dock Gate 03 & Hydraulic Loading Ramps',
    upstreamDeptId: 'DEPT-FINAL-OQC-PACKAGING',
    downstreamDeptId: 'DEPT-CUSTOMER-EXPERIENCE',
    inputDescriptionAr: 'الباليتات المفحوصة والمجتازة للفحص النهائي مع أوامر الشحن المعتمدة',
    inputDescriptionEn: 'Quality-cleared pallets from Bay D with approved sales delivery orders',
    outputDescriptionAr: 'شاحنات محملة وموزونة في طريقها للعملاء والموزعين مع وثائق التتبع',
    outputDescriptionEn: 'Dispatched delivery trucks en route to clients with live tracking bills',
    stationIds: ['DOCK-SHIPPING-03', 'TRUCK-CUSTOMER-DELIVERY'],
    linkedModules: [
      { id: 'dispatch-logistics', labelAr: 'سجل شاحنات الشحن وتتبع الحمولة', labelEn: 'Live Freight Dispatch & Staging', path: '/outgoing-quality', icon: 'Truck' },
      { id: 'search-trace', labelAr: 'تتبع باركود الباليتات والشاحنات', labelEn: 'Pallet & Consignment Search', path: '/quality-search', icon: 'Search' },
    ],
    primaryKpiAr: 'التسليم الكامل في الوقت المحدد (OTIF)',
    primaryKpiEn: 'On-Time In-Full Delivery (OTIF)',
    targetKpiValue: '≥ 98.2%',
    slaHours: 3
  },

  // --------------------------------------------------------------------------
  // 10. إدارة خدمة العملاء وضمان الجودة الخارجية (Field Quality & RMA)
  // --------------------------------------------------------------------------
  {
    id: 'DEPT-CUSTOMER-EXPERIENCE',
    code: 'CSQ-10',
    number: 10,
    nameAr: 'إدارة خدمة العملاء والجودة الخارجية ومرتجعات RMA',
    nameEn: 'Customer Experience, Field Quality & RMA Returns',
    shortNameAr: 'خدمة العملاء والجودة الخارجية',
    shortNameEn: 'Customer Care & RMA',
    headOfDeptAr: 'أ. ريم الشاذلي',
    headOfDeptEn: 'Reem El-Shazly',
    headTitleAr: 'رئيس قسم علاقات العملاء وضمان الجودة الميدانية',
    headTitleEn: 'Customer Complaints & Field QA Lead',
    colorName: 'indigo',
    accentHex: '#6366f1',
    borderClass: 'border-indigo-500/40',
    bgGradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
    iconName: 'user',
    zone: 'shipping',
    physicalLocationAr: 'مركز قيادة العمليات الرقمي وغرفة اتصالات ما بعد البيع',
    physicalLocationEn: 'Central Digital Quality Operations & Field Support Hub',
    upstreamDeptId: 'DEPT-SHIPPING-LOGISTICS',
    downstreamDeptId: 'DEPT-SUPPLY-CHAIN', // Completes the full circular loop!
    inputDescriptionAr: 'استفسارات وملاحظات العملاء، مطالبات الضمان، وبلاغات الحيود الميداني',
    inputDescriptionEn: 'Field warranty claims, customer complaints & client audit feedback',
    outputDescriptionAr: 'حلول فورية للعملاء، تصاريح مرتجعات RMA، وإغلاق الحلقة مع الهندسة والإنتاج',
    outputDescriptionEn: 'RMA return authorizations, warranty settlements & closed-loop FMEA updates',
    stationIds: ['TRUCK-CUSTOMER-DELIVERY'],
    linkedModules: [
      { id: 'complaints-board', labelAr: 'لوحة قيادة شكاوى ومطالبات العملاء', labelEn: 'Customer Complaints Dashboard', path: '/complaints-dashboard', icon: 'BarChart3', badgeCountKey: 'complaint' },
      { id: 'log-complaint', labelAr: 'تسجيل وبحث شكاوى العملاء (RMA)', labelEn: 'Customer Complaint & RMA Hub', path: '/complaints', icon: 'AlertTriangle', badgeCountKey: 'complaint' },
      { id: 'copq-external', labelAr: 'حساب تكلفة الجودة الرديئة الخارجية', labelEn: 'External Quality Loss (COPQ)', path: '/defect-cost', icon: 'Layers' },
      { id: 'capa-link', labelAr: 'ربط شكوى العميل بإجراء تصحيحي (CAPA)', labelEn: 'Link Complaint to 8D / CAPA', path: '/capa', icon: 'Workflow' },
    ],
    primaryKpiAr: 'معدل شكاوى العملاء بالمليون (Customer PPM)',
    primaryKpiEn: 'Customer Complaints Rate (PPM)',
    targetKpiValue: '< 45 PPM',
    slaHours: 8
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
