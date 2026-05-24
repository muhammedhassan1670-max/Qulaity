# Defect Prediction Handoff Prompt

استخدم هذا الملف كـ prompt كامل لأي أداة تطوير أخرى ستكمل أو تعدل موديل توقع العيوب داخل مشروع QMS / Quality 4.0.

## الدور المطلوب

أنت Senior React / Vite / TypeScript developer و Applied ML engineer تعمل على مشروع قائم بالفعل.

مطلوب منك الحفاظ على Defect Prediction كـ local explainable model مرتبط بمنصة QMS كلها، وليس صفحة demo منفصلة.

لا تبدأ من الصفر. لا تضف backend. لا تستخدم external APIs. لا تضف demo data. لا تكسر routes أو localStorage compatibility.

## السياق الحالي

المنصة تحتوي على:

- Main Dashboard
- Defect Recorder / Daily Defects
- Process PPM
- Defect Cost / COPQ
- Outgoing Quality
- SPC
- Intelligence Hub / Defect Prediction

الهدف الحالي:

1. تعلم من سجلات العيوب الفعلية المسجلة في Defect Recorder.
2. تعلم من ملفات Excel/CSV مستوردة، خصوصا ملف `data.xlsx`.
3. دعم أعمدة عربية وإنجليزية.
4. السماح باختيار target ديناميكي.
5. عدم إظهار ثقة وهمية.
6. شرح التوقع بلغة مفهومة لمهندس الجودة والإدارة.
7. توفير Visual Analytics وPresentation summary.

## المسار الأساسي

لا تغير هذه المسارات:

```tsx
{ path: 'ai', element: <Navigate to="/ai/defect-prediction" replace /> }
{ path: 'ai/defect-prediction', element: <LazyWrapper><AIIntelligence /></LazyWrapper> }
{ path: 'defect-prediction', element: <Navigate to="/ai/defect-prediction" replace /> }
```

المسار المستخدم:

```text
/ai/defect-prediction
```

في Sidebar يوجد عنصر واحد:

```text
Defect Prediction
```

داخل Intelligence Hub ويروح إلى:

```text
/ai/defect-prediction
```

لا تنشئ صفحة AI Intelligence مكررة بنفس المحتوى.

## الملفات الأساسية

ركز على:

```text
src/services/defectPredictionModel.ts
src/sections/AIIntelligence.tsx
src/services/defectAnalytics.ts
src/pages/quality/DailyDefects.tsx
src/router/index.tsx
src/components/Sidebar.tsx
src/utils/translations.ts
```

صفحات dashboard المرتبطة:

```text
src/sections/Dashboard.tsx
src/pages/quality/ProcessPPM.tsx
src/pages/quality/DefectCost.tsx
src/pages/quality/OutgoingQuality.tsx
src/sections/SPCSystem.tsx
```

## حالة الموديل الحالية

الموديل local lightweight explainable model.

لا يوجد backend ML.

لا يوجد external API.

لا توجد بيانات demo.

الموديل الحالي:

```ts
version: 3
```

مفتاح التخزين:

```ts
qms_defect_prediction_model_v1
```

مفتاح column overrides:

```ts
qms_defect_prediction_column_overrides_v1
```

حافظ على هذه المفاتيح.

`loadDefectPredictionModel()` يجب أن يقرأ model version 2 وversion 3 بدون crash، ويملأ الحقول الناقصة defaults آمنة.

## مصادر بيانات التدريب

الموديل يتعلم من مصدرين:

1. سجلات Defect Recorder:

```ts
loadDefectRecords()
loadDefectPredictionTrainingRows()
```

2. ملفات Excel/CSV مستوردة من UI:

```text
.xlsx
.xls
.csv
```

ملفات Excel المستوردة session-based داخل المتصفح. بعد refresh تختفي imported rows، لكن trained model وcolumn setup يظلان محفوظين في localStorage.

## ملف data.xlsx

الملف المستخدم فعليا:

```text
C:\Users\DELL\Desktop\Course\data.xlsx
```

المواصفات المعروفة:

```text
Sheet: Sheet1
Rows: around 1276
Columns: around 88
Language: Arabic + English
Domain: HVAC / AC manufacturing defects
```

أعمدة مهمة:

```text
اصل العيب
العيب
تصنيف العيب
نوع العيب
منطقة الاكتشاف
متسبب العيب
القسم
الوردية
الموديل
رقم الكود
part code
model type
type
الساعه
المنطقة
العملية
الجزء
المشرف الانتاج
مشرف الجودة
درجة حرارة الغرفة
فنى التوصيل
نظام الورادى
New Catageory
نوع الاكسبانشن
اعادة شحن الفريون
وصف المشكلة
السبب الجذري
الاجراء المتخذ
الاجراء التصحيحي
مسئول التنفيذ
ميعاد التنفيذ
الباركود
رقم العربة
Column22
Column23
Column24
Column25
```

الـ default/recommended target لهذا الملف:

```text
اصل العيب
```

لأنه يحتوي على مجموعات مستقرة مثل:

```text
عيب اداء
عيب مكون
تجميع خاطئ
تسريب وعيوب لحام
خطأ تداول
نقص مكون
```

Target `العيب` مدعوم، لكنه target تفصيلي عالي عدد الفئات، ويجب إظهار warning:

```text
This target has many detailed classes. Prediction may be unstable unless each class has enough examples. For management-level prediction, start with اصل العيب.
```

## Column Name Normalization

تم تنفيذ internal column-name normalization بدون تغيير أسماء الأعمدة المعروضة للمستخدم.

القواعد:

- trim leading/trailing spaces
- collapse duplicated spaces
- remove invisible characters
- normalize numerals where safe
- normalize safe Arabic/English aliases
- preserve original display label in UI

أمثلة alias:

```text
متسبب العيب  -> متسبب العيب
رقم الكود  -> رقم الكود
الموديل  -> الموديل
part code / Part Code / partcode -> part code
model type / Model Type -> model type
Defect Type / defect type -> Defect Type
```

لو عمودين اتطبعوا لنفس internal key:

- merge safely if one is mostly empty
- otherwise keep both and show warning:

```text
Duplicate normalized column detected
```

لا تفقد أي بيانات.

UI يجب أن يعرض:

- Display Name
- Internal Key if different
- normalized / alias warning
- duplicate warning if relevant

Existing overrides saved with old/untrimmed keys should map safely to normalized keys.

## Data Normalization

القيم يتم تطبيعها داخليا فقط، بدون تدمير العرض الأصلي:

- trim spaces
- remove duplicated spaces
- remove invisible characters
- Arabic numerals to English numerals
- common Arabic/English category normalization
- English casing normalization
- empty strings / "-" / "N/A" / "NA" / "null" -> empty

أمثلة:

```text
process / Process / PROCESS -> Process
material / Material -> Material
design / Design -> Design
Z series / z series -> Z Series
2025_Q4 / ٢٠٢٥_Q4 -> 2025_Q4
```

## Column Profiling

الموديل يعمل profiling للأعمدة:

- column name
- display label
- internal key
- detected type
- selected type
- detected role
- selected role
- fill rate
- null count
- distinct count
- sample values
- top values
- numeric stats
- date stats
- warnings
- reason

أنواع الأعمدة:

```ts
categorical
numeric
date
identifier
text
boolean
empty
```

الأدوار:

```ts
target
feature
ignored
```

## Leakage Detection

يجب استبعاد حقول ما بعد التحقيق من التدريب افتراضيا:

```text
وصف المشكلة
السبب الجذري
الاجراء المتخذ
الاجراء التصحيحي
مسئول التنفيذ
ميعاد التنفيذ
final decision fields
repair action
investigation result
action after defect discovery
```

السبب:

```text
Possible target leakage - this field may be known only after defect investigation.
```

لا تحذف هذه الأعمدة. فقط exclude by default، واترك manual override للمستخدم.

## Recommended Setup for data.xlsx

عند مطابقة هيكل `data.xlsx`، يظهر:

```text
Apply Recommended Setup
```

