# Defect Recorder Platform Linkage Prompt

استخدم هذا الملف كـ prompt كامل لأي أداة تطوير أخرى ستفهم أو تطور وظيفة تسجيل العيوب داخل منصة QMS / Quality 4.0، مع الحفاظ على ربطها بكل صفحات المنصة والداشبوردات وموديل التوقع.

## الدور المطلوب

أنت Senior React / Vite / TypeScript developer تعمل على مشروع QMS قائم بالفعل.

مطلوب منك فهم وتطوير Defect Recorder / Daily Defects بحيث يكون هو المصدر الرئيسي لتسجيل العيوب الفعلية، وكل تسجيل عيب يسمع في:

- Main Dashboard
- Defect Recorder Analytics
- Process PPM
- Defect Cost / COPQ
- Outgoing Quality
- SPC
- Defect Prediction
- NCR escalation
- Quality Intelligence / management summaries

لا تعيد بناء المشروع من الصفر. لا تضف بيانات demo أو fake. لا تكسر routes أو sidebar أو storage compatibility.

## السياق العام للمنصة

المنصة React + Vite + TypeScript QMS / Quality 4.0.

المستخدم يسجل العيب مرة واحدة من Defect Recorder، ثم يتم تصنيف التسجيل عن طريق field اسمه:

```ts
recordType
```

القيمة المختارة في `recordType` تحدد أين سيظهر أثر التسجيل تحليليا:

```text
process-ppm       -> Process PPM dashboard
defect-cost       -> Defect Cost / COPQ dashboard
outgoing-quality  -> Outgoing Quality dashboard
customer-return   -> Returns / external quality impact
```

التسجيل الواحد قد يحتوي على حقول مشتركة وحقول اختيارية، والصفحات المتخصصة تقرأ نفس مصدر البيانات وتفلتره حسب `recordType` أو حسب الحقول الدالة مثل `estimatedCost`, `outgoingResult`, `returnReference`.

## أهم الملفات الحالية

ابدأ دائما من هذه الملفات:

```text
src/pages/quality/DailyDefects.tsx
src/services/defectAnalytics.ts
src/api/unified-api.ts
src/stores/configStore.ts
src/components/DynamicFormRenderer.tsx
```

صفحات الاستهلاك والتحليل:

```text
src/sections/Dashboard.tsx
src/pages/quality/ProcessPPM.tsx
src/pages/quality/DefectCost.tsx
src/pages/quality/OutgoingQuality.tsx
src/sections/SPCSystem.tsx
src/sections/AIIntelligence.tsx
```

ملفات الربط:

```text
src/router/index.tsx
src/components/Sidebar.tsx
src/utils/translations.ts
```

## routes المهمة

صفحة تسجيل العيوب الأساسية:

```text
/defect-log
```

Aliases موجودة للحفاظ على الروابط القديمة:

```text
/quality/defect-log
/quality/defect-logs
/quality/defect-log/:id
/quality/defect-logs/:id
```

صفحات التحليل المرتبطة:

```text
/process-ppm
/defect-cost
/outgoing-quality
/spc
/ai/defect-prediction
/
```

لا تكسر هذه المسارات.

## Sidebar linkage

في `src/components/Sidebar.tsx` توجد روابط مهمة:

```ts
'quality-defect-log': '/defect-log'
'quality-defect-cost': '/defect-cost'
'quality-process-ppm': '/process-ppm'
'quality-outgoing': '/outgoing-quality'
'spc': '/spc'
'defect-prediction': '/ai/defect-prediction'
```

تسجيل العيوب موجود داخل مجموعة Analytics & Cost باسم `quality-defect-log`.

## مصدر البيانات الحالي

البيانات تحفظ وتقرأ عبر:

```ts
unifiedDefectLogApi
```

الموجود في:

```text
src/api/unified-api.ts
```

الـ API instance:

```ts
export const unifiedDefectLogApi = createModuleApi<DefectLogData, DefectLogQueryParams>('defect-logs');
```

عند وجود backend، يتم التعامل مع:

