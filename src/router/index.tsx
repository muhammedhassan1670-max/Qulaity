import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';

// Components
import { ProtectedRoute, PublicRoute } from '../components/ProtectedRoute';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { SectionLoader } from '../components/Loading';

// Eager loaded components
import App from '../App';
import { LoginPage } from '../pages/Auth';
import { AdminLoginPage } from '../pages/AdminLogin';

// Lazy loaded sections
const Dashboard = lazy(() => import('../sections/Dashboard'));
const QualityModules = lazy(() => import('../sections/QualityModules'));
const NoCodeBuilder = lazy(() => import('../sections/NoCodeBuilder'));
const AIIntelligence = lazy(() => import('../sections/AIIntelligence'));
const AIChatPage = lazy(() => import('../pages/AIChat'));
const DigitalTwin = lazy(() => import('../sections/DigitalTwin'));
const ProductionLayoutEditor = lazy(() => import('../pages/ProductionLayoutEditor'));
const SPCSystem = lazy(() => import('../sections/SPCSystem'));
const IoTIntegration = lazy(() => import('../sections/IoTIntegration'));
const ExecutiveMode = lazy(() => import('../sections/ExecutiveMode'));
const AdminPanel = lazy(() => import('../sections/AdminPanel'));

// Quality Pages
const RecordHubPage = lazy(() => import('../pages/quality/RecordHub'));
const NCRPage = lazy(() => import('../pages/quality/NCR'));
const NCRDetailsPage = lazy(() => import('../pages/quality/NCRDetails'));
const CAPAPage = lazy(() => import('../pages/quality/CAPA'));
const CAPADetailsPage = lazy(() => import('../pages/quality/CAPADetails'));
const D8Page = lazy(() => import('../pages/quality/D8'));
const DeviationPage = lazy(() => import('../pages/quality/Deviation'));
const ChangeControlPage = lazy(() => import('../pages/quality/ChangeControl'));
const ComplaintsPage = lazy(() => import('../pages/quality/Complaints'));
const ComplaintsDashboardPage = lazy(() => import('../pages/quality/ComplaintsDashboard'));
const ComplianceHubPage = lazy(() => import('../pages/quality/ComplianceHub'));
const AuditPage = lazy(() => import('../pages/quality/Audit'));
const AuditDetailsPage = lazy(() => import('../pages/quality/AuditDetails'));
const AuditReportPage = lazy(() => import('../pages/quality/AuditReport'));
const InspectionPage = lazy(() => import('../pages/quality/Inspection'));
const CalibrationPage = lazy(() => import('../pages/quality/Calibration'));
const FMEAPage = lazy(() => import('../pages/quality/FMEA'));
const FMEADetailsPage = lazy(() => import('../pages/quality/FMEADetails'));
const ControlPlanPage = lazy(() => import('../pages/quality/ControlPlan'));
const ControlPlanDetailsPage = lazy(() => import('../pages/quality/ControlPlanDetails'));
const SupplierQualityPage = lazy(() => import('../pages/quality/SupplierQuality'));
const SupplierDetailsPage = lazy(() => import('../pages/quality/SupplierDetails'));
const DefectCostPage = lazy(() => import('../pages/quality/DefectCost'));
const ProcessPPMPage = lazy(() => import('../pages/quality/ProcessPPM'));
const OutgoingQualityPage = lazy(() => import('../pages/quality/OutgoingQuality'));
const QualityIntelligencePage = lazy(() => import('../pages/quality/Intelligence'));
const DailyDefectsPage = lazy(() => import('../pages/quality/DailyDefects'));
const QualityHomePage = lazy(() => import('../pages/quality/QualityHome'));
const ShopfloorDefectEntryPage = lazy(() => import('../pages/quality/ShopfloorDefectEntry'));
const QualityInspectionPlansPage = lazy(() => import('../pages/quality/QualityInspectionPlans'));
const QualityExecutionBoardPage = lazy(() => import('../pages/quality/QualityExecutionBoard'));
const QualityLayeredAuditsPage = lazy(() => import('../pages/quality/QualityLayeredAudits'));
const QualityMasterDataPage = lazy(() => import('../pages/quality/QualityMasterData'));
const QualityCommandCenterPage = lazy(() => import('../pages/quality/QualityCommandCenter'));
const QualityKnowledgeBasePage = lazy(() => import('../pages/quality/QualityKnowledgeBase'));
const QualitySearchPage = lazy(() => import('../pages/quality/QualitySearch'));
const QualityFormDesignerPage = lazy(() => import('../pages/quality/QualityFormDesigner'));
const QualityLibraryPage = lazy(() => import('../pages/quality/QualityLibrary'));
const QualitySlidesPage = lazy(() => import('../pages/quality/QualitySlides'));
const QualityDashboardPage = lazy(() => import('../pages/quality/QualityDashboard'));

