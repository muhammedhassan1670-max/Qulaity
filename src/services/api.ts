// QMS Enterprise 4.0 - API Service Layer
// This layer can connect to real backend or use simulated responses

import { toast } from 'sonner';

const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/api\/v\d+$/i, '/api');
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// Token management
const getToken = () => localStorage.getItem('qms_access_token');
const setToken = (token: string) => localStorage.setItem('qms_access_token', token);
const removeToken = () => localStorage.removeItem('qms_access_token');
const getRefreshToken = () => localStorage.getItem('qms_refresh_token');
const setRefreshToken = (token: string) => localStorage.setItem('qms_refresh_token', token);

const redirectToLoginOnce = () => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/login') return;

  const key = 'qms_redirecting_to_login';
  const last = Number(sessionStorage.getItem(key) || '0');
  const now = Date.now();
  // Allow re-redirect if the user stayed on the page for a while.
  if (last && now - last < 2000) return;
  sessionStorage.setItem(key, String(now));

  // Clear persisted user state so ProtectedRoute will redirect after reload.
  localStorage.removeItem('qms-enterprise-storage');

  window.location.replace('/login');
};

// Request interceptor
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const tenantId = localStorage.getItem('qms_tenant_id');
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the request
        return fetchWithAuth(url, options);
      } else {
        // Logout user
        removeToken();
        redirectToLoginOnce();
        throw new Error('Session expired');
      }
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Refresh token
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      setToken(data.data.accessToken);
      setRefreshToken(data.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// Mock data for development
const mockData = {
  dashboard: {
    kpi: {
      openNCRs: 0,
      activeCAPAs: 0,
      oee: 0,
      qualityScore: 0,
      ncrChange: 0,
      capaChange: 0,
      oeeChange: 0,
      qualityChange: 0,
    },
    qualityTrend: [] as any[],
    defectDistribution: [] as any[],
    plantPerformance: [] as any[],
    recentActivity: [] as any[],
    alerts: [] as any[],
  },
  ncr: [] as any[],
  capa: [] as any[],
  eightD: [] as any[],
  fmea: [] as any[],
  audits: [] as any[],
  iotDevices: [] as any[],
  spc: [] as any[],
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const localAuthUsers = [
  { email: 'admin@qms.com', password: 'admin123', name: 'System Administrator', role: 'admin' },
];

function buildLocalLoginResponse(email: string, password: string, tenantCode?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = localAuthUsers.find((item) => item.email === normalizedEmail && item.password === password);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const localToken = 'local_jwt_token_' + Date.now();
  const localRefreshToken = 'local_refresh_token_' + Date.now();

  setToken(localToken);
  setRefreshToken(localRefreshToken);
  localStorage.setItem('qms_tenant_id', 'local-tenant-id');

  return {
    success: true,
    data: {
      user: {
        id: '1',
        email: user.email,
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ').slice(1).join(' '),
        tenant: { id: 'local-tenant-id', name: 'QMS Enterprise', code: tenantCode || 'QMS' },
        roles: [user.role],
        permissions: ['dashboard.view', 'quality.manage', 'builder.use', 'ai.access', 'digital-twin.view', 'spc.analyze', 'iot.manage', 'executive.view', 'admin.access'],
      },
      tokens: {
        accessToken: localToken,
        refreshToken: localRefreshToken,
        expiresIn: '15m',
      },
    },
  };
}

// Auth API
export const authApi = {
  login: async (email: string, password: string, tenantCode?: string) => {
    if (USE_MOCK_API) {
      await delay(800);
      return buildLocalLoginResponse(email, password, tenantCode);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, tenantCode }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.data.tokens.accessToken);
        setRefreshToken(data.data.tokens.refreshToken);
        sessionStorage.removeItem('qms_redirecting_to_login');
        const tenantId = data?.data?.user?.tenant?.id;
        if (tenantId) {
          localStorage.setItem('qms_tenant_id', tenantId);
        }
      }

      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Backend auth unavailable. Falling back to local offline login.');
        return buildLocalLoginResponse(email, password, tenantCode);
      }
      throw error;
    }
  },

  register: async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantCode?: string;
    tenantId?: string;
    plantId?: string;
    phone?: string;
  }) => {
    if (USE_MOCK_API) {
      await delay(800);
      return {
        success: true,
        message: 'Registered locally',
        data: {
          id: `local-user-${Date.now()}`,
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
        },
      };
    }

    const defaultCode = import.meta.env.VITE_DEFAULT_TENANT_CODE || 'QMS';

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        firstName: payload.firstName,
        lastName: payload.lastName,
        tenantCode: payload.tenantCode || defaultCode,
        tenantId: payload.tenantId,
        plantId: payload.plantId || undefined,
        phone: payload.phone,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },
  
  logout: async () => {
    if (USE_MOCK_API) {
      await delay(300);
      removeToken();
      localStorage.removeItem('qms_refresh_token');
      localStorage.removeItem('qms_tenant_id');
      return { success: true };
    }
    
    try {
      await fetchWithAuth('/auth/logout', { method: 'POST' });
    } finally {
      removeToken();
      localStorage.removeItem('qms_refresh_token');
      localStorage.removeItem('qms_tenant_id');
    }
  },
  
  getCurrentUser: async () => {
    if (USE_MOCK_API) {
      await delay(500);
      const token = getToken();
      if (!token) throw new Error('Not authenticated');
      
      return {
        success: true,
        data: {
          id: '1',
          email: 'admin@qms.com',
          firstName: 'System',
          lastName: 'Administrator',
          fullName: 'System Administrator',
          tenant: { id: 'local-tenant-id', name: 'QMS Enterprise', code: 'QMS' },
          plant: { id: 'plant-main-id', name: 'Main Plant', code: 'PLANT-01' },
          roles: ['admin'],
          permissions: ['dashboard.view', 'quality.manage', 'builder.use', 'ai.access', 'digital-twin.view', 'spc.analyze', 'iot.manage', 'executive.view', 'admin.access'],
        },
      };
    }
    
    return fetchWithAuth('/auth/me');
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    if (USE_MOCK_API) {
      await delay(600);
      return { success: true, message: 'Password changed successfully' };
    }
    
    return fetchWithAuth('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Dashboard API
export const dashboardApi = {
  getKPIs: async () => fetchWithAuth('/dashboard/kpi'),
  getQualityTrend: async () => fetchWithAuth('/dashboard/quality-trend'),
  getDefectDistribution: async () => fetchWithAuth('/dashboard/defect-distribution'),
  getPlantPerformance: async () => fetchWithAuth('/dashboard/plant-performance'),
  getRecentActivity: async () => fetchWithAuth('/dashboard/recent-activities'),
  getAlerts: async () => fetchWithAuth('/dashboard/alerts'),
  
  getAllData: async () => {
    if (USE_MOCK_API) {
      await delay(800);
      return {
        success: true,
        data: mockData.dashboard,
      };
    }
    const [kpi, qualityTrend, defectDistribution, plantPerformance, recentActivity, alerts] = await Promise.all([
      fetchWithAuth('/dashboard/kpi'),
      fetchWithAuth('/dashboard/quality-trend'),
      fetchWithAuth('/dashboard/defect-distribution'),
      fetchWithAuth('/dashboard/plant-performance'),
      fetchWithAuth('/dashboard/recent-activities'),
      fetchWithAuth('/dashboard/alerts'),
    ]);

    return {
      success: true,
      data: {
        kpi: kpi?.data ?? kpi,
        ncrTrend: qualityTrend?.data ?? [],
        spcDefects: defectDistribution?.data ?? [],
        auditScores: plantPerformance?.data ?? [],
        approvalBottlenecks: recentActivity?.data ?? [],
        alerts: alerts?.data ?? [],
      },
    };
  },
};

// NCR API
export const ncrApi = {
  getAll: async (filters?: Record<string, string>) => {
    if (USE_MOCK_API) {
      await delay(600);
      let data = [...mockData.ncr];
      if (filters?.status) {
        data = data.filter(n => 
          String(n.status || '').toLowerCase() === String(filters.status || '').toLowerCase()
        );
      }
      return { success: true, data, total: data.length };
    }
    const queryString = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return fetchWithAuth(`/ncr${queryString}`);
  },
  
  getById: async (id: string) => {
    if (USE_MOCK_API) {
      await delay(400);
      const ncr = mockData.ncr.find(n => n.id === id);
      if (!ncr) throw new Error('NCR not found');
      return { success: true, data: ncr };
    }
    return fetchWithAuth(`/ncr/${id}`);
  },
  
  create: async (data: Record<string, unknown>) => {
    if (USE_MOCK_API) {
      await delay(700);
      const newNCR = {
        id: String(Date.now()),
        ncrNumber: `NCR-${new Date().getFullYear()}-${String(mockData.ncr.length + 1).padStart(4, '0')}`,
        ...data,
        status: 'Open',
        reportedBy: 'System Administrator',
        detectedDate: new Date().toISOString().split('T')[0],
      };
      mockData.ncr.unshift(newNCR as typeof mockData.ncr[0]);
      toast.success('NCR created successfully');
      return { success: true, data: newNCR };
    }
    const result = await fetchWithAuth('/ncr', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('NCR created successfully');
    return result;
  },
  
  update: async (id: string, data: Record<string, unknown>) => {
    if (USE_MOCK_API) {
      await delay(500);
      const index = mockData.ncr.findIndex(n => n.id === id);
      if (index === -1) throw new Error('NCR not found');
      mockData.ncr[index] = { ...mockData.ncr[index], ...data };
      toast.success('NCR updated successfully');
      return { success: true, data: mockData.ncr[index] };
    }
    const result = await fetchWithAuth(`/ncr/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    toast.success('NCR updated successfully');
    return result;
  },
  
  delete: async (id: string) => {
    if (USE_MOCK_API) {
      await delay(400);
      mockData.ncr = mockData.ncr.filter(n => n.id !== id);
      toast.success('NCR deleted successfully');
      return { success: true };
    }
    const result = await fetchWithAuth(`/ncr/${id}`, { method: 'DELETE' });
    toast.success('NCR deleted successfully');
    return result;
  },
  
  changeStatus: async (id: string, status: string) => {
    if (USE_MOCK_API) {
      await delay(400);
      const index = mockData.ncr.findIndex(n => n.id === id);
      if (index === -1) throw new Error('NCR not found');
      mockData.ncr[index].status = status;
      toast.success(`Status changed to ${status}`);
      return { success: true, data: mockData.ncr[index] };
    }
    const result = await fetchWithAuth(`/ncr/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    toast.success(`Status changed to ${status}`);
    return result;
  },
};

// CAPA API
export const capaApi = {
  getAll: async (filters?: Record<string, string>) => {
    if (USE_MOCK_API) {
      await delay(600);
      let data = [...mockData.capa];
      if (filters?.status) {
        data = data.filter(c => 
          String(c.status || '').toLowerCase() === String(filters.status || '').toLowerCase()
        );
      }
      return { success: true, data, total: data.length };
    }
    const queryString = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return fetchWithAuth(`/capa${queryString}`);
  },
  
  getById: async (id: string) => {
    if (USE_MOCK_API) {
      await delay(400);
      const capa = mockData.capa.find(c => c.id === id);
      if (!capa) throw new Error('CAPA not found');
      return { success: true, data: capa };
    }
    return fetchWithAuth(`/capa/${id}`);
  },
  
  create: async (data: Record<string, unknown>) => {
    if (USE_MOCK_API) {
      await delay(700);
      const newCAPA = {
        id: String(Date.now()),
        capaNumber: `CAPA-${new Date().getFullYear()}-${String(mockData.capa.length + 1).padStart(4, '0')}`,
        ...data,
        status: 'Open',
      };
      mockData.capa.unshift(newCAPA as typeof mockData.capa[0]);
      toast.success('CAPA created successfully');
      return { success: true, data: newCAPA };
    }
    const result = await fetchWithAuth('/capa', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('CAPA created successfully');
    return result;
  },
  
  update: async (id: string, data: Record<string, unknown>) => {
    if (USE_MOCK_API) {
      await delay(500);
      const index = mockData.capa.findIndex(c => c.id === id);
      if (index === -1) throw new Error('CAPA not found');
      mockData.capa[index] = { ...mockData.capa[index], ...data };
      toast.success('CAPA updated successfully');
      return { success: true, data: mockData.capa[index] };
    }
    const result = await fetchWithAuth(`/capa/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    toast.success('CAPA updated successfully');
    return result;
  },
  
  verify: async (id: string, effectiveness: string, notes: string) => {
    if (USE_MOCK_API) {
      await delay(500);
      const index = mockData.capa.findIndex(c => c.id === id);
      if (index === -1) throw new Error('CAPA not found');
      mockData.capa[index].status = 'Closed';
      mockData.capa[index].effectiveness = parseInt(effectiveness) || 0;
      toast.success('CAPA verified successfully');
      return { success: true, data: mockData.capa[index] };
    }
    const result = await fetchWithAuth(`/capa/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ effectiveness, notes }),
    });
    toast.success('CAPA verified successfully');
    return result;
  },
};

// 8D API
export const eightDApi = {
  getAll: async () => {
    if (USE_MOCK_API) {
      await delay(500);
      return { success: true, data: mockData.eightD, total: mockData.eightD.length };
    }
    return fetchWithAuth('/eight-d');
  },
  
  getById: async (id: string) => {
    if (USE_MOCK_API) {
      await delay(400);
      const eightD = mockData.eightD.find(e => e.id === id);
      if (!eightD) throw new Error('8D not found');
      return { success: true, data: eightD };
    }
    return fetchWithAuth(`/eight-d/${id}`);
  },
  
  create: async (data: Record<string, unknown>) => {
    if (USE_MOCK_API) {
      await delay(700);
      const new8D = {
        id: String(Date.now()),
        dNumber: `8D-${new Date().getFullYear()}-${String(mockData.eightD.length + 1).padStart(4, '0')}`,
        ...data,
        currentStep: 1,
        status: 'In Progress',
        createdDate: new Date().toISOString().split('T')[0],
      };
      mockData.eightD.unshift(new8D as typeof mockData.eightD[0]);
      toast.success('8D Report created successfully');
      return { success: true, data: new8D };
    }
    const result = await fetchWithAuth('/eight-d', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('8D Report created successfully');
    return result;
  },
  
  updateStep: async (id: string, step: number, data: Record<string, unknown>) => {
    if (USE_MOCK_API) {
      await delay(500);
      const index = mockData.eightD.findIndex(e => e.id === id);
      if (index === -1) throw new Error('8D not found');
      mockData.eightD[index] = { ...mockData.eightD[index], ...data, currentStep: step };
      toast.success(`Step ${step} updated successfully`);
      return { success: true, data: mockData.eightD[index] };
    }
    const result = await fetchWithAuth(`/eight-d/${id}/step/${step}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    toast.success(`Step ${step} updated successfully`);
    return result;
  },
};

// FMEA API
export const fmeaApi = {
  getAll: async () => {
    if (USE_MOCK_API) {
      await delay(500);
      return { success: true, data: mockData.fmea, total: mockData.fmea.length };
    }
    return fetchWithAuth('/fmea');
  },
  
  getById: async (id: string) => {
    if (USE_MOCK_API) {
      await delay(400);
      const fmea = mockData.fmea.find(f => f.id === id);
      if (!fmea) throw new Error('FMEA not found');
      return { success: true, data: fmea };
    }
    return fetchWithAuth(`/fmea/${id}`);
  },
  
  create: async (data: Record<string, unknown>) => {
    if (USE_MOCK_API) {
      await delay(700);
      const newFMEA = {
        id: String(Date.now()),
        fmeaNumber: `FMEA-${new Date().getFullYear()}-${String(mockData.fmea.length + 1).padStart(3, '0')}`,
        ...data,
        revision: 1,
        status: 'Active',
      };
      mockData.fmea.unshift(newFMEA as typeof mockData.fmea[0]);
      toast.success('FMEA created successfully');
      return { success: true, data: newFMEA };
    }
    const result = await fetchWithAuth('/fmea', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('FMEA created successfully');
    return result;
  },
};

// Audit API
export const auditApi = {
  getAll: async () => {
    if (USE_MOCK_API) {
      await delay(500);
      return { success: true, data: mockData.audits, total: mockData.audits.length };
    }
    return fetchWithAuth('/audit');
  },
  
  getById: async (id: string) => {
    if (USE_MOCK_API) {
      await delay(400);
      const audit = mockData.audits.find(a => a.id === id);
      if (!audit) throw new Error('Audit not found');
      return { success: true, data: audit };
    }
    return fetchWithAuth(`/audit/${id}`);
  },
  
  create: async (data: Record<string, unknown>) => {
    if (USE_MOCK_API) {
      await delay(700);
      const newAudit = {
        id: String(Date.now()),
        auditNumber: `AUD-${new Date().getFullYear()}-${String(mockData.audits.length + 1).padStart(4, '0')}`,
        ...data,
        status: 'Scheduled',
      };
      mockData.audits.unshift(newAudit as typeof mockData.audits[0]);
      toast.success('Audit scheduled successfully');
      return { success: true, data: newAudit };
    }
    const result = await fetchWithAuth('/audit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('Audit scheduled successfully');
    return result;
  },
};

// IoT API
export const iotApi = {
  getAll: async () => {
    if (USE_MOCK_API) {
      await delay(500);
      return { success: true, data: mockData.iotDevices, total: mockData.iotDevices.length };
    }
    return fetchWithAuth('/iot/devices');
  },
  
  getById: async (id: string) => {
    if (USE_MOCK_API) {
      await delay(400);
      const device = mockData.iotDevices.find(d => d.id === id);
      if (!device) throw new Error('Device not found');
      return { success: true, data: device };
    }
    return fetchWithAuth(`/iot/devices/${id}`);
  },
  
  getReadings: async (deviceId: string, hours = 24) => {
    if (USE_MOCK_API) {
      await delay(600);
      return { success: true, data: [] };
    }
    return fetchWithAuth(`/iot/devices/${deviceId}/readings?hours=${hours}`);
  },
  
  updateThresholds: async (id: string, thresholds: Record<string, number>) => {
    if (USE_MOCK_API) {
      await delay(500);
      const index = mockData.iotDevices.findIndex(d => d.id === id);
      if (index === -1) throw new Error('Device not found');
      toast.success('Thresholds updated successfully');
      return { success: true };
    }
    const result = await fetchWithAuth(`/iot/devices/${id}/thresholds`, {
      method: 'PUT',
      body: JSON.stringify(thresholds),
    });
    toast.success('Thresholds updated successfully');
    return result;
  },
};

// SPC API
export const spcApi = {
  getAllCharts: async () => {
    const result = await fetchWithAuth('/spc');
    return result?.data ?? result;
  },
  
  createCharacteristic: async (data: any) => {
    const result = await fetchWithAuth('/spc', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('Characteristic created successfully');
    return result;
  },

  getCharacteristic: async (id: string) => fetchWithAuth(`/spc/${id}`),

  addDataPoint: async (data: any) => {
    const result = await fetchWithAuth('/spc/data-points', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('Data point recorded');
    return result;
  },

  getDataPointsByChar: async (charId: string, limit = 50) => 
    fetchWithAuth(`/spc/${charId}/data-points?limit=${limit}`),

  // Legacy / Mocks
  getAll: async () => {
    if (USE_MOCK_API) {
      await delay(500);
      return { success: true, data: mockData.spc, total: mockData.spc.length };
    }
    return fetchWithAuth('/spc');
  },
  
  getById: async (id: string) => {
    if (USE_MOCK_API) {
      await delay(400);
      const spc = mockData.spc.find(s => s.id === id);
      if (!spc) throw new Error('SPC record not found');
      return { success: true, data: spc };
    }
    return fetchWithAuth(`/spc/${id}`);
  },
  
  getDataPoints: async (id: string) => {
    if (USE_MOCK_API) {
      await delay(600);
      return { success: true, data: [] };
    }
    return fetchWithAuth(`/spc/${id}/data-points`);
  },
  
  create: async (data: Record<string, unknown>) => {
    if (USE_MOCK_API) {
      await delay(700);
      const newSPC = {
        id: String(Date.now()),
        ...data,
        status: 'Active',
      };
      mockData.spc.unshift(newSPC as typeof mockData.spc[0]);
      toast.success('SPC chart created successfully');
      return { success: true, data: newSPC };
    }
    const result = await fetchWithAuth('/spc', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('SPC chart created successfully');
    return result;
  },
};

// Export all APIs
export default {
  auth: authApi,
  dashboard: dashboardApi,
  ncr: ncrApi,
  capa: capaApi,
  eightD: eightDApi,
  fmea: fmeaApi,
  audit: auditApi,
  iot: iotApi,
  spc: spcApi,
};