```text
/api/defect-logs
```

وعند فشل الـ API، يوجد fallback محلي في `localStorage` بنفس نمط:

```text
qms_local_defect-logs
```

لا تكسر هذا السلوك لأنه مهم للتشغيل المحلي/offline-first.

## شكل بيانات العيب الأساسي

النوع الحالي:

```ts
export interface DefectLogData extends BaseModuleData {
  date: string;
  shift: string;
  productionLine: string;
  partId: string;
  partNumber: string;
  recordType?: string;
  defectType: string;
  quantity: number;
  inspectedQuantity?: number;
  productionQuantity?: number;
  estimatedCost?: number;
  costCategory?: string;
  outgoingResult?: string;
  shipmentId?: string;
  customerName?: string;
  releaseTimeHrs?: number;
  returnReference?: string;
  severity: string;
  description: string;
  operatorName: string;
  actionTaken: string;
  relatedNcrId?: string;
}
```

## نموذج الإدخال الحالي

Form config موجود في:

```text
src/stores/configStore.ts
```

الـ form type:

```ts
type: 'defect-log'
```

الـ form version الحالي:

```ts
version: 3
```

أقسام النموذج:

```text
Production Information
Dashboard Routing
Defect Details
Immediate Actions
```

الحقول الأساسية:

```text
date
shift
productionLine
partId
partNumber
recordType
inspectedQuantity
estimatedCost
costCategory
outgoingResult
shipmentId
customerName
releaseTimeHrs
returnReference
defectType
quantity
severity
description
actionTaken
operatorName
status
```

لا تغير أسماء الحقول بدون migration واضح لأن الصفحات الأخرى تعتمد عليها.

## منطق الحفظ في DailyDefects

في:

```text
src/pages/quality/DailyDefects.tsx
```

الحفظ يتم من:

```ts
handleFormSubmit(data)
```

قبل الحفظ يتم تطبيع بعض القيم:

```ts
recordType: data.recordType || 'process-ppm'
quantity: Number(data.quantity || 0)
inspectedQuantity: Number(data.inspectedQuantity || 0)
estimatedCost: Number(data.estimatedCost || 0)
releaseTimeHrs: Number(data.releaseTimeHrs || 0)
status: data.status || 'logged'
```

ثم:

```ts
unifiedDefectLogApi.create(payload)
unifiedDefectLogApi.update(id, payload)
unifiedDefectLogApi.delete(id)
```

بعد الإنشاء يتم عمل `getAll()` لتحديث القائمة والعدادات.

## قاعدة الربط المركزية

كل الصفحات التحليلية تعتمد على:

```ts
loadDefectRecords()
analyzeDefectRecords(records, period)
```

الموجودين في:

```text
src/services/defectAnalytics.ts
```

الدالة:

```ts
getDefectRecordType(record)
```

تحدد نوع التسجيل كالتالي:

```ts
if recordType === 'defect-cost' or 'copq' => defect-cost
if recordType === 'outgoing-quality' or 'outgoing' => outgoing-quality
if recordType === 'customer-return' or returns/return => customer-return
if outgoingResult exists => outgoing-quality
if returnReference exists => customer-return
if estimatedCost > 0 or costCategory exists => defect-cost
otherwise => process-ppm
```

هذا مهم جدا: حتى لو المستخدم لم يختار `recordType` بدقة، وجود حقول معينة قد يوجه السجل للداشبورد الصحيح.

## كيف يسمع التسجيل في Main Dashboard

في:

```text
src/sections/Dashboard.tsx
```

الصفحة تعمل:

```ts
const records = await loadDefectRecords();
const data = analyzeDefectRecords(records);
```

ثم تعرض:

- `currentPpm`
- `totalCopq`
- `returns`
- `returnQty`
- `defectTrendData`
- `defectDistribution`
- `linePpm`

يعني أي عيب جديد يؤثر على Main Dashboard إذا دخل في الفترة الزمنية المستخدمة وكان عنده قيم مناسبة.

## كيف يسمع التسجيل في Process PPM

في:

```text
src/pages/quality/ProcessPPM.tsx
```

الصفحة تقرأ نفس records ثم تستخدم:

```ts
processRecords = records where getDefectRecordType(record) === 'process-ppm'
```

المؤشرات:

- Current PPM
- Target PPM
- Best Line
- Worst Line
- PPM Trend
- PPM by Line
- Top defects contributing to PPM

الحقول المؤثرة:

```text
recordType = process-ppm
quantity
inspectedQuantity / productionQuantity
productionLine
defectType
date
```

صيغة PPM:

```text
PPM = defect quantity / inspected quantity * 1,000,000
```

## كيف يسمع التسجيل في Defect Cost / COPQ

في:

```text
src/pages/quality/DefectCost.tsx
```

الصفحة تقرأ:

```ts
costRecords = records with cost > 0 or recordType defect-cost/customer-return
```

المؤشرات:

- Total COPQ
- Internal Failure
- External Failure
- Appraisal
- Prevention
- Monthly COPQ Trend
- COPQ Breakdown
- Top Cost Drivers

الحقول المؤثرة:

```text
recordType = defect-cost
estimatedCost
costCategory
defectType
date
```

لو `recordType = customer-return` يتم اعتباره external failure في تكلفة الجودة.

## كيف يسمع التسجيل في Outgoing Quality

في:

```text
src/pages/quality/OutgoingQuality.tsx
```

الصفحة تقرأ:

```ts
outgoingRecords = records where getDefectRecordType(record) === 'outgoing-quality'
```

المؤشرات:

- Outgoing Inspections
- Pass Rate
- Holds
- Escapes
- Average Release Time
- Release Trend
- Recent Outgoing Records

الحقول المؤثرة:

```text
recordType = outgoing-quality
outgoingResult = pass/fail/hold
shipmentId
customerName
releaseTimeHrs
quantity
date
```

## كيف يسمع التسجيل في Returns

Customer return ليس صفحة منفصلة حاليا، لكنه يدخل في:

- Main Dashboard returns / returnQty
- Defect Cost كـ external failure
- Outgoing escapes logic
- Defect Prediction كنوع route/type

الحقول المؤثرة:

```text
recordType = customer-return
returnReference
customerName
estimatedCost
quantity
defectType
date
```

## كيف يسمع التسجيل في SPC

في:

```text
src/sections/SPCSystem.tsx
```

SPC يقرأ:

```ts
loadDefectRecords()
analyzeDefectRecords()
```

ويتيح إنشاء control charts من defect records.

الحقول المهمة:

```text
date
quantity
inspectedQuantity
productionLine
defectType
recordType
```

إذا لم توجد سجلات مطابقة، تظهر empty state:

```text
Charts will populate from records entered in the defect recorder.
```

## كيف يسمع التسجيل في Defect Prediction

في:

```text
src/sections/AIIntelligence.tsx
src/services/defectPredictionModel.ts
```

موديل التوقع يتعلم من مصدرين:

1. سجلات Defect Recorder الفعلية عبر:

```ts
loadDefectPredictionTrainingRows()
loadDefectRecords()
```

2. ملفات Excel/CSV مستوردة من صفحة:

```text
/ai/defect-prediction
```

أي تسجيل جديد في Defect Recorder يمكن أن يدخل التدريب عند الضغط على Train Model أو عند إعادة تحميل سجلات التدريب.

الحقول المهمة للتوقع:

```text
recordType
productionLine
shift
partId
partNumber
severity
quantity
inspectedQuantity
estimatedCost
costCategory
outgoingResult
shipmentId
customerName
releaseTimeHrs
returnReference
defectType
```

الموديل يدعم target ديناميكي وليس فقط `defectType`.

## كيف يسمع التسجيل في NCR

من صفحة Daily Defects يمكن تحويل العيب إلى NCR:

```ts
handleElevateToNCR(defect)
```

يتم إنشاء NCR عبر:

```ts
unifiedNcrApi.create(ncrData)
```

ثم تحديث العيب:

```ts
unifiedDefectLogApi.update(defect.id, { relatedNcrId: newNcr.id })
```

وبالتالي يصبح العيب مرتبطا بسجل NCR ولا يظهر زر Elevate مرة أخرى لنفس العيب.

## قواعد مهمة عند التطوير

1. لا تضف demo data.
2. لا تجعل الداشبورد يعرض أرقاما افتراضية وهمية عند عدم وجود سجلات.
3. عند عدم وجود بيانات، استخدم empty states واضحة.
4. لا تكسر `DefectLogData` fields.
5. لا تغير route `/defect-log`.
6. لا تكسر aliases القديمة.
7. لا تكسر localStorage fallback في `createModuleApi`.
8. لا تستخدم investigation/action fields كمدخلات prediction افتراضية لأنها target leakage.
9. حافظ على `recordType` كآلية routing أساسية.
10. أي تعديل في الحقول يجب أن يراعي:
    - DynamicFormRenderer
    - configStore
    - export Excel
    - defectAnalytics
    - prediction model
    - dashboards

## متطلبات جودة الإدخال

يفضل جعل الحقول التالية mandatory أو واضحة للمستخدم:

```text
date
shift
productionLine
partId
recordType
defectType
quantity
```

لـ Process PPM:

```text
inspectedQuantity
```

لـ COPQ:

```text
estimatedCost
costCategory
```

لـ Outgoing:

```text
outgoingResult
shipmentId
releaseTimeHrs
```

لـ Customer Return:

```text
returnReference
customerName
estimatedCost
```

## المطلوب من أي تعديل قادم

لو ستطور Defect Recorder، افعل الآتي:

1. افهم `DailyDefects.tsx` و `configStore.ts` و `defectAnalytics.ts`.
2. تأكد أن الحفظ يتم مرة واحدة من النموذج.
3. تأكد أن الحقول الرقمية تتحول لأرقام.
4. تأكد أن `recordType` موجود وله default آمن `process-ppm`.
5. بعد الحفظ أو التعديل أو الحذف، حدث القائمة المحلية.
6. لا تعرض dashboard fake numbers.
7. اجعل كل صفحة تعتمد على `loadDefectRecords()` و `analyzeDefectRecords()`.
8. حافظ على export Excel من Defect Recorder.
9. حافظ على Elevate to NCR.
10. تأكد أن موديل Defect Prediction يقرأ السجلات الجديدة.

## Acceptance Checklist

اختبر الآتي بعد أي تعديل:

1. افتح `/defect-log`.
2. سجل عيب جديد `recordType = process-ppm`.
3. تأكد أنه يظهر في Records داخل Daily Defects.
4. افتح `/process-ppm` وتأكد أن PPM اتحدث.
5. سجل عيب `recordType = defect-cost` مع `estimatedCost`.
6. افتح `/defect-cost` وتأكد أن COPQ اتحدث.
7. سجل عيب `recordType = outgoing-quality` مع `outgoingResult`.
8. افتح `/outgoing-quality` وتأكد أن Outgoing KPIs اتحدثت.
9. سجل عيب `recordType = customer-return`.
10. تأكد أنه يؤثر على returns و external failure.
11. افتح `/` Main Dashboard وتأكد أن KPIs والرسوم تقرأ من السجلات.
12. افتح `/spc` وتأكد أن charts تقرأ من defect records.
13. افتح `/ai/defect-prediction` واعمل Train Model وتأكد أن registered rows موجودة.
14. جرّب Elevate to NCR من سجل عيب وتأكد أن `relatedNcrId` يتسجل.
15. اعمل refresh وتأكد عدم حدوث crash.

## Validation Commands

بعد أي تعديل كود، شغل:

```bash
npm run lint
npm run check:routes
npm run build
npm run verify
```

## الصياغة المطلوبة للمستخدم

استخدم لغة decision-support آمنة:

- "historically associated"
- "suggested focus"
- "requires verification"
- "quality signal"
- "prioritize checks"

وتجنب:

- "confirmed root cause"
- "guaranteed"
- "exact prediction"
- "automatic decision"