الإعداد المقترح:

Target:

```text
اصل العيب
```

Recommended features:

```text
الموديل
رقم الكود
part code
model type
type
القسم
الوردية
الساعه
المنطقة
العملية
الجزء
منطقة الاكتشاف
متسبب العيب
درجة حرارة الغرفة
فنى التوصيل
نظام الورادى
New Catageory
نوع الاكسبانشن
اعادة شحن الفريون
```

Recommended ignored:

```text
الباركود
رقم العربة
Column22
Column23
Column24
Column25
وصف المشكلة
السبب الجذري
الاجراء المتخذ
الاجراء التصحيحي
مسئول التنفيذ
ميعاد التنفيذ
```

لا تطبق الإعداد قسريا إلا لو target غير مختار. المستخدم يجب أن يستطيع override.

## Column Setup UI

في `AIIntelligence.tsx` توجد صفحة:

```text
Column Setup Before Training
```

مطلوب الحفاظ عليها.

تدعم:

- search/filter columns
- filters: All, Used Features, Ignored, Leakage Risk, Numeric, Date, Categorical, Text, Identifier, Low Fill Rate
- include as feature
- ignore
- set as target
- override detected type
- reset to Auto
- warning badges
- manual override badge

## Prediction Workspace Tabs

تم تنظيم صفحة Defect Prediction في tabs:

```text
Overview
Data & Columns
Training
Prediction
Visual Analytics
Back-Check
Presentation
```

لا تزيل هذه البنية.

## Excel Import UX

الاستيراد يدعم:

```text
.xlsx
.xls
.csv
```

تم إضافة staged progress:

```text
Reading file...
Parsing workbook...
Converting Sheet1 rows...
Normalizing columns and values...
Updating column profiles...
```

تم السماح للمتصفح يرسم loading state بين المراحل.

تم منع accidental duplicate import لنفس الملف:

```text
File already imported
Clear imports before importing the same file again to avoid duplicate training rows.
```

زر Clear Imports يمسح:

- importedRows
- importedFileInfo
- importedFileSignature
- prediction result
- selected scenario
- historical back-check session

بعد Clear Imports يمكن استيراد نفس الملف مرة أخرى.

ملاحظة UI:

```text
Imported Excel rows are kept in the current browser session only. The trained model and column setup remain saved after refresh.
```

قيد معروف:

`xlsx` parsing يتم داخل المتصفح، ومع ملفات ضخمة جدا قد يحدث pause قصير. تحسين مستقبلي مناسب: Web Worker.

## Training

`trainDefectPredictionModel()` يجب أن يحسب:

- totalRows
- eligibleRows
- excludedRows
- target classes
- target distribution
- top class percentage
- baseline accuracy
- validation accuracy when possible
- active features
- feature importance
- warnings
- data quality

Data quality:

```text
empty
learning
ready
```

قواعد warnings:

```text
eligibleRows < 30 -> Insufficient learning data
target class count > 30 -> high complexity target
average samples per class < 10 -> low average samples per target class
any class < 5 samples -> minority class warning
top class > 70% -> class imbalance warning
activeFeatures < 3 -> weak feature warning
```

## Feature Engineering

Categorical:

- group rare categories as `__rare__`
- unseen values as `__unknown__`
- avoid overfitting to one/two samples

Numeric:

- dynamic quantile buckets when enough data exists
- low/medium/high fallback
- outlier bucket where useful
- never treat every number as independent category

Date/time:

- month
- quarter
- weekday
- hour
- day period
- possible shift period

Long text:

- do not use raw long text by default
- ignore or use limited safe keywords only

## Prediction Reliability

كل prediction يجب أن يعرض reliability status:

```text
Reliable Decision Support
Moderate Decision Support
Weak Learning Signal
Insufficient Learning
```

العوامل:

- calibrated confidence
- eligible rows
- matched sample size
- known input fields
- unknown ratio
- class imbalance
- active features
- reliance on one strong feature
- target complexity

رسائل الاستخدام:

Reliable:

```text
Use this result to prioritize checks, while confirming with standard quality verification.
```

