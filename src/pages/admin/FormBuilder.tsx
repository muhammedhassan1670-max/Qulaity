/**
 * QMS Enterprise 4.0 - Form Builder Admin Page
 * Professional Quality 4.0 Dynamic Configuration
 * 
 * Visual form builder for creating custom NCR, CAPA, and other forms
 */

import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Settings,
  Eye,
  Save,
  Copy,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Layout,
  Type,
  Hash,
  List,
  CheckSquare,
  Calendar,
  Upload,
  PenTool,
  ScanLine,
  Calculator,
  Database,
  X,
  AlertCircle,
  ArrowLeft,
  Plus,
  RefreshCw,
  FileText,
  Search,
  BarChart3,
  Columns,
  ToggleLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfigStore, type DynamicForm, type DynamicField, type FieldType, type FormSection, type FieldOption, type ApprovalLevel, type ChartDataPoint, type LookupConfig } from '../../stores/configStore';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';
import FormulaEditor from '../../components/FormulaEditor';
import LookupSelector from '../../components/LookupSelector';
import { useNavigate } from 'react-router-dom';

// Field Type Icons
const fieldTypeIcons: Record<FieldType, typeof Type> = {
  text: Type,
  textarea: Type,
  number: Hash,
  select: List,
  multiselect: List,
  date: Calendar,
  datetime: Calendar,
  checkbox: CheckSquare,
  radio: CheckSquare,
  file: Upload,
  signature: PenTool,
  barcode: ScanLine,
  relation: Type,
  calculated: Calculator,
  formula: Calculator,
  lookup: Database,
  'button-group': ToggleLeft,
  'checkbox-group': CheckSquare,
  chart: BarChart3
};

