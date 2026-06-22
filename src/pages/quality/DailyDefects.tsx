
import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  PlusCircle, 
  History, 
  FileText, 
  Edit3, 
  Database,
  Download,
  BarChart3,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Brain,
  Copy,
  DollarSign,
  Gauge,
  RotateCcw,
  Route,
  ShieldCheck,
  Sparkles,
  Truck,
  Upload,
  X,
  MessageSquare,
  PlayCircle,
  Timer,
  Workflow,
  Bell,
  ClipboardList,
  Lock,
  SlidersHorizontal,
  UserCog,
  Smartphone
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useConfigStore } from '@/stores/configStore';
import { 
  unifiedDefectLogApi, 
  unifiedCapaApi,
  unifiedEightDApi,
  unifiedNcrApi, 
  type DefectLogData 
} from '@/api/unified-api';
import { DataTable } from '@/components/DataTable';
import QualityRelationshipManager from '@/components/QualityRelationshipManager';
import QualityKnowledgeSuggestions from '@/components/QualityKnowledgeSuggestions';
import { QualityGuidedEmptyState } from '@/components/QualityGuidedEmptyState';
import { PageContainer, PageHeader, PageSection, StatsBar } from '@/components/PageHeader';
import { SectionLoader } from '@/components/Loading';
import { PriorityBadge, StatusBadge } from '@/components/StatusBadge';
import { DynamicFormRenderer } from '@/components/DynamicFormRenderer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ParetoChart } from '@/components/ParetoChart';
import { getDefectRecordType, type ExtendedDefectLog } from '@/services/defectAnalytics';
import {
  buildDefectTemplateValues,
  evaluateDefectRecordIntelligence,
  getDefectFormTemplate,
  getDefectFormTemplates,
  loadDefectMasterData,
  normalizePartMasterRows,
  saveDefectMasterData,
  type DefectFormTemplateId,
} from '@/services/defectRecorderEngine';
import {
  buildMasterDataSnapshot,
  buildMasterOptionItems,
  getExternalDataSourceRows,
  importQualityMasterRows,
  loadAllQualityMasterTables,
  type QualityMasterTableId,
} from '@/services/qualityMasterData';
import { evaluateAdvancedDefectRules } from '@/services/qualityRulesEngine';
import useAuthStore from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import {
  applyStatusTimestamp,
  buildActivityTimeline,
  buildLifecycleComment,
  buildSlaMetrics,
  buildSmartEscalationMatrix,
  buildSystemComment,
  buildWorkflowMetrics,
  canTransitionDefect,
  getAvailableWorkflowActions,
  normalizeDefectLifecycleStatus,
  type DefectActionTracking,
  type DefectLifecycleComment,
  type DefectWorkflowAction,
} from '@/services/defectLifecycleWorkflow';
import {
  QUALITY_WORKFLOW_ROLES,
  buildGovernedSlaStatus,
  buildLocalWorkflowUser,
  buildMyWorkflowTasks,
  buildOwnerPatch,
  buildWorkflowNotifications,
  evaluateApprovalRequirement,
  evaluateWorkflowActionAccess,
  hasDefectPermission,
  loadDefectWorkflowGovernanceSettings,
  loadLocalWorkflowRole,
  loadReadWorkflowNotificationIds,
  roleLabel,
  saveDefectWorkflowGovernanceSettings,
  saveLocalWorkflowRole,
  saveReadWorkflowNotificationIds,
  type DefectWorkflowGovernanceSettings,
  type DefectWorkflowNotification,
  type LocalWorkflowUser,
  type QualityWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import { enqueueQualitySyncItem, type QualitySyncOperation } from '@/services/qualitySyncQueue';
import { buildKnowledgeContextFromDefect } from '@/services/qualityKnowledgeBase';
import { createImprovementAction, prefillActionFromDefect } from '@/services/qualityImprovementActions';
import { loadActiveQualityFormTemplate } from '@/services/qualityFormTemplates';
import { loadQualityInspectionPlans, loadQualityInspectionRuns } from '@/services/qualityInspectionPlans';
import { buildDefectFmeaRiskPreview, upsertFmeaFromDefectRisk } from '@/services/defectFmeaIntegration';

const recordTypeToTemplate: Record<string, DefectFormTemplateId> = {
  'process-ppm': 'process-ppm',
  'defect-cost': 'defect-cost',
  'outgoing-quality': 'outgoing-quality',
  'customer-return': 'customer-return',
};

const DEFECT_CORE_FIELD_KEYS = new Set([
  'date', 'shift', 'productionLine', 'partId', 'partNumber', 'recordType', 'defectType',
  'quantity', 'inspectedQuantity', 'productionQuantity', 'estimatedCost', 'costCategory',
  'outgoingResult', 'shipmentId', 'customerName', 'releaseTimeHrs', 'returnReference',
  'severity', 'description', 'operatorName', 'actionTaken', 'model', 'supplierName',
  'unitCost', 'productFamily', 'factory', 'workshop', 'capacity', 'inspectionPlan',
  'defaultInspectionPoint', 'defectCategory', 'suggestedContainment', 'customerCode',
  'market', 'defaultReturnHandling', 'status', 'ppmPreview', 'totalCostPreview',
  'costImpactLevel', 'releaseStatus', 'outgoingImpact', 'externalFailureImpact',
  'ncrSuggested', 'relatedInspectionPlanId', 'relatedInspectionPlanVersion',
  'relatedCheckItemId', 'relatedInspectionRunId', 'inspectionResult',
]);

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
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reasonForChange?: string;
  previousStatus?: string;
  newStatus?: string;
  permissionResult?: 'allowed' | 'blocked';
  permissionReason?: string;
}

const DEFECT_AUDIT_KEY = 'qms_defect_record_audit_trail_v1';
const EVIDENCE_SIZE_LIMIT = 700_000;

function userLabel(user: LocalWorkflowUser): string {
  return `${user.name} (${roleLabel(user.role)})`;
}

function syncOperationForAction(action: string): QualitySyncOperation {
  if (action === 'comment') return 'add-comment';
  if (action === 'elevate-to-ncr') return 'elevate-to-ncr';
  if (action === 'create-capa') return 'create-capa';
  if (action === 'escalate-8d') return 'escalate-to-8d';
  if (['submit-review', 'review', 'approve', 'reject', 'start-investigation', 'verify-action', 'close', 'reopen', 'action-tracking'].includes(action)) {
    return 'workflow-transition';
  }
  return 'update';
}

function compactNumber(value: number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '---';
  return `${Number(value).toLocaleString()}${suffix}`;
}

function changedFields(oldRecord: Record<string, unknown>, newRecord: Record<string, unknown>): string[] {
  return Object.keys(newRecord).filter((key) => JSON.stringify(oldRecord[key]) !== JSON.stringify(newRecord[key]));
}