Moderate:

```text
Use this as a supporting signal. Verify the top contributors before taking action.
```

Weak:

```text
Use caution. The model found limited historical similarity.
```

Insufficient:

```text
Do not rely on this prediction yet. Add more records or select a more stable target.
```

## Confidence Calibration

لا تعرض ثقة عالية وهمية.

قلل confidence عند:

- eligibleRows low
- many unknown values
- many ignored fields
- low matched sample size
- class imbalance
- prediction relies on one feature
- target has too many classes
- rare feature values

اعرض:

- raw confidence
- calibrated confidence
- confidence explanation

إذا البيانات ضعيفة:

```text
Insufficient learning
```

## Prediction Result UI

النتيجة يجب أن تعرض:

- selected target name
- predicted label
- raw confidence
- calibrated confidence
- reliability status
- action permission message
- risk level
- top alternatives
- contributors
- unknown fields
- ignored fields
- leakage fields excluded
- management insight
- suggested quality action plan

Contributors table:

```text
Field
Input value
Historical association
Sample size
Effect
Strength
Reason
```

Alternatives:

```text
Label
Probability / confidence
Why it may also be possible
```

## Suggested Quality Action Plan

التوصيات تقسم إلى:

```text
Immediate Check
Process Verification
Preventive Action
Data Follow-up
```

قواعد عامة:

Leak / Welding:

- Verify leak test result.
- Check welding point condition.
- Confirm clamp/contact condition.
- Review welding parameter stability.
- Verify leak tester calibration.
- Track recurrence by model, part code, operator, and shift.

Material / Component:

- Verify part code and supplier batch.
- Inspect component condition.
- Review incoming inspection result.
- Check storage and handling condition.
- Escalate repeated part issues to supplier quality.

Assembly:

- Verify assembly sequence.
- Check station work instruction.
- Review jig and fixture condition.
- Confirm operator training status.
- Update visual standard or checklist.

Performance:

- Verify performance test readings.
- Check sensor/test equipment status.
- Review refrigerant charge, airflow, and electrical readings.
- Add focused audit on performance test parameters.

Handling:

- Inspect unit for handling damage.
- Review transport route and trolley condition.
- Improve handling separation and protection points.

## Historical Back-Check

يوجد section:

```text
Prediction Test Scenarios
```

بعد import/training يتم توليد 5-10 scenarios من بيانات تاريخية.

كل scenario يعرض:

- model / الموديل
- part code / رقم الكود
- process / العملية
- area / المنطقة أو منطقة الاكتشاف
- shift / الوردية
- Historical Actual

زر:

```text
Use Scenario
```

يملا prediction input ثم المستخدم يضغط Predict.

بعد prediction:

```text
Match
Top-3 Match
Different
```

مع ملاحظة:

```text
This is a historical back-check, not a future guarantee.
```

Back-Check Summary يعرض:

- total tested
- exact matches
- top-3 matches
- different
- average calibrated confidence

لا تسمه final accuracy.

## Visual Analytics

يوجد section:

```text
Visual Analytics
```

بدون charting library ثقيلة. يستخدم HTML/CSS bars.

الرسوم:

1. Target Distribution
2. Top Defect Pareto
3. Top Prediction Signals
4. Defect Drivers Breakdown
5. Prediction Reliability
6. Historical Back-Check
7. Missing Data by Column
8. Ignored Columns Breakdown
9. Column Type Distribution

الفلاتر:

```text
Source: All / Imported / Registered
Top N: 5 / 10 / 15
Breakdown Dimension:
  الموديل
  رقم الكود
  part code
  model type
  العملية
  الجزء
  القسم
  الوردية
  منطقة الاكتشاف
  متسبب العيب
```

Visual Management Insight يجب أن يلخص:

- largest target category
- top breakdown driver
- top Pareto labels
- top prediction signals
- imbalance/leakage notes

## Presentation Mode

يوجد Presentation tab للمديرين.

يعرض:

- Presentation summary
- Presentation Visual Summary
- Presenter Script
- Copy Presentation Summary
- Export Prediction Report
- Presentation Readiness Checklist

