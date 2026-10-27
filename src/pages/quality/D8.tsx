// QMS Enterprise 4.0 - 8D Problem Solving Workspace - Professional Edition
import { useState, useEffect, useMemo } from 'react';
import { PageHeader, PageContainer, PageSection, StatsBar } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { FilterPanel } from '../../components/FilterPanel';
import { BulkActionBar } from '../../components/BulkActionBar';
import { StatusBadge } from '../../components/StatusBadge';
import { toast } from 'sonner';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter,
  User,
  X,
  Edit3,
  Eye,
  Target,
  ShieldAlert,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Trash2,
  LayoutGrid,
  Table as TableIcon,
  ExternalLink,
  Users,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  unifiedEightDApi as eightDApi,
  type EightDData,
} from '../../api/unified-api';
import { exportData, prepareDataForExport } from '../../utils/exportUtils';
import {
  createImprovementAction,
} from '@/services/qualityImprovementActions';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';
import {
  buildLocalWorkflowUser,
  loadLocalWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import { useTranslation } from '@/utils/translations';

export interface D8Report {
  id: string;
  eightDNumber: string;
  symptomDescription: string;
  emergencyResponse: string;
  dateDetected: string;
  teamLeader: string;
  teamMembers: string[];
  department: string;
  champion?: string;
  problemTitle: string;
  productName: string;
  productionLine?: string;
  lotNumber?: string;
  problemDescription: string;
  customerImpact?: string;
  immediateAction: string;
  containmentResponsible: string;
  containmentDate: string;
  quantityContained?: number;
  analysisMethod: '5why' | 'fishbone' | 'fmea' | 'fault-tree' | 'pareto' | 'scatter';
  whyAnalysis?: string;
  fishboneAnalysis?: string;
  rootCauseDescription: string;
  correctiveActionDesc: string;
  correctiveResponsible: string;
  targetDateCorrective: string;
  implementationDate?: string;
  validationResults?: string;
  effectivenessCheck: 'pending' | 'effective' | 'ineffective';
  preventiveActionPlan?: string;
  lessonsLearned?: string;
  status: 'd0' | 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8' | 'closed';
  closureDate?: string;
  sourceNCRId?: string;
  [key: string]: unknown;
}

export const DEFAULT_8DS: D8Report[] = [];

export const mock8Ds: D8Report[] = [];

function generate8DNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `8D-${year}-${random}`;
}

const analysisMethodConfig = {
  '5why': { color: 'bg-blue-500/20 text-blue-400', label: '5 Why' },
  'fishbone': { color: 'bg-cyan-500/20 text-cyan-400', label: 'Fishbone' },
  'fmea': { color: 'bg-purple-500/20 text-purple-400', label: 'FMEA' },
  'fault-tree': { color: 'bg-red-500/20 text-red-400', label: 'Fault Tree' },
  'pareto': { color: 'bg-orange-500/20 text-orange-400', label: 'Pareto' },
  'scatter': { color: 'bg-green-500/20 text-green-400', label: 'Scatter' }
};

const dSteps = [
  { key: 'd0', label: 'D0: Plan', labelAr: 'D0: التخطيط والاستجابة', color: 'bg-gray-500' },
  { key: 'd1', label: 'D1: Team', labelAr: 'D1: تشكيل الفريق', color: 'bg-blue-500' },
  { key: 'd2', label: 'D2: Problem', labelAr: 'D2: توصيف المشكلة', color: 'bg-cyan-500' },
  { key: 'd3', label: 'D3: Containment', labelAr: 'D3: خطة الاحتواء', color: 'bg-yellow-500' },
  { key: 'd4', label: 'D4: Root Cause', labelAr: 'D4: السبب الجذري', color: 'bg-orange-500' },
  { key: 'd5', label: 'D5: Actions', labelAr: 'D5: الإجراءات الدائمة', color: 'bg-purple-500' },
  { key: 'd6', label: 'D6: Implement', labelAr: 'D6: التنفيذ والتحقق', color: 'bg-pink-500' },
  { key: 'd7', label: 'D7: Prevent', labelAr: 'D7: منع التكرار', color: 'bg-teal-500' },
  { key: 'd8', label: 'D8: Congratulate', labelAr: 'D8: التكريم والإغلاق', color: 'bg-green-500' },
  { key: 'closed', label: 'Closed', labelAr: 'مغلق ومكتمل', color: 'bg-emerald-500' }
];