function appendGlobalAudit(recordId: string, entry: AuditEntry): void {
  try {
    const raw = localStorage.getItem(DEFECT_AUDIT_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const next = { ...parsed, [recordId]: [...(parsed[recordId] || []), entry] };
    localStorage.setItem(DEFECT_AUDIT_KEY, JSON.stringify(next));
  } catch {
    // Audit trail should never block defect recording.
  }
}

function loadGlobalAudit(recordId: string): AuditEntry[] {
  try {
    const raw = localStorage.getItem(DEFECT_AUDIT_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return Array.isArray(parsed[recordId]) ? parsed[recordId] : [];
  } catch {
    return [];
  }
}

export default function DailyDefects() {
  const authUser = useAuthStore((state) => state.user);
  const { isLiteMode } = useAppStore();
  const [defects, setDefects] = useState<DefectLogData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveSetId] = useState('entry');
  const [editingDefect, setEditingAudit] = useState<DefectLogData | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<DefectFormTemplateId>('general');
  const [formSeed, setFormSeed] = useState<Record<string, unknown>>(() => buildDefectTemplateValues('general'));
  const [formDraft, setFormDraft] = useState<Record<string, unknown>>(() => buildDefectTemplateValues('general'));
  const [formInstanceKey, setFormInstanceKey] = useState(0);
  const [lastSavedImpact, setLastSavedImpact] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DefectLogData | null>(null);
  const [evidenceDraft, setEvidenceDraft] = useState<EvidenceAttachment[]>([]);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [reasonForChange, setReasonForChange] = useState('');
  const [workflowComment, setWorkflowComment] = useState('');
  const [newComment, setNewComment] = useState('');
  const [actionDraft, setActionDraft] = useState<DefectActionTracking>({});
  const [workflowRole, setWorkflowRole] = useState<QualityWorkflowRole>(() => loadLocalWorkflowRole());
  const [workflowSettings, setWorkflowSettings] = useState<DefectWorkflowGovernanceSettings>(() => loadDefectWorkflowGovernanceSettings());
  const [settingsDraft, setSettingsDraft] = useState<DefectWorkflowGovernanceSettings>(() => loadDefectWorkflowGovernanceSettings());
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => loadReadWorkflowNotificationIds());
  const { forms, updateExternalDataSource, upsertOptionSet, reinitializeDefaults } = useConfigStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { id: routeDefectId } = useParams();

  const formConfig = forms.find(f => f.type === 'defect-log');
  const analytics = formConfig?.analytics;
  const workflowUser = useMemo(() => buildLocalWorkflowUser(authUser, workflowRole), [authUser, workflowRole]);
  const templates = useMemo(() => getDefectFormTemplates(), []);
  const selectedTemplate = useMemo(() => getDefectFormTemplate(selectedTemplateId), [selectedTemplateId]);
  const activeDesignerTemplate = useMemo(() => loadActiveQualityFormTemplate({
    entityType: 'defect-log',
    recordType: String(formDraft.recordType || formSeed.recordType || selectedTemplate.defaultValues.recordType || ''),
    line: String(formDraft.productionLine || formSeed.productionLine || ''),
    model: String(formDraft.model || formSeed.model || ''),
  }), [formDraft.recordType, formDraft.productionLine, formDraft.model, formSeed.recordType, formSeed.productionLine, formSeed.model, selectedTemplate.defaultValues.recordType]);
  const currentFormValues = useMemo(
    () => ({ ...formSeed, ...formDraft }),
    [formSeed, formDraft],
  );
  const recordIntelligence = useMemo(
    () => evaluateDefectRecordIntelligence(currentFormValues, defects as ExtendedDefectLog[]),
    [currentFormValues, defects],
  );
  const fmeaRiskPreview = useMemo(
    () => buildDefectFmeaRiskPreview(currentFormValues, defects as ExtendedDefectLog[]),
    [currentFormValues, defects],
  );
  const advancedRules = useMemo(
    () => evaluateAdvancedDefectRules(currentFormValues, defects as ExtendedDefectLog[]),
    [currentFormValues, defects],
  );
  const selectedRecordAudit = useMemo(
    () => selectedRecord ? [...((selectedRecord.auditTrail || []) as unknown as AuditEntry[]), ...loadGlobalAudit(selectedRecord.id)] : [],
    [selectedRecord],
  );
  const selectedRecordTimeline = useMemo(
    () => selectedRecord ? buildActivityTimeline(selectedRecord, loadGlobalAudit(selectedRecord.id)) : [],
    [selectedRecord],
  );
  const selectedRecordSla = useMemo(
    () => selectedRecord ? buildSlaMetrics(selectedRecord) : null,
    [selectedRecord],
  );
  const selectedRecordGovernedSla = useMemo(
    () => selectedRecord ? buildGovernedSlaStatus(selectedRecord, workflowSettings) : null,
    [selectedRecord, workflowSettings],
  );
  const selectedRecordEscalation = useMemo(
    () => selectedRecord ? buildSmartEscalationMatrix(selectedRecord, defects as ExtendedDefectLog[]) : null,
    [selectedRecord, defects],
  );
  const selectedRecordApproval = useMemo(
    () => selectedRecord ? evaluateApprovalRequirement(selectedRecord, defects as ExtendedDefectLog[], workflowSettings) : null,
    [selectedRecord, defects, workflowSettings],
  );
  const selectedRecordRules = useMemo(
    () => selectedRecord ? evaluateAdvancedDefectRules(selectedRecord as unknown as Record<string, unknown>, defects as ExtendedDefectLog[]) : null,
    [selectedRecord, defects],
  );
  const selectedInspectionContext = useMemo(() => {
    if (!selectedRecord) return null;
    const plans = loadQualityInspectionPlans(true);
    const runs = loadQualityInspectionRuns();
    const plan = plans.find((item) => item.id === selectedRecord.relatedInspectionPlanId);
    const run = runs.find((item) => item.id === selectedRecord.relatedInspectionRunId);
    const check = plan?.checkItems.find((item) => item.id === selectedRecord.relatedCheckItemId);
    const result = run?.checkResults.find((item) => item.checkItemId === selectedRecord.relatedCheckItemId)
      || (selectedRecord.inspectionResult as unknown as { result?: string; measuredValue?: unknown; notes?: string } | undefined);
    return { plan, run, check, result };
  }, [selectedRecord]);
  const workflowMetrics = useMemo(() => buildWorkflowMetrics(defects), [defects]);
  const workflowNotifications = useMemo(
    () => buildWorkflowNotifications(defects, workflowUser, workflowSettings, readNotificationIds),
    [defects, workflowUser, workflowSettings, readNotificationIds],
  );
  const myWorkflowTasks = useMemo(
    () => buildMyWorkflowTasks(defects, workflowUser, workflowSettings),
    [defects, workflowUser, workflowSettings],
  );
  const unreadWorkflowNotifications = workflowNotifications.filter((item) => !item.read).length;
  const recentRecords = useMemo(() => defects.slice(0, 5), [defects]);
 
  useEffect(() => {
    if (isLiteMode && !['entry', 'records'].includes(activeTab)) {
      setActiveSetId('entry');
    }
  }, [isLiteMode, activeTab]);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasDefectPermission(workflowUser, 'masterData.edit')) {
      toast.error('Import blocked', { description: `${roleLabel(workflowUser.role)} cannot edit master data.` });
      if (e.target) e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const dataJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        if (dataJson.length > 0) {
          const masterRows = normalizePartMasterRows(dataJson);
          saveDefectMasterData('parts', masterRows);
          importQualityMasterRows('parts', masterRows, 'local-user');
          enqueueQualitySyncItem({
            entityType: 'master-data',
            entityId: 'parts',
            operation: 'update',
            payloadSummary: `${masterRows.length} part master rows imported locally from ${file.name}.`,
          });

          updateExternalDataSource('products-db', {
            name: 'Products / Parts Master',
            type: file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel',
            data: masterRows,
            lastUpdated: new Date().toISOString(),
          });

          const partOptions = masterRows
            .filter((item) => String(item.partId || '').trim().length > 0)
            .map((item) => ({
              value: String(item.partId),
              label: [item.partId, item.partName].filter(Boolean).join(' - '),
            }));

          upsertOptionSet({
            id: 'parts-list',
            name: 'Parts List',
            items: partOptions.length > 0 ? partOptions : buildMasterOptionItems('parts', 'partNumber', ['partNumber', 'partName']),
          });

          toast.success('Master Data Imported', {
            description: `Loaded ${masterRows.length} rows from ${wsname}. Linked fields can now auto-fill when part codes match.`,
          });
        } else {
          toast.error('Import Failed', { description: 'The selected file is empty.' });
        }
      } catch (err) {
        console.error('Import failed:', err);
        toast.error('Import Failed', { description: 'Please check the file format.' });
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = () => {
    if (!hasDefectPermission(workflowUser, 'records.export')) {
      toast.error('Export blocked', { description: `${roleLabel(workflowUser.role)} cannot export defect records.` });
      return;
    }
    if (defects.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      // Prepare data for export - format dates and clean up fields
      const exportData = defects.map(d => ({
        'Date': d.date ? new Date(d.date).toLocaleDateString() : '---',
        'Shift': d.shift || '---',
        'Line': d.productionLine || '---',
        'Part ID': d.partId || '---',
        'Part Name': d.partNumber || '---',
        'Dashboard Routing': d.recordType || 'process-ppm',
        'Defect Type': d.defectType || '---',
        'Quantity': d.quantity || 0,
        'Inspected Quantity': d.inspectedQuantity || 0,
        'Estimated Cost': d.estimatedCost || 0,
        'Cost Category': d.costCategory || '---',
        'Outgoing Result': d.outgoingResult || '---',
        'Shipment ID': d.shipmentId || '---',
        'Customer': d.customerName || '---',
        'Severity': d.severity || '---',
        'Description': d.description || '---',
        'Operator': d.operatorName || '---',
        'Action Taken': d.actionTaken || '---',
        'Status': d.status || '---',
        'Approval Required': d.approvalRequired ? 'Yes' : 'No',
        'Master Data Version': d.masterDataVersion || '---',
        'Part Name At Time': d.partNameAtTime || '---',
        'Supplier At Time': d.supplierNameAtTime || '---',
        'Defect Category At Time': d.defectCategoryAtTime || '---',
        'Evidence Count': Array.isArray(d.evidence) ? d.evidence.length : 0
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Defect Records');
      
      const fileName = `Defect_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Report Exported', {
        description: `File saved as ${fileName}`
      });
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed', { description: 'Could not generate Excel file.' });
    }
  };

  const loadDefects = async () => {
    try {
      setIsLoading(true);
      const response = await unifiedDefectLogApi.getAll();
      if (response && Array.isArray(response.data)) {
        setDefects(response.data);
        if (routeDefectId) {
          const detailRecord = response.data.find((record) => record.id === routeDefectId);
          if (detailRecord) {
            setSelectedRecord(detailRecord);
            setActiveSetId('details');
            setActionDraft({
              containmentAction: detailRecord.containmentAction,
              correction: detailRecord.correction,
              correctiveAction: detailRecord.correctiveAction,
              preventiveAction: detailRecord.preventiveAction,
              responsiblePerson: detailRecord.responsiblePerson,
              dueDate: detailRecord.dueDate,
              actionStatus: detailRecord.actionStatus as DefectActionTracking['actionStatus'],
              verificationResult: detailRecord.verificationResult,
              verifiedBy: detailRecord.verifiedBy,
              verifiedAt: detailRecord.verifiedAt,
            });
          }
        }
      } else {
        setDefects([]);
      }
    } catch (err) {
      console.warn('Failed to load defects:', err);
      // Fallback to empty if backend fails
      setDefects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reinitializeDefaults();
    const legacyParts = loadDefectMasterData('parts');
    const allMasterTables = loadAllQualityMasterTables();
    const sourceMap: Array<{ table: QualityMasterTableId; sourceId: string; name: string }> = [
      { table: 'parts', sourceId: 'products-db', name: 'Products / Parts Master' },
      { table: 'models', sourceId: 'models-db', name: 'Models Master' },
      { table: 'defects', sourceId: 'defects-db', name: 'Defects Master' },
      { table: 'lines', sourceId: 'lines-db', name: 'Lines & Workshops' },
      { table: 'customers', sourceId: 'customers-db', name: 'Customers Master' },
    ];
    sourceMap.forEach(({ table, sourceId, name }) => {
      const rows = table === 'parts' && allMasterTables.parts.length === 0 ? legacyParts : getExternalDataSourceRows(table);
      if (rows.length > 0) {
        updateExternalDataSource(sourceId, { name, type: 'json', data: rows });
      }
    });
    upsertOptionSet({ id: 'parts-list', name: 'Parts List', items: buildMasterOptionItems('parts', 'partNumber', ['partNumber', 'partName']) });
    upsertOptionSet({ id: 'models-list', name: 'Models List', items: buildMasterOptionItems('models', 'model', ['model', 'product']) });
    upsertOptionSet({ id: 'defects-list', name: 'Defects List', items: buildMasterOptionItems('defects', 'defectType', ['defectType', 'defectCategory']) });
    upsertOptionSet({ id: 'lines-list', name: 'Lines List', items: buildMasterOptionItems('lines', 'productionLine', ['productionLine', 'workshop']) });
    upsertOptionSet({ id: 'customers-list', name: 'Customers List', items: buildMasterOptionItems('customers', 'customerName', ['customerName', 'market']) });
    loadDefects();
  }, [reinitializeDefaults, updateExternalDataSource, upsertOptionSet, routeDefectId]);

  const handleWorkflowRoleChange = (role: QualityWorkflowRole) => {
    setWorkflowRole(role);
    saveLocalWorkflowRole(role);
    toast.success('Local workflow role updated', {
      description: `Actions are now evaluated as ${roleLabel(role)}.`,
    });
  };

  const markWorkflowNotificationsRead = (items: DefectWorkflowNotification[] = workflowNotifications) => {
    const next = [...new Set([...readNotificationIds, ...items.map((item) => item.id)])];
    setReadNotificationIds(next);
    saveReadWorkflowNotificationIds(next);
  };

  const saveGovernanceSettings = () => {
    saveDefectWorkflowGovernanceSettings(settingsDraft);
    enqueueQualitySyncItem({
      entityType: 'workflow-governance-settings',
      entityId: 'defect-workflow-governance',
      operation: 'update-settings',
      payloadSummary: 'Workflow governance, SLA, approval matrix, or transition settings updated locally.',
    });
    const reloaded = loadDefectWorkflowGovernanceSettings();
    setWorkflowSettings(reloaded);
    setSettingsDraft(reloaded);
    toast.success('Workflow settings saved', {
      description: 'SLA targets, approval thresholds, and transition rules are stored locally.',
    });
  };

  const resetGovernanceSettings = () => {
    const defaults = loadDefectWorkflowGovernanceSettings();
    localStorage.removeItem('qms_defect_workflow_governance_settings_v1');
    const next = loadDefectWorkflowGovernanceSettings();
    setWorkflowSettings(next);
    setSettingsDraft(next);
    toast.success('Workflow settings reset', {
      description: defaults.version ? 'Default governance settings are active again.' : 'Default governance settings are active.',
    });
  };

  const inspectedTotal = defects.reduce((acc, d) => acc + (Number(d.inspectedQuantity || d.productionQuantity || 0) || 0), 0);
  const defectQtyTotal = defects.reduce((acc, d) => acc + (Number(d.quantity || 0) || 0), 0);
  const stats = [
    { label: 'Today Records', value: defects.filter(d => {
      const todayStr = new Date().toISOString().split('T')[0];
      const dDate = d.date ? new Date(d.date).toISOString().split('T')[0] : '';
      return dDate === todayStr;
    }).length, change: '0', trend: 'neutral' as const },
    { label: 'Critical Defects', value: defects.filter(d => d.severity === 'critical').length, change: '0', trend: 'neutral' as const },
    { label: 'Avg Severity', value: (() => {
      if (defects.length === 0) return '--';
      const sevMap: Record<string, number> = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const avg = defects.reduce((acc, d) => acc + (sevMap[d.severity?.toLowerCase()] || 0), 0) / (defects.length || 1);
      if (avg > 3) return 'High';
      if (avg > 2) return 'Medium';
      return 'Low';
    })(), change: '', trend: 'neutral' as const },
    { label: 'Yield Rate', value: inspectedTotal > 0 ? `${Math.max(0, Math.round((1 - defectQtyTotal / inspectedTotal) * 100))}%` : '0%', change: '0%', trend: 'neutral' as const }
  ];

  const applyTemplate = (templateId: DefectFormTemplateId, base: Record<string, unknown> = {}) => {
    const nextValues = buildDefectTemplateValues(templateId, base);
    setSelectedTemplateId(templateId);
    setFormSeed(nextValues);
    setFormDraft(nextValues);
    setEditingAudit(null);
    setEvidenceDraft([]);
    setReasonForChange('');
    setFormInstanceKey((key) => key + 1);
    setActiveSetId('entry');
  };

  const handleEdit = (defect: DefectLogData) => {
    if (!hasDefectPermission(workflowUser, 'defect.edit')) {
      toast.error('Edit blocked', { description: `${roleLabel(workflowUser.role)} cannot edit defect records.` });
      return;
    }
    const route = getDefectRecordType(defect);
    setSelectedTemplateId(recordTypeToTemplate[route] || 'general');
    setFormSeed(defect as unknown as Record<string, unknown>);
    setFormDraft(defect as unknown as Record<string, unknown>);
    setEvidenceDraft(Array.isArray(defect.evidence) ? defect.evidence as unknown as EvidenceAttachment[] : []);
    setReasonForChange('');
    setEditingAudit(defect);
    setFormInstanceKey((key) => key + 1);
    setActiveSetId('entry');
  };

  const handleNewEntry = () => {
    if (!hasDefectPermission(workflowUser, 'defect.create')) {
      toast.error('Create blocked', { description: `${roleLabel(workflowUser.role)} cannot create defect records.` });
      return;
    }
    const nextValues = buildDefectTemplateValues(selectedTemplateId);
    setFormSeed(nextValues);
    setFormDraft(nextValues);
    setEditingAudit(null);
    setEvidenceDraft([]);
    setReasonForChange('');
    setFormInstanceKey((key) => key + 1);
    setActiveSetId('entry');
  };

  const handleResetForm = () => {
    applyTemplate(selectedTemplateId);
    toast.success('Form reset', { description: 'The recorder is ready for a clean new entry.' });
  };

  const handleDuplicatePrevious = () => {
    if (!hasDefectPermission(workflowUser, 'defect.create')) {
      toast.error('Duplicate blocked', { description: `${roleLabel(workflowUser.role)} cannot create defect records.` });
      return;
    }
    const latest = defects[0];
    if (!latest) {
      toast.error('No recent record to duplicate');
      return;
    }

    const route = getDefectRecordType(latest);
    const templateId = recordTypeToTemplate[route] || 'general';
    const {
      id: _id,
      relatedNcrId: _relatedNcrId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...copy
    } = latest as DefectLogData & Record<string, unknown>;
    const nextValues = buildDefectTemplateValues(templateId, {
      ...copy,
      date: new Date().toISOString().split('T')[0],
      status: 'logged',
    });

    setSelectedTemplateId(templateId);
    setFormSeed(nextValues);
    setFormDraft(nextValues);
    setEditingAudit(null);
    setEvidenceDraft([]);
    setReasonForChange('');
    setFormInstanceKey((key) => key + 1);
    setActiveSetId('entry');
    toast.success('Previous record duplicated', {
      description: 'Review the values, then save as a new quality record.',
    });
  };

  const handleEvidenceFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const baseAttachment: EvidenceAttachment = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        kind: file.type.startsWith('image/') ? 'image' : 'document',
        storedLocally: false,
        uploadedAt: new Date().toISOString(),
      };

      if (file.size > EVIDENCE_SIZE_LIMIT) {
        setEvidenceDraft((prev) => [
          ...prev,
          {
            ...baseAttachment,
            warning: 'File is too large for safe localStorage storage. Metadata only was attached.',
          },
        ]);
        toast.warning('Large evidence file', {
          description: `${file.name} was attached as metadata only.`,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setEvidenceDraft((prev) => [
          ...prev,
          {
            ...baseAttachment,
            dataUrl: String(reader.result || ''),
            storedLocally: true,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (event.target) event.target.value = '';
  };

  const addEvidenceNote = () => {
    if (!evidenceNote.trim()) return;
    setEvidenceDraft((prev) => [
      ...prev,
      {
        id: `note-${Date.now()}`,
        name: 'Short evidence note',
        type: 'text/plain',
        size: evidenceNote.length,
        kind: 'note',
        note: evidenceNote.trim(),
        storedLocally: true,
        uploadedAt: new Date().toISOString(),
      },
    ]);
    setEvidenceNote('');
  };

  const removeEvidence = (id: string) => {
    setEvidenceDraft((prev) => prev.filter((item) => item.id !== id));
  };

  const openRecordDetails = (record: DefectLogData) => {
    setSelectedRecord(record);
    setActionDraft({
      containmentAction: record.containmentAction,
      correction: record.correction,
      correctiveAction: record.correctiveAction,
      preventiveAction: record.preventiveAction,
      responsiblePerson: record.responsiblePerson,
      dueDate: record.dueDate,
      actionStatus: record.actionStatus as DefectActionTracking['actionStatus'],
      verificationResult: record.verificationResult,
      verifiedBy: record.verifiedBy,
      verifiedAt: record.verifiedAt,
    });
    setActiveSetId('details');
    navigate(`/quality/defect-log/${record.id}`);
  };

  const closeDetails = () => {
    setSelectedRecord(null);
    setWorkflowComment('');
    setNewComment('');
    navigate('/defect-log');
    setActiveSetId('records');
  };

  const mergeDefectInState = (updated: DefectLogData) => {
    setDefects((prev) => prev.map((record) => record.id === updated.id ? updated : record));
    setSelectedRecord(updated);
  };

  const appendRecordAudit = (record: DefectLogData, entry: AuditEntry): AuditEntry[] => [
    ...((record.auditTrail || []) as unknown as AuditEntry[]),
    entry,
  ];

  const updateDefectRecord = async (
    record: DefectLogData,
    patch: Partial<DefectLogData> & Record<string, unknown>,
    action: string,
    comment?: DefectLifecycleComment,
  ) => {
    const auditEntry: AuditEntry = {
      id: `audit-${Date.now()}`,
      action,
      timestamp: new Date().toISOString(),
      changedBy: userLabel(workflowUser),
      role: workflowUser.role,
      changedFields: Object.keys(patch),
      oldValue: record as unknown as Record<string, unknown>,
      newValue: patch,
      reasonForChange: comment?.text || workflowComment.trim() || undefined,
      previousStatus: record.status,
      newStatus: String(patch.status || record.status || ''),
      permissionResult: 'allowed',
    };
    const comments = [
      ...(((record as unknown as { comments?: DefectLifecycleComment[] }).comments || [])),
      ...(comment ? [comment] : []),
    ];
    const updated = await unifiedDefectLogApi.update(record.id, {
      ...patch,
      comments,
      auditTrail: appendRecordAudit(record, auditEntry),
    } as any);
    enqueueQualitySyncItem({
      entityType: 'defect-logs',
      entityId: record.id,
      operation: syncOperationForAction(action),
      payloadSummary: `${action} changed fields: ${Object.keys(patch).join(', ') || 'comment/activity'}`,
    });
    appendGlobalAudit(record.id, auditEntry);
    mergeDefectInState(updated);
    return updated;
  };

  const appendBlockedWorkflowAudit = (record: DefectLogData, action: string, reason: string) => {
    appendGlobalAudit(record.id, {
      id: `audit-${Date.now()}`,
      action,
      timestamp: new Date().toISOString(),
      changedBy: userLabel(workflowUser),
      role: workflowUser.role,
      changedFields: [],
      oldValue: { status: record.status },
      newValue: { status: record.status },
      reasonForChange: reason,
      previousStatus: record.status,
      newStatus: record.status,
      permissionResult: 'blocked',
      permissionReason: reason,
    });
  };

  const runWorkflowAction = async (record: DefectLogData, action: DefectWorkflowAction) => {
    const access = evaluateWorkflowActionAccess(record, action, workflowUser, workflowSettings);
    if (!access.allowed) {
      appendBlockedWorkflowAudit(record, action.id, access.reason);
      toast.error('Action blocked', { description: access.reason });
      return;
    }
    const commentText = workflowComment.trim();
    if ((action.requiresComment || access.transition?.requiresComment) && !commentText) {
      toast.error('Comment required', { description: `${action.label} requires a short reason or verification comment.` });
      return;
    }

    try {
      if (action.nextStatus && !canTransitionDefect(record.status, action.nextStatus)) {
        toast.error('Invalid workflow transition', {
          description: `${record.status || 'logged'} cannot move to ${action.nextStatus}.`,
        });
        return;
      }

      if (action.id === 'elevate-ncr') {
        await handleElevateToNCR(record, commentText);
        setWorkflowComment('');
        return;
      }
      if (action.id === 'create-capa') {
        await handleCreateCAPA(record, commentText);
        setWorkflowComment('');
        return;
      }
      if (action.id === 'escalate-8d') {
        await handleCreateEightD(record, commentText);
        setWorkflowComment('');
        return;
      }
      if (action.id === 'verify-action') {
        await updateDefectRecord(record, {
          actionStatus: 'verified',
          verifiedBy: userLabel(workflowUser),
          verifiedAt: new Date().toISOString(),
          verificationResult: commentText,
        }, 'verify-action', buildSystemComment(action, record.status, userLabel(workflowUser), commentText));
        toast.success('Action verification recorded');
        setWorkflowComment('');
        return;
      }

      const nextStatus = action.nextStatus;
      if (!nextStatus) return;
      const ownerPatch = buildOwnerPatch({ ...record, status: nextStatus }, workflowSettings);
      const userStatusPatch: Record<string, unknown> = {};
      if (nextStatus === 'reviewed') userStatusPatch.reviewedBy = userLabel(workflowUser);
      if (nextStatus === 'approved') userStatusPatch.approvedBy = userLabel(workflowUser);
      if (nextStatus === 'rejected') userStatusPatch.rejectedBy = userLabel(workflowUser);
      if (nextStatus === 'closed') userStatusPatch.closedBy = userLabel(workflowUser);
      const patch = {
        status: nextStatus,
        ...applyStatusTimestamp(record as unknown as Record<string, unknown>, nextStatus),
        ...ownerPatch,
        ...userStatusPatch,
      };
      await updateDefectRecord(record, patch, action.id, buildSystemComment(action, nextStatus, userLabel(workflowUser), commentText || undefined));
      toast.success('Workflow updated', { description: `${action.label} completed.` });
      setWorkflowComment('');
    } catch (error) {
      console.error('Workflow action failed:', error);
      toast.error('Workflow action failed');
    }
  };

  const addRecordComment = async () => {
    if (!selectedRecord || !newComment.trim()) return;
    try {
      await updateDefectRecord(
        selectedRecord,
        {},
        'comment',
        buildLifecycleComment(newComment.trim(), 'comment', userLabel(workflowUser)),
      );
      setNewComment('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const saveActionTracking = async () => {
    if (!selectedRecord) return;
    const patch: Record<string, unknown> = { ...actionDraft };
    if (actionDraft.containmentAction && !selectedRecord.containedAt) {
      patch.containedAt = new Date().toISOString();
    }
    try {
      await updateDefectRecord(selectedRecord, patch as Partial<DefectLogData>, 'action-tracking');
      toast.success('Action tracking saved');
    } catch {
      toast.error('Failed to save action tracking');
    }
  };


  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (editingDefect && !hasDefectPermission(workflowUser, 'defect.edit')) {
      appendBlockedWorkflowAudit(editingDefect, 'update', `${roleLabel(workflowUser.role)} cannot edit defect records.`);
      toast.error('Update blocked', { description: `${roleLabel(workflowUser.role)} cannot edit defect records.` });
      return;
    }
    if (!editingDefect && !hasDefectPermission(workflowUser, 'defect.create')) {
      toast.error('Create blocked', { description: `${roleLabel(workflowUser.role)} cannot create defect records.` });
      return;
    }
    const submitAction = String(data.__submitAction || 'submit');
    const cleanData = { ...data };
    delete cleanData.__submitAction;
    const intelligence = evaluateDefectRecordIntelligence(cleanData, defects as ExtendedDefectLog[]);
    const rules = evaluateAdvancedDefectRules(cleanData, defects as ExtendedDefectLog[]);
    const missingFromRules = rules.requiredFields.filter((field) => {
      const value = cleanData[field];
      return value === null || value === undefined || String(value).trim() === '';
    });

    if (submitAction !== 'draft' && (intelligence.missingRequiredFields.length > 0 || missingFromRules.length > 0)) {
      toast.error('Required quality fields are missing', {
        description: `Complete before final save: ${[...intelligence.missingRequiredFields, ...missingFromRules].join(', ')}. You can save as draft if needed.`,
      });
      return;
    }

    try {
      const estimatedCost = Number(cleanData.estimatedCost || cleanData.totalCostPreview || 0);
      const snapshot = buildMasterDataSnapshot(cleanData);
      const approval = evaluateApprovalRequirement(cleanData, defects as ExtendedDefectLog[], workflowSettings);
      const ownerPatch = buildOwnerPatch({ ...cleanData, status: submitAction === 'draft' ? 'draft' : cleanData.status || 'logged' }, workflowSettings);
      const basePayload = {
        ...cleanData,
        ...rules.calculatedValues,
        ...snapshot,
        ...ownerPatch,
      };
      const existingAudit = editingDefect?.auditTrail || [];
      const fieldChanges = editingDefect
        ? changedFields(editingDefect as unknown as Record<string, unknown>, basePayload)
        : Object.keys(basePayload);
      const customFields = activeDesignerTemplate
        ? activeDesignerTemplate.fields.reduce((acc, field) => {
            if (!DEFECT_CORE_FIELD_KEYS.has(field.fieldKey) && cleanData[field.fieldKey] !== undefined) {
              acc[field.fieldKey] = cleanData[field.fieldKey];
            }
            return acc;
          }, { ...(editingDefect?.customFields || {}) } as Record<string, unknown>)
        : editingDefect?.customFields;
      const auditEntry: AuditEntry = {
        id: `audit-${Date.now()}`,
        action: editingDefect ? 'update' : 'create',
        timestamp: new Date().toISOString(),
        changedBy: userLabel(workflowUser),
        role: workflowUser.role,
        changedFields: fieldChanges,
        oldValue: editingDefect ? editingDefect as unknown as Record<string, unknown> : undefined,
        newValue: basePayload,
        reasonForChange: reasonForChange.trim() || undefined,
        previousStatus: editingDefect?.status,
        newStatus: String(basePayload.status || ''),
        permissionResult: 'allowed',
      };
      const payload = {
        ...basePayload,
        recordType: cleanData.recordType || 'process-ppm',
        quantity: Number(cleanData.quantity || 0),
        inspectedQuantity: Number(cleanData.inspectedQuantity || 0),
        productionQuantity: Number(cleanData.inspectedQuantity || cleanData.productionQuantity || 0),
        estimatedCost,
        releaseTimeHrs: Number(cleanData.releaseTimeHrs || 0),
        status: submitAction === 'draft' ? 'draft' : cleanData.status || 'logged',
        evidence: evidenceDraft,
        auditTrail: [...existingAudit, auditEntry],
        approvalRequired: rules.approvalRequired || approval.required,
        approvalReasons: [...new Set([...rules.approvalReasons, ...approval.reasons])],
        approvalRole: approval.requiredRole,
        approvalLevel: approval.label,
        reviewStatus: rules.approvalRequired || approval.required ? 'review-required' : 'not-required',
        assignedTo: editingDefect?.assignedTo || workflowUser.id,
        assignedRole: String(basePayload.assignedRole || workflowUser.role),
        currentOwner: String(basePayload.currentOwner || workflowUser.role),
        nextRequiredRole: String(basePayload.nextRequiredRole || approval.requiredRole),
        workflowSettingsVersion: String(workflowSettings.version),
        formTemplateId: activeDesignerTemplate?.id || editingDefect?.formTemplateId,
        formTemplateVersion: activeDesignerTemplate?.version || editingDefect?.formTemplateVersion,
        customFields,
      };
      if (editingDefect) {
        const updated = await unifiedDefectLogApi.update(editingDefect.id, payload as any);
        enqueueQualitySyncItem({
          entityType: 'defect-logs',
          entityId: editingDefect.id,
          operation: evidenceDraft.length > 0 ? 'add-evidence' : 'update',
          payloadSummary: `Defect record updated locally. Changed fields: ${fieldChanges.join(', ') || 'none'}. Evidence count: ${evidenceDraft.length}.`,
        });
        appendGlobalAudit(editingDefect.id, auditEntry);
        const fmeaSync = upsertFmeaFromDefectRisk(updated as DefectLogData, defects.map((record) => record.id === editingDefect.id ? (updated as DefectLogData) : record));
        setLastSavedImpact(fmeaSync.synced ? [...new Set([...intelligence.affectedModules, 'FMEA / RPN'])] : intelligence.affectedModules);
        toast.success('Log updated successfully', {
          description: `Record quality: ${intelligence.recordQuality}. ${rules.approvalRequired ? 'Supervisor review is suggested.' : 'No supervisor review requirement from current rules.'}${fmeaSync.synced ? ` FMEA RPN updated: ${fmeaSync.rpn}.` : ''}`,
        });
      } else {
        const created = await unifiedDefectLogApi.create(payload as any);
        enqueueQualitySyncItem({
          entityType: 'defect-logs',
          entityId: created.id,
          operation: evidenceDraft.length > 0 ? 'add-evidence' : 'create',
          payloadSummary: `Defect record created locally. Route: ${cleanData.recordType || 'process-ppm'}. Evidence count: ${evidenceDraft.length}.`,
        });
        appendGlobalAudit(created.id, auditEntry);
        
        // Fetch fresh data immediately to get the most accurate count
        const response = await unifiedDefectLogApi.getAll();
        const allDefects = response.data || [];
        const fmeaSync = upsertFmeaFromDefectRisk(created as DefectLogData, allDefects);
        setDefects(allDefects);

        const todayStr = new Date().toISOString().split('T')[0];
        const todayCount = allDefects.filter(d => {
          if (!d.date) return false;
          try {
            return new Date(d.date).toISOString().split('T')[0] === todayStr;
          } catch {
            return d.date.includes(todayStr);
          }
        }).length;

        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold text-white text-base">{submitAction === 'draft' ? 'Defect saved as draft' : 'Defect logged successfully'}</span>
            <span className="text-[#00A3E0] font-black text-lg">
              Total defects today ({new Date().toLocaleDateString()}): {todayCount}
            </span>
            <span className="text-white/60 text-xs">
              Route: {intelligence.routeLabel} | Quality: {intelligence.recordQuality}
            </span>
            {fmeaSync.synced && (
              <span className="text-amber-200 text-xs">
                FMEA / RPN updated: {fmeaSync.rpn} ({fmeaSync.riskLevel})
              </span>
            )}
          </div>,
          {
            duration: 5000,
            className: 'bg-[#1a1a25] border-[#0066CC] border-2',
          }
        );
        setLastSavedImpact(fmeaSync.synced ? [...new Set([...intelligence.affectedModules, 'FMEA / RPN'])] : intelligence.affectedModules);
      }
      setEditingAudit(null);
      setEvidenceDraft([]);
      setReasonForChange('');
      const nextValues = buildDefectTemplateValues(selectedTemplateId);
      setFormSeed(nextValues);
      setFormDraft(nextValues);
      setFormInstanceKey((key) => key + 1);
      if (editingDefect) await loadDefects();
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save log');
    }
  };

  const handleElevateToNCR = async (defect: DefectLogData, commentText = '') => {
    if (!hasDefectPermission(workflowUser, 'defect.elevateNcr')) {
      appendBlockedWorkflowAudit(defect, 'elevate-to-ncr', `${roleLabel(workflowUser.role)} cannot elevate defects to NCR.`);
      toast.error('NCR escalation blocked', { description: `${roleLabel(workflowUser.role)} cannot elevate defects to NCR.` });
      return;
    }
    try {
      const ncrData = {
        title: `NCR from Defect: ${defect.partNumber || defect.partId || defect.defectType || defect.id}`,
        description: `Defect Type: ${defect.defectType}\nQuantity: ${defect.quantity}\nLine: ${defect.productionLine}\nDescription: ${defect.description}`,
        priority: (defect.severity || 'major').toLowerCase(),
        source: 'Production',
        sourceDefectId: defect.id,
        plantId: 'MAIN-PLANT', // Default or from context
        status: 'open',
        detectedDate: defect.date
      };

      const newNcr = await unifiedNcrApi.create(ncrData);
      const auditEntry: AuditEntry = {
        id: `audit-${Date.now()}`,
        action: 'elevate-to-ncr',
        timestamp: new Date().toISOString(),
        changedBy: userLabel(workflowUser),
        role: workflowUser.role,
        changedFields: ['relatedNcrId', 'status'],
        oldValue: { relatedNcrId: defect.relatedNcrId, status: defect.status },
        newValue: { relatedNcrId: newNcr.id, status: 'escalated' },
        reasonForChange: commentText || 'Elevated from Defect Recorder',
        previousStatus: defect.status,
        newStatus: 'escalated',
        permissionResult: 'allowed',
      };
      const comments = [
        ...(((defect as unknown as { comments?: DefectLifecycleComment[] }).comments || [])),
        buildLifecycleComment(commentText || 'Elevated to NCR for quality verification.', 'escalation', userLabel(workflowUser)),
      ];
      
      // Update defect with related NCR ID
      const updated = await unifiedDefectLogApi.update(defect.id, {
        relatedNcrId: newNcr.id,
        status: 'escalated',
        escalatedAt: new Date().toISOString(),
        ...buildOwnerPatch({ ...defect, status: 'escalated' }, workflowSettings),
        comments,
        auditTrail: [...((defect.auditTrail || []) as unknown as AuditEntry[]), auditEntry],
      } as any);
      enqueueQualitySyncItem({
        entityType: 'defect-logs',
        entityId: defect.id,
        operation: 'elevate-to-ncr',
        payloadSummary: `Defect elevated to NCR ${newNcr.id}.`,
      });
      enqueueQualitySyncItem({
        entityType: 'ncr',
        entityId: String(newNcr.id || defect.relatedNcrId || defect.id),
        operation: 'create',
        payloadSummary: `NCR created from defect ${defect.id}.`,
      });
      appendGlobalAudit(defect.id, auditEntry);
      mergeDefectInState(updated);
      
      toast.success('Elevated to NCR', {
        description: `NCR created successfully for defect ${defect.partNumber}.`
      });
      
      loadDefects();
    } catch (err) {
      toast.error('Failed to create NCR');
    }
  };

  const handleCreateImprovementAction = async (defect: DefectLogData) => {
    const confirmed = window.confirm('Create a closed-loop improvement action from this defect record? You can edit the action later in the Command Center.');
    if (!confirmed) return;
    try {
      const action = createImprovementAction({
        ...prefillActionFromDefect(defect),
        status: 'open',
        description: 'Improvement action created from defect details. Verify scope, owner, due date, and before/after effectiveness window.',
      });
      const relatedActionIds = Array.from(new Set([...(defect.relatedActionIds || []), action.id]));
      const patch: Partial<DefectLogData> = {
        relatedActionIds,
        updatedAt: new Date().toISOString(),
        comments: [
          ...((defect.comments || []) as Record<string, unknown>[]),
          buildLifecycleComment(`Improvement action created: ${action.id}`, 'system', userLabel(workflowUser)) as unknown as Record<string, unknown>,
        ],
      };
      await unifiedDefectLogApi.update(defect.id, patch);
      appendGlobalAudit(defect.id, {
        id: `audit-${Date.now()}`,
        action: 'create-improvement-action',
        timestamp: new Date().toISOString(),
        changedBy: userLabel(workflowUser),
        role: workflowUser.role,
        changedFields: ['relatedActionIds'],
        oldValue: { relatedActionIds: defect.relatedActionIds || [] },
        newValue: { relatedActionIds },
        reasonForChange: 'Closed-loop improvement action created by user confirmation.',
        permissionResult: 'allowed',
      });
      enqueueQualitySyncItem({
        entityType: 'defect-logs',
        entityId: defect.id,
        operation: 'update',
        payloadSummary: `Linked improvement action ${action.id}`,
      });
      await loadDefects();
      setSelectedRecord((prev) => prev && prev.id === defect.id ? { ...prev, ...patch } : prev);
      toast.success('Improvement action created', {
        description: 'The action is now available in Quality Command Center > Improvement Effectiveness.',
      });
    } catch (error) {
      toast.error('Could not create improvement action', {
        description: error instanceof Error ? error.message : 'Local action register could not be updated.',
      });
    }
  };

  const handleCreateCAPA = async (defect: DefectLogData, commentText = '') => {
    if (!hasDefectPermission(workflowUser, 'defect.createCapa')) {
      appendBlockedWorkflowAudit(defect, 'create-capa', `${roleLabel(workflowUser.role)} cannot create CAPA from defect records.`);
      toast.error('CAPA creation blocked', { description: `${roleLabel(workflowUser.role)} cannot create CAPA from defect records.` });
      return;
    }
    try {
      const capaData = {
        title: `CAPA from Defect: ${defect.defectType || defect.id}`,
        description: `Defect Type: ${defect.defectType}\nQuantity: ${defect.quantity}\nLine: ${defect.productionLine}\nComment: ${commentText}`,
        priority: (defect.severity || 'major').toLowerCase(),
        capaType: 'corrective',
        sourceNcrId: defect.relatedNcrId,
        sourceDefectId: defect.id,
        plantId: 'MAIN-PLANT',
        status: 'open',
      };
      const capa = await unifiedCapaApi.create(capaData as any);
      enqueueQualitySyncItem({
        entityType: 'capa',
        entityId: String(capa.id || defect.relatedCapaId || defect.id),
        operation: 'create-capa',
        payloadSummary: `CAPA created from defect ${defect.id}.`,
      });
      const action = getAvailableWorkflowActions(defect).find((item) => item.id === 'create-capa') || {
        id: 'create-capa',
        label: 'Create CAPA',
        description: '',
      } as DefectWorkflowAction;
      await updateDefectRecord(defect, {
        relatedCapaId: capa.id,
        comments: undefined,
      } as any, 'create-capa', buildSystemComment(action, defect.status, userLabel(workflowUser), commentText || 'CAPA created from defect workflow.'));
      toast.success('CAPA linked', { description: 'CAPA was created and linked to the defect record.' });
      await loadDefects();
    } catch (error) {
      console.error('CAPA creation failed:', error);
      toast.error('Failed to create CAPA');
    }
  };

  const handleCreateEightD = async (defect: DefectLogData, commentText = '') => {
    if (!hasDefectPermission(workflowUser, 'defect.escalate8d')) {
      appendBlockedWorkflowAudit(defect, 'escalate-8d', `${roleLabel(workflowUser.role)} cannot escalate defects to 8D.`);
      toast.error('8D escalation blocked', { description: `${roleLabel(workflowUser.role)} cannot escalate defects to 8D.` });
      return;
    }
    try {
      const eightDData = {
        title: `8D from Defect: ${defect.defectType || defect.id}`,
        problemDescription: `Defect Type: ${defect.defectType}\nQuantity: ${defect.quantity}\nLine: ${defect.productionLine}\nComment: ${commentText}`,
        priority: (defect.severity || 'major').toLowerCase(),
        ncrReportId: defect.relatedNcrId,
        sourceDefectId: defect.id,
        plantId: 'MAIN-PLANT',
        status: 'open',
      };
      const eightD = await unifiedEightDApi.create(eightDData as any);
      enqueueQualitySyncItem({
        entityType: 'eight-d',
        entityId: String(eightD.id || defect.relatedEightDId || defect.id),
        operation: 'escalate-to-8d',
        payloadSummary: `8D created from defect ${defect.id}.`,
      });
      const action = getAvailableWorkflowActions(defect).find((item) => item.id === 'escalate-8d') || {
        id: 'escalate-8d',
        label: 'Escalate to 8D',
        description: '',
      } as DefectWorkflowAction;
      await updateDefectRecord(defect, {
        relatedEightDId: eightD.id,
        status: normalizeDefectLifecycleStatus(defect.status) === 'closed' ? defect.status : 'escalated',
        escalatedAt: defect.escalatedAt || new Date().toISOString(),
        ...buildOwnerPatch({ ...defect, status: 'escalated' }, workflowSettings),
      } as any, 'escalate-8d', buildSystemComment(action, 'escalated', userLabel(workflowUser), commentText || '8D investigation created from defect workflow.'));
      toast.success('8D linked', { description: '8D record was created and linked to the defect record.' });
      await loadDefects();
    } catch (error) {
      console.error('8D creation failed:', error);
      toast.error('Failed to create 8D');
    }
  };

  const columns = [
    { 
      key: 'date',
      title: 'Date', 
      render: (item: DefectLogData) => {
        if (!item.date) return '---';
        try {
          const d = new Date(item.date);
          return isNaN(d.getTime()) ? <span className="text-white/40">{item.date}</span> : <span className="font-bold text-[#00A3E0]">{d.toLocaleDateString()}</span>;
        } catch (e) {
          return <span className="text-white/40">{item.date || '---'}</span>;
        }
      }
    },
    { key: 'recordType', title: 'Routes To', render: (item: DefectLogData) => {
      const type = getDefectRecordType(item);
      const labels: Record<string, string> = {
        'process-ppm': 'Process PPM',
        'defect-cost': 'Defect Cost',
        'outgoing-quality': 'Outgoing',
        'customer-return': 'Return',
      };
      return <span className="px-2 py-1 rounded bg-[#0066CC]/10 text-[#00A3E0] text-[10px] font-black uppercase tracking-widest border border-[#0066CC]/20">{labels[type] || type}</span>;
    } },
    { key: 'shift', title: 'Shift', render: (item: any) => <span className="font-medium text-white/80">{item.shift || '---'}</span> },
    { key: 'productionLine', title: 'Line', render: (item: any) => <span className="px-2 py-1 rounded bg-white/5 text-xs font-bold text-white/60 border border-white/5">{item.productionLine || '---'}</span> },
    { key: 'partId', title: 'Part ID', render: (item: any) => <span className="font-mono text-[10px] text-amber-400/80 bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/10">{item.partId || '---'}</span> },
    { key: 'partNumber', title: 'Part Name', render: (item: any) => <span className="font-bold text-white tracking-tight">{item.partNumber || '---'}</span> },
    { key: 'defectType', title: 'Type', render: (item: any) => <span className="text-xs font-black uppercase tracking-widest text-white/40">{item.defectType || '---'}</span> },
    { key: 'quantity', title: 'Qty', render: (item: any) => <span className="text-lg font-black text-white">{item.quantity || 0}</span> },
    { key: 'inspectedQuantity', title: 'Inspected', render: (item: any) => <span className="text-sm font-bold text-white/70">{item.inspectedQuantity || 0}</span> },
    { key: 'estimatedCost', title: 'Cost', render: (item: any) => <span className="text-sm font-bold text-emerald-400">{item.estimatedCost ? `$${Number(item.estimatedCost).toLocaleString()}` : '$0'}</span> },
    { 
      key: 'severity',
      title: 'Severity', 
      render: (item: DefectLogData) => (
        <PriorityBadge 
          priority={item.severity} 
        />
      )
    },
    { key: 'description', title: 'Description', render: (item: any) => <span className="text-xs text-white/40 italic line-clamp-1 max-w-[150px]">{item.description || '---'}</span> },
    { key: 'operatorName', title: 'Operator', render: (item: any) => <span className="text-xs font-medium text-white/60">{item.operatorName || '---'}</span> },
    { key: 'actionTaken', title: 'Action', render: (item: any) => <span className="text-[10px] font-bold text-[#00A3E0] uppercase tracking-tighter">{item.actionTaken || '---'}</span> },
    { key: 'currentOwner', title: 'Owner', render: (item: DefectLogData) => <span className="text-[10px] font-black text-white/60 uppercase">{String(item.currentOwner || item.assignedRole || '---').replace(/_/g, ' ')}</span> },
    { key: 'slaStatus', title: 'SLA', render: (item: DefectLogData) => {
      const sla = buildGovernedSlaStatus(item, workflowSettings);
      return (
        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
          sla.status === 'overdue'
            ? 'bg-red-400/15 text-red-200'
            : sla.status === 'warning'
              ? 'bg-amber-400/15 text-amber-200'
              : 'bg-emerald-400/10 text-emerald-200'
        }`}>
          {sla.label}
        </span>
      );
    } },
    { 
      key: 'status',
      title: 'Status', 
      render: (item: DefectLogData) => <StatusBadge status={item.status || 'open'} />
    }
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="Daily Defect Recorder" 
        subtitle="Recording and monitoring of daily production quality issues"
      />

      <StatsBar stats={stats} />

      <PageSection>
        <Tabs value={activeTab} onValueChange={setActiveSetId} className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <TabsList className="bg-white/5 border border-white/10 p-1 w-full sm:w-auto overflow-x-auto no-scrollbar justify-start">
                <TabsTrigger 
                  value="entry" 
                  className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white flex items-center gap-2 px-4 md:px-6 py-2 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="whitespace-nowrap">{editingDefect ? 'Edit Entry' : 'New Entry'}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="records" 
                  className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white flex items-center gap-2 px-4 md:px-6 py-2 shrink-0"
                >
                  <History className="w-4 h-4" />
                  <span className="whitespace-nowrap">Defect Records</span>
                </TabsTrigger>
                {!isLiteMode && (
                  <>
                    <TabsTrigger
                      value="details"
                      className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white flex items-center gap-2 px-4 md:px-6 py-2 shrink-0"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="whitespace-nowrap">Lifecycle Details</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="workflow"
                      className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white flex items-center gap-2 px-4 md:px-6 py-2 shrink-0"
                    >
                      <Workflow className="w-4 h-4" />
                      <span className="whitespace-nowrap">Workflow Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="tasks"
                      className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white flex items-center gap-2 px-4 md:px-6 py-2 shrink-0"
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span className="whitespace-nowrap">My Tasks</span>
                      {unreadWorkflowNotifications > 0 && (
                        <span className="ml-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-black">{unreadWorkflowNotifications}</span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="governance"
                      className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white flex items-center gap-2 px-4 md:px-6 py-2 shrink-0"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span className="whitespace-nowrap">Governance Settings</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analytics" 
                      className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white flex items-center gap-2 px-4 md:px-6 py-2 shrink-0"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className="whitespace-nowrap">Pareto Analysis</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
 
              {!isLiteMode && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                    <UserCog className="w-4 h-4 text-[#00A3E0]" />
                    <select
                      value={workflowRole}
                      onChange={(event) => handleWorkflowRoleChange(event.target.value as QualityWorkflowRole)}
                      className="bg-transparent text-white text-xs font-bold outline-none"
                      title="Local workflow role for permission simulation"
                    >
                      {QUALITY_WORKFLOW_ROLES.map((role) => (
                        <option key={role} value={role} className="bg-slate-900">
                          {roleLabel(role)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleImportExcel}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!hasDefectPermission(workflowUser, 'masterData.edit')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/60 rounded-lg border border-white/10 hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-wider shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={hasDefectPermission(workflowUser, 'masterData.edit') ? 'Import part master data from Excel' : 'Requires master data edit permission'}
                  >
                    <Database className="w-4 h-4" />
                    Import Parts
                  </button>
                </div>
              )}
            </div>

            {activeTab === 'records' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button 
                  onClick={handleExportExcel}
                  disabled={!hasDefectPermission(workflowUser, 'records.export')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/60 rounded-lg border border-white/10 hover:bg-white/10 transition-all font-bold text-sm shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={hasDefectPermission(workflowUser, 'records.export') ? 'Export records to Excel' : 'Requires export permission'}
                >
                  <Download className="w-4 h-4" />
                  Export to Excel
                </button>
                <button 
                  onClick={handleNewEntry}
                  disabled={!hasDefectPermission(workflowUser, 'defect.create')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0066CC]/20 text-[#00A3E0] rounded-lg border border-[#0066CC]/30 hover:bg-[#0066CC]/30 transition-all font-bold text-sm shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={hasDefectPermission(workflowUser, 'defect.create') ? 'Create a new defect record' : 'Requires create defect permission'}
                >
                  <PlusCircle className="w-4 h-4" />
                  New Entry
                </button>
                <Link
                  to="/quality-shopfloor"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 text-emerald-200 rounded-lg border border-emerald-400/20 hover:bg-emerald-500/25 transition-all font-bold text-sm shrink-0"
                  title="Open mobile-first shopfloor defect entry"
                >
                  <Smartphone className="w-4 h-4" />
                  Shopfloor Entry
                </Link>
                <Link
                  to="/quality-inspection-plans"
                  className="flex items-center gap-2 px-4 py-2 bg-teal-500/15 text-teal-200 rounded-lg border border-teal-400/20 hover:bg-teal-500/25 transition-all font-bold text-sm shrink-0"
                  title="Open inspection plan and checksheet builder"
                >
                  <ClipboardList className="w-4 h-4" />
                  Inspection Plans
                </Link>
              </div>
            )}
          </div>

          <TabsContent value="entry" className="mt-0 focus-visible:outline-none">
            <div className={`grid grid-cols-1 ${isLiteMode ? '' : 'xl:grid-cols-[minmax(0,1fr)_360px]'} gap-6 items-start`}>
              <div className="glass-panel p-5 md:p-8 rounded-2xl border border-white/10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-[#0066CC]/20 border border-[#0066CC]/30">
                      <FileText className="w-6 h-6 text-[#00A3E0]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">
                        {editingDefect ? 'Update Defect Information' : 'Smart Defect Registration'}
                      </h3>
                      <p className="text-sm text-white/40">Use a template, scan the part, and let the record route itself to the correct dashboards.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedTemplateId}
                      onChange={(event) => applyTemplate(event.target.value as DefectFormTemplateId)}
                      className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold min-w-[240px]"
                      title="Choose a defect recorder template"
                    >
                      {templates.map((template) => (
                        <option key={template.id} value={template.id} className="bg-slate-900">
                          {template.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleDuplicatePrevious}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 text-white/70 rounded-xl border border-white/10 hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-wider"
                      title="Duplicate the latest saved record"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 text-white/70 rounded-xl border border-white/10 hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-wider"
                      title="Reset the current form"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                  </div>
                </div>

                <div className="mb-6 rounded-2xl border border-[#0066CC]/20 bg-[#0066CC]/10 p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-[#00A3E0]">Active Template</p>
                      <h4 className="text-lg font-black text-white mt-1">{activeDesignerTemplate?.name || selectedTemplate.name}</h4>
                      <p className="text-sm text-white/50 mt-1">
                        {activeDesignerTemplate
                          ? `Dynamic designer template v${activeDesignerTemplate.version} is active for this record context.`
                          : selectedTemplate.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeDesignerTemplate && (
                        <span className="px-3 py-1 rounded-full bg-violet-500/15 border border-violet-400/20 text-[10px] font-black uppercase tracking-wider text-violet-200">
                          UI Designer Active
                        </span>
                      )}
                      {selectedTemplate.dashboardImpact.map((impact) => (
                        <span key={impact} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white/70">
                          {impact}
                        </span>
                      ))}
                      <Link
                        to="/quality-form-designer"
                        className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white/70 hover:bg-white/10"
                      >
                        Form Designer
                      </Link>
                    </div>
                  </div>
                </div>

                <DynamicFormRenderer
                  key={`${formInstanceKey}-${editingDefect?.id || 'new'}`}
                  formType="defect-log"
                  initialValues={formSeed}
                  qualityTemplateContext={{
                    entityType: 'defect-log',
                    recordType: String(formDraft.recordType || formSeed.recordType || selectedTemplate.defaultValues.recordType || ''),
                    role: workflowUser.role,
                    mode: editingDefect ? 'edit' : 'create',
                    line: String(formDraft.productionLine || formSeed.productionLine || ''),
                    model: String(formDraft.model || formSeed.model || ''),
                  }}
                  onChange={(values) => setFormDraft(values)}
                  onSubmit={handleFormSubmit}
                  submitLabel={editingDefect ? 'Update Log' : 'Quick Save Record'}
                  submitActions={[
                    {
                      id: 'draft',
                      label: 'Save Draft',
                      value: 'draft',
                      description: 'Save partial information without final routing completeness.',
                    },
                  ]}
                />
              </div>

              {!isLiteMode && (
                <div className="space-y-6 xl:sticky xl:top-6">
                  <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-xl bg-[#00A3E0]/10 border border-[#00A3E0]/20">
                      <Brain className="w-5 h-5 text-[#00A3E0]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Record Intelligence</h3>
                      <p className="text-xs text-white/40">Decision-support preview before save</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Route className="w-4 h-4 text-[#00A3E0]" />
                          <span className="text-xs font-black uppercase tracking-widest text-white/40">Routes To</span>
                        </div>
                        <span className="text-sm font-black text-[#00A3E0]">{recordIntelligence.routeLabel}</span>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-white/50">{recordIntelligence.managementNote}</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-widest text-white/40">Master Data</span>
                        <span className={recordIntelligence.masterDataMatchStatus.includes('No') ? 'text-xs font-black text-amber-300' : 'text-xs font-black text-emerald-300'}>
                          {recordIntelligence.masterDataMatchStatus}
                        </span>
                      </div>
                      <p className="text-xs text-white/50">{recordIntelligence.snapshotStatus}</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-widest text-white/40">Record Quality</span>
                        <span className={`text-sm font-black ${recordIntelligence.recordQuality === 'Ready' ? 'text-emerald-400' : recordIntelligence.recordQuality === 'Partial' ? 'text-amber-400' : 'text-red-400'}`}>
                          {recordIntelligence.recordQuality}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#0066CC] to-[#00A3E0]"
                          style={{ width: `${recordIntelligence.recordQualityScore}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-white/50">{recordIntelligence.recordQualityScore}% complete for reliable routing.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <Gauge className="w-4 h-4 text-[#00A3E0] mb-2" />
                        <span className="block text-[10px] text-white/40 font-black uppercase">PPM</span>
                        <span className="text-lg font-black text-white">{compactNumber(recordIntelligence.ppmPreview)}</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <DollarSign className="w-4 h-4 text-emerald-400 mb-2" />
                        <span className="block text-[10px] text-white/40 font-black uppercase">COPQ</span>
                        <span className="text-lg font-black text-white">${compactNumber(recordIntelligence.copqPreview)}</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <Truck className="w-4 h-4 text-amber-400 mb-2" />
                        <span className="block text-[10px] text-white/40 font-black uppercase">Outgoing</span>
                        <span className="text-xs font-bold text-white/70">{recordIntelligence.outgoingImpact}</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <Sparkles className="w-4 h-4 text-purple-300 mb-2" />
                        <span className="block text-[10px] text-white/40 font-black uppercase">Prediction</span>
                        <span className="text-xs font-bold text-white/70">{recordIntelligence.predictionReady ? 'Training ready' : 'Needs fields'}</span>
                      </div>
                    </div>

                    {recordIntelligence.missingRequiredFields.length > 0 && (
                      <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-black uppercase tracking-widest text-amber-300">Missing Required Fields</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recordIntelligence.missingRequiredFields.map((field) => (
                            <span key={field} className="px-2 py-1 rounded bg-black/20 text-[10px] font-bold text-amber-100">
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {recordIntelligence.warnings.map((warning) => (
                      <div key={warning} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
                        {warning}
                      </div>
                    ))}

                    {recordIntelligence.repeatedDefectWarning && (
                      <div className={`rounded-xl border p-3 text-xs ${advancedRules.repeatedDefect.repeated ? 'border-amber-400/20 bg-amber-400/10 text-amber-100' : 'border-white/10 bg-white/5 text-white/50'}`}>
                        {recordIntelligence.repeatedDefectWarning}
                      </div>
                    )}

                    <div className={`rounded-xl border p-4 ${recordIntelligence.ncrSuggested ? 'border-amber-400/25 bg-amber-400/10' : 'border-emerald-400/20 bg-emerald-400/10'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className={`w-4 h-4 ${recordIntelligence.ncrSuggested ? 'text-amber-300' : 'text-emerald-300'}`} />
                        <span className={`text-xs font-black uppercase tracking-widest ${recordIntelligence.ncrSuggested ? 'text-amber-200' : 'text-emerald-200'}`}>
                          {recordIntelligence.ncrSuggested ? 'NCR Suggested' : 'NCR Not Suggested'}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{recordIntelligence.ncrReason}</p>
                    </div>

                    <div className={`rounded-xl border p-4 ${fmeaRiskPreview.shouldSync ? 'border-red-400/25 bg-red-400/10' : 'border-white/10 bg-white/5'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Gauge className={`w-4 h-4 ${fmeaRiskPreview.shouldSync ? 'text-red-300' : 'text-white/40'}`} />
                          <span className={`text-xs font-black uppercase tracking-widest ${fmeaRiskPreview.shouldSync ? 'text-red-200' : 'text-white/40'}`}>
                            FMEA / RPN
                          </span>
                        </div>
                        <span className={`text-sm font-black ${fmeaRiskPreview.rpn >= 100 ? 'text-red-200' : fmeaRiskPreview.rpn >= 50 ? 'text-amber-200' : 'text-emerald-200'}`}>
                          {fmeaRiskPreview.rpn}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-white/60 leading-relaxed">
                        {fmeaRiskPreview.shouldSync
                          ? `Will create/update an FMEA review signal after save. ${fmeaRiskPreview.reason}`
                          : `No automatic FMEA review signal yet. ${fmeaRiskPreview.reason}`}
                      </p>
                      <p className="mt-2 text-[11px] text-white/40">
                        S{fmeaRiskPreview.severityScore} x O{fmeaRiskPreview.occurrenceScore} x D{fmeaRiskPreview.detectionScore} - {fmeaRiskPreview.riskLevel}
                      </p>
                    </div>

                    <div className={`rounded-xl border p-4 ${recordIntelligence.approvalRequired ? 'border-purple-300/25 bg-purple-300/10' : 'border-white/10 bg-white/5'}`}>
                      <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Approval / Review</p>
                      <p className="text-xs text-white/60 leading-relaxed">
                        {recordIntelligence.approvalRequired
                          ? `Supervisor review is suggested: ${recordIntelligence.approvalReasons.join(' ')}`
                          : 'No supervisor review requirement from current rules. Continue standard verification.'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Suggested Next Action</p>
                      <p className="text-xs text-white/60 leading-relaxed">{recordIntelligence.suggestedNextAction}</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-widest text-white/40">Evidence</p>
                        <span className="text-xs font-black text-[#00A3E0]">{evidenceDraft.length}</span>
                      </div>
                      <input
                        ref={evidenceInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleEvidenceFiles}
                      />
                      <button
                        type="button"
                        onClick={() => evidenceInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs font-bold hover:bg-white/10"
                      >
                        <Upload className="w-4 h-4" />
                        Attach Evidence
                      </button>
                      <div className="flex gap-2">
                        <input
                          value={evidenceNote}
                          onChange={(event) => setEvidenceNote(event.target.value)}
                          placeholder="Short evidence note..."
                          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                        />
                        <button type="button" onClick={addEvidenceNote} className="px-3 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-bold">Add</button>
                      </div>
                      {evidenceDraft.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-black/10 p-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{item.name}</p>
                            <p className="text-[10px] text-white/40">{Math.round(item.size / 1024)} KB | {item.storedLocally ? 'stored locally' : 'metadata only'}</p>
                            {item.warning && <p className="text-[10px] text-amber-300 mt-1">{item.warning}</p>}
                          </div>
                          <button type="button" onClick={() => removeEvidence(item.id)} className="p-1 text-white/40 hover:text-red-300">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {editingDefect && (
                      <label className="block rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-white/40">Reason For Change</span>
                        <textarea
                          value={reasonForChange}
                          onChange={(event) => setReasonForChange(event.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg bg-black/10 border border-white/10 text-white text-xs"
                          placeholder="Optional reason for audit trail..."
                        />
                      </label>
                    )}

                    {lastSavedImpact.length > 0 && (
                      <div className="rounded-xl border border-[#00A3E0]/20 bg-[#00A3E0]/10 p-4">
                        <p className="text-xs font-black uppercase tracking-widest text-[#00A3E0] mb-2">Last Save Updated</p>
                        <div className="flex flex-wrap gap-2">
                          {lastSavedImpact.map((impact) => (
                            <span key={impact} className="px-2 py-1 rounded bg-white/10 text-[10px] font-bold text-white/70">
                              {impact}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <History className="w-5 h-5 text-[#00A3E0]" />
                    <h3 className="text-lg font-black text-white">Recent Records</h3>
                  </div>
                  {recentRecords.length === 0 ? (
                    <QualityGuidedEmptyState
                      title="No registered defects yet"
                      purpose="Defect records feed Process PPM, COPQ, Outgoing Quality, SPC, Defect Prediction, workflow, and the Command Center."
                      firstAction="Save the first real defect record or start from Shopfloor Entry if the issue came from an inspection check."
                      actionHref="/quality-shopfloor"
                      actionLabel="Open Shopfloor Entry"
                    />
                  ) : (
                    <div className="space-y-3">
                      {recentRecords.map((record) => (
                        <button
                          key={record.id}
                          type="button"
                          onClick={() => handleEdit(record)}
                          className="w-full text-left rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-white line-clamp-1">{record.defectType || 'Defect record'}</span>
                            <span className="text-[10px] font-black text-[#00A3E0] uppercase">{getDefectRecordType(record)}</span>
                          </div>
                          <p className="mt-1 text-xs text-white/40 line-clamp-1">
                            {record.partId || record.partNumber || 'No part'} | Qty {record.quantity || 0}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

          <TabsContent value="records" className="mt-0 focus-visible:outline-none">
            <div className="glass-panel rounded-2xl border border-white/10">
              <div className="p-1 overflow-x-auto">
                {isLoading ? (
                  <SectionLoader message="Syncing with industrial records..." />
                ) : (
                  <DataTable 
                    data={defects} 
                    columns={columns} 
                    keyExtractor={(item: DefectLogData) => item.id}
                    onRowClick={openRecordDetails}
                    actions={(item: DefectLogData) => (
                      <div className="flex items-center gap-2">
                        {!isLiteMode && !item.relatedNcrId && hasDefectPermission(workflowUser, 'defect.elevateNcr') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleElevateToNCR(item);
                            }}
                            className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all"
                            title="Elevate to NCR"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }} 
                          disabled={!hasDefectPermission(workflowUser, 'defect.edit')}
                          className="p-2 text-gray-400 hover:text-[#00A3E0] hover:bg-[#00A3E0]/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          title={hasDefectPermission(workflowUser, 'defect.edit') ? 'Edit Record' : 'Requires edit defect permission'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                      </div>
                    )}
                  />
                )}
              </div>
            </div>
            {selectedRecord && (
              <div className="mt-6 glass-panel p-6 rounded-2xl border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-xl font-black text-white">Defect Record Details</h3>
                    <p className="text-sm text-white/40">
                      {selectedRecord.defectType || 'Defect'} | {selectedRecord.partId || selectedRecord.partNumber || 'No part'} | {selectedRecord.id}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(selectedRecord)}
                      disabled={!hasDefectPermission(workflowUser, 'defect.edit')}
                      className="px-4 py-2 rounded-xl bg-[#0066CC]/20 border border-[#0066CC]/30 text-[#00A3E0] text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      title={hasDefectPermission(workflowUser, 'defect.edit') ? 'Edit this record' : 'Requires edit defect permission'}
                    >
                      Edit
                    </button>
                    {!isLiteMode && (
                      <button
                        type="button"
                        onClick={() => handleCreateImprovementAction(selectedRecord)}
                        className="px-4 py-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-200 text-sm font-bold"
                      >
                        Create Action
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(null)}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-bold"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Master Data Snapshot</p>
                    {[
                      ['Part Name', selectedRecord.partNameAtTime],
                      ['Supplier', selectedRecord.supplierNameAtTime],
                      ['Unit Cost', selectedRecord.unitCostAtTime],
                      ['Defect Category', selectedRecord.defectCategoryAtTime],
                      ['Model Family', selectedRecord.modelFamilyAtTime],
                      ['Line', selectedRecord.productionLineAtTime],
                      ['Version', selectedRecord.masterDataVersion],
                    ].map(([label, value]) => (
                      <div key={label as string} className="flex justify-between gap-3 py-1 text-xs">
                        <span className="text-white/40">{label as string}</span>
                        <span className="text-white/70 text-right truncate">{String(value || '---')}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Evidence</p>
                    {Array.isArray(selectedRecord.evidence) && selectedRecord.evidence.length > 0 ? (
                      <div className="space-y-2">
                        {(selectedRecord.evidence as unknown as EvidenceAttachment[]).map((item) => (
                          <div key={item.id} className="rounded-lg bg-black/10 border border-white/10 p-2">
                            <p className="text-xs font-bold text-white truncate">{item.name}</p>
                            <p className="text-[10px] text-white/40">{item.kind} | {Math.round(item.size / 1024)} KB | {item.storedLocally ? 'stored locally' : 'metadata only'}</p>
                            {item.note && <p className="text-xs text-white/60 mt-1">{item.note}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/30">No evidence attached.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Audit Trail</p>
                    {selectedRecordAudit.length > 0 ? (
                      <div className="space-y-2 max-h-72 overflow-auto pr-1">
                        {selectedRecordAudit.slice().reverse().map((entry) => (
                          <div key={entry.id} className="rounded-lg bg-black/10 border border-white/10 p-2">
                            <div className="flex justify-between gap-3">
                              <p className="text-xs font-black text-white uppercase">{entry.action}</p>
                              <p className="text-[10px] text-white/40">{new Date(entry.timestamp).toLocaleString()}</p>
                            </div>
                            <p className="text-[10px] text-white/40 mt-1">By {entry.changedBy} | {entry.changedFields.join(', ')}</p>
                            {entry.reasonForChange && <p className="text-xs text-white/60 mt-1">{entry.reasonForChange}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/30">No audit entries yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="details" className="mt-0 focus-visible:outline-none">
            {!selectedRecord ? (
              <div className="h-96 flex flex-col items-center justify-center glass-panel rounded-2xl border border-white/10 text-center">
                <FileText className="w-12 h-12 text-white/10 mb-4" />
                <h3 className="text-xl font-black text-white/30">No defect selected</h3>
                <p className="text-sm text-white/20 mt-2">Open a record from Defect Records to view its lifecycle workflow.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <StatusBadge status={selectedRecord.status || 'logged'} />
                        <span className="px-2 py-1 rounded bg-[#0066CC]/10 text-[#00A3E0] text-[10px] font-black uppercase">
                          {getDefectRecordType(selectedRecord)}
                        </span>
                        {selectedRecord.approvalRequired && (
                          <span className="px-2 py-1 rounded bg-purple-400/10 text-purple-200 text-[10px] font-black uppercase">Review Required</span>
                        )}
                      </div>
                      <h3 className="text-2xl font-black text-white">{selectedRecord.defectType || 'Defect lifecycle record'}</h3>
                      <p className="text-sm text-white/40 mt-1">
                        {selectedRecord.partId || selectedRecord.partNumber || 'No part'} | {selectedRecord.productionLine || 'No line'} | {selectedRecord.date || 'No date'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(selectedRecord)}
                        disabled={!hasDefectPermission(workflowUser, 'defect.edit')}
                        className="px-4 py-2 rounded-xl bg-[#0066CC]/20 border border-[#0066CC]/30 text-[#00A3E0] text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                        title={hasDefectPermission(workflowUser, 'defect.edit') ? 'Edit this record' : 'Requires edit defect permission'}
                      >
                        Edit Record
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateImprovementAction(selectedRecord)}
                        className="px-4 py-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-200 text-sm font-bold"
                      >
                        Create Improvement Action
                      </button>
                      <button
                        type="button"
                        onClick={closeDetails}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-bold"
                      >
                        Back to List
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    {[
                      ['Quantity', selectedRecord.quantity || 0],
                      ['Cost', `$${Number(selectedRecord.estimatedCost || 0).toLocaleString()}`],
                      ['Severity', selectedRecord.severity || '---'],
                      ['Prediction', selectedRecord.defectType ? 'Training ready' : 'Needs defect type'],
                    ].map(([label, value]) => (
                      <div key={label as string} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs text-white/40 uppercase font-black">{label as string}</p>
                        <p className="text-xl font-black text-white mt-1">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    {[
                      ['Current Owner', selectedRecord.currentOwner || selectedRecord.assignedRole || '---'],
                      ['Next Required Role', selectedRecord.nextRequiredRole || selectedRecordApproval?.requiredRole || '---'],
                      ['Approval', selectedRecordApproval?.label || 'Standard quality review'],
                      ['SLA Status', selectedRecordGovernedSla?.label || '---'],
                    ].map(([label, value]) => (
                      <div key={label as string} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs text-white/40 uppercase font-black">{label as string}</p>
                        <p className="text-sm font-black text-white mt-1">{String(value).replace(/_/g, ' ')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
                  <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3 mb-5">
                        <PlayCircle className="w-5 h-5 text-[#00A3E0]" />
                        <h3 className="text-xl font-black text-white">Workflow Actions</h3>
                      </div>
                      <textarea
                        value={workflowComment}
                        onChange={(event) => setWorkflowComment(event.target.value)}
                        rows={3}
                        placeholder="Workflow comment or reason. Required for review/rejection/escalation/closure actions."
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm mb-4"
                      />
                      <div className="flex flex-wrap gap-2">
                        {getAvailableWorkflowActions(selectedRecord).map((action) => {
                          const access = evaluateWorkflowActionAccess(selectedRecord, action, workflowUser, workflowSettings);
                          return (
                            <button
                              key={action.id}
                              type="button"
                              onClick={() => runWorkflowAction(selectedRecord, action)}
                              disabled={!access.allowed}
                              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-bold hover:bg-[#0066CC]/20 hover:text-[#00A3E0] disabled:opacity-35 disabled:cursor-not-allowed"
                              title={access.allowed ? action.description : access.reason}
                            >
                              {!access.allowed && <Lock className="inline w-3 h-3 mr-1" />}
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-white/40 mt-4">
                        Actions are controlled by role, configured transitions, approval rules, evidence requirements, and the safe lifecycle state machine.
                      </p>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3 mb-5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-xl font-black text-white">Action Tracking</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          ['containmentAction', 'Containment Action', 'textarea'],
                          ['correction', 'Correction', 'textarea'],
                          ['correctiveAction', 'Corrective Action', 'textarea'],
                          ['preventiveAction', 'Preventive Action', 'textarea'],
                          ['responsiblePerson', 'Responsible Person', 'text'],
                          ['dueDate', 'Due Date', 'date'],
                          ['verificationResult', 'Verification Result', 'textarea'],
                          ['verifiedBy', 'Verified By', 'text'],
                        ].map(([key, label, type]) => (
                          <label key={key} className={type === 'textarea' ? 'md:col-span-2 space-y-2' : 'space-y-2'}>
                            <span className="text-xs font-black uppercase tracking-widest text-white/40">{label}</span>
                            {type === 'textarea' ? (
                              <textarea
                                value={String((actionDraft as Record<string, unknown>)[key] || '')}
                                onChange={(event) => setActionDraft((prev) => ({ ...prev, [key]: event.target.value }))}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                              />
                            ) : (
                              <input
                                type={type}
                                value={String((actionDraft as Record<string, unknown>)[key] || '')}
                                onChange={(event) => setActionDraft((prev) => ({ ...prev, [key]: event.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                              />
                            )}
                          </label>
                        ))}
                        <label className="space-y-2">
                          <span className="text-xs font-black uppercase tracking-widest text-white/40">Action Status</span>
                          <select
                            value={actionDraft.actionStatus || 'not-started'}
                            onChange={(event) => setActionDraft((prev) => ({ ...prev, actionStatus: event.target.value as DefectActionTracking['actionStatus'] }))}
                            className="w-full px-4 py-3 rounded-xl bg-[#1a1a1f] border border-white/10 text-white text-sm"
                          >
                            <option value="not-started">Not Started</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="verified">Verified</option>
                          </select>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={saveActionTracking}
                        className="mt-5 px-5 py-3 rounded-xl bg-[#0066CC] text-white text-sm font-black hover:bg-[#0052a3]"
                      >
                        Save Action Tracking
                      </button>
                    </div>

                    <QualityRelationshipManager
                      currentType="defect"
                      currentId={selectedRecord.id}
                      currentLabel={`Defect ${selectedRecord.defectType || selectedRecord.id}`}
                      canManage={hasDefectPermission(workflowUser, 'defect.edit')}
                      disabledReason="Requires edit defect permission to link or unlink quality records."
                      records={{
                        defects,
                      }}
                      onChanged={loadDefects}
                    />

                    <QualityKnowledgeSuggestions
                      context={buildKnowledgeContextFromDefect(selectedRecord)}
                      title="Related Lessons Learned"
                      canApply={hasDefectPermission(workflowUser, 'defect.edit')}
                    />

                    <div className="glass-panel p-6 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3 mb-5">
                        <ClipboardList className="w-5 h-5 text-[#00A3E0]" />
                        <h3 className="text-xl font-black text-white">Related Inspection Check</h3>
                      </div>
                      {selectedInspectionContext?.plan || selectedRecord.relatedInspectionPlanId ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {[
                            ['Inspection Plan', selectedInspectionContext?.plan?.planName || selectedRecord.relatedInspectionPlanId],
                            ['Plan Version', selectedInspectionContext?.plan?.version || selectedRecord.relatedInspectionPlanVersion],
                            ['Check Item', selectedInspectionContext?.check ? `${selectedInspectionContext.check.checkCode} / ${selectedInspectionContext.check.checkName}` : selectedRecord.relatedCheckItemId],
                            ['Inspection Result', selectedInspectionContext?.result?.result || '---'],
                            ['Measured Value', selectedInspectionContext?.result?.measuredValue || '---'],
                            ['Inspection Run', selectedInspectionContext?.run?.id || selectedRecord.relatedInspectionRunId],
                          ].map(([label, value]) => {
                            const labelText = String(label);
                            return (
                              <div key={labelText} className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-xs font-black uppercase tracking-widest text-white/40">{labelText}</p>
                                <p className="mt-1 text-white/75">{String(value || '---')}</p>
                              </div>
                            );
                          })}
                          {selectedInspectionContext?.check?.acceptanceCriteria && (
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3 md:col-span-2">
                              <p className="text-xs font-black uppercase tracking-widest text-white/40">Acceptance Criteria</p>
                              <p className="mt-1 text-white/75">{selectedInspectionContext.check.acceptanceCriteria}</p>
                            </div>
                          )}
                          {selectedInspectionContext?.result?.notes && (
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3 md:col-span-2">
                              <p className="text-xs font-black uppercase tracking-widest text-white/40">Inspector Notes</p>
                              <p className="mt-1 text-white/75">{String(selectedInspectionContext.result.notes)}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-white/10 bg-black/10 p-5 text-sm text-white/35">
                          This defect is not linked to an inspection plan or failed check.
                        </div>
                      )}
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3 mb-5">
                        <MessageSquare className="w-5 h-5 text-[#00A3E0]" />
                        <h3 className="text-xl font-black text-white">Comments & Activity Timeline</h3>
                      </div>
                      <div className="flex flex-col md:flex-row gap-2 mb-5">
                        <input
                          value={newComment}
                          onChange={(event) => setNewComment(event.target.value)}
                          placeholder="Add a lifecycle comment..."
                          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={addRecordComment}
                          className="px-5 py-3 rounded-xl bg-[#0066CC] text-white text-sm font-black"
                        >
                          Add Comment
                        </button>
                      </div>
                      <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                        {selectedRecordTimeline.length === 0 ? (
                          <p className="text-sm text-white/30">No lifecycle activity yet.</p>
                        ) : selectedRecordTimeline.map((item) => (
                          <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <span className="text-xs font-black uppercase tracking-widest text-[#00A3E0]">{item.type}</span>
                              <span className="text-[10px] text-white/40">{item.timestamp ? new Date(item.timestamp).toLocaleString() : '---'}</span>
                            </div>
                            <p className="text-sm text-white/70 mt-2">{item.text}</p>
                            {item.by && <p className="text-[10px] text-white/30 mt-1">By {item.by}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 xl:sticky xl:top-6">
                    <div className="glass-panel p-5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3 mb-4">
                        <Brain className="w-5 h-5 text-[#00A3E0]" />
                        <h3 className="text-lg font-black text-white">Lifecycle Intelligence</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                          <p className="text-xs uppercase font-black text-white/40">Approval Governance</p>
                          <p className="text-white font-black mt-1">{selectedRecordApproval?.label}</p>
                          <ul className="mt-2 space-y-1 text-xs text-white/50">
                            {selectedRecordApproval?.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                          </ul>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                          <p className="text-xs uppercase font-black text-white/40">Ownership</p>
                          <p className="text-xs text-white/60 mt-2">Current owner: {String(selectedRecord.currentOwner || selectedRecord.assignedRole || '---').replace(/_/g, ' ')}</p>
                          <p className="text-xs text-white/60">Next required role: {String(selectedRecord.nextRequiredRole || selectedRecordApproval?.requiredRole || '---').replace(/_/g, ' ')}</p>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                          <p className="text-xs uppercase font-black text-white/40">Escalation Matrix</p>
                          <p className="text-white font-black mt-1">{selectedRecordEscalation?.label}</p>
                          <ul className="mt-2 space-y-1 text-xs text-white/50">
                            {selectedRecordEscalation?.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                          </ul>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                          <p className="text-xs uppercase font-black text-white/40">Repeated History</p>
                          <p className="text-white/70 mt-1">{selectedRecordRules?.repeatedDefect.message}</p>
                          {selectedRecordRules && selectedRecordRules.repeatedDefect.similarRecordIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {selectedRecordRules.repeatedDefect.similarRecordIds.slice(0, 6).map((id) => (
                                <span key={id} className="px-2 py-1 rounded bg-white/10 text-[10px] text-white/50">{id}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                          <p className="text-xs uppercase font-black text-white/40">Related Records</p>
                          <div className="space-y-2 mt-2 text-xs">
                            <p>NCR: {selectedRecord.relatedNcrId ? <Link className="text-[#00A3E0]" to={`/ncr/${selectedRecord.relatedNcrId}`}>{selectedRecord.relatedNcrId}</Link> : '---'}</p>
                            <p>CAPA: {selectedRecord.relatedCapaId ? <Link className="text-[#00A3E0]" to={`/capa/${selectedRecord.relatedCapaId}`}>{selectedRecord.relatedCapaId}</Link> : '---'}</p>
                            <p>8D: {selectedRecord.relatedEightDId ? <span className="text-[#00A3E0]">{selectedRecord.relatedEightDId}</span> : '---'}</p>
                            <p>Improvement Actions: {selectedRecord.relatedActionIds?.length ? selectedRecord.relatedActionIds.join(', ') : '---'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3 mb-4">
                        <Timer className="w-5 h-5 text-amber-300" />
                        <h3 className="text-lg font-black text-white">SLA Metrics</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          ['Review', selectedRecordSla?.timeToReviewHrs],
                          ['Containment', selectedRecordSla?.timeToContainmentHrs],
                          ['Escalation', selectedRecordSla?.timeToEscalationHrs],
                          ['Close', selectedRecordSla?.timeToCloseHrs],
                        ].map(([label, value]) => (
                          <div key={label as string} className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-[10px] text-white/40 uppercase font-black">{label as string}</p>
                            <p className="text-lg font-black text-white">{value === null || value === undefined ? '---' : `${value}h`}</p>
                          </div>
                        ))}
                      </div>
                      <p className={`mt-4 text-xs font-bold ${selectedRecordSla?.overdueStatus.includes('overdue') ? 'text-amber-300' : 'text-emerald-300'}`}>
                        {selectedRecordSla?.overdueStatus}
                      </p>
                      {selectedRecordGovernedSla && (
                        <div className={`mt-3 rounded-xl border p-3 text-xs ${
                          selectedRecordGovernedSla.status === 'overdue'
                            ? 'border-red-400/20 bg-red-400/10 text-red-100'
                            : selectedRecordGovernedSla.status === 'warning'
                              ? 'border-amber-400/20 bg-amber-400/10 text-amber-100'
                              : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
                        }`}>
                          <p className="font-black uppercase tracking-widest">Configured SLA</p>
                          <p className="mt-1">
                            {selectedRecordGovernedSla.label} | Target {selectedRecordGovernedSla.targetHours}h | Elapsed {selectedRecordGovernedSla.elapsedHours}h
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-white/10">
                      <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Master Data Snapshot</p>
                      {[
                        ['Part Name', selectedRecord.partNameAtTime],
                        ['Supplier', selectedRecord.supplierNameAtTime],
                        ['Unit Cost', selectedRecord.unitCostAtTime],
                        ['Defect Category', selectedRecord.defectCategoryAtTime],
                        ['Model Family', selectedRecord.modelFamilyAtTime],
                        ['Line', selectedRecord.productionLineAtTime],
                        ['Version', selectedRecord.masterDataVersion],
                      ].map(([label, value]) => (
                        <div key={label as string} className="flex justify-between gap-3 py-1 text-xs">
                          <span className="text-white/40">{label as string}</span>
                          <span className="text-white/70 text-right truncate">{String(value || '---')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="workflow" className="mt-0 focus-visible:outline-none">
            {!hasDefectPermission(workflowUser, 'executiveDashboard.view') ? (
              <div className="h-96 flex flex-col items-center justify-center glass-panel rounded-2xl border border-white/10 text-center">
                <Lock className="w-12 h-12 text-white/10 mb-4" />
                <h3 className="text-xl font-black text-white/30">Executive workflow dashboard restricted</h3>
                <p className="text-sm text-white/20 mt-2">{roleLabel(workflowUser.role)} can still work on assigned records, but cannot view executive workflow metrics.</p>
              </div>
            ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  ['Open Defects', workflowMetrics.totalOpen],
                  ['Pending Review', workflowMetrics.pendingReview],
                  ['Pending Approval', workflowMetrics.pendingApproval],
                  ['Investigating', workflowMetrics.investigating],
                  ['Escalated', workflowMetrics.escalated],
                  ['Overdue Actions', workflowMetrics.overdueActions],
                  ['High Severity Open', workflowMetrics.highSeverityOpen],
                  ['Repeated Signals', workflowMetrics.repeatedDefects],
                  ['Avg Review Hrs', workflowMetrics.averageTimeToReviewHrs ?? '---'],
                  ['Avg Close Hrs', workflowMetrics.averageTimeToCloseHrs ?? '---'],
                  ['Closure Rate', `${workflowMetrics.closureRate}%`],
                  ['NCR Escalations', workflowMetrics.ncrEscalationCount],
                ].map(([label, value]) => (
                  <div key={label as string} className="glass-panel p-5 rounded-2xl border border-white/10">
                    <p className="text-xs text-white/40 uppercase font-black tracking-widest">{label as string}</p>
                    <p className="text-3xl font-black text-white mt-2">{String(value)}</p>
                  </div>
                ))}
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-5">
                  <Workflow className="w-5 h-5 text-[#00A3E0]" />
                  <h3 className="text-xl font-black text-white">Executive Workflow Dashboard</h3>
                </div>
                {defects.length === 0 ? (
                  <p className="text-sm text-white/40">No defect records yet. Workflow metrics will appear after real records are logged.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {['draft', 'logged', 'reviewed', 'approved', 'investigating', 'escalated', 'closed', 'reopened'].map((status) => {
                      const count = defects.filter((record) => normalizeDefectLifecycleStatus(record.status) === status).length;
                      const pct = defects.length ? Math.round((count / defects.length) * 100) : 0;
                      return (
                        <div key={status} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-black text-white capitalize">{status}</span>
                            <span className="text-xs text-white/50">{count} records</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#0066CC] to-[#00A3E0]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="mt-0 focus-visible:outline-none">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <UserCog className="w-5 h-5 text-[#00A3E0]" />
                    <h3 className="text-lg font-black text-white">Current Workflow User</h3>
                  </div>
                  <p className="text-sm text-white/60">{workflowUser.name}</p>
                  <p className="text-xl font-black text-[#00A3E0] mt-1">{roleLabel(workflowUser.role)}</p>
                  <p className="text-xs text-white/40 mt-3">Local role controls workflow buttons, approval actions, export access, and settings access in offline mode.</p>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <p className="text-xs font-black uppercase tracking-widest text-white/40">Unread Notifications</p>
                  <p className="text-4xl font-black text-white mt-2">{unreadWorkflowNotifications}</p>
                  <button
                    type="button"
                    onClick={() => markWorkflowNotificationsRead()}
                    disabled={workflowNotifications.length === 0}
                    className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold disabled:opacity-40"
                  >
                    Mark All Read
                  </button>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <p className="text-xs font-black uppercase tracking-widest text-white/40">My Open Tasks</p>
                  <p className="text-4xl font-black text-white mt-2">{myWorkflowTasks.length}</p>
                  <p className="text-xs text-white/40 mt-3">Tasks are derived from real defect records, ownership, approval role, action due dates, and linked NCR/CAPA/8D follow-up.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-amber-300" />
                      <h3 className="text-xl font-black text-white">Notification Center</h3>
                    </div>
                    <span className="text-xs text-white/40">{workflowNotifications.length} real signals</span>
                  </div>
                  {workflowNotifications.length === 0 ? (
                    <p className="text-sm text-white/35">No workflow notifications from real records right now.</p>
                  ) : (
                    <div className="space-y-3 max-h-[620px] overflow-auto pr-1">
                      {workflowNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
                            markWorkflowNotificationsRead([notification]);
                            const record = defects.find((item) => item.id === notification.relatedDefectId);
                            if (record) openRecordDetails(record);
                          }}
                          className={`w-full text-left rounded-xl border p-4 transition-all ${
                            notification.read ? 'border-white/10 bg-white/5 opacity-70' : 'border-[#00A3E0]/25 bg-[#00A3E0]/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-white">{notification.title}</p>
                              <p className="text-xs text-white/55 mt-1">{notification.message}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                              notification.severity === 'critical'
                                ? 'bg-red-400/15 text-red-200'
                                : notification.severity === 'warning'
                                  ? 'bg-amber-400/15 text-amber-200'
                                  : 'bg-white/10 text-white/60'
                            }`}>
                              {notification.severity}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#00A3E0] mt-3">{notification.suggestedAction}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="w-5 h-5 text-[#00A3E0]" />
                      <h3 className="text-xl font-black text-white">My Tasks Dashboard</h3>
                    </div>
                    <span className="text-xs text-white/40">{roleLabel(workflowUser.role)}</span>
                  </div>
                  {myWorkflowTasks.length === 0 ? (
                    <p className="text-sm text-white/35">No tasks assigned to this user or role from current defect records.</p>
                  ) : (
                    <div className="space-y-3 max-h-[620px] overflow-auto pr-1">
                      {myWorkflowTasks.map((task) => {
                        const record = defects.find((item) => item.id === task.relatedDefectId);
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => record && openRecordDetails(record)}
                            className={`w-full text-left rounded-xl border p-4 transition-all ${
                              task.overdue ? 'border-red-400/25 bg-red-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-black text-white">{task.title}</p>
                              <span className="px-2 py-1 rounded bg-white/10 text-[10px] font-black uppercase text-white/60">{task.category}</span>
                            </div>
                            <p className="text-xs text-white/55 mt-2">{task.message}</p>
                            <div className="flex flex-wrap gap-2 mt-3 text-[10px] text-white/40">
                              <span>Status: {task.status}</span>
                              {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                              {task.overdue && <span className="text-red-200">Overdue</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="governance" className="mt-0 focus-visible:outline-none">
            <div className="space-y-6">
              {!hasDefectPermission(workflowUser, 'rules.edit') && (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                  <Lock className="inline w-4 h-4 mr-2" />
                  {roleLabel(workflowUser.role)} can view workflow governance, but editing settings requires rules edit permission.
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-5">
                    <Timer className="w-5 h-5 text-amber-300" />
                    <h3 className="text-xl font-black text-white">SLA Settings</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      ['timeToReviewHrs', 'Time To Review (hrs)'],
                      ['timeToContainmentHrs', 'Time To Containment (hrs)'],
                      ['timeToEscalationHrs', 'Time To Escalation (hrs)'],
                      ['timeToCloseHrs', 'Time To Close (hrs)'],
                      ['overdueWarningThresholdHrs', 'Overdue Warning Threshold (hrs)'],
                    ].map(([key, label]) => (
                      <label key={key} className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-white/40">{label}</span>
                        <input
                          type="number"
                          min="0"
                          value={Number((settingsDraft.sla as unknown as Record<string, unknown>)[key] || 0)}
                          disabled={!hasDefectPermission(workflowUser, 'rules.edit')}
                          onChange={(event) => setSettingsDraft((prev) => ({
                            ...prev,
                            sla: { ...prev.sla, [key]: Number(event.target.value || 0) },
                          }))}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm disabled:opacity-50"
                        />
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-white/40 mt-4">Severity and record type overrides remain active for critical, high, customer return, and outgoing quality records.</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-5">
                    <ShieldCheck className="w-5 h-5 text-[#00A3E0]" />
                    <h3 className="text-xl font-black text-white">Approval Matrix</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      ['highCostThreshold', 'High COPQ Threshold'],
                      ['repeatedDefectThreshold', 'Repeated Defect Count'],
                      ['highQuantityThreshold', 'High Quantity Threshold'],
                    ].map(([key, label]) => (
                      <label key={key} className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-white/40">{label}</span>
                        <input
                          type="number"
                          min="0"
                          value={Number((settingsDraft.approvalMatrix as unknown as Record<string, unknown>)[key] || 0)}
                          disabled={!hasDefectPermission(workflowUser, 'rules.edit')}
                          onChange={(event) => setSettingsDraft((prev) => ({
                            ...prev,
                            approvalMatrix: { ...prev.approvalMatrix, [key]: Number(event.target.value || 0) },
                          }))}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm disabled:opacity-50"
                        />
                      </label>
                    ))}
                    {[
                      ['lowSeverityRole', 'Low Severity Role'],
                      ['highSeverityRole', 'High Severity Role'],
                      ['customerReturnRole', 'Customer Return Role'],
                      ['highCostRole', 'High COPQ Role'],
                      ['outgoingFailureRole', 'Outgoing Failure Role'],
                      ['managementAttentionRole', 'Management Attention Role'],
                    ].map(([key, label]) => (
                      <label key={key} className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-white/40">{label}</span>
                        <select
                          value={String((settingsDraft.approvalMatrix as unknown as Record<string, unknown>)[key] || 'QUALITY_ENGINEER')}
                          disabled={!hasDefectPermission(workflowUser, 'rules.edit')}
                          onChange={(event) => setSettingsDraft((prev) => ({
                            ...prev,
                            approvalMatrix: { ...prev.approvalMatrix, [key]: event.target.value as QualityWorkflowRole },
                          }))}
                          className="w-full px-4 py-3 rounded-xl bg-[#1a1a1f] border border-white/10 text-white text-sm disabled:opacity-50"
                        >
                          {QUALITY_WORKFLOW_ROLES.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <Workflow className="w-5 h-5 text-[#00A3E0]" />
                    <div>
                      <h3 className="text-xl font-black text-white">Workflow Transition Settings</h3>
                      <p className="text-xs text-white/40">Configured transitions sit on top of the safe lifecycle state machine.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={resetGovernanceSettings}
                      disabled={!hasDefectPermission(workflowUser, 'rules.edit')}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold disabled:opacity-40"
                    >
                      Reset Defaults
                    </button>
                    <button
                      type="button"
                      onClick={saveGovernanceSettings}
                      disabled={!hasDefectPermission(workflowUser, 'rules.edit')}
                      className="px-4 py-2 rounded-xl bg-[#0066CC] text-white text-xs font-black disabled:opacity-40"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {settingsDraft.transitions.map((transition, index) => (
                    <div key={transition.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-[180px_minmax(0,1fr)_120px_120px_120px] gap-3 items-center">
                        <div>
                          <p className="text-xs font-black text-white uppercase">{transition.fromStatus} {'->'} {transition.toStatus}</p>
                          <p className="text-[10px] text-white/35">{transition.id}</p>
                        </div>
                        <label className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Allowed Roles</span>
                          <input
                            value={transition.allowedRoles.join(', ')}
                            disabled={!hasDefectPermission(workflowUser, 'rules.edit')}
                            onChange={(event) => {
                              const roles = event.target.value
                                .split(',')
                                .map((value) => value.trim().replace(/[\s-]+/g, '_').toUpperCase())
                                .filter((value): value is QualityWorkflowRole => QUALITY_WORKFLOW_ROLES.includes(value as QualityWorkflowRole));
                              setSettingsDraft((prev) => ({
                                ...prev,
                                transitions: prev.transitions.map((item, itemIndex) => itemIndex === index ? { ...item, allowedRoles: roles.length ? roles : item.allowedRoles } : item),
                              }));
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-black/10 border border-white/10 text-white text-xs disabled:opacity-50"
                          />
                        </label>
                        {[
                          ['requiresComment', 'Comment'],
                          ['requiresEvidence', 'Evidence'],
                          ['requiresApproval', 'Approval'],
                        ].map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 text-xs text-white/60">
                            <input
                              type="checkbox"
                              checked={Boolean((transition as unknown as Record<string, unknown>)[key])}
                              disabled={!hasDefectPermission(workflowUser, 'rules.edit')}
                              onChange={(event) => setSettingsDraft((prev) => ({
                                ...prev,
                                transitions: prev.transitions.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: event.target.checked } : item),
                              }))}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-3 mt-3">
                        <label className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/35">SLA Target Hrs</span>
                          <input
                            type="number"
                            min="0"
                            value={transition.slaTargetHours || 0}
                            disabled={!hasDefectPermission(workflowUser, 'rules.edit')}
                            onChange={(event) => setSettingsDraft((prev) => ({
                              ...prev,
                              transitions: prev.transitions.map((item, itemIndex) => itemIndex === index ? { ...item, slaTargetHours: Number(event.target.value || 0) } : item),
                            }))}
                            className="w-full px-3 py-2 rounded-lg bg-black/10 border border-white/10 text-white text-xs disabled:opacity-50"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Warning Message</span>
                          <input
                            value={transition.warningMessage || ''}
                            disabled={!hasDefectPermission(workflowUser, 'rules.edit')}
                            onChange={(event) => setSettingsDraft((prev) => ({
                              ...prev,
                              transitions: prev.transitions.map((item, itemIndex) => itemIndex === index ? { ...item, warningMessage: event.target.value } : item),
                            }))}
                            placeholder="Optional guidance shown for this transition..."
                            className="w-full px-3 py-2 rounded-lg bg-black/10 border border-white/10 text-white text-xs disabled:opacity-50"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0 focus-visible:outline-none">
            {analytics?.enabled && analytics.charts ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...(analytics.charts || [])].sort((a, b) => a.order - b.order).map(chart => (
                  <div key={chart.id} className="glass-panel p-6 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 to-transparent">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-xl bg-[#0066CC]/20 border border-[#0066CC]/30">
                        <BarChart3 className="w-5 h-5 text-[#00A3E0]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{chart.title}</h3>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{chart.seriesLabel || 'Industrial Pareto Analysis'}</p>
                      </div>
                    </div>
                    {chart.chartType === 'pareto' ? (
                      <ParetoChart 
                        data={defects} 
                        categoryField={chart.bind?.xField || ''} 
                        title={chart.title}
                      />
                    ) : (
                      <div className="h-64 flex items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-3xl">
                        Chart type {chart.chartType} not implemented
                      </div>
                    )}
                  </div>
                ))}

                {/* Severity Breakdown & Professional Insights (Keep static for extra polish) */}
                <div className="lg:col-span-2 glass-panel p-8 rounded-[2rem] border border-white/10 bg-[#1a1a25]/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <AlertTriangle className="w-32 h-32 text-red-500" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">Quality Insight</h3>
                      <p className="text-sm text-white/40 font-medium leading-relaxed max-w-md">
                        The charts above provide a real-time Pareto analysis of your production quality. 
                        Focusing on the top issues will yield the highest return on quality investment.
                      </p>
                      <div className="flex gap-4">
                        <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <span className="block text-[10px] font-black text-red-400 uppercase tracking-widest">Critical</span>
                          <span className="text-xl font-black text-white">{defects.filter(d => d.severity === 'critical').length}</span>
                        </div>
                        <div className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                          <span className="block text-[10px] font-black text-orange-400 uppercase tracking-widest">Major</span>
                          <span className="text-xl font-black text-white">{defects.filter(d => d.severity === 'major').length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex-1 max-w-sm">
                      <h4 className="text-xs font-black text-[#00A3E0] uppercase tracking-widest mb-4">Quick Recommendation</h4>
                      <p className="text-xs text-white/60 leading-relaxed italic">
                        "Based on current data, the <strong>{
                          (() => {
                            const counts: Record<string, number> = {};
                            defects.forEach(d => counts[d.defectType] = (counts[d.defectType] || 0) + (d.quantity || 1));
                            return [...Object.entries(counts)].sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
                          })()
                        }</strong> defect type is your primary concern. 
                        Immediate investigation in <strong>{
                          (() => {
                            const counts: Record<string, number> = {};
                            defects.forEach(d => counts[d.productionLine] = (counts[d.productionLine] || 0) + (d.quantity || 1));
                            return [...Object.entries(counts)].sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
                          })()
                        }</strong> is recommended."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center glass-panel rounded-[2rem] border border-white/10">
                <BarChart3 className="w-12 h-12 text-white/10 mb-4" />
                <h3 className="text-xl font-black text-white/20 uppercase tracking-widest">Analytics Dashboard Disabled</h3>
                <p className="text-sm text-white/10 mt-2">Enable analytics in form settings to see data visualizations</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PageSection>
    </PageContainer>
  );
}
