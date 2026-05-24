const CLEANUP_MARKER_KEY = 'qms-demo-data-cleanup-v2';
const LOCAL_RECORD_PREFIX = 'qms_local_';

const DEMO_USER_EMAILS = new Set([
  'ahmed.rashid@qms-enterprise.com',
  'sarah.johnson@qms-enterprise.com',
  'mohammed.khan@qms-enterprise.com',
  'manager@qms.com',
  'operator@qms.com',
]);

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function cleanConfigStore() {
  const key = 'qms-config-store';
  const persisted = safeParse<{ state?: Record<string, any>; version?: number }>(localStorage.getItem(key));
  if (!persisted?.state) return;

  persisted.state.optionSets = [];
  persisted.state.workflows = [];
  persisted.state.kpis = [];
  persisted.state.plants = [];
  persisted.state.currentPlantId = null;

  if (persisted.state.chartSettings?.spc) {
    persisted.state.chartSettings.spc.characteristics = [];
  }

  localStorage.setItem(key, JSON.stringify(persisted));
}

function cleanDemoAuthState() {
  const appKey = 'qms-enterprise-storage';
  const appState = safeParse<{ state?: Record<string, any>; version?: number }>(localStorage.getItem(appKey));
  const appEmail = String(appState?.state?.user?.email || '').toLowerCase();
  if (appState?.state?.user && DEMO_USER_EMAILS.has(appEmail)) {
    appState.state.user = null;
    localStorage.setItem(appKey, JSON.stringify(appState));
  }

  const authKey = 'qms-auth-storage';
  const authState = safeParse<{ state?: Record<string, any>; version?: number }>(localStorage.getItem(authKey));
  const authEmail = String(authState?.state?.user?.email || '').toLowerCase();
  if (authState?.state?.user && DEMO_USER_EMAILS.has(authEmail)) {
    authState.state.user = null;
    authState.state.tokens = null;
    authState.state.isAuthenticated = false;
    localStorage.setItem(authKey, JSON.stringify(authState));
  }

  const accessToken = localStorage.getItem('qms_access_token') || '';
  const tenantId = localStorage.getItem('qms_tenant_id') || '';
  if (accessToken.startsWith('mock_') || tenantId === 'demo-tenant-id') {
    localStorage.removeItem('qms_access_token');
    localStorage.removeItem('qms_refresh_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('qms_tenant_id');
  }
}

export function cleanupDemoData() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(CLEANUP_MARKER_KEY) === 'done') return;

  Object.keys(localStorage)
    .filter((key) => key.startsWith(LOCAL_RECORD_PREFIX))
    .forEach((key) => localStorage.removeItem(key));

  localStorage.removeItem('qms_dashboard_layout');
  cleanConfigStore();
  cleanDemoAuthState();

  localStorage.setItem(CLEANUP_MARKER_KEY, 'done');
}
