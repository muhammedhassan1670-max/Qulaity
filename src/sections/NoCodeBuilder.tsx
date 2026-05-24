import { useState, useRef, useEffect } from 'react';
import {
  Blocks,
  Plus,
  Settings,
  Eye,
  Save,
  Database,
  Layout,
  Workflow,
  GripVertical,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  CheckSquare,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  FileText,
  Image,
  Link,
  Mail,
  Phone,
  Search,
  ChevronRight,
  Play,
  PenTool,
  FileSpreadsheet
} from 'lucide-react';
import { gsap } from 'gsap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useConfigStore, type DynamicForm } from '../stores/configStore';
import { DynamicFormRenderer } from '../components/DynamicFormRenderer';
import { FormBuilderPage, type FormBuilderHandle } from '../pages/admin/FormBuilder';
import { ExcelFormGenerator } from '../components/ExcelFormGenerator';

// Field types for form builder
const fieldTypes = [
  { id: 'text', name: 'Text', icon: Type, description: 'Single line text input' },
  { id: 'number', name: 'Number', icon: Hash, description: 'Numeric input field' },
  { id: 'multiselect', name: 'Multi-select', icon: List, description: 'Multiple selection' },
  { id: 'checkbox-group', name: 'Checklist', icon: CheckSquare, description: 'Group of checkboxes' },
  { id: 'button-group', name: 'Button Group', icon: ToggleLeft, description: 'Quick choice buttons' },
  { id: 'date', name: 'Date', icon: Calendar, description: 'Date picker' },
  { id: 'toggle', name: 'Toggle', icon: ToggleLeft, description: 'Yes/No switch' },
  { id: 'select', name: 'Dropdown', icon: List, description: 'Single select dropdown' },
  { id: 'textarea', name: 'Text Area', icon: FileText, description: 'Multi-line text' },
  { id: 'image', name: 'Image', icon: Image, description: 'Image upload' },
  { id: 'file', name: 'File', icon: FileText, description: 'File attachment' },
  { id: 'link', name: 'URL', icon: Link, description: 'Web link' },
  { id: 'email', name: 'Email', icon: Mail, description: 'Email address' },
  { id: 'phone', name: 'Phone', icon: Phone, description: 'Phone number' },
  { id: 'lookup', name: 'Lookup', icon: Search, description: 'Search data from Excel/Forms' },
  { id: 'formula', name: 'Formula', icon: Database, description: 'Calculated field with math/logic' },
];

// Mock saved tables
const savedTables = [] as any[];

// Mock saved dashboards
const savedDashboards = [] as any[];

// Mock saved workflows
const savedWorkflows = [] as any[];

