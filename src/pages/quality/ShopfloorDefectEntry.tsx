// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Barcode,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileText,
  Gauge,
  ImagePlus,
  Loader2,
  Mic,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader } from '@/components/PageHeader';
import { QualityGuidedEmptyState } from '@/components/QualityGuidedEmptyState';
import { Button } from '@/components/ui/button';
import DynamicFormRenderer from '@/components/DynamicFormRenderer';
import { SmartVoiceDefectLogger, type ParsedDefectData } from '@/components/SmartVoiceDefectLogger';
import { AIVisionScanner, type AIVisionResult } from '@/components/AIVisionScanner';
import QualityKnowledgeSuggestions from '@/components/QualityKnowledgeSuggestions';
import { unifiedDefectLogApi, type DefectLogData } from '@/api/unified-api';
import useAuthStore from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import {
  buildDefectTemplateValues,
  evaluateDefectRecordIntelligence,
} from '@/services/defectRecorderEngine';
import { getDefectRecordType, type ExtendedDefectLog } from '@/services/defectAnalytics';
import {
  buildMasterDataSnapshot,
  findMasterRecord,
  loadQualityMasterTable,
} from '@/services/qualityMasterData';
import { evaluateAdvancedDefectRules } from '@/services/qualityRulesEngine';
import {
  buildLocalWorkflowUser,
  buildOwnerPatch,
  evaluateApprovalRequirement,
  hasDefectPermission,
  loadDefectWorkflowGovernanceSettings,
  loadLocalWorkflowRole,
  roleLabel,
  type LocalWorkflowUser,
  type QualityWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';
import { loadActiveQualityFormTemplate } from '@/services/qualityFormTemplates';
import { buildDefectFmeaRiskPreview, upsertFmeaFromDefectRisk } from '@/services/defectFmeaIntegration';
import {
  buildInspectionRunFromPlan,
  canExecuteInspection,
  evaluateNumericCheck,
  findMatchingActiveInspectionPlan,
  upsertQualityInspectionRun,
  type QualityInspectionCheckItem,
  type QualityInspectionCheckResult,
  type QualityInspectionRun,
} from '@/services/qualityInspectionPlans';

interface EvidenceAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: 'image' | 'document' | 'inspection-report' | 'barcode-image' | 'note';
  note?: string;
  dataUrl?: string;
  storedLocally: boolean;
  warning?: string;
  uploadedAt: string;
}

interface AuditEntry {
  id: string;
  action: string;
  timestamp: string;
  changedBy: string;
  role?: string;
  changedFields: string[];
  newValue?: Record<string, unknown>;
  previousStatus?: string;
  newStatus?: string;
  permissionResult?: 'allowed' | 'blocked';
}

const DEFECT_AUDIT_KEY = 'qms_defect_record_audit_trail_v1';
const EVIDENCE_SIZE_LIMIT = 700_000;
const RECENT_LIMIT = 8;

const CORE_FIELDS = new Set([
  'date', 'shift', 'productionLine', 'partId', 'partNumber', 'recordType', 'defectType',
  'quantity', 'inspectedQuantity', 'productionQuantity', 'estimatedCost', 'costCategory',
  'outgoingResult', 'shipmentId', 'customerName', 'releaseTimeHrs', 'returnReference',
  'severity', 'description', 'operatorName', 'actionTaken', 'model', 'supplierName',
  'unitCost', 'productFamily', 'factory', 'workshop', 'capacity', 'inspectionPlan',
  'defaultInspectionPoint', 'defectCategory', 'suggestedContainment', 'customerCode',
  'market', 'defaultReturnHandling', 'status',
  'relatedInspectionPlanId', 'relatedInspectionPlanVersion', 'relatedCheckItemId',
  'relatedInspectionRunId', 'inspectionResult',
]);

function userLabel(user: LocalWorkflowUser): string {
  return `${user.name} (${roleLabel(user.role)})`;
}

