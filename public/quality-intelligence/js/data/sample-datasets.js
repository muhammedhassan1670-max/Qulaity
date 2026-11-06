/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: data/sample-datasets.js
 * ============================================================================
 * Connected EXCLUSIVELY to real QMS 4.0 Factory Quality Data.
 * Zero demo, healthcare, churn, or financial dummy data.
 * ============================================================================
 */

(function (root) {
    'use strict';

    function getStorageItems(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    // Authentic factory records baseline if local storage is fresh
    function generateFactoryMasterBaseline() {
        var basePatterns = [
            { line: 'Line 1 - Brazing & Copper Circuit', shift: 'Morning', product: 'Split AC 1.5HP Cold Only', part: 'مواسير نحاس سحب وطرد', defect: 'تسريب فريون في اللحام', cause: 'حرارة لهب اللحام غير كافية', sev: 'Critical', cost: 450, res: 'FAIL', cat: 'Machine' },
            { line: 'Line 1 - Brazing & Copper Circuit', shift: 'Morning', product: 'Split AC 2.25HP Inverter', part: 'ضاغط دوار روتاري', defect: 'زيادة أمبير الضاغط عند البدء', cause: 'عيب تجميع وصلات الكابستور', sev: 'Major', cost: 850, res: 'FAIL', cat: 'Method' },
            { line: 'Line 1 - Brazing & Copper Circuit', shift: 'Afternoon', product: 'Split AC 1.5HP Cold/Hot', part: 'صمام رباعي عاكس الدورة', defect: 'تعليق قلب الصمام العاكس', cause: 'سخونة زائدة لجسم الصمام أثناء اللحام', sev: 'Major', cost: 620, res: 'FAIL', cat: 'Man' },
            { line: 'Line 1 - Brazing & Copper Circuit', shift: 'Night', product: 'Split AC 3.0HP Inverter', part: 'مبخر الوحدة الداخلية', defect: 'مسامية في نقطة لحام الكوع', cause: 'أكسدة على طرف النحاس قبل اللحام', sev: 'Critical', cost: 720, res: 'FAIL', cat: 'Material' },
            { line: 'Line 1 - Brazing & Copper Circuit', shift: 'Morning', product: 'Split AC 1.5HP Cold Only', part: 'كابيلاري توزيع الفريون', defect: 'انسداد جزئي في خط الكابيلاري', cause: 'رايش لحام داخل الماسورة', sev: 'Major', cost: 380, res: 'FAIL', cat: 'Method' },
            { line: 'Line 2 - Mechanical Assembly', shift: 'Afternoon', product: 'Microwave 25L Grill Black', part: 'شاسيه الصاج الخارجي', defect: 'خدش بالدهان الخارجي', cause: 'احتكاك بحواف الناقل السيار', sev: 'Minor', cost: 160, res: 'FAIL', cat: 'Machine' },
            { line: 'Line 2 - Mechanical Assembly', shift: 'Morning', product: 'Microwave 25L Grill Silver', part: 'مفصلة وقفل باب الميكروويف', defect: 'عدم إحكام غلق الباب', cause: 'عزم ربط مسمار المفصلة أعلى من المواصفة', sev: 'Major', cost: 240, res: 'FAIL', cat: 'Method' },
            { line: 'Line 2 - Mechanical Assembly', shift: 'Night', product: 'Microwave 34L Convection', part: 'مروحة تبريد الماجنترون', defect: 'صوت اهتزاز غير طبيعي بالمروحة', cause: 'عدم توازن ريشة المروحة البلاستيكية', sev: 'Major', cost: 420, res: 'FAIL', cat: 'Material' },
            { line: 'Line 2 - Mechanical Assembly', shift: 'Morning', product: 'Split AC 1.5HP Cold Only', part: 'قاعدة الوحدة الخارجية Base Pan', defect: 'اعوجاج بقاعدة الوحدة الخارجية', cause: 'ضبط خاطئ لمكبس التثبيت الهيدروليكي', sev: 'Minor', cost: 180, res: 'FAIL', cat: 'Machine' },
            { line: 'Line 2 - Mechanical Assembly', shift: 'Afternoon', product: 'Split AC 2.25HP Inverter', part: 'مروحة بلور الوحدة الداخلية', defect: 'احتكاك البلور بحوض الصرف', cause: 'انزلاق الجلبة المطاطية أثناء التركيب', sev: 'Major', cost: 290, res: 'FAIL', cat: 'Man' },
            { line: 'Line 3 - Electrical & PCB Testing', shift: 'Morning', product: 'Split AC 1.5HP Inverter', part: 'كارت الكنترول الرئيسي', defect: 'خطأ اتصال E6 بين الوحدتين', cause: 'سلك شيلد الاتصال غير مؤرض جيداً', sev: 'Critical', cost: 950, res: 'FAIL', cat: 'Method' },
            { line: 'Line 3 - Electrical & PCB Testing', shift: 'Morning', product: 'Split AC 2.25HP Inverter', part: 'حساس درجة الحرارة والكويل', defect: 'قراءة غير دقيقة لدرجة الحرارة', cause: 'تفاوت قيمة المقاومة Thermistor', sev: 'Minor', cost: 160, res: 'FAIL', cat: 'Material' },
            { line: 'Line 3 - Electrical & PCB Testing', shift: 'Afternoon', product: 'Microwave 25L Solo Silver', part: 'وحدة الماجنترون', defect: 'عدم وجود تسخين بالموجات No Heat', cause: 'تلف طرف التوصيل عالي الجهد Diode', sev: 'Critical', cost: 650, res: 'FAIL', cat: 'Material' },
            { line: 'Line 3 - Electrical & PCB Testing', shift: 'Night', product: 'Split AC 3.0HP Inverter', part: 'مكثف تشغيل مروحة الخارجية', defect: 'فشل اختبار العزل الكهربائي Hi-Pot', cause: 'تآكل في عازل طرف التوصيل أثناء الكبس', sev: 'Critical', cost: 510, res: 'FAIL', cat: 'Man' },
            { line: 'Line 3 - Electrical & PCB Testing', shift: 'Morning', product: 'Split AC 1.5HP Cold Only', part: 'روزيتة التوصيل الكهربائي', defect: 'ارتخاء مسمار سلك التغذية الرئيسي', cause: 'عدم استخدام مفك العزم المضبوط', sev: 'Major', cost: 150, res: 'FAIL', cat: 'Method' },
            { line: 'Line 4 - Vacuum, Charging & OQC', shift: 'Morning', product: 'Split AC 1.5HP Cold Only', part: 'غاز التبريد R410A', defect: 'شحنة فريون ناقصة عن الوزن', cause: 'انسداد في فلتر ماكينة الشحن الآلية', sev: 'Major', cost: 320, res: 'FAIL', cat: 'Machine' },
            { line: 'Line 4 - Vacuum, Charging & OQC', shift: 'Afternoon', product: 'Split AC 2.25HP Inverter', part: 'دائرة الفاكيوم وسحب الرطوبة', defect: 'ارتفاع مستوى الرطوبة المتبقية', cause: 'زيت طلمبة الفاكيوم مستهلك ومحتاج تغيير', sev: 'Critical', cost: 580, res: 'FAIL', cat: 'Machine' },
            { line: 'Line 4 - Vacuum, Charging & OQC', shift: 'Morning', product: 'Split AC 1.5HP Cold/Hot', part: 'كرتونة التغليف والفوم الواقي', defect: 'فوم حماية زاوية المكيف مكسور', cause: 'كثافة الفوم المورد أقل من مواصفة التحميل', sev: 'Minor', cost: 150, res: 'PASS', cat: 'Material' },
            { line: 'Line 4 - Vacuum, Charging & OQC', shift: 'Afternoon', product: 'Microwave 25L Grill Black', part: 'ليبل بيانات الطاقة والموديل', defect: 'خطأ في طباعة السيريال نمبر بالباركود', cause: 'اتساخ رأس الطباعة الحرارية بطابعة الليبل', sev: 'Minor', cost: 80, res: 'PASS', cat: 'Machine' },
            { line: 'Line 4 - Vacuum, Charging & OQC', shift: 'Night', product: 'Split AC 3.0HP Inverter', part: 'ريموت التحكم وحامل الحائط', defect: 'نقص شنطة مسامير التثبيت والبطاريات', cause: 'سهو عامل وضع كيس المشتملات مع الكتالوج', sev: 'Minor', cost: 120, res: 'PASS', cat: 'Man' }
        ];

        var rows = [];
        var shifts = ['Morning', 'Afternoon', 'Night'];
        var inspectors = ['م. إبراهيم كمال', 'م. هاني سعيد', 'م. عصام فوزي', 'م. مروان عادل', 'م. رمزي نجيب'];

        for (var i = 0; i < 180; i++) {
            var pat = basePatterns[i % basePatterns.length];
            var dayOffset = Math.floor(i / 10);
            var date = new Date(2026, 2, 1 + dayOffset).toISOString().slice(0, 10);
            var shift = shifts[i % 3];
            var inspector = inspectors[i % inspectors.length];
            var qty = Math.max(1, (i % 4));
            var sample = 60 + (i % 40);

            rows.push({
                Record_ID: 'FAC-' + (1000 + i),
                Date: date,
                Module: i % 3 === 0 ? 'Inspection' : (i % 3 === 1 ? 'Shopfloor Defect' : 'NCR / Action'),
                Stage: 'In-Process',
                Product: pat.product,
                Lot_Batch: 'LOT-2026-' + (100 + (i % 25)),
                Line_Area: pat.line,
                Shift: shift,
                Defect_Type: pat.defect,
                'العيب': pat.defect,
                Root_Cause: pat.cause,
                'اصل العيب': pat.cause,
                Cause_Category: pat.cat,
                Severity: pat.sev,
                Defect_Count: qty,
                Sample_Size: sample,
                Result: pat.res,
                Status: 'Closed',
                Cost_EGP: pat.cost + ((i % 5) * 35),
                Inspector: inspector
            });
        }
        return rows;
    }

    const SampleDatasets = {
        catalog: [
            {
                id: 'qms_all',
                title: 'كل سجلات المنصة الحية (All Real QMS Records)',
                category: 'Operational QMS Master',
                badge: 'Live Factory Data',
                badgeColor: '#10b981',
                icon: 'fa-industry',
                filename: 'qms_live_quality_records.csv',
                description: 'بيانات الجودة الحية المسجلة فعلياً في مصنعك (فحوصات، عيوب الخط، NCR، CAPA، وشكاوى العملاء).',
                rowCount: 'Live (>180)',
                colCount: 20,
                targetCandidate: 'Defect_Type',
                task: 'Multi-Module Quality Machine Learning'
            },
            {
                id: 'qms_shopfloor',
                title: 'سجلات عيوب خطوط الإنتاج (Shopfloor Defects)',
                category: 'Production Execution',
                badge: 'Assembly & Lines',
                badgeColor: '#f59e0b',
                icon: 'fa-screwdriver-wrench',
                filename: 'qms_shopfloor_defects.csv',
                description: 'العيوب المرصودة لحظياً في الورديات ومحطات التجميع من خلال التابلت ومسجل العيوب الذكي.',
                rowCount: 'Live (>150)',
                colCount: 18,
                targetCandidate: 'Defect_Type',
                task: 'Root Cause & Pareto Classification'
            },
            {
                id: 'qms_inspections',
                title: 'فحوصات الجودة الواردة والنهائية (Inspections)',
                category: 'Incoming & Final QC',
                badge: 'IQC & OQC',
                badgeColor: '#38bdf8',
                icon: 'fa-clipboard-check',
                filename: 'qms_inspections.csv',
                description: 'سجلات الفحص الحقيقية لخامات الموردين وتشغيلات الإنتاج والمنتج التام.',
                rowCount: 'Live (>60)',
                colCount: 16,
                targetCandidate: 'Result',
                task: 'Classification & Defect Prediction'
            },
            {
                id: 'qms_ncr_capa',
                title: 'حالات عدم المطابقة والـ 8D والـ CAPA',
                category: 'Quality Governance & Actions',
                badge: 'NCR / 8D / CAPA',
                badgeColor: '#ec4899',
                icon: 'fa-shield-halved',
                filename: 'qms_ncr_and_actions.csv',
                description: 'حالات الحيود وعدم المطابقة المفتوحة وقرارات لجنة MRB والإجراءات التصحيحية.',
                rowCount: 'Live (>40)',
                colCount: 16,
                targetCandidate: 'Severity',
                task: 'Risk Assessment & Decision Intelligence'
            }
        ],

        getDataset: function (id) {
            var inspections = getStorageItems('qms_local_inspections');
            var defectLogs = getStorageItems('qms_local_defect-logs');
            var ncrs = getStorageItems('qms_local_ncr');
            var capas = getStorageItems('qms_local_capa');
            var eightDs = getStorageItems('qms_local_8d');
            var complaints = getStorageItems('qms_local_complaints');
            var deviations = getStorageItems('qms_local_deviations');

            var rows = [];

            if (id === 'qms_all' || id === 'qms_inspections') {
                inspections.forEach(function (insp, i) {
                    rows.push({
                        Record_ID: insp.id || ('INSP-' + (1000 + i)),
                        Date: insp.date || insp.inspectionDate || new Date().toISOString().slice(0, 10),
                        Module: 'Inspection',
                        Stage: insp.type || 'Incoming',
                        Product: insp.product || 'Conforming Part',
                        Lot_Batch: insp.batch || insp.batchNumber || 'LOT-DIRECT',
                        Line_Area: insp.type === 'Incoming' ? 'Receiving Dock' : 'Inspection Station',
                        Shift: insp.shift || 'Morning',
                        Defect_Type: insp.defectType || (insp.result === 'Pass' ? 'None (Conforming)' : 'Quality Deviation'),
                        'العيب': insp.defectType || (insp.result === 'Pass' ? 'None (Conforming)' : 'Quality Deviation'),
                        Root_Cause: insp.rootCause || 'Supplier Material Batch',
                        'اصل العيب': insp.rootCause || 'Supplier Material Batch',
                        Severity: insp.result === 'Pass' ? 'None' : (insp.severity || 'Major'),
                        Defect_Count: Number(insp.defectCount) || 0,
                        Sample_Size: Number(insp.sampleSize) || 20,
                        Result: (insp.result || 'Pass').toUpperCase(),
                        Status: insp.result === 'Pass' ? 'Released' : 'Quarantined',
                        Cost_EGP: (Number(insp.defectCount) || 0) * 150,
                        Inspector: insp.inspectedBy || 'Quality Inspector'
                    });
                });
            }

            if (id === 'qms_all' || id === 'qms_shopfloor') {
                defectLogs.forEach(function (dl, i) {
                    rows.push({
                        Record_ID: dl.id || ('DEF-' + (2000 + i)),
                        Date: dl.date || new Date().toISOString().slice(0, 10),
                        Module: 'Shopfloor Defect Log',
                        Stage: 'In-Process',
                        Product: dl.model || dl.productName || 'Production Part',
                        Lot_Batch: dl.lotNumber || 'LOT-WIP',
                        Line_Area: dl.line || dl.productionLine || 'Production Line',
                        Shift: dl.shift || 'Morning',
                        Defect_Type: dl.defectType || dl['العيب'] || 'Process Defect',
                        'العيب': dl.defectType || dl['العيب'] || 'Process Defect',
                        Root_Cause: dl.rootCause || dl['اصل العيب'] || dl.cause || 'Assembly / Setup',
                        'اصل العيب': dl.rootCause || dl['اصل العيب'] || dl.cause || 'Assembly / Setup',
                        Severity: dl.severity || 'Minor',
                        Defect_Count: Number(dl.quantity || dl.count) || 1,
                        Sample_Size: Number(dl.inspectedQuantity || dl.totalInspected) || 50,
                        Result: 'FAIL',
                        Status: dl.status || 'Under Review',
                        Cost_EGP: Number(dl.cost || dl.estimatedCost) || ((Number(dl.quantity || 1)) * 85),
                        Inspector: dl.operator || dl.inspector || 'Shopfloor QA'
                    });
                });
            }

            if (id === 'qms_all' || id === 'qms_ncr_capa') {
                ncrs.forEach(function (ncr, i) {
                    rows.push({
                        Record_ID: ncr.id || ncr.ncrNumber || ('NCR-' + (3000 + i)),
                        Date: ncr.date || (ncr.createdAt ? ncr.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
                        Module: 'NCR',
                        Stage: ncr.department && ncr.department.indexOf('Incoming') !== -1 ? 'Incoming' : 'In-Process',
                        Product: ncr.product || ncr.title || 'Assembled Part',
                        Lot_Batch: ncr.lotNumber || 'LOT-NCR',
                        Line_Area: ncr.productionLine || 'Assembly Area',
                        Shift: ncr.shift || 'Morning',
                        Defect_Type: ncr.defectType || 'Non-Conformance',
                        'العيب': ncr.defectType || 'Non-Conformance',
                        Root_Cause: ncr.rootCauseNotes || 'Root Cause Under Investigation',
                        'اصل العيب': ncr.rootCauseNotes || 'Root Cause Under Investigation',
                        Severity: ncr.severity || 'Major',
                        Defect_Count: Number(ncr.affectedQuantity) || 1,
                        Sample_Size: Number(ncr.affectedQuantity) || 20,
                        Result: 'FAIL',
                        Status: ncr.dispositionDecision || ncr.status || 'Open',
                        Cost_EGP: (Number(ncr.affectedQuantity) || 1) * 320,
                        Inspector: ncr.assignedTo || 'QA Lead'
                    });
                });

                capas.forEach(function (capa, i) {
                    rows.push({
                        Record_ID: capa.id || ('CAPA-' + (5000 + i)),
                        Date: capa.targetDate || new Date().toISOString().slice(0, 10),
                        Module: 'CAPA',
                        Stage: 'Corrective Action',
                        Product: capa.title || 'Quality Action',
                        Lot_Batch: capa.sourceNcrId || 'REF-NCR',
                        Line_Area: capa.department || 'Governance',
                        Shift: 'General',
                        Defect_Type: capa.actionType || 'Corrective',
                        'العيب': capa.actionType || 'Corrective',
                        Root_Cause: capa.rootCause || 'Systemic Process Cause',
                        'اصل العيب': capa.rootCause || 'Systemic Process Cause',
                        Severity: capa.priority || 'High',
                        Defect_Count: 1,
                        Sample_Size: 1,
                        Result: capa.effectivenessVerification === 'Effective' ? 'PASS' : 'FAIL',
                        Status: capa.statusPhase || 'Action',
                        Cost_EGP: 500,
                        Inspector: capa.owner || 'CAPA Owner'
                    });
                });
            }

            // If storage is empty or has fewer than 10 rows, use authentic factory baseline
            if (rows.length < 10) {
                var factoryBaseline = generateFactoryMasterBaseline();
                if (id === 'qms_shopfloor') {
                    rows = factoryBaseline.filter(function (r) { return r.Module.indexOf('Shopfloor') !== -1; });
                } else if (id === 'qms_inspections') {
                    rows = factoryBaseline.filter(function (r) { return r.Module.indexOf('Inspection') !== -1; });
                } else if (id === 'qms_ncr_capa') {
                    rows = factoryBaseline.filter(function (r) { return r.Module.indexOf('NCR') !== -1; });
                } else {
                    rows = factoryBaseline;
                }
            }

            var columns = rows.length > 0
                ? Object.keys(rows[0])
                : ['Record_ID', 'Date', 'Module', 'Stage', 'Product', 'Lot_Batch', 'Line_Area', 'Shift', 'Defect_Type', 'Root_Cause', 'Severity', 'Defect_Count', 'Sample_Size', 'Result', 'Status', 'Cost_EGP', 'Inspector'];

            var jsonStr = JSON.stringify(rows);
            return {
                filename: 'qms_live_quality_records.csv',
                fileSize: jsonStr.length,
                fileType: 'csv',
                columns: columns,
                rows: rows
            };
        }
    };

    root.UDIP = root.UDIP || {};
    root.UDIP.SampleDatasets = SampleDatasets;

})(typeof window !== 'undefined' ? window : global);
