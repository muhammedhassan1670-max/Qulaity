// QMS Enterprise 4.0 - Quality Library - Comprehensive Knowledge Base
import { useState } from 'react';
import { PageContainer, PageSection } from '../../components/PageHeader';
import { 
  BookOpen,
  Award,
  Wrench,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Library,
  Scale,
  FileCheck,
  TrendingUp,
  Bookmark,
  PlayCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface LibraryItem {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  category: string;
  tags: string[];
  link?: string;
  slideId?: string;
}

export const qualityDefinitions: LibraryItem[] = [
  {
    id: 'def-1',
    title: 'Quality',
    titleAr: 'الجودة',
    description: 'Degree to which a set of inherent characteristics fulfills requirements. Quality is conformance to specifications, fitness for use, and meeting customer expectations.',
    descriptionAr: 'درجة تحقيق الخصائص المتأصلة للمتطلبات. الجودة هي الامتثال للمواصفات والملاءمة للاستخدام وتلبية توقعات العملاء.',
    category: 'Basic Concepts',
    tags: ['fundamental', 'definition', 'basics']
  },
  {
    id: 'def-2',
    title: 'Quality Control',
    titleAr: 'مراقبة الجودة',
    description: 'Operational techniques and activities used to fulfill requirements for quality. Focuses on detecting defects and ensuring products meet specifications.',
    descriptionAr: 'التقنيات والأنشطة التشغيلية المستخدمة لتلبية متطلبات الجودة. تركز على اكتشاف العيوب وضمان مطابقة المنتجات للمواصفات.',
    category: 'Basic Concepts',
    tags: ['control', 'inspection', 'testing']
  },
  {
    id: 'def-3',
    title: 'Quality Assurance',
    titleAr: 'ضمان الجودة',
    description: 'All planned and systematic activities implemented within the quality system to provide adequate confidence that an entity will fulfill requirements for quality.',
    descriptionAr: 'جميع الأنشطة المخطط لها والمنهجية المنفذة ضمن نظام الجودة لتوفير الثقة الكافية في أن الكيان سيحقق متطلبات الجودة.',
    category: 'Basic Concepts',
    tags: ['assurance', 'system', 'process']
  },
  {
    id: 'def-4',
    title: 'Total Quality Management (TQM)',
    titleAr: 'إدارة الجودة الشاملة',
    description: 'A management approach centered on quality, based on the participation of all members of an organization, aiming at long-term success through customer satisfaction.',
    descriptionAr: 'نهج إداري يركز على الجودة ويعتمد على مشاركة جميع أعضاء المنظمة، ويهدف إلى النجاح على المدى الطويل من خلال إرضاء العملاء.',
    category: 'Management Concepts',
    tags: ['management', 'organization', 'culture']
  },
  {
    id: 'def-5',
    title: 'Continuous Improvement',
    titleAr: 'التحسين المستمر',
    description: 'Ongoing effort to improve products, services, or processes. Often associated with Kaizen methodology.',
    descriptionAr: 'الجهد المستمر لتحسين المنتجات أو الخدمات أو العمليات. مرتبط غالباً بمنهجية كايزن.',
    category: 'Management Concepts',
    tags: ['improvement', 'kaizen', 'optimization']
  },
  {
    id: 'def-6',
    title: 'Non-Conformance Report (NCR)',
    titleAr: 'تقرير عدم المطابقة',
    description: 'A document that records details of a deviation from specifications, standards, or requirements in a product, process, or service.',
    descriptionAr: 'وثيقة تسجل تفاصيل الانحراف عن المواصفات أو المعايير أو المتطلبات في المنتج أو العملية أو الخدمة.',
    category: 'Quality Documentation',
    tags: ['ncr', 'documentation', 'compliance']
  },
  {
    id: 'def-7',
    title: 'Corrective Action',
    titleAr: 'الإجراء التصحيحي',
    description: 'Action to eliminate the cause of a detected non-conformity or other undesirable situation.',
    descriptionAr: 'إجراء للقضاء على سبب عدم المطابقة المكتشف أو أي موقف غير مرغوب فيه.',
    category: 'Quality Documentation',
    tags: ['action', 'correction', 'problem-solving']
  },
  {
    id: 'def-8',
    title: 'Preventive Action',
    titleAr: 'الإجراء الوقائي',
    description: 'Action to eliminate the cause of a potential non-conformity or other undesirable potential situation.',
    descriptionAr: 'إجراء للقضاء على سبب عدم المطابقة المحتمل أو أي موقف غير مرغوب فيه محتمل.',
    category: 'Quality Documentation',
    tags: ['prevention', 'risk', 'proactive']
  },
  {
    id: 'def-9',
    title: 'Root Cause Analysis',
    titleAr: 'تحليل السبب الجذري',
    description: 'A collective term that describes a wide range of approaches, tools, and techniques used to uncover the primary causes of problems.',
    descriptionAr: 'مصطلح جامع يصف مجموعة واسعة من النهج والأدوات والتقنيات المستخدمة للكشف عن الأسباب الأساسية للمشاكل.',
    category: 'Problem Solving',
    tags: ['analysis', 'rca', 'problem-solving']
  },
  {
    id: 'def-10',
    title: 'Statistical Process Control',
    titleAr: 'التحكم الإحصائي في العمليات',
    description: 'Method of quality control which employs statistical methods to monitor and control a process to ensure it operates at its full potential.',
    descriptionAr: 'طريقة للتحكم في الجودة تستخدم الأساليب الإحصائية لمراقبة العملية والتحكم فيها لضمان تشغيلها بكامل إمكاناتها.',
    category: 'Statistical Tools',
    tags: ['spc', 'statistics', 'control-charts']
  },
  {
    id: 'def-11',
    title: 'PDCA Cycle',
    titleAr: 'دورة plan-do-check-act',
    description: 'An iterative four-step management method used for the control and continuous improvement of processes and products.',
    descriptionAr: 'طريقة إدارية رباعية الخطوات تستخدم للتحكم والتحسين المستمر للعمليات والمنتجات.',
    category: 'Management Concepts',
    tags: ['pdca', 'deming', 'improvement']
  },
  {
    id: 'def-12',
    title: 'Six Sigma',
    titleAr: 'ستة سيجما',
    description: 'A disciplined, data-driven approach and methodology for eliminating defects in any process.',
    descriptionAr: 'نهج منهجي قائم على البيانات ومنهجية للقضاء على العيوب في أي عملية.',
    category: 'Management Concepts',
    tags: ['six-sigma', 'dmaic', 'statistics']
  },
  {
    id: 'def-13',
    title: '5S Methodology',
    titleAr: 'منهجية 5S',
    description: 'Japanese workplace organization methodology: Sort, Set in Order, Shine, Standardize, and Sustain.',
    descriptionAr: 'منهجية تنظيم مكان العمل اليابانية: الفرز والترتيب والتنظيف والتوحيد والاستمرارية.',
    category: 'Lean Tools',
    tags: ['5s', 'lean', 'workplace']
  },
  {
    id: 'def-14',
    title: 'Poka-Yoke',
    titleAr: 'بوكا-يوكي',
    description: 'Japanese term meaning "mistake-proofing". A mechanism that helps an equipment operator avoid mistakes.',
    descriptionAr: 'مصطلح ياباني يعني "إثبات الخطأ". آلية تساعامل معدات تجنب الأخطاء.',
    category: 'Lean Tools',
    tags: ['error-proofing', 'lean', 'prevention']
  },
  {
    id: 'def-15',
    title: 'First Article Inspection',
    titleAr: 'فحص القطعة الأولى',
    description: 'Complete and independent inspection of the first production unit to verify conformance to all engineering and design specifications.',
    descriptionAr: 'فحص كامل ومستقل للوحدة الإنتاجية الأولى للتحقق من المطابقة لجميع مواصفات الهندسة والتصميم.',
    category: 'Inspection',
    tags: ['fai', 'inspection', 'production']
  }
];

export const qualityStandards: LibraryItem[] = [
  {
    id: 'std-1',
    title: 'ISO 9001:2015',
    titleAr: 'آيزو 9001:2015',
    description: 'International standard for quality management systems. Specifies requirements for organizations to demonstrate ability to consistently provide products and services that meet customer and regulatory requirements.',
    descriptionAr: 'المعيار الدولي لأنظمة إدارة الجودة. يحدد متطلبات المنظمات لإثبات القدرة على تقديم المنتجات والخدمات باستمرار التي تلبي متطلبات العملاء والتنظيمية.',
    category: 'ISO Standards',
    tags: ['iso', 'qms', 'certification'],
    link: 'https://www.iso.org/standard/62085.html',
    slideId: 'iso-shopfloor'
  },
  {
    id: 'std-2',
    title: 'ISO 14001:2015',
    titleAr: 'آيزو 14001:2015',
    description: 'International standard for environmental management systems. Provides framework for organizations to protect the environment and respond to changing environmental conditions.',
    descriptionAr: 'المعيار الدولي لأنظمة الإدارة البيئية. يوفر إطاراً للمنظمات لحماية البيئة والاستجابة للتغيرات البيئية.',
    category: 'ISO Standards',
    tags: ['iso', 'environmental', 'ems'],
    link: 'https://www.iso.org/standard/60857.html'
  },
  {
    id: 'std-3',
    title: 'ISO 45001:2018',
    titleAr: 'آيزو 45001:2018',
    description: 'International standard for occupational health and safety management systems. Helps organizations provide safe and healthy workplaces.',
    descriptionAr: 'المعيار الدولي لأنظمة إدارة الصحة والسلامة المهنية. يساعد المنظمات على توفير أماكن عمل آمنة وصحية.',
    category: 'ISO Standards',
    tags: ['iso', 'safety', 'health'],
    link: 'https://www.iso.org/standard/63787.html'
  },
  {
    id: 'std-4',
    title: 'ISO/IEC 17025:2017',
    titleAr: 'آيزو/آي إي سي 17025:2017',
    description: 'General requirements for the competence of testing and calibration laboratories.',
    descriptionAr: 'المتطلبات العامة لكفاءة مختبرات الاختبار والمعايرة.',
    category: 'ISO Standards',
    tags: ['iso', 'laboratory', 'testing'],
    link: 'https://www.iso.org/standard/66912.html'
  },
  {
    id: 'std-5',
    title: 'IATF 16949:2016',
    titleAr: 'آياتف 16949:2016',
    description: 'Quality management system requirements for automotive production and relevant service parts organizations.',
    descriptionAr: 'متطلبات نظام إدارة الجودة لمنظمات إنتاج السيارات وقطع الغيار ذات الصلة.',
    category: 'Industry Standards',
    tags: ['automotive', 'ts16949', 'iatf'],
    link: 'https://iatfglobaloversight.org/'
  },
  {
    id: 'std-6',
    title: 'AS9100D',
    titleAr: 'أس9100D',
    description: 'Quality management systems requirements for aviation, space, and defense organizations.',
    descriptionAr: 'متطلبات أنظمة إدارة الجودة لمنظمات الطيران والفضاء والدفاع.',
    category: 'Industry Standards',
    tags: ['aerospace', 'aviation', 'defense']
  },
  {
    id: 'std-7',
    title: 'ISO 13485:2016',
    titleAr: 'آيزو 13485:2016',
    description: 'Medical devices - Quality management systems - Requirements for regulatory purposes.',
    descriptionAr: 'الأجهزة الطبية - أنظمة إدارة الجودة - المتطلبات للأغراض التنظيمية.',
    category: 'Industry Standards',
    tags: ['medical', 'devices', 'healthcare'],
    link: 'https://www.iso.org/standard/59752.html'
  },
  {
    id: 'std-8',
    title: 'GMP (Good Manufacturing Practice)',
    titleAr: 'الممارسات الصيدلانية الجيدة',
    description: 'System ensuring products are consistently produced and controlled to quality standards appropriate for their intended use.',
    descriptionAr: 'نظام يضمن إنتاج المنتجات والتحكم فيها باستمرار وفقاً لمعايير الجودة المناسبة للاستخدام المقصود.',
    category: 'Regulatory Standards',
    tags: ['gmp', 'pharmaceutical', 'food']
  },
  {
    id: 'std-9',
    title: 'HACCP (Hazard Analysis Critical Control Points)',
    titleAr: 'تحليل المخاطر ونقاط التحكم الحرجة',
    description: 'Systematic preventive approach to food safety that addresses physical, chemical, and biological hazards.',
    descriptionAr: 'نهج وقائي منهجي لسلامة الأغذية يتناول المخاطر الفيزيائية والكيميائية والبيولوجية.',
    category: 'Regulatory Standards',
    tags: ['food-safety', 'haccp', 'prevention']
  },
  {
    id: 'std-10',
    title: 'FDA 21 CFR Part 820',
    titleAr: 'FDA 21 CFR الجزء 820',
    description: 'Quality System Regulation for medical devices sold in the United States.',
    descriptionAr: 'لائحة نظام الجودة للأجهزة الطبية المباعة في الولايات المتحدة.',
    category: 'Regulatory Standards',
    tags: ['fda', 'medical', 'regulation']
  }
];

export const qualityTools: LibraryItem[] = [
  {
    id: 'tool-1',
    title: '8D Problem Solving',
    titleAr: 'ثماني خطوات لحل المشاكل',
    description: 'Eight Disciplines methodology: D1-Team Formation, D2-Problem Description, D3-Containment, D4-Root Cause, D5-Corrective Action, D6-Implementation, D7-Prevention, D8-Congratulate Team.',
    descriptionAr: 'منهجية الثمانية أنظمة: تكوين الفريق، وصف المشكلة، الحصر، السبب الجذري، الإجراء التصحيحي، التنفيذ، الوقاية، تهنئة الفريق.',
    category: 'Problem Solving',
    tags: ['8d', 'problem-solving', 'automotive'],
    slideId: '8d-technician'
  },
  {
    id: 'tool-2',
    title: 'FMEA (Failure Mode and Effects Analysis)',
    titleAr: 'تحليل طرق وآثار الفشل',
    description: 'Systematic method for identifying potential failure modes in a system, product, or process and evaluating their effects.',
    descriptionAr: 'طريقة منهجية لتحديد طرق الفشل المحتملة في النظام أو المنتج أو العملية وتقييم آثارها.',
    category: 'Risk Analysis',
    tags: ['fmea', 'risk', 'prevention'],
    slideId: 'fmea-poka'
  },
  {
    id: 'tool-3',
    title: '5 Whys',
    titleAr: 'خمسة لماذا',
    description: 'Iterative interrogative technique used to explore the cause-and-effect relationships underlying a particular problem.',
    descriptionAr: 'تقنية استجواب تكرارية تستخدم لاستكشاف علاقات السبب والأثر الكامنة وراء مشكلة معينة.',
    category: 'Problem Solving',
    tags: ['root-cause', 'analysis', 'simple']
  },
  {
    id: 'tool-4',
    title: 'Fishbone Diagram (Ishikawa)',
    titleAr: 'مخطط عظم السمكة',
    description: 'Cause-and-effect diagram used to systematically list the different causes that can contribute to an effect.',
    descriptionAr: 'مخطط السبب والأثر المستخدم لسرد الأسباب المختلفة التي يمكن أن تساهم في تأثير بشكل منهجي.',
    category: 'Problem Solving',
    tags: ['ishikawa', 'cause-effect', 'diagram']
  },
  {
    id: 'tool-5',
    title: 'Control Charts',
    titleAr: 'خرائط التحكم',
    description: 'Graphical tool used to study how a process changes over time. Includes X-bar, R-chart, p-chart, c-chart.',
    descriptionAr: 'أداة بيانية تستخدم لدراسة كيفية تغير العملية مع مرور الوقت. تشمل X-bar و R-chart و p-chart و c-chart.',
    category: 'Statistical Tools',
    tags: ['spc', 'control-charts', 'monitoring'],
    slideId: 'spc-technicians'
  },
  {
    id: 'tool-6',
    title: 'Pareto Analysis',
    titleAr: 'تحليل باريتو',
    description: 'Statistical technique in decision-making for selecting a limited number of tasks that produce significant overall effect (80/20 rule).',
    descriptionAr: 'تقنية إحصائية في اتخاذ القرارات لاختيار عدد محدود من المهام التي تنتج تأثيراً عاماً كبيراً (قاعدة 80/20).',
    category: 'Statistical Tools',
    tags: ['pareto', '80-20', 'prioritization']
  },
  {
    id: 'tool-7',
    title: 'Histogram',
    titleAr: 'المدرج التكراري',
    description: 'Graphical representation of the distribution of numerical data showing frequency of occurrence.',
    descriptionAr: 'تمثيل بياني لتوزيع البيانات الرقمية يظهر تكرار الحدوث.',
    category: 'Statistical Tools',
    tags: ['statistics', 'distribution', 'visualization']
  },
  {
    id: 'tool-8',
    title: 'Scatter Diagram',
    titleAr: 'مخطط الانتشار',
    description: 'Graphical representation of the relationship between two variables to identify correlations.',
    descriptionAr: 'تمثيل بياني للعلاقة بين متغيرين لتحديد الارتباطات.',
    category: 'Statistical Tools',
    tags: ['correlation', 'statistics', 'relationship']
  },
  {
    id: 'tool-9',
    title: 'Flowchart',
    titleAr: 'مخطط الانسياب',
    description: 'Diagram that depicts a process, system, or computer algorithm showing steps as boxes and their order by connecting lines.',
    descriptionAr: 'مخطط يصور عملية أو نظام أو خوارزمية حاسوبية يظهر الخطوات كمربعات وترتيبها بواسطة خطوط توصيل.',
    category: 'Process Tools',
    tags: ['process', 'flow', 'visualization']
  },
  {
    id: 'tool-10',
    title: 'Check Sheet',
    titleAr: 'ورقة الفحص',
    description: 'Structured form for collecting and analyzing data. A generic tool that can be adapted for wide variety of purposes.',
    descriptionAr: 'نموذج منظم لجمع وتحليل البيانات. أداة عامة يمكن تكييفها لمجموعة متنوعة من الأغراض.',
    category: 'Data Collection',
    tags: ['data', 'collection', 'form']
  },
  {
    id: 'tool-11',
    title: 'APQP (Advanced Product Quality Planning)',
    titleAr: 'التخطيط المتقدم لجودة المنتج',
    description: 'Framework of procedures and techniques used to develop products in industry, particularly automotive.',
    descriptionAr: 'إطار من الإجراءات والتقنيات المستخدمة لتطوير المنتجات في الصناعة، وخاصة السيارات.',
    category: 'Product Development',
    tags: ['apqp', 'product-development', 'automotive']
  },
  {
    id: 'tool-12',
    title: 'PPAP (Production Part Approval Process)',
    titleAr: 'عملية الموافقة على قطع الإنتاج',
    description: 'Standardized process in automotive and manufacturing industries to ensure engineering design and product specifications are properly understood.',
    descriptionAr: 'عملية موحدة في صناعات السيارات والتصنيع لضمان فهم المواصفات الهندسية والمنتج بشكل صحيح.',
    category: 'Product Development',
    tags: ['ppap', 'approval', 'automotive']
  },
  {
    id: 'tool-13',
    title: 'MSA (Measurement System Analysis)',
    titleAr: 'تحليل نظام القياس',
    description: 'Experimental and mathematical method of determining the variation in measurement systems. Includes Gage R&R studies.',
    descriptionAr: 'طريقة تجريبية ورياضية لتحديد الاختلاف في أنظمة القياس. تشمل دراسات Gage R&R.',
    category: 'Measurement',
    tags: ['msa', 'measurement', 'gage-rr'],
    slideId: 'fundamentals'
  },
  {
    id: 'tool-14',
    title: 'SPC (Statistical Process Control)',
    titleAr: 'التحكم الإحصائي في العمليات',
    description: 'Method of quality control using statistical methods to monitor and control a process.',
    descriptionAr: 'طريقة للتحكم في الجودة تستخدم الأساليب الإحصائية لمراقبة العملية والتحكم فيها.',
    category: 'Statistical Tools',
    tags: ['spc', 'statistics', 'control'],
    slideId: 'spc-technicians'
  },
  {
    id: 'tool-15',
    title: 'DOE (Design of Experiments)',
    titleAr: 'تصميم التجارب',
    description: 'Systematic method to determine the relationship between factors affecting a process and the output of that process.',
    descriptionAr: 'طريقة منهجية لتحديد العلاقة بين العوامل المؤثرة في العملية ومخرجاتها.',
    category: 'Statistical Tools',
    tags: ['doe', 'experiments', 'optimization']
  }
];

export const qualityBooks: LibraryItem[] = [
  {
    id: 'book-1',
    title: 'The Toyota Way',
    titleAr: 'طريقة تويوتا',
    description: 'Jeffrey Liker\'s comprehensive guide to Toyota\'s management principles and continuous improvement philosophy.',
    descriptionAr: 'دليل شامل لجيفري ليكر لمبادئ إدارة تويوتا وفلسفة التحسين المستمر.',
    category: 'Lean Manufacturing',
    tags: ['lean', 'toyota', 'management'],
    link: 'https://www.amazon.com/Toyota-Way-Management-Principles-Manufacturer/dp/0071392319',
    slideId: 'lean-smka'
  },
  {
    id: 'book-2',
    title: 'Out of the Crisis',
    titleAr: 'خارج الأزمة',
    description: 'W. Edwards Deming\'s seminal work on quality management and the 14 Points for Management.',
    descriptionAr: 'العمل الريادي لدبليو إدواردز ديمنج في إدارة الجودة والنقاط الأربعة عشر للإدارة.',
    category: 'Quality Philosophy',
    tags: ['deming', 'philosophy', 'management'],
    link: 'https://www.amazon.com/Out-Crisis-W-Edwards-Deming/dp/0262541157'
  },
  {
    id: 'book-3',
    title: 'Quality Control Handbook',
    titleAr: 'كتيب مراقبة الجودة',
    description: 'J.M. Juran\'s comprehensive reference on quality control and management principles.',
    descriptionAr: 'مرجع شامل لجيه إم جوران في مراقبة الجودة ومبادئ الإدارة.',
    category: 'Quality Reference',
    tags: ['juran', 'reference', 'handbook']
  },
  {
    id: 'book-4',
    title: 'Introduction to Statistical Quality Control',
    titleAr: 'مقدمة في الضبط الإحصائي للجودة',
    description: 'Douglas Montgomery\'s definitive textbook on statistical methods in quality control.',
    descriptionAr: 'الكتاب المدرسي الحاسم لدوغلاس مونتغمري في الأساليب الإحصائية في مراقبة الجودة.',
    category: 'Statistical Reference',
    tags: ['statistics', 'textbook', 'spc'],
    link: 'https://www.amazon.com/Introduction-Statistical-Quality-Control-Montgomery/dp/1118146816'
  },
  {
    id: 'book-5',
    title: 'The Six Sigma Handbook',
    titleAr: 'كتيب ستة سيجما',
    description: 'Thomas Pyzdek\'s comprehensive guide to Six Sigma methodology and implementation.',
    descriptionAr: 'دليل شامل لثوماس بايزديك لمنهجية ستة سيجما والتنفيذ.',
    category: 'Six Sigma',
    tags: ['six-sigma', 'handbook', 'dmaic'],
    link: 'https://www.amazon.com/Six-Sigma-Handbook-Fourth-Edition/dp/1260121825'
  },
  {
    id: 'book-6',
    title: 'Lean Six Sigma for Dummies',
    titleAr: 'لين ستة سيجما للمبتدئين',
    description: 'Accessible introduction to Lean Six Sigma concepts and implementation.',
    descriptionAr: 'مقدمة سهلة لمفاهيم وتنفيذ لين ستة سيجما.',
    category: 'Six Sigma',
    tags: ['lean', 'six-sigma', 'beginner']
  },
  {
    id: 'book-7',
    title: 'The Goal',
    titleAr: 'الهدف',
    description: 'Eliyahu Goldratt\'s business novel introducing Theory of Constraints concepts.',
    descriptionAr: 'رواية تجارية لإلياهو غولدرات تقدم مفاهيم نظرية القيود.',
    category: 'Operations Management',
    tags: ['toc', 'goldratt', 'novel']
  },
  {
    id: 'book-8',
    title: 'Quality Is Free',
    titleAr: 'الجودة مجانية',
    description: 'Philip Crosby\'s influential work on the concept of zero defects and cost of quality.',
    descriptionAr: 'العمل المؤثر لفيليب كروسبي حول مفهوم العيوب الصفرية وتكلفة الجودة.',
    category: 'Quality Philosophy',
    tags: ['crosby', 'zero-defects', 'philosophy']
  },
  {
    id: 'book-9',
    title: 'Managing Quality',
    titleAr: 'إدارة الجودة',
    description: 'Barbara B. Flynn and colleagues\' comprehensive textbook on integrated quality management.',
    descriptionAr: 'الكتاب المدرسي الشامل لباربرا بي فلين والزملاء في إدارة الجودة المتكاملة.',
    category: 'Quality Management',
    tags: ['textbook', 'management', 'integrated']
  },
  {
    id: 'book-10',
    title: 'Root Cause Analysis Handbook',
    titleAr: 'كتيب تحليل السبب الجذري',
    description: 'Systematic approaches and tools for effective root cause analysis and problem solving.',
    descriptionAr: 'نهج منهجية وأدوات لتحليل السبب الجذري وحل المشاكل بفعالية.',
    category: 'Problem Solving',
    tags: ['rca', 'problem-solving', 'handbook']
  },
  {
    id: 'book-11',
    title: 'The Lean Toolbox',
    titleAr: 'صندوق أدوات لين',
    description: 'John Bicheno\'s practical guide to lean manufacturing tools and techniques.',
    descriptionAr: 'دليل عملي لجون بيشينو لأدوات وتقنيات التصنيع الرشيق.',
    category: 'Lean Manufacturing',
    tags: ['lean', 'tools', 'practical'],
    slideId: 'lean-smka'
  },
  {
    id: 'book-12',
    title: 'FMEA: From Theory to Execution',
    titleAr: 'FMEA: من النظرية إلى التنفيذ',
    description: 'Comprehensive guide to Failure Mode and Effects Analysis implementation.',
    descriptionAr: 'دليل شامل لتنفيذ تحليل طرق وآثار الفشل.',
    category: 'Risk Analysis',
    tags: ['fmea', 'risk', 'implementation'],
    slideId: 'fmea-poka'
  }
];

const sections = [
  { id: 'definitions', title: 'Definitions & Terminology', titleAr: 'التعريفات والمصطلحات', icon: BookOpen, items: qualityDefinitions },
  { id: 'standards', title: 'Quality Standards', titleAr: 'معايير الجودة', icon: Award, items: qualityStandards },
  { id: 'tools', title: 'Tools & Methodologies', titleAr: 'الأدوات والمنهجيات', icon: Wrench, items: qualityTools },
  { id: 'books', title: 'Books & Resources', titleAr: 'الكتب والموارد', icon: Library, items: qualityBooks }
];

export default function QualityLibrary() {
  const [activeSection, setActiveSection] = useState('definitions');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const toggleItem = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredItems = (items: LibraryItem[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query)) ||
      item.category.toLowerCase().includes(query)
    );
  };

  return (
    <PageContainer>
      <div className="page-enter min-h-[calc(100vh-80px)]">
        {/* Hero Header */}
        <div className="relative mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1a1a25] via-[#1e1e2d] to-[#1a1a25] border border-white/10 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00A3E0]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-[#00A3E0]/20 rounded-2xl">
                <Library className="w-8 h-8 text-[#00A3E0]" />
              </div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">
                Quality Library
                <span className="text-[#00A3E0] mr-2"> / </span>
                <span className="text-xl">مكتبة الجودة</span>
              </h1>
            </div>
            <p className="text-white/60 max-w-2xl text-lg">
              Comprehensive knowledge base for quality management professionals. 
              Definitions, standards, tools, and resources to support your quality journey.
            </p>
            <p className="text-white/40 text-sm mt-2" dir="rtl">
              قاعدة معرفية شاملة لمحترفي إدارة الجودة. تعريفات، معايير، أدوات، وموارد لدعم رحلتك في الجودة.
            </p>
          </div>
        </div>

        <PageSection>
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search library... / ابحث في المكتبة..."
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#00A3E0]/50 focus:bg-white/[0.07] transition-all"
              />
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {sections.map(section => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setExpandedItems([]);
                  }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                    isActive 
                      ? 'bg-[#00A3E0]/20 text-[#00A3E0] border border-[#00A3E0]/30' 
                      : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10 hover:text-white/80'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{section.title}</span>
                </button>
              );
            })}
          </div>

          {/* Content Grid */}
          {sections.map(section => {
            if (section.id !== activeSection) return null;
            const items = filteredItems(section.items);
            
            return (
              <div key={section.id} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <section.icon className="w-6 h-6 text-[#00A3E0]" />
                    {section.title}
                    <span className="text-white/40 text-sm font-normal">({items.length})</span>
                  </h2>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-16 text-white/40">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No results found / لم يتم العثور على نتائج</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {items.map(item => {
                      const isExpanded = expandedItems.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className="group bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.05] hover:border-white/20 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                                {item.link && (
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#00A3E0] hover:text-[#0066CC] transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                              {item.titleAr && (
                                <p className="text-white/50 text-sm" dir="rtl">{item.titleAr}</p>
                              )}
                            </div>
                            <span className="px-3 py-1 bg-[#00A3E0]/10 text-[#00A3E0] text-xs font-medium rounded-full">
                              {item.category}
                            </span>
                          </div>

                          <p className={`text-white/70 text-sm leading-relaxed mb-4 ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {item.description}
                          </p>

                          {item.descriptionAr && isExpanded && (
                            <p className="text-white/50 text-sm leading-relaxed mb-4" dir="rtl">
                              {item.descriptionAr}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1.5 flex-1">
                              {item.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-white/5 text-white/40 text-xs rounded-md"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {item.slideId && (
                                <button
                                  onClick={() => navigate(`/quality-slides?slide=${item.slideId}`)}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-[#00A3E0]/10 text-[#00A3E0] hover:bg-[#00A3E0]/20 border border-[#00A3E0]/30 rounded-lg transition-colors text-xs font-bold shrink-0 mx-2"
                                  title="Open learning module"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  <span className="hidden sm:inline">{item.titleAr ? 'شرح الأكاديمية' : 'Full Lesson'}</span>
                                </button>
                              )}
                              <button
                                onClick={() => toggleItem(item.id)}
                                className="p-1.5 text-white/40 hover:text-white/80 hover:bg-white/10 rounded-lg transition-all"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </PageSection>

        {/* Quick Reference Cards */}
        <PageSection className="mt-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-[#00A3E0]" />
            Quick Reference / مرجع سريع
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Scale, title: '7 Quality Tools', titleAr: '7 أدوات الجودة', desc: 'Basic QC Tools', color: 'bg-blue-500/10 text-blue-400' },
              { icon: FileCheck, title: 'ISO 9001:2015', titleAr: 'آيزو 9001:2015', desc: 'QMS Standard', color: 'bg-green-500/10 text-green-400' },
              { icon: FileCheck, title: '8D Method', titleAr: 'منهجية 8D', desc: 'Problem Solving', color: 'bg-purple-500/10 text-purple-400' },
              { icon: TrendingUp, title: 'PDCA Cycle', titleAr: 'دورة PDCA', desc: 'Continuous Improvement', color: 'bg-orange-500/10 text-orange-400' }
            ].map((ref, idx) => (
              <div
                key={idx}
                className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.05] transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${ref.color} flex items-center justify-center mb-4`}>
                  <ref.icon className="w-6 h-6" />
                </div>
                <h3 className="text-white font-bold mb-1">{ref.title}</h3>
                <p className="text-white/40 text-sm" dir="rtl">{ref.titleAr}</p>
                <p className="text-white/30 text-xs mt-2">{ref.desc}</p>
              </div>
            ))}
          </div>
        </PageSection>
      </div>
    </PageContainer>
  );
}