function appendGlobalAudit(recordId: string, entry: AuditEntry): void {
  try {
    const raw = localStorage.getItem(DEFECT_AUDIT_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const current = Array.isArray(parsed[recordId]) ? parsed[recordId] : [];
    parsed[recordId] = [...current, entry];
    localStorage.setItem(DEFECT_AUDIT_KEY, JSON.stringify(parsed));
  } catch {
    // Audit must never block shopfloor entry.
  }
}

function compactNumber(value: unknown): string {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0';
  return number.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function todaySeed(): Record<string, unknown> {
  return buildDefectTemplateValues('process-ppm', {
    date: new Date().toISOString().split('T')[0],
    recordType: 'process-ppm',
    quantity: 1,
    severity: 'minor',
    status: 'logged',
  });
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === '';
}

function fillIfEmpty(target: Record<string, unknown>, field: string, value: unknown): void {
  if (!isEmpty(value) && isEmpty(target[field])) target[field] = value;
}

function matchPartByBarcode(value: string): Record<string, unknown> | null {
  const query = value.trim().toLowerCase();
  if (!query) return null;
  return loadQualityMasterTable('parts').find((part) => {
    if (part.isActive === false) return false;
    return ['partId', 'partNumber', 'barcode', 'id'].some(
      (field) => String(part[field] || '').trim().toLowerCase() === query
    );
  }) || null;
}

function evidenceKind(file: File): EvidenceAttachment['kind'] {
  if (file.type.startsWith('image/')) return 'image';
  return 'document';
}

export default function ShopfloorDefectEntry() {
  const authUser = useAuthStore((state) => state.user);
  const { language } = useAppStore();
  const isAr = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [workflowRole] = useState<QualityWorkflowRole>(() => loadLocalWorkflowRole());
  const workflowSettings = useMemo(() => loadDefectWorkflowGovernanceSettings(), []);
  const workflowUser = useMemo(() => buildLocalWorkflowUser(authUser, workflowRole), [authUser, workflowRole]);
  const [defects, setDefects] = useState<DefectLogData[]>([]);
  const [formDraft, setFormDraft] = useState<Record<string, unknown>>(() => todaySeed());
  const [evidence, setEvidence] = useState<EvidenceAttachment[]>([]);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [wizardStep, setWizardStep] = useState(0);
  const [showAIVision, setShowAIVision] = useState(false);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastImpact, setLastImpact] = useState<string[]>([]);
  const [inspectionRun, setInspectionRun] = useState<QualityInspectionRun | null>(null);
  const [checkResults, setCheckResults] = useState<Record<string, QualityInspectionCheckResult>>({});
  const [preparedCheckId, setPreparedCheckId] = useState('');
  const [formKey, setFormKey] = useState(0);

  const activeTemplate = useMemo(() => loadActiveQualityFormTemplate({
    entityType: 'defect-log',
    recordType: String(formDraft.recordType || 'process-ppm'),
    line: String(formDraft.productionLine || ''),
    model: String(formDraft.model || ''),
    inspectionPoint: String(formDraft.defaultInspectionPoint || ''),
  }), [formDraft.recordType, formDraft.productionLine, formDraft.model, formDraft.defaultInspectionPoint]);

  const intelligence = useMemo(
    () => evaluateDefectRecordIntelligence(formDraft, defects as ExtendedDefectLog[]),
    [formDraft, defects],
  );
  const fmeaRiskPreview = useMemo(
    () => buildDefectFmeaRiskPreview(formDraft, defects as ExtendedDefectLog[]),
    [formDraft, defects],
  );

  const canCreate = hasDefectPermission(workflowUser, 'defect.create');
  const inspectionAccess = canExecuteInspection(workflowUser.role);

  const inspectionContext = useMemo(() => ({
    factory: String(formDraft.factory || ''),
    workshop: String(formDraft.workshop || ''),
    productionLine: String(formDraft.productionLine || ''),
    inspectionPoint: String(formDraft.defaultInspectionPoint || ''),
    product: String(formDraft.productFamily || ''),
    model: String(formDraft.model || ''),
    partNumber: String(formDraft.partNumber || formDraft.partId || ''),
    customer: String(formDraft.customerName || ''),
    supplier: String(formDraft.supplierName || ''),
  }), [
    formDraft.customerName,
    formDraft.defaultInspectionPoint,
    formDraft.factory,
    formDraft.model,
    formDraft.partId,
    formDraft.partNumber,
    formDraft.productFamily,
    formDraft.productionLine,
    formDraft.supplierName,
    formDraft.workshop,
  ]);

  const activeInspectionPlan = useMemo(
    () => findMatchingActiveInspectionPlan(inspectionContext),
    [inspectionContext],
  );

  const failedChecks = useMemo(() => Object.values(checkResults).filter((result) => result.result === 'fail'), [checkResults]);
  const currentPreparedCheck = useMemo(
    () => activeInspectionPlan?.checkItems.find((item) => item.id === preparedCheckId) || null,
    [activeInspectionPlan, preparedCheckId],
  );

  const quickDefects = useMemo(() => {
    const currentLine = String(formDraft.productionLine || '').toLowerCase();
    const currentModel = String(formDraft.model || '').toLowerCase();
    const counts = new Map<string, number>();

    defects.forEach((record) => {
      const defectType = String(record.defectType || '').trim();
      if (!defectType) return;
      const lineMatch = !currentLine || String(record.productionLine || '').toLowerCase() === currentLine;
      const modelMatch = !currentModel || String(record.model || '').toLowerCase() === currentModel;
      const weight = lineMatch && modelMatch ? 3 : lineMatch || modelMatch ? 2 : 1;
      counts.set(defectType, (counts.get(defectType) || 0) + weight);
    });

    loadQualityMasterTable('defects').forEach((record) => {
      const value = String(record.defectType || '').trim();
      if (value && record.isActive !== false) counts.set(value, Math.max(counts.get(value) || 0, 1));
    });

    if (activeTemplate) {
      activeTemplate.fields
        .find((field) => field.fieldKey === 'defectType')
        ?.options?.forEach((option) => counts.set(option.value, Math.max(counts.get(option.value) || 0, 1)));
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([label]) => label);
  }, [activeTemplate, defects, formDraft.model, formDraft.productionLine]);

  const loadDefects = async () => {
    const response = await unifiedDefectLogApi.getAll();
    setDefects(response.data || []);
  };

  useEffect(() => {
    loadDefects().catch(() => setDefects([]));
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    setInspectionRun(null);
    setCheckResults({});
    setPreparedCheckId('');
  }, [activeInspectionPlan?.id, activeInspectionPlan?.version]);

  const updateDraft = (patch: Record<string, unknown>, refreshRenderer = false) => {
    setFormDraft((prev) => ({ ...prev, ...patch }));
    if (refreshRenderer) setFormKey((key) => key + 1);
  };

  const applyBarcodeLookup = (barcode: string) => {
    const clean = barcode.trim();
    if (!clean) {
      toast.warning('يرجى كتابة أو مسح كود القطعة');
      return;
    }
    const part = matchPartByBarcode(clean);
    const next: Record<string, unknown> = {
      ...formDraft,
      partId: clean,
      partNumber: clean,
    };
    if (part) {
      if (part.partNumber) next.partNumber = part.partNumber;
      if (part.partName) next.partName = part.partName;
      if (part.model) next.model = part.model;
      if (part.productionLine) next.productionLine = part.productionLine;
      if (part.defaultInspectionPoint) next.defaultInspectionPoint = part.defaultInspectionPoint;
      if (part.supplierName) next.supplierName = part.supplierName;
      if (part.unitCost) next.unitCost = part.unitCost;
      if (part.productFamily) next.productFamily = part.productFamily;

      toast.success('تم مطابقة القطعة وتعبئة البيانات بنجاح', {
        description: `${part.partNumber || clean} • ${part.partName || ''}`,
      });
    } else {
      toast.info('تم تسجيل كود القطعة', {
        description: `الكود "${clean}" غير مسجل في البيانات الرئيسية. يمكنك إكمال باقي الحقول يدوياً.`,
      });
    }
    updateDraft(next, true);
  };

  const setDefectType = (defectType: string) => {
    const defect = findMasterRecord('defects', 'defectType', defectType);
    const patch: Record<string, unknown> = { defectType };
    if (defect) {
      if (isEmpty(formDraft.defectCategory)) patch.defectCategory = defect.defectCategory;
      if (isEmpty(formDraft.severity)) patch.severity = defect.defaultSeverity;
      if (isEmpty(formDraft.suggestedContainment)) patch.suggestedContainment = defect.suggestedContainment;
      if (isEmpty(formDraft.costCategory)) patch.costCategory = defect.defaultCostCategory;
    }
    updateDraft(patch, true);
  };

  const handleEvidenceFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach((file) => {
      const base: EvidenceAttachment = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        kind: evidenceKind(file),
        storedLocally: false,
        uploadedAt: new Date().toISOString(),
      };
      if (file.size > EVIDENCE_SIZE_LIMIT) {
        setEvidence((prev) => [...prev, { ...base, warning: 'Large file stored as metadata only for safe local mode.' }]);
        toast.warning('Large evidence file', { description: `${file.name} was attached as metadata only.` });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setEvidence((prev) => [...prev, { ...base, dataUrl: String(reader.result || ''), storedLocally: true }]);
      reader.readAsDataURL(file);
    });
    if (event.target) event.target.value = '';
  };

  const addEvidenceNote = () => {
    if (!evidenceNote.trim()) return;
    setEvidence((prev) => [...prev, {
      id: `note-${Date.now()}`,
      name: 'Shopfloor note',
      type: 'text/plain',
      size: evidenceNote.length,
      kind: 'note',
      note: evidenceNote.trim(),
      storedLocally: true,
      uploadedAt: new Date().toISOString(),
    }]);
    setEvidenceNote('');
  };

  const resetForNew = () => {
    setFormDraft(todaySeed());
    setEvidence([]);
    setEvidenceNote('');
    setInspectionRun(null);
    setCheckResults({});
    setPreparedCheckId('');
    setFormKey((key) => key + 1);
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  };

  const duplicatePrevious = () => {
    const latest = defects[0];
    if (!latest) {
      toast.error('No recent entry to duplicate');
      return;
    }
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, relatedNcrId: _relatedNcrId, auditTrail: _auditTrail, ...copy } = latest as DefectLogData & Record<string, unknown>;
    setFormDraft({ ...copy, date: new Date().toISOString().split('T')[0], status: 'logged' });
    setEvidence([]);
    setFormKey((key) => key + 1);
    toast.success('Previous shopfloor record duplicated', { description: 'Review the values before saving as a new record.' });
  };

  const updateCheckResult = (item: QualityInspectionCheckItem, patch: Partial<QualityInspectionCheckResult>) => {
    if (!inspectionAccess.allowed) {
      toast.error('Inspection blocked', { description: inspectionAccess.reason });
      return;
    }
    setCheckResults((prev) => {
      const current = prev[item.id] || { checkItemId: item.id, result: 'na' as const };
      const next: QualityInspectionCheckResult = { ...current, ...patch, checkItemId: item.id };
      if (patch.measuredValue !== undefined) {
        const numericResult = evaluateNumericCheck(item, patch.measuredValue);
        if (numericResult) next.result = numericResult;
      }
      return { ...prev, [item.id]: next };
    });
  };

  const saveInspectionProgress = (complete = false) => {
    if (!activeInspectionPlan) {
      toast.error('No active inspection plan', { description: 'Select a matching model, line, part, or inspection point first.' });
      return null;
    }
    if (!inspectionAccess.allowed) {
      toast.error('Inspection blocked', { description: inspectionAccess.reason });
      return null;
    }
    const results = Object.values(checkResults);
    const requiredItems = activeInspectionPlan.checkItems.filter((item) => item.isRequired);
    const answeredRequired = requiredItems.filter((item) => {
      const result = checkResults[item.id];
      return result && result.result !== 'na';
    }).length;
    const missingRequiredEvidence = activeInspectionPlan.checkItems.some((item) => {
      if (!item.requiredEvidence && item.inputType !== 'photo-required') return false;
      const result = checkResults[item.id];
      return result?.result === 'fail' && evidence.length === 0 && !(result.evidence?.length);
    });
    if (complete && missingRequiredEvidence) {
      toast.error('Evidence required', { description: 'One or more failed checks require evidence before completing the inspection run.' });
      return null;
    }
    const baseRun = inspectionRun || buildInspectionRunFromPlan(activeInspectionPlan, inspectionContext, userLabel(workflowUser));
    const nextRun = upsertQualityInspectionRun({
      ...baseRun,
      ...inspectionContext,
      checkResults: results,
      status: complete && answeredRequired >= requiredItems.length ? 'completed' : results.length > 0 ? 'partially-completed' : 'in-progress',
      completedAt: complete && answeredRequired >= requiredItems.length ? new Date().toISOString() : baseRun.completedAt,
    });
    setInspectionRun(nextRun);
    toast.success(nextRun.status === 'completed' ? 'Inspection completed' : 'Inspection progress saved', {
      description: `${results.length} check result(s) stored locally for traceability.`,
    });
    return nextRun;
  };

  const prepareDefectFromCheck = (item: QualityInspectionCheckItem) => {
    if ((item.requiredEvidence || item.inputType === 'photo-required') && evidence.length === 0) {
      toast.error('Evidence required', { description: 'Capture photo, file, or note evidence before preparing a defect from this failed check.' });
      return;
    }
    const description = [
      `Failed inspection check: ${item.checkCode} - ${item.checkName}.`,
      item.standard ? `Standard: ${item.standard}.` : '',
      item.acceptanceCriteria ? `Acceptance criteria: ${item.acceptanceCriteria}.` : '',
      checkResults[item.id]?.measuredValue ? `Measured value: ${checkResults[item.id]?.measuredValue}${item.unit ? ` ${item.unit}` : ''}.` : '',
      checkResults[item.id]?.notes ? `Notes: ${checkResults[item.id]?.notes}.` : '',
    ].filter(Boolean).join(' ');
    updateCheckResult(item, { result: 'fail' });
    updateDraft({
      defectType: item.defectTypeIfNG || formDraft.defectType || item.checkName,
      severity: item.severityIfNG || formDraft.severity || 'major',
      recordType: item.recordTypeIfNG || formDraft.recordType || 'process-ppm',
      productionLine: formDraft.productionLine || activeInspectionPlan?.productionLine,
      model: formDraft.model || activeInspectionPlan?.model,
      partNumber: formDraft.partNumber || activeInspectionPlan?.partNumber,
      defaultInspectionPoint: formDraft.defaultInspectionPoint || activeInspectionPlan?.inspectionPoint,
      description,
      relatedInspectionPlanId: activeInspectionPlan?.id,
      relatedInspectionPlanVersion: activeInspectionPlan?.version,
      relatedCheckItemId: item.id,
      relatedInspectionRunId: inspectionRun?.id,
    }, true);
    setPreparedCheckId(item.id);
    toast.success('Defect prepared from failed check', {
      description: 'Review the defect fields and press Save. The system will not auto-save without your confirmation.',
    });
  };

  const saveRecord = async (submitAction: 'save' | 'draft' | 'save-new') => {
    if (!canCreate) {
      toast.error('Save blocked', { description: `${roleLabel(workflowUser.role)} cannot create defect records.` });
      return;
    }

    const cleanData = { ...formDraft };
    const rules = evaluateAdvancedDefectRules(cleanData, defects as ExtendedDefectLog[]);
    const missingFromRules = rules.requiredFields.filter((field) => isEmpty(cleanData[field]));
    const currentIntelligence = evaluateDefectRecordIntelligence(cleanData, defects as ExtendedDefectLog[]);
    if (submitAction !== 'draft' && (currentIntelligence.missingRequiredFields.length > 0 || missingFromRules.length > 0)) {
      toast.error('Missing required shopfloor fields', {
        description: [...currentIntelligence.missingRequiredFields, ...missingFromRules].join(', '),
      });
      return;
    }

    try {
      setSaving(true);
      const estimatedCost = Number(cleanData.estimatedCost || cleanData.totalCostPreview || 0);
      const snapshot = buildMasterDataSnapshot(cleanData);
      const approval = evaluateApprovalRequirement(cleanData, defects as ExtendedDefectLog[], workflowSettings);
      const ownerPatch = buildOwnerPatch({ ...cleanData, status: submitAction === 'draft' ? 'draft' : cleanData.status || 'logged' }, workflowSettings);
      let relatedRun = inspectionRun;
      if (preparedCheckId && activeInspectionPlan && !relatedRun) {
        relatedRun = upsertQualityInspectionRun({
          ...buildInspectionRunFromPlan(activeInspectionPlan, inspectionContext, userLabel(workflowUser)),
          checkResults: Object.values(checkResults),
        });
        setInspectionRun(relatedRun);
      }
      const basePayload = {
        ...cleanData,
        ...rules.calculatedValues,
        ...snapshot,
        ...ownerPatch,
      };
      const customFields = activeTemplate
        ? activeTemplate.fields.reduce((acc, field) => {
            if (!CORE_FIELDS.has(field.fieldKey) && cleanData[field.fieldKey] !== undefined) acc[field.fieldKey] = cleanData[field.fieldKey];
            return acc;
          }, {} as Record<string, unknown>)
        : undefined;
      const auditEntry: AuditEntry = {
        id: `audit-${Date.now()}`,
        action: 'shopfloor-create',
        timestamp: new Date().toISOString(),
        changedBy: userLabel(workflowUser),
        role: workflowUser.role,
        changedFields: Object.keys(basePayload),
        newValue: basePayload,
        newStatus: submitAction === 'draft' ? 'draft' : String(basePayload.status || 'logged'),
        permissionResult: 'allowed',
      };
      const payload = {
        ...basePayload,
        recordType: String(cleanData.recordType || getDefectRecordType(cleanData as unknown as ExtendedDefectLog)),
        quantity: Number(cleanData.quantity || 0),
        inspectedQuantity: Number(cleanData.inspectedQuantity || 0),
        productionQuantity: Number(cleanData.inspectedQuantity || cleanData.productionQuantity || 0),
        estimatedCost,
        releaseTimeHrs: Number(cleanData.releaseTimeHrs || 0),
        status: String(submitAction === 'draft' ? 'draft' : cleanData.status || 'logged'),
        evidence: evidence as unknown as Array<Record<string, unknown>>,
        auditTrail: [auditEntry],
        approvalRequired: rules.approvalRequired || approval.required,
        approvalReasons: [...new Set([...rules.approvalReasons, ...approval.reasons])],
        approvalRole: approval.requiredRole,
        approvalLevel: approval.label,
        reviewStatus: rules.approvalRequired || approval.required ? 'review-required' : 'not-required',
        assignedTo: workflowUser.id,
        assignedRole: String(basePayload.assignedRole || workflowUser.role),
        currentOwner: String(basePayload.currentOwner || workflowUser.role),
        nextRequiredRole: String(basePayload.nextRequiredRole || approval.requiredRole),
        workflowSettingsVersion: String(workflowSettings.version),
        formTemplateId: activeTemplate?.id,
        formTemplateVersion: activeTemplate?.version,
        relatedInspectionPlanId: activeInspectionPlan?.id || cleanData.relatedInspectionPlanId,
        relatedInspectionPlanVersion: activeInspectionPlan?.version || cleanData.relatedInspectionPlanVersion,
        relatedCheckItemId: preparedCheckId || cleanData.relatedCheckItemId,
        relatedInspectionRunId: relatedRun?.id || cleanData.relatedInspectionRunId,
        inspectionResult: preparedCheckId ? checkResults[preparedCheckId] : undefined,
        customFields,
      };

      const created = await unifiedDefectLogApi.create(payload as unknown as Omit<DefectLogData, 'id'>);
      if (preparedCheckId && activeInspectionPlan && relatedRun) {
        const updatedResults = Object.values({
          ...checkResults,
          [preparedCheckId]: {
            ...(checkResults[preparedCheckId] || { checkItemId: preparedCheckId, result: 'fail' as const }),
            createdDefectId: created.id,
          },
        });
        const updatedRun = upsertQualityInspectionRun({
          ...relatedRun,
          checkResults: updatedResults,
          createdDefectIds: [...new Set([...(relatedRun.createdDefectIds || []), created.id])],
        });
        setInspectionRun(updatedRun);
        setCheckResults(Object.fromEntries(updatedResults.map((result) => [result.checkItemId, result])));
      }
      appendGlobalAudit(created.id, auditEntry);
      const fmeaSync = upsertFmeaFromDefectRisk(created as DefectLogData, [created as DefectLogData, ...defects]);
      enqueueQualitySyncItem({
        entityType: 'defect-logs',
        entityId: created.id,
        operation: preparedCheckId ? 'create-defect-from-check' : evidence.length > 0 ? 'add-evidence' : 'create',
        payloadSummary: preparedCheckId
          ? `Defect created locally from failed inspection check ${preparedCheckId}.`
          : `Shopfloor defect entry created locally. Route: ${payload.recordType}. Evidence count: ${evidence.length}.`,
      });
      setLastImpact(fmeaSync.synced ? [...new Set([...currentIntelligence.affectedModules, 'FMEA / RPN'])] : currentIntelligence.affectedModules);
      await loadDefects();
      toast.success(submitAction === 'draft' ? 'Draft saved' : 'Shopfloor defect saved', {
        description: `${currentIntelligence.recordQuality} record. Updates: ${(fmeaSync.synced ? [...new Set([...currentIntelligence.affectedModules, 'FMEA / RPN'])] : currentIntelligence.affectedModules).join(', ')}.${fmeaSync.synced ? ` RPN ${fmeaSync.rpn}.` : ''}`,
      });
      if (submitAction === 'save-new') resetForNew();
      else setPreparedCheckId('');
    } catch (error) {
      toast.error('Failed to save shopfloor entry', {
        description: error instanceof Error ? error.message : 'Local save could not complete.',
      });
    } finally {
      setSaving(false);
    }
  };

  const recent = defects.slice(0, RECENT_LIMIT);

  return (
    <PageContainer>
      <PageHeader
        title="Shopfloor Entry"
        subtitle="Fast mobile defect capture for inspectors and operators using the active dynamic template"
      />

      <div className="mx-auto max-w-5xl space-y-5">
        {/* Template banner */}
        <div className="rounded-3xl border border-[#00A3E0]/20 bg-[#00A3E0]/10 px-3 py-4 sm:px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#00A3E0]/15 p-3">
                <Smartphone className="h-6 w-6 text-[#00A3E0]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-white truncate">{activeTemplate ? activeTemplate.name : 'Default Defect Recorder'}</p>
                <p className="text-xs text-white/45 truncate">{activeTemplate ? `Designer template v${activeTemplate.version}` : 'Fallback to current configStore form'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={formDraft.productionLine || formDraft.station ? `/quality-tower?station=${encodeURIComponent(String(formDraft.station || formDraft.productionLine))}` : '/quality-tower'}
                className="w-full sm:w-auto rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-center text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 flex items-center justify-center gap-1.5 transition-all"
                title="عرض وتحديد المحطة على خريطة المصنع الرقمية SCADA"
              >
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                <span>خريطة المصنع (SCADA Floorplan)</span>
              </Link>
              <Link to="/defect-log" className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center text-xs font-black uppercase tracking-widest text-white/70 hover:bg-white/10">
                Full Recorder
              </Link>
            </div>
          </div>
        </div>

        {!canCreate && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-4 sm:px-4 text-sm text-amber-100">
            <ShieldCheck className="mr-2 inline h-4 w-4" />
            Save is disabled because {roleLabel(workflowUser.role)} cannot create defect records.
          </div>
        )}

        {/* AI Vision + Voice row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div
            className="flex flex-row items-center justify-center gap-3 rounded-3xl border border-[#00A3E0]/30 bg-gradient-to-br from-[#00A3E0]/10 to-transparent px-3 py-4 sm:flex-col sm:flex-1 cursor-pointer hover:bg-[#00A3E0]/20 transition-all"
            onClick={() => setShowAIVision(true)}
          >
            <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-[#00A3E0]" />
            <span className="text-sm font-bold text-white truncate">AI Scanner</span>
          </div>
          <div className="sm:flex-[2]">
            <SmartVoiceDefectLogger
              handsFreeMode={isHandsFree}
              onSaveRequested={() => saveRecord('save-new')}
              onParsedData={(parsed) => {
                if (Object.keys(parsed).length > 0) {
                  updateDraft(parsed, true);
                  toast.success('Voice processing complete', {
                    description: `Extracted ${Object.keys(parsed).length} fields from your speech.`
                  });
                }
              }}
            />
          </div>
        </div>

        {showAIVision && (
          <AIVisionScanner 
            onCancel={() => setShowAIVision(false)}
            onScanComplete={(result) => {
              updateDraft({
                defectType: result.defectType,
              }, true);
              toast.success('AI Vision Scan Complete', {
                 description: `Detected: ${result.defectType} with ${result.confidence}% confidence.`
              });
              setShowAIVision(false);
            }}
          />
        )}

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 px-4 py-5 sm:px-6 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00A3E0]/20 border border-[#00A3E0]/40 flex items-center justify-center shrink-0">
              <Barcode className="h-5 w-5 sm:h-6 sm:w-6 text-[#00A3E0]" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-white">{isAr ? 'الباركود / كود القطعة' : 'Barcode / Part'}</h2>
              <p className="text-xs text-slate-400">
                {isAr ? 'امسح بالباركود أو اكتب الكود ثم اضغط Enter أو Lookup للمطابقة' : 'Scan barcode or enter part code, then press Enter or Lookup'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              ref={barcodeInputRef}
              value={String(formDraft.partId || formDraft.partNumber || '')}
              onChange={(event) => {
                const val = event.target.value;
                updateDraft({
                  partId: val,
                  partNumber: isEmpty(formDraft.partNumber) ? val : formDraft.partNumber,
                });
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyBarcodeLookup(String(formDraft.partId || formDraft.partNumber || ''));
                }
              }}
              placeholder={isAr ? 'امسح الباركود أو اكتب كود القطعة هنا...' : 'Scan or type part barcode...'}
              className="h-12 sm:h-14 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 sm:px-5 text-base sm:text-lg font-black text-white placeholder:text-slate-500 outline-none focus:border-[#00A3E0] focus:ring-2 focus:ring-[#00A3E0]/20 shadow-inner font-mono"
            />
            <Button
              type="button"
              onClick={() => applyBarcodeLookup(String(formDraft.partId || formDraft.partNumber || ''))}
              className="h-12 sm:h-14 w-full sm:w-auto rounded-2xl px-6 text-base font-black bg-[#00A3E0] hover:bg-[#008fbd] text-white shrink-0 shadow-lg shadow-[#00A3E0]/20 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>{isAr ? 'مطابقة' : 'Lookup'}</span>
            </Button>
          </div>
          {Boolean(formDraft.partName) && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3 py-2 text-xs text-cyan-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>{isAr ? 'القطعة المحددة:' : 'Selected Part:'} <strong className="text-white">{String(formDraft.partName)}</strong> {Boolean(formDraft.model) && `(${formDraft.model})`}</span>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
          <label className="rounded-2xl border border-slate-700/80 bg-slate-900 p-3 sm:p-4 shadow-lg flex flex-col justify-between">
            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">{isAr ? 'الكمية المعيبة' : 'Quantity'}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => updateDraft({ quantity: Math.max(1, Number(formDraft.quantity || 1) - 1) }, true)} className="h-12 sm:h-14 w-12 sm:w-14 rounded-2xl border border-slate-700 bg-slate-950 text-2xl font-black text-white hover:bg-slate-800 transition">-</button>
              <input
                type="number"
                min={1}
                value={Number(formDraft.quantity || 1)}
                onChange={(event) => updateDraft({ quantity: Number(event.target.value) || 1 }, true)}
                className="h-12 sm:h-14 min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-950 text-center text-xl sm:text-2xl font-black text-white outline-none focus:border-[#00A3E0]"
              />
              <button type="button" onClick={() => updateDraft({ quantity: Number(formDraft.quantity || 1) + 1 }, true)} className="h-12 sm:h-14 w-12 sm:w-14 rounded-2xl border border-slate-700 bg-slate-950 text-2xl font-black text-white hover:bg-slate-800 transition">+</button>
            </div>
          </label>

          <label className="rounded-2xl border border-slate-700/80 bg-slate-900 p-3 sm:p-4 shadow-lg flex flex-col justify-between">
            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">{isAr ? 'الوردية' : 'Shift'}</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: 'morning', labelAr: 'صباحي', labelEn: 'Morning' },
                { key: 'afternoon', labelAr: 'مسائي', labelEn: 'Afternoon' },
                { key: 'night', labelAr: 'ليلي', labelEn: 'Night' },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => updateDraft({ shift: s.key }, true)}
                  className={`h-12 sm:h-14 rounded-xl border text-xs font-black transition-all ${
                    formDraft.shift === s.key
                      ? 'border-[#00A3E0] bg-[#00A3E0] text-white shadow-md'
                      : 'border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {isAr ? s.labelAr : s.labelEn}
                </button>
              ))}
            </div>
          </label>

          <label className="rounded-2xl border border-slate-700/80 bg-slate-900 p-3 sm:p-4 shadow-lg flex flex-col justify-between">
            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">{isAr ? 'خط الإنتاج' : 'Line'}</span>
            <input
              value={String(formDraft.productionLine || '')}
              onChange={(event) => updateDraft({ productionLine: event.target.value }, true)}
              placeholder={isAr ? 'اكتب خط الإنتاج...' : 'Line name...'}
              className="h-12 sm:h-14 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-base sm:text-lg font-black text-white placeholder:text-slate-500 outline-none focus:border-[#00A3E0]"
            />
          </label>

          <label className="rounded-2xl border border-slate-700/80 bg-slate-900 p-3 sm:p-4 shadow-lg flex flex-col justify-between">
            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">{isAr ? 'الموديل' : 'Model'}</span>
            <input
              value={String(formDraft.model || '')}
              onChange={(event) => updateDraft({ model: event.target.value }, true)}
              placeholder={isAr ? 'الموديل...' : 'Model...'}
              className="h-12 sm:h-14 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-base sm:text-lg font-black text-white placeholder:text-slate-500 outline-none focus:border-[#00A3E0]"
            />
          </label>

          <label className="rounded-2xl border border-slate-700/80 bg-slate-900 p-3 sm:p-4 shadow-lg flex flex-col justify-between">
            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">{isAr ? 'نقطة الفحص' : 'Inspection Point'}</span>
            <input
              value={String(formDraft.defaultInspectionPoint || '')}
              onChange={(event) => updateDraft({ defaultInspectionPoint: event.target.value }, true)}
              placeholder={isAr ? 'نقطة الفحص...' : 'Inspection point...'}
              className="h-12 sm:h-14 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-base sm:text-lg font-black text-white placeholder:text-slate-500 outline-none focus:border-[#00A3E0]"
            />
          </label>
        </section>

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 px-4 py-5 sm:px-6 shadow-xl">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00A3E0]/20 border border-[#00A3E0]/30 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-[#00A3E0]" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">{isAr ? 'العيوب السريعة' : 'Quick Defect'}</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {isAr ? 'من البيانات المسجلة وتاريخ العيوب الفعلي' : 'From master data and real history'}
            </span>
          </div>

          {/* Camera + Hands-Free */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowAIVision(!showAIVision)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md ${
                showAIVision
                  ? 'bg-blue-600 text-white border border-blue-400'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Camera className={`w-4 h-4 shrink-0 ${showAIVision ? 'animate-pulse text-white' : ''}`} />
              <span className="truncate">{showAIVision ? (isAr ? 'الكاميرا نشطة' : 'Camera Active') : (isAr ? 'كاميرا الذكاء الاصطناعي' : 'AI Camera')}</span>
            </button>
            <button
              onClick={() => setIsHandsFree(!isHandsFree)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md ${
                isHandsFree
                  ? 'bg-emerald-600 text-white border border-emerald-400'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Mic className={`w-4 h-4 shrink-0 ${isHandsFree ? 'animate-pulse text-white' : ''}`} />
              <span className="truncate">{isHandsFree ? (isAr ? 'المسجل الصوتي نشط' : 'Hands-Free ON') : (isAr ? 'تسجيل صوتي' : 'Hands-Free')}</span>
            </button>
          </div>

          {quickDefects.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {quickDefects.map((defect) => (
                <button
                  key={defect}
                  type="button"
                  onClick={() => setDefectType(defect)}
                  className={`min-h-12 sm:min-h-14 rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs sm:text-sm font-bold transition-all ${
                    formDraft.defectType === defect
                      ? 'border-[#00A3E0] bg-[#00A3E0]/20 text-cyan-300 shadow-md font-black'
                      : 'border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  {defect}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400">
              {isAr ? 'لا توجد عيوب مسجلة مسبقاً لهذا الخط أو الموديل. اكتب نوع العيب في الحقل أدناه.' : 'No defect master or historical defect options yet. Type defect type below.'}
            </div>
          )}

          <div className="mt-4">
            <span className="mb-1.5 block text-xs font-bold text-slate-400">
              {isAr ? 'أو اكتب نوع العيب يدوياً:' : 'Or type defect type manually:'}
            </span>
            <input
              value={String(formDraft.defectType || '')}
              onChange={(event) => updateDraft({ defectType: event.target.value }, true)}
              placeholder={isAr ? 'اكتب وصف العيب هنا...' : 'Type defect description...'}
              className="h-12 sm:h-14 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-base sm:text-lg font-black text-white placeholder:text-slate-500 outline-none focus:border-[#00A3E0]"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 px-4 py-5 sm:px-6 shadow-xl">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00A3E0]/20 border border-[#00A3E0]/30 flex items-center justify-center shrink-0">
                <ClipboardCheck className="h-5 w-5 text-[#00A3E0]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-white truncate">{isAr ? 'بنود خطة الفحص النشطة' : 'Inspection Plan Checks'}</h2>
                <p className="text-xs text-white/45 truncate">
                  {activeInspectionPlan
                    ? `${activeInspectionPlan.planName} v${activeInspectionPlan.version}`
                    : 'No matching active plan.'}
                </p>
              </div>
            </div>
            <Link to="/quality-inspection-plans" className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-white/70 hover:bg-white/10">
              Open Plans
            </Link>
          </div>

          {!inspectionAccess.allowed && (
            <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              <ShieldCheck className="mr-2 inline h-4 w-4" />
              Inspection execution is disabled. {inspectionAccess.reason}
            </div>
          )}

          {!activeInspectionPlan ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/45">
              Select or scan values for model, production line, part number, and inspection point. Matching active plans will load automatically. No fake checks are shown.
            </div>
          ) : (
            <div className="space-y-4">
              {activeInspectionPlan.sections.map((section) => {
                const sectionItems = activeInspectionPlan.checkItems.filter((item) => item.section === section.title);
                if (sectionItems.length === 0) return null;
                return (
                  <div key={section.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-white/50">{section.title}</h3>
                    <div className="space-y-3">
                      {sectionItems.map((item) => {
                        const result = checkResults[item.id];
                        const needsEvidence = (item.requiredEvidence || item.inputType === 'photo-required') && result?.result === 'fail' && evidence.length === 0 && !(result.evidence?.length);
                        return (
                          <div key={item.id} className={`rounded-2xl border p-4 ${preparedCheckId === item.id ? 'border-[#00A3E0]/40 bg-[#00A3E0]/10' : 'border-white/10 bg-white/5'}`}>
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <p className="text-sm font-black text-white">{item.checkCode} / {item.checkName}</p>
                                <p className="mt-1 text-xs text-white/45">{item.inspectionMethod} / {item.inputType} / {item.frequency || 'standard frequency'}</p>
                                {(item.standard || item.acceptanceCriteria || item.guidanceText) && (
                                  <div className="mt-3 space-y-1 text-xs text-white/55">
                                    {item.standard && <p>Standard: {item.standard}</p>}
                                    {item.acceptanceCriteria && <p>Acceptance: {item.acceptanceCriteria}</p>}
                                    {item.guidanceText && <p className="text-[#8be3ff]">Guidance: {item.guidanceText}</p>}
                                  </div>
                                )}
                                {item.relatedImage && (
                                  <a href={item.relatedImage} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-[#00A3E0]">Open guidance image</a>
                                )}
                              </div>
                              <span className={`rounded-full border px-3 py-1 text-xs font-black ${
                                result?.result === 'pass' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                                  : result?.result === 'fail' ? 'border-red-400/20 bg-red-500/10 text-red-200'
                                    : 'border-white/10 bg-white/5 text-white/45'
                              }`}>
                                {result?.result || 'not checked'}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2">
                              {(['pass', 'fail', 'na'] as const).map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  disabled={!inspectionAccess.allowed}
                                  onClick={() => updateCheckResult(item, { result: value })}
                                  className={`h-12 rounded-2xl border text-sm font-black uppercase ${result?.result === value ? 'border-[#00A3E0]/50 bg-[#00A3E0]/20 text-white' : 'border-white/10 bg-black/10 text-white/55'}`}
                                >
                                  {value}
                                </button>
                              ))}
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                              {item.inputType === 'numeric' && (
                                <input
                                  type="number"
                                  value={String(result?.measuredValue || '')}
                                  onChange={(event) => updateCheckResult(item, { measuredValue: event.target.value })}
                                  disabled={!inspectionAccess.allowed}
                                  placeholder={`Measured value${item.unit ? ` (${item.unit})` : ''}`}
                                  className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white"
                                />
                              )}
                              {item.inputType !== 'numeric' && item.inputType !== 'pass-fail' && (
                                <input
                                  value={String(result?.measuredValue || '')}
                                  onChange={(event) => updateCheckResult(item, { measuredValue: event.target.value })}
                                  disabled={!inspectionAccess.allowed}
                                  placeholder="Check value"
                                  className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white"
                                />
                              )}
                              <input
                                value={String(result?.notes || '')}
                                onChange={(event) => updateCheckResult(item, { notes: event.target.value })}
                                disabled={!inspectionAccess.allowed}
                                placeholder="Inspector note"
                                className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white"
                              />
                            </div>

                            {needsEvidence && (
                              <p className="mt-3 text-xs text-amber-200">Evidence is required before creating a defect or completing this failed check.</p>
                            )}

                            {result?.result === 'fail' && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  onClick={() => prepareDefectFromCheck(item)}
                                  disabled={!inspectionAccess.allowed || needsEvidence}
                                  className="rounded-xl"
                                >
                                  Create Defect from Failed Check
                                </Button>
                                <span className="self-center text-xs text-white/45">This only pre-fills the defect. Save confirmation is still required.</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => saveInspectionProgress(false)} disabled={!inspectionAccess.allowed} className="h-12 rounded-2xl">
                  Save Inspection Progress
                </Button>
                <Button type="button" onClick={() => saveInspectionProgress(true)} disabled={!inspectionAccess.allowed} className="h-12 rounded-2xl">
                  Complete Inspection
                </Button>
              </div>
            </div>
          )}
        </section>

        {(currentPreparedCheck || failedChecks.length > 0) && (
          <QualityKnowledgeSuggestions
            title="Inspection Knowledge References"
            canApply={canCreate}
            context={{
              sourceType: 'defect',
              defectType: String(formDraft.defectType || currentPreparedCheck?.defectTypeIfNG || currentPreparedCheck?.checkName || ''),
              defectCategory: String(formDraft.defectCategory || ''),
              productionLine: String(formDraft.productionLine || ''),
              model: String(formDraft.model || ''),
              partNumber: String(formDraft.partNumber || formDraft.partId || ''),
              supplier: String(formDraft.supplierName || ''),
              customer: String(formDraft.customerName || ''),
              severity: String(formDraft.severity || currentPreparedCheck?.severityIfNG || ''),
              recordType: String(formDraft.recordType || currentPreparedCheck?.recordTypeIfNG || ''),
              title: currentPreparedCheck?.checkName,
              description: String(formDraft.description || currentPreparedCheck?.guidanceText || ''),
              tags: ['inspection-check', activeInspectionPlan?.inspectionPoint || '', activeInspectionPlan?.productionLine || ''].filter(Boolean),
            }}
          />
        )}

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 px-4 py-5 sm:px-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00A3E0]/20 border border-[#00A3E0]/30 flex items-center justify-center shrink-0">
                <Camera className="h-5 w-5 text-[#00A3E0]" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">{isAr ? 'الأدلة والمرفقات' : 'Evidence'}</h2>
            </div>
            <span className="text-xs font-black text-[#00A3E0] bg-[#00A3E0]/10 px-2.5 py-1 rounded-lg border border-[#00A3E0]/20">{evidence.length}</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            capture="environment"
            multiple
            className="hidden"
            onChange={handleEvidenceFiles}
          />
          <div className="grid grid-cols-1 gap-3">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-12 sm:h-14 w-full rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border-slate-700">
              <ImagePlus className="mr-2 h-5 w-5 text-[#00A3E0]" /> {isAr ? 'إرفاق صورة أو مستند' : 'Add Photo / File'}
            </Button>
            <div className="flex gap-2">
              <input
                value={evidenceNote}
                onChange={(event) => setEvidenceNote(event.target.value)}
                placeholder={isAr ? 'ملاحظة إضافية على العيب...' : 'Short note...'}
                className="h-12 sm:h-14 min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-white placeholder:text-slate-500 outline-none focus:border-[#00A3E0]"
              />
              <Button type="button" onClick={addEvidenceNote} className="h-12 sm:h-14 rounded-2xl px-6 bg-[#00A3E0] hover:bg-[#008fbd] text-white font-bold">{isAr ? 'إضافة' : 'Add'}</Button>
            </div>
          </div>
          {evidence.length > 0 && (
            <div className="mt-4 space-y-2">
              {evidence.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-950 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.kind} / {Math.round(item.size / 1024)} KB / {item.storedLocally ? 'stored locally' : 'metadata only'}</p>
                    {item.warning && <p className="mt-1 text-xs text-amber-300">{item.warning}</p>}
                  </div>
                  <button type="button" onClick={() => setEvidence((prev) => prev.filter((entry) => entry.id !== item.id))} className="rounded-lg p-2 text-slate-400 hover:text-red-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <details className="rounded-3xl border border-slate-700/80 bg-slate-900 px-4 py-5 sm:px-6 shadow-xl">
          <summary className="cursor-pointer text-base sm:text-lg font-black text-white">{isAr ? 'حقول النموذج المتقدمة / القالب' : 'Template Fields / Advanced'}</summary>
          <div className="mt-5">
            <DynamicFormRenderer
              key={formKey}
              formType="defect-log"
              initialValues={formDraft}
              onChange={(values) => setFormDraft((prev) => ({ ...prev, ...values }))}
              showSubmitButton={false}
              compactMode="shopfloor"
              qualityTemplateContext={{
                entityType: 'defect-log',
                recordType: String(formDraft.recordType || 'process-ppm'),
                role: workflowUser.role,
                mode: 'mobile',
                line: String(formDraft.productionLine || ''),
                model: String(formDraft.model || ''),
              }}
            />
          </div>
        </details>

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 px-4 py-5 sm:px-6 shadow-xl">
          <h2 className="mb-4 text-base sm:text-lg font-black text-white">{isAr ? 'تحليل ذكاء السجل' : 'Compact Record Intelligence'}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <Gauge className="mb-2 h-4 w-4 text-[#00A3E0]" />
              <p className="text-[10px] font-black uppercase text-slate-400">Quality</p>
              <p className="text-lg font-black text-white">{intelligence.recordQuality}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <FileText className="mb-2 h-4 w-4 text-[#00A3E0]" />
              <p className="text-[10px] font-black uppercase text-slate-400">Route</p>
              <p className="text-sm font-black text-white">{intelligence.routeLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <AlertTriangle className="mb-2 h-4 w-4 text-amber-300" />
              <p className="text-[10px] font-black uppercase text-slate-400">Missing</p>
              <p className="text-lg font-black text-white">{intelligence.missingRequiredFields.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <ShieldCheck className="mb-2 h-4 w-4 text-amber-300" />
              <p className="text-[10px] font-black uppercase text-slate-400">NCR</p>
              <p className="text-sm font-black text-white">{intelligence.ncrSuggested ? 'Suggested' : 'Not suggested'}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-300" />
              <p className="text-[10px] font-black uppercase text-slate-400">Prediction</p>
              <p className="text-sm font-black text-white">{intelligence.predictionReady ? 'Ready' : 'Needs fields'}</p>
            </div>
            <div className={`rounded-2xl border p-3 ${fmeaRiskPreview.shouldSync ? 'border-red-400/40 bg-red-950/40' : 'border-slate-800 bg-slate-950'}`}>
              <Gauge className={`mb-2 h-4 w-4 ${fmeaRiskPreview.shouldSync ? 'text-red-300' : 'text-slate-400'}`} />
              <p className="text-[10px] font-black uppercase text-slate-400">FMEA RPN</p>
              <p className="text-sm font-black text-white">{fmeaRiskPreview.rpn} / {fmeaRiskPreview.riskLevel}</p>
            </div>
          </div>
          {intelligence.missingRequiredFields.length > 0 && (
            <p className="mt-3 text-sm text-amber-200">Missing: {intelligence.missingRequiredFields.join(', ')}</p>
          )}
          {lastImpact.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {lastImpact.map((impact) => (
                <span key={impact} className="rounded-full border border-[#00A3E0]/20 bg-[#00A3E0]/10 px-3 py-1 text-xs font-bold text-[#00A3E0]">{impact}</span>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 p-4 sm:p-6 shadow-2xl space-y-4 my-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Save className="h-5 w-5 text-[#00A3E0]" />
              <h3 className="text-base font-black text-white">{isAr ? 'إجراءات الحفظ والتسجيل' : 'Save & Record Actions'}</h3>
            </div>
            <span className="text-xs text-slate-400">{isAr ? 'اختر الإجراء المناسب لإكمال التسجيل' : 'Select action to complete entry'}</span>
          </div>

          {/* Primary actions row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              type="button"
              onClick={() => saveRecord('save')}
              disabled={!canCreate || saving}
              className="h-14 rounded-2xl font-black text-base bg-[#00A3E0] hover:bg-[#008fbd] text-white shadow-lg shadow-[#00A3E0]/20 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              <span>{isAr ? 'حفظ السجل' : 'Save Record'}</span>
            </Button>
            <Button
              type="button"
              onClick={() => saveRecord('save-new')}
              disabled={!canCreate || saving}
              className="h-14 rounded-2xl font-black text-base bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span>{isAr ? 'حفظ وإدخال جديد' : 'Save & New'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => saveRecord('draft')}
              disabled={!canCreate || saving}
              className="h-14 rounded-2xl font-black text-base bg-slate-800 hover:bg-slate-700 text-white border-slate-600"
            >
              <span>{isAr ? 'حفظ كمسودة' : 'Save as Draft'}</span>
            </Button>
          </div>

          {/* Secondary actions row */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={duplicatePrevious}
              disabled={!canCreate || defects.length === 0}
              className="h-12 rounded-2xl font-bold text-sm bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" />
              <span>{isAr ? 'تكرار آخر عيب' : 'Duplicate Previous'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetForNew}
              className="h-12 rounded-2xl font-bold text-sm bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{isAr ? 'إعادة تعيين النموذج' : 'Reset Form'}</span>
            </Button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 px-4 py-5 sm:px-6 shadow-xl mb-12 sm:mb-0">
          <h2 className="mb-4 text-base sm:text-lg font-black text-white">Recent Entries</h2>
          {recent.length === 0 ? (
            <QualityGuidedEmptyState
              title="No local shopfloor records yet"
              purpose="Shopfloor Entry is the fast mobile path for barcode-first defect entry and inspection-plan execution."
              firstAction="Scan or type a part number, complete required fields, then Save or Save & New."
              actionHref="/quality-inspection-plans"
              actionLabel="Review Plans"
            />
          ) : (
            <div className="space-y-2">
              {recent.map((record) => (
                <div key={record.id} className="flex flex-col justify-between gap-2 rounded-2xl border border-slate-700 bg-slate-950 p-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-black text-white">{record.defectType || 'Defect record'}</p>
                    <p className="text-xs text-white/45">{record.partId || record.partNumber || 'No part'} / {record.productionLine || 'No line'} / Qty {compactNumber(record.quantity)}</p>
                  </div>
                  <span className="text-xs font-bold text-white/40">{record.status || 'logged'}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