لا تعرض كل التفاصيل الفنية في Presentation view.

## Copy / Export

Copy Prediction Summary وCopy Presentation Summary وExport Prediction Report يجب أن تشمل:

- target
- predicted result if available
- reliability status
- calibrated confidence
- top contributors
- management insight
- visual summary
- safety note

لا تصدر raw dataset rows.

Export Model يجب أن يكون model summary:

- model version
- trainedAt
- targetField
- targetLabel
- totalRows
- eligibleRows
- labels
- activeFeatures
- featureLabels
- columnProfiles
- validation summary
- warnings
- feature importance
- column overrides if safe
- exportType = model-summary

## APIs يجب الحفاظ عليها

لا تحذف هذه الدوال:

```ts
emptyDefectPredictionSummary()
normalizePredictionRows(rows)
applyDefectPredictionTarget(rows, targetField)
summarizePredictionRows(rows, targetField)
loadDefectPredictionTrainingRows(importedRows?)
inferDefectPredictionColumnProfiles(rows, targetField, targetLabel, fieldHints)
getDefectPredictionFeatures(rows, preferredFeatures, excludedFeatures, fieldHints)
trainDefectPredictionModel(rows, preferredFeatures, targetField, targetLabel, fieldHints)
predictDefect(model, input)
saveDefectPredictionModel(model)
loadDefectPredictionModel()
clearDefectPredictionModel()
loadDefectPredictionColumnOverrides()
saveDefectPredictionColumnOverrides()
clearDefectPredictionColumnOverrides()
summarizeDefectPredictionColumnHygiene()
getDefectPredictionRecommendedPreset()
getDefectPredictionColumnDisplayLabels()
```

يمكن توسيع types والـ return values بشرط backward compatibility.

## قواعد اللغة والـ UX

استخدم wording آمن:

- likely
- historically associated
- suggested focus
- decision-support
- confidence adjusted
- requires engineering verification

تجنب:

- AI guarantees
- exact prediction
- automatic root cause
- confirmed defect
- guaranteed cause

## Acceptance Checklist

اختبر:

1. افتح `/ai/defect-prediction`.
2. تأكد tabs تظهر:
   Overview, Data & Columns, Training, Prediction, Visual Analytics, Back-Check, Presentation.
3. Import `data.xlsx`.
4. تأكد Sheet1 و1276 rows و88 columns.
5. تأكد Arabic columns تظهر صح.
6. تأكد import progress stages تظهر.
7. جرب import نفس الملف مرة ثانية بدون clear، يجب أن يتمنع.
8. اضغط Clear Imports ثم استورد نفس الملف مرة ثانية، يجب أن ينجح.
9. Apply Recommended Setup.
10. Target يصبح `اصل العيب`.
11. Leakage/barcode/system columns ignored.
12. Manual overrides تعمل.
13. Train Model.
14. Model Health يعرض version 3 وtarget وeligible rows وfeatures وwarnings.
15. Prediction inputs تظهر من dynamic config + learned columns.
16. Predict Defect يعمل.
17. النتيجة تعرض reliability وconfidence explanation وcontributors وalternatives وaction plan وmanagement insight.
18. Visual Analytics تعرض الرسوم والفلاتر.
19. Back-Check scenarios تعمل.
20. Presentation summary clean.
21. Copy/export لا يخرج raw rows.
22. Refresh: model/overrides persist، imported rows session-based.
23. لا توجد console errors مؤثرة.

## Validation Commands

بعد أي تعديل كود شغل:

```bash
npm run lint
npm run check:routes
npm run build
npm run verify
```

## قيود معروفة

- الموديل local lightweight وليس ML backend.
- لا توجد external APIs.
- imported Excel rows session-based.
- `xlsx` parsing داخل المتصفح وقد يسبب pause قصير في الملفات الكبيرة جدا.
- تحسين مستقبلي مناسب: Web Worker لقراءة Excel/profile خارج main thread.
- النتائج decision-support وليست حكم نهائي أو root cause مؤكد.

