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
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader } from '@/components/PageHeader';
import { QualityGuidedEmptyState } from '@/components/QualityGuidedEmptyState';
import { Button } from '@/components/ui/button';
import DynamicFormRenderer from '@/components/DynamicFormRenderer';
import QualityKnowledgeSuggestions from '@/components/QualityKnowledgeSuggestions';
import { unifiedDefectLogApi, type DefectLogData } from '@/api/unified-api';
import useAuthStore from '@/stores/authStore';
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
  const barcode = value.trim().toLowerCase();
  if (!barcode) return null;
  return loadQualityMasterTable('parts').find((part) => {
    if (part.isActive === false) return false;
    return ['partId', 'partNumber', 'barcode', 'id'].some((field) => String(part[field] || '').trim().toLowerCase() === barcode);
  }) || null;
}

function evidenceKind(file: File): EvidenceAttachment['kind'] {
  if (file.type.startsWith('image/')) return 'image';
  return 'document';
}

export default function ShopfloorDefectEntry() {
  const authUser = useAuthStore((state) => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [workflowRole] = useState<QualityWorkflowRole>(() => loadLocalWorkflowRole());
  const workflowSettings = useMemo(() => loadDefectWorkflowGovernanceSettings(), []);
  const workflowUser = useMemo(() => buildLocalWorkflowUser(authUser, workflowRole), [authUser, workflowRole]);
  const [defects, setDefects] = useState<DefectLogData[]>([]);
  const [formDraft, setFormDraft] = useState<Record<string, unknown>>(() => todaySeed());
  const [evidence, setEvidence] = useState<EvidenceAttachment[]>([]);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastImpact, setLastImpact] = useState<string[]>([]);
  const [inspectionRun, setInspectionRun] = useState<QualityInspectionRun | null>(null);
  const [checkResults, setCheckResults] = useState<Record<string, QualityInspectionCheckResult>>({});
  const [preparedCheckId, setPreparedCheckId] = useState('');

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
    const next = { ...formDraft, partId: barcode, partNumber: isEmpty(formDraft.partNumber) ? barcode : formDraft.partNumber };
    const part = matchPartByBarcode(barcode);
    if (part) {
      fillIfEmpty(next, 'partNumber', part.partNumber || barcode);
      fillIfEmpty(next, 'partName', part.partName);
      fillIfEmpty(next, 'model', part.model);
      fillIfEmpty(next, 'supplierName', part.supplierName);
      fillIfEmpty(next, 'unitCost', part.unitCost);
      fillIfEmpty(next, 'productFamily', part.productFamily);
      fillIfEmpty(next, 'productionLine', part.productionLine);
      fillIfEmpty(next, 'defaultInspectionPoint', part.defaultInspectionPoint);
      toast.success('Part master matched', { description: 'Empty linked fields were auto-filled from local master data.' });
    } else {
      toast.message('Barcode captured', { description: 'No local part master match yet. You can still save the record.' });
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
        <div className="rounded-3xl border border-[#00A3E0]/20 bg-[#00A3E0]/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#00A3E0]/15 p-3">
                <Smartphone className="h-6 w-6 text-[#00A3E0]" />
              </div>
              <div>
                <p className="text-sm font-black text-white">{activeTemplate ? activeTemplate.name : 'Default Defect Recorder'}</p>
                <p className="text-xs text-white/45">{activeTemplate ? `Designer template v${activeTemplate.version}` : 'Fallback to current configStore form'}</p>
              </div>
            </div>
            <Link to="/defect-log" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-white/70 hover:bg-white/10">
              Full Recorder
            </Link>
          </div>
        </div>

        {!canCreate && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            <ShieldCheck className="mr-2 inline h-4 w-4" />
            Save is disabled because {roleLabel(workflowUser.role)} cannot create defect records.
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <Barcode className="h-6 w-6 text-[#00A3E0]" />
            <div>
              <h2 className="text-xl font-black text-white">Barcode / Part</h2>
              <p className="text-xs text-white/45">Scanner keyboard input is supported. Press Enter after scanning.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <input
              ref={barcodeInputRef}
              value={String(formDraft.partId || '')}
              onChange={(event) => updateDraft({ partId: event.target.value, partNumber: isEmpty(formDraft.partNumber) ? event.target.value : formDraft.partNumber })}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyBarcodeLookup(String(formDraft.partId || ''));
                }
              }}
              placeholder="Scan or type part barcode / رقم الكود"
              className="h-16 rounded-2xl border border-white/10 bg-black/20 px-5 text-xl font-black text-white outline-none focus:border-[#00A3E0]/60"
            />
            <Button type="button" onClick={() => applyBarcodeLookup(String(formDraft.partId || ''))} className="h-16 rounded-2xl px-6 text-base font-black">
              Lookup
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <label className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-white/40">Quantity</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => updateDraft({ quantity: Math.max(1, Number(formDraft.quantity || 1) - 1) }, true)} className="h-14 w-14 rounded-2xl border border-white/10 bg-white/5 text-2xl font-black text-white">-</button>
              <input
                type="number"
                min={1}
                value={Number(formDraft.quantity || 1)}
                onChange={(event) => updateDraft({ quantity: Number(event.target.value) || 1 }, true)}
                className="h-14 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 text-center text-2xl font-black text-white"
              />
              <button type="button" onClick={() => updateDraft({ quantity: Number(formDraft.quantity || 1) + 1 }, true)} className="h-14 w-14 rounded-2xl border border-white/10 bg-white/5 text-2xl font-black text-white">+</button>
            </div>
          </label>

          <label className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-white/40">Shift</span>
            <div className="grid grid-cols-3 gap-2">
              {['morning', 'afternoon', 'night'].map((shift) => (
                <button
                  key={shift}
                  type="button"
                  onClick={() => updateDraft({ shift }, true)}
                  className={`h-14 rounded-2xl border text-xs font-black uppercase ${formDraft.shift === shift ? 'border-[#00A3E0]/50 bg-[#00A3E0]/20 text-white' : 'border-white/10 bg-white/5 text-white/55'}`}
                >
                  {shift}
                </button>
              ))}
            </div>
          </label>

          <label className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-white/40">Line</span>
            <input
              value={String(formDraft.productionLine || '')}
              onChange={(event) => updateDraft({ productionLine: event.target.value }, true)}
              placeholder="Line / خط"
              className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-lg font-black text-white"
            />
          </label>

          <label className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-white/40">Model</span>
            <input
              value={String(formDraft.model || '')}
              onChange={(event) => updateDraft({ model: event.target.value }, true)}
              placeholder="Model"
              className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-lg font-black text-white"
            />
          </label>

          <label className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-white/40">Inspection Point</span>
            <input
              value={String(formDraft.defaultInspectionPoint || '')}
              onChange={(event) => updateDraft({ defaultInspectionPoint: event.target.value }, true)}
              placeholder="Inspection point"
              className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-lg font-black text-white"
            />
          </label>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[#00A3E0]" />
              <h2 className="text-lg font-black text-white">Quick Defect</h2>
            </div>
            <span className="text-xs font-bold text-white/40">From master data and real history</span>
          </div>
          {quickDefects.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {quickDefects.map((defect) => (
                <button
                  key={defect}
                  type="button"
                  onClick={() => setDefectType(defect)}
                  className={`min-h-14 rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${formDraft.defectType === defect ? 'border-[#00A3E0]/60 bg-[#00A3E0]/20 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
                >
                  {defect}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/45">
              No defect master or historical defect options are available yet. Type the defect below.
            </div>
          )}
          <input
            value={String(formDraft.defectType || '')}
            onChange={(event) => updateDraft({ defectType: event.target.value }, true)}
            placeholder="Or type defect type..."
            className="mt-4 h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-lg font-black text-white"
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-[#00A3E0]" />
              <div>
                <h2 className="text-lg font-black text-white">Inspection Plan Checks</h2>
                <p className="text-xs text-white/45">
                  {activeInspectionPlan
                    ? `${activeInspectionPlan.planName} v${activeInspectionPlan.version}`
                    : 'No matching active inspection plan. Create or publish one in Inspection Plans.'}
                </p>
              </div>
            </div>
            <Link to="/quality-inspection-plans" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-white/70 hover:bg-white/10">
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

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-[#00A3E0]" />
              <h2 className="text-lg font-black text-white">Evidence</h2>
            </div>
            <span className="text-xs font-black text-[#00A3E0]">{evidence.length}</span>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-14 rounded-2xl">
              <ImagePlus className="mr-2 h-5 w-5" /> Add Photo / File
            </Button>
            <div className="flex gap-2">
              <input
                value={evidenceNote}
                onChange={(event) => setEvidenceNote(event.target.value)}
                placeholder="Short note..."
                className="h-14 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 text-white"
              />
              <Button type="button" onClick={addEvidenceNote} className="h-14 rounded-2xl px-5">Add</Button>
            </div>
          </div>
          {evidence.length > 0 && (
            <div className="mt-4 space-y-2">
              {evidence.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-black/10 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{item.name}</p>
                    <p className="text-xs text-white/40">{item.kind} / {Math.round(item.size / 1024)} KB / {item.storedLocally ? 'stored locally' : 'metadata only'}</p>
                    {item.warning && <p className="mt-1 text-xs text-amber-300">{item.warning}</p>}
                  </div>
                  <button type="button" onClick={() => setEvidence((prev) => prev.filter((entry) => entry.id !== item.id))} className="rounded-lg p-2 text-white/40 hover:text-red-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <details className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6">
          <summary className="cursor-pointer text-lg font-black text-white">Template Fields / Advanced</summary>
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

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6">
          <h2 className="mb-4 text-lg font-black text-white">Compact Record Intelligence</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
              <Gauge className="mb-2 h-4 w-4 text-[#00A3E0]" />
              <p className="text-[10px] font-black uppercase text-white/40">Quality</p>
              <p className="text-lg font-black text-white">{intelligence.recordQuality}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
              <FileText className="mb-2 h-4 w-4 text-[#00A3E0]" />
              <p className="text-[10px] font-black uppercase text-white/40">Route</p>
              <p className="text-sm font-black text-white">{intelligence.routeLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
              <AlertTriangle className="mb-2 h-4 w-4 text-amber-300" />
              <p className="text-[10px] font-black uppercase text-white/40">Missing</p>
              <p className="text-lg font-black text-white">{intelligence.missingRequiredFields.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
              <ShieldCheck className="mb-2 h-4 w-4 text-amber-300" />
              <p className="text-[10px] font-black uppercase text-white/40">NCR</p>
              <p className="text-sm font-black text-white">{intelligence.ncrSuggested ? 'Suggested' : 'Not suggested'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
              <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-300" />
              <p className="text-[10px] font-black uppercase text-white/40">Prediction</p>
              <p className="text-sm font-black text-white">{intelligence.predictionReady ? 'Ready' : 'Needs fields'}</p>
            </div>
            <div className={`rounded-2xl border p-3 ${fmeaRiskPreview.shouldSync ? 'border-red-400/20 bg-red-400/10' : 'border-white/10 bg-black/10'}`}>
              <Gauge className={`mb-2 h-4 w-4 ${fmeaRiskPreview.shouldSync ? 'text-red-300' : 'text-white/40'}`} />
              <p className="text-[10px] font-black uppercase text-white/40">FMEA RPN</p>
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

        <section className="sticky bottom-3 z-20 rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <Button type="button" onClick={() => saveRecord('save')} disabled={!canCreate || saving} className="h-14 rounded-2xl font-black">
              {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save
            </Button>
            <Button type="button" onClick={() => saveRecord('save-new')} disabled={!canCreate || saving} className="h-14 rounded-2xl font-black">
              <Plus className="mr-2 h-5 w-5" /> Save & New
            </Button>
            <Button type="button" variant="outline" onClick={() => saveRecord('draft')} disabled={!canCreate || saving} className="h-14 rounded-2xl font-black">
              Save Draft
            </Button>
            <Button type="button" variant="outline" onClick={duplicatePrevious} disabled={!canCreate || defects.length === 0} className="h-14 rounded-2xl font-black">
              <Copy className="mr-2 h-5 w-5" /> Duplicate
            </Button>
            <Button type="button" variant="outline" onClick={resetForNew} className="h-14 rounded-2xl font-black">
              <RotateCcw className="mr-2 h-5 w-5" /> Reset
            </Button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6">
          <h2 className="mb-4 text-lg font-black text-white">Recent Entries</h2>
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
                <div key={record.id} className="flex flex-col justify-between gap-2 rounded-2xl border border-white/10 bg-black/10 p-3 sm:flex-row sm:items-center">
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