export function D8Page() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [reports, setReports] = useState<D8Report[]>(() => {
    try {
      const local = localStorage.getItem('qms_local_8d') || localStorage.getItem('qms_local_eight-d');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });

  // View Mode: cards vs table
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('qms_8d_view_mode') as 'cards' | 'table') || 'cards';
  });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<D8Report | null>(null);
  const [viewingReport, setViewingReport] = useState<D8Report | null>(null);
  const [reportToDelete, setReportToDelete] = useState<D8Report | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    problemTitle: '',
    eightDNumber: '',
    department: 'Quality Engineering',
    productName: '',
    productionLine: '',
    lotNumber: '',
    dateDetected: new Date().toISOString().split('T')[0],
    teamLeader: '',
    champion: '',
    teamMembers: '',
    symptomDescription: '',
    emergencyResponse: '',
    problemDescription: '',
    customerImpact: '',
    immediateAction: '',
    containmentResponsible: '',
    containmentDate: new Date().toISOString().split('T')[0],
    quantityContained: 0,
    analysisMethod: '5why' as D8Report['analysisMethod'],
    whyAnalysis: '',
    fishboneAnalysis: '',
    rootCauseDescription: '',
    correctiveActionDesc: '',
    correctiveResponsible: '',
    targetDateCorrective: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    implementationDate: '',
    validationResults: '',
    effectivenessCheck: 'pending' as D8Report['effectivenessCheck'],
    preventiveActionPlan: '',
    lessonsLearned: '',
    status: 'd2' as D8Report['status'],
    closureDate: '',
    sourceNCRId: '',
  });

  buildLocalWorkflowUser(null, loadLocalWorkflowRole());

  const handleSetViewMode = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('qms_8d_view_mode', mode);
  };

  const saveReports = (items: D8Report[]) => {
    setReports(items);
    try {
      localStorage.setItem('qms_local_8d', JSON.stringify(items));
      localStorage.setItem('qms_local_eight-d', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save 8D reports locally:', e);
    }
  };

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const response = await eightDApi.getAll().catch(() => ({ data: [] as EightDData[] }));

      if (response?.data && response.data.length > 0) {
        const transformed: D8Report[] = response.data.map((report: any) => ({
          id: report.id,
          eightDNumber: report.dNumber || report.eightDNumber || report.id,
          symptomDescription: report.symptomDescription || report.title,
          emergencyResponse: report.emergencyResponse || '',
          dateDetected: report.dateDetected || report.createdAt?.split('T')[0],
          teamLeader: report.teamLeader?.name || report.ownerUser?.name || report.teamLeader || 'Unassigned',
          teamMembers: Array.isArray(report.teamMembers) ? report.teamMembers.map((m: any) => m.name || m) : [],
          department: report.department || 'Quality',
          champion: report.champion,
          problemTitle: report.problemTitle || report.title || report.subject,
          productName: report.productName || report.product || 'Standard Part',
          productionLine: report.productionLine || 'Line 01',
          lotNumber: report.lotNumber || '',
          problemDescription: report.problemDescription || report.description || '',
          customerImpact: report.customerImpact || '',
          immediateAction: report.immediateAction || report.containmentActions || '',
          containmentResponsible: report.containmentResponsible || '',
          containmentDate: report.containmentDate || report.createdAt?.split('T')[0],
          quantityContained: Number(formData.quantityContained) || report.quantityContained || 0,
          analysisMethod: report.analysisMethod || '5why',
          whyAnalysis: report.whyAnalysis || '',
          fishboneAnalysis: report.fishboneAnalysis || '',
          rootCauseDescription: report.rootCauseDescription || report.rootCause || '',
          correctiveActionDesc: report.correctiveActionDesc || report.correctiveActions || '',
          correctiveResponsible: report.correctiveResponsible || '',
          targetDateCorrective: report.targetDateCorrective || '',
          implementationDate: report.implementationDate || '',
          validationResults: report.validationResults || '',
          effectivenessCheck: report.effectivenessCheck || 'pending',
          preventiveActionPlan: report.preventiveActionPlan || report.preventiveActions || '',
          lessonsLearned: report.lessonsLearned || '',
          status: (report.status?.toLowerCase() as any) || 'd2',
          closureDate: report.closedAt?.split('T')[0] || report.closureDate || '',
          sourceNCRId: report.ncrReportId || report.sourceNCRId || '',
          ...report
        }));
        saveReports(transformed);
      } else {
        const stored = localStorage.getItem('qms_local_8d') || localStorage.getItem('qms_local_eight-d');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReports(parsed);
          } else {
            saveReports(DEFAULT_8DS);
          }
        } else {
          saveReports(DEFAULT_8DS);
        }
      }
    } catch {
      const stored = localStorage.getItem('qms_local_8d') || localStorage.getItem('qms_local_eight-d');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReports(parsed);
        } else {
          saveReports(DEFAULT_8DS);
        }
      } else {
        saveReports(DEFAULT_8DS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Deep-link /8d/:id support
  useEffect(() => {
    const id = params.id;
    if (!id || reports.length === 0) return;
    const found = reports.find((r) => r.id === id || r.eightDNumber === id);
    if (found) {
      setViewingReport(found);
    }
  }, [params.id, reports]);

  // Support create via query parameters
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('create') === '1' || p.get('sourceNCRId')) {
      handleOpenCreate(p.get('sourceNCRId') || undefined, p.get('title') || undefined);
    }
  }, [location.search]);

  const stats = useMemo(() => [
    { label: isAr ? 'تقارير 8D النشطة' : 'Active 8Ds', value: reports.filter(r => r.status !== 'closed' && r.status !== 'd8').length, change: '0', trend: 'neutral' as const },
    { label: isAr ? 'مرحلة التحليل الجذري (D4)' : 'In Root Cause', value: reports.filter(r => ['d2', 'd3', 'd4'].includes(r.status)).length, change: '0', trend: 'neutral' as const },
    { label: isAr ? 'مرحلة الوقاية (D7)' : 'In Prevention', value: reports.filter(r => r.status === 'd7').length, change: '0', trend: 'neutral' as const },
    { label: isAr ? 'المكتمل والمغلق' : 'Completed', value: reports.filter(r => r.status === 'd8' || r.status === 'closed').length, change: '0', trend: 'neutral' as const }
  ], [reports, isAr]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = !searchQuery || 
        report.problemTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.eightDNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.problemDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.teamLeader?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const statusFilter = activeFilters['status'] as string[];
      const matchesStatus = !statusFilter || statusFilter.length === 0 || statusFilter.includes(report.status);
      
      const analysisFilter = activeFilters['analysisMethod'] as string[];
      const matchesAnalysis = !analysisFilter || analysisFilter.length === 0 || analysisFilter.includes(report.analysisMethod);
      
      const effectivenessFilter = activeFilters['effectivenessCheck'] as string[];
      const matchesEffectiveness = !effectivenessFilter || effectivenessFilter.length === 0 || effectivenessFilter.includes(report.effectivenessCheck);
      
      return matchesSearch && matchesStatus && matchesAnalysis && matchesEffectiveness;
    });
  }, [reports, searchQuery, activeFilters]);

  const getStepIndex = (status: string) => dSteps.findIndex(s => s.key === status);

  const handleOpenCreate = (sourceNcr?: string, initialTitle?: string) => {
    const p = new URLSearchParams(location.search);
    const newNum = generate8DNumber();
    setFormData({
      problemTitle: initialTitle || p.get('title') || '',
      eightDNumber: newNum,
      department: p.get('department') || 'Quality Engineering',
      productName: p.get('product') || p.get('productName') || '',
      productionLine: p.get('line') || p.get('productionLine') || 'Line 01',
      lotNumber: p.get('lot') || p.get('lotNumber') || '',
      dateDetected: new Date().toISOString().split('T')[0],
      teamLeader: 'Eng. Quality Team',
      champion: 'Quality Director',
      teamMembers: '',
      symptomDescription: p.get('desc') || p.get('symptom') || '',
      emergencyResponse: '',
      problemDescription: p.get('desc') || p.get('problemDescription') || '',
      customerImpact: '',
      immediateAction: '',
      containmentResponsible: '',
      containmentDate: new Date().toISOString().split('T')[0],
      quantityContained: 0,
      analysisMethod: '5why',
      whyAnalysis: '',
      fishboneAnalysis: '',
      rootCauseDescription: '',
      correctiveActionDesc: '',
      correctiveResponsible: '',
      targetDateCorrective: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      implementationDate: '',
      validationResults: '',
      effectivenessCheck: 'pending',
      preventiveActionPlan: '',
      lessonsLearned: '',
      status: 'd2',
      closureDate: '',
      sourceNCRId: sourceNcr || '',
    });
    setEditingReport(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (report: D8Report) => {
    setFormData({
      problemTitle: report.problemTitle || '',
      eightDNumber: report.eightDNumber || report.id,
      department: report.department || 'Quality Engineering',
      productName: report.productName || '',
      productionLine: report.productionLine || '',
      lotNumber: report.lotNumber || '',
      dateDetected: report.dateDetected || new Date().toISOString().split('T')[0],
      teamLeader: report.teamLeader || '',
      champion: report.champion || '',
      teamMembers: Array.isArray(report.teamMembers) ? report.teamMembers.join(', ') : '',
      symptomDescription: report.symptomDescription || '',
      emergencyResponse: report.emergencyResponse || '',
      problemDescription: report.problemDescription || '',
      customerImpact: report.customerImpact || '',
      immediateAction: report.immediateAction || '',
      containmentResponsible: report.containmentResponsible || '',
      containmentDate: report.containmentDate || '',
      quantityContained: report.quantityContained || 0,
      analysisMethod: report.analysisMethod || '5why',
      whyAnalysis: report.whyAnalysis || '',
      fishboneAnalysis: report.fishboneAnalysis || '',
      rootCauseDescription: report.rootCauseDescription || '',
      correctiveActionDesc: report.correctiveActionDesc || '',
      correctiveResponsible: report.correctiveResponsible || '',
      targetDateCorrective: report.targetDateCorrective || '',
      implementationDate: report.implementationDate || '',
      validationResults: report.validationResults || '',
      effectivenessCheck: report.effectivenessCheck || 'pending',
      preventiveActionPlan: report.preventiveActionPlan || '',
      lessonsLearned: report.lessonsLearned || '',
      status: report.status || 'd2',
      closureDate: report.closureDate || '',
      sourceNCRId: report.sourceNCRId || '',
    });
    setEditingReport(report);
    setIsFormOpen(true);
  };

  const handleOpenView = (report: D8Report) => {
    setViewingReport(report);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const membersArray = formData.teamMembers
      ? formData.teamMembers.split(',').map((m) => m.trim()).filter(Boolean)
      : [];

    if (editingReport) {
      // Update existing
      const updatedItem: D8Report = {
        ...editingReport,
        problemTitle: formData.problemTitle.trim(),
        department: formData.department.trim(),
        productName: formData.productName.trim(),
        productionLine: formData.productionLine.trim(),
        lotNumber: formData.lotNumber.trim(),
        dateDetected: formData.dateDetected,
        teamLeader: formData.teamLeader.trim(),
        champion: formData.champion.trim(),
        teamMembers: membersArray,
        symptomDescription: formData.symptomDescription.trim(),
        emergencyResponse: formData.emergencyResponse.trim(),
        problemDescription: formData.problemDescription.trim(),
        customerImpact: formData.customerImpact.trim(),
        immediateAction: formData.immediateAction.trim(),
        containmentResponsible: formData.containmentResponsible.trim(),
        containmentDate: formData.containmentDate,
        quantityContained: Number(formData.quantityContained) || 0,
        analysisMethod: formData.analysisMethod,
        whyAnalysis: formData.whyAnalysis.trim(),
        fishboneAnalysis: formData.fishboneAnalysis.trim(),
        rootCauseDescription: formData.rootCauseDescription.trim(),
        correctiveActionDesc: formData.correctiveActionDesc.trim(),
        correctiveResponsible: formData.correctiveResponsible.trim(),
        targetDateCorrective: formData.targetDateCorrective,
        implementationDate: formData.implementationDate,
        validationResults: formData.validationResults.trim(),
        effectivenessCheck: formData.effectivenessCheck,
        preventiveActionPlan: formData.preventiveActionPlan.trim(),
        lessonsLearned: formData.lessonsLearned.trim(),
        status: formData.status,
        closureDate: formData.closureDate,
        sourceNCRId: formData.sourceNCRId.trim() || undefined,
      };

      const updatedList = reports.map((r) => (r.id === editingReport.id ? updatedItem : r));
      saveReports(updatedList);

      // Background API sync
      (eightDApi.update as any)(editingReport.id, {
        dNumber: updatedItem.eightDNumber,
        title: updatedItem.problemTitle,
        problemDescription: updatedItem.problemDescription,
        rootCause: updatedItem.rootCauseDescription,
        containmentActions: updatedItem.immediateAction,
        correctiveActions: updatedItem.correctiveActionDesc,
        preventiveActions: updatedItem.preventiveActionPlan,
        status: updatedItem.status as any,
      }).catch(() => null);

      if (viewingReport?.id === editingReport.id) {
        setViewingReport(updatedItem);
      }

      toast.success(isAr ? `تم تحديث تقرير 8D (${updatedItem.eightDNumber}) بنجاح` : `8D ${updatedItem.eightDNumber} updated successfully`);
      setIsFormOpen(false);
      setEditingReport(null);
    } else {
      // Create New
      const newId = formData.eightDNumber || generate8DNumber();
      const newReport: D8Report = {
        id: newId,
        eightDNumber: newId,
        problemTitle: formData.problemTitle.trim(),
        department: formData.department.trim(),
        productName: formData.productName.trim() || 'General Part',
        productionLine: formData.productionLine.trim() || 'Line 01',
        lotNumber: formData.lotNumber.trim(),
        dateDetected: formData.dateDetected,
        teamLeader: formData.teamLeader.trim() || 'Quality Lead',
        champion: formData.champion.trim() || 'Operations Manager',
        teamMembers: membersArray,
        symptomDescription: formData.symptomDescription.trim(),
        emergencyResponse: formData.emergencyResponse.trim(),
        problemDescription: formData.problemDescription.trim(),
        customerImpact: formData.customerImpact.trim(),
        immediateAction: formData.immediateAction.trim(),
        containmentResponsible: formData.containmentResponsible.trim(),
        containmentDate: formData.containmentDate,
        quantityContained: Number(formData.quantityContained) || 0,
        analysisMethod: formData.analysisMethod,
        whyAnalysis: formData.whyAnalysis.trim(),
        fishboneAnalysis: formData.fishboneAnalysis.trim(),
        rootCauseDescription: formData.rootCauseDescription.trim(),
        correctiveActionDesc: formData.correctiveActionDesc.trim(),
        correctiveResponsible: formData.correctiveResponsible.trim(),
        targetDateCorrective: formData.targetDateCorrective,
        implementationDate: formData.implementationDate,
        validationResults: formData.validationResults.trim(),
        effectivenessCheck: formData.effectivenessCheck,
        preventiveActionPlan: formData.preventiveActionPlan.trim(),
        lessonsLearned: formData.lessonsLearned.trim(),
        status: formData.status,
        closureDate: formData.closureDate,
        sourceNCRId: formData.sourceNCRId.trim() || undefined,
      };

      const nextList = [newReport, ...reports];
      saveReports(nextList);

      (eightDApi.create as any)({
        dNumber: newReport.eightDNumber,
        title: newReport.problemTitle,
        problemDescription: newReport.problemDescription,
        rootCause: newReport.rootCauseDescription,
        containmentActions: newReport.immediateAction,
        correctiveActions: newReport.correctiveActionDesc,
        preventiveActions: newReport.preventiveActionPlan,
        status: newReport.status as any,
      }).catch(() => null);

      toast.success(isAr ? `تم إنشاء تقرير 8D جديد برقم: ${newId}` : `New 8D created: ${newId}`);
      setIsFormOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!reportToDelete) return;
    const filtered = reports.filter((r) => r.id !== reportToDelete.id);
    saveReports(filtered);
    toast.success(isAr ? `تم حذف التقرير ${reportToDelete.eightDNumber}` : `Report ${reportToDelete.eightDNumber} deleted`);
    setReportToDelete(null);
    if (viewingReport?.id === reportToDelete.id) setViewingReport(null);
  };

  const handleCreateImprovementAction = async (report: D8Report) => {
    const action = createImprovementAction({
      title: `Verify 8D effectiveness: ${report.problemTitle || report.eightDNumber}`,
      description: 'Improvement action created from 8D. Verify D5/D6 implementation, D7 prevention, and before/after effectiveness signal.',
      sourceType: 'eightD',
      sourceId: report.id,
      relatedEightDId: report.id,
      relatedNcrId: report.sourceNCRId || '',
      linkedProductionLine: report.productionLine || '',
      linkedModel: report.productName || '',
      actionType: 'verification',
      priority: report.customerImpact ? 'high' : 'medium',
      status: 'open',
    });
    enqueueQualitySyncItem({
      entityType: 'eight-d',
      entityId: report.id,
      operation: 'link-action',
      payloadSummary: `Linked improvement action ${action.id} to 8D ${report.id}`,
    });
    toast.success(isAr ? `تم ربط خطة التحسين ${action.id} بتقرير 8D` : 'Improvement action linked to 8D');
  };

  const handleExport = (format: 'excel' | 'csv' | 'json' = 'excel', ids?: string[]) => {
    const dataToExport = ids && ids.length > 0 
      ? reports.filter(r => ids.includes(r.id))
      : filteredReports;

    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const mapping = {
        eightDNumber: '8D Number',
        problemTitle: 'Title',
        productName: 'Product',
        productionLine: 'Line',
        teamLeader: 'Team Leader',
        department: 'Department',
        analysisMethod: 'Analysis Method',
        status: 'Status',
        dateDetected: 'Date Detected',
        problemDescription: 'Problem Description',
        rootCauseDescription: 'Root Cause',
        correctiveActionDesc: 'Corrective Action',
        effectivenessCheck: 'Effectiveness'
      };

      const preparedData = prepareDataForExport(dataToExport, mapping);
      exportData(preparedData, `8D_Problem_Solving_Report`, '8D Reports', format);
      toast.success(`Successfully exported ${dataToExport.length} reports`);
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={isAr ? 'منهجية حل المشكلات 8D (Problem Solving)' : '8D Problem Solving Methodology'}
        subtitle={isAr ? 'إدارة وتتبع الانضباطات الثمانية للتحليل الجذري، الاحتواء، والإجراءات التصحيحية والوقائية' : 'Structured 8D problem-solving methodology from D0 containment to D8 recognition'}
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: '8D Report' }]}
        actions={{
          create: () => handleOpenCreate(),
          refresh: loadReports,
          export: () => handleExport('excel')
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={isAr ? 'بحث برقم 8D، عنوان المشكلة، المنتج، قائد الفريق...' : 'Search by 8D ID, problem title, product, leader...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rtl:pr-10 rtl:pl-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] transition-colors text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                {/* View Toggle */}
                <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('cards')}
                    className={`p-2 rounded-xl transition-all ${
                      viewMode === 'cards' 
                        ? 'bg-[#00A3E0] text-slate-950 font-bold shadow-md' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title={isAr ? 'عرض البطاقات' : 'Cards View'}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('table')}
                    className={`p-2 rounded-xl transition-all ${
                      viewMode === 'table' 
                        ? 'bg-[#00A3E0] text-slate-950 font-bold shadow-md' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title={isAr ? 'عرض الجدول' : 'Table View'}
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-11 px-3.5 rounded-2xl border flex items-center gap-2 text-sm transition-all ${
                    showFilters || Object.values(activeFilters).flat().length > 0
                      ? 'bg-[#00A3E0]/15 border-[#00A3E0] text-[#00A3E0]'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">{isAr ? 'تصفية' : 'Filters'}</span>
                </button>

                <Button 
                  onClick={() => handleOpenCreate()}
                  className="h-11 px-4 sm:px-5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white rounded-2xl hover:opacity-90 font-bold shadow-lg shadow-[#0066CC]/20 flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'تقرير 8D جديد' : 'New 8D'}</span>
                </Button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            <BulkActionBar
              selectedCount={selectedIds.length}
              itemName="8D Reports"
              onClearSelection={() => setSelectedIds([])}
              onExport={(format) => handleExport(format, selectedIds)}
            />

            {/* VIEW MODE 1: CARDS GRID */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {isLoading ? (
                  <div className="col-span-full py-16 text-center text-gray-400 rounded-3xl border border-white/10 bg-slate-900/60 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#00A3E0] border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-sm font-bold text-gray-300">{isAr ? 'جاري تحميل تقارير 8D...' : 'Loading 8D reports...'}</p>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-gray-500 rounded-3xl border border-white/10 bg-slate-900/60">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#00A3E0]" />
                    <p className="text-base font-bold text-gray-300">
                      {isAr ? 'لا توجد تقارير 8D مطابقة' : 'No 8D reports found'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isAr ? 'انقر على "تقرير 8D جديد" للبدء بحل مشكلة' : 'Click "New 8D" to initiate problem-solving'}
                    </p>
                  </div>
                ) : (
                  filteredReports.map((report) => {
                    const stepIdx = getStepIndex(report.status);
                    const progress = Math.round(((stepIdx + 1) / 10) * 100);
                    return (
                      <div
                        key={report.id}
                        onClick={() => handleOpenView(report)}
                        className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-5 shadow-2xl flex flex-col justify-between hover:border-[#00A3E0]/40 transition-all duration-300 group cursor-pointer"
                      >
                        <div className="space-y-3.5">
                          {/* Header ID & Status */}
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <span className="text-[#00A3E0] font-mono font-bold text-xs bg-[#00A3E0]/10 px-2.5 py-1 rounded-xl border border-[#00A3E0]/20">
                              {report.eightDNumber || report.id}
                            </span>
                            <StatusBadge status={report.status} size="sm" />
                          </div>

                          {/* Title & Description */}
                          <div>
                            <h4 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-[#00A3E0] transition-colors">
                              {report.problemTitle}
                            </h4>
                            <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                              {report.problemDescription || report.symptomDescription}
                            </p>
                          </div>

                          {/* Progress Bar */}
                          <div>
                            <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                              <span>{isAr ? dSteps[stepIdx]?.labelAr : dSteps[stepIdx]?.label}</span>
                              <span className="font-bold text-[#00A3E0]">{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Leader & Line */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs text-gray-300">
                            <div className="flex items-center gap-1.5 truncate">
                              <User className="w-3.5 h-3.5 text-[#00A3E0] shrink-0" />
                              <span className="truncate">{report.teamLeader}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <Building className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">{report.productionLine || report.department}</span>
                            </div>
                          </div>

                          {/* Method & Effectiveness */}
                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${
                              analysisMethodConfig[report.analysisMethod]?.color || 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                            }`}>
                              {analysisMethodConfig[report.analysisMethod]?.label || report.analysisMethod}
                            </span>
                            <span className={`font-bold px-2 py-0.5 rounded-md ${
                              report.effectivenessCheck === 'effective' ? 'bg-emerald-500/20 text-emerald-300' :
                              report.effectivenessCheck === 'ineffective' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {report.effectivenessCheck === 'effective' ? (isAr ? '✓ فاعل' : 'Effective') :
                               report.effectivenessCheck === 'ineffective' ? (isAr ? '✗ غير فاعل' : 'Ineffective') : (isAr ? '⏳ قيد المراقبة' : 'Pending')}
                            </span>
                          </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenView(report); }}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#00A3E0]" />
                            <span>{isAr ? 'عرض' : 'View'}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleOpenEdit(report); }}
                              className="p-2 rounded-xl bg-white/5 hover:bg-[#00A3E0]/20 text-gray-300 hover:text-[#00A3E0] transition-colors"
                              title={isAr ? 'تعديل' : 'Edit'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setReportToDelete(report); }}
                              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 transition-colors"
                              title={isAr ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* VIEW MODE 2: TABLE VIEW */}
            {viewMode === 'table' && (
              <DataTable
                data={filteredReports}
                columns={[
                  { key: 'eightDNumber', title: isAr ? 'رقم التقرير' : '8D Number', width: '140px', sortable: true, render: (item) => (
                    <span className="text-[#00A3E0] font-mono text-sm font-bold">{item.eightDNumber || item.id}</span>
                  )},
                  { key: 'problemTitle', title: isAr ? 'عنوان المشكلة' : 'Problem Title', sortable: true, render: (item) => (
                    <div>
                      <p className="text-white font-bold text-sm line-clamp-1">{item.problemTitle}</p>
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{item.problemDescription}</p>
                    </div>
                  )},
                  { key: 'status', title: isAr ? 'المرحلة' : 'Status', width: '130px', sortable: true, render: (item) => (
                    <StatusBadge status={item.status} size="sm" />
                  )},
                  { key: 'progress', title: isAr ? 'نسبة الإنجاز' : 'Progress', width: '130px', sortable: false, render: (item) => {
                    const stepIdx = getStepIndex(item.status);
                    const progress = Math.round(((stepIdx + 1) / 10) * 100);
                    return (
                      <div className="w-full">
                        <span className="text-xs text-gray-400 block mb-1 font-mono">{progress}%</span>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#0066CC] to-[#00A3E0]" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    );
                  }},
                  { key: 'teamLeader', title: isAr ? 'قائد الفريق' : 'Team Leader', width: '150px', sortable: true, render: (item) => (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#0066CC]/20 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-[#00A3E0]" />
                      </div>
                      <span className="text-gray-300 text-xs font-medium truncate">{item.teamLeader}</span>
                    </div>
                  )},
                  { key: 'analysisMethod', title: isAr ? 'المنهجية' : 'Method', width: '110px', sortable: true, render: (item) => (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                      analysisMethodConfig[item.analysisMethod]?.color || 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                    }`}>
                      {analysisMethodConfig[item.analysisMethod]?.label || item.analysisMethod}
                    </span>
                  )},
                  { key: 'dateDetected', title: isAr ? 'تاريخ الرصد' : 'Date', width: '120px', sortable: true, render: (item) => (
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-mono">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {item.dateDetected}
                    </div>
                  )}
                ]}
                keyExtractor={(item) => item.id}
                selectedItems={selectedIds}
                onSelectionChange={setSelectedIds}
                onRowClick={(row) => handleOpenView(row)}
                pageSize={10}
                actions={(item) => (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenView(item); }} 
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#00A3E0]" 
                      title={isAr ? 'عرض' : 'View'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }} 
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white" 
                      title={isAr ? 'تعديل' : 'Edit'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setReportToDelete(item); }} 
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-rose-400" 
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              />
            )}
          </div>

          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-full lg:w-72 shrink-0">
              <FilterPanel
                filters={[
                  { key: 'status', title: isAr ? 'مرحلة سير العمل' : 'Status', multi: true, options: dSteps.map(s => ({
                    value: s.key,
                    label: isAr ? s.labelAr : s.label,
                    count: reports.filter(r => r.status === s.key).length,
                    color: '#00A3E0'
                  }))},
                  { key: 'analysisMethod', title: isAr ? 'طريقة التحليل' : 'Analysis Method', multi: true, options: [
                    { value: '5why', label: '5 Why', count: reports.filter(r => r.analysisMethod === '5why').length, color: '#3B82F6' },
                    { value: 'fishbone', label: 'Fishbone', count: reports.filter(r => r.analysisMethod === 'fishbone').length, color: '#06B6D4' },
                    { value: 'fmea', label: 'FMEA', count: reports.filter(r => r.analysisMethod === 'fmea').length, color: '#A855F7' },
                    { value: 'fault-tree', label: 'Fault Tree', count: reports.filter(r => r.analysisMethod === 'fault-tree').length, color: '#DC2626' }
                  ]},
                  { key: 'effectivenessCheck', title: isAr ? 'الفاعلية' : 'Effectiveness', multi: true, options: [
                    { value: 'pending', label: isAr ? 'قيد المراقبة' : 'Pending', count: reports.filter(r => r.effectivenessCheck === 'pending').length, color: '#EAB308' },
                    { value: 'effective', label: isAr ? 'فاعل ومطابق' : 'Effective', count: reports.filter(r => r.effectivenessCheck === 'effective').length, color: '#22C55E' },
                    { value: 'ineffective', label: isAr ? 'غير فاعل' : 'Ineffective', count: reports.filter(r => r.effectivenessCheck === 'ineffective').length, color: '#DC2626' }
                  ]}
                ]}
                activeFilters={activeFilters}
                onFilterChange={(key, value) => {
                  const newFilters = { ...activeFilters };
                  if (value === null) {
                    delete newFilters[key];
                  } else {
                    newFilters[key] = value;
                  }
                  setActiveFilters(newFilters);
                }}
                onClearAll={() => { setActiveFilters({}); setDateRange({ from: null, to: null }); setSearchQuery(''); }}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>
          )}
        </div>
      </PageSection>

      {/* ======================================================================== */}
      {/* MODAL 1: DEDICATED 8D VIEW DETAILS MODAL */}
      {/* ======================================================================== */}
      {viewingReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl my-4 sm:my-8 space-y-4 sm:space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-[#00A3E0] font-mono font-bold text-sm bg-[#00A3E0]/15 px-3 py-1 rounded-xl border border-[#00A3E0]/30">
                    {viewingReport.eightDNumber || viewingReport.id}
                  </span>
                  <StatusBadge status={viewingReport.status} size="sm" />
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {analysisMethodConfig[viewingReport.analysisMethod]?.label || viewingReport.analysisMethod}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-2">
                  {viewingReport.problemTitle}
                </h3>
              </div>

              <button
                onClick={() => setViewingReport(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 8D Visual Stepper Bar */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                <span>{isAr ? 'مسار المراحل الثمانية (8 Disciplines Progress)' : '8D Disciplines Stepper'}</span>
                <span className="text-[#00A3E0] font-mono font-bold">
                  {Math.round(((getStepIndex(viewingReport.status) + 1) / 10) * 100)}%
                </span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {dSteps.map((step, idx) => {
                  const currentIdx = getStepIndex(viewingReport.status);
                  const isDone = currentIdx >= idx;
                  const isCurrent = currentIdx === idx;
                  return (
                    <div
                      key={step.key}
                      className={`p-1.5 rounded-lg text-center text-[10px] font-bold border transition-all ${
                        isCurrent 
                          ? 'bg-[#00A3E0] text-slate-950 border-[#00A3E0] shadow-md' 
                          : isDone 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                          : 'bg-white/5 text-gray-500 border-white/5'
                      }`}
                      title={step.label}
                    >
                      {step.key.toUpperCase()}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operational Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-gray-400 block">{isAr ? 'المنتج / الموديل' : 'Product'}</span>
                <span className="font-bold text-gray-200 mt-1 block truncate">{viewingReport.productName}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-gray-400 block">{isAr ? 'خط الإنتاج' : 'Line'}</span>
                <span className="font-bold text-gray-200 mt-1 block truncate">{viewingReport.productionLine || 'Line 01'}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-gray-400 block">{isAr ? 'قائد الفريق (D1)' : 'Team Leader'}</span>
                <span className="font-bold text-gray-200 mt-1 block truncate">{viewingReport.teamLeader}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-gray-400 block">{isAr ? 'الراعي (Champion)' : 'Champion'}</span>
                <span className="font-bold text-gray-200 mt-1 block truncate">{viewingReport.champion || 'N/A'}</span>
              </div>
            </div>

            {/* The 8 Disciplines Content Blocks */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {/* D1 Team Members */}
              {viewingReport.teamMembers && viewingReport.teamMembers.length > 0 && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 text-[#00A3E0] text-xs font-bold mb-2">
                    <Users className="w-4 h-4" />
                    <span>D1 - {isAr ? 'أعضاء فريق العمل' : 'Team Members'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {viewingReport.teamMembers.map((member, i) => (
                      <span key={i} className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* D2 Problem Description */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                  <Target className="w-4 h-4" />
                  <span>D2 - {isAr ? 'توصيف المشكلة وأثرها (Problem Description)' : 'Problem Description'}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {viewingReport.problemDescription || viewingReport.symptomDescription}
                </p>
                {viewingReport.customerImpact && (
                  <p className="text-[11px] text-amber-300/90 pt-1">
                    <strong>{isAr ? 'الأثر على العميل:' : 'Customer Impact:'}</strong> {viewingReport.customerImpact}
                  </p>
                )}
              </div>

              {/* D3 Containment Action */}
              <div className="bg-yellow-500/5 p-4 rounded-2xl border border-yellow-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>D3 - {isAr ? 'إجراءات الاحتواء الفوري (Containment Actions - ICA)' : 'Interim Containment Actions (ICA)'}</span>
                  </div>
                  {viewingReport.quantityContained ? (
                    <span className="text-[11px] font-bold text-yellow-300 px-2 py-0.5 rounded-lg bg-yellow-500/10">
                      {isAr ? `الكمية المحجوزة: ${viewingReport.quantityContained} قطعة` : `Contained: ${viewingReport.quantityContained} pcs`}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {viewingReport.immediateAction || viewingReport.emergencyResponse || (isAr ? 'لم تسجل إجراءات احتواء' : 'No containment actions documented')}
                </p>
                <div className="text-[11px] text-gray-400 flex items-center gap-3 pt-1">
                  <span><strong>{isAr ? 'المسؤول:' : 'Resp:'}</strong> {viewingReport.containmentResponsible || 'N/A'}</span>
                  <span><strong>{isAr ? 'التاريخ:' : 'Date:'}</strong> {viewingReport.containmentDate || 'N/A'}</span>
                </div>
              </div>

              {/* D4 Root Cause & Analysis */}
              <div className="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/20 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>D4 - {isAr ? 'السبب الجذري والتحليل (Root Cause Analysis - RCA)' : 'Root Cause Analysis'}</span>
                </div>
                <p className="text-xs text-gray-200 font-medium leading-relaxed">
                  {viewingReport.rootCauseDescription || (isAr ? 'قيد التحليل الجذري' : 'Under root cause investigation')}
                </p>
                {viewingReport.whyAnalysis && (
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5 font-mono text-[11px] text-gray-300 whitespace-pre-line">
                    {viewingReport.whyAnalysis}
                  </div>
                )}
                {viewingReport.fishboneAnalysis && (
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5 font-mono text-[11px] text-gray-300 whitespace-pre-line">
                    {viewingReport.fishboneAnalysis}
                  </div>
                )}
              </div>

              {/* D5 & D6 Corrective Actions & Implementation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-purple-500/5 p-4 rounded-2xl border border-purple-500/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                    <Target className="w-4 h-4" />
                    <span>D5 - {isAr ? 'الإجراءات التصحيحية الدائمة' : 'Permanent Actions (PCA)'}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {viewingReport.correctiveActionDesc || (isAr ? 'لم تحدد بعد' : 'Not defined yet')}
                  </p>
                  <p className="text-[11px] text-gray-400 pt-1">
                    <strong>{isAr ? 'المسؤول:' : 'Resp:'}</strong> {viewingReport.correctiveResponsible || 'N/A'}
                  </p>
                </div>

                <div className="bg-pink-500/5 p-4 rounded-2xl border border-pink-500/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-pink-400 text-xs font-bold">
                    <Clock className="w-4 h-4" />
                    <span>D6 - {isAr ? 'التنفيذ ونتائج التحقق' : 'Validation Results'}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {viewingReport.validationResults || (isAr ? 'قيد التحقق والمراقبة' : 'Pending validation')}
                  </p>
                  <p className="text-[11px] text-gray-400 pt-1">
                    <strong>{isAr ? 'تاريخ التنفيذ:' : 'Date:'}</strong> {viewingReport.implementationDate || 'N/A'}
                  </p>
                </div>
              </div>

              {/* D7 Prevention & D8 Recognition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-teal-500/5 p-4 rounded-2xl border border-teal-500/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>D7 - {isAr ? 'منع التكرار (Prevent Recurrence)' : 'Prevent Recurrence'}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {viewingReport.preventiveActionPlan || (isAr ? 'لم يوثق بعد' : 'Not documented yet')}
                  </p>
                </div>

                <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Award className="w-4 h-4" />
                    <span>D8 - {isAr ? 'الدروس المستفادة وتكريم الفريق' : 'Team Recognition & Close'}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {viewingReport.lessonsLearned || (isAr ? 'تم إغلاق التقرير بنجاح' : 'Successful closure')}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                {viewingReport.sourceNCRId && (
                  <button
                    onClick={() => navigate(`/ncr?search=${viewingReport.sourceNCRId}`)}
                    className="text-xs text-[#00A3E0] hover:underline flex items-center gap-1 font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isAr ? `تقرير عدم المطابقة (${viewingReport.sourceNCRId})` : `NCR (${viewingReport.sourceNCRId})`}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => handleCreateImprovementAction(viewingReport)}
                  className="bg-teal-500/10 text-teal-300 border-teal-500/30 hover:bg-teal-500/20 rounded-xl h-11"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                  {isAr ? 'ربط خطة تحسين' : 'Link Action'}
                </Button>

                <Button
                  onClick={() => { setViewingReport(null); handleOpenEdit(viewingReport); }}
                  className="bg-[#00A3E0] hover:bg-[#008cc0] text-slate-950 font-black rounded-xl h-11 px-6 shadow-lg shadow-[#00A3E0]/20"
                >
                  <Edit3 className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                  {isAr ? 'تعديل تقرير 8D' : 'Edit 8D'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setViewingReport(null)}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-11"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 2: EDIT & CREATE 8D MODAL */}
      {/* ======================================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl my-4 sm:my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#00A3E0]/10 text-[#00A3E0] border border-[#00A3E0]/20">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {editingReport 
                      ? (isAr ? `تعديل تقرير 8D (${editingReport.eightDNumber || editingReport.id})` : `Edit 8D (${editingReport.eightDNumber})`) 
                      : (isAr ? 'إنشاء تقرير 8D لحل المشكلات (New 8D Report)' : 'Create New 8D Report')}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isAr ? 'توثيق خطوات الانضباطات الثمانية من الاحتواء وحتى التحقق الجذري' : 'Document 8-disciplines lifecycle, root-cause and containment'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setIsFormOpen(false); setEditingReport(null); }}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-5">
              {/* Problem Title & 8D Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'عنوان المشكلة (Problem Title)' : 'Problem Title'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.problemTitle}
                    onChange={(e) => setFormData({ ...formData, problemTitle: e.target.value })}
                    placeholder={isAr ? 'مثال: تسريب زيت هيدروليكي في المكبس 04' : 'e.g. Hydraulic oil leak on press 04'}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'رقم التقرير (8D Number)' : '8D Number'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.eightDNumber}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-sm font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Status, Analysis Method, Effectiveness */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'المرحلة الحالية (Status Phase)' : 'Status Phase'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  >
                    {dSteps.map((s) => (
                      <option key={s.key} value={s.key} className="bg-slate-900">
                        {isAr ? s.labelAr : s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'طريقة التحليل (Analysis Method)' : 'Analysis Method'}
                  </label>
                  <select
                    value={formData.analysisMethod}
                    onChange={(e) => setFormData({ ...formData, analysisMethod: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  >
                    <option value="5why" className="bg-slate-900">5-Why Analysis</option>
                    <option value="fishbone" className="bg-slate-900">Fishbone (Ishikawa)</option>
                    <option value="fmea" className="bg-slate-900">FMEA</option>
                    <option value="fault-tree" className="bg-slate-900">Fault Tree</option>
                    <option value="pareto" className="bg-slate-900">Pareto Analysis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'فحص الفاعلية (Effectiveness Check)' : 'Effectiveness Check'}
                  </label>
                  <select
                    value={formData.effectivenessCheck}
                    onChange={(e) => setFormData({ ...formData, effectivenessCheck: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  >
                    <option value="pending" className="bg-slate-900">{isAr ? 'قيد المراقبة (Pending)' : 'Pending'}</option>
                    <option value="effective" className="bg-slate-900">{isAr ? 'فاعل ومطابق (Effective)' : 'Effective'}</option>
                    <option value="ineffective" className="bg-slate-900">{isAr ? 'غير فاعل (Ineffective)' : 'Ineffective'}</option>
                  </select>
                </div>
              </div>

              {/* D1 Team Members, Leader, Champion */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'قائد الفريق (D1 Team Leader)' : 'Team Leader'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.teamLeader}
                    onChange={(e) => setFormData({ ...formData, teamLeader: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'الراعي / المدير (Champion)' : 'Champion'}
                  </label>
                  <input
                    type="text"
                    value={formData.champion}
                    onChange={(e) => setFormData({ ...formData, champion: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'الأعضاء (مفصولين بفاصلة)' : 'Members (comma separated)'}
                  </label>
                  <input
                    type="text"
                    value={formData.teamMembers}
                    onChange={(e) => setFormData({ ...formData, teamMembers: e.target.value })}
                    placeholder="Ahmed, Khaled, Mona"
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              {/* Product, Line, Lot, NCR */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'اسم المنتج / القطعة' : 'Product / Part'}
                  </label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'خط الإنتاج' : 'Production Line'}
                  </label>
                  <input
                    type="text"
                    value={formData.productionLine}
                    onChange={(e) => setFormData({ ...formData, productionLine: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'رقم التشغيلة (Lot #)' : 'Lot Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.lotNumber}
                    onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'تقرير عدم المطابقة (Source NCR)' : 'Source NCR'}
                  </label>
                  <input
                    type="text"
                    value={formData.sourceNCRId}
                    onChange={(e) => setFormData({ ...formData, sourceNCRId: e.target.value })}
                    placeholder="NCR-2026-089"
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              {/* D2 Problem Description */}
              <div>
                <label className="block text-xs font-bold text-cyan-400 mb-1.5">
                  {isAr ? 'D2 - توصيف المشكلة بالتفصيل (Problem Description - 5W2H)' : 'D2 - Problem Description'}
                </label>
                <textarea
                  rows={2}
                  value={formData.problemDescription}
                  onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                  placeholder={isAr ? 'ما الذي حدث؟ أين؟ متى؟ كم قطعة؟ وما هو الأثر؟' : 'Describe the exact failure, where, when, and how much...'}
                  className="w-full p-3 bg-white/5 border border-cyan-500/20 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* D3 Containment Action & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-yellow-400 mb-1.5">
                    {isAr ? 'D3 - إجراءات الاحتواء الفوري (Interim Containment - ICA)' : 'D3 - Containment Action (ICA)'}
                  </label>
                  <input
                    type="text"
                    value={formData.immediateAction}
                    onChange={(e) => setFormData({ ...formData, immediateAction: e.target.value })}
                    placeholder={isAr ? 'الفرز، العزل، وتأمين المخزون والعميل...' : 'Sorting, quarantine, customer alert...'}
                    className="w-full h-11 px-4 bg-white/5 border border-yellow-500/20 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-yellow-400 mb-1.5">
                    {isAr ? 'الكمية المحجوزة (Contained Qty)' : 'Contained Qty'}
                  </label>
                  <input
                    type="number"
                    value={formData.quantityContained}
                    onChange={(e) => setFormData({ ...formData, quantityContained: Number(e.target.value) })}
                    className="w-full h-11 px-4 bg-white/5 border border-yellow-500/20 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              {/* D4 Root Cause & 5-Why */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-orange-400 mb-1.5">
                    {isAr ? 'D4 - السبب الجذري المؤكد (Root Cause)' : 'D4 - Root Cause'}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.rootCauseDescription}
                    onChange={(e) => setFormData({ ...formData, rootCauseDescription: e.target.value })}
                    placeholder={isAr ? 'السبب الفني الذي ثبتت مسؤوليته عن حدوث المشكلة...' : 'Verified underlying root cause...'}
                    className="w-full p-3 bg-white/5 border border-orange-500/20 rounded-xl text-white text-xs focus:outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-orange-400 mb-1.5">
                    {isAr ? 'تحليل لماذا الخماسي (5-Why Breakdown)' : '5-Why Breakdown'}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.whyAnalysis}
                    onChange={(e) => setFormData({ ...formData, whyAnalysis: e.target.value })}
                    placeholder="1. Why? ... 2. Why? ... 3. Why? ..."
                    className="w-full p-3 bg-white/5 border border-orange-500/20 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              {/* D5 & D6 Permanent Actions & Validation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-purple-400 mb-1.5">
                    {isAr ? 'D5 - الإجراءات التصحيحية الدائمة (PCA)' : 'D5 - Corrective Actions (PCA)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.correctiveActionDesc}
                    onChange={(e) => setFormData({ ...formData, correctiveActionDesc: e.target.value })}
                    placeholder={isAr ? 'الخطوات الهندسية لمنع السبب الجذري...' : 'Engineering actions to eliminate root cause...'}
                    className="w-full p-3 bg-white/5 border border-purple-500/20 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-pink-400 mb-1.5">
                    {isAr ? 'D6 - نتائج التحقق والفاعلية (Validation)' : 'D6 - Validation Results'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.validationResults}
                    onChange={(e) => setFormData({ ...formData, validationResults: e.target.value })}
                    placeholder={isAr ? 'نتائج القياسات بعد التطبيق لإثبات النجاح...' : 'Verification data proving PCA success...'}
                    className="w-full p-3 bg-white/5 border border-pink-500/20 rounded-xl text-white text-xs focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>

              {/* D7 Prevention & D8 Lessons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-teal-400 mb-1.5">
                    {isAr ? 'D7 - خطة منع التكرار النظامية (Prevention)' : 'D7 - Preventive Plan'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.preventiveActionPlan}
                    onChange={(e) => setFormData({ ...formData, preventiveActionPlan: e.target.value })}
                    placeholder={isAr ? 'تعديل FMEA، خطة المراقبة، وتعميم الدرس...' : 'Update FMEA, Control Plan, Poke-yoke...'}
                    className="w-full p-3 bg-white/5 border border-teal-500/20 rounded-xl text-white text-xs focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1.5">
                    {isAr ? 'D8 - الدروس المستفادة والتكريم (Closure)' : 'D8 - Lessons Learned'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.lessonsLearned}
                    onChange={(e) => setFormData({ ...formData, lessonsLearned: e.target.value })}
                    placeholder={isAr ? 'الدروس المستفادة وتكريم جهود الفريق...' : 'Team recognition and organizational learning...'}
                    className="w-full p-3 bg-white/5 border border-emerald-500/20 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-white/10 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsFormOpen(false); setEditingReport(null); }}
                  className="w-full sm:w-auto bg-white/5 border-white/10 text-white rounded-xl h-11"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-[#00A3E0] hover:bg-[#008cc0] text-slate-950 font-black rounded-xl h-11 px-6 shadow-lg shadow-[#00A3E0]/20"
                >
                  {editingReport ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إنشاء التقرير' : 'Create 8D')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 3: DELETE CONFIRMATION DIALOG */}
      {/* ======================================================================== */}
      {reportToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">
                {isAr ? 'تأكيد حذف تقرير 8D؟' : 'Confirm 8D Deletion?'}
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {isAr 
                  ? `هل أنت متأكد من حذف التقرير "${reportToDelete.problemTitle}" (${reportToDelete.eightDNumber})؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to delete 8D report "${reportToDelete.eightDNumber}"?`}
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setReportToDelete(null)}
                className="bg-white/5 border-white/10 text-white rounded-xl h-11"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-rose-600/30"
              >
                {isAr ? 'تأكيد الحذف' : 'Delete 8D'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default D8Page;