export function NoCodeBuilder() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('forms');
  const [showBuilder, setShowBuilder] = useState(false);
  const [activeForm, setActiveForm] = useState<DynamicForm | null>(null);
  const [isBuildingForm, setIsBuildingForm] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const formBuilderRef = useRef<FormBuilderHandle>(null);
  const { forms } = useConfigStore();
  const [, setGeneratedFormDraft] = useState<DynamicForm | null>(null);
  
  const [formFields, setFormFields] = useState<Array<{ id: string; type: string; name: string; label: string }>>([]);
  const [draggedField, setDraggedField] = useState<string | null>(null);

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current.querySelectorAll('.animate-item'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, []);

  const handleDragStart = (fieldType: string) => {
    setDraggedField(fieldType);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedField) {
      const fieldType = fieldTypes.find(f => f.id === draggedField);
      if (fieldType) {
        const needsOptions = ['select', 'radio', 'multiselect', 'button-group', 'checkbox-group'].includes(draggedField);
        
        setFormFields([...formFields, {
          id: `field-${Date.now()}`,
          type: draggedField,
          name: `field_${formFields.length + 1}`,
          label: fieldType.name,
          ...(needsOptions ? {
            options: [
              { value: 'option-1', label: 'Option 1' },
              { value: 'option-2', label: 'Option 2' }
            ]
          } : {})
        }]);
        toast.success(`${fieldType.name} field added`);
      }
      setDraggedField(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeField = (id: string) => {
    setFormFields(formFields.filter(f => f.id !== id));
  };

  const handleCreateFormClick = () => {
    setIsBuildingForm(true);
    setTimeout(() => {
      formBuilderRef.current?.openBuilder();
    }, 100);
  };

  const handleEditFormClick = (form: DynamicForm) => {
    setIsBuildingForm(true);
    setTimeout(() => {
      formBuilderRef.current?.openBuilder(form);
    }, 100);
  };

  const handleExcelFormGenerated = (form: DynamicForm) => {
    setGeneratedFormDraft(form);
    setIsImportingExcel(false);
    setIsBuildingForm(true);
    // Open builder with the pre-populated form after a tick
    setTimeout(() => {
      formBuilderRef.current?.openBuilder(form);
    }, 150);
  };

  const renderFormsView = () => {
    const publishedForms = forms;

    if (isImportingExcel) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0077ff]/10 flex items-center justify-center border border-[#0077ff]/20">
                <FileSpreadsheet className="w-5 h-5 text-[#00d2ff]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Generate Form from Excel</h3>
                <p className="text-gray-500 text-sm">Upload a spreadsheet and we'll build the form automatically</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsImportingExcel(false)} className="border border-white/10 text-gray-500 hover:text-white">
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back to Forms
            </Button>
          </div>
          <ExcelFormGenerator
            onFormGenerated={handleExcelFormGenerated}
            onCancel={() => setIsImportingExcel(false)}
          />
        </div>
      );
    }

    if (isBuildingForm) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={() => setIsBuildingForm(false)} className="border-white/10">
              <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
              Back to Forms
            </Button>
          </div>
          <div className="pro-card p-6 rounded-[2rem] border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
            <FormBuilderPage
              ref={formBuilderRef}
              onSaved={() => {
                setIsBuildingForm(false);
                setGeneratedFormDraft(null);
              }}
            />
          </div>
        </div>
      );
    }

    if (activeForm) {
      return (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setActiveForm(null)} 
                className="pro-card border-white/10 hover:bg-white/5 h-14 w-14 rounded-2xl p-0 flex items-center justify-center"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </Button>
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight">{activeForm.name}</h3>
                <p className="text-white/40 text-sm font-medium uppercase tracking-widest mt-1">Data Entry Protocol</p>
              </div>
            </div>
          </div>
          <div className="pro-card p-12 rounded-[2.5rem] border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
            <DynamicFormRenderer 
              config={activeForm} 
              onSubmit={(data) => {
                console.log('Submitted:', data);
                toast.success('Form entry recorded successfully');
                setActiveForm(null);
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Custom Forms</h3>
            <p className="text-sm text-gray-400">{publishedForms.length} forms available</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-[#0077ff]/30 bg-[#0077ff]/5 text-[#00d2ff] hover:bg-[#0077ff]/15 hover:text-white"
              onClick={() => setIsImportingExcel(true)}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Import from Excel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0]"
              onClick={handleCreateFormClick}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Form
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publishedForms.map((form) => (
            <Card 
              key={form.id} 
              className="glass-panel border-[var(--section-border)] hover:border-[#00A3E0]/30 transition-all group"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0066CC]/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#0066CC]" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={form.isActive ? 'bg-green-500/20 text-green-400 border-none' : 'bg-gray-500/20 text-gray-400 border-none'}>
                      {form.isActive ? 'Active' : 'Draft'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-white/10 text-gray-500">{form.type}</Badge>
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-1">{form.name}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{form.description || 'No description provided'}</p>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setActiveForm(form)}
                    className="flex-1 bg-[#0066CC]/10 text-[#00A3E0] hover:bg-[#0066CC] hover:text-white border border-[#0066CC]/20"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Entry
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleEditFormClick(form)}
                    className="flex-none p-2 bg-white/5 border-white/10 hover:bg-white/10"
                    title="Edit Form Design"
                  >
                    <PenTool className="w-4 h-4 text-gray-400 hover:text-white" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {publishedForms.length === 0 && (
            <div className="col-span-full py-12 text-center glass-panel border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-[#00d2ff]/50 transition-colors" onClick={handleCreateFormClick}>
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                 <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg">Create New Custom Form</p>
              <p className="text-sm text-gray-500">Design dynamic data entry interfaces with drag & drop</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTablesView = () => (
    <div className="space-y-6">
      {!showBuilder ? (
        <>
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search tables..."
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#00A3E0] w-64"
              />
            </div>
            <Button 
              className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0]"
              onClick={() => setShowBuilder(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Table
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedTables.map((table) => (
              <Card 
                key={table.id} 
                className="glass-panel border-[var(--section-border)] cursor-pointer hover:border-[#00A3E0]/30 transition-all"
                onClick={() => toast.info(`Selected ${table.name}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#0066CC]/20 flex items-center justify-center">
                      <Database className="w-6 h-6 text-[#0066CC]" />
                    </div>
                    <Badge variant="outline" className="border-white/20">
                      {table.fields} fields
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{table.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">{table.records} records</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Modified {table.lastModified}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info('Table actions', { description: table.name });
                      }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Create New Card */}
            <Card 
              className="glass-panel border-[var(--section-border)] border-dashed cursor-pointer hover:border-[#00A3E0]/50 transition-all flex items-center justify-center min-h-[180px]"
              onClick={() => setShowBuilder(true)}
            >
              <CardContent className="p-5 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-400">Create New Table</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setShowBuilder(false)} className="border-white/10">
                <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                Back
              </Button>
              <div>
                <h3 className="text-lg font-semibold">Table Builder</h3>
                <p className="text-sm text-gray-400">Drag fields to create your table structure</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-white/10" onClick={() => toast.info('Preview mode', { description: 'Preview functionality coming soon' })}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm" className="border-white/10" onClick={() => toast.success('Draft saved', { description: 'Your table draft has been saved' })}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0]"
                onClick={() => {
                  toast.success('Table created successfully');
                  setShowBuilder(false);
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Field Palette */}
            <div className="lg:col-span-1">
              <Card className="glass-panel border-[var(--section-border)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Field Types</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {fieldTypes.map((field) => (
                      <div
                        key={field.id}
                        draggable
                        onDragStart={() => handleDragStart(field.id)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 cursor-move hover:bg-white/10 transition-colors"
                      >
                        <field.icon className="w-4 h-4 text-[#00A3E0]" />
                        <div>
                          <p className="text-sm font-medium">{field.name}</p>
                          <p className="text-xs text-gray-500">{field.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form Canvas */}
            <div className="lg:col-span-2">
              <Card 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="min-h-[500px] glass-panel rounded-2xl border-2 border-dashed border-[var(--section-border)] flex flex-col p-0 relative"
              >
                <CardHeader className="pb-3 border-b border-[var(--section-border)]">
                  <div className="flex items-center justify-between">
                    <input 
                      type="text" 
                      placeholder="Table Name"
                      className="bg-transparent text-lg font-semibold focus:outline-none placeholder-gray-500"
                    />
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => toast.info('Settings', { description: 'Field settings coming soon' })}>
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {formFields.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                      <Blocks className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Drag fields from the palette to build your table</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formFields.map((field, index) => (
                        <div 
                          key={field.id} 
                          className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-[var(--section-border)]"
                        >
                          <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <input 
                                type="text" 
                                value={field.label}
                                onChange={(e) => {
                                  const updated = [...formFields];
                                  updated[index].label = e.target.value;
                                  setFormFields(updated);
                                }}
                                className="bg-transparent font-medium focus:outline-none"
                              />
                              <Badge variant="outline" className="text-xs border-white/20">
                                {field.type}
                              </Badge>
                            </div>
                            <input 
                              type="text" 
                              placeholder="Field description..."
                              className="w-full bg-transparent text-sm text-gray-500 focus:outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => toast.info('Field settings', { description: 'Field settings coming soon' })}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-400"
                              onClick={() => removeField(field.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Properties Panel */}
            <div className="lg:col-span-1">
              <Card className="glass-panel border-[var(--section-border)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Properties</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Table Description</label>
                    <textarea 
                      placeholder="Enter description..."
                      className="w-full h-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm resize-none focus:outline-none focus:border-[#00A3E0]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Permissions</label>
                    <div className="space-y-2">
                      {['View', 'Create', 'Edit', 'Delete'].map((perm) => (
                        <label key={perm} className="flex items-center gap-2">
                          <input type="checkbox" className="rounded border-white/20" />
                          <span className="text-sm">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Workflow</label>
                    <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#00A3E0]">
                      <option>No workflow</option>
                      <option>NCR Approval</option>
                      <option>CAPA Process</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDashboardsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search dashboards..."
            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#00A3E0] w-64"
          />
        </div>
        <Button className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0]" onClick={() => { toast.info('Create Dashboard', { description: 'Dashboard builder coming soon' }); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedDashboards.map((dashboard) => (
          <Card
            key={dashboard.id}
            className="glass-panel border-white/10 cursor-pointer hover:border-[#00A3E0]/30 transition-all"
            onClick={() => toast.info('Selected Dashboard', { description: dashboard.name })}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#00A3E0]/20 flex items-center justify-center">
                  <Layout className="w-6 h-6 text-[#00A3E0]" />
                </div>
                <Badge variant="outline" className="border-white/20">
                  {dashboard.components} components
                </Badge>
              </div>
              <h3 className="font-semibold text-white mb-1">{dashboard.name}</h3>
              <p className="text-sm text-gray-400 mb-3">{dashboard.views} views</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Modified {dashboard.lastModified}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toast.info('Dashboard actions', { description: dashboard.name })}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Card
          className="glass-panel border-white/10 border-dashed cursor-pointer hover:border-[#00A3E0]/50 transition-all flex items-center justify-center min-h-[180px]"
          onClick={() => toast.info('Create Dashboard', { description: 'Dashboard builder coming soon' })}
        >
          <CardContent className="p-5 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400">Create New Dashboard</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderWorkflowsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search workflows..."
            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#00A3E0] w-64"
          />
        </div>
        <Button className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0]" onClick={() => { toast.info('Create Workflow', { description: 'Workflow builder coming soon' }); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedWorkflows.map((workflow) => (
          <Card
            key={workflow.id}
            className="glass-panel border-white/10 cursor-pointer hover:border-[#00A3E0]/30 transition-all"
            onClick={() => toast.info('Selected Workflow', { description: workflow.name })}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#00C853]/20 flex items-center justify-center">
                  <Workflow className="w-6 h-6 text-[#00C853]" />
                </div>
                <Badge 
                  variant="outline" 
                  className={workflow.status === 'Active' ? 'border-green-500 text-green-400' : 'border-yellow-500 text-yellow-400'}
                >
                  {workflow.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-white mb-1">{workflow.name}</h3>
              <p className="text-sm text-gray-400 mb-3">{workflow.nodes} nodes</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Last run: {workflow.lastRun}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toast.info('Workflow actions', { description: workflow.name })}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Card
          className="glass-panel border-white/10 border-dashed cursor-pointer hover:border-[#00A3E0]/50 transition-all flex items-center justify-center min-h-[180px]"
          onClick={() => toast.info('Create Workflow', { description: 'Workflow builder coming soon' })}
        >
          <CardContent className="p-5 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400">Create New Workflow</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div ref={sectionRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-item">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">No-Code Builder</h1>
          <p className="text-gray-400">Build custom tables, dashboards, and workflows without coding</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-item">
        <TabsList className="bg-white/5 border border-white/10 mb-6">
          <TabsTrigger value="forms" className="data-[state=active]:bg-[#0066CC]">
            <FileText className="w-4 h-4 mr-2" />
            Forms
          </TabsTrigger>
          <TabsTrigger value="tables" className="data-[state=active]:bg-[#0066CC]">
            <Database className="w-4 h-4 mr-2" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="dashboards" className="data-[state=active]:bg-[#0066CC]">
            <Layout className="w-4 h-4 mr-2" />
            Dashboards
          </TabsTrigger>
          <TabsTrigger value="workflows" className="data-[state=active]:bg-[#0066CC]">
            <Workflow className="w-4 h-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="views" className="data-[state=active]:bg-[#0066CC]">
            <Eye className="w-4 h-4 mr-2" />
            Custom Views
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="mt-0">
          {renderFormsView()}
        </TabsContent>

        <TabsContent value="tables" className="mt-0">
          {renderTablesView()}
        </TabsContent>

        <TabsContent value="dashboards" className="mt-0">
          {renderDashboardsView()}
        </TabsContent>

        <TabsContent value="workflows" className="mt-0">
          {renderWorkflowsView()}
        </TabsContent>

        <TabsContent value="views" className="mt-0">
          <div className="text-center py-20 text-gray-500">
            <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Custom Views Coming Soon</p>
            <p className="text-sm">Create personalized views for different user roles</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default NoCodeBuilder;