const fieldTypeLabels: Record<FieldType, string> = {
  text: 'Text Field',
  textarea: 'Text Area',
  number: 'Number',
  select: 'Dropdown',
  multiselect: 'Multi Select',
  date: 'Date',
  datetime: 'Date & Time',
  checkbox: 'Checkbox',
  radio: 'Radio Group',
  'button-group': 'Button Group',
  'checkbox-group': 'Checklist',
  file: 'File Upload',
  signature: 'Signature',
  barcode: 'Barcode/QR',
  relation: 'Relation',
  calculated: 'Calculated',
  formula: 'Formula',
  lookup: 'Lookup',
  chart: 'Chart'
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

interface FormBuilderPageProps {
  formType?: DynamicForm['type'];
  hideTypeSelector?: boolean;
  onSaved?: (form: DynamicForm) => void;
}

export interface FormBuilderHandle {
  openBuilder: (form?: DynamicForm) => void;
}

export const FormBuilderPage = forwardRef<FormBuilderHandle, FormBuilderPageProps>(
  ({ formType, hideTypeSelector = false, onSaved }, ref) => {
    const { forms, addForm, updateForm, deleteForm, cloneForm } = useConfigStore();
    
    const [view, setView] = useState<'list' | 'builder' | 'datasources'>('list');
    const [selectedForm, setSelectedForm] = useState<DynamicForm | null>(null);

    const scopedForms = formType ? forms.filter((f: DynamicForm) => f.type === formType) : forms;

    useImperativeHandle(ref, () => ({
      openBuilder: (form?: DynamicForm) => {
        if (form) {
          // Check if it already exists in the store
          const existsInStore = forms.some((f: DynamicForm) => f.id === form.id);
          if (existsInStore) {
            // Edit existing
            setSelectedForm(form);
          } else {
            // New form pre-populated from external source (e.g., Excel import)
            // Set as selectedForm so builder is pre-filled, but handleSaveForm
            // will detect it's not in the store and call addForm
            setSelectedForm(form);
          }
        } else if (scopedForms.length > 0) {
          setSelectedForm(scopedForms[0]);
        } else {
          setSelectedForm(null);
        }
        setView('builder');
      }
    }));

  // Stats for the stats bar
  const statsData = {
    totalForms: scopedForms.length,
    activeForms: scopedForms.filter((f: DynamicForm) => f.isActive).length,
    isoForms: scopedForms.filter((f: DynamicForm) => f.industryStandard === 'ISO9001').length,
    customForms: scopedForms.filter((f: DynamicForm) => f.industryStandard === 'custom').length
  };

  const stats: Array<{ label: string; value: string | number; change: string; trend: 'up' | 'down' | 'neutral' }> = [
    { label: 'Total Forms', value: statsData.totalForms, change: '0', trend: 'neutral' as const },
    { label: 'Active Forms', value: statsData.activeForms, change: '0', trend: 'neutral' as const },
    { label: 'ISO Standard', value: statsData.isoForms, change: '0', trend: 'neutral' as const },
    { label: 'Custom Forms', value: statsData.customForms, change: '0', trend: 'neutral' as const }
  ];

  const handleCreateForm = () => {
    setSelectedForm(null);
    setView('builder');
  };

  const handleEditForm = (form: DynamicForm) => {
    setSelectedForm(form);
    setView('builder');
  };

  const handleDuplicateForm = (form: DynamicForm) => {
    cloneForm(form.id, `${form.name} (Copy)`);
    toast.success('Form duplicated successfully');
  };

  const handleDeleteForm = (formId: string) => {
    if (confirm('Are you sure you want to delete this form?')) {
      deleteForm(formId);
      toast.success('Form deleted successfully');
    }
  };

  const handleSaveForm = (form: DynamicForm) => {
    if (selectedForm && selectedForm.id && forms.some((f: DynamicForm) => f.id === selectedForm.id)) {
      // Update existing form already in the store
      updateForm(selectedForm.id, form);
    } else {
      // New form — strip generated id/timestamps so addForm creates fresh ones
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = form;
      addForm(rest);
    }
    toast.success('Form saved successfully');
    onSaved?.(form);
    setView('list');
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 border border-[#0066CC]/30">
            <FileText className="w-6 h-6 text-[#00A3E0]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Form Builder</h1>
            <p className="text-sm text-gray-400">Design and manage dynamic forms for quality documentation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {view === 'list' ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setView('datasources')}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
              >
                <Database className="w-4 h-4 mr-2" />
                Data Sources
              </Button>
              <Button 
                variant="outline" 
                onClick={() => { toast.success('Forms refreshed'); }}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={handleCreateForm}
                className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Form
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setView('list')}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forms
            </Button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {view === 'list' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="glass-panel rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-xl font-semibold text-white">{stat.value}</p>
                <span className={`text-xs ${stat.trend === 'up' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {view === 'list' ? (
          <FormList
            forms={scopedForms}
            onEdit={handleEditForm}
            onDuplicate={handleDuplicateForm}
            onDelete={handleDeleteForm}
          />
        ) : view === 'builder' ? (
          <FormBuilder
            form={selectedForm}
            onSave={handleSaveForm}
            onCancel={() => setView('list')}
            forcedType={formType}
            hideTypeSelector={hideTypeSelector}
          />
        ) : (
          <DataSourceManager />
        )}
      </div>
    </div>
  );
});

// ============================================================================
// FORM LIST COMPONENT
// ============================================================================

interface FormListProps {
  forms: DynamicForm[];
  onEdit: (form: DynamicForm) => void;
  onDuplicate: (form: DynamicForm) => void;
  onDelete: (formId: string) => void;
}

function FormList({ forms, onEdit, onDuplicate, onDelete }: FormListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const filteredForms = forms.filter(f =>
    f.name.toLowerCase().includes(filter.toLowerCase()) ||
    f.type.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search forms by name or type..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0]"
          />
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredForms.map((form) => (
          <div
            key={form.id}
            className="glass-card p-5 rounded-xl hover:ring-1 hover:ring-[#00A3E0]/50 transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0066CC]/20 flex items-center justify-center">
                  <Layout className="w-5 h-5 text-[#00A3E0]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{form.name}</h3>
                  <span className="text-xs text-gray-400 uppercase">{form.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {form.isActive && (
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                )}
                <button
                  onClick={() => setExpandedId(expandedId === form.id ? null : form.id)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  {expandedId === form.id ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {form.industryStandard && (
                <span className="px-2 py-1 text-xs bg-[#00A3E0]/20 text-[#00A3E0] rounded">
                  {form.industryStandard}
                </span>
              )}
              <span className="px-2 py-1 text-xs bg-white/5 text-gray-400 rounded">
                v{form.version}
              </span>
              <span className="px-2 py-1 text-xs bg-white/5 text-gray-400 rounded">
                {form.fields.length} fields
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => onEdit(form)}
                className="flex-1 px-3 py-1.5 text-sm bg-[#0066CC]/20 text-[#00A3E0] rounded hover:bg-[#0066CC]/30"
              >
                Edit
              </button>
              <button
                onClick={() => onDuplicate(form)}
                className="p-1.5 text-gray-400 hover:text-white"
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(form.id)}
                className="p-1.5 text-gray-400 hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Expanded Details */}
            {expandedId === form.id && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                {form.description && (
                  <p className="text-sm text-gray-400">{form.description}</p>
                )}
                
                <div>
                  <p className="text-xs text-gray-500 mb-2">Fields Overview:</p>
                  <div className="flex flex-wrap gap-1">
                    {form.sections.map((section: FormSection) => (
                      <span
                        key={section.id}
                        className="px-2 py-1 text-xs bg-white/5 text-gray-300 rounded"
                      >
                        {section.title} ({section.fields.length})
                      </span>
                    ))}
                  </div>
                </div>

                {form.autoNumbering?.enabled && (
                  <p className="text-xs text-gray-500">
                    Auto-numbering: {form.autoNumbering.prefix}#####
                  </p>
                )}

                {form.approvals?.required && (
                  <p className="text-xs text-gray-500">
                    Approvals: {form.approvals.levels.length} levels
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredForms.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 rounded-xl border border-white/10 bg-white/5">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
            <Layout className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-gray-400">No forms found</p>
          {filter && (
            <p className="text-sm text-gray-500">Try adjusting your search</p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FORM BUILDER COMPONENT
// ============================================================================

interface FormBuilderProps {
  form: DynamicForm | null;
  onSave: (form: DynamicForm) => void;
  onCancel: () => void;
  forcedType?: DynamicForm['type'];
  hideTypeSelector?: boolean;
}

function FormBuilder({ form, onSave, onCancel, forcedType, hideTypeSelector = false }: FormBuilderProps) {
  const [activeTab, setActiveTab] = useState<'fields' | 'sections' | 'analytics' | 'settings' | 'preview'>('fields');
  const [formConfig, setFormConfig] = useState<Partial<DynamicForm>>(
    form || {
      name: '',
      description: '',
      type: forcedType || 'custom',
      version: 1,
      isActive: false,
      sections: [{ id: 'section-1', title: 'Main Section', order: 1, fields: [] }],
      fields: [],
      analytics: { enabled: false, charts: [] }
    }
  );

  // Enforce type if forcedType changes
  if (forcedType && formConfig.type !== forcedType) {
    setFormConfig((prev: Partial<DynamicForm>) => ({ ...prev, type: forcedType }));
  }

  const handleAddField = (type: FieldType) => {
    const newField: DynamicField = {
      id: `field-${Date.now()}`,
      name: `field_${(formConfig.fields?.length || 0) + 1}`,
      label: fieldTypeLabels[type],
      type,
      visible: true,
      editable: true,
      order: (formConfig.fields?.length || 0) + 1,
      section: formConfig.sections?.[0]?.id
    };

    if (type === 'chart') {
      newField.chart = {
        id: `chart-${Date.now()}`,
        title: 'New Chart',
        chartType: 'bar',
        dataMode: 'manual',
        xLabel: 'X',
        yLabel: 'Y',
        seriesLabel: 'Series',
        manualData: [
          { x: 'A', y: 10 },
          { x: 'B', y: 20 },
          { x: 'C', y: 15 },
        ],
        order: 1
      };
    }

    setFormConfig((prev: Partial<DynamicForm>) => ({
      ...prev,
      fields: [...(prev.fields || []), newField],
      sections: prev.sections?.map((s: FormSection) =>
        s.id === newField.section
          ? { ...s, fields: [...s.fields, newField.id] }
          : s
      )
    }));
  };

  const handleRemoveField = (fieldId: string) => {
    setFormConfig((prev: Partial<DynamicForm>) => ({
      ...prev,
      fields: prev.fields?.filter((f: DynamicField) => f.id !== fieldId) || [],
      sections: prev.sections?.map((s: FormSection) => ({
        ...s,
        fields: s.fields.filter((id: string) => id !== fieldId)
      })) || []
    }));
  };

  const handleUpdateField = (fieldId: string, updates: Partial<DynamicField>) => {
    setFormConfig((prev: Partial<DynamicForm>) => ({
      ...prev,
      fields: prev.fields?.map((f: DynamicField) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ) || []
    }));
  };

  const handleSave = () => {
    if (!formConfig.name) {
      toast.error('Form name is required');
      return;
    }

    const completeForm: DynamicForm = {
      ...formConfig as DynamicForm,
      id: form?.id || `form-${Date.now()}`,
      createdAt: form?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: form?.createdBy || 'current-user'
    };

    onSave(completeForm);
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-250px)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 glass-panel rounded-xl p-4 space-y-4 overflow-y-auto border border-white/10 shrink-0">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Form Tabs</p>
          <nav className="space-y-1">
            {(['fields', 'sections', 'analytics', 'settings', 'preview'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm capitalize
                  ${activeTab === tab
                    ? 'bg-[#0066CC] text-white'
                    : 'text-gray-400 hover:bg-white/5'
                  }
                `}
              >
                {tab === 'fields' && <Layout className="w-4 h-4" />}
                {tab === 'sections' && <Columns className="w-4 h-4" />}
                {tab === 'analytics' && <BarChart3 className="w-4 h-4" />}
                {tab === 'settings' && <Settings className="w-4 h-4" />}
                {tab === 'preview' && <Eye className="w-4 h-4" />}
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'fields' && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Add Field</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(fieldTypeLabels) as FieldType[]).map(type => {
                const Icon = fieldTypeIcons[type];
                return (
                  <button
                    key={type}
                    onClick={() => handleAddField(type)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px]">{fieldTypeLabels[type]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-white/10 space-y-2">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3]"
          >
            <Save className="w-4 h-4" />
            Save Form
          </button>
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 glass-panel rounded-xl border border-white/10 overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-white/10 bg-white/5 shrink-0 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white truncate max-w-[200px]">
              {formConfig.name || 'Untitled Form'}
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`w-2 h-2 rounded-full ${formConfig.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                {formConfig.isActive ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormConfig(prev => ({ ...prev, isActive: !prev.isActive }))}
              className={`border-white/10 shrink-0 ${formConfig.isActive ? 'text-amber-400 hover:text-amber-300' : 'text-green-400 hover:text-green-300'}`}
            >
              {formConfig.isActive ? 'Unpublish' : 'Publish'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="border-white/10 text-gray-400 hover:text-white shrink-0"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-[#0066CC] hover:bg-[#0052a3] text-white shrink-0"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Form
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'fields' && (
            <FieldsTab
              formConfig={formConfig}
              onUpdate={setFormConfig}
              onUpdateField={handleUpdateField}
              onRemoveField={handleRemoveField}
              hideTypeSelector={hideTypeSelector}
            />
          )}

          {activeTab === 'sections' && (
            <SectionsTab
              formConfig={formConfig}
              onUpdate={setFormConfig}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              formConfig={formConfig}
              onUpdate={setFormConfig}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              formConfig={formConfig}
              onUpdate={setFormConfig}
            />
          )}

          {activeTab === 'preview' && (
            <PreviewTab formConfig={formConfig} />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SECTIONS TAB
// ============================================================================

interface SectionsTabProps {
  formConfig: Partial<DynamicForm>;
  onUpdate: (config: Partial<DynamicForm>) => void;
}

function SectionsTab({ formConfig, onUpdate }: SectionsTabProps) {
  const handleAddSection = () => {
    const newSection: FormSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      order: (formConfig.sections?.length || 0) + 1,
      fields: []
    };
    onUpdate({
      ...formConfig,
      sections: [...(formConfig.sections || []), newSection]
    });
  };

  const handleUpdateSection = (id: string, updates: Partial<FormSection>) => {
    onUpdate({
      ...formConfig,
      sections: formConfig.sections?.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const handleRemoveSection = (id: string) => {
    onUpdate({
      ...formConfig,
      sections: formConfig.sections?.filter(s => s.id !== id)
    });
  };

  const handleMoveField = (fieldId: string, fromSectionId: string, toSectionId: string) => {
    if (fromSectionId === toSectionId) return;

    onUpdate({
      ...formConfig,
      fields: formConfig.fields?.map(f => f.id === fieldId ? { ...f, section: toSectionId } : f),
      sections: formConfig.sections?.map(s => {
        let updatedFields = [...(s.fields || [])];
        if (s.id === fromSectionId) {
          updatedFields = updatedFields.filter(id => id !== fieldId);
        }
        if (s.id === toSectionId) {
          if (!updatedFields.includes(fieldId)) {
            updatedFields.push(fieldId);
          }
        }
        return { ...s, fields: updatedFields };
      })
    });
    toast.success('Field moved successfully');
  };

  const unassignedFields = formConfig.fields?.filter(f => !f.section || !formConfig.sections?.find(s => s.id === f.section)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Form Sections</h3>
          <p className="text-xs text-white/40 mt-1">Manage sections and organize fields within them</p>
        </div>
        <Button onClick={handleAddSection} size="sm" className="bg-[#0066CC] hover:bg-[#0052a3] font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>

      {/* Unassigned Fields Warning */}
      {unassignedFields.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">Unassigned Fields ({unassignedFields.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassignedFields.map(field => (
              <div key={field.id} className="group relative">
                <div className="px-3 py-1.5 bg-amber-500/20 text-amber-400 text-[11px] font-bold rounded-lg border border-amber-500/30 flex items-center gap-2">
                  {field.label}
                  <select
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => handleMoveField(field.id, 'unassigned', e.target.value)}
                    value=""
                  >
                    <option value="" disabled>Move to...</option>
                    {formConfig.sections?.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {formConfig.sections?.map((section, idx) => (
          <div key={section.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6 hover:bg-white/[0.07] transition-all group/section">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-white/20 group-hover/section:text-[#00A3E0] group-hover/section:bg-[#00A3E0]/10 transition-all">
                  {idx + 1}
                </div>
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                  className="bg-transparent border-none text-white font-black focus:ring-0 p-0 text-xl placeholder:text-gray-600 flex-1"
                  placeholder="Section Title"
                />
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    const newOrder = prompt('Enter new order number:', String(idx + 1));
                    if (newOrder) handleUpdateSection(section.id, { order: parseInt(newOrder) || section.order });
                  }}
                  className="p-2 text-gray-500 hover:text-[#00A3E0] hover:bg-[#00A3E0]/10 rounded-lg transition-colors"
                  title="Change Order"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemoveSection(section.id)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Remove Section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Description</label>
                <input
                  type="text"
                  value={section.description || ''}
                  onChange={(e) => handleUpdateSection(section.id, { description: e.target.value })}
                  className="pro-input w-full px-4 py-3 text-sm"
                  placeholder="Explain what this section is for..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 px-1 flex items-center justify-between">
                  Fields in this section
                  <span className="text-[9px] font-medium normal-case text-white/20 italic">Click field to move it to another section</span>
                </label>
                <div className="flex flex-wrap gap-2.5 p-4 bg-black/20 border border-white/5 rounded-2xl min-h-[64px]">
                  {section.fields.map(fieldId => {
                    const field = formConfig.fields?.find(f => f.id === fieldId);
                    if (!field) return null;
                    return (
                      <div key={fieldId} className="relative group/field">
                        <div className="px-4 py-2 bg-[#0066CC]/10 text-[#00A3E0] text-[12px] font-black rounded-xl border border-[#0066CC]/20 flex items-center gap-3 hover:bg-[#0066CC]/20 hover:border-[#0066CC]/40 transition-all cursor-pointer">
                          <div className="w-5 h-5 rounded bg-[#0066CC]/20 flex items-center justify-center">
                            {(() => {
                              const Icon = fieldTypeIcons[field.type];
                              return <Icon className="w-3 h-3 text-[#00A3E0]" />;
                            })()}
                          </div>
                          {field.label}
                          <ChevronDown className="w-3 h-3 opacity-30 group-hover/field:opacity-100 transition-opacity" />
                        </div>
                        <select
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          value={section.id}
                          onChange={(e) => handleMoveField(field.id, section.id, e.target.value)}
                        >
                          <option value="" disabled>Move to section...</option>
                          {formConfig.sections?.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                  {section.fields.length === 0 && (
                    <div className="w-full py-4 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
                      <Layout className="w-5 h-5 text-white/10 mb-1" />
                      <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Empty Section</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ANALYTICS TAB
// ============================================================================

interface AnalyticsTabProps {
  formConfig: Partial<DynamicForm>;
  onUpdate: (config: Partial<DynamicForm>) => void;
}

function AnalyticsTab({ formConfig, onUpdate }: AnalyticsTabProps) {
  const handleToggleAnalytics = (enabled: boolean) => {
    onUpdate({
      ...formConfig,
      analytics: {
        ...(formConfig.analytics || { charts: [] }),
        enabled
      }
    });
  };

  const handleAddChart = () => {
    const newChart = {
      id: `chart-${Date.now()}`,
      chartType: 'pareto' as const,
      title: 'New Pareto Analysis',
      dataMode: 'bind' as const,
      order: (formConfig.analytics?.charts?.length || 0) + 1,
      bind: { xField: '', yField: '' }
    };

    onUpdate({
      ...formConfig,
      analytics: {
        ...(formConfig.analytics || { enabled: true, charts: [] }),
        charts: [...(formConfig.analytics?.charts || []), newChart]
      }
    });
  };

  const handleUpdateChart = (id: string, updates: any) => {
    onUpdate({
      ...formConfig,
      analytics: {
        ...(formConfig.analytics as any),
        charts: formConfig.analytics?.charts?.map(c => c.id === id ? { ...c, ...updates } : c) || []
      }
    });
  };

  const handleRemoveChart = (id: string) => {
    onUpdate({
      ...formConfig,
      analytics: {
        ...(formConfig.analytics as any),
        charts: formConfig.analytics?.charts?.filter(c => c.id !== id) || []
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Analytics Dashboard</h3>
          <p className="text-xs text-white/40 mt-1">Configure charts and Pareto analysis for this form</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formConfig.analytics?.enabled || false}
              onChange={(e) => handleToggleAnalytics(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#0066CC]"
            />
            <span className="text-sm font-bold text-white/60 uppercase tracking-widest">Enable Dashboard</span>
          </label>
          <Button 
            onClick={handleAddChart} 
            disabled={!formConfig.analytics?.enabled}
            size="sm" 
            className="bg-[#0066CC] hover:bg-[#0052a3] font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Chart
          </Button>
        </div>
      </div>

      {!formConfig.analytics?.enabled ? (
        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.02]">
          <BarChart3 className="w-16 h-16 text-white/5 mb-4" />
          <p className="text-white/20 font-black uppercase tracking-[0.2em]">Dashboard is currently disabled</p>
          <p className="text-xs text-white/10 mt-2">Enable it to start configuring industrial analytics</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {[...(formConfig.analytics?.charts || [])].sort((a,b) => a.order - b.order).map((chart, idx) => (
            <div key={chart.id} className="p-8 bg-white/5 border border-white/10 rounded-[2rem] space-y-8 hover:bg-white/[0.07] transition-all group/chart">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0066CC]/20 flex items-center justify-center text-[#00A3E0] font-black">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={chart.title}
                    onChange={(e) => handleUpdateChart(chart.id, { title: e.target.value })}
                    className="bg-transparent border-none text-white font-black focus:ring-0 p-0 text-xl placeholder:text-gray-600 w-full max-w-md"
                    placeholder="Chart Title"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemoveChart(chart.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Chart Type</label>
                  <select
                    value={chart.chartType}
                    onChange={(e) => handleUpdateChart(chart.id, { chartType: e.target.value })}
                    className="pro-input w-full px-4 py-3 text-sm"
                  >
                    <option value="pareto" className="bg-[#1a1a1f]">Pareto Analysis (80/20)</option>
                    <option value="bar" className="bg-[#1a1a1f]">Bar Chart</option>
                    <option value="line" className="bg-[#1a1a1f]">Line Chart</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Data Category (X-Axis)</label>
                  <select
                    value={chart.bind?.xField || ''}
                    onChange={(e) => handleUpdateChart(chart.id, { bind: { ...chart.bind, xField: e.target.value } })}
                    className="pro-input w-full px-4 py-3 text-sm"
                  >
                    <option value="" className="bg-[#1a1a1f]">Select Field...</option>
                    {formConfig.fields?.map(f => (
                      <option key={f.id} value={f.name} className="bg-[#1a1a1f]">{f.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Display Order</label>
                  <input
                    type="number"
                    value={chart.order}
                    onChange={(e) => handleUpdateChart(chart.id, { order: parseInt(e.target.value) || 0 })}
                    className="pro-input w-full px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <div className="p-4 bg-[#0066CC]/5 border border-[#0066CC]/10 rounded-2xl">
                <div className="flex items-center gap-3 text-[#00A3E0]">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-[11px] font-bold uppercase tracking-wider">
                    {chart.chartType === 'pareto' 
                      ? "Pareto charts automatically calculate frequencies and cumulative percentages based on the selected field."
                      : "General charts will plot raw data from the selected field."}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {formConfig.analytics?.charts?.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem]">
              <p className="text-white/20 font-black uppercase tracking-widest">No charts configured yet</p>
              <Button onClick={handleAddChart} variant="link" className="text-[#00A3E0] mt-2">
                Click here to add your first analysis chart
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FIELDS TAB
// ============================================================================

interface FieldsTabProps {
  formConfig: Partial<DynamicForm>;
  onUpdate: (config: Partial<DynamicForm>) => void;
  onUpdateField: (fieldId: string, updates: Partial<DynamicField>) => void;
  onRemoveField: (fieldId: string) => void;
  hideTypeSelector: boolean;
}

function FieldsTab({ formConfig, onUpdate, onUpdateField, onRemoveField, hideTypeSelector }: FieldsTabProps) {
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const { optionSets } = useConfigStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Form Fields</h3>

      {/* Form Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Form Name</label>
          <input
            type="text"
            value={formConfig.name || ''}
            onChange={(e) => onUpdate({ ...formConfig, name: e.target.value })}
            className="pro-input w-full px-4 py-3 text-sm"
            placeholder="Enter form name"
          />
        </div>
        <div>
          <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Form Type</label>
          {hideTypeSelector ? (
            <div className="pro-input w-full px-4 py-3 text-[#00A3E0] text-sm font-bold bg-[#0066CC]/5">
              {String(formConfig.type || 'custom').toUpperCase()}
            </div>
          ) : (
            <select
              value={formConfig.type}
              onChange={(e) => onUpdate({ ...formConfig, type: e.target.value as any })}
              className="pro-input w-full px-4 py-3 text-sm appearance-none bg-[#1a1a1f] text-white"
            >
              <option value="ncr" className="bg-[#1a1a1f] text-white">NCR</option>
              <option value="capa" className="bg-[#1a1a1f] text-white">CAPA</option>
              <option value="8d" className="bg-[#1a1a1f] text-white">8D</option>
              <option value="audit" className="bg-[#1a1a1f] text-white">Audit</option>
              <option value="fmea" className="bg-[#1a1a1f] text-white">FMEA</option>
              <option value="deviation" className="bg-[#1a1a1f] text-white">Deviation</option>
              <option value="change-control" className="bg-[#1a1a1f] text-white">Change Control</option>
              <option value="control-plan" className="bg-[#1a1a1f] text-white">Control Plan</option>
              <option value="complaint" className="bg-[#1a1a1f] text-white">Complaint</option>
              <option value="custom" className="bg-[#1a1a1f] text-white">Custom</option>
            </select>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Description</label>
          <input
            type="text"
            value={formConfig.description || ''}
            onChange={(e) => onUpdate({ ...formConfig, description: e.target.value })}
            className="pro-input w-full px-4 py-3 text-sm"
            placeholder="Enter form description..."
          />
        </div>
      </div>

      {/* Fields List */}
      <div className="space-y-2">
        {formConfig.fields?.map((field: DynamicField, index: number) => (
          <div
            key={field.id}
            onClick={() => setSelectedField(field.id)}
            className={`
              p-4 rounded-lg border cursor-pointer transition-all
              ${selectedField === field.id
                ? 'border-[#00A3E0] bg-[#00A3E0]/10'
                : 'border-white/10 hover:border-white/20'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-400">#{index + 1}</span>
                <div className="w-8 h-8 rounded bg-[#0066CC]/20 flex items-center justify-center">
                  {(() => {
                    const Icon = fieldTypeIcons[field.type];
                    return <Icon className="w-4 h-4 text-[#00A3E0]" />;
                  })()}
                </div>
                <div>
                  <p className="font-medium text-white">{field.label}</p>
                  <p className="text-xs text-gray-500">{fieldTypeLabels[field.type]} • {field.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {field.validation?.required && (
                  <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">Required</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveField(field.id);
                  }}
                  className="p-1 text-gray-500 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Field Editor (when selected) */}
            {selectedField === field.id && (
              <div className="mt-6 pt-6 border-t border-white/5 space-y-6 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Field Label *</label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => onUpdateField(field.id, { label: e.target.value })}
                      className="pro-input w-full px-4 py-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Field Name *</label>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => onUpdateField(field.id, { name: e.target.value })}
                      className="pro-input w-full px-4 py-3 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Placeholder</label>
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => onUpdateField(field.id, { placeholder: e.target.value })}
                      className="pro-input w-full px-4 py-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Help Text</label>
                    <input
                      type="text"
                      value={field.helpText || ''}
                      onChange={(e) => onUpdateField(field.id, { helpText: e.target.value })}
                      className="pro-input w-full px-4 py-3 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Assign to Section</label>
                    <select
                      value={field.section || ''}
                      onChange={(e) => {
                        const newSectionId = e.target.value || undefined;
                        const oldSectionId = field.section;
                        
                        onUpdateField(field.id, { section: newSectionId });
                        
                        const newSections = formConfig.sections?.map(s => {
                          let updatedFields = [...(s.fields || [])];
                          if (oldSectionId && s.id === oldSectionId) {
                            updatedFields = updatedFields.filter(id => id !== field.id);
                          }
                          if (newSectionId && s.id === newSectionId) {
                            if (!updatedFields.includes(field.id)) {
                              updatedFields.push(field.id);
                            }
                          }
                          return { ...s, fields: updatedFields };
                        });
                        
                        onUpdate({ sections: newSections });
                      }}
                      className="pro-input w-full px-4 py-3 text-sm appearance-none"
                    >
                      <option value="" className="bg-[#1a1a1f] text-white/50">No Section</option>
                      {formConfig.sections?.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#1a1a1f] text-white">{s.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {(field.type === 'select' || field.type === 'radio' || field.type === 'multiselect' || field.type === 'button-group' || field.type === 'checkbox-group') && (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Options Source</label>
                        <select
                          value={field.optionSetId || ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '') {
                              onUpdateField(field.id, { optionSetId: undefined });
                            } else {
                              onUpdateField(field.id, { optionSetId: v, options: [] });
                            }
                          }}
                          className="pro-input w-full px-4 py-3 text-sm appearance-none bg-[#1a1a1f] text-white"
                        >
                          <option value="" className="bg-[#1a1a1f] text-white/50">Inline Options</option>
                          {optionSets.map((s) => (
                            <option key={s.id} value={s.id} className="bg-[#1a1a1f] text-white">
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => navigate('/admin/dropdowns')}
                          className="px-6 py-3 rounded-xl border border-[#0066CC]/20 bg-[#0066CC]/5 text-[#00A3E0] text-sm font-bold hover:bg-[#0066CC]/10 transition-all"
                        >
                          Manage Dropdown Lists
                        </button>
                      </div>
                    </div>

                    {field.chart?.dataMode === 'bind' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400">Bind X Field</label>
                          <select
                            value={field.chart?.bind?.xField || ''}
                            onChange={(e) =>
                              onUpdateField(field.id, {
                                chart: {
                                  ...(field.chart as any),
                                  bind: {
                                    ...(field.chart?.bind || {}),
                                    xField: e.target.value || undefined,
                                  },
                                },
                              })
                            }
                            className="w-full mt-1 px-3 py-2 rounded border border-white/10 bg-transparent text-white"
                          >
                            <option value="">Select field</option>
                            {(formConfig.fields || [])
                              .filter((f: DynamicField) => f.id !== field.id)
                              .map((f: DynamicField) => (
                                <option key={f.id} value={f.name}>
                                  {f.label} ({f.name})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-sm text-gray-400">Bind Y Field</label>
                          <select
                            value={field.chart?.bind?.yField || ''}
                            onChange={(e) =>
                              onUpdateField(field.id, {
                                chart: {
                                  ...(field.chart as any),
                                  bind: {
                                    ...(field.chart?.bind || {}),
                                    yField: e.target.value || undefined,
                                  },
                                },
                              })
                            }
                            className="w-full mt-1 px-3 py-2 rounded border border-white/10 bg-transparent text-white"
                          >
                            <option value="">Select field</option>
                            {(formConfig.fields || [])
                              .filter((f: DynamicField) => f.id !== field.id)
                              .map((f: DynamicField) => (
                                <option key={f.id} value={f.name}>
                                  {f.label} ({f.name})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {!field.optionSetId && (
                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Inline Options</label>
                        <div className="space-y-3">
                          {field.options?.map((opt: FieldOption, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 animate-in slide-in-from-left-2 duration-200">
                              <input
                                type="text"
                                value={opt.value}
                                onChange={(e) => {
                                  const newOptions = [...(field.options || [])];
                                  newOptions[idx] = { ...opt, value: e.target.value };
                                  onUpdateField(field.id, { options: newOptions });
                                }}
                                placeholder="Value"
                                className="pro-input flex-1 px-4 py-2 text-sm"
                              />
                              <input
                                type="text"
                                value={opt.label}
                                onChange={(e) => {
                                  const newOptions = [...(field.options || [])];
                                  newOptions[idx] = { ...opt, label: e.target.value };
                                  onUpdateField(field.id, { options: newOptions });
                                }}
                                placeholder="Label"
                                className="pro-input flex-1 px-4 py-2 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = (field.options || []).filter((_, i) => i !== idx);
                                  onUpdateField(field.id, { options: newOptions });
                                }}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newOption = { value: `option-${(field.options?.length || 0) + 1}`, label: 'New Option' };
                              onUpdateField(field.id, {
                                options: [...(field.options || []), newOption]
                              });
                            }}
                            className="flex items-center gap-2 text-sm font-bold text-[#00A3E0] hover:text-[#0066CC] transition-colors px-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add New Option
                          </button>
                        </div>
                      </div>
                    )}

                    {field.optionSetId && (
                      <div className="p-4 bg-[#0066CC]/5 border border-[#0066CC]/20 rounded-xl flex items-center gap-3">
                        <Database className="w-4 h-4 text-[#00A3E0]" />
                        <span className="text-xs font-bold text-white/60">Using global dataset:</span>
                        <span className="text-xs font-black text-[#00A3E0] uppercase tracking-wider">{field.optionSetId}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Formula Configuration */}
                {field.type === 'formula' && (
                  <div className="pro-card p-6 space-y-4 border-white/5 bg-white/[0.02]">
                    <label className="flex items-center gap-3 text-xs font-black text-white/40 uppercase tracking-widest px-1">
                      <Calculator className="w-4 h-4 text-[#00A3E0]" />
                      Formula Expression
                    </label>
                    <FormulaEditor
                      expression={field.formula?.expression || ''}
                      availableFields={formConfig.fields?.filter(f => f.id !== field.id).map(f => ({ 
                        name: f.name, 
                        label: f.label, 
                        type: f.type 
                      })) || []}
                      onChange={(formula) => onUpdateField(field.id, { formula })}
                    />
                  </div>
                )}

                {/* Lookup Configuration */}
                {field.type === 'lookup' && (
                  <div className="pro-card p-6 space-y-4 border-white/5 bg-white/[0.02]">
                    <label className="flex items-center gap-3 text-xs font-black text-white/40 uppercase tracking-widest px-1">
                      <Database className="w-4 h-4 text-[#00A3E0]" />
                      Lookup Configuration
                    </label>
                    <LookupSelector
                      config={field.lookup || { sourceType: 'internal' }}
                      availableFields={formConfig.fields?.filter(f => f.id !== field.id).map(f => ({ 
                        id: f.id, 
                        name: f.name, 
                        label: f.label 
                      })) || []}
                      onChange={(lookup) => {
                        onUpdateField(field.id, { 
                          lookup: lookup as LookupConfig, 
                          dependsOn: lookup.filterValue 
                        });
                      }}
                    />
                  </div>
                )}

                {/* Chart Configuration */}
                {field.type === 'chart' && (
                  <div className="pro-card p-6 space-y-6 border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3 text-xs font-black text-white/40 uppercase tracking-widest px-1">
                        <BarChart3 className="w-4 h-4 text-[#00A3E0]" />
                        Chart Configuration
                      </label>
                      <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 font-bold uppercase tracking-tighter">
                        Field Visualizer
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0066CC]/5 border border-[#0066CC]/10 text-[11px] leading-relaxed text-[#00A3E0] font-medium italic">
                      Tip: Use <span className="font-black text-white underline">Manual</span> for entering X/Y values inside the form. Use <span className="font-black text-white underline">Bind</span> to plot values from other fields automatically.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Chart Type</label>
                        <select
                          value={field.chart?.chartType || 'bar'}
                          onChange={(e) =>
                            onUpdateField(field.id, {
                              chart: {
                                ...(field.chart as any),
                                chartType: e.target.value as any,
                              },
                            })
                          }
                          className="pro-input w-full px-4 py-3 text-sm appearance-none"
                        >
                          <option value="bar" className="bg-[#1a1a1f]">Bar Chart</option>
                          <option value="line" className="bg-[#1a1a1f]">Line Chart</option>
                          <option value="pie" className="bg-[#1a1a1f]">Pie Chart</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Data Mode</label>
                        <select
                          value={field.chart?.dataMode || 'manual'}
                          onChange={(e) =>
                            onUpdateField(field.id, {
                              chart: {
                                ...(field.chart as any),
                                dataMode: e.target.value as any,
                              },
                            })
                          }
                          className="pro-input w-full px-4 py-3 text-sm appearance-none"
                        >
                          <option value="manual" className="bg-[#1a1a1f]">Manual Entry</option>
                          <option value="bind" className="bg-[#1a1a1f]">Bind to Fields</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">X Axis Label</label>
                        <input
                          type="text"
                          value={field.chart?.xLabel || ''}
                          onChange={(e) =>
                            onUpdateField(field.id, {
                              chart: { ...(field.chart as any), xLabel: e.target.value },
                            })
                          }
                          className="pro-input w-full px-4 py-3 text-sm"
                          placeholder="e.g. Month"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Y Axis Label</label>
                        <input
                          type="text"
                          value={field.chart?.yLabel || ''}
                          onChange={(e) =>
                            onUpdateField(field.id, {
                              chart: { ...(field.chart as any), yLabel: e.target.value },
                            })
                          }
                          className="pro-input w-full px-4 py-3 text-sm"
                          placeholder="e.g. Quantity"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Series Label</label>
                        <input
                          type="text"
                          value={field.chart?.seriesLabel || ''}
                          onChange={(e) =>
                            onUpdateField(field.id, {
                              chart: { ...(field.chart as any), seriesLabel: e.target.value },
                            })
                          }
                          className="pro-input w-full px-4 py-3 text-sm"
                          placeholder="e.g. Production"
                        />
                      </div>
                    </div>

                    {field.chart?.dataMode !== 'bind' && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-300">Manual Data (X, Y)</p>
                        <div className="space-y-2">
                          {(field.chart?.manualData || []).map((pt: ChartDataPoint, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={pt.x}
                                onChange={(e) => {
                                  const next = [...(field.chart?.manualData || [])];
                                  next[idx] = { ...pt, x: e.target.value };
                                  onUpdateField(field.id, { chart: { ...(field.chart as any), manualData: next } });
                                }}
                                placeholder="X"
                                className="flex-1 px-3 py-1.5 rounded border border-white/10 bg-transparent text-white text-sm"
                              />
                              <input
                                type="number"
                                value={pt.y}
                                onChange={(e) => {
                                  const next = [...(field.chart?.manualData || [])];
                                  next[idx] = { ...pt, y: Number(e.target.value) || 0 };
                                  onUpdateField(field.id, { chart: { ...(field.chart as any), manualData: next } });
                                }}
                                placeholder="Y"
                                className="w-40 px-3 py-1.5 rounded border border-white/10 bg-transparent text-white text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = (field.chart?.manualData || []).filter((_, i) => i !== idx);
                                  onUpdateField(field.id, { chart: { ...(field.chart as any), manualData: next } });
                                }}
                                className="p-1 text-gray-500 hover:text-red-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...(field.chart?.manualData || []), { x: `Item ${(field.chart?.manualData?.length || 0) + 1}`, y: 0 }];
                            onUpdateField(field.id, { chart: { ...(field.chart as any), manualData: next } });
                          }}
                          className="text-sm text-[#00A3E0] hover:underline"
                        >
                          + Add Data Point
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Validation */}
                <div className="p-3 bg-white/5 rounded-lg space-y-3">
                  <p className="text-sm font-medium text-white">Validation</p>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={field.validation?.required || false}
                        onChange={(e) => onUpdateField(field.id, {
                          validation: { ...field.validation, required: e.target.checked }
                        })}
                        className="rounded border-white/30"
                      />
                      Required
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={field.visible}
                        onChange={(e) => onUpdateField(field.id, { visible: e.target.checked })}
                        className="rounded border-white/30"
                      />
                      Visible
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={field.editable}
                        onChange={(e) => onUpdateField(field.id, { editable: e.target.checked })}
                        className="rounded border-white/30"
                      />
                      Editable
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SETTINGS TAB
// ============================================================================

function SettingsTab({
  formConfig,
  onUpdate
}: {
  formConfig: Partial<DynamicForm>;
  onUpdate: React.Dispatch<React.SetStateAction<Partial<DynamicForm>>>;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Form Settings</h3>

      {/* General Settings */}
      <div className="pro-card p-6 space-y-6 border-white/5 bg-white/[0.02]">
        <h4 className="text-sm font-black text-white/40 uppercase tracking-widest px-1">General Configuration</h4>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Industry Standard</label>
            <select
              value={formConfig.industryStandard || 'custom'}
              onChange={(e) => onUpdate({ industryStandard: e.target.value as DynamicForm['industryStandard'] })}
              className="pro-input w-full px-4 py-3 text-sm appearance-none"
            >
              <option value="custom" className="bg-[#1a1a1f]">Custom Standard</option>
              <option value="ISO9001" className="bg-[#1a1a1f]">ISO 9001</option>
              <option value="ISO13485" className="bg-[#1a1a1f]">ISO 13485</option>
              <option value="AS9100" className="bg-[#1a1a1f]">AS 9100</option>
              <option value="FDA" className="bg-[#1a1a1f]">FDA / 21 CFR Part 11</option>
              <option value="IATF16949" className="bg-[#1a1a1f]">IATF 16949</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Initial Status</label>
            <div className="flex items-center h-[52px]">
              <label className="flex items-center gap-3 p-3 px-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors group">
                <input
                  type="checkbox"
                  checked={formConfig.isActive || false}
                  onChange={(e) => onUpdate({ isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#0066CC] focus:ring-[#0066CC]/20"
                />
                <span className="text-sm font-bold text-white/60 group-hover:text-white">Form is Published</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Auto Numbering */}
      <div className="pro-card p-6 space-y-6 border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-white/40 uppercase tracking-widest px-1">ID Generation</h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formConfig.autoNumbering?.enabled || false}
              onChange={(e) => onUpdate({
                autoNumbering: {
                  ...formConfig.autoNumbering,
                  enabled: e.target.checked,
                  prefix: formConfig.autoNumbering?.prefix || '',
                  startingNumber: formConfig.autoNumbering?.startingNumber || 1
                }
              })}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#0066CC]"
            />
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Enable Auto-Numbering</span>
          </label>
        </div>

        {formConfig.autoNumbering?.enabled && (
          <div className="grid grid-cols-2 gap-6 pl-2 animate-in slide-in-from-top-2 duration-300">
            <div>
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">ID Prefix</label>
              <input
                type="text"
                value={formConfig.autoNumbering?.prefix || ''}
                onChange={(e) => onUpdate({
                  autoNumbering: {
                    enabled: formConfig.autoNumbering?.enabled ?? false,
                    prefix: e.target.value,
                    suffix: formConfig.autoNumbering?.suffix,
                    startingNumber: formConfig.autoNumbering?.startingNumber ?? 1
                  }
                })}
                className="pro-input w-full px-4 py-3 text-sm"
                placeholder="e.g., NCR-"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">Starting Serial</label>
              <input
                type="number"
                value={formConfig.autoNumbering?.startingNumber || 1}
                onChange={(e) => onUpdate({
                  autoNumbering: {
                    enabled: formConfig.autoNumbering?.enabled ?? false,
                    prefix: formConfig.autoNumbering?.prefix ?? '',
                    suffix: formConfig.autoNumbering?.suffix,
                    startingNumber: Number(e.target.value)
                  }
                })}
                className="pro-input w-full px-4 py-3 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Approvals */}
      <div className="p-4 bg-white/5 rounded-lg space-y-4">
        <h4 className="font-medium text-white">Approval Workflow</h4>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formConfig.approvals?.required || false}
            onChange={(e) => onUpdate({
              approvals: {
                required: e.target.checked,
                levels: formConfig.approvals?.levels || [{ level: 1, name: 'Level 1', approvers: [] }]
              }
            })}
            className="rounded border-white/30"
          />
          <span className="text-sm text-gray-300">Require approvals</span>
        </div>

        {formConfig.approvals?.required && (
          <div className="pl-6 space-y-3">
            {formConfig.approvals.levels.map((level: ApprovalLevel, idx: number) => (
              <div key={idx} className="p-3 bg-white/5 rounded">
                <p className="text-sm font-medium text-white">Level {level.level}: {level.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Approvers: {level.approvers.join(', ') || 'None assigned'}
                </p>
              </div>
            ))}
            <button
              onClick={() => {
                const currentLevels = formConfig.approvals?.levels || [];
                onUpdate({
                  approvals: {
                    required: formConfig.approvals?.required ?? false,
                    levels: [
                      ...currentLevels,
                      { level: currentLevels.length + 1, name: `Level ${currentLevels.length + 1}`, approvers: [] }
                    ]
                  }
                });
              }}
              className="text-sm text-[#00A3E0] hover:underline"
            >
              + Add Approval Level
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PREVIEW TAB
// ============================================================================

interface PreviewTabProps {
  formConfig: Partial<DynamicForm>;
}

function PreviewTab({ formConfig }: PreviewTabProps) {
  if (!formConfig.fields || formConfig.fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Eye className="w-12 h-12 text-gray-600 mb-4" />
        <p className="text-gray-500">Add fields to preview the form</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 p-3 bg-[#00A3E0]/10 rounded-lg border border-[#00A3E0]/30">
        <p className="text-sm text-[#00A3E0] flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          This is a preview. Form validation and conditional logic are active.
        </p>
      </div>

      <DynamicFormRenderer
        config={formConfig as DynamicForm}
        initialValues={formConfig.fields?.reduce((acc, field) => {
          acc[field.name] = field.defaultValue || '';
          return acc;
        }, {} as Record<string, unknown>) || {}}
        onSubmit={async (data: Record<string, unknown>) => {
          toast.success('Form validation passed!', {
            description: `${Object.keys(data).length} fields submitted`
          });
        }}
        showSubmitButton={true}
        submitLabel="Test Submit"
      />
    </div>
  );
}

// ============================================================================
// DATA SOURCE MANAGER
// ============================================================================

function DataSourceManager() {
  const { externalDataSources, addExternalDataSource, deleteExternalDataSource } = useConfigStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const dataJson = XLSX.utils.sheet_to_json(ws);

        addExternalDataSource({
          name: file.name.replace(/\.[^/.]+$/, ""),
          type: 'excel',
          data: dataJson as any[]
        });
        toast.success('Excel data imported successfully');
      } catch (err) {
        toast.error('Failed to parse Excel file');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">External Data Sources</h3>
          <p className="text-sm text-gray-400">Manage Excel sheets and JSON data for form lookups</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#0066CC] hover:bg-[#0052a3] text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {externalDataSources.map((ds) => (
          <div key={ds.id} className="pro-card p-6 border-white/5 bg-white/[0.02] hover:bg-white/[0.04]">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-[#00A3E0]/10 border border-[#00A3E0]/20">
                <Database className="w-6 h-6 text-[#00A3E0]" />
              </div>
              <button 
                onClick={() => deleteExternalDataSource(ds.id)}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <h4 className="font-black text-white text-lg mb-1 tracking-tight">{ds.name}</h4>
            <div className="flex items-center gap-2 mb-6">
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#0066CC]/20 text-[#00A3E0] uppercase tracking-widest font-black border border-[#0066CC]/20">
                {ds.type}
              </span>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">
                {ds.data?.length || 0} DATA ROWS
              </span>
            </div>
            <div className="pt-4 border-t border-white/5 text-[10px] text-white/30 font-medium flex items-center gap-2">
              <RefreshCw className="w-3 h-3" />
              SYNCED: {ds.lastUpdated ? new Date(ds.lastUpdated).toLocaleString() : 'NEVER'}
            </div>
          </div>
        ))}

        {externalDataSources.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-white/5 rounded-xl border border-dashed border-white/10">
            <Database className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-gray-400">No data sources added yet</p>
            <p className="text-sm text-gray-500 mt-1">Upload an Excel file to start using lookups in your forms</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FormBuilderPage;