// Admin Pages
const UsersPage = lazy(() => import('../pages/admin/Users'));
const RolesPage = lazy(() => import('../pages/admin/Roles'));
const MultiPlantPage = lazy(() => import('../pages/admin/MultiPlant'));
const WorkflowPage = lazy(() => import('../pages/admin/Workflow'));
const DatabasePage = lazy(() => import('../pages/admin/Database'));
const ReportsPage = lazy(() => import('../pages/admin/Reports'));
const FormBuilderPage = lazy(() => import('../pages/admin/FormBuilder'));
const DropdownsPage = lazy(() => import('../pages/admin/Dropdowns'));
const ModuleFormsPage = lazy(() => import('../pages/admin/ModuleForms'));
const AdminRecordsPage = lazy(() => import('../pages/admin/Records'));
const ChartsPage = lazy(() => import('../pages/admin/Charts'));

// User Pages
const ProfilePage = lazy(() => import('../pages/user/Profile'));
const SettingsPage = lazy(() => import('../pages/user/Settings'));

function LazyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<SectionLoader message="Readying industrial module..." />}>
      {children}
    </Suspense>
  );
}

function AppLayout() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <PublicRoute><LoginPage /></PublicRoute>,
  },
  {
    path: '/register',
    element: <PublicRoute><LoginPage /></PublicRoute>,
  },
  {
    path: '/forgot-password',
    element: <PublicRoute><LoginPage /></PublicRoute>,
  },
  {
    path: '/admin-login',
    element: <AdminLoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <LazyWrapper><Dashboard /></LazyWrapper> },
      { path: 'dashboard', element: <Navigate to="/" replace /> },
      { path: 'quality', element: <LazyWrapper><QualityModules /></LazyWrapper> },
      { path: 'quality/records/:type', element: <LazyWrapper><RecordHubPage /></LazyWrapper> },
      { path: 'quality/records/ncr/:id', element: <LazyWrapper><NCRDetailsPage /></LazyWrapper> },
      { path: 'quality/records/capa/:id', element: <LazyWrapper><CAPADetailsPage /></LazyWrapper> },
      { path: 'quality/records/:type/:id', element: <LazyWrapper><RecordHubPage /></LazyWrapper> },
      { path: 'builder', element: <LazyWrapper><NoCodeBuilder /></LazyWrapper> },
      { path: 'ai', element: <Navigate to="/ai/defect-prediction" replace /> },
      { path: 'ai/defect-prediction', element: <LazyWrapper><AIIntelligence /></LazyWrapper> },
      { path: 'defect-prediction', element: <Navigate to="/ai/defect-prediction" replace /> },
      { path: 'ai-chat', element: <LazyWrapper><AIChatPage /></LazyWrapper> },
      { path: 'digital-twin', element: <LazyWrapper><DigitalTwin /></LazyWrapper> },
      { path: 'production-layout', element: <LazyWrapper><ProductionLayoutEditor /></LazyWrapper> },
      { path: 'spc', element: <LazyWrapper><SPCSystem /></LazyWrapper> },
      { path: 'iot', element: <LazyWrapper><IoTIntegration /></LazyWrapper> },
      { path: 'executive', element: <LazyWrapper><ExecutiveMode /></LazyWrapper> },
      
      {
        path: 'admin',
        element: <ProtectedRoute requiredPermissions={['admin.access']}><LazyWrapper><AdminPanel /></LazyWrapper></ProtectedRoute>,
        children: [
          { index: true, element: <Navigate to="users" replace /> },
          { path: 'users', element: <LazyWrapper><UsersPage /></LazyWrapper> },
          { path: 'roles', element: <LazyWrapper><RolesPage /></LazyWrapper> },
          { path: 'plants', element: <LazyWrapper><MultiPlantPage /></LazyWrapper> },
          { path: 'workflow', element: <LazyWrapper><WorkflowPage /></LazyWrapper> },
          { path: 'forms', element: <LazyWrapper><FormBuilderPage /></LazyWrapper> },
          { path: 'module-forms', element: <LazyWrapper><ModuleFormsPage /></LazyWrapper> },
          { path: 'dropdowns', element: <LazyWrapper><DropdownsPage /></LazyWrapper> },
          { path: 'records', element: <LazyWrapper><AdminRecordsPage /></LazyWrapper> },
          { path: 'charts', element: <LazyWrapper><ChartsPage /></LazyWrapper> },
          { path: 'database', element: <LazyWrapper><DatabasePage /></LazyWrapper> },
          { path: 'reports', element: <LazyWrapper><ReportsPage /></LazyWrapper> },
        ]
      },
      
      { path: 'profile', element: <LazyWrapper><ProfilePage /></LazyWrapper> },
      { path: 'settings', element: <LazyWrapper><SettingsPage /></LazyWrapper> },
      
      // Quality Sub Routes
      { path: 'ncr', element: <LazyWrapper><NCRPage /></LazyWrapper> },
      { path: 'ncr/:id', element: <LazyWrapper><NCRDetailsPage /></LazyWrapper> },
      { path: 'capa', element: <LazyWrapper><CAPAPage /></LazyWrapper> },
      { path: 'capa/:id', element: <LazyWrapper><CAPADetailsPage /></LazyWrapper> },
      { path: '8d', element: <LazyWrapper><D8Page /></LazyWrapper> },
      { path: '8d/:id', element: <LazyWrapper><D8Page /></LazyWrapper> },
      { path: 'deviation', element: <LazyWrapper><DeviationPage /></LazyWrapper> },
      { path: 'deviation/:id', element: <LazyWrapper><DeviationPage /></LazyWrapper> },
      { path: 'change-control', element: <LazyWrapper><ChangeControlPage /></LazyWrapper> },
      { path: 'change-control/:id', element: <LazyWrapper><ChangeControlPage /></LazyWrapper> },
      { path: 'complaints', element: <LazyWrapper><ComplaintsPage /></LazyWrapper> },
      { path: 'complaints/:id', element: <LazyWrapper><ComplaintsPage /></LazyWrapper> },
      { path: 'complaints-dashboard', element: <LazyWrapper><ComplaintsDashboardPage /></LazyWrapper> },
      { path: 'defect-cost', element: <LazyWrapper><DefectCostPage /></LazyWrapper> },
      { path: 'quality-home', element: <LazyWrapper><QualityHomePage /></LazyWrapper> },
      { path: 'defect-log', element: <LazyWrapper><DailyDefectsPage /></LazyWrapper> },
      { path: 'quality-shopfloor', element: <LazyWrapper><ShopfloorDefectEntryPage /></LazyWrapper> },
      { path: 'quality-inspection-plans', element: <LazyWrapper><QualityInspectionPlansPage /></LazyWrapper> },
      { path: 'quality-execution-board', element: <LazyWrapper><QualityExecutionBoardPage /></LazyWrapper> },
      { path: 'quality-audits', element: <LazyWrapper><QualityLayeredAuditsPage /></LazyWrapper> },
      { path: 'quality-master-data', element: <LazyWrapper><QualityMasterDataPage /></LazyWrapper> },
      { path: 'quality-command-center', element: <LazyWrapper><QualityCommandCenterPage /></LazyWrapper> },
      { path: 'quality-knowledge-base', element: <LazyWrapper><QualityKnowledgeBasePage /></LazyWrapper> },
      { path: 'quality-search', element: <LazyWrapper><QualitySearchPage /></LazyWrapper> },
      { path: 'quality-form-designer', element: <LazyWrapper><QualityFormDesignerPage /></LazyWrapper> },
      { path: 'process-ppm', element: <LazyWrapper><ProcessPPMPage /></LazyWrapper> },
      { path: 'outgoing-quality', element: <LazyWrapper><OutgoingQualityPage /></LazyWrapper> },
      { path: 'quality-intelligence', element: <LazyWrapper><QualityIntelligencePage /></LazyWrapper> },
      { path: 'quality-library', element: <LazyWrapper><QualityLibraryPage /></LazyWrapper> },
      { path: 'quality-slides', element: <LazyWrapper><QualitySlidesPage /></LazyWrapper> },
      { path: 'quality-dashboard', element: <LazyWrapper><QualityDashboardPage /></LazyWrapper> },

      // Compatibility aliases for older deep links used inside existing pages
      { path: 'quality/ncr', element: <Navigate to="/quality/records/ncr" replace /> },
      { path: 'quality/ncr/:id', element: <LazyWrapper><NCRDetailsPage /></LazyWrapper> },
      { path: 'quality/capa', element: <Navigate to="/quality/records/capa" replace /> },
      { path: 'quality/capa/:id', element: <LazyWrapper><CAPADetailsPage /></LazyWrapper> },
      { path: 'quality/8d', element: <Navigate to="/quality/records/8d" replace /> },
      { path: 'quality/8d/:id', element: <LazyWrapper><D8Page /></LazyWrapper> },
      { path: 'quality/deviations', element: <Navigate to="/deviation" replace /> },
      { path: 'quality/deviations/:id', element: <LazyWrapper><DeviationPage /></LazyWrapper> },
      { path: 'quality/deviation', element: <Navigate to="/deviation" replace /> },
      { path: 'quality/deviation/:id', element: <LazyWrapper><DeviationPage /></LazyWrapper> },
      { path: 'quality/change-control', element: <Navigate to="/change-control" replace /> },
      { path: 'quality/change-control/:id', element: <LazyWrapper><ChangeControlPage /></LazyWrapper> },
      { path: 'quality/complaints', element: <Navigate to="/complaints" replace /> },
      { path: 'quality/complaints/:id', element: <LazyWrapper><ComplaintsPage /></LazyWrapper> },
      { path: 'quality/complaint', element: <Navigate to="/complaints" replace /> },
      { path: 'quality/complaint/:id', element: <LazyWrapper><ComplaintsPage /></LazyWrapper> },
      { path: 'quality/fmea', element: <Navigate to="/fmea" replace /> },
      { path: 'quality/fmea/:id', element: <LazyWrapper><FMEADetailsPage /></LazyWrapper> },
      { path: 'quality/control-plans', element: <Navigate to="/control-plan" replace /> },
      { path: 'quality/control-plans/:id', element: <LazyWrapper><ControlPlanDetailsPage /></LazyWrapper> },
      { path: 'quality/control-plan', element: <Navigate to="/control-plan" replace /> },
      { path: 'quality/control-plan/:id', element: <LazyWrapper><ControlPlanDetailsPage /></LazyWrapper> },
      { path: 'quality/suppliers', element: <Navigate to="/supplier-quality" replace /> },
      { path: 'quality/suppliers/:id', element: <LazyWrapper><SupplierDetailsPage /></LazyWrapper> },
      { path: 'records/suppliers', element: <Navigate to="/supplier-quality" replace /> },
      { path: 'quality/inspections', element: <Navigate to="/inspection" replace /> },
      { path: 'quality/inspections/:id', element: <LazyWrapper><InspectionPage /></LazyWrapper> },
      { path: 'quality/inspection', element: <Navigate to="/inspection" replace /> },
      { path: 'quality/inspection/:id', element: <LazyWrapper><InspectionPage /></LazyWrapper> },
      { path: 'quality/calibrations', element: <Navigate to="/calibration" replace /> },
      { path: 'quality/calibrations/:id', element: <LazyWrapper><CalibrationPage /></LazyWrapper> },
      { path: 'quality/calibration', element: <Navigate to="/calibration" replace /> },
      { path: 'quality/calibration/:id', element: <LazyWrapper><CalibrationPage /></LazyWrapper> },
      { path: 'quality/audits', element: <Navigate to="/compliance/hub/audit" replace /> },
      { path: 'quality/audits/:id', element: <LazyWrapper><AuditDetailsPage /></LazyWrapper> },
      { path: 'quality/audit', element: <Navigate to="/compliance/hub/audit" replace /> },
      { path: 'quality/audit/:id', element: <LazyWrapper><AuditDetailsPage /></LazyWrapper> },
      { path: 'quality/defect-logs', element: <Navigate to="/defect-log" replace /> },
      { path: 'quality/defect-logs/:id', element: <LazyWrapper><DailyDefectsPage /></LazyWrapper> },
      { path: 'quality/defect-log', element: <Navigate to="/defect-log" replace /> },
      { path: 'quality/defect-log/:id', element: <LazyWrapper><DailyDefectsPage /></LazyWrapper> },
      { path: 'quality/workspace', element: <Navigate to="/quality-home" replace /> },
      { path: 'quality/mobile-defect-entry', element: <Navigate to="/quality-shopfloor" replace /> },
      { path: 'quality/inspection-plans', element: <Navigate to="/quality-inspection-plans" replace /> },
      { path: 'quality/execution-board', element: <Navigate to="/quality-execution-board" replace /> },
      { path: 'quality/layered-audits', element: <Navigate to="/quality-audits" replace /> },
      { path: 'quality/master-data', element: <Navigate to="/quality-master-data" replace /> },
      { path: 'quality/master-data/:table', element: <LazyWrapper><QualityMasterDataPage /></LazyWrapper> },
      { path: 'quality/command-center', element: <Navigate to="/quality-command-center" replace /> },
      { path: 'quality/knowledge-base', element: <Navigate to="/quality-knowledge-base" replace /> },
      { path: 'quality/intelligence-search', element: <Navigate to="/quality-search" replace /> },
      { path: 'quality/form-designer', element: <Navigate to="/quality-form-designer" replace /> },
      { path: 'quality/production-layout', element: <Navigate to="/production-layout" replace /> },
      { path: 'quality/production-layout/:id', element: <LazyWrapper><ProductionLayoutEditor /></LazyWrapper> },
      { path: 'audit', element: <LazyWrapper><AuditPage /></LazyWrapper> },
      { path: 'audit/:id', element: <LazyWrapper><AuditPage /></LazyWrapper> },
      { path: 'inspection', element: <LazyWrapper><InspectionPage /></LazyWrapper> },
      { path: 'inspection/:id', element: <LazyWrapper><InspectionPage /></LazyWrapper> },
      { path: 'calibration', element: <LazyWrapper><CalibrationPage /></LazyWrapper> },
      { path: 'calibration/:id', element: <LazyWrapper><CalibrationPage /></LazyWrapper> },
      { path: 'fmea', element: <LazyWrapper><FMEAPage /></LazyWrapper> },
      { path: 'fmea/:id', element: <LazyWrapper><FMEADetailsPage /></LazyWrapper> },
      { path: 'control-plan', element: <LazyWrapper><ControlPlanPage /></LazyWrapper> },
      { path: 'control-plan/:id', element: <LazyWrapper><ControlPlanDetailsPage /></LazyWrapper> },
      { path: 'supplier-quality', element: <LazyWrapper><SupplierQualityPage /></LazyWrapper> },
      { path: 'supplier-quality/:id', element: <LazyWrapper><SupplierDetailsPage /></LazyWrapper> },
      { path: 'compliance/hub', element: <Navigate to="/compliance/hub/audit" replace /> },
      { path: 'compliance/hub/:type', element: <LazyWrapper><ComplianceHubPage /></LazyWrapper> },
      { path: 'compliance/hub/audit/:id', element: <LazyWrapper><AuditDetailsPage /></LazyWrapper> },
      { path: 'compliance/hub/audit/:id/report', element: <LazyWrapper><AuditReportPage /></LazyWrapper> },
      { path: 'compliance/hub/inspection/:id', element: <LazyWrapper><InspectionPage /></LazyWrapper> },
      { path: 'compliance/hub/calibration/:id', element: <LazyWrapper><CalibrationPage /></LazyWrapper> },
      { path: 'quality/hub', element: <Navigate to="/quality/hub/audit" replace /> },
      { path: 'quality/hub/:type', element: <LazyWrapper><ComplianceHubPage /></LazyWrapper> },
      { path: 'quality/hub/audit/:id', element: <LazyWrapper><AuditDetailsPage /></LazyWrapper> },
      { path: 'quality/hub/audit/:id/report', element: <LazyWrapper><AuditReportPage /></LazyWrapper> },
      { path: 'quality/hub/inspection/:id', element: <LazyWrapper><InspectionPage /></LazyWrapper> },
      { path: 'quality/hub/calibration/:id', element: <LazyWrapper><CalibrationPage /></LazyWrapper> },
      
      { path: 'system', element: <Navigate to="/admin" replace /> },
      { path: 'system-tools', element: <Navigate to="/admin" replace /> },
      
      { path: '*', element: <div className="text-white p-20 text-center font-black">404 | NOT FOUND</div> }
    ]
  }
];

export const router = createBrowserRouter(routes);
export default router;
